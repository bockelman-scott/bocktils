(function exposeModule()
{
    const toolbocks = require( "@toolbocks/core" );

    const depInjection = require( "@toolbocks/dep-injection" );

    const jsonUtils = require( "@toolbocks/json" );

    const logUtils = require( "@toolbocks/logging" );

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

    const { isNull, isNonNullObject, isFunction, isAsyncFunction, isError, getClassName } = typeUtils;

    const { asString, toBool, _lct } = stringUtils;

    const { DependentObject, Dependencies } = depInjection;

    const { asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const SIMPLE_LOGGER = new SimpleLogger( ToolBocksModule.getGlobalLogger(), console );

    const DEFAULT_LOGGER = SourcedSimpleLogger.adapt( SIMPLE_LOGGER, "HttpRequestHandlerFactory" );

    /**
     * Base class to extend to create factories that return RequestHandler functions
     * with access to injected dependencies.
     *
     * The createHandler method takes any Express.js-compatible function,
     * that is, a function that takes 2 or 3 arguments: req (Request), res (Response), and optionally "next",
     * and returns a new copy of that function BOUND to the instance of RequestHandlerFactory,
     * this having access to all injected dependencies via the 'this' scope
     *
     * @abstract
     * @class
     */
    class RequestHandlerFactory extends DependentObject
    {
        #mode = "production";

        #handlers = new Map();

        /**
         * Constructs a factory
         * for binding request handler functions to itself
         * for access to injected dependencies.
         *
         * @param {Dependencies} pDependencies
         * @param {Object} pOptions
         * @param {...*} pArgs
         */
        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );

            if ( _ud !== typeof process )
            {
                const env = process.env ?? process;
                this.#mode = "production" === _lct( env?.NODE_ENV ) ? "production" : "development";
            }
        }

        #markBound( pMiddlewareFunction )
        {
            attempt( () => Object.defineProperty( pMiddlewareFunction,
                                                  "__boundTo",
                                                  {
                                                      configurable: false,
                                                      enumerable: false, // Hides it from standard introspection
                                                      value: this,
                                                      writable: false
                                                  } ) );
            return pMiddlewareFunction;
        }

        get mode()
        {
            if ( _ud !== typeof process )
            {
                const env = process.env ?? process;
                this.#mode = "production" === _lct( env?.NODE_ENV ) ? "production" : "development";
            }
            return _lct( this.#mode );
        }

        get handlers()
        {
            return this.#handlers.entries();
        }

        calculateKey( pName )
        {
            let key = (isFunction( pName ) ? pName?.name || functionToString( pName ) : asString( pName ));

            while ( /^(bounded)+/.test( key ) )
            {
                key = asString( key, true ).replace( /^(bounded)+/, _mt );
            }

            return asString( key, true ).replace( /^(bounded)+/, _mt );
        }

        getHandler( pName )
        {
            const key = this.calculateKey( pName )
            return this.#handlers[key];
        }

        /**
         * Returns a function bound to this factory,
         * allowing the function to access properties of this instance.
         *
         * @param {function} pMiddlewareFunction a function that takes a request and a response and handles an HTTP(s) request
         * @param pForceAsync
         * @returns {function} a function bound to this factory
         */
        createHandler( pMiddlewareFunction, pForceAsync = false )
        {
            // noinspection JSUnresolvedReference
            if ( !(this.initialized || super.initialized) )
            {
                throw new IllegalStateError( `${getClassName( this )} must be initialized before createHandler can be invoked`, { detail: this } );
            }

            if ( isFunction( pMiddlewareFunction ) && $ln( pMiddlewareFunction ) >= 2 )
            {
                const name = pMiddlewareFunction?.name || functionToString( pMiddlewareFunction );

                if ( !(name.includes( "bounded" )) || (this !== pMiddlewareFunction.__boundTo) )
                {
                    if ( isNull( pMiddlewareFunction.__boundTo ) )
                    {
                        this.#markBound( pMiddlewareFunction );
                    }
                    else
                    {
                        throw new IllegalStateError( `The handler function, ${name}, is already bound to an object that is not this factory`,
                                                     {
                                                         detail:
                                                             {
                                                                 handler: pMiddlewareFunction,
                                                                 boundTo: pMiddlewareFunction?.__boundTo,
                                                                 factory: this
                                                             }
                                                     }, this, pMiddlewareFunction, pMiddlewareFunction?.__boundTo );
                    }
                }

                let handler = pMiddlewareFunction.bind( this );

                if ( toBool( pForceAsync ) && !isAsyncFunction( handler ) )
                {
                    const syncHandler = handler;

                    if ( $ln( handler ) > 3 )
                    {
                        handler = async( err, req, res, next ) =>
                        {
                            return await syncHandler.call( this, err, req, res, next );
                        };
                    }
                    else
                    {
                        handler = async( req, res, next ) =>
                        {
                            return await syncHandler.call( this, req, res, next );
                        };
                    }

                    this.#markBound( handler );
                }

                const key = this.calculateKey( name );

                this.#handlers.set( key, handler );

                return handler;
            }

            throw new IllegalArgumentError( `${getClassName( this )}::createHandler requires a function with request and response parameters`, { detail: { arg: pMiddlewareFunction } } );
        }

        createErrorHandler( pErrorHandlingFunction )
        {
            // noinspection JSUnresolvedReference
            if ( !(this.initialized || super.initialized) )
            {
                throw new IllegalStateError( `${getClassName( this )} must be initialized before createErrorHandler can be invoked`, { detail: this } );
            }

            if ( isFunction( pErrorHandlingFunction ) && $ln( pErrorHandlingFunction ) >= 3 )
            {
                return this.createHandler( pErrorHandlingFunction );
            }

            const handleError = ( err, req, res, next ) =>
            {
                const logger = ToolBocksModule.resolveLogger( this.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

                const error = (isError( err ) ? resolveError( err ) ?? new __Error( err ) : new __Error( `An error occurred handling ${req?.originalUrl} from IP: ${req?.ip}` ));

                attemptSilent( () => logger.error( error ) );

                if ( res.headersSent )
                {
                    return next( error ?? err );
                }

                const httpStatus = res.statusCode ?? err.status ?? err.statusCode;

                if ( "production" === _lct( this.#mode ) )
                {
                    res.status( httpStatus ).json( { error } );
                }
                else
                {
                    res.status( httpStatus ).json( { error: `An error occurred` } );
                }
            };

            return this.createHandler( handleError );
        }
    }

    RequestHandlerFactory.DEPENDENCIES =
        {
            ...(asObject( DependentObject.DEPENDENCIES ))
        };

    const mod =
        {
            classes:
                {
                    RequestHandlerFactory
                },
            RequestHandlerFactory
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
