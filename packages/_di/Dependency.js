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
    const core = require( "@toolbocks/core" );

    /**
     * Import the ToolBocks JSON Utilities.
     * This module exposes circular-reference compatible
     * methods for generating JSON or parsing JSON to an object.
     *
     * For source code and documentation, navigate to:
     * https://github.com/bockelman-scott/bocktils/tree/master/packages/json
     */
    const jsonUtils = require( "@toolbocks/json" );

    const dependencyErrors = require( "./DependencyErrors.js" );

    const dependencyFunctions = require( "./DependencyFunctions.js" );

    // destructure the individual utilities module from the imported ToolBocks core library
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    // destructure the specific classes, constants, and functions used by this module
    // from the moduleUtils utility module
    const
        {
            ToolBocksModule,
            ObjectEntry,
            ObjectRegistry,
            OBJECT_REGISTRY = ToolBocksModule.OBJECT_REGISTRY || ObjectRegistry.DEFAULT_INSTANCE,
            IterationCap,
            objectEntries,
            objectValues,
            dereference,
            readProperty,
            attempt,
            asyncAttempt,
            attemptSilent,
            getLastError,
            lock,
            $ln
        } = moduleUtils;

    // destructure the constants used in this module
    const { _ud = "undefined", _mt } = constants;

    // destructure the classes and function from ToolBocks TypeUtils module that are used in this module
    const
        {
            isNull,
            isObject,
            isArray,
            isNonNullObject,
            isNonNullValue,
            isFunction,
            isAsyncFunction,
            isString,
            isNumeric,
            isCloneable,
            isClass,
            isSubclassOf,
            getClass,
            getClassName,
            implementsInterface,
            implementsMethods,
            delegateTo,
            toObjectLiteral
        } = typeUtils;

    // destructure the specific functions from the ToolBocks String Utilities module that are used in this module
    const { asString, asInt, getFunctionName, isJsonObject } = stringUtils;

    // destructure the specific functions from the ToolBocks Array Utilities module that are used in this module
    const { asArray } = arrayUtils;

    // destructure the specific functions from the ToolBocks JSON Utilities module that are used in this module
    const { asObject, asJson } = jsonUtils;

    const { DependencyInitializationError } = dependencyErrors;

    const
        {
            DEFAULT_LOGGER,
            CASE_SENSITIVE_COLLATOR,
            CASE_INSENSITIVE_COLLATOR,
            DEP_CONSTS,
            DEPENDENCY_METHODS,
            DEPENDENCY_EVENTS,
            isComponent,
            isComponentInitializable,
            isComponentDisposable
        } = dependencyFunctions;

    const OMITTED = lock( ["id", "name", "initialized", "clone", "init", "dispose", "equals", "compareTo"] );

    const DEPENDENCY_CLASS_NAMES = ["Dependency", "RegisteredDependency"];

    const isDependency = function( pClassName )
    {
        if ( isString( pClassName ) )
        {
            const name = asString( pClassName, true );
            return DEPENDENCY_CLASS_NAMES.includes( name ) || name.endsWith( DEPENDENCY_CLASS_NAMES[0] );
        }

        if ( isNonNullObject( pClassName ) )
        {
            return isDependency( getClassName( pClassName ) );
        }

        if ( isFunction( pClassName ) )
        {
            return isDependency( asString( pClassName?.name || getClassName( pClassName ), true ) );
        }

        if ( isClass( pClassName ) )
        {
            return isDependency( asString( getClassName( pClassName ), true ) || asString( pClassName, true ) );
        }

        return false;
    };

    /**
     * Computes or returns a component's registry ID.
     *
     * @param pComponent
     * @returns {*|(function(): *)|(function(): String)|string|(function(): (*))|(function(): *)|(function(): *)|string}
     */
    const computeComponentId = function( pComponent )
    {
        return pComponent?.id || pComponent?.componentId || pComponent?.instanceId;
    };

    /**
     * Computes or returns a component's name
     *
     * @param pComponent
     *
     * @returns {*|(function(): *)|(function(): String)|string}
     */
    const computeComponentName = function( pComponent )
    {
        let name = asString( (pComponent?.name || pComponent?.componentName), true );

        return asString( asString( name, true ) || getClassName( pComponent ) || computeComponentId( pComponent ) );
    };


    /**
     * This class allows any object to be treated as a component.
     *
     * This uses the common adapter pattern with delegation.
     *
     * Allows the use of third-party components or other classes/objects
     * for which we cannot or would rather not alter the source code.
     *
     * @class
     */
    class ComponentAdapter
    {
        /**
         * The object to be treated as a component
         */
        #object = {};

        /**
         * Indicates whether this component is ready for use.
         * Some components need to establish database connection(s),
         * authenticate with a third-party API,
         * open file(s), or otherwise prepare to accept messages (a.k.a. execute methods)
         *
         * @type {boolean}
         */
        #initialized = false;
        #disposed = false;

        /**
         * The method to invoke on the wrapped object to initialize it.
         * This is optional or can be a no_op if no initialization is required.
         */
        #initMethod;

        /**
         * The method to invoke on the wrapped object to dispose of it.
         * This is optional or can be a no_op if no resources need to be released.
         */
        #disposeMethod;

        #componentId;
        #componentName;

        /**
         * Constructs an instance of the class with the provided object,
         * initialization method, and disposal method.
         *
         * @param {Object|null} pObject - The object to be wrapped and manipulated.
         *                                If not provided, an empty object will be used.
         *
         * @param {Function|string|null} pInitMethod - An initialization method,
         *                                             which can be a function,
         *                                             a string representing a method name of the object,
         *                                             or null. If null, a no-op function is used.
         *
         * @param {Function|string|null} pDisposeMethod - A disposal method,
         *                                                which can be a function,
         *                                                a string representing a method name of the object,
         *                                                or null. If null, a no-op function is used.
         * @constructor
         */
        constructor( pObject = {}, pInitMethod = pObject?.init, pDisposeMethod = pObject?.dispose )
        {
            this.#object = this.#resolveObject( pObject );

            this.#componentId = computeComponentId( this.#object ?? {} );
            this.#componentName = computeComponentName( this.#object ?? {} );

            this.#initMethod = this.#resolveInitMethod( pInitMethod, this.#object );
            this.#disposeMethod = this.#resolveDisposeMethod( pDisposeMethod, this.#object );

            this.#initialized = !!this.#object?.initialized;
            this.#disposed = false;

            attempt( () => delegateTo( this, (this.#object ?? {}) ), ["init", "dispose"] );
        }

        /**
         * Used when a function is passed as the 'component'
         * Wraps the functionality in an object with a method with the function name
         * or "execute" if the function is anonymous.
         *
         * @param pObject
         * @returns {null}
         */
        #buildObjectForFunction( pObject )
        {
            let obj = null;

            if ( isFunction( pObject ) )
            {
                if ( isClass( pObject ) )
                {
                    attempt( () => obj = new pObject() );
                    if ( isNonNullObject( obj ) )
                    {
                        return obj;
                    }
                }

                obj = {};

                const name = pObject.name || getFunctionName( pObject ) || "execute";

                obj[name] = pObject.bind( obj );
            }

            return obj;
        }

        #isDependency( pClassName )
        {
            return isDependency( pClassName ?? getClassName( this.#object ) );
        }

        /**
         * Returns the object to be decorated and treated as a component.
         * If a function is specified, the function is made the method of an object and the object is returned.
         *
         * @param {Object|Function} pObject the object or function ot evaluate or convert to an object
         *
         * @returns {Object} an object that will be wrapped in this instance allowing it to be treated as a component.
         */
        #resolveObject( pObject )
        {
            // get or build an object from the argument
            let obj = isNonNullObject( pObject ) ? pObject : isFunction( pObject ) ? this.#buildObjectForFunction( pObject ) : asObject( pObject ?? {} );

            // inspect the class of the object passed
            let className = asString( getClassName( obj ?? {} ), true );

            let iterationCap = new IterationCap( 5 );

            // if the object passed is already wrapped in a Dependency,
            // we unwrap it and re-wrap it in this instance
            while ( isNonNullObject( obj ) && (obj instanceof this.constructor || this.#isDependency( className )) && !iterationCap.reached )
            {
                obj = readProperty( obj, "component", "object" ) ?? obj;
                className = asString( getClassName( obj ?? {} ), true );
            }

            // return the underlying component or object or a default empty object
            return obj ?? (isNonNullObject( pObject ) ? pObject : isFunction( pObject ) ? this.#buildObjectForFunction( pObject ) : asObject( pObject ?? {} )) ?? {};
        }

        /**
         * Bind the init function to the underlying object and wrap it in a function bound to this instance.
         *
         * @param pInitMethod
         * @param pObject
         * @returns {any}
         */
        #resolveInitMethod( pInitMethod, pObject )
        {
            // the ComponentAdaptor
            const me = this;

            // the underlying object
            const obj = asObject( isNonNullObject( pObject ) ? pObject : this.#object );

            // the function/method to use for initialization
            let method = isFunction( pInitMethod ) ? pInitMethod : (isString( pInitMethod ) ? (obj[pInitMethod] ?? obj?.init ?? obj?.connect) : (obj?.init ?? obj?.connect));

            // search for the method if the specified argument was not a function or the name of a method of the specified object
            method = isFunction( method ) ? method : DEPENDENCY_METHODS.INIT.find( e => isFunction( obj[e] ) );

            method = isFunction( method ) ? method : isString( method ) ? obj[method] : (async function( ...pArgs ) { attemptSilent( () => obj.initialized = true ); });

            // if no method is found, assign a no_op function to toggle an initialized property
            // note that we "attempt" the property toggle in case the object on which it is called is immutable or declares a private #initialized property that is read-only
            method = isFunction( method ) ? method : (async function( ...pArgs ) { attemptSilent( () => obj.initialized = true ); });

            // construct a new method bound to this that calls the init method on the underlying object
            return ((async function( ...pArgs )
            {
                // bind the method to the underlying object so that 'this' is the object
                await method.bind( obj ).call( obj, ...pArgs );

                me.#initialized = true;

                // return this, the ComponentAdapter
                return this;

            }).bind( this ));
        }

        /**
         * Bind the disposal function to the underlying object and wrap it in a function bound to this instance.
         *
         * @param pDisposeMethod
         * @param pObject
         * @returns {any}
         */
        #resolveDisposeMethod( pDisposeMethod, pObject )
        {
            // the ComponentAdapter
            const me = this;

            // the underlying object
            const obj = asObject( isNonNullObject( pObject ) ? pObject : this.#object );

            // the function/method to use for disposal
            let method = isFunction( pDisposeMethod ) ? pDisposeMethod : (isString( pDisposeMethod ) ? (obj[pDisposeMethod] ?? obj?.dispose ?? obj?.disconnect) : (obj?.dispose ?? obj?.disconnect));

            // search for the method if the specified argument was not a function or the name of a method of the specified object
            method = isFunction( method ) ? method : DEPENDENCY_METHODS.DISPOSE.find( e => isFunction( obj[e] ) );

            method = isFunction( method ) ? method : isString( method ) ? obj[method] : (async function( ...pArgs ) { attemptSilent( () => obj.initialized = false ); });

            // if no method is found, assign a no_op function to toggle an initialized property
            // note that we "attempt" the property toggle in case the object on which it is called is immutable or declares a private #initialized property that is read-only
            method = isFunction( method ) ? method : (async function( ...pArgs ) { attemptSilent( () => obj.initialized = false ); });

            // construct a new method bound to this that calls the dispose method on the underlying object
            return ((async function( ...pArgs )
            {
                // bind the method to the underlying object so that 'this' is the object
                await method.bind( obj ).call( obj, ...pArgs );

                me.#initialized = false;

                // return this, the ComponentAdapter
                return this;

            }).bind( this ));
        }

        get initialized()
        {
            return (this.#initialized || this.#object?.initialized || !isComponentInitializable( this.#object )) && !this.#disposed;
        }

        isDisposed()
        {
            return !!this.#disposed;
        }

        /**
         * Returns this constructor
         * @returns {ComponentAdapter}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Returns a new instance of this class,
         * holding a clone of its wrapped object (if that object isCloneable).
         *
         * Note that if the underlying object is not cloneable, the returned object is a shallow clone.
         *
         * @returns {ComponentAdapter}
         */
        clone()
        {
            if ( isFunction( this.#object?.clone ) )
            {
                const clone = this.#object.clone();

                return new this.constructor[Symbol.species]( clone, clone?.init, clone?.dispose );
            }

            return new this.constructor[Symbol.species]( this.#object, this.#object?.init, this.#object?.dispose );
        }

        /**
         * Returns the class (constructor or prototype) of the underlying/wrapped object.
         *
         * @returns {*}
         */
        get componentClass()
        {
            return getClass( this.#object );
        }

        /**
         * Returns the unique ID of the underlying component.
         *
         * @returns {*|(function(): *)|(function(): String)|string}
         */
        get componentId()
        {
            return this.#componentId || computeComponentId( this.#object ?? {} );
        }

        /**
         * Returns the name of the underlying component
         * @returns {*|(function(): *)|(function(): String)|string}
         */
        get componentName()
        {
            return asString( this.#componentName, true ) || computeComponentName( this.#object ?? {} );
        }

        get id()
        {
            return this.#object?.id || this.componentId;
        }

        get name()
        {
            return asString( this.#object?.name, true ) || this.componentName;
        }

        /**
         * Initializes the underlying object, if possible.
         *
         * @param {...*} [pArgs=[]] Any arguments the object requires to be initialized
         *
         * @returns {Promise<ComponentAdapter>} this instance, now with an initialized wrapped object
         *
         * @throws DependencyInitializationError if the object cannot be initialized
         */
        async init( ...pArgs )
        {
            if ( !this.initialized || this.isDisposed() )
            {
                let candidates = [...(DEPENDENCY_METHODS.INIT)].map( e => this.#object[e] ).filter( isFunction );

                candidates = [this.#initMethod, ...(asArray( candidates ))].filter( isFunction );

                for( let method of candidates )
                {
                    if ( isFunction( method ) )
                    {
                        await asyncAttempt( async() => await ((isAsyncFunction( method ) ? await method.bind( this.#object ).call( this.#object, ...pArgs ) : method.bind( this.#object ).call( this.#object, ...pArgs ))) );
                        if ( isNull( getLastError() ) )
                        {
                            this.#initialized = true;
                            break;
                        }
                    }
                }
            }

            this.#initialized = this.#initialized || !isComponentInitializable( this.#object );

            if ( !this.initialized && isComponentInitializable( this.#object ) )
            {
                throw new DependencyInitializationError( `Failed to initialize component, ${this.componentName}::${this.componentId}, an instance of ${getClassName( this.#object ?? this.componentClass )}` );
            }

            this.#disposed = !this.#initialized;

            return this;
        }

        async dispose()
        {
            if ( this.#initialized || this.#object?.initialized )
            {
                let candidates = [...(DEPENDENCY_METHODS.DISPOSE)].map( e => this.#object[e] ).filter( isFunction );

                candidates = [this.#disposeMethod, ...(asArray( candidates ))].filter( isFunction );

                for( let method of candidates )
                {
                    if ( isFunction( method ) )
                    {
                        await asyncAttempt( async() => await ((isAsyncFunction( method ) ? await method.bind( this.#object ).call( this.#object ) : method.bind( this.#object ).call( this.#object ))) );
                        if ( isNull( getLastError() ) )
                        {
                            this.#initialized = false;
                            break;
                        }
                    }
                }

                if ( this.#initialized && $ln( candidates ) < 1 )
                {
                    this.#initialized = false;
                }
            }

            this.#initialized = this.#initialized && isComponentDisposable( this.#object );

            // if we're still initialized, that is, not disposed, we warn, rather than throw an error
            if ( this.#initialized && isComponentDisposable( this.#object ) )
            {
                // use the most suitable logger found; if the underlying object provides a logger (via delegation), we use that
                // noinspection JSUnresolvedReference
                let logger = ToolBocksModule.resolveLogger( this.logger ?? this.#object?.logger, this.#object.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER, console );
                attemptSilent( () => (logger || console).warn( `Failed to dispose component, ${this.componentName}::${this.componentId}, an instance of ${getClassName( this.#object ?? this.componentClass )}`, `Last Error: ${getLastError()}` ) );
            }

            this.#disposed = !this.#initialized;

            return this;
        }
    }

    /**
     * This constant is a stand-in for a missing or optional component
     * @type {ComponentAdapter}
     */
    const MISSING_COMPONENT = new ComponentAdapter();

    // noinspection JSUnresolvedReference
    /**
     * This class is used to wrap and proxy components other classes need.
     *
     * Defines init, dispose, and clone methods,
     * whose behavior may vary depending on the wrapped/proxied component.
     *
     * If a component is already initialized, for example,
     * the init method may be a no-op that just returns this instance.
     *
     * The dispose method may be inapplicable, as well, but by wrapping components in this class,
     * classes or methods that use this class can safely call init, dispose, or clone.
     *
     * Subclasses may add additional methods or add behavior beyond these.
     *
     * Consumers of instances of a Dependency can either unwrap the component
     * and use its methods directly
     * or treat the Dependency instance as if it is an instance of the component.
     *
     * This is because each Dependency instance delegates
     * method invocations and property accessors
     * to the wrapped component.
     * @see delegateTo
     *
     * @class
     */
    class Dependency
    {
        /**
         * The ID for this instance,
         * corresponding to a value in DependencyConstants
         */
        #id;

        /**
         * The name of this instance
         * by which a dependent object will expect to find it
         * in a collection (or instance of Dependencies)
         */
        #name;

        /**
         * Indicates whether this dependency is ready to use
         * @type {boolean}
         */
        #initialized = false;
        #disposed = false;

        /**
         * The component that fulfills this dependency
         * @type {Object}
         */
        #component;

        #args;

        /**
         * Constructs an instance of the class.
         *
         * @param {Object} pComponent - The component instance that provides the dependent behavior.
         *
         * @param {String} [pName] a name by which a consumer can expect to find this instance
         *
         * @param {String} [pId] the key corresponding to the entry in DependencyConstants for components of this kind
         *
         * @param pArgs
         * @return {Object} A newly constructed instance of the class.
         */
        constructor( pComponent, pName, pId, ...pArgs )
        {
            this.#component = this.#resolveComponent( pComponent );

            this.#name = asString( pName, true ) || computeComponentName( this.#component );

            this.#id = asString( pId, true ) || computeComponentId( this.#component );

            this.#initialized = (true === this.#component?.initialized);

            this.#args = asArray( pArgs ?? [] );

            attempt( () => delegateTo( this, this.#component, OMITTED ) );
        }

        /**
         * Private method used to unwrap a dependency
         * if the component specified is already wrapped in this class.
         *
         * @param pObject
         *
         * @returns {boolean|*}
         */
        #isDependency( pObject )
        {
            return isNonNullObject( pObject ) &&
                   ((pObject instanceof this.constructor) || isSubclassOf( pObject, this ) || isDependency( getClassName( pObject ) ));
        }

        /**
         * Returns the component this Dependency represents and to which method calls are delegated.
         * This method prevents wrapping the same Dependency within itself,
         * simplifying other code, which would otherwise have to check for this condition.
         *
         * @param {Object} pComponent - The component to return.
         * @return {Object} - The component or a MISSING_COMPONENT constant if the object is null or a reference to 'this' instance.
         */
        #resolveComponent( pComponent )
        {
            let object = isNonNullObject( pComponent ?? this.#component ) ? (pComponent ?? this.#component) : (isFunction( pComponent ?? this.#component ) ? new ComponentAdapter( pComponent ?? this.#component ) : asObject( pComponent ?? this.#component ?? {} ));

            const iterationCap = new IterationCap( 5 );

            while ( isNonNullObject( object ) && this.#isDependency( object ) && !iterationCap.reached )
            {
                object = readProperty( object, "component", "object" ) ?? object;
            }

            object = isComponent( object ) ? object : new ComponentAdapter( object );

            object = isNonNullObject( object ) && (this !== object) ? object : MISSING_COMPONENT;

            return ((isComponent( object ) ? object : new ComponentAdapter( object, object?.init ?? object?.connect, object?.dispose ?? object?.disconnect ))) ?? this.#component;
        }

        get id()
        {
            return this.#id || this.#component?.id || this.#component?.componentId || computeComponentId( this.#component );
        }

        get name()
        {
            return this.#name || this.#component?.name || this.#component?.componentName || computeComponentName( this.#component );
        }

        get args()
        {
            return [...(asArray( this.#args ?? [] ))].map( e => isNull( e ) ? null : isCloneable( e ) ? lock( attempt( () => e.clone() ) ) : lock( e ) );
        }

        /**
         * A static getter for the `Symbol.species` property.
         * This property is used to determine the constructor used
         * when creating derived objects in methods like `map`, `filter`, 'clone', or similar cases.
         *
         * @return {Function} The constructor of the current class.
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Returns true if this instance or its proxied component is ready to use.
         *
         * @returns {boolean} true if this instance or its proxied component is ready to use
         */
        get initialized()
        {
            return (isComponentInitializable( this.#component ) && (this.#component !== this)) ?
                   (this.#component && (this.#component !== this) && this.#component?.initialized) :
                   (true === this.#initialized);

            // return (true === this.#initialized || (this.#component && (this.#component !== this) && this.#component?.initialized));
        }

        isDisposed()
        {
            return !this.initialized || (isComponentDisposable( this.#component ) && !this.#component?.initialized);
        }

        /**
         * Provides direct access to the wrapped component.
         * Can be a nested Dependency if that makes sense for a scenario,
         * but the returned object must be capable of fulfilling the expected functionality.
         *
         * @returns {Object|Dependency}
         */
        get component()
        {
            return this.#resolveComponent( this.#component );
        }

        /**
         * Returns the class of the component represented by (and wrapped in) this Dependency.
         *
         * @returns {Function} the class of the component represented by (and wrapped in) this Dependency.
         */
        get componentClass()
        {
            let klass = getClass( this.component );

            if ( isClass( klass ) && (klass === ComponentAdapter || getClassName( klass ) === "ComponentAdapter") )
            {
                // There is no infinite loop here,
                // because we always unwrap a Dependency
                // in the ComponentAdapter constructor
                klass = this.component.componentClass;
            }

            return klass;
        }

        /**
         * Returns true if this instance or its component
         * can be substituted for an instance of the specified class.
         *
         * @param {Function} pClass the class whose properties and methods
         *                          must be implemented by this instance or its component
         *                          to be substitutable for an instance of that class.
         *
         * @returns {boolean} true if this instance or its component
         *                    can be substituted for an instance of the specified class
         */
        implementsClass( pClass )
        {
            if ( isClass( pClass ) )
            {
                return (this.componentClass === pClass || isSubclassOf( this.componentClass, pClass ))
                       || (this.component instanceof pClass || isSubclassOf( getClass( this.component ), pClass ))
                       || implementsInterface( (this.component || this), pClass )
                       || implementsInterface( this, pClass );
            }

            if ( isNonNullObject( pClass ) )
            {
                if ( isArray( pClass ) )
                {
                    let methods = asArray( pClass ).filter( isFunction );
                    return $ln( methods ) > 0
                           && (implementsMethods( (this.component || this), ...methods )
                               || (implementsMethods( this, ...methods )));
                }

                let klass = getClass( pClass );
                if ( isClass( klass ) )
                {
                    return this.implementsClass( klass );
                }
            }

            return false;
        }

        /**
         * Returns true if this instance or its component implements all the specified methods.
         *
         * @param {...function} pMethods one or more methods this instance might implement
         *
         * @returns {boolean} true if this instance or its component implements all the specified methods
         */
        implementsMethods( ...pMethods )
        {
            return implementsMethods( this.component, ...pMethods ) || implementsMethods( this, ...pMethods );
        }

        /**
         * Creates and returns a new instance that is a clone of the current object.
         * The new instance is constructed using the species of the current object's constructor.
         *
         * @return {Object} A cloned instance of this object
         *                  with the same id, name,
         *                  and a clone of its component (if its component is clonable)
         */
        clone()
        {
            let object = this.component;

            object = (this === object) ? MISSING_COMPONENT : object;

            object = attempt( () => isCloneable( object ) ? object.clone() : object );

            return new this.constructor[Symbol.species]( object, this.name, this.id, ...(asArray( this.args ?? [] )) );
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
                return OBJECT_REGISTRY.getGuid( this.component ?? this ) || OBJECT_REGISTRY.getGuid( this );
            }
            return asString( Date.now(), true );
        }

        toString()
        {
            return `${getClassName( this )}::${getClassName( this.component ?? this.componentClass )}::${getClassName( this.componentClass ?? this.component )}::${this.instanceId}`;
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        [Symbol.toStringTag]()
        {
            return `[object ${getClassName( this )}::${getClassName( this.componentClass ?? this.component ) || asString( this.componentClass )}]`;
        }

        /**
         * Makes this instance and its wrapped/proxied component ready to use.
         * This method is idempotent. If this instance is already initialized, the instance if just returned.
         * Subclasses that override this method must adhere to this expectation
         * .
         * @param {...*} [pArgs=null] zero or more arguments to pass to the init method of the wrapped component
         *
         * @returns {Promise<Dependency>} a Promise that fulfills with the initialized instance
         */
        async init( ...pArgs )
        {
            if ( this.initialized && !this.#disposed )
            {
                return this;
            }

            let component = this.component;

            if ( this === component )
            {
                this.#initialized = true;
                this.#disposed = false;
                return this;
            }

            let candidates = [...(DEPENDENCY_METHODS.INIT)].map( e => component[e] ).filter( isFunction );

            if ( $ln( candidates ) <= 0 && !isComponentInitializable( component ) )
            {
                this.#initialized = true;
                this.#disposed = false;
            }
            else
            {
                while ( !this.initialized && $ln( candidates ) > 0 )
                {
                    let method = candidates.shift();

                    if ( isFunction( method ) )
                    {
                        if ( isAsyncFunction( method ) )
                        {
                            component = await asyncAttempt( async() => await method.bind( component ).call( component, ...pArgs ) ) ?? component;
                        }
                        else
                        {
                            component = attempt( () => method.bind( component ).call( component, ...pArgs ) ) ?? component;
                        }

                        this.#initialized = this.#initialized || component?.initialized || component?.opened || component?.started || component?.connected || component?.executed;
                        this.#disposed = !this.#initialized;
                    }
                }
                this.#initialized = this.#initialized || !isComponentInitializable( component );
                this.#disposed = !this.#initialized;
            }

            return this;
        }

        /**
         * Calls the 'dispose' (or dispose-like) method on the wrapped/proxied component
         * and marks this instance as not initialized.
         *
         * This instance has to be re-initialized before it or its component can be used.
         * In some cases, a disposed dependency may not be re-initializable,
         * in which case, a new instance is required.
         * (A subclass implementation can opt to return null rather than a 'dead-end' instance)
         *
         * This method is idempotent.
         * If this instance has already been disposed, the instance (or null) is just returned.
         * Subclasses that override this method must adhere to this expectation
         *
         * @returns {Promise<Dependency|null>} Returns this instance, no longer ready to use
         *                                     or null if once disposed, this instance cannot be re-initialized
         */
        async dispose()
        {
            if ( !this.initialized || this.#disposed )
            {
                return this;
            }

            let component = this.component;

            if ( this === component )
            {
                this.#initialized = false;
                this.#disposed = true;
                return this;
            }

            if ( isNull( component ) || !component?.initialized || !isComponentDisposable( component ) )
            {
                this.#initialized = false;
                this.#disposed = true;
                return !isNull( component ) ? this : null;
            }

            let candidates = [...(DEPENDENCY_METHODS.DISPOSE)].map( e => component[e] ).filter( isFunction );

            if ( $ln( candidates ) <= 0 && !isComponentDisposable( component ) )
            {
                this.#initialized = false;
                this.#disposed = true;
            }
            else
            {
                while ( this.initialized && $ln( candidates ) > 0 )
                {
                    let method = candidates.shift();

                    if ( isFunction( method ) )
                    {
                        if ( isAsyncFunction( method ) )
                        {
                            component = await asyncAttempt( async() => await method.bind( component ).call( component ) ) ?? component;
                        }
                        else
                        {
                            component = attempt( () => method.bind( component ).call( component ) ) ?? component;
                        }

                        this.#initialized = isComponentDisposable( component ) && (component?.initialized || component?.opened || component?.started || component?.connected);
                    }
                }
            }

            this.#disposed = this.#disposed || !this.initialized;

            return this;
        }

        /**
         * Returns true if the specified object is semantically the same as this instance.
         * @param {object} pOther the object to which to compare this instance for semantic equality
         * @returns {boolean} true if the specified object is semantically the same as this instance
         */
        equals( pOther )
        {
            if ( isNonNullObject( pOther ) && pOther instanceof this.constructor )
            {
                if ( 0 !== this.compareTo( pOther ) )
                {
                    return false;
                }

                let registry = OBJECT_REGISTRY || ToolBocksModule.OBJECT_REGISTRY || ObjectRegistry.DEFAULT_INSTANCE;
                if ( registry )
                {
                    return registry.similar( pOther.component, this.component );
                }
            }
            else if ( isString( pOther ) && isJsonObject( pOther ) )
            {
                return this.equals( asObject( pOther ?? {} ) );
            }
            return false;
        }

        // noinspection GrazieStyle
        /**
         * Returns a value less than, greater than, or equal to zero,
         * to indicate whether this instance should appear or occur
         * before, after, or at the same position as the specified object.
         *
         * @param {object} pOther the object to compare to this instance
         *
         * @returns {number} returns -1 if this instance should occur or appear before the other object,
         *                            1 if this instance should occur or appear after the other object,
         *                            0 if this instance and the other object can occur or appear in any order
         *                            with respect to one another
         */
        compareTo( pOther )
        {
            if ( isNonNullObject( pOther ) || isJsonObject( pOther ) )
            {
                const other = dereference( asObject( pOther ) );

                let comp = 0;

                if ( 0 === comp && isFunction( this.component?.compareTo ) )
                {
                    comp = this.component.compareTo( other?.component );
                }

                if ( 0 === comp && isFunction( other.component?.compareTo ) )
                {
                    comp = -(other.component.compareTo( this.component ));
                }

                if ( 0 === comp )
                {
                    comp = CASE_INSENSITIVE_COLLATOR.compare( this.name, other.name );
                }

                if ( 0 === comp )
                {
                    if ( isNumeric( this.id ) )
                    {
                        if ( isNumeric( other?.id ) )
                        {
                            comp = asInt( this.id ) - asInt( other.id );
                        }
                        else
                        {
                            comp = -1;
                        }
                    }
                    else
                    {
                        comp = CASE_SENSITIVE_COLLATOR.compare( asString( this.id, true ), asString( other.id, true ) );
                    }
                }

                if ( 0 === comp )
                {
                    comp = (this.initialized && !other.initialized) ? -1 : ( !this.initialized && other.initialized) ? 1 : 0;
                }

                return comp;
            }
            else if ( isString( pOther ) && isJsonObject( pOther ) )
            {
                if ( isJsonObject( pOther ) )
                {
                    return this.compareTo( asObject( pOther ?? {} ) );
                }

                return CASE_SENSITIVE_COLLATOR.compare( asString( this.name || this.id, true ), asString( pOther, true ) );
            }

            return -1;
        }

        toLiteral()
        {
            const obj = {};

            obj.id = this.id;
            obj.name = this.name;

            obj.component = (isFunction( this.component?.toLiteral ) ? this.component?.toLiteral() : attempt( () => toObjectLiteral( this.component ?? {} ) ));

            obj.initialized = this.initialized;
            obj.disposed = this.#disposed;

            obj.args = [...(asArray( this.args ?? [] ))].map( e => (isNonNullObject( e ) ? (isFunction( e?.toLiteral ) ? attempt( () => e.toLiteral() ) : attempt( () => toObjectLiteral( e ) )) : e) );

            const entries = objectEntries( this );

            if ( entries && $ln( entries ) )
            {
                const PREDEFINED = ["args", "initialized", "disposed", "component", "name", "id"];

                entries.forEach( entry =>
                                 {
                                     const key = asString( ObjectEntry.getKey( entry ), true );

                                     if ( !PREDEFINED.includes( key ) )
                                     {
                                         const value = ObjectEntry.getValue( entry );

                                         if ( isNonNullObject( value ) )
                                         {
                                             attempt( () => obj[key] = (obj[key] ?? (attempt( () => toObjectLiteral( value ) ) || asString( value )) ?? asString( value ) ?? asString( obj[key] ) ?? _mt) );
                                         }
                                         else if ( isNonNullValue( value ) )
                                         {
                                             attempt( () => obj[key] = (obj[key] ?? (value ?? _mt)) );
                                         }
                                     }
                                 } );
            }

            return lock( obj );
        }

        toJSON()
        {
            return asJson( this.toLiteral() );
        }
    }

    Dependency.CONSTANTS = lock( DEP_CONSTS );
    Dependency.METHODS = lock( DEPENDENCY_METHODS );
    Dependency.EVENTS = lock( DEPENDENCY_EVENTS );
    Dependency.ERRORS = lock( asArray( objectValues( dependencyErrors ) ?? [] ).filter( e => isSubclassOf( e, Error ) ) );

    Dependency.isOfClass = function( pObject, pClass )
    {
        if ( isNull( pObject ) )
        {
            return false;
        }

        if ( !(isObject( pObject ) || isClass( pObject )) )
        {
            return false;
        }

        return isNull( pClass ) || !isClass( pClass )
               || pObject instanceof pClass
               || pObject === pClass
               || isSubclassOf( pObject, pClass )
               || pObject.component instanceof pClass
               || (pClass === pObject.componentClass)
               || implementsInterface( (pObject.component ?? pObject), pClass )
               || implementsInterface( pObject, pClass );
    };

    /**
     * Returns true if the specified object can be treated as if it is an instance of Dependency
     *
     * @param {Object} pObject - The object to be evaluated.
     *
     * @param {function} [pOfClass=null] An optional argument to require
     *                                   that the evaluated object's component
     *                                   or the object itself is an instance of a specific class
     *                                   or one of its subclasses
     *
     * @returns {boolean} Returns true if the object can be treated as if it is an instance of Dependency
     */
    Dependency.isDependency = function( pObject, pOfClass = null )
    {
        if ( isNonNullObject( pObject ) )
        {
            if ( pObject instanceof Dependency || isSubclassOf( pObject, Dependency ) )
            {
                return Dependency.isOfClass( pObject, pOfClass );
            }
            else
            {
                let hasInitMethod = false;
                let hasDisposeMethod = false;

                for( let name of DEPENDENCY_METHODS.INIT )
                {
                    if ( isFunction( pObject[name] ) )
                    {
                        hasInitMethod = true;
                        break;
                    }
                }

                for( let name of DEPENDENCY_METHODS.DISPOSE )
                {
                    if ( isFunction( pObject[name] ) )
                    {
                        hasDisposeMethod = true;
                        break;
                    }
                }

                if ( hasInitMethod && hasDisposeMethod )
                {
                    if ( isNonNullObject( pObject.component ) )
                    {
                        if ( !isNull( pOfClass ) && isClass( pOfClass ) )
                        {
                            return Dependency.isOfClass( pObject, pOfClass );
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    };

    Dependency.from = function( pComponent,
                                pName = (pComponent?.name || pComponent?.componentName || getClassName( pComponent ) || _mt),
                                pId = (pComponent?.id || pComponent?.componentId || _mt),
                                ...pArgs )
    {
        if ( isNonNullObject( pComponent ) || isFunction( pComponent ) )
        {
            const identifier = pId || pComponent?.id || pComponent?.componentId || pComponent?.instanceId || asString( Date.now() );

            const name = pName || pComponent?.name || pComponent?.componentName || getClassName( pComponent?.component ?? pComponent ) || identifier;

            if ( pComponent instanceof Dependency )
            {
                if ( (identifier !== (pComponent.id || pComponent?.componentId)) || (name !== (pComponent?.name || pComponent?.componentName)) )
                {
                    return new Dependency( pComponent?.component ?? pComponent, name, identifier, ...pArgs );
                }
                return pComponent;
            }

            return new Dependency( (pComponent?.component ?? pComponent), name, identifier, ...pArgs );
        }

        throw new IllegalArgumentError( `The component must be an object, class, or closure; received ${(typeof pComponent)}`,
                                        {
                                            detail: pComponent,
                                            src: Dependency
                                        } );
    };

    Dependency.COMPARATOR = ( a, b ) =>
    {
        const aa = Dependency.from( dereference( a ) );
        const bb = Dependency.from( dereference( b ) );

        return aa.compareTo( bb ) || -(bb.compareTo( aa ));
    };

    const mod =
        lock( {
                  DEP_CONSTS,
                  ComponentAdapter,
                  Dependency,
                  isDependency: Dependency.isDependency
              } );

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
