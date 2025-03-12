/**
 * @fileOverview
 * This module defines a facade for the Web API Headers object<br>
 * intended to encapsulate and hide the differences
 * between the way Node.js, Deno, browsers, and other execution environments model HTTP Headers.<br>
 * <br>
 *
 * @module HttpRequest
 *
 * @author Scott Bockelman
 * @license MIT
 */

/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

// import Buffer-support
const bufferUtils = require( "@toolbocks/buffer" );

// import the HTTP constants
const httpConstants = require( "./HttpConstants.cjs" );

//import the HttpHeaders utilities
const httpHeaders = require( "./HttpHeaders.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS,OverlyComplexFunctionJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_REQUEST__";

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
            bufferUtils,
            httpConstants,
            httpHeaders
        };

    const {
        ToolBocksModule,
        populateOptions,
        lock,
        localCopy,
        attempt
    } = moduleUtils;

    const {
        _mt_str,
        _spc,
        _slash,
        _dot,
        _ampersand,
        _equals,
    } = constants;

    const
        {
            isNull,
            isString,
            isObject,
            isNonNullObject,
            isArray,
            isMap,
            isFunction,
            isTypedArray,
            isArrayBuffer,
            isSharedArrayBuffer,
            isDataView,
        } = typeUtils;


    const { asString, asInt, isBlank, startsWithAny } = stringUtils;

    const { asArray } = arrayUtils;

    const {
        VERBS,
        MODES,
        PRIORITY,
        HttpVerb,
        HttpContentType,
        HttpStatus,
        HttpHeader,
        isHeader
    } = httpConstants;

    const { HttpRequestHeaders } = httpHeaders;

    const {
        TextEncoder = (_ud === typeof TextDecoder) ? $scope().TextEncoder : TextEncoder,
        TextDecoder = (_ud === typeof TextDecoder) ? $scope().TextDecoder : TextDecoder,
        File = (_ud === typeof File) ? $scope().File : File,
        Blob = (_ud === typeof Blob) ? $scope().Blob : Blob,
        BlobOptions = (_ud === typeof BlobOptions) ? $scope().BlobOptions : BlobOptions,
        FileOptions = (_ud === typeof FileOptions) ? $scope().FileOptions : FileOptions,
        isAscii = $scope().isAscii,
        isUtf8 = $scope().isUtf8,
        SlowBuffer = (_ud === typeof SlowBuffer) ? $scope().SlowBuffer : SlowBuffer,
        transcode = (_ud === typeof transcode) ? $scope().transcode : transcode,
        TranscodeEncoding = (_ud === typeof TranscodeEncoding) ? $scope().TranscodeEncoding : TranscodeEncoding,
        arrayFromBuffer,
        typedArrayFromBuffer,
        isBlob = typeUtils.isBlob,
        isFile = typeUtils.isFile,
    } = bufferUtils;

    const modName = "HttpRequest";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );


    const executionEnvironment = toolBocksModule.executionEnvironment;

    const _isNode = executionEnvironment.isNode();
    const _isDeno = executionEnvironment.isDeno();
    const _isBrowser = executionEnvironment.isBrowser();

    /*
     interface ReadableStream<R = any> {
     readonly locked: boolean;
     cancel(reason?: any): Promise<void>;
     getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
     getReader(): ReadableStreamDefaultReader<R>;
     getReader(options?: ReadableStreamGetReaderOptions): ReadableStreamReader<R>;
     pipeThrough<T>(transform: ReadableWritablePair<T, R>, options?: StreamPipeOptions): ReadableStream<T>;
     pipeTo(destination: WritableStream<R>, options?: StreamPipeOptions): Promise<void>;
     tee(): [ReadableStream<R>, ReadableStream<R>];
     values(options?: { preventCancel?: boolean }): AsyncIterableIterator<R>;
     [Symbol.asyncIterator](): AsyncIterableIterator<R>;
     }
     const ReadableStream: {
     prototype: ReadableStream;
     from<T>(iterable: Iterable<T> | AsyncIterable<T>): ReadableStream<T>;
     new(underlyingSource: UnderlyingByteSource, strategy?: QueuingStrategy<Uint8Array>): ReadableStream<Uint8Array>;
     new<R = any>(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>;
     };

     ReadableStreamDefaultReader.read()
     Returns a promise providing access to the next chunk in the stream's internal queue.


     interface ReadableStream extends EventEmitter {
     readable: boolean;
     read(size?: number): string | Buffer;
     setEncoding(encoding: BufferEncoding): this;
     pause(): this;
     resume(): this;
     isPaused(): boolean;
     pipe<T extends WritableStream>(destination: T, options?: { end?: boolean | undefined }): T;
     unpipe(destination?: WritableStream): this;
     unshift(chunk: string | Uint8Array, encoding?: BufferEncoding): void;
     wrap(oldStream: ReadableStream): this;
     [Symbol.asyncIterator](): AsyncIterableIterator<string | Buffer>;
     }



     */


    if ( _ud === typeof ReadableStream )
    {
        ReadableStream = $scope().ReadableStream || bufferUtils?.ReadableStream || (_isNode && isFunction( require ) ? require( "stream" ).Readable : null);
    }

    const DEFAULT_EXPIRATION_HEADER = "x-expiration-timestamp";

    const FORBIDDEN_REQUEST_HEADER_NAMES =
        [
            "Accept-Charset",
            "Accept-Encoding",
            "Access-Control-Request-Headers",
            "Access-Control-Request-Method",
            "Connection",
            "Content-Length",
            "Cookie",
            "Cookie2",
            "Date",
            "DNT",
            "Expect",
            "Host",
            "Keep-Alive",
            "Origin",
            "Referer",
            "Set-Cookie",
            "TE",
            "Trailer",
            "Transfer-Encoding",
            "Upgrade",
            "Via",
            "Sec-",
            "Proxy-",
            "X-HTTP-Method",
            "X-HTTP-Method-Override",
            "X-Method-Override"
        ];

    const FORBIDDEN_RESPONSE_HEADER_NAMES = ["Set-Cookie", "Set-Cookie2"];

    const FORBIDDEN_REQUEST_HEADERS = lock( [...FORBIDDEN_REQUEST_HEADER_NAMES, ...(FORBIDDEN_REQUEST_HEADER_NAMES.map( e => e.toLowerCase() ))] );
    const FORBIDDEN_RESPONSE_HEADERS = lock( [...FORBIDDEN_RESPONSE_HEADER_NAMES, ...(FORBIDDEN_RESPONSE_HEADER_NAMES.map( e => e.toLowerCase() ))] );

    let MIME_TYPES_BY_EXTENSION = new Map();

    MIME_TYPES_BY_EXTENSION.set( ".css", "text/css" );
    MIME_TYPES_BY_EXTENSION.set( ".js", "text/javascript" );
    MIME_TYPES_BY_EXTENSION.set( ".min.js", "text/javascript" );
    MIME_TYPES_BY_EXTENSION.set( ".html", "text/html" );
    MIME_TYPES_BY_EXTENSION.set( ".jpg", "image/jpeg" );
    MIME_TYPES_BY_EXTENSION.set( ".json", "application/json" );

    MIME_TYPES_BY_EXTENSION = lock( MIME_TYPES_BY_EXTENSION );

    const URL_COMPONENTS = lock(
        {
            PROTOCOL: "protocol",
            HOST: "host",
            HOST_NAME: "hostname",
            PORT: "port",
            ORIGIN: "origin",
            PATH: "href",
            HREF: "href",
            PATH_NAME: "pathname",
            SEARCH: "search",
            SEARCH_PARAMS: "searchParams",
            QUERY_STRING: "search",
            QUERY_PARAMS: "searchParams",
            HASH: "hash",
            USERNAME: "username",
            PASSWORD: "password"
        } );

    const VALID_URL_COMPONENTS = lock( Object.values( URL_COMPONENTS ) );

    if ( _ud === typeof document )
    {
        document = (_ud !== typeof window) ? window?.document : (_ud !== typeof __dirname ? { URL: __dirname } : { URL: _mt_str });
    }

    const URL_ENCODINGS = lock(
        {
            ":": "%3A",
            "/": "%2F",
            "?": "%3F",
            "#": "%23",
            "[": "%5B",
            "]": "%5D",
            "@": "%40",
            "!": "%21",
            "$": "%24",
            "&": "%26",
            "'": "%27",
            "(": "%28",
            ")": "%29",
            "*": "%2A",
            "+": "%2B",
            ",": "%2C",
            ";": "%3B",
            "=": "%3D",
            "%": "%25",
            " ": "+"
        } );

    let FORM_ENCODINGS = localCopy( URL_ENCODINGS );
    FORM_ENCODINGS[" "] = "%20";
    FORM_ENCODINGS = lock( FORM_ENCODINGS );

    const urlEncode = ( pString ) =>
    {
        let s = asString( pString, true );
        URL_ENCODINGS.entries().forEach( ( [k, v] ) => s = s.replaceAll( k, v ) );
        return asString( s, true );
    };

    const formEncode = ( pString ) =>
    {
        let s = asString( pString, true );
        FORM_ENCODINGS.entries().forEach( ( [k, v] ) => s = s.replaceAll( k, v ) );
    };

    const urlDecode = ( pString ) =>
    {
        let s = asString( pString, true );
        URL_ENCODINGS.entries().forEach( ( [k, v] ) => s = s.replaceAll( v, k ) );
        s = s.replaceAll( "%20", _spc );
        return asString( s, true );
    };

    const formDecode = ( pString ) =>
    {
        let s = asString( pString, true );
        FORM_ENCODINGS.entries().forEach( ( [k, v] ) => s = s.replaceAll( v, k ) );
        s = s.replaceAll( "+", _spc );
        return asString( s, true );
    };

    const rxUrl = /((?<protocol>\w+):\/\/\/?)?((?<username>[^:@\s]+):(?<password>[^@\s]+)@)?(?<host>[^\/:]+)(:(?<port>(\d+)))?(\/(?<path>[^?#]+))?(?:\?(?<queryString>[^#]*))?(?:#(?<hash>[^#]*))?/;

    const isUrl = ( pUrl ) => (_ud !== typeof URL && isFunction( URL ) && pUrl instanceof URL) || (isString( pUrl ) && rxUrl.test( pUrl ));

    /**
     * Returns the base url (minus any queryString or location hash)
     * @param pFrom - (optional) url text on which to operate; if not specified, uses document.URL property in scope
     */
    const calculateBaseUrl = function( pFrom )
    {
        const s = asString( pFrom || document.URL || _mt_str, true ).replaceAll( /[\s ]/gi, "+" ).replaceAll( /\\/gi, "/" );
        return asString( s.replace( /\?\w+$/, _mt_str ).replace( /#\w+$/, _mt_str ), true );
    };

    /**
     * Returns the query string portion of a url or the empty string there is no query string
     * @param pUrl - url text on which to operate; if not specified, uses document.URL property in scope
     */
    const getQueryString = function( pUrl )
    {
        const url = asString( asString( pUrl || document.URL || _mt_str, true ).replaceAll( /[\s ]/gi, "+" ).replaceAll( /\\/gi, "/" ), true );
        return asString( url.includes( "?" ) ? url.replace( /^[^?]+\??/, _mt_str ) : _mt_str, true );
    };

    /**
     * Returns the location hash string portion of a url or the empty string there is no location hash
     * @param pUrl - url text on which to operate; if not specified, uses document.URL property in scope
     */
    const getHash = function( pUrl )
    {
        const url = asString( asString( pUrl || document.URL || _mt_str, true ).replaceAll( /[\s ]/gi, "+" ).replaceAll( /\\/gi, "/" ), true );
        return asString( url.includes( "#" ) ? url.replace( /^[^#]+#?/, _mt_str ) : _mt_str, true );
    };

    /**
     * Replaces spaces with + and backslashes with forward slashes to form a valid url
     * @param pUrl - the url text to transform
     */
    const escapeUrl = function( pUrl )
    {
        const url = asString( pUrl, true ).replaceAll( /[\s ]/gi, "+" ).replaceAll( /\\/gi, "/" );

        const base = calculateBaseUrl( url ).replaceAll( /\\/gi, "/" );
        const qs = getQueryString( url );
        const hash = getHash( url );

        return base + (qs ? "?" + qs : _mt_str) + (hash ? "#" + hash : _mt_str);
    };

    /**
     * Returns a map of queryString name/value pairs.<br>
     * <br>
     * The values in the map are arrays of strings
     * to support queryStrings that contain the same parameter name more than once.<br>
     * <br>
     *
     * @param pString
     * @returns {Map<string,Array.<string>>} A Map of queryString name/value pairs
     */
    function parseQueryString( pString )
    {
        const map = new Map();

        if ( !isBlank( pString ) )
        {
            let qs = asString( pString, true );
            qs = ((qs.includes( "?" ) ? getQueryString( qs ) : qs).trim()).replaceAll( /^\?/, _mt_str );

            const args = qs.split( _ampersand );

            for( let arg of args )
            {
                const nv = arg.split( _equals );

                const name = nv.length > 0 ? nv[0] : _mt_str;
                const value = nv.length > 1 ? nv[1] : _mt_str;

                const entry = map.get( name );

                const flatArray = asArray( value ).flat();

                if ( entry )
                {
                    entry.push( ...flatArray );
                }
                else
                {
                    map.set( name, flatArray );
                }
            }
        }
        return map;
    }

    const isAbsoluteUrl = function( pUrl )
    {
        const url = escapeUrl( asString( pUrl, true ) );
        return (/^(https?|ftps?|file):\/\//.test( url ) || /^(\w+\.)+/.test( url )) && !url.startsWith( _dot );
    };

    const isRelativeUrl = function( pUrl )
    {
        const url = escapeUrl( asString( pUrl, true ) );
        return (startsWithAny( url, _slash, _dot ) || /(^\/?[^.]+\/?)/.test( url )) && !isAbsoluteUrl( url );
    };

    /**
     * Returns the canonical form of a URL, resolving it against a base URL to produce an absolute url
     *
     * @param pUrl - url to transform to absolute url
     * @param pBase - url to use to resolve relative urls
     */
    const toAbsoluteURL = function( pUrl, pBase )
    {
        let url = escapeUrl( pUrl );

        if ( isRelativeUrl( url ) )
        {
            let base = calculateBaseUrl( pBase ).replaceAll( /\\/gi, "/" );

            const dirs = base.split( "/" );

            while ( url.startsWith( "../" ) && !isBlank( base ) && dirs.length > 0 )
            {
                url = url.slice( 3 );
                base = base.replace( new RegExp( dirs.pop() + "\\/?$" ), _mt_str );
            }

            url = asString( (base || calculateBaseUrl()) + "/" + url );
        }

        return asString( url, true );
    };

    class SearchParams extends Map
    {
        constructor( pParams )
        {
            super();

            if ( isString( pParams ) && !isBlank( pParams ) )
            {
                let qs = getQueryString( asString( pParams, true ) ) || asString( pParams, true ).replaceAll( /^\?/, _mt_str );

                const map = parseQueryString( qs );

                for( const [key, value] of map.entries() )
                {
                    this.append( key, value );
                }
            }

            if ( isNonNullObject( pParams ) )
            {
                const entries = isFunction( pParams?.entries ) ? pParams.entries() : Object.entries( pParams );

                for( const [key, value] of entries )
                {
                    this.append( key, value );
                }
            }
        }

        append( pName, pValue )
        {
            const name = asString( pName, true );

            const value = isArray( pValue ) ? [...pValue] : [asString( pValue )];

            const existing = super.get( name );

            const flatArray = asArray( value ).flat().map( e => urlDecode( asString( e, true ) ) );

            if ( existing )
            {
                existing.push( ...flatArray );
            }
            else
            {
                super.set( name, flatArray );
            }
        }

        entries()
        {
            const entries = super.entries();

            let arr = [];

            for( const entry of entries )
            {
                let key = asString( entry[0], true );

                let value = entry[1];

                if ( isArray( value ) )
                {
                    for( let v of value )
                    {
                        arr.push( [key, v] );
                    }
                }
                else
                {
                    arr.push( [key, value] );
                }
            }

            return [...arr];
        }

        forEach( pCallback, pThis )
        {
            this.entries().forEach( e => pCallback.call( (pThis || this), e ) );
        }

        get( pName )
        {
            const values = asArray( super.get( asString( pName, true ) ) );
            return (values && values.length > 0) ? values[0] : null;
        }

        getAll( pName )
        {
            const values = asArray( super.get( asString( pName, true ) ) ).flat();
            return [...values];
        }

        has( pName, pValue )
        {
            if ( isNull( pValue ) )
            {
                return super.has( pName );
            }

            const values = asArray( super.get( pName ) );

            return (values && values.length > 0) ? values.includes( pValue ) : false;
        }

        set( pName, pValue )
        {
            if ( !isBlank( pName ) )
            {
                const value = !(_ud === typeof pValue || null === pValue) ? asArray( pValue ).flat().map( e => urlDecode( asString( e, true ) ) ) : [];
                super.set( urlDecode( asString( pName, true ) ), asArray( value ) );
            }
        }

        sort()
        {
            const temp = new Map();

            let keys = [...asArray( this.keys() )];

            keys = keys.sort();

            for( let key of keys )
            {
                const values = asArray( this.getAll( key ) );
                temp.set( key, values );
            }

            this.clear();

            for( const [key, values] of temp.entries() )
            {
                this.set( key, values );
            }

            return temp;
        }

        toString()
        {
            const entries = this.entries();

            let str = _mt_str;

            for( const entry of entries )
            {
                const key = asString( entry[0], true );
                const value = asString( entry[1], true );

                str += (str ? _ampersand : _mt_str) + urlEncode( key ) + _equals + urlEncode( value );
            }
        }
    }

    class HttpUrl
    {
        #url;

        #protocol;
        #host;
        #hostname;
        #port;
        #origin;
        #username;
        #password;
        #pathname;
        #search;
        #searchParams;
        #hash;
        #href;

        constructor( pUrl )
        {
            this.#url = pUrl;

            const parsed = HttpUrl.parse( pUrl );

            this.#protocol = parsed.protocol;
            this.#host = parsed.host;
            this.#hostname = parsed.hostname;
            this.#port = parsed.port;
            this.#origin = parsed.origin;
            this.#username = parsed.username;
            this.#password = parsed.password;
            this.#pathname = parsed.pathname;
            this.#search = parsed.search;
            this.#hash = parsed.hash;
            this.#href = parsed.href;
        }


        get url()
        {
            return !isNull( this.#url ) ? isObject( this.#url ) ? this.#url : this : new HttpUrl( this.#href );
        }

        get protocol()
        {
            return asString( this.#protocol, true );
        }

        get host()
        {
            return asString( this.#host, true ) || _mt_str;
        }

        get hostname()
        {
            return asString( this.#hostname, true ) || this.host.split( ":" )[0] || _mt_str;
        }

        get port()
        {
            return asInt( this.#port ) || (this.protocol === "https" ? 443 : (this.protocol === "ftp" ? 21 : 80));
        }

        get origin()
        {
            return asString( this.#origin, true ) || this.protocol + "://" + this.host;
        }

        get username()
        {
            return asString( this.#username, true ) || _mt_str;
        }

        get password()
        {
            return asString( this.#password, true ) || _mt_str;
        }

        get pathname()
        {
            return asString( this.#pathname, true ) || _mt_str;
        }

        get search()
        {
            const qs = (asString( this.#search, true ) || _mt_str).replace( /^\?/, _mt_str );
            return !isBlank( qs ) ? ("?" + qs) : _mt_str;
        }

        get searchParams()
        {
            if ( isNonNullObject( this.#searchParams ) || this.#searchParams instanceof SearchParams )
            {
                return this.#searchParams;
            }
            this.#searchParams = new SearchParams( parseQueryString( this.search.replace( /^\?/, _mt_str ) ) );

            return this.#searchParams;
        }

        get hash()
        {
            let s = urlDecode( (asString( this.#hash, true ) || _mt_str).replace( /^#/, _mt_str ) );
            return !isBlank( s ) ? ("#" + s) : _mt_str;
        }

        get href()
        {
            return asString( this.#href || this.#url, true );
        }
    }

    HttpUrl.parse = function( url, baseUrl )
    {
        if ( !isUrl( url ) )
        {
            return {};
        }

        if ( isObject( url ) )
        {
            return url;
        }

        if ( isString( url ) )
        {
            const absoluteUrl = toAbsoluteURL( url, baseUrl );
            if ( typeof URL !== _ud )
            {
                return URL.parse( absoluteUrl );
            }

            const matches = absoluteUrl.match( rxUrl );
            if ( matches && matches.groups )
            {
                return parseUrlMatches( matches.groups, absoluteUrl );
            }
        }
        return {};
    };

    const PROTOCOL_PORTS =
        {
            http: 80,
            https: 443,
            ftp: 21,
            default: 80
        };

    function parseUrlMatches( pGroups, pFullUrl )
    {
        const {
            protocol = _mt_str,
            username = _mt_str,
            password = _mt_str,
            host,
            domain,
            port,
            path,
            queryString,
            hash
        } = pGroups;

        const resolvedPort = determinePort( protocol, port );
        const completeHost = host + (resolvedPort ? `:${resolvedPort}` : "");

        return {
            protocol,
            username,
            password,
            host: completeHost,
            hostname: host,
            origin: protocol + "://" + host,
            domain: domain || host,
            port: resolvedPort,
            path: path || _mt_str,
            pathname: path || _mt_str,
            queryString: queryString || _mt_str,
            hash: hash || _mt_str,
            href: pFullUrl,
            search: queryString || _mt_str
        };
    }

    function determinePort( pProtocol, pPort )
    {
        return pPort ? parseInt( pPort, 10 ) : PROTOCOL_PORTS[asString( pProtocol, true )] || PROTOCOL_PORTS.default;
    }

    const REQUEST_CACHE_OPTIONS = lock(
        {
            DEFAULT: "default",
            NO_STORE: "no-store",
            RELOAD: "reload",
            NO_CACHE: "no-cache",
            FORCE_CACHE: "force-cache",
            ONLY_IF_CACHED: "only-if-cached"
        } );

    const VALID_REQUEST_CACHE_OPTIONS = lock( Object.values( REQUEST_CACHE_OPTIONS ) );

    const REQUEST_CREDENTIALS_OPTIONS = lock(
        {
            OMIT: "omit",
            SAME_ORIGIN: "same-origin",
            INCLUDE: "include"
        } );

    const VALID_REQUEST_CREDENTIALS_OPTIONS = lock( Object.values( REQUEST_CREDENTIALS_OPTIONS ) );

    const REDIRECT_OPTIONS = lock(
        {
            FOLLOW: "follow",
            ERROR: "error",
            MANUAL: "manual"
        } );

    const VALID_REDIRECT_OPTIONS = lock( Object.values( REDIRECT_OPTIONS ) );

    const REFERRER_POLICY_OPTIONS = lock(
        {
            NO_REFERRER: "no-referrer",
            NO_REFERRER_WHEN_DOWNGRADE: "no-referrer-when-downgrade",
            SAME_ORIGIN: "same-origin",
            ORIGIN: "origin",
            STRICT_ORIGIN: "strict-origin",
            ORIGIN_WHEN_CROSS_ORIGIN: "origin-when-cross-origin",
            STRICT_ORIGIN_WHEN_CROSS_ORIGIN: "strict-origin-when-cross-origin",
            UNSAFE_URL: "unsafe-url"
        } );

    const isFormData = ( pValue ) => (_ud !== typeof FormData && pValue instanceof FormData);
    const isURLSearchParams = ( pValue ) => (_ud !== typeof URLSearchParams && pValue instanceof URLSearchParams);
    const isReadableStream = ( pValue ) => (_ud !== typeof ReadableStream && pValue instanceof ReadableStream);

    const REQUEST_BODY_TYPES = lock(
        {
            STRING: String,
            ARRAY_BUFFER: ArrayBuffer,
            BLOB: Blob,
            DATA_VIEW: DataView,
            FILE: File,
            FORM_DATA: FormData,
            TYPED_ARRAY: Uint8Array,
            URL_SEARCH_PARAMS: (_ud === typeof URLSearchParams) ? SearchParams : URLSearchParams,
            READABLE_STREAM: (_ud === typeof ReadableStream) ? null : ReadableStream
        } );

    function processBodyAsString( pBody )
    {
        return undefined;
    }

    const processRequestBody = function( pBody, pType )
    {
        if ( isString( pBody ) )
        {
            return processBodyAsString( pBody );
        }

    };

    class HttpRequestOptions
    {
        #body;

        #bodyAsTypedArray;
        #bodyAsArrayBuffer;

        #cache;
        #credentials;
        #headers;
        #integrity;
        #keepalive;
        #method;
        #mode;
        #priority;
        #redirect;
        #referrer;
        #referrerPolicy;
        #abortController;
        #signal;
        #timeout;

        constructor( pBody = _mt_str,
                     pCache = REQUEST_CACHE_OPTIONS.DEFAULT,
                     pCredentials = REQUEST_CREDENTIALS_OPTIONS.SAME_ORIGIN,
                     pHeaders = new HttpRequestHeaders(),
                     pIntegrity = _mt_str,
                     pKeepalive = false,
                     pMethod = VERBS.GET,
                     pMode = MODES.SAME_ORIGIN,
                     pPriority = PRIORITY.AUTO,
                     pRedirect = REDIRECT_OPTIONS.FOLLOW,
                     pReferrer = "about:client",
                     pReferrerPolicy = REFERRER_POLICY_OPTIONS.NO_REFERRER_WHEN_DOWNGRADE,
                     pSignal = null,
                     pTimeout = -1 )
        {
            this.#method = pMethod;
            this.#headers = pHeaders;

            this.#cache = pCache;

            this.#credentials = pCredentials;
            this.#integrity = pIntegrity;
            this.#keepalive = pKeepalive;
            this.#mode = pMode;
            this.#priority = pPriority;
            this.#redirect = pRedirect;
            this.#referrer = pReferrer;
            this.#referrerPolicy = pReferrerPolicy;
            this.#signal = pSignal;
            this.#timeout = pTimeout;

            this.#body = (((new HttpVerb( this.#method )).forbidBody()) ? null : pBody); //////
        }

        get body()
        {
            return this.#body;
        }

        get cache()
        {
            return this.#cache;
        }

        get credentials()
        {
            return this.#credentials;
        }

        get headers()
        {
            return this.#headers;
        }

        get integrity()
        {
            return this.#integrity;
        }

        get keepalive()
        {
            return this.#keepalive;
        }

        get method()
        {
            return this.#method;
        }

        get mode()
        {
            return this.#mode;
        }

        get priority()
        {
            return this.#priority;
        }

        get redirect()
        {
            return this.#redirect;
        }

        get referrer()
        {
            return this.#referrer;
        }

        get referrerPolicy()
        {
            return this.#referrerPolicy;
        }

        get abortController()
        {
            this.#abortController = (!isNull( this.#abortController &&
                                              this.#abortController instanceof AbortController ) ?
                                     this.#abortController :
                                     new AbortController());

            return this.#abortController;
        }

        get signal()
        {
            return !isNull( this.#signal ) ? this.#signal : this.abortController.signal;
        }

        get timeout()
        {
            const timer = asInt( this.#timeout, -1 );

            if ( timer > 0 )
            {
                this.#signal = AbortSignal.any( [this.signal, AbortSignal.timeout( timer )] );
            }

            return timer;
        }

        set timeout( pTimeout )
        {
            this.#timeout = asInt( pTimeout, -1 );

            if ( this.#timeout > 0 )
            {
                // called for the side effect of setting up the abort controller / signal
                this.#timeout = this.timeout;
            }
        }
    }

    HttpRequestOptions.fromOptions = function( pOptions )
    {
        const options = populateOptions( pOptions, new HttpRequestOptions() );

        return new HttpRequestOptions( options.body,
                                       options.cache,
                                       options.credentials,
                                       options.headers,
                                       options.integrity,
                                       options.keepalive,
                                       options.method,
                                       options.mode,
                                       options.priority,
                                       options.redirect,
                                       options.referrer,
                                       options.referrerPolicy,
                                       options.signal,
                                       options.timeout );
    };

    class HttpRequest
    {

    }


    let mod =
        {
            dependencies,
            classes:
                {
                    HttpUrl,
                    SearchParams,
                    HttpRequestOptions,
                    HttpRequest,
                    HttpRequestHeaders,
                    HttpVerb,
                    HttpHeader,
                    HttpContentType,
                    HttpStatus,
                },
            URL_COMPONENTS,
            VALID_URL_COMPONENTS,
            MIME_TYPES_BY_EXTENSION,
            REQUEST_CACHE_OPTIONS,
            VALID_REQUEST_CACHE_OPTIONS,
            REDIRECT_OPTIONS,
            VALID_REDIRECT_OPTIONS,
            REQUEST_CREDENTIALS_OPTIONS,
            VALID_REQUEST_CREDENTIALS_OPTIONS,
            FORBIDDEN_REQUEST_HEADERS,
            FORBIDDEN_RESPONSE_HEADERS,
            DEFAULT_EXPIRATION_HEADER,
            REQUEST_BODY_TYPES,
            isUrl,
            isAbsoluteUrl,
            isRelativeUrl,
            toAbsoluteURL,
            escapeUrl,
            parseQueryString,
            urlDecode,
            urlEncode,
            formDecode,
            formEncode,
            isFormData,
            isURLSearchParams,
            isReadableStream,

            HttpUrl,
            SearchParams,
            HttpRequestOptions,
            HttpRequest,
            HttpRequestHeaders,
            HttpVerb,
            HttpHeader,
            HttpContentType,
            HttpStatus,
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
