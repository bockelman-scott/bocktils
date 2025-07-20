/**
 * @fileOverview
 * This module defines a facade for the Web API Request object<br>
 * intended to encapsulate and hide the differences
 * between the way Node.js, Deno, browsers, and other execution environments model an HTTP Request.<br>
 * <br>
 *
 * This facade also allows assigning an ID, a priority, and rate-limit group
 * to each request to help control the order in which requests are handled,
 * any queuing or waiting related to API rate limits,
 * and/or the ability to choose to ignore responses
 * to superseded requests that may occur in response to repeated events
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

const jsonUtils = require( "@toolbocks/json" );

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
        ObjectEntry,
        objectEntries,
        populateOptions,
        lock,
        localCopy,
        attempt,
        asyncAttempt
    } = moduleUtils;

    const {
        _str,
        _obj,
        _fun,
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
            isError,
            isArray,
            isMap,
            isFunction,
            isTypedArray,
            isArrayBuffer,
            isSharedArrayBuffer,
            isDataView,
            toObjectLiteral,
        } = typeUtils;


    const { asString, asInt, isBlank, isJson, startsWithAny, cleanUrl } = stringUtils;

    const { asArray } = arrayUtils;

    const { parseJson } = jsonUtils;

    const {
        VERBS,
        MODES,
        PRIORITY,
        HttpVerb,
        HttpContentType,
        HttpStatus,
        HttpHeaderDefinition,
        isHeader,
        resolveHttpMethod
    } = httpConstants;

    const
        {
            FORBIDDEN_REQUEST_HEADER_NAMES,
            FORBIDDEN_RESPONSE_HEADER_NAMES,
            FORBIDDEN_REQUEST_HEADERS,
            FORBIDDEN_RESPONSE_HEADERS,
            DEFAULT_EXPIRATION_HEADER,
            HttpRequestHeaders
        } = httpHeaders;

    const {
        File = (_ud === typeof File) ? $scope().File : File,
        Blob = (_ud === typeof Blob) ? $scope().Blob : Blob
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
        ReadableStream = attempt( () => $scope().ReadableStream || bufferUtils?.ReadableStream || (_isNode && isFunction( require ) ? require( "stream" ).Readable : null) );
    }

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
        const doc = (_ud === typeof document) ? { URL: __dirname } : document;
        const s = asString( pFrom || doc.URL || _mt_str, true ).replaceAll( /[\s ]/gi, "+" ).replaceAll( /\\/gi, "/" );
        return asString( s.replace( /\?\w+$/, _mt_str ).replace( /#\w+$/, _mt_str ), true );
    };

    /**
     * Returns the query string portion of a url or the empty string if there is no query string
     * @param pUrl - url text on which to operate; if not specified, uses document.URL property in scope
     */
    const getQueryString = function( pUrl )
    {
        const doc = (_ud === typeof document) ? { URL: __dirname } : document;

        const url = asString( asString( pUrl || doc.URL || _mt_str, true ).replaceAll( /[\s ]/gi, "+" ).replaceAll( /\\/gi, "/" ), true );

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
                    map.set( name, entry );
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

            const dirs = base.split( "/" ).filter( e => !isBlank( e ) && !(_dot === asString( e, true )) );

            while ( url.startsWith( "../" ) && !isBlank( base ) && dirs.length > 0 )
            {
                url = url.slice( 3 );
                base = base.replace( new RegExp( dirs.pop() + "\\/?$" ), _mt_str );
            }

            url = cleanUrl( asString( (base || calculateBaseUrl()) + "/" + url ) );
        }

        return asString( url, true );
    };

    /**
     * Provides the same interface and behavior as the URL object.
     * If URL is undefined in the execution context,
     * this object will be assigned to the global namespace as URL
     */
    class SearchParams extends Map
    {
        constructor( pParams )
        {
            super( pParams );

            if ( isString( pParams ) && !isBlank( pParams ) )
            {
                let qs = getQueryString( asString( pParams, true ) ) || asString( pParams, true ).replaceAll( /^\?/, _mt_str );

                const map = parseQueryString( qs );

                for( const [key, value] of map.entries() )
                {
                    this.append( key, value );
                }
            }
            else if ( isNonNullObject( pParams ) )
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

            let existing = super.get( name );

            if ( existing )
            {
                existing = isArray( existing ) ? existing : asArray( existing );

                const value = isArray( pValue ) ? [...pValue] : [asString( pValue )];
                const flatArray = asArray( value ).flat().map( e => urlDecode( asString( e, true ) ) );
                existing = asArray( existing );
                existing.push( ...flatArray );
                this.set( name, existing );
            }
            else
            {
                super.set( name, asArray( pValue ) );
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

    if ( _ud === typeof URLSearchParams )
    {
        URLSearchParams = SearchParams;
    }

    /**
     * Provides the same interface and behavior as the URL object.
     * If URL is undefined in the execution context,
     * this class will be assigned to the global namespace as URL
     */
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
            this.#url = cleanUrl( isString( pUrl ) ? cleanUrl( asString( pUrl, true ) ) : (isNonNullObject( pUrl ) ? pUrl?.href || (isFunction( pUrl?.toString ) ? pUrl.toString() : asString( pUrl, true )) : _mt_str) );

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

        get URL()
        {
            return !isNull( this.#url ) ? isObject( this.#url ) ? this.#url : this : new HttpUrl( this.#href );
        }

        get url()
        {
            return cleanUrl( isString( this.#url ) ? cleanUrl( asString( this.#url, true ) ) : (isNonNullObject( this.#url ) ? this.#url?.href || (isFunction( this.#url?.toString ) ? this.#url.toString() : asString( this.#url, true )) : _mt_str) );
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

        toString()
        {
            return this.href;
        }

        [Symbol.toPrimitive]()
        {
            return this.href;
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

    HttpUrl.resolveUrl = function( pUrl )
    {
        if ( isNull( pUrl ) )
        {
            return _slash;
        }

        if ( isString( pUrl ) )
        {
            if ( isUrl( pUrl ) )
            {
                return asString( pUrl, true );
            }
            else if ( isJson( pUrl ) )
            {
                const parsed = attempt( () => parseJson( pUrl ) );
                return HttpUrl.resolveUrl( parsed );
            }
            return _slash;
        }

        if ( isNonNullObject( pUrl ) )
        {
            return pUrl?.url || pUrl?.href || pUrl?.location;
        }

        return _slash;
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

    if ( _ud === typeof URL )
    {
        URL = HttpUrl;
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
        return undefined; // TODO
    }

    // TODO
    const processRequestBody = function( pBody, pType )
    {
        if ( isString( pBody ) )
        {
            return processBodyAsString( pBody );
        }

    };

    class HttpRequestOptions
    {
        #method;
        #headers;

        #body;

        #cache;
        #mode;

        #keepalive;

        #credentials;
        #integrity;
        #priority;
        #redirect;

        #referrer;
        #referrerPolicy;

        #abortController;
        #signal;
        #timeout;

        #baseURL = _mt_str;
        #requestTransformer = null;
        #responseTransformer = null;
        #params = null;
        #paramsSerializer = null;
        #responseType = null;
        #responseEncoding = null;
        #xsrfCookieName = _mt_str;
        #xsrfHeaderName = _mt_str;
        #proxy = null;

        // noinspection OverlyComplexFunctionJS,FunctionTooLongJS
        constructor( pMethod = VERBS.GET,
                     pHeaders = new HttpRequestHeaders(),
                     pBody = null,
                     pCache = REQUEST_CACHE_OPTIONS.DEFAULT,
                     pCredentials = REQUEST_CREDENTIALS_OPTIONS.SAME_ORIGIN,
                     pIntegrity = _mt_str,
                     pKeepalive = false,
                     pMode = MODES.SAME_ORIGIN,
                     pPriority = PRIORITY.AUTO,
                     pRedirect = REDIRECT_OPTIONS.FOLLOW,
                     pReferrer = "about:client",
                     pReferrerPolicy = REFERRER_POLICY_OPTIONS.NO_REFERRER_WHEN_DOWNGRADE,
                     pAbortController = new AbortController(),
                     pSignal = pAbortController?.signal || null,
                     pTimeout = -1,
                     pBaseURL = _mt_str,
                     pRequestTransformer = null,
                     pResponseTransformer = null,
                     pParams = null,
                     pParamsSerializer = null,
                     pResponseType = null,
                     pResponseEncoding = null,
                     pXsrfCookieName = _mt_str,
                     pXsrfHeaderName = _mt_str,
                     pProxy = null )
        {
            if ( pBody instanceof this.constructor )
            {
                this.#body = this.#body = (((new HttpVerb( this.#method )).forbidsBody) ? null : pBody.body);

                this.#headers = new HttpRequestHeaders( pBody.headers );

                this.#cache = pBody.cache;
                this.#credentials = pBody.credentials;
                this.#integrity = pBody.integrity;
                this.#keepalive = pBody.keepalive;
                this.#method = pBody.method;
                this.#mode = pBody.mode;
                this.#priority = pBody.priority;
                this.#redirect = pBody.redirect;
                this.#referrer = pBody.referrer;
                this.#referrerPolicy = pBody.referrerPolicy;
                this.#abortController = pBody.abortController || new AbortController();
                this.#signal = pBody.signal || this.#abortController?.signal;
                this.#timeout = pBody.timeout;

                // these properties are relevant only to certain frameworks, such as Axios
                this.#baseURL = pBody.baseURL || _mt_str;
                this.#requestTransformer = pBody.requestTransformer || null;
                this.#responseTransformer = pBody.responseTransformer || null;
                this.#params = pBody.params || null;
                this.#paramsSerializer = pBody.paramsSerializer || null;
                this.#responseType = pBody.responseType || null;
                this.#responseEncoding = pBody.responseEncoding || null;
                this.#xsrfCookieName = pBody.xsrfCookieName || _mt_str;
                this.#xsrfHeaderName = pBody.xsrfHeaderName || _mt_str;
                this.#proxy = isNonNullObject( pBody.proxy ) ? pBody.proxy || null : null;

                return this;
            }

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

            this.#body = (((new HttpVerb( this.#method )).forbidsBody) ? null : pBody);

            // these properties are relevant only to certain frameworks, such as Axios
            this.#baseURL = pBaseURL || _mt_str;
            this.#requestTransformer = pRequestTransformer || null;
            this.#responseTransformer = pResponseTransformer || null;
            this.#params = pParams || null;
            this.#paramsSerializer = pParamsSerializer || null;
            this.#responseType = pResponseType || null;
            this.#responseEncoding = pResponseEncoding || null;
            this.#xsrfCookieName = pXsrfCookieName || _mt_str;
            this.#xsrfHeaderName = pXsrfHeaderName || _mt_str;
            this.#proxy = isNonNullObject( pProxy ) ? pProxy || null : null;
        }

        get body()
        {
            return this.#body;
        }

        get data()
        {
            return this.body;
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

        // these properties are relevant only to certain frameworks, such as Axios

        get baseURL()
        {
            return this.#baseURL;
        }

        get requestTransformer()
        {
            return this.#requestTransformer;
        }

        get responseTransformer()
        {
            return this.#responseTransformer;
        }

        get params()
        {
            return this.#params;
        }

        get paramsSerializer()
        {
            return this.#paramsSerializer;
        }

        get responseType()
        {
            return this.#responseType;
        }

        get responseEncoding()
        {
            return this.#responseEncoding;
        }

        get xsrfCookieName()
        {
            return this.#xsrfCookieName;
        }

        get xsrfHeaderName()
        {
            return this.#xsrfHeaderName;
        }

        get proxy()
        {
            return this.#proxy;
        }
    }

    HttpRequestOptions.fromOptions = function( pOptions )
    {
        const options = populateOptions( pOptions, new HttpRequestOptions() );

        return new HttpRequestOptions( options.method,
                                       options.headers,
                                       options.body,
                                       options.cache,
                                       options.credentials,
                                       options.integrity,
                                       options.keepalive,
                                       options.mode,
                                       options.priority,
                                       options.redirect,
                                       options.referrer,
                                       options.referrerPolicy,
                                       options.signal,
                                       options.timeout,

                                       options.baseUrl,
                                       options.requestTransformer,
                                       options.responseTransformer,
                                       options.params,
                                       options.paramsSerializer,
                                       options.responseType,
                                       options.responseEncoding,
                                       options.xsrfCookieName,
                                       options.xsrfHeaderName,
                                       options.proxy );
    };

    const cloneRequest = function( pRequest )
    {
        if ( isNull( pRequest ) )
        {
            return null;
        }

        let req = pRequest || {};

        // unwrap from any other container
        while ( req.request )
        {
            req = req.request;
        }

        if ( isNonNullObject( req ) )
        {
            if ( isFunction( req?.clone ) )
            {
                return new HttpRequest( attempt( () => req.clone() ) || req );
            }
            else
            {
                let url = req.url || req.href || req.location;
                let options = req.config || req.options || attempt( () => localCopy( req ) );
                if ( _ud !== typeof Request )
                {
                    const request = new Request( url, options );
                    return new HttpRequest( request, options );
                }
                return new HttpRequest( url, options );
            }
        }
        else if ( isString( req ) )
        {
            if ( isUrl( req ) )
            {
                return new HttpRequest( asString( req, true ) );
            }
            else if ( isJson( req ) )
            {
                const parsed = attempt( () => parseJson( req ) );
                if ( isNonNullObject( parsed ) )
                {
                    return cloneRequest( parsed );
                }
            }
        }

        return req;
    };

    class HttpRequest extends EventTarget
    {
        #id = 0;
        #priority = 0;

        #options;

        #url;

        #request;
        #response;
        #body;

        constructor( pRequestOrUrl, pOptions = new HttpRequestOptions() )
        {
            super();

            this.#request = pRequestOrUrl instanceof this.constructor ?
                            pRequestOrUrl.request :
                            cloneRequest( this.resolveRequest( pRequestOrUrl ) );

            this.#options = populateOptions( pOptions || {},
                                             toObjectLiteral( new HttpRequestOptions( HttpVerb.resolveHttpMethod( this.#request?.method || VERBS.GET ),
                                                                                      new HttpRequestHeaders( this.#request?.headers || pOptions?.headers || {} ),
                                                                                      pOptions ) ) );

            this.#id = this.#request?.id || this.options?.id || this.constructor.nextId();

            this.#priority = asInt( this.#request?.priority || this.options?.priority );

            this.#url = isString( pRequestOrUrl ) && isUrl( pRequestOrUrl ) ?
                        new HttpUrl( pRequestOrUrl ) :
                        new HttpUrl( this.#request?.url || this.#request?.href || asString( pRequestOrUrl ) );

            this.#response = this.#request?.response || this.#options?.response;

            this.error = this.#request?.error || this.#options?.error || this.#response?.error || (isError( this.#response ) ? this.#response : null);

            this.#body = this.#request?.body || this.#request?.data;
        }

        get id()
        {
            return asInt( this.#id );
        }

        get options()
        {
            return populateOptions( this.#options, toObjectLiteral( new HttpRequestOptions() ) );
        }

        get url()
        {
            return cleanUrl( asString( isNonNullObject( this.#url ) ? this.#url?.href || (isFunction( this.#url?.toString ) ? asString( this.#url.toString(), true ) : asString( this.#url )) : this.#url, true ) );
        }

        get URL()
        {
            if ( isNonNullObject( this.#url ) )
            {
                if ( _ud !== typeof URL )
                {
                    if ( this.#url instanceof URL )
                    {
                        return URL;
                    }
                    else
                    {
                        return URL.parse( cleanUrl( this.#url?.href || isFunction( this.#url?.toString ) ? asString( this.#url?.toString(), true ) : asString( this.#url ) ) );
                    }
                }
            }
            else if ( isString( this.#url ) )
            {
                if ( _ud !== typeof URL )
                {
                    return URL.parse( cleanUrl( asString( this.#url ) ) );
                }
                else
                {
                    return new HttpUrl( cleanUrl( asString( this.#url ) ) );
                }
            }
        }

        get request()
        {
            return this.resolveRequest( this.#request ) || this;
        }

        get response()
        {
            return this.#response;
        }

        get body()
        {
            return this.#body;
        }

        get priority()
        {
            return asInt( this.#priority );
        }

        resolveRequest( pRequestOrUrl, pConfig )
        {
            // resolve arguments
            let { req, config } = this.unwrapArguments( pRequestOrUrl, pConfig );

            // handle W3C standard
            if ( _ud !== typeof Request && req instanceof Request )
            {
                return new Request( attempt( () => req.clone() ), config );
            }

            if ( isNull( req ) )
            {
                if ( isNull( config ) )
                {
                    return null;
                }
                req = config;
            }

            if ( isNonNullObject( req ) )
            {
                return this._resolveRequestFromObject( req, config );
            }

            if ( isString( req ) )
            {
                if ( isJson( req ) )
                {
                    return this.resolveRequest( attempt( () => parseJson( req ) ), config );
                }
                return new HttpRequest( cleanUrl( asString( req, true ) ), HttpRequestOptions.fromOptions( config ) );
            }

            if ( isFunction( req ) )
            {
                return attempt( () => req.call( config, config ) );
            }

            return new HttpRequest( _slash, HttpRequestOptions.fromOptions( config ) );
        }

        unwrapArguments( pRequestOrUrl, pConfig )
        {
            let req = pRequestOrUrl || pConfig?.request;
            let config = pConfig || req?.config || req?.options;

            // unwrap from any other containers
            if ( isNonNullObject( req ) )
            {
                config = config || req?.config || req?.options;
                while ( req.request )
                {
                    req = req.request;
                    config = config || req?.config || req?.options;
                }
            }
            return { req, config };
        }

        _resolveRequestFromObject( req, config )
        {
            let method = resolveHttpMethod( req.method || config?.method || req || config );
            let url = HttpUrl.resolveUrl( req.url || config?.url || req.href || config?.href || req.location || config?.location || req || config );
            let body = req.body || config?.body || req.data || config?.data;
            let bodyUsed = false;
            let headers = new HttpRequestHeaders( req.headers || config?.headers );
            let mode = req.mode || config?.mode || "cors";
            let redirect = req.redirect || config?.redirect || "follow";

            let obj =
                {
                    url,
                    method,
                    body,
                    bodyUsed,
                    headers,
                    mode,
                    redirect
                };

            const entries = objectEntries( req );
            attempt( () => entries.forEach( entry =>
                                            {
                                                const key = ObjectEntry.getKey( entry );
                                                const value = ObjectEntry.getValue( entry );

                                                if ( key && value )
                                                {
                                                    obj[key] = value || obj[key];
                                                }
                                            } ) );

            const requestOptions = HttpRequestOptions.fromOptions( obj );

            if ( _ud !== typeof Request )
            {
                return new Request( url, toObjectLiteral( requestOptions ) );
            }

            return new HttpRequest( obj.url || url, requestOptions );
        }
    }

    HttpRequest.resolve = function( pRequestOrUrl, pOptions )
    {
        const options = populateOptions( pOptions || {},
                                         toObjectLiteral( new HttpRequestOptions( pRequestOrUrl?.method || VERBS.GET,
                                                                                  new HttpRequestHeaders( pRequestOrUrl?.headers || pOptions?.headers ),
                                                                                  pRequestOrUrl?.options || {} ) ) );

        if ( pRequestOrUrl instanceof HttpRequest )
        {
            return new HttpRequest( pRequestOrUrl, options );
        }
        else if ( _ud !== typeof Request && pRequestOrUrl instanceof Request )
        {
            return new HttpRequest( pRequestOrUrl, options );
        }
        else if ( isString( pRequestOrUrl ) )
        {
            if ( isJson( pRequestOrUrl ) )
            {
                return HttpRequest.resolve( attempt( () => parseJson( pRequestOrUrl ) ), options );
            }
            return new HttpRequest( pRequestOrUrl, options );
        }
        else if ( isFunction( pRequestOrUrl?.toString ) )
        {
            return new HttpRequest( asString( pRequestOrUrl.toString(), true ), options );
        }
    };

    HttpRequest.ID = 0;
    HttpRequest.MIN_ID = 1;
    HttpRequest.MAX_ID = 999_999;
    HttpRequest.nextId = function()
    {
        HttpRequest.ID += 1;
        if ( HttpRequest.ID > HttpRequest.MAX_ID )
        {
            HttpRequest.ID = HttpRequest.MIN_ID;
        }

        return HttpRequest.ID;
    };

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
                    HttpHeaderDefinition,
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
            cloneRequest,

            HttpUrl,
            SearchParams,
            HttpRequestOptions,
            HttpRequest,
            HttpRequestHeaders,
            HttpVerb,
            HttpHeaderDefinition,
            HttpContentType,
            HttpStatus,
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
