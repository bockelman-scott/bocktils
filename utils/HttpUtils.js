const constants = require( "./Constants.js" );
const stringUtils = require( "./StringUtils.js" );
const arrayUtils = require( "./ArrayUtils.js" );
const objectUtils = require( "./ObjectUtils.js" );

const _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeHttpUtils()
{
    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK_HTTP_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    class UnrecognizedRequestError extends IllegalArgumentError
    {
        constructor( pMessage, pOptions, pLineNumber )
        {
            super( pMessage, pOptions, pLineNumber );
        }

        get type()
        {
            return "UnrecognizedRequestError";
        }
    }

    const loadNodeFetch = function()
    {
        let nodeFetch = null;

        try
        {
            nodeFetch = objectUtils.isUndefined( fetch ) ? require( "node-fetch" ) : fetch;
        }
        catch( ex )
        {

        }

        return nodeFetch;
    };

    const local_fetch = (objectUtils.isUndefined( fetch ) ? loadNodeFetch() : fetch);

    const VERBS =
        {
            GET: "GET",
            POST: "POST",
            PUT: "PUT",
            PATCH: "PATCH",
            HEAD: "HEAD",
            OPTIONS: "OPTIONS",
            DELETE: "DELETE",
            CONNECT: "CONNECT",
            TRACE: "TRACE"
        };

    const CONTENT_TYPES =
        {
            PLAIN: "text/plain",
            TEXT: "text/plain",
            HTML: "text/html",
            CSS: "text/css",
            JAVASCRIPT: "application/javascript",
            JS: "application/javascript",
            JSON: "application/json",
            ECMASCRIPT: "application/ecmascript"
        };

    const TYPES =
        {
            PLAIN: "plain",
            TEXT: "text",
            HTML: "html",
            CSS: "css",
            JAVASCRIPT: "javascript",
            JS: "javascript",
            JSON: "json",
            ECMASCRIPT: "ecmascript"
        };

    const STATUS_CODES =
        {
            OK: 200,
            MOVED: 301,
            ERROR: 400,
            UNAUTHORIZED: 401,
            NOT_ALLOWED: 403,
            NOT_FOUND: 404,
            METHOD_NOT_ALLOWED: 405,
            INTERNAL_SERVICE_ERROR: 500,
            SERVICE_UNAVAILABLE: 503
        };

    const LARGEST_SUCCESS_STATUS_CODE = 299;

    const STATUS_TEXT =
        {
            200: "OK",
            400: "ERROR",
            401: "UNAUTHORIZED",
            403: "NOT_ALLOWED",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            500: "INTERNAL_SERVICE_ERROR",
            503: "SERVICE_UNAVAILABLE"
        };

    const HTTP_STATUS =
        {
            OK: { CODE: STATUS_CODES.OK, NAME: "Success" },
            ERROR: { CODE: STATUS_CODES.ERROR, NAME: "Error" },
            UNAUTHORIZED: { CODE: STATUS_CODES.UNAUTHORIZED, NAME: "Authentication or Authorization Failed" },
            NOT_ALLOWED: { CODE: STATUS_CODES.NOT_ALLOWED, NAME: "Forbidden" },
            NOT_FOUND: { CODE: STATUS_CODES.NOT_FOUND, NAME: "Resource Not Found" },
            METHOD_NOT_ALLOWED: { CODE: STATUS_CODES.METHOD_NOT_ALLOWED, NAME: "Unsupported HTTP Method" },
            INTERNAL_SERVICE_ERROR: { CODE: STATUS_CODES.INTERNAL_SERVICE_ERROR, NAME: "Something went wrong" },
            SERVICE_UNAVAILABLE: { CODE: STATUS_CODES.SERVICE_UNAVAILABLE, NAME: "The service is not available" }
        };

    const getStatusDescription = function( pCode )
    {
        const code = asString( pCode, true ).trim();

        const text = STATUS_TEXT[pCode];

        if ( !isBlank( text ) )
        {
            return asString( text, true ).trim();
        }

        return ucase( code );
    };

    const isOkay = function( pStatusCode )
    {
        const code = asInt( pStatusCode );

        return (code >= STATUS_CODES.OK && code < STATUS_CODES.MOVED) || code > 1_000;
    };

    const cloneResponse = function( pResponse )
    {
        let response = pResponse || new Response( _mt_str, { status: 404, statusText: "Not Found" } );

        if ( response && response.ok )
        {
            try
            {
                response = response.bodyUsed ? response : response.clone();

                return response;
            }
            catch( ex )
            {
                konsole.warn( "Could not clone the response", ex.message );
            }
        }

        return pResponse;
    };

    /**
     * Returns the text fetched from the server (or cache), cleaned and ready to be used in a return statement for execution
     * @param {Response} pResponse - the Response from the server or cache
     * @param {string} pDefault - text to return if the response is missing or empty
     * @returns the text fetched from the server (or cache), cleaned and ready to be used in a return statement for execution
     */
    const getResponseText = async function( pResponse, pDefault )
    {
        let defaultText = (_mt_str + tidy( pDefault || _mt_str ));

        defaultText = tidy( defaultText.replace( _rxCrLf, _lf ).trim() );

        let response = pResponse || new Response( defaultText || _mt_str, { status: HTTP_OK, statusText: "ok" } );

        let text = tidy( defaultText || _mt_str );

        if ( response && response.ok )
        {
            response = cloneResponse( response );

            text = await response.text();

            if ( text )
            {
                text = tidy( text );
            }
        }

        return tidy( tidy( text || tidy( defaultText || _mt_str ) ).replace( _rxCrLf, _lf ).trim() );
    };

    const _responseContent = async function( pResponse, pType )
    {
        let response = pResponse || {};

        let content = null;

        let type = pType;

        if ( response && response.ok )
        {
            try
            {
                response = cloneResponse( response );

                const headers = response?.headers || { get: function( pName ) { return _mt_str; } };

                const contentType = (headers.get( "Content-Type" ) || _mt_str);

                const parts = contentType.split( /(\\\/)|(\/)/ ) || [(contentType || pType || _mt_str)];

                type = (pType || parts[parts.length - 1] || _mt_str).toLowerCase();

                switch ( type )
                {
                    case CONTENT_TYPES.PLAIN:
                    case TYPES.PLAIN:
                    case CONTENT_TYPES.TEXT:
                    case TYPES.TEXT:
                    case CONTENT_TYPES.HTML:
                    case TYPES.HTML:
                    case CONTENT_TYPES.CSS:
                    case TYPES.CSS:
                    case CONTENT_TYPES.JAVASCRIPT:
                    case TYPES.JAVASCRIPT:
                    case CONTENT_TYPES.ECMASCRIPT:
                    case TYPES.ECMASCRIPT:
                    case _str:
                        if ( contentType.endsWith( TYPES.JSON ) )
                        {
                            try
                            {
                                let res = response.bodyUsed ? response : response.clone();

                                content = await res.json();

                                content = JSON.stringify( content );

                                break;
                            }
                            catch( exJson )
                            {
                                konsole.warn( exJson );
                            }
                        }

                        content = await response.text();

                        break;

                    case "json":
                        if ( contentType.endsWith( TYPES.PLAIN ) || contentType.endsWith( TYPES.TEXT ) )
                        {
                            try
                            {
                                let res = cloneResponse( response );

                                content = await res.text();

                                content = JSON.parse( content );

                                break;
                            }
                            catch( exJson )
                            {
                                konsole.warn( exJson );
                            }
                        }

                        content = await response.json();

                        break;

                    default:
                        content = await response.blob();

                        break;
                }
            }
            catch( ex )
            {
                konsole.warn( "Could not read ", type, "from", (response?.url || "response"), "\n", ex.message );
            }
        }

        return content;
    };

    const _responseText = async function( pResponse )
    {
        return await _responseContent( pResponse, CONTENT_TYPES.text ) || await getResponseText( pResponse, _mt_str );
    };

    const _responseJson = async function( pResponse )
    {
        return await _responseContent( pResponse, "json" );
    };

    const _responseHeaders = function( pResponse )
    {
        const response = (pResponse && pResponse.ok) ? cloneResponse( pResponse ) : {};

        const responseHeaders = response?.headers || new Headers();

        return new Headers( responseHeaders );
    };


    const _contentType = function( pResponse, pDefault )
    {
        const defaults = { "Content-type": (pDefault || "text/plain") };

        const headers = _responseHeaders( pResponse, defaults ) || new Headers( defaults );

        const type = headers.get( "Content-Type" ) || headers.get( "content-type" );

        return tidy( type ) || pDefault;
    };

    const httpFetch = async function( pUrl, pPostData )
    {
        let url = stringUtils.asString( pUrl, true );

        let response = null;

        try
        {
            const req = pPostData ? new Request( url, { method: "POST", body: pPostData } ) : new Request( url );

            response = await local_fetch( req );
        }
        catch( ex )
        {
            konsole.warn( "Could not fetch", url, ex.message );
        }

        if ( response && response.ok )
        {
            return cloneResponse( response );
        }

        return constants._mt_str;
    };

    const doGet = function( pUrl )
    {
        return httpFetch( pUrl );
    };

    const doPost = function( pUrl, pPostData )
    {
        return httpFetch( pUrl, pPostData );
    };

    const doPut = function( pUrl, pPostData, pId )
    {
        return httpFetch( pUrl, pPostData );
    };

    const doPatch = doPut;

    const doDelete = function( pUrl, pPostData, pId )
    {

    };

    const unsupported = async function( req, res )
    {
        res.status( STATUS_CODES.METHOD_NOT_ALLOWED ).send( HTTP_STATUS.METHOD_NOT_ALLOWED.NAME );
    };

    const unsupportedSync = function( req, res )
    {
        res.status( STATUS_CODES.METHOD_NOT_ALLOWED ).send( HTTP_STATUS.METHOD_NOT_ALLOWED.NAME );
    };

    const mod =
        {
            VERBS,
            STATUS_CODES,
            STATUS_TEXT,
            HTTP_STATUS,
            CONTENT_TYPES,
            TYPES,
            LARGEST_SUCCESS_STATUS_CODE,
            getStatusDescription,
            isOkay,
            unsupportedHandler: unsupported,
            unsupportedSynchronousHandler: unsupportedSync
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
