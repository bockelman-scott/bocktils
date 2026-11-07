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

    const
        {
            ServerConfiguration,
            FilterConfiguration,
            HandlerConfiguration,
            RouteConfiguration
        } = require( "./ServerConfiguration.js" );

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
            functionToString,
            resolveError,
            readProperty
        } = moduleUtils;

    const { _ud, _mt } = constants;

    const { isNull, isObject, isNonNullObject, isArray, isFunction, isError, isClass, getClassName } = typeUtils;

    const { asString, asInt, isBlank, toBool, _lct } = stringUtils;

    const { asArray } = arrayUtils;

    const { DependentObject, Dependencies } = depInjection;

    const { asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const { getPerformanceTimer } = performanceModule;

    const SIMPLE_LOGGER = new SimpleLogger( ToolBocksModule.getGlobalLogger(), console );

    const DEFAULT_LOGGER = SourcedSimpleLogger.adapt( SIMPLE_LOGGER, "ServerFactory" );

    const isExpress = e => !isNull( e ) && isFunction( e ) && isFunction( e?.use );

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

        #isValidFactoryArguments( modulePath, factoryClassName )
        {
            return !(isBlank( modulePath ) || /^\.$/.test( modulePath ) || isBlank( factoryClassName ));
        }

        async #loadModule( pModulePath )
        {
            return require( pModulePath );
        }

        #loadClass( pModule, pClassName )
        {
            return pModule[pClassName];
        }

        async #instantiateFactory( pFactory, pDependencyRegistry = this.dependencyRegistry )
        {
            const registry = await (pDependencyRegistry?.init() ?? await this.getDependencyRegistry());
            const dependencies = await registry.resolveDependencies( pFactory.DEPENDENCIES );
            return new pFactory( dependencies );
        }

        async #resolveFilterFactory( pServerConfiguration, pDependencyRegistry = this.dependencyRegistry )
        {
            let factory;

            const registry = await (pDependencyRegistry?.init() ?? await this.getDependencyRegistry());

            const factoryConfig = pServerConfiguration.filterFactoryConfiguration || readProperty( pServerConfiguration, "filter_factory" );

            if ( isNonNullObject( factoryConfig ) )
            {
                const modulePath = factoryConfig.modulePath;
                const factoryClassName = factoryConfig.factoryClass;

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
                        factory = new RequestFilterFactory( new Dependencies( new Dependency( registry ), "dependency.registry", "dependencyRegistry" ) );
                    }
                }
            }

            return factory ?? new RequestFilterFactory( new Dependencies( new Dependency( registry ), "dependency.registry", "dependencyRegistry" ) );
        }

        async #resolveHandlerFactory( pServerConfiguration, pDependencyRegistry = this.dependencyRegistry )
        {
            let factory;

            const registry = await (pDependencyRegistry?.init() ?? await this.getDependencyRegistry());

            const handlerFactoryConfig = pServerConfiguration.handlerFactoryConfiguration || readProperty( pServerConfiguration, "handler_factory" );

            if ( isNonNullObject( handlerFactoryConfig ) )
            {
                const modulePath = handlerFactoryConfig.modulePath;
                const factoryClassName = handlerFactoryConfig.factoryClass;

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

            return factory ?? new RequestHandlerFactory( new Dependencies( new Dependency( registry, "dependency.registry", "dependencyRegistry" ) ) );
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

                        const mod = await this.#loadModule( modulePath );
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
                const mod = await this.#loadModule( cfg.modulePath );
                const func = mod[cfg.functionName];
                return filterFactory.createFilter( func, true, cfg.abortable );
            };

            const filterConfigs = routeCfg.filterConfigurations;
            const filters = await Promise.all( filterConfigs.map( buildFilter ) );

            // Build route-specific handlers
            const buildHandler = async( cfg ) =>
            {
                const mod = await this.#loadModule( cfg.modulePath );
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

        async createServer( pServerConfiguration, pDependencyRegistry = this.dependencyRegistry )
        {
            const registry = await (pDependencyRegistry?.init() ?? await this.getDependencyRegistry());

            const configuration = ServerConfiguration.from( pServerConfiguration );

            const id = configuration.id || readProperty( configuration, "id", "server_id" );
            const name = configuration.name || readProperty( configuration, "name", "server_name" );
            const port = asInt( configuration.port || readProperty( configuration, "port", "server_port" ) );

            let useSsl = toBool( configuration.useSsl ?? readProperty( configuration, "use_ssl", "ssl" ) );

            const sslConfig = configuration.sslConfiguration ?? readProperty( configuration, "ssl_configuration", "ssl_config", "ssl" );

            useSsl = useSsl && isNonNullObject( sslConfig );

            const keyPath = useSsl ? sslConfig.keyPath || readProperty( sslConfig ?? configuration, "key_path", "ssl_key_path" ) : _mt;
            const certPath = useSsl ? sslConfig.certPath || readProperty( sslConfig ?? configuration, "cert_path", "ssl_cert_path", "certificate_path" ) : _mt;

            useSsl = useSsl && !(isBlank( keyPath ) || isBlank( certPath ));

            const filterFactory = await this.#resolveFilterFactory( configuration, registry );
            const filters = await this.#resolveFilters( configuration, filterFactory );

            const routeFactoryConfig = configuration.routeFactoryConfiguration ?? readProperty( configuration, "route_config_factory", "route_factory" );
            const pathPrefix = (routeFactoryConfig ?? configuration).pathPrefix || configuration["route_prefix"] || readProperty( routeFactoryConfig ?? configuration, "path_prefix", "route_prefix", "path", "prefix" );

            const handlerFactory = await this.#resolveHandlerFactory( configuration, registry ) ?? this.#resolveHandlerFactory( routeFactoryConfig, registry );

            const routeConfigs = configuration.routeConfigurations ?? readProperty( configuration, "routes" );

            let router = await this.#createRouter( routeConfigs, handlerFactory, filterFactory, routeFactoryConfig, pathPrefix );

            const app = express();

            // Ensure standard parsers are mounted before custom filters
            app.use( express.json() );
            app.use( express.urlencoded( { extended: true } ) );

            if ( $ln( filters ) > 0 )
            {
                app.use( ...filters );
            }

            app.use( pathPrefix, ( req, res, next ) =>
            {
                router( req, res, next );
            } );

            // TODO: helmet, cors, compression

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

            let dependencies = await registry.resolveDependencies( Server.DEPENDENCIES );

            dependencies = dependencies.merge( dependencies,
                                               new Dependency( registry, "dependency.registry", "dependencyRegistry" ),
                                               new Dependency( serverContext, "http.server.context", "serverContext" ),
                                               new Dependency( app, "http.app.server", "appServer" ),
                                               new Dependency( this, "http.server.factory", "serverFactory" ) );

            return new Server( dependencies, serverContext, app );
        }

    }


    class Server extends DependentObject
    {
        #httpServer;
        #appServer;

        #context;
        #configuration;

        #ssl;
        #sslKeyPath;
        #sslCertPath;

        #pathPrefix;

        #started;

        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );

            const dependencies = Dependencies.resolveDependenciesInstance( pDependencies );

            this.#context = asObject( pOptions ?? dependencies.findDependency( "http.server.context" ) );
            this.#configuration = asObject( this.#context?.configuration ?? dependencies.findDependency( "http.server.configuration" ) );
            this.#pathPrefix = (this.#context ?? this.#configuration)?.pathPrefix || (this.#context ?? this.#configuration)?.routePrefix || readProperty( (this.#context ?? this.#configuration), "route_prefix", "path_prefix" ) || readProperty( (this.#configuration ?? this.#context), "route_prefix", "path_prefix" );

            this.#ssl = toBool( this.#configuration?.useSsl ?? readProperty( this.#configuration, "use_ssl" ) );
            this.#sslKeyPath = this.#configuration?.keyPath || readProperty( this.#configuration, "key_path", "ssl_key_path", "ssl_key", "key" );
            this.#sslCertPath = this.#configuration?.certPath || readProperty( this.#configuration, "cert_path", "ssl_cert_path", "certificate_path", "ssl_certificate_path", "certificate" );

            this.#ssl = this.#ssl && !isBlank( this.#sslKeyPath ) && !isBlank( this.#sslCertPath );

            this.#appServer = (asArray( pArgs ?? [] ).find( isExpress )) ?? this.#context?.app ?? dependencies.findDependency( "http.app.server" );
            this.#appServer = isExpress( this.#appServer ) ? this.#appServer : this.#context?.app ?? dependencies.findDependency( "http.app.server" );
            this.#appServer = isExpress( this.#appServer ) ? this.#appServer : dependencies.findDependency( "http.app.server" );
            this.#appServer = isExpress( this.#appServer ) ? this.#appServer : express();

            const serverOptions = this.#configuration?.options ??
                                  this.#context?.options ??
                                  (this.#ssl ?
                                      {
                                          cert: this.#sslCertPath,
                                          key: this.#sslKeyPath
                                      } : {});

            this.#httpServer = this.#ssl ? https.createServer( serverOptions, this.#appServer ) : http.createServer( serverOptions, this.#appServer );
        }

        get httpServer()
        {
            return this.#httpServer;
        }

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

        async init( ...pArgs )
        {

        }

        async start()
        {
            if ( !this.initialized )
            {
                await this.init();
            }

            if ( !this.started )
            {
///
                this.#started = true;
            }


            return this;
        }

        async stop()
        {
            if ( this.initialized && this.started )
            {
                await this.dispose();
                this.started = false;
            }

            return this;
        }


    }

    Server.DEPENDENCIES =
        {
            ...(DependentObject.DEPENDENCIES)
        };

}());
