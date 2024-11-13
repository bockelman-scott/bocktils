const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );
const objectUtils = require( "./ObjectUtils.cjs" );

let _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const me = exposeModule;

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils
        };

    let _mt_str = constants._mt_str;
    let _dot = constants._dot;
    let _colon = constants._colon;
    let _dblqt = constants._dblqt;

    let _str = constants._str;
    let _fun = constants._fun;
    let _obj = constants._obj;
    let _bool = constants._bool;
    let _num = constants._num;
    let _big = constants._big;

    let isObject = typeUtils.isObject;
    let isArray = typeUtils.isArray;
    let isString = typeUtils.isString;
    let isFunction = typeUtils.isFunction;
    let isClass = typeUtils.isClass;
    let isDate = typeUtils.isDate;

    const toIterator = typeUtils.toIterator;

    let isNonNullObject = typeUtils.isNonNullObject;
    let isNonNullValue = typeUtils.isNonNullValue;

    let asString = stringUtils.asString;
    let asInt = stringUtils.asInt;
    let isBlank = stringUtils.isBlank;
    let isJson = stringUtils.isJson;

    let asArray = arrayUtils.asArray;
    let pruneArray = arrayUtils.pruneArray;

    let isPopulated = objectUtils.isPopulatedObject || objectUtils.isPopulated;

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( me || this, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK_JSON_INTERPOLATION__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const PRIOR_NODE = "../";

    const DEFAULT_EXCLUSIONS = Object.freeze( ["constructor", "prototype", "toJson", "toObject", "global", "this"] );

    const arrayToString = function( pArr )
    {
        const arr = asArray( pArr );

        return arr.map( e => asString( e ) ).join( _mt_str );
    };

    const MAX_RUN_TIME = 5_000;

    class ResolvedValue
    {
        #expression;

        #root;
        #current;

        #value;

        #json;

        constructor( pExpression, pRoot, pCurrent, pValue, pJsonString )
        {
            this.#expression = asString( pExpression );
            this.#root = isNonNullObject( pRoot ) ? pRoot : null;
            this.#current = pCurrent;
            this.#value = pValue;
            this.#json = asString( pJsonString || _mt_str );
        }

        get expression()
        {
            return asString( this.#expression );
        }

        get key()
        {
            return this.expression;
        }

        get root()
        {
            return this.#root;
        }

        get current()
        {
            return this.#current;
        }

        get value()
        {
            return this.#value;
        }

        get json()
        {
            return asString( this.#json, true );
        }

        set json( value )
        {
            this.#json = asString( value, true );
        }
    }

    ResolvedValue.prototype.equals = function( pOther )
    {
        if ( !(pOther instanceof ResolvedValue) )
        {
            return false;
        }

        if ( asString( pOther?.expression ) !== asString( this.expression ) )
        {
            return false;
        }

        if ( !objectUtils.same( pOther?.root, this.root ) )
        {
            return false;
        }

        if ( !objectUtils.same( pOther?.current, this.current ) )
        {
            return false;
        }

        return objectUtils.same( pOther?.value, this.value );
    };

    class ResolvedMap extends Map
    {
        #map = new Map();

        constructor( pMap = new Map() )
        {
            super();

            this.#map = (pMap instanceof Map) ? new Map( pMap.entries() ) : pMap;

            this.#map = (this.#map instanceof Map) ? this.#map : new Map();
        }

        entries()
        {
            return toIterator( objectUtils.getEntries( this.#map ) );
        }

        keys()
        {
            return toIterator( objectUtils.getKeys( this.#map ) );
        }

        values()
        {
            return toIterator( objectUtils.getValues( this.#map ) );
        }

        [Symbol.iterator]()
        {
            return this.entries();
        }

        clear()
        {
            this.#map.clear();
        }

        delete( pKey )
        {
            return this.#map.delete( pKey );
        }

        forEach( pCallback, pHostObject )
        {
            this.#map.forEach( pCallback, pHostObject );
        }

        get( pKey )
        {
            let value = this.#map.get( pKey );

            if ( isNonNullObject( value ) )
            {
                if ( !(value instanceof ResolvedValue) )
                {
                    value = new ResolvedValue( asString( pKey ), {}, {}, value );

                    this.set( pKey, value );
                }

                return value;
            }

            return null;
        }

        find( pValue, pRoot, pCurrent )
        {
            let V = null;

            for( let entry of this.entries() )
            {
                const key = entry.key || entry[0];
                const value = entry.value || entry[1];

                if ( isNonNullValue( value ) && objectUtils.same( pValue, value ) )
                {
                    if ( !isNonNullObject( pCurrent ) || objectUtils.same( pCurrent, value?.current ) )
                    {
                        if ( !isNonNullObject( pRoot ) || objectUtils.same( pRoot, value?.root ) )
                        {
                            V = value;

                            V = (V instanceof ResolvedValue) ? V : (null === V ? null : new ResolvedValue( key, pRoot, pCurrent, V ));

                            break;
                        }
                    }
                }
            }

            return V;
        }

        has( pKey )
        {
            return this.#map.has( pKey );
        }

        set( pKey, pValue )
        {
            let value = pValue;

            if ( !(value instanceof ResolvedValue) )
            {
                value = new ResolvedValue( pKey, {}, {}, pValue );
            }

            return this.#map.set( pKey, value );
        }
    }

    ResolvedMap.fromMap = function( pMap )
    {
        if ( pMap instanceof Map )
        {
            return new ResolvedMap( pMap );
        }
        return new ResolvedMap();
    };

    class InterpolationEntry
    {
        #hintString;

        #type;

        #typeArgs;
        #argument;

        #useGraph;
        #useScope;

        #base;
        #key;

        constructor( pHintsString, pArgument )
        {
            this.#hintString = isString( pHintsString ) ? asString( pHintsString, true ) : (isString( pArgument ) ? asString( pArgument, true ) : _mt_str);

            this.#hintString = this.#hintString.replace( /^\(/, _mt_str ).replace( /:$/, _mt_str ).replace( /\)$/, _mt_str );

            let hintParts = ([].concat( ...(this.#hintString.split( ";" ) || [this.#hintString]) ).map( e => isString( e ) ? e.trim() : _mt_str ).filter( e => _mt_str !== e )) || [];

            this.#type = (hintParts?.length > 0 ? hintParts[0].trim().replace( /^@/, _mt_str ) : "var").toLowerCase();

            this.#useGraph = (InterpolationEntry.GRAPH_TYPES.includes( this.#type ));

            this.#useScope = !this.#useGraph || (InterpolationEntry.SCOPE_TYPES.includes( this.#type ));

            this.#typeArgs = ([].concat( ...(hintParts?.length > 1 ? hintParts.slice( 1, hintParts.length ) : []) )).map( e => e.split( ":" ).map( ee => isString( ee ) ? ee.trim().replace( /^@|[)(]/, _mt_str ) : _mt_str ) ).map( e => Object.fromEntries( [e] ) );

            let args = {};

            this.#typeArgs = this.#typeArgs.map( e => Object.assign( args, e ) );

            this.#typeArgs = args || this.#typeArgs;

            this.#argument = (isString( pArgument ) ? pArgument.trim() : this.#hintString || _mt_str).replace( /['"`]/, _mt_str );

            this.#base = this.#useGraph ? (this.#typeArgs?.["base"] || "this") : (this.#typeArgs?.["scope"] || "global");

            this.#key = "${(@" + this.#type + ";" + [...(Object.entries( this.#typeArgs ))].map( e => _mt_str + ("@" + e[0] + _colon + e[1]) ).join( ";" ) + "):" + this.#argument + "}";
        }

        isVariable()
        {
            return this.#useScope;
        }

        isTreeNode()
        {
            return this.#useGraph;
        }

        resolve( pScope, pRoot, pCurrent, pResolved, pPaths )
        {
            let scp = pScope || $scope();

            let root = pRoot || pCurrent || scp;

            let current = pCurrent || root || scp;

            let resolved = pResolved || new Map();

            resolved = resolved instanceof Map ? resolved : new Map();

            let paths = [].concat( ...(asArray( pPaths || [] )) );

            let variableName = (this.#argument || "~$~").trim() || "~$~";

            let base = this.#base || (this.#useGraph ? (this.#typeArgs?.["base"] || "this") : (this.#typeArgs?.["scope"] || "global"));

            let node = this.#useGraph ? ((["root"].includes( base ) || ("@root" === this.#argument)) ? root : (["this", "current", "cur", _mt_str].includes( base ) ? current : scp)) : (["global", "self"].includes( base ) ? scp : scp?.[base] || scp);

            if ( variableName.includes( PRIOR_NODE ) )
            {
                while ( !variableName.startsWith( PRIOR_NODE ) )
                {
                    let idx = variableName.indexOf( PRIOR_NODE );

                    variableName = variableName.slice( idx + 3, variableName.length );
                }

                if ( this.#useGraph && base !== "root" && paths.length > 0 )
                {
                    while ( variableName.startsWith( PRIOR_NODE ) )
                    {
                        paths.pop();

                        variableName = variableName.slice( 3, variableName.length );
                    }
                }
                else
                {
                    while ( variableName.includes( PRIOR_NODE ) )
                    {
                        variableName = variableName.replace( PRIOR_NODE, _mt_str );
                    }
                }
            }

            let value = variableName.startsWith( "@" ) ? resolved.get( variableName ) : (node?.[variableName] || resolved.get( this.#key ));

            if ( (_ud === typeof value || null == value) && (variableName.includes( _dot ) || variableName.includes( "/" )) )
            {
                let keyPath = [].concat( ...(variableName.split( /[.\/]/ ).map( e => e.trim() ).filter( e => _mt_str !== e ) || []) );

                while ( (null != node) && keyPath?.length > 0 )
                {
                    let key = keyPath.shift();

                    node = ["global", "self", _mt_str].includes( key ) ? node : node?.[key];

                    value = node;
                }
            }

            if ( value && ["global", "self", "root"].includes( base ) )
            {
                resolved.set( this.#key, value );
            }

            return value;
        }
    }

    InterpolationEntry.GRAPH_TYPES = Object.freeze( ["path", "tree", "object", "obj"] );
    InterpolationEntry.SCOPE_TYPES = Object.freeze( ["var", "variable", "value", _mt_str] );

    class InterpolationMatch
    {
        #text;

        #matchedString;
        #hintString;
        #argument;

        constructor( pString )
        {
            this.#text = pString;

            this.#matchedString = _mt_str;
            this.#hintString = _mt_str;
            this.#argument = _mt_str;

            let matches = [].concat( ...(InterpolationMatch.expression().exec( pString ) || []) );

            if ( matches && matches?.length )
            {
                this.#matchedString = matches[0] || _mt_str;

                this.#hintString = (_mt_str + (matches.length > 1 ? matches[1] || (matches.length > 2 ? matches[2] : _mt_str) : _mt_str)).trim();

                this.#argument = matches.length > 3 ? matches[3] : matches.length > 2 ? matches[2] : _mt_str;
            }

            this.interpolationHint = new InterpolationEntry( this.#hintString || this.#text, this.#argument || this.#hintString || this.#text );
        }

        resolve( pScope, pRoot, pCurrent, pResolved = new Map(), pPaths = [] )
        {
            return this.interpolationHint.resolve( pScope, pRoot, pCurrent, pResolved, pPaths );
        }

        static expression()
        {
            return new RegExp( InterpolationMatch.EXPRESSION );
        }

        static variableExpression()
        {
            return new RegExp( InterpolationMatch.VARIABLE_EXPRESSION );
        }

        static graphExpression()
        {
            return new RegExp( InterpolationMatch.GRAPH_EXPRESSION );
        }

        static canInterpolate( pString )
        {
            return isString( pString ) && (new RegExp( InterpolationMatch.EXPRESSION )).test( pString.trim() );
        }

        static canInterpolateVariables( pString )
        {
            return isString( pString ) && (new RegExp( InterpolationMatch.VARIABLE_EXPRESSION )).test( pString.trim() );
        }

        static canInterpolateTreeNodes( pString )
        {
            return isString( pString ) && (new RegExp( InterpolationMatch.GRAPH_EXPRESSION )).test( pString.trim() );
        }

        static Literal( pMatches )
        {
            return new InterpolationMatchLiteral( pMatches );
        }

        static create( pString )
        {
            if ( isString( pString ) )
            {
                if ( InterpolationMatch.canInterpolate( pString ) )
                {
                    return new InterpolationMatch( pString );
                }
                return InterpolationMatch.Literal( pString );
            }
            throw new Error( "Invalid Argument. The create method requires a string" );
        }
    }

    class InterpolationMatchLiteral extends InterpolationMatch
    {
        #text;
        #hintString;
        #argument;

        constructor( pString )
        {
            super( pString );

            this.#text = pString;
            this.#hintString = pString;
            this.#argument = pString;
        }

        resolve()
        {
            return this.#argument || this.#text || this.#hintString;
        }
    }

    InterpolationMatch.EXPRESSION = /\$\{(\([^)]+\):?)?([^}]+)}/;
    InterpolationMatch.VARIABLE_EXPRESSION = /\$\{(\((@var|@variable|@value)[^)]+\):?)([^}]+)}/;
    InterpolationMatch.GRAPH_EXPRESSION = /\$\{(\((@path|@tree|@object|@obj)[^)]+\):?)([^}]+)}/;

    class Interpolator
    {
        #text;
        #segments;
        #matchers;

        #root;
        #current;

        #resolved;

        constructor( pString, pRoot, pCurrent, pResolved = new ResolvedMap() )
        {
            this.#text = asString( pString );

            this.#segments = [];

            this.#matchers = [];

            this.#root = isNonNullObject( pRoot ) ? pRoot : null;
            this.#current = pCurrent;

            this.#resolved = (pResolved instanceof ResolvedMap) ? pResolved : (pResolved instanceof Map) ? ResolvedMap.fromMap( pResolved ) : null;

            let s = this.#text || _mt_str;

            let len = this.#text?.length || 0;

            let start = 0;

            let rx = new RegExp( InterpolationMatch.EXPRESSION, "gds" );

            let matches = rx.exec( s );

            while ( matches && matches?.length )
            {
                let indices = matches?.indices;

                let bounds = indices?.length > 0 ? indices[0] : [-1, -1];

                let lower = Math.max( 0, bounds[0] );

                let upper = Math.min( len, bounds[1] );

                if ( start < lower )
                {
                    this.addSegment( start, lower );
                }

                this.addSegment( lower, upper );

                start = upper;

                matches = rx.exec( s );
            }

            if ( start < len )
            {
                this.addSegment( start, len );
            }
        }

        get length()
        {
            return this.#text?.length || 0;
        }

        get text()
        {
            return asString( this.#text );
        }

        get segments()
        {
            return [].concat( ...(this.#segments || []) );
        }

        get matchers()
        {
            return this.segments.map( e => InterpolationMatch.create( e ) );
        }

        addSegment( pStart, pEnd )
        {
            let len = this.length || 0;

            let start = Math.min( Math.max( 0, (pStart || 0) ), len );

            let end = Math.min( pEnd, len );

            let segment = this.#text.slice( start, end );

            this.#segments.push( segment );

            let interpolatorMatch = InterpolationMatch.create( segment );

            this.#matchers.push( interpolatorMatch );

            return this;
        }

        resolve( pScope = $scope(), pRoot, pCurrent, pResolved = new ResolvedMap(), pPaths = [] )
        {
            let scope = pScope || $scope();

            let root = isNonNullObject( pRoot ) ? pRoot : this.#root;
            let current = pCurrent || this.#current;

            let resolved = (pResolved instanceof ResolvedMap) ? pResolved : (pResolved instanceof Map) ? ResolvedMap.fromMap( pResolved ) : this.#resolved;

            let paths = asArray( pPaths || [] ) || [];

            let arr = asArray( this.#matchers.map( e => e.resolve( scope, root, current, resolved, paths ) ) );

            return arr?.length > 1 ? arr : arr[0];
        }
    }

    const interpolate = function( pScope = $scope(), pRoot, pCurrent, pResolved = new ResolvedMap(), pPaths = [], pOptions = {} )
    {
        let resolved = (pResolved instanceof ResolvedMap) ? pResolved : (pResolved instanceof Map) ? ResolvedMap.fromMap( pResolved ) : new ResolvedMap();

        let paths = pPaths || [];

        let options = Object.assign( {}, pOptions || {} );

        let scp = pScope || $scope();

        let root = pRoot || pCurrent || scp;

        let obj = pCurrent || root || scp;

        let entries = isObject( obj ) ? objectUtils.getEntries( obj ) : toIterator( obj );

        for( const entry of entries )
        {
            let key = entry.key || entry[0];

            const value = entry.value || entry[1] || obj[key] || key || _mt_str;

            switch ( typeof value )
            {
                case _ud:
                    delete obj[key];
                    break;

                case _str:
                    const interpolator = new Interpolator( value, root, obj, resolved );

                    if ( InterpolationMatch.canInterpolate( value ) )
                    {
                        obj[key] = interpolator.resolve( pScope || $scope(), root, obj, resolved, paths );
                    }
                    break;

                case _obj:

                    if ( null === value )
                    {
                        break;
                    }

                    paths.push( key );

                    obj[key] = interpolate( (pScope || $scope()), root, value, resolved, paths );

                    paths.pop();

                    break;

                default:
                    break;
            }
        }

        return obj;
    };

    const DEFAULT_NULL_HANDLER = function( pValue, pOptions )
    {
        return _ud === typeof pValue ? _dblqt + _dblqt : (null === pValue ? null : asJson( pValue, pOptions ));
    };

    const DEFAULT_OPTIONS_FOR_JSON =
        {
            handleNull: DEFAULT_NULL_HANDLER,
            omitFunctions: false,
            useToJson: true,
            quoteBooleans: false,
            quoteNumbers: false,
            resolved: new Map(),
            visited: new Set()
        };

    const canUseToJson = function( pObj, pToJsonMethod )
    {
        let func = ((_fun === typeof pToJsonMethod) ? pToJsonMethod : pObj?.toJson);

        if ( _fun === typeof func )
        {
            const source = asString( Function.prototype.toString.call( func, func ), true );

            if ( source && !(source.includes( "jsonUtils.jsonify" ) || source.includes( "jsonInterpolationUtils.asJson" )) )
            {
                return true;
            }
        }

        return false;
    };

    const _toJson = function( obj )
    {
        let json = null;

        try
        {
            json = obj.toJson();
        }
        catch( ex )
        {
            console.error( ex );
        }

        if ( json && stringUtils.isValidJson( json ) )
        {
            return json;
        }

        return null;
    };

    // never allow this function to run longer than 5 seconds
    const _exceededTimeLimit = function( pOptions, pMaxRunTime )
    {
        const options = (isDate( pOptions ) ? { startTime: pOptions } : pOptions) || Object.assign( {}, pOptions || {} );

        const now = new Date().getTime();

        const startTime = options.startTime || now;

        options.startTime = startTime;

        const maxTime = Math.max( 100, asInt( asInt( asInt( options?.maxRunTime, pMaxRunTime ), MAX_RUN_TIME ) || MAX_RUN_TIME ) );

        return ((now - startTime) > maxTime);
    };

    function _resolveNullHandler( options )
    {
        return (isFunction( options.handleNull ) && options.handleNull.length >= 1) ? options.handleNull : DEFAULT_NULL_HANDLER;
    }

    function _resolveRoot( pRoot, pOptions, pObject )
    {
        return isNonNullObject( pRoot ) ? pRoot : ((isNonNullObject( pOptions.root ) ? pOptions.root : null) || (isObject( pObject ) ? pObject : null));
    }

    function _resolveInclusions( options )
    {
        return pruneArray( [].concat( ...(asArray( options.include || [] )) ) );
    }

    function _resolveExclusions( pOptions, pInclusions = [] )
    {
        const arr = pruneArray( (asArray( pOptions?.exclude || [] )).concat( DEFAULT_EXCLUSIONS ) );

        const inclusions = asArray( pInclusions || [] );

        return arr.filter( e => !inclusions.includes( e ) );
    }

    function funcToJson( pFunction, pOptions )
    {
        const options = Object.assign( {}, pOptions || DEFAULT_OPTIONS_FOR_JSON );

        if ( options?.omitFunctions )
        {
            return _dblqt + _dblqt;
        }

        let name = pFunction?.name;

        if ( isClass( pFunction ) )
        {
            name = asString( objectUtils.getClassName( pFunction ) || name ) || name;
        }

        return JSON.stringify( {
                                   type: _fun,
                                   name: name || "anonymous"
                               } );
    }

    function _dateToJson( pDate, pOptions )
    {
        const options = Object.assign( {}, pOptions || {} );

        const _formatDates = options.formatDates || false;

        const _dateTimeFormatter = _formatDates ? (options.dateTimeFormatter) : null;

        let jsonString = _mt_str;

        if ( _formatDates && null !== _dateTimeFormatter && isFunction( _dateTimeFormatter?.format ) )
        {
            jsonString += JSON.stringify( _dateTimeFormatter.format( pDate ) );
        }
        else
        {
            jsonString += asJson( (isFunction( pDate.getTime ) ? pDate.getTime() : asInt( pDate )), options );
        }

        return jsonString;
    }

    function _stringToJson( pString, pRoot, pCurrent, pResolved, pPaths, pOptions )
    {
        const s = asString( pString );

        const options = Object.assign( {}, pOptions || {} );

        const root = isNonNullObject( pRoot ) ? pRoot : options?.root || {};
        const current = isNonNullObject( pCurrent ) ? pCurrent : options?.current || s;
        const resolved = pResolved || options?.resolved || new Map();

        let paths = pPaths || options?.paths || [];

        let jsonString = _mt_str;

        try
        {
            if ( InterpolationMatch.canInterpolate( s ) )
            {
                const value = new Interpolator( s ).resolve( $scope(), root, current, resolved, paths );

                jsonString = JSON.stringify( value );
            }
            else
            {
                jsonString = JSON.stringify( asString( s, (true === pOptions.trimStrings) ) );
            }
        }
        catch( ex )
        {
            console.error( ex.message );

            if ( isBlank( jsonString ) )
            {
                jsonString = JSON.stringify( ex.message );
            }
        }

        return asString( jsonString );
    }

    function _boolToJson( pBoolean, pOptions )
    {
        const options = Object.assign( {}, pOptions || DEFAULT_OPTIONS_FOR_JSON );

        let jsonString = JSON.stringify( pBoolean );

        if ( true === options?.quoteBooleans && !/"true"|"false"/.test( jsonString ) )
        {
            jsonString = _dblqt + jsonString + _dblqt;
        }

        return jsonString;
    }

    function _numToJson( pNum, pOptions )
    {
        const options = Object.assign( {}, pOptions || DEFAULT_OPTIONS_FOR_JSON );

        let jsonString = _mt_str;

        if ( isNaN( pNum ) )
        {
            jsonString = JSON.stringify( options?.NaN || "NaN" );
        }
        else if ( !isFinite( pNum ) )
        {
            jsonString = JSON.stringify( options?.Infinity || "Infinity" );
        }
        else
        {
            jsonString = JSON.stringify( pNum );
        }

        if ( true === options?.quoteNumbers && !/"[\d.]"/.test( jsonString ) )
        {
            jsonString = _dblqt + jsonString + _dblqt;
        }

        return jsonString;
    }

    function _resolveObject( obj )
    {
        if ( obj instanceof Set || obj instanceof Map )
        {
            return objectUtils.toLiteral( obj );
        }

        if ( isPopulated( obj ) || isArray( obj ) )
        {
            return obj;
        }

        return {};
    }

    function buildPathExpression( pPaths )
    {
        let paths = [].concat( (asArray( pPaths || [] ) || []).map( e => asString( e, true ) ).filter( e => !isBlank( e ) ) ).flat();

        return "${(@path;@base:root):" + (paths.length > 0 ? paths.join( _dot ) : "@root") + "}";
    }

    const asJson = function( pObject, pOptions = DEFAULT_OPTIONS_FOR_JSON, pVisited = new Set(), pResolved = new ResolvedMap(), pPaths = [], pRoot, pScope = $scope() )
    {
        const options = Object.assign( {}, pOptions || {} );

        const handleNull = _resolveNullHandler( options );

        const obj = (isNonNullValue( pObject ) ? pObject : null) || options.object;

        if ( _ud === typeof obj || null === obj )
        {
            return handleNull( obj, options );
        }

        const root = _resolveRoot( pRoot, options, obj );
        options.root = root;

        const current = obj;

        if ( !(false === options?.useToJson) && canUseToJson( obj, obj?.toJson ) )
        {
            const json = _toJson( obj );
            if ( json )
            {
                return json;
            }
        }

        options.startTime = options.startTime || new Date().getTime();

        // never allow this function to run longer than 5 seconds
        if ( _exceededTimeLimit( options ) )
        {
            return JSON.stringify( isFunction( obj?.toString ) ? obj.toString() : obj?.name || obj?.source || obj?.value );
        }

        const _include = _resolveInclusions( options );
        options.include = _include || [];

        const _exclude = _resolveExclusions( options, _include );
        options.exclude = _exclude || [];

        let resolved = pResolved || options.resolved || new Map();
        options.resolved = resolved;

        let visited = pVisited || options.visited || new Set();
        options.visited = visited;

        let paths = pPaths || options.paths || [];
        options.paths = paths;

        const omitFunctions = options?.omitFunctions;

        let jsonString = _mt_str;

        switch ( typeof obj )
        {
            case _ud:
                jsonString = handleNull( obj, options ) || JSON.stringify( "undefined" );
                break;

            case _str:
                jsonString = _stringToJson( obj, root, current, resolved, paths, options );
                break;

            case _bool:
                jsonString = _boolToJson( obj, options );
                break;

            case _num:
                jsonString = _numToJson( obj, options );
                break;

            case _big:
                jsonString = (BigInt( obj )).toString();
                break;

            case _fun:
                jsonString = funcToJson( obj, options );

                break;

            case _obj:

                if ( isDate( obj ) )
                {
                    jsonString = _dateToJson( obj, options );
                    break;
                }

                let object = _resolveObject( obj, options );

                let isArr = isArray( object );

                let resolvedValue = resolved.find( object, root, current );

                let asResolved = resolvedValue || new ResolvedValue( buildPathExpression( paths ), root, current, object );

                resolved.set( asResolved?.key, asResolved );

                if ( visited.has( object ) || (isNonNullValue( resolvedValue ) && resolvedValue instanceof ResolvedValue) )
                {
                    jsonString = asResolved?.json || JSON.stringify( asResolved?.expression );
                }
                else
                {
                    visited.add( object );

                    let s = isArr ? "[" : "{";

                    let entries = objectUtils.getEntries( object ) || [];

                    let transient = [].concat( _exclude || [] ).filter( e => !_include.includes( e ) );

                    entries = entries.filter( e => !transient.includes( asString( e.key || e[0], true ) ) );

                    let prependComma = false;

                    for( const entry of entries )
                    {
                        let key = asString( entry.key || entry[0], true );

                        const value = entry.value || entry[1];

                        if ( (isFunction( value ) && omitFunctions) || isBlank( key ) )
                        {
                            continue;
                        }

                        if ( prependComma )
                        {
                            s += ",";
                        }

                        if ( !isArr )
                        {
                            s += (_dblqt + key + _dblqt + _colon);
                        }

                        if ( isObject( value ) && isNonNullObject( value ) )
                        {
                            resolvedValue = resolved.get( value );

                            asResolved = resolvedValue || buildPathExpression( paths );

                            if ( visited.has( value ) )
                            {
                                try
                                {
                                    s += JSON.stringify( asResolved );
                                }
                                catch( ex )
                                {
                                    console.warn( ex );

                                    s += JSON.stringify( ex.message );
                                }
                            }
                            else
                            {
                                paths.push( key );

                                try
                                {
                                    s += asJson( value, options, visited, resolved, paths, root );
                                }
                                catch( ex )
                                {
                                    console.warn( ex );

                                    s += JSON.stringify( ex.message );
                                }

                                visited.add( value );

                                paths.pop();
                            }
                        }
                        else
                        {
                            try
                            {
                                s += asJson( value, options, visited, resolved, paths );
                            }
                            catch( ex )
                            {
                                console.warn( ex );

                                s += JSON.stringify( ex.message );
                            }
                        }

                        prependComma = true;
                    }

                    s += isArr ? "]" : "}";

                    jsonString = s;

                    if ( asResolved instanceof ResolvedValue )
                    {
                        asResolved.json = jsonString;
                        resolved.set( asResolved?.key, asResolved );
                    }
                }

                break;
        }

        return asString( jsonString );
    };

    const parseJson = function( pString, pResolved = new ResolvedMap(), pPaths = [], pOptions )
    {
        let s = asString( pString );

        let obj = null;

        let resolved = pResolved || new ResolvedMap();

        let paths = pPaths || [];

        const options = Object.assign( {}, pOptions || {} );

        let rx = /\$\{[^}]+}/g;

        let matchedVariables = rx.exec( s );

        let shouldInterpolate = (matchedVariables && matchedVariables?.length > 0);

        try
        {
            obj = JSON.parse( s );
        }
        catch( ex )
        {
            console.error( ex.message );

            if ( !isJson( s ) )
            {
                return asArray( s );
            }
        }

        if ( shouldInterpolate )
        {
            paths.push( "" );

            obj = interpolate( $scope(), obj, obj, resolved, paths, options );

            paths.pop();
        }

        return obj;
    };

    const mod =
        {
            dependencies,
            asJson,
            parseJson
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
