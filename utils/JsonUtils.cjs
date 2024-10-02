const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );
const objectUtils = require( "./ObjectUtils.cjs" );

const jsonInterpolationUtils = require( "./JsonInterpolationUtils.cjs" );

const _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function makeModule()
{
    let _mt_str = constants._mt_str || "";

    let _str = constants._str || "string";
    let _obj = constants._obj || "object";
    let _fun = constants._fun || "function";
    let _symbol = constants._symbol || "symbol";
    let _num = constants._num || "number";
    let _big = constants._big || "bigint";
    let _bool = constants._bool || "boolean";

    let isString = objectUtils.isString || function( s ) { return _str === typeof s; };
    let asString = stringUtils.asString || function( s ) { return (_mt_str + s).trim(); };
    let isBlank = stringUtils.isBlank || function( s ) { return _mt_str === asString( s, true ).trim(); };
    let isJson = stringUtils.isJson || function( s ) { return (asString( s ).startsWith( "{" ) && asString( s ).endsWith( "}" )) || (asString( s ).startsWith( "[" ) && asString( s ).endsWith( "]" )); };
    let ucase = stringUtils.ucase || function( s ) { return asString( s ).toUpperCase(); };
    let asInt = stringUtils.asInt || function( s ) { return parseInt( s ); };
    let asFloat = stringUtils.asFloat || function( s ) { return parseFloat( s ); };

    let isArray = objectUtils.isArray || function( pArr ) { return Array.isArray( pArr ); };

    let asArray = arrayUtils.asArray || function( pArr ) { return Array.isArray( pArr ) ? pArr : [pArr]; };
    let pruneArray = arrayUtils.pruneArray || function( pArr )
    {
        const arr = asArray( pArr || [] );
        return arr.filter( e => (null !== e) && (_ud !== typeof e) && (_mt_str !== e) );
    };
    let unique = arrayUtils.unique || function( pArr )
    {
        const arr = asArray( pArr || [] );
        return [...(new Set( arr ))];
    };

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK_JSON_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const MAX_DEPTH = 17;

    const DEFAULT_EXCLUSIONS = ["arguments", "_arguments"];

    const replacer = function( key, value )
    {
        if ( isBlank( key ) || DEFAULT_EXCLUSIONS.includes( key ) || "function" === typeof value )
        {
            return "\"\"";
        }
        return value;
    };

    const buildReplacer = function( pExclusions, ...pNameValuePairs )
    {
        let exclusions = unique( pruneArray( asArray( pExclusions || DEFAULT_EXCLUSIONS ).filter( arrayUtils.Filters.NON_BLANK ) ) );
        exclusions = (exclusions?.length || 0) <= 0 ? DEFAULT_EXCLUSIONS : exclusions;

        const nvPairs = asArray( pNameValuePairs || [] ).filter( e => Array.isArray( e ) && 2 === (e?.length || 0) );

        return function( pKey, pValue )
        {
            if ( isBlank( pKey ) || exclusions.includes( pKey ) || "function" === typeof pValue || "symbol" === typeof pValue )
            {
                return "\"\"";
            }

            let value = pValue;

            if ( (nvPairs?.length || 0) > 0 )
            {
                for( let i = nvPairs.length; i--; )
                {
                    const nvPair = nvPairs[i];
                    const k = nvPair.length > 0 ? nvPair[0] : _mt_str;
                    const v = nvPair.length > 1 ? nvPair[1] : k;

                    if ( !isBlank( k ) && ucase( asString( k, true ) ) === ucase( asString( pKey, true ) ) )
                    {
                        value = v;
                        break;
                    }
                }
            }

            return value;
        };
    };

    const scrub = function( pObj, pOptions, pStack, pDepth )
    {
        if ( _fun === typeof (pObj) )
        {
            return "function " + pObj?.name || pObj?.constructor?.name || _mt_str + "(){}";
        }

        if ( _obj !== typeof pObj || null === pObj )
        {
            return pObj;
        }

        const options = Object.assign( {}, pOptions || {} );

        const keysToRemove = asArray( options?.keysToExclude || options?.exclude || [] ) || [];

        options.keysToExclude = [].concat( keysToRemove || [] );

        let stack = pStack || [];
        let depth = asInt( pDepth, 0 ) || 0;

        if ( (depth > MAX_DEPTH) || objectUtils.detectCycles( stack, 3, 3 ) )
        {
            return pObj;
        }

        let obj = pObj;

        const entries = Object.entries( pObj );

        for( let i = 0, n = (entries?.length || 0); i < n; i++ )
        {
            let entry = entries[i];

            let key = entry?.length ? entry[0] : _mt_str;

            if ( keysToRemove.includes( key ) || keysToRemove.includes( "_" + key ) )
            {
                obj = objectUtils.removeProperty( obj, key );
                continue;
            }

            let value = (entry?.length || 0) > 1 ? entry[1] : null;

            if ( null === value )
            {
                obj = objectUtils.removeProperty( obj, key );
                continue;
            }

            switch ( typeof value )
            {
                case _ud:
                case _symbol:
                case _fun:
                    obj = objectUtils.removeProperty( obj, key );
                    break;

                case _obj:
                    if ( depth <= 7 )
                    {
                        stack.push( key );
                        try
                        {
                            obj[key] = scrub( value, options, stack, depth + 1 );
                        }
                        catch( ex )
                        {
                            console.warn( ex );
                        }
                        stack.pop();
                    }
                    break;

                case _str:
                case _num:
                case _big:
                case _bool:
                    break;

                default:
                    break;
            }
        }

        return obj;
    };

    const shouldSkip = function( pValue, pProperty, pIncludeEmptyProperties )
    {
        let should = false;

        let _includeEmptyProperties = !(false === pIncludeEmptyProperties);

        switch ( typeof pValue )
        {
            case _ud:
                if ( !_includeEmptyProperties )
                {
                    should = true;
                }
                break;

            case _obj:
                if ( null === pValue && !_includeEmptyProperties )
                {
                    should = true;
                }
                break;

            default:
                break;
        }

        return should;
    };

    const jsonify = function( pObject, pOptions = {} )
    {
        const options = Object.assign( {}, pOptions || {} );

        return jsonInterpolationUtils.asJson( pObject, options );
    };

    const DEFAULT_OBJECT_LITERAL_OPTIONS =
        {
            assumeUnderscoresConvention: true,
            includeEmpty: true,
            includeEmptyProperties: true,
            trimStrings: false
        };

    const toObjectLiteral = function( pObject, pOptions = DEFAULT_OBJECT_LITERAL_OPTIONS )
    {
        let options = Object.assign( {}, DEFAULT_OBJECT_LITERAL_OPTIONS );
        options = Object.assign( (options || {}), pOptions || DEFAULT_OBJECT_LITERAL_OPTIONS || {} );

        const _assumeUnderscoreConvention = options?.assumeUnderscoresConvention;

        let obj = pObject || options.target;

        if ( isString( obj ) && isJson( obj ) )
        {
            try
            {
                obj = jsonInterpolationUtils.parseJson( obj );
            }
            catch( ex )
            {
                console.warn( ex.message );
            }
        }

        const _include = unique( pruneArray( [].concat( ...(asArray( options.include || [] )) ) ) ) || [];

        const _exclude = unique( pruneArray( ["constructor", "prototype", "toJson", "toObject", "global", "this"].concat( (asArray( options.exclude || options.transientProperties || [] )) ) ).filter( e => !_include.includes( e ) ) ) || [];

        const _includeEmptyProperties = !(false === (options.includeEmpty || options.includeEmptyProperties));

        const _trimStrings = options.trimStrings || false;

        switch ( typeof obj )
        {
            case _ud:
                return _mt_str;

            case _str:
                return asString( obj, _trimStrings );

            case _num:
            case _big:
                return asFloat( obj );

            case _bool:
                return obj;

            case _fun:
            case _symbol:
                return asString( asString( obj.name ) || asString( obj ) );

            default:
                break;
        }

        if ( isArray( obj ) )
        {
            let newArr = [];

            for( let i = 0, n = obj.length; i < n; i++ )
            {
                let elem = obj[i];

                newArr.push( toObjectLiteral( elem, options ) );
            }

            return newArr;
        }

        if ( null === obj )
        {
            return null;
        }

        let isClassDerivedObject = (obj.constructor && Object !== obj.constructor) || (_ud !== typeof obj.prototype);

        let propertyNames = isClassDerivedObject ? Object.getOwnPropertyNames( obj.constructor.prototype || obj.prototype || obj ) : Object.keys( obj );

        if ( _exclude.length )
        {
            propertyNames = propertyNames.filter( e => !_exclude.includes( e ) );

            if ( _assumeUnderscoreConvention )
            {
                propertyNames = propertyNames.filter( e => !_exclude.includes( "_" + e ) );
            }
        }

        if ( _include.length )
        {
            propertyNames = propertyNames.filter( e => _include.includes( e ) || (_assumeUnderscoreConvention && _include.includes( "_" + e )) );
        }

        let newObj = {};

        for( let i = 0, n = propertyNames.length; i < n; i++ )
        {
            const prop = asString( propertyNames[i] ).trim();

            if ( isBlank( prop ) )
            {
                continue;
            }

            let propName = (prop.replace( /^_/, _mt_str ));

            propName = propName.replaceAll( /[\r\n()\\/.]/g, _mt_str );

            let value = objectUtils.getProperty( obj, propName ) || obj[propName];

            if ( shouldSkip( value, propName, _includeEmptyProperties ) )
            {
                continue;
            }

            newObj[propName] = toObjectLiteral( value, options );
        }

        return newObj;
    };

    // pExclusions, pIncludeSymbols, pIncludeFunctions, pIncludeUndefined

    const DEFAULT_REFLECTION_OPTIONS =
        {
            excluded: [/^_/, "constructor", "prototype"],
            transient: [],
            includeSymbols: false,
            includeFunctions: false,
            includeUndefined: false,
            dateFormatter: function( pDate )
            {
                if ( pDate instanceof Date )
                {
                    return pDate.getTime();
                }
                return pDate;
            }
        };

    const bruteForceJson = function( pObject, pOptions = DEFAULT_REFLECTION_OPTIONS, pStack = [] )
    {
        let stack = asArray( pStack || [] );

        if ( objectUtils.detectCycles( stack, 4, 4 ) )
        {
            return JSON.stringify( { "error": "circular-reference detected for " + stack.join( "->" ) } );
        }

        let options = Object.assign( {}, DEFAULT_REFLECTION_OPTIONS );
        options = Object.assign( options, pOptions || DEFAULT_REFLECTION_OPTIONS );

        const errorMessage = "An error occurred while converting an object to JSON using brute force";

        const isExcluded = function( pProperty )
        {
            if ( _str !== typeof pProperty )
            {
                return true;
            }

            let transientProperties = asArray( options.transient );

            let excluded = ((transientProperties.length > 0) && (transientProperties.includes( pProperty )));

            if ( excluded )
            {
                return true;
            }

            let exclusions = asArray( options.excluded || [] ).concat( transientProperties );

            for( let exclusion of exclusions )
            {
                if ( exclusion instanceof RegExp )
                {
                    excluded = exclusion.test( pProperty );
                }
                else if ( _str === typeof exclusion )
                {
                    excluded = asString( exclusion, true ) === asString( pProperty, true );
                }
                else if ( _fun === typeof exclusion )
                {
                    try
                    {
                        excluded = exclusion.call( obj, pProperty );
                    }
                    catch( ex )
                    {
                        console.warn( errorMessage, ex );
                    }
                }

                if ( excluded )
                {
                    break;
                }
            }

            return excluded;
        };

        let obj = pObject;

        let out = _mt_str;

        switch ( typeof obj )
        {
            case _ud:
                if ( options.includeUndefined )
                {
                    return JSON.stringify( _ud );
                }
                break;

            case _str:
                out = JSON.stringify( obj );
                break;

            case _num:
                out = obj;
                break;

            case _big:
                out = JSON.stringify( String( obj ) );
                break;

            case _bool:
                out = toBool( obj );
                break;

            case _symbol:
                if ( options.includeSymbols )
                {
                    let s = asString( Symbol.keyFor( obj ), true );
                    if ( _str === typeof s )
                    {
                        out = bruteForceJson( s );
                    }
                }
                break;

            case _fun:
                if ( options.includeFunctions )
                {
                    let s = Function.prototype.toString.call( obj );
                    if ( _str === typeof s )
                    {
                        out = bruteForceJson( s );
                    }
                }
                break;

            case _obj:
                if ( null === typeof obj )
                {
                    return JSON.stringify( null );
                }
                else if ( obj instanceof Date )
                {
                    if ( options.dateFormatter )
                    {
                        out += JSON.stringify( options.dateFormatter( obj ) );
                    }
                    else
                    {
                        out += JSON.stringify( obj );
                    }
                }
                else if ( Array.isArray( obj ) )
                {
                    out += "[";

                    let prependComma = false;

                    for( let i = 0, n = obj?.length || 0; i < n; i++ )
                    {
                        out += (prependComma ? ", " : "") + bruteForceJson( obj[i] );
                        prependComma = true;
                    }

                    out += "]";
                }
                else
                {
                    let entries = objectUtils.getEntries( obj );
                    entries = entries.filter( entry => !isExcluded( entry.key || entry[0] ) );

                    let prependComma = false;

                    for( let entry of entries )
                    {
                        let key = asString( entry.key || entry[0], true );

                        if ( isBlank( key ) )
                        {
                            continue;
                        }

                        stack.push( key );

                        let json = null;

                        try
                        {
                            json = bruteForceJson( (entry.value || entry[1]), options, stack );
                        }
                        catch( ex )
                        {
                            console.warn( errorMessage, ex );
                        }
                        finally
                        {
                            stack.pop();
                        }

                        if ( json && stringUtils.isValidJson( json ) )
                        {
                            if ( prependComma )
                            {
                                out += ", ";
                            }

                            out += "\"" + key + "\":";
                            out += json;

                            prependComma = true;
                        }
                    }
                }
        }

        return out;
    };

    if ( stringUtils )
    {
        stringUtils.asString.stringify = function( pObj )
        {
            return jsonify( pObj );
        };
    }

    if ( asString )
    {
        asString.stringify = function( pObj )
        {
            return jsonify( pObj );
        };
    }

    const mod =
        {
            scrub,
            jsonify,
            toObjectLiteral,
            bruteForceJson,
            asJson: jsonInterpolationUtils.asJson,
            parseJson: jsonInterpolationUtils.parseJson,
            parse: jsonInterpolationUtils.parseJson,
            stringify: jsonInterpolationUtils.asJson,
            buildReplacer,
            defaultReplacer: replacer
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
