/**
 * This file defines classes and functions for reading a request from Express
 * and transforming to a canonical format for use by other APIs
 *
 * This module also exposes http-related constants.
 *
 * This module also exposes functions for assigning a unique ID to a request
 * for logging or tracking operations performed in response to receiving that request
 */

const http = require( "http" );
const https = require( "https" );

const constants = require( "./Constants.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );
const objectUtils = require( "./ObjectUtils.cjs" );
const funcUtils = require( "./FunctionUtils.cjs" );

const guidUtils = require( "./GUIDUtils.cjs" );
const httpUtils = require( "./HttpUtils" );

const _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    let _mt_str = constants?._mt_str || "";
    let _comma = constants?._comma || ",";

    let _fun = constants._fun || "function";
    let _obj = constants._obj || "object";
    let _str = constants._str || "string";
    let _bool = constants._bool || "boolean";

    let asString = stringUtils.asString || function( s ) { return (_mt_str + s).trim(); };
    let isBlank = stringUtils.isBlank || function( s ) { return _mt_str === ((_mt_str + s).trim()); };
    let asKey = stringUtils.asKey || asString;

    let lcase = stringUtils.lcase || function( s ) { return asString( s ).toLowerCase(); };
    let ucase = stringUtils.ucase || function( s ) { return asString( s ).toUpperCase(); };

    let toBool = objectUtils.toBool || function( pVal ) { return (_bool === typeof pVal) ? pVal : !isBlank( asString( pVal ) ); };

    let isObject = objectUtils.isObject || function( pObj ) { return _obj === typeof pObj; };
    let IterationCap = objectUtils.IterationCap;

    let isFunction = funcUtils.isFunction || objectUtils.isFunction || function( pObj ) { return _fun === typeof pObj; };
    let isAsyncFunction = funcUtils.isAsyncFunction || objectUtils.isAsyncFunction || function( pObj ) { return _fun === typeof pObj; };

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__REQUEST_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * These constants define the potential values for the cache control header
     */
    const RequestCacheValue = Object.freeze(
        {
            DEFAULT: "default",
            NO_STORE: "no-store",
            RELOAD: "reload",
            NO_CACHE: "no-cache",
            FORCE: "force-cache",
            ONLY_IF: "only-if-cached"
        } );

    /**
     * This constant holds an array of the valid values for the cache-control headers
     *
     */
    const ValidRequestCacheValues = Object.freeze( Object.values( RequestCacheValue ) );

    /**
     * These constants define the headers this module can support and that are supported, in general
     */
    const SupportedHeader = Object.freeze(
        {
            DATE: "Date",

            CONTENT_DISPOSITION: "Content-Disposition",
            CONTENT_LENGTH: "Content-Length",
            CONTENT_TYPE: "Content-Type",

            AGE: "Age",
            CACHE_CONTROL: "Cache-Control",
            EXPIRES: "Expires",
            LAST_MODIFIED: "Last-Modified",
            ETAG: "ETag",

            ACCEPT: "Accept",

            HOST: "Host",
            REFERER: "Referer",
            USER_AGENT: "User-Agent",

            AUTHENTICATE: "WWW-Authenticate",
            AUTHORIZATION: "Authorization",
            PROXY_AUTHENTICATE: "Proxy-Authenticate",
            PROXY_AUTHORIZATION: "Proxy-Authorization",

            IF_MATCH: "If-Match",
            IF_NONE_MATCH: "If-None-Match",
            IF_MODIFIED_SINCE: "If-Modified-Since",
            IF_UNMODIFIED_SINCE: "If-Unmodified-Since",
            VARY: "Vary",

            CONNECTION: "Connection",
            KEEP_ALIVE: "Keep-Alive",

            ACCEPT_ENCODING: "Accept-Encoding",
            ACCEPT_LANGUAGE: "Accept-Language",
            EXPECT: "Expect",
            MAX_FORWARDS: "Max-Forwards",

            COOKIE: "Cookie",
            SET_COOKIE: "Set-Cookie",

            ACL_ALLOW_CREDENTIALS: "Access-Control-Allow-Credentials",
            ACL_ALLOW_HEADERS: "Access-Control-Allow-Headers",
            ACL_ALLOW_METHODS: "Access-Control-Allow-Methods",
            ACL_ALLOW_ORIGIN: "Access-Control-Allow-Origin",
            ACL_EXPOSE_HEADERS: "Access-Control-Expose-Headers",
            ACL_MAX_AGE: "Access-Control-Max-Age",
            ACL_REQ_HEADERS: "Access-Control-Request-Headers",
            ACL_REQ_METHOD: "Access-Control-Request-Method",

            ORIGIN: "Origin",
            TIMING_ALLOW_ORIGIN: "Timing-Allow-Origin",

            CONTENT_ENCODING: "Content-Encoding",
            CONTENT_LANGUAGE: "Content-Language",
            CONTENT_LOCATION: "Content-Location",

            FORWARDED: "Forwarded",
            VIA: "Via",

            LOCATION: "Location",
            REFRESH: "Refresh",

            FROM: "From",
            REFERER_POLICY: "Referrer-Policy",
            ALLOW: "Allow",
            SERVER: "Server",

            COEP: "Cross-Origin-Embedder-Policy",
            COOP: "Cross-Origin-Opener-Policy",
            CORP: "Cross-Origin-Resource-Policy",
            CSP: "Content-Security-Policy",
            CSPRO: "Content-Security-Policy-Report-Only",
            PERMISSION_POLICY: "Permissions-Policy",
            STRICT_TRANSPORT_SECURITY: "Strict-Transport-Security",
            UPGRADE_INSECURE_REQ: "Upgrade-Insecure-Requests",
            UPGRADE: "Upgrade",

            X_CONTENT_TYPE_OPTIONS: "X-Content-Type-Options",
            X_FRAME_OPTIONS: "X-Frame-Options",

            X_POWERED_BY: "X-Powered-By",
            X_XSS_PROTECTION: "X-XSS-Protection",

            REPORT_TO: "Report-To",

            TRANSFER_ENCODING: "Transfer-Encoding",
            TRAILER: "Trailer",

            LINK: "Link",
            RETRY_AFTER: "Retry-After"
        } );

    /**
     *
     * These constants define the supported headers as arrays
     * available in 3 flavors, case-sensitive, lowercase, and upper case
     */
    const supportedHeaders = Object.values( SupportedHeader );
    const validHeadersLowercase = Object.freeze( supportedHeaders.map( arrayUtils.Mappers.TO_LOWERCASE ) );
    const validHeadersUppercase = Object.freeze( supportedHeaders.map( arrayUtils.Mappers.TO_UPPERCASE ) );

    const isSupportedHeader = function( pHeader )
    {
        return supportedHeaders.includes( pHeader ) || validHeadersLowercase.includes( lcase( asString( pHeader ) ) ) || validHeadersUppercase.incudes( ucase( asString( pHeader ) ) );
    };

    class RequestHeaders
    {
        constructor( pData )
        {
            this._map = {};

            this._map["cookies-to-set"] = this._map["cookies-to-set"] || [];

            let entries = [];

            switch ( typeof pData )
            {
                case _obj:

                    if ( pData instanceof this.constructor )
                    {
                        entries = Object.entries( pData?._map ) || [];
                    }
                    else if ( objectUtils.isArray( pData ) )
                    {
                        entries = entries.concat( ...(pData || []) );
                    }
                    else
                    {
                        entries = Object.entries( pData );
                    }
                    break;

                case _str:

                    entries = asString( pData ).split( /,/ );
                    break;

                default:
                    break;
            }

            for( let i = 0, n = entries?.length; i < n; i++ )
            {
                const entry = entries[i];

                const key = asKey( asString( asString( entry?.key ) || entry[0] ) );
                const value = asString( asString( entry?.value ) || (entry?.length > 1 ? entry[1] : key) );

                this._addToMap( key, value );
            }
        }

        _addToMap( pKey, pValue )
        {
            const key = asKey( pKey );

            const upperCaseKey = asString( key ).toUpperCase();

            if ( !(validHeadersUppercase).includes( upperCaseKey ) )
            {
                return {};
            }

            const value = asString( pValue ) || key;

            if ( asString( SupportedHeader.SET_COOKIE ).toUpperCase() === upperCaseKey )
            {
                this._map["cookies-to-set"] = this._map["cookies-to-set"] || [];
                this._map["cookies-to-set"].push( value );
            }

            if ( this._map[key] )
            {
                this._map[key] += (_comma + value);
            }
            else
            {
                this._map[key] = value;
            }

            return { key, value };
        }

        append( pName, pValue )
        {
            return this._addToMap( pName, pValue );
        }

        delete( pName )
        {
            const key = asString( pName );

            if ( validHeadersUppercase.includes( key.toUpperCase() ) )
            {
                try
                {
                    delete this._map[key];
                    delete this._map[key.toUpperCase()];
                    delete this._map[key.toLowerCase()];
                }
                catch( ex )
                {
                    console.error( ex.message );
                }
            }
        }

        entries()
        {
            const map = Object.assign( {}, this._map || {} );
            return Object.freeze( Object.entries( map ) );
        }

        forEach( pCallback, pScope )
        {
            if ( _fun === typeof pCallback )
            {
                const nvPairs = Object.entries( map );

                const me = this;

                const scope = pScope || me;

                for( let i = 0, n = nvPairs?.length; i < n; i++ )
                {
                    const entry = nvPairs[i];
                    const key = asString( entry?.length ? entry[0] : _mt_str );
                    const value = asString( entry?.length > 1 ? entry[1] : key );

                    try
                    {
                        pCallback.apply( scope, [value, key, me] );
                    }
                    catch( ex )
                    {
                        console.error( "An error occurred while executing forEach for the entry, ", entry, key, value, ex.message );
                    }
                }
            }
        }

        get( pName )
        {
            const key = asKey( pName );
            return (_mt_str + (asString( this._map[key] || this._map[key.toLowerCase()] || this._map[key.toUpperCase()] ) || asString( this._map[key.toLowerCase()] ) || asString( this._map[key.toUpperCase()] )));
        }

        getSetCookie()
        {
            return Object.freeze( [].concat( ...(this._map["cookies-to-set"] || []) ) );
        }

        keys()
        {
            const map = Object.assign( {}, this._map || {} );
            return Object.freeze( Object.keys( map ) );
        }

        has( pName )
        {
            const key = asKey( pName );

            const keys = [].concat( this.keys() );

            return keys.includes( key ) || keys.includes( key.toUpperCase() ) || keys.includes( key.toLowerCase() );
        }

        set( pName, pValue )
        {
            try
            {
                this.delete( pName );
            }
            catch( ex )
            {
                console.error( ex.message );
            }

            return this.append( pName, pValue );
        }

        values()
        {
            const map = Object.assign( {}, this._map || {} );
            return Object.freeze( Object.values( map ) );
        }

        toRequestHeaders( pFormat )
        {
            if ( ["json", "axios", "express"].includes( lcase( asString( pFormat ) ) ) )
            {

            }
            else if ( ["name-value", "string", "http"].includes( lcase( asString( pFormat ) ) ) )
            {

            }

        }
    }

    const generateRequestId = function( pRequest )
    {
        return pRequest?.id || pRequest?.requestId || guidUtils.guid();
    };

    const unwrapRequest = function( pRequest )
    {
        let req = pRequest || {};

        if ( isObject( pRequest ) )
        {
            let original = req?.original;

            let request = pRequest || {};

            const iterationCap = new IterationCap( 12 );

            while ( ((request instanceof RequestAdapter) && (null == original || original instanceof RequestAdapter)) && !iterationCap.reached )
            {
                original = request?.original || original;
                request = original;
            }

            req.original = original || req.original;
        }

        return req?.original || pRequest?.original;
    };

    const unwrapRequestBody = function( pRequest )
    {
        let req = pRequest || {};

        let body = null;

        if ( isObject( pRequest ) )
        {
            let original = unwrapRequest( req );

            body = (isAsyncFunction( original?.getBody ) ? body : original?.body);

            if ( null == body && isAsyncFunction( original?.getBody ) )
            {
                (async function()
                {
                    body = await original.getBody();
                    if ( isObject( req ) )
                    {
                        req.__body = body;
                        req._body = body;
                    }
                }());
            }
        }

        return body;
    };


    class RequestContext
    {
        constructor( pRequestId, pOptions )
        {
            this.requestId = pRequestId;
            this.options = Object.assign( {}, pOptions || {} );
        }
    }

    class RequestAdapter
    {
        constructor( pUrl, pOptions )
        {
            const options = Object.assign( {}, pOptions || {} );

            this._options = Object.assign( {}, options || {} );

            this._original = options?.original || unwrapRequest( pUrl || options );

            this.__body = this.__body || unwrapRequestBody( this.original );

            this._body = this._body || unwrapRequestBody( pUrl );

            this._requestId = options?.requestId || options?.id || this.original?.id || this.original?.requestId || generateRequestId( this.original );

            this._id = this._requestId;

            this._url = (_str === typeof pUrl ? pUrl : this.original?.url) || options?.url || this.original?.url || this.original?.path;

            this._server = options?.server || options?.app || this.original?.app;

            this._headers = options?.headers || options?.headers || this.original?.headers;

            this._trailers = options?.trailers;

            this._cookies = options?.cookies || options?.cookies || this.original?.cookies;

            this._signedCookies = options?.signedCookies || options?.signedCookies || this.original?.signedCookies;

            this._bodyUsed = options?.bodyUsed || null != this._body || null != this.__body;

            this._routePath = options?.baseUrl || this.original?.baseUrl || this.url;

            this._protocol = options?.protocol || this.original?.protocol;

            this._secure = options?.secure || this.original?.secure || "https" === this._protocol;

            this._remoteHost = this._ip = options?.remoteHost || options?.ip || this.original?.ip;

            this._path = options?.path || this.original?.path || this.url;

            this._host = this._hostName = options?.host || options?.hostname || this.original?.hostname;

            this._fresh = options?.fresh || this.original?.fresh || this.isFresh();

            this._stale = !this._fresh;

            this._integrity = options?.integrity || _mt_str;

            this._method = options?.method || this.original?.method || "GET";

            this._mode = options?.mode || this.original?.mode || "cors";

            this._redirect = options?.redirect || this.original?.redirect || "follow";

            this._referrer = options?.referrer || this.original?.referrer || (_fun === typeof this.original?.get ? this.original?.get( "referrer" ) : _mt_str);

            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
            this._referrerPolicy = options?.referrerPolicy || this.original.referrerPolicy || (_fun === typeof this.original?.get ? this.original?.get( "Referrer-Policy" ) : _mt_str) || _mt_str;

            this._abortController = options?.abortController || this.original?.abortController || new AbortController();

            this._abortSignal = this._abortController?.signal || options?.signal || this.original?.signal;

            this._abortSignal.controller = this._abortSignal.controller || this._abortController;

            this._IncomingMessage = ((this.original instanceof http.IncomingMessage || this.original.prototype === http.IncomingMessage) ? this.original : Object.create( http.IncomingMessage.prototype ));

            this._complete = options?.complete || this.original?.complete || this._IncomingMessage?.complete;
        }

        get options()
        {
            return Object.freeze( Object.assign( {}, this._options || {} ) );
        }

        get id()
        {
            return this._id || this._options?.requestId;
        }

        set id( pId )
        {
            this._id = asString( pId, true ) || this._id;
        }

        setId( pId )
        {
            this._id = asString( pId, true ) || this._id;
        }

        get requestId()
        {
            return this._requestId || this.id || this.original?.id || this.original?.requestId;
        }

        get url()
        {
            return this._url || this.original?.url;
        }

        get trailers()
        {
            return this._trailers || this.original?.trailers;
        }

        get cookies()
        {
            return this._cookies || this.original?.cookies;
        }

        get signedCookies()
        {
            return this._signedCookies || this.original?.signedCookies;
        }

        get route()
        {
            return this._routePath || this.url;
        }

        get protocol()
        {
            return this._protocol || this.original?.protocol;
        }

        get secure()
        {
            return this._secure || this.original?.secure || "https" === lcase( this.protocol );
        }

        get remoteHost()
        {
            return this._remoteHost || this._ip || this.original?.ip;
        }

        get path()
        {
            return this._path || this.original?.path || this.url;
        }

        isStale()
        {
            return this._stale;
        }

        get integrity()
        {
            return this._integrity;
        }

        get mode()
        {
            return this._mode || this.original?.mode;
        }

        get redirect()
        {
            return this._redirect || this.original?.redirect;
        }

        get referrer()
        {
            return this._referrer || this.original?.referrer;
        }

        get referrerPolicy()
        {
            return this._referrerPolicy || this.original.referrerPolicy || (_fun === typeof this.original?.get ? this.original?.get( "Referrer-Policy" ) : _mt_str) || _mt_str;
        }

        get abortController()
        {
            return this._abortController;
        }

        get abortSignal()
        {
            return this.abortController?.signal || this._abortSignal || this.original?.signal;
        }

        abort( pReason )
        {
            (this.abortController || this.abortSignal?.controller)?.abort( pReason );
        }

        get complete()
        {
            return this._complete || this.original?.complete;
        }

        getPeerCertificate( pDetailed )
        {
            const socket = this._original?.socket || this.IncomingMessage?.socket;

            if ( socket )
            {
                return socket.getPeerCertificate( pDetailed );
            }

            return EMPTY_OBJECT;
        }

        get method()
        {
            return this._method || this.original?.method || "GET";
        }

        get headers()
        {
            return Object.freeze( this._headers || this.original?.headers );
        }

        get requestHeaders()
        {
            this._reqHeaders = this._reqHeaders || new RequestHeaders( this.headers );

            return Object.freeze( this._reqHeaders );
        }

        get original()
        {
            if ( null == this._original || this._original instanceof this.constructor )
            {
                this._original = unwrapRequest( this._original );
            }
            return Object.freeze( this._original );
        }

        get cacheControlHeader()
        {
            return this.original.get( "cache-control" ) || this.requestHeaders.get( "Cache-Control" );
        }

        get credentials()
        {
            return "same-origin";
        }

        get destination()
        {
            return _mt_str;
        }

        isFresh()
        {
            return this._fresh || false;
        }

        get bodyUsed()
        {
            return this._bodyUsed || null != this.__body;
        }

        async getBody()
        {
            if ( this.__body || this._body )
            {
                return this.__body || this._body || this.original?.body;
            }

            try
            {
                this.__body = await this.original?.body;
                this.__body = this.__body || this.original?.body || this.body;

                this._bodyUsed = true;
            }
            catch( ex )
            {
                console.debug( ex.message );

                let body = this.__body || unwrapRequestBody( this.original );

                if ( null == body || body instanceof Promise )
                {
                    let original = this.original;

                    const iterationCap = new objectUtils.IterationCap( 10 );

                    while ( (null == body || body instanceof Promise) && null != original && !iterationCap.reached )
                    {
                        body = original.__body || original.body;

                        original = original.original;
                    }
                }

                if ( !(null == body || body instanceof Promise) )
                {
                    this.__body = this.__body || body;

                    return body;
                }
            }

            return this.__body || (this.bodyUsed ? this.body : {});
        }

        get body()
        {
            if ( this.__body || this._body )
            {
                this._bodyUsed = true;

                return this.__body || this._body;
            }

            if ( this._body )
            {
                this._bodyUsed = true;

                return this._body;
            }

            this.__body = this._body = unwrapRequestBody( this.original );

            if ( null == this._body )
            {
                const me = this;

                (async function()
                {
                    me.__body = me.__body || await me.getBody();
                }());
            }

            let body = this.__body || this._body || unwrapRequestBody( this.original?.original || this.original );

            if ( null == body )
            {
                throw new Error( "Use the async method \"getBody\"" );
            }

            return body || unwrapRequestBody( this.original );
        }

        static safeRequest( pRequest )
        {
            const req = pRequest || {};

            let body = unwrapRequestBody( pRequest ) || req.body;

            if ( isObject( body ) )
            {
                body = this.safeBody( body );
            }

            return {
                host: req.hostName || req.get( "X-Forwarded-Host" ),
                ip: req.ip || req.get( "X-Forwarded-For" ),
                protocol: req.protocol,
                headers: req.headers,
                body: asString( body ),
                complete: toBool( req.complete ),
                trailers: req.trailers,
                method: req.method || "POST",
                url: asString( req.url ),
                originalUrl: asString( req.originalUrl ),
                statusCode: req.statusCode,
                statusMessage: req.statusMessage
            };
        }

        static safeBody( pBody )
        {
            let body = pBody || {};

            // work around poorly formatted xml
            if ( _obj === typeof body )
            {
                if ( isArray( body ) )
                {
                    let values = [];

                    for( let i = 0, n = body?.length; i < n && i < constants.MAX_ITERATIONS; i++ )
                    {
                        values.push( this.safeBody( body[i] ) );
                    }

                    body = values.join( _spc );

                    return asString( body );
                }

                // work around poorly formatted xml
                const keys = Object.keys( body );

                if ( keys.includes( "<?xml version" ) )
                {
                    body = asString( body["<?xml version"] );
                    body = "<?xml version" + "=" + body;
                }
                else
                {
                    for( let key of keys )
                    {
                        if ( key.includes( "<?xml" ) )
                        {
                            body = asString( body[key] );
                            body = key + "=" + body;
                            break;
                        }
                    }
                }
            }

            return asString( body );
        }

        get axiosRequest()
        {
            // TODO
        }

        async arrayBuffer()
        {
            const body = await this.getBody();
            // TODO

            return null;
        }

        async blob()
        {
            const body = await this.getBody();
            // TODO

            return null;
        }

        clone()
        {
            return new RequestAdapter( this.url, this );
        }

        async formData()
        {
            const body = await this.getBody();
            // TODO

            return null;
        }

        async json()
        {
            return await this.getBody();
        }

        async text()
        {
            return await this.getBody();
        }

        asMap()
        {

        }

        toJson()
        {
            return JSON.stringify( this.asMap() );
        }

        toString()
        {
            // return as HTTP document
        }


    }

    RequestAdapter.adaptExpressRequest = function( req, pId )
    {
        const id = stringUtils.asString( pId, true ) || req?.id || _mt_str;

        const url = req.url;

        let options = Object.assign( {}, req );

        options = Object.assign( options,
                                 {
                                     requestId: id || _mt_str,
                                     original: req,
                                     url: req.url,
                                     method: options.method || req.method,
                                     server: req.app,
                                     headers: options.headers || req.headers,
                                     cookies: options.cookies || req.cookies,
                                     signedCookies: options.signedCookies || req.signedCookies,
                                     bodyUsed: false,
                                     baseUrl: options.baseUrl || req.baseUrl,
                                     routePath: options.routePath || req.baseUrl,
                                     protocol: options.protocol || req.protocol,
                                     secure: options.secure || req.secure,
                                     remoteHost: options.remoteHost || options.ip || req.ip,
                                     path: options.path || req.path,
                                     host: options.hostname || req.hostname,
                                     fresh: options.fresh || req.fresh

                                 } );

        const adapter = (req instanceof RequestAdapter) ? req : new RequestAdapter( url, options );

        adapter.__body = adapter._body = req.body;

        return adapter;
    };

    RequestAdapter.asyncAdaptExpressRequest = async function( req, pId )
    {
        const adapter = RequestAdapter.adaptExpressRequest( req, pId );

        adapter.__body = adapter._body = ((await req?.body) || req.__body);
    };

    class RequestReader
    {
        constructor( req, pUniqueId )
        {
            this._original = (req instanceof RequestAdapter) ? req?.original : req;

            const uniqueId = asString( asString( pUniqueId ) || req?.id || req?.requestId || _mt_str );

            this._canonical = RequestAdapter.adaptExpressRequest( req, uniqueId );

            if ( uniqueId )
            {
                this._requestId = asString( uniqueId );
                this._canonical.setId( this._requestId );
            }

            // remains null pending first invocation of the toAxios method
            this._asAxios = null;
        }

        get requestId()
        {
            return this._requestId || this._canonical?.id;
        }

        async readRequest()
        {
            return this._original;
        }

        async adaptRequest()
        {
            return RequestAdapter.adaptExpressRequest( this._original, this._requestId );
        }

        async toCanonical()
        {
            if ( null == this._canonical )
            {
                this._canonical = await this.adaptRequest();
            }
            return this._canonical;
        }

        async toAxios()
        {
            if ( null == this._asAxios )
            {
                // TODO
            }
            return this._asAxios;
        }
    }


    const mod =
        {
            classes:
                {
                    RequestAdapter,
                    RequestReader,
                    RequestContext,
                    ValidRequestCacheValues,
                    RequestCacheValue,
                    SupportedHeader,
                    RequestHeaders
                },
            RequestAdapter,
            RequestReader,
            RequestContext,
            ValidRequestCacheValues,
            RequestCacheValue,
            SupportedHeader,
            supportedHeaders,
            validHeadersLowercase,
            validHeadersUppercase,
            RequestHeaders,
            generateRequestId,
            isSupportedHeader,
            safeBody: function( pBody )
            {
                return RequestAdapter.safeBody( pBody );
            },
            safeRequest: function( pRequest )
            {
                return RequestAdapter.safeRequest( pRequest );
            }
        };

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
