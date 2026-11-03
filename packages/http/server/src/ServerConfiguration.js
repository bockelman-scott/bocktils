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

    const { isNull, isNonNullObject } = typeUtils;

    const { asString, asInt, toBool, _lct, isJsonObject } = stringUtils;

    const { asArray } = arrayUtils;

    const { HttpVerb } = httpUtils;

    const { asObject, asJson, parseJson } = jsonUtils;

    const { RequestFilterFactory } = require( "./FilterFactory.js" );

    const { RequestHandlerFactory } = require( "./HandlerFactory.js" );

    class HandlerConfiguration
    {
        #name;
        #modulePath = _mt;
        #functionName = _mt;

        constructor( pName, pModulePath, pFunctionName )
        {
            this.#name = asString( pName ?? pFunctionName, true );
            this.#modulePath = asString( pModulePath, true );
            this.#functionName = asString( pFunctionName || pName, true );
        }

        get name()
        {
            return asString( this.#name || this.#functionName, true );
        }

        get modulePath()
        {
            return asString( this.#modulePath, true );
        }

        get functionName()
        {
            return asString( this.#functionName || this.#name, true );
        }
    }

    HandlerConfiguration.from = function( pData )
    {
        const data = isNonNullObject( pData ) ?? isJsonObject( pData ) ? asObject( pData ) : {};

        if ( data instanceof HandlerConfiguration )
        {
            return data;
        }

        const name = data?.name || data?.functionName || readProperty( data, "name", "function_name" );
        const modulePath = data?.modulePath || data?.module || readProperty( data, "module_path", "module", "path" );
        const functionName = data?.functionName || readProperty( data, "function_name", "filter_name", "handler_name", "filter", "handler" );

        return new HandlerConfiguration( name, modulePath, functionName );
    };

    class FilterConfiguration extends HandlerConfiguration
    {
        constructor( pName, pModulePath, pFunctionName )
        {
            super( pName, pModulePath, pFunctionName );
        }
    }

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

        return new FilterConfiguration( name, modulePath, functionName );
    };

    class HandlerFactoryConfiguration
    {
        #modulePath;
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

    class FilterFactoryConfiguration extends HandlerFactoryConfiguration
    {
        constructor( pModulePath, pFactoryClassName )
        {
            super( pModulePath, pFactoryClassName );
        }
    }

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
            return asString( this.#keyPath, true );
        }

        get certPath()
        {
            return asString( this.#certPath, true );
        }


    }


}());
