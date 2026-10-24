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

    const jsonUtils = require( "@toolbocks/json" );

    const dependencyConstants = require( "./DependencyConstant.js" );

    // destructure the individual utilities module from the imported ToolBocks core library
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, guidUtils } = core;

    const { ToolBocksModule, attempt, dereference, readProperty, lock, $ln } = moduleUtils;

    const { _ud, _mt, _underscore, _comma } = constants;

    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isArray,
            isWeakRef,
            isString,
            isBoolean,
            isFunction,
            isClass,
            isUserDefinedClass,
            getClass,
            getClassName,
            isSubclassOf,
            isSubclassOfName,
            toObjectLiteral
        } = typeUtils;

    const
        {
            asString,
            asInt,
            toBool,
            toCamelCase,
            lcase,
            ucase,
            isBlank,
            isJson,
            isJsonObject,
            isJsonArray
        } = stringUtils;

    const { asArray, replaceElements } = arrayUtils;

    const { asObject, asJson } = jsonUtils;

    const { DEP_CONSTS, DEP_CONSTS_BY_ID, DependencyConstant } = dependencyConstants;

    const DEFAULT_VERSION = "0.0.0";

    // used for string comparisons
    const CASE_INSENSITIVE_COLLATOR = new Intl.Collator( ["en", "es"], { sensitivity: "base", numeric: true } );

    function isObjOrJson( pObject )
    {
        return isNonNullObject( pObject ) || (isString( pObject ) && (isJsonObject( pObject ) || isJsonArray( pObject )));
    }

    function resolveComponentClassName( pComponentClass, pComponent )
    {
        let componentClassName = asString( getClassName( pComponentClass ?? pComponent?.component ?? pComponent ), true );

        componentClassName = asString( componentClassName || getClassName( pComponent?.component ?? pComponent ), true );

        return asString( componentClassName || getClassName( pComponent ), true );
    }

    function isCompatibleClass( pComponent, pBaseClass, pDefaultInstance )
    {
        const component = isWeakRef( pComponent ) ? dereference( pComponent ) : pComponent;

        if ( isNull( component ) || !(isObject( component ) || isClass( component ) || isFunction( component )) )
        {
            return false;
        }

        const componentClass = component?.componentClass ?? getClass( component?.component ?? component ) ?? getClass( component );

        const defaultInst = !isNull( pDefaultInstance ) ? (isClass( pDefaultInstance ) || isNonNullObject( pDefaultInstance ) ? pDefaultInstance : this.defaultInstance) : this.defaultInstance;

        const baseKlass = pBaseClass ?? (!isNull( defaultInst ) ? getClass( defaultInst ) : null) ?? this.baseClass;

        if ( isNull( baseKlass ) || (isString( baseKlass ) && isBlank( baseKlass )) )
        {
            return true;
        }

        if ( isUserDefinedClass( baseKlass ) )
        {
            return ((componentClass === baseKlass) ||
                    (getClassName( componentClass ?? component?.component ?? component ) === getClassName( baseKlass )) ||
                    (isSubclassOf( componentClass, baseKlass )) ||
                    (isSubclassOf( (component?.component ?? component), baseKlass )));
        }

        if ( isString( baseKlass ) && !isBlank( baseKlass ) )
        {
            let componentClassName = attempt( () => resolveComponentClassName( componentClass, component ) );

            const baseKlassName = asString( baseKlass, true ) || !isNull( defaultInst ) ? asString( getClassName( defaultInst ), true ) : _mt;

            if ( isBlank( baseKlassName ) ||
                 (componentClassName === baseKlassName
                 || isSubclassOfName( componentClass, baseKlassName ))
                 || isSubclassOfName( component?.component ?? component, baseKlassName ) )
            {
                return true;
            }
        }

        return (isNull( baseKlass ) || (isString( baseKlass ) && isBlank( baseKlass )));
    }

    const formatArgs = e => (isNonNullObject( e ) || isClass( e )) ? asString( getClassName( e ), true ) || asString( e, true ) : asString( e, true );

    /**
     * This class is used to provide options to a DependencyDescriptor.
     * This allows us to 'flavor' dependencies of a certain type,
     * to return customized instances where necessary
     */
    class DependencyDescriptorOptions
    {
        /**
         * Defines the least specific subclass the DependentObject
         * requires to satisfy the dependency
         */
        #baseClass;

        /**
         * Indicates whether the DependentObject requires a new instance
         * or can reuse an existing/cached component
         */
        #requiresNewInstance;

        /**
         * When provided, defines an instance to use
         * if no instance can be constructed by the Registry.
         * It's a fallback if provided.
         */
        #defaultInstance;

        #version = _mt;
        #versionIntValue = 0;

        /**
         * When provided, this is an array of arguments to pass to the constructor
         * after passing the Dependencies object.
         */
        #args;

        constructor( pRequiresNewInstance = false, pVersion = _mt, pBaseClass = null, pDefaultInstance, ...pArgs )
        {
            this.#requiresNewInstance = toBool( pRequiresNewInstance );

            this.#version = asString( pVersion || _mt, true ) || _mt;
            this.#versionIntValue = ToolBocksModule.resolveVersionIntegerValue( this.#version ) || 0;

            this.#baseClass = pBaseClass ?? null;

            if ( !(isClass( this.#baseClass ) || (isString( this.#baseClass ) && !isBlank( this.#baseClass ))) )
            {
                if ( isNonNullObject( this.#baseClass ) )
                {
                    this.#baseClass = getClass( this.#baseClass ) ?? null;
                }
            }

            this.#defaultInstance = pDefaultInstance ?? null;

            this.#defaultInstance = isNull( this.#defaultInstance ) ? null : ((isClass( this.#defaultInstance ) || isNonNullObject( this.#defaultInstance )) ? this.#defaultInstance : null);

            this.#args = asArray( pArgs ?? [] );

            this.cacheKey = this.#computeKey();

            lock( this );
        }

        get requiresNewInstance()
        {
            return toBool( this.#requiresNewInstance );
        }

        get version()
        {
            return asString( this.#version, true ) || DEFAULT_VERSION;
        }

        get baseClass()
        {
            return (isClass( this.#baseClass ) || (isString( this.#baseClass ) && !isBlank( this.#baseClass ))) ?
                   this.#baseClass :
                   (isNonNullObject( this.#baseClass ) ?
                    getClass( this.#baseClass ) :
                    (isNonNullObject( this.#defaultInstance ) || isClass( this.#defaultInstance ) ? getClass( this.#defaultInstance ) : null));
        }

        get defaultInstance()
        {
            if ( isNonNullObject( this.#defaultInstance ) || isClass( this.#defaultInstance ) )
            {
                let baseKlass = this.baseClass;

                if ( isNull( baseKlass ) )
                {
                    return this.#defaultInstance;
                }

                if ( isClass( baseKlass ) )
                {
                    if ( getClass( this.#defaultInstance ) === baseKlass || isSubclassOf( this.#defaultInstance, baseKlass ) )
                    {
                        return this.#defaultInstance;
                    }
                }

                if ( (isString( baseKlass ) && !isBlank( baseKlass )) && isSubclassOfName( this.#defaultInstance, asString( baseKlass, true ) ) )
                {
                    return this.#defaultInstance;
                }
            }

            return null;
        }

        get args()
        {
            return lock( [...(asArray( this.#args || [] ))] );
        }

        isLaterThanOrEqualToVersion( pVersion )
        {
            return this.#versionIntValue >= ToolBocksModule.resolveVersionIntegerValue( pVersion );
        }

        isCompatibleVersion( pVersionedObject )
        {
            return isBlank( this.version ) || (asInt( this.#versionIntValue ) <= 0) || (ToolBocksModule.resolveVersionIntegerValue( pVersionedObject?.version ) >= asInt( this.#versionIntValue ));
        }

        toString()
        {
            return asString( this.cacheKey || computeKey( this ) || computeHash( this ), true ) || `${(getClassName( this ) || "DependencyDescriptorOptions")}::${(this.version || DEFAULT_VERSION)}` + ($ln( asArray( this.args ?? [] ) ) > 0 ? `::${asArray( this.args ?? [] ).join( _comma )}` : _mt);
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        [Symbol.toStringTag]()
        {
            return "[object " + getClassName( this ) + "]";
        }

        /**
         * Returns a unique string
         * corresponding to the relevant properties
         * of this instance, used when generating
         * a unique string and hash of a DependencyDescriptor.
         *
         * @returns {string}
         */
        #computeKey()
        {
            let s = _mt;

            if ( this.#versionIntValue > 0 )
            {
                s += `|version:${asString( this.#version || DEFAULT_VERSION, true )}`;
            }

            const base = this.baseClass;

            if ( !isNull( base ) )
            {
                if ( isClass( base ) )
                {
                    s += `|baseClass:${asString( getClassName( base ) || "~~" )}`;
                }
                else if ( isString( base ) && !isBlank( base ) )
                {
                    s += `|baseClass:${asString( base, true )}`;
                }
            }

            const defaultInstance = this.defaultInstance;

            if ( isNonNullObject( defaultInstance ) || isClass( defaultInstance ) )
            {
                s += `|default:${asString( getClassName( defaultInstance ), true )}`;
            }

            let arr = asArray( this.args ?? [] );

            if ( $ln( arr ) > 0 )
            {
                arr = attempt( () => [...arr].flat().map( formatArgs ).filter( e => !isBlank( e ) ) ) ?? arr;

                if ( $ln( arr ) > 0 )
                {
                    arr = arr.sort( ( a, b ) => CASE_INSENSITIVE_COLLATOR.compare( asString( a ), asString( b ) ) );

                    s += `|${arr.join( "|" )}`;
                }
            }

            return s;
        }

        toLiteral()
        {
            const obj =
                {
                    baseClass: this.baseClass,
                    defaultInstance: this.defaultInstance,
                    requiresNewInstance: this.requiresNewInstance,
                    version: this.version,
                    versionIntValue: this.#versionIntValue,
                    key: (this.cacheKey || this.#computeKey()),
                    args: [...(asArray( this.args ?? [] ))]
                };

            return lock( obj );
        }

        toJSON()
        {
            const literal = attempt( () => this.toLiteral() ) ?? attempt( () => toObjectLiteral( this ) ) ?? this;
            return attempt( () => asJson( literal ) ) ?? attempt( () => JSON.stringify( literal ) ) ?? attempt( () => asJson( this ) ) ?? attempt( () => JSON.stringify( this ) ) ?? asString( this, true );
        }

        equals( pOther )
        {
            if ( isNull( pOther ) || !isObject( pOther ) )
            {
                return false;
            }

            const other = asObject( pOther );

            if ( other === this )
            {
                return true;
            }

            const bothRequireNewInstance = toBool( this.requiresNewInstance ) && toBool( other.requiresNewInstance );
            const neitherRequireNewInstance = !toBool( this.requiresNewInstance ) && !toBool( other.requiresNewInstance );

            if ( bothRequireNewInstance || neitherRequireNewInstance )
            {
                const thisBaseClass = this.baseClass ?? getClass( this.defaultInstance ?? {} );
                const thatBaseClass = other.baseClass ?? getClass( other.defaultInstance ?? {} );

                if ( (thisBaseClass === thatBaseClass) || (getClassName( thisBaseClass ?? {} ) === getClassName( thatBaseClass ?? {} )) )
                {
                    const thisVersion = asString( this.version, true );
                    const thatVersion = asString( other.version, true );

                    if ( thisVersion === thatVersion )
                    {
                        return (getClassName( this.defaultInstance ?? {} ) === getClassName( other.defaultInstance ?? {} )) && ($ln( this.args ?? [] ) === $ln( other.args ?? [] ));
                    }
                }
            }

            return false;
        }

        compareTo( pOther )
        {
            if ( isNull( pOther ) || !isObject( pOther ) )
            {
                return -1;
            }

            const other = asObject( pOther );

            if ( other === this )
            {
                return 0;
            }

            let comp = 0;

            const thisBaseClass = this.baseClass ?? getClass( this.defaultInstance ?? {} );
            const thatBaseClass = other.baseClass ?? getClass( other.defaultInstance ?? {} );

            if ( isClass( thisBaseClass ) && isClass( thatBaseClass ) )
            {
                comp = thisBaseClass === thatBaseClass ? 0 : isSubclassOf( thisBaseClass, thatBaseClass ) ? 1 : isSubclassOf( thatBaseClass, thisBaseClass ) ? -1 : 0;
            }

            if ( 0 === comp )
            {
                const thisDefaultInstance = getClass( this.defaultInstance ?? this.baseClass ?? {} );
                const thatDefaultInstance = getClass( other.defaultInstance ?? other.baseClass ?? {} );

                comp = thisDefaultInstance === thatDefaultInstance ? 0 :
                       (isSubclassOf( thisDefaultInstance, thatDefaultInstance ) ? 1 :
                        (isSubclassOf( thatDefaultInstance, thisDefaultInstance ) ? -1 : 0));
            }

            if ( 0 === comp )
            {
                const thisVersion = asInt( ToolBocksModule.resolveVersionIntegerValue( this.version ) || 0, 0 );
                const thatVersion = asInt( ToolBocksModule.resolveVersionIntegerValue( other.version ) || 0, 0 );

                comp = thisVersion > thatVersion ? -1 : thisVersion < thatVersion ? 1 : 0;
            }

            if ( 0 === comp )
            {
                const thisArgs = asArray( this.args ?? [] );
                const thatArgs = asArray( other.args ?? [] );

                const lenA = $ln( thisArgs );
                const lenB = $ln( thatArgs );

                comp = lenA > lenB ? -1 : lenA < lenB ? 1 : 0;
            }

            return comp;
        }
    }

    DependencyDescriptorOptions.prototype.isCompatibleClass = isCompatibleClass;

    DependencyDescriptorOptions.from = function( pObject )
    {
        if ( isObjOrJson( pObject ) )
        {
            const arg = dereference( asObject( pObject ) );

            const obj = isArray( arg ?? pObject ) ?
                        new DependencyDescriptorOptions( false, _mt, null, null, ...(asArray( arg ?? pObject ?? [] )) ) :
                        dereference( asObject( arg ) );

            if ( obj instanceof DependencyDescriptorOptions )
            {
                return obj;
            }

            return new DependencyDescriptorOptions( readProperty( obj, "requiresNewInstance", "requires_new_instance", "requires_new" ),
                                                    readProperty( obj, "version", "release" ),
                                                    readProperty( obj, "baseClass", "interface", "superClass", "base_class", "super_class" ) ?? obj["baseClass"],
                                                    readProperty( obj, "defaultInstance", "default_instance", "instance", "default" ) ?? obj["defaultInstance"],
                                                    ...(asArray( readProperty( obj, "args", "arguments", "arr" ) ?? asArray( obj["args"] ?? [] ) ?? [] )) );
        }

        if ( isBoolean( pObject ) )
        {
            return new DependencyDescriptorOptions( pObject );
        }

        if ( isClass( pObject ) )
        {
            return new DependencyDescriptorOptions( false, _mt, pObject );
        }

        if ( isString( pObject ) )
        {
            return new DependencyDescriptorOptions( false, asString( pObject, true ) );
        }

        return new DependencyDescriptorOptions();
    };

    DependencyDescriptorOptions.COMPARATOR = ( a, b ) =>
    {
        const aa = DependencyDescriptorOptions.from( a ?? {} );
        const bb = DependencyDescriptorOptions.from( b ?? {} );

        return aa.compareTo( bb ) || -(bb.compareTo( aa ));
    };

    const hashContent = ( pContent ) =>
    {
        return guidUtils.hashSync( pContent, "sha256" );
    };

    /**
     * Returns a unique string
     * corresponding to the specified DependencyDescriptor.
     *
     * Used to create a unique hash
     * to cache reusable instances of components
     * matching the criteria defined by the descriptor.
     *
     * @param pDependencyDescriptor
     * @returns {string}
     */
    function computeKey( pDependencyDescriptor )
    {
        const descriptor = isNonNullObject( pDependencyDescriptor ) ?
                           (pDependencyDescriptor ?? {}) :
                           ((isString( pDependencyDescriptor ) && isJson( pDependencyDescriptor )) ?
                            asObject( pDependencyDescriptor ) :
                            asString( pDependencyDescriptor ));

        if ( isString( descriptor ) )
        {
            return descriptor;
        }

        let s = `${descriptor.id || asString( Date.now() )}`;

        if ( isString( descriptor.name ) && !isBlank( descriptor.name ) )
        {
            s += `|${asString( descriptor.name, true )}`;
        }

        if ( isNonNullObject( descriptor.options ) && !isBlank( asString( descriptor.options.cacheKey, true ) ) )
        {
            s += `|${descriptor.options.cacheKey}`;
        }
        else
        {
            s += !isBlank( descriptor.version ) ? `|version:${asString( descriptor.version || "~~", true )}` : _mt;

            s += !isNull( descriptor.baseClass ) && isClass( descriptor.baseClass ) ? `|baseClass:${getClassName( descriptor.baseClass ?? Dependency )}` : _mt;

            s += isNonNullObject( descriptor.defaultInstance ) ? `|default:${getClassName( descriptor.defaultInstance ?? Dependency )}` : _mt;

            let args = asArray( descriptor.args ?? [] );

            if ( args && $ln( args ) )
            {
                let arr = [...args].flat().map( formatArgs ).filter( e => !isBlank( e ) );

                if ( $ln( arr ) )
                {
                    arr = arr.sort( ( a, b ) => CASE_INSENSITIVE_COLLATOR.compare( a, b ) );

                    s += `|${arr.join( "|" )}`;
                }
            }
        }

        return s;
    }

    /**
     * Returns a unique string
     * corresponding to the specified DependencyDescriptor.
     *
     * Used to cache reusable instances of components
     * matching the criteria defined by the descriptor.
     *
     * @param pDependencyDescriptor
     * @returns {*}
     */
    const computeHash = function( pDependencyDescriptor )
    {
        let cacheKey = pDependencyDescriptor?.cacheKey || computeKey( pDependencyDescriptor ?? {} );

        return hashContent( cacheKey );
    };


    /**
     * This class is used to describe the dependencies
     * an object expects to be provided in its constructor.
     *
     * Each class should declare a static property, named DEPENDENCIES
     * with a list of its dependencies.
     */
    class DependencyDescriptor
    {
        /**
         * The ID of the Dependency Constant corresponding to this dependency
         */
        #id;

        /**
         * The name the dependent class will use
         * to find the dependency from the Dependencies object
         * provided to its constructor.
         *
         * If not found, the object will use the ID or attempt to find-by-class
         */
        #name;

        /** Lowest version of the component that can fulfill the dependency */
        #version = _mt;
        #versionIntValue = 0;

        /**
         * The most generic class the dependency must extend (or implement)
         * to satisfy the requirements of the dependent object
         */
        #baseClass;

        /**
         * Optional value to provide an instance of the dependency
         * when it has not been (properly) provided.
         */
        #defaultInstance;

        /**
         * Indicates whether the 'injector' must instantiate a new instance of the dependency
         * or can use a cached or common instance (found in a registry, for example)
         */
        #requiresNewInstance;

        /**
         * Constructs a new DependencyDescriptor
         * to describe to a consumer/creator of a class instance
         * one of the dependencies that must be provided.
         *
         * The descriptor expresses the contract
         * between a class and code that instantiates or uses objects of that class.
         *
         *                     When provided, the creator and the class will attempt to find the dependency using this value.
         *
         * @param pDependencyConstant - the object defined in DependencyConstants corresponding to the kind of dependency required
         *
         * @param {DependencyDescriptorOptions} pOptions - an object providing extra information to the registry/factory
         *                                                 used when satisfying this dependency.
         *
         *                                                 baseClass provides a mechanism for telling registry
         *                                                 the least specific implementation of the requested component is acceptable
         *
         *                                                 requiresNewInstance tells the registry/factory not to reuse a previously constructed component,
         *                                                 but instead to construct a new instance to satisfy this dependency
         *
         *                                                 defaultInstance is an optional fallback to provide some implementation
         *                                                 if the registry/factory cannot fulfill the request
         *
         *                                                 ...args are zero or more arguments to pass to the DependentObject constructor after the Dependencies
         *
         *                                                 It is always the dependent object's responsibility to declare what "kind" of thing it needs,
         *                                                 rather than how to get it, however,
         *                                                 sometimes the dependent object needs to pass additional information
         *                                                 to help the builder find or construct it.
         *
         */
        constructor( pDependencyConstant, pOptions )
        {
            this.options = lock( DependencyDescriptorOptions.from( pOptions ?? pDependencyConstant ) ?? {} );

            this.#id = isNonNullObject( pDependencyConstant ) ?
                       (pDependencyConstant?.id || this.options?.id || pDependencyConstant?.name || asString( Date.now() )) :
                       (asString( pDependencyConstant, true ) || asString( Date.now() ));

            this.#name = asString( pDependencyConstant?.name, true ) ||
                         asString( asString( this.options?.name, true ) ||
                         toCamelCase( asString( this.#id, true ).replaceAll( /\./g, _underscore ) ), true ) || this.#id;

            this.#requiresNewInstance = toBool( this.options?.requiresNewInstance );

            this.#version = this.options?.version || _mt;

            this.#versionIntValue = ToolBocksModule.resolveVersionIntegerValue( this.#version );

            this.#baseClass = this.options?.baseClass ?? null;

            if ( !(isUserDefinedClass( this.#baseClass ) || (isString( this.#baseClass ) && !isBlank( this.#baseClass ))) )
            {
                if ( isNonNullObject( this.#baseClass ) )
                {
                    this.#baseClass = getClass( this.#baseClass ) ?? null;
                }
            }

            this.#defaultInstance = this.options?.defaultInstance ?? null;
            this.#defaultInstance = isNull( this.#defaultInstance ) ? null : ((isUserDefinedClass( this.#defaultInstance ) || isNonNullObject( this.#defaultInstance )) ? this.#defaultInstance : null);

            this.args = lock( asArray( this.options?.args ?? [] ).map( lock ) );

            this.cacheKey = computeKey( this );

            this.hash = computeHash( this.cacheKey );

            lock( this );
        }

        get id()
        {
            return asString( this.#id, true ) || asString( this.#name, true ) || getClassName( this.defaultInstance ?? this.baseClass );
        }

        get name()
        {
            return asString( this.#name, true ) || this.id;
        }

        get version()
        {
            return asString( this.#version, true ) || DEFAULT_VERSION;
        }

        isLaterThanOrEqualToVersion( pVersion )
        {
            return this.#versionIntValue >= ToolBocksModule.resolveVersionIntegerValue( pVersion );
        }

        isCompatibleVersion( pVersionedObject )
        {
            return isBlank( this.version ) || (asInt( this.#versionIntValue ) <= 0) || (ToolBocksModule.resolveVersionIntegerValue( pVersionedObject?.version ) >= asInt( this.#versionIntValue ));
        }

        get baseClass()
        {
            if ( isUserDefinedClass( this.#baseClass ) || (isString( this.#baseClass ) && !isBlank( this.#baseClass )) )
            {
                return this.#baseClass;
            }

            if ( isNonNullObject( this.#baseClass ) )
            {
                return getClass( this.#baseClass ) ?? ((isNonNullObject( this.#defaultInstance ) ? getClass( this.#defaultInstance ) ?? null : isUserDefinedClass( this.#defaultInstance ) ? this.#defaultInstance : null));
            }

            return (isNonNullObject( this.#defaultInstance ) ? getClass( this.#defaultInstance ) ?? null : isUserDefinedClass( this.#defaultInstance ) ? this.#defaultInstance : null);
        }

        get requiresNewInstance()
        {
            return toBool( this.#requiresNewInstance );
        }

        get defaultInstance()
        {
            return isNonNullObject( this.#defaultInstance ) || isUserDefinedClass( this.#defaultInstance ) ? this.#defaultInstance : null;
        }

        async useDefault( pScope )
        {
            const scp = pScope ?? $scope();

            let component = null;

            if ( !isNull( this.defaultInstance ) )
            {
                component = this.defaultInstance;

                // in the (hopefully) unlikely event that the defaultInstance is not compatible,
                if ( !this.isCompatibleClass( component ) )
                {
                    // we try the baseClass
                    component = this.baseClass;
                }
            }
            else if ( isUserDefinedClass( this.baseClass ) )
            {
                component = this.baseClass;
            }
            else if ( scp[this.id] ?? scp[this.name] )
            {
                // last chance!
                // if there is an object or class in scope,
                // we try that
                let candidates = [scp[this.id], scp[this.name]].filter( e => (isNonNullObject( e ) || isUserDefinedClass( e )) && (this.isCompatibleClass( e )) );

                if ( $ln( candidates ) > 0 )
                {
                    component = candidates[0];
                }
            }

            if ( isNonNullObject( component ) )
            {
                if ( this.requiresNewInstance )
                {
                    if ( isFunction( component?.clone ) )
                    {
                        component = attempt( () => component.clone() ) ?? component;
                    }
                    else
                    {
                        let klass = getClass( component );
                        if ( isClass( klass ) )
                        {
                            if ( isFunction( klass.from ) )
                            {
                                component = klass.from( component );
                            }
                            else
                            {
                                component = attempt( () => new klass( component ?? this ) );
                            }
                        }
                    }
                }
                return component;
            }

            if ( isClass( component ) || isFunction( component ) )
            {
                return component;
            }

            return null;
        }

        toString()
        {
            return asString( this.cacheKey || this.hash || computeKey( this ) || computeHash( this ), true ) || `${(getClassName( this ) || "DependencyDescriptor")}::${(this.id || this.name)}::${(this.name || this.id)}::${(this.version || DEFAULT_VERSION)}` + ($ln( asArray( this.args ?? [] ) ) > 0 ? `::${asArray( this.args ?? [] ).join( _comma )}` : _mt);
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        [Symbol.toStringTag]()
        {
            return `[object ${getClassName( this )}]`;
        }

        toLiteral()
        {
            let obj =
                {
                    id: this.id,
                    name: this.name,
                    version: this.version,
                    baseClass: (this.baseClass ?? null),
                    requiresNewInstance: this.requiresNewInstance,
                    defaultInstance: lock( this.defaultInstance ?? null ),
                    options: lock( isFunction( this.options?.toLiteral ) ? this.options.toLiteral() : attempt( () => toObjectLiteral( this.options ) ) ),
                    args: lock( [...(asArray( this.args ?? [] ))].map( lock ) ),
                    cacheKey: this.cacheKey ?? computeKey( this ),
                    hash: this.hash ?? computeHash( this )
                };

            return lock( obj );
        }

        toJSON()
        {
            return asJson( this.toLiteral() );
        }

        equals( pOther )
        {
            if ( isNull( pOther ) || !isObject( pOther ) )
            {
                return false;
            }

            const other = asObject( pOther );

            if ( other === this )
            {
                return true;
            }

            const thisOptions = DependencyDescriptorOptions.from( asObject( this.options ) );
            const thatOptions = DependencyDescriptorOptions.from( asObject( other.options ) );

            let are = thisOptions.equals( thatOptions );

            if ( are )
            {
                const thisName = asString( this.name, true );
                const thatName = asString( other.name, true );

                are = (ucase( thisName ) === ucase( thatName ));
            }

            if ( are )
            {
                const thisId = asString( this.id, true );
                const thatId = asString( other.id, true );

                are = (ucase( thisId ) === ucase( thatId ));
            }

            if ( are )
            {
                const thisVersion = asInt( ToolBocksModule.resolveVersionIntegerValue( this.version ) || 0, 0 );
                const thatVersion = asInt( ToolBocksModule.resolveVersionIntegerValue( other.version ) || 0, 0 );

                are = (thisVersion === thatVersion);
            }

            return (are || (this === pOther));
        }

        compareTo( pOther )
        {
            if ( isNull( pOther ) || !isObject( pOther ) )
            {
                return -1;
            }

            const other = asObject( pOther );

            if ( other === this )
            {
                return 0;
            }

            const thisOptions = DependencyDescriptorOptions.from( asObject( this.options ) );
            const thatOptions = DependencyDescriptorOptions.from( asObject( other.options ) );

            let comp = thisOptions.compareTo( thatOptions );

            if ( 0 === comp )
            {
                const thisName = asString( this.name, true );
                const thatName = asString( other.name, true );

                comp = CASE_INSENSITIVE_COLLATOR.compare( thisName, thatName );
            }

            if ( 0 === comp )
            {
                const thisId = asString( this.id, true );
                const thatId = asString( other.id, true );

                comp = CASE_INSENSITIVE_COLLATOR.compare( thisId, thatId );
            }

            if ( 0 === comp )
            {
                const thisVersion = asInt( ToolBocksModule.resolveVersionIntegerValue( this.version ) || 0, 0 );
                const thatVersion = asInt( ToolBocksModule.resolveVersionIntegerValue( other.version ) || 0, 0 );

                comp = thisVersion > thatVersion ? -1 : thisVersion < thatVersion ? 1 : comp;
            }

            if ( 0 === comp )
            {
                const thisBase = this.baseClass ?? getClass( this.defaultInstance ) ?? Object;
                const thatBase = other.baseClass ?? getClass( other.defaultInstance ) ?? Object;

                if ( isClass( thisBase ) && isClass( thatBase ) )
                {
                    if ( isSubclassOf( thisBase, thatBase ) )
                    {
                        comp = 1;
                    }
                    else if ( isSubclassOf( thatBase, thisBase ) )
                    {
                        comp = -1;
                    }
                }
                else if ( isString( thisBase ) || isString( thatBase ) )
                {
                    const s1 = isClass( thisBase ) ? getClassName( thisBase ) : asString( thisBase, true );
                    const s2 = isClass( thatBase ) ? getClassName( thatBase ) : asString( thatBase, true );

                    if ( isClass( thisBase ) )
                    {
                        if ( isSubclassOfName( thisBase, s2 ) )
                        {
                            comp = 1;
                        }
                    }
                    else if ( isClass( thatBase ) )
                    {
                        if ( isSubclassOfName( thatBase, s1 ) )
                        {
                            comp = -1;
                        }
                    }
                }
            }

            return comp;
        }
    }

    DependencyDescriptor.prototype.isCompatibleClass = isCompatibleClass;

    DependencyDescriptor.isValidDescriptor = function( pValue )
    {
        if ( isNonNullObject( pValue ) )
        {
            if ( (isString( pValue.id ) && !isBlank( pValue.id )) || (isString( pValue.name ) && !isBlank( pValue.name )) )
            {
                let validVersion = isNull( pValue.version ) || (isString( pValue.version ) && (isBlank( pValue.version ) || /^\d(\.\d)?(\.\d)?/.test( asString( pValue.version, true ) )));
                let requiresNewValid = isNull( pValue.requiresNewInstance ) || isBoolean( pValue.requiresNewInstance );
                let validBaseClass = isNull( pValue.baseClass ) || isUserDefinedClass( pValue.baseClass ) || (isString( pValue.baseClass ));
                let validDefault = isNull( pValue.defaultInstance ) || isNonNullObject( pValue.defaultInstance ) || isUserDefinedClass( pValue.defaultInstance );
                let optionsValid = isNull( pValue.options ) || isNonNullObject( pValue.options );
                let argsValid = isNull( pValue.args ) || isArray( pValue.args );

                return validVersion && requiresNewValid && validBaseClass && validDefault && optionsValid && argsValid;
            }
        }
        return false;
    };

    DependencyDescriptor.from = function( pObject, pOptions, ...pArgs )
    {
        if ( isObjOrJson( pObject ) )
        {
            const obj = asObject( pObject );

            if ( isNonNullObject( obj ) && obj instanceof DependencyDescriptor )
            {
                return obj;
            }

            const options = asObject( pOptions ?? obj?.options ?? obj ?? {} );

            // arguments provided to this function
            // override arguments specified in the options,
            // which override arguments specified in the object

            let args = asArray( obj?.args ?? options?.args ?? pArgs ?? (isArray( obj ) ? obj : []) ?? [] );
            args = $ln( args ) < 1 ? asArray( options?.args ?? pArgs ?? (isArray( obj ) ? obj : []) ?? [] ) : args;
            args = $ln( args ) < 1 ? asArray( pArgs ?? (isArray( obj ) ? obj : []) ?? [] ) : args;

            args = replaceElements( args, asArray( options?.args ?? pArgs ?? (isArray( obj ) ? obj : []) ?? [] ) );
            args = replaceElements( args, asArray( pArgs ?? (isArray( obj ) ? obj : []) ?? [] ) );

            let opts =
                {
                    ...(asObject( obj.options ?? { args: asArray( args ?? obj.args ?? (isArray( obj ) ? obj : []) ?? [] ) } )),
                    ...(asObject( asObject( options ?? obj.options ?? { args: asArray( args ?? options.args ?? (isArray( obj ) ? obj : []) ?? [] ) } ) ))
                };

            opts.args = $ln( args ) > 0 ? [...(asArray( args ?? opts.args ?? obj?.args ?? [] ))] : [...(asArray( opts.args ?? obj?.args ?? [] ))];

            const depConst = obj instanceof DependencyConstant ?
                             obj :
                             DependencyConstant.from( {
                                                          id: (obj.id || asString( obj, true )),
                                                          name: (obj.name || obj.id || asString( obj, true )),
                                                          description: (obj.description || obj.name || obj.id || asString( obj, true ))
                                                      } );

            return new DependencyDescriptor( depConst, DependencyDescriptorOptions.from( opts ) );
        }

        let constant = DEP_CONSTS_BY_ID.get( asString( pObject, true ) ) ?? DEP_CONSTS_BY_ID.get( lcase( asString( pObject, true ) ) ) ??
                       DEP_CONSTS[asString( pObject, true )] ?? DEP_CONSTS[lcase( asString( pObject, true ) )];

        let options =
            {
                ...(asObject( constant ?? pOptions ?? {} )),
                ...(asObject( pObject ?? constant ?? pOptions ?? {} )),
                ...(asObject( pOptions ?? pObject ?? constant ?? {} ))
            };

        options.args = [...(asArray( pArgs ?? options?.args ?? [] ))];

        return new DependencyDescriptor( constant, options );
    };

    DependencyDescriptor.computeKey = function( pDescriptor )
    {
        const descriptor = pDescriptor instanceof DependencyDescriptor ? pDescriptor : DependencyDescriptor.from( pDescriptor );
        return computeKey( descriptor );
    };

    DependencyDescriptor.computeHash = function( pDescriptor )
    {
        const descriptor = pDescriptor instanceof DependencyDescriptor ? pDescriptor : DependencyDescriptor.from( pDescriptor );
        return computeHash( descriptor );
    };

    DependencyDescriptor.COMPARATOR = ( a, b ) =>
    {
        const aa = DependencyDescriptor.from( a, DependencyDescriptorOptions.from( a?.options ?? a ), ...(asArray( a?.args ?? a ?? [] )) );
        const bb = DependencyDescriptor.from( b, DependencyDescriptorOptions.from( b?.options ?? b ), ...(asArray( b?.args ?? b ?? [] )) );

        return aa.compareTo( bb ) || -(bb.compareTo( aa ));
    };

    const mod =
        lock( {
                  DEFAULT_VERSION,
                  DependencyDescriptorOptions,
                  DependencyDescriptor,
                  computeKey,
                  computeHash
              } );

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
