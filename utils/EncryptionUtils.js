const os = require( "os" );

const crypto = require( "crypto" );

const utils = require( "./CommonUtils.cjs" );

const dateUtils = require( "./DateUtils.cjs" );

const constants = utils?.constants || require( "./Constants.cjs" );

const _ud = constants?._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeEncryptionUtils()
{
    let constants = utils.constants;
    let stringUtils = utils.stringUtils;
    let arrayUtils = utils.arrayUtils;
    let objectUtils = utils.objectUtils;

    let importUtilities = utils?.importUtilities;

    let _ud = constants._ud || "undefined";
    let _str = constants._str || "string";
    let _fun = constants._fun || "function";

    let _mt_str = constants._mt_str || "";

    let asString = stringUtils.asString || (function( s ) { return (_mt_str + s).trim(); });
    let isBlank = stringUtils.isBlank || (function( s ) { return null == s || _mt_str === asString( s, true ).trim(); });


    const mod =
        {
            encrypt: function( pString, pSalt )
            {
                return pString;
            },
            decrypt: function( pString, pSalt )
            {
                return pString;
            },
            encode: this.encrypt,
            decode: this.decrypt
        };


    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
