(function exposeModule()
{
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
     * Imports the Middleware framework
     */
    const express = require( "express" );

    /**
     * Imports the module to handle cross-origin requests
     * Added to the filter chain if allowsCors is true
     */
    const cors = require( "cors" );

    const compression = require( "compression" );

    /**
     * Import the ToolBocks Performance-related module
     */
    const performanceModule = require( "@toolbocks/performance" );

    const toolbocks = require( "@toolbocks/core" );

    const depInjection = require( "@toolbocks/dep-injection" );

    const jsonUtils = require( "@toolbocks/json" );

    const logUtils = require( "@toolbocks/logging" );

    const { ServerConfiguration, FilterConfiguration } = require( "./ServerConfiguration.js" );

    const { RequestFilterFactory } = require( "./FilterFactory.js" );

    const { RequestHandlerFactory } = require( "./HandlerFactory.js" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = toolbocks;

    const
        {
            ToolBocksModule,
            IllegalStateError,
            IllegalArgumentError,
            $ln,
            attempt,
            attemptSilent,
            lock,
            no_op,
            resolveError,
            readProperty,
            konsole = console
        } = moduleUtils;

    const { _ud, _mt } = constants;

    const { isNull, isObject, isNonNullObject, isArray, isFunction, isClass } = typeUtils;

    const { asString, isBlank, toBool, isFilePath } = stringUtils;

    const { asArray } = arrayUtils;

    const { DependentObject, Dependencies, Dependency } = depInjection;

    const { asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    // noinspection JSUnusedLocalSymbols
    const { getPerformanceTimer } = performanceModule;

    const SIMPLE_LOGGER = new SimpleLogger( ToolBocksModule.getGlobalLogger(), console );

    const DEFAULT_LOGGER = SourcedSimpleLogger.adapt( SIMPLE_LOGGER, "ServerFactory" );

    const isExpress = e => !isNull( e ) && isFunction( e ) && isFunction( e?.use );

    class __Shared
    {
        #__registry;

        constructor( pDependencyRegistry )
        {
            this.#__registry = pDependencyRegistry;
        }

        get registry()
        {
            return this.#__registry;
        }

        // noinspection JSUnusedGlobalSymbols
        async getRegistry()
        {
            return isNonNullObject( this.#__registry ) ? await this.registry.init() : null;
        }

        get userInfo()
        {
            return os.userInfo( { "encoding": "utf-8" } );
        }

        get homeDirectory()
        {
            let user = this.userInfo || os.userInfo( { "encoding": "utf-8" } );
            if ( isNonNullObject( user ) )
            {
                // noinspection JSValidateTypes
                return (isFunction( user.homedir ) ? user.homedir() : user.homedir) || os.homedir();
            }
            return os.homedir();
        }

        // noinspection JSUnusedGlobalSymbols
        get tmpDir()
        {
            return os.tmpdir();
        }

        get tmpdir()
        {
            return os.tmpdir();
        }

        // noinspection JSUnusedGlobalSymbols
        get currentPath()
        {
            return process.cwd();
        }

        // noinspection JSUnusedGlobalSymbols
        get sourcePath()
        {
            return __dirname + "/" + __filename;
        }
    }

    class ServerFactory extends __Shared
    {
        #dependencyRegistry;

        constructor( pDependencyRegistry )
        {
            super( pDependencyRegistry );

            this.#dependencyRegistry = pDependencyRegistry ?? this.registry;
        }

        get dependencyRegistry()
        {
            return this.#dependencyRegistry ?? { init: async() => this };
        }

        async getDependencyRegistry()
        {
            return await this.dependencyRegistry.init();
        }

        resolveModulePath( pModulePath, pConfiguration )
        {
            const configuration = ServerConfiguration.from( pConfiguration ?? {} );
            if ( isFunction( configuration?.resolveModulePath ) )
            {
                return configuration.resolveModulePath( pModulePath );
            }

            let modulePath = asString( pModulePath, true );

            if ( modulePath.startsWith( "@" ) )
            {
                return modulePath;
            }

            if ( isBlank( modulePath ) )
            {
                return this.homeDirectory;
            }

            return modulePath;
        }

        #isValidFactoryArguments( pModulePath, pFactoryClassName )
        {
            const modulePath = asString( pModulePath, true );
            const factoryClassName = asString( pFactoryClassName, true );

            return !isBlank( factoryClassName ) && (isBlank( modulePath ) || modulePath.startsWith( "@" ) || isFilePath( modulePath ));
        }

        async #loadModule( pModulePath )
        {
            return require( pModulePath );
        }

        #loadClass( pModule, pClassName )
        {
            let klass = null;

            if ( isNonNullObject( pModule ) || isFunction( pModule ) )
            {
                klass = pModule[pClassName] ?? this[pClassName];
            }

            if ( isClass( klass ) || isNonNullObject( klass ) )
            {
                return klass;
            }

            if ( isClass( pClassName ) || isNonNullObject( pClassName ) )
            {
                return pClassName;
            }

            const msg = `Could not load class, ${pClassName}, from module, ${pModule?.name || asString( pModule )}`;
            throw new IllegalArgumentError( msg,
                                            {
                                                detail:
                                                    {
                                                        module: pModule,
                                                        className: pClassName
                                                    },
                                                pModule,
                                                pClassName
                                            } );
        }

        async #instantiateFactory( pFactory, pDependencyRegistry = this.dependencyRegistry )
        {
            if ( isClass( pFactory ) )
            {
                const registry = await (pDependencyRegistry?.init() ?? await this.getDependencyRegistry());
                const dependencies = await registry.resolveDependencies( pFactory.DEPENDENCIES );
                return new pFactory( dependencies );
            }

            if ( isNonNullObject( pFactory ) )
            {
                if ( isFunction( pFactory.init ) )
                {
                    return pFactory.init( pDependencyRegistry );
                }
                return pFactory;
            }

            throw new IllegalStateError( `Could not instantiate factory, ${pFactory?.name || pFactory}`,
                                         {
                                             detail:
                                                 {
                                                     factory: pFactory,
                                                     registry: pDependencyRegistry
                                                 }
                                         } );
        }

        async #resolveFilterFactory( pServerConfiguration, pDependencyRegistry = this.dependencyRegistry )
        {
            let factory;

            const registry = await (pDependencyRegistry?.init() ?? await this.getDependencyRegistry());

            const serverConfiguration = ServerConfiguration.from( pServerConfiguration );

            const factoryConfig = serverConfiguration.filterFactoryConfiguration || readProperty( serverConfiguration, "filter_factory" );

            if ( isNonNullObject( factoryConfig ) )
            {
                const modulePath = this.resolveModulePath( factoryConfig.modulePath, serverConfiguration );
                const factoryClassName = factoryConfig.factoryClass || readProperty( factoryConfig, "factory_class", "factory" );

                if ( this.#isValidFactoryArguments( modulePath, factoryClassName ) )
                {
                    const mod = await this.#loadModule( modulePath );

                    factory = this.#loadClass( mod, factoryClassName );

                    if ( isClass( factory ) )
                    {
                        factory = await this.#instantiateFactory( factory, registry );
                    }

                    if ( isNull( factory ) || !isObject( factory ) || !(factory instanceof RequestFilterFactory) )
                    {
                        factory = new RequestFilterFactory( new Dependencies( new Dependency( registry, "dependency.registry", "dependencyRegistry" ) ) );
                    }
                }
            }

            factory = factory ?? new RequestFilterFactory( new Dependencies( new Dependency( registry, "dependency.registry", "dependencyRegistry" ) ) );

            if ( factory )
            {
                factory = await factory.init();
            }

            return factory;
        }

        async #resolveHandlerFactory( pServerConfiguration, pDependencyRegistry = this.dependencyRegistry )
        {
            let factory;

            const registry = await (pDependencyRegistry?.init() ?? await this.getDependencyRegistry());

            const serverConfiguration = ServerConfiguration.from( pServerConfiguration );

            const handlerFactoryConfig = serverConfiguration.handlerFactoryConfiguration || readProperty( serverConfiguration, "handler_factory" );

            if ( isNonNullObject( handlerFactoryConfig ) )
            {
                const modulePath = this.resolveModulePath( handlerFactoryConfig.modulePath, serverConfiguration );
                const factoryClassName = handlerFactoryConfig.factoryClass || readProperty( handlerFactoryConfig, "factory_class", "factory" );

                if ( this.#isValidFactoryArguments( modulePath, factoryClassName ) )
                {
                    const mod = await this.#loadModule( modulePath );

                    factory = this.#loadClass( mod, factoryClassName );

                    if ( isClass( factory ) )
                    {
                        factory = await this.#instantiateFactory( factory, registry );
                    }

                    if ( isNull( factory ) || !isObject( factory ) || !(factory instanceof RequestHandlerFactory) )
                    {
                        factory = new RequestFilterFactory( new Dependencies( new Dependency( registry, "dependency.registry", "dependencyRegistry" ) ) );
                    }
                }
            }

            factory = factory ?? new RequestHandlerFactory( new Dependencies( new Dependency( registry, "dependency.registry", "dependencyRegistry" ) ) );

            if ( factory )
            {
                factory = await factory.init();
            }

            return factory;
        }

        async #resolveFilters( configuration, filterFactory )
        {
            const filters = [];

            const filterConfigs = configuration.filterConfigurations ?? readProperty( configuration, "filters", "" );

            if ( isArray( filterConfigs ) && $ln( filterConfigs ) > 0 )
            {
                for( let i = 0, n = $ln( filterConfigs ); i < n; i++ )
                {
                    const cfg = filterConfigs[i];

                    if ( isNonNullObject( cfg ) && cfg instanceof FilterConfiguration )
                    {
                        const modulePath = cfg.modulePath || readProperty( cfg, "module_path", "path" );
                        const functionName = cfg.functionName || readProperty( cfg, "function_name", "action", "controller" );
                        const abortable = cfg.abortable ?? readProperty( cfg, "abortable" );

                        const mod = await this.#loadModule( this.resolveModulePath( modulePath, configuration ) );
                        const func = mod[functionName];

                        const filter = filterFactory.createFilter( func, true, abortable );
                        if ( !isNull( filter ) && isFunction( filter ) )
                        {
                            filters.push( filter );
                        }
                    }
                }
            }

            return filters;
        }

        async #buildRoute( routeCfg, filterFactory, handlerFactory, router )
        {
            const method = routeCfg.method || "get";

            // Ensure path prefixes are clean
            const path = routeCfg.path.startsWith( "/" ) ? routeCfg.path : `/${routeCfg.path}`;

            // Build route-specific filter
            const buildFilter = async( cfg ) =>
            {
                const mod = await this.#loadModule( this.resolveModulePath( cfg.modulePath ) );
                const func = mod[cfg.functionName];
                return filterFactory.createFilter( func, true, cfg.abortable );
            };

            const filterConfigs = routeCfg.filterConfigurations;
            const filters = await Promise.all( filterConfigs.map( buildFilter ) );

            // Build route-specific handlers
            const buildHandler = async( cfg ) =>
            {
                const mod = await this.#loadModule( this.resolveModulePath( cfg.modulePath ) );
                const func = mod[cfg.functionName];
                return handlerFactory.createHandler( func, true, cfg.abortable );
            };

            const handlerConfigs = routeCfg.handlerConfigurations;
            const handlers = await Promise.all( handlerConfigs.map( buildHandler ) );

            // Mount directly to the transient router instance
            router[method]( path, ...filters, ...handlers );

            return router;
        }

        async #createRouter( routeConfigs, handlerFactory, filterFactory )
        {
            const router = express.Router();

            for( let i = 0, n = $ln( routeConfigs ); i < n; i++ )
            {
                const routeCfg = routeConfigs[i];
                await this.#buildRoute( routeCfg, filterFactory, handlerFactory, router );
            }

            return router;
        }

        #resolvePathPrefix( pPrefix )
        {
            let prefix = asString( pPrefix, true );
            if ( !prefix.startsWith( "/" ) )
            {
                prefix = ("/" + prefix);
            }
            return prefix;
        }

        // noinspection JSUnusedGlobalSymbols
        async createServer( pServerConfiguration, pDependencyRegistry = this.dependencyRegistry )
        {
            const registry = await (pDependencyRegistry?.init() ?? await this.getDependencyRegistry());

            const configuration = ServerConfiguration.from( pServerConfiguration );

            /*
             const id = configuration.id || readProperty( configuration, "id", "server_id" );
             const name = configuration.name || readProperty( configuration, "name", "server_name" );
             const port = asInt( configuration.port || readProperty( configuration, "port", "server_port" ) );

             const moduleBasePath = configuration.resolveModulePath( configuration.basePath || readProperty( configuration, "modules_base_path", "modules_path", "base_path" ) );

             */
            const allowCors = toBool( configuration.allowCors ?? readProperty( configuration, "allow_cross_origin_requests", "allow_cors", "cors" ) );

            const useCompression = toBool( configuration.useCompression ?? readProperty( configuration, "use_compression", "compression" ) );
            const compressionOptions = useCompression ? asObject( configuration.compressionOptions ?? readProperty( configuration, "compression_options", "compression" ) ) : null;

            const parseCookies = toBool( configuration.parseCookies ?? readProperty( configuration, "parse_cookies", "cookies" ) );

            const filterFactory = await this.#resolveFilterFactory( configuration, registry );
            const filters = await this.#resolveFilters( configuration, filterFactory );

            const routeFactoryConfig = configuration.routeFactoryConfiguration ?? readProperty( configuration, "route_config_factory", "route_factory" );
            const pathPrefix = this.#resolvePathPrefix( (routeFactoryConfig ?? configuration).pathPrefix || configuration["route_prefix"] || readProperty( routeFactoryConfig ?? configuration, "path_prefix", "route_prefix", "path", "prefix" ) );

            const handlerFactory = await this.#resolveHandlerFactory( configuration, registry ) ?? await this.#resolveHandlerFactory( routeFactoryConfig, registry );

            const routeConfigs = configuration.routeConfigurations ?? readProperty( configuration, "routes" );

            let router = await this.#createRouter( routeConfigs, handlerFactory, filterFactory, routeFactoryConfig, pathPrefix );

            const app = express();

            app.disable( "x-powered-by" );
            app.set( "case sensitive routing", true );

            if ( allowCors )
            {
                app.use( cors() );
            }

            if ( useCompression )
            {
                if ( isNonNullObject( compressionOptions ) )
                {
                    app.use( compression( compressionOptions ) );
                }
                else
                {
                    app.use( compression() );
                }
            }

            if ( parseCookies )
            {
                app.use( cookieParser() );
            }

            // Ensure standard parsers are mounted before custom filters
            app.use( express.json() );
            app.use( express.urlencoded( { extended: true } ) );

            if ( $ln( filters ) > 0 )
            {
                app.use( ...filters );
            }

            const handler = ( req, res, next ) =>
            {
                router( req, res, next );
            };

            // HERE IS WHERE WIRE UP OUR UNIVERSAL HANDLER
            app.use( this.#resolvePathPrefix( pathPrefix ), handler );

            const serverContext =
                {
                    options: { ...(asObject( configuration.options ?? {} )) },
                    app,
                    configuration,
                    handlerFactory,
                    filterFactory,
                    routeFactoryConfig,
                    pathPrefix,
                    updateRouter: ( pRouter ) => { router = pRouter ?? router; }
                };

            const dependencies = await registry.resolveDependencies( Server.DEPENDENCIES );

            return new Server( dependencies, serverContext, app );
        }

    }

    /**
     * Acts as a singleton registry of active servers,
     * responding to process-level events in a centralized fashion
     *
     * @class
     * @singleton
     */
    class ServerLifecycleManager
    {
        static #initialized = false;
        static #activeServers = new Set();

        static register( pServer )
        {
            this.#activeServers.add( pServer );
            this.#initializeProcessHooks();
        }

        static unregister( pServer )
        {
            this.#activeServers.delete( pServer );
        }

        static #initializeProcessHooks()
        {
            if ( this.#initialized )
            {
                return;
            }

            this.#initialized = true;

            let logger = ToolBocksModule.resolveLogger( DEFAULT_LOGGER, ToolBocksModule.getGlobalLogger(), console );
            logger = SourcedSimpleLogger.adapt( logger, "ServerLifecycleManager" );

            const EXIT_CODES = lock( {
                                         NORMAL_SHUTDOWN: 0,
                                         UNCAUGHT_EXCEPTION: 1,
                                         UNHANDLED_REJECTION: 2,
                                         SIGINT: 130,
                                         SIGTERM: 143
                                     } );

            const stopAllServers = async() =>
            {
                const stopPromises = [];

                for( const server of this.#activeServers )
                {
                    stopPromises.push( server.stop().then( no_op ).catch( err => logger.error( err ) ) );
                }

                await Promise.allSettled( stopPromises );
            };

            const handleUncaughtException = ( pException, pOrigin ) =>
            {
                const ex = resolveError( pException || (new Error( "An uncaught exception occurred " + (!isBlank( asString( (pOrigin || pException.origin), true ) ) ? asString( (pOrigin || pException?.origin), true ) : _mt) )), pException?.message );
                attemptSilent( () => logger.error( ex ) );
                stopAllServers().finally( no_op );
            };

            const handleUnhandledRejection = ( pReason ) =>
            {
                const ex = resolveError( pReason || (new Error( "An unhandled Promise rejection occurred " + (!isBlank( asString( pReason, true ) ) ? asString( pReason ) : _mt) )), (pReason?.message || pReason) );
                attemptSilent( () => logger.error( ex ) );
            };

            const handleBeforeExit = async() =>
            {
                attemptSilent( () => logger.info( `The process is terminating; stopping all registered servers` ) );
                await stopAllServers();
            };

            const handleExit = function( pCode )
            {
                const code = pCode || process.exitCode;
                attemptSilent( () => logger.info( "Node.js exited with code " + code ) );
                // stopAllServers() is fire-and-forget here because the event loop is already unwinding
                stopAllServers().finally( no_op );
            };

            const handleWarning = ( pEvent ) =>
            {
                const warning = resolveError( pEvent || resolveError( new Error( pEvent?.name + ":" + pEvent?.message ), pEvent?.name ), (pEvent?.message || pEvent) );
                let msg = (warning.name || asString( warning, true ) || "WARNING") + ", " + asString( warning.message || "(unknown)", true ) + ":\n" + (asString( warning.stack, true ) || "No Stack Trace Available") + "\n";
                attemptSilent( () => logger.warn( msg ) );
            };

            process.on( "uncaughtException", handleUncaughtException );
            process.on( "unhandledRejection", handleUnhandledRejection );
            process.on( "beforeExit", handleBeforeExit );
            process.on( "exit", handleExit );
            process.on( "warning", handleWarning );

            process.on( "SIGINT", () => stopAllServers().finally( () => process.exit( EXIT_CODES.SIGINT ) ) );
            process.on( "SIGTERM", () => stopAllServers().finally( () => process.exit( EXIT_CODES.SIGTERM ) ) );
        }
    }

    // noinspection DuplicatedCode
    class Server extends DependentObject
    {
        #id;
        #name;
        #port;

        #httpServer;
        #appServer;

        #context;
        #configuration;

        #ssl;
        #sslKeyPath;
        #sslCertPath;

        #pathPrefix;

        #started;

        #eventHandlersRegistered = false;
        #starting = false;
        #stopping = false;

        #activeSockets = new Set();

        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies );

            const dependencies = Dependencies.resolveDependenciesInstance( pDependencies );

            this.#context = asObject( pOptions ?? dependencies.findDependency( "http.server.context" ) );
            this.#configuration = asObject( this.#context?.configuration ?? dependencies.findDependency( "http.server.configuration" ) );

            const ctx = this.#context ?? this.#configuration ?? this.options;
            const cfg = this.#configuration ?? ctx;

            this.#id = ctx?.id || 1;
            this.#name = ctx?.name || `Server ${this.#id}`;
            this.#port = ctx?.port || ServerConfiguration.DEFAULTS.PORT;

            // noinspection JSUnresolvedReference
            this.#pathPrefix = ctx?.pathPrefix ||
                               ctx?.routePrefix ||
                               readProperty( ctx, "route_prefix", "path_prefix" ) ||
                               readProperty( cfg, "route_prefix", "path_prefix" );

            this.#ssl = toBool( cfg?.useSsl ?? readProperty( cfg, "use_ssl" ) );
            this.#sslKeyPath = cfg?.keyPath || readProperty( cfg, "key_path", "ssl_key_path", "ssl_key", "key" );
            this.#sslCertPath = cfg?.certPath || readProperty( cfg, "cert_path", "ssl_cert_path", "certificate_path", "ssl_certificate_path", "certificate" );

            this.#ssl = this.#ssl && !isBlank( this.#sslKeyPath ) && !isBlank( this.#sslCertPath );

            this.#appServer = (asArray( pArgs ?? [] ).find( isExpress )) ?? this.#context?.app ?? dependencies.findDependency( "http.app.server" );
            this.#appServer = isExpress( this.#appServer ) ? this.#appServer : this.#context?.app ?? dependencies.findDependency( "http.app.server" );
            this.#appServer = isExpress( this.#appServer ) ? this.#appServer : dependencies.findDependency( "http.app.server" );
            this.#appServer = isExpress( this.#appServer ) ? this.#appServer : express();

            // Read the certificate buffers synchronously before binding the server
            const serverOptions = cfg?.options ??
                                  this.#context?.options ??
                                  (this.#ssl ?
                                      {
                                          cert: fs.readFileSync( this.#sslCertPath ),
                                          key: fs.readFileSync( this.#sslKeyPath )
                                      } : {});

            this.#httpServer = this.#ssl ? https.createServer( serverOptions, this.#appServer ) : http.createServer( serverOptions, this.#appServer );

            // Track active connections to allow forceful draining during shutdown
            this.#httpServer.on( "connection", ( socket ) =>
            {
                this.#activeSockets.add( socket );

                socket.on( "close", () =>
                {
                    this.#activeSockets.delete( socket );
                } );
            } );
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
            return this.#port;
        }

        // noinspection JSUnusedGlobalSymbols
        get httpServer()
        {
            return this.#httpServer;
        }

        // noinspection JSUnusedGlobalSymbols
        get appServer()
        {
            return this.#appServer;
        }

        get configuration()
        {
            return this.#configuration;
        }

        get started()
        {
            return this.#started;
        }

        // noinspection JSUnusedGlobalSymbols
        get eventHandlersRegistered()
        {
            return this.#eventHandlersRegistered;
        }

        async init( ...pArgs )
        {
            super.init( ...pArgs );

            await this.#registerEventHandlers();

            return this;
        }

        async dispose()
        {
            await this.stop();

            await this.#unregisterEventHandlers();
        }

        async start()
        {
            if ( !this.initialized )
            {
                await this.init();
            }

            if ( !(this.started || this.#starting) )
            {
                const port = this.#configuration?.port || ServerConfiguration.DEFAULTS.PORT || 3000;

                this.#starting = true;

                const logger = ToolBocksModule.resolveLogger( this.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

                // noinspection TypeScriptUMDGlobal,JSValidateTypes
                return new Promise( ( resolve, reject ) =>
                                    {
                                        this.#httpServer.listen( port, () =>
                                        {
                                            this.#started = true;

                                            this.#starting = false;
                                            this.#stopping = false;

                                            attemptSilent( () => (logger ?? console).info( `[${this.#configuration?.name || "Server"}] Listening on port ${port} (SSL: ${this.#ssl})` ) );

                                            resolve( this );
                                        } ).on( "error", ( err ) =>
                                        {
                                            reject( err );
                                        } );
                                    } );
            }

            return this;
        }

        async stop()
        {
            if ( this.started && !this.#stopping )
            {
                this.#stopping = true;

                // Forcefully sever all active TCP connections.
                // This guarantees the req.on("close") event fires in the HandlerFactory wrapper,
                // aborting the signal and terminating downstream queries/integrations.
                for( const socket of this.#activeSockets )
                {
                    attemptSilent( () => socket.destroy() );
                }

                this.#activeSockets.clear();

                // noinspection TypeScriptUMDGlobal,JSValidateTypes
                return new Promise( ( resolve, reject ) =>
                                    {
                                        // close() stops accepting new connections but keeps existing ones open until they finish
                                        this.#httpServer.close( async( err ) =>
                                                                {
                                                                    if ( err )
                                                                    {
                                                                        return reject( err );
                                                                    }

                                                                    this.#started = false;
                                                                    await this.dispose();

                                                                    const logger = ToolBocksModule.resolveLogger( this.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );
                                                                    attemptSilent( () => (logger ?? console).info( `[${this.#configuration?.name || "Server"}] Shutdown complete.` ) );

                                                                    this.#stopping = false;

                                                                    resolve( this );
                                                                } );
                                    } );
            }

            return this;
        }

        async #registerEventHandlers( pUnregister = false )
        {
            if ( pUnregister )
            {
                ServerLifecycleManager.unregister( this );
            }
            else
            {
                ServerLifecycleManager.register( this );
            }

            this.#eventHandlersRegistered = !pUnregister;

            return this;
        }

        async #unregisterEventHandlers()
        {
            return this.#registerEventHandlers( true );
        }

    }

    // noinspection JSUnusedLocalSymbols
    const startPerformanceMonitor = function( pEntryTypes, pCallback )
    {
        const performanceObserver = new PerformanceObserver( pCallback );
        performanceObserver.observe( { entryTypes: pEntryTypes } );
        return performanceObserver;
    };

    // noinspection JSUnusedLocalSymbols
    const stopPerformanceMonitor = function( pInstance )
    {
        if ( isNonNullObject( pInstance ) && pInstance instanceof PerformanceObserver )
        {
            attempt( () => pInstance.disconnect() );
        }
    };

    Server.DEPENDENCIES =
        {
            ...(DependentObject.DEPENDENCIES)
        };

    const runtime = new __Shared();

    const mod =
        {
            runtime,
            classes:
                {
                    ServerConfiguration,
                    ServerFactory,
                    Server
                },
            ServerFactory
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
