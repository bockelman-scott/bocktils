// requires the core modules
const core = require( "@toolbocks/core" );

const entityUtils = require( "@toolbocks/entities" );

const httpUtils = require( "@toolbocks/http" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_REQ_HANDLER_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { ToolBocksModule, ObjectEntry, objectEntries, objectValues, populateOptions } = moduleUtils;

    const { isNull, isNonNullObject, isArray, isNumeric, isClass, isFunction } = typeUtils;

    const { asString, isBlank, ucase, asInt, toProperCase } = stringUtils;

    const { asArray } = arrayUtils;

    const { Dependency, Dependencies } = entityUtils;

    const
        {
            VERBS,
            HttpVerb,
            HttpRequest,
            HttpResponse,
            cloneRequest,
            cloneResponse,
            HttpHeaders,
            cloneHeaders,
            HttpStorage,
            HttpLocalStorage,
            HttpSessionStorage,
            HttpStorageEvent,
            sessionStorage,
            localStorage,
        } = httpUtils;

    const modName = "RequestHandlerFactoryUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    /**
     * Abstract base class for Request Handlers.
     * Request Handlers are not necessarily directly invoked.
     * Most Node.js application server frameworks expect route/path/request handlers to be Functions.
     * We are using this architectural pattern to make dependency-injection more straightforward.
     */
    class RequestHandler
    {
        #dependencies;
        #options;

        constructor( pDependencies, pOptions )
        {
            this.#dependencies = Dependencies.resolveDependencies( pDependencies );

            this.#options = populateOptions( pOptions || {}, {} );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get dependencies()
        {
            return Dependencies.resolveDependencies( this.#dependencies );
        }

        get options()
        {
            return populateOptions( {}, this.#options || {} );
        }

        clone( pOptions )
        {
            let options = populateOptions( pOptions || {}, this.options );
            const clazz = this.constructor[Symbol.species] || this.constructor;
            return new clazz( this.dependencies.clone(), options );
        }

        async start( ...pArgs )
        {

        }

        async stop( ...pArgs )
        {

        }

        async handleRequest( pRequest, pResponse, pNext )
        {
            // Decorate the Request
            const request = cloneRequest( pRequest );

            const method = ucase( asString( request.method, true ) );

            if ( HttpVerb.isVerb( method ) )
            {
                const methodName = ("handle" + toProperCase( method ));

                if ( isFunction( this[methodName] ) )
                {
                    return this[methodName].call( this, request, pResponse, pNext );
                }
            }

            if ( isFunction( pNext ) )
            {
                return pNext( request, pResponse );
            }

            return { request, pResponse, pNext };
        }

        async handleGet( pRequest, pResponse, pNext )
        {
            return { pRequest, pResponse, pNext };
        }

        async handlePost( pRequest, pResponse, pNext )
        {
            return { pRequest, pResponse, pNext };
        }

        async handlePut( pRequest, pResponse, pNext )
        {
            return { pRequest, pResponse, pNext };
        }

        async handlePatch( pRequest, pResponse, pNext )
        {
            return { pRequest, pResponse, pNext };
        }

        async handleDelete( pRequest, pResponse, pNext )
        {
            return { pRequest, pResponse, pNext };
        }

        async handleHead( pRequest, pResponse, pNext )
        {
            return { pRequest, pResponse, pNext };
        }

        async handleOptions( pRequest, pResponse, pNext )
        {
            return { pRequest, pResponse, pNext };
        }

        async handleTrace( pRequest, pResponse, pNext )
        {
            return { pRequest, pResponse, pNext };
        }
    }

    /**
     * This class (and its subclasses) exists to return new instances of a RequestHandler.
     * This is to provide scope/thread safety for request handlers.
     */
    class RequestHandlerFactory
    {
        #dependencies;
        #requestHandler;
        #options;

        constructor( pHandlerOrClass, pDependencies, pOptions )
        {
            this.#dependencies = Dependencies.resolveDependencies( pDependencies );

            this.#options = populateOptions( pOptions || {}, {} );

            if ( isNonNullObject( pHandlerOrClass ) )
            {
                if ( pHandlerOrClass instanceof RequestHandler )
                {
                    this.#requestHandler = pHandlerOrClass.clone( this.#options );
                }
                else
                {
                    this.#requestHandler = new RequestHandler( this.#dependencies, this.#options );
                }
            }
            else if ( isClass( pHandlerOrClass ) )
            {
                this.#requestHandler = pHandlerOrClass;
            }
        }

        get dependencies()
        {
            return Dependencies.resolveDependencies( this.#dependencies );
        }

        get options()
        {
            return populateOptions( {}, this.#options || {} );
        }

        async start( ...pArgs )
        {

        }

        async stop( ...pArgs )
        {

        }

        get handler()
        {
            if ( isClass( this.#requestHandler ) )
            {
                return new this.#requestHandler( this.dependencies, this.options );
            }
            else if ( isNonNullObject( this.#requestHandler ) )
            {
                if ( this.#requestHandler instanceof RequestHandler )
                {
                    return this.#requestHandler.clone( this.options );
                }
            }
        }

        async handleRequest( pRequest, pResponse, pNext )
        {
            return await this.handler.handleRequest( pRequest, pResponse, pNext );
        }
    }

    /**
     * This subclass of RequestHandlerFactory is intended to be associated with a path (or route)
     * Typically, you might maintain a map of these by path/route.
     */
    class PathHandlerFactory extends RequestHandlerFactory
    {
        #path;

        constructor( pPath, pHandler )
        {
            super( pHandler, pHandler?.dependencies || [], pHandler?.options || {} );
            this.#path = asString( pPath, true );
        }

        get path()
        {
            return asString( this.#path, true );
        }
    }

    /**
     * This class exists to hold a collection of PathHandlerFactory instances
     * and to return the associated factory for a request URL.
     * Calling getHandlerFunction returns the function to handle requests to a specific URL
     */
    class RouteHandlersFactory
    {
        #mapByPath = new Map();

        constructor( ...pPathHandlers )
        {
            const handlers = asArray( pPathHandlers );

            for( let handler of handlers )
            {
                const key = handler.path || "*";

                const handlers = asArray( this.#mapByPath.get( key ) || [] );

                handlers.push( handler );

                this.#mapByPath.set( key, handlers );
            }
        }

        /**
         * Returns a function that can be provided to an application server to handle a route.
         * Note that this factory allows assigning a chain of request handlers for each path/route.
         * The returned function will call each of these in order
         * until one of them return null, indicating that it has handled the request.
         * This is an alternative to specifying multiple functions to the application server middleware
         * or provides that functionality for middleware that does not have a native capacity to chain functions/handlers
         * @param pPath
         * @returns {function(*, *, *): Promise<null>}
         */
        getHandlerFunction( pPath )
        {
            const me = this;

            const key = asString( pPath, true ) || "*";

            const handlers = asArray( this.#mapByPath.get( key ) || this.#mapByPath.get( "*" ) || [] );

            return async function( pRequest, pResponse, pNext )
            {
                let result = null;

                for( let handler of handlers )
                {
                    result = await handler.handleRequest( pRequest, pResponse, pNext, me );
                    if ( isNull( result ) )
                    {
                        break;
                    }
                }

                return result;
            };
        }

        async start( ...pArgs )
        {

        }

        async stop( ...pArgs )
        {

        }
    }

    let mod =
        {
            dependencies:
                {
                    core,
                    moduleUtils,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    httpUtils
                },
            classes:
                {
                    HttpRequest,
                    HttpResponse,
                    HttpHeaders,
                    Dependency,
                    Dependencies,
                    RequestHandler,
                    RequestHandlerFactory,
                    PathHandlerFactory,
                    RouteHandlersFactory
                },
            Dependency,
            Dependencies,
            RequestHandler,
            RequestHandlerFactory,
            PathHandlerFactory,
            RouteHandlersFactory
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
