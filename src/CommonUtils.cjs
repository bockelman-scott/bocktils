const core = require( "./CoreUtils.cjs" );

const constants = core.constants || require( "./Constants.cjs" );
const typeUtils = core.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = core.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = core.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = core.objectUtils || require( "./ObjectUtils.cjs" );

const jsonUtils = require( "./JsonUtils.cjs" );

let _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__COMMON_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    let mod =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils,
            jsonUtils,
            dependencies:
                {
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    objectUtils,
                    jsonUtils,
                }
        };

    mod = Object.assign( mod, constants );
    mod = Object.assign( mod, typeUtils );
    mod = Object.assign( mod, stringUtils );
    mod = Object.assign( mod, arrayUtils );
    mod = Object.assign( mod, objectUtils );
    mod = Object.assign( mod, jsonUtils );

    Object.defineProperty( mod,
                           "funcUtils",
                           {
                               configurable: false,
                               enumerable: false,
                               get: function()
                               {
                                   return require( "./FunctionUtils.cjs" );
                               },
                               set: function() {}
                           } );

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
