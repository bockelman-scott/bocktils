(function exposeModule()
{
    const core = require( "@toolbocks/core" );

    const jsonUtils = require( "@toolbocks/json" );

    const httpUtils = require( "@toolbocks/http" );

    const { moduleUtils, constants } = core;

    const { lock } = moduleUtils;

    const { _ud = "undefined" } = constants;

    const
        {
            HandlerConfiguration,
            HandlerFactoryConfiguration,
            FilterConfiguration,
            FilterFactoryConfiguration,
            SslConfiguration,
            RouteConfiguration,
            RouteFactoryConfiguration,
            ServerConfiguration,
            parseServerConfiguration
        } = require( "./src/ServerConfiguration.js" );

    const { RequestFilterFactory } = require( "./src/FilterFactory.js" );
    const { RequestHandlerFactory } = require( "./src/HandlerFactory.js" );

    const { ServerFactory, Server } = require( "./src/ServerFactory.js" );

    const mod =
        {
            dependencies:
                {
                    core,
                    jsonUtils,
                    httpUtils,
                    moduleUtils,
                    constants
                },
            classes:
                {
                    HandlerConfiguration,
                    HandlerFactoryConfiguration,
                    FilterConfiguration,
                    FilterFactoryConfiguration,
                    SslConfiguration,
                    RouteConfiguration,
                    RouteFactoryConfiguration,
                    ServerConfiguration,
                    ServerFactory,
                    Server
                },
            HandlerConfiguration,
            HandlerFactoryConfiguration,
            FilterConfiguration,
            FilterFactoryConfiguration,
            SslConfiguration,
            RouteConfiguration,
            RouteFactoryConfiguration,
            ServerConfiguration,
            RequestFilterFactory,
            RequestHandlerFactory,
            ServerFactory,
            Server,
            parseServerConfiguration
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
