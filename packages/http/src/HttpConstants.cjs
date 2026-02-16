/**
 * @fileOverview
 * This module defines constants for working with HTTP<br>
 * <br>
 *
 * @module HttpConstants
 *
 * @author Scott Bockelman
 * @license MIT
 */

/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );
const bufferUtils = require( "@toolbocks/buffer" );
const jsonUtils = require( "@toolbocks/json" );
const entityUtils = require( "@toolbocks/entities" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_CONSTANTS__";

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
            jsonUtils,
            entityUtils
        };

    const
        {
            ModuleEvent,
            ToolBocksModule,
            IllegalArgumentError,
            ObjectEntry,
            objectEntries,
            objectValues,
            objectKeys,
            readProperty,
            readScalarProperty,
            setProperty,
            makeAppender,
            makeDeleter,
            localCopy,
            lock,
            attempt,
            asyncAttempt,
            $ln
        } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _comma, _str, _num, _big, _bool, _obj, _fun } = constants;

    const
        {
            DEFAULT_OBJECT_LITERAL_OPTIONS,
            FAST_OBJECT_LITERAL_OPTIONS,
            isNull,
            isObject,
            isNonNullObject,
            isPopulatedObject,
            isString,
            isUrl,
            isNumeric,
            isArray,
            isFunction,
            isTypedArray,
            isPromise,
            isThenable,
            isReadOnly,
            toObjectLiteral,
        } = typeUtils;

    const { asString, isBlank, asInt, lcase, ucase, capitalize, isJson, cleanUrl } = stringUtils;

    const { asArray } = arrayUtils;

    const { isBuffer } = bufferUtils;

    const { parseJson } = jsonUtils;

    const
        {
            BockEntity,
            BockIdentified,
            BockNamed,
            BockDescribed,
            populateProperties,
            overwriteProperties,
            asObject,
            same
        } = entityUtils;

    const modName = "HttpConstants";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );


    /**
     * An object that defines common HTTP request methods as key-value pairs.<br>
     * <br>
     * Each key is the uppercase HTTP method, and its value is the same string representation.<br>
     * <br>
     *
     * Properties:<br>
     * <br>
     * - GET: Represents an HTTP GET request, typically used to retrieve data.<br>
     * - POST: Represents an HTTP POST request, typically used to submit data to be processed.<br>
     * - PUT: Represents an HTTP PUT request, typically used to update or create a resource.<br>
     * - PATCH: Represents an HTTP PATCH request, typically used to make partial updates to a resource.<br>
     * - HEAD: Represents an HTTP HEAD request, used to retrieve metadata or headers for a resource.<br>
     * - OPTIONS: Represents an HTTP OPTIONS request, used to obtain information about communication options.<br>
     * - DELETE: Represents an HTTP DELETE request, used to remove a resource.<br>
     * - CONNECT: Represents an HTTP CONNECT request, typically used to establish a tunnel to the server.<br>
     * - TRACE: Represents an HTTP TRACE request, typically used for testing and diagnostic purposes.<br>
     */
    const VERBS = {
        GET: "GET", /* 0 */
        POST: "POST", /* 1 */
        PUT: "PUT", /* 2 */
        PATCH: "PATCH", /* 3 */
        HEAD: "HEAD", /* 4 */
        OPTIONS: "OPTIONS", /* 6 */
        DELETE: "DELETE", /* 7 */
        CONNECT: "CONNECT", /* 8 */
        TRACE: "TRACE" /* 9 */
    };

    VERBS.indexOf = function( pVerb )
    {
        return Object.values( VERBS ).map( lcase ).indexOf( lcase( asString( pVerb, true ) ) );
    };

    VERBS.values = function()
    {
        return Object.values( VERBS );
    };

    VERBS.keys = function()
    {
        return Object.keys( VERBS );
    };

    /**
     * Represents an HTTP verb and provides utility methods related to it.
     * @class
     */
    class HttpVerb extends BockNamed
    {
        #verb;

        /**
         * Constructs an instance of the class to represent the specified verb.
         *
         * @param {string} pVerb - The verb to be assigned to the instance.
         * @return {HttpVerb} A new instance of the class representing the specified verb.
         */
        constructor( pVerb )
        {
            super( VERBS.indexOf( ucase( pVerb || VERBS.GET ) ), ucase( asString( (pVerb || VERBS.GET), true ) ) );
            this.#verb = ucase( asString( (pVerb || VERBS.GET), true ) );
        }

        /**
         * Returns true if this verb (method) requires a body in the request.
         *
         * @return {boolean} Returns true if the HTTP verb is POST, PUT, or PATCH; otherwise, false.
         */
        get requiresBody()
        {
            return ["POST", "PUT", "PATCH"].includes( ucase( this.#verb ) );
        }

        get allowsBody()
        {
            return this.requiresBody || "DELETE" === ucase( this.#verb );
        }

        get forbidsBody()
        {
            return ["GET", "HEAD", "OPTIONS", "TRACE"].includes( ucase( this.#verb ) );
        }

        toString()
        {
            return ucase( this.name || this.#verb );
        }

        [Symbol.toPrimitive]( pHint )
        {
            return this.toString();
        }
    }

    Object.entries( VERBS ).forEach( ( [key, value] ) =>
                                     {
                                         HttpVerb[ucase( key )] = new HttpVerb( value );
                                     } );

    HttpVerb.resolveHttpMethod = function( pMethod = VERBS.GET, pConfig = {} )
    {
        const verbs = Object.values( VERBS ).map( ucase );

        if ( isString( pMethod ) && !isBlank( pMethod ) )
        {
            let method = ucase( asString( pMethod, true ) );

            if ( verbs.includes( method ) )
            {
                return method;
            }

            if ( isJson( pMethod ) )
            {
                let candidate = attempt( () => parseJson( pMethod ) );

                candidate = isString( candidate ) ? ucase( candidate ) : isNonNullObject( candidate ) ? candidate.method : pConfig?.method;

                method = HttpVerb.resolveHttpMethod( candidate, pConfig );

                if ( isString( method ) && verbs.includes( ucase( asString( method, true ) ) ) )
                {
                    return method;
                }
            }
        }

        if ( isNonNullObject( pMethod ) )
        {
            if ( pMethod instanceof HttpVerb )
            {
                let candidate = HttpVerb.resolveHttpMethod( pMethod?.name || pMethod?.verb, pConfig );

                if ( isString( candidate ) && verbs.includes( ucase( asString( candidate, true ) ) ) )
                {
                    return candidate;
                }
            }
            else
            {
                let candidate = HttpVerb.resolveHttpMethod( pMethod?.method, pConfig );

                if ( isString( candidate ) && verbs.includes( ucase( asString( candidate, true ) ) ) )
                {
                    return candidate;
                }
            }
        }

        if ( isNumeric( pMethod ) )
        {
            const index = asInt( pMethod );

            if ( index >= 0 && index < $ln( verbs ) )
            {
                let candidate = verbs[index];

                if ( isString( candidate ) && verbs.includes( ucase( asString( candidate, true ) ) ) )
                {
                    return candidate;
                }
            }
        }

        if ( pConfig )
        {
            return HttpVerb.resolveHttpMethod( pConfig );
        }

        return VERBS.GET;
    };

    HttpVerb.resolve = function( pVal )
    {
        if ( isNonNullObject( pVal ) )
        {
            if ( pVal instanceof HttpVerb )
            {
                return pVal;
            }

            const httpMethod = HttpVerb.resolveHttpMethod( pVal?.method || pVal );
            return HttpVerb[httpMethod] || HttpVerb[ucase( httpMethod )];
        }

        if ( isString( pVal ) || isNumeric( pVal ) )
        {
            let httpMethod = HttpVerb.resolveHttpMethod( pVal );
            return HttpVerb[httpMethod] || HttpVerb[ucase( httpMethod )];
        }

        return HttpVerb[VERBS.GET];
    };

    const MODES = lock(
        {
            SAME_ORIGIN: "same-origin",
            NO_CORS: "no-cors",
            CORS: "cors",
            DEFAULT: "same-origin"
        } );

    const PRIORITY = lock( {
                               LOW: "low",
                               HIGH: "high",
                               AUTO: "auto"
                           } );

    function calculatePriority( pRequest, pConfig )
    {
        let priority = pRequest?.priority || pConfig?.priority || PRIORITY.AUTO;
        if ( isNumeric( priority ) )
        {
            priority = asInt( priority );
            return priority < 0 ? PRIORITY.LOW : priority > 0 ? PRIORITY.HIGH : PRIORITY.AUTO;
        }
        else if ( isString( priority ) )
        {
            return PRIORITY[ucase( asString( priority, true ) )] || PRIORITY.AUTO;
        }
        return PRIORITY.AUTO;
    }

    /**
     * An object representing various content types commonly used in web development.<br>
     * <br>
     * Each key corresponds to a shorthand or relevant name for a specific content type,
     * and its value is the MIME type string associated with that content type.<br>
     * <br>
     *
     * The object provides mappings for:<br>
     * - Plain text
     * <br>
     * - HTML documents
     * <br>
     * - CSS stylesheets
     * <br>
     * - JavaScript files (including shorthand for JS and ECMAScript)
     * <br>
     * - JSON data
     * <br>
     */
    const CONTENT_TYPES =
        {
            PLAIN: "text/plain",
            TEXT: "text/plain",
            HTML: "text/html",
            CSS: "text/css",
            JAVASCRIPT: "application/javascript",
            JS: "text/javascript",
            JSON: "application/json",
            ECMASCRIPT: "application/ecmascript",
            BINARY_STREAM: "application/octet-stream",
            MS_WORD: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            MULTIPART: "multipart/form-data",
            FORM_URLENCODED: "application/x-www-form-urlencoded",
            XML: "text/xml",
            CSV: "text/csv",
            ZIP: "application/zip",
            PNG: "image/png",
            JPG: "image/jpeg",
            JPEG: "image/jpeg",
            SVG: "image/svg+xml",
            PDF: "application/pdf"
        };

    const EXTENSIONS =
        {
            "application/pdf": ".pdf",
            "application/json": ".json",
            "application/xml": ".xml",
            "application/zip": ".zip",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
            "application/msword": ".doc",
            "application/vnd.ms-excel": ".xls",
            "text/plain": ".txt",
            "text/html": ".html",
            "text/css": ".css",
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/svg+xml": ".svg",
            "audio/mpeg": ".mp3",
            "video/mp4": ".mp4"
        };

    /**
     * Represents an HTTP content type (or mime-type).
     *
     * @class
     */
    class HttpContentType
    {
        #type;
        #contentType;

        /**
         * Constructs a new object representing a specified type and MIME type.
         *
         * @param {string} pType - The common name of the type.
         * @param {string} pMimeType - The MIME type text to use in a request header.
         */
        constructor( pType, pMimeType )
        {
            this.#type = pType;
            this.#contentType = pMimeType;
        }

        get type()
        {
            return asString( this.#type, true );
        }

        get contentType()
        {
            return asString( this.#contentType, true );
        }

        toString()
        {
            return this.contentType;
        }
    }

    function calculateContentTypeForObject( pData )
    {
        let type = CONTENT_TYPES.JSON;

        if ( isTypedArray( pData ) || isBuffer( pData ) )
        {
            type = CONTENT_TYPES.BINARY_STREAM;
        }
        else if ( _ud !== typeof FormData && pData instanceof FormData )
        {
            type = CONTENT_TYPES.MULTIPART;
        }
        else if ( _ud !== typeof URLSearchParams && pData instanceof URLSearchParams )
        {
            type = CONTENT_TYPES.FORM_URLENCODED;
        }

        return type;
    }

    async function calculateContentType( pRequest )
    {
        let type = _mt;

        let request = (_ud !== typeof Request && pRequest instanceof Request) ? attempt( () => pRequest.clone() ) || pRequest : isNonNullObject( pRequest ) ? pRequest : { data: pRequest };

        let data = request?.data || request?.body || pRequest;

        if ( !isNull( data ) && (isPromise( data ) || isThenable( data )) )
        {
            data = await asyncAttempt( async() => await (isPromise( data ) ? data : await Promise.resolve( data ).then( b => b )) );
        }

        if ( data )
        {
            switch ( typeof data )
            {
                case _str:
                    type = (isJson( asString( data, true ) )) ? CONTENT_TYPES.JSON : CONTENT_TYPES.FORM_URLENCODED;
                    break;

                case _num:
                case _big:
                case _bool:
                    type = CONTENT_TYPES.FORM_URLENCODED;
                    break;

                case _fun:
                    type = CONTENT_TYPES.BINARY_STREAM;
                    break;

                case _obj:
                    type = calculateContentTypeForObject( data );
                    break;
            }
        }

        return type;
    }

    HttpContentType.calculateContentTypeForObject = calculateContentTypeForObject;
    HttpContentType.calculateContentType = calculateContentType;

    HttpContentType.getContentType = function( pConfig )
    {
        let config = isNonNullObject( pConfig ) ? pConfig : isString( pConfig ) ? { ["content-type"]: lcase( asString( pConfig, true ) ) } : _mt;

        let headers = { ...(toObjectLiteral( config?.headers || {}, { keyTransformer: lcase } ) || {}) } || {};

        let type = asString( headers["content-type"] || headers["contenttype"] || config["content-type"] || config["contenttype"], true ) || _mt;

        if ( isBlank( type ) )
        {
            type = HttpContentType.calculateContentType( pConfig );
        }

        return asString( type, true ) || "*";
    };

    Object.entries( CONTENT_TYPES ).forEach( ( [key, value] ) =>
                                             {
                                                 HttpContentType[key] = new HttpContentType( CONTENT_TYPES[key], value );
                                             } );

    /**
     * A collection of HTTP status codes mapped to their respective numeric values.<br>
     * <br>
     * These codes represent standard HTTP response status codes as defined by the IETF.<br>
     * <br>
     * Each property corresponds to a commonly used HTTP response code.<br>
     * <br>
     * Categories of status codes include:<br>
     * <br>
     * - Informational responses (100–199) <br>
     * - Successful responses (200–299) <br>
     * - Redirection messages (300–399) <br>
     * - Client error responses (400–499) <br>
     * - Server error responses (500–599) <br>
     * <br>
     * <br>
     * Examples of status codes:<br>
     * <br>
     * - CONTINUE (100): Informational status code indicating that the server has received the request headers <br>
     *   and the client should proceed to send the request body.<br>
     *   <br>
     * - OK (200): Successful status code indicating that the request has succeeded. <br>
     *  <br>
     * - NOT_FOUND (404): Client error code indicating that the server cannot find the requested resource. <br>
     *  <br>
     * - INTERNAL_SERVICE_ERROR (500): Server error code indicating that the server encountered an unexpected
     *   condition that prevented it from fulfilling the request. <br>
     *  <br>
     */
    const STATUS_CODES =
        {
            UNKNOWN: 0,

            CONTINUE: 100,
            SWITCHING_PROTOCOLS: 101,
            PROCESSING: 102,
            EARLY_HINTS: 103,

            OK: 200,

            CREATED: 201,
            ACCEPTED: 202,
            NON_AUTHORITATIVE_INFORMATION: 203,
            NO_CONTENT: 204,
            RESET_CONTENT: 205,
            PARTIAL_CONTENT: 206,
            MULTI_STATUS: 207,
            ALREADY_REPORTED: 208,
            IM_USED: 226,

            MULTIPLE_CHOICES: 300,
            MOVED: 301,
            MOVED_PERMANENTLY: 301,
            FOUND: 302,
            SEE_OTHER: 303,
            NOT_MODIFIED: 304,
            USE_PROXY: 305,
            UNUSED: 306,
            TEMPORARY_REDIRECT: 307,
            PERMANENT_REDIRECT: 308,

            ERROR: 400,
            UNAUTHORIZED: 401,
            NOT_ALLOWED: 403,
            NOT_FOUND: 404,
            METHOD_NOT_ALLOWED: 405,
            NOT_ACCEPTABLE: 406,
            PROXY_AUTHENTICATION_REQUIRED: 407,
            REQUEST_TIMEOUT: 408,
            CONFLICT: 409,
            GONE: 410,
            LENGTH_REQUIRED: 411,
            PRECONDITION_FAILED: 412,
            REQUEST_ENTITY_TOO_LARGE: 413,
            REQUEST_URI_TOO_LONG: 414,
            UNSUPPORTED_MEDIA_TYPE: 415,
            REQUESTED_RANGE_NOT_SATISFIABLE: 416,
            EXPECTATION_FAILED: 417,

            // Yes, this is a real status code,
            // This error is a reference to the Hyper Text Coffee Pot Control Protocol
            // defined in April Fools' jokes in 1998 and 2014
            I_AM_A_TEAPOT: 418,

            MISDIRECTED_REQUEST: 421,
            UNPROCESSABLE_ENTITY: 422,
            LOCKED: 423,
            FAILED_DEPENDENCY: 424,
            TOO_EARLY: 425,
            UPGRADE_REQUIRED: 426,
            PRECONDITION_REQUIRED: 428,
            TOO_MANY_REQUESTS: 429,
            REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
            UNAVAILABLE_FOR_LEGAL_REASONS: 451,


            INTERNAL_SERVICE_ERROR: 500,
            NOT_IMPLEMENTED: 501,
            BAD_GATEWAY: 502,
            SERVICE_UNAVAILABLE: 503,
            GATEWAY_TIMEOUT: 504,
            HTTP_VERSION_NOT_SUPPORTED: 505,
            VARIANT_ALSO_NEGOTIATES: 506,
            INSUFFICIENT_STORAGE: 507,
            LOOP_DETECTED: 508,
            NOT_EXTENDED: 510,
            NETWORK_AUTHENTICATION_REQUIRED: 511,

            CLIENT_ERROR: 666
        };

    /**
     * Holds an object whose keys are the string values of statuses
     * and whose values are the text associated with that status
     * @type {Object}
     */
    const STATUS_TEXT_BY_CODE_STRING = {};


    /**
     * Holds an object whose keys are the integer values of statuses
     * and whose values are the text associated with that status
     * @type {Object}
     */
    const STATUS_TEXT_BY_INT_VALUE = {};

    const OK_STATUSES = lock( [STATUS_CODES.OK, STATUS_CODES.ACCEPTED, STATUS_CODES.CREATED, STATUS_CODES.NO_CONTENT] );

    const STATUS_ELIGIBLE_FOR_RETRY =
        [
            STATUS_CODES.TOO_MANY_REQUESTS,
            STATUS_CODES.LOCKED,
            STATUS_CODES.TOO_EARLY,
            STATUS_CODES.REQUEST_TIMEOUT,
            STATUS_CODES.SERVICE_UNAVAILABLE,
            STATUS_CODES.GATEWAY_TIMEOUT,
            STATUS_CODES.INTERNAL_SERVICE_ERROR
        ];

    /**
     * Defaults for milliseconds to wait
     * before retrying a request that failed
     * with one of the STATUS_ELIGIBLE_FOR_RETRY codes
     */
    const DEFAULT_RETRY_DELAY =
        {
            /**
             * When a request has exceeded an API rate limit,
             * for HttpClients that are not rate-limit-aware,
             * we try again after 256 milliseconds
             */
            [STATUS_CODES.TOO_MANY_REQUESTS]: 256,

            /**
             * When a request failed to update an existing resource
             * because the server considers the resource to be locked.
             * We try again after 1 second, to allow time for the lock holder to release the lock
             */
            [STATUS_CODES.LOCKED]: 1_024,

            /**
             * When a request has been made prior to the retry-after time,
             * we try again in 500 milliseconds (unless we can read the retry-after header).
             */
            [STATUS_CODES.TOO_EARLY]: 512,

            /**
             * When a request fails due to the performance of the server,
             * we can try again right away, so we wait 100 milliseconds.
             */
            [STATUS_CODES.REQUEST_TIMEOUT]: 128,

            /**
             * When a request fails because the server is (perhaps) temporarily offline,
             * we wait for 1 second before trying again to give the server time to recover.
             */
            [STATUS_CODES.SERVICE_UNAVAILABLE]: 1_024,

            /**
             * When a request fails because the server gateway is (perhaps) temporarily overloaded,
             * we wait for 250 milliseconds before trying again to give the gateway time to recover.
             */
            [STATUS_CODES.GATEWAY_TIMEOUT]: 256
        };

    const STATUSES_FORBIDDING_BODY = lock( [101, 204, 205, 304] );

    /**
     * Represents an HTTP status with its numeric code and textual name.
     * <br>
     * Provides methods to query the category, such as informational, success, redirection, client error, or server error.<br>
     * <br>
     * @class
     */
    class HttpStatus extends BockNamed
    {
        #code;

        constructor( pCode, pText )
        {
            super( asInt( pCode ), asString( pText || STATUS_TEXT_BY_CODE_STRING[ucase( asString( pCode, true ) )] || STATUS_TEXT_BY_INT_VALUE[asInt( pCode )], true ) );

            this.#code = asInt( pCode );
        }

        get code()
        {
            return asInt( this.#code );
        }

        isInformational()
        {
            return this.code >= 100 && this.code < 200;
        }

        isSuccess()
        {
            return this.code >= 200 && this.code < 300;
        }

        isRedirection()
        {
            return this.code >= 300 &&
                   this.code < 400 &&
                   [
                       STATUS_CODES.MOVED,
                       STATUS_CODES.MOVED_PERMANENTLY,
                       STATUS_CODES.FOUND,
                       STATUS_CODES.SEE_OTHER,
                       STATUS_CODES.TEMPORARY_REDIRECT,
                       STATUS_CODES.PERMANENT_REDIRECT
                   ].includes( this.code );
        }

        isRedirect()
        {
            return this.isRedirection();
        }

        isUseCached()
        {
            return [STATUS_CODES.NOT_MODIFIED].includes( asInt( this.code ) );
        }

        isError()
        {
            return this.code >= 400;
        }

        isServerError()
        {
            return this.code >= 500;
        }

        isClientError()
        {
            return this.code >= 400 && this.code < 500;
        }

        canRetry()
        {
            return (this.isError() && STATUS_ELIGIBLE_FOR_RETRY.includes( this.code ));
        }

        isOk()
        {
            return (200 === this.code);
        }

        isValid()
        {
            return this.isOk() || OK_STATUSES.includes( this.code );
        }

        get allowsBody()
        {
            return !(STATUSES_FORBIDDING_BODY.includes( this.code ));
        }

        get forbidsBody()
        {
            return STATUSES_FORBIDDING_BODY.includes( this.code );
        }
    }

    HttpStatus.fromLiteral = function( pObject )
    {
        if ( isNonNullObject( pObject ) && isNumeric( pObject.code ) )
        {
            return new HttpStatus( pObject.code, pObject?.name || pObject?.statusText );
        }
        else if ( isNumeric( pObject ) )
        {
            return new HttpStatus( pObject );
        }
        else if ( isString( pObject ) )
        {
            if ( "ok" === lcase( asString( pObject, true ) ) )
            {
                return new HttpStatus( 200, pObject );
            }

            const code = STATUS_CODES[ucase( asString( pObject, true ) )];
            if ( !isNull( code ) && asInt( code ) > 0 )
            {
                return new HttpStatus( asInt( code ), STATUS_TEXT_BY_INT_VALUE[code] );
            }
        }
        return null;
    };

    HttpStatus.allowsResponseBody = function( pStatus )
    {
        if ( isNonNullObject( pStatus ) && pStatus instanceof HttpStatus )
        {
            return pStatus.allowsBody();
        }

        if ( isNumeric( pStatus ) )
        {
            return !(STATUSES_FORBIDDING_BODY.includes( asInt( pStatus ) ));
        }

        return true;
    };

    objectEntries( STATUS_CODES ).forEach( ( entry ) =>
                                           {
                                               const name = asString( ObjectEntry.getKey( entry ), true );
                                               const code = asInt( ObjectEntry.getValue( entry ) );

                                               STATUS_TEXT_BY_CODE_STRING[ucase( asString( code, true ) )] = name;
                                               STATUS_TEXT_BY_INT_VALUE[asInt( code )] = name;

                                               HttpStatus[name] = new HttpStatus( code, capitalize( name ).replace( /http/i, "HTTP" ) );
                                           } );

    HttpStatus.isStatusCode = function( pCode )
    {
        return asArray( objectValues( STATUS_CODES ) ).includes( asInt( pCode ) );
    };

    HttpStatus.isStatusText = function( pText )
    {
        return asArray( objectKeys( STATUS_CODES ) ).includes( asInt( pText ) );
    };

    HttpStatus.fromResponse = function( pResponse, pOptions )
    {
        let response = pResponse?.response || pResponse || pOptions?.response || pOptions;

        let code = response?.status?.code || response?.status;
        let text = response?.statusText || response?.status?.name;

        if ( HttpStatus.isStatusCode( code ) || HttpStatus.isStatusText( text ) )
        {
            return new HttpStatus( code, text );
        }

        const httpStatus = HttpStatus.fromLiteral( response ) ?? HttpStatus.fromLiteral( response?.status ) ?? HttpStatus.fromLiteral( response?.statusText );

        if ( !isNull( httpStatus ) )
        {
            return httpStatus;
        }

        throw new IllegalArgumentError( "A valid Response object is required to calculate its status",
                                        {
                                            context: HttpStatus.fromResponse,
                                            args: [pResponse, pOptions]
                                        } );
    };

    HttpStatus.fromCode = function( pCode )
    {
        if ( isNonNullObject( pCode ) )
        {
            if ( pCode instanceof HttpStatus )
            {
                return pCode;
            }
            else
            {
                return HttpStatus.fromResponse( pCode );
            }
        }

        if ( isNumeric( pCode ) )
        {
            const id = asInt( pCode, -1 );

            if ( id >= 0 && HttpStatus.isStatusCode( id ) )
            {
                return new HttpStatus( id, STATUS_TEXT_BY_INT_VALUE[id] );
            }
        }

        if ( isString( pCode ) )
        {
            const name = STATUS_TEXT_BY_CODE_STRING[ucase( asString( pCode, true ) )];

            const num = asInt( STATUS_CODES[ucase( name ).replace( /http/i, _mt_str ).replace( /^_/, _mt_str )] );

            if ( HttpStatus.isStatusCode( num ) || HttpStatus.isStatusText( name ) )
            {
                return new HttpStatus( num, name );
            }
        }

        if ( isArray( pCode ) && $ln( pCode ) > 0 )
        {
            let arr = asArray( pCode ).filter( e => !isNull( e ) );

            let httpStatus = HttpStatus.fromCode( arr[0] );

            while ( isNull( httpStatus ) && $ln( arr ) > 0 )
            {
                httpStatus = HttpStatus.fromCode( arr.shift() );
            }

            return httpStatus;
        }

        throw new IllegalArgumentError( "The specified value cannot be interpreted as an HTTP Status",
                                        {
                                            context: HttpStatus.fromCode,
                                            args: [pCode]
                                        } );

    };

    /**
     * Represents an HTTP header with a name, description, and category.<br>
     * <br>
     * This class is designed to handle basic properties of an HTTP header,
     * such as its name, description, and category.
     * <br>
     */
    class HttpHeaderDefinition extends BockDescribed
    {
        #category;

        constructor( pName, pDescription, pCategory )
        {
            super( HttpHeaderDefinition.nextId(),
                   asString( pName, true ),
                   asString( pName, true ),
                   asString( pDescription || pName, true ) );

            this.#category = asString( pCategory, true );
        }

        get category()
        {
            return asString( this.#category, true );
        }

        toString()
        {
            return asString( this.name, true );
        }

        [Symbol.toPrimitive]( pHint )
        {
            if ( _str === lcase( asString( pHint, true ) ) )
            {
                return this.toString();
            }
            return this.toString();
        }
    }

    HttpHeaderDefinition.NEXT_ID = 0;
    HttpHeaderDefinition.nextId = function()
    {
        let id = HttpHeaderDefinition.NEXT_ID++;

        if ( id > 999 )
        {
            HttpHeaderDefinition.NEXT_ID = id = 0;
        }

        return id;
    };

    /**
     * HTTP_HEADERS is an object that categorizes and provides descriptions for various HTTP headers.<br>
     * <br>
     * These headers include metadata that helps both the client and server
     * communicate effectively during an HTTP request/response cycle.<br>
     * <br>
     * The headers are grouped into categories based on their specific purposes,
     * such as authentication, caching, connection management, content negotiation, etc.<br>
     * <br>
     * <br>
     * Categories and descriptions:<br>
     * <br>
     * - AUTHENTICATION: Headers related to authentication mechanisms between the client and server. <br>
     * - CACHING: Headers dealing with caching policies and metadata to control
     *   how data is stored and retrieved efficiently. <br>
     * - CONNECTION: Headers that manage the behavior and characteristics of the connection
     *   between the client and server. <br>
     * - CONDITIONAL: Headers allowing conditional requests based on resource state,
     *   enabling optimization and validation of updates. <br>
     * - CONTENT_NEGOTIATION: Headers facilitating negotiation of content attributes,
     *   like type or language, between the client and server. <br>
     * - CONTROLS: Headers defining specific directives and limitations for request processing. <br>
     * - COOKIE: Headers for transferring and managing web cookies between the client and server. <br>
     * - CORS: Headers managing Cross-Origin Resource Sharing (CORS)
     *   to control resource sharing and permissions across origins. <br>
     * - INTEGRITY: Headers related to resource integrity and verification,
     *   ensuring content accuracy and security. <br>
     * - MESSAGE_BODY: Headers conveying information about the body of a message,
     *   such as size, type, encoding, and language. <br>
     * - PROXIES: Headers pertinent to proxy servers and tracking the original client requests through proxies. <br>
     * - RANGE: Headers enabling ranges and partial requests to retrieve specific parts of large resources. <br>
     * - REDIRECTION: Headers dealing with URL redirections and instructing user agents to perform further actions. <br>
     */
    const HTTP_HEADERS =
        {
            AUTHENTICATION:
                {
                    "WWW-Authenticate": "Defines the authentication method that should be used to access a resource.",
                    "Authorization": "Contains the credentials to authenticate a user-agent with a server.",
                    "Proxy-Authenticate": "Defines the authentication method that should be used to access a resource behind a proxy server.",
                    "Proxy-Authorization": "Contains the credentials to authenticate a user-agent with a proxy server.",
                    "api_key": "Custom header often used to pass API credentials; not a currently defined header according to any RFP Specification",
                    "api-key": "Custom header often used to pass API credentials; not a currently defined header according to any RFP Specification",
                    "user_id": "Custom header often used to pass API credentials; not a currently defined header according to any RFP Specification",
                    "user-id": "Custom header often used to pass API credentials; not a currently defined header according to any RFP Specification"
                },
            CACHING:
                {
                    "Cache-Control": "Indicates directives that MUST be obeyed by all caching mechanisms along the request/response chain.",
                    "Pragma": "Conveys information from the server to the client without passing through a cache.",
                    "Expires": "Indicates the date/time after which the response is considered stale.",
                    "Warning": "Indicates that particular server behaviors are degraded.",
                    "Age": "The time, in seconds, that the object has been in a proxy cache.",
                    "ETag": "An identifier for a specific version of a resource, often a message digest.",
                    "Last-Modified": "The date and time at which the origin server believes the variant was last modified.",
                    "No-Vary-Search": "Indicates that the server should not use the Vary header to cache the response.",
                },
            CONNECTION:
                {
                    "Connection": "Indicates the general behavior of the connection.",
                    "Keep-Alive": "Indicates that the connection should remain open after the current request.",
                    "Proxy-Connection": "Indicates that the connection should remain open after the current request.",
                    "TE": "Indicates what transfer-coding, if any, are acceptable in the response.",
                    "Trailer": "Indicates that the trailer general fields will be included in the message payload of the request.",
                    "Transfer-Encoding": "Indicates what transfer-coding, if any, are acceptable in the response.",
                    "Upgrade": "Indicates that the connection will switch to another protocol after the current request is complete."
                },
            CONDITIONAL:
                {
                    "Last-Modified": "The last modification date of the resource, used to compare several versions of the same resource. It is less accurate than ETag, but easier to calculate in some environments. Conditional requests using If-Modified-Since and If-Unmodified-Since use this value to change the behavior of the request.",
                    "ETag": "A unique string identifying the version of the resource. Conditional requests using If-Match and If-None-Match use this value to change the behavior of the request.",
                    "If-Match": "Makes the request conditional, and applies the method only if the stored resource matches one of the given ETags.",
                    "If-None-Match": "Makes the request conditional, and applies the method only if the stored resource doesn't match any of the given ETags. This is used to update caches (for safe requests), or to prevent uploading a new resource when one already exists.",
                    "If-Modified-Since": "Makes the request conditional, and expects the resource to be transmitted only if it has been modified after the given date. This is used to transmit data only when the cache is out of date.",
                    "If-Unmodified-Since": "Makes the request conditional, and expects the resource to be transmitted only if it has not been modified after the given date. This ensures the coherence of a new fragment of a specific range with previous ones, or to implement an optimistic concurrency control system when modifying existing documents.",
                    "Vary": "Determines how to match request headers to decide whether a cached response can be used rather than requesting a fresh one from the origin server."
                },
            CONTENT_NEGOTIATION:
                {
                    "Accept": "Informs the server about the types of data that can be sent back.",
                    "Accept-Encoding": "The encoding algorithm, usually a compression algorithm, that can be used on the resource sent back.",
                    "Accept-Language": "Informs the server about the human language the server is expected to send back. This is a hint and is not necessarily under the full control of the user: the server should always pay attention not to override an explicit user choice (like selecting a language from a dropdown).",
                    "Accept-Patch": "A request content negotiation response header that advertises which media type the server is able to understand in a PATCH request.",
                    "Accept-Post": "A request content negotiation response header that advertises which media type the server is able to understand in a POST request."
                },
            CONTROLS:
                {
                    "Expect": "Indicates expectations that need to be fulfilled by the server to properly handle the request.",
                    "Max-Forwards": "Limits the number of proxies or gateways that can forward the request to the next server. It is used to prevent request loops.",
                },
            COOKIE:
                {
                    "Cookie": "Contains stored HTTP cookies previously sent by the server with the Set-Cookie header.",
                    "Set-Cookie": "Send cookies from the server to the user-agent."
                },
            CORS:
                {
                    "Access-Control-Allow-Credentials": "Indicates whether the response to the request can be exposed when the credentials flag is true.",
                    "Access-Control-Allow-Headers": "Used in response to a preflight request to indicate which HTTP headers can be used when making the actual request.",
                    "Access-Control-Allow-Methods": "Specifies the methods allowed when accessing the resource in response to a preflight request.",
                    "Access-Control-Allow-Origin": "Indicates whether the response can be shared.",
                    "Access-Control-Expose-Headers": "Indicates which headers can be exposed as part of the response by listing their names.",
                    "Access-Control-Max-Age": "Indicates how long the results of a preflight request can be cached.",
                    "Access-Control-Request-Headers": "Used when issuing a preflight request to let the server know which HTTP headers will be used when the actual request is made.",
                    "Access-Control-Request-Method": "Used when issuing a preflight request to let the server know which HTTP method will be used when the actual request is made.",
                    "Origin": "Indicates where a fetch originates from.",
                    "Timing-Allow-Origin": "Specifies origins that are allowed to see values of attributes retrieved via features of the Resource Timing API, which would otherwise be reported as zero due to cross-origin restrictions."
                },
            INTEGRITY:
                {
                    "Content-Digest": "Provides a digest of the stream of octets framed in an HTTP message (the message content) dependent on Content-Encoding and Content-Range.",
                    "Repr-Digest": "Provides a digest of the selected representation of the target resource before transmission. Unlike the Content-Digest, the digest does not consider Content-Encoding or Content-Range.",
                    "Want-Content-Digest": "States the wish for a Content-Digest header. It is the Content- analogue of Want-Repr-Digest.",
                    "Want-Repr-Digest": "States the wish for a Repr-Digest header. It is the Repr- analogue of Want-Content-Digest."
                },
            MESSAGE_BODY:
                {
                    "Content-Length": "The size of the resource, in decimal number of bytes.",
                    "Content-Type": "Indicates the media type of the resource.",
                    "Content-Encoding": "Used to specify the compression algorithm.",
                    "Content-Language": "Describes the human language(s) intended for the audience, so that it allows a user to differentiate according to the users' own preferred language.",
                    "Content-Location": "Indicates an alternate location for the returned data.",
                    "Content-Disposition": "Indicates if the resource transmitted should be displayed inline (default behavior without the header), or if it should be handled like a download and the browser should present a Save As dialog.",
                },
            PROXIES:
                {
                    "Forwarded": "Contains information from the client-facing side of proxy servers that is altered or lost when a proxy is involved in the path of the request.",
                    "Via": "Added by proxies, both forward and reverse proxies, and can appear in the request headers and the response headers."
                },
            RANGE:
                {
                    "Accept-Ranges": "Indicates if the server supports range requests, and if so in which unit the range can be expressed.",
                    "Range": "Indicates the part of a document that the server should return.",
                    "If-Range": "Creates a conditional range request that is only fulfilled if the given etag or date matches the remote resource. Used to prevent downloading two ranges from incompatible version of the resource.",
                    "Content-Range": "Indicates where in a full body message a partial message belongs."
                },
            REDIRECTION:
                {
                    "Location": "Indicates the URL to redirect the request to.",
                    "Retry-After": "Indicates how long the user agent should wait before making a follow-up request.",
                    "Link": "Indicates a link to the given URI.",
                    "Refresh": "Indicates that the user agent should refresh a document from the server.",
                    "URI": "Indicates the URI of the resource that the user agent can use to resubmit the request."
                },
            REQUEST:
                {
                    "From": "Contains an Internet email address for a human user who controls the requesting user agent.",
                    "Host": "Specifies the domain name of the server (for virtual hosting), and (optionally) the TCP port number on which the server is listening.",
                    "Referer": "The address of the previous web page from which a link to the currently requested page was followed.",
                    "Referrer-Policy": "Governs which referrer information sent in the Referer header should be included with requests made.",
                    "User-Agent": "Contains a characteristic string that allows the network protocol peers to identify the application type, operating system, software vendor or software version of the requesting software user agent."
                },
            RESPONSE:
                {
                    "Allow": "Lists the set of HTTP request methods supported by a resource.",
                    "Server": "Contains information about the software used by the origin server to handle the request."
                },
            SECURITY:
                {
                    "Cross-Origin-Embedder-Policy": "Allows a server to declare an embedder policy for a given document.",
                    "Cross-Origin-Opener-Policy": "Prevents other domains from opening/controlling a window.",
                    "Cross-Origin-Resource-Policy": "Prevents other domains from reading the response of the resources to which this header is applied. See also CORP explainer article.",
                    "Content-Security-Policy": "Controls resources the user agent is allowed to load for a given page.",
                    "Content-Security-Policy-Report-Only": "Allows web developers to experiment with policies by monitoring, but not enforcing, their effects. These violation reports consist of JSON documents sent via an HTTP POST request to the specified URI.",
                    "Expect-CT Deprecated": "Lets sites opt in to reporting and enforcement of Certificate Transparency to detect use of misissued certificates for that site.",
                    "Permissions-Policy": "Provides a mechanism to allow and deny the use of browser features in a website's own frame, and in iframes that it embeds.",
                    "Reporting-Endpoints": "Response header that allows website owners to specify one or more endpoints used to receive errors such as CSP violation reports, Cross-Origin-Opener-Policy reports, or other generic violations.",
                    "Strict-Transport-Security": "Force communication using HTTPS instead of HTTP.",
                    "Upgrade-Insecure-Requests": "Sends a signal to the server expressing the client's preference for an encrypted and authenticated response, and that it can successfully handle the upgrade-insecure-requests directive.",
                    "X-Content-Type-Options": "Disables MIME sniffing and forces browser to use the type given in Content-Type.",
                    "X-Frame-Options": "Indicates whether a browser should be allowed to render a page in an iframe, embed or object tag.",
                    "X-Permitted-Cross-Domain-Policies": "A cross-domain policy file may grant clients, such as Adobe Acrobat or Apache Flex (among others), permission to handle data across domains that would otherwise be restricted due to the Same-Origin Policy. The X-Permitted-Cross-Domain-Policies header overrides such policy files so that clients still block unwanted requests.",
                    "X-Powered-By": "May be set by hosting environments or other frameworks and contains information about them while not providing any usefulness to the application or its visitors. Unset this header to avoid exposing potential vulnerabilities.",
                    "X-XSS-Protection": "Enables cross-site scripting filtering."
                },
            FETCH:
                {
                    "Sec-Fetch-Site": "Indicates the relationship between a request initiator's origin and its target's origin. It is a Structured Header whose value is a token with possible values cross-site, same-origin, same-site, and none.",
                    "Sec-Fetch-Mode": "Indicates the request's mode to a server. It is a Structured Header whose value is a token with possible values cors, navigate, no-cors, same-origin, and websocket.",
                    "Sec-Fetch-User": "Indicates whether or not a navigation request was triggered by user activation. It is a Structured Header whose value is a boolean so possible values are ?0 for false and ?1 for true.",
                    "Sec-Fetch-Dest": "Indicates the request's destination. It is a Structured Header whose value is a token with possible values audio, audioworklet, document, embed, empty, font, image, manifest, object, paintworklet, report, script, serviceworker, sharedworker, style, track, video, worker, and xslt.",
                    "Sec-Purpose": "Indicates the purpose of the request, when the purpose is something other than immediate use by the user-agent. The header currently has one possible value, prefetch, which indicates that the resource is being fetched preemptively for a possible future navigation.",
                    "Service-Worker-Navigation-Preload": "A request header sent in preemptive request to fetch() a resource during service worker boot. The value, which is set with NavigationPreloadManager.setHeaderValue(), can be used to inform a server that a different resource should be returned than in a normal fetch() operation."
                },
            TRANSFER:
                {
                    "Transfer-Encoding": "Specifies the form of encoding used to safely transfer the resource to the user.",
                    "TE": "Specifies the transfer encodings the user agent is willing to accept.",
                    "Trailer": "Allows the sender to include additional fields at the end of chunked message."
                },
            WEB_SOCKETS:
                {
                    "Sec-WebSocket-Accept": "Response header that indicates that the server is willing to upgrade to a WebSocket connection.",
                    "Sec-WebSocket-Extensions": "In requests, this header indicates the WebSocket extensions supported by the client in preferred order. In responses, it indicates the extension selected by the server from the client's preferences.",
                    "Sec-WebSocket-Key": "Request header containing a key that verifies that the client explicitly intends to open a WebSocket.",
                    "Sec-WebSocket-Protocol": "In requests, this header indicates the sub-protocols supported by the client in preferred order. In responses, it indicates the the sub-protocol selected by the server from the client's preferences.",
                    "Sec-WebSocket-Version": "In requests, this header indicates the version of the WebSocket protocol used by the client. In responses, it is sent only if the requested protocol version is not supported by the server, and lists the versions that the server supports."
                },
            OTHER:
                {
                    "Alt-Svc": "Used to list alternate ways to reach this service.",
                    "Alt-Used": "Used to identify the alternative service in use.",
                    "Date": "Contains the date and time at which the message was originated.",
                    "Link": "This entity-header field provides a means for serializing one or more links in HTTP headers. It is semantically equivalent to the HTML link element.",
                    "Retry-After": "Indicates how long the user agent should wait before making a follow-up request.",
                    "Server-Timing": "Communicates one or more metrics and descriptions for the given request-response cycle.",
                    "Service-Worker": "Included in fetches for a service worker's script resource. This header helps administrators log service worker script requests for monitoring purposes.",
                    "Service-Worker-Allowed": "Used to remove the path restriction by including this header in the response of the Service Worker script.",
                    "SourceMap": "Links to a source map so that debuggers can step through original source code instead of generated or transformed code.",
                    "Upgrade": "This HTTP/1.1 (only) header can be used to upgrade an already established client/server connection to a different protocol (over the same transport protocol). For example, it can be used by a client to upgrade a connection from HTTP 1.1 to HTTP 2.0, or an HTTP or HTTPS connection into a WebSocket.",
                    "Priority": "Provides a hint from about the priority of a particular resource request on a particular connection. The value can be sent in a request to indicate the client priority, or in a response if the server chooses to reprioritize the request.",
                }
        };

    /**
     * This statement assigns each defined HttpHeaderDefinition to a property of the HttpHeaderDefinition class.
     */
    Object.entries( HTTP_HEADERS ).forEach( ( [category, headers] ) =>
                                            {
                                                const categoryName = ucase( category );
                                                Object.entries( headers ).forEach( ( [header, description] ) =>
                                                                                   {
                                                                                       HttpHeaderDefinition[header] = new HttpHeaderDefinition( header, description, categoryName );

                                                                                       if ( !(lcase( header ) in HttpHeaderDefinition) )
                                                                                       {
                                                                                           HttpHeaderDefinition[lcase( header )] = new HttpHeaderDefinition( lcase( header ), description, categoryName );
                                                                                       }

                                                                                   }
                                                );
                                            } );

    HttpHeaderDefinition.from = function( pData )
    {
        if ( isNonNullObject( pData ) || isArray( pData ) )
        {
            if ( pData instanceof HttpHeaderDefinition )
            {
                return pData;
            }

            if ( isPopulatedObject( pData ) && !isBlank( pData.name ) )
            {
                return new HttpHeaderDefinition( pData.name, pData.description || pData.name, pData.category || _mt );
            }
            else if ( isArray( pData ) )
            {
                let arr = asArray( pData ).filter( e => !isNull( e ) && (isString( e ) || (isPopulatedObject( e ) && (e instanceof HttpHeaderDefinition || !isBlank( e.name )))) );

                if ( $ln( arr ) > 0 )
                {
                    if ( arr.every( e => isString( e ) ) )
                    {
                        return new HttpHeaderDefinition( arr[0], arr[1] || arr[0], arr[2] || _mt );
                    }
                    else if ( arr[0] instanceof HttpHeaderDefinition )
                    {
                        return arr[0];
                    }
                    else if ( isPopulatedObject( arr[0] ) && !isBlank( arr[0]?.name ) )
                    {
                        return new HttpHeaderDefinition( arr[0].name, arr[0].description || arr[0].name, arr[0].category || _mt );
                    }
                    else
                    {
                        let obj = arr.find( e => isPopulatedObject( e ) && e instanceof HttpHeaderDefinition );
                        if ( !isNull( obj ) )
                        {
                            return obj;
                        }
                        obj = arr.find( e => isPopulatedObject( e ) && !isBlank( e.name ) );
                        if ( !isNull( obj ) )
                        {
                            return HttpHeaderDefinition.from( obj );
                        }

                        let index = arr.findIndex( e => isString( e ) && !isBlank( e ) );

                        return new HttpHeaderDefinition( arr[index], arr[index + 1] || arr[index], arr[index + 2] || _mt );
                    }
                }
            }
        }
        else if ( isString( pData ) )
        {
            if ( isJson( pData ) )
            {
                let obj = attempt( () => asObject( pData ) );
                if ( isPopulatedObject( obj ) )
                {
                    return HttpHeaderDefinition.from( obj );
                }
            }
            if ( !isBlank( pData ) )
            {
                let arr = asString( pData, true ).split( /[,:]/ ).filter( e => !isBlank( e ) ).map( e => asString( e, true ) );

                let httpHeaderDef = HttpHeaderDefinition[asString( arr[0], true )] || HttpHeaderDefinition[lcase( asString( arr[0], true ) )];

                return httpHeaderDef || new HttpHeaderDefinition( arr[0], (arr[1] || arr[0]), (arr[2] || _mt) );
            }
        }
        return null;
    };

    HttpHeaderDefinition.fromLiteral = function( pObject )
    {
        if ( isNonNullObject( pObject ) && !isNull( pObject.name ) )
        {
            return new HttpHeaderDefinition( pObject.name, pObject.description || pObject.name, pObject.category || pObject.name );
        }
        return HttpHeaderDefinition.from( pObject );
    };

    /**
     * Represents an HTTP header, encapsulating its definition and value.
     */
    class HttpHeader
    {
        #definition;
        #value;

        constructor( pDefinition, pValue )
        {
            this.#definition = HttpHeaderDefinition.from( pDefinition );
            this.#value = pValue;
        }

        get definition()
        {
            return HttpHeaderDefinition.from( this.#definition );
        }

        get value()
        {
            return asString( this.#value, true );
        }

        get name()
        {
            return asString( this.definition?.name || asString( this.definition ), true );
        }

        toString()
        {
            // RFC 7230 format
            return asString( this.name, true ) + ": " + asString( this.value, true ) + "\r\n";
        }

        toJSON()
        {
            return `{"${this.name}":"${this.value}}`;
        }
    }

    HttpHeader.from = function( pValue, pKey )
    {
        if ( isNonNullObject( pValue ) )
        {
            if ( pValue instanceof HttpHeader )
            {
                return pValue;
            }

            let value = pValue.value || (((isNonNullObject( pKey ) ? (pKey.value || asString( pValue )) : (isString( pKey ) ? asString( pKey ) : (isArray( pValue ) ? ([...pValue][1] || [...pValue][0]) : _mt)))));
            let key = pValue.name || ((isNonNullObject( pKey ) ? (pKey.name || asString( pKey )) : (isString( pKey ) ? asString( pKey ) : (isArray( pKey ) ? ([...pKey][1] || [...pKey][0]) : value))));

            return new HttpHeader( HttpHeaderDefinition.from( pValue || key ), value );
        }
        else
        {
            return new HttpHeader( HttpHeaderDefinition.from( pKey ), pValue );
        }
    };

    HttpHeader.fromLiteral = function( pObject )
    {
        if ( isNonNullObject( pObject ) && !isNull( pObject.value ) )
        {
            const definition = HttpHeaderDefinition.fromLiteral( pObject.definition || pObject.name || pObject );
            return new HttpHeader( definition || pObject?.name || pObject, pObject.value );
        }
        return HttpHeader.from( pObject?.value || pObject, pObject?.name || pObject?.key || pObject );
    };

    /**
     * Returns true if the specified value is a valid/known HTTP Verb (such as GET, POST, PUT, etc.)
     *
     * @param {string|HttpVerb} pVerb the value to evaluate.  This can be a string or an instance of HttpVerb.
     *
     * @returns {boolean} true if the specified value is a valid/known HTTP Verb (such as GET, POST, PUT, etc.)
     */
    const isVerb = ( pVerb ) => pVerb instanceof HttpVerb || VERBS.indexOf( pVerb ) >= 0;

    HttpVerb.isVerb = isVerb;

    /**
     * Returns true if the specified value is a valid/known HTTP Header (or is a custom header, properly prefixed with 'X-')
     * @param pHeader
     * @returns {boolean|boolean|*}
     */
    const isHeader = ( pHeader ) => pHeader instanceof HttpHeaderDefinition || ( !isBlank( asString( pHeader, true ) ) && (Object.keys( HttpHeaderDefinition ).map( lcase ).includes( lcase( asString( pHeader, true ) ) ) || ucase( asString( pHeader, true ) ).startsWith( "X-" )));

    HttpHeader.isHeader = isHeader;

    /**
     * Returns true if the specified value is a known content-type
     * @param {String|HttpContentType} pContentType the value to evaluate
     * @returns {boolean} true if the specified value is a known content-type
     */
    const isContentType = ( pContentType ) => pContentType instanceof HttpContentType || Object.keys( HttpContentType ).map( lcase ).includes( lcase( asString( pContentType, true ) ) );

    HttpContentType.isContentType = isContentType;

    const isHttpStatus = ( pStatus ) => pStatus instanceof HttpStatus || HttpStatus.isStatusCode( pStatus ) || HttpStatus.isStatusText( pStatus );

    HttpStatus.isHttpStatats = isHttpStatus;

    HttpHeaderDefinition.isHeader = isHeader;


    /**
     * A default function for merging property entries in an object.
     *
     * @param {Object} pObject - An object to which a merge operation will be applied.
     * @param {string} pPropertyPath - The path to the property being modified
     * @param {string} pValue - The value to merge with the specified property
     */
    const DEFAULT_PROPERTIES_MERGE_FUNCTION = ( pObject, pPropertyPath, pValue ) =>
    {
        if ( isNonNullObject( pObject ) )
        {
            const name = asString( pPropertyPath, true );

            let mutator = makeAppender( pObject, name );

            return attempt( () => mutator( name, pValue ) );
        }
    };

    class HttpPropertyMergeRule
    {
        #name;
        #mergeFunction;

        constructor( pName, pMergeFunction )
        {
            this.#name = pName;
            this.#mergeFunction = (isFunction( pMergeFunction ) && (3 === pMergeFunction.length)) ? pMergeFunction : DEFAULT_PROPERTIES_MERGE_FUNCTION;
        }

        get name()
        {
            return this.#name;
        }

        get mergeFunction()
        {
            return this.#mergeFunction;
        }

        isValid()
        {
            return (isFunction( this.mergeFunction ) && (3 === this.mergeFunction.length));
        }

        execute( pObject, pKey, pValue )
        {
            if ( this.isValid() )
            {
                return this.mergeFunction( pObject, pKey, pValue );
            }
            return false;
        }
    }

    /**
     * Represents a predefined rule for merging properties
     * that preserves the existing value
     * if it already exists in the provided object.
     *
     * If the property is not present, it resolves
     * and sets the provided value as the property's value.
     *
     * The rule operates by attempting to retrieve an existing value
     * using a case-insensitive name resolution.
     *
     * If a value is found, it remains unchanged.
     *
     * If no value exists, the rule attempts to resolve and set the provided value for the property.
     *
     */
    const PROPERTY_MERGE_RULE_PRESERVE = new HttpPropertyMergeRule( "PRESERVE", ( pObject, pName, pValue ) =>
    {
        if ( isNonNullObject( pObject ) )
        {
            const name = asString( pName, true );

            const value = readProperty( pObject, name ) ?? pValue;

            if ( value )
            {
                setProperty( pObject, name, value );
            }
        }
    } );

    /**
     * A constant representing the rule for merging object properties
     * by replacing the existing property value with the provided value.
     *
     * If the provided value is null or not specified,
     * the existing value is preserved
     *
     */
    const PROPERTY_MERGE_RULE_REPLACE = new HttpPropertyMergeRule( "REPLACE", ( pObject, pName, pValue ) =>
    {
        if ( isNonNullObject( pObject ) )
        {
            const name = asString( pName, true );

            let value = pValue ?? readProperty( pObject, name );

            if ( value )
            {
                setProperty( pObject, name, value );
            }
        }
    } );

    /**
     * A constant representing the rule for merging object properties that are expected to be strings.
     * This rule only replaces an existing property value if the provided value is not null or an empty string.
     *
     * If the provided value is null, not specified, or an empty string,
     * the existing value is preserved
     *
     */
    const PROPERTY_MERGE_RULE_REPLACE_STRING = new HttpPropertyMergeRule( "REPLACE_STRING", ( pObject, pName, pValue ) =>
    {
        if ( isNonNullObject( pObject ) )
        {
            const name = asString( pName, true );

            let value = pValue || readScalarProperty( pObject, _str, name );

            if ( value )
            {
                setProperty( pObject, name, value || pValue );
            }
        }
    } );

    /**
     * Represents a predefined HTTP header merge rule that combines multiple header values.
     * This rule is identified by the name "COMBINE" and uses a default merging function to process header values.
     * It is primarily used in scenarios where header values need to be consolidated while retaining all unique entries.
     */
    const PROPERTY_MERGE_RULE_COMBINE = new HttpPropertyMergeRule( "COMBINE", DEFAULT_PROPERTIES_MERGE_FUNCTION );

    // noinspection JSUnusedLocalSymbols
    const PROPERTY_MERGE_RULE_REMOVE = new HttpPropertyMergeRule( "REMOVE", ( pObject, pName, pValue ) =>
    {
        if ( isNonNullObject( pObject ) )
        {
            const name = asString( pName, true );

            if ( !isBlank( name ) )
            {
                const deleter = makeDeleter( pObject, name );

                return attempt( () => deleter( name ) );
            }
        }
    } );

    HttpPropertyMergeRule["PRESERVE"] = PROPERTY_MERGE_RULE_PRESERVE;
    HttpPropertyMergeRule["REPLACE"] = PROPERTY_MERGE_RULE_REPLACE;
    HttpPropertyMergeRule["REPLACE_STRING"] = PROPERTY_MERGE_RULE_REPLACE_STRING;
    HttpPropertyMergeRule["COMBINE"] = PROPERTY_MERGE_RULE_COMBINE;
    HttpPropertyMergeRule["REMOVE"] = PROPERTY_MERGE_RULE_REMOVE;
    HttpPropertyMergeRule["DELETE"] = PROPERTY_MERGE_RULE_REMOVE;

    HttpPropertyMergeRule.resolveHttpPropertyMergeRule = function( pMergeRule )
    {
        if ( isNonNullObject( pMergeRule ) )
        {
            if ( pMergeRule instanceof HttpPropertyMergeRule )
            {
                return lock( pMergeRule );
            }

            if ( !isBlank( asString( pMergeRule?.name, true ) ) || asInt( pMergeRule?.id ) > 0 )
            {
                if ( isFunction( pMergeRule?.mergeFunction ) && (3 === pMergeRule?.mergeFunction?.length) )
                {
                    return new HttpPropertyMergeRule( asString( pMergeRule.name || "Ad Hoc Rule" ),
                                                      ( pHeaders, pName, pValue ) => pMergeRule.mergeFunction( pHeaders, pName, pValue ) );
                }
            }
        }

        if ( isString( pMergeRule ) )
        {
            let mergeRule = HttpPropertyMergeRule[ucase( asString( pMergeRule, true ) )];
            if ( isNonNullObject( mergeRule ) || mergeRule instanceof HttpPropertyMergeRule )
            {
                return mergeRule;
            }
        }

        return PROPERTY_MERGE_RULE_COMBINE;
    };

    class HttpPropertyRule
    {
        #propertyName;
        #mergeRule = PROPERTY_MERGE_RULE_COMBINE;

        constructor( pPropertyName, pMergeRule )
        {
            this.#propertyName = asString( pPropertyName, true );
            this.#mergeRule = HttpPropertyMergeRule.resolveHttpPropertyMergeRule( pMergeRule );
        }

        get propertyName()
        {
            return asString( this.#propertyName, true );
        }

        get mergeRule()
        {
            return HttpPropertyMergeRule.resolveHttpPropertyMergeRule( this.#mergeRule );
        }

        isValid()
        {
            return !isBlank( this.propertyName ) && this.mergeRule instanceof HttpPropertyMergeRule && this.mergeRule.isValid();
        }

        apply( pObject, pValue )
        {
            if ( this.isValid() )
            {
                return this.mergeRule.execute( pObject, this.propertyName, pValue );
            }
            return false;
        }
    }

    HttpPropertyRule.from = function( pData )
    {
        if ( isNonNullObject( pData ) || isArray( pData ) )
        {
            if ( pData instanceof HttpPropertyRule )
            {
                return pData;
            }

            let data = isArray( pData ) ? pData : objectEntries( pData );

            let name = ObjectEntry.getKey( data );
            let value = ObjectEntry.getValue( data );

            if ( isString( name ) && !isBlank( name ) )
            {
                let mergeRule = isNonNullObject( value ) ? HttpPropertyMergeRule.resolveHttpPropertyMergeRule( value ) : (isString( value ) ? HttpPropertyMergeRule[ucase( value )] : null);

                if ( !isNull( mergeRule ) && mergeRule instanceof HttpPropertyMergeRule )
                {
                    return new HttpPropertyRule( name, mergeRule );
                }

                if ( isFunction( value ) && 3 === value.length )
                {
                    return new HttpPropertyRule( name, new HttpPropertyMergeRule( name, value ) );
                }
            }
        }
        else if ( isString( pData ) )
        {
            if ( isJson( pData ) )
            {
                return HttpPropertyRule.from( attempt( () => parseJson( pData ) ) );
            }

            const propertyName = asString( pData, true );

            return new HttpPropertyRule( propertyName, PROPERTY_MERGE_RULE_COMBINE );
        }
        return null;
    };

    const defineHttpPropertyRules = function( pRules )
    {
        let rules = {};

        if ( isNull( pRules ) || !(isObject( pRules ) || isArray( pRules )) )
        {
            return rules;
        }

        if ( isNonNullObject( pRules ) )
        {
            const propertyRulesFilter = e => isString( ObjectEntry.getKey( e ) )
                                             && ObjectEntry.getValue( e ) instanceof HttpPropertyRule;

            if ( objectEntries( pRules ).every( propertyRulesFilter ) )
            {
                return pRules;
            }
        }

        const entries = (isArray( pRules ) && asArray( pRules ).every( e => isNonNullObject( e ) || isArray( e ) )) ?
                        asArray( pRules ) :
                        objectEntries( pRules );

        for( let entry of entries )
        {
            let httpPropertyRule = HttpPropertyRule.from( entry );
            if ( isNonNullObject( httpPropertyRule ) && httpPropertyRule.isValid() )
            {
                rules[httpPropertyRule.propertyName] = httpPropertyRule;
            }
        }

        return rules;
    };


    /**
     * This class is used to create an intelligent way
     * to merge one or more objects expect to have the same form.
     *
     */
    class HttpPropertiesMerger
    {
        #rules;

        #options = FAST_OBJECT_LITERAL_OPTIONS;

        #deepCopy = false;

        #maxDepth = FAST_OBJECT_LITERAL_OPTIONS.maxDepth;

        constructor( pPropertyRules, pDeepCopy = false, pOptions = FAST_OBJECT_LITERAL_OPTIONS )
        {
            this.#rules = defineHttpPropertyRules( pPropertyRules );

            this.#deepCopy = !!pDeepCopy;

            this.#options = { ...FAST_OBJECT_LITERAL_OPTIONS, ...(pOptions || {}) };

            this.#maxDepth = this.#options?.maxDepth;
        }

        get options()
        {
            return { ...FAST_OBJECT_LITERAL_OPTIONS, ...(this.#options || {}) };
        }

        get deepCopy()
        {
            return !!this.#deepCopy;
        }

        get maxDepth()
        {
            return asInt( this.#maxDepth, 5 );
        }

        get rules()
        {
            return this.#rules;
        }

        getRule( pPropertyName )
        {
            return readProperty( (this.rules || {}), pPropertyName );
        }

        mergeProperties( pObject, ...pOthers )
        {
            let objects = [pObject, ...(asArray( pOthers || [] ))].filter( isNonNullObject );

            if ( $ln( objects ) > 1 )
            {
                let object = objects.shift();

                if ( $ln( objects ) > 0 )
                {
                    if ( isReadOnly( object ) )
                    {
                        object = { ...object };
                    }
                    object = this.#deepCopy ? localCopy( object ) : ((isFunction( object?.clone )) ? object.clone() : object);
                }

                while ( $ln( objects ) > 0 )
                {
                    let obj = objects.shift();

                    let entries = isFunction( obj.entries ) ? [...(obj.entries())] : objectEntries( obj );

                    if ( entries && $ln( entries ) )
                    {
                        for( let entry of entries )
                        {
                            const name = ObjectEntry.getKey( entry );

                            if ( isBlank( name ) )
                            {
                                continue;
                            }

                            let value = ObjectEntry.getValue( entry );

                            if ( this.#deepCopy && isNonNullObject( value ) )
                            {
                                value = isFunction( value?.clone ) ? value.clone() : localCopy( value );
                            }

                            const rule = this.getRule( name );

                            if ( rule && rule.isValid() )
                            {
                                rule.apply( object, value );
                            }
                            else
                            {
                                let existing = readProperty( object, name );
                                setProperty( object, name, value || existing );
                            }
                        }
                    }
                }
                return object;
            }
            else
            {
                let object = $ln( objects ) > 0 ? asObject( objects[0] ?? {} ) : (pObject ?? {});

                object = this.#deepCopy ? localCopy( object ) : (isFunction( object?.clone ) ? object.clone() : (object ?? {}));

                return object;
            }
        }
    }

    HttpPropertiesMerger.defineHttpPropertyRules = defineHttpPropertyRules;

    /**
     * Returns a string representing a URL (or URI).
     *
     * In the expected case, the url has been passed in as a string,
     * and this function simply makes sure it is 'clean' (see StringUtils.cleanUrl)
     *
     * In edge cases, (for example, the first argument is null or not a string),
     * the url is sought by looking for a property of the second argument.
     *
     * If that does not produce a string, we check for the possibility
     * that the first argument or second argument is a Request or URL (object).
     *
     * If none of those options result in a non-blank string,
     * we enter a constrained loop (limited to 5 iterations)
     * in an attempt to find a suitable value to treat as and return as a url.
     *
     * @param pUrl
     * @param pConfig
     * @returns {*|string}
     */
    function resolveUrl( pUrl, pConfig )
    {
        if ( isString( pUrl ) && !isBlank( pUrl ) )
        {
            return cleanUrl( asString( pUrl, true ) );
        }

        let url = pUrl || pConfig?.url || pConfig;

        if ( isNonNullObject( url ) )
        {
            if ( _ud !== typeof Request )
            {
                if ( url instanceof Request )
                {
                    url = url.url || pConfig?.url;
                }
                else if ( pConfig instanceof Request )
                {
                    url = pConfig.url;
                }
            }

            if ( isUrl( url ) )
            {
                url = cleanUrl( pUrl.href || asString( pUrl, true ) );
            }
            else if ( isUrl( pConfig ) )
            {
                url = cleanUrl( pConfig.href || asString( pConfig, true ) );
            }

            // This code tries to "dig" the url out of some potentially nested object structure.
            // During each iteration, the variable, url, is assigned to the url property
            // of the last object assigned to the variable or a string, if found.
            // The iteration ends when the variable, url, is a string or the variable is null
            // or the count has reached 5
            let count = 0;
            while ( (( !isString( url ) || isBlank( url )) && isNonNullObject( url )) && count++ < 5 )
            {
                url = isUrl( url ) ? url.href || asString( url, true ) : url.url;
            }
        }

        return isString( url ) ? cleanUrl( url || _mt ) : _mt;
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    HttpVerb,
                    HttpHeaderDefinition,
                    HttpHeader,
                    HttpStatus,
                    HttpContentType,
                    HttpPropertiesMerger
                },
            STATUS_CODES: lock( STATUS_CODES ),
            STATUS_TEXT: lock( STATUS_TEXT_BY_CODE_STRING ),
            STATUS_TEXT_ARRAY: lock( STATUS_TEXT_BY_INT_VALUE ),
            STATUS_ELIGIBLE_FOR_RETRY: lock( STATUS_ELIGIBLE_FOR_RETRY ),
            DEFAULT_RETRY_DELAY: lock( DEFAULT_RETRY_DELAY ),
            VERBS: lock( VERBS ),
            MODES: lock( MODES ),
            PRIORITY: lock( PRIORITY ),
            CONTENT_TYPES: lock( CONTENT_TYPES ),
            TYPES: lock( CONTENT_TYPES ),
            HTTP_HEADERS: lock( HTTP_HEADERS ),
            HttpVerb,
            HttpHeaderDefinition,
            HttpHeader,
            HttpStatus,
            HttpContentType,
            HttpPropertyRule,
            HttpPropertiesMerger,
            HttpPropertyMergeRule,
            isVerb,
            isHeader,
            isContentType,
            isHttpStatus,
            resolveUrl,
            resolveHttpMethod: function( pMethod = VERBS.GET, pConfig = {} )
            {
                return HttpVerb.resolveHttpMethod( pMethod, pConfig );
            },
            calculatePriority
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
