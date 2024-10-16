// noinspection JSPrimitiveTypeWrapperUsage

/**
 * Defines several useful functions for detecting the type of a variable or object.
 * DEPENDS ON Constants.cjs
 */

/** import the Constants.cjs we depend upon using require for maximum compatibility with Node versions */
const constants = require( "./Constants.cjs" );

/** Create an alias for the console **/
const konsole = console;

/**
 * Defines a string to represent the type, undefined
 */
const _ud = constants?._ud || "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

(function exposeModule()
{
    /**
     * Define a string key which is unlikely to collide with other libraries or properties.
     * We use this to store the module generated by this function in global scope.
     * We can avoid re-executing the rest of this function if the module is already defined.
     */
    const INTERNAL_NAME = "__BOCK__TYPE_UTILS__";

    /**
     * Checks to see if this module is already defines and available in the global scope
     * Returns the existing module instead of recreating it, if it is already present.
     */
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module
     */
    const dependencies =
        {
            constants
        };

    let _mt_str = constants._mt_str || "";

    let _str = constants._str || "string";
    let _fun = constants._fun || "function";
    let _num = constants._num || "number";
    let _big = constants._big || "bigint";
    let _bool = constants._bool || "boolean";
    let _obj = constants._obj || "object";
    let _symbol = constants._symbol || "symbol";

    const VALID_TYPES = [_str, _num, _big, _symbol, _bool, _obj, _fun];
    const JS_TYPES = [_ud].concat( VALID_TYPES );

    const TYPE_DEFAULTS =
        {
            [_str]: _mt_str,
            [_big]: 0n,
            [_num]: 0,
            [_bool]: false,
            [_fun]: null,
            [_obj]: null,
            [_symbol]: null,
            [_ud]: undefined
        };

    const isFunction = function( pObj )
    {
        return null !== pObj && _fun === typeof pObj;
    };

    const isAsyncFunction = function( pObject )
    {
        return isFunction( pObject ) && (pObject.constructor === constants.AsyncFunction || pObject === constants.AsyncFunction);
    };

    const DEFAULT_IS_OBJECT_OPTIONS =
        {
            rejectPrimitiveWrappers: true,
            rejectArrays: false,
            rejectNull: false
        };

    const isObject = function( pObj, pOptions = DEFAULT_IS_OBJECT_OPTIONS )
    {
        if ( (_obj === typeof pObj) || pObj instanceof Object )
        {
            const options = Object.assign( Object.assign( {}, DEFAULT_IS_OBJECT_OPTIONS ), pOptions || {} );

            if ( options.rejectNull && null === pObj )
            {
                return false;
            }

            if ( options.rejectPrimitiveWrappers )
            {
                if ( pObj instanceof String || pObj instanceof Number || pObj instanceof Boolean || pObj instanceof BigInt )
                {
                    return false;
                }
            }

            if ( options.rejectArrays )
            {
                if ( ((isFunction( Array.isArray )) ? Array.isArray( pObj ) : Object.prototype.toString.call( pObj ).toString() === "[object Array]") )
                {
                    return false;
                }
            }

            return true;
        }
        return false;
    };

    const isCustomObject = function( pObj )
    {
        return isObject( pObj ) && pObj.prototype !== null && pObj.prototype !== Object && (pObj.constructor === null || pObj.constructor !== Object);
    };

    const isString = function( pObj )
    {
        return (_str === typeof pObj) || pObj instanceof String;
    };

    const isNumber = function( pObj )
    {
        return [_num, _big].includes( typeof pObj ) || pObj instanceof Number;
    };

    function isHex( pObj )
    {
        return /^(-)?(0x)([\dA-Fa-f]+)(\.([\dA-Fa-f]+))?$/.test( pObj ) && !/[G-Wg-w\s]|[yzYZ]/.test( pObj );
    }

    function isOctal( pObj )
    {
        return /^(-)?0([0-7]+)(\.([0-7]+))?$/.test( pObj ) && !/[A-Za-z\s]/.test( pObj );
    }

    function isDecimal( pObj )
    {
        return /^(-)?[1-9]+([0-9]+)?(\.([0-9]+))?$/.test( pObj ) && !/[A-Za-z\s]/.test( pObj );
    }

    const isNumeric = function( pObj, pAllowLeadingZeroForBase10 = false )
    {
        if ( isNumber( pObj ) )
        {
            return true;
        }

        let value = String( pObj || _mt_str );

        if ( isHex( value ) || isOctal( value ) || isDecimal( value ) )
        {
            if ( pAllowLeadingZeroForBase10 )
            {
                if ( !isHex( value ) && !isOctal( value ) && isDecimal( value ) )
                {
                    while ( /^0/.test( value ) )
                    {
                        value = value.slice( 1 );
                    }
                }
            }

            if ( _mt_str === value )
            {
                return false;
            }

            let integer = parseInt( pObj, isHex( pObj ) ? 16 : isOctal( pObj ) ? 8 : isDecimal( pObj ) ? 10 : 0 );

            return !(isNaN( integer ) && Number.isFinite( integer ));
        }

        return false;
    };

    const isZero = function( pValue )
    {
        return isNumber( pValue ) && 0 === pValue;
    };

    const isBoolean = function( pValue )
    {
        return ((_bool === typeof pValue) && ((false === pValue) || true === pValue)) || pValue instanceof Boolean;
    };

    const isUndefined = function( pObject )
    {
        return (_ud === typeof pObject || undefined === pObject);
    };

    const isDefined = function( pObject )
    {
        return !isUndefined( pObject );
    };

    const isNull = function( pObject, pStrict = false )
    {
        if ( pStrict )
        {
            return null === pObject;
        }
        return (isUndefined( pObject ) || null == pObject || _mt_str === String( pObject ));
    };

    const isNotNull = function( pObject, pStrict = false )
    {
        return !isNull( pObject, pStrict );
    };

    const isNonNullObject = function( pObject, pStrict = false, pOptions = { allow_empty_object: true } )
    {
        if ( !isNull( pObject, pStrict ) && isObject( pObject ) )
        {
            const options = Object.assign( { allow_empty_object: true }, pOptions || {} );

            return options.allow_empty_object || (Object.entries( pObject )?.length > 0 && !isNull( Object.entries( pObject )[0][1], pStrict ));
        }
        return false;
    };

    const isArray = function( pObj )
    {
        return isObject( pObj ) && ((isFunction( Array.isArray )) ? Array.isArray( pObj ) : Object.prototype.toString.call( pObj ).toString() === "[object Array]");
    };

    const isSymbol = function( pValue )
    {
        return _symbol === typeof pValue || pValue instanceof Symbol;
    };

    const isType = function( pValue, pType )
    {
        const typeName = (isString( pType ) && JS_TYPES.includes( pType )) ?
                         (pType).trim().toLowerCase() :
                         typeof pType;

        if ( JS_TYPES.includes( typeName ) )
        {
            return (typeof pValue) === typeName;
        }

        if ( isObject( pValue ) && isObject( pType ) )
        {
            return pValue instanceof pType;
        }

        return false;
    };

    const isMap = function( pObject, pStrict = true )
    {
        if ( isUndefined( pObject ) || isNull( pObject ) || [_str, _num, _big, _bool, _symbol].includes( typeof pObject ) )
        {
            return false;
        }

        const isMapInstance = pObject instanceof Map;

        if ( isMapInstance )
        {
            return true;
        }

        if ( pStrict )
        {
            return false;
        }

        if ( isObject( pObject ) )
        {
            const entries = Object.entries( pObject );

            const strings = entries.filter( entry => isString( entry[0] ) && !(entry[0].startsWith( "[object" )) );

            return (entries.length === strings.length);
        }
        else if ( isFunction( pObject ) && pObject?.length === 1 )
        {
            // perhaps we have a function that takes a key and returns a value...
            return true;
        }

        return false;
    };

    const isSet = function( pObject, pStrict = true )
    {
        if ( isUndefined( pObject ) || isNull( pObject ) )
        {
            return false;
        }

        let isInstanceOfSet = pObject instanceof Set;

        if ( isInstanceOfSet )
        {
            return true;
        }

        if ( pStrict )
        {
            return false;
        }

        if ( isArray( pObject ) || pObject?.length >= 0 )
        {
            const length = pObject.length;
            let set = new Set( [...pObject] );
            return set?.size === length;
        }

        return false;
    };

    const isDate = function( pObj, pStrict = true, pDateFormatter = (function( pStr ) {}) )
    {
        if ( isUndefined( pObj ) || isNull( pObj ) )
        {
            return false;
        }

        if ( (pObj instanceof Date) || ("[object Date]" === Object.prototype.toString.call( pObj ) || (pObj.constructor === Date) || (pObj.prototype === Date)) )
        {
            return true;
        }

        if ( pStrict )
        {
            return false;
        }

        let date = isObject( pObj ) && pObj instanceof Number ? new Date( pObj.valueOf() ) : null;

        if ( isString( pObj ) || pObj instanceof String )
        {
            if ( null == date && isFunction( pDateFormatter ) )
            {
                try
                {
                    date = pDateFormatter( pObj );
                }
                catch( ex )
                {
                    //ignore
                }
            }

            if ( null == date )
            {
                try
                {
                    date = new Date( pObj );
                }
                catch( ex )
                {
                    konsole.error( constants.S_ERR_PREFIX, "evaluating a value as a Date", ex );
                }
            }
        }

        if ( null == date || !isDate( date, true ) )
        {
            switch ( typeof pObj )
            {
                case _str:
                case _num:
                case _big:
                    try
                    {
                        date = new Date( pObj );
                    }
                    catch( ex )
                    {
                        konsole.error( constants.S_ERR_PREFIX, "evaluating a value as a Date", ex );
                    }

                    if ( null == date && isFunction( pDateFormatter ) )
                    {
                        try
                        {
                            date = pDateFormatter( pObj );
                        }
                        catch( ex )
                        {
                            konsole.error( constants.S_ERR_PREFIX, "formatting a value as a Date", ex );
                        }
                    }

                    break;
            }
        }

        return (isDate( date, true ));
    };

    const isRegExp = function( pObject, pStrict = true )
    {
        if ( isUndefined( pObject ) || isNull( pObject ) )
        {
            return false;
        }

        if ( pStrict )
        {
            return pObject instanceof RegExp;
        }

        const s = isString( pObject ) ? String( pObject ) : pObject.toString();

        let pattern = s.replace( /\/[gimsuy]+$/, "/" );

        try
        {
            let regExp = new RegExp( pattern );
            return isRegExp( regExp );
        }
        catch( ex )
        {
            konsole.warn( constants.S_ERR_PREFIX, "evaluating an object as a Regular Expression", ex );
        }

        return false;
    };

    /**
     * Returns true if the value passed represents a JavaScript Class
     * JavaScript classes return "function" for the typeof operator,
     * so this function is necessary to determine the difference between a function and a class definition
     * @param {function} pFunction
     * @param pStrict
     * @returns true if the function specified is a class definition
     */
    const isClass = function( pFunction, pStrict = true )
    {
        if ( _fun === typeof pFunction || ( !pStrict && constants.BUILTIN_TYPE_NAMES.includes( pFunction?.name )) )
        {
            if ( /^class\s/.test( String( Function.prototype.toString.call( pFunction ) ).trim() ) )
            {
                return true;
            }

            if ( pStrict )
            {
                return false;
            }

            return ( !pStrict && constants.BUILTIN_TYPE_NAMES.includes( pFunction?.name ));
        }

        return false;
    };

    const instanceOfAny = function( pObject, ...pClasses )
    {
        const classes = [].concat( ...(pClasses || []) ) || [];

        let is = false;

        while ( !is && classes?.length )
        {
            try
            {
                const cls = classes.shift();
                if ( isClass( cls ) )
                {
                    try
                    {
                        is = (pObject instanceof cls);
                    }
                    catch( e )
                    {
                        konsole.warn( "Attempt to call instanceof without a class or callable" );
                    }
                }
            }
            catch( ex )
            {
                // continue
            }
        }

        return is;
    };

    const isUserDefinedClass = function( pFunction )
    {
        return isClass( pFunction );
    };

    const isListedClass = function( pFunction, ...pListedClasses )
    {
        return isClass( pFunction ) && instanceOfAny( new pFunction(), ...pListedClasses );
    };

    const isInstanceOfUserDefinedClass = function( pObject, pClass = null )
    {
        let clazz = isClass( pClass ) ? pClass || pObject?.constructor : pObject?.constructor || pObject?.prototype?.constructor || pObject?.prototype;
        return isUserDefinedClass( clazz ) && instanceOfAny( pObject, clazz );
    };

    const isInstanceOfListedClass = function( pObject, ...pListedClasses )
    {
        return instanceOfAny( pObject, ...pListedClasses );
    };

    const defaultFor = function( pType )
    {
        let type = isString( pType ) ? (_mt_str + pType).toLowerCase() : typeof (pType);

        if ( isString( pType ) && JS_TYPES.includes( pType ) )
        {
            return TYPE_DEFAULTS[type];
        }

        return defaultFor( typeof pType );
    };

    const castTo = function( pValue, pType )
    {
        const type = isString( pType ) && VALID_TYPES.includes( pType ) ? pType : _str;

        let value = pValue || null;

        switch ( type )
        {
            case _str:
                value = (isFunction( pValue?.asString )) ? pValue.asString() : (_mt_str + value);
                break;

            case _num:
            case _big:
                try
                {
                    value = (isFunction( pValue?.asFloat )) ? pValue.asFloat() : parseFloat( value );
                }
                catch( ex )
                {
                    konsole.error( constants.S_ERR_PREFIX, "casting to a number", ex );
                }
                break;

            case _bool:
                value = Boolean( value );
                break;

            case _obj:
                switch ( typeof value )
                {
                    case _obj:
                        break;

                    case _str:
                        value = new String( value );
                        break;

                    case _num:
                        value = new Number( value );
                        break;

                    case _big:
                        value = new Number( BigInt( value ) );
                        break;

                    case _bool:
                        value = new Boolean( value );
                        break;

                    default:
                        break;
                }
                break;

            default:
                break;
        }
        return value;
    };

    class TriState
    {
        #returnValue;
        #hasReturnValue;

        constructor( pReturnValue, pHasReturnValue )
        {
            this.#returnValue = pReturnValue;
            this.#hasReturnValue = !!pHasReturnValue;
        }

        get returnValue()
        {
            return this.#returnValue;
        }

        set returnValue( value )
        {
            this.#returnValue = value;
            this.#hasReturnValue |= (false === value || 0 === value || _mt_str === value || isNotNull( value, false ));
        }

        get hasReturnValue()
        {
            return true === this.#hasReturnValue;
        }

        set hasReturnValue( pHas )
        {
            this.#hasReturnValue = pHas;
        }
    }

    const mod =
        {
            dependencies,
            getScope: $scope,
            JS_TYPES,
            VALID_TYPES,
            isUndefined,
            isDefined,
            isNull,
            isNotNull,
            isObject,
            isCustomObject,
            isNonNullObject,
            isFunction,
            isAsyncFunction,
            isString,
            isNumber,
            isNumeric,
            isZero,
            isBoolean,
            isArray,
            isMap,
            isSet,
            isDate,
            isRegExp,
            isClass,
            isUserDefinedClass,
            isListedClass,
            isInstanceOfUserDefinedClass,
            isInstanceOfListedClass,
            isSymbol,
            isType,
            instanceOfAny,
            defaultFor,
            castTo,
            classes: { TriState },
            TriState
        };

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
