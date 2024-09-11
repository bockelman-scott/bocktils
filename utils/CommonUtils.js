const constants = require( "./Constants.js" );
const stringUtils = require( "./StringUtils.js" );
const arrayUtils = require( "./ArrayUtils.js" );
const objectUtils = require( "./ObjectUtils.js" );
const jsonUtils = require( "./JsonUtils.js" );

let _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exportCommonUtilities()
{
    const INTERNAL_NAME = "__BOCK__COMMON_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const importUtilities = function( pScope, ...pUtils )
    {
        const scope = pScope || $scope();

        const utils = ([].concat( (pUtils || []) ));

        let obj = {};

        for( let i = 0, n = utils?.length; i < n; i++ )
        {
            const util = utils[i];

            try
            {
                obj = Object.assign( scope, (util || {}) );
            }
            catch( ex )
            {
                console.error( "Could not import " + util?.name + " into scope", scope, ex.message );
            }
        }

        return obj;
    };

    let mod =
        {
            constants,
            stringUtils,
            arrayUtils,
            objectUtils,
            jsonUtils,
            importUtilities
        };

    mod = Object.assign( mod, constants );
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
                                   return require( "./FunctionUtils.js" );
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
