/**
 * This file defines classes and functions for handling a response from Express
 * and transforming to a canonical format for use by other APIs
 * or adding functionality (via Decorator Pattern)
 */

const http = require( "http" );
const https = require( "https" );

const constants = require( "./Constants.js" );
const stringUtils = require( "./StringUtils.js" );
const arrayUtils = require( "./ArrayUtils.js" );
const objectUtils = require( "./ObjectUtils.js" );
const jsonUtils = require( "./JsonUtils.js" );
const guidUtils = require( "./GUIDUtils" );

const httpUtils = require( "./HttpUtils" );
const requestUtils = require( "./RequestUtils.js" );

/**
 * Imports the Express HTTP Server functionality
 */
const express = require( "express" );

/**
 * Imports the middleware to read a request body
 */
const bodyParser = require( "body-parser" );

/**
 * Imports the middleware to read a multipart form request body
 */
const multipartParser = require( "multer" );

/**
 * Imports the middleware to read cookies from a request
 */
const cookieParser = require( "cookie-parser" );


// Defines the type of undeclared or unassigned variables, used to determine how to expose this module
const _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeResponseUtils()
{
    const INTERNAL_NAME = "__BOCK__RESPONSE_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    let _mt_str = constants._mt_str || "";

    let _str = constants._str || "string";
    let _obj = constants._obj || "object";
    let _fun = constants._fun || "function";

    let asString = stringUtils.asString || function( s ) { return (_mt_str + s).trim(); };
    let isBlank = stringUtils.isBlank || function( s ) { return _mt_str === (_mt_str + s).trim(); };
    let rightOfLast = stringUtils.rightOfLast || function( s, a ) { return asString( s ).slice( s.lastIndexOf( a ) ); };

    let isObject = objectUtils.isObject || function( pObj ) { return _obj === typeof pObj; };
    let isPopulated = objectUtils.isPopulated || function( pObj ) { return isObject( pObj ) && Object.keys( pObj )?.length; };

    let IterationCap = objectUtils.IterationCap;

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const RequestContext = requestUtils.RequestContext;
    const RequestAdapter = requestUtils.RequestAdapter;

    const ServerResponse = http.ServerResponse;

    const generateResponseId = function( pResponse )
    {
        return pResponse?.id || pResponse?.responseId || guidUtils.guid();
    };

    class ResponseContext extends RequestContext
    {
        constructor( pRequestId, pStatus, pHeaders, pBody, pErrors, pSent, pOptions )
        {
            super( pRequestId, pOptions );

            this.status = pStatus || httpUtils.STATUS_CODES.OK;
            this.body = pBody || _mt_str;
            this.headers = pHeaders;
            this.errors = [].concat( asArray( pErrors || [] ) );
            this.sent = pSent;
        }

        update( pStatus, pHeaders, pBody, pErrors, pSent )
        {
            this.status = pStatus || this.status;
            this.body = pBody || this.body;
            this.headers = pHeaders || this.headers;
            this.errors = [].concat( asArray( pErrors || this.errors ) ) || this.errors;
            this.sent = pSent || this.sent;
        }

        updateFrom( pContext )
        {
            this.update( pContext?.status, pContext?.headers, pContext?.body, pContext?.errors, pContext?.sent );
        }

        static fromResponse( pResponse, pErrors, pSent, pRequestId, pOptions )
        {
            return new ResponseContext( pRequestId, pResponse.status, pResponse.headers, pResponse.body, pErrors, pSent, pOptions );
        }

        static fromContext( pContext )
        {
            return new ResponseContext( pContext?.requestId, pContext?.status, pContext?.headers, pContext?.body, pContext?.errors, pContext?.sent, pContext?.options );
        }
    }

    const getHttpServerResponse = function( pResponse )
    {
        let res = pResponse || pResponse?.original || {};

        const iterationCap = new IterationCap( 12 );

        while ( null != res && !(res instanceof ServerResponse) && !iterationCap.reached )
        {
            res = res.prototype;

            if ( null == res || null == res.prototype )
            {
                break;
            }
        }

        return res || pResponse?.original?.prototype || pResponse?.original || pResponse;
    };

    const unwrapResponse = function( pResponse )
    {
        let res = pResponse || {};

        if ( isObject( pResponse ) )
        {
            let original = res?.original || pResponse || res;

            let response = pResponse || original;

            const iterationCap = new IterationCap( 12 );

            while ( ((response instanceof ResponseAdapter) || (null == original || original instanceof ResponseAdapter)) && !iterationCap.reached )
            {
                original = response?.original || res?.original;
                response = original;
            }

            return original || response?.original || res?.original || res;
        }

        return res || pResponse;
    };

    class ResponseAdapter
    {
        constructor( pResponse, pOptions )
        {
            this._options = Object.assign( {}, pOptions || {} );

            this._original = unwrapResponse( pResponse ) || pResponse;

            this._nativeResponse = getHttpServerResponse( pResponse || this.original );

            this._app = this.original?.app || $scope().expressServer;

            this._statusCode = httpUtils.STATUS_CODES.INTERNAL_SERVICE_ERROR; // initially

            this._headers = Object.assign( {}, this._original?.headers || {} );

            this._headersSent = this.original?.headersSent || false;

            this._locals = this._original?.locals || {};

            this._data = this.original?.data || {};

            this._config = this.original?.config || {};

            this._request = this.original?.request || this.original?.req;

            this._body = this.original?.body || pResponse?.body || _mt_str;

            this._id = this._request?.id || this._request?.requestId || this._id || generateResponseId( this.original );
        }

        get id()
        {
            return this._id || generateResponseId( this );
        }

        get options()
        {
            return Object.assign( {}, (this._options || this._config) );
        }

        get original()
        {
            return this._original;
        }

        get nativeResponse()
        {
            return this._nativeResponse || this.original;
        }

        get app()
        {
            return this._app || this.original?.app || (require( "express" )());
        }

        get headers()
        {
            return this._headers || this.original.headers || {};
        }

        set headers( pHeaders )
        {
            if ( isObject( pHeaders ) && isPopulated( pHeaders ) )
            {
                const entries = objectUtils.getEntries( pHeaders );

                for( let entry of entries )
                {
                    this.set( entry[0], entry[1] );
                }
            }
        }

        get config()
        {
            return this._config || this.original?.config || {};
        }

        set config( pConfig )
        {
            this._config = this._config || {};

            if ( !(_ud === typeof pConfig || null === pConfig) )
            {
                if ( isObject( pConfig ) )
                {
                    this._config = pConfig || this._config || {};
                }
                else
                {
                    this._config[pConfig] = pConfig;
                }
            }
        }

        get body()
        {
            return this._body || this.original?.body || _mt_str;
        }

        set body( pBody )
        {
            this._body = pBody || this._body;
        }

        get data()
        {
            this._data = this._data || this.original?.data || {};

            return this._data || this.original?.data || {};
        }

        set data( pData )
        {
            this._data = this._data || {};

            if ( !(_ud === typeof pData || null === pData) )
            {
                if ( isObject( pConfig ) )
                {
                    this._data = pData || this._data || this.config || {};
                }
                else
                {
                    this._data[pData] = pData;
                }
            }
        }

        get request()
        {
            this._request = (this._request instanceof RequestAdapter) ? this._request : new RequestAdapter( this._request || this.original?.request );

            return this._request || this.original?.req;
        }

        get locals()
        {
            this._locals = this._locals || this.original?.locals || {};

            return this._locals || this.original?.locals || {};
        }

        append( pField, pValue )
        {
            const currentValue = (this._headers[pField] || this._original.get( pField ) || _mt_str);

            this._headers[pField] = (currentValue ? (currentValue + ", " + (pValue || pField)) : (pValue || pField));

            this.original.append( pField, pValue );

            return this;
        }

        set( pField, pValue )
        {
            if ( _obj === typeof pField )
            {
                const entries = Object.entries( pField );

                for( let entry of entries )
                {
                    try
                    {
                        this.set( entry[0], entry[1] );
                    }
                    catch( ex )
                    {
                        // ignored
                    }
                }
            }
            else
            {
                this._headers[pField] = pValue;
                this.original.set( pField, pValue );
            }

            return this;
        }

        attachment( pFilename )
        {
            const filename = asString( pFilename, true );

            if ( !isBlank( filename ) )
            {
                this.set( "Content-Disposition", "attachment; filename=\"" + pFilename + "\"" );

                const ext = (_dot + (rightOfLast( filename, _dot )).replace( /^\./, _mt_str ));

                if ( _fun === typeof this._original.type )
                {
                    this._original.type( ext );
                }

                this.original.attachment( filename );
            }
            else
            {
                this.set( "Content-Disposition", "attachment" );
                this.original.attachment();
            }

            return this;
        }

        cookie( pName, pValue, pOptions )
        {
            const options = Object.assign( {}, pOptions || {} );

            let value = asString( pValue );

            if ( isPopulated( options ) )
            {
                const entries = Object.entries( options );

                for( let entry of entries )
                {
                    value += (";" + entry[0] + "=" + entry[1]);
                }
            }

            this.append( "Set-Cookie", value );

            this.original.cookie( pName, value, options );

            return this;
        }

        clearCookie( pName, pOptions )
        {
            this.original.clearCookie( pName, pOptions );
            // TODO: symetric

            return this;
        }

        download( pPath, pFilename, pOptions, pCallback )
        {
            this.original.download( pPath, pFilename, pOptions, pCallback );

            return this;
        }

        end( pData, pEncoding )
        {
            this.original.end( pData, pEncoding );

            return this;
        }

        format( pObject )
        {
            this.original.format( pObject );

            return this;
        }

        get( pField )
        {
            return this.original.get( pField ) || this.headers[pField];
        }

        json( pObject )
        {
            this._body = isObject( pObject ) ? jsonUtils.jsonify( pObject ) : pObject;

            this.original.json( pObject );

            return this;
        }

        jsonp( pObject )
        {
            this._body = isObject( pObject ) ? jsonUtils.jsonify( pObject ) : pObject;

            this.original.jsonp( pObject );

            return this;
        }

        links( pLinks )
        {
            this.original.links( pLinks );

            return this;
        }

        location( pPath )
        {
            this.original.location( pPath );

            return this;
        }

        redirect( pStatus = 302, pPath )
        {
            this.original.redirect( pStatus, pPath );

            return this;
        }

        render( pView, pLocals, pCallback )
        {
            this.original.render( pView, pLocals, pCallback );

            return this;
        }

        send( pBody )
        {
            this._body = pBody || this.body;

            this.original.send( pBody || this.body );

            return this;
        }

        sendFile( pPath, pOptions, pCallback )
        {
            this.original.sendFile( pPath, pOptions || this.options, pCallback );

            return this;
        }

        sendStatus( pStatusCode )
        {
            this._statusCode = Math.min( Math.max( 100, asInt( pStatusCode, pStatusCode?.code || httpUtils.STATUS_CODES.OK ) ), 600 );

            this.original.statusCode = this._statusCode;

            this.original.sendStatus( pStatusCode );

            return this;
        }

        status( pStatusCode )
        {
            this._statusCode = Math.min( Math.max( 100, asInt( pStatusCode, pStatusCode?.code || httpUtils.STATUS_CODES.OK ) ), 600 );

            this.original.statusCode = this._statusCode;

            return this;
        }

        type( pType )
        {
            this._type = pType;

            this.original.type( pType );

            return this;
        }

        vary( pField )
        {
            this.original.vary( pField );

            return this;
        }
    }

    class ResponseReader
    {
        constructor( pResponse, pOptions )
        {
            this._original = unwrapResponse( pResponse );

            this._nativeResponse = getHttpServerResponse( this._original || pResponse );
        }

    }

    /**
     * Can be used to prevent responding to the same request more than once
     * // TODO...
     */
    class ResponseTracker
    {
        constructor()
        {

        }
    }

    const mod =
        {
            ResponseAdapter,
            ResponseReader,
            ResponseContext
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
