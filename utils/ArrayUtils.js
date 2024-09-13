const constants = require( "./Constants.js" );
const typeUtils = require( "./TypeUtils.js" );
const stringUtils = require( "./StringUtils.js" );

const konsole = console || {};

const _ud = constants?._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};


(function exposeArrayUtils()
{
    let
        {
            _mt_str = constants._mt_str || "",
            _comma = constants?._comma || ",",
            _dot = constants?._dot || ".",
            _str = constants._str || "string",
            _fun = constants._fun || "function",
            _obj = constants._obj || "object",
            _num = constants._num || "number",
            _big = constants._big || "bigint",
            _bool = constants._bool || "boolean",
            _symbol = constants._symbol || "symbol",
            ignore = function( pErr ) {},
            asString = stringUtils.asString || function( s ) { return (_mt_str + s).trim(); },
            isBlank = stringUtils.isBlank || function( s ) { return _mt_str === asString( s ).trim(); },
            asInt = stringUtils.asInt || function( s ) { return parseInt( asString( s ).replace( /\..*/, _mt_str ).replace( /\D/g, _mt_str ) ); },
            AsyncFunction = (async function() {}).constructor,
            EMPTY_ARRAY = Object.freeze( [] ),
            EMPTY_OBJECT = Object.freeze( {} )
        } = constants || {};

    Object.assign( this, constants );
    Object.assign( this, typeUtils );
    Object.assign( this, stringUtils );

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module
     */
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils
        };

    if ( _fun !== typeof Array.isArray )
    {
        Array.isArray = function( pArg )
        {
            if ( (_ud === typeof pArg) || (null == pArg) )
            {
                return false;
            }
            return "[object Array]" === {}.toString.call( pArg );
        };
    }

    const INTERNAL_NAME = "__BOCK__ARRAY_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const TRANSFORMATIONS =
        {
            FILTER: "filter",
            MAP: "map",
            SORT: "sort"
        };

    /**
     * Returns the default initialization value for a value of the type of the value specified or the type specified
     *
     * @param pVal the value whose type is to be used to calculate the default value to return
     * @param pType the type string to be used to calculate the default value to return when the first argument is null or undefined
     *
     * @returns {undefined|bigint|number|null|string|*|*[]|{}|(function())|boolean}
     */
    const defaultOfSameType = function( pVal, pType )
    {
        switch ( typeof pVal )
        {
            case _ud:
                switch ( pType )
                {
                    case _ud:
                        return undefined;

                    case _str:
                        return _mt_str;

                    case _bool:
                        return false;

                    case _num:
                        return 0;

                    case _big:
                        return 0n;

                    case _obj:
                        return ((null == pVal) ? ("Array" === pType ? [] : {}) : (Array.isArray( pVal ) || "Array" === pType) ? [] : {});

                    case _fun:
                        return function() {};

                    case _symbol:
                        return Symbol.prototype;

                    default:
                        return null;
                }
                break;

            case _str:
                return _mt_str;

            case _bool:
                return false;

            case _num:
                return 0;

            case _big:
                return 0n;

            case _obj:
                return ((null == pVal) ? ("Array" === pType ? [] : {}) : (Array.isArray( pVal ) || "Array" === pType) ? [] : {});

            case _fun:
                return function() {};

            case _symbol:
                return Symbol.prototype;

            default:
                return null;
        }
    };

    const Predicates =
        {
            IDENTITY: e => true,
            IS_PREDICATE: e => _fun === typeof e && e?.length > 0 && e?.length <= 3,
            IS_COMPARATOR: e => _fun === typeof e && e?.length === 2,
            IS_DEFINED: e => _ud !== typeof e,
            IS_NOT_NULL: e => Predicates.IS_DEFINED( e ) && null !== e,
            _copyPredicateArguments: function( ...pPredicates )
            {
                return ([].concat( ...(pPredicates || [Predicates.IDENTITY]) )).filter( Predicates.IS_PREDICATE );
            },
            MATCHES_TYPE: function( ...pType )
            {
                const types = [].concat( ...(pType || []) ).filter( e => [_ud, _obj, _fun, _str, _num, _big, _bool, _symbol].includes( e ) );

                return function( e )
                {
                    let matches = false;

                    for( const type of types )
                    {
                        if ( type === typeof e )
                        {
                            matches = true;
                            break;
                        }
                    }

                    return matches;
                };
            },
            MATCHES_ALL: function( ...pPredicates )
            {
                const predicates = Predicates._copyPredicateArguments( ...pPredicates );

                return function( e )
                {
                    let matches = true;

                    for( const func of predicates )
                    {
                        try
                        {
                            if ( true !== func( e ) )
                            {
                                matches = false;
                                break;
                            }
                        }
                        catch( ex )
                        {
                            ignore( ex );

                            matches = false;
                            break;
                        }
                    }

                    return matches;
                };
            },
            MATCHES_ANY: function( ...pPredicates )
            {
                const predicates = Predicates._copyPredicateArguments( ...pPredicates );

                return function( e )
                {
                    let matches = false;

                    for( const func of predicates )
                    {
                        try
                        {
                            if ( true === func( e ) )
                            {
                                matches = true;
                                break;
                            }
                        }
                        catch( ex )
                        {
                            ignore( ex );
                        }
                    }

                    return matches;
                };
            },
            MATCHES_NONE: function( ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Predicates.IS_PREDICATE );

                if ( predicates.length > 0 )
                {
                    const func = Predicates.MATCHES_ANY( ...predicates );

                    return function( e )
                    {
                        return !func( e );
                    };
                }

                return function( e ) { return true; };
            },
            _numExpected: function( pNum )
            {
                let num = [_num, _big].includes( typeof pNum ) ? parseInt( Number( pNum ).toFixed( 0 ) ) : _str === typeof pNum ? parseInt( pNum ) : 1;

                return [_num, _big].includes( typeof num ) && !isNaN( num ) && isFinite( num ) ? num : 1;
            },
            MATCHES_N_OR_MORE: function( pNumMatches, ...pPredicates )
            {
                const predicates = Predicates._copyPredicateArguments( ...pPredicates );

                const numExpected = Predicates._numExpected( pNumMatches );

                return function( e )
                {
                    let numMatches = 0;

                    for( const func of predicates )
                    {
                        try
                        {
                            numMatches += (func( e ) ? 1 : 0);
                        }
                        catch( ex )
                        {
                            ignore( ex );
                        }

                        if ( numMatches >= numExpected )
                        {
                            break;
                        }
                    }

                    return (numMatches >= numExpected);
                };
            },
            MATCHES_ONLY_N: function( pNumMatches, ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Predicates.IS_PREDICATE );

                let numExpected = Predicates._numExpected( pNumMatches );

                return function( e )
                {
                    let numMatches = 0;

                    for( const func of predicates )
                    {
                        try
                        {
                            numMatches += (func( e ) ? 1 : 0);
                        }
                        catch( ex )
                        {
                            ignore( ex );

                            numMatches = Infinity;
                            break;
                        }
                    }

                    return (numMatches === numExpected);
                };
            },
            MATCHES_LESS_THAN_N: function( pNumAllowed, ...pPredicates )
            {
                const predicates = [].concat( ...(pPredicates || []) ).filter( Predicates.IS_PREDICATE );

                let numAllowed = this._numExpected( pNumAllowed );

                return function( e )
                {
                    let numMatches = 0;

                    for( const func of predicates )
                    {
                        try
                        {
                            numMatches += (func( e ) ? 1 : 0);
                        }
                        catch( ex )
                        {
                            ignore( ex );

                            numMatches = Infinity;
                            break;
                        }
                    }

                    return (numMatches < numAllowed);
                };
            },
            IS_STRING: e => _str === typeof e,
            IS_EMPTY_STRING: e => Predicates.IS_STRING( e ) && _mt_str === e,
            IS_WHITESPACE: e => Predicates.IS_STRING( e ) && _mt_str === e.trim().replace( /\s+/g, _mt_str ),
            IS_POPULATED_STRING: e => Predicates.IS_STRING( e ) && !(Predicates.IS_EMPTY_STRING( e )),
            IS_NON_WHITESPACE: e => Predicates.IS_STRING( e ) && !Predicates.IS_WHITESPACE( e ),
            IS_NUMBER: e => [_num, _big].includes( (typeof e) ),
            IS_INTEGER: e => Predicates.IS_NUMBER( e ) && (Math.abs( e - Math.round( e ) ) < 0.0000000001),
            IS_OBJECT: e => _obj === typeof e,
            IS_ARRAY: e => Predicates.IS_OBJECT( e ) && Array.isArray( e ),
            IS_FUNCTION: e => _fun === typeof e,
            IS_ASYNC_FUNCTION: e => Predicates.IS_FUNCTION( e ) && e instanceof AsyncFunction,
            IS_POPULATED_OBJECT: e => Predicates.IS_OBJECT( e ) && Predicates.IS_NOT_NULL( e ) && (Predicates.IS_ARRAY( e ) ? ((e?.length || 0) > 0) : (Object.keys( e )?.length || 0) > 0),
            IS_POPULATED_NON_ARRAY_OBJECT: e => Predicates.IS_OBJECT( e ) && Predicates.IS_NOT_NULL( e ) && ( !Predicates.IS_ARRAY( e ) && Object.keys( e ).length > 0),
            IS_POPULATED_ARRAY: e => Predicates.IS_OBJECT( e ) && Predicates.IS_NOT_NULL( e ) && (Predicates.IS_ARRAY( e ) && e?.length > 0),
            IS_VALID_NUMBER: e => Predicates.IS_NUMBER( e ) && !isNaN( e ) && isFinite( e ),
            NON_EMPTY: e => Predicates.IS_POPULATED_STRING( e ) || Predicates.IS_POPULATED_OBJECT( e ) || Predicates.IS_VALID_NUMBER( e ) || Predicates.IS_FUNCTION || _bool === typeof e,
            NON_BLANK: e => Predicates.IS_POPULATED_STRING( e ) && _mt_str !== e.trim() && !Predicates.IS_WHITESPACE( e ),
            MATCHES_REGEXP: function( pRx )
            {
                const rx = new RegExp( pRx || /.*/s );

                return function( e )
                {
                    if ( !(_str === typeof e) )
                    {
                        return false;
                    }

                    const re = new RegExp( rx || /.*/s );

                    return re.test( e );
                };
            },
            NOT_IN: function( ...pArr )
            {
                const arr = [].concat( ...(pArr || []) ).flat();
                return e => arr?.length > 0 ? !(arr.includes( e )) : (_ud !== typeof e && null !== e);
            },
            IN:
                function( ...pArr )
                {
                    const arr = [].concat( ...(pArr || []) ).flat();
                    return e => arr?.length > 0 && (arr.includes( e ));
                },
            STARTS_WITH: function( ...pArr )
            {
                const arr = [].concat( ...(pArr || []) ).flat().map( e => asString( e ) );

                return function( e, i, a )
                {
                    let does = arr?.length <= 0 && _mt_str === e.trim();

                    for( const elem of arr )
                    {
                        if ( elem && e && e.startsWith( elem ) )
                        {
                            does = true;
                            break;
                        }
                    }
                    return does;
                };
            },
            ENDS_WITH: function( ...pArr )
            {
                const arr = [].concat( ...(pArr || []) ).flat().map( e => asString( e ) );

                return function( e, i, a )
                {
                    let does = arr?.length <= 0 && _mt_str === e.trim();

                    for( const elem of arr )
                    {
                        if ( elem && e && e.endsWith( elem ) )
                        {
                            does = true;
                            break;
                        }
                    }

                    return does;
                };
            },
            buildPredicate: function( ...pFunctions )
            {
                const functions = [].concat( ...(pFunctions || [Predicates.IDENTITY]) ).filter( Predicates.IS_PREDICATE );

                return function( pElem, pIndex, pArray )
                {
                    for( const func of functions )
                    {
                        try
                        {
                            if ( true !== func( pElem, pIndex, pArray ) )
                            {
                                return false;
                            }
                        }
                        catch( ex )
                        {
                            ignore( ex );

                            return false;
                        }
                    }

                    return true;
                };
            },
            chain: function( ...pFilters )
            {
                const filters = ([].concat( ...(pFilters || [Predicates.IDENTITY]) )).filter( Predicates.IS_PREDICATE );

                return function( e, i, a )
                {
                    let matches = true;

                    let j = 0, n = filters?.length;

                    while ( matches && j < n )
                    {
                        const check = filters[j++];

                        matches = check( e, i, a );
                    }

                    return matches;
                };
            }
        };

    const predicate = function( ...pFunction )
    {
        const functions = [].concat( ...(pFunction || [Predicates.IDENTITY]) ).filter( Predicates.IS_PREDICATE );

        Predicates.MATCHES_ALL( ...(functions || [Predicates.IDENTITY]) );
    };

    let Filters = Object.assign( {}, Predicates );

    Filters.comparators = (e => Predicates.IS_FUNCTION( e ) && Predicates.IS_COMPARATOR( e ));

    const Mappers =
        {
            IDENTITY: e => e,
            TO_STRING: e => _str === typeof e ? e : asString( e ),
            TO_NUMBER: e => [_num, _big].includes( typeof e ) ? e : parseFloat( asString( e ) ),
            TO_VALID_NUMBER: function( e )
            {
                let n = Mappers.TO_NUMBER( e );

                if ( !isNaN( n ) && isFinite( n ) )
                {
                    return n;
                }

                return 0;
            },
            TRIMMED: e => asString( e ).trim(),
            APPEND: function( pStr )
            {
                return e => asString( e ) + (asString( pStr ) || _mt_str);
            },
            PREPEND: function( pStr )
            {
                return e => (asString( pStr ) || _mt_str) + asString( e );
            },
            REPLACE: function( pSearchStr, pReplacement )
            {
                return e => asString( e ).replace( pSearchStr, (asString( pReplacement || _mt_str ) || _mt_str) );
            },
            TO_LOWERCASE: function( e )
            {
                return asString( e ).toLowerCase();
            },
            TO_UPPERCASE: function( e )
            {
                return asString( e ).toUpperCase();
            },
            chain: function( ...pMappers )
            {
                const mappers = [].concat( ...(pMappers || [Mappers.IDENTITY]) );

                return function( e, i, a )
                {
                    let value = e;

                    for( const mapper of mappers )
                    {
                        value = mapper( e, i, a );
                    }

                    return value;
                };
            }
        };

    const calculateLength = function( pElem )
    {
        let len;

        switch ( typeof pElem )
        {
            case _ud:
                len = 0;
                break;

            case _str:
                len = pElem?.length;
                break;

            case _num:
            case _big:
                len = (asString( _mt_str + pElem || _mt_str ))?.length;
                break;

            case _obj:
                if ( null == pElem )
                {
                    len = 0;
                    break;
                }
                if ( Array.isArray( pElem ) )
                {
                    len = pElem?.length;
                    break;
                }
                len = Object.keys( pElem ).length;
                break;

            default:
                len = 0;
                break;
        }

        return len;
    };

    const Comparators =
        {
            _compare: function( a, b )
            {
                return (a < b ? -1 : a > b ? 1 : 0);
            },
            NONE: function( a, b )
            {
                return 0;
            },
            DEFAULT: function( a, b, pType )
            {
                let aa = Predicates.IS_NOT_NULL( a ) ? a : defaultOfSameType( b, pType );
                let bb = Predicates.IS_NOT_NULL( b ) ? b : defaultOfSameType( a, pType );

                return Comparators._compare( aa, bb );
            },
            BY_STRING_VALUE: function( a, b )
            {
                let sA = asString( a ) || (_fun === typeof a?.toString ? a.toString() : _mt_str);
                let sB = asString( b ) || (_fun === typeof b?.toString ? b.toString() : _mt_str);

                if ( isBlank( sA ) && _str !== typeof a )
                {
                    try
                    {
                        sA = JSON.stringify( a );
                    }
                    catch( exJson )
                    {
                        ignore( exJson );
                    }
                }

                if ( isBlank( sB ) && _str !== typeof b )
                {
                    try
                    {
                        sB = JSON.stringify( b );
                    }
                    catch( exJson )
                    {
                        ignore( exJson );
                    }
                }

                let comp = Comparators._compare( sA, sB );

                if ( 0 === comp )
                {
                    comp = Comparators.DEFAULT( a, b );
                }

                return comp;
            },
            BY_LENGTH: function( a, b )
            {
                let lenA = a?.length || calculateLength( a );
                let lenB = b?.length || calculateLength( b );

                return Comparators._compare( lenA, lenB );
            },
            BY_POSITION: function( pReference, pPositionFunction, pTransformation )
            {
                const ref = [].concat( ...(pReference || []) );

                const transform = function( pElem )
                {
                    let value = pElem;

                    if ( _fun === typeof pTransformation )
                    {
                        try
                        {
                            value = pTransformation.apply( pElem, [pElem, ref] );
                        }
                        catch( ex )
                        {
                            konsole.warn( "Could not transform", pElem, ex );
                        }
                    }

                    return value;
                };

                const findPosition = function( pElem, pReference )
                {
                    let arr = ((pReference && Array.isArray( pReference )) ? pReference : ref) || [];

                    let position = arr.indexOf( pElem );

                    if ( _fun === typeof pPositionFunction )
                    {
                        try
                        {
                            position = pPositionFunction.apply( arr, [pElem, arr] );
                        }
                        catch( ex )
                        {
                            konsole.warn( "Could not find position of ", pElem, "in array", arr, ex );
                        }
                    }

                    return position;
                };

                return function( a, b )
                {
                    if ( ref?.length <= 0 )
                    {
                        let cmp = Comparators.BY_STRING_VALUE( a, b );
                        if ( 0 === cmp )
                        {
                            cmp = Comparators.DEFAULT( a, b );
                        }

                        return cmp;
                    }

                    let aa = transform( a );
                    let bb = transform( b );

                    let idxA = findPosition( aa, ref );
                    let idxB = findPosition( bb, ref );

                    idxA = idxA < 0 ? ref.length : idxA;
                    idxB = idxB < 0 ? ref.length : idxB;

                    let comp = Comparators._compare( idxA, idxB );

                    if ( 0 === comp )
                    {
                        comp = Comparators.BY_STRING_VALUE( aa, bb );
                    }

                    if ( 0 === comp )
                    {
                        comp = Comparators.BY_STRING_VALUE( a, b );
                    }

                    if ( 0 === comp )
                    {
                        comp = Comparators.DEFAULT( aa, bb );
                    }

                    if ( 0 === comp )
                    {
                        comp = Comparators.DEFAULT( a, b );
                    }

                    return comp;
                };
            },
            chain: function( ...pComparators )
            {
                const comparators = [].concat( ...(pComparators || [Comparators.NONE]) ).filter( Filters.comparators );

                return function( a, b )
                {
                    let i = 0, n = comparators?.length;

                    let comp = 0;

                    while ( 0 === comp && i < n )
                    {
                        const comparator = comparators[i++];

                        comp = comparator( a, b );
                    }

                    return comp;
                };
            },
            descending: function( ...pComparators )
            {
                const comparators = [].concat( ...(pComparators || [Comparators.NONE]) ).filter( Filters.comparators );

                return function( a, b )
                {
                    let i = 0, n = comparators?.length;

                    let comp = 0;

                    while ( 0 === comp && i < n )
                    {
                        const comparator = comparators[i++];

                        comp = -(comparator( a, b ));
                    }

                    return comp;
                };
            },
            isComparator: function( pCandidate )
            {
                if ( _ud === typeof pCandidate || null == pCandidate )
                {
                    return false;
                }

                return _fun === typeof pCandidate && 2 === pCandidate?.length;
            }
        };

    class Transformer
    {
        constructor( pMethod, pFunction )
        {
            this._method = pMethod;
            this._function = pFunction;
        }

        get method()
        {
            return (_str === this._method ? this._method : this._method?.name) || TRANSFORMATIONS.FILTER;
        }

        get argument()
        {
            let func = this._function;

            return (_fun === typeof func) ? func : ((TRANSFORMATIONS.FILTER === this.method ? Filters.IDENTITY : TRANSFORMATIONS.MAP === this.method ? Mappers.IDENTITY : e => e));
        }

        transform( pArr )
        {
            let arr = [].concat( ...(pArr || []) );

            if ( _str === typeof arr[this.method] )
            {
                const operation = arr[this._method];

                if ( _fun === typeof operation )
                {
                    if ( _fun === typeof this.argument )
                    {
                        arr = arr[this.method]( this.argument );
                    }
                }
            }

            return arr;
        }
    }

    Mappers.toTransformer = function( pTransformation )
    {
        return e => new Transformer( pTransformation, e );
    };

    class TransformerChain
    {
        constructor( ...pTransformers )
        {
            this._transformers = [].concat( ...(pTransformers || []) );
        }

        transform( pArr )
        {
            let arr = [].concat( ...(pArr || []) );

            for( const transformer of this._transformers )
            {
                if ( (transformer instanceof this.constructor) || (transformer instanceof TransformerChain) )
                {
                    arr = transformer.transform( arr );
                }
                else
                {
                    const method = transformer.method;
                    const func = transformer?.argument;

                    if ( _fun === typeof arr[method] && _fun === typeof func )
                    {
                        arr = arr[method]( func );
                    }
                }

                if ( arr?.length <= 0 )
                {
                    break;
                }
            }

            return arr;
        }
    }

    class FilterChain extends TransformerChain
    {
        constructor( ...pFilters )
        {
            super( ([].concat( ...(pFilters || [Filters.IDENTITY]) )).map( e => new Transformer( TRANSFORMATIONS.FILTER, e ) ) );
        }

        applyFilters( pArr )
        {
            return super.transform( pArr );
        }
    }

    FilterChain.NON_EMPTY_STRINGS = new FilterChain( Filters.IS_DEFINED, Filters.IS_NOT_NULL, Filters.MATCHES_TYPE( _str ), Filters.NON_EMPTY );
    FilterChain.NON_BLANK_STRINGS = new FilterChain( Filters.IS_DEFINED, Filters.IS_NOT_NULL, Filters.MATCHES_TYPE( _str ), Filters.NON_BLANK );

    class MapperChain extends TransformerChain
    {
        constructor( ...pMappers )
        {
            super( ([].concat( ...(pMappers || [Mappers.IDENTITY]) )).map( e => new Transformer( TRANSFORMATIONS.MAP, e ) ) );
        }

        applyMappers( pArr )
        {
            return super.transform( pArr );
        }
    }

    MapperChain.NON_EMPTY_STRINGS = new TransformerChain( new Transformer( TRANSFORMATIONS.MAP, Mappers.TO_STRING ), FilterChain.NON_EMPTY_STRINGS );

    class ComparatorChain extends TransformerChain
    {
        constructor( ...pComparators )
        {
            super( [].concat( (pComparators || [Comparators.NONE]) ).filter( Filters.comparators ).map( e => new Transformer( TRANSFORMATIONS.SORT, e ) ) );

            this._comparators = ([].concat( ...(pComparators || [Comparators.NONE]) )).filter( Filters.comparators );
        }

        transform( pArr )
        {
            let arr = [].concat( ...(pArr || []) );

            arr = this.sort( arr );

            return arr;
        }

        get comparator()
        {
            return function( a, b )
            {
                let comp = 0;

                for( const func of this._comparators )
                {
                    comp = func( a, b );

                    if ( 0 !== comp )
                    {
                        break;
                    }
                }

                return comp;
            };
        }

        sort( pArr )
        {
            let arr = [].concat( ...(pArr || []) );

            const checksum = arr.length;

            arr = arr.sort( this.comparator );

            return checksum === arr?.length ? arr || pArr : pArr;
        }
    }

    const chainFilters = function( pArr, ...pFilters )
    {
        let arr = [].concat( ...(pArr || []) );

        let filters = [].concat( ...(pFilters || [Filters.IDENTITY]) );

        for( const sieve of filters )
        {
            arr = arr.filter( sieve );

            if ( arr?.length <= 0 )
            {
                break;
            }
        }

        return arr;
    };

    const chainMappers = function( pArr, ...pMappers )
    {
        let arr = [].concat( ...(pArr || []) );

        let mappers = [].concat( ...(pMappers || [Mappers.IDENTITY]) );

        for( const mapper of mappers )
        {
            arr = arr.map( mapper );
        }

        return arr;
    };

    /**
     * Returns true if the specified object is an array and has at least one element
     * @param pArr (array or indexed object -- that is, something with a length property and the ability to address members via an integer key)
     * @param pMinimumLength (optional) the minimum length pArr must have to be considered "populated"; defaults to 1
     * @returns {boolean}
     */
    const isPopulatedArray = function( pArr, pMinimumLength )
    {
        const minLength = Math.max( 1, asInt( asString( pMinimumLength ) || 1 ) );

        const arr = !((_ud === typeof pArr) || (null === pArr)) ? (pArr || []) : [];

        const isIndexedObject = (Array.isArray( pArr )) || Object.hasOwn( arr, "length" );

        return isIndexedObject && (minLength <= (arr?.length || 0));
    };

    /**
     * Returns the first array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     *
     * @param{Array<Array|any>} pCandidates an array of values, each expected to be an Array
     *
     * @returns {Array} the first array specified that has a length > 0
     * or a zero-length array if none of the candidates are arrays with a length > 0
     */
    const firstPopulatedArray = function( ...pCandidates )
    {
        // filter the arguments so the resulting array is either empty or holds at least one array matching the filter,
        // where the filter matches only elements that are arrays with one or more elements
        let candidates = (pCandidates || []).filter( Predicates.MATCHES_ALL( Predicates.IS_ARRAY, Predicates.IS_POPULATED_OBJECT ) );

        // if any of the candidates matched the filter, return the first of these, otherwise, return an empty array
        return isPopulatedArray( candidates, 1 ) ? candidates[0] : [];
    };

    /**
     * Returns a copy of an array with duplicate elements removed
     * @param {Array} pArr
     * @returns {Array} a copy of the array with duplicates removed
     */
    const unique = function( pArr )
    {
        let arr = [].concat( ...(pArr || []) );

        return [...(new Set( arr ))];
    };

    const sortArray = function( pArr, pOrderBy )
    {
        let arr = [].concat( ...(pArr || []) );

        let opts = { comparator: pOrderBy || "compareTo" };

        if ( _fun === typeof pOrderBy )
        {
            opts.comparator = pOrderBy;
        }

        if ( _str === typeof opts?.comparator && "true" === opts?.comparator )
        {
            opts.comparator = true;
        }

        if ( _bool === typeof opts?.comparator )
        {
            opts.comparator = opts.comparator ? "compareTo" : "toString";
        }

        const comparator = ((_fun === typeof opts?.comparator) ? opts?.comparator : function( pElemA, pElemB, pProperty )
        {
            let property = asString( asString( pProperty ) || asString( opts?.comparator ) || "compareTo" );

            if ( property )
            {
                let a = pElemA?.[pProperty] || pElemB?.[pProperty] || pElemA?.compareTo;
                let b = pElemB?.[pProperty] || pElemA?.[pProperty] || pElemB?.compareTo;

                if ( _fun === typeof a )
                {
                    a = a.apply( pElemA || pElemB || $scope(), [pElemB, opts] );
                }
                else
                {
                    a = pElemA;
                }

                if ( _fun === typeof b )
                {
                    b = b.apply( pElemB || pElemA || $scope(), [pElemA, opts] );
                }
                else
                {
                    b = pElemB;
                }

                return a < b ? -1 : (a > b ? 1 : 0);
            }

            return pElemA < pElemB ? -1 : pElemA > pElemB ? 1 : 0;
        });

        let arr2 = [].concat( ...arr );

        try
        {
            arr2 = arr2.sort( comparator );

            if ( arr2 && arr2?.length === arr?.length )
            {
                arr = [].concat( ...arr2 );
            }
        }
        catch( ex )
        {
            konsole.warn( ex );
        }

        return arr || pArr;
    };

    const DEFAULT_AS_ARRAY_OPTIONS =
        {
            flatten: false,
            splitOn: undefined,
            filter: null,
            sanitize: false,
            type: null,
            unique: false,
            comparator: null
        };

    /**
     * Returns an array based on its input.
     * If its input *is* an array, just returns it, unmodified, unaliased
     * If it is a string, then, depending on the options optionally specified, that string is either split on a value and resulting array is returned,or...
     *                          the string is wrapped in an array literal and a one element array containing the string is returned.
     * if the input is a primitive value, a one element array containing that value is returned.
     * if the input is a function, that function is executed with the options as its argument and the result is passed back into this function
     * if the input is an object, a new array is created and populated with the "first-level" properties of the object and then returned
     * @param {any} pMaybeAnArray
     * @param {object} pOptions
     * @returns
     */
    const asArray = function( pMaybeAnArray, pOptions = DEFAULT_AS_ARRAY_OPTIONS )
    {
        const options = Object.assign( Object.assign( {}, DEFAULT_AS_ARRAY_OPTIONS ), (pOptions || EMPTY_OBJECT) );

        let arr = (_ud === typeof pMaybeAnArray ? EMPTY_ARRAY : (_str === typeof pMaybeAnArray && _mt_str === pMaybeAnArray) ? [pMaybeAnArray] : (pMaybeAnArray || EMPTY_ARRAY));

        if ( !Array.isArray( arr ) )
        {
            switch ( typeof arr )
            {
                case _obj:
                    if ( !Array.isArray( arr ) )
                    {
                        arr = Object.values( arr );
                    }
                    break;

                case _str:
                    if ( !typeUtils.isUndefined( options?.splitOn ) && typeUtils.isString( options?.splitOn ) )
                    {
                        const sep = asString( options?.splitOn );
                        arr = arr.split( sep ) || [arr];
                    }
                    else
                    {
                        arr = [arr];
                    }
                    break;

                case _num:
                case _big:
                case _bool:
                    arr = [arr];
                    break;

                case _fun:

                    const isConstructor = function( pFunction ) { return _fun === typeof pFunction && /^class\s/.test( (_mt_str + Function.prototype.toString.call( pFunction, pFunction )).trim() ); };

                    try
                    {
                        if ( isConstructor( arr ) )
                        {
                            const clazz = arr;

                            arr = asArray( new clazz( options ), options ) || [];
                        }
                        else
                        {
                            const func = arr;

                            arr = asArray( func( options ), options ) || [];
                        }
                    }
                    catch( ex )
                    {
                        konsole.error( "Could not execute " + (arr?.name || arr), ex );
                    }
                    break;

                default:
                    if ( _ud !== (typeof arr[Symbol.iterator]) )
                    {
                        const returnValue = [];

                        for( const value of arr )
                        {
                            if ( value )
                            {
                                if ( options && options.filter )
                                {
                                    if ( options.filter( value ) )
                                    {
                                        returnValue.push( value );
                                    }
                                }
                                else
                                {
                                    returnValue.push( value );
                                }
                            }
                        }

                        arr = asArray( returnValue, options ) || [];
                    }
            } // end switch
        } // end else

        let eia = EMPTY_ARRAY;

        const flatten = options?.flatten || false;

        let flattenLevel = (options?.flatten?.level);

        if ( isNaN( flattenLevel ) || flattenLevel <= 0 )
        {
            flattenLevel = Infinity;
        }

        arr = ((flatten && arr.flat) ? arr.flat( flattenLevel ) : arr) || eia;

        arr = (options?.sanitize ? (arr || eia).filter( e => (_ud !== typeof e && null != e && !stringUtils.isEmpty( e )) ) : (arr || eia)) || eia;

        arr = (options?.type ? (arr || eia).filter( e => (options?.type === typeof e) ) : (arr || eia)) || eia;

        if ( _fun === typeof options?.filter && options?.filter?.length >= 1 && options?.filter?.length <= 3 )
        {
            arr = arr.filter( options?.filter );
        }

        if ( options?.unique )
        {
            arr = [...(new Set( arr ))];
        }

        let comparator = options?.comparator;

        if ( _fun === typeof comparator && comparator?.length === 2 )
        {
            arr = [].concat( (arr || eia) );
            arr = arr.sort( comparator );
        }

        return arr || [];
    };

    /**
     * Returns an array with any elements that are null or undefined removed
     * @param {any} pArr - should be an array, but can be anything, as we will force it to be an array before pruning
     * @param {boolean} pRejectNaN - (optional) when specified as true, numeric array elements that are NaN or not finite are also removed
     * @param {...string} pRejectedTypes one or more types to exclude from the returned array
     * @returns {Array} an array with no null or undefined elements, potentially an empty array
     */
    const pruneArray = function( pArr, pRejectNaN = true, ...pRejectedTypes )
    {
        // force the input argument to be an array
        let arr = asArray( pArr, { "sanitize": true } );

        // this is the array we will return, so we do not modify the input argument
        let pruned = [].concat( arr || [] ).filter( Predicates.IS_NOT_NULL );

        const rejectedTypes = [].concat( ...(pRejectedTypes || []) );

        if ( rejectedTypes && rejectedTypes.length )
        {
            pruned = pruned.filter( e => !rejectedTypes.includes( typeof e ) );
        }

        if ( pRejectNaN && !(rejectedTypes.includes( _num ) && rejectedTypes.includes( _big )) )
        {
            pruned = pruned.filter( e => !([_num, _big].includes( typeof e )) || !(isNaN( e ) || !isFinite( e )) );
        }

        // always return an array to avoid null-pointer exceptions
        return pruned || [];
    };

    const hasElements = function( pArr, pMinimum )
    {
        let minimum = asInt( pMinimum || 0, 0 ) || 0;

        return (Array.isArray( pArr ) && (pArr?.length || 0) > minimum);
    };

    const isEmptyArray = function( pArr )
    {
        return (Array.isArray( pArr ) && (pArr?.length || 0) <= 0);
    };

    const arrLength = function( pArr, pAllowStrings )
    {
        if ( Array.isArray( pArr ) || pAllowStrings )
        {
            return asInt( (pArr?.length || 0), 0 );
        }

        return 0;
    };

    const arrLenGt = function( pArr, pMinLength )
    {
        const minLength = asInt( pMinLength, 0 ) || 0;

        const len = arrLength( pArr ) || 0;

        return len > minLength;
    };

    const arrLenGtEq = function( pArr, pMinLength )
    {
        const minLength = Math.max( 0, Math.max( 0, asInt( pMinLength, 0 ) || 0 ) - 1 );

        return arrLenGt( pArr, minLength );
    };

    const arrLenLt = function( pArr, pMaxLength )
    {
        const maxLength = asInt( pMaxLength, 0 ) || 0;

        const len = arrLength( pArr ) || 0;

        return len < maxLength;
    };

    const arrLenLtEq = function( pArr, pMaxLength )
    {
        const maxLength = Math.max( 0, Math.max( 0, asInt( pMaxLength, 0 ) || 0 ) + 1 );

        return arrLenLt( pArr, maxLength );
    };

    const copyArray = function( pArr )
    {
        let arr = asArray( pArr || [] );

        let clone = structuredClone( arr );

        return [].concat( clone );
    };

    /**
     * Returns true if the two arrays contain the same elements in the same order
     *
     * @param pArrA the first array
     * @param pArrB the second array
     *
     * @param pTrim (optional) argument to control whether to trim strings prior to comparison
     *              if true, elements of each array that are of type 'string' are compared without regard to leading or trailing whitespace
     *              otherwise, elements of type 'string' are compared for exact match
     *              THE DEFAULT IS TRUE. YOU MUST EXPLICITLY PASS false TO DISABLE THE BEHAVIOR
     *
     * @returns {boolean}
     */
    const arraysEqual = function( pArrA, pArrB, pTrim = true )
    {
        let strip = (false !== pTrim);

        let arrA = asArray( pArrA || [] );
        let arrB = asArray( pArrB || [] );

        const strA = arrA.map( e => asString( e, strip ).replace( /\//g, "_slash_" ) ).join( "/" );
        const strB = arrB.map( e => asString( e, strip ).replace( /\//g, "_slash_" ) ).join( "/" );

        return (arrA?.length || 0) === (arrB?.length || 0) && strA === strB;
    };

    /**
     * Returns true if either of the 2 arrays contains the other
     *
     * @param pArrA the first array
     * @param pArrB the second array
     *
     * @param pTrim (optional) argument to control whether to trim strings prior to comparison
     *              if true, elements of each array that are of type 'string' are compared without regard to leading or trailing whitespace
     *              otherwise, elements of type 'string' are compared for exact match
     *              THE DEFAULT IS TRUE. YOU MUST EXPLICITLY PASS false TO DISABLE THE BEHAVIOR
     *
     * @returns {boolean}
     */
    const arraysIntersect = function( pArrA, pArrB, pTrim = true )
    {
        let strip = (false !== pTrim);

        let arrA = asArray( pArrA || [] );
        let arrB = asArray( pArrB || [] );

        const strA = arrA.map( e => asString( e, strip ).replace( /\//g, "_slash_" ) ).join( "/" );
        const strB = arrB.map( e => asString( e, strip ).replace( /\//g, "_slash_" ) ).join( "/" );

        return arraysEqual( arrA, arrB ) || strA.includes( strB ) || strB.includes( strA );
    };

    /**
     * Returns an array containing all the elements of the 2 arrays specified
     *
     * @param pArrA the first array
     * @param pArrB the second array
     * @param pUnique (optional) parameter to control how to treat duplicated elements
     *                if true, the returned array contains only the unique elements found in the 2 arrays
     *                otherwise, the returned array contains all elements found in the 2 arrays, including any that are duplicated
     * @returns {Array}
     */
    const superset = function( pArrA, pArrB, pUnique )
    {
        let arrA = asArray( pArrA || [] );
        let arrB = asArray( pArrB || [] );

        const pruned = pruneArray( arrA.concat( arrB ), false );

        return pUnique ? unique( pruned ) : pruned;
    };

    /**
     * Returns an array containing all the unique elements of the 2 arrays specified
     * This is the same as calling superset with true as the third argument
     *
     * @param pArrA the first array
     * @param pArrB the second array
     * @returns {Array}
     */
    const union = function( pArrA, pArrB )
    {
        return superset( pArrA, pArrB, true );
    };

    /**
     * Returns an array containing only those elements common to both arrays specified
     *
     * @param pArrA the first array
     * @param pArrB the second array
     * @param pUnique (optional) argument to control how to treat duplicates
     *                if true, removes duplicates, returning an array containing only the unique values common to both arrays
     *                otherwise, returned array may contain duplicates
     *
     * @returns {*}
     */
    const intersection = function( pArrA, pArrB, pUnique )
    {
        let arrA = Object.freeze( asArray( pArrA || [] ) );
        let arrB = Object.freeze( asArray( pArrB || [] ) );

        let arr = arrA.concat( arrB );

        arr = arr.filter( e => arrA.includes( e ) && arrB.includes( e ) );

        return pUnique ? unique( arr ) : arr;
    };

    /**
     * Returns an array containing only those elements unique to either of the arrays specified
     * This is the opposite of the intersection
     *
     * @param pArrA the first array
     * @param pArrB the second array
     *
     * @returns {*}
     */
    const disjunction = function( pArrA, pArrB )
    {
        let arrA = Object.freeze( asArray( pArrA || [] ) );
        let arrB = Object.freeze( asArray( pArrB || [] ) );

        let arr = arrA.concat( arrB );

        arr = arr.filter( e => !(arrA.includes( e ) && arrB.includes( e )) );

        return arr;
    };

    const enQueue = function( pArr, pElem, pLimit )
    {
        let arr = pArr || [];

        const value = pElem || constants._mt_str;

        const limit = Math.min( Math.max( 1, asInt( pLimit, ((arr?.length || 2) - 1) ) ), 10_000 );

        const numElements = arr.push( value );

        if ( numElements >= limit )
        {
            arr.shift();
        }

        return arr;
    };

    class BoundedQueue
    {
        constructor( pSize, pArr )
        {
            const desiredLimit = Math.min( Math.max( 1, asInt( pSize, (pArr?.length || pArr?.size) ) ), 65_536 );

            if ( null != pArr && (pArr instanceof this.constructor || pArr instanceof BoundedQueue) )
            {
                if ( desiredLimit > pArr.limit )
                {
                    pArr.extend( desiredLimit );
                }

                if ( desiredLimit < pArr.limit )
                {
                    pArr.shrink( desiredLimit );
                }

                this._arr = pArr._arr || [];
            }
            else
            {
                this._arr = [].concat( (asArray( pArr ) || []) ) || [];

                this._limit = desiredLimit;
            }
        }

        enQueue( pElem )
        {
            let state = { exceededBounds: false, evicted: null, size: this._arr.length, limit: this._limit };

            if ( pElem )
            {
                this._arr.push( pElem );

                if ( this._arr.length > this._limit )
                {
                    let evicted = this._arr.shift();

                    state.exceededBounds = true;
                    state.evicted = evicted;
                }
            }

            state.size = this._arr.length;

            return Object.freeze( state );
        }

        push( pElem )
        {
            const result = this.enQueue( pElem );

            return result?.size || this.size;
        }

        get size()
        {
            return this._arr.length;
        }

        get limit()
        {
            return this._limit;
        }

        isQueued( pElem )
        {
            return this._arr.includes( pElem );
        }

        includes( pElem )
        {
            return this.isQueued( pElem );
        }

        toArray()
        {
            return [].concat( (this._arr || []) );
        }

        canTake()
        {
            return this.size > 0;
        }

        isEmpty()
        {
            return this.size <= 0;
        }

        take()
        {
            if ( this.size > 0 )
            {
                return this._arr.shift();
            }
            throw new Error( "The queue is empty" );
        }

        peek()
        {
            if ( this.size > 0 )
            {
                return this._arr[0];
            }
            return null;
        }

        get state()
        {
            return {
                exceededBounds: (this.size > this.limit),
                evicted: null,
                size: this._arr.length,
                limit: this._limit,
                next: this.peek()
            };
        }

        dequeue()
        {
            return this.take();
        }

        pop()
        {
            return this._arr.pop();
        }

        clear()
        {
            this._arr = [];
        }

        shrink( pNewLimit, pEvictNewest )
        {
            const limit = Math.min( Math.max( 1, asInt( pNewLimit, this._arr?.length ) ), 65_536 );

            if ( limit > this._limit )
            {
                this.extend( limit );
            }

            let evicted = [];

            let exceeds = this.size > limit;

            while ( this.size > limit && this.size > 0 )
            {
                evicted.push( pEvictNewest ? this.pop() : this.take() );
            }

            this._limit = limit;

            return {
                exceededBounds: exceeds,
                evicted: ([].concat( (evicted) )),
                size: this.size,
                limit: this._limit,
                next: this.peek()
            };
        }

        extend( pNewLimit, ...pElems )
        {
            const limit = Math.min( Math.max( 1, asInt( pNewLimit, this._arr?.length ) ), 65_536 );

            this._limit = Math.max( limit, this._limit );

            let newElems = [].concat( (asArray( pElems )) );

            let numNewElems = newElems.length;

            if ( numNewElems > 0 )
            {
                let evicted = [];

                let newState = Object.assign( {}, this.state );

                for( let i = 0, n = numNewElems; i < n; i++ )
                {
                    let result = this.enQueue( newElems[i] );

                    if ( result?.exceededBounds )
                    {
                        evicted.push( result?.evicted );
                    }
                }

                newState.exceededBounds = evicted.length > 0;
                newState.evicted = evicted;
                newState.size = this.size;
                newState.limit = this.limit;
                newState.next = this.peek();

                return newState;
            }

            return this.state;
        }
    }

    BoundedQueue.create = function( pArr, pLimit )
    {
        const limit = Math.min( Math.max( 1, asInt( pLimit, (pArr?.length || pArr?.size) ) ), 65_536 );

        const arr = Array.isArray( pArr ) ? pArr : ((null != pArr && pArr instanceof BoundedQueue) ? pArr : asArray( pArr ));

        return new BoundedQueue( limit, arr );
    };

    const hasEntry = function( pArr, pIndex )
    {
        const arr = asArray( pArr || [] ) || [];
        const index = [_num, _big].includes( typeof pIndex ) ? (0 + pIndex) : Number.MAX_SAFE_INTEGER;

        return (index >= 0) && (arr.length > index) && (_ud !== typeof arr[index]);
    };

    const hasElementAt = hasEntry;

    const at = function( pArr, pIdx, pDefault )
    {
        const arr = asArray( pArr ) || [];

        const idx = asInt( pIdx );

        const dflt = (_ud === typeof pDefault) ? null : pDefault;

        return ((arr?.length || 0) > idx) ? arr[idx] : dflt;
    };

    const mod =
        {
            dependencies,
            asArray,
            unique,
            pruneArray,
            hasElements,
            isEmptyArray,
            isPopulatedArray,
            firstPopulatedArray,
            sortArray,
            copyArray,
            calculateLength,
            arraysEqual,
            arraysIntersect,
            superset,
            union,
            intersection,
            disjunction,
            hasEntry,
            hasElementAt,
            at,
            arrLength,
            arrLenGt,
            arrLenGtEq,
            arrLenLt,
            arrLenLtEq,
            TRANSFORMATIONS: Object.freeze( TRANSFORMATIONS ),
            Predicates: Object.freeze( Predicates ),
            Filters: Object.freeze( Filters ),
            Mappers: Object.freeze( Mappers ),
            Comparators: Object.freeze( Comparators ),
            predicate,
            Transformer,
            TransformerChain,
            FilterChain,
            MapperChain,
            ComparatorChain,
            BoundedQueue,
            chainFilters,
            chainMappers,
            enQueue,
            classes:
                {
                    Transformer,
                    TransformerChain,
                    FilterChain,
                    MapperChain,
                    ComparatorChain,
                    BoundedQueue
                }
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
