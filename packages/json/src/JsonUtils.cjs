const core = require( "@toolbocks/core" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const jsonInterpolationUtils = require( "./JsonInterpolationUtils.cjs" );

const { _ud = "undefined", $scope } = constants;

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK_JSON_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            jsonInterpolationUtils
        };

    const {
        ToolBocksModule,
        ObjectEntry,
        detectCycles,
        objectEntries,
        populateOptions,
        isWritable,
        attempt
    } = moduleUtils;

    const
        {
            _mt_str,
            _dot,
            _str,
            _obj,
            _fun,
            _symbol,
            _num,
            _big,
            _bool,
            S_WARN
        } = constants;

    const
        {
            AnonymousClass,
            isNull,
            isString,
            isObject,
            isNonNullObject,
            isNonNullValue,
            isReadOnly,
            isArray,
            isTypedArray,
            isLikeArray,
            isFunction,
            isClass,
            toObjectLiteral
        } = typeUtils;

    const { asString, isBlank, isJson, toBool } = stringUtils;

    const { asArray, asArgs } = arrayUtils;

    const
        {
            DEFAULT_REPLACER,
            DEFAULT_REVIVER,
            DEFAULT_OPTIONS_FOR_JSON,
            DEFAULT_EXCLUSIONS,
            DEFAULT_MAX_RUNTIME,
            DEFAULT_MAX_DEPTH,
            containsInterpolatableContent,
            pendingInterpolation,
            buildPathExpression,
            asJson,
            parseJson,
            tracePathTo,
            findNode
        } = jsonInterpolationUtils;

    const modName = "JsonUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const calculateErrorSourceName = ( pModule = modName, pFunction ) => toolBocksModule.calculateErrorSourceName( pModule, pFunction );

    const DEFAULT_REFLECTION_OPTIONS =
        {
            excluded: [/^_/, "constructor", "prototype"],
            transient: [],
            includeSymbols: false,
            includeFunctions: false,
            includeUndefined: false,
            dateFormatter: ( pDate ) => (pDate instanceof Date) ? pDate.getTime() : pDate
        };

    const bruteForceJson = function( pObject, pOptions = DEFAULT_REFLECTION_OPTIONS, pStack = [] )
    {
        const options = populateOptions( pOptions, DEFAULT_REFLECTION_OPTIONS );

        let stack = asArray( pStack || options?.stack || [] );

        if ( detectCycles( stack, 4, 4 ) )
        {
            return JSON.stringify( { "error": "circular-reference detected for " + stack.join( "->" ) } );
        }

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
                        toolBocksModule.reportError( ex, errorMessage, S_WARN, calculateErrorSourceName( modName, "bruteForceJson->" + exclusion?.name ), stack );
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
                        out = bruteForceJson( s, options, stack.concat( s ) );
                    }
                }
                break;

            case _fun:
                if ( options.includeFunctions )
                {
                    let s = Function.prototype.toString.call( obj );
                    if ( _str === typeof s )
                    {
                        out = bruteForceJson( s, options, stack.concat( s ) );
                    }
                }
                break;

            case _obj:
                if ( null === obj )
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
                        out += (prependComma ? ", " : "") + bruteForceJson( obj[i], options, stack.concat( asString( i ) ) );
                        prependComma = true;
                    }

                    out += "]";
                }
                else
                {
                    let entries = objectEntries( obj );
                    entries = entries.filter( entry => !isExcluded( ObjectEntry.getKey( entry ) ) );

                    let prependComma = false;

                    for( let entry of entries )
                    {
                        let key = asString( entry.key || entry[0], true );

                        if ( isBlank( key ) )
                        {
                            continue;
                        }

                        let json = bruteForceJson( (entry.value || entry[1]), options, stack.concat( key ) );

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

    const _toObject = function( pObject )
    {
        let obj = {};

        switch ( typeof pObject )
        {
            case _ud:
                return obj;

            case _str:
                obj = parseJson( isJson( pObject ) ? pObject : asJson( pObject ) );
                break;

            case _obj:
                if ( isNull( pObject ) )
                {
                    return obj;
                }
                obj = toObjectLiteral( pObject );
                break;

            default:
                break;
        }

        return obj;
    };

    const cherryPick = function( pObject, ...pPaths )
    {
        let result = {};

        let obj = _toObject( pObject );

        const paths = asArgs( ...pPaths );

        let source = obj;
        let destination = result;

        for( let path of paths )
        {
            let pathParts = path.split( _dot );

            for( let i = 0, n = pathParts.length; i < n; i++ )
            {
                let part = pathParts[i];

                if ( isObject( source ) )
                {
                    const sourceNode = source[part];

                    if ( isNonNullObject( sourceNode ) || isNonNullValue( sourceNode ) )
                    {
                        source = sourceNode;

                        if ( isObject( destination ) )
                        {
                            destination[part] = destination[part] || (isObject( source ) ? (i === (n - 1) ? source : {}) : source);

                            if ( 0 === i )
                            {
                                result[part] = destination[part];
                            }

                            destination = destination[part];
                        }
                    }
                }
                else
                {
                    break;
                }
            }

            source = obj;
            destination = result;
        }

        return result;
    };

    function asObject( pObject, pClone = false )
    {
        let obj = pObject;

        if ( isNonNullObject( pObject ) || isArray( pObject ) || isTypedArray( pObject ) )
        {
            if ( !!pClone )
            {
                if ( isFunction( pObject?.clone ) )
                {
                    obj = attempt( () => (pObject).clone() ) || pObject || obj;
                }
                return isArray( obj ) || isTypedArray( obj ) ? [...obj] : { ...obj };
            }
            return (obj || pObject);
        }

        if ( isString( pObject ) && isJson( pObject ) )
        {
            let s = asString( pObject, true ).trim().replace( /^[ \n\r\t]+/, _mt_str ).replace( /[ \n\r\t]+$/, _mt_str ).trim();

            obj = attempt( () => parseJson( asString( s, true ) ) );

            if ( isNonNullObject( obj ) || isArray( obj ) || isTypedArray( obj ) )
            {
                return obj;
            }
        }

        if ( isFunction( pObject ) )
        {
            if ( isClass( pObject ) )
            {
                const instance = attempt( () => new pObject() );
                if ( !isNull( instance ) )
                {
                    return asObject( instance );
                }

                return { "class": pObject };
            }

            const result = attempt( () => pObject() );

            if ( !isNull( result ) )
            {
                return asObject( result );
            }
        }

        return new AnonymousClass( pObject );
    }

    let mod =
        {
            dependencies,
            asJson,
            parseJson,
            stringify: asJson,
            parse: parseJson,
            DEFAULT_REPLACER,
            DEFAULT_REVIVER,
            DEFAULT_OPTIONS_FOR_JSON,
            DEFAULT_EXCLUSIONS,
            DEFAULT_MAX_RUNTIME,
            DEFAULT_MAX_DEPTH,
            containsInterpolatableContent,
            pendingInterpolation,
            buildPathExpression,
            asObject,
            toObjectLiteral,
            bruteForceJson,
            cherryPick,
            tracePathTo,
            findNode
        };

    mod = toolBocksModule.extend( mod );

    // The TypeUtils module will behave differently if/after this module is loaded.
    if ( !isReadOnly( ToolBocksModule ) )
    {
        attempt( () => ToolBocksModule["AsJson"] = ToolBocksModule["AsJson"] ?? asJson );
        attempt( () => ToolBocksModule["ParseJson"] = ToolBocksModule["ParseJson"] ?? parseJson );
        attempt( () => ToolBocksModule["AsObject"] = ToolBocksModule["AsObject"] ?? asObject );
    }

    // The TypeUtils module will behave differently if/after this module is loaded.
    if ( typeUtils && !isReadOnly( typeUtils ) )
    {
        if ( isWritable( typeUtils, "parseJson" ) )
        {
            attempt( () => typeUtils.parseJson = parseJson.bind( typeUtils ) );
        }

        if ( isWritable( typeUtils, "asObject" ) )
        {
            attempt( () => typeUtils.asObject = asObject.bind( typeUtils ) );
        }

        if ( isWritable( typeUtils, "asJson" ) )
        {
            attempt( () => typeUtils.asJson = asJson.bind( typeUtils ) );
        }
    }

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
