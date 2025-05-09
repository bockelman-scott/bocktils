/**
 *
 * This module exposes useful methods for working with objects, collections of objects, and classes.
 * Dependencies: Constants, TypeUtils, StringUtils, ArrayUtils, and GUIDUtils
 */
const core = require( "@toolbocks/core" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, guidUtils, functionUtils } = core;

const jsonUtils = require( "@toolbocks/json" );

const { _ud = "undefined", $scope } = constants;

/**
 * This is the Immediately Invoked Function Expression (IIFE) that builds and returns the module
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__OBJECT_UTILS__";

    // if we've already executed this code, return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can import the leaf module
     * and then use the other utilities as properties of that module
     */
    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            guidUtils,
            jsonUtils,
            functionUtils
        };

    const {
        IterationCap,
        detectCycles,
        bracketsToDots,
        populateOptions,
        functionToString,
        lock,
        deepFreeze,
        ObjectEntry,
        objectEntries,
        localCopy,
        immutableCopy,
        attempt
    } = moduleUtils;

    let
        {
            _str,
            _fun,
            _obj,
            _num,
            _big,
            _bool,
            _symbol,

            _mt_str,
            _dot,
            _spc,
            _comma,
            _semicolon,
            ignore,
            S_ERROR,
            S_WARN,
            no_op,
        } = constants;

    const { ModuleEvent, ToolBocksModule, getProperty, setProperty } = moduleUtils;

    const {
        getFunctionSource,
        extractFunctionData,
        extractFunctionBody,
        extractFunctionParameters,
    } = functionUtils;

    const {
        asJson,
        parseJson,
        tracePathTo,
        findNode,
        cherryPick
    } = jsonUtils;

    const modName = "ObjectUtils";

    let modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    let
        {
            isString,
            isUndefined,
            isDefined,
            isNull,
            isNotNull,
            isNonNullValue,
            isObject,
            isCustomObject,
            isNonNullObject,
            isValidObject,
            isPopulated,
            isFunction,
            isAsyncFunction,
            isNumber,
            isNumeric,
            isZero,
            isNanOrInfinite,
            isNullOrNaN,
            isBoolean,
            isArray,
            isMap,
            isSet,
            isDate,
            isRegExp,
            isClass,
            isUserDefinedClass,
            isListedClass,
            isInstanceOfUserDefinedClass,
            isInstanceOfListedClass,
            isSymbol,
            isType,
            instanceOfAny,
            getClassName,
            getClass,
            isReadOnly,
            JS_TYPES,
            VALID_TYPES,
            VisitedSet,
            defaultFor,
            areSameType,
            firstValidObject,
            firstPopulatedObject,
            toObjectLiteral,
            estimateBytesForType,
            BYTES_PER_TYPE
        } = typeUtils;

    let
        {
            asString,
            isBlank,
            asKey,
            lcase,
            ucase,
            isValidNumber,
            asInt,
            evaluateBoolean,
            toBool,
            toProperCase,
            leftOfLast,
            rightOf,
        } = stringUtils;

    let
        {
            ARRAY_METHODS,
            Filters,
            Mappers,
            asArray,
            pruneArray,
            unique,
            toNonBlankStrings,
            toTrimmedNonBlankStrings,
            toKeys,
            varargs,
            immutableVarArgs,
            flatArgs
        } = arrayUtils;

    const canCompareObject = function( pObject, pStrict, pClass )
    {
        return !isNull( pObject ) && ( !(pStrict && pClass) || pObject instanceof pClass);
    };

    const canCompare = function( pValueA, pValueB, ...pTypes )
    {
        if ( isNonNullValue( pValueA ) && pValueA === pValueB )
        {
            return true;
        }

        const sameType = areSameType( pValueA, pValueB ) || ([_num, _big, _str].includes( typeof pValueA ) && [_num, _big, _str].includes( typeof pValueB ));

        let types = asArray( ...(pTypes || ([typeof pValueA, typeof pValueB].filter( e => VALID_TYPES.includes( e ) || isClass( e ) ))) );

        if ( sameType && types.length )
        {
            types = types.filter( e => (e === typeof pValueA) || ((isClass( e ) && (pValueA instanceof e) && (pValueB instanceof e))) );
            return types.length > 0;
        }

        return types.length <= 0;
    };

    /**
     * Returns true if the objects are actually the exact same object
     *
     * @param pSelf the first object
     * @param pOther the other object
     * @returns {boolean}
     */
    const identical = function( pSelf, pOther )
    {
        return (pOther === pSelf) || ( !isNonNullObject( pSelf ) && !isNonNullObject( pOther ));
    };

    /**
     * Returns true if the 2 arguments represent the same object graph or the same number or other data type.
     *
     * Basically a deep ==, not limited to ===
     * @param {any} pFirst the first object
     * @param {any} pSecond the other object
     * @param pStrict boolean to indicate whether both objects have to have the same type or class, defaults to false
     * @param pClass (optional) the type or class both arguments must be to be considered the same if pStrict is true
     * @param pCaseSensitive (optional) if false, strings encountered are compared without regard to uppercase or lowercase characters
     * @param pStack USED INTERNALLY WHEN CALLING RECURSIVELY -- do not pass a value
     * @returns true if the 2 arguments represent the same object graph or the same number or other data type
     */
    const same = function( pFirst, pSecond, pStrict = false, pClass = null, pCaseSensitive = true, pStack = [] )
    {
        if ( pFirst === pSecond || (isNull( pFirst ) && isNull( pSecond )) )
        {
            return true;
        }

        if ( !canCompare( pFirst, pSecond ) )
        {
            return false;
        }

        const errorSource = modName + "::same";

        if ( isNumeric( pFirst ) )
        {
            if ( isNumeric( pSecond ) )
            {
                try
                {
                    const first = parseFloat( pFirst );

                    const second = parseFloat( pSecond );

                    const diff = Math.abs( first - second );

                    return (first === second) || ( !isNaN( diff ) && diff < 0.000000001);
                }
                catch( ex )
                {
                    modulePrototype.reportError( ex, `comparing objects`, S_WARN, errorSource );
                }

                return false;
            }

            return false;
        }

        if ( isString( pFirst ) && isString( pSecond ) )
        {
            if ( pStrict )
            {
                return pFirst === pSecond || (false === pCaseSensitive && ucase( asString( pFirst ) ) === ucase( asString( pSecond ) ));
            }

            const options = false === pCaseSensitive ? { transformations: [function( s ) { return ucase( s ); }] } : {};

            return asString( pFirst, true, options ) === asString( pSecond, true, options );
        }

        if ( isBoolean( pFirst ) && isBoolean( pSecond ) )
        {
            return pFirst === pSecond;
        }

        if ( isFunction( pFirst ) )
        {
            return (isFunction( pSecond )) && asString( pFirst.toString(), true ) === asString( pSecond.toString(), true );
        }

        const stack = asArray( pStack || [] );

        if ( detectCycles( stack, 5, 5 ) )
        {
            modulePrototype.reportError( new Error( `Entered an infinite loop at ${stack.join( _dot )}` ), `iterating a cyclically-connected graph`, S_ERROR, modName + "::detectCycles", stack );
            return false;
        }

        if ( isNonNullObject( pFirst ) )
        {
            if ( isArray( pFirst ) )
            {
                if ( isNonNullObject( pSecond ) && isArray( pSecond ) )
                {
                    if ( (pFirst?.length || 0) !== (pSecond?.length || 0) )
                    {
                        return false;
                    }

                    const first = [].concat( ...(pFirst || []) ).sort();
                    const second = [].concat( ...(pSecond || []) ).sort();

                    let result = true;

                    for( let i = first.length; i--; )
                    {
                        if ( !same( first[i], second[i], pStrict, null, pCaseSensitive, stack.concat( asString( i ) ) ) )
                        {
                            result = false;
                            break;
                        }
                    }

                    // we only trust a positive result, since we cannot rely on the elements to be properly sortable
                    if ( result )
                    {
                        return true;
                    }
                }
            }

            if ( isNonNullObject( pSecond ) )
            {
                for( let p in pFirst )
                {
                    if ( !same( getProperty( pFirst, p ), getProperty( pSecond, p ), pStrict, null, pCaseSensitive, stack.concat( p ) ) )
                    {
                        return false;
                    }
                }

                for( let p in pSecond )
                {
                    if ( !same( getProperty( pSecond, p ), getProperty( pFirst, p ), pStrict, null, pCaseSensitive, stack.concat( p ) ) )
                    {
                        return false;
                    }
                }

                return !!pStrict || (((pClass) ? (pFirst instanceof pClass && pSecond instanceof pClass) : ((null === pFirst.constructor && null === pSecond.constructor) || (pFirst.constructor === pSecond.constructor))));
            }

            return false;
        }

        const firstID = asString( pFirst?.getUniqueObjectInstanceId() || pFirst?.GUID );
        const secondID = asString( pSecond?.getUniqueObjectInstanceId() || pSecond?.GUID );

        if ( !(isBlank( firstID ) || isBlank( secondID )) && same( firstID, secondID, pStrict, String, true, stack ) )
        {
            return true;
        }

        try
        {
            const jsonFirst = asString( pFirst );
            const jsonSecond = asString( pSecond );

            if ( same( jsonFirst, jsonSecond, pStrict, String, pCaseSensitive, stack ) )
            {
                return true;
            }
        }
        catch( ex )
        {
            modulePrototype.reportError( ex, `comparing 2 objects`, S_WARN, errorSource );
        }

        return false;
    };

    Object.prototype.isIdenticalTo = function( pOther, pStrict, pClass )
    {
        return canCompareObject( pOther, pStrict, pClass ) && (identical( this, pOther ));
    };

    Object.prototype.equals = function( pObject )
    {
        return same( this, pObject, true, getClass( this ) );
    };

    /**
     * Returns the first candidate object that has a method named pFunctionName
     * @param pFunctionName {string|[string]} the name of the method the object must implement to be returned
     * @param pCandidates {...object} one or more objects that might implement the specified method
     * @returns {object} the leftmost object that implements the specified method
     */
    const findImplementor = function( pFunctionName, ...pCandidates )
    {
        let methodNames = asArray( pFunctionName || [] );

        const candidates = asArray( [].concat( varargs( ...pCandidates ) ) ).flat( Infinity );

        let implementor = null;

        for( const methodName of methodNames )
        {
            while ( (null == implementor || !isFunction( implementor[methodName] )) && candidates.length )
            {
                implementor = candidates.shift();

                if ( implementor && isFunction( implementor[methodName] ) )
                {
                    break;
                }
            }

            if ( implementor && isFunction( implementor[methodName] ) )
            {
                return implementor;
            }
        }

        return null;
    };

    /**
     * Returns an array of objects that implement one or more of the method(s) specified
     * @param pMethodNames {string|[string]} an array of strings that are method names (or a string that is a method name)
     * @param pCandidates {...object} one or more objects, the subset of which to return if the object implements one or more of the specified method(s)
     * @returns {*[]}  an array of objects that implement one or more of the method(s) specified
     */
    const collectImplementors = function( pMethodNames, ...pCandidates )
    {
        let methodNames = asArray( pMethodNames || [] );

        const arr = (varargs( ...pCandidates )).filter( Filters.IS_OBJECT );

        const implementors = [];

        for( const methodName of methodNames )
        {
            for( const candidate of arr )
            {
                if ( null == candidate )
                {
                    continue;
                }

                if ( isFunction( candidate[methodName] ) )
                {
                    implementors.push( candidate );
                }
            }
        }

        return implementors;
    };

    function getTypeHint( pTypeHint, pValue )
    {
        let type = lcase( asString( pTypeHint || typeof pValue ) );
        return JS_TYPES.includes( type ) ? type : typeof pValue;
    }

    /**
     * Returns an object whose keys are the values of the specified object's properties
     * and whose values are the keys pointing to those values in the original
     * @param pObject an object from which to build a new object that swaps values and keys for each property
     * @returns {object}
     */
    const invertProperties = function( pObject )
    {
        let obj = {};

        const entries = objectEntries( pObject );

        for( let entry of entries )
        {
            if ( (isNull( entry[1] ) || [_fun, _symbol].includes( typeof entry[1] )) )
            {
                continue;
            }

            let key = asString( entry[1], true );

            if ( isBlank( key ) )
            {
                continue;
            }

            let value = asString( entry[0], true );

            if ( isBlank( value ) )
            {
                continue;
            }

            key = asString( key, true ).replaceAll( /(-|\s)(\w)/g,
                                                    ( match, group1, group2 ) =>
                                                    {
                                                        return group1 + group2.toUpperCase();
                                                    } ).replaceAll( /\s/g, _mt_str ).replaceAll( /[^A-Za-z0-9]/g, _mt_str );

            obj[key] = asString( value ).replaceAll( /\s/g, _mt_str ).replaceAll( /[^A-Za-z0-9]/g, _mt_str );
        }

        return obj;
    };

    /////
    const CLASS_SYMBOL =
        {
            ID: Symbol( "_bock_id" ),
            NAME: Symbol( "_bock_name" ),
            DESCRIPTION: Symbol( "_bock_description" ),
        };

    class Identified
    {
        constructor( pId )
        {
            this[CLASS_SYMBOL.ID] = pId;
        }

        get id()
        {
            return this[CLASS_SYMBOL.ID];
        }
    }

    class Identifiable extends Identified
    {
        constructor( pId )
        {
            super( pId );
        }

        set id( pId )
        {
            this[CLASS_SYMBOL.ID] = pId;
        }
    }

    class Named extends Identified
    {
        constructor( pId, pName )
        {
            super( pId );
            this[CLASS_SYMBOL.NAME] = pName;
        }

        get name()
        {
            return this[CLASS_SYMBOL.NAME];
        }
    }

    class Nameable extends Named
    {
        #identifiable;

        constructor( pId, pName )
        {
            super( pId, pName );
            this.#identifiable = new Identifiable( pId );
        }

        get id()
        {
            return this.#identifiable.id;
        }

        set id( pId )
        {
            this.#identifiable.id = pId;
        }

        set name( pName )
        {
            this[CLASS_SYMBOL.NAME] = pName;
        }
    }

    class Described extends Named
    {
        constructor( pId, pName, pDescription )
        {
            super( pId, pName );

            this[CLASS_SYMBOL.DESCRIPTION] = pDescription;
        }

        get description()
        {
            return this[CLASS_SYMBOL.DESCRIPTION];
        }
    }

    class Describable extends Described
    {
        #identifiable;
        #nameable;

        constructor( pId, pName, pDescription )
        {
            super( pId, pName, pDescription );

            this.#identifiable = new Identifiable( pId );
            this.#nameable = new Nameable( pId, pName );
        }

        set description( pDescription )
        {
            this[CLASS_SYMBOL.DESCRIPTION] = pDescription;
        }

        set name( pName )
        {
            this.#nameable.name = pName;
        }

        get name()
        {
            return this.#nameable.name;
        }

        set id( pId )
        {
            this.#identifiable.id = pId;
        }

        get id()
        {
            return this.#identifiable.id;
        }
    }

    class MergeRule extends Described
    {
        constructor( pId, pName, pDescription )
        {
            super( pId, pName, pDescription );
        }

        resolveTarget( pObject, pKey )
        {
            const obj = isNonNullObject( pObject ) ? pObject || {} : {};
            const key = isString( pKey ) || isNumber( pKey ) || isSymbol( pKey ) ? pKey : String( pKey || _mt_str );
            return { obj, key };
        }

        equals( pOther )
        {
            return isNonNullObject( pOther ) &&
                   this.id === pOther?.id &&
                   this.name === pOther?.name;
        }
    }

    MergeRule.resolveRule = ( pRulesMap, pId, pName ) => (pRulesMap || {})[pId || _mt_str] || (pRulesMap || {})[pName || pId || _mt_str];

    class MergeDirection extends MergeRule
    {
        constructor( pId, pName, pDescription )
        {
            super( pId, pName, pDescription );
        }

        order( ...pObjects )
        {
            const objects = [...(pObjects || [])];
            return (this === MergeDirection.LEFT_TO_RIGHT || "ltr" === this[CLASS_SYMBOL.ID]) ? objects : objects.reverse();
        }

        equals( pOther )
        {
            return (pOther instanceof this.constructor) && super.equals( pOther );
        }
    }

    MergeDirection.LEFT_TO_RIGHT = new MergeDirection( "ltr", "LeftToRight", "Merge the leftmost objects into the rightmost object" );
    MergeDirection.RIGHT_TO_LEFT = new MergeDirection( "rtl", "RightToLeft", "Merge the rightmost objects into the leftmost object" );

    MergeDirection.LTR = MergeDirection.LEFT_TO_RIGHT;
    MergeDirection.RTL = MergeDirection.RIGHT_TO_LEFT;

    MergeDirection.DEFAULT = MergeDirection.LEFT_TO_RIGHT;

    MergeDirection.resolveDirection = ( pDirection ) =>
    {
        if ( pDirection instanceof MergeDirection )
        {
            return pDirection;
        }

        if ( isString( pDirection ) )
        {
            const key = String( pDirection || _mt_str ).trim().toUpperCase();

            if ( ["LTR", "RTL", "LEFT_TO_RIGHT", "RIGHT_TO_LEFT"].includes( key ) )
            {
                return MergeDirection.resolveDirection( MergeDirection[key] );
            }
        }

        return MergeDirection.DEFAULT;
    };

    class MergeStringsRule extends MergeRule
    {
        #separator = (_comma + _spc);
        #replacement = (_semicolon + _spc);

        constructor( pId, pName, pDescription, pSeparator, pReplacement )
        {
            super( pId, pName, pDescription );

            this.#separator = isString( pSeparator ) ? pSeparator || _mt_str : this.#separator;
            this.#replacement = isString( pReplacement ) ? pReplacement || _mt_str : this.#replacement;
        }

        get separator()
        {
            return String( this.#separator );
        }

        set separator( pSeparator )
        {
            this.#separator = isString( pSeparator ) ? pSeparator || _mt_str : this.#separator;
        }

        get replacement()
        {
            return String( this.#replacement );
        }

        set replacement( pReplacement )
        {
            this.#replacement = isString( pReplacement ) ? pReplacement || _mt_str : this.#replacement;
        }

        equals( pOther )
        {
            return (pOther instanceof this.constructor) && super.equals( pOther );
        }

        mergeStrings( ...pStrings )
        {
            const strings = [...(pStrings || [])].filter( isString );

            let value = strings;

            if ( strings.length <= 0 )
            {
                return _mt_str;
            }

            switch ( this[CLASS_SYMBOL.ID] )
            {
                case "concat":
                    value = (strings.map( e => e.includes( this.separator ) ? e.replaceAll( this.separator, this.replacement ) : e ).join( this.separator ));
                    break;

                case "split":
                    value = [...new Set( strings )];
                    break;

                case "onn":
                    value = strings.filter( e => !isNull( e ) && e.trim().length > 0 );
                // do not break;
                // fall through

                case "ow":
                    value = strings[0] || _mt_str;
                    break;
            }

            return value;
        }
    }

    MergeStringsRule.CONCAT = new MergeStringsRule( "concatenate", "concatenate", "Concatenate strings into a single string, separated by a comma" );
    MergeStringsRule.SPLIT = new MergeStringsRule( "split", "split", "Convert strings into an array of strings, storing unique elements from each object" );
    MergeStringsRule.OVERWRITE = new MergeStringsRule( "ow", "overwrite", "Replace the value of the target object with the value of the source object" );
    MergeStringsRule.OVERWRITE_NON_NULL = new MergeStringsRule( "onn", "overwrite_non_null", "Replace the value of the target object with the value of the source object if it is not null or empty" );

    MergeStringsRule.RULES =
        {
            "concatenate": MergeStringsRule.CONCAT,
            "split": MergeStringsRule.SPLIT,
            "ow": MergeStringsRule.OVERWRITE,
            "overwrite": MergeStringsRule.OVERWRITE,

            "onn": MergeStringsRule.OVERWRITE_NON_NULL,
            "overwrite_non_null": MergeStringsRule.OVERWRITE_NON_NULL,

            DEFAULT: MergeStringsRule.OVERWRITE_NON_NULL,
        };

    MergeStringsRule.DEFAULT = MergeStringsRule.RULES.DEFAULT;

    MergeStringsRule.resolveRule = ( pId, pName ) => MergeRule.resolveRule( MergeStringsRule.RULES, pId, pName ) || MergeStringsRule.DEFAULT;

    class MergeNumbersRule extends MergeRule
    {
        #operator = function( pA, pB ) { return pA; };

        constructor( pId, pName, pDescription, pOperator )
        {
            super( pId, pName, pDescription );
            this.#operator = isFunction( pOperator ) && pOperator.length === 2 ? pOperator : this.#operator;
        }

        get operator()
        {
            return isFunction( this.#operator ) ? this.#operator : function( pA, pB ) { return pA; };
        }

        mergeNumbers( ...pNumbers )
        {
            let value = 0;

            const numbers = [...(pNumbers || [])].filter( isNumeric ).map( e => parseFloat( e ) ).filter( e => !isNaN( e ) || !isFinite( e ) );

            while ( numbers.length > 1 )
            {
                value = this.operator.call( this, numbers.shift(), numbers.shift() );
            }

            while ( numbers.length > 0 )
            {
                value = this.operator.call( this, value, numbers.shift() );
            }

            return value;
        }
    }

    MergeNumbersRule.REPLACE = new MergeNumbersRule( "ow", "overwrite", "set the target value to the the source value", function( a, b ) { return a; } );
    MergeNumbersRule.PRESERVE = new MergeNumbersRule( "keep", "preserve", "leave the target value as-is; ignore the source value", function( a, b ) { return b; } );

    MergeNumbersRule.ADD = new MergeNumbersRule( "+", "add", "set the target value to the sum of the source value and the target value", function( a, b ) { return a + b; } );
    MergeNumbersRule.SUBTRACT = new MergeNumbersRule( "-", "subtract", "set the target value to the difference of the source value and the target value", function( a, b ) { return a - b; } );
    MergeNumbersRule.MULTIPLY = new MergeNumbersRule( "*", "multiply", "set the target value to the product of the source value and the target value", function( a, b ) { return a * b; } );
    MergeNumbersRule.DIVIDE = new MergeNumbersRule( "/", "divide", "set the target value to the quotient of the source value and the target value", function( a, b ) { return a / b; } );

    MergeNumbersRule.DEFAULT = MergeNumbersRule.REPLACE;

    class MergeArraysRule extends MergeRule
    {
        constructor( pId, pName, pDescription )
        {
            super( pId, pName, pDescription );
        }

        equals( pOther )
        {
            return (pOther instanceof this.constructor) && super.equals( pOther );
        }

        mergeArrays( ...pArrays )
        {
            let arr = [...(pArrays || [])].map( e => isArray( e ) ? e : isNull( e ) ? [] : [e] );

            switch ( this[CLASS_SYMBOL.ID] )
            {
                case "concat":
                    arr = arr.flat();
                    break;

                case "unique":
                    arr = [...new Set( arr.flat() )];
                    break;

                case "onn":
                    arr = arr.filter( e => !isNull( e ) && e.length > 0 );
                // do not break;
                // fall through

                case "ow":
                    arr = arr[0];
                    break;

                case "elements":
                    break;
            }

            return [...arr];
        }
    }

    MergeArraysRule.CONCAT = new MergeArraysRule( "concat", "concatenate", "Concatenate arrays into a single array" );
    MergeArraysRule.UNIQUE = new MergeArraysRule( "unique", "concat_unique", "Concatenate arrays into a single array, preserving only unique elements" );
    MergeArraysRule.OVERWRITE = new MergeArraysRule( "ow", "overwrite", "Replace the value of the target object with the value of the source object" );
    MergeArraysRule.OVERWRITE_NON_NULL = new MergeArraysRule( "onn", "overwrite_non_null", "Replace the value of the target object with the value of the source object if it is not null or empty" );
    MergeArraysRule.MERGE_ELEMENTS = new MergeArraysRule( "elements", "merge_elements", "Merge the elements of the source arrays into the target array" );

    MergeArraysRule.RULES =
        {
            "concat": MergeArraysRule.CONCAT,
            "concatenate": MergeArraysRule.CONCAT,

            "unique": MergeArraysRule.UNIQUE,
            "concat_unique": MergeArraysRule.UNIQUE,

            "ow": MergeArraysRule.OVERWRITE,
            "overwrite": MergeArraysRule.OVERWRITE,

            "onn": MergeArraysRule.OVERWRITE_NON_NULL,
            "overwrite_non_null": MergeArraysRule.OVERWRITE_NON_NULL,

            "elements": MergeArraysRule.MERGE_ELEMENTS,
            "merge_elements": MergeArraysRule.MERGE_ELEMENTS,

            DEFAULT: MergeArraysRule.OVERWRITE_NON_NULL
        };

    MergeArraysRule.DEFAULT = MergeArraysRule.RULES.DEFAULT;

    MergeArraysRule.resolveRule = ( pId, pName ) => MergeRule.resolveRule( MergeArraysRule.RULES, pId, pName ) || MergeArraysRule.DEFAULT;

    class Recursion extends EventTarget
    {
        #id;
        #stack;
        #visited;
        #depth;

        constructor( pId, pVisited, pStack, pDepth )
        {
            super();

            this.#id = pId || Recursion.nextId();

            this.#stack = pStack || [];
            this.#visited = pVisited || new Set();
            this.#depth = pDepth || 0;
        }

        get id()
        {
            return this.#id;
        }

        get stack()
        {
            return this.#stack || [];
        }

        get visited()
        {
            return this.#visited;
        }

        get depth()
        {
            return this.#depth;
        }

        asObject()
        {
            return {
                id: this.#id,
                stack: this.#stack,
                visited: this.#visited,
                depth: this.#depth,
            };
        }

        isInfiniteLoop( pObject )
        {
            return detectCycles( this.stack ) || this.depth > MAX_STACK_SIZE;
        }

        update( pObject, pKey )
        {
            this.#stack.push( pKey );
            this.#visited.add( pObject );
            this.#depth++;

            return this;
        }

        popKey()
        {
            return this.#stack.pop();
        }

        equals( pOther )
        {
            return (pOther instanceof this.constructor) && pOther?.id === this.id;
        }
    }

    Recursion._ID = 1;
    Recursion.nextId = () =>
    {
        const id = Recursion._ID++;

        if ( id > 999_999_999 )
        {
            Recursion._ID = 1;
        }

        return id;
    };

    Recursion.start = ( pVisited, pStack, pDepth ) => new Recursion( Recursion.nextId(), pVisited, pStack, pDepth );

    class ObjectMerger extends EventTarget
    {
        #options;

        #direction = MergeDirection.LEFT_TO_RIGHT;

        #arrayRule = MergeArraysRule.DEFAULT;
        #stringRule = MergeStringsRule.DEFAULT;
        #numberRule = MergeNumbersRule.DEFAULT;

        #recursions = new Map();

        constructor( pDirection, pArrayRule, pStringRule, pNumberRule, pOptions )
        {
            super();

            this.#options = pOptions || {};

            this.#direction = this.resolveDirection( pDirection );

            this.#arrayRule = this.resolveArrayRule( pArrayRule );
            this.#stringRule = this.resolveStringRule( pStringRule );
            this.#numberRule = this.resolveNumberRule( pNumberRule );
        }

        resolveRule( pRule )
        {
            if ( isNonNullObject( pRule ) )
            {
                if ( pRule instanceof MergeRule )
                {
                    return pRule;
                }
            }
            return null;
        }

        resolveStringRule( pStringRule )
        {
            const rule = this.resolveRule( pStringRule );

            if ( rule instanceof MergeStringsRule )
            {
                return rule;
            }

            if ( isString( pStringRule ) )
            {
                return MergeStringsRule.resolveRule( pStringRule );
            }

            return MergeStringsRule.RULES.DEFAULT;
        }

        resolveArrayRule( pArrayRule )
        {
            const rule = this.resolveRule( pArrayRule );

            if ( rule instanceof MergeArraysRule )
            {
                return rule;
            }

            if ( isString( pArrayRule ) )
            {
                return MergeArraysRule.resolveRule( pArrayRule );
            }

            return MergeArraysRule.RULES.DEFAULT;
        }

        resolveNumberRule( pNumberRule )
        {
            const rule = this.resolveRule( pNumberRule );

            if ( rule instanceof MergeNumbersRule )
            {
                return rule;
            }

            if ( isString( pNumberRule ) )
            {
                switch ( pNumberRule.trim().toLowerCase() )
                {
                    case "+":
                    case "add":
                        return MergeNumbersRule.ADD;

                    case "-":
                    case "subtract":
                        return MergeNumbersRule.SUBTRACT;

                    case "*":
                    case "multiply":
                        return MergeNumbersRule.MULTIPLY;

                    case "/":
                    case "divide":
                        return MergeNumbersRule.DIVIDE;

                    case "ow":
                    case "overwrite":
                        return MergeNumbersRule.REPLACE;

                    case "keep":
                    case "preserve":
                        return MergeNumbersRule.PRESERVE;
                }
            }
            return MergeNumbersRule.DEFAULT;
        }

        resolveDirection( pDirection )
        {
            return MergeDirection.resolveDirection( pDirection ) || MergeDirection.DEFAULT;
        }

        get direction()
        {
            return this.resolveDirection( this.#direction );
        }

        get arrayRule()
        {
            return this.resolveArrayRule( this.#arrayRule );
        }

        get stringRule()
        {
            return this.resolveStringRule( this.#stringRule );
        }

        get numberRule()
        {
            return this.resolveNumberRule( this.#numberRule );
        }

        merge( ...pObjects )
        {
            let obj = null;

            const objects = this.direction.order( ...([...(pObjects || [])]) );

            const numObjects = objects.length;

            const recursion = this.resolveRecursion();
            this.#recursions.set( recursion.id, recursion );

            let key = 0;

            while ( objects.length && !recursion.isInfiniteLoop( obj ) && key < numObjects )
            {
                const left = obj || objects.shift();
                const right = objects.shift() || {};

                obj = this.mergeLtr( left, right, recursion.update( obj, String( key ) ) ) || right;

                key += 1;
            }

            this.#recursions.delete( recursion.id );

            return obj;
        }

        mergeLtr( pObjectA, pObjectB, pRecursion )
        {
            const me = this;

            const left = isNonNullObject( pObjectA ) ? { ...pObjectA } : null;
            const right = isNonNullObject( pObjectB ) ? { ...pObjectB } : null;

            if ( isNonNullObject( right ) && isNonNullObject( left ) )
            {
                const recursion = this.resolveRecursion( pRecursion );

                const entries = objectEntries( left );

                while ( entries.length && !recursion.isInfiniteLoop( left ) )
                {
                    const entry = entries.shift();

                    const key = ObjectEntry.getKey( entry );
                    const value = ObjectEntry.getValue( entry );

                    right[key] = attempt( () => (me || this).mergeValues( value, right[key], recursion.update( left, key ) ) );

                    recursion.popKey();
                }
            }

            return right || left;
        }

        mergeRtl( pObjectA, pObjectB, pRecursion )
        {
            return this.mergeLtr( pObjectB, pObjectA, pRecursion );
        }

        mergeStrings( pObjectA, pObjectB )
        {
            return this.stringRule.mergeStrings( pObjectA, pObjectB );
        }

        mergeNumbers( pObjectA, pObjectB )
        {
            return this.numberRule.mergeNumbers( pObjectA, pObjectB );
        }

        mergeArrays( pObjectA, pObjectB, pRecursion )
        {
            if ( this.arrayRule.equals( MergeArraysRule.MERGE_ELEMENTS ) )
            {

            }

            return this.arrayRule.mergeArrays( pObjectA, pObjectB );
        }

        mergeValues( pValueA, pValueB, pRecursion )
        {
            const me = this;

            const recursion = this.resolveRecursion( pRecursion );

            if ( isNull( pValueB ) )
            {
                return pValueA;
            }

            if ( isNull( pValueA ) )
            {
                return pValueB;
            }

            if ( isArray( pValueA ) || isArray( pValueB ) )
            {
                const valueA = isArray( pValueA ) ? [...pValueA] : [pValueA];
                const valueB = isArray( pValueB ) ? [...pValueB] : [pValueB];

                return attempt( () => me.mergeArrays( valueA, valueB, recursion ) );
            }

            if ( isNonNullObject( pValueA ) || isNonNullObject( pValueB ) )
            {
                return attempt( () => (me || this).mergeLtr( pValueA, pValueB, recursion ) );
            }

            if ( isNumeric( pValueA ) && isNumeric( pValueB ) )
            {
                let value = attempt( () => (me || this).mergeNumbers( pValueA, pValueB ) );

                if ( !isNaN( value ) && isFinite( value ) )
                {
                    return value;
                }
            }

            if ( isString( pValueA ) || isString( pValueB ) )
            {
                return attempt( () => (me || this).mergeStrings( String( pValueA ), String( pValueB ), recursion ) );
            }

            return pValueA;
        }

        resolveRecursion( pRecursion )
        {
            let recur = (pRecursion instanceof Recursion) ? pRecursion : this.#recursions.get( pRecursion );

            if ( recur instanceof Recursion )
            {
                return recur;
            }

            if ( this.#recursions.size )
            {
                const values = [...this.#recursions.values()].sort( ( a, b ) => (a[OBJECT_CREATED] || 0) - (b[OBJECT_CREATED] || 0) );
                recur = values[0];
            }

            recur = (recur instanceof Recursion) ? recur : Recursion.start();

            this.#recursions.set( recur.id, recur );

            return recur;
        }
    }

    /////

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
            classes: { IterationCap, ObjectEntry },
            no_op,
            instanceOfAny,
            isObject,
            isString,
            isNumber,
            isZero,
            isBoolean,
            isNumeric,
            isUndefined,
            isNull,
            isNonNullObject,
            isArray,
            isNullOrNaN,
            isFunction,
            isAsyncFunction,
            isClass,
            isUserDefinedClass,
            isListedClass,
            isInstanceOfUserDefinedClass,
            isInstanceOfListedClass,
            isDate,
            getClass,
            getClassName,
            isValidObject,
            firstValidObject,
            firstPopulatedObject,
            isPopulated,
            isPopulatedObject: isPopulated,
            toObjectLiteral,
            toLiteral: toObjectLiteral,
            IterationCap,
            ObjectEntry,
            identical,
            same,
            findImplementor,
            collectImplementors,
            evaluateBoolean,
            toBool,
            invertProperties,
            findNode,
            tracePathTo,
            lock,
            deepFreeze,
            cherryPick
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
