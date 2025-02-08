const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

const objectUtils = require( "../../common/src/ObjectUtils.cjs" );

const jsonInterpolationUtils = require( "./JsonInterpolationUtils.cjs" );

const { _ud = "undefined" } = constants;

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

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils,
            jsonInterpolationUtils
        };

    const {
        _mt_str,
        _dot,
        _str,
        _obj,
        _fun,
        _symbol,
        _num,
        _big,
        _bool,
        S_WARN,
        S_ERROR,
        populateOptions,
        mergeOptions,
        classes
    } = constants;

    const { isNull, isString, isObject, isArray, isFunction, isNonNullObject, isNonNullValue } = typeUtils;

    const { asString, isBlank, isJson, asInt, asFloat, toBool } = stringUtils;

    const {
        varargs,
        asArray,
        asArgs,
        flatArgs,
        filteredArgs,
        flatFilteredArgs,
        pruneArray,
        unique,
        Filters,
        Mappers
    } = arrayUtils;


    const {
        detectCycles,
        isEmptyObject,
        ObjectEntry,
        ExploredSet,
        getEntries,
        foldEntries,
        getProperty,
        removeProperty,
        prune,
    } = objectUtils;

    const modName = "JsonUtils";

    const { ToolBocksModule } = classes;

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    const calculateErrorSourceName = function( pModule = modName, pFunction )
    {
        return modulePrototype.calculateErrorSourceName( pModule, pFunction );
    };

    const MAX_DEPTH = 24;

    const { DEFAULT_REPLACER: replacer, asJson, parseJson } = jsonInterpolationUtils;

    function _isValidInput( pValue )
    {
        return !isNull( pValue ) && (isString( pValue ) || isObject( pValue ));
    }

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

        let stack = asArray( pStack || options.stack || [] );
        let depth = asInt( pDepth, 0 ) || 0;

        if ( (depth > MAX_DEPTH) || detectCycles( stack, 3, 3 ) )
        {
            return pObj;
        }

        let obj = pObj;

        const entries = getEntries( pObj );

        for( const entry of entries )
        {
            let key = entry.key || entry[0];

            if ( keysToRemove.includes( key ) || keysToRemove.includes( "_" + key ) )
            {
                obj = removeProperty( obj, key );
                continue;
            }

            let value = entry.value || entry[1] || null;

            if ( null === value )
            {
                obj = removeProperty( obj, key );
                continue;
            }

            switch ( typeof value )
            {
                case _ud:
                case _symbol:
                case _fun:
                    obj = removeProperty( obj, key );
                    break;

                case _obj:
                    if ( depth <= 7 )
                    {
                        obj[key] = scrub( value, options, stack.concat( key ), depth + 1 );
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

    const shouldSkip = function( pValue, pIncludeEmpty )
    {
        const includeEmpty = !!pIncludeEmpty;

        return !includeEmpty && (_ud === typeof pValue || (_obj === typeof pValue && isNull( pValue )));
    };

    const DEFAULT_OBJECT_LITERAL_OPTIONS =
        {
            assumeUnderscoresConvention: true,
            includeEmpty: true,
            includeEmptyProperties: true,
            trimStrings: false,
            omitFunctions: false,
            transientProperties: []
        };

    const toObjectLiteral = function( pObject, pOptions = DEFAULT_OBJECT_LITERAL_OPTIONS, pStack = [] )
    {
        const options = populateOptions( pOptions, DEFAULT_OBJECT_LITERAL_OPTIONS );

        const _assumeUnderscoreConvention = options?.assumeUnderscoresConvention;

        let obj = pObject || options.target;

        if ( isString( obj ) )
        {
            let json = asString( obj, true );

            if ( isJson( json ) )
            {
                try
                {
                    obj = parseJson( json, options );
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, ex?.message, S_ERROR, calculateErrorSourceName( modName, "toObjectLiteral->parseJson" ) );
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

        const stack = asArray( pStack || options.stack || [] );

        if ( detectCycles( stack, 5, 3 ) )
        {
            const msg = "Encountered infinite loop converted value to an object literal";

            modulePrototype.reportError( new Error( msg ), msg, S_WARN, calculateErrorSourceName( modName, "toObjectLiteral" ), stack );

            return Object.assign( {}, obj );
        }

        if ( null === obj )
        {
            return null;
        }

        if ( isArray( obj ) )
        {
            return obj.map( ( e, i ) => toObjectLiteral( e, options, stack.concat( asString( i ) ) ) );
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

            let propName = (prop.replace( /^[_#]/, _mt_str ));

            propName = propName.replaceAll( /[\r\n()\\/.]/g, _mt_str );

            let value = getProperty( obj, propName ) || obj[propName];

            if ( shouldSkip( value, _includeEmptyProperties ) )
            {
                continue;
            }

            newObj[propName] = toObjectLiteral( value, options, stack.concat( asString( propName ) ) );
        }

        return newObj;
    };

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
                        modulePrototype.reportError( ex, errorMessage, S_WARN, calculateErrorSourceName( modName, "bruteForceJson->" + exclusion?.name ), stack );
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
                    let entries = getEntries( obj );
                    entries = entries.filter( entry => !isExcluded( entry.key || entry[0] ) );

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
                obj = { ...pObject };
                break;

            default:
                break;
        }

        return obj;
    };

    const pruningOptions =
        {
            removeEmptyStrings: true,
            removeFunctions: true,
            pruneArrays: true,
            trimStrings: true
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

        return prune( result, pruningOptions );
    };

    const mergeJson = function( ...pObjects )
    {
        const objects = filteredArgs( _isValidInput, ...pObjects ).map( _toObject ).filter( e => isNonNullObject( e ) );

        if ( objects.length > 1 )
        {
            return mergeOptions( objects[0], ...objects.slice( 1 ) );
        }

        return objects[0] || {};
    };

    const JSON_MERGE_OPTIONS =
        {
            mappers: [],
            filters: [],
            pruneResult: true,
            pruningOptions: pruningOptions,
            returnJson: false
        };

    class JsonMerger
    {
        #options;
        #mappers = [];
        #filters = [];

        #pruneResult = true;
        #pruningOptions = pruningOptions;
        #returnJson = false;

        constructor( pFilters, pMappers, pOptions = JSON_MERGE_OPTIONS )
        {
            this.#options = { ...pOptions || {} };

            this.#filters = this.initializeFilters( pFilters, asArray( this.#options.filters ) );
            this.#mappers = this.initializeMappers( pMappers, asArray( this.#options.mappers ) );

            this.#pruneResult = !!this.#options.pruneResult;
            this.#pruningOptions = mergeOptions( this.#options.pruningOptions || {}, this.#pruningOptions, pruningOptions );
            this.#returnJson = !!this.#options.returnJson;
        }

        get options()
        {
            return populateOptions( this.#options, {} );
        }

        get mappers()
        {
            return [...(asArray( this.#mappers ))];
        }

        get filters()
        {
            return [...(asArray( this.#filters ))];
        }

        initializeFilters( ...pFilters )
        {
            const filters = flatArgs( ...pFilters || [] );
            return filters.filter( Filters.IS_FILTER );
        }

        addFilter( pFilter )
        {
            if ( isFunction( pFilter ) && Filters.IS_FILTER( pFilter ) )
            {
                this.#filters.push( pFilter );
            }
        }

        initializeMappers( ...pMappers )
        {
            const mappers = flatArgs( ...pMappers || [] );
            return mappers.filter( Filters.IS_MAPPER );
        }

        addMapper( pMapper )
        {
            if ( isFunction( pMapper ) && Filters.IS_MAPPER( pMapper ) )
            {
                this.#mappers.push( pMapper );
            }
        }

        get pruneResult()
        {
            return !!this.#pruneResult;
        }

        get pruningOptions()
        {
            return populateOptions( this.#pruningOptions, pruningOptions );
        }

        get returnJson()
        {
            return !!this.#returnJson;
        }

        _skip( pObject, pStack )
        {
            return isNull( pObject ) || !isObject( pObject ) || isEmptyObject( pObject ) || detectCycles( asArray( pStack || [] ), 5, 3 );
        }

        _processEntries( pObject, pCallback, pVisited = new ExploredSet(), pStack = [] )
        {
            const visited = pVisited || new ExploredSet();

            const stack = pStack || [];

            let result = { ...pObject };

            if ( this._skip( pObject, stack ) )
            {
                return result;
            }

            const callback = isFunction( pCallback ) ? pCallback : function( pEntry ) { return pEntry; };

            const entries = getEntries( pObject );

            for( const entry of entries )
            {
                let key = entry.key || entry[0];
                let value = entry.value || entry[1];

                try
                {
                    const updatedEntry = callback( entry, key, value );

                    value = updatedEntry?.value || updatedEntry?.[1];

                    key = updatedEntry?.key || updatedEntry?.[0] || key;

                    result[key] = value;
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, "An error occurred while processing an object entry", S_ERROR, calculateErrorSourceName( modName, "_processEntries" ), stack );
                    result[key] = value;
                }

                const child = result[key];

                if ( isNonNullObject( child ) && (child instanceof ObjectEntry) && !visited.has( child ) )
                {
                    visited.add( child );
                    stack.push( key );
                    result[key] = this._processEntries( child, callback, visited, stack );
                }
            }

            return foldEntries( result );
        }

        _filterEntries( pObject, pFilter, pVisited = new ExploredSet(), pStack = [] )
        {
            const filter = isFunction( pFilter ) && Filters.IS_FILTER( pFilter ) ? pFilter : Filters.IDENTITY;

            const callback = ( entry ) =>
            {
                if ( entry instanceof ObjectEntry )
                {
                    return (entry.filter( filter ) ? entry : null);
                }
                return (filter( entry ) ? entry : null);
            };

            return this._processEntries( pObject, callback, pVisited, pStack );
        }

        _mapEntries( pObject, pMapper, pVisited = new ExploredSet(), pStack = [] )
        {
            const mapper = isFunction( pMapper ) && Filters.IS_MAPPER( pMapper ) ? pMapper : Mappers.IDENTITY;

            const callback = ( entry ) =>
            {
                return entry instanceof ObjectEntry ? entry.map( mapper ) : mapper( entry );
            };

            return this._processEntries( pObject, callback, pVisited, pStack );
        }

        merge( ...pObjects )
        {
            const merged = mergeJson( ...pObjects );

            let result = { ...merged };

            for( const mapper of this.#mappers )
            {
                result = this._mapEntries( result, mapper );
            }

            for( const filter of this.#filters )
            {
                result = this._filterEntries( result, filter );
            }

            result = foldEntries( result );

            result = this.pruneResult ? prune( result, this.pruningOptions ) : result;

            return this.returnJson ? asJson( result ) : result;
        }
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    JsonMerger
                },
            asJson,
            parseJson,
            stringify: asJson,
            parse: parseJson,
            DEFAULT_REPLACER: replacer,
            scrub,
            toObjectLiteral,
            bruteForceJson,
            cherryPick,
            mergeJson
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
