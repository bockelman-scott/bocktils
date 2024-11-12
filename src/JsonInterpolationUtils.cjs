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

    let isString = typeUtils.isString;
    let isFunction = typeUtils.isFunction;
    let isDate = typeUtils.isDate;


    let asString = stringUtils.asString;
    let isBlank = stringUtils.isBlank;

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

    const arrayToString = function( pArr )
    {
        const arr = asArray( pArr );

        return arr.map( e => asString( e ) ).join( _mt_str );
    };

    const MAX_RUN_TIME = 5_000;

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

            if ( variableName.includes( "../" ) )
            {
                while ( !variableName.startsWith( "../" ) )
                {
                    let idx = variableName.indexOf( "../" );

                    variableName = variableName.slice( idx + 3, variableName.length );
                }

                if ( this.#useGraph && base !== "root" && paths.length > 0 )
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

        resolveVariables( pScope, pResolved )
        {
            if ( this.interpolationHint.isVariable() )
            {
                return this.resolve( pScope, {}, {}, pResolved, [] );
            }
            return this.#matchedString;
        }

        resolveTreeNodes( pRoot, pCurrent, pResolved = new Map(), pPaths = [] )
        {
            if ( this.interpolationHint.isTreeNode() )
            {
                return this.resolve( $scope(), pRoot, pCurrent, pResolved, pPaths );
            }
            return this.#matchedString;
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

        resolve( pRootOrScope, pCurrent, pResolved )
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

        constructor( pString )
        {
            this.#text = asString( pString );

            this.#segments = [];

            this.#matchers = [];

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

        resolve( pScope, pRoot, pCurrent, pResolved, pPaths )
        {
            let arr = this.#matchers.map( e => e.resolve( pScope, pRoot, pCurrent, pResolved, pPaths ) );

            return arrayToString( arr );
        }

        resolveVariables( pScope, pResolved )
        {
            let arr = this.#matchers.map( e => e.resolveVariables( pScope, pResolved ) );

            return arrayToString( arr );
        }

        resolveTreeNodes( pRoot, pCurrent, pResolved = new Map(), pPaths = [] )
        {
            let arr = this.#matchers.map( e => e.resolveTreeNodes( $scope(), pRoot, pCurrent, pResolved, pPaths ) );

            return arrayToString( arr );
        }
    }

    const interpolate = function( pScope = $scope(), pRoot, pCurrent, pResolved = new Map(), pPaths = [], pOptions = {} )
    {
        let resolved = pResolved || new Map();

        let paths = pPaths || [];

        let options = Object.assign( {}, pOptions || {} );

        let scp = pScope || $scope();

        let root = pRoot || pCurrent || scp;

        let obj = pCurrent || root || scp;

        let entries = objectUtils.getEntries( obj );

        for( const entry of entries )
        {
            let key = entry.key || entry[0];

            const value = entry.value || obj[key] || _mt_str;

            switch ( typeof value )
            {
                case _ud:
                    delete obj[key];
                    break;

                case _str:
                    const interpolator = new Interpolator( value );

                    if ( InterpolationMatch.canInterpolate( value ) )
                    {
                        obj[key] = interpolator.resolve( pScope || $scope(), root, obj, resolved, paths );
                        obj[key] = interpolator.resolveTreeNodes( root, obj, resolved, paths );
                        obj[key] = interpolator.resolveVariables( pScope || $scope(), resolved );
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
            quoteBooleans: false
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

    const asJson = function( pObject, pOptions = DEFAULT_OPTIONS_FOR_JSON, pVisited = new Set(), pResolved = new Map(), pPaths = [] )
    {
        const options = Object.assign( {}, pOptions || {} );

        const omitFunctions = options?.omitFunctions;

        const useToJson = !(false === options.useToJson);

        const handleNull = (_fun === typeof options.handleNull && options.handleNull.length >= 1) ? options.handleNull : DEFAULT_NULL_HANDLER;

        if ( _ud === typeof pObject || null === pObject )
        {
            return handleNull( pObject, options );
        }

        if ( useToJson && canUseToJson( pObject, pObject?.toJson ) )
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

        const now = new Date().getTime();

        const startTime = options.startTime || now;

        options.startTime = startTime;

        // never allow this function to run longer than 5 seconds
        if ( (now - startTime) > MAX_RUN_TIME )
        {
            return (_fun === typeof pObject?.toString ? pObject.toString() : pObject?.name);
        }

        const _exclude = pruneArray( ["constructor", "prototype", "toJson", "toObject", "global", "this"].concat( (asArray( options.exclude || [] )) ) );

        const _include = pruneArray( [].concat( ...(asArray( options.include || [] )) ) );

        const _trimStrings = options.trimStrings || false;

        const _quoteBooleans = options.quoteBooleans || false;

        const _convertDatesToString = options.convertDatesToString || false;

        const _dateTimeFormatter = _convertDatesToString ? (options.dateTimeFormatter) : null;

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
                    jsonString = _dblqt + _dblqt;
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
                    if ( _convertDatesToString && null !== _dateTimeFormatter && isFunction( _dateTimeFormatter?.format ) )
                    {
                        jsonString += JSON.stringify( _dateTimeFormatter.format( pObject ) );
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

                    let entries = objectUtils.getEntries( object ) || [];

                    let transient = [].concat( _exclude || [] ).filter( e => !_include.includes( e ) );

                    entries = entries.filter( e => !transient.includes( asString( e.key, true ) ) );

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
