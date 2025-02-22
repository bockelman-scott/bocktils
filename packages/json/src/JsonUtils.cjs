const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

const jsonInterpolationUtils = require( "./JsonInterpolationUtils.cjs" );

const {
    _ud = "undefined",
    $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    }
} = constants;

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
        attempt,
        detectCycles,
        ObjectEntry,
        objectEntries,
        populateOptions,
        mergeOptions,
        classes
    } = constants;

    const {
        isNull,
        isString,
        isObject,
        isFunction,
        isNonNullObject,
        isNonNullValue,
        isPopulated,
        toObjectLiteral,
        VisitedSet
    } = typeUtils;

    const { asString, isBlank, isJson, toBool } = stringUtils;

    const {
        asArray,
        asArgs,
        flatArgs,
        filteredArgs,
        Filters,
        Mappers
    } = arrayUtils;

    const modName = "JsonUtils";

    const { ToolBocksModule } = classes;

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    const calculateErrorSourceName = ( pModule = modName, pFunction ) => modulePrototype.calculateErrorSourceName( pModule, pFunction );

    const { DEFAULT_REPLACER: replacer, asJson, parseJson } = jsonInterpolationUtils;

    const _isValidInput = ( pValue ) => !isNull( pValue ) && (isString( pValue ) || isObject( pValue ));

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
                    let entries = objectEntries( obj );
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

    const mergeJson = function( ...pObjects )
    {
        const objects = filteredArgs( _isValidInput, ...pObjects ).map( _toObject ).filter( isNonNullObject );

        return (objects.length > 1) ? mergeOptions( objects[0], ...objects.slice( 1 ) ) : (objects[0] || {});
    };

    const JSON_MERGE_OPTIONS =
        {
            mappers: [],
            filters: [],
            returnJson: false
        };

    class JsonMerger
    {
        #options;

        #mappers = [];
        #filters = [];

        #returnJson = false;

        constructor( pFilters, pMappers, pOptions = JSON_MERGE_OPTIONS )
        {
            this.#options = { ...pOptions || {} };

            this.#filters = this.initializeFilters( pFilters, asArray( this.#options.filters ) );
            this.#mappers = this.initializeMappers( pMappers, asArray( this.#options.mappers ) );

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
            if ( Filters.IS_FILTER( pFilter ) )
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
            if ( Filters.IS_MAPPER( pMapper ) )
            {
                this.#mappers.push( pMapper );
            }
        }

        get returnJson()
        {
            return !!this.#returnJson;
        }

        _skip( pObject, pStack )
        {
            return !isNonNullObject( pObject ) || !isPopulated( pObject ) || detectCycles( asArray( pStack || [] ), 5, 3 );
        }

        _processEntries( pObject, pCallback, pVisited = new VisitedSet(), pStack = [] )
        {
            const visited = pVisited || new VisitedSet();

            const stack = pStack || [];

            let result = {}; // { ...pObject };

            if ( this._skip( pObject, stack ) )
            {
                return result;
            }

            const callback = isFunction( pCallback ) ? pCallback : function( pEntry ) { return pEntry; };

            const entries = objectEntries( pObject );

            for( const entry of entries )
            {
                let key = entry.key || entry[0];
                let value = entry.value || entry[1];

                const updatedEntry = attempt( () => callback( entry, key, value ) );

                value = updatedEntry?.value || updatedEntry?.[1];

                key = updatedEntry?.key || updatedEntry?.[0] || key;

                if ( !isBlank( key ) && isNonNullValue( value ) )
                {
                    result[key] = value;
                }

                const child = result[key];

                if ( isNonNullObject( child ) && (child instanceof ObjectEntry) && !visited.has( child ) )
                {
                    visited.add( child );
                    result[key] = this._processEntries( child, callback, visited, stack.concat( key ) );
                }
            }

            return ObjectEntry.toObject( ObjectEntry.unwrapValues( result ) );
        }

        _filterEntries( pObject, pFilter, pVisited = new VisitedSet(), pStack = [] )
        {
            const filter = Filters.IS_FILTER( pFilter ) ? pFilter : Filters.IDENTITY;

            const callback = ( entry ) =>
            {
                if ( entry instanceof ObjectEntry )
                {
                    return (entry.meetsCriteria( filter ) ? entry : null);
                }
                return (filter( entry ) ? entry : null);
            };

            return this._processEntries( pObject, callback, pVisited, pStack );
        }

        _mapEntries( pObject, pMapper, pVisited = new VisitedSet(), pStack = [] )
        {
            const mapper = Filters.IS_MAPPER( pMapper ) ? pMapper : Mappers.IDENTITY;

            const callback = ( entry ) => entry instanceof ObjectEntry ? entry.map( mapper ) : mapper( entry );

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
            toObjectLiteral,
            bruteForceJson,
            cherryPick,
            mergeJson
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
