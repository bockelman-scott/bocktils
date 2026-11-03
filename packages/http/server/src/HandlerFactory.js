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
     * thus having access to all injected dependencies via the 'this' scope
     *
     * @abstract
     * @class
     */
    class RequestHandlerFactory extends DependentObject
    {
        /**
         * The value of the NODE_ENV environment variable.
         * Set this environment variable to "production" in production environments.
         *
         * @type {string}
         */
        #mode = "production";

        /**
         * A map by name of the handlers bound to this factory
         * @type {Map<string, function>}
         */
        #handlers = new Map();

        /**
         * Constructs a factory
         * for binding request handler functions to itself
         * to provide access to injected dependencies.
         *
         * @param {Dependencies} pDependencies the Dependencies object (normally populated by a DI Registry)
         * @param {Object} pOptions
         * @param {...*} pArgs
         *
         * @see @toolbocks/dep-injection
         */
        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );

            if ( _ud !== typeof process )
            {
                const env = process.env ?? process;
                this.#mode = ["production", "prod"].includes( _lct( env?.NODE_ENV ) ) ? "production" : "development";
            }
        }

        /**
         * Adds the '__boundTo' property to the specified function.
         * This is used to prevent double-wrapping handler functions
         * and/or wrapping handler functions already bound to another factory.
         *
         * @param {function} pMiddlewareFunction a function that takes a request, response, and optionally, 'next' arguments
         *
         * @returns {function} the specified function augmented with a property, '__boundTo' whose value is this factory
         */
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

        /**
         * Returns either "production" or "development",
         * depending on the value of process.env.NODE_ENV
         *
         * @returns {string}
         */
        get mode()
        {
            if ( _ud !== typeof process )
            {
                const env = process.env ?? process;
                this.#mode = ["production", "prod"].includes( _lct( env?.NODE_ENV ) ) ? "production" : "development";
            }
            return _lct( this.#mode );
        }

        /**
         * Returns true if the current execution environment is a production environment
         * @returns {boolean}
         */
        isProductionMode()
        {
            return ["production", "prod"].includes( _lct( this.mode ) );
        }

        /**
         * Returns an iterator of the handlers currently bound to this factory
         * @returns {MapIterator<[string, Function]>}
         */
        get handlers()
        {
            return this.#handlers.entries();
        }

        /**
         * Generates a key used to store or retrieve a handler function by name
         * @param {string|function} pName
         * @returns {string}
         */
        calculateKey( pName )
        {
            let key = (isFunction( pName ) ? pName?.name || functionToString( pName ) : asString( pName ));

            while ( /^(bounded)+/.test( key ) )
            {
                key = asString( key, true ).replace( /^(bounded)+/, _mt );
            }

            return asString( key, true ).replace( /^(bounded)+/, _mt );
        }

        /**
         * Returns the handle function bound to this factory by name.
         *
         * @param {string} pName the name or function name of the handler to return
         * @returns {function|null}
         */
        getHandler( pName )
        {
            const key = this.calculateKey( pName );
            return this.#handlers[key];
        }

        /**
         * Returns a new function, bound to this factory.
         * Binding the function to this factory
         * makes the factory's properties available to the function via the 'this pointer.
         *
         * @param {function} pMiddlewareFunction the handler to bind to this factory
         * @param {string} [pName=pMiddleFunction?.name] an optional name to use for the bound function
         *
         * @returns {function}
         */
        #bindHandler( pMiddlewareFunction, pName = pMiddlewareFunction?.name )
        {
            const name = asString( pName || pMiddlewareFunction?.name || functionToString( pMiddlewareFunction ), true );

            if ( !(name.includes( "bounded" )) || (this !== pMiddlewareFunction.__boundTo) )
            {
                if ( isNull( pMiddlewareFunction.__boundTo ) )
                {
                    this.#markBound( pMiddlewareFunction );
                    return pMiddlewareFunction.bind( this );
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
                                                 }, this, pMiddlewareFunction, pMiddlewareFunction?.__boundTo, name );
                }
            }
        }

        /**
         * Wraps a synchronous function in an async function or returns an asynchronous function as-is.
         *
         * @param {function|AsyncFunction} pMiddlewareFunction
         *
         * @returns {*|(function(*, *, *): Promise<*>)|(function(*, *, *, *): Promise<*>)}
         */
        #makeAsync( pMiddlewareFunction )
        {
            if ( isFunction( pMiddlewareFunction ) && !isAsyncFunction( pMiddlewareFunction ) )
            {
                let handler = pMiddlewareFunction;

                if ( $ln( handler ) > 3 )
                {
                    return async( err, req, res, next ) =>
                    {
                        return await handler.call( this, err, req, res, next );
                    };
                }
                else
                {
                    return async( req, res, next ) =>
                    {
                        return await handler.call( this, req, res, next );
                    };
                }
            }
            return pMiddlewareFunction;
        }

        /**
         * Returns a new asynchronous function with an AbortController and Signal
         * by wrapping the specified function in an asynchronous function
         * that attaches the AbortController Signal to a request
         * and an event handler to react if that request is aborted.
         *
         * @param {function} pMiddlewareFunction
         * @returns {(function(*, *, *): Promise<void>)|*}
         */
        #makeAbortable( pMiddlewareFunction )
        {
            return async( req, res, next ) =>
            {
                const abortController = new AbortController();

                // Mutate the request object to pass the signal downstream
                req.abortSignal = abortController.signal;

                const onClientDisconnect = () =>
                {
                    if ( !res.writableEnded )
                    {
                        abortController.abort( new Error( "Client disconnected prematurely." ) );
                    }
                };

                req.on( "close", onClientDisconnect );

                try
                {
                    // Standard Express signature is preserved
                    await pMiddlewareFunction.call( this, req, res, next );
                }
                catch( ex )
                {
                    const logger = ToolBocksModule.resolveLogger( this.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

                    attemptSilent( () => (logger ?? console).error( ex ) );

                    // Only call next(error) if the headers haven't been sent,
                    // otherwise let the default Express error handler drop the connection.
                    if ( !res.headersSent )
                    {
                        next( ex );
                    }
                }
                finally
                {
                    req.off( "close", onClientDisconnect );
                }
            };
        }

        /**
         * Returns a function bound to this factory,
         * allowing the function to access properties of this instance.
         *
         * @param {function} pMiddlewareFunction a function that takes a request and a response and handles an HTTP(s) request
         * @param pForceAsync
         * @param pAbortable
         * @returns {function} a function bound to this factory
         */
        createHandler( pMiddlewareFunction, pForceAsync = false, pAbortable = false )
        {
            // noinspection JSUnresolvedReference
            if ( !(this.initialized || super.initialized) )
            {
                throw new IllegalStateError( `${getClassName( this )} must be initialized before createHandler can be invoked`, { detail: this } );
            }

            if ( isFunction( pMiddlewareFunction ) && $ln( pMiddlewareFunction ) >= 2 )
            {
                const name = pMiddlewareFunction?.name || functionToString( pMiddlewareFunction );

                let handler = this.#bindHandler( pMiddlewareFunction, name );

                if ( toBool( pForceAsync ) && !isAsyncFunction( handler ) )
                {
                    handler = this.#makeAsync( handler );
                }

                if ( toBool( pAbortable ) )
                {
                    handler = this.#makeAbortable( handler );
                }

                this.#markBound( handler );

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

            if ( isFunction( pErrorHandlingFunction ) && $ln( pErrorHandlingFunction ) > 3 )
            {
                return this.createHandler( pErrorHandlingFunction );
            }

            const handleError = ( err, req, res, next ) =>
            {
                const logger = ToolBocksModule.resolveLogger( this.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

                const error = (isError( err ) ? resolveError( err ) ?? new __Error( err ) : new __Error( `An error occurred handling ${req?.originalUrl} from IP: ${req?.ip}` ));

                attemptSilent( () => logger.error( error ) );

                if ( !res.headersSent )
                {
                    return next( error ?? err );
                }

                const httpStatus = res.statusCode ?? err.status ?? err.statusCode;

                if ( ["production", "prod"].includes( _lct( this.#mode ) ) )
                {
                    // avoid displaying stack trace information to external callers
                    res.status( httpStatus ).json( { error: `An error occurred` } );
                }
                else
                {
                    // in development or test environments, send the entire serialized error to the caller
                    res.status( httpStatus ).json( { error } );
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
