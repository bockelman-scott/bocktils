/**
 * This file provides useful functions for interrogating the current execution environment
 */
const os = require('os');

const proc = process || os;

const utils = require( "./CommonUtils.js" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../utils/CommonUtils.js
 */
const constants = utils?.constants || require( "../utils/Constants.js" );
const typeUtils = utils?.typeUtils || require( "../utils/TypeUtils.js" );
const stringUtils = utils?.stringUtils || require( "../utils/StringUtils.js" );
const arrayUtils = utils?.arrayUtils || require( "../utils/ArrayUtils.js" );
const objectUtils = utils?.objectUtils || require( "../utils/ObjectUtils.js" );

const konsole = console || {};

const _ud = constants?._ud || "undefined";

const $scope = utils?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeEnvironmentUtils()
{
    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__ENV_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const operating_system = os.platform() || proc?.platform();

    const execution_environment = objectUtils.isUndefined( process ) ? "None" : ((_ud === typeof self ? ((_ud === typeof global) ? constants._unknown : constants._nodejs) : "browser"));

    const isWindows = function()
    {
        return ["windows", "win32", "windows_nt"].includes( asString(operating_system, true).toLowerCase() );
    };

    const isLinux = function()
    {
        return "linux" === asString(operating_system, true).toLowerCase();
    };


    const mod = 
    {
        operating_system,
        executionEnvironment: execution_environment,
        isWindows,
        isLinux,
        isNodeJs: function()
        {
            return asString( this.executionEnvironment, true ).trim() === asString( constants?._nodejs, true ).trim();
        }
    };

    if( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    return Object.freeze( mod );   

}());
