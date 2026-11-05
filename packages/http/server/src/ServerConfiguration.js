/**
 * This module exposes classes to digest and expose configuration values,
 * including routes, filters, and handlers,
 * as well as basic variables, such as the port, ssl key paths, etc.
 *
 * @module
 */

(function exposeModule()
{
    const toolbocks = require( "@toolbocks/core" );

    const httpUtils = require( "@toolbocks/http" );

    const jsonUtils = require( "@toolbocks/json" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = toolbocks;

    const { ToolBocksModule, attempt, readProperty, lock, $ln } = moduleUtils;

    const { _ud, _mt } = constants;

    const { isNull, isObject, isNonNullObject, isString, isNumeric, isBoolean } = typeUtils;

    const { asString, asInt, toBool, _lct, isBlank, isJsonObject } = stringUtils;

    const { asArray } = arrayUtils;

    const { HttpVerb } = httpUtils;

    const { asObject, asJson, parseJson } = jsonUtils;

    const { RequestFilterFactory } = require( "./FilterFactory.js" );

    const { RequestHandlerFactory } = require( "./HandlerFactory.js" );

    /**
     * Represents configuration values for a single Handler.
     *
     * Handlers are functions that take a request, response, and 'next' argument
     * invoked when an HTTP request is received.
     *
     * Handlers are built with their dependencies during server construction.
     *
     * The properties of a HandlerConfiguration specify how to find the function
     * to send to a RequestHandlerFactory::createHandler method,
     * which binds the function to itself to resolve and inject dependencies.
     *
     * @class
     */
    class HandlerConfiguration
    {
        /**
         * An optional name for a handler
         * @type {string}
         */
        #name;

        /**
         * The value to specify to the Node.js 'require' function
         * to retrieve the module which exports the handler function.
         *
         * @type {string}
         */
        #modulePath = _mt;

        /**
         * The name of the exported handler function
         * @type {string}
         */
        #functionName = _mt;

        /**
         * Indicates whether the handler should be constructed with an AbortController
         * and listen for the request's 'close' event to react to aborted requests
         * Abortable handlers should ideally be asynchronous functions.
         * @type {boolean}
         */
        #abortable = false;

        /**
         * Constructs an instance of HandlerConfiguration
         * describing the components required to build the handler function
         *
         * @param {string} pName
         * @param {string} pModulePath
         * @param {string} pFunctionName
         *
         * @param {string|boolean} pAbortable
         *
         * @constructor
         */
        constructor( pName, pModulePath, pFunctionName, pAbortable = false )
        {
            this.#name = asString( pName ?? pFunctionName, true );
            this.#modulePath = asString( pModulePath, true );
            this.#functionName = asString( pFunctionName || pName, true );
            this.#abortable = toBool( pAbortable );
        }

        equals( pOther )
        {
            const other = HandlerConfiguration.from( pOther ) ?? asObject( pOther );

            return (this.name === other?.name &&
                    this.modulePath === other?.modulePath &&
                    this.functionName === other?.functionName &&
                    this.abortable ? other?.abortable : !other?.abortable);
        }

        toLiteral()
        {
            const obj =
                {
                    name: this.name,
                    module_path: this.modulePath,
                    function_name: this.functionName,
                    abortable: this.abortable
                };
            return lock( obj );
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) ) || attempt( () => JSON.stringify( literal ) );
        }

        /**
         * Returns the name of the handler or the name of the handler function
         * described by this configuration object
         *
         * @returns {string}
         */
        get name()
        {
            return asString( this.#name || this.#functionName, true );
        }

        /**
         * Returns the value to be passed to Node.js 'require'
         * to load the module from which the handler function is exported
         *
         * @returns {string}
         */
        get modulePath()
        {
            return asString( this.#modulePath, true );
        }

        /**
         * Returns the name of the function exported from #modulePath
         * to pass to a RequestHandlerFactory.
         *
         * @returns {string}
         */
        get functionName()
        {
            return asString( this.#functionName || this.#name, true );
        }

        /**
         * Returns true if the handler function should be made request abort-aware
         * @returns {boolean}
         */
        get abortable()
        {
            return toBool( this.#abortable );
        }
    }

    /**
     * Static factory method for constructing a HandlerConfiguration
     * from JSON or another object
     *
     * This function is useful for mapping portions of a ServerConfiguration
     * to HandlerConfiguration instances.
     *
     * @param {String|Object} pData JSON serialized representation of a HandlerConfiguration
     *                              or an object whose shape matches that of a HandlerConfiguration
     *
     * @returns {HandlerConfiguration} an instance of HandlerConfiguration
     *                                 used to find and load a handler function into the current scope
     */
    HandlerConfiguration.from = function( pData )
    {
        // force data to be an object (asObject will parse JSON or return the object as-is)
        const data = isNonNullObject( pData ) || isJsonObject( pData ) ? asObject( pData ) : {};

        if ( isNonNullObject( data ) )
        {
            // we check to see if we already have a HandlerConfiguration,
            // in which case, we can just return it
            if ( data instanceof HandlerConfiguration )
            {
                return data;
            }

            // read the properties of the specified object. with some leeway to allow for some variations of naming or schema
            const name = data?.name || data?.functionName || readProperty( data, "name", "function_name" );
            const modulePath = data?.modulePath || data?.module || readProperty( data, "module_path", "module", "path" );
            const functionName = data?.functionName || readProperty( data, "function_name", "handler_name", "filter_name", "handler", "filter" );
            const abortable = data?.abortable ?? readProperty( data, "abortable", "abort_aware" );

            // use the properties to construct a configuration object
            return new HandlerConfiguration( name, modulePath, functionName, abortable );
        }

        return null;
    };

    /**
     * Subclass of HandlerConfiguration specific to functions intended to be used as 'filters'
     * Filters are middleware functions expected to be invoked prior to any handlers.
     * Examples include authentication filters, performance-monitoring filters, throttling filters, and request decorators.
     */
    class FilterConfiguration extends HandlerConfiguration
    {
        constructor( pName, pModulePath, pFunctionName )
        {
            super( pName, pModulePath, pFunctionName );
        }
    }

    /**
     * Static factory method for constructing a FilterConfiguration
     * from JSON or another object
     *
     * This function is useful for mapping portions of a ServerConfiguration
     * to FilterConfiguration instances.
     *
     * @param {String|Object} pData JSON serialized representation of a FilterConfiguration
     *                              or an object whose shape matches that of a FilterConfiguration
     *
     * @returns {FilterConfiguration}  an instance of FilterConfiguration
     *                                 used to find and load a function into the current scope
     *
     * @see #HandlerConfiguration.from
     */
    FilterConfiguration.from = function( pData )
    {
        const data = isNonNullObject( pData ) || isJsonObject( pData ) ? asObject( pData ) : {};

        if ( isNonNullObject( data ) )
        {
            if ( data instanceof FilterConfiguration )
            {
                return data;
            }

            const name = data?.name || data?.functionName || readProperty( data, "name", "function_name" );
            const modulePath = data?.modulePath || data?.module || readProperty( data, "module_path", "module", "path" );
            const functionName = data?.functionName || readProperty( data, "function_name", "filter_name", "handler_name", "filter", "handler" );
            const abortable = data?.abortable ?? readProperty( data, "abortable", "abort_aware" );

            return new FilterConfiguration( name, modulePath, functionName, abortable );
        }

        return null;
    };

    /**
     * Represents the values required to load a RequestHandlerFactory into the current scope.
     *
     * @class
     */
    class HandlerFactoryConfiguration
    {
        /**
         * The value to specify to the Node.js 'require' function
         * to retrieve the module which exports the class.
         *
         * @type {string}
         */
        #modulePath;

        /**
         * The name of the class exported from #modulePath
         * to instantiate (or retrieve from a DI registry).
         */
        #factoryClass;

        constructor( pModulePath, pFactoryClassName )
        {
            this.#modulePath = asString( pModulePath, true );
            this.#factoryClass = asString( pFactoryClassName, true );
        }

        equals( pOther )
        {
            const other = HandlerFactoryConfiguration.from( pOther ) ?? asObject( pOther );
            return (this.modulePath === other?.modulePath && this.factoryClass === other?.factoryClass);
        }

        toLiteral()
        {
            const obj =
                {
                    module_path: this.modulePath,
                    factory_class: this.factoryClass
                };
            return lock( obj );
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) ) || attempt( () => JSON.stringify( literal ) );
        }

        get modulePath()
        {
            return asString( this.#modulePath, true );
        }

        get factoryClass()
        {
            return asString( this.#factoryClass, true );
        }
    }

    /**
     * Static factory method for constructing a HandlerFactoryConfiguration
     * from JSON or another object
     *
     * @param {String|Object} pData JSON (or an object)
     *                              that when parsed
     *                              holds the properties
     *                              necessary to construct a HandlerFactoryConfiguration
     *
     * @returns {HandlerFactoryConfiguration}
     */
    HandlerFactoryConfiguration.from = function( pData )
    {
        const data = isNonNullObject( pData ) || isJsonObject( pData ) ? asObject( pData ) : {};

        if ( isNonNullObject( data ) )
        {
            if ( data instanceof HandlerFactoryConfiguration )
            {
                return data;
            }

            const modulePath = data?.modulePath || data?.module || readProperty( data, "module_path", "module", "path" );
            const factoryClass = data?.factoryClass || readProperty( data, "factory_class", "class_name", "factory" );

            return new HandlerFactoryConfiguration( modulePath, factoryClass );
        }

        return null;
    };

    /**
     * Subclass of HandlerFactoryConfiguration for representing filter-specific data
     */
    class FilterFactoryConfiguration extends HandlerFactoryConfiguration
    {
        constructor( pModulePath, pFactoryClassName )
        {
            super( pModulePath, pFactoryClassName );
        }
    }

    /**
     * Static factory method for constructing a HandlerFactoryConfiguration
     * from JSON or another object
     *
     * @param {String|Object} pData JSON (or an object)
     *                              that when parsed
     *                              holds the properties
     *                              necessary to construct a HandlerFactoryConfiguration
     *
     * @returns {HandlerFactoryConfiguration}
     */
    FilterFactoryConfiguration.from = function( pData )
    {
        const data = isNonNullObject( pData ) || isJsonObject( pData ) ? asObject( pData ) : {};

        if ( isNonNullObject( data ) )
        {
            if ( data instanceof FilterFactoryConfiguration )
            {
                return data;
            }

            const modulePath = asString( data?.modulePath || data?.module || readProperty( data, "module_path", "module", "path" ), true );
            const factoryClass = asString( data?.factoryClass || readProperty( data, "factory_class", "class_name", "factory" ), true );

            return new FilterFactoryConfiguration( modulePath, factoryClass );
        }

        return null;
    };

    class SslConfiguration
    {
        #keyPath = _mt;
        #certPath = _mt;

        constructor( pKeyPath, pCertificatePath )
        {
            this.#keyPath = asString( pKeyPath, true );
            this.#certPath = asString( pCertificatePath, true );
        }

        equals( pOther )
        {
            const other = SslConfiguration.from( pOther ) ?? asObject( pOther );

            const kp = this.keyPath || readProperty( this, "key_path", "ssl_key_path" );
            const otherKp = other?.keyPath || readProperty( other, "key_path", "ssl_key_path" );

            const cp = this.certPath || readProperty( this, "cert_path", "ssl_cert_path" );
            const otherCp = other?.certPath || readProperty( other, "cert_path", "ssl_cert_path" );

            return (kp === otherKp && cp === otherCp);
        }

        toLiteral()
        {
            const obj =
                {
                    key_path: this.keyPath,
                    cert_path: this.certPath
                };
            return lock( obj );
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) ) || attempt( () => JSON.stringify( literal ) );
        }

        get keyPath()
        {
            return asString( this.#keyPath, true );
        }

        get certPath()
        {
            return asString( this.#certPath, true );
        }
    }

    SslConfiguration.from = function( pData )
    {
        const data = isNonNullObject( pData ) || isJsonObject( pData ) ? asObject( pData ) : {};

        if ( isNonNullObject( data ) )
        {
            if ( data instanceof SslConfiguration || data instanceof ServerConfiguration )
            {
                return data;
            }

            const keyPath = data?.keyPath || readProperty( data, "key_path", "key", "ssl_key_path", "ssl_key" );
            const certPath = data?.certPath || readProperty( data, "cert_path", "certificate_path", "cert", "ssl_cert_path", "ssl_certificate_path", "ssl_certificate" );

            return new SslConfiguration( keyPath, certPath );
        }

        return null;
    };

    class RouteConfiguration
    {
        #path;
        #method = "get";

        #filterConfigurations = [];
        #handlerConfigurations = [];

        constructor( pPath, pMethod, pFilters, pHandlers )
        {
            this.#path = asString( pPath, true );
            this.#method = _lct( HttpVerb.resolveHttpMethod( pMethod || "GET" ) );
            this.#filterConfigurations.push( ...(asArray( pFilters ?? [] ).map( asObject ).map( FilterConfiguration.from )) );
            this.#handlerConfigurations.push( ...(asArray( pHandlers ?? [] ).map( asObject ).map( HandlerConfiguration.from )) );
        }

        equals( pOther )
        {
            const other = RouteConfiguration.from( pOther ) ?? asObject( pOther );

            if ( this.path === other?.path && this.method === other?.method )
            {
                const numFilters = $ln( this.#filterConfigurations );
                const numOtherFilters = $ln( other?.filterConfigurations );

                if ( numFilters === numOtherFilters )
                {
                    for( let i = 0, n = numFilters; i < n; i++ )
                    {
                        const thisFilterConfig = this.#filterConfigurations[i];
                        const otherFilterConfig = this.filterConfigurations[i];

                        if ( !thisFilterConfig.equals( otherFilterConfig ) )
                        {
                            return false;
                        }
                    }
                }
                else
                {
                    return false;
                }

                const numHandlers = $ln( this.#handlerConfigurations );
                const numOtherHandlers = $ln( other?.handlerConfigurations );

                if ( numHandlers === numOtherHandlers )
                {
                    for( let i = 0, n = numHandlers; i < n; i++ )
                    {
                        const thisHandlerConfig = this.#handlerConfigurations[i];
                        const otherHandlerConfig = this.handlerConfigurations[i];

                        if ( !thisHandlerConfig.equals( otherHandlerConfig ) )
                        {
                            return false;
                        }
                    }
                }
                else
                {
                    return false;
                }

                return true;
            }

            return false;
        }

        toLiteral()
        {
            const obj =
                {
                    path: this.path,
                    method: this.method,
                    filters: [...(asArray( this.filterConfigurations ).map( e => e.toLiteral() ))],
                    handlers: [...(asArray( this.handlerConfigurations ).map( e => e.toLiteral() ))]
                };
            return lock( obj );
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) ) || attempt( () => JSON.stringify( literal ) );

        }

        get path()
        {
            return asString( this.#path, true );
        }

        get method()
        {
            return _lct( asString( HttpVerb.resolveHttpMethod( this.#method ), true ) );
        }

        get filterConfigurations()
        {
            return [...(asArray( this.#filterConfigurations ).filter( isNonNullObject ).map( lock ))];
        }

        get handlerConfigurations()
        {
            return [...(asArray( this.#handlerConfigurations ).filter( isNonNullObject ).map( lock ))];
        }
    }

    RouteConfiguration.from = function( pData )
    {
        const data = isNonNullObject( pData ) || isJsonObject( pData ) ? asObject( pData ) : {};

        if ( isNonNullObject( data ) )
        {
            if ( data instanceof RouteConfiguration )
            {
                return data;
            }

            const path = data?.path || readProperty( data, "path", "url", "endpoint" );
            const method = data?.method || data?.verb || readProperty( data, "method", "verb", "action" );

            let filters = asArray( data?.filters ?? readProperty( data, "filters", "filter_configs", "request_filters" ) ?? [] ) ?? [];
            let handlers = asArray( data?.handlers ?? readProperty( data, "handlers", "controllers", "actions", "request_handlers" ) ?? [] ) ?? [];

            filters = filters.filter( isNonNullObject ).map( FilterConfiguration.from );
            handlers = handlers.filter( isNonNullObject ).map( HandlerConfiguration.from );

            return new RouteConfiguration( path, method, filters, handlers );
        }

        return null;
    };

    class RouteFactoryConfiguration
    {
        #pathPrefix = _mt;

        #handlerFactoryConfiguration;

        #routes = [];

        constructor( pPathPrefix, pHandlerFactoryConfiguration, ...pRoutes )
        {
            this.#pathPrefix = asString( pPathPrefix, true );
            this.#handlerFactoryConfiguration = HandlerFactoryConfiguration.from( asObject( pHandlerFactoryConfiguration ) );
            this.#routes.push( ...(asArray( pRoutes ).flat().map( RouteConfiguration.from )) );
        }

        get pathPrefix()
        {
            return asString( this.#pathPrefix, true );
        }

        get handlerFactoryConfiguration()
        {
            return lock( HandlerFactoryConfiguration.from( this.#handlerFactoryConfiguration ?? {} ) );
        }

        get routes()
        {
            return [...(asArray( this.#routes ?? [] ).filter( isNonNullObject ).map( RouteConfiguration.from ).map( lock ))];
        }

        equals( pOther )
        {
            const other = RouteFactoryConfiguration.from( pOther ) ?? asObject( pOther );

            if ( this.pathPrefix === other?.pathPrefix )
            {
                if ( this.handlerFactoryConfiguration.equals( other.handlerFactoryConfiguration ) )
                {
                    return this.routes.every( ( e, i ) => e.equals( other.routes[i] ) );
                }
            }

            return false;
        }

        toLiteral()
        {
            const obj =
                {
                    route_prefix: this.pathPrefix,
                    path_prefix: this.pathPrefix,
                    handler_factory: attempt( () => this.handlerFactoryConfiguration.toLiteral() ),
                    routes: asArray( this.routes ).map( e => e.toLiteral() )
                };
            return lock( obj );
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) ) || attempt( () => JSON.stringify( literal ) );
        }
    }

    RouteFactoryConfiguration.from = function( pData )
    {
        // force data to be an object (asObject will parse JSON or return the object as-is)
        const data = isNonNullObject( pData ) || isJsonObject( pData ) ? asObject( pData ) : {};

        if ( isNonNullObject( data ) )
        {
            if ( data instanceof RouteFactoryConfiguration )
            {
                return data;
            }

            const routePrefix = asString( data["route_prefix"] || readProperty( data, "route_prefix", "prefix", "root_path", "root" ) );
            const handlerFactoryConfig = HandlerFactoryConfiguration.from( data["handler_factory"] ?? readProperty( data, "handler_factory", "factory" ) );

            let routeConfigs = asArray( data.routes ?? readProperty( data, "routes", "route_configs" ) );
            routeConfigs = routeConfigs.filter( e => !isNull( e ) && (isNonNullObject( e ) || isString( e )) ).map( RouteConfiguration.from );

            return new RouteFactoryConfiguration( routePrefix, handlerFactoryConfig, ...routeConfigs );
        }

        return null;
    };

    let NEXT_SERVER_ID = 0;

    const nextServerId = () =>
    {
        let id = ++NEXT_SERVER_ID;

        if ( id > 9_999 )
        {
            NEXT_SERVER_ID = 0;
            id = ++NEXT_SERVER_ID;
        }

        return asInt( id );
    };

    class ServerConfiguration
    {
        #id = 0;
        #name = "HTTP(s) Server";

        #port = 3000;

        #useSsl = true;
        #sslConfiguration = {};

        #filterFactoryConfiguration = {};
        #filtersConfigurations = [];

        #handlerFactoryConfiguration = {};
        #routeFactoryConfiguration = [];

        constructor( pId,
                     pName,
                     pPort = 3000,
                     pUseSsl,
                     pSslConfiguration,
                     pFilterFactoryConfiguration,
                     pFiltersConfigurations,
                     pHandlerFactoryConfiguration,
                     pRouteFactoryConfiguration )
        {
            this.#port = asInt( pPort ) || 3000;

            this.#id = asInt( pId || nextServerId() );
            this.#name = asString( pName, true ) || `Server_${this.#port}`;

            this.#useSsl = toBool( pUseSsl );
            this.#sslConfiguration = lock( SslConfiguration.from( pSslConfiguration ) );

            this.#filterFactoryConfiguration = lock( FilterFactoryConfiguration.from( pFilterFactoryConfiguration ) );
            this.#filtersConfigurations = lock( asArray( pFiltersConfigurations ?? [] ).map( FilterConfiguration.from ) );

            this.#handlerFactoryConfiguration = lock( HandlerFactoryConfiguration.from( pHandlerFactoryConfiguration ) );

            this.#routeFactoryConfiguration = RouteFactoryConfiguration.from( pRouteFactoryConfiguration );
        }

        get id()
        {
            return this.#id;
        }

        get name()
        {
            return this.#name;
        }

        get port()
        {
            return asInt( this.#port || 3000 );
        }

        get useSsl()
        {
            return toBool( this.#useSsl );
        }

        get sslConfiguration()
        {
            return lock( SslConfiguration.from( this.#sslConfiguration ) );
        }

        get keyPath()
        {
            return asString( this.sslConfiguration?.keyPath, true );
        }

        get certPath()
        {
            return asString( this.sslConfiguration?.certPath, true );
        }

        get filterFactoryConfiguration()
        {
            return lock( FilterFactoryConfiguration.from( this.#filterFactoryConfiguration ) );
        }

        get filtersConfigurations()
        {
            return [...(asArray( this.#filtersConfigurations ?? [] ).map( FilterConfiguration.from ).map( lock ))];
        }

        get handlerFactoryConfiguration()
        {
            return lock( HandlerFactoryConfiguration.from( this.#handlerFactoryConfiguration ) );
        }

        get routeFactoryConfiguration()
        {
            return lock( RouteFactoryConfiguration.from( this.#routeFactoryConfiguration ) );
        }

        get routeConfigurations()
        {
            return [...((asArray( this.routeFactoryConfiguration.routes ?? [] )).map( lock ))];
        }

        validate()
        {
            const results =
                {
                    port: asInt( this.port ) >= 3000,
                    useSsl: isBoolean( this.useSsl ),
                    keyPath: !isBlank( this.keyPath ) || !this.useSsl,
                    certPath: !isBlank( this.certPath ) || !this.useSsl,
                    handlerFactoryConfiguration: isNonNullObject( this.handlerFactoryConfiguration ) && this.handlerFactoryConfiguration instanceof HandlerFactoryConfiguration,
                    filterFactoryConfiguration: $ln( this.filtersConfigurations ) < 1 || (isNonNullObject( this.filterFactoryConfiguration ) && this.filterFactoryConfiguration instanceof FilterFactoryConfiguration),
                    routeFactoryConfiguration: isNonNullObject( this.routeFactoryConfiguration ) && this.routeFactoryConfiguration instanceof RouteFactoryConfiguration,
                    routeConfigurations: $ln( this.routeConfigurations ) > 0
                };

            return lock( results );
        }

        isValid()
        {
            if ( asInt( this.port ) < 3000 )
            {
                return false;
            }

            if ( this.useSsl )
            {
                if ( isBlank( this.keyPath ) || isBlank( this.certPath ) )
                {
                    return false;
                }
            }

            const hfc = this.handlerFactoryConfiguration;
            if ( isNull( hfc ) || !isObject( hfc ) || !(hfc instanceof HandlerFactoryConfiguration) )
            {
                return false;
            }

            const filtersConfigs = this.filtersConfigurations;

            if ( $ln( filtersConfigs ) > 0 )
            {
                const ffc = this.filterFactoryConfiguration;
                if ( isNull( ffc ) || !isObject( ffc ) || !(ffc instanceof FilterFactoryConfiguration) )
                {
                    return false;
                }
            }
            return $ln( this.routeConfigurations ) > 0 && (isNonNullObject( this.routeFactoryConfiguration ) && this.routeFactoryConfiguration instanceof RouteFactoryConfiguration);
        }

        equals( pOther )
        {
            const other = ServerConfiguration.from( pOther ) ?? asObject( pOther );

            if ( this.id === other.id &&
                 this.name === other?.name &&
                 this.port === other?.port &&
                 (this.useSsl ? other?.useSsl : !other?.useSsl) &&
                 this.keyPath === other?.keyPath &&
                 this.certPath === other?.certPath )
            {
                const ffc = FilterFactoryConfiguration.from( this.#filterFactoryConfiguration );
                const otherFfc = FilterFactoryConfiguration.from( other?.filterFactoryConfiguration );

                if ( (isNull( ffc ) && isNull( otherFfc )) || ffc.equals( otherFfc ) )
                {
                    const numFilters = $ln( this.filtersConfigurations );
                    const numOtherFilters = $ln( other?.filtersConfigurations );

                    if ( numFilters === numOtherFilters )
                    {
                        for( let i = 0, n = numFilters; i < n; i++ )
                        {
                            const thisFilterConfig = this.filtersConfigurations[i];
                            const otherFilterConfig = this.filtersConfigurations[i];

                            if ( !thisFilterConfig.equals( otherFilterConfig ) )
                            {
                                return false;
                            }
                        }
                    }
                }

                const hfc = HandlerFactoryConfiguration.from( this.#handlerFactoryConfiguration );
                const otherHfc = HandlerFactoryConfiguration.from( other?.handlerFactoryConfiguration );

                if ( (isNull( hfc ) && !isNull( otherHfc )) || !hfc.equals( otherHfc ) )
                {
                    return false;
                }

                return this.routeFactoryConfiguration.equals( other?.routeFactoryConfiguration );
            }

            return false;
        }

        toLiteral()
        {
            const obj =
                {
                    id: this.id,
                    name: this.name,
                    port: this.port,
                    use_ssl: this.useSsl,
                    key_path: this.keyPath,
                    cert_path: this.certPath,
                    filter_factory: isNonNullObject( this.filterFactoryConfiguration ) ? (attempt( () => this.filterFactoryConfiguration.toLiteral() ) ?? null) : null,
                    filters: ($ln( this.filtersConfigurations ) > 0) ? [...(asArray( this.filtersConfigurations ).map( e => e.toLiteral() ))] : [],
                    route_prefix: this.routeFactoryConfiguration?.pathPrefix || _mt,
                    handler_factory: isNonNullObject( this.handlerFactoryConfiguration ) ? (attempt( () => this.handlerFactoryConfiguration.toLiteral() ) ?? null) : null,
                    routes: [...(asArray( this.routeConfigurations ).map( e => e.toLiteral() ))]
                };
            return lock( obj );
        }

        toJSON()
        {
            const literal = this.toLiteral();
            return attempt( () => asJson( literal ) ) || attempt( () => JSON.stringify( literal ) );
        }
    }

    ServerConfiguration.from = function( pData, pId )
    {
        let data = isNonNullObject( pData ) || isJsonObject( pData ) ? asObject( pData ) : {};

        const servers = asArray( data?.servers ?? readProperty( data, "servers", "hosts", "apps" ) ?? [] );

        const key = !isNull( pId ) ? isNumeric( pId ) ? asInt( pId ) : asString( pId ) : _mt;

        if ( $ln( servers ) > 0 )
        {
            data = servers.find( e => e?.id === key || e?.name === key ) ?? servers[0];
        }

        if ( isNonNullObject( data ) )
        {
            if ( data instanceof ServerConfiguration )
            {
                return data;
            }

            const port = asInt( data.port || readProperty( data, "port", "server_port" ) || 3000 ) || 3000;

            const id = asInt( data.id || readProperty( data, "id", "server_id" ) || nextServerId() );
            const name = asString( data.name || readProperty( data, "name", "server_name" ) || `Server_${port}`, true );

            const useSsl = toBool( data.useSsl || data["use_ssl"] || readProperty( data, "use_ssl", "is_use_ssl", "ssl" ) );
            const keyPath = data.keyPath || data["key_path"] || data.keyPath || readProperty( data, "key_path", "ssl_key_path", "key", "ssl_key" );
            const certPath = data.certPath || data["cert_path"] || data.certPath || readProperty( data, "cert_path", "ssl_cert_path", "certificate_path", "ssl_certificate_path" );
            const sslConfig = new SslConfiguration( keyPath, certPath );

            const filterFactoryConfig = FilterFactoryConfiguration.from( data.filterFactoryConfiguration ?? data["filter_factory"] ?? readProperty( data, "filter_factory", "factory" ) );

            let filters = asArray( data.filtersConfigurations ?? data["filters"] ?? readProperty( data, "filters", "filter_configs" ) );
            filters = filters.filter( e => !isNull( e ) && (isString( e ) || isObject( e )) ).map( FilterConfiguration.from ).filter( isNonNullObject );

            const handlerFactoryConfig = HandlerFactoryConfiguration.from( data.handlerFactoryConfiguration ?? data["handler_factory"] ?? readProperty( data, "handler_factory", "factory" ) );


            const routeFactoryConfiguration = RouteFactoryConfiguration.from( data.routeFactoryConfiguration ?? data ) ?? data.routeFactoryConfiguration ?? RouteFactoryConfiguration.from( data ?? pData );

            return new ServerConfiguration( id,
                                            name,
                                            port,
                                            useSsl,
                                            sslConfig,
                                            filterFactoryConfig,
                                            filters,
                                            handlerFactoryConfig,
                                            routeFactoryConfiguration );
        }

        return null;

    };

    function parseServerConfiguration( pJson )
    {
        return ServerConfiguration.from( pJson );
    }

    /*
     The standard architectural pattern for instrumentation
     is to inject a top-level middleware early in the chain
     that attaches a listener to the native Node.js finish event on the response object.

     app.use((req, res, next) => {
     const start = process.hrtime.bigint();

     // The 'finish' event fires after res.end(), res.json(), etc., have flushed the stream
     res.on('finish', () => {
     const duration = process.hrtime.bigint() - start;
     // Log telemetry, update counters, or send metrics to your monitoring service
     console.log(`[Perf] ${req.method} ${req.path} completed in ${duration}ns`);
     });

     next(); // Pass control down the chain to the actual route handlers
     });
     */


    const mod =
        {
            classes:
                {
                    HttpVerb,
                    RequestFilterFactory,
                    RequestHandlerFactory,
                    HandlerConfiguration,
                    HandlerFactoryConfiguration,
                    FilterConfiguration,
                    FilterFactoryConfiguration,
                    SslConfiguration,
                    RouteConfiguration,
                    RouteFactoryConfiguration,
                    ServerConfiguration
                },
            HandlerConfiguration,
            HandlerFactoryConfiguration,
            FilterConfiguration,
            FilterFactoryConfiguration,
            SslConfiguration,
            RouteConfiguration,
            RouteFactoryConfiguration,
            ServerConfiguration,
            parseServerConfiguration
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
