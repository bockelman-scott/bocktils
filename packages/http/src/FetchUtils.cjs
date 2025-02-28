// requires the core modules
const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

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
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    const {
        _mt_str,
        _underscore,
        no_op,
        populateOptions,
        moduleUtils,
        asyncAttempt
    } = constants;

    const { ToolBocksModule, ModuleEvent } = moduleUtils;


    const modName = "FetchUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const { isNull, isFunction } = typeUtils;

    const { asString, asInt } = stringUtils;

    const { asArray, asArgs } = arrayUtils;

    const {
        HttpRequest,
        cloneRequest = function( pRequest ) { return isNull( pRequest ) ? null : isFunction( pRequest?.clone ) ? pRequest.clone() : pRequest; }
    } = httpRequest;

    const {
        HttpResponse,
        cloneResponse = function( pResponse ) { return isNull( pResponse ) ? null : isFunction( pResponse?.clone ) ? pResponse.clone() : pResponse; }
    } = httpResponse;


    class Fetcher extends EventTarget
    {
        constructor( pOptions )
        {
            super();
        }
    }


}());