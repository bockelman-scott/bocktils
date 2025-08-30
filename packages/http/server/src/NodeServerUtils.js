/**
 * This module exposes methods to start an HTTP, HTTPS, or Express server.
 */
const http = require( "http" );
const https = require( "https" );

/**
 * Imports the Express HTTP Server functionality
 */
const express = require( "express" );

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

const core = require( "@toolbocks/core" );

const entityUtils = require( "@toolbocks/entities" );

const logUtils = require( "@toolbocks/logging" );

const secretsModule = require( "@toolbocks/secrets" );

// const databaseUtils = require( "./DatabaseUtils.js" );

const requestHandlerUtils = require( "../src/handler/RequestHandlerFactory.cjs" );

const { constants } = core;

const { _ud = "undefined" } = constants;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__NODE_SERVER_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const moduleName = "NodeServerUtils";

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, ExecutionMode } = core;

    const {
        ToolBocksModule,
        IllegalArgumentError,
        populateOptions,
        no_op,
        attempt,
        asyncAttempt,
        attemptMethod,
        objectEntries,
        lock,
        isLogger,
        resolveError
    } = moduleUtils;

    const konsole = console;

    const { _mt_str, _mt = _mt_str, _hyphen } = constants;

    const { isNull, isNonNullObject, isString, isNumeric, isFunction, isClass, getClass, getClassName } = typeUtils;

    const { asString, isBlank, asInt, lcase, ucase } = stringUtils;

    const { asArray } = arrayUtils;

    const { Dependency, Dependencies } = entityUtils;

    const PerformanceObserver = perfUtils.PerformanceObserver;

    const { SimpleLogger } = logUtils;

    const { RequestHandler, PathHandlerFactory, RouteHandlersFactory } = requestHandlerUtils;

    const userInfo = os.userInfo( { encoding: "utf-8" } );

    const toolBocksModule = new ToolBocksModule( moduleName, INTERNAL_NAME );

    const executionMode = toolBocksModule.executionMode || ExecutionMode.MODES.PROD;

    const simpleLogger = new SimpleLogger( konsole );

    let stopServices = function()
    {

    };

    const defaultRequestHandler = null;

    const handleUncaughtException = function( pException, pOrigin )
    {
        const ex = resolveError( pException || (new Error( "An uncaught exception occurred " + (!isBlank( asString( (pOrigin || pException.origin), true ) ) ? asString( (pOrigin || pException?.origin), true ) : _mt) )), pException?.message );
        toolBocksModule.reportError( ex, ex.message || asString( pOrigin, true ), "error", moduleName, pOrigin );
    };

    const handleBeforeExit = function()
    {
        attempt( () => stopServices() );
        attempt( () => closeLogger() );
    };

    const handleExit = function( pCode )
    {
        const code = pCode || process.exitCode;
        konsole.info( "Node.js is exiting with code" + code );
    };

    const handleUnhandledRejection = function( pReason, pPromise )
    {
        const ex = resolveError( pReason || (new Error( "An unhandled Promise rejection occurred " + (!isBlank( asString( pReason, true ) ) ? asString( pReason ) : _mt) )), (pReason?.message || pReason) );
        toolBocksModule.reportError( ex, (ex.message || asString( pReason, true )), "warn", moduleName, pReason, pPromise );
    };

    const handleWarning = function( pEvent )
    {
        const warning = resolveError( pEvent || resolveError( new Error( pEvent?.name + ":" + pEvent?.message ), pEvent?.name ), (pEvent?.message || pEvent) );
        let msg = (warning.name || asString( warning, true ) || "WARNING") + ", " + asString( warning.message || "(unknown)", true ) + ":\n" + (asString( warning.stack, true ) || "No Stack Trace Available") + "\n";
        toolBocksModule.reportError( warning, msg, "warn", moduleName, warning );
    };

    const handleDisconnect = function( pEvent )
    {
        // implemented when using child processes and IPC
    };

    const startPerformanceMonitor = function( pEntryTypes, pCallback )
    {
        const performanceObserver = new PerformanceObserver( pCallback );
        performanceObserver.observe( { entryTypes: pEntryTypes } );
        return performanceObserver;
    };

    const stopPerformanceMonitor = function( pInstance )
    {
        if ( isNonNullObject( pInstance ) && pInstance instanceof PerformanceObserver )
        {
            attempt( () => pInstance.disconnect() );
        }
    };

    function addServerEventListeners( pHandlers )
    {
        const handlers = isNonNullObject( pHandlers ) ? pHandlers : {};

        /**
         * Prevent crashing the server if some unexpected exception has not been handled
         */
        process.on( "uncaughtException", handlers["uncaughtException"] || handleUncaughtException );

        /**
         * Executes in the case of an unhandled Promise rejection
         */
        process.on( "unhandledRejection", handlers["unhandledRejection"] || handleUnhandledRejection );

        /**
         * Opportunity to alert someone to the event that occurs right before Node exits
         */
        process.on( "beforeExit", handlers["beforeExit"] || handleBeforeExit );

        /**
         * The application has ended
         */
        process.on( "exit", handlers["exit"] || handleExit );

        /**
         * Executes on receipt of a warning
         */
        process.on( "warning", handlers["warning"] || handleWarning );

        /**
         * Executes if Node.js receives a SIGTERM or SIGINT signal
         */
        process.on( "disconnect", handlers["disconnect"] || handleDisconnect );
    }

    const closeLogger = async function( pLogger )
    {
        if ( isLogger( pLogger ) && isFunction( pLogger.close ) )
        {
            asyncAttempt( pLogger.close() );
        }
    };

    const DEFAULT_REQUEST_PARSERS =
        {
            character_set: "utf-8",
            cookies: cookieParser,
            json: bodyParser,
            urlEncoded: bodyParser,
            body: bodyParser
        };

    function configureRequestParsers( pApplicationServer, pParsersConfig = DEFAULT_REQUEST_PARSERS )
    {
        let server = pApplicationServer;

        if ( isNull( server ) || !(server instanceof express || isFunction( server?.use )) )
        {
            throw new IllegalArgumentError( "Server must be a valid Express server" );
        }

        let characterSet = lcase( asString( (pParsersConfig?.character_set || _mt), true ) ) || "utf-8";

        let biscuitParser = isFunction( pParsersConfig?.cookies ) ? pParsersConfig.cookies : cookieParser;

        let bodParser = (isFunction( pParsersConfig?.body ) || isClass( pParsersConfig?.body ) || isNonNullObject( pParsersConfig?.body )) && isFunction( pParsersConfig?.body?.json ) ? pParsersConfig?.body : bodyParser;

        let jsonParser = (isFunction( pParsersConfig?.json ) || isClass( pParsersConfig?.json ) || isNonNullObject( pParsersConfig?.json )) && isFunction( pParsersConfig?.json?.json ) ? pParsersConfig?.json : bodParser || bodyParser;

        let urlEncodedParser = (isFunction( pParsersConfig?.urlEncoded ) || isClass( pParsersConfig?.urlEncoded ) || isNonNullObject( pParsersConfig?.urlEncoded )) && isFunction( pParsersConfig?.urlEncoded?.urlencoded ) ? pParsersConfig?.urlEncoded : bodParser || bodyParser;

        /**
         * Parses any cookies sent in a request
         */
        attempt( () => server.use( biscuitParser() ) );

        /**
         * Create an object for parsing multipart/form-data
         */
        // const uploader = multer();

        /**
         * Tells Express to use the bodyParser for JSON requests
         */
        if ( isFunction( jsonParser?.json ) )
        {
            attempt( () => server.use( jsonParser.json() ) );
        }
        else
        {
            attempt( () => server.use( bodyParser.json() ) );
        }

        /**
         * Tells Express to use the bodyParser for application/x-www-form-urlencoded requests
         * NOTE: you must always pass {extended: true} for this to work properly
         */
        if ( isFunction( urlEncodedParser?.urlencoded ) )
        {
            attempt( () => server.use( urlEncodedParser.urlencoded( { extended: true } ) ) );
        }
        else
        {
            attempt( () => server.use( bodyParser.urlencoded( { extended: true } ) ) );
        }

        /**
         * Tells Express to use the bodyParser for text/plain requests
         * NOTE: you should pass {defaultCharset: 'utf-8'}
         */
        if ( isFunction( bodParser?.text ) )
        {
            attempt( () => server.use( bodParser.text( { defaultCharset: lcase( characterSet || "utf-8" ) } ) ) );
        }
        else
        {
            attempt( () => server.use( bodyParser.text( { defaultCharset: lcase( characterSet || "utf-8" ) } ) ) );
        }

        /**
         * Tells Express to use the bodyParser for other requests
         */
        if ( isFunction( bodParser?.raw ) )
        {
            attempt( () => server.use( bodParser.raw() ) );
        }
        else
        {
            attempt( () => server.use( bodyParser.raw() ) );
        }

        return server;
    }

    const DEFAULT_PORT = 3000;

    class NodeServerController
    {
        #dependencies = new Dependencies();

        #logger = new SimpleLogger( konsole );

        #options = {};

        #performanceMonitor;

        #server;
        #appServer;

        #port;
        #useSsl;
        #keyPath;
        #certPath;

        #routeHandlersFactory;

        constructor( pDependencies, pOptions )
        {
            const me = this;

            const options = populateOptions( pOptions || {}, {} );

            this.#dependencies = Dependencies.resolveDependencies( pDependencies || pOptions?.dependencies );

            let logger = this.#dependencies?.getDependency( "logger" ) || options.logger || simpleLogger;

            this.#logger = isLogger( logger ) ? logger : (isLogger( options.logger ) ? options.logger : simpleLogger);

            this.#options = lock( options );

            this.#port = asInt( options.server?.port ) || asInt( options.port ) || DEFAULT_PORT;

            this.#keyPath = options.keyPath;
            this.#certPath = options.certPath;

            this.#useSsl = !!options.useSsl && !isBlank( this.#keyPath ) && !isBlank( this.#certPath );

            this.#appServer = this.#dependencies?.appServer || options.appServer || express();

            this.#routeHandlersFactory = options.routeHandlersFactory || new RouteHandlersFactory();

            this._processRequestHandlers( options, me );

            this._processRequestParsers( options, me );
        }

        get routeHandlersFactory()
        {
            return this.#routeHandlersFactory || new RouteHandlersFactory();
        }

        set routeHandlersFactory( pFactory )
        {
            this.#routeHandlersFactory = pFactory instanceof RouteHandlersFactory ? pFactory : new RouteHandlersFactory();
        }

        _processRequestHandlers( pOptions, pThis )
        {
            const me = pThis || this;

            const options = populateOptions( pOptions, this.#options || {} );

            if ( isNonNullObject( options["requestHandlers"] ) )
            {
                let entries = objectEntries( options["requestHandlers"] );

                if ( entries && isFunction( entries.forEach ) )
                {
                    const addImmediately = (true === options["addHandlersDuringConstruction"]);

                    entries.forEach( entry =>
                                     {
                                         const key = entry.key || entry[0];
                                         const value = entry.value || entry[1];

                                         if ( !isBlank( key ) && isFunction( value ) )
                                         {
                                             me.#requestHandlers.set( key, value );
                                             if ( addImmediately )
                                             {
                                                 attempt( () => me.addRequestHandler( value, value?.path ) );
                                             }
                                         }
                                     } );
                }
            }
        }

        _processRequestParsers( pOptions, pThis )
        {
            const me = pThis || this;

            const options = populateOptions( pOptions, this.#options || me.options || {} );

            this.configureRequestParsers( options.parsersConfig || options );
        }

        get userInfo()
        {
            return os.userInfo( { "encoding": "utf-8" } ) || userInfo;
        }

        get homeDirectory()
        {
            let user = this.userInfo || os.userInfo( { "encoding": "utf-8" } );
            if ( isNonNullObject( user ) )
            {
                return isFunction( user.homedir ) ? user.homedir() : user.homedir;
            }
            return os.homedir();
        }

        get tmpDir()
        {
            return os.tmpdir();
        }

        get tmpdir()
        {
            return os.tmpdir();
        }

        get currentPath()
        {
            return process.cwd();
        }

        get sourcePath()
        {
            return __dirname + "/" + __filename;
        }

        get logger()
        {
            return isLogger( this.#logger ) ? this.#logger : simpleLogger;
        }

        set logger( pLogger )
        {
            if ( isLogger( pLogger ) )
            {
                this.#logger = pLogger;
            }
        }

        get options()
        {
            return lock( populateOptions( {}, this.#options ) );
        }

        get performanceMonitor()
        {
            return this.#performanceMonitor;
        }

        get appServer()
        {
            this.#appServer = this.#appServer || express();
            return this.#appServer;
        }

        get server()
        {
            this.#server = this.#server || this.createServer( this.options );
            return this.#server;
        }

        get port()
        {
            return asInt( this.#port ) || DEFAULT_PORT;
        }

        get useSsl()
        {
            return !!this.#useSsl;
        }

        get keyPath()
        {
            return this.#keyPath;
        }

        get certPath()
        {
            return this.#certPath;
        }

        async startPerformanceMonitor( pEntryTypes, pCallback )
        {
            const me = this;

            if ( this.#performanceMonitor instanceof PerformanceObserver )
            {
                await asyncAttempt( () => me.stopPerformanceMonitor( this.#performanceMonitor ) );
            }

            this.#performanceMonitor = startPerformanceMonitor( pEntryTypes, pCallback );

            return this.#performanceMonitor;
        }

        async stopPerformanceMonitor( pInstance )
        {
            let instance = (isNonNullObject( pInstance ) && pInstance instanceof PerformanceObserver) ? pInstance : this.#performanceMonitor;

            if ( instance && instance instanceof PerformanceObserver )
            {
                attempt( () => stopPerformanceMonitor( instance ) );
            }
        }

        addEventHandlers( pHandlers )
        {
            addServerEventListeners( pHandlers || {} );
        }

        createRequestHandler( pPath, pFunctionsByVerb, pAddImmediately = false )
        {
            const me = this;

            const factory = this.#routeHandlersFactory || new RequestHandlerFactory( this.secretsManager, this.storageHandler, this.logger, this.options );
            const handler = factory.createRequestHandler( pPath, pFunctionsByVerb, this.secretsManager, this.storageHandler, this.logger, this.options );

            attempt( () => me.#requestHandlers.set( handler.path, handler ) );

            if ( !!pAddImmediately )
            {
                this.addRequestHandler( handler, handler.path );
            }

            return handler;
        }

        getRequestHandler( pPath )
        {
            return this.#requestHandlers.get( asString( pPath || _mt, true ) || "/" );
        }

        /**
         * Configures the server to use the specified Router object for the specified paths
         * @param pRouter an object capable of resolving the function to call based on the URL of the request
         * @param pPaths one or more paths the specified router should handle
         * @returns {Promise<void>}
         */
        async addRouter( pRouter, ...pPaths )
        {
            let paths = [...(asArray( pPaths || [] ) || [])].filter( e => !isBlank( e ) ).map( e => "/" + asString( e.replace( /^\//, _mt ), true ) );
            for( let path of paths )
            {
                this.appServer.all( path, pRouter );
            }
        }

        addRequestHandler( pHandler, ...pPaths )
        {
            const me = this;

            const handler = (isFunction( pHandler ) && !isClass( pHandler )) ? pHandler : (isNonNullObject( pHandler ) && isFunction( pHandler.handleRequest ) ? pHandler.handleRequest : RequestHandler.PASSTHROUGH_HANDLER);

            const paths = [...(asArray( pPaths || [] ) || [])].filter( e => !isBlank( e ) ).map( e => "/" + asString( e.replace( /^\//, _mt ), true ) );

            if ( paths.length )
            {
                for( let path of paths )
                {
                    this.appServer.all( path, handler );
                    attempt( () => me.#requestHandlers.set( (path || handler.path), handler ) );
                }
            }
            else
            {
                let path = handler.path || "/";
                this.appServer.all( path, handler );
                attempt( () => me.#requestHandlers.set( (path || handler.path), handler ) );
            }
        }

        configureRequestParsers( pParsersConfig )
        {
            configureRequestParsers( this.appServer, pParsersConfig );
        }

        async createHttpServer( pOptions )
        {
            const opts = populateOptions( pOptions || {}, this.options );

            this.#appServer = this.#appServer || express();

            this.#server = http.createServer( opts, this.#appServer );

            return this.#server;
        }

        async createHttpsServer( pOptions )
        {
            let defaultOptions =
                {
                    keyPath: this.keyPath || pOptions?.certPath || this.options.certPath,
                    certPath: this.certPath || pOptions?.keyPath || this.options.keyPath
                };

            const opts = populateOptions( (pOptions || defaultOptions), populateOptions( {}, (this.options || defaultOptions), defaultOptions ) );

            this.#appServer = this.#appServer || express();

            this.#server = https.createServer( opts, this.appServer );

            return this.#server;
        }

        async createServer( pOptions )
        {
            const me = this;

            const opts = populateOptions( pOptions, this.options );

            if ( this.useSsl && !(isBlank( this.keyPath ) || isBlank( this.certPath )) )
            {
                return await asyncAttempt( async() => await me.createHttpsServer( opts ) );
            }

            return await asyncAttempt( async() => await me.createHttpServer( opts ) );
        }

        async startServices( ...pArgs )
        {
            return await asyncAttempt( async() => this.routeHandlersFactory.start() );
        }

        async stopServices( ...pArgs )
        {
            return await asyncAttempt( async() => this.routeHandlersFactory.stop() );
        }

        async startServer( pOptions )
        {
            const me = this;

            const opts = populateOptions( pOptions || {}, this.options || {} );

            this.addEventHandlers( opts.eventHandlers || {} );

            await asyncAttempt( async() => await me.startServices( opts ) );

            const server = await asyncAttempt( async() => me.createServer( opts ) );

            attempt( () =>
                     {
                         server.listen( this.port, async() =>
                         {
                             (this.logger || konsole).info( "Server listening on port: " + me.port );
                         } );
                     } );

            process.on( "beforeExit", async() =>
            {
                asyncAttempt( () => me.stopServer() );
            } );

            return server;
        }

        async stopServer()
        {
            const me = this;

            await asyncAttempt( async() => await me.stopServices( me.options ) ).then( () =>
                                                                                       {
                                                                                           attempt( () => me.logger.info( "Stopping Services" ) );
                                                                                           konsole.log( "Stopped Services" );
                                                                                       } ).catch( err =>
                                                                                                  {
                                                                                                      konsole.log( err?.message, err, "stopServices" );
                                                                                                      toolBocksModule.reportError( err, err?.message || asString( err ), "error", moduleName, "stopServices" );
                                                                                                  } );

            attempt( () => me.#server.close( () =>
                                             {
                                                 attempt( () => (me.logger || konsole).info( "Stopping Server..." ) );
                                                 attempt( () => me.#server.closeAllConnections() );
                                                 attempt( () => closeLogger( me.logger ) );
                                                 konsole.log( "Stopped Server" );
                                             } ) );
        }
    }

    let mod =
        {
            dependencies:
                {
                    http,
                    https,
                    express,
                    bodyParser,
                    cookieParser,
                    os,
                    perfUtils,
                    core,
                    constants,
                    moduleUtils
                },
            classes:
                {
                    PerformanceObserver,
                    RequestHandler,
                    RequestHandlerFactory,
                    NodeServerController
                },
            userInfo,
            defaultEventHandlers:
                {
                    "uncaughtException": handleUncaughtException,
                    "unhandledRejection": handleUnhandledRejection,
                    "beforeExit": handleBeforeExit,
                    "exit": handleExit,
                    "warning": handleWarning,
                    "disconnect": handleDisconnect
                },
            NodeServerController
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
