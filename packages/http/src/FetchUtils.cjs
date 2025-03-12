// requires the core modules
const core = require( "@toolbocks/core" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const httpConstants = require( "./HttpConstants.cjs" );
const httpHeaders = require( "./HttpHeaders.cjs" );

const httpRequest = require( "./HttpRequest.cjs" );
const httpResponse = require( "./HttpResponse.cjs" );

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_FETCH_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import this module<br>
     * and then import or use the other utilities<br>
     * as properties of this module.
     * <br>
     * @dict
     * @type {Object}
     * @alias module:ArrayUtils#dependencies
     */
    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            httpConstants,
            httpHeaders,
            httpRequest,
            httpResponse
        };

    const {
        ToolBocksModule,
        ModuleEvent,
        no_op,
        op_true,
        op_false,
        populateOptions,
        lock,
        clamp,
        asyncAttempt,
        attempt,
        resolveEvent,
        resolveEventType,
        ObjectEntry,
        objectEntries
    } = moduleUtils;

    const { _mt_str, _fun, _underscore, S_ON } = constants;

    const { isNull, isNonNullObject, isFunction, firstMatchingType } = typeUtils;

    const { asString, asInt, isBlank, lcase, ucase, capitalize } = stringUtils;

    const { asArray, varargs, unique } = arrayUtils;

    const {
        VERBS,
        MODES,
        PRIORITY,
        HttpVerb,
        HttpContentType,
        HttpStatus,
        HttpHeader
    } = httpConstants;

    const { HttpRequestHeaders } = httpHeaders;

    const {
        HttpRequest,
        HttpRequestOptions,
        cloneRequest = function( pRequest )
        {
            return isNull( pRequest ) ? null : isFunction( pRequest?.clone ) ? pRequest.clone() : pRequest;
        },
        REQUEST_CACHE_OPTIONS,
        REQUEST_CREDENTIALS_OPTIONS,
        REDIRECT_OPTIONS,
        REFERRER_POLICY_OPTIONS,

    } = httpRequest;

    const {
        HttpResponse,
        cloneResponse = function( pResponse )
        {
            return isNull( pResponse ) ? null : isFunction( pResponse?.clone ) ? pResponse.clone() : pResponse;
        }
    } = httpResponse;

    const modName = "FetchUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const FetchEvents =
        {
            ABORT: "abort",
            ERROR: "error",
            LOAD: "load",
            LOADEND: "loadend",
            LOADSTART: "loadstart",
            PROGRESS: "progress",
            READYSTATECHANGE: "readystatechange",
            TIMEOUT: "timeout"
        };

    const isFetchEvent = ( pName ) => !isBlank( FetchEvents[ucase( asString( resolveEventType( pName ), true ) )] );

    const isHandlerObject = function( pHandler, pEventName )
    {
        const evtName = resolveEventType( pEventName );

        if ( !isFetchEvent( evtName ) )
        {
            return false;
        }

        return isNonNullObject( pHandler ) &&
               (isFunction( pHandler?.handleEvent ) ||
                isFunction( pHandler?.[S_ON + lcase( evtName )] ) ||
                isFunction( pHandler?.[S_ON + capitalize( lcase( evtName ) )] ));
    };

    const isHandler = function( pHandler, pEventName )
    {
        const evtName = resolveEventType( pEventName );

        if ( !isFetchEvent( evtName ) )
        {
            return false;
        }

        return isHandlerObject( pHandler, evtName ) || isFunction( pHandler );
    };

    class FetchEventHandler extends EventTarget
    {
        #eventName;
        #handler;
        #method;

        constructor( pHandler, pEventName )
        {
            super();

            this.#eventName = lcase( resolveEventType( pEventName ) );

            this.#handler = isHandlerObject( pHandler ) ? pHandler : null;

            this.#method = firstMatchingType( _fun,
                                              pHandler?.[S_ON + this.#eventName],
                                              pHandler?.[S_ON + capitalize( this.#eventName )],
                                              pHandler?.handleEvent,
                                              pHandler );

            if ( isFunction( this.#method ) )
            {
                const me = this;

                const object = this.#handler || me;

                this[S_ON + capitalize( this.#eventName )] = this[S_ON + (this.#eventName)] = function( pEvent )
                {
                    const evt = resolveEvent( pEvent );

                    attempt( () => me.#method.call( (object || me), evt ) );
                };
            }
        }

        get eventName()
        {
            return lcase( asString( this.#eventName, true ) );
        }

        get handler()
        {
            return this.#handler || this;
        }

        get method()
        {
            return this.#method || this[S_ON + capitalize( this.eventName )] || this[S_ON + lcase( this.eventName )];
        }

        handleEvent( pEvent )
        {
            const evt = resolveEvent( pEvent );

            const name = evt?.type || evt?.name || resolveEventType( evt );

            if ( lcase( asString( name, true ) ) !== lcase( asString( this.eventName, true ) ) )
            {
                return;
            }

            const me = this;

            const func = firstMatchingType( _fun,
                                            (me || this)[S_ON + capitalize( name )],
                                            (me || this)[S_ON + lcase( name )],
                                            (me || this).method );

            if ( isFunction( func ) )
            {
                attempt( () => func.call( (me || this).handler, evt ) );
            }
        }
    }


    FetchEventHandler.create = function( pHandler, pEventName )
    {
        const evtName = resolveEventType( pEventName );

        if ( !isFetchEvent( evtName ) || !isHandlerObject( pHandler, evtName ) )
        {
            return null;
        }

        if ( pHandler instanceof FetchEventHandler && (lcase( asString( pHandler?.eventName, true ) ) === lcase( asString( evtName, true ) )) )
        {
            return pHandler;
        }

        return new FetchEventHandler( pHandler, evtName );
    };

    /**
     * An array of ActiveX components that may be present in an end-users environment
     * that can be used as a fallback when the use of fetch, the file system, or XmlHttpRequest are all unavailable.
     *
     * @type {string[]}
     */
    const MicrosoftXmlParsers = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.3.0", "Msxml2.XMLHTTP.2.6", "Msxml2.XMLHTTP", "Microsoft.XMLHTTP"];

    /**
     * Constants defining the possible readyStates of the XmlHttpRequest component this class might use
     */
    const XmlHttpRequestReadStates =
        {
            READY_STATE_COMPLETE: 4,
            READY_STATE_INTERACTIVE: 3,
            READY_STATE_LOADED: 2,
            READY_STATE_LOADING: 1,
            READY_STATE_UNINITIALIZED: 0,
            READY_STATE_ABORTED: -1,
            READY_STATE_USER_CANCELLED: -2
        };

    const KEYCODE_ABORT = 27;

    /**
     * @typedef {object} FetcherOptions An object whose properties control
     *                                  the behavior of an instance of Fetcher
     *
     * @property {Array.<string>} [components=['fetch','fs','XmlHttpRequest','ActiveX']] List of Web APIs to try in priority order
     *
     * @property {number} [defaultTimeout=12_000] The default amount of time to wait
     *                                            for a request to complete
     *                                            before automatically aborting the request
     *
     * @property {string} [baseUrl=document?.URL] The URL used to resolve relative paths.
     *                                            Usually document.URL (in browser environments)
     *
     * @property {boolean} [ignoreCache=false] Whether to bypass any previously cached response
     *                                         in favor of a new request to the external system
     *
     * @property {string} [encoding='application/x-www-form-urlencoded'] The HTTP encoding used for requests
     *
     * @property {string} [charset='utf-8'] The character encoding used for POST, PUT, and PATCH requests
     *
     * @property {string} [accept=null] Can be used to limit responses to a specific mime type (e.g., application/json)
     *
     * @property {boolean} [requiresAuthentication=false] Indicates whether requests
     *                                                    made by this instance
     *                                                    must originate with an authenticated user
     *
     * @property {function} [isAuthenticated=op_true] A function that is called to verify the requesting user is authenticated
     *
     * @property {function} [isExpiredSession=op_false] A function that is called to determine whether the requestor's authenticated session has expired
     *
     * @property {boolean} [allowSynchronousFetch=false] Indicates whether this instance can make blocking calls to retrieve content synchronously
     *                                                   The default is false and setting it to true is <i>discouraged</i>
     *
     * @property {HttpRequestHeaders} [headers=null] A set of headers to include in every request
     * @property {boolean} [includeSecurityToken=false] Whether to add a hidden element
     *                                                  to a POST, PUT, or PATCH request
     *                                                  containing a NONCE as a defense against CSRF.
     *
     * @property {string} [securityTokenId=''] The id and/or name to use for the hidden field containing a NONCE.<br>
     *                                         This is only used, but <b>is required</b>,
     *                                         if the <i>includeSecurityToken</i> property is set to true.
     *                                         <br>
     *                                         <b>NOTE:</b> This can be set independently for each request as well.
     *                                         <br>
     *
     * @property {string} [securityTokenValue=''] The value to insert into the hidden field containing a NONCE.<br>
     *                                            This is only used, but <b>is required</b>,
     *                                            if the <i>includeSecurityToken</i> property is set to true.
     *                                            <br>
     *                                            <b>NOTE:</b> This can be set independently for each request as well.
     *
     * @property {Map<string,(function|object)|Array.<function|object>>} [eventHandlers=new Map()]
     *                                            A Map of event handlers to add
     *                                            to an instance of the Fetcher class
     */

    const DEFAULT_TIMEOUT = 12_000; // 12 seconds
    const MAX_TIMEOUT = 300_000; // 5 minutes
    const MIN_TIMEOUT = 0;

    /**
     * These are the default options for the Fetcher class.
     * <br>
     * Options supplied to the Fetcher constructor are merged with these.
     * <br>
     * @const
     * @type {FetcherOptions}
     */
    const DEFAULT_FETCHER_OPTIONS =
        {
            components: ["fetch", "fs", "XmlHttpRequest", "ActiveX"],
            defaultTimeout: DEFAULT_TIMEOUT,
            baseUrl: _ud !== typeof document ? document?.URL : _mt_str,
            ignoreCache: false,
            encoding: "application/x-www-form-urlencoded",
            charset: "utf-8",
            accept: null,
            requiresAuthentication: false,
            isAuthenticated: op_true,
            isExpiredSession: op_false,
            allowSynchronousFetch: false,
            headers: null,
            includeSecurityToken: false,
            securityTokenId: _mt_str,
            securityTokenValue: _mt_str,
            eventHandlers: new Map()
        };

    /**
     * @typedef {object} RequestOptions An object whose properties control
     *                                  the behavior of a specific Request
     *
     * @property {number} [timeout=12_000] The amount of time to wait
     *                                     for the request to complete
     *                                     before automatically aborting the request
     *
     * @property {boolean} [ignoreCache=false] Whether to bypass any previously cached response
     *                                         in favor of a new request to the external system
     *
     * @property {string} [encoding='application/x-www-form-urlencoded'] The HTTP encoding used for requests
     *
     * @property {string} [charset='utf-8'] The character encoding used for POST, PUT, and PATCH requests
     *
     * @property {string} [accept=null] Can be used to limit responses to a specific mime type (e.g., application/json)
     *
     * @property {boolean} [requiresAuthentication=false] Indicates whether a specific request requires an authenticated user
     *
     * @property {function} [isAuthenticated=op_true] The function that is called to verify the requesting user is authenticated
     *
     * @property {function} [isExpiredSession=op_false] The function that is called to determine whether the requestor's authenticated session has expired
     *
     * @property {boolean} [synchronous=false] Indicates whether to make a blocking call
     *                                         to wait for the response before executing any other code
     *
     * @property {HttpRequestHeaders} [headers=null] A set of headers to include in this request
     *
     * @property {boolean} [includeSecurityToken=false] Whether to add a hidden element
     *                                                  containing a NONCE as a defense against CSRF.
     *
     * @property {string} [securityTokenId=''] The id and/or name to use for the hidden field containing a NONCE.<br>
     *
     * @property {string} [securityTokenValue=''] The value to insert into the hidden field containing a NONCE.<br>
     *
     * @property {HttpRequestOptions} [requestInit] An object with one or more
     *                                              of the properties supported by
     *                                              {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit}
     */

    /**
     * These are the default RequestOptions, used to set request-specific properties before making the request
     *
     * @type {RequestOptions}
     */
    const DEFAULT_REQUEST_OPTIONS =
        {
            timeout: DEFAULT_TIMEOUT,
            ignoreCache: DEFAULT_FETCHER_OPTIONS.ignoreCache,
            encoding: DEFAULT_FETCHER_OPTIONS.encoding,
            charset: DEFAULT_FETCHER_OPTIONS.charset,
            accept: DEFAULT_FETCHER_OPTIONS.accept,
            requiresAuthentication: DEFAULT_FETCHER_OPTIONS.requiresAuthentication,
            isAuthenticated: DEFAULT_FETCHER_OPTIONS.isAuthenticated,
            isExpiredSession: DEFAULT_FETCHER_OPTIONS.isExpiredSession,
            synchronous: false,
            headers: DEFAULT_FETCHER_OPTIONS.headers,
            includeSecurityToken: DEFAULT_FETCHER_OPTIONS.includeSecurityToken,
            securityTokenId: DEFAULT_FETCHER_OPTIONS.securityTokenId,
            securityTokenValue: DEFAULT_FETCHER_OPTIONS.securityTokenValue,
            requestInit:
                {
                    headers: DEFAULT_FETCHER_OPTIONS.headers,
                    cache: REQUEST_CACHE_OPTIONS.DEFAULT
                }
        };

    /**
     * This class is used for making HTTP requests and handling their response(s).
     * <br>
     * <br>
     * It is used to ensure responses can be processed in a desired order, if necessary,
     * set common headers for all requests,
     * handle requests that require authentication or graceful handling of session-expiry.
     * <br>
     * <br>
     * @class
     */
    class Fetcher extends EventTarget
    {
        #options = DEFAULT_FETCHER_OPTIONS;

        #pendingRequests = new Map();

        #lastRequestToken = 0;

        #eventHandlers = new Map();

        #components = DEFAULT_FETCHER_OPTIONS.components;

        #defaultTimeout = DEFAULT_FETCHER_OPTIONS.defaultTimeout;

        #baseUrl = DEFAULT_FETCHER_OPTIONS.baseUrl || (_ud !== typeof document ? document?.URL : _mt_str);

        #ignoreCache = DEFAULT_FETCHER_OPTIONS.ignoreCache;

        #encoding = DEFAULT_FETCHER_OPTIONS.encoding || "application/x-www-form-urlencoded";

        #charset = DEFAULT_FETCHER_OPTIONS.charset || "utf-8";

        #accept = DEFAULT_FETCHER_OPTIONS.accept || null;

        #requiresAuthentication = DEFAULT_FETCHER_OPTIONS.requiresAuthentication || false;
        #isAuthenticated = op_true;
        #isExpiredSession = op_false;

        #allowSynchronousFetch = false;

        #headers = DEFAULT_FETCHER_OPTIONS.headers || null;

        #includeSecurityToken = false;
        #securityTokenId = _mt_str;
        #securityTokenValue = _mt_str;

        constructor( pOptions = DEFAULT_FETCHER_OPTIONS )
        {
            super();

            const options = populateOptions( pOptions, DEFAULT_FETCHER_OPTIONS );

            this.#options = lock( options );

            this.setPropertiesFromOptions( options );

            this.addEventHandlers( options );
        }

        get options()
        {
            return lock( populateOptions( this.#options, DEFAULT_FETCHER_OPTIONS ) );
        }

        get pendingRequests()
        {
            return this.#pendingRequests;
        }

        get lastRequestToken()
        {
            return this.#lastRequestToken;
        }

        get eventHandlers()
        {
            return this.#eventHandlers;
        }

        get baseUrl()
        {
            return this.#baseUrl;
        }

        get requiresAuthentication()
        {
            return this.#requiresAuthentication;
        }

        addEventHandlers( pOptions )
        {
            const options = populateOptions( pOptions, DEFAULT_FETCHER_OPTIONS );

            const handlers = options.eventHandlers || new Map();

            for( const [name, handler] of handlers )
            {
                const evtName = resolveEventType( name );

                if ( !isFetchEvent( evtName ) )
                {
                    continue;
                }

                const arr = asArray( handler );

                for( const h of arr )
                {
                    if ( isHandlerObject( h, evtName ) || isFunction( h ) )
                    {
                        this.on( evtName, h );
                    }
                }
            }
        }

        on( pEventName, pHandler )
        {
            const name = lcase( asString( resolveEventType( pEventName ), true ) );

            if ( isFunction( this.addEventListener ) && isHandler( pHandler ) && isFetchEvent( name ) )
            {
                const fetchEventHandler = FetchEventHandler.create( pHandler, name );

                const handlers = asArray( this.#eventHandlers.get( name ) || [] ) || [];

                handlers.push( fetchEventHandler );

                this.#eventHandlers.set( name, handlers );

                const me = this;
                const object = pHandler || me;

                const handler = function( pEvent )
                {
                    const evt = resolveEvent( pEvent );

                    attempt( () => fetchEventHandler.method.call( object || fetchEventHandler, evt ) );
                };

                super.addEventListener( name, handler );

                return handlers;
            }

            return asArray( this.#eventHandlers.get( name ) || [] ) || [];
        }

        addEventListener( pEventName, pHandler )
        {
            attempt( () => this.on( pEventName, pHandler ) );
        }

        off( pEventName, pHandler )
        {
            const name = lcase( asString( resolveEventType( pEventName ), true ) );

            if ( isFunction( this.removeEventListener ) && isHandler( pHandler ) )
            {
                this.removeEventListener( name, pHandler );
            }
        }

        removeAllListeners( pEventName )
        {
            const name = lcase( asString( resolveEventType( pEventName ), true ) );

            const listeners = asArray( this.#eventHandlers.get( name ) || [] ) || [];

            for( const listener of listeners )
            {
                attempt( () => this.removeEventListener( name, listener ) );
            }

            return this.#eventHandlers.delete( name );
        }

        setPropertiesFromOptions( pOptions = DEFAULT_FETCHER_OPTIONS )
        {
            const options = lock( populateOptions( this.#options, pOptions, DEFAULT_FETCHER_OPTIONS ) );

            this.#components = [...(asArray( options.components || ["fetch", "fs", "XmlHttpRequest", "ActiveX"] ))];

            this.#defaultTimeout = clamp( asInt( options.defaultTimeout, DEFAULT_FETCHER_OPTIONS.defaultTimeout ), 0, MAX_TIMEOUT );

            this.#baseUrl = options.baseUrl;

            this.#ignoreCache = options.ignoreCache;

            this.#encoding = options.encoding || "application/x-www-form-urlencoded";

            this.#charset = options.charset || "utf-8";

            this.#accept = options.accept || null;

            this.#requiresAuthentication = options.requiresAuthentication || false;
            this.#isAuthenticated = isFunction( options.isAuthenticated ) ? options.isAuthenticated : op_true;
            this.#isExpiredSession = isFunction( options.isExpiredSession ) ? options.isExpiredSession : op_false;

            this.#allowSynchronousFetch = options.allowSynchronousFetch || false;

            this.#headers = options.headers || null;

            this.#securityTokenId = options.securityTokenId || _mt_str;
            this.#securityTokenValue = options.securityTokenValue || _mt_str;

            this.#includeSecurityToken = options.includeSecurityToken || ( !isBlank( this.#securityTokenId ));
        }

        mergeHeaders( ...pHeaders )
        {
            // reverse the arguments, so that the first set of headers takes precedence
            const arr = asArray( varargs( ...pHeaders ) ).filter( isNonNullObject ).reverse();

            const obj = {};

            for( const h of arr )
            {
                objectEntries( h ).forEach( ( entry ) =>
                                            {
                                                const key = asString( ObjectEntry.getKey( entry ), true );
                                                obj[key] = asString( ObjectEntry.getValue( entry ) );
                                            } );
            }

            return new HttpRequestHeaders( obj );
        }

        calculateRequestOptions( pRequestBody, pMethod, pOptions = DEFAULT_REQUEST_OPTIONS )
        {
            const options = populateOptions( pOptions, DEFAULT_REQUEST_OPTIONS, DEFAULT_FETCHER_OPTIONS );

            const requestInit = options.requestInit || options;

            const timeout = asInt( requestInit.timeout || options.timeout || this.options?.timeout || this.#defaultTimeout, this.#defaultTimeout );

            const headers = this.mergeHeaders( requestInit.headers, options.headers, this.options?.headers, DEFAULT_REQUEST_OPTIONS.headers, DEFAULT_REQUEST_OPTIONS.headers );

            const abortController = requestInit.abortController || options.abortController || (timeout > 0 ? new AbortController() : {});

            const signal = requestInit.signal || options.signal || abortController.signal;

            return new HttpRequestOptions( pRequestBody || requestInit.body,
                                           requestInit.cache || (options.ignoreCache ? REQUEST_CACHE_OPTIONS.NO_CACHE : REQUEST_CACHE_OPTIONS.DEFAULT),
                                           requestInit.credentials || REQUEST_CREDENTIALS_OPTIONS.SAME_ORIGIN,
                                           headers,
                                           requestInit.integrity,
                                           requestInit.keepAlive,
                                           pMethod || requestInit.method || options.method || (!isNull( pRequestBody ) ? "POST" : "GET"),
                                           requestInit.mode || options.mode || MODES.DEFAULT,
                                           requestInit.priority || options.priority || PRIORITY.DEFAULT,
                                           requestInit.redirect || REDIRECT_OPTIONS.FOLLOW,
                                           requestInit.referrer || options.referrer || this.options?.referrer || "about:client",
                                           requestInit.referrerPolicy || options.referrerPolicy || REFERRER_POLICY_OPTIONS.NO_REFERRER_WHEN_DOWNGRADE,
                                           signal,
                                           timeout );
        }

        #fetch( pRequestOrUrl, pMethod, pRequestBody, pCallback, pOptions = DEFAULT_REQUEST_OPTIONS )
        {
            const options = populateOptions( pOptions, DEFAULT_REQUEST_OPTIONS, DEFAULT_FETCHER_OPTIONS );

            const requestOptions = this.calculateRequestOptions( pRequestBody, pMethod, options );

            new HttpRequest( pRequestBody, requestOptions );

        }

        async makeGetRequest()
        {

        }

        doGet()
        {
        }

        async postRequest()
        {

        }

        doPost()
        {

        }

        async putRequest()
        {

        }

        doPut()
        {

        }

        async patchRequest()
        {

        }

        doPatch()
        {

        }

        async headRequest()
        {

        }

        async optionsRequest()
        {

        }

        doOptions()
        {

        }

    }


}());