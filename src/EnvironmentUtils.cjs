/**
 * This file provides useful functions for interrogating the current execution environment
 */
const os = require('os');

const proc = process || os;

const utils = require( "./CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const constants = utils?.constants || require( "./Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "./ObjectUtils.cjs" );

const konsole = console || {};

const _ud = constants?._ud || "undefined";

const $scope = utils?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
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
