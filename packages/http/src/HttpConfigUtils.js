// noinspection GrazieInspection

/**
 * @overview
 *
 * This file defines classes for handling HTTP Requests,
 * especially those to API endpoints that impose Rate Limits.
 *
 * Its dependencies are limited to those exposed by other @toolbocks modules
 * or that are built in to node.js.
 *
 * The design goals are as follows:
 *
 * Clients of this module do not necessarily need to be aware of the rate-limiting details.
 * Clients can pass one or more instances of the RateLimits class if desired, but this should be optional,
 * and instead rely on the 'x-rate-limit' (and related) response headers
 * to interactively configure and vary behavior for each HTTP request.
 *
 * The base class, HttpClient defines the interface for the clients/consumers.
 *
 * The base class defaults to using a default delegate.
 * Subclasses can provide their own implementations of methods
 * or fallback on the super class/default delegate.
 *
 * The default implementations will use fetch (or node:fetch),
 * but subclasses using Axios are also expected.
 *
 * It should also be plausible to use other HTTP client libraries, including XmlHttpRequest.
 *
 */
/**
 * Import the http package for its Agent class.
 */
const http = require( "http" );

/**
 * Import the https package for its Agent class.
 */
const https = require( "https" );

/**
 * Imports the @toolbocks/core modules for the utility functions required
 */
const core = require( "@toolbocks/core" );
/**
 * Imports the @toolbocks/date module for the utility functions required to manipulate Dates
 */
const datesModule = require( "@toolbocks/dates" );

/**
 * Imports the @toolbocks/json module for the utility functions necessary to more safely parse or render JSON.
 */
const jsonUtils = require( "@toolbocks/json" );

/**
 * Imports the EntityUtils module for the base classes available.
 */
const entityUtils = require( "../../entities/src/EntityUtils.cjs" );

/**
 * Imports the HttpConstants that define common aspects of the HTTP protocol
 */
const httpConstants = require( "./HttpConstants.cjs" );

/**
 * Imports the HttpHeaders module for the Headers facade and associated utility functions required
 */
const httpHeaders = require( "./HttpHeaders.cjs" );

/**
 * Imports the HttpRequest module for the request facade and associated utility functions required
 */
const httpRequestModule = require( "./HttpRequest.cjs" );

const httpAgentUtils = require( "./HttpAgentUtils.js" );

/**
 * Imports the core constants
 */
const { constants } = core;

// Provides shorthand for the "undefined" Type
const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
/**
 * This is the IIFE that defines the classes, variables, and functions that are exported as a module.
 * Note that the exported module extends ToolBocksModule (from @toolbocks/core moduleUtils)
 */
// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK_HTTP_CONFIG__";

    // if this module has already been defined and exported, return that instance
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    // import the specific modules from @toolbocks/core that are necessary for this module
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    // import the classes, variables, and functions defined in moduleUtils that are used in this module
    const
        {
            ToolBocksModule,
            ObjectEntry,
            attempt,
            attemptSilent,
            asyncAttempt,
            lock,
            localCopy,
            objectKeys,
            objectValues,
            objectEntries,
            readProperty,
            readScalarProperty,
            setProperty,
            sleep,
            $ln,

        } = moduleUtils;

    // import the useful constants from the core constants
    const
        {
            _mt_str = "",
            _mt = _mt_str,
            _comma,
            _str,
            _num,
            _big,
            _bool,
            _fun,
            _obj
        } = constants;

    // import the useful functions from the core module, TypeUtils
    const
        {
            FAST_OBJECT_LITERAL_OPTIONS,
            isNull,
            isObject,
            isScalar,
            isNonNullObject,
            isNonNullValue,
            isNullOrNaN,
            isPopulatedObject,
            isFunction,
            isClass,
            isArray,
            isString,
            isNumber,
            isBoolean,
            isPromise,
            isThenable,
            isMap,
            instanceOfAny,
            hasProperty,
            toObjectLiteral,
            asMap,
            delegateTo,
            clamp
        } = typeUtils;

    // import the useful functions from the core module, StringUtils
    const
        {
            asString,
            asInt,
            isBlank,
            isJson,
            cleanUrl,
            lcase,
            ucase
        } = stringUtils;

    // import the useful functions from the core module, ArrayUtils
    const { asArray, TypedArray } = arrayUtils;

    // import the DateUtils module from the datesModule
    const { DateUtils } = datesModule;

    // import the functions from the JSON Utilities that we use in this module
    const { asJson, asObject, parseJson } = jsonUtils;

    // import the base classes required for the classes defined in this module, as well as related functions
    const { BockNamed } = entityUtils;

    // import the functions, variables, and classes defined in the HttpConstants module that are used in this module
    const
        {
            HTTP_HEADERS,
            CONTENT_TYPES,
            EXTENSIONS,
            VERBS,
            PRIORITY,
            resolveHttpMethod,
            resolveUrl,
            calculatePriority,
            HttpPropertyRule,
            HttpPropertyMergeRule,
            HttpPropertiesMerger,
            HttpContentType,
            HttpVerb,
            HttpStatus,
            HttpHeaderDefinition
        } = httpConstants;


    const
        {
            HTTP_AGENT_DEFAULT_CFG,
            HTTP_AGENT_DOWNLOAD_CFG,

            HttpAgentConfig,
            HttpAgentConfigExtended,

            resolveHttpAgent,
            resolveHttpsAgent,

            createHttpAgent,
            createHttpsAgent,

            httpAgent,
            httpsAgent,

            HTTP_AGENT,
            HTTPS_AGENT,

            fixAgents
        } = httpAgentUtils;

    const
        {
            HttpHeaders,
            HttpHeadersMerger,
            resolveHeaderName
        } = httpHeaders;

    // import the HttpRequest (facade) class we use to provide a uniform interface for HTTP Requests
    const { HttpRequest } = httpRequestModule;

    const modName = "HttpConfigUtils";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const MAX_REDIRECTS = 5;

    const DEFAULT_CONFIG =
        lock( {
                  responseType: "json",
                  method: VERBS.GET,
                  httpAgent: HTTP_AGENT,
                  httpsAgent: HTTPS_AGENT
              } );

    const DEFAULT_DOWNLOAD_CONFIG =
        lock( {
                  method: VERBS.GET,
                  responseType: "stream",
                  accept: "application/octet-stream",
                  headers: { Accept: "application/octet-stream" },
                  httpAgent: new http.Agent( HTTP_AGENT_DOWNLOAD_CFG.toLiteral() ),
                  httpsAgent: new https.Agent( HTTP_AGENT_DOWNLOAD_CFG.toLiteral() ),
              } );

    const HTTP_CONFIG_PROPERTY_NAMES = lock( ["headers", "httpAgent", "httpsAgent"] );

    const NON_DELEGATED_PROPERTIES = ["url", "method", "data", "body", "properties", "class", ...HTTP_CONFIG_PROPERTY_NAMES];


    /**
     * Returns the body data that was fetched or should be sent in a request.
     * This function expects the body to be a property of the configuration object specified.
     * The property is expected to be named either 'body' or 'data'.
     * For subclasses using a delegate with other expectations, override the corresponding method of HttpClient.
     *
     * @param pBody
     * @param {Object|HttpConfig|RequestInit} pConfig An object with either a body or data property.
     * @param {boolean} [pParseJson=false] whether to stringify the body if it is an object
     *
     * @returns {String|ArrayBuffer|Blob|DataView|File|FormData|TypedArray|URLSearchParams|ReadableStream|null}
     * The body to be sent to the server or the body received from the server (which may be an unfulfilled Promise)
     *
     * // override resolveBody for Axios, which will do this for us
     */
    async function resolveBody( pBody, pConfig, pParseJson = false )
    {
        let body = isNonNullObject( pBody ) || (isString( pBody ) && !isBlank( pBody )) ? pBody : (pConfig?.data || pConfig?.body);

        if ( isString( body ) && !isBlank( body ) )
        {
            return body;
        }

        if ( instanceOfAny( body, ArrayBuffer, Blob, DataView, File, FormData, TypedArray, URLSearchParams, ReadableStream ) )
        {
            return body;
        }

        if ( isNumber( body ) )
        {
            return asString( body, true );
        }

        if ( isPromise( body ) || isThenable( body ) )
        {
            body = isPromise( body ) ? await asyncAttempt( async() => await body ) : await Promise.resolve( body ).then( b => b );
            return resolveBody( body, pConfig );
        }

        if ( isNonNullObject( body ) && pParseJson )
        {
            return asJson( body );
        }

        return body;
    }

    const AXIOS_CONFIG_PROPERTIES =
        lock( [
                  "responseType",
                  "baseURL",
                  "method",
                  "timeout",
                  "withCredentials",
                  "responseEncoding",
                  "xsrfCookieName",
                  "xsrfHeaderName",
                  "withXSRFToken",
                  "maxContentLength",
                  "maxBodyLength",
                  "maxRedirects",
                  "socketPath",
                  "proxy",
                  "decompress",
                  "maxRate"] );


    const VALID_RESPONSE_TYPES = lock( ["arraybuffer", "json", "stream", "document", "text"] );

    const EXPECTED_BINARY_MIME_TYPES =
        [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/octet-stream",
            "image/png",
            "image/svg+xml",
            "image/jpeg",
            "application/pdf",
            "message/rfc822"
        ];

    const RESPONSE_TYPE_MAPPING =
        {
            "application/octet-stream": "stream",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "arraybuffer",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "arraybuffer",
            "application/vnd.ms-excel": "arraybuffer",
            "image/png": "arraybuffer",
            "image/svg+xml": "arraybuffer",
            "image/jpeg": "arraybuffer",
            "application/pdf": "arraybuffer",
            "message/rfc822": "arraybuffer",
            "text/css": "text",
            "text/html": "text",
            "text/xml": "text",
            "application/json": "json",
            "application/javascript": "text",
        };

    const isValidResponseType = function( pValue, pMethod, pUrl, pHeaders )
    {
        if ( isString( pValue ) && !isBlank( pValue ) && VALID_RESPONSE_TYPES.includes( lcase( pValue ).trim() ) )
        {
            const method = asString( resolveHttpMethod( pMethod ), true );

            const url = asString( resolveUrl( pUrl ), true );

            const headers = asObject( pHeaders || {} );

            const acceptHeader = asString( readScalarProperty( headers, _str, "accept" ), true );

            if ( ["application/json"].includes( acceptHeader ) || acceptHeader.includes( "json" ) )
            {
                return "json" === pValue;
            }

            if ( EXPECTED_BINARY_MIME_TYPES.includes( acceptHeader ) ||
                 acceptHeader.includes( "wordprocessingml.document" ) ||
                 acceptHeader.includes( "stream" ) ||
                 acceptHeader.includes( "image/" ) ||
                 asString( url, true ).includes( "download" ) )
            {
                return ["arraybuffer", "stream"].includes( pValue );
            }

            const acceptable = acceptHeader.split( _comma );

            for( let accepted of acceptable )
            {
                if ( pValue === RESPONSE_TYPE_MAPPING[acceptable] )
                {
                    return true;
                }
            }

            return objectValues( VERBS ).includes( ucase( method ) );
        }

        return false;
    };

    class HttpConfig
    {
        #properties;

        #responseType;

        #headers = {};

        #url;
        #method;

        #params;

        #data;
        #body;

        #httpAgent;
        #httpsAgent;

        constructor( pProperties, pHeaders, pUrl, pMethod, pBody = null )
        {
            const properties = { ...DEFAULT_CONFIG, ...(asObject( pProperties || {} )) };

            this.#properties = { ...(properties || {}) };

            this.#headers = new HttpHeaders( pHeaders || this.#properties?.headers || {}, this.#properties?.headers );

            this.#method = resolveHttpMethod( pMethod || properties?.method );

            let url = asString( resolveUrl( pUrl, properties ), true );
            this.#url = !isBlank( url ) ? cleanUrl( url ) : _mt;

            const type = lcase( asString( readScalarProperty( this.#properties, _str, "responseType" ) || _mt, true ) );

            if ( isValidResponseType( type, this.#method, this.#url, this.#headers ) )
            {
                this.#responseType = lcase( type );
            }
            else
            {
                this.#responseType = HttpConfig.calculateResponseType( readScalarProperty( this.#headers, _str, "accept" ) );
            }

            this.configureAgents( properties );

            if ( pBody )
            {
                this.body = pBody;
            }
        }

        configureAgents( pProperties )
        {
            const properties = pProperties || this.properties;

            let agentConfig = properties["httpAgentConfig"] || HTTP_AGENT_DEFAULT_CFG;
            let agent = (properties["httpAgent"] || HTTP_AGENT);

            this.httpAgent = resolveHttpAgent( agent, agentConfig );

            agentConfig = (properties["httpAgentConfig"] || agentConfig || HTTP_AGENT_DEFAULT_CFG);
            agent = (properties["httpsAgent"] || HTTPS_AGENT);

            this.httpsAgent = resolveHttpsAgent( agent, agentConfig );

            return fixAgents( this );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get properties()
        {
            return { ...DEFAULT_CONFIG, ...(asObject( this.#properties || {} )) };
        }

        get responseType()
        {
            let type = asString( this.#responseType || readScalarProperty( this.properties, _str, "responseType" ), true );

            if ( !isValidResponseType( type ) || ((isNonNullObject( this.data ) || isNonNullObject( this.body )) && "text" === type) )
            {
                type = HttpConfig.calculateResponseType( readScalarProperty( this.#headers, _str, "accept" ) );
            }

            this.#responseType = isBlank( type ) ? HttpConfig.calculateResponseType( readScalarProperty( this.#headers, _str, "accept" ) ) : asString( type, true );

            return lcase( asString( this.#responseType, true ) ) || "json";
        }

        set responseType( pValue )
        {
            if ( isValidResponseType( pValue ) )
            {
                this.#responseType = lcase( pValue ).trim();
            }
        }

        get headers()
        {
            let headers = {};

            let headersProperties = [this.properties?.headers, this.#headers].filter( isNonNullObject );

            for( let headersObject of headersProperties )
            {
                let copy = isFunction( headersObject?.clone ) ? headersObject.clone() : asObject( headersObject || {} );
                let objLiteral = isFunction( copy?.toLiteral ) ? copy.toLiteral() : toObjectLiteral( copy || {} );
                headers = { ...headers, ...objLiteral };
            }

            let rtnValue = {};

            let entries = objectEntries( headers || {} ) || [];

            entries.forEach( entry =>
                             {
                                 let key = asString( ObjectEntry.getKey( entry ), true );
                                 let value = asString( ObjectEntry.getValue( entry ), true );

                                 if ( !(isBlank( key ) || isBlank( value )) )
                                 {
                                     rtnValue[key] = value;
                                 }
                             } );

            return rtnValue;
        }

        set headers( pValue )
        {
            this.#headers = new HttpHeaders( pValue, new HttpHeaders( this.#headers, this.properties?.headers ) );
        }

        addHeaders( ...pValue )
        {
            this.#headers = HttpHeaders.mergeHeaders( this.#headers, ...pValue );
        }

        removeHeaderValues( ...pKeys )
        {
            let keys = [...(asArray( pKeys ))];

            if ( isFunction( this.#headers?.delete ) )
            {
                while ( $ln( keys ) > 0 )
                {
                    let key = resolveHeaderName( keys.shift() );
                    attempt( () => this.#headers.delete( key ) );
                }
            }
            else if ( isNonNullObject( this.#headers ) )
            {
                while ( $ln( keys ) > 0 )
                {
                    let key = resolveHeaderName( keys.shift() );
                    attempt( () => delete this.#headers[key] );
                }
            }
        }

        get httpHeaders()
        {
            if ( this.#headers instanceof HttpHeaders )
            {
                return this.#headers.clone();
            }
            else
            {
                return new HttpHeaders( this.headers || {}, new HttpHeaders( this.properties || {}, this ) );
            }
        }

        get webApiHeaders()
        {
            if ( _ud !== typeof Headers )
            {
                return new Headers( this.headers );
            }
            return { ...this.headers };
        }

        get url()
        {
            let url = asString( resolveUrl( this.#url, this.properties ), true );
            return isBlank( url ) ? _mt : cleanUrl( url );
        }

        set url( pUrl )
        {
            let url = asString( resolveUrl( pUrl ), true );

            this.#url = isBlank( url ) ? asString( this.#url || _mt, true ) : cleanUrl( url );
        }

        get method()
        {
            return resolveHttpMethod( asString( this.#method, true ) );
        }

        set method( pMethod )
        {
            this.#method = resolveHttpMethod( asString( pMethod || this.#method, true ) );
        }

        get httpAgent()
        {
            this.#httpAgent = resolveHttpAgent( this.#httpAgent );
            return this.#httpAgent;
        }

        set httpAgent( pAgent )
        {
            this.#httpAgent = resolveHttpAgent( pAgent || this.#httpAgent );
        }

        get httpsAgent()
        {
            this.#httpsAgent = resolveHttpsAgent( this.#httpsAgent );
            return this.#httpsAgent;
        }

        set httpsAgent( pAgent )
        {
            this.#httpsAgent = resolveHttpsAgent( pAgent || this.#httpsAgent );
        }

        fixAgents( pForDownload )
        {
            fixAgents( this, pForDownload );
        }

        get data()
        {
            return this.#data || this.#body;
        }

        set data( pData )
        {
            if ( pData )
            {
                this.#data = pData;
                this.#body = pData;
            }
        }

        clearData()
        {
            this.#data = null;
            this.#body = null;
        }

        clearBody()
        {
            this.clearData();
        }

        get body()
        {
            return this.#body || this.#data || null;
        }

        set body( pBody )
        {
            this.#body = pBody || null;
            this.#data = pBody || null;
        }

        get params()
        {
            return !isNull( this.#params ) ? new URLSearchParams( this.#params ) : null;
        }

        set params( pParams )
        {
            let params = isNull( pParams ) ? null : new URLSearchParams( pParams );
            this.#params = params || null;
        }

        clearParams()
        {
            this.#params = null;
        }

        equals( pOther )
        {
            if ( isNull( pOther ) || !isObject( pOther ) )
            {
                return false;
            }

            if ( !isNull( this.data ) || !isNull( pOther?.data ) || !isNull( pOther?.body ) )
            {
                return false;
            }

            if ( (isNull( this.params ) && !isNull( pOther.params )) || ( !isNull( this.params ) && isNull( pOther.params )) )
            {
                return false;
            }

            let theseParams = new URLSearchParams( this.params || {} );
            let otherParams = new URLSearchParams( pOther.params || {} );

            let paramEntries = theseParams.entries();

            let is = true;

            for( let [k, v] of paramEntries )
            {
                if ( otherParams.get( k ) !== v )
                {
                    is = false;
                    break;
                }
            }

            if ( !is )
            {
                return is;
            }

            let properties =
                [
                    "responseType",
                    "baseURL",
                    "method",
                    "timeout",
                    "withCredentials",
                    "responseEncoding",
                    "xsrfCookieName",
                    "xsrfHeaderName",
                    "withXSRFToken",
                    "maxContentLength",
                    "maxBodyLength",
                    "maxRedirects",
                    "socketPath",
                    "proxy",
                    "decompress",
                    "maxRate"];

            while ( is && $ln( properties ) )
            {
                let property = properties.shift();

                const otherValue = readProperty( pOther, property );

                const thisValue = readProperty( this, property );

                if ( (isNull( otherValue ) && !isNull( thisValue )) ||
                     ( !isNull( otherValue ) && isNull( thisValue )) ||
                     otherValue !== thisValue )
                {
                    is = false;
                    break;
                }
            }

            return is && (this.httpHeaders.equals( pOther?.httpHeaders ));
        }

        toLiteral()
        {
            // prevent any confusion over 'this' in obj
            const me = this;

            const heads = me.headers;

            const acceptHeader = lcase( asString( readScalarProperty( heads, _str, "accept" ), true ) );

            let obj =
                {
                    responseType: lcase( asString( me.responseType, true ) || HttpConfig.calculateResponseType( acceptHeader ) ),
                    method: me.method,
                    url: me.url,
                    headers: heads,
                    httpAgent: me.httpAgent,
                    httpsAgent: me.httpsAgent
                };

            if ( me.data || me.body )
            {
                obj["data"] = me.data || me.body;
                obj["body"] = me.body || me.data;
            }

            if ( me.params )
            {
                obj["params"] = new URLSearchParams( me.params );
            }

            const entries = objectEntries( this.properties );

            if ( entries && $ln( entries ) > 0 )
            {
                for( let entry of entries )
                {
                    if ( entry )
                    {
                        let key = asString( ObjectEntry.getKey( entry ), true );
                        let value = ObjectEntry.getValue( entry );

                        if ( !(isNull( value ) || isBlank( key )) )
                        {
                            obj[key] = (obj[key] ?? obj[lcase( key )] ?? value);
                        }
                    }
                }
            }

            let headers = asObject( heads ?? this.headers ?? obj.headers );

            if ( isFunction( headers?.toLiteral ) )
            {
                headers = headers.toLiteral();
                obj.headers = headers;
            }
            else
            {
                obj.headers = toObjectLiteral( headers ?? obj.headers ?? this.headers );
            }

            delete obj["properties"];

            return lock( fixAgents( obj ) );
        }

        merge( ...pConfigs )
        {
            let others = asArray( pConfigs ).filter( isNonNullObject ).map( e => isFunction( e?.clone ) ? e.clone() : e );

            if ( $ln( others ) > 0 )
            {
                return HttpConfig.mergeConfigs( this.clone(), ...others );
            }

            return this.clone();
        }

        clone()
        {
            let body = this.body || this.data;

            if ( !isNull( body ) && !(isPromise( body ) || isThenable( body )) )
            {
                if ( isNonNullObject( body ) || isArray( body ) )
                {
                    if ( isFunction( body?.clone ) )
                    {
                        body = body.clone();
                    }
                    else if ( isArray( body ) )
                    {
                        body = [...body];
                    }
                    else
                    {
                        body = { ...body };
                    }
                }
            }

            const httpConfig = new HttpConfig( this.properties, this.headers, asString( this.url, true ), asString( this.method, true ), body );

            return fixAgents( httpConfig );
        }
    }

    HttpConfig.calculateResponseType = function( pAcceptHeader )
    {
        const acceptHeader = lcase( asString( pAcceptHeader, true ) );

        if ( ["application/json"].includes( acceptHeader ) || acceptHeader.includes( "json" ) )
        {
            return "json";
        }

        if ( ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes( acceptHeader ) ||
             acceptHeader.includes( "wordprocessingml.document" ) ||
             acceptHeader.includes( "openxmlformats-officedocument" ) )
        {
            return "arraybuffer";
        }

        if ( ["application/octet-stream"].includes( acceptHeader ) || acceptHeader.includes( "stream" ) )
        {
            return "stream";
        }

        let responseType = _mt;

        const acceptable = acceptHeader.split( _comma );

        for( let accepted of acceptable )
        {
            responseType = lcase( asString( RESPONSE_TYPE_MAPPING[accepted], true ) );

            if ( !isBlank( responseType ) )
            {
                break;
            }
        }

        if ( isBlank( responseType ) )
        {
            if ( (/image\/|pdf|openxmlformats-officedocument/).test( acceptHeader ) )
            {
                responseType = "arraybuffer";
            }
            else if ( (/json/).test( acceptHeader ) )
            {
                responseType = "json";
            }
            else if ( (/text\//).test( acceptHeader ) )
            {
                responseType = "text";
            }
            else if ( (/stream/).test( acceptHeader ) )
            {
                responseType = "stream";
            }
        }

        return responseType;
    };

    HttpConfig.fromLiteral = function( pObject )
    {
        if ( isNonNullObject( pObject ) )
        {
            return new HttpConfig( pObject.properties || { ...pObject }, pObject.headers, asString( pObject.url || _mt ), asString( pObject.method || VERBS.GET, true ), pObject.body ?? null );
        }
        return new HttpConfig( DEFAULT_CONFIG );
    };

    HttpConfig.resolveUrl = resolveUrl;

    const makePropertyMergeRule =
        ( pPropertyName = "headers" ) =>
        {
            return new HttpPropertyMergeRule( (pPropertyName || "headers"),
                                              ( pObject, pKey, pValue ) =>
                                              {
                                                  // existing headers
                                                  let headers = readProperty( pObject, (pPropertyName || "headers") );

                                                  headers = (isNonNullObject( headers )) ?
                                                            isFunction( headers.clone ) ?
                                                            headers.clone() :
                                                            new HttpHeaders( headers, pValue ?? {} ) :
                                                            new HttpHeaders();

                                                  if ( isNonNullObject( pValue ) )
                                                  {
                                                      const merger = HttpHeadersMerger.getDefault();
                                                      headers = merger.mergeHeaders( headers, pValue );
                                                  }

                                                  setProperty( pObject, (pPropertyName || "headers"), headers );
                                              } );
        };

    const DEFAULT_CONFIG_MERGE_RULES =
        lock( HttpPropertiesMerger.defineHttpPropertyRules(
            {
                "auth": new HttpPropertyRule( "auth", HttpPropertyMergeRule["REPLACE"] ),
                "withCredentials": new HttpPropertyRule( "withCredentials", HttpPropertyMergeRule["REPLACE"] ),

                "xsrfCookieName": new HttpPropertyRule( "xsrfCookieName", HttpPropertyMergeRule["REPLACE"] ),
                "xsrfHeaderName": new HttpPropertyRule( "xsrfHeaderName", HttpPropertyMergeRule["REPLACE"] ),
                "withXSRFToken": new HttpPropertyRule( "withXSRFToken", HttpPropertyMergeRule["REPLACE"] ),

                "method": new HttpPropertyRule( "method", HttpPropertyMergeRule["REPLACE"] ),

                "baseUrl": new HttpPropertyRule( "baseUrl", HttpPropertyMergeRule["PRESERVE"] ),
                "url": new HttpPropertyRule( "url", HttpPropertyMergeRule["REPLACE"] ),

                "responseType": new HttpPropertyRule( "responseType", HttpPropertyMergeRule["REPLACE_STRING"] ),
                "responseEncoding": new HttpPropertyRule( "responseEncoding", HttpPropertyMergeRule["REPLACE_STRING"] ),
                "accept": new HttpPropertyRule( "accept", HttpPropertyMergeRule["COMBINE"] ),

                "params": new HttpPropertyRule( "params", HttpPropertyMergeRule["REPLACE"] ),
                "paramsSerializer": new HttpPropertyRule( "paramsSerializer", HttpPropertyMergeRule["REPLACE"] ),

                "data": new HttpPropertyRule( "data", HttpPropertyMergeRule["REPLACE"] ),
                "body": new HttpPropertyRule( "body", HttpPropertyMergeRule["REPLACE"] ),

                "env": new HttpPropertyRule( "env", HttpPropertyMergeRule["PRESERVE"] ),
                "formSerializer": new HttpPropertyRule( "formSerializer", HttpPropertyMergeRule["PRESERVE"] ),

                "allowAbsoluteUrls": new HttpPropertyRule( "allowAbsoluteUrls", HttpPropertyMergeRule["PRESERVE"] ),
                "timeout": new HttpPropertyRule( "timeout", HttpPropertyMergeRule["REPLACE"] ),
                "maxContentLength": new HttpPropertyRule( "maxContentLength", HttpPropertyMergeRule["REPLACE"] ),
                "maxBodyLength": new HttpPropertyRule( "maxBodyLength", HttpPropertyMergeRule["REPLACE"] ),
                "maxRedirects": new HttpPropertyRule( "maxRedirects", HttpPropertyMergeRule["REPLACE"] ),
                "decompress": new HttpPropertyRule( "decompress", HttpPropertyMergeRule["REPLACE"] ),

                "transformRequest": new HttpPropertyRule( "transformRequest", HttpPropertyMergeRule["REPLACE"] ),
                "transformResponse": new HttpPropertyRule( "transformResponse", HttpPropertyMergeRule["REPLACE"] ),

                "validateStatus": new HttpPropertyRule( "validateStatus", HttpPropertyMergeRule["PRESERVE"] ),

                "proxy": new HttpPropertyRule( "proxy", HttpPropertyMergeRule["REPLACE"] ),
                "socketPath": new HttpPropertyRule( "socketPath", HttpPropertyMergeRule["REPLACE"] ),
                "transport": new HttpPropertyRule( "transport", HttpPropertyMergeRule["REPLACE"] ),

                "httpAgent": new HttpPropertyRule( "httpAgent", HttpPropertyMergeRule["REPLACE"] ),
                "httpsAgent": new HttpPropertyRule( "httpAgent", HttpPropertyMergeRule["REPLACE"] ),

                "cancelToken": new HttpPropertyRule( "cancelToken", HttpPropertyMergeRule["REPLACE"] ),
                "signal": new HttpPropertyRule( "signal", HttpPropertyMergeRule["REPLACE"] ),
                "maxRate": new HttpPropertyRule( "maxRate", HttpPropertyMergeRule["REPLACE"] ),

                "headers": new HttpPropertyRule( "headers", makePropertyMergeRule( "headers" ) ),
                "httpHeaders": new HttpPropertyRule( "httpHeaders", makePropertyMergeRule( "httpHeaders" ) )

                // add more as necessary
            } ) );

    class HttpConfigMerger extends HttpPropertiesMerger
    {
        constructor( pConfigRules = DEFAULT_CONFIG_MERGE_RULES, pDeepCopy = false, pOptions = FAST_OBJECT_LITERAL_OPTIONS )
        {
            super( pConfigRules || DEFAULT_CONFIG_MERGE_RULES, pDeepCopy, { ...FAST_OBJECT_LITERAL_OPTIONS, ...(pOptions || {}) } );
        }

        mergeConfigs( pConfig, ...pOthers )
        {
            // filter out anything that is irrelevant, such as empty objects or objects that cannot be treated as an HttpConfig
            let configs = [pConfig, ...pOthers].filter( e => isHttpConfig( e ) || isPopulatedObject( e ) );

            // if we have more than one, we will merge, otherwise we will clone
            if ( $ln( configs ) > 1 )
            {
                // save the existing headers properties for post-processing
                let headersObjects = configs.map( e => e.headers ).filter( isNonNullObject );

                // protect the original objects by either cloning them or converting them to POJOs
                headersObjects = headersObjects.map( e => isFunction( e?.clone ) ? e.clone() : toObjectLiteral( e ) );

                // get the first config
                let config = configs.shift();

                // protect the original config by cloning it if possible
                if ( isFunction( config?.clone ) )
                {
                    config = config.clone();
                }
                else
                {
                    // if the object does not have a clone method, it is likely a POJO
                    // so we treat it like one
                    config = new HttpConfig( toObjectLiteral( config, FAST_OBJECT_LITERAL_OPTIONS ), toObjectLiteral( config.headers ), asString( config.url || _mt, true ), asString( config.method || _mt, true ), (isNonNullObject( config.body ) ? (isFunction( config.body?.clone ) ? config.body.clone() : localCopy( config.body )) : config.body ?? null) );
                    config = fixAgents( config );
                }

                let others = asArray( configs ).map( e => isFunction( e?.clone ) ? e.clone() : e );

                config = super.mergeProperties( config, ...(others) );

                if ( $ln( headersObjects ) > 1 )
                {
                    let headersMerger = HttpHeadersMerger.getDefault();

                    config.headers = headersMerger.mergeHeaders( ...headersObjects );
                }

                return fixAgents( config );
            }

            let cfg = $ln( configs ) > 0 ? configs[0] : new HttpConfig( DEFAULT_CONFIG );

            if ( isFunction( cfg?.clone ) )
            {
                return fixAgents( cfg.clone() );
            }

            cfg = new HttpConfig( toObjectLiteral( cfg, FAST_OBJECT_LITERAL_OPTIONS ), toObjectLiteral( cfg.headers || {} ), asString( cfg.url || _mt, true ), asString( cfg.method || _mt, true ), (isNonNullObject( cfg.body ) ? (isFunction( cfg.body?.clone ) ? cfg.body.clone() : localCopy( cfg.body )) : cfg.body ?? null) );

            return fixAgents( cfg );
        }
    }

    const DEFAULT_CONFIG_MERGER = new HttpConfigMerger( DEFAULT_CONFIG_MERGE_RULES );

    HttpConfigMerger.getDefault = function()
    {
        return DEFAULT_CONFIG_MERGER || new HttpConfigMerger( DEFAULT_CONFIG_MERGE_RULES );
    };

    const isHttpConfig = function( pConfig, pStrict = false, pClass = HttpConfig )
    {
        let strict = !!pStrict;

        if ( isNonNullObject( pConfig ) )
        {
            if ( pConfig instanceof HttpConfig )
            {
                return !strict || isNull( pClass ) || !isClass( pClass ) || pClass === HttpConfig || pConfig instanceof pClass;
            }

            if ( strict )
            {
                return false;
            }

            let matchesInterface = hasProperty( pConfig, "headers" );

            for( let prop of HTTP_CONFIG_PROPERTY_NAMES )
            {
                matchesInterface = matchesInterface && hasProperty( pConfig, prop );
                if ( !matchesInterface )
                {
                    break;
                }
            }

            return matchesInterface;
        }

        return false;
    };

    const resolveHttpConfig = function( pConfig, ...pObjects )
    {
        let httpConfig = pConfig ?? {};

        let hosts = [...(asArray( pObjects ?? [] ))].filter( isNonNullObject );

        while ( !isHttpConfig( httpConfig ) && $ln( hosts ) )
        {
            const host = hosts.shift();
            if ( isNonNullObject( host ) )
            {
                httpConfig = isHttpConfig( host ) ? host : (host.httpConfig || host.config);
            }
        }

        if ( isHttpConfig( httpConfig ) )
        {
            return fixAgents( httpConfig );
        }

        let objects = [pConfig, ...pObjects].filter( isNonNullObject );

        let headersObjects = objects.map( e => e.headers ).filter( isNonNullObject );

        let properties = objects.reduce( ( acc, curr ) => ({
            ...acc,
            ...curr,
            headers: HttpHeaders.mergeHeaders( acc.headers, curr.headers )
        }), {} );

        return new HttpConfig( properties, HttpHeaders.mergeHeaders( properties.headers, ...headersObjects ), properties.url, properties.method, properties.body || properties.data );
    };

    const toHttpConfigLiteral = function( pHttpConfig )
    {
        if ( isFunction( pHttpConfig?.toLiteral ) )
        {
            return fixAgents( pHttpConfig.toLiteral() );
        }

        const httpConfig = fixAgents( { ...(asObject( pHttpConfig || {} ) || {}) } );

        const config = new HttpConfig( httpConfig, (httpConfig?.headers || httpConfig), httpConfig?.url, httpConfig?.method );

        return fixAgents( config.toLiteral() );
    };

    HttpConfig.isHttpConfig = isHttpConfig;
    HttpConfig.resolveHttpConfig = resolveHttpConfig;
    HttpConfig.toHttpConfigLiteral = toHttpConfigLiteral;

    HttpConfig.mergeConfigs = function( ...pConfigs )
    {
        // filter the arguments such that we only have relevant objects
        const configs = asArray( pConfigs ).filter( e => isHttpConfig( e ) || isPopulatedObject( e ) );

        // if we have relevant objects, shift the first one off of the list, otherwise create a config from the arguments
        let base = ($ln( configs ) > 0) ? configs.shift() : new HttpConfig( ...pConfigs );

        // protect the original config; the expectation is that the merge operations return new objects
        if ( isFunction( base?.clone ) )
        {
            base = base.clone();
        }

        // if after having removed the first element, we still have other relevant objects
        if ( $ln( configs ) > 0 )
        {
            // filter the remaining objects
            const others = asArray( configs ).filter( e => (isHttpConfig( e ) && isFunction( base?.equals ) ? !base.equals( e ) : isPopulatedObject( e )) );

            // if the filtered list is not empty
            if ( $ln( others ) > 0 )
            {
                // merge the remaining configs with the first one we shifted off above
                // and return the result
                const merger = HttpConfigMerger.getDefault();
                return merger.mergeConfigs( base, ...others );
            }
        }

        // if there we no more than 1 relevant objects to merge,
        // we return the one we either slurped off the original arguments or created as a substitute
        return base;
    };

    HttpConfig.from = function( ...pValues )
    {
        let args = [...(asArray( pValues ))].filter( e => !isNull( e ) );

        if ( $ln( args ) > 0 && (args.every( e => isNonNullObject( e ) && (isHttpConfig( e ) || isFunction( e.toLiteral )) )) )
        {
            args = args.map( e => new HttpConfig( e, e?.headers, e?.url, e?.method, e?.body || e?.data ) );

            return HttpConfig.mergeConfigs( ...args );
        }

        return new HttpConfig( args );
    };

    HttpConfig.toFetchRequestInitOptions = async function( pConfig )
    {
        const config = resolveHttpConfig( pConfig );

        const mapper = async( pCfg = config, pInitOptions = {} ) =>
        {
            const cfg = resolveHttpConfig( pCfg, config, pConfig );

            const initOpts = asObject( pInitOptions || {} );

            let headers = cfg?.headers || {};

            initOpts.headers = isFunction( headers?.toLiteral ) ? headers.toLiteral() : { ...(toObjectLiteral( asObject( headers || {} ) )) };

            initOpts.headers = toObjectLiteral( initOpts.headers, { respectToLiteralMethod: false } );

            initOpts.headers = new Headers( initOpts.headers || {} );

            initOpts.method = ucase( cfg?.method || VERBS.GET );

            const urlMapper = ( pUrl, pParams ) =>
            {
                let url = cleanUrl( resolveUrl( pUrl, pConfig ), true );

                let params = pParams || cfg?.params || pConfig?.params;

                if ( !(isNull( pParams )) )
                {
                    let qs = new URLSearchParams( params ).toString();

                    if ( !isBlank( qs ) )
                    {
                        url = url.replace( /\/+$/, _mt );
                        if ( url.includes( "?" ) )
                        {
                            url += (/\?\w+=\w+$/.test( url )) ? ("&" + qs) : qs;
                        }
                        else
                        {
                            url += ("?" + qs);
                        }
                    }
                }

                return url;
            };

            initOpts.url = urlMapper( cfg?.url, cfg?.params || config?.params || pConfig?.params );

            let body = (cfg?.data || config?.data || pConfig?.data || cfg?.body || config?.body || pConfig?.body);
            body = !isNull( body ) ? await body : null;

            if ( !isNull( body ) )
            {
                initOpts.body = isNonNullObject( body ) ? attempt( () => asJson( body ) || body ) : body;
            }

            if ( cfg?.withCredentials ?? config?.withCredentials ?? pConfig?.withCredentials )
            {
                initOpts.credentials = "include";
            }

            if ( cfg?.timeout ?? config?.timeout ?? pConfig?.timeout )
            {
                initOpts.signal = AbortSignal.timeout( cfg?.timeout ?? config?.timeout ?? pConfig?.timeout );
            }

            return initOpts;
        };

        let requestInitOptions = { ...(config) };

        return await mapper( config, requestInitOptions );
    };

    async function prepareRequestBody( pBody, pConfig, pMethod, pParseJson )
    {
        let body = pBody || pConfig?.data || pConfig?.body;

        let params = new URLSearchParams();

        let contentType = null;

        let contentLength = -1;

        if ( HttpVerb.resolveHttpMethod( pMethod, pConfig ).allowsBody )
        {
            body = await asyncAttempt( async() => await resolveBody( body, pConfig, pParseJson ) );

            contentType = await asyncAttempt( async() => await HttpContentType.calculateContentType( {
                                                                                                         data: body,
                                                                                                         body
                                                                                                     } ) );
        }
        else if ( !isNull( body ) )
        {
            switch ( typeof body )
            {
                case _ud:
                    break;

                case _str:
                    if ( isJson( body ) )
                    {
                        let obj = asObject( attempt( () => parseJson( body ) ) || {} );
                        if ( isNonNullObject( obj ) )
                        {
                            const entries = objectEntries( obj );
                            for( let entry of entries )
                            {
                                const key = asString( ObjectEntry.getKey( entry ), true );
                                const value = ObjectEntry.getValue( entry );

                                if ( isScalar( value ) )
                                {
                                    params.append( key, asString( value ) );
                                }
                                else if ( isNonNullObject( value ) )
                                {
                                    const v = attempt( () => asJson( value ) );
                                    if ( isNonNullValue( v ) )
                                    {
                                        params.append( key, asString( v ) );
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        const lines = asString( body ).split( /(\r?\n)/ );
                        if ( $ln( lines ) )
                        {
                            lines.forEach( line =>
                                           {
                                               let kv = line.split( /=:/ );
                                               let k = $ln( kv ) > 0 ? kv[0] : _mt;
                                               let v = $ln( kv ) > 1 ? kv[1] : k;

                                               if ( !(isBlank( k ) || isBlank( v )) )
                                               {
                                                   params.append( k, v );
                                               }
                                           } );
                        }
                    }
                    break;

                case _obj:
                    const entries = objectEntries( body );
                    entries.forEach( entry =>
                                     {
                                         const key = asString( ObjectEntry.getKey( entry ), true );
                                         const value = ObjectEntry.getValue( entry );

                                         if ( isScalar( value ) )
                                         {
                                             params.append( key, asString( value ) );
                                         }
                                         else if ( isNonNullObject( value ) )
                                         {
                                             const v = attempt( () => asJson( value ) );
                                             if ( isNonNullValue( v ) )
                                             {
                                                 params.append( key, asString( v ) );
                                             }
                                         }
                                     } );
                    break;

                default:
                    params.append( "body", body );
                    break;
            }
        }

        return { body, params, contentType, contentLength };
    }

    async function prepareConfigWithParams( pConfig,
                                            pUrl = pConfig?.url,
                                            pMethod = pConfig?.method,
                                            pParams = new URLSearchParams() )
    {
        const httpConfig = resolveHttpConfig( isHttpConfig( pConfig ) ?
                                              pConfig :
                                              new HttpConfig( pConfig,
                                                              pConfig?.headers,
                                                              resolveUrl( pUrl, pConfig ),
                                                              resolveHttpMethod( pMethod, pConfig ) ) );

        const url = cleanUrl( asString( resolveUrl( pUrl || httpConfig?.url, httpConfig ), true ), true );

        const method = resolveHttpMethod( pMethod || httpConfig?.method, httpConfig );

        let params = pParams || httpConfig?.params;

        params = !isNull( params ) ? new URLSearchParams( params ) : null;

        let config = new HttpConfig( httpConfig, httpConfig.headers, url, method );

        config = HttpConfig.mergeConfigs( httpConfig, config );

        config.params = params;

        if ( isNull( config.data ) && isNull( config.body ) )
        {
            if ( isFunction( config.removeHeaderValues ) )
            {
                attempt( () => config.removeHeaderValues( ...(asArray( objectKeys( HTTP_HEADERS.MESSAGE_BODY ) )) ) );
            }
        }

        return fixAgents( config );
    }

    async function prepareConfigWithBody( pConfig, pUrl = pConfig?.url, pMethod = pConfig?.method, pBody, pParseJson )
    {
        const httpConfig = isHttpConfig( pConfig ) ? pConfig : new HttpConfig( pConfig,
                                                                               pConfig?.headers,
                                                                               resolveUrl( pUrl, pConfig ),
                                                                               resolveHttpMethod( pMethod, pConfig ),
                                                                               resolveBody( pBody || pConfig?.body || pConfig?.data, pConfig, pParseJson ) );

        const url = cleanUrl( asString( resolveUrl( pUrl || httpConfig?.url, httpConfig ) || httpConfig?.url, true ), true );

        const method = resolveHttpMethod( pMethod || httpConfig?.method, httpConfig );

        let
            {
                body,
                params,
                contentType,
                contentLength
            } = await prepareRequestBody( pBody, httpConfig, method, pParseJson );

        if ( isNull( body ) )
        {
            if ( !isNull( params ) && $ln( params ) )
            {
                return prepareConfigWithParams( httpConfig, url, method, new URLSearchParams( params ) );
            }
        }

        return fixAgents( new HttpConfig( httpConfig, httpConfig.headers, url, method, body ) );
    }

    async function prepareConfig( pConfig, pUrl = pConfig?.url, pMethod = pConfig?.method, pBody, pParseJson )
    {
        const httpConfig = isHttpConfig( pConfig ) ? pConfig : new HttpConfig( pConfig,
                                                                               pConfig?.headers,
                                                                               resolveUrl( pUrl, pConfig ),
                                                                               resolveHttpMethod( pMethod, pConfig ),
                                                                               pBody || pConfig?.data || pConfig?.body );

        if ( !isNull( pBody || httpConfig.body || httpConfig.data ) )
        {
            let body = await resolveBody( pBody || httpConfig.data || httpConfig.body, httpConfig, pParseJson );

            return prepareConfigWithBody( httpConfig, pUrl || httpConfig?.url, pMethod || httpConfig?.method, body, pParseJson );
        }

        const url = cleanUrl( asString( resolveUrl( pUrl, httpConfig ) || httpConfig?.url, true ), true );

        const method = resolveHttpMethod( pMethod || httpConfig?.method, httpConfig );

        if ( isNull( httpConfig.body ) )
        {
            if ( httpConfig.params )
            {
                return await prepareConfigWithParams( httpConfig, url, method, httpConfig.params );
            }
        }

        let config = new HttpConfig( httpConfig, httpConfig.headers, url, method );

        if ( isNull( httpConfig.body ) && isFunction( config?.removeHeaderValues ) )
        {
            attempt( () => config.removeHeaderValues( ...(asArray( objectKeys( HTTP_HEADERS.MESSAGE_BODY ) )) ) );
        }

        return fixAgents( config );
    }

    const DEFAULT_HTTP_CONFIG = new HttpConfig( DEFAULT_CONFIG );

    const DEFAULT_HTTP_DOWNLOAD_CONFIG = new HttpConfig( DEFAULT_DOWNLOAD_CONFIG,
                                                         DEFAULT_DOWNLOAD_CONFIG.headers );

    HttpConfig.getDownloadDefault = function()
    {
        return new HttpConfig( DEFAULT_HTTP_DOWNLOAD_CONFIG, DEFAULT_HTTP_DOWNLOAD_CONFIG.headers );
    };

    HttpConfig.getDefault = function( pForDownload = false )
    {
        return !!pForDownload ? HttpConfig.getDownloadDefault() : new HttpConfig( DEFAULT_CONFIG );
    };

    HttpConfig.getCustom = function( pForDownload, pCustomProperties )
    {
        let baseConfig = HttpConfig.getDefault( pForDownload );

        let httpConfig = new HttpConfig( { ...(baseConfig.toLiteral()), ...(asObject( pCustomProperties )) }, { ...(baseConfig.headers), ...(asObject( pCustomProperties.headers )) } );

        httpConfig = HttpConfig.mergeConfigs( baseConfig, httpConfig );

        return fixAgents( httpConfig );
    };

    HttpConfig.prepareWithBody = prepareConfigWithBody;
    HttpConfig.prepareWithParams = prepareConfigWithParams;
    // HttpConfig.prepareWithPathParams = prepareConfig;
    HttpConfig.prepareWithoutData = async function( pConfig, pUrl = pConfig?.url, pMethod = pConfig?.method )
    {
        return fixAgents( HttpConfig.mergeConfigs( DEFAULT_HTTP_CONFIG, new HttpConfig( pConfig || DEFAULT_CONFIG, pConfig?.headers, resolveUrl( pUrl, pConfig ), resolveHttpMethod( pMethod, pConfig ) ) ) );
    };

    HttpConfig.prepareConfig = prepareConfig;

    const RequestInitModel =
        {
            "attributionReporting":
                {
                    "required": false,
                    "types": [_obj],
                    "properties": ["eventSourceEligible", "triggerEligible"],
                    "default": null
                },
            "body":
                {
                    "required": false,
                    "types": [_str, "ArrayBuffer", "Blob", "DataView", "File", "FormData", "TypedArray", "URLSearchParams", "ReadableStream"],
                },
            "cache":
                {
                    "required": false,
                    "types": [_str],
                    "allowedValues": ["default", "no-store", "reload", "no-cache", "force-cache", "only-if-cached"]
                },
            "credentials":
                {
                    "required": false,
                    "types": [_str],
                    "allowedValues": ["omit", "same-origin", "include"],
                    "default": "same-origin"
                },
            "headers":
                {
                    "required": false,
                    "types": [_obj],
                    "allowedValues": Object.keys( HttpHeaderDefinition ),
                    "properties": Object.keys( HttpHeaderDefinition )
                },
            "integrity":
                {
                    "required": false,
                    "types": [_str],
                    "default": _mt
                },
            "keepalive":
                {
                    "required": false,
                    "types": [_bool],
                    "default": false
                },
            "method":
                {
                    "required": true,
                    "types": [_str],
                    "allowedValues": VERBS.values(),
                    "default": VERBS.GET
                },
            "mode":
                {
                    "required": false,
                    "types": [_str],
                    "allowedValues": ["cors", "no-cors", "same-origin", "navigate"],
                    "default": "cors"
                },
            "priority":
                {
                    "required": false,
                    "types": [_str],
                    "allowedValues": ["high", "low", "auto"],
                    "default": "auto"
                },
            "redirect":
                {
                    "required": false,
                    "types": [_str],
                    "allowedValues": ["follow", "error", "manual"],
                    "default": "follow"
                },
            "referrer":
                {
                    "required": false,
                    "types": [_str],
                    "default": "about:client"
                },
            "referrerPolicy":
                {
                    "required": false,
                    "types": [_str],
                    "default": _mt
                },
            "signal":
                {
                    "required": false,
                    "types": ["AbortSignal"],
                    "default": null
                }
        };

    const AxiosConfigModel =
        {
            url:
                {
                    "required": false,
                    "types": [_str]
                },
            method:
                {
                    "required": true,
                    "types": [_str],
                    "allowedValues": VERBS.values(),
                    "default": VERBS.GET
                },
            baseURL:
                {
                    "required": false,
                    "types": [_str]
                },
            allowAbsoluteUrls:
                {
                    "required": false,
                    "types": [_bool],
                    "default": true
                },
            headers:
                {
                    "required": false,
                    "types": [_obj],
                    "allowedValues": Object.keys( HttpHeaderDefinition ),
                    "properties": Object.keys( HttpHeaderDefinition )
                },
            params:
                {
                    "required": false,
                    "types": [_obj, "URLSearchParams"],
                },
            data:
                {
                    "required": false,
                    "types": [_str, _obj, "ArrayBuffer", "Blob", "DataView", "File", "FormData", "TypedArray", "URLSearchParams", "ReadableStream"],
                },
            timeout:
                {
                    "required": false,
                    "types": [_num],
                    "default": 0
                },
            withCredentials:
                {
                    "required": false,
                    "types": [_bool],
                    "default": false
                },
            auth:
                {
                    "required": false,
                    "types": [_obj]
                },
            responseType:
                {
                    "required": false,
                    "types": [_str],
                    "allowedValues": ["arraybuffer", "document", "json", "text", "stream", "blob"],
                    "default": "json"
                },
            responseEncoding:
                {
                    "required": false,
                    "types": [_str],
                    "default": "utf8"
                },
            xsrfCookieName:
                {
                    "required": false,
                    "types": [_str],
                    "default": "XSRF-TOKEN"
                },
            xsrfHeaderName:
                {
                    "required": false,
                    "types": [_str],
                    "default": "X-XSRF-TOKEN"
                },
            maxContentLength:
                {
                    "required": false,
                    "types": [_num],
                    "default": 20_000_000
                },
            maxBodyLength:
                {
                    "required": false,
                    "types": [_num],
                    "default": 20_000_000
                },
            maxRedirects:
                {
                    "required": false,
                    "types": [_num],
                    "default": MAX_REDIRECTS
                },
            signal:
                {
                    "required": false,
                    "types": ["AbortSignal"]
                },
            decompress:
                {
                    "required": false,
                    "types": [_bool],
                    "default": true,
                }
        };

    const DEFAULT_PROPERTY_DESCRIPTOR =
        {
            "required": false,
            types: [_str, _bool, _num, _obj]
        };

    class ConfigFactory
    {
        #object = {};
        #options = {};

        #map;
        #literal;

        constructor( pObject, pOptions )
        {
            this.#object = asObject( pObject || {} );
            this.#options = { ...(pOptions || {}) };
        }

        get map()
        {
            if ( isNull( this.#map ) || !isMap( this.#map ) )
            {
                this.#map = asMap( (this.#object || {}), (this.#options || {}) );
            }

            return lock( new Map( this.#map ) );
        }

        get literal()
        {
            if ( isNull( this.#literal ) || !isObject( this.#literal ) )
            {
                this.#literal = isFunction( this.#object?.toLiteral ) ? this.#object.toLiteral() : toObjectLiteral( (this.#object || {}), (this.#options || {}) );
            }
            return lock( { ...(this.#literal || {}) } );
        }

        getConfigValue( pKey )
        {
            let key = asString( pKey, true );

            const map = this.map;

            let value = readProperty( map, key );

            if ( isNull( value ) )
            {
                const o = (this.#object || {});
                value = readProperty( o, key );
            }

            return value || (readProperty( this.literal, key ));
        }

        resolveValue( pDescriptor, pValue, pKey )
        {
            const descriptor = pDescriptor || DEFAULT_PROPERTY_DESCRIPTOR;

            let { required, types, allowed, value } = this.resolveDescriptor( descriptor, pValue, pKey );

            if ( this.isMissingValue( pValue ) )
            {
                return (required) ? this.resolveDefaultValue( descriptor, types ) : null;
            }

            switch ( typeof pValue )
            {
                case _str:
                    value = this.handleStringValue( value, types, allowed, descriptor );
                    break;

                case _obj:
                    if ( $ln( types ) > 0 && !types.includes( _obj ) )
                    {
                        value = null;
                    }
                    else
                    {
                        value = this.handleObjectValue( value, pValue, descriptor, this );
                    }
                    break;

                default:
                    if ( !types.includes( typeof pValue ) )
                    {
                        value = null;
                    }
                    break;
            }

            return value;
        }

        handleObjectValue( pValue, pDescriptor )
        {
            const descriptor = pDescriptor || DEFAULT_PROPERTY_DESCRIPTOR;

            let value = { ...(pValue || {}) };

            const properties = asArray( descriptor?.properties || [] ).filter( e => !(isNull( e ) || isBlank( e )) );

            for( let prop of properties )
            {
                value[prop] = value[prop] ||
                              attempt( () => this.resolveValue( descriptor || DEFAULT_PROPERTY_DESCRIPTOR,
                                                                this.getConfigValue( prop ),
                                                                prop ) );

                if ( this.isMissingValue( value[prop] ) )
                {
                    attempt( () => delete value[prop] );
                }
            }

            return value;
        }

        handleStringValue( pValue, pTypes, pAllowedValues, pDescriptor )
        {
            let value = pValue;

            if ( ($ln( pTypes ) > 0 && !pTypes.includes( _str )) || ($ln( pAllowedValues ) > 0 && !pAllowedValues.map( lcase ).includes( lcase( pValue ) )) )
            {
                value = pDescriptor.default || null;
            }

            return value;
        }

        resolveDefaultValue( pDescriptor, pTypes )
        {
            let descriptor = pDescriptor || DEFAULT_PROPERTY_DESCRIPTOR;
            let types = asArray( pTypes || [] );

            return descriptor.default ||
                   (types.includes( _str ) ?
                    _mt :
                    (types.includes( _bool ) ?
                     false :
                     types.includes( _num ) ?
                     0 :
                         {}));
        }

        isMissingValue( pValue )
        {
            return isNull( pValue ) || (isString( pValue ) && isBlank( pValue ));
        }

        resolveDescriptor( pDescriptor, pValue, pKey )
        {
            const descriptor = pDescriptor || DEFAULT_PROPERTY_DESCRIPTOR;

            const required = descriptor.required;

            let types = asArray( descriptor.types || DEFAULT_PROPERTY_DESCRIPTOR.types ).filter( e => !isNull( e ) ).map( asString );
            let allowed = asArray( descriptor?.allowedValues || [] ).filter( e => !isNull( e ) ).map( asString );

            let value = pValue || this.getConfigValue( pKey );

            return { required, types, allowed, value };
        }

        buildConfig( pModel )
        {
            let config = {};

            const entries = objectEntries( pModel || {} );

            entries.forEach( entry =>
                             {
                                 const key = ObjectEntry.getKey( entry );

                                 const descriptor = ObjectEntry.getValue( entry );

                                 let cfgValue = this.resolveValue( descriptor, this.getConfigValue( key ), key );

                                 if ( !isNull( cfgValue ) )
                                 {
                                     config[key] = cfgValue;
                                 }
                             } );
            return config;
        }

        populateConfig( pConfig, pModel )
        {
            const config = toHttpConfigLiteral( asObject( pConfig ) ) || {};

            const headers = config?.headers || pConfig?.headers;

            const entries = objectEntries( pModel || {} );

            entries.forEach( entry =>
                             {
                                 const key = ObjectEntry.getKey( entry );

                                 const descriptor = ObjectEntry.getValue( entry );

                                 let cfgValue = this.resolveValue( descriptor, this.getConfigValue( key ), key );

                                 if ( !isNull( cfgValue ) )
                                 {
                                     if ( isNull( config[key] ) )
                                     {
                                         attemptSilent( () => config[key] = cfgValue || config[key] );
                                         if ( isNull( config[key] ) && !descriptor?.required )
                                         {
                                             attempt( () => delete config[key] );
                                         }
                                     }
                                     else if ( isNonNullObject( config[key] ) )
                                     {
                                         let cfgObject = isNonNullObject( cfgValue ) ? cfgValue : {};
                                         attemptSilent( () => config[key] = { ...(cfgObject || {}), ...(config[key]) } );
                                     }
                                 }
                             } );
            return config;
        }
    }

    async function prepareFetchConfig( pUrl, pMethod, pConfig, pBody, pParseJson )
    {
        const config = resolveHttpConfig( pConfig );

        const url = cleanUrl( asString( resolveUrl( pUrl, config ), true ), true );

        const method = resolveHttpMethod( pMethod || config?.method );

        let body = await (pBody || config?.data || config?.body || pConfig?.data || pConfig?.body);

        let cfg = await prepareConfig( config, url, method, body, pParseJson );

        cfg = await HttpConfig.toFetchRequestInitOptions( cfg );

        return { url, cfg };
    }

    HttpConfig.prepareRequestConfig = prepareFetchConfig;

    let mod =
        {
            DEFAULT_CONFIG,
            DEFAULT_HTTP_CONFIG,
            DEFAULT_HTTP_DOWNLOAD_CONFIG,
            dependencies:
                {
                    http,
                    https,
                    core,
                    moduleUtils,
                    sleep,
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    datesModule,
                    DateUtils,
                    jsonUtils,
                    entityUtils,
                    BockNamed,
                    httpConstants,
                    HttpStatus,
                    httpHeaders,
                    httpRequestModule,
                    HttpRequest
                },
            classes:
                {
                    HttpAgentConfig,
                    HttpAgentConfigExtended,
                    HttpConfig
                },

            HttpAgentConfig,
            HttpAgentConfigExtended,

            resolveHttpAgent,
            resolveHttpConfig,
            resolveAgentConfig: HttpAgentConfig.resolveAgentConfig,

            createHttpAgent,
            createHttpsAgent,

            httpAgent: HTTP_AGENT,
            httpsAgent: HTTPS_AGENT,

            fixAgents,

            ConfigFactory,
            RequestInitModel,
            AxiosConfigModel,

            resolveUrl,
            resolveBody,

            prepareConfigWithBody,
            prepareConfigWithParams,
            prepareConfig,

            prepareFetchConfig,

            HttpConfig,

            isHttpConfig,
            toHttpConfigLiteral
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
