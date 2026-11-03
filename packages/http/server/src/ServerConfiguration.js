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

    const { ToolBocksModule, readProperty, lock } = moduleUtils;

    const { _ud, _mt } = constants;

    const { isNull, isNonNullObject, isNumeric } = typeUtils;

    const { asString, asInt, toBool, _lct, isJsonObject } = stringUtils;

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
        const data = isNonNullObject( pData ) ?? isJsonObject( pData ) ? asObject( pData ) : {};

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
        const data = isNonNullObject( pData ) ?? isJsonObject( pData ) ? asObject( pData ) : {};

        if ( data instanceof FilterConfiguration )
        {
            return data;
        }

        const name = data?.name || data?.functionName || readProperty( data, "name", "function_name" );
        const modulePath = data?.modulePath || data?.module || readProperty( data, "module_path", "module", "path" );
        const functionName = data?.functionName || readProperty( data, "function_name", "filter_name", "handler_name", "filter", "handler" );
        const abortable = data?.abortable ?? readProperty( data, "abortable", "abort_aware" );

        return new FilterConfiguration( name, modulePath, functionName, abortable );
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
        const data = isNonNullObject( pData ) ?? isJsonObject( pData ) ? asObject( pData ) : {};

        if ( data instanceof HandlerFactoryConfiguration )
        {
            return data;
        }

        const modulePath = data?.modulePath || data?.module || readProperty( data, "module_path", "module", "path" );
        const factoryClass = data?.factoryClass || readProperty( data, "factory_class", "class_name", "factory" );

        return new HandlerFactoryConfiguration( modulePath, factoryClass );
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
        const data = isNonNullObject( pData ) ?? isJsonObject( pData ) ? asObject( pData ) : {};

        if ( data instanceof FilterFactoryConfiguration )
        {
            return data;
        }

        const modulePath = data?.modulePath || data?.module || readProperty( data, "module_path", "module", "path" );
        const factoryClass = data?.factoryClass || readProperty( data, "factory_class", "class_name", "factory" );

        return new FilterFactoryConfiguration( modulePath, factoryClass );
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
        const data = isNonNullObject( pData ) ?? isJsonObject( pData ) ? asObject( pData ) : {};

        if ( data instanceof SslConfiguration || data instanceof ServerConfiguration )
        {
            return data;
        }

        const keyPath = data?.keyPath || readProperty( data, "key_path", "key", "ssl_key_path", "ssl_key" );
        const certPath = data?.certPath || readProperty( data, "cert_path", "certificate_path", "cert", "ssl_cert_path", "ssl_certificate_path", "ssl_certificate" );

        return new SslConfiguration( keyPath, certPath );
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
        const data = isNonNullObject( pData ) ?? isJsonObject( pData ) ? asObject( pData ) : {};

        if ( data instanceof RouteConfiguration )
        {
            return data;
        }

        const path = data?.path || readProperty( data, "path", "url", "endpoint" );
        const method = data?.method || data?.verb || readProperty( data, "method", "verb", "action" );

        let filters = data?.filters ?? readProperty( data, "filters", "filter_configs", "request_filters" );
        let handlers = data?.handlers ?? readProperty( data, "handlers", "controllers", "actions", "request_handlers" );

        filters = filters.filter( isNonNullObject ).map( FilterConfiguration.from );
        handlers = handlers.filter( isNonNullObject ).map( HandlerConfiguration.from );

        return new RouteConfiguration( path, method, filters, handlers );
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
            this.#routes.push( ...(asArray( pRoutes ).map( asObject ).map( RouteConfiguration.from )) );
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
    }

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
        #routesConfigurations = [];

        get port()
        {
            return asInt( this.#port || 3000 );
        }

        get useSsl()
        {
            return toBool( this.#useSsl );
        }

        get keyPath()
        {
            return asString( this.#sslConfiguration?.keyPath, true );
        }

        get certPath()
        {
            return asString( this.#sslConfiguration?.certPath, true );
        }


    }


    ServerConfiguration.from = function( pData, pId )
    {
        let data = isNonNullObject( pData ) ?? isJsonObject( pData ) ? asObject( pData ) : {};

        const servers = asArray( data?.servers ?? [] );

        const key = !isNull( pId ) ? isNumeric( pId ) ? asInt( pId ) : asString( pId ) : _mt;

        if ( $ln( servers ) > 0 )
        {
            data = servers.find( e => e?.id === key || e?.name === key );
        }

        if ( isNonNullObject( data ) )
        {

        }

    };

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
}());
