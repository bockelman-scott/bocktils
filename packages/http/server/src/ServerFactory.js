(function exposeModule()
{
    /**
     * Imports the Middleware framework
     */
    const express = require( "express" );

    /**
     * Imports the filesystem library
     */
    const fs = require( "fs" );

    /**
     * Import the HTTP modules
     */
    const http = require( "http" );
    const https = require( "https" );

    /**
     * Imports the middleware to read a request body
     */
    const bodyParser = require( "body-parser" );

    /**
     * Imports the middleware to read a multipart form request body
     */
    const multipartParser = require( "multer" );

    /**
     * Imports the middleware to read cookies from a request
     */
    const cookieParser = require( "cookie-parser" );

    /**
     * Imports functionality related to the current operating system (e.g., Windows or Linux)
     */
    const os = require( "os" );

    /**
     * Allows monitoring the health of the server
     */
    const perfUtils = require( "perf_hooks" );

    /**
     * Import the ToolBocks Performance-related module
     */
    const performanceModule = require( "@toolbocks/performance" );

    const toolbocks = require( "@toolbocks/core" );

    const depInjection = require( "@toolbocks/dep-injection" );

    const jsonUtils = require( "@toolbocks/json" );

    const logUtils = require( "@toolbocks/logging" );

    const { ServerConfiguration } = require( "./ServerConfiguration.js" );

    const { moduleUtils, constants, typeUtils, stringUtils } = toolbocks;

    const
        {
            ToolBocksModule,
            IllegalStateError,
            IllegalArgumentError,
            $ln,
            attempt,
            attemptSilent,
            lock,
            functionToString,
            resolveError
        } = moduleUtils;

    const { _ud, _mt } = constants;

    const { isNull, isNonNullObject, isFunction, isError, getClassName } = typeUtils;

    const { asString, _lct } = stringUtils;

    const { DependentObject, Dependencies } = depInjection;

    const { asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const { getPerformanceTimer } = performanceModule;

    const SIMPLE_LOGGER = new SimpleLogger( ToolBocksModule.getGlobalLogger(), console );

    const DEFAULT_LOGGER = SourcedSimpleLogger.adapt( SIMPLE_LOGGER, "ServerFactory" );

    class ServerFactory
    {
        #dependencyRegistry;

        constructor( pDependencyRegistry )
        {
            this.#dependencyRegistry = pDependencyRegistry;
        }

        get dependencyRegistry()
        {
            return this.#dependencyRegistry ?? { init: async() => this };
        }

        async getDependencyRegistry()
        {
            return await this.dependencyRegistry.init();
        }

        createServer( pServerConfiguration, pDependencyRegistry = this.dependencyRegistry )
        {
            const configuration = ServerConfiguration.from( pServerConfiguration );


        }
    }


    class Server
    {
        #httpServer;
        #appServer;

        #configuration;

        async start()
        {

        }

        async stop()
        {

        }


    }

}());
