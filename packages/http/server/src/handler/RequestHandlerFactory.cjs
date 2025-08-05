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

    const { BockNamed } = entityUtils;

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
     * Represents a dependency in the system, implementing the INamed interface.
     *
     * The Dependency class is used to define entities or components
     * that can be 'injected' into RequestHandlers or Services
     *
     * @class
     * @augments BockNamed
     * @extends BockNamed
     *
     * @class
     *
     * @param {string} pId - The unique identifier for the dependency.
     * @param {string} pName - The name of the dependency.
     */
    class Dependency extends BockNamed
    {
        #component;
        #options;

        /**
         * Constructs an instance of the class with the provided id, name, component, and options.
         *
         * @param {string|number} pId       The unique identifier for the instance.
         * @param {string} pName            The name of the instance.
         * @param {Object} pComponent       The component represented by this instance.
         * @param {Object} [pOptions={}]    Optional component-specific parameters
         *                                  to configure the instance.
         *
         * @return {Object} An instance of the class.
         */
        constructor( pId, pName, pComponent, pOptions = {} )
        {
            super( pId, pName );

            this.#component = isNonNullObject( pComponent ) || isClass( pComponent ) ? pComponent : this;

            this.#options = populateOptions( pOptions || {}, {} );
        }

        get options()
        {
            return populateOptions( {}, this.#options || {} );
        }

        // subclasses may need to clone or create a component to return
        get component()
        {
            if ( isNonNullObject( this.#component ) )
            {
                if ( isFunction( this.#component.clone ) )
                {
                    return this.#component.clone( this.options );
                }
                return this.#component;
            }
            else if ( isClass( this.#component ) )
            {
                return new this.#component( this.options );
            }

            return this.#component;
        }

        clone()
        {
            return new Dependency( this.id, this.name, this.component );
        }
    }

    class Dependencies
    {
        #mapById = new Map();
        #mapByName = new Map();

        constructor( ...pDependencies )
        {
            const dependencies = asArray( pDependencies || [] ).filter( e => isNonNullObject( e ) && e instanceof Dependency );

            for( let dependency of dependencies )
            {
                this.#mapById.set( dependency.id, dependency );
                this.#mapByName.set( dependency.name, dependency );
            }
        }

        getDependency( pKey )
        {
            if ( isNumeric( pKey ) )
            {
                return this.#mapById.get( asInt( pKey ) );
            }
            return this.#mapByName.get( asString( pKey, true ) );
        }

        getComponent( pKey )
        {
            const dependency = this.getDependency( pKey );
            return dependency.component;
        }

        clone()
        {
            let values = [...(asArray( objectValues( this.#mapById ) || [] ) || [])];

            values = values.filter( e => isNonNullObject( e ) && e instanceof Dependency );

            values = values.map( e => e.clone() );

            return new Dependencies( ...values );
        }
    }

    function resolveDependencies( pDependencies )
    {
        if ( isNonNullObject( pDependencies ) )
        {
            if ( pDependencies instanceof Dependencies )
            {
                return pDependencies;
            }
            else
            {
                return new Dependencies( ...(asArray( pDependencies || [] )).filter( e => isNonNullObject( e ) && e instanceof Dependency ) );
            }
        }
        else
        {
            return new Dependencies();
        }
    }

    class RequestHandler
    {
        #dependencies;
        #options;

        constructor( pDependencies, pOptions )
        {
            this.#dependencies = resolveDependencies( pDependencies );

            this.#options = populateOptions( pOptions || {}, {} );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get dependencies()
        {
            return resolveDependencies( this.#dependencies );
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

        async handleRequest( pRequest, pResponse, pNext )
        {
            // Decorate the Request
            const request = cloneRequest( pRequest );

            const method = ucase( asString( request.method, true ) );

            if ( HttpVerb.isVerb( method ) )
            {
                if ( isFunction( this.handle[toProperCase( method )] ) )
                {
                    return this.handle[toProperCase( method )].call( this, request, pResponse, pNext );
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

    class RequestHandlerFactory
    {
        #dependencies;
        #requestHandler;
        #options;

        constructor( pHandlerOrClass, pDependencies, pOptions )
        {
            this.#dependencies = resolveDependencies( pDependencies );

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
            return resolveDependencies( this.#dependencies );
        }

        get options()
        {
            return populateOptions( {}, this.#options || {} );
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

    class RouteHandlersFactory
    {
        #mapByPath = new Map();

        constructor( ...pPathHandlers )
        {
            const handlers = asArray( pPathHandlers );

            for( let handler of handlers )
            {
                const handlers = asArray( this.#mapByPath.get( handler.path ) || [] );

                handlers.push( handler );

                this.#mapByPath.set( handler.path, handlers );
            }
        }

        getHandlerFunction( pPath )
        {
            const me = this;

            const handlers = asArray( this.#mapByPath.get( pPath ) || [] );

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
