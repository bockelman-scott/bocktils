(function exposeModule()
{
    const toolbocks = require( "@toolbocks/core" );

    const fileUtils = require( "@toolbocks/files" );

    const jsonUtils = require( "@toolbocks/json" );

    const dependencyConstants = require( "./DependencyConstant.js" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = toolbocks;

    const
        {
            ToolBocksModule,
            IllegalArgumentError,
            dereference,
            attempt,
            asyncAttempt,
            readProperty,
            objectValues,
            objectKeys,
            lock,
            isReadOnly,
            $ln
        } = moduleUtils;

    const { $scope, _ud, _mt, _comma } = constants;

    const
        {
            isNull,
            isNonNullObject,
            isObject,
            isWeakRef,
            isFunction,
            isString,
            isCloneable,
            isClass,
            getClass,
            getClassName,
            isSubclassOf,
            isSubclassOfName,
            toObjectLiteral
        } = typeUtils;

    const { asString, asInt, isBlank, isJson, lcase, ucase } = stringUtils;

    const { asArray } = arrayUtils;

    const { getFileName, removeExtension } = fileUtils;

    const { asObject, asJson } = jsonUtils;

    const { DEP_CONSTS, DEP_CONSTS_BY_ID, DependencyConstant } = dependencyConstants;

    /**
     * Enumeration of the types that can be returned from the registry.
     * A DependencyConstant defines which of these will be returned from the registry.
     */
    const DEPENDENCY_TYPE =
        {
            CLASS: "class",
            FACTORY: "factory",
            OBJECT: "object"
        };

    /**
     * When not specified, the default is to expect an initialized instance of an object
     * @type {string}
     */
    DEPENDENCY_TYPE.DEFAULT = DEPENDENCY_TYPE.OBJECT;

    DEPENDENCY_TYPE.resolveType = function( pStr )
    {
        let str = lcase( asString( pStr, true ) );

        if ( objectValues( DEPENDENCY_TYPE ).includes( str ) || objectKeys( DEPENDENCY_TYPE ).includes( ucase( str ) ) )
        {
            return DEPENDENCY_TYPE[ucase( str )] || lcase( str );
        }

        return DEPENDENCY_TYPE.DEFAULT;
    };

    /**
     * This class mirrors
     * and provides a type interface
     * for the values found in package.json files
     * describing the available components.
     *
     * This class is used when the registry is initialized.
     *
     */
    class PublishedComponent extends DependencyConstant
    {
        /**
         * The 'require' path of the module defining the component.
         * When using package.json to define/publish dependencies,
         * this is the name property of the package.json object.
         *
         * Otherwise, this is a user-specified value,
         * which must either be a file path to the JavaScript module
         * that defines and exports the componentName
         * or the name of a package that exports componentName
         */
        #path;

        /**
         * (Optional) This value defines the version
         * of the component
         * (or the module or package which exports the component).
         *
         * When using package.json to define/publish dependencies,
         * this is the version property of the package.json object.
         *
         */
        #version;

        #versionIntValue = 0;

        /**
         * The name of the component exported from the module
         * defined at 'path'
         */
        #componentName;

        /**
         * The type of the value represented by componentName.
         *
         * The registry will return a value of this type.
         *
         * This can be a class, a factory, or an initialized object.
         * The dependent object is expected to know
         * what kind of thing upon which it depends
         * and treat the component accordingly.
         *
         * That is, if the dependent object has declared,
         * for example, that it needs a factory,
         * the dependent object will expect the dependency
         * to define a create method
         * that takes one or more arguments.
         *
         * If, on the other hand, in the typical case,
         * the dependent object expects an initialized object,
         * the dependent object will call the methods specific to that type of object.
         *
         * Finally, if the dependent object expects to receive a class,
         * the dependent object will expect a Function that supports the 'new' keyword
         * to create an instance and will be responsible for instantiating an instance if and when necessary.
         * This is the rarest expected case.
         *
         * @type {string}
         */
        #type = DEPENDENCY_TYPE.OBJECT;

        #factoryMethodName = null;

        #args = [];

        #options = {};

        /**
         * Potentially populated property holding the module defined at 'path';
         * This is not currently the expected usage, but is reserved for future use.
         */
        #mod;

        /**
         * Indicates whether the component can be cached.
         * This is true by default.
         * Packages must add "cacheable": false
         * explicitly to prevent caching a component
         * @type {boolean}
         */
        #cacheable = true;

        /**
         * Constructs an instance of this class.
         *
         * The ID, Name, and Description correspond to a DependencyConstant,
         * defined in a static JSON file.
         *
         * The path, componentName, and (optionally) type
         * are read from the '_publishes' section of package.json.
         *
         * @param pDependencyConstant
         * @param pPath
         * @param pComponentName
         * @param pType
         * @param pVersion
         * @param pArgs
         */
        constructor( pDependencyConstant, pPath, pComponentName, pType = DEPENDENCY_TYPE.OBJECT, pVersion = _mt, ...pArgs )
        {
            super( pDependencyConstant?.id || DEP_CONSTS_BY_ID.get( asString( pDependencyConstant, true ) )?.id || asString( pDependencyConstant, true ),
                   pDependencyConstant?.name || DEP_CONSTS_BY_ID.get( asString( pDependencyConstant, true ) )?.name || asString( pDependencyConstant, true ),
                   pDependencyConstant?.description || DEP_CONSTS_BY_ID.get( asString( pDependencyConstant, true ) )?.description || asString( pDependencyConstant, true ) );

            this.#path = isNonNullObject( pDependencyConstant ) ? asString( pPath, true ) : (arguments[1] || asString( pPath, true ));

            this.#componentName = isNonNullObject( pDependencyConstant ) ? asString( pComponentName || removeExtension( getFileName( asString( this.#path, true ) ), true ), true ) : (arguments[2] || asString( pComponentName || removeExtension( getFileName( asString( this.#path, true ) ), true ), true ));

            this.#type = (isNonNullObject( pDependencyConstant ) ? lcase( asString( pType, true ) ) : (arguments[3] || lcase( asString( pType, true ) )));

            this.#type = DEPENDENCY_TYPE.resolveType( this.#type );

            this.#version = isNonNullObject( pDependencyConstant ) ? asString( pVersion, true ) || _mt : (arguments[4] || asString( pVersion, true ) || _mt);
            this.#versionIntValue = asInt( !isBlank( this.#version ) ? ToolBocksModule.resolveVersionIntegerValue( this.#version ) : 0 );

            this.#args.push( ...([...(asArray( pArgs ?? (asArray( arguments ?? [] ).slice( 4 )) ?? [] ))].map( e => lock( isCloneable( e ) ? (attempt( () => e.clone() ) ?? e) : e ) )) );
        }

        get path()
        {
            return asString( this.#path, true );
        }

        get componentName()
        {
            return asString( this.#componentName || removeExtension( getFileName( asString( this.path, true ) ), true ), true );
        }

        get type()
        {
            return DEPENDENCY_TYPE.resolveType( lcase( asString( this.#type, true ) ) );
        }

        get version()
        {
            return asString( this.#version, true );
        }

        isLaterThanOrEqualToVersion( pVersion )
        {
            return this.#versionIntValue >= ToolBocksModule.resolveVersionIntegerValue( pVersion );
        }

        isCompatibleVersion( pDescriptor )
        {
            const descriptor = asObject( pDescriptor ?? this );

            const id = asString( descriptor?.id, true ) || this.id;
            const name = asString( descriptor?.name, true ) || this.name;

            if ( asString( this.id, true ) === id || asString( this.name, true ) === name )
            {
                if ( isFunction( descriptor?.isCompatibleVersion ) )
                {
                    return descriptor.isCompatibleVersion( this );
                }

                const version = asString( asString( descriptor?.version, true ) || asString( this.#version, true ) || _mt, true );
                const versionInt = asInt( ToolBocksModule.resolveVersionIntegerValue( descriptor?.version || this.version ) );

                return (isBlank( version ) || (asInt( versionInt ) <= 0) || this.isLaterThanOrEqualToVersion( version )) || this.#versionIntValue >= versionInt;
            }

            return false;
        }

        isCompatibleClass( pComponent, pDescriptor )
        {
            const descriptor = asObject( pDescriptor ?? this );

            const id = asString( descriptor?.id, true ) || this.id;
            const name = asString( descriptor?.name, true ) || this.name;

            if ( asString( this.id, true ) === id || asString( this.name, true ) === name )
            {
                let component = !isNull( pComponent ) ? (isWeakRef( pComponent ?? {} ) ? dereference( pComponent ?? {} ) : pComponent?.component ?? pComponent) : {};
                component = isWeakRef( component ) ? dereference( component ) : component;
                component = component?.component ?? component ?? {};

                if ( isFunction( descriptor?.isCompatibleClass ) )
                {
                    return descriptor.isCompatibleClass( component ?? pComponent ) || descriptor.isCompatibleClass( pComponent ?? component );
                }

                let baseClass = descriptor?.baseClass ?? (!isNull( descriptor?.defaultInstance ) ? getClass( descriptor?.defaultInstance ) : null);

                if ( isNull( baseClass ) || (isString( baseClass ) && isBlank( baseClass )) )
                {
                    return true;
                }

                let klass = getClass( pComponent?.componentClass ?? component?.componentClass ?? component ?? pComponent ?? this ) ?? component;

                if ( isClass( baseClass ) )
                {
                    return (klass === baseClass) || (isSubclassOf( klass, baseClass )) || (isSubclassOf( component, baseClass ));
                }

                let klassName = asString( getClassName( component ), true ) || asString( getClassName( klass, true ) );

                if ( isString( baseClass ) && !isBlank( baseClass ) )
                {
                    baseClass = asString( baseClass, true );

                    return (klassName === baseClass) || isSubclassOfName( component, baseClass ) || isSubclassOfName( klass, baseClass );
                }

                return asString( this.componentName, true ) === asString( klassName, true );
            }

            return false;
        }

        get args()
        {
            return asArray( [...(asArray( this.#args ?? [] ))].map( e => lock( isCloneable( e ) ? (attempt( () => e.clone() ) ?? e) : e ) ) ?? [] );
        }

        get options()
        {
            return lock( asObject( this.#options ?? {} ) );
        }

        addOption( pName, pValue )
        {
            if ( isString( pName ) && !isBlank( pName ) && !isNull( pValue ) )
            {
                this.#options = (this.#options ?? {});

                if ( !isReadOnly( this.#options ) )
                {
                    this.#options[asString( pName, true )] = lock( pValue );
                }
                else
                {
                    const nm = asString( pName, true );
                    this.#options = { ...(toObjectLiteral( asObject( this.#options ?? {} ) )), ...(asObject( { [nm]: pValue } )) };
                }

                return; // Successfully added option
            }

            throw new IllegalArgumentError( `Options must be non-null values associated with a key of type, string; received ${pName}:${pValue}` );
        }

        get cacheable()
        {
            return (false !== this.#cacheable);
        }

        set cacheable( pCacheable )
        {
            this.#cacheable = (false !== pCacheable);
        }

        async loadModule()
        {
            this.#mod = (this.#mod ?? attempt( () => require( this.path || this.componentName ) )) ?? attempt( () => $scope()[this.path] ) ?? attempt( () => $scope()[this.componentName] );

            return this.#mod ?? attempt( () => require( this.path || this.componentName ) );
        }

        async load()
        {
            const pkg = (this.#mod ?? await asyncAttempt( async() => await this.loadModule() ));

            return await asyncAttempt( async() => await pkg[this.componentName] ) ?? attempt( () => $scope()[this.componentName] ) ?? pkg;
        }

        isValid()
        {
            return !(isBlank( this.id ) || (isBlank( this.path ) && isBlank( this.componentName )));
        }

        toString()
        {
            return `${(getClassName( this ) || "PublishedComponent")}::${(this.id || this.name)}::${(this.name || this.id)}::${(this.path || this.componentName)}::${(this.componentName || this.path)}::${(this.version || "0.0.0")}::${(this.type || DEPENDENCY_TYPE.DEFAULT)}` + $ln( asArray( this.args ?? [] ) ) > 0 ? `::${asArray( this.args ?? [] ).join( _comma )}` : _mt;
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        [Symbol.toStringTag]()
        {
            return "[object " + getClassName( this ) + "]";
        }

        toLiteral()
        {
            const obj =
                {
                    id: this.id || this.componentName,
                    name: this.name || this.componentName,
                    path: this.path,
                    componentName: this.componentName,
                    type: this.type,
                    version: this.version,
                    cacheable: this.cacheable,
                    options: asObject( toObjectLiteral( this.options, { respectToLiteralMethod: false } ) ),
                    arguments: asArray( this.args ?? [] ),
                    valid: this.isValid()
                };

            return lock( obj );
        }

        toJSON()
        {
            return asJson( this.toLiteral() );
        }
    }

    /**
     * Returns an instance of PublishedComponent
     * from the DependencyConstant, path, componentName, and type
     * specified.
     *
     * @param {DependencyConstant} pDependencyConstant
     * @param {string} pPath
     * @param {string} pComponentName
     * @param {string} pType
     * @param pVersion
     * @param pArgs
     * @returns {PublishedComponent}
     */
    PublishedComponent.fromConstant = function( pDependencyConstant, pPath, pComponentName, pType, pVersion, ...pArgs )
    {
        if ( isNonNullObject( pDependencyConstant ) )
        {
            const constant = DependencyConstant.from( asObject( pDependencyConstant ) );
            return new PublishedComponent( constant,
                                           pPath,
                                           pComponentName,
                                           DEPENDENCY_TYPE.resolveType( pType || DEPENDENCY_TYPE.DEFAULT ),
                                           (pVersion || _mt), ...pArgs );
        }
        else if ( isString( pDependencyConstant ) )
        {
            const constant = attempt( () => readProperty( DEP_CONSTS_BY_ID, pDependencyConstant ) ) ?? attempt( () => DEP_CONSTS_BY_ID.get( pDependencyConstant ) ) ?? DEP_CONSTS[pDependencyConstant];

            if ( isNonNullObject( constant ) )
            {
                return PublishedComponent.fromConstant( constant, pPath, pComponentName, pType, pVersion, ...pArgs );
            }
        }
        return new PublishedComponent( {}, pPath, pComponentName, pType, pVersion, ...pArgs );
    };

    /**
     * Returns an instance of PublishedComponent
     * from the object provided.
     *
     * @param pData
     * @returns {PublishedComponent}
     */
    PublishedComponent.from = function( pData )
    {
        if ( isNonNullObject( pData ) || (isString( pData ) && isJson( pData )) )
        {
            const data = asObject( pData );

            if ( data instanceof PublishedComponent )
            {
                return data;
            }

            const constant = DependencyConstant.from( data );

            return PublishedComponent.fromConstant( constant,
                                                    data.path,
                                                    (data.componentName || data.component),
                                                    data.type,
                                                    data.version );
        }

        throw new IllegalArgumentError( `Cannot construct an instance of PublishedComponent from the provided value`, { data: pData }, pData );
    };

    PublishedComponent.TYPES = lock( DEPENDENCY_TYPE );

    const mod =
        lock( {
                  DEPENDENCY_TYPE: lock( DEPENDENCY_TYPE ),
                  DependencyInfo: PublishedComponent,
                  PublishedComponent,
                  fromConstant: function( pConstant, pPath, pComponentName, pType, pVersion, ...pArgs )
                  {
                      return PublishedComponent.fromConstant( pConstant, pPath, pComponentName, pType, pVersion, ...pArgs );
                  },
                  fromData: function( pData )
                  {
                      return PublishedComponent.from( pData );
                  }
              } );

    if ( _ud !== typeof module )
    {
        module.exports = mod;
    }

    return mod;

}());
