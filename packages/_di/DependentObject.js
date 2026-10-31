// noinspection JSUnresolvedReference

(function exposeModule()
{
    /**
     * Import the core ToolBocks classes and functions.
     * These are general-purpose constants and utilities
     * for inspecting types, manipulating strings, arrays, and objects.
     *
     * Additionally, the core library provides internationalization/localization (i18n, l10n),
     * number parsing, and an event-based error-handling mechanism.
     *
     * For source code and documentation, navigate to:
     * https://github.com/bockelman-scott/bocktils/tree/master/packages/core
     *
     */
    const toolbocks = require( "@toolbocks/core" );

    const jsonUtils = require( "@toolbocks/json" );

    const logUtils = require( "@toolbocks/logging" );

    const dependencyConstants = require( "./DependencyConstant.js" );
    const dependencyErrors = require( "./DependencyErrors.js" );
    const dependencyFunctions = require( "./DependencyFunctions.js" );
    const dependencyModule = require( "./Dependency.js" );
    const dependencyDescriptor = require( "./DependencyDescriptor.js" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, guidUtils } = toolbocks;

    const
        {
            ToolBocksModule,
            ModuleEvent,
            IllegalArgumentError,
            ObjectEntry,
            ObjectRegistry,
            OBJECT_REGISTRY = ToolBocksModule.OBJECT_REGISTRY || ObjectRegistry.DEFAULT_INSTANCE,
            ILogger,
            attempt,
            asyncAttempt,
            attemptSilent,
            resolveEvent,
            objectEntries,
            objectValues,
            lock,
            $ln
        } = moduleUtils;

    const { _ud, _mt } = constants;

    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isNonNullValue,
            isArray,
            isCloneable,
            isString,
            isUUID,
            isDate,
            isFunction,
            isClass,
            isUserDefinedClass,
            implementsInterface,
            isSubclassOf,
            getClass,
            getClassName,
            toObjectLiteral,
            getMethods,
            delegateTo
        } = typeUtils;

    const { asString, isBlank, asInt } = stringUtils;

    const { asArray } = arrayUtils;

    const { asJson, asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const { DEP_CONSTS } = dependencyConstants;

    const
        {
            RegistryError,
            DependencyNotFoundError,
            DependencyInitializationError,
            DependencyDisposalError
        } = dependencyErrors;

    const
        {
            DEFAULT_LOGGER,
            isComponent,
            isComponentInitializable,
            isComponentDisposable,
            initializeComponent,
            disposeComponent
        } = dependencyFunctions;

    const { Dependency } = dependencyModule;

    const { DependencyDescriptor } = dependencyDescriptor;

    const simpleLogger = new SimpleLogger( console );

    /**
     * Return a GUID (Globally Unique Identifier) to be used as temporary ID.
     *
     * @returns {string} A randomly generated GUID.
     */
    const generateGuid = () =>
    {
        return guidUtils.uuid();
    };

    // noinspection DuplicatedCode
    /**
     * Represents a collection of dependency objects,
     * providing methods to initialize, dispose, and retrieve dependencies.
     *
     * Encapsulates dependencies in private maps and arrays
     * to manage and access dependencies by ID, name, or class.
     *
     * Classes with dependencies
     * expect an instance of this class
     * to be provided in the constructor.
     *
     * The constructors of classes with dependencies
     * will call the findDependency method of this object
     * for each of its required dependencies.
     */
    class Dependencies
    {
        #mapById = new Map();
        #mapByName = new Map();

        #mapByClass = new WeakMap();

        #dependencies = [];

        #args = [];

        constructor( ...pDependency )
        {
            // check for an instance of Dependencies (this class) in the arguments
            let instance = [...(asArray( pDependency ))].find( e => e instanceof this.constructor );

            // collect the Dependency objects from the arguments
            let arr =
                [
                    ...(asArray( instance?.inventory ?? [] )),
                    ...(asArray( pDependency ))
                ].filter( Dependency.isDependency );

            // collect any other values from the arguments
            let args =
                [
                    ...(asArray( pDependency )),
                    ...(asArray( instance?.args ))
                ].filter( e => !Dependency.isDependency( e ) );

            // add only those dependencies that have not already been added
            if ( $ln( arr ) > 0 )
            {
                for( let dependency of arr )
                {
                    // skip missing values
                    if ( isNull( dependency ) )
                    {
                        continue;
                    }

                    // calculate the Dependency object from each argument
                    // each could be an instance of Dependency
                    // a component to be wrapped in a Dependency
                    // or an object that has to be adapted before it can be wrapped as a Dependency
                    const dep = (dependency instanceof Dependency) ?
                                dependency :
                                (isComponent( dependency ) ?
                                 new Dependency( dependency ) :
                                 new Dependency( new ComponentAdapter( dependency ) )) ?? dependency;

                    // look for an ID
                    const depId = (dep ?? dependency)?.id || dependency?.id;

                    // look for a Name
                    const depName = (dep ?? dependency)?.name || dependency?.name;

                    // if this dependency is already in our collection,
                    // we skip it (@see Dependency.eauals)
                    if ( isNull( (dep ?? dependency) ) ||
                         this.#dependencies.some( e => Dependency.from( (dep ?? dependency), depName, depId ).equals( e ) ) )
                    {
                        continue;
                    }

                    // add the Dependency to our collection
                    this.#dependencies.push( dep ?? dependency );

                    if ( !isNull( depId ) )
                    {
                        if ( !this.#mapById.has( depId ) )
                        {
                            this.#mapById.set( depId, (dep ?? dependency) );
                        }
                    }

                    if ( isString( depName ) && !isBlank( depName ) )
                    {
                        if ( !this.#mapByName.has( depName ) )
                        {
                            this.#mapByName.set( depName, (dep ?? dependency) );
                        }
                    }

                    const compClass = (dep ?? dependency)?.componentClass ?? dependency?.componentClass;
                    const component = (dep ?? dependency)?.component ?? (dependency?.component) ?? (dep ?? dependency);

                    const clazz = compClass ?? getClass( component ?? {} );

                    if ( isClass( clazz ) && !["ComponentAdapter", "Dependency", "Object", "Array", "Function", "Date"].includes( getClassName( clazz ?? {} ) ) )
                    {
                        if ( !this.#mapByClass.has( clazz ) )
                        {
                            attempt( () => this.#mapByClass.set( clazz, (dep ?? dependency) ) );
                        }
                    }
                }
            }

            if ( $ln( args ) > 0 )
            {
                this.#args.push( ...args );
            }

            lock( this );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Returns an array containing the dependency objects held in this instance.
         * Note that we do not return/expose the internal array to preserve encapsulation.
         *
         * @returns {Array.<Dependency>} an array containing the dependency objects held in this instance.
         */
        get inventory()
        {
            return [...(asArray( this.#dependencies ?? [] ))].filter( Dependency.isDependency );
        }

        get args()
        {
            return asArray( this.#args ?? [] );
        }

        get size()
        {
            return asInt( $ln( this.#dependencies ?? [] ), 0 );
        }

        get initialized()
        {
            const dependencies = asArray( this.#dependencies ?? [] ).filter( Dependency.isDependency );

            return (this.size <= 0) || (dependencies.every( e => e?.initialized ));
        }

        /**
         * Initializes all the Dependency objects contained in this instance.
         * Expects the arguments passed to be:
         * the service or script calling the init method,
         * a logger,
         * and then any context-specific arguments
         * @param {...*} [pArgs=null] When specified, will be:
         *                            the service, script, or other object calling this init method,
         *                            a logger,
         *                            and then any context-specific values the receiving init methods are responsible for handling
         *
         * @returns {Promise<Dependencies>} Returns this same instance,
         *                                  now containing initialized dependencies
         *                                  which are now holding initialized components
         */
        async init( ...pArgs )
        {
            if ( this.initialized )
            {
                return this;
            }

            let args = asArray( pArgs ?? this.args ?? [] );

            const failures = [];
            const errors = [];

            const dependencies = asArray( this.#dependencies ?? [] ).filter( Dependency.isDependency ).filter( e => !(e?.initialized) );

            for( let dependency of dependencies )
            {
                if ( isNonNullObject( dependency ) && Dependency.isDependency( dependency ) )
                {
                    if ( !dependency?.initialized )
                    {
                        try
                        {
                            await dependency.init( ...args );

                            if ( !dependency.initialized )
                            {
                                failures.push( dependency );
                            }
                        }
                        catch( ex )
                        {
                            errors.push( ex );

                            if ( !dependency.initialized )
                            {
                                failures.push( dependency );
                            }
                        }
                    }
                }
            }

            if ( this.initialized && (0 === $ln( errors )) )
            {
                return this;
            }

            throw new DependencyInitializationError( `Failed to initialize all dependencies`,
                                                     {
                                                         source: this,
                                                         failures: failures.map( e => e?.id || e?.name || getClassName( e ) ),
                                                         errors: errors.map( asJson )
                                                     } );
        }

        /**
         * Calls the dispose method on any initialized dependencies held in this instance.
         *
         * @returns {Promise<Dependencies>}  Returns this instance, now no longer valid (until re-initialized)
         */
        async dispose( ...pArgs )
        {
            let dependencies = asArray( this.#dependencies ?? [] ).filter( Dependency.isDependency ).filter( e => e?.initialized );

            if ( $ln( dependencies ) > 0 )
            {
                let args = asArray( pArgs ?? this.args ?? [] );

                for( let dependency of dependencies )
                {
                    if ( isNonNullObject( dependency ) && Dependency.isDependency( dependency ) )
                    {
                        if ( dependency?.initialized )
                        {
                            await asyncAttempt( async() => await dependency.dispose( ...args ) );
                        }
                    }
                }

                dependencies = asArray( this.#dependencies ?? [] ).filter( Dependency.isDependency ).filter( e => e?.initialized && !e?.isDisposed() );

                if ( $ln( dependencies ) > 0 )
                {
                    throw new DependencyDisposalError( "Failed to dispose one or more dependencies", { failures: dependencies.map( e => e?.id || e?.name || getClassName( e ) ) } );
                }
            }

            return this;
        }

        /**
         * Returns a new instance of this class
         * populated with cloned copies of each dependency held
         * by this instance.
         *
         * @returns {Dependencies} a new instance of this class
         *                         populated with clones of the Dependency objects held.
         */
        clone()
        {
            let dependencies = asArray( this.inventory ?? [] );

            if ( $ln( dependencies ) > 0 )
            {
                dependencies = dependencies.map( e => isCloneable( e ) ? e.clone() : isCloneable( e?.component ) ? new Dependency( e.component.clone(), e.name, e.id ) : new Dependency( e, e.name, e.id ) );
            }

            let args = asArray( this.args ?? [] );

            if ( $ln( args ) > 0 )
            {
                args = args.map( e => isCloneable( e ) ? e.clone() : e );
            }

            return new this.constructor[Symbol.species]( ...([...dependencies, ...args]) );
        }

        #getDependencyByClass( pClass )
        {
            const dependencies = asArray( this.inventory ?? [] );

            const className = asString( getClassName( pClass ), true );

            if ( isClass( pClass ) )
            {
                let dependency = this.#mapByClass.get( pClass ) ?? (dependencies.find( e => (isSubclassOf( e, pClass )) || (isSubclassOf( e?.component, pClass )) || isSubclassOf( e?.componentClass, pClass ) ));

                dependency = dependency ?? (dependencies.find( e => implementsInterface( e, pClass ) || implementsInterface( e?.component, pClass ) ));

                if ( Dependency.isDependency( dependency ) )
                {
                    return dependency;
                }
            }
            else if ( isString( pClass ) && !isBlank( pClass ) )
            {
                return this.#getDependencyByName( className ) ?? this.#getDependencyById( className );
            }

            return dependencies.find( e => (getClassName( e ) === className) || (getClassName( e?.component ) === className) || getClassName( e?.componentClass ) === className );
        }

        #getDependencyById( pId )
        {
            let id = isString( pId ) || isUUID( pId ) ? asString( pId, true ) : asString( isNonNullObject( pId ) ? pId?.id || pId?.name : _mt, true );

            if ( isBlank( id ) )
            {
                return null;
            }

            let dependency;

            if ( /\w+\.\w+/.test( id ) || isUUID( id ) )
            {
                dependency = this.#mapById.get( id ) ?? this.#mapByName.get( id );
            }
            else
            {
                dependency = this.#getDependencyByName( id ) ?? this.#mapById.get( id );
            }

            return dependency ?? (this.inventory.find( e => e?.id === id || (e?.component?.id === id) || e?.componentId === id ));
        }

        #getDependencyByName( pName )
        {
            let name = isString( pName ) || isUUID( pName ) ? asString( pName, true ) : asString( isNonNullObject( pName ) ? pName?.name || pName?.id : _mt, true );

            if ( isBlank( name ) )
            {
                return null;
            }

            let dependency = this.#mapByName.get( name );

            return dependency ?? (this.inventory.find( e => (asString( (e?.name || e?.component?.name || e?.componentName), true ) === name) || (asString( e?.component?.name, true ) === name) || asString( e?.componentName, true ) === name ));
        }

        #getDependency( pKey )
        {
            let dependency;

            if ( isClass( pKey ) )
            {
                dependency = this.#getDependencyByClass( pKey );
            }

            dependency = (dependency ?? this.#getDependencyById( pKey ) ?? this.#getDependencyByName( pKey ));

            return dependency ?? (Dependency.isDependency( pKey ) ? pKey : null);
        }

        findDependency( pKey )
        {
            const id = isNonNullObject( pKey ) ? asString( pKey?.id, true ) || asString( pKey?.name, true ) : (isString( pKey ) && !isBlank( pKey )) ? asString( pKey, true ) : pKey;

            const name = isNonNullObject( pKey ) ? asString( pKey?.name, true ) || asString( pKey?.id, true ) : isString( pKey ) ? asString( pKey, true ) : pKey;

            const klass = isUserDefinedClass( pKey ) ? pKey : isNonNullObject( pKey ) ? (pKey?.baseClass ?? getClass( pKey )) : pKey;

            let dep = this.#getDependency( name ) ?? this.#getDependency( id ) ?? (isUserDefinedClass( klass ) ? this.#getDependency( klass ) : isNonNullObject( pKey ) ? this.#getDependency( pKey ) : null);

            dep = Dependency.isDependency( dep ) ? dep : (isUserDefinedClass( klass ) || isNonNullObject( klass ) ? this.#getDependency( klass ) ?? this.#getDependency( getClass( klass ) ) : this.#getDependency( pKey ));

            if ( Dependency.isDependency( dep ) )
            {
                if ( (isBlank( id ) || asString( dep?.id, true ) === asString( id, true )) &&
                     (isBlank( name ) || asString( dep?.name, true ) === asString( name, true )) )
                {
                    return dep;
                }
            }

            dep = (asArray( this.#dependencies ?? [] )).find( e => attempt( () => isNonNullObject( e ) && (e.name === name || e.id === id || (isUserDefinedClass( klass ) ? isSubclassOf( (e?.component ?? e?.componentClass ?? e), klass ) : isSubclassOf( (e?.component ?? e?.componentClass ?? e), getClass( pKey ) ))) ) );

            dep = Dependency.isDependency( dep ) ? dep : (asArray( this.#dependencies ?? [] )).find( e => attempt( () => isNonNullObject( e ) && (e.component?.name === name || e.component?.id === id || (isUserDefinedClass( klass ) ? isSubclassOf( e.component, klass ) : isSubclassOf( e.component, getClass( pKey ) ))) ) );

            if ( Dependency.isDependency( dep ) )
            {
                if ( (isBlank( id ) || asString( dep?.id, true ) === asString( id, true )) &&
                     (isBlank( name ) || asString( dep?.name, true ) === asString( name, true )) )
                {
                    return dep;
                }
            }

            dep = Dependency.isDependency( pKey ) ? pKey : null;

            if ( !Dependency.isDependency( dep ) )
            {
                // Format the key for better error messages
                let keyDisplay = pKey;
                if ( isNonNullObject( pKey ) )
                {
                    keyDisplay = `${pKey?.id || pKey?.name}::${pKey?.name || getClassName( pKey )}::${getClassName( pKey ) || asJson( pKey )}::${asJson( pKey )}`;
                }

                const msg = `Cannot find dependency, ${asString( keyDisplay || pKey, true )}`;

                const resolvedLogger = ToolBocksModule.resolveLogger( this["logger"],
                                                                      ToolBocksModule.getGlobalLogger(),
                                                                      DEFAULT_LOGGER );

                const dependencyNotFoundError = new DependencyNotFoundError( msg,
                                                                             {
                                                                                 key: pKey,
                                                                                 dependencies: this.inventory
                                                                             }, pKey );

                attemptSilent( () => resolvedLogger.error( msg, dependencyNotFoundError ) );

                throw dependencyNotFoundError;
            }

            return dep;
        }
    }

    Dependencies.isDependenciesInstance = function( pObject, pStrict = false )
    {
        return isNonNullObject( pObject ) && (pObject instanceof Dependencies || ( !pStrict && implementsInterface( pObject, Dependencies )));
    };

    Dependencies.resolveDependenciesInstance = function( pObject, pStrict = false )
    {
        if ( Dependencies.isDependenciesInstance( pObject, pStrict ) )
        {
            return pObject;
        }

        if ( isArray( pObject ) )
        {
            const dependencies = asArray( pObject ).filter( e => isNonNullObject( e ) && (Dependency.isDependency( e ) || (isComponent( e ))) );

            return new Dependencies( ...dependencies );
        }

        if ( isFunction( pObject ) )
        {
            if ( isClass( pObject ) )
            {
                return new pObject();
            }
            return attempt( () => pObject() );
        }

        return new Dependencies( pObject );
    };

    Dependencies.merge = function( pDependencies, ...pDependency )
    {
        const dependenciesObject = isArray( pDependencies ) ?
                                   new Dependencies( ...(asArray( pDependencies )).filter( e => Dependency.isDependency( e ) ) ) :
                                   isNonNullObject( pDependencies ) ?
                                   Dependencies.resolveDependenciesInstance( pDependencies ) :
                                   new Dependencies( ...pDependency );

        let arr = [...(asArray( pDependency ?? [] ))].filter( e => Dependency.isDependency( e ) );

        arr = [...(asArray( dependenciesObject.inventory ?? [] )), ...arr].filter( e => Dependency.isDependency( e ) );

        let args = [];

        arr.forEach( elem =>
                     {
                         if ( !isNull( elem ) )
                         {
                             const dep = Dependency.from( elem, elem?.name, elem?.id );
                             if ( !(args.some( e => dep.equals( e ) )) )
                             {
                                 args.push( dep );
                             }
                         }
                     } );

        return new Dependencies( ...(asArray( args ?? arr ?? [] )) );
    };

    const INITIALIZABLE_FILTER = (( e ) => Dependency.isDependency( e ) || isComponentInitializable( e ));
    const DISPOSABLE_FILTER = (( e ) => Dependency.isDependency( e ) || isComponentDisposable( e ));

    const NOT_INITIALIZED_FILTER = (( e ) => !(e?.initialized) && isComponentInitializable( e ));
    const IS_INITIALIZED_FILTER = (( e ) => e?.initialized || !isComponentInitializable( e ));

    const MAPPER_DEPENDENCY_NAME = (( e ) => isFunction( e?.toString ) ? attempt( () => e.toString() ) || asString( e?.name || e?.id || getClassName( e ), true ) : asString( e?.name || e?.id || getClassName( e ), true ));


    // noinspection DuplicatedCode
    /**
     * This is the base class to extend
     * when defining objects that expect their dependencies
     * to be passed into their constructor
     * in the form of a Dependencies instance.
     *
     * If such classes also provide a factory method,
     * that method must either accept or assemble a Dependencies object
     * and pass it to the constructor.
     */
    class DependentObject
    {
        /**
         * Allows all subclasses to dispatch events
         * @type {EventTarget}
         */
        #zTarget = new EventTarget();

        /**
         * The date/time this component was initialized.
         * Populated during the execution of the init() method
         */
        #initDate;

        /**
         * Instance of Dependencies provided to the constructor
         */
        #dependenciesContainer;

        /**
         * Internal collection of resolved dependencies.
         * Used for easy iteration during init and dispose methods.
         */
        #dependencies;

        /**
         * Named arguments; must be strings
         * @type {string:string|{}}
         */
        #options;

        /**
         * The common dependency of all components.
         * Resolved from the Dependencies provided to the constructor.
         */
        #logger;

        constructor( pDependencies, pOptions, ...pArgs )
        {
            this.#options = lock( { ...(asObject( pOptions ?? {} )) } );

            // Conditionally add an args property.
            // Some subclasses may expect additional arguments and know what to do with them
            // Those subclasses must include the arguments to pass
            // in the DependencyDescriptor/DependencyDescriptorOptions in their declared DEPENDENCIES

            // noinspection JSUnresolvedReference
            let args = asArray( pArgs ?? this.#options?.args ?? [] );
            if ( $ln( args ) > 0 )
            {
                this.args = asArray( [...args] );
            }

            if ( isArray( this.#options?.args ) )
            {
                this.args = asArray( this.args ?? [] );
                this.args.push( ...(asArray( this.#options?.args ?? [] )) );
            }

            this.args = lock( asArray( this.args ?? [] ) );

            const dependencyArgs = asArray( asArray( this.args ).filter( e => Dependency.isDependency( e ) ) );

            this.#dependenciesContainer = Dependencies.resolveDependenciesInstance( pDependencies ?? this.args.find( e => e instanceof Dependencies ) ?? new Dependencies( ...dependencyArgs ) );

            if ( isNull( this.#dependenciesContainer ) || !(this.#dependenciesContainer instanceof Dependencies) )
            {
                this.#dependenciesContainer = Dependencies.resolveDependenciesInstance( this.args.find( e => e instanceof Dependencies ) ?? new Dependencies( ...dependencyArgs ) );

                if ( isNull( this.#dependenciesContainer ) || !(this.#dependenciesContainer instanceof Dependencies) )
                {
                    this.#dependenciesContainer = Dependencies.resolveDependenciesInstance( new Dependencies( ...dependencyArgs ) );
                }

                if ( isNull( this.#dependenciesContainer ) || !(this.#dependenciesContainer instanceof Dependencies) )
                {
                    throw new RegistryError( new IllegalArgumentError( `Construction of ${getClass( this )} requires a valid instance of Dependencies` ) );
                }
            }

            this.#dependencies = [...(this.#dependenciesContainer?.inventory ?? dependencyArgs), ...dependencyArgs].filter( Dependency.isDependency );

            // use the DependencyConstant to retrieve the injected component
            this.#logger = this.#dependenciesContainer.findDependency( DEP_CONSTS.LOGGER ) ??
                           [...(dependencyArgs)].find( ToolBocksModule.isLogger ) ??
                           this.#options?.logger ?? DEFAULT_LOGGER;

            // in the case of the logger, because it is fundamental to troubleshooting,
            // if it is missing, we fall back to a default logger and log a warning
            // if other dependencies are missing, our constructors *might* throw a DependencyNotFoundError
            // or choose to defer that to the execution of the init method, instead
            if ( !ToolBocksModule.isLogger( this.#logger ) )
            {
                let logr = ToolBocksModule.resolveLogger( ToolBocksModule.getGlobalLogger(),
                                                          DEFAULT_LOGGER,
                                                          simpleLogger );

                logr = SourcedSimpleLogger.adapt( logr, getClassName( this ) );

                this.#logger = logr ?? ToolBocksModule.getGlobalLogger() ?? DEFAULT_LOGGER;

                attemptSilent( () => logr.warn( new DependencyNotFoundError( `No valid instance of ${DEP_CONSTS.LOGGER.id} found, falling back to default, LOGGER: ${logr?.id || logr?.name || asString( logr, true )}, ${getClassName( logr )}` ) ) );
            }

            // resolve the logger to either the injected component, the 'global' logger, or the locally defined default logger
            this.#logger = ToolBocksModule.resolveLogger( this.#logger,
                                                          ToolBocksModule.getGlobalLogger(),
                                                          DEFAULT_LOGGER,
                                                          simpleLogger );

            this.#logger = SourcedSimpleLogger.adapt( this.#logger,
                                                      getClassName( this ),
                                                      {
                                                          ...(asObject( this.#options ?? { args: asArray( pArgs ?? [] ) } )),
                                                          source: this
                                                      } );
        }

        /**
         * Intended for use by subclasses.
         *
         * Not enforceable (easily) in JavaScript,
         * but please do not call methods prefixed with an underscore
         * from outside a class or its subclasses.
         *
         * @returns {Dependencies}
         * @protected
         */
        _findDependency( pDependencyConstant,
                         pName = pDependencyConstant?.name,
                         pId = pDependencyConstant?.id )
        {
            let dependency = this._dependenciesContainer.findDependency( pDependencyConstant ) ??
                             this._dependenciesContainer.findDependency( pName ) ??
                             this._dependenciesContainer.findDependency( pId );

            if ( Dependency.isDependency( dependency ) )
            {
                return dependency;
            }

            return this._dependencies.find( e => e?.name === pDependencyConstant?.name || e?.id === pDependencyConstant?.id || (isClass( pDependencyConstant?.baseClass ) && isSubclassOf( e?.componentClass, pDependencyConstant.baseClass )) );
        }

        get logger()
        {
            return ToolBocksModule.resolveLogger( this.#logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER, simpleLogger );
        }

        /**
         * Returns the Dependencies instance to subclasses.
         * Not enforceable (easily) in JavaScript,
         * but please do not call methods prefixed with an underscore
         * from outside a class or its subclasses.
         *
         * @returns {Dependencies}
         * @protected
         */
        get _dependenciesContainer()
        {
            return (Dependencies.resolveDependenciesInstance( this.#dependenciesContainer ??
                    new Dependencies( ...([...(asArray( objectValues( this.options ?? {} ) )),
                                           ...(asArray( this.args ?? [] )), this]) ) ) ??
                    new Dependencies( ...([...(asArray( objectValues( this.options ?? {} ) )),
                                           ...(asArray( this.args ?? [] )), this]) ));
        }

        /**
         * Returns the collection of dependencies to subclasses.
         * Not enforceable (easily) in JavaScript,
         * but please do not call methods prefixed with an underscore
         * from outside a class or its subclasses.
         *
         * @returns {Array.<*>}
         * @protected
         */
        get _dependencies()
        {
            return asArray( this.#dependencies ?? this._dependenciesContainer?.inventory ?? [] );
        }

        get options()
        {
            return lock( { ...(asObject( this.#options ?? {} )) } );
        }

        get initializationDate()
        {
            return isDate( this.#initDate ) ? new Date( this.#initDate ) : null;
        }

        get initDate()
        {
            return isDate( this.#initDate ) ? new Date( this.#initDate ) : null;
        }

        /**
         * Dispatches an event for which there may be a listener.
         *
         * @param {Event} pEvt - The event to be dispatched. Prefer dispatching instances of ModuleEvent.
         * @return {boolean} Returns true if the event was successfully dispatched, otherwise false.
         */
        dispatchEvent( pEvt )
        {
            return this.#zTarget.dispatchEvent( resolveEvent( pEvt ) );
        }

        /**
         * Adds an event listener to this instance.
         *
         * @param {String} pEventName - The name of the event to handle.
         * @param {EventListener|EventListenerObject} pHandler - The callback function to execute when the event is triggered or an Object with a handleEvent method
         * @param {Object|boolean} [pOptions] - Optional parameters that define characteristics about the event listener,
         * such as whether it is captured in the capturing phase, is one-time, or is passive.
         * @return {void} Does not return a value.
         */
        addEventListener( pEventName, pHandler, pOptions )
        {
            this.#zTarget.addEventListener( pEventName, pHandler, pOptions );
        }

        /**
         * Removes the specified event listener from this instance.
         *
         * @param {string} pEventName - The name of the event to remove the listener from.
         * @param {EventListener|EventListenerObject} pHandler - The event handler function or object to remove.
         * @param {Object|boolean} [pOptions] - An object or a boolean indicating the options with which the listener was added.
         * @return {void} - Does not return any value.
         */
        removeEventListener( pEventName, pHandler, pOptions )
        {
            this.#zTarget.removeEventListener( pEventName, pHandler, pOptions );
        }

        /**
         * Returns true if this object and its dependencies are ready to use
         *
         * @returns {boolean} true if this object and its dependencies are ready to use
         */
        get initialized()
        {
            const deps = asArray( this.#dependencies ?? [] );

            return isDate( this.#initDate ) && ($ln( deps ) <= 0 || deps.every( e => e?.initialized || !isComponentInitializable( e ) ));
        }

        /**
         * Prepares this object for use.
         *
         * This method is idempotent.
         * If the object and its dependencies are already initialized, simply returns this instance.
         *
         * @returns {Promise<DependentObject>} this instance, ready to use
         */
        async init( ...pArgs )
        {
            if ( this.initialized )
            {
                return this;
            }

            // collect the arguments to pass to each dependency's init method
            // add this object as the _last_ argument for any dependency that might need it
            const args = [...(asArray( pArgs ?? this.args ?? [] )), this];

            // we first defer the initialization to the Dependencies object
            const dependencyContainer = Dependencies.resolveDependenciesInstance( this.#dependenciesContainer );

            if ( isNonNullObject( dependencyContainer ) )
            {
                await asyncAttempt( async() => await dependencyContainer.init( ...args ) );
            }

            // second-chance if the dependencies failed to initialize,
            // we iterate them and try to initialize each independently

            const dependencies = asArray( this.#dependencies ?? this._dependencies ?? [] ).filter( INITIALIZABLE_FILTER ).filter( NOT_INITIALIZED_FILTER );

            for( let dependency of dependencies )
            {
                if ( isNonNullObject( dependency ) && (Dependency.isDependency( dependency ) || isComponentInitializable( dependency )) )
                {
                    if ( !dependency?.initialized && isComponentInitializable( dependency ) )
                    {
                        if ( Dependency.isDependency( dependency ) || isFunction( dependency?.init ) )
                        {
                            await asyncAttempt( async() => await dependency.init( ...args ) );
                        }
                        else
                        {
                            await asyncAttempt( async() => await initializeComponent( dependency, ...args ) );
                        }
                    }
                }
            }

            // check that all of our dependencies are now initialized
            if ( $ln( dependencies ) <= 0 || dependencies.every( IS_INITIALIZED_FILTER ) )
            {
                const initializationDate = lock( new Date() );

                this.#initDate = initializationDate;

                attempt( () => this.logger.debug( `${this.toString()} initialized: (${initializationDate}) -> with ${asString( (dependencies.map( MAPPER_DEPENDENCY_NAME ).join( ", " )), true )}` ) );

                attempt( () => this.dispatchEvent( new ModuleEvent( "init",
                                                                    { detail: { object: this } },
                                                                    { dependencies } ) ) );
            }
            else
            {
                // if our dependencies are not initialized, throw an error
                throw new DependencyInitializationError( `Failed to initialize all dependencies of ${this.toString()}`,
                                                         { uninitialized: [...(asArray( this._dependencies ).filter( NOT_INITIALIZED_FILTER ))] },
                                                         ...(asArray( this._dependencies ).filter( NOT_INITIALIZED_FILTER )) );
            }

            // if everything is fine, return this instance
            return this;
        }

        /**
         * Performs any necessary cleanup, disconnections,
         * or other important finalization of this object and its dependents,
         * making this instance unusable (unless re-initialized).
         *
         * Objects that cannot be re-initialized should return null from this method.
         *
         * @param {...*} pArgs - any arguments necessary to properly dispose of the dependents and this object
         *
         * @returns {Promise<DependentObject>} this instance, if it can be re-initialized, null otherwise
         */
        async dispose( ...pArgs )
        {
            let deps = this._dependencies;

            // if none of the dependencies remain initialized, we return this immediately
            if ( ($ln( deps ) <= 0) || !(deps.some( IS_INITIALIZED_FILTER )) )
            {
                this.#initDate = null;

                return this;
            }

            // collect the arguments to pass to each dependency's dispose method
            // add this object as the _last_ argument for any dependency that might need it
            const args = [...(asArray( pArgs ?? this.args ?? [] )), this];

            const dependencyContainer = this._dependenciesContainer;

            // try to use the Dependencies.dispose method
            if ( isNonNullObject( dependencyContainer ) )
            {
                await asyncAttempt( async() => await dependencyContainer.dispose( ...args ) );
            }

            // check to see which, if any, of our dependencies remain initialized (not disposed)
            let dependencies = asArray( this.#dependencies ?? [] ).filter( DISPOSABLE_FILTER ).filter( IS_INITIALIZED_FILTER );

            // if any dependencies remain initialized (not properly disposed),
            // try to call the dispose method of each of those
            if ( $ln( dependencies ) > 0 )
            {
                for( let dependency of dependencies )
                {
                    if ( isNonNullObject( dependency ) && (Dependency.isDependency( dependency ) || isComponentDisposable( dependency )) )
                    {
                        if ( dependency?.initialized )
                        {
                            if ( Dependency.isDependency( dependency ) || isFunction( dependency.dispose ) )
                            {
                                await asyncAttempt( async() => await dependency.dispose( ...args ) );
                            }
                            else if ( isComponentDisposable( dependency ) )
                            {
                                await asyncAttempt( async() => await disposeComponent( dependency, ...args ) );
                            }
                        }
                    }
                }

                dependencies = asArray( this.#dependencies ?? [] ).filter( DISPOSABLE_FILTER ).filter( IS_INITIALIZED_FILTER );
                dependencies = asArray( dependencies ).filter( e => e?.initialized && !e?.isDisposed() );

                if ( $ln( dependencies ) > 0 )
                {
                    throw new DependencyDisposalError( `Failed to dispose one or more dependencies of ${this.toString()}`,
                                                       { failures: dependencies.map( MAPPER_DEPENDENCY_NAME ) } );
                }
            }

            attempt( () => this.logger.debug( `${this.toString()} disposed: (${new Date()})` ) );

            attempt( () => this.dispatchEvent( new ModuleEvent( "dispose",
                                                                { detail: { object: this } },
                                                                { dependencies } ) ) );

            return this;
        }

        /**
         * Returns the unique ID of this specific instance IN MEMORY.
         *
         * This can be useful for debugging when the issue stems from an unintended aliasing of an object.
         *
         * @returns {String} returns a string in the form of a UUID
         *                   that uniquely identifies this instance __as it exists in memory__.
         *
         * NOTE: THIS IS NOT A VALUE TO BE USED FOR PERSISTENCE.
         * THIS VALUE IS VALID ONLY AS LONG AS THIS OBJECT REMAINS REACHABLE IN SCOPE.
         */
        get instanceId()
        {
            if ( isNonNullObject( OBJECT_REGISTRY ) )
            {
                return OBJECT_REGISTRY.getGuid( this );
            }

            return generateGuid();
        }

        equals( pOther )
        {
            if ( isNull( pOther ) || !isObject( pOther ) || !(pOther instanceof getClass( this )) )
            {
                return false;
            }

            return pOther === this || pOther.instanceId === this.instanceId;
        }

        toLiteral()
        {
            const obj = {};

            obj.id = (this.id || this.instanceId);
            obj.name = asString( this.name || this.toString() ) || _mt;

            obj.klass = getClass( this ) ?? this.constructor;
            if ( Dependency === obj.klass )
            {
                obj.klass = obj.componentClass ?? obj.klass ?? this.constructor;
            }

            obj.className = asString( getClassName( obj.klass ?? this ) || "DependentObject", true ) || "DependentObject";

            if ( obj.className.endsWith( "Dependency" ) || obj.className.endsWith( "ComponentAdapter" ) )
            {
                obj.className = getClassName( obj.componentClass ) || obj.className;
            }

            const entries = objectEntries( this );

            if ( entries && $ln( entries ) )
            {
                entries.forEach( entry =>
                                 {
                                     const key = asString( ObjectEntry.getKey( entry ), true );

                                     const value = ObjectEntry.getValue( entry );

                                     if ( isNonNullObject( value ) )
                                     {
                                         attempt( () => obj[key] = (obj[key] || attempt( () => toObjectLiteral( value, { respectToLiteralMethod: false } ) || asString( value ) ) || asString( value ) || _mt) );
                                     }
                                     else if ( isNonNullValue( value ) )
                                     {
                                         attempt( () => obj[key] = (obj[key] || (value ?? _mt)) );
                                     }
                                 } );
            }

            return lock( obj );
        }

        toString()
        {
            return `${getClassName( this )}::${this.instanceId}`;
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        [Symbol.toStringTag]()
        {
            return "[object " + getClassName( this ) + "]";
        }
    }

    /**
     * All subclasses must declare their dependencies similarly.
     * It is recommended to spread the superclass's DEPENDENCIES
     * before adding (or overwriting) dependencies specific to the subclass.
     *
     * @type {{String,DependencyDescriptor}}
     */
    DependentObject.DEPENDENCIES =
        {
            LOGGER: new DependencyDescriptor( DEP_CONSTS.LOGGER,
                                              {
                                                  requiresNewInstance: true,
                                                  baseClass: ILogger,
                                                  defaultInstance: DEFAULT_LOGGER
                                              } )
        };

    class DependentObjectAdapter extends DependentObject
    {
        constructor( pClass, pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );

            const methods = attempt( () => getMethods( pClass ) ) ?? [];

            for( let method of methods )
            {
                attempt( () => this[method?.name || asString( method )] = method.bind( this ) );
            }
        }
    }

    function asDependentObject( pClass, pDepends, pOpts, ...pArr )
    {
        let klass = isClass( pClass ) ? pClass : isNonNullObject( pClass ) ? getClass( pClass ) : DependentObject;

        if ( !isClass( pClass ) )
        {
            throw new IllegalArgumentError( `The asDependentObject function is intended for adapting an exiting class to behave like DependentObject; you must pass a class as the first argument` );
        }

        const opts = asObject( pOpts ?? {} );

        const args = asArray( pArr ?? opts?.args ?? [] ).filter( e => !isNull( e ) );
        args.push( ...(asArray( opts?.args ?? [] )) );

        class surogate extends DependentObjectAdapter
        {
            #instance;

            constructor( pDependencies, pOptions = opts, ...pArgs )
            {
                super( klass, pDependencies, asObject( pOptions ?? opts ), ...(asArray( pArgs ?? args ?? pArr )) );

                const options = asObject( pOptions ?? opts ?? {} );

                const arr =
                    [
                        ...(asArray( pArgs ?? args ?? pArr )),
                        ...(asArray( options.args ?? [] )),
                        ...(asArray( objectValues( options ?? {} ) )),
                    ].filter( e => Dependency.isDependency( e ) );

                const dependencies = Dependencies.merge( pDependencies, ...(asArray( arr ?? [] )) );

                this.#instance = attempt( () =>
                                          {
                                              const constructorArguments =
                                                  [
                                                      ...(asArray( dependencies?.inventory ?? pArgs ?? args ?? pArr )),
                                                      ...(asArray( pArgs ?? args ?? pArr ))
                                                  ];

                                              return new klass( ...constructorArguments );
                                          } );

                delegateTo( this, this.#instance, ["init", "dispose"] );
            }
        }

        if ( isNonNullObject( pDepends ) )
        {
            surogate.DEPENDENCIES = pDepends;
        }

        return surogate;
    }

    const mod =
        lock( {
                  Dependencies,
                  DependentObject,
                  asDependentObject
              } );

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
