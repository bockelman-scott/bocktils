/* import dependencies */
const moduleUtils = require( "./_ToolBocksModule.cjs" );
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );

/* define a variable for typeof undefined */
const { _ud = "undefined", $scope = moduleUtils.$scope } = constants;

// noinspection FunctionTooLongJS
/**
 * This module is constructed by an Immediately Invoked Function Expression (IIFE).
 * see: <a href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE">MDN: IIFE</a> for more information on this design pattern
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__FUNCTION_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { ToolBocksModule, functionToString } = moduleUtils;

    const { _mt_str, _rxFunctionSignature } = constants;

    const { isFunction, isString } = typeUtils;

    const { asString, leftOfLast, rightOf } = stringUtils;

    const { asArray, Filters } = arrayUtils;

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

    /**
     * Represents the name of the module<br>
     * This name is used when error events are emitted to indicate the source of the error.
     * @type {string}
     */
    const modName = "FunctionUtils";

    /**
     * This is the object that is returned from this function.
     * <br>
     * This object is the ArrayUtils module<br>
     * <br>
     * The functions defined in this file are added to the module before it is exported and returned.
     * <br>
     * @type {ToolBocksModule}
     */
    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    /**
     * Returns the source code that defined the specified function.
     * <br>
     * @param {function|string} pFunction - the function whose source is to be returned
     * @returns {string}  the source code that defined the specified function<br>
     *                    If the specified value is not a function,
     *                    returns that string or the empty string
     */
    function getFunctionSource( pFunction )
    {
        return isFunction( pFunction ) ? functionToString.call( pFunction, pFunction ) : isString( pFunction ) ? asString( pFunction, true ) : _mt_str;
    }

    const extractFunctionData = function( pFunction )
    {
        let s = isFunction( pFunction ) || isString( pFunction ) ? getFunctionSource( pFunction ) : _mt_str;

        let rx = new RegExp( _rxFunctionSignature );

        let body = asString( s.replace( rx, _mt_str ), true );

        body = asString( leftOfLast( rightOf( body, "{" ), "}" ), true );

        const matches = rx.exec( s );

        let params = asArray( (matches && matches.length >= 7) ? asArray( asString( matches[6], true ).split( "," ) ) : [] );

        params = params.map( e => asString( e, true ) ).filter( Filters.NON_BLANK );

        return { body, params };
    };

    const extractFunctionBody = function( pFunction )
    {
        const { body } = extractFunctionData( pFunction );
        return body;
    };

    const extractFunctionParameters = function( pFunction )
    {
        const { params } = extractFunctionData( pFunction );
        return params;
    };

    let mod =
        {
            dependencies,
            getFunctionSource,
            extractFunctionData,
            extractFunctionBody,
            extractFunctionParameters,

        };

    // makes the properties of mod available as properties and methods of the toolBocksModule
    mod = toolBocksModule.extend( mod );

    // Exports this module
    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
