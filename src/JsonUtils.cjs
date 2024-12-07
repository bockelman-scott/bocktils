const core = require( "./CoreUtils.cjs" );

const constants = core.constants;
const typeUtils = core.typeUtils;
const stringUtils = core.stringUtils;
const arrayUtils = core.arrayUtils;
const objectUtils = core.objectUtils;

const jsonInterpolationUtils = require( "./JsonInterpolationUtils.cjs" );

const _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK_JSON_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { _mt_str, _str, _obj, _fun, _symbol, _num, _big, _bool, populateOptions, lock } = constants;

    const { isString, isArray } = typeUtils;

    const { asString, isBlank, isJson, asInt, asFloat, toBool } = stringUtils;

    const { asArray, pruneArray, unique } = arrayUtils;

    const MAX_DEPTH = 17;

    const replacer = jsonInterpolationUtils.DEFAULT_REPLACER;

    const scrub = function( pObj, pOptions, pStack, pDepth )
    {
        if ( _fun === typeof (pObj) )
        {
            return "function " + (pObj?.name || pObj?.constructor?.name || _mt_str) + "(){}";
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

    const DEFAULT_OBJECT_LITERAL_OPTIONS =
        {
            assumeUnderscoresConvention: true,
            includeEmpty: true,
            includeEmptyProperties: true,
            trimStrings: false,
            omitFunctions: false
        };

    const toObjectLiteral = function( pObject, pOptions = DEFAULT_OBJECT_LITERAL_OPTIONS )
    {
        let options = Object.assign( {}, DEFAULT_OBJECT_LITERAL_OPTIONS );
        options = Object.assign( (options || {}), pOptions || DEFAULT_OBJECT_LITERAL_OPTIONS || {} );

        const _assumeUnderscoreConvention = options?.assumeUnderscoresConvention;

        let obj = pObject || options.target;

        if ( isString( obj ) )
        {
            let json = asString( obj, true );
            if ( isJson( json ) )
            {
                try
                {
                    obj = jsonInterpolationUtils.parseJson( json, options );
                }
                catch( ex )
                {
                    console.warn( ex.message );
                }
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

    const mod =
        {
            asJson: jsonInterpolationUtils.asJson,
            parseJson: jsonInterpolationUtils.parseJson,
            stringify: jsonInterpolationUtils.asJson,
            parse: jsonInterpolationUtils.parseJson,
            DEFAULT_REPLACER: replacer,
            scrub,
            toObjectLiteral,
            bruteForceJson
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = lock( mod );
    }

    return lock( mod );

}());
