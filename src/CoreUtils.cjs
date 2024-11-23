const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );
const objectUtils = require( "./ObjectUtils.cjs" );

const guidUtils = objectUtils?.guidUtils || objectUtils?.dependencies?.guidUtils || require( "./GUIDUtils.cjs" );

let _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__CORE_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const importUtilities = constants?.importUtilities || function( pScope, ...pUtils )
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
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils,
            guidUtils,
            importUtilities,
            dependencies:
                {
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    objectUtils
                }
        };

    mod = Object.assign( mod, constants );
    mod = Object.assign( mod, typeUtils );
    mod = Object.assign( mod, stringUtils );
    mod = Object.assign( mod, arrayUtils );
    mod = Object.assign( mod, objectUtils );

    mod = Object.freeze( mod );

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
