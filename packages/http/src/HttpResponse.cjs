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

// import the HTTP constants
const httpConstants = require( "./HttpConstants.cjs" );

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

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_RESPONSE__";

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
            httpHeaders
        };

    const { ToolBocksModule } = moduleUtils;

    const
        {
            isNull,
            isObject,
            isArray,
            isMap,
            isFunction
        } = typeUtils;


    const { asString, isBlank } = stringUtils;

    const { isHeader } = httpConstants;


    const modName = "HttpResponse";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );


    class HttpResponse extends EventTarget
    {
        #response;

        #url;

        #headers;
        #body;
        #bodyUsed;

        #status;
        #statusText;
        #ok;

        #type;

        constructor( pResponse, pOptions )
        {
            super();
        }
    }

    let mod =
        {
            dependencies,
            classes:
                {},
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
