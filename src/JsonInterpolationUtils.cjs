/**
 * This module provides the ability to parse self-referential or cyclic JSON
 * and/or to convert objects with self-references of cycles into JSON
 * that this module can then parse back into that object.
 *
 * When defining a self-referencing JSON string
 * or when converting an object that contains self-referencing nodes,
 * a basic 'grammar' is used to define the value as a path to the desired object or value.
 *
 * This grammar is as follows:
 *
 * ${(@<type>;@base:<relative_to>):<path_or_variable_name>}
 *
 * where <type> is either the string, path, to indicate a path to another node
 * or the string, var, to indicate the name of a value expected to be in the provided scope
 *
 * Examples:
 * ${(@path;@base:root):node_0}
 * This value specifies that the value for the property should be the object found at root['node_0']
 *
 * ${(@path;@base:this):../../node_0}
 * This value specifies that the value for the property should be the object found by
 * traversing the tree from the root to the node that is 2 levels more shallow that the current node
 * and then returning the object with the key, node_0
 *
 * ${(@var;@base:scope):foo}
 * This value specifies that the value for the property should be the value of a variable, foo,
 * found in the provided scope
 *
 * ${(@var;@base:global):foo}
 * This value specifies that the value for the property should be the value of a variable, foo,
 * found in the global scope
 */

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
    let _fun = constants._fun;

    const INTERNAL_NAME = "__BOCK_JSON_INTERPOLATION__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        let mod = $scope()[INTERNAL_NAME];

        if ( _fun === typeof mod?.parseJson && _fun === typeof mod?.asJson )
        {
            return mod;
        }
    }

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
    let _semicolon = constants._semicolon;
    let _dblqt = constants._dblqt;

    let _str = constants._str;
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

    let isNull = typeUtils.isNull;
    let isNonNullObject = typeUtils.isNonNullObject;
    let isNonNullValue = typeUtils.isNonNullValue;

    const toIterator = typeUtils.toIterator;

    let asString = stringUtils.asString;
    let asInt = stringUtils.asInt;
    let isBlank = stringUtils.isBlank;
    let isJson = stringUtils.isJson;
    let lcase = stringUtils.lcase;

    let asArray = arrayUtils.asArray;
    let pruneArray = arrayUtils.pruneArray;

    let isPopulated = objectUtils.isPopulatedObject || objectUtils.isPopulated;
    let firstValidObject = objectUtils.firstValidObject;
    let detectCycles = objectUtils.detectCycles;

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( (me || this), constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    const konsole = console;

    const PRIOR_NODE = "../";

    const DEFAULT_EXCLUSIONS = Object.freeze( ["constructor", "prototype", "toJson", "toObject", "global", "this"] );

    const MAX_RUN_TIME = 9_999_999_999; //5_000;

    const MAX_RECURSION = 32;

    const MAX_RECURSION_ERROR = `Maximum Recursion, ${MAX_RECURSION}, Exceeded`;

    const INVALID_KEY = "INVALID_KEY";

    const NO_VARIABLE_DEFINED = "~~no-variable-defined~~";

    const infiniteLoopMessage = function( pPaths, pLength, pRepetitions )
    {
        const paths = asArray( pPaths || [] );
        const len = asInt( pLength, paths?.length );
        const repeats = asInt( pRepetitions, paths?.length );

        return `An infinite loop was detected at ${paths.join( "->" )}. Loops are detected when sequences of ${len} paths repeat ${repeats} times or more.`;
    };

    const log =
        {
            Warning: function logWarning( pError, ...pArgs )
            {
                konsole.warn( pError, ...pArgs );

                return false;
            },
            Error: function logError( pError, ...pArgs )
            {
                konsole.warn( pError, ...pArgs );

                return false;
            },
            Fatal: function logFatal( pError, ...pArgs )
            {
                konsole.error( pError, ...pArgs );

                return true;
            }
        };

    const INVALID_INTERPOLATION_KEY =
        {
            type: INVALID_KEY,
            base: INVALID_KEY,
            variable: NO_VARIABLE_DEFINED,
            key: NO_VARIABLE_DEFINED
        };

    const RX_INTERPOLATION_TOKEN_START = Object.freeze( /^\$\{/ );
    const RX_INTERPOLATION_TOKEN_END = Object.freeze( /}$/ );

    const isValidKey = function( pString )
    {
        const key = asString( pString, true );
        return !( !RX_INTERPOLATION_TOKEN_START.test( key ) || !RX_INTERPOLATION_TOKEN_END.test( key ));
    };

    const RX_INTERPOLATION_KEY = Object.freeze( /^\$\{(\(@?<?(path|var)>?;)@?base:@?<?(root|this|scope|global)>?\)\s*:\s*(.+)}$/dgi );

    const getInterpolationRegularExpression = function()
    {
        return new RegExp( RX_INTERPOLATION_KEY, RX_INTERPOLATION_KEY.flags );
    };

    const matchInterpolationKey = function( pString )
    {
        const key = asString( pString, true );

        const rx = getInterpolationRegularExpression();

        const matches = rx.exec( key );

        if ( matches && matches?.length >= 5 )
        {
            return matches;
        }

        const arr = [];

        const parts = key.split( _colon ); // 0: ${(@<type>;@base, 1: <relative_to>), 2: <path_or_variable_name>}

        if ( parts && parts?.length >= 3 )
        {
            const preamble = parts[0].split( _semicolon ); // 0: ${(@<type>,  1: @base

            let type = lcase( asString( preamble[0] || "path", true ).replaceAll( /[${(@><;]+/g, _mt_str ).trim() );
            let base = lcase( asString( preamble[1] || "root", true ).replaceAll( /[${(@><;]+/g, _mt_str ).trim() );

            let variable = asString( parts[2], true ) || stringUtils.rightOfLast( key, _colon );

            arr.push( key, parts[0], type, base, variable );
        }

        return Object.freeze( arr );
    };

    const _clean = function( pString )
    {
        return asString( pString ).replace( /^@/, _mt_str ).replaceAll( /[><]/g, _mt_str );
    };

    /**
     * ${(@<type>;@base:<relative_to>):<path_or_variable_name>}
     * @param pKey
     * @returns {{type: string, base: string, variable: string, key: string}}
     */
    const parseKey = function( pKey )
    {
        const key = asString( pKey, true );

        if ( !isValidKey( key ) )
        {
            return INVALID_INTERPOLATION_KEY;
        }

        const matches = matchInterpolationKey( key ) || [];

        const type = _clean( asString( matches[2] || "path", true ) );

        const base = _clean( asString( matches[3] || ("path" === type) ? "root" : "global" ) );

        const variable = _clean( asString( matches[4] || asString( stringUtils.rightOfLast( key, _colon ), true ), true ) );

        return { type, base, variable, key };
    };

    const buildPathExpression = function( pType, pBase, ...pPaths )
    {
        let paths = arrayUtils.toNonBlankStrings( ...asArray( pPaths || [] ) ).flat();

        let type = _clean( asString( pType, true ) || "path" );

        let base = _clean( asString( pBase, true ) || "root" );

        return "${(@" + type + ";@base:" + base + "):" + (paths.length > 0 ? paths.join( _dot ) : "root") + "}";
    };

    class ResolvedValue
    {
        #expression;

        #root;
        #current;

        #value;

        #json;

        #parts;

        constructor( pExpression, pRoot, pCurrent, pValue, pJsonString )
        {
            this.#expression = asString( pExpression, true );
            this.#root = isNonNullObject( pRoot ) ? pRoot : null;
            this.#current = isNonNullObject( pCurrent ) ? pCurrent : null;
            this.#value = (pValue instanceof this.constructor) ? pValue?.value : pValue;
            this.#json = asString( (pJsonString || _mt_str), true );

            this.#parts = parseKey( this.#expression );
        }

        get expression()
        {
            return asString( this.#expression, true );
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

        set value( value )
        {
            this.#value = (value instanceof this.constructor) ? value?.value : value;
        }

        get json()
        {
            return asString( this.#json, true );
        }

        set json( value )
        {
            this.#json = asString( value, true );
        }

        get parts()
        {
            return Object.freeze( this.#parts || parseKey( this.key ) );
        }

        get type()
        {
            return asString( this.parts?.type ) || "path";
        }

        get base()
        {
            return asString( this.parts?.base ) || ("path" === this.type ? "root" : "global");
        }

        get variable()
        {
            return asString( this.parts?.variable || NO_VARIABLE_DEFINED );
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

        #root;
        #scope;

        constructor( pMap = new Map(), pRoot, pScope )
        {
            super();

            this.#root = pRoot;

            this.#scope = objectUtils.firstValidObject( pScope, $scope() );

            this.#map = (pMap instanceof Map) ? new Map( pMap.entries() ) : pMap;

            this.#map = (this.#map instanceof Map) ? this.#map : new Map();

            const me = this;

            this.#map.forEach( ( [k, v] ) => ((me || this).#map || (this || me).#map).set( k, ((v instanceof ResolvedValue) ? v : new ResolvedValue( k, pRoot, null, v )) ) );
        }

        get root()
        {
            return this.#root;
        }

        get scope()
        {
            return this.#scope || $scope();
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
            const key = asString( pKey, true );

            let value = this.#map.get( key );

            if ( isNonNullObject( value ) )
            {
                if ( !(value instanceof ResolvedValue) )
                {
                    value = new ResolvedValue( key, this.root, {}, value );

                    this.set( key, value );
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
            const key = asString( pKey, true );

            const value = (pValue instanceof ResolvedValue) ? pValue : new ResolvedValue( key, this.root, {}, pValue );

            return this.#map.set( key, value );
        }
    }

    ResolvedMap.fromMap = function( pMap )
    {
        if ( pMap instanceof Map )
        {
            return new ResolvedMap( pMap );
        }
        else if ( isObject( pMap ) )
        {
            return new ResolvedMap( new Map( Object.entries( pMap || {} ) ) );
        }
        return new ResolvedMap();
    };

    function _resolveResolvedMap( pResolved )
    {
        let resolved = pResolved || new ResolvedMap();

        return (resolved instanceof ResolvedMap) ? resolved : ResolvedMap.fromMap( resolved );
    }

    /**
     * This class represents and interprets the values
     * used as placeholders for recursive structures
     * or for variable substitutions
     *
     * This class assumes the use of the following grammar and vocabulary
     * for node values to be interpolated when parsing JSON (producing an object)
     * or inserted when serializing an object to JSON (producing a string):
     *
     * ${(@<type>;@base:<relative_to>):<path_or_variable_name>}
     *
     * The entry must be enclosed in ${},
     * similar to the syntax used for interpolating variables in template strings
     *
     * The value inside the ${} delimiter is composed of 2 segments separated by a colon, ':'
     *
     * The first segment must be surrounded in parentheses ()
     * and defines the type and scope for the variable or path defined in the second segment.
     *
     * Within the parentheses, the first segment is composed of 2 parts, separated by a semicolon, ';'
     * The first part defines the _type_ of interpolation to be performed and must be one of either:
     *
     * @path or @var
     *
     * where @path indicates the variable defined in the second segment
     * is a dot-delimited path to a node in an object graph
     *
     * and @var indicates the variable defined in the second segment
     * corresponds to a property of the object passed as the 'scope'
     * (as determined by the second part of this first segment)
     *
     * The second part of the first segment (the one inside the parentheses)
     * defines either the root node from which to follow the dot-delimited path if the _type_ is @path
     * or the scope in which to find the property or variable named in the second segment if the _type_ is @var
     *
     * This second part must be of the form, @base:, followed  by either the text, root, this, scope, or global
     * where...
     *
     * 'root' indicates that the variable name or path is relative to the root of the current object graph
     * 'this' indicates that the variable name or path is relative to the current node of the object graph
     * 'scope' indicates that the variable name is a property of an object that will be passed to the interpolator
     * 'global' indicates that the variable name is a property or variable to be found in the global scope
     *
     * Example: ${(@path;@base:root):a.b.c.d}
     * This entry would expand to the value of the node 'd' in an object of the structure: {a:{b:{c:{d:'the value'}}}}
     *
     */
    class InterpolationEntry
    {
        #key; // should be something in the form, ${(@<type>;@base:<relative_to>):<path_or_variable_name>}

        #type = "path";
        #base = "root";

        #variable;

        #parts;

        constructor( pKey )
        {
            this.#key = asString( pKey, true );

            if ( !isBlank( this.#key ) )
            {
                const parsed = parseKey( this.#key );

                this.#type = asString( parsed.type || "path", true );
                this.#base = asString( parsed.base || "root", true );
                this.#variable = asString( parsed.variable || NO_VARIABLE_DEFINED, true );

                this.#parts = Object.freeze( parsed );
            }
        }

        get key()
        {
            return this.#key;
        }

        get parts()
        {
            if ( isPopulated( this.#parts ) )
            {
                return this.#parts;
            }

            this.#parts = Object.freeze( parseKey( this.key ) );
        }

        get type()
        {
            return lcase( asString( this.#type, true ) || asString( this.parts?.type, true ) || "path" );
        }

        get base()
        {
            return lcase( asString( this.#base, true ) || asString( this.parts?.base, true ) || ("path" === this.type ? "root" : "global") );
        }

        get variable()
        {
            return asString( this.#variable, true ) || asString( this.parts?.variable || NO_VARIABLE_DEFINED, true );
        }

        get valid()
        {
            return isValidKey( this.key );
        }

        resolve( pScope, pRoot, pCurrent, pResolved, pPaths )
        {
            if ( !this.valid )
            {
                return this.key;
            }

            let scp = firstValidObject( pScope, $scope() );

            let root = firstValidObject( pRoot, pCurrent, scp ) || {};

            let current = firstValidObject( pCurrent, root, scp ) || {};

            let resolved = _resolveResolvedMap( pResolved );

            let paths = [].concat( ...(asArray( pPaths || [] )) );

            if ( detectCycles( paths, 5, 5 ) )
            {
                return infiniteLoopMessage( paths, 5, 5 );
            }

            let { variableName, variablePath, variableRoot } = this.resolveVariable( paths, this.base, root, current );

            paths = [].concat( asArray( variablePath || paths ) );

            let resolvedValue = resolved.get( this.key ) || resolved.get( variableName );

            let asResolved = resolvedValue instanceof ResolvedValue ? resolvedValue : new ResolvedValue( this.key, root, current, resolvedValue );

            let value = asResolved?.value;

            if ( (_ud === typeof value || null == value) && (variableName.includes( _dot ) || variableName.includes( "/" )) )
            {
                let node = "path" === this.type ? variableRoot || root : scp || $scope();

                let keyPath = [paths].concat( ...(variableName.split( /[.\/]/ ).flat().map( e => asString( e, true ) ).filter( e => !isBlank( e ) ) || []) ).flat();

                value = objectUtils.findNode( node, ...keyPath );

                if ( keyPath.length <= 0 )
                {
                    asResolved.value = value;
                }

                resolved.set( this.key, asResolved );
            }

            return value;
        }

        resolveVariable( pPaths, pBase, pRoot, pCurrent, pScope = $scope() )
        {
            let variableName = asString( this.variable || NO_VARIABLE_DEFINED, true ) || NO_VARIABLE_DEFINED;

            let variablePath = arrayUtils.toTrimmedNonBlankStrings( [].concat( asArray( pPaths || [] ) ) );

            let variableBase = lcase( asString( pBase || this.base, true ) );

            let root = isNonNullObject( pRoot ) ? pRoot : objectUtils.findRoot( pScope || $scope(), pCurrent, ...variablePath );

            let current = isNonNullObject( pCurrent ) ? pCurrent : objectUtils.findNode( root, ...variablePath );

            if ( variableName.includes( PRIOR_NODE ) )
            {
                while ( !variableName.startsWith( PRIOR_NODE ) )
                {
                    let idx = variableName.indexOf( PRIOR_NODE );

                    variableName = variableName.slice( asInt( idx + PRIOR_NODE.length ), variableName.length );
                }

                while ( variableName.startsWith( PRIOR_NODE ) && variablePath.length > 0 )
                {
                    variablePath.pop();

                    variableName = variableName.slice( PRIOR_NODE.length, variableName.length );
                }
            }

            const variableRoot = objectUtils.findNode( root, variablePath );

            // adjust variablePath

            return { variableName, variablePath, variableRoot };
        }
    }

    InterpolationEntry.parseKey = parseKey;
    InterpolationEntry.buildPathExpression = buildPathExpression;

    class InterpolationMatcher
    {
        #text;

        #interpolationEntry;

        #matchedString;
        #hintString;
        #variable;

        constructor( pString )
        {
            this.#text = pString;

            this.#matchedString = _mt_str;
            this.#hintString = _mt_str;
            this.#variable = _mt_str;

            let matches = [].concat( ...(InterpolationMatcher.expression().exec( pString ) || []) );

            if ( matches && matches?.length )
            {
                this.#matchedString = matches[0] || _mt_str;

                this.#hintString = (_mt_str + (matches.length > 0 ? matches[0] || (matches.length > 1 ? matches[1] : _mt_str) : _mt_str)).trim();

                this.#variable = matches.length > 2 ? matches[3] : matches.length > 1 ? matches[2] : _mt_str;
            }

            this.#interpolationEntry = new InterpolationEntry( this.#hintString || this.#text, this.#variable || this.#hintString || this.#text );
        }

        get interpolationEntry()
        {
            return this.#interpolationEntry || new InterpolationEntry( this.#hintString || this.#text, this.#variable || this.#hintString || this.#text );
        }

        resolve( pScope, pRoot, pCurrent, pResolved = new ResolvedMap(), pPaths = [] )
        {
            return this.interpolationEntry.resolve( pScope, pRoot, pCurrent, pResolved, pPaths );
        }

        static expression()
        {
            return new RegExp( InterpolationMatcher.EXPRESSION, "dgi" );
        }

        static canInterpolate( pString )
        {
            return isString( pString ) && (InterpolationMatcher.expression()).test( asString( pString, true ) );
        }

        static Literal( pString )
        {
            return new InterpolationMatchLiteral( pString );
        }

        static create( pString )
        {
            if ( isString( pString ) )
            {
                if ( InterpolationMatcher.canInterpolate( pString ) )
                {
                    return new InterpolationMatcher( pString );
                }
                return InterpolationMatcher.Literal( pString );
            }
            throw new Error( "Invalid Argument. The create method requires a string" );
        }
    }

    class InterpolationMatchLiteral extends InterpolationMatcher
    {
        #text;
        #hintString;
        #variable;

        constructor( pString )
        {
            super( pString );

            this.#text = pString;
            this.#hintString = pString;
            this.#variable = pString;
        }

        resolve()
        {
            return this.#variable || this.#text || this.#hintString;
        }
    }

    InterpolationMatcher.EXPRESSION = RX_INTERPOLATION_KEY;

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

            this.#resolved = (pResolved instanceof ResolvedMap) ? pResolved : ResolvedMap.fromMap( pResolved );

            let s = this.#text || _mt_str;

            let len = this.#text?.length || 0;

            let start = 0;

            let rx = new RegExp( InterpolationMatcher.EXPRESSION, "gds" );

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
            return this.#matchers || this.segments.map( e => InterpolationMatcher.create( e ) );
        }

        addSegment( pStart, pEnd )
        {
            let len = this.length || 0;

            let start = Math.min( Math.max( 0, (pStart || 0) ), len );

            let end = Math.min( pEnd, len );

            let segment = this.#text.slice( start, end );

            this.#segments.push( segment );

            let interpolatorMatch = InterpolationMatcher.create( segment );

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

            let arr = asArray( this.matchers.map( e => e.resolve( scope, root, current, resolved, paths ) ) );

            return arr?.length > 1 ? arr : arr[0];
        }
    }

    const interpolate = function( pScope = $scope(), pRoot, pCurrent, pResolved = new ResolvedMap(), pPaths = [], pOptions = {} )
    {
        let options = Object.assign( {}, pOptions || {} );

        let paths = asArray( pPaths || options?.paths || [] );

        if ( detectCycles( paths, 5, 5 ) )
        {
            return JSON.stringify( infiniteLoopMessage( paths, 5, 5 ) );
        }

        let resolved = pResolved || options?.resolved;

        resolved = (resolved instanceof ResolvedMap) ? resolved : (resolved instanceof Map) ? ResolvedMap.fromMap( resolved ) : new ResolvedMap();

        options.resolved = resolved;

        let scp = pScope || options?.scope || $scope();

        let root = pRoot || options?.root || pCurrent || scp;

        let obj = pCurrent || options?.object || root || scp;

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

                    if ( InterpolationMatcher.canInterpolate( value ) )
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

                    try
                    {
                        obj[key] = interpolate( (pScope || $scope()), root, value, resolved, paths );
                    }
                    finally
                    {
                        paths.pop();
                    }

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
            resolved: new ResolvedMap(),
            visited: new Set(),
            onError: log.Warning
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

    const _toJson = function( obj, pOnError = log.Error )
    {
        let json = null;

        try
        {
            json = obj.toJson();
        }
        catch( ex )
        {
            if ( isFunction( pOnError ) )
            {
                if ( pOnError( ex, "_toJson" ) )
                {
                    throw new Error( ex );
                }
            }
            else
            {
                log.Error( ex, "_toJson" );
            }
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

    function _funcToJson( pFunction, pOptions )
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

    function _stringToJson( pString, pOptions, pPaths, pDepth )
    {
        const s = asString( pString );

        const options = Object.assign( {}, pOptions || {} );

        const scp = options?.scope || $scope();
        const root = options?.root || {};
        const current = options?.current || s;
        const resolved = options?.resolved || new ResolvedMap();
        const visited = options?.visited || new Set();

        let paths = asArray( pPaths || options?.paths || [] );
        let depth = asInt( pDepth, asInt( options.depth, paths?.length ) );

        let onError = isFunction( options?.onError ) ? options.onError : log.Error;

        let jsonString = _mt_str;

        try
        {
            if ( InterpolationMatcher.canInterpolate( s ) )
            {
                const value = new Interpolator( s, root, current, resolved ).resolve( scp, root, current, resolved, paths );

                jsonString = isNonNullObject( value ) ? asJson( value, options, visited, resolved, paths, root, scp, depth ) : JSON.stringify( value );
            }
            else
            {
                jsonString = JSON.stringify( asString( s, (true === options.trimStrings) ) );
            }
        }
        catch( ex )
        {
            if ( onError( ex, "_stringToJson", options, paths, depth ) )
            {
                throw new Error( ex );
            }
            else
            {
                log.Error( ex, "_stringToJson", options, paths, depth );
            }

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
            if ( _big === typeof pNum )
            {
                jsonString = JSON.stringify( BigInt( pNum ) );
            }
            jsonString = JSON.stringify( pNum );
        }

        if ( true === options?.quoteNumbers && !/^"[\d.,+-]*(n)*"$/.test( jsonString ) )
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

    const asJson = function( pObject, pOptions = DEFAULT_OPTIONS_FOR_JSON, pVisited = new Set(), pResolved = new ResolvedMap(), pPaths = [], pRoot, pScope = $scope(), pDepth = 0 )
    {
        const options = Object.assign( Object.assign( {}, DEFAULT_OPTIONS_FOR_JSON ), pOptions || DEFAULT_OPTIONS_FOR_JSON );

        const handleNull = _resolveNullHandler( options );

        const onError = isFunction( options.onError ) ? options.onError : log.Warning;

        const obj = (isNonNullValue( pObject ) ? pObject : options.object);

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

        // limit the depth of recursion
        let depth = asInt( pDepth, asInt( options?.depth ) );

        options.startTime = options.startTime || new Date().getTime();

        // never allow this function to run longer than 5 seconds or to exceed a maximum recursion depth
        if ( _exceededTimeLimit( options ) || depth > MAX_RECURSION )
        {
            return (depth > MAX_RECURSION ? JSON.stringify( MAX_RECURSION_ERROR ) : (isFunction( obj?.toString ) ? obj.toString() : JSON.stringify( obj?.name || obj?.source || obj?.value )));
        }

        let paths = asArray( pPaths || options.paths || [] );
        options.paths = paths;

        if ( detectCycles( paths, 5, 5 ) )
        {
            return JSON.stringify( infiniteLoopMessage( paths, 5, 5 ) );
        }

        // scope to use for resolving variables
        let scp = pScope || options?.scope || $scope();
        options.scope = scp;

        const _include = _resolveInclusions( options );
        options.include = _include || [];

        const _exclude = _resolveExclusions( options, _include );
        options.exclude = _exclude || [];

        let resolved = _resolveResolvedMap( pResolved || options.resolved );
        options.resolved = resolved;

        let visited = pVisited || options.visited || new Set();
        options.visited = visited;

        const omitFunctions = options?.omitFunctions;

        let jsonString = _mt_str;

        switch ( typeof obj )
        {
            case _ud:
                jsonString = handleNull( obj, options ) || JSON.stringify( "undefined" );
                break;

            case _str:
                try
                {
                    jsonString = _stringToJson( obj, options, paths, ++depth );
                }
                finally
                {
                    depth--;
                }

                break;

            case _bool:
                jsonString = _boolToJson( obj, options );
                break;

            case _num:
            case _big:
                jsonString = _numToJson( obj, options );
                break;

            case _fun:
                jsonString = _funcToJson( obj, options );

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

                let asResolved = resolvedValue || new ResolvedValue( buildPathExpression( "path", "root", ...paths ), root, current, object );

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

                        function recurse()
                        {
                            paths.push( key );

                            let ss = JSON.stringify( _mt_str );

                            try
                            {
                                try
                                {
                                    ss = asJson( value, options, visited, resolved, paths, root, scp, ++depth );
                                }
                                catch( ex )
                                {
                                    if ( isFunction( onError ) )
                                    {
                                        if ( onError( ex, "asJson::recurse", value, options, visited, resolved, paths, root, scp, depth ) )
                                        {
                                            throw new Error( ex );
                                        }
                                    }
                                    else
                                    {
                                        log.Warning( ex, "asJson::recurse", value, options, visited, resolved, paths, root, scp, depth );
                                    }

                                    ss = JSON.stringify( ex.message );
                                }

                                if ( isObject( value ) )
                                {
                                    visited.add( value );
                                }
                            }
                            finally
                            {
                                paths.pop();
                                depth--;
                            }

                            return ss;
                        }

                        if ( isObject( value ) && isNonNullObject( value ) )
                        {
                            let resolvedEntry = resolved.find( value, root, value );

                            let asResolvedEntry = resolvedEntry || new ResolvedValue( buildPathExpression( "path", "root", ...paths ), root, current, object );

                            if ( visited.has( value ) || (isNonNullValue( resolvedEntry ) && resolvedEntry instanceof ResolvedValue) )
                            {
                                const json = asString( asResolvedEntry?.json || JSON.stringify( asResolvedEntry?.expression ) );

                                s += !isBlank( json ) ? json : (depth < MAX_RECURSION ? recurse() : JSON.stringify( MAX_RECURSION_ERROR ));
                            }
                            else
                            {
                                s += depth < MAX_RECURSION ? recurse() : JSON.stringify( MAX_RECURSION_ERROR );
                            }
                        }
                        else
                        {
                            try
                            {
                                s += depth < MAX_RECURSION ? recurse() : JSON.stringify( MAX_RECURSION_ERROR );
                            }
                            catch( ex )
                            {
                                if ( isFunction( onError ) )
                                {
                                    if ( onError( ex, "asJson::recurse", value, options, visited, resolved, paths, root, scp, depth ) )
                                    {
                                        throw new Error( ex );
                                    }
                                }
                                else
                                {
                                    log.Warning( ex, "asJson::recurse", value, options, visited, resolved, paths, root, scp, depth );
                                }

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

    const parseJson = function( pString, pOptions = DEFAULT_OPTIONS_FOR_JSON, pVisited = new Set(), pResolved = new ResolvedMap(), pPaths = [], pRoot, pScope = $scope(), pDepth = 0 )
    {
        const options = Object.assign( Object.assign( {}, DEFAULT_OPTIONS_FOR_JSON ), pOptions || DEFAULT_OPTIONS_FOR_JSON );

        const onError = isFunction( options?.onError ) ? options?.onError : log.Warning;

        let visited = pVisited || options?.visited || new Set();
        visited = visited instanceof Set ? visited : new Set();

        let resolved = pResolved || options?.resolved || new ResolvedMap();
        resolved = resolved instanceof ResolvedMap ? resolved : ResolvedMap.fromMap( resolved );

        let paths = asArray( pPaths || options?.paths || [] );
        options.paths = paths;

        let root = pRoot || options?.root || {};
        let scp = pScope || options?.scope || $scope();
        let depth = asInt( pDepth, options?.depth );

        let json = asString( pString );

        if ( !isJson( json ) )
        {
            return asArray( json );
        }

        let obj = null;

        try
        {
            obj = JSON.parse( json );
        }
        catch( ex )
        {
            if ( isFunction( onError ) )
            {
                if ( onError( ex, "parseJson", json, options, visited, resolved, paths, root, scp, depth ) )
                {
                    throw new Error( ex );
                }
            }
            else
            {
                log.Warning( ex, "parseJson", json, options, visited, resolved, paths, root, scp, depth );
            }
        }

        if ( InterpolationMatcher.canInterpolate( json ) )
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
