// noinspection JSValidateTypes,JSUnresolvedReference,GrazieInspection

/**
 * This module defines classes and function
 * used to manage/inject dependencies
 * and implement an Inversion of Control pattern.
 *
 * This module does not define any specific dependencies.
 *
 * Classes communicate their dependencies
 * via a static class property, named, DEPENDENCIES.
 *
 * When a consumer needs an instance of the class,
 * that consumer asks the registry for an instance.
 * Note that consumers are not expected to ask for a concrete implementation,
 * but rather an object that fulfills some role (what would be an interface in other languages).
 *
 * The available components are declared in DependencyConstants.json.
 * Classes construct DependencyDescriptor objects using those constants
 * to communicate their dependencies to consumers and/or the registry.
 *
 * Registries are themselves also consumers.
 *
 * When asked for a component,
 * a registry checks for whether the request must be fulfilled with a new instance
 * or can reuse a previously registered instance of the component.
 *
 * If an existing component can be reused,
 * the registry checks for a registered instance,
 * and if found, ensures it is initialized and then returns it.
 *
 * If an existing component is _not_ found,
 * the registry must construct an instance of a suitable class.
 *
 * To do so, the registry will need to resolve its dependencies
 * either locally or by making requests to other registries.
 *
 * Once a component is constructed,
 * the registry will initialize the component
 * and return it to the caller.
 *
 * If the dependency was declared as allowing reuse,
 * the registry will cache it internally to fulfill future requests.
 *
 * If the dependency was declared as requiring a new instance,
 * the instance is returned without being cached/registered.
 *
 * Registered components must either be stateless or immutable.
 * Constructed components that are not shared/cached/reused may hold state.
 *
 * Some forms of 'state' are allowed in shared components.
 * Examples include properties that are stateless components,
 * database connections,
 * a connection pool,
 * and globally immutable values.
 *
 * Further details can be found in the documentation for each class and function in this module.
 *
 * @module
 */

/**
 * Limits the chain of dependencies with dependencies to maximum depth
 *
 * @type {number}
 */
const MAX_DEPENDENCY_DEPTH = 16;

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

    /**
     * Import the ToolBocks JSON Utilities.
     * This module exposes circular-reference compatible
     * methods for generating JSON or parsing JSON to an object.
     *
     * For source code and documentation, navigate to:
     * https://github.com/bockelman-scott/bocktils/tree/master/packages/json
     */
    const jsonUtils = require( "@toolbocks/json" );

    const logUtils = require( "@toolbocks/logging" );

    const dependencyConstants = require( "./DependencyConstant.js" );
    const dependencyErrors = require( "./DependencyErrors.js" );
    const dependencyFunctions = require( "./DependencyFunctions.js" );
    const dependencyModule = require( "./Dependency.js" );
    const dependencyDescriptor = require( "./DependencyDescriptor.js" );
    const dependentObject = require( "./DependentObject.js" );
    const publishedComponent = require( "./PublishedComponent.js" );

    // destructure the individual utilities module from the imported ToolBocks core library
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = toolbocks;

    // destructure the specific classes, constants, and functions used by this module
    // from the moduleUtils utility module
    const
        {
            ToolBocksModule,
            ModuleEvent,
            ObjectEntry,
            IllegalArgumentError,
            detectCycles,
            attempt,
            asyncAttempt,
            attemptSilent,
            resolveError,
            lock,
            dereference,
            objectEntries,
            $ln,
            no_op
        } = moduleUtils;

    // destructure the constants used in this module
    const { $scope, _ud, _mt, _dot } = constants;

    // destructure the classes and function from ToolBocks TypeUtils module that are used in this module
    const
        {
            ResolvedSet,
            isNull,
            isObject,
            isError,
            isWeakRef,
            isArray,
            isNonNullObject,
            isMap,
            isFunction,
            isString,
            isDate,
            isClass,
            isSubclassOf,
            getClass,
            getClassName,
            classFrom,
            toObjectLiteral,
            clamp
        } = typeUtils;

    // destructure the specific functions from the ToolBocks String Utilities module that are used in this module
    const { asString, asInt, isBlank, toCamelCase, lcase, ucase } = stringUtils;

    // destructure the specific functions from the ToolBocks Array Utilities module that are used in this module
    const { asArray, replaceElements } = arrayUtils;

    // destructure the specific functions from the ToolBocks JSON Utilities module that are used in this module
    const { asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const { DEP_CONSTS, DEP_CONSTS_BY_ID } = dependencyConstants;

    const { DependencyDescriptor, DependencyDescriptorOptions, computeKey, computeHash } = dependencyDescriptor;

    const { DependentObject, Dependencies } = dependentObject;

    const { DEPENDENCY_TYPE, PublishedComponent } = publishedComponent;

    const
        {
            EXIT_CODES,
            RegistryError,
            DependencyNotFoundError,
            DependencyInitializationError,
            DependencyDisposalError
        } = dependencyErrors;

    const
        {
            DEPENDENCY_METHODS,
            DEPENDENCY_EVENTS,

            CASE_INSENSITIVE_COLLATOR,
            CASE_SENSITIVE_COLLATOR,

            DEFAULT_LOGGER,

            isObjOrJson,

            isDisposable,
            isAsyncDisposable,
            isComponentDisposable,
            isDisposed,
            disposeComponent,

            isInitializable,
            isAsyncInitializable,
            isComponentInitializable,
            isInitialized,
            initializeComponent,

            isComponent
        } = dependencyFunctions;

    const { Dependency } = dependencyModule;

    const LOGGER = ToolBocksModule.resolveLogger( ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

    /**
     * This class provides methods for resolving, initializing, and caching dependencies.
     *
     * Instances of a DependencyRegistry (or its subclasses)
     * are used to construct, initialize, and provide objects
     * to components that need them.
     *
     * This decouples the construction of services, data sources, and other components
     * from the functions that use them, also allowing the implementations to change
     * without having to change the various code that uses them.
     *
     * In the event of an environment-level error,
     * we also use instances of this class to attempt to release resources gracefully.
     *
     * @see #registerExceptionHandlers
     *
     * @class
     */
    class DependencyRegistry extends EventTarget
    {
        /**
         * Holds the date the registry was initialized.
         * When null, this indicates that the registry has not been initialized or has been disposed.
         * @type {Date|null}
         */
        #initDate = null;

        /**
         * A Logger the registry can use to record its own operations.
         *
         * There is a potential chicken versus egg situation here:
         *
         * A logger is normally an injected dependency.
         * The registry exposes a mutator method for its logger,
         * defaults to using a global or default logger,
         * and will attempt to adopt a logger when a logger dependency is defined.
         */
        #logger;

        /**
         * Holds a local cache of modules loaded via the node.js 'require' function.
         * This is potentially redundant since Node.js has its own require.cache.
         *
         * Holding a local cache may be faster,
         * but may also pose issues with memory
         * or inconsistency between the two collections.
         * THIS WILL BE DETERMINED DURING TESTING
         *
         * @type {Map<string, any>}
         */
        #packagesByPath = new Map();

        /**
         * This map holds arrays of the published/registered information
         * required to find and return a component.
         *
         * Components are lazily loaded
         * using the information stored here.
         *
         * @type {Map<string,Array<PublishedComponent>> }
         */
        #componentInfoById = new Map();

        // holds already constructed dependencies by computed key
        #mapByKey = new Map();

        // holds already constructed dependencies by computed hash
        #mapByHash = new Map();

        #shutdownInProgress = false;
        #cleanupInProgress = false;
        #exceptionHandlersRegistered = false;

        /**
         * Constructs an instance of a DependencyRegistry
         * and registers exception handlers to dispose any cached dependencies
         * in the event of an environment/process-level exception or shutdown signal.
         *
         * @param {ILogger} pLogger - A logger instance to be used to record the operations of the instance.
         *                            If not provided, we fall back to the global logger or the default logger.
         */
        constructor( pLogger )
        {
            super();

            this.#logger = ToolBocksModule.resolveLogger( pLogger,
                                                          ToolBocksModule.getGlobalLogger(),
                                                          LOGGER,
                                                          DEFAULT_LOGGER );

            this.#logger = SourcedSimpleLogger.adapt( this.#logger, SimpleLogger.resolveLogSourceName( this ) );

            attempt( () => this.registerExceptionHandlers( this.logger ).then( no_op ).catch( (this.logger ?? DEFAULT_LOGGER ?? console).error ) );
        }

        get logger()
        {
            return ToolBocksModule.resolveLogger( this.#logger,
                                                  ToolBocksModule.getGlobalLogger(),
                                                  LOGGER,
                                                  DEFAULT_LOGGER );
        }

        set logger( pLogger )
        {
            this.#logger = ToolBocksModule.resolveLogger( pLogger,
                                                          ToolBocksModule.getGlobalLogger(),
                                                          LOGGER,
                                                          DEFAULT_LOGGER ) ?? this.#logger;

            this.#logger = SourcedSimpleLogger.adapt( this.#logger, SimpleLogger.resolveLogSourceName( this ) );
        }

        /**
         * Registers a PublishedComponent that can be used to fulfill a request for a component.
         * The registered data are definitions, not instances, used to load and instantiate requested components.
         *
         * @param {PublishedComponent} pPublishedComponent An object with the following properties:
         *
         *                                                 id: must match the id of an existing DependencyConstant
         *
         *                                                 name: should match the name of an existing DependencyConstant
         *
         *                                                 path: the package/module name or the relative path to the module containing the dependency
         *                                                 (this can be a filepath or a package-like syntax compatible with a call to the node::require function)
         *
         *                                                 component: the name of the variable exported
         *                                                 by the package defined by the path
         *
         *  Note that components are lazily loaded when requested.
         *  If components are cached, they are wrapped in WeakRef instances to prevent exhausting memory.
         *
         *  @retruns true if the PublishedComponent was added to the registry
         */
        register( pPublishedComponent )
        {
            // record the current size, so we can determine whether the specified PublishedComponent
            // has been successfully added to the registry
            const currentSize = $ln( this.#componentInfoById );

            // declare a local variable to hold the PublishedComponent
            let info = pPublishedComponent ?? new PublishedComponent();

            // Ensure the 'info' object is an instance of PublishedComponent, regardless of what has been passed
            if ( isObjOrJson( info ) )
            {
                // convert POJO into an instance of PublishedComponent
                info = PublishedComponent.from( asObject( info ) );

                // get the key under which to store information related to this dependency
                const key = asString( info.id || info.name, true );

                // get the existing collection stored under this key or create a new array
                let collection = asArray( this.#componentInfoById.get( key ) ?? [] );
                collection = ((isNull( collection ) || !isArray( collection )) ? [] : asArray( collection ));

                // remember the length before adding the new information, so we can determine whether the new information has been registered
                const curLength = $ln( collection );

                // add the newly registered component to the end of the array.
                // this assumes that the later a component is registered, the more specific it is
                // this is meant to avoid providing an overly specific instance
                // when a more generic version is requested
                const newLength = collection.push( info );

                // reset the key to hold the updated collection
                this.#componentInfoById.set( key, collection );

                // return true if the map increased in size
                // or the collection now includes the registered dependency
                const registered = ($ln( this.#componentInfoById ) > currentSize) || newLength > curLength ||
                                   (isArray( this.#componentInfoById.get( key ) ) && (asArray( this.#componentInfoById.get( key ).includes( info ) )));

                if ( registered && this.logger && this.logger.enabledFor( SimpleLogger.LEVELS.DEBUG ) )
                {
                    attemptSilent( () => this.logger.debug( `Registered Component:`, key, asString( info, true ) ) );
                }

                return registered;
            }

            throw new RegistryError( `Cannot interpret ${pPublishedComponent} as a registerable component` );
        }

        /**
         * Removes a PublishedComponent from the registry.
         * this method does not dispose or destroy any components.
         *
         * @param {PublishedComponent|Object|String} pPublishedComponent - the information that uniquely identifies
         *                                                                 one or more registered items to remove
         *
         * @returns {boolean} true if one or more items were removed from the registry
         */
        unregister( pPublishedComponent )
        {
            let key = _mt, path = _mt, version = _mt, baseClass = _mt;

            if ( isObjOrJson( pPublishedComponent ) )
            {
                const info = PublishedComponent.from( asObject( pPublishedComponent ) );

                key = asString( info?.id || info?.name, true );

                path = info?.path;

                version = info?.version;

                baseClass = info?.baseClass || _mt;
            }
            else if ( isString( pPublishedComponent ) && asString( pPublishedComponent, true ).includes( _dot ) )
            {
                key = asString( pPublishedComponent, true );
            }

            if ( isBlank( key ) )
            {
                throw new IllegalArgumentError( `The unregister method requires a valid key, but received ${pPublishedComponent}`, { key: pPublishedComponent }, pPublishedComponent );
            }

            let collection = asArray( this.#componentInfoById.get( key ) ?? [] );

            let curLength = $ln( collection );

            if ( curLength <= 0 )
            {
                const msg = `Unable to find (and unregister) registered component for ${(isString( pPublishedComponent ) ? pPublishedComponent : asObject( pPublishedComponent ?? {} )?.id)}`;

                const logr = ToolBocksModule.resolveLogger( this.logger,
                                                            ToolBocksModule.getGlobalLogger(),
                                                            LOGGER,
                                                            DEFAULT_LOGGER );

                attemptSilent( () => logr.warn( msg ) );

                return false;
            }

            if ( curLength <= 1 || (isBlank( path ) && isBlank( version )) )
            {
                return attempt( () => this.#componentInfoById.delete( key ) );
            }

            // this filter should match components that would be returned by the specified PublishedComponent
            const matchesCriteria = ( e ) => (e?.id === key || e?.name === key) && (e?.path === path || _mt === path) && (e?.version === version || _mt === version) && (e?.baseClass === baseClass || _mt === baseClass);

            // we KEEP entries that do NOT match that criteria
            collection = asArray( collection ).filter( e => !matchesCriteria( e ) );

            // reset the map entry with the updated collection
            this.#componentInfoById.set( key, collection );

            let removed = $ln( collection ) < curLength;

            if ( removed && this.logger && this.logger.enabledFor( SimpleLogger.LEVELS.DEBUG ) )
            {
                attemptSilent( () => this.logger.debug( `Unregistered Component:`, key ) );
            }

            // return true if one or more elements were removed from the collection
            return removed;
        }

        _reportDependencyError( pId, pName, pDescriptor, pMsg )
        {
            const id = pId || "~!~";
            const name = pName || id;
            const msg = asString( pMsg || _mt, true ) || `Could not resolve dependency, ${id} or ${name}`;

            const descriptor = isNonNullObject( pDescriptor ) ? pDescriptor : DependencyDescriptor.from( id || name, {}, msg );

            const errOptions = { registry: this, id, name, descriptor };

            const err = new DependencyNotFoundError( msg, errOptions );

            attemptSilent( () => this.dispatchEvent( new ModuleEvent( "error",
                                                                      {
                                                                          error: err,
                                                                          descriptor,
                                                                          id,
                                                                          name
                                                                      }, errOptions ) ) );
            return err;
        }

        /**
         * Returns an initialized Dependency representing and implementing the requested component.
         *
         * @param {DependencyDescriptor|DependencyConstant} pKey - DependencyDescriptor or object defining the properties necessary to be resolved as a DependencyDescriptor
         *                                                         that describes the characteristics of the object or class to be returned
         *
         * @param {Object} [pOptions=pKey?.options] - an object specifying additional properties
         *                                            to be used either when finding, instantiating, or initializing
         *                                            the component.  Defaults to the 'options' property of the descriptor or null.
         *
         * @param {...*} pArgs - zero or more additional arguments to be passed to the constructor or initialization method
         *                       of the requested component. Defaults to (empty)
         *
         * @returns {Promise<Dependency|Function>} - an initialized Dependency or a class, if the descriptor matches a registered, published component
         *                                           if no registered components can fulfill the request,
         *                                           we throw an error, rather than returning null
         */
        async getComponent( pKey, pOptions, ...pArgs )
        {
            // If the key is not specified, we throw an IllegalArgumentError
            if ( isNull( pKey ) )
            {
                throw new RegistryError( new IllegalArgumentError( `DependencyDescriptor or ID is required`, { key: pKey } ) );
            }

            // if the key is an object or a JSON string representing an object, we build the descriptor from the object
            if ( isObjOrJson( pKey ) )
            {
                const key = asObject( pKey );

                const options = { ...(asObject( key?.options ?? pOptions ?? {} )), ...(asObject( pOptions ?? key?.options ?? {} )) };

                let args = asArray( key?.args ?? asArray( pArgs ?? [] ) ?? [] );
                args = replaceElements( args, asArray( pArgs ?? args ?? [] ) );

                const descriptor = DependencyDescriptor.from( key, options, ...args );

                return await this.resolveDependency( descriptor );
            }

            // if the key is a string that is not JSON,
            // we assume it is the ID of a DependencyConstant
            if ( isString( pKey ) )
            {
                const constant = DEP_CONSTS_BY_ID.get( pKey ) ?? DEP_CONSTS[pKey];

                if ( !isNull( constant ) )
                {
                    const options = asObject( pOptions ?? { args: asArray( pArgs ?? [] ) } );

                    let args = asArray( pArgs ?? options?.args ?? [] );
                    args = $ln( args ) < 1 ? asArray( options?.args ?? pOptions?.args ?? [] ) : args;
                    options.args = asArray( args ?? options.args ?? [] );

                    const descriptorOptions = DependencyDescriptorOptions.from( options, ...args );

                    const descriptor = new DependencyDescriptor( constant, descriptorOptions );

                    return await this.resolveDependency( descriptor );
                }
            }

            const msg = `Cannot find component or dependency for key, ${pKey?.id || pKey}`;
            throw this._reportDependencyError( (pKey?.id || pKey?.name || pKey), (pKey?.name || pKey?.id || pKey), pKey, msg );
        }

        /**
         * Returns an instance of DependencyDescriptor.
         *
         * If the argument passed *is* a DependencyDescriptor,
         * a new instance if constructed from the provided instance.
         *
         * If the argument passed is NOT an instance of DependencyDescriptor,
         * this method makes its best effort to construct one from the value specified.
         *
         * @param {*|DependencyDescriptor} pDependencyDescriptor - an instance of DependencyDescriptor or an object or value that can be used to construct a DependencyDescriptor
         *
         * @returns {DependencyDescriptor} an instance of DependencyDescriptor based on the value passed
         */
        resolveDescriptor( pDependencyDescriptor )
        {
            let descriptor = pDependencyDescriptor;

            if ( DependencyDescriptor.isValidDescriptor( descriptor ) )
            {
                return descriptor;
            }

            const input = isObjOrJson( pDependencyDescriptor ) ? asObject( pDependencyDescriptor ) : pDependencyDescriptor;

            if ( isNonNullObject( input ) )
            {
                descriptor = (input instanceof DependencyDescriptor) ? input : (DependencyDescriptor.from( input ) ?? input ?? pDependencyDescriptor);
            }
            else if ( isString( input ) )
            {
                // in the case that we could not resolve the descriptor,
                // treat the value as if it is a 'raw' ID or name of a DependencyConstant

                let id, name;

                if ( asString( input, true ).includes( _dot ) )
                {
                    id = asString( input, true );
                    name = toCamelCase( asString( id.split( _dot ).slice( -1 ).join( _mt ), true ) );
                }
                else
                {
                    name = asString( input, true );
                    id = name;
                }

                // use the raw id and/or name to resolve the DependencyConstant
                const constant = DEP_CONSTS_BY_ID.get( id ) ?? DEP_CONSTS_BY_ID.get( lcase( id ) ) ??
                                 DEP_CONSTS_BY_ID.get( name ) ?? DEP_CONSTS_BY_ID.get( lcase( name ) ) ??
                                 DEP_CONSTS[id] ?? DEP_CONSTS[lcase( id )] ?? DEP_CONSTS[ucase( id )] ??
                                 DEP_CONSTS[name] ?? DEP_CONSTS[lcase( name )] ?? DEP_CONSTS[ucase( name )];

                // and use that to create a descriptor
                descriptor = DependencyDescriptor.from( constant ?? input );
            }

            return DependencyDescriptor.isValidDescriptor( descriptor ) ? descriptor : DependencyDescriptor.from( descriptor ?? pDependencyDescriptor );
        }

        /**
         * Returns true if the specified component meets the criteria specified by the DependencyDescriptor
         * with respect to the least generic subclass indicated by the descriptor.
         *
         * @param {Object|Function} pComponent - the component or class to evaluate
         * @param {DependencyDescriptor} pDescriptor - the descriptor potentially defining the baseClass and/or a defaultInstance
         *                                             (whose class will determine the least generic subclass if baseClass is not defined)
         *
         * @returns {boolean}      true if the component is the class or an instance of the class or one of its subclasses
         *                         or if the descriptor does not define a baseClass or defaultInstance
         */
        #isCompatibleClass( pComponent, pDescriptor )
        {
            let component = isWeakRef( pComponent ) ? dereference( pComponent ) : pComponent;
            component = Dependency.isDependency( component ) ? component["component"] ?? component : component;

            if ( isNull( component ) || !(isObject( component ) || isClass( component )) )
            {
                return false;
            }

            const descriptor = this.resolveDescriptor( pDescriptor );

            if ( isNonNullObject( descriptor ) && DependencyDescriptor.isValidDescriptor( descriptor ) )
            {
                return descriptor.isCompatibleClass( component ) || descriptor.isCompatibleClass( pComponent );
            }

            return isNonNullObject( component ) || isClass( component );
        }

        /**
         * Constructs an InitializationError to be logged and/or thrown.
         *
         * @param {String|Error} pMsg - the error message or an Error from which to extract a message
         * @param {Error} [pError=null] - an Error to pass along as the cause or a detail
         * @param {DependencyDescriptor} pDescriptor - the DependencyDescriptor associated with the component that failed to initialize
         * @param {...*} pArgs - zero or more arguments to pass to the DependencyInitializationError constructor; usually the argument that were passed to the component's init method
         *
         * @returns {DependencyInitializationError} an instance of DependencyInitializationError to be logged and/or thrown
         */
        #createInitializationError( pMsg, pError, pDescriptor, ...pArgs )
        {
            const msg = isError( pMsg ) ? (asString( pMsg?.message, true ) || pMsg) : (asString( pMsg, true ) || pError?.message);

            const err = attempt( () => isError( pError ) ? resolveError( pError ) : new Error( msg ) );

            const descriptor = attempt( () => this.resolveDescriptor( pDescriptor ) );

            const errOptions =
                {
                    registry: this,
                    error: err,
                    descriptor,
                    args: asArray( pArgs ?? [] )
                };

            attemptSilent( () => this.dispatchEvent( new ModuleEvent( "error", errOptions, ...pArgs ) ) );

            return new DependencyInitializationError( msg, errOptions, (err ?? pError), descriptor, ...pArgs );
        }

        /**
         * Initializes the specified component if it is initializable and not already initialized.
         *
         * @param {Dependency|Object} pComponent - the component to initialize
         * @param {DependencyDescriptor} pDescriptor - the DependencyDescriptor holding any options or arguments to pass to the init method
         * @param {...*} pArgs - zero or more arguments to pass to the init method (instead of those specified by the descriptor)
         *
         * @returns {Promise<Object|Dependency>} the initialized component
         */
        async #initializeComponent( pComponent, pDescriptor, ...pArgs )
        {
            let component = Dependency.isDependency( pComponent ) ? pComponent : (pComponent?.component ?? pComponent);

            if ( isNonNullObject( component ) && isComponentInitializable( component ) && !isInitialized( component ) )
            {
                const descriptor = this.resolveDescriptor( pDescriptor );

                let args = asArray( descriptor?.options?.args ?? descriptor?.args ?? [] );
                args = replaceElements( args, asArray( pArgs ?? args ?? [] ) );

                try
                {
                    component = await initializeComponent( component, ...args ) ?? component;
                }
                catch( ex )
                {
                    if ( isNull( component ) || !isInitialized( component ) )
                    {
                        const msg = `Failed to initialize component, ${(descriptor?.cacheKey || computeKey( descriptor ))}, due to error: ${ex?.message}`;
                        throw this.#createInitializationError( msg, ex, descriptor, args );
                    }
                }
            }

            return component ?? pComponent?.component ?? pComponent;
        }

        /**
         * Stores an initialized Dependency as a WeakRef
         * in the local maps, under the cacheKey and hash.
         *
         * These cached instances can be returned to callers
         * that do not specify they require a new instance.
         *
         * @param {Object|Function} pComponent - the component to cache
         * @param {DependencyDescriptor} pDescriptor - the descriptor from which to calculate the map keys under which to store the component
         * @param {...*} pArgs - zero or more arguments required to initialize the component, if necessary
         *
         * @returns {Promise<Dependency|Object|Function>} the cached (and initialized) Dependency
         */
        async #cacheDependency( pComponent, pDescriptor, ...pArgs )
        {
            let dependency = pComponent;

            if ( isNonNullObject( pComponent ) )
            {
                const descriptor = this.resolveDescriptor( pDescriptor );

                let name = descriptor?.name;
                let id = descriptor?.id;

                let args = [...(asArray( descriptor?.options?.args ?? descriptor?.args ?? [] ))];
                args = replaceElements( args, [...(asArray( pArgs ?? args ?? [] ))] );

                if ( !Dependency.isDependency( pComponent ) )
                {
                    dependency = new Dependency( pComponent, name, id, ...args );
                }

                if ( !isInitialized( dependency ) )
                {
                    dependency = await this.#initializeComponent( dependency, descriptor, ...args );
                }

                if ( !Dependency.isDependency( dependency ) )
                {
                    dependency = new Dependency( dependency, name, id, ...args );
                }

                const key = descriptor?.cacheKey || computeKey( descriptor ?? dependency );

                const hash = descriptor?.hash || computeHash( descriptor ?? dependency );

                const ref = new WeakRef( dependency );

                this.#mapByKey.set( key, ref );
                this.#mapByHash.set( hash, ref );

                if ( this.logger && this.logger.enabledFor( SimpleLogger.LEVELS.DEBUG ) )
                {
                    attemptSilent( () => this.logger.debug( `Cached Component: ${id}, ${name}, under hash: ${hash}, and key: ${key}`, "\n\n" ) );
                }
            }

            return dependency ?? pComponent;
        }

        /**
         * Returns a cached instance of a component if one is available in the cache.
         *
         * @param {DependencyDescriptor} pDescriptor - the DependencyDescriptor to use to find the cached instance
         *
         * @returns {Dependency|null} a cached instance or null if no instances of the requested components are cached
         */
        #resolveCached( pDescriptor )
        {
            const descriptor = this.resolveDescriptor( pDescriptor );

            // the 'hash' is a cryptographic hash of the more human-friendly cacheKey
            const hash = descriptor?.hash || computeHash( descriptor ) || asString( Date.now() );

            // we use both, mostly for the human-readability of the cacheKey when debugging
            const key = descriptor?.cacheKey || computeKey( descriptor ) || asString( Date.now() );

            // get the item from one of the caches
            const component = this.#mapByHash.get( hash ) ?? this.#mapByKey.get( key );

            // the component *should* be wrapped in a WeakRef, so dereference it before returning it.
            return isWeakRef( component ) ? dereference( component ) : component;
        }

        /**
         * Returns an instance of a component
         * previously resolved during a recursive operation
         * if a cyclic dependency is detected.
         *
         * @param {Array} pStack - the list of component hash values that have been encountered/visited during the recursive operation
         *
         * @param {ResolvedSet} pVisited - the object that holds previously resolved components during a recursive request.
         *
         * @param {DependencyDescriptor} pDescriptor - the descriptor for the component to be returned, if it exists
         *
         * @returns {Promise<Dependency|null>} the previously resolved instance of a requested Dependency to return if an infinite cycle is detected
         */
        async #resolveVisited( pStack, pVisited, pDescriptor )
        {
            const stack = asArray( pStack ?? [] );
            const visited = pVisited || new ResolvedSet();

            const descriptor = this.resolveDescriptor( pDescriptor );

            let resolved = visited.getResolved( ...stack ) ?? await this.#resolveCached( descriptor );

            if ( isNull( resolved ) || !(isObject( resolved ) || isClass( resolved ) || isFunction( resolved ) || isWeakRef( resolved )) )
            {
                resolved = descriptor?.defaultInstance ?? descriptor?.baseClass;
            }

            if ( isNonNullObject( resolved ) || isClass( resolved ) || isFunction( resolved ) || isWeakRef( resolved ) )
            {
                resolved = dereference( resolved ) ?? resolved;

                if ( isNonNullObject( resolved ) || isClass( resolved ) || isFunction( resolved ) )
                {
                    const args = (descriptor?.options?.args) ?? (descriptor?.args);
                    return new Dependency( resolved, descriptor?.name, descriptor?.id, ...(asArray( args ?? descriptor?.args ?? [] )) );
                }
            }

            return resolved;
        }

        /**
         * This method is called when a cyclic-dependency has been detected.
         *
         * When possible, this method returns the previously resolved Dependency or a cached instance of the same.
         *
         * If the dependency cannot be resolved, an error is thrown.
         *
         * @param pDependency
         * @param pStack
         * @param pVisited
         * @param pDescriptor
         *
         * @returns {Promise<*>}
         *
         * @throws RegistryError if the dependency cannot be resolved
         */
        async #handleCyclicDependency( pDependency, pStack, pVisited, pDescriptor )
        {
            const stack = asArray( pStack ?? [] );

            const visited = pVisited ?? new ResolvedSet();

            const descriptor = this.resolveDescriptor( pDescriptor ) ?? pDescriptor;

            let dependency = await this.#resolveVisited( stack, visited, descriptor ) ?? pDependency;

            if ( isNull( dependency ) )
            {
                const msg = `An infinite loop was encountered and no previously visited, cached, or default instance was found`;
                throw new RegistryError( msg, { stack, visited, src: this, descriptor }, ...stack );
            }

            const args = (descriptor?.options?.args) ?? (descriptor?.args);
            dependency = (dependency instanceof Dependency) ? dependency : new Dependency( dependency, descriptor?.name, descriptor?.id, ...(asArray( args ?? descriptor?.args ?? [] )) );

            if ( !dependency.initialized )
            {
                dependency = await dependency.init( ...(asArray( args ?? descriptor?.args ?? [] )) );
            }

            return Dependency.isDependency( dependency ) ? dependency : new Dependency( dependency, dependency.name, dependency.id, ...(asArray( args ?? descriptor?.args ?? [] )) );
        }

        _requiresRecursion( pClass, pComponent )
        {
            const component = (isNonNullObject( pComponent ) ? (pComponent?.component ?? pComponent) : (isNonNullObject( pClass ) ? pClass : {}));

            const klass = isClass( pClass ) ? pClass : getClass( pClass ?? component );

            return isSubclassOf( klass, DependentObject ) ||
                   isSubclassOf( component, DependentObject ) ||
                   isNonNullObject( klass?.DEPENDENCIES ) ||
                   isNonNullObject( component?.DEPENDENCIES );
        }

        /**
         * Returns an initialized Dependency matching the criteria specified in the DependencyDescriptor.
         *
         * This method recursively resolves the dependencies of the requested component
         * and their dependencies
         * and their dependencies
         * and their dependencies
         * and their dependencies
         * and so on...
         *
         * Infinite loops are prevented by detecting a cycle
         * and attempting to return the most recently resolved instance
         * of the component matching the criteria
         * of the redundantly encountered descriptor.
         *
         * @param {DependencyDescriptor|Object|String} pDependencyDescriptor
         *
         * @param {Array} pStack DO NOT PASS THESE FROM INVOCATIONS OUTSIDE OF THIS CLASS
         * @param {ResolvedSet} pVisited DO NOT PASS THESE FROM INVOCATIONS OUTSIDE OF THIS CLASS
         *
         * @returns {Promise<Dependency|null>}
         */
        async resolveDependency( pDependencyDescriptor, pStack = [], pVisited = new ResolvedSet() )
        {
            // get or create the array (stack) and set (visited)
            // that we use to detect and resolve infinite loops
            // when calling this method as part of a recursive chain
            const stack = asArray( pStack ?? [] );
            const visited = pVisited instanceof ResolvedSet ? pVisited : new ResolvedSet();

            // convert the first argument into a DependencyDescriptor, regardless of what kind of value is specified
            const descriptor = this.resolveDescriptor( pDependencyDescriptor );

            // if we cannot find a valid descriptor, we throw an IllegalArgumentError
            if ( !DependencyDescriptor.isValidDescriptor( descriptor ) )
            {
                throw new IllegalArgumentError( `Cannot resolve component or dependency for descriptor, ${toObjectLiteral( pDependencyDescriptor )}`, { descriptor: pDependencyDescriptor }, pDependencyDescriptor, stack, visited );
            }

            // initialize the variable to the descriptor's defined defaultInstance or baseClass
            let dependency = descriptor?.defaultInstance ?? descriptor?.baseClass ?? asArray( descriptor.args ?? descriptor?.options?.args ?? [] ).find( e => Dependency.isDependency( e ) && e instanceof (descriptor?.baseClass ?? getClass( descriptor?.defaultInstance ?? {} ) ?? DependenctObject) );

            // detect an infinite loop and try to handle it gracefully
            if ( detectCycles( stack ) || ($ln( stack ) > MAX_DEPENDENCY_DEPTH) )
            {
                return await this.#handleCyclicDependency( dependency, stack, visited, descriptor );
            }

            let component = null;

            const id = asString( descriptor?.id, true );
            const name = asString( descriptor?.name, true );

            const baseClass = descriptor?.baseClass;

            // determine if the descriptor indicates that the returned value can be cached
            // (and potentially returned to other callers)
            let cacheable = !descriptor?.requiresNewInstance;

            // if the descriptor does not forbid returning a cached instance,
            // try to find and return an already constructed and initialized instance
            if ( cacheable )
            {
                component = this.#resolveCached( descriptor ) ?? asArray( descriptor.args ?? descriptor?.options?.args ?? [] ).find( e => Dependency.isDependency( e ) && e instanceof (descriptor?.baseClass ?? getClass( descriptor?.defaultInstance ?? {} ) ?? DependenctObject) );

                if ( !isNull( component ) && this.logger && this.logger.enabledFor( SimpleLogger.LEVELS.DEBUG ) )
                {
                    attemptSilent( () => this.logger.debug( `Found Cached Component for ${id}, ${name}, ${baseClass}:`, getClassName( component?.component ?? component ) ), "\n" );
                }
            }

            // get the type of value expected to be returned (that is, an object, a class, or a factory)
            // noinspection JSUnresolvedReference
            let dependencyType = DEPENDENCY_TYPE.resolveType( asString( descriptor?.type, true ) || PublishedComponent.TYPES.DEFAULT );

            // get the descriptor options
            let descriptorOptions = asObject( descriptor?.options );

            // get any arguments specified in the descriptor options or on the descriptor itself
            let args = [...(asArray( descriptorOptions.args ?? descriptor?.args ?? [] ))];

            // if the descriptor has specified a factory method, it will be used instead of a constructor
            let factoryMethodName = asString( descriptor?.["factoryMethodName"] || _mt, true ) || _mt;

            const isIncompatibleComponent = ( pComponent ) => (isNull( pComponent ?? component ) || !(isNonNullObject( pComponent ?? component ) || isClass( pComponent ?? component )) || !this.#isCompatibleClass( (pComponent ?? component), descriptor ));

            // if we either must return a new instance or no instance is cached
            if ( isIncompatibleComponent( component ) )
            {
                // get the collection of PublishedComponents registered for the ID or name specified
                const collection = asArray( this.#componentInfoById.get( id ) ?? this.#componentInfoById.get( name ) );

                // if we find none, we throw an error
                if ( isNull( collection ) || $ln( collection ) < 1 )
                {
                    const msg = `No components registered for ID: ${id} or ${name}`;
                    throw this._reportDependencyError( id, name, descriptor, msg );
                }

                // create a filter function to check for viable candidates (instances of PublishedComponent with a compatible version)
                let isValidCandidate = e => (isNonNullObject( e ) || isClass( e )) && isSubclassOf( e, PublishedComponent ) && descriptor.isCompatibleVersion( e );

                // filter the candidates by the initial criteria
                let candidates = asArray( collection ?? [] ).filter( isValidCandidate );

                // create a limit for iterations to prevent an infinite loop
                // the limit is based on the number of candidates but can never be greater than 64
                const maxIterations = clamp( ($ln( candidates ) + 1), 1, 64 );

                let totalIterations = 0;

                // iterate the candidates until we find a compatible component
                while ( isIncompatibleComponent( component )
                        && ($ln( candidates ) > 0)
                        && (totalIterations++ < maxIterations) )
                {
                    let candidate = candidates.shift();

                    // if we have shifted past the end of the array of candidates,
                    // we will exit the loop (with a backstop enforced by the maxIterations).
                    // This check protects us from unexpected elements in the array
                    if ( isNull( candidate ) )
                    {
                        continue;
                    }

                    // use the load method of PublishedComponent
                    // to 'require' the defining package/module
                    // and read the variable exposed by the name/id of the PublishedComponent
                    component = await asyncAttempt( async() => await candidate.load( descriptor ) );

                    if ( !isNull( component ) && (isClass( component ) || isNonNullObject( component )) )
                    {
                        // check for an overridden type; each PublishedComponent *can* override the type
                        dependencyType = DEPENDENCY_TYPE.resolveType( candidate.type || descriptor?.type || dependencyType );

                        // check for compatibility and set or update local variables
                        if ( this.#isCompatibleClass( component, descriptor ) )
                        {
                            // the DependencyDescriptor options override the PublishedComponent options
                            descriptorOptions =
                                {
                                    ...(toObjectLiteral( asObject( candidate?.options ?? {} ) )),
                                    ...(toObjectLiteral( asObject( descriptorOptions ) ))
                                };

                            // the DependencyDescriptor arguments override the PublishedComponent arguments
                            args = replaceElements( ([...(asArray( candidate.args ?? [] ))]), args );

                            // both the descriptor and the PublishedComponent must agree that the component can be cached
                            cacheable = cacheable && candidate.cacheable;

                            // if the candidate (PublishedComponent) declares a factory method name, update the local variable
                            const candidateFactoryMethod = candidate["factoryMethodName"] || "getInstance";
                            factoryMethodName = asString( isString( candidateFactoryMethod ) && !isBlank( candidateFactoryMethod ) ? asString( candidateFactoryMethod, true ) : factoryMethodName, true ) || factoryMethodName;

                            // we found it, so break without re-evaluating the condition; just ever so slightly faster
                            break;
                        }
                    }
                }

                // once the iteration is complete, we check to see if we found what we were seeking
                if ( isIncompatibleComponent( component ) )
                {
                    // if candidates were not exhausted somehow, but we still arrived here?
                    if ( $ln( candidates ) > 0 )
                    {
                        candidates = candidates.filter( e => !isNull( e ) && this.#isCompatibleClass( e, descriptor ) );
                        if ( $ln( candidates ) > 0 )
                        {
                            component = candidates[0];

                            if ( isNonNullObject( component ) && component instanceof PublishedComponent )
                            {
                                component = await asyncAttempt( async() => await component.load( descriptor ) );
                            }
                        }
                    }
                }

                // if we did NOT find a compatible component, we check for a default instance
                // or attempt to instantiate an instance of the baseClass if either is specified
                if ( isIncompatibleComponent( component ) )
                {
                    component = await asyncAttempt( async() => descriptor.useDefault( $scope() ) );
                }

                // if there is no defaultInstance or baseClass specified or neither of these is compatible,
                // we throw an error; best to fail fast/now than some time later when it may not be obvious why
                if ( isIncompatibleComponent( component ) )
                {
                    const msg = `No compatible component found for ID: ${id} or ${name}` + (!isNull( descriptor?.baseClass ) ? ` extending, ${getClassName( descriptor?.baseClass )}` : (!isNull( descriptor?.defaultInstance ) ? ` extending ${getClassName( descriptor?.defaultInstance )}` : _mt));
                    throw this._reportDependencyError( id, name, descriptor, msg );
                }

                // we construct the path we have followed to get here.
                // this is used in the recursive calls and to temporarily store each resolved dependency
                const nodePath = [...stack, (descriptor?.hash || computeHash( descriptor ))];

                // if we are not expecting this method to return a class...
                if ( PublishedComponent.TYPES.CLASS !== dependencyType )
                {
                    // but we find a class
                    if ( isClass( component ) )
                    {
                        // if the class is itself a DependentObject or has declared DEPENDENCIES,
                        // we recursively resolve the dependencies of the object that we will return

                        let klass = getClass( component ) ?? component;

                        if ( this._requiresRecursion( klass, component ) )
                        {
                            const requiredDependencies = (klass?.DEPENDENCIES ?? component?.DEPENDENCIES ?? component);

                            if ( this.logger && this.logger.enabledFor( SimpleLogger.LEVELS.DEBUG ) )
                            {
                                attemptSilent( () => this.logger.debug( `Resolving dependencies for ${getClassName( klass ?? component )}`, "\n" ) );
                            }

                            const dependencies = await asyncAttempt( async() => await this.resolveDependencies( requiredDependencies, nodePath, visited ) );

                            // instantiate an instance of the class (because we are expected to return an object (or a factory, which is also an object)
                            let factory = ( !isBlank( factoryMethodName ) && isFunction( klass?.[factoryMethodName] )) ? klass[factoryMethodName] : () => { return new klass( dependencies, descriptorOptions, ...args ); };
                            component = attempt( () => factory.call( klass, dependencies, descriptorOptions, ...args ) );
                            component = component ?? attempt( () => { return new klass( dependencies, descriptorOptions, ...args ); } );
                        }
                        else
                        {
                            // if the class does not declare any of its own DEPENDENCIES,
                            // we can just instantiate the object
                            let factory = ( !isBlank( factoryMethodName ) && isFunction( klass?.[factoryMethodName] )) ? klass[factoryMethodName] : () => { return new klass( ...(asArray( [descriptorOptions, ...args] )) ); };
                            component = attemptSilent( () => factory.call( klass, ...(asArray( [...args] )) ) );
                            component = component ?? attempt( () => { return new klass( ...(asArray( [...args] )) ); } );
                        }
                    }
                }
                else
                {
                    // if we ARE expected to return a class, but we have an object
                    if ( !isClass( component ) )
                    {
                        // we get the class of the object to return
                        component = getClass( component ) ?? component?.constructor?.[Symbol.species] ?? component?.constructor ?? classFrom( component );
                    }
                }

                // if the component is an object, we make sure that it is initialized if it can be and needs to be
                if ( isNonNullObject( component ) )
                {
                    if ( this.logger && this.logger.enabledFor( SimpleLogger.LEVELS.DEBUG ) )
                    {
                        attemptSilent( () => this.logger.debug( `Found Dependency: ${id}, ${name}, ${getClassName( component?.component ?? component )}`, "\n" ) );
                    }

                    // we make sure have a constructed object and initialize it if possible
                    if ( isComponentInitializable( component ) && !isInitialized( component ) )
                    {
                        component = await asyncAttempt( async() => await this.#initializeComponent( component, descriptor, ...args ) ) ?? component;
                    }

                    // we decorate the component as an instance of Dependency to ensure it can participate in the framework
                    component = new Dependency( component, name, id, ...args );

                    // and we remember it for the duration of the current potentially recursive resolution of dependencies
                    attempt( () => visited.resolveForNodePath( component, ...nodePath ) );

                    // if the object can be cached
                    // and potentially returned to other callers
                    // or used by other components in this dependency chain
                    if ( cacheable )
                    {
                        // we store the initialized Dependency in the registry
                        // wrapped as a WeakRef to safely manage memory
                        component = await this.#cacheDependency( component, descriptor ) ?? component;
                    }
                }
            }

            dependency = isClass( component ) ? component : (Dependency.isDependency( component ) ? component : (isNonNullObject( component ) ? new Dependency( component, name, id, ...args ) : component));

            // ensure returned object is initialized, if applicable
            if ( isNonNullObject( dependency ) && isInitializable( dependency ) && !isInitialized( dependency ) )
            {
                dependency = await initializeComponent( dependency ) ?? dependency ?? component;
            }

            // return the component, which is either a Dependency or a class (or null, perhaps)
            const resolvedComponent = isClass( dependency ?? component ) ? (dependency ?? component) : (Dependency.isDependency( dependency ?? component ) ? (dependency ?? component) : (isNonNullObject( dependency ?? component ) ? new Dependency( (dependency ?? component), name, id, ...args ) : (dependency ?? component)));

            if ( !isNull( resolvedComponent ) && this.logger && this.logger.enabledFor( SimpleLogger.LEVELS.DEBUG ) )
            {
                attemptSilent( () => this.logger.debug( `Resolved Dependency: ${id}, ${name}, ${getClassName( resolvedComponent?.component ?? resolvedComponent ) || getClassName( baseClass )}`, "\n" ) );
            }

            return resolvedComponent;
        }

        /**
         * Returns an array of objects that can be resolved as dependency descriptors
         *
         * @param pDescriptors
         *
         * @returns {Array<DependencyDescriptor>}
         */
        resolveDescriptors( pDescriptors )
        {
            let descriptors = isObjOrJson( pDescriptors ) ? (isArray( pDescriptors ) ? asArray( pDescriptors ) : dereference( asObject( pDescriptors ) )) : {};

            descriptors = (descriptors instanceof DependentObject) ?
                          getClass( descriptors )?.DEPENDENCIES || descriptors?.DEPENDENCIES :
                          descriptors;

            descriptors = isObjOrJson( descriptors ) ? (isArray( descriptors ) ? asArray( descriptors ) : dereference( asObject( descriptors ) )) : {};

            return (isNonNullObject( descriptors ) || isArray( descriptors )) ? Object.entries( descriptors ) ?? objectEntries( descriptors ) : [];
        }

        /**
         * Resolves all the specified dependencies and returns a Dependencies object
         * suitable for passing into the constructor of a DependentObject.
         *
         * @param pDependencyDescriptors
         * @param pStack
         * @param pVisited
         * @returns {Promise<Dependencies|*>}
         */
        async resolveDependencies( pDependencyDescriptors, pStack = [], pVisited = new ResolvedSet() )
        {
            const stack = asArray( pStack ?? [] );

            const visited = pVisited instanceof ResolvedSet ? pVisited : new ResolvedSet();

            if ( detectCycles( stack ) || $ln( stack ) > MAX_DEPENDENCY_DEPTH )
            {
                let resolved = visited.getResolved( ...stack );

                if ( isNonNullObject( resolved ) && resolved instanceof Dependencies )
                {
                    return resolved;
                }
                else
                {
                    const msg = `An infinite loop was encountered trying to resolve dependencies`;
                    throw new RegistryError( msg, { stack, visited }, ...stack );
                }
            }

            const dependencies = [];

            const descriptors = this.resolveDescriptors( pDependencyDescriptors );

            if ( descriptors && $ln( descriptors ) )
            {
                for( let entry of descriptors )
                {
                    if ( isNull( entry ) )
                    {
                        continue;
                    }

                    let key = ObjectEntry.getKey( entry );

                    let descriptor = ObjectEntry.getValue( entry );

                    descriptor = this.resolveDescriptor( descriptor ) ?? new DependencyDescriptor( DEP_CONSTS[key], descriptor );

                    descriptor = (descriptor instanceof DependencyDescriptor) ? descriptor : new DependencyDescriptor( DEP_CONSTS[key], descriptor );

                    const dependency = await asyncAttempt( async() => this.resolveDependency( descriptor, stack, visited ) );

                    if ( isNonNullObject( dependency ) || isClass( dependency ) )
                    {
                        visited.add( dependency );
                        dependencies.push( dependency );

                        if ( this.logger && this.logger.enabledFor( SimpleLogger.LEVELS.DEBUG ) )
                        {
                            attemptSilent( () => this.logger.debug( `Resolved Dependency:`, key, dependency.id, dependency.name, getClassName( dependency.componentClass ?? dependency.component ?? dependency ), "\n" ) );
                        }
                    }
                    else if ( "LOGGER" === key )
                    {
                        return this.logger;
                    }
                    else
                    {
                        attemptSilent( () => this.logger.warn( `Could not resolve dependency:`, key, descriptor?.id, descriptor?.name, descriptor?.baseClass ) );
                    }
                }
            }

            const container = new Dependencies( ...dependencies );

            return await asyncAttempt( async() => await container.init() ) ?? container;
        }

        /**
         * Returns true if this Registry is initialized
         * and ready to resolve dependencies
         * @returns {boolean}
         */
        get initialized()
        {
            return isDate( this.#initDate );
        }

        /**
         * Returns the latest date/time this registry was initialized or reset
         * @returns {Date|null} the latest date/time this registry was initialized or reset
         */
        get initDate()
        {
            if ( this.initialized )
            {
                return lock( new Date( this.#initDate.getTime() ) );
            }
            return null;
        }

        /**
         * Initializes this registry.
         * This class does not do anything special.
         * This class is designed to be extended.
         * A subclass should prepare itself appropriately before calling this super-method.
         * @returns {Promise<DependencyRegistry>} this instance
         */
        async init()
        {
            if ( !this.initialized )
            {
                this.#initDate = lock( new Date() );
            }
            return this;
        }

        /**
         * Calls the dispose method on any cached instances matching the DependencyDescriptor objects specified.
         * If no DependencyDescriptor objects are specified, calls the dispose method on ALL cached dependencies.
         * Disposed dependencies are removed from the cache.
         *
         * @param pDescriptors
         * @returns {Promise<DependencyRegistry>}
         */
        async dispose( ...pDescriptors )
        {
            if ( isNull( pDescriptors ) || $ln( asArray( pDescriptors ?? [] ) ) <= 0 )
            {
                await this.disposeAll();
            }

            const descriptors = asArray( pDescriptors ?? [] );

            for( let descriptor of descriptors )
            {
                const dependency = this.#resolveCached( this.resolveDescriptor( descriptor ) );

                if ( !isNull( dependency ) && (Dependency.isDependency( dependency ) || isDisposable( dependency )) )
                {
                    await asyncAttempt( async() => await dependency.dispose() );

                    attempt( () => this.#mapByHash.delete( descriptor.hash ) );
                    attempt( () => this.#mapByKey.delete( descriptor.cacheKey ) );
                }
            }

            return this;
        }

        async #disposeEntries( entries )
        {
            for( let entry of entries )
            {
                let key = ObjectEntry.getKey( entry ) || entry[0];

                await asyncAttempt( async() => await this.dispose( key ) );

                let weakRef = ObjectEntry.getValue( entry ) ?? entry[1];

                let dependency = dereference( ((null !== weakRef) ? dereference( weakRef ) : null) || await this.#resolveCached( key ) );

                if ( !isNull( dependency ) && (Dependency.isDependency( dependency ) || isDisposable( dependency )) )
                {
                    await asyncAttempt( async() => await dependency.dispose() );
                }
            }
        }

        async disposeAll( pDestroyRegistry = false )
        {
            attemptSilent( () => this.logger.info( `Disposing all registered components in ${getClassName( this )}`, "...", "\n" ) );

            let entries = [];

            if ( isMap( this.#mapByHash ) )
            {
                entries = isMap( this.#mapByHash ) ? this.#mapByHash.entries() ?? Object.entries( this.#mapByHash ) : objectEntries( this.#mapByHash || {} );

                await asyncAttempt( async() => await this.#disposeEntries( entries ) );

                attempt( () => this.#mapByHash.clear() );
            }

            if ( isMap( this.#mapByKey ) )
            {
                entries = this.#mapByKey.entries() ?? objectEntries( this.#mapByKey || {} );

                await asyncAttempt( async() => await this.#disposeEntries( entries ) );

                attempt( () => this.#mapByKey.clear() );
            }

            if ( this.cacheSize <= 0 )
            {
                attemptSilent( () => this.logger.info( `Disposed all registered components in ${getClassName( this )}`, "\n\n" ) );

                if ( pDestroyRegistry )
                {
                    if ( isMap( this.#componentInfoById ) )
                    {
                        attempt( () => this.#componentInfoById.clear() );
                    }

                    if ( isMap( this.#packagesByPath ) )
                    {
                        attempt( () => this.#packagesByPath.clear() );
                    }
                }
            }

            return this;
        }

        get numRegisteredComponents()
        {
            if ( isMap( this.#componentInfoById ) )
            {
                return $ln( this.#componentInfoById );
            }
            return 0;
        }

        get cacheSize()
        {
            return Math.max( this.#mapByHash.size, this.#mapByKey.size );
        }

        get size()
        {
            let total = 0;

            const entries = isMap( this.#componentInfoById ) ? this.#componentInfoById.entries() ?? objectEntries( this.#componentInfoById ) : objectEntries( this.#componentInfoById );

            entries.forEach( entry =>
                             {
                                 let arr = asArray( ObjectEntry.getValue( entry ) ?? entry[1] ?? [] );
                                 total += $ln( arr );
                             } );

            return asInt( total );
        }

        get availableComponents()
        {
            const entries = isMap( this.#componentInfoById ) ? this.#componentInfoById.entries() ?? objectEntries( this.#componentInfoById ) : objectEntries( this.#componentInfoById );

            const values = [];

            entries.forEach( entry =>
                             {
                                 let id = ObjectEntry.getKey( entry ) || entry[0];

                                 if ( !isBlank( id ) )
                                 {
                                     let dependencyConstant = DEP_CONSTS_BY_ID.get( id ) ?? ObjectEntry.getValue( entry ) ?? entry[1];

                                     if ( isNonNullObject( dependencyConstant ) )
                                     {
                                         values.push( lock( dependencyConstant ) );
                                     }
                                 }
                             } );

            return asArray( values ?? [] ).map( lock );
        }

        /**
         * Registers exception handlers for various critical events and signals in a Node.js application
         * to prevent crashes and ensure the application handles these scenarios gracefully.
         *
         * These can include:
         *   - "uncaughtException": Handler for uncaught exceptions in the application.
         *   - "unhandledRejection": Handler for unhandled Promise rejections.
         *   - "beforeExit": Handler for actions needed before the Node.js process exits naturally.
         *   - "exit": Handler for executing tasks when the application exits.
         *   - "warning": Handler for warning events emitted by Node.js.
         *   - "disconnect": Handler for the `disconnect` event used in IPC communication with child processes.
         *
         * The default handlers call disposeAll() on the DependencyRegistry
         *
         * @return {Promise<boolean>} A promise that resolves to true
         *                            if the exception handlers are successfully registered.
         */
        async registerExceptionHandlers( pLogger )
        {
            const me = this;

            const logr = ToolBocksModule.resolveLogger( pLogger,
                                                        this.logger,
                                                        ToolBocksModule.getGlobalLogger(),
                                                        LOGGER,
                                                        DEFAULT_LOGGER );

            const cleanup = async function( pExitCode )
            {
                if ( !me.#cleanupInProgress )
                {
                    me.#cleanupInProgress = true;

                    me.disposeAll().catch( console.error );
                }
            };

            const handleUncaughtException = function( pException, pOrigin )
            {
                const ex = resolveError( pException || (new Error( "An uncaught exception occurred " + (!isBlank( asString( (pOrigin || pException.origin), true ) ) ? asString( (pOrigin || pException?.origin), true ) : _mt) )), pException?.message );

                const logger = ToolBocksModule.resolveLogger( me.logger, logr, console );
                attemptSilent( () => (logger ?? logr ?? console).error( ex.message, ex ) );

                if ( !me.#shutdownInProgress )
                {
                    me.#shutdownInProgress = true;

                    cleanup( EXIT_CODES.UNCAUGHT_EXCEPTION ).then( no_op ).catch( console.error ).finally( () => process.exit( EXIT_CODES.UNCAUGHT_EXCEPTION ) );
                }
            };

            const handleBeforeExit = function()
            {
                if ( !me.#shutdownInProgress )
                {
                    me.#shutdownInProgress = true;

                    const logger = ToolBocksModule.resolveLogger( me.logger, logr, console );

                    attemptSilent( () => (logger ?? logr ?? console).info( "Shutting down...", "\n" ) );

                    cleanup( EXIT_CODES.NORMAL_SHUTDOWN ).then( no_op ).catch( console.error );
                }
            };

            const handleExit = function( pCode )
            {
                const code = pCode || process.exitCode;

                const logger = ToolBocksModule.resolveLogger( me.logger, logr, console );

                if ( logger && logger.info )
                {
                    attemptSilent( () => logger.info( "Node.js is exiting with code " + code + "\n" ) );
                }
                else
                {
                    attemptSilent( () => console.info( "Node.js is exiting with code " + code + "\n" ) );
                }
            };

            const handleUnhandledRejection = function( pReason, pPromise )
            {
                const ex = resolveError( pReason || (new Error( "An unhandled Promise rejection occurred " + (!isBlank( asString( pReason, true ) ) ? asString( pReason ) : _mt) )), (pReason?.message || pReason) );

                const logger = ToolBocksModule.resolveLogger( me.logger, logr, console );
                attemptSilent( () => (logger ?? logr ?? console).error( ex.message, ex ) );

                if ( !me.#shutdownInProgress )
                {
                    me.#shutdownInProgress = true;

                    cleanup( EXIT_CODES.UNHANDLED_REJECTION ).then( no_op ).catch( console.error ).finally( () => process.exit( EXIT_CODES.UNHANDLED_REJECTION ) );
                }
            };

            const handleWarning = function( pEvent )
            {
                const warning = resolveError( pEvent || resolveError( new Error( pEvent?.name + ":" + pEvent?.message ), pEvent?.name ), (pEvent?.message || pEvent) );

                let msg = (warning.name || asString( warning, true ) || "WARNING") + ", " + asString( warning.message || "(unknown)", true ) + ":\n" + (asString( warning.stack, true ) || "No Stack Trace Available") + "\n";

                const logger = ToolBocksModule.resolveLogger( me.logger, logr, console );

                attemptSilent( () => (logger ?? logr ?? console).warn( msg ) );
            };

            const handleDisconnect = function( pEvent )
            {
                // implemented when using child processes and IPC
            };

            if ( !me.#exceptionHandlersRegistered )
            {
                /**
                 * Prevent crashing the server if some unexpected exception has not been handled
                 */
                process.on( "uncaughtException", handleUncaughtException );

                /**
                 * Executes in the case of an unhandled Promise rejection
                 */
                process.on( "unhandledRejection", handleUnhandledRejection );

                /**
                 * Opportunity to alert someone to the event that occurs right before Node exits
                 */
                process.on( "beforeExit", handleBeforeExit );

                /**
                 * The application has ended
                 */
                process.on( "exit", handleExit );

                /**
                 * Executes on receipt of a warning
                 */
                process.on( "warning", handleWarning );

                /**
                 * Executes if Node.js receives a SIGTERM or SIGINT signal
                 */
                process.on( "disconnect", handleDisconnect );

                process.on( "SIGINT", () => cleanup( EXIT_CODES.SIGINT ).then( no_op ).catch( console.error ).finally( () => process.exit( EXIT_CODES.SIGINT ) ) );
                process.on( "SIGTERM", () => cleanup( EXIT_CODES.SIGTERM ).then( no_op ).catch( console.error ).finally( () => process.exit( EXIT_CODES.SIGTERM ) ) );

                me.#exceptionHandlersRegistered = true;
            }

            return me.#exceptionHandlersRegistered;
        }
    }

    const mod =
        lock( {
                  DependencyRegistry
              } );

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
