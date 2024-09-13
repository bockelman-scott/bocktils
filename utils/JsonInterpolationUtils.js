const constants = require( "./Constants.js" );
const stringUtils = require( "./StringUtils.js" );
const arrayUtils = require( "./ArrayUtils.js" );
const objectUtils = require( "./ObjectUtils.js" );

let _ud = constants._ud || "undefined";
let _mt_str = constants._mt_str || "";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function makeModule()
{
    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK_JSON_INTERPOLATION__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const MAX_RUN_TIME = 5_000;

    class InterpolationEntry
    {
        constructor( pHintsString, pArgument )
        {
            this._hintString = _str === typeof pHintsString ? pHintsString.trim() : (_str === typeof pArgument ? pArgument.trim() : _mt_str);

            this._hintString = this._hintString.replace( /^\(/, _mt_chr ).replace( /:$/, _mt_str ).replace( /\)$/, _mt_str );

            let hintParts = ([].concat( ...(this._hintString.split( ";" ) || [this._hintString]) ).map( e => _str === typeof e ? e.trim() : _mt_str ).filter( e => _mt_str !== e )) || [];

            this._type = (hintParts?.length > 0 ? hintParts[0].trim().replace( /^@/, _mt_str ) : "var").toLowerCase();

            this._useGraph = (InterpolationEntry.GRAPH_TYPES.includes( this._type ));

            this._useScope = !this._useGraph || (InterpolationEntry.SCOPE_TYPES.includes( this._type ));

            this._typeArgs = ([].concat( ...(hintParts?.length > 1 ? hintParts.slice( 1, hintParts.length ) : []) )).map( e => e.split( ":" ).map( ee => _str === typeof ee ? ee.trim().replace( /^@/, _mt_str ).replace( "(", _mt_str ).replace( ")", _mt_str ) : _mt_str ) ).map( e => Object.fromEntries( [e] ) );

            let args = {};

            this._typeArgs = this._typeArgs.map( e => Object.assign( args, e ) );

            this._typeArgs = args || this._typeArgs;

            this._argument = (_str === typeof pArgument ? pArgument.trim() : this._hintString || _mt_str).replace( /['"`]/, _mt_str );

            this._base = this._useGraph ? (this._typeArgs?.["base"] || "this") : (this._typeArgs?.["scope"] || "global");

            this._key = "${(@" + this._type + ";" + [...(Object.entries( this._typeArgs ))].map( e => _mt_str + ("@" + e[0] + _colon + e[1]) ).join( ";" ) + "):" + this._argument + "}";
        }

        isVariable()
        {
            return this._useScope;
        }

        isTreeNode()
        {
            return this._useGraph;
        }

        resolve( pScope, pRoot, pCurrent, pResolved, pPaths )
        {
            let scp = pScope || $scope();

            let root = pRoot || pCurrent || scp;

            let current = pCurrent || root || scp;

            let resolved = pResolved || new Map();

            let paths = [].concat( ...(pPaths || []) );

            let variableName = (this._argument || "~$~").trim() || "~$~";

            let base = this._base || (this._useGraph ? (this._typeArgs?.["base"] || "this") : (this._typeArgs?.["scope"] || "global"));

            let node = this._useGraph ? ((["root"].includes( base ) || ("@root" === this._argument)) ? root : (["this", "current", "cur", _mt_str].includes( base ) ? current : scp)) : (["global", "self"].includes( base ) ? scp : scp?.[base] || scp);

            if ( variableName.includes( "../" ) )
            {
                while ( !variableName.startsWith( "../" ) )
                {
                    let idx = variableName.indexOf( "../" );

                    variableName = variableName.slice( idx + 3, variableName.length );
                }

                if ( this._useGraph && base !== "root" && paths.length > 0 )
                {
                    while ( variableName.startsWith( "../" ) )
                    {
                        paths.pop();

                        variableName = variableName.slice( 3, variableName.length );
                    }
                }
                else
                {
                    while ( variableName.includes( "../" ) )
                    {
                        variableName = variableName.replace( "../", _mt_str );
                    }
                }
            }

            let value = variableName.startsWith( "@" ) ? resolved.get( variableName ) : (node?.[variableName] || resolved.get( this._key ));

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
                resolved.set( this._key, value );
            }

            return value;
        }
    }

    InterpolationEntry.GRAPH_TYPES = Object.freeze( ["path", "tree", "object", "obj"] );
    InterpolationEntry.SCOPE_TYPES = Object.freeze( ["var", "variable", "value", _mt_str] );

    class InterpolationMatch
    {
        constructor( pMatches )
        {
            this._input = pMatches;
            this._matchedString = _mt_str;
            this._hintString = _mt_str;
            this._argument = _mt_str;

            let matches = null;

            switch ( typeof pMatches )
            {
                case _ud:
                    throw new Error( "Invalid Argument. The InterpolationMatch constructor requires either a string or the result of a call to RegExp.exec or String.match" );

                case _obj:

                    matches = [].concat( ...(pMatches || []) );

                // fallthrough
                case _str:

                    matches = [].concat( ...(InterpolationMatch.expression().exec( pMatches ) || []) );

                    if ( matches && matches?.length )
                    {
                        this._matchedString = matches[0] || _mt_str;

                        this._hintString = (_mt_str + (matches.length > 1 ? matches[1] || (matches.length > 2 ? matches[2] : _mt_str) : _mt_str)).trim();

                        this._argument = matches.length > 3 ? matches[3] : matches.length > 2 ? matches[2] : _mt_str;
                    }

                    this.interpolationHint = new InterpolationEntry( this._hintString || this._input, this._argument || this._hintString || this._input );

                    break;

                default:
                    throw new Error( "Invalid Argument. The InterpolationMatch constructor requires either a string or the result of a call to RegExp.exec or String.match" );

            }
        }

        resolve( pScope, pRoot, pCurrent, pResolved, pPaths )
        {
            return this.interpolationHint.resolve( pScope, pRoot, pCurrent, pResolved, pPaths );
        }

        resolveVariables( pScope, pResolved )
        {
            if ( this.interpolationHint.isVariable() )
            {
                return this.resolve( pScope, EMPTY_OBJECT, EMPTY_OBJECT, pResolved, EMPTY_ARRAY );
            }
            return this._matchedString;
        }

        resolveTreeNodes( pRoot, pCurrent, pResolved, pPaths )
        {
            if ( this.interpolationHint.isTreeNode() )
            {
                return this.resolve( $scope(), pRoot, pCurrent, pResolved, pPaths );
            }
            return this._matchedString;
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
            return _str === typeof pString && (new RegExp( InterpolationMatch.EXPRESSION )).test( pString.trim() );
        }

        static canInterpolateVariables( pString )
        {
            return _str === typeof pString && (new RegExp( InterpolationMatch.VARIABLE_EXPRESSION )).test( pString.trim() );
        }

        static canInterpolateTreeNodes( pString )
        {
            return _str === typeof pString && (new RegExp( InterpolationMatch.GRAPH_EXPRESSION )).test( pString.trim() );
        }

        static Literal( pMatches )
        {
            return new InterpolationMatchLiteral( pMatches );
        }

        static create( pString )
        {
            if ( _str === typeof pString )
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
        constructor( pMatches )
        {
            super( pMatches );

            this._matchedString = pMatches;
            this._hintString = pMatches;
            this._argument = pMatches;
        }

        resolve( pRootOrScope, pCurrent, pResolved )
        {
            return this._argument || this._matchedString || this._input;
        }
    }

    InterpolationMatch.EXPRESSION = /\$\{(\([^)]+\):?)?([^}]+)}/;
    InterpolationMatch.VARIABLE_EXPRESSION = /\$\{(\((@var|@variable|@value)[^)]+\):?)([^}]+)}/;
    InterpolationMatch.GRAPH_EXPRESSION = /\$\{(\((@path|@tree|@object|@obj)[^)]+\):?)([^}]+)}/;


    class Interpolator
    {
        constructor( pString )
        {
            this._input = (_mt_str + (pString || _mt_str));

            this._length = this._input?.length;

            this._segments = [];

            this._interpolationMatchers = [];

            let s = this._input || _mt_str;

            let len = this._input?.length || 0;

            let start = 0;

            let rx = new RegExp( InterpolationMatch.EXPRESSION, "gd" );

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
            return this._input?.length || this._length || 0;
        }

        get input()
        {
            return (_mt_str + (this._input || _mt_str));
        }

        get segments()
        {
            return [].concat( ...(this._segments || EMPTY_ARRAY) );
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

            let segment = this._input.slice( start, end );

            this._segments.push( segment );

            let interpolatorMatch = InterpolationMatch.create( segment );

            this._interpolationMatchers.push( interpolatorMatch );

            return this;
        }

        resolve( pScope, pRoot, pCurrent, pResolved, pPaths )
        {
            let arr = this._interpolationMatchers.map( e => e.resolve( pScope, pRoot, pCurrent, pResolved, pPaths ) );

            if ( arr?.length > 1 )
            {
                if ( arr.every( e => _str === typeof e ) )
                {
                    return arr.join( _mt_chr );
                }

                return arr;
            }

            return arr[0];
        }

        resolveVariables( pScope, pResolved )
        {
            let arr = this._interpolationMatchers.map( e => e.resolveVariables( pScope, pResolved ) );

            if ( arr?.length > 1 )
            {
                if ( arr.every( e => _str === typeof e ) )
                {
                    return arr.join( _mt_chr );
                }

                return arr;
            }

            return arr[0];
        }

        resolveTreeNodes( pRoot, pCurrent, pResolved, pPaths )
        {
            let arr = this._interpolationMatchers.map( e => e.resolveTreeNodes( $scope(), pRoot, pCurrent, pResolved, pPaths ) );

            if ( arr?.length > 1 )
            {
                if ( arr.every( e => _str === typeof e ) )
                {
                    return arr.join( _mt_chr );
                }

                return arr;
            }

            return arr[0];
        }
    }

    const interpolate = function( pScope, pRoot, pCurrent, pResolved, pPaths, pOptions )
    {
        let resolved = pResolved || new Map();

        let paths = pPaths || [];

        let options = Object.assign( {}, pOptions || {} );

        const _assumeUnderscoreConvention = options._assumeUnderscoreConvention || options.assumeUnderscoreConvention;

        let scp = pScope || $scope();

        let root = pRoot || pCurrent || scp;

        let obj = pCurrent || root || scp;

        let entries = Object.entries( obj );

        let interpolateVariables = pOptions?.interpolateVariables || pOptions?.interpolateAll || ( !isPopulated( pOptions ));
        let interpolateTreeNodes = pOptions?.interpolateTreeNodes || pOptions?.interpolateAll || ( !isPopulated( pOptions ));
        let interpolateAll = (interpolateVariables && interpolateTreeNodes) || !isPopulated( pOptions );

        for( const entry of entries )
        {
            let key = entry?.length > 0 ? entry[0] : _mt_str;

            if ( _assumeUnderscoreConvention )
            {
                key = key.replace( /^_/, _mt_str );
            }

            const value = entry?.length > 1 ? entry[1] || obj[key] || _mt_str : _mt_str;

            switch ( typeof value )
            {
                case _ud:
                    delete obj[key];
                    break;

                case _str:
                    if ( interpolateAll && InterpolationMatch.canInterpolate( value ) )
                    {
                        obj[key] = new Interpolator( value ).resolve( pScope || $scope(), root, obj, resolved, paths );
                    }
                    else if ( interpolateVariables && InterpolationMatch.canInterpolateVariables( value ) )
                    {
                        obj[key] = new Interpolator( value ).resolveVariables( pScope || $scope(), resolved );
                    }
                    else if ( interpolateTreeNodes && InterpolationMatch.canInterpolateTreeNodes( value ) )
                    {
                        obj[key] = new Interpolator( value ).resolveTreeNodes( root, obj, resolved, paths );
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
        if ( _ud === typeof pValue )
        {
            return _dblqt + _dblqt;
        }
        else if ( null === pValue )
        {
            return null;
        }
        else
        {
            return asJson( pValue, pOptions );
        }
    };

    const DEFAULT_OPTIONS_FOR_JSON =
        {
            handleNull: DEFAULT_NULL_HANDLER,
            omitFunctions: false,
            assumeUnderscoresConvention: true,
            useToJson: true
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

    const asJson = function( pObject, pOptions = DEFAULT_OPTIONS_FOR_JSON, pVisited = new Set(), pResolved = new Map(), pPaths = [], pIsReentry = false )
    {
        const options = Object.assign( {}, pOptions || {} );

        const omitFunctions = options?.omitFunctions;

        const useToJson = !(false === options.useToJson);

        const handleNull = (_fun === typeof options.handleNull && options.handleNull.length >= 1) ? options.handleNull : DEFAULT_NULL_HANDLER;

        if ( _ud === typeof pObject || null === pObject )
        {
            return handleNull( pObject, options );
        }

        if ( canUseToJson( pObject, pObject?.toJson ) )
        {
            let json = null;

            try
            {
                json = pObject.toJson();
            }
            catch( ex )
            {
                console.error( ex );
            }

            if ( json && stringUtils.isValidJson( json ) )
            {
                return json;
            }
        }

        const startTime = options.startTime || new Date().getTime();

        const now = new Date().getTime();

        options.startTime = startTime;

        // never allow this function to run longer than 5 seconds
        if ( (now - startTime) > MAX_RUN_TIME )
        {
            return (_fun === typeof pObject?.toString ? pObject.toString() : pObject?.name);
        }

        const _assumeUnderscoreConvention = options?.assumeUnderscoresConvention || options._assumeUnderscoreConvention;

        const _exclude = pruneArray( ["constructor", "prototype", "toJson", "toObject", "global", "this"].concat( (asArray( options.exclude || [] )) ) );

        const _include = pruneArray( [].concat( ...(asArray( options.include || [] )) ) );

        const _trimStrings = options.trimStrings || false;

        const _quoteBooleans = options.quoteBooleans || false;

        const _convertDatesToString = false;

        const _dateTimeFormat = _convertDatesToString ? (options.dateTimeFormat || "MM/DD/YYYY hh:mm:ss") : _mt_str;


        let resolved = pResolved || options.resolved || new Map();

        let visited = pVisited || options.visited || new Set();

        let paths = pPaths || options.paths || [];

        let jsonString = _mt_str;

        let obj = pObject || options.object;

        switch ( typeof pObject )
        {
            case _ud:
                jsonString = handleNull( pObject, options ) || JSON.stringify( "undefined" );
                break;

            case _str:
                try
                {
                    if ( InterpolationMatch.canInterpolateVariables( pObject ) )
                    {
                        jsonString = JSON.stringify( new Interpolator( pObject ).resolveVariables( $scope(), resolved, options ) );
                    }
                    else
                    {
                        jsonString = JSON.stringify( asString( pObject, _trimStrings ) );
                    }
                }
                catch( ex )
                {
                    console.error( ex.message );
                }
                break;

            case _bool:
                jsonString = JSON.stringify( pObject );

                if ( _quoteBooleans )
                {
                    jsonString = _dblqt + jsonString + _dblqt;
                }
                break;

            case _num:
                jsonString = (isNaN( pObject ) ? JSON.stringify( "NaN" ) : !isFinite( pObject ) ? JSON.stringify( "Infinity" ) : JSON.stringify( pObject ));
                break;

            case _big:
                jsonString = (BigInt( pObject )).toString();
                break;

            case _fun:
                if ( omitFunctions )
                {
                    jsonString = "\"\"";
                    break;
                }

                obj =
                    {
                        type: _fun,
                        name: pObject?.name || "anonymous"
                    };

                jsonString = JSON.stringify( obj );

                break;

            case _obj:

                if ( isDate( pObject ) )
                {
                    if ( _convertDatesToString && !isBlank( _dateTimeFormat ) )
                    {
                        const dateUtils = require( "./DateUtils.js" );

                        jsonString += _dblqt + dateUtils.parseDateTime( pObject, _dateTimeFormat ) + _dblqt;
                    }
                    else
                    {
                        jsonString += asJson( (isFunction( pObject.getTime ) ? pObject.getTime() : asInt( pObject )), options );
                    }
                    break;
                }

                let object = (pObject instanceof Set || pObject instanceof Map) ? objectUtils.toLiteral( pObject ) : (isPopulated( pObject ) || (null != pObject && Array.isArray( pObject )) ? pObject : (null != pObject && Array.isArray( pObject ) ? [] : {}));

                object = object || {};

                let isArr = (null != object) && (Array.isArray( object ));

                let resolvedValue = resolved.get( object );

                let asResolved = resolvedValue || ("${(@path;@base:root):" + (paths.length > 0 ? paths.join( _dot ) : "@root") + "}");

                resolved.set( object, asResolved );

                if ( visited.has( object ) )
                {
                    jsonString = JSON.stringify( asResolved );
                }
                else
                {
                    visited.add( object );

                    let s = isArr ? "[" : "{";

                    let entries = Object.entries( object ) || [];

                    let transient = [].concat( _exclude || [] );

                    if ( isInstanceOfUserDefinedClass( object ) || isUserDefinedClass( object ) )
                    {
                        transient = transient.concat( asArray( object.transientProperties || [] ) );

                        const clazz = getClass( pObject ) || pObject;

                        transient = transient.concat( asArray( clazz?.TRANSIENT_PROPERTIES || clazz?.transientProperties || [] ) );

                        transient.push( "TRANSIENT_PROPERTIES", "transientProperties" );

                        transient = unique( pruneArray( transient ) );
                    }

                    entries = entries.filter( e => !_exclude.includes( asString( e[0], true ) ) ).filter( e => !_exclude.includes( "_" + asString( e[0], true ) ) );

                    if ( 0 < _include.length || 0 )
                    {
                        entries = entries.filter( e => _include.includes( asString( e[0], true ) ) );
                    }

                    let prependComma = false;

                    if ( entries && (0 < entries?.length || 0) )
                    {
                        for( const entry of entries )
                        {
                            let key = asString( (_mt_str + ((0 < entry?.length || 0) ? entry[0] : _mt_str)), true );

                            if ( _assumeUnderscoreConvention )
                            {
                                key = key.replace( /^_/, _mt_str );
                            }

                            const value = (1 < entry?.length || 0) ? entry[1] : _mt_str;

                            if ( _fun === typeof value && omitFunctions )
                            {
                                continue;
                            }

                            if ( isBlank( key.trim() ) )
                            {
                                continue;
                            }

                            if ( prependComma )
                            {
                                s += ",";
                            }

                            if ( _assumeUnderscoreConvention )
                            {
                                key = key.replace( /^_/, _mt_str );
                            }

                            if ( !isArr )
                            {
                                s += (_dblqt + key + _dblqt + _colon);
                            }

                            if ( _obj === typeof value && null != value )
                            {
                                resolvedValue = resolved.get( value );

                                asResolved = resolvedValue || ("${(@path;@base:root):" + (paths.length > 0 ? paths.join( _dot ) : "@root") + "}");

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
                                        s += asJson( value, options, visited, resolved, paths );
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
                    }

                    s += isArr ? "]" : "}";

                    jsonString = s;
                }

                break;
        }

        return asString( jsonString ).replaceAll( /("[^"]+"\s*:\s*"\{"~~deleted~~"}\s*,*)/g, _mt_str );
    };

    const parseJson = function( pString, pResolved = new Map(), pPaths = [], pOptions )
    {
        let s = asString( pString );

        let obj = null;

        let resolved = pResolved || new Map();

        let paths = pPaths || [];

        const options = Object.assign( {}, pOptions || {} );

        const _assumeUnderscoreConvention = options._assumeUnderscoreConvention || options.assumeUnderscoreConvention;

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
        }

        if ( shouldInterpolate )
        {
            let scp = $scope();

            let root = obj;

            paths.push( "" );

            resolved.set( "@root", root );

            obj = interpolate( scp, root, obj, resolved, paths, options );

            scp = null;

            root = null;
        }

        matchedVariables = null;

        rx = null;

        paths = null;

        resolved = null;

        return obj;
    };

    const mod =
        {
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
