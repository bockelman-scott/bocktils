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
 * and where <relative_to> is either the string, root, this, scope, or global
 * where root or this are applicable only when the type is path
 * and scope or global are only applicable when the type is var
 *
 * When relative_to is root, the <path_or_variable_name> portion of the key
 * is interpreted to mean 'follow the dot accessors from the root to the end of the path' and return that value or object
 *
 * When relative_to is this, the <path_or_variable_name> portion of the key
 * is interpreted to mean 'follow the dot accessors from the current node to the end of the path' and return that value or object
 *
 * When relative_to is scope, the <path_or_variable_name> portion of the key
 * is interpreted to mean 'return the value of the property of the object passed as the scope corresponding to the <path_or_variable_name>'
 *
 * When relative_to is global, the <path_or_variable_name> portion of the key
 * is interpreted to mean 'return the value of the property of the global scope corresponding to the <path_or_variable_name>'
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
const core = require( "@toolbocks/core" );

const objectUtils = require( "../../common/src/ObjectUtils.cjs" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined" } = constants;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const _fun = constants._fun;

    const INTERNAL_NAME = "__BOCK_JSON_INTERPOLATION__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        let mod = $scope()[INTERNAL_NAME];

        if ( _fun === typeof mod?.parseJson && _fun === typeof mod?.asJson )
        {
            return mod;
        }
    }

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils
        };

    const
        {
            _mt_str,
            _dot,
            _comma,
            _colon,
            _semicolon,
            _dblqt,
            _str,
            _obj,
            _bool,
            _num,
            _big,
            S_WARN,
            S_ERROR,
            IterationCap,
            populateOptions,
            ignore,
            lock,
            classes
        } = constants;

    const
        {
            isObject,
            isArray,
            isString,
            isFunction,
            isClass,
            isDate,
            isNumber,
            isMap,
            isSet,
            isNull,
            isNonNullObject,
            isNonNullValue,
            toIterable,
            VisitedSet
        } = typeUtils;

    const { asString, asInt, isBlank, isJson, lcase, rightOfLast } = stringUtils;

    const { asArray, pruneArray, unique } = arrayUtils;

    const
        {
            isPopulated = objectUtils?.isPopulatedObject || objectUtils?.isPopulated,
            firstValidObject,
            detectCycles,
            ObjectEntry,
            ExploredSet
        } = objectUtils;

    const modName = "JsonInterpolationUtils";

    const { ModulePrototype } = classes;

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const calculateErrorSourceName = function( pModule = modName, pFunction )
    {
        return modulePrototype.calculateErrorSourceName( pModule, pFunction );
    };

    const S_PATH = "path";
    const S_ROOT = "root";

    const PRIOR_NODE = "../";

    const DEFAULT_EXCLUSIONS = lock( ["constructor", "prototype", "toJson", "toObject", "global", "this", "arguments", "_arguments"] );

    const MAX_RUN_TIME = 5_000;

    const MAX_RECURSION = 32;

    const MAX_RECURSION_ERROR = `Maximum Recursion, ${MAX_RECURSION}, Exceeded`;

    const TIMEOUT_ERROR = `Exceeded Maximum Allowed Runtime`;

    const INVALID_KEY = "INVALID_KEY";

    const NO_VARIABLE_DEFINED = "~~no-variable-defined~~";

    const infiniteLoopMessage = function( pPaths, pLength, pRepetitions )
    {
        const paths = asArray( pPaths || [] );
        const len = asInt( pLength, paths?.length );
        const repeats = asInt( pRepetitions, paths?.length );

        return `An infinite loop was detected at ${paths.join( "->" )}. \nLoops are detected when sequences of ${len} paths repeat ${repeats} times or more.`;
    };

    const INVALID_INTERPOLATION_KEY =
        {
            type: INVALID_KEY,
            base: INVALID_KEY,
            variable: NO_VARIABLE_DEFINED,
            key: NO_VARIABLE_DEFINED
        };

    const RX_INTERPOLATION_TOKEN_START = lock( /^\$\{/ );
    const RX_INTERPOLATION_TOKEN_END = lock( /}$/ );

    const DEFAULT_REPLACER = function( key, val )
    {
        if ( _big === typeof val )
        {
            return asString( BigInt( val ).toString() ) + "n";
        }

        if ( isDate( val ) )
        {
            return null == val ? null : JSON.stringify( val.getTime() );
        }

        if ( isMap( val ) )
        {
            return { ...val.entries() };
        }

        if ( isSet( val ) )
        {
            return [...val.values()];
        }

        return val;
    };

    const DEFAULT_REVIVER = function( key, val ) { return val; };

    const DEFAULT_NULL_HANDLER = function( pValue, pOptions )
    {
        return _ud === typeof pValue ? _dblqt + _dblqt : (null === pValue ? null : asJson( pValue, DEFAULT_REPLACER, pOptions?.space, pOptions ));
    };

    const DEFAULT_OPTIONS_FOR_JSON =
        {
            handleNull: DEFAULT_NULL_HANDLER,
            includeEmptyProperties: true,
            omitFunctions: false,
            useToJson: true,
            quoteBooleans: false,
            quoteNumbers: false,
            onError: ignore,
            trimStrings: false,
            reviver: DEFAULT_REVIVER,
            replacer: DEFAULT_REPLACER,
            formatDates: false,
            dateTimeFormatter: null,
            "NaN": "NaN",
            "Infinity": "Infinity"
        };

    const isValidKey = function( pString )
    {
        const key = asString( pString, true );
        return !( !RX_INTERPOLATION_TOKEN_START.test( key ) || !RX_INTERPOLATION_TOKEN_END.test( key ));
    };

    const RX_CONTAINS_INTERPOLATION_KEY = lock( /\s*\.*\s*(\$\{(\(@?<?(path|var)>?;)@?base:@?<?(root|this|scope|global)>?\)\s*:\s*(.+)})\s*\.*\s*/dgi );

    const RX_INTERPOLATION_KEY = lock( /^\$\{(\(@?<?(path|var)>?;)@?base:@?<?(root|this|scope|global)>?\)\s*:\s*(.+)}$/dgi );

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

            let type = lcase( asString( preamble[0] || S_PATH, true ).replaceAll( /[${(@><;]+/g, _mt_str ).trim() );
            let base = lcase( asString( preamble[1] || S_ROOT, true ).replaceAll( /[${(@><;]+/g, _mt_str ).trim() );

            let variable = asString( parts[2], true ) || rightOfLast( key, _colon );

            arr.push( key, parts[0], type, base, variable );
        }

        return lock( arr );
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

        const type = _clean( asString( matches[2] || S_PATH, true ) );

        const base = _clean( asString( matches[3] || (S_PATH === type) ? S_ROOT : "global" ) );

        const variable = _clean( asString( matches[4] || asString( rightOfLast( key, _colon ), true ), true ) );

        return { type, base, variable, key };
    };

    const buildPathExpression = function( pType, pBase, ...pPaths )
    {
        let paths = arrayUtils.toNonBlankStrings( ...(asArray( pPaths || [] ).map( e => isString( e ) ? e.split( _dot ) : e )).flat() ).flat();

        let type = _clean( asString( pType, true ) || S_PATH );

        let base = _clean( asString( pBase, true ) || S_ROOT );

        return "${(@" + type + ";@base:" + base + "):" + (paths.length > 0 ? paths.join( _dot ) : "^") + "}";
    };

    const ROOT_PATH_EXPRESSION = "${(@path;@base:root):^}";

    class ResolvedValue
    {
        #expression;

        #root;
        #current;

        #value;

        #json;

        #parts;

        #path;

        constructor( pExpression, pRoot, pCurrent, pValue, pJsonString, ...pPath )
        {
            this.#expression = asString( pExpression, true );
            this.#root = isNonNullObject( pRoot ) ? pRoot : null;
            this.#current = isNonNullObject( pCurrent ) ? pCurrent : null;
            this.#value = (pValue instanceof this.constructor) ? pValue?.value : pValue;
            this.#json = asString( (pJsonString || _mt_str), true );

            this.#parts = parseKey( this.#expression );

            this.#path = asArray( pPath || asString( this.#parts?.variable, true )?.split( _dot ) || [] );
        }

        static get [Symbol.species]()
        {
            return this;
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

        isResolved()
        {
            return !isNull( this.value );
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
            return lock( this.#parts || parseKey( this.key ) );
        }

        get type()
        {
            return asString( this.parts?.type ) || S_PATH;
        }

        get base()
        {
            return asString( this.parts?.base ) || (S_PATH === this.type ? S_ROOT : "global");
        }

        get variable()
        {
            return asString( this.parts?.variable || NO_VARIABLE_DEFINED );
        }

        get path()
        {
            return [].concat( ...(asArray( this.#path || asString( this.#parts?.variable, true )?.split( _dot ) || [] )) );
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
        #root;
        #scope;

        constructor( pMap = new Map(), pRoot, pScope )
        {
            super( pMap );

            this.#root = pRoot;

            this.#scope = firstValidObject( pScope, $scope() );

            const me = this;

            me.forEach( ( [k, v] ) => ((me || this) || (this || me)).set( k, ((v instanceof ResolvedValue) ? v : new ResolvedValue( k, pRoot, null, v )) ) );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get root()
        {
            return this.#root;
        }

        set root( pValue )
        {
            if ( !isPopulated( this.root ) && isPopulated( pValue ) )
            {
                this.#root = pValue;
            }
        }

        get scope()
        {
            return this.#scope || $scope();
        }

        set scope( pValue )
        {
            if ( !isPopulated( this.#scope ) && isPopulated( pValue ) )
            {
                this.#scope = pValue;
            }
        }

        entries()
        {
            const arr = asArray( super.entries() );
            return toIterable( arr.map( e => new ObjectEntry( e ) ) );
        }

        [Symbol.iterator]()
        {
            return this.entries();
        }

        get( pKey )
        {
            const key = asString( pKey, true );

            let value = super.get( key ) || ("^" === key ? this.root : null);

            if ( isNonNullObject( value ) )
            {
                if ( !(value instanceof ResolvedValue) )
                {
                    value = new ResolvedValue( key, this.root, null, value );

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
                    if ( isNull( pRoot ) || objectUtils.same( pRoot, value?.root ) )
                    {
                        if ( isNull( pCurrent ) || isNull( value?.current ) || objectUtils.same( pCurrent, value?.current ) )
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
            const key = asString( pKey, true );

            return super.has( key );
        }

        set( pKey, pValue )
        {
            const key = asString( pKey, true );

            const value = (pValue instanceof ResolvedValue) ? pValue : new ResolvedValue( key, this.root, null, pValue );

            return super.set( key, value );
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

    function _resolveReplacer( pReplacer, pOptions )
    {
        const typeCriteria = function( e )
        {
            return isFunction( e ) && e.length >= 2;
        };

        return typeUtils.firstMatchingType( typeCriteria, pReplacer, pOptions?.replacer, DEFAULT_REPLACER );
    }

    function _resolveReviver( pReviver, pOptions )
    {
        const candidates = [pReviver, pOptions?.reviver, DEFAULT_REVIVER].filter( e => isFunction( e ) && e.length >= 2 );

        return candidates?.length > 0 ? candidates[0] : DEFAULT_REVIVER;
    }

    function _resolveResolvedMap( pResolved, pOptions )
    {
        let resolved = pResolved || pOptions?.resolved || new ResolvedMap();

        return (resolved instanceof ResolvedMap) ? resolved : ResolvedMap.fromMap( resolved );
    }

    function _resolvedVisitedSet( pVisited, pOptions )
    {
        let visited = firstValidObject( pVisited, pOptions?.visited ) || new ExploredSet();
        return (visited instanceof ExploredSet) ? visited : new ExploredSet();
    }

    function _handleCaughtException( pOnError, pError, pSource, pLevel, pJson, pOptions, pVisited, pResolved, pPaths, pRoot )
    {
        if ( isFunction( pOnError ) )
        {
            let shouldThrow = false;

            try
            {
                shouldThrow = pOnError( pError, pSource, pJson, pOptions, pVisited, pResolved, pPaths, pRoot );
            }
            catch( ex )
            {
                modulePrototype.reportError( ex, ex?.message, pLevel || S_ERROR, calculateErrorSourceName( modName, "_handleCaughtException -> onError" ), pJson, pOptions, pVisited, pResolved, pPaths, pRoot );
            }

            if ( shouldThrow )
            {
                throw new Error( pError?.message || pError );
            }
        }
        modulePrototype.reportError( pError, pError?.message, pLevel || S_ERROR, pSource, pJson, pOptions, pVisited, pResolved, pPaths, pRoot );
    }

    class Segment
    {
        #text;
        #index;

        constructor( pString, pIndex )
        {
            this.#text = asString( pString );
            this.#index = asInt( pIndex );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get index()
        {
            return this.#index;
        }

        resolve( pScope, pRoot, pCurrent, pResolved, pPaths )
        {
            return this.#text;
        }
    }

    Segment.Comparator = function( a, b )
    {
        let s1 = (a instanceof Segment || isNumber( a?.index )) ? a : new Segment( _mt_str, Number.MAX_SAFE_INTEGER );
        let s2 = (b instanceof Segment || isNumber( b?.index )) ? b : new Segment( _mt_str, Number.MAX_SAFE_INTEGER );

        let i0 = asInt( s1.index );
        let i1 = asInt( s2.index );

        return i0 > i1 ? 1 : i0 < i1 ? -1 : 0;
    };

    Segment.ROOT_PATH_EXPRESSION = ROOT_PATH_EXPRESSION;

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
    class InterpolationEntry extends Segment
    {
        #key; // should be something in the form, ${(@<type>;@base:<relative_to>):<path_or_variable_name>}

        #type = S_PATH;
        #base = S_ROOT;

        #variable;

        #parts;

        constructor( pKey, pIndex )
        {
            super( pKey, pIndex );

            this.#key = asString( pKey, true );

            if ( !isBlank( this.#key ) )
            {
                const parsed = parseKey( this.#key );

                this.#type = asString( parsed.type || S_PATH, true );
                this.#base = asString( parsed.base || S_ROOT, true );
                this.#variable = asString( parsed.variable || NO_VARIABLE_DEFINED, true );

                this.#parts = lock( parsed );
            }
        }

        static get [Symbol.species]()
        {
            return this;
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

            this.#parts = lock( parseKey( this.key ) );
        }

        get type()
        {
            return lcase( asString( this.#type, true ) || asString( this.parts?.type, true ) || S_PATH );
        }

        get base()
        {
            return lcase( asString( this.#base, true ) || asString( this.parts?.base, true ) || (S_PATH === this.type ? S_ROOT : "global") );
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

            let resolved = _resolveResolvedMap( pResolved );

            let resolvedValue = resolved.get( this.key );

            if ( resolvedValue instanceof ResolvedValue )
            {
                if ( resolvedValue.isResolved() )
                {
                    return resolvedValue.value;
                }
            }


            let paths = [].concat( ...(asArray( pPaths || [] )) );

            if ( detectCycles( paths, 5, 5 ) )
            {
                return infiniteLoopMessage( paths, 5, 5 );
            }

            let scp = firstValidObject( pScope, $scope() );

            let root = firstValidObject( pRoot, pCurrent, scp ) || {};

            let current = firstValidObject( pCurrent, root, scp ) || {};

            let value = null;

            resolvedValue = resolved.get( this.key ) || new ResolvedValue( this.key, root, current, value, resolvedValue?.json || this.key, ...paths );

            paths = asArray( this.variable.split( /[.\/]/g ) || [this.variable] ).map( e => isString( e ) ? e.split( _dot ) : e ).flat();

            switch ( this.type )
            {
                case "var":

                    switch ( this.base )
                    {
                        case "global":
                        case S_ROOT:

                            break;

                        case "scope":
                        case "this":

                            break;
                    }

                    break;

                case S_PATH:

                    switch ( this.base )
                    {
                        case S_ROOT:
                        case "global":
                            value = objectUtils.findNode( root, ...paths );
                            break;

                        case "this":
                        case "scope":
                            value = objectUtils.findNode( current, ...paths );
                            break;
                    }

                    break;
            }

            resolvedValue.value = value;
            resolvedValue.json = this.key;

            resolved.set( resolvedValue.key, resolvedValue );

            return value;
        }
    }

    InterpolationEntry.parseKey = parseKey;
    InterpolationEntry.buildPathExpression = buildPathExpression;
    InterpolationEntry.ROOT_PATH_EXPRESSION = ROOT_PATH_EXPRESSION;

    class InterpolatableValue
    {
        #text;

        #parentNode;
        #propertyKey;

        #segments = [];

        constructor( pValue, pParentNode, pPropertyKey )
        {
            this.#text = asString( pValue );

            this.#parentNode = pParentNode;
            this.#propertyKey = pPropertyKey;

            this.#segments = InterpolatableValue.parse( this.#text );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get text()
        {
            return this.#text;
        }

        get segments()
        {
            let arr = [].concat( ...(asArray( this.#segments || InterpolatableValue.parse( this.text ) || [] )) );
            arr = arr.sort( Segment.Comparator );
            return lock( arr );
        }

        static parse( pText )
        {
            let s = asString( pText );

            let segments = [];

            const plainStrings = s.split( RX_INTERPOLATION_KEY );

            segments.concat( ...(plainStrings.map( e => new Segment( e, s.indexOf( e ) ) )) );


            let rx = new RegExp( RX_INTERPOLATION_KEY, "dgiy" );

            let matches = rx.exec( s );

            while ( matches && matches?.length )
            {
                let indices = matches?.indices;

                let bounds = indices?.length > 0 ? indices[0] : [-1, -1];

                let start = Math.max( 0, bounds[0] );

                segments.push( new InterpolationEntry( matches[0], start ) );

                matches = rx.exec( s );
            }

            segments = segments.sort( Segment.Comparator );

            return segments;
        }

        resolve( pScope, pRoot, pCurrent, pResolved, pPaths )
        {
            const resolved = _resolveResolvedMap( pResolved );

            let resolvedValue = resolved.get( this.text );

            if ( resolvedValue instanceof ResolvedValue )
            {
                if ( resolvedValue.isResolved() )
                {
                    return resolvedValue.value;
                }
            }

            const scope = firstValidObject( pScope, $scope() );
            const root = firstValidObject( pRoot, pCurrent, scope, {} );
            const current = firstValidObject( pCurrent, root, scope );

            const arr = this.segments.map( e => e.resolve( scope, root, current, resolved, pPaths ) );

            let value = this.text;

            if ( arr.every( e => isString( e ) ) )
            {
                value = arr.join( _mt_str );
            }
            else if ( arr.every( e => isObject( e ) ) )
            {
                value = firstValidObject( ...arr );
            }
            else if ( arr.length > 1 )
            {
                value = arr;
            }
            else
            {
                value = arr.length > 0 ? arr[0] : value;
            }

            resolved.set( this.text, new ResolvedValue( this.text, root, current, value, this.text ) );

            return value;
        }
    }

    InterpolatableValue.ROOT_PATH_EXPRESSION = ROOT_PATH_EXPRESSION;

    class Interpolator
    {
        #scope;
        #rootNode;
        #currentNode;

        #options;

        #resolved;

        constructor( pScope, pRoot, pCurrent, pOptions = DEFAULT_OPTIONS_FOR_JSON, pResolved = new ResolvedMap() )
        {
            this.#options = lock( populateOptions( pOptions, DEFAULT_OPTIONS_FOR_JSON ) );

            this.#scope = pScope || this.#options?.scope || $scope();
            this.#rootNode = isNonNullObject( pRoot ) ? pRoot : firstValidObject( this.#options?.root, pCurrent, this.#scope );

            this.#currentNode = isNonNullObject( pCurrent ) ? pCurrent : firstValidObject( this.#options?.current, this.#options?.object, this.#rootNode );

            this.#resolved = _resolveResolvedMap( pResolved );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get options()
        {
            return Object.assign( {}, this.#options || DEFAULT_OPTIONS_FOR_JSON );
        }

        get scope()
        {
            return this.#scope || $scope();
        }

        get rootNode()
        {
            return firstValidObject( this.#rootNode, this.#currentNode, this.#scope, {} );
        }

        get currentNode()
        {
            return firstValidObject( this.#currentNode, this.#rootNode, this.#scope || {} );
        }

        set currentNode( pNode )
        {
            this.#currentNode = firstValidObject( pNode, this.currentNode );
        }

        get resolved()
        {
            this.#resolved = _resolveResolvedMap( this.#resolved, this.#options );
            return this.#resolved;
        }

        interpolate( pValue, pScope = $scope(), pRoot, pCurrent, pResolved = new ResolvedMap(), pPaths = [], pKey = "^" )
        {
            const interpolator = this;

            const options = Object.assign( {}, firstValidObject( this.#options, DEFAULT_OPTIONS_FOR_JSON ) );

            const scope = firstValidObject( pScope, this.scope, $scope() );

            const root = isNonNullObject( pRoot ) ? pRoot : this.rootNode;

            const current = firstValidObject( pCurrent, pValue, this.currentNode );
            this.currentNode = firstValidObject( current, pValue, this.currentNode );

            const resolved = _resolveResolvedMap( pResolved || this.resolved );

            let paths = [].concat( ...asArray( pPaths || [] ) ).filter( arrayUtils.Filters.NON_BLANK );

            const propertyKey = asString( pKey, true ).replace( "^", _mt_str );

            paths.push( propertyKey );

            if ( detectCycles( paths, 5, 5 ) )
            {
                return pValue;
            }

            let result = pValue;

            try
            {
                switch ( typeof pValue )
                {
                    case _str:

                        let s = asString( pValue );

                        const iterationCap = new IterationCap( 10 );

                        while ( isString( s ) && (new RegExp( RX_CONTAINS_INTERPOLATION_KEY, "dgi" ).test( asString( s, true ) )) && !iterationCap.reached )
                        {
                            const interpolatableValue = new InterpolatableValue( s, this.currentNode, propertyKey );

                            s = interpolatableValue.resolve( scope, root, current, resolved, paths );
                        }

                        result = isString( s ) ? asString( s, options?.trimStrings ) : s;

                        break;

                    case _ud:
                        return null;

                    case _obj:

                        if ( isNull( pValue ) )
                        {
                            return null;
                        }

                        if ( isArray( pValue ) )
                        {
                            function resolve( e, i )
                            {
                                return interpolator.interpolate( e, scope, root, current, resolved, paths, (propertyKey + "[" + i + "]") );
                            }

                            result = [].concat( ...(asArray( pValue )) ).map( resolve );
                        }
                        else
                        {
                            if ( objectUtils.instanceOfAny( pValue, Date, Number, Boolean, Symbol ) )
                            {
                                result = pValue;
                            }
                            else if ( pValue instanceof String )
                            {
                                return interpolator.interpolate( asString( pValue.valueOf() ), scope, root, current, resolved, paths, propertyKey );
                            }
                            else
                            {
                                const entries = objectUtils.getEntries( pValue );

                                for( let entry of entries )
                                {
                                    const key = asString( entry.key || entry[0], true );

                                    if ( isBlank( key ) )
                                    {
                                        continue;
                                    }

                                    let value = entry.value || entry[1];

                                    result = interpolator.interpolate( value, scope, root, pValue, resolved, paths, key );

                                    pValue[key] = isNonNullValue( result ) ? result : value;
                                }

                                result = pValue;
                            }
                        }
                        break;

                    default:
                        result = pValue;
                        break;

                }
            }
            finally
            {
                paths.pop();
            }

            return isNonNullValue( result ) ? result : pValue;
        }
    }

    Interpolator.ROOT_PATH_EXPRESSION = ROOT_PATH_EXPRESSION;

    const _canUseToJson = function( pObj, pToJsonMethod )
    {
        let func = ((_fun === typeof pToJsonMethod) ? pToJsonMethod : pObj?.toJson);

        if ( _fun === typeof func )
        {
            const source = asString( Function.prototype.toString.call( func, func ), true );

            if ( source && !(source.includes( "asJson" )) )
            {
                return true;
            }
        }

        return false;
    };

    const _toJson = function( obj, pOnError = ignore )
    {
        let json = null;

        try
        {
            json = obj.toJson();
        }
        catch( ex )
        {
            _handleCaughtException( pOnError, ex, calculateErrorSourceName( modName, this?.name ), S_WARN );
        }

        if ( json && stringUtils.isValidJson( json ) )
        {
            return json;
        }

        return null;
    };

    const TIME_LIMIT_OPTIONS =
        {
            startTime: null,
            maxRunTime: MAX_RUN_TIME
        };

    // never allow this function to run longer than 5 seconds
    const _exceededTimeLimit = function( pOptions, pMaxRunTime )
    {
        const options = populateOptions( (isDate( pOptions ) ? { startTime: pOptions } : pOptions), TIME_LIMIT_OPTIONS );

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

    function _resolveRoot( ...pCandidates )
    {
        const candidates = asArray( pCandidates || [] ).filter( e => isNonNullObject( e ) );

        return firstValidObject( ...candidates );
    }

    function _resolveInclusions( pOptions )
    {
        return unique( pruneArray( [].concat( ...(asArray( pOptions.include || [] )) ) ) );
    }

    function _resolveExclusions( pOptions, pInclusions = [] )
    {
        const arr = unique( pruneArray( (asArray( pOptions?.exclude || [] )).concat( DEFAULT_EXCLUSIONS ) ) );

        const inclusions = asArray( pInclusions || [] );

        return arr.filter( e => !inclusions.includes( e ) );
    }

    function _funcToJson( pFunction, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_OPTIONS_FOR_JSON );

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
        const options = populateOptions( pOptions, DEFAULT_OPTIONS_FOR_JSON );

        const _formatDates = options.formatDates || false;

        const _dateTimeFormatter = _formatDates ? (options.dateTimeFormatter) : null;

        let jsonString = _mt_str;

        if ( _formatDates && null !== _dateTimeFormatter && isFunction( _dateTimeFormatter?.format ) )
        {
            jsonString += JSON.stringify( _dateTimeFormatter.format( pDate ) );
        }
        else if ( options?.replacer )
        {
            jsonString += JSON.stringify( pDate, options.replacer );
        }
        else
        {
            jsonString += asJson( (isFunction( pDate.getTime ) ? pDate.getTime() : asInt( pDate )), options?.replacer, options?.space, options );
        }

        return jsonString;
    }

    function _boolToJson( pBoolean, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_OPTIONS_FOR_JSON );

        let jsonString = JSON.stringify( pBoolean, options?.replacer || DEFAULT_REPLACER );

        if ( true === options?.quoteBooleans && !/"true"|"false"/.test( jsonString ) )
        {
            jsonString = _dblqt + jsonString + _dblqt;
        }

        return jsonString;
    }

    function _numToJson( pNum, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_OPTIONS_FOR_JSON );

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
                jsonString = JSON.stringify( BigInt( pNum ).toString() + "n" );
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

    function _getPersistentEntries( pObject, pExcluded, pIncluded )
    {
        let obj = isNonNullObject( pObject ) ? pObject : {};

        let entries = objectUtils.getEntries( obj || {} ) || [];

        let excluded = asArray( pExcluded || [] ) || [];
        let included = asArray( pIncluded || [] ) || [];

        let transient = [].concat( ...(excluded || []) ).filter( e => !included.includes( e ) );

        return entries.filter( e => !transient.includes( asString( e.key || e[0], true ) ) );
    }

    const containsInterpolatableContent = function( pJson )
    {
        return isString( pJson ) && new RegExp( RX_CONTAINS_INTERPOLATION_KEY, "dgi" ).test( asString( pJson, true ) );
    };

    const pendingInterpolation = function( pObject, pDepth )
    {
        if ( isString( pObject ) )
        {
            return containsInterpolatableContent( asString( pObject, true ) );
        }

        let depth = asInt( pDepth );

        if ( depth >= 24 )
        {
            return false;
        }

        let pending = false;

        if ( isPopulated( pObject ) )
        {
            const entries = objectUtils.getEntries( pObject );

            if ( (entries?.length || 0) > 0 )
            {
                depth += 1;

                for( let entry of entries )
                {
                    pending = pendingInterpolation( entry.value, depth );

                    if ( pending )
                    {
                        break;
                    }
                }
            }
        }

        return pending;
    };

    const asJson = function( pObject,
                             pReplacer = DEFAULT_REPLACER,
                             pSpace = null,
                             pOptions = DEFAULT_OPTIONS_FOR_JSON,
                             pVisited = new ExploredSet(),
                             pResolved = new ResolvedMap(),
                             pPaths = [],
                             pRoot = null,
                             pDepth = 0 )
    {
        const options = populateOptions( pOptions, DEFAULT_OPTIONS_FOR_JSON );

        const handleNull = _resolveNullHandler( options );

        const onError = isFunction( options.onError ) ? options.onError : ignore;

        const replacer = _resolveReplacer( pReplacer, options ) || DEFAULT_REPLACER;
        options.replacer = replacer || DEFAULT_REPLACER;

        const space = [_num, _str].includes( typeof pSpace ) ? pSpace : options.space;
        options.space = [_num, _str].includes( typeof space ) ? space : null;

        let obj = (isNonNullValue( pObject ) ? pObject : options.object);

        if ( _ud === typeof obj || null === obj )
        {
            return handleNull( obj, options );
        }

        const root = _resolveRoot( pRoot, options?.root, obj );
        options.root = root;

        const current = isObject( obj ) ? obj : options.current;
        options.current = current;

        if ( !(false === options?.useToJson) && _canUseToJson( obj, obj?.toJson ) )
        {
            const json = _toJson( obj );
            if ( json )
            {
                return json;
            }
        }

        // limit the depth of recursion
        const depth = asInt( pDepth, asInt( options?.depth ) );

        options.startTime = options.startTime || new Date().getTime();

        // never allow this function to run longer than 5 seconds or to exceed a maximum recursion depth
        if ( _exceededTimeLimit( options ) || depth > MAX_RECURSION )
        {
            _handleCaughtException( onError, new Error( TIMEOUT_ERROR ), calculateErrorSourceName( modName, "asJson" ), S_ERROR, _mt_str, options, pVisited, pResolved, pPaths, pRoot );

            return (depth > MAX_RECURSION ? JSON.stringify( MAX_RECURSION_ERROR ) : (isFunction( obj?.toString ) ? obj.toString() : JSON.stringify( obj?.name || obj?.source || obj?.value )));
        }

        let paths = asArray( pPaths || options.paths || [] );
        options.paths = paths;

        if ( detectCycles( paths, 5, 5 ) )
        {
            const errorMessage = infiniteLoopMessage( paths, 5, 5 );

            _handleCaughtException( onError, new Error( errorMessage ), calculateErrorSourceName( modName, "asJson" ), S_ERROR, _mt_str, options, pVisited, pResolved, paths, pRoot );

            return JSON.stringify( errorMessage );
        }

        const _include = _resolveInclusions( options );
        options.include = _include || [];

        const _exclude = _resolveExclusions( options, _include );
        options.exclude = _exclude || [];

        let resolved = _resolveResolvedMap( pResolved || options.resolved, options );
        options.resolved = resolved;

        let visited = pVisited || options.visited || new ExploredSet();
        options.visited = visited;

        const omitFunctions = options?.omitFunctions;

        const newline = ([_str, _num].includes( typeof space ) ? "\n" : "");
        const tab = isNumber( space ) ? (" ".repeat( space * depth ).slice( 0, 10 )) : isString( space ) ? space.repeat( depth + 1 ) : "";

        let jsonString = _mt_str;

        switch ( typeof obj )
        {
            case _ud:
                jsonString = handleNull( obj, options ) || JSON.stringify( "undefined" );
                break;

            case _str:
                jsonString = JSON.stringify( obj, replacer, tab );
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

                if ( isMap( obj ) )
                {
                    obj = { ...obj.entries() };
                }

                if ( isSet( obj ) )
                {
                    obj = [...obj.values()];
                }

                let object = _resolveObject( obj, options );

                let isArr = isArray( object );

                let resolvedValue = resolved.find( object, root, current );

                let asResolved = resolvedValue || new ResolvedValue( buildPathExpression( S_PATH, S_ROOT, objectUtils.tracePathTo( object, root ) ), root, current, object );

                resolved.set( asResolved?.key, asResolved );

                if ( visited.has( object ) || (isNonNullValue( resolvedValue ) && resolvedValue instanceof ResolvedValue) )
                {
                    jsonString = asResolved?.json || JSON.stringify( asResolved?.expression );

                    if ( !isBlank( jsonString ) )
                    {
                        break;
                    }
                }

                visited.add( object );

                let s = isArr ? "[" : ("{" + newline);

                let entries = _getPersistentEntries( object, _exclude, _include );

                let prependComma = false;

                for( const entry of entries )
                {
                    let key = asString( entry.key || entry[0], true );

                    const value = entry.value || entry[1];

                    if ( (isFunction( value ) && omitFunctions) || (isNull( value ) && !options.includeEmptyProperties) || isBlank( key ) )
                    {
                        continue;
                    }

                    if ( prependComma )
                    {
                        s += _comma + newline;
                    }

                    if ( !isArr )
                    {
                        s += (_dblqt + key + _dblqt + _colon);
                    }

                    s += asJson( value, replacer, space, options, visited, resolved, [...paths].concat( ...[key] ), root, (depth + 1) );

                    prependComma = true;
                }

                s += isArr ? "]" : "}";

                jsonString = s;

                if ( asResolved instanceof ResolvedValue )
                {
                    asResolved.json = jsonString;
                    resolved.set( asResolved?.key, asResolved );
                }

                break;
        }

        const json = asString( jsonString, true );

        if ( !isBlank( json ) )
        {
            const expression = buildPathExpression( S_PATH, S_ROOT, ...paths );

            let resolvedValue = resolved.get( expression );

            resolvedValue = resolvedValue instanceof ResolvedValue ? resolvedValue : new ResolvedValue( expression, root, current, pObject, json, ...paths );

            resolvedValue.json = resolvedValue.json || json;

            resolved.set( expression, resolvedValue );
        }

        return asString( json, true );
    };

    const parseJson = function( pJson,
                                pReviver,
                                pOptions = DEFAULT_OPTIONS_FOR_JSON,
                                pScope = $scope() )
    {
        let json = asString( pJson, true );

        if ( !isJson( json ) )
        {
            return asArray( json );
        }

        const options = populateOptions( pOptions, DEFAULT_OPTIONS_FOR_JSON );

        const onError = isFunction( options?.onError ) ? options?.onError : ignore;

        let visited = _resolvedVisitedSet( options?.visited, options );
        options.visited = visited;

        let resolved = _resolveResolvedMap( options?.resolved, options );
        options.resolved = resolved;

        let paths = asArray( options.paths || [] );
        options.paths = paths;

        let root = options?.root;

        let scp = firstValidObject( pScope, options?.scope, $scope() );

        let obj = null;

        try
        {
            const reviver = _resolveReviver( pReviver, options?.reviver );

            obj = JSON.parse( json, reviver );

            root = _resolveRoot( obj, root, options?.root, scp );

            options.root = root;
        }
        catch( ex )
        {
            _handleCaughtException( onError, ex, calculateErrorSourceName( modName, "parseJson" ), S_WARN, json, options, visited, resolved, paths, root );
        }

        if ( options.interpolate || (new RegExp( RX_CONTAINS_INTERPOLATION_KEY, "dgi" ).test( json )) )
        {
            resolved.set( "^", new ResolvedValue( "^", root, obj, root, json, ...paths ) );

            resolved.set( ROOT_PATH_EXPRESSION, new ResolvedValue( ROOT_PATH_EXPRESSION, root, obj, root, json, ...paths ) );

            const interpolator = new Interpolator( scp, (root || obj), obj, options, resolved );

            obj = interpolator.interpolate( obj, scp, root || obj, obj, resolved ) || obj;
        }

        return obj;
    };

    let mod =
        {
            dependencies,
            classes:
                {
                    Interpolator,
                    Segment,
                    InterpolationEntry,
                    InterpolatableValue,
                    ResolvedValue,
                    ResolvedMap,
                    ExploredSet
                },
            asJson,
            parseJson,
            DEFAULT_REPLACER,
            DEFAULT_REVIVER,
            DEFAULT_OPTIONS_FOR_JSON,
            DEFAULT_EXCLUSIONS,
            DEFAULT_MAX_RUNTIME: MAX_RUN_TIME,
            DEFAULT_MAX_DEPTH: MAX_RECURSION,
            containsInterpolatableContent,
            pendingInterpolation,
            buildPathExpression
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
