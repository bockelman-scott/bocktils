/**
 * @fileOverview
 * This module defines a wrapper for HttpResponse or Response objects<br>
 * <br>
 *
 * @module ResponseData
 *
 * @author Scott Bockelman
 * @license MIT
 */

/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

/**
 * This statement imports JSON Utilities
 * that can handle circular references and internal references
 */
const jsonUtils = require( "@toolbocks/json" );

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

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_RESPONSE_DATA__";

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
            arrayUtils
        };

    const { ModuleEvent, ToolBocksModule, ObjectEntry, objectEntries, lock, attempt, attemptAsync } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str } = constants;

    const { isNull, isNonNullObject, isError, isString } = typeUtils;

    const { asString, asInt, lcase, ucase, capitalize } = stringUtils;

    const { parseJson, asJson } = jsonUtils;

    const modName = "ResponseData";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );


    class ResponseData
    {
        status;
        statusText;
        data;
        headers;
        config;
        request;
        error;

        constructor( pResponse, pError, pConfig, pUrl )
        {
            if ( isNonNullObject( pResponse ) )
            {
                // some frameworks return an error as a response with the response as a property of the error,
                // see Axios as an example
                this.response = pResponse.response || pResponse;

                this.status = this.response?.status || pResponse.status || 666;
                this.statusText = this.response?.statusText || pResponse.statusText || pResponse.message || _mt;
                this.data = this.response?.data || pResponse.data || {};
                this.headers = this.response?.headers || pResponse.headers || pResponse.config?.headers || pConfig?.headers || pConfig;
                this.config = this.response?.config || pResponse.config || pConfig;
                this.request = this.response?.request || pResponse.request ||
                    {
                        url: asString( pUrl, true ),
                        config: pConfig || {}
                    };
                this.url = asString( pUrl, true ) || this.request?.url || _mt;
            }

            this.error = isNonNullObject( pResponse.response ) ? resolveError( pResponse ) || resolveError( pError ) : resolveError( pError );
        }

        get ok()
        {
            return ([200, 201, 204].includes( asInt( this.status ) )) || this?.response.ok;
        }

        isError()
        {
            return ( !isNull( this.error ) && isError( this.error )) || (this.status < 200 || this.status >= 400);
        }

        isRedirect()
        {
            return ([301, 302, 303, 307, 308].includes( asInt( this.status ) ));
        }

        isUseCached()
        {
            return ([304].includes( asInt( this.status ) ));
        }

        isClientError()
        {
            return ([400, 406, 411, 412, 413, 414, 415, 416, 418, 421, 422, 431].includes( asInt( this.status ) ));
        }

        isExceedsRateLimit()
        {
            return ([429, 425].includes( asInt( this.status ) ));
        }

        get redirectUrl()
        {
            if ( this.isRedirect() )
            {
                return this.headers?.location || this.headers?.Location;
            }
            return _mt;
        }

        async body()
        {
            return this.data || await this.response?.body();
        }

        async json()
        {
            const me = this;

            if ( isNonNullObject( this.data ) )
            {
                return this.data;
            }
            else if ( isString( this.data ) )
            {
                let obj = attempt( () => parseJson( (me || this).data ) );
                if ( isNonNullObject( obj ) )
                {
                    return obj;
                }
            }
            return {};
        }

        async text()
        {
            return asString( this.data || _mt );
        }

        clone()
        {
            return new ResponseData( Object.assign( {}, this.response ),
                                     this.error || null,
                                     this.config,
                                     this.url );
        }

        static fromResponse( pResponse, pConfig, pUrl )
        {
            return new ResponseData( pResponse,
                                     (isNonNullObject( pResponse.response ) ? pResponse : null),
                                     pConfig,
                                     pUrl );
        }

        static fromError( pError, pConfig, pUrl )
        {
            return new ResponseData( (pError?.response || pError),
                                     pError,
                                     pConfig,
                                     pUrl );
        }

        static fromObject( pObject, pConfig, pUrl )
        {
            if ( isNonNullObject( pObject ) )
            {
                // if the framework returns an error,
                // the response may be a property of the error
                // see https://axios-http.com/docs/handling_errors, for example

                let response = pObject.response || pObject;

                let responseData = new ResponseData( response,
                                                     response?.error || pObject,
                                                     pConfig || response.config,
                                                     pUrl || response.request?.url );

                let entries = attempt( () => [...(objectEntries( pObject ) || [])] );

                attempt( () => entries.forEach( ( entry ) =>
                                                {
                                                    attempt( () => responseData[entry.key] = (responseData[entry.key] || entry.value) );
                                                } ) );

                return responseData;
            }

            return ResponseData.fromError( new Error( "No Response was Received" ),
                                           pConfig,
                                           pUrl );
        }
    }

    ResponseData.isResponseData = function( pResponseData )
    {
        return isNonNullObject( pResponseData ) && pResponseData instanceof ResponseData;
    };

    ResponseData.from = function( pValue, pConfig, pUrl )
    {
        if ( ResponseData.isResponseData( pValue ) )
        {
            return pValue;
        }

        if ( isError( pValue ) )
        {
            return ResponseData.fromError( pValue, pConfig, pUrl );
        }

        if ( isNonNullObject( pValue ) )
        {
            if ( Object.hasOwn( pValue, "status" ) &&
                 Object.hasOwn( pValue, "headers" ) &&
                 Object.hasOwn( pValue, "data" ) )
            {
                return new ResponseData( pValue,
                                         null,
                                         (pValue.config || pConfig || {}),
                                         (pValue.request?.url || pValue.config?.url || pUrl || _mt) );
            }
        }

        return null;
    };

    ResponseData.isOk = function( pResponseData )
    {
        return isNonNullObject( pResponseData ) && pResponseData.ok;
    };

    ResponseData.is = function( pResponseData, pWhat )
    {
        return ResponseData.isResponseData( pResponseData ) &&
               attempt( () => pResponseData[("is" + pWhat)]() );
    };


}());
