/**
 * Defines several useful constants and utility functions common to JavaScript applications.
 * Using constants for string literals reduces bugs caused by typos,
 * allows better minification,
 * and _may_ reduce memory consumption in _some_ interpreters
 */

(function exposeModule()
{
    /** This is the typeof a variable that does not exist or has been declared without a default value
     *
     * @type {string}
     */
    const _ud = "undefined";

    /**
     * This function returns the globalThis for the environment in which the code is currently executing
     */
    const $scope = function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    };

    /**
     * This is a (hopefully) unique string we can use to cache this module.
     * @type {string}
     */
    const INTERNAL_NAME = "__BOCK__CONSTANTS__";

    /**
     * We cache the module
     * so we do not need to execute this IIFE every time
     * it is required or imported
     */
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * An alias for the console to reduce lint-ing alerts for any reasonable use of console.log
     * @type {console | Console}
     */
    const konsole = console;

    /**
     * Returns true if this code is being executed by Node.js (or Deno)
     * or technically any environment that defines 'global' and 'process' and does not define 'self' or 'window'
     * @returns {boolean} true if this code is being executed by Node.js (or Deno)
     */
    const isNodeJs = function()
    {
        return (_ud === typeof self) && (_ud === typeof window) && (null != global) && (_ud !== typeof process);
    };

    /**
     * Should return the working directory as returned from the process if running on a server-side platform.
     * Return . for other environments
     * @type {string|string}
     */
    const currentDirectory = (_ud !== typeof process) ? process.cwd() : ((_ud !== typeof __dirname) ? __dirname : ".");

    /**
     * This is the default limit for iterations that should be capped.
     * @see IterationCap
     * @type {number} the default limit for iterations that should be capped
     */
    const DEFAULT_MAX_ITERATIONS = 1_000;

    /**
     * This is the default limit for recursive functions that cannot have a base-case to escape infinite execution
     * @type {number} the default limit for recursive functions that cannot have a base-case
     */
    const DEFAULT_MAX_STACK_DEPTH = 12;

    /**
     * We use a single variable declaration
     * to define the many constants we will export as members of the module object
     */
    let
        {
            _obj = "object",
            _fun = "function",
            _str = "string",
            _num = "number",
            _big = "bigint",
            _bool = "boolean",
            _symbol = "symbol",

            _types = [_ud, _obj, _fun, _str, _bool, _num, _big, _symbol],
            _validTypes = [_obj, _fun, _str, _bool, _num, _big, _symbol],

            _worker = "Worker",
            _browser = "Browser",
            _nodejs = "NodeJs",
            _deno = "Deno",
            _unknown = "Unknown",

            _mt_str = "",
            _mt_chr = "",
            _spc = " ",
            _dot = ".",
            _comma = ",",
            _underscore = "_",
            _hyphen = "-",
            _tilde = "~",
            _ellipsis = "...",
            _crlf = "\r\n",
            _lf = "\n",
            _z = "\u0000",
            _dblqt = "\"",
            _sglqt = "'",
            _apos = "'",
            _aposFancy = String.fromCharCode( 8217 ),
            _dblqtLeftFancy = String.fromCharCode( 8220 ),
            _dblqtRightFancy = String.fromCharCode( 8221 ),
            _sglqtLeftFancy = String.fromCharCode( 8216 ),
            _sglqtRightFancy = String.fromCharCode( 8217 ),
            _semicolon = ";",
            _colon = ":",

            _ALPHABET_ENGLISH_UCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            _ALPHABET_ENGLISH_LCASE = _ALPHABET_ENGLISH_UCASE.toLowerCase(),
            _LETTERS_ENGLISH_UCASE = _ALPHABET_ENGLISH_UCASE.split( _mt_chr ),
            _LETTERS_ENGLISH_LCASE = _ALPHABET_ENGLISH_LCASE.split( _mt_chr ),

            _rxLiteral = "/",
            _solidus = "/",
            _slash = "/",
            _reverse_solidus = "\\",
            _backslash = "\\",

            _pathSep = ((_ud === typeof process) ? _backslash : _slash),
            _prevDir = (_dot + _dot + _pathSep),
            _thisDir = (_dot + _pathSep),

            _unixPathSep = _slash,
            _unixPrevDir = (_dot + _dot + _unixPathSep),
            _unixThisDir = (_dot + _unixPathSep),

            _blockCommentStart = "/*",
            _blockCommentEnd = "*/",
            _inlineCommentStart = "//",

            _rxHeaderComment = /^\/\*.*?\*\//s,
            _rxValidJson = /^((([{\[])(.*)*([}\]]))|(\d+)|((\d*,?\d+)*\.?\d+)|("[^"]+")|('[^']+')|(true|false))$/s,

            _xZ = /\u0000/,

            _rxTerminalSemicolon = /;+$/,
            _rxTrailingNewline = /\n+$/,
            _rxLeadingNewline = /^\n+/,
            _rxLeadingWhitespace = /^\s+/,
            _rxTrailingWhitespace = /\s+$/,

            _rxVariableToken = /\$\{\s*(\w+)\s*}/,

            _defaultLocaleString = "en-US",
            _defaultLocale = new Intl.Locale( _defaultLocaleString ),
            _defaultCurrency = "USD",

            S_FALSE = "false",
            S_TRUE = "true",

            S_NO = "no",
            S_YES = "yes",

            S_DISABLED = "disabled",
            S_ENABLED = "enabled",

            S_UNDEFINED = _ud,
            S_NULL = "null",
            S_VOID = "void",
            S_OBJECT = _obj,
            S_FUNCTION = _fun,
            S_STRING = _str,
            S_BOOLEAN = _bool,
            S_NUMBER = _num,
            S_BIGINT = _big,
            S_SYMBOL = _symbol,
            S_Z = _z,

            S_TYPES = _types,
            S_VALID_TYPES = _validTypes,

            S_ERR_PREFIX = "An error occurred while",
            S_DEFAULT_OPERATION = "executing script",

            S_CUSTOM_EVENT = "CustomEvent",

            EMPTY_ARRAY = Object.freeze( [] ),
            EMPTY_OBJECT = Object.freeze( {} ),

            TYPED_ARRAYS = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array],

            ERROR_TYPES = [Error, AggregateError, RangeError, ReferenceError, SyntaxError, URIError],

            GLOBAL_TYPES = [Object, Function, String, Number, Boolean, Array, BigInt, Date, RegExp, Symbol, Math, JSON, Map, Set, Promise, ArrayBuffer, SharedArrayBuffer, DataView, WeakMap, WeakRef, WeakSet],

            BUILTIN_TYPES = [].concat( ...TYPED_ARRAYS ).concat( ...ERROR_TYPES ).concat( ...GLOBAL_TYPES ),

            TYPED_ARRAY_NAMES = ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float16Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"],

            ERROR_TYPE_NAMES = ["Error", "AggregateError", "RangeError", "ReferenceError", "SyntaxError", "URIError"],

            GLOBAL_TYPE_NAMES = ["Object", "Function", "String", "Number", "Boolean", "Array", "BigInt", "Date", "RegExp", "Symbol", "Math", "JSON", "Map", "Set", "Promise", "ArrayBuffer", "SharedArrayBuffer", "DataView", "WeakMap", "WeakRef", "WeakSet"],

            BUILTIN_TYPE_NAMES = [].concat( ...TYPED_ARRAY_NAMES ).concat( ...ERROR_TYPE_NAMES ).concat( ...GLOBAL_TYPE_NAMES ),

            SERIALIZABLE_TYPES = [Object, String, Number, Boolean, Array, Date, RegExp, Error],

            /**
             * Strings that are interpreted as 'true' when encountered in JSON or other configuration contexts
             */
            _affirmatives = [].concat( ...([S_TRUE, "1", "on", S_ENABLED, "t", S_YES]) ),

            ignore = function() { },

            RESERVED_WORDS = Object.freeze(
                ["break",
                 "case",
                 "catch",
                 "class",
                 "const",
                 "continue",
                 "debugger",
                 "default",
                 "delete",
                 "do",
                 "else",
                 "export",
                 "extends",
                 "false",
                 "finally",
                 "for",
                 "function",
                 "if",
                 "import",
                 "in",
                 "instanceof",
                 "new",
                 "null",
                 "return",
                 "super",
                 "switch",
                 "this",
                 "throw",
                 "true",
                 "try",
                 "typeof",
                 "var",
                 "void",
                 "while",
                 "with"] )
        } = ($scope() || {});

    function isArray( pObject )
    {
        return (_fun === typeof Array.isArray && Array.isArray( pObject )) || {}.toString.call( pObject ) === "[object Array]";
    }

    /**
     * These are the default options used with the immutableCopy function.
     *
     * nullToEmptyObject {boolean} pass true for this property if you want null values to be returned as EMPTY_OBJECT
     * nullToEmptyArray {boolean}  pass true for this property if you want null values to be returned as EMPTY_ARRAY
     *
     * undefinedToNull {boolean} pass true for this property if you want undefined values to be returned as null
     * undefinedToEmptyObject {boolean} pass true for this property if you want undefined values to be returned as EMPTY_OBJECT
     *
     * depth {number} pass a number greater than zero to make immutable copies
     * of an object's entries (or an array's elements) to the depth desired
     *
     * @type {{nullToEmptyObject: boolean, undefinedToEmptyObject: boolean, depth: number, nullToEmptyArray: boolean, undefinedToNull: boolean}}
     */
    const DEFAULT_COPY_OPTIONS =
        {
            nullToEmptyObject: false,
            nullToEmptyArray: false,
            undefinedToNull: false,
            undefinedToEmptyObject: false,
            undefinedToEmptyArray: false,
            depth: 0,
        };

    const MAX_STACK_SIZE = 32;

    function populateOptions( pOptions, pDefaults )
    {
        return Object.assign( Object.assign( {}, pDefaults || {} ), (pOptions || pDefaults || {}) );
    }

    function _localCopyOptions( pOptions )
    {
        return populateOptions( pOptions, DEFAULT_COPY_OPTIONS );
    }

    function _getDepth( pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_COPY_OPTIONS );
        return Math.max( 0, _num === typeof options.depth ? options.depth : 0 );
    }

    /**
     * Returns a local (mutable) copy of the value specified.
     *
     * @param pObject {any} the value to copy
     *
     * @param pOptions {object} an object specifying how to handle undefined and null values
     * as well as whether and how deep to copy an object or array value
     *
     * @param pStack {[any]} USED INTERNALLY TO PREVENT INFINITE RECURSION, DO NOT SPECIFY A VALUE FROM CLIENT CODE
     *
     * @returns {bigint|number|string|null|{}|undefined|{}|*[]|Readonly<{}>|*|Function|boolean} an immutable copy of the value specified
     */
    const localCopy = function( pObject, pOptions, pStack = [] )
    {
        const options = _localCopyOptions( pOptions );

        const depth = _getDepth( options );

        options.depth = depth;

        let clone = pObject;

        const stack = [].concat( pStack || [] );

        if ( stack.length > MAX_STACK_SIZE )
        {
            return clone;
        }

        if ( null == pObject || _ud === typeof pObject )
        {
            return options?.nullToEmptyObject || options?.undefinedToEmptyObject ? {} : options?.nullToEmptyArray || options?.undefinedToEmptyArray ? [] : null;
        }

        if ( _obj === typeof pObject )
        {
            if ( isArray( pObject ) )
            {
                clone = [].concat( pObject );

                if ( depth > 0 )
                {
                    options.depth = depth - 1;

                    stack.push( clone );

                    clone = clone.map( e => localCopy( e, options, stack ) );
                }
            }
            else
            {
                clone = Object.assign( {}, pObject || {} );

                if ( depth > 0 )
                {
                    options.depth = depth - 1;

                    stack.push( clone );

                    const entries = Object.entries( pObject );

                    for( let entry of entries )
                    {
                        const key = entry[0];
                        const value = entry[1];

                        clone[key] = localCopy( value, options, stack );
                    }
                }
            }
        }

        return clone;
    };

    /**
     * Returns an immutable copy of the value specified.
     *
     * @param pObject {any} the value to copy
     * @param pOptions {object} an object specifying how to handle undefined and null values
     * as well as whether and how deep to copy an object or array value
     * @param pStack {[any]} USED INTERNALLY TO PREVENT INFINITE RECURSION, DO NOT SPECIFY A VALUE FROM CLIENT CODE
     * @returns {bigint|number|string|null|{}|undefined|{}|*[]|Readonly<{}>|*|Function|boolean} an immutable copy of the value specified
     */
    const immutableCopy = function( pObject, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        const options = populateOptions( pOptions, DEFAULT_COPY_OPTIONS );

        const depth = _getDepth( options );

        options.depth = depth;

        let clone = pObject;

        const stack = [].concat( pStack || [] );

        if ( stack.length > MAX_STACK_SIZE )
        {
            return clone;
        }

        switch ( typeof pObject )
        {
            case _ud:
                return options?.undefinedToNull ? null : options?.undefinedToEmptyObject ? EMPTY_OBJECT : options?.undefinedToEmptyArray ? EMPTY_ARRAY : undefined;

            case _str:
                return (_mt_str + pObject);

            case _num:
                return parseFloat( pObject );

            case _big:
                return BigInt( pObject );

            case _bool:
                return Boolean( pObject );

            case _fun:
                return Object.freeze( pObject );

            case _symbol:
                return pObject;

            case _obj:
                if ( null == pObject )
                {
                    return options?.nullToEmptyObject ? {} : options?.nullToEmptyArray ? [] : null;
                }

                if ( isArray( pObject ) )
                {
                    clone = [].concat( pObject );

                    if ( depth > 0 )
                    {
                        options.depth = depth - 1;

                        stack.push( clone );

                        clone = clone.map( e => immutableCopy( e, options, stack ) );
                    }
                }
                else
                {
                    clone = Object.assign( {}, pObject || {} );

                    if ( depth > 0 )
                    {
                        options.depth = depth - 1;

                        stack.push( clone );

                        const entries = Object.entries( pObject );

                        for( let entry of entries )
                        {
                            const key = entry[0];
                            const value = entry[1];

                            clone[key] = immutableCopy( value, options, stack );
                        }
                    }
                }
        }

        return Object.freeze( clone );
    };

    /**
     * This is a regular expression that matches a single dot character anywhere in a string
     * @type {RegExp}  a regular expression that matches a single dot character anywhere in a string
     */
    const REG_EXP_DOT = /\./;

    /**
     * This is a regular expression that matches a single dot character at the start of a string
     * @type {RegExp}  a regular expression that matches a single dot character at the beginning of a string
     */
    const REG_EXP_LEADING_DOT = /^\./;

    /**
     * This is a regular expression that matches a single dot character at the end of a string
     * @type {RegExp}  a regular expression that matches a single dot character at the end of a string
     */
    const REG_EXP_TRAILING_DOT = /\.$/;

    /**
     * This is an object that encapsulates useful regular expressions defined above
     */
    const REG_EXP =
        {
            DOT: REG_EXP_DOT,
            LEADING_DOT: REG_EXP_LEADING_DOT,
            TRAILING_DOT: REG_EXP_TRAILING_DOT,
            BLOCK_COMMENT: _rxHeaderComment,
            VALID_JSON: _rxValidJson,
            NULL_TERMINATOR: _xZ,
            TERMINAL_SEMICOLON: _rxTerminalSemicolon,
            TRAILING_NEWLINE: _rxTrailingNewline,
            LEADING_NEWLINE: _rxLeadingNewline,
            LEADING_WHITESPACE: _rxLeadingWhitespace,
            TRAILING_WHITESPACE: _rxTrailingWhitespace,
            VARIABLE_TOKEN: _rxVariableToken
        };

    /**
     * These are the default values assumed for number formatting
     * @type {Readonly<{decimal_point: string, currency_symbol: RegExp, grouping_separator: string}>}
     */
    const DEFAULT_NUMBER_FORMATTING_SYMBOLS = Object.freeze(
        {
            decimal_point: ".",
            grouping_separator: ",",
            currency_symbol: /\$|USD/
        } );

    /**
     * Returns an object with the following properties,
     * describing what symbols are used to format numbers for the specified Locale:
     *
     * {
     decimal_point: <the character(s) that separate the whole number part from the fractional part of a floating point value>,
     grouping_separator: <the character(s) that separate whole number digits for human-readability>,
     currency_symbol: <the symbol or 3-letter code used for the specified currency in the specified Locale>
     * }
     *
     * @param pLocale {string|Intl.Locale} the Locale for which to calculate the symbols
     * @param pCurrency {string} the currency for which to calculate the symbol used when formatting numbers as currency
     * @returns {Readonly<{readonly decimal_point: string, readonly currency_symbol: RegExp, readonly grouping_separator: string}>|Readonly<{decimal_point: string, currency_symbol: RegExp, grouping_separator: string}>}
     */
    const calculateNumberFormattingSymbols = function( pLocale, pCurrency )
    {
        let localeString = (pLocale instanceof Intl.Locale) ? (pLocale?.baseName || _defaultLocaleString) : (null == pLocale) || (_mt_str === pLocale) ? (_mt_str + ((((new Intl.NumberFormat()).resolvedOptions())?.locale)?.baseName) || _defaultLocaleString) : (_mt_str + pLocale);

        let currency = (null == pCurrency) || (_mt_str === pCurrency) ? _defaultCurrency : (_mt_str + (pCurrency || _defaultCurrency));

        let sCurrency = "currency";

        const numberFormatter = new Intl.NumberFormat( ((_mt_str + (localeString)) || _defaultLocaleString),
                                                       {
                                                           style: sCurrency,
                                                           currency: currency
                                                       } );

        const parts = numberFormatter.formatToParts( 123_456.789 );

        const symbols = { ...DEFAULT_NUMBER_FORMATTING_SYMBOLS };

        parts.forEach( part =>
                       {
                           const type = (_mt_str + part?.type).trim().toLowerCase();
                           const val = (_mt_str + part?.value);

                           switch ( type )
                           {
                               case sCurrency:
                                   symbols.currency_symbol = val || DEFAULT_NUMBER_FORMATTING_SYMBOLS.currency_symbol;
                                   break;

                               case "decimal":
                                   symbols.decimal_point = val || DEFAULT_NUMBER_FORMATTING_SYMBOLS.decimal_point;
                                   break;

                               case "group":
                                   symbols.grouping_separator = val || DEFAULT_NUMBER_FORMATTING_SYMBOLS.grouping_separator;
                                   break;

                               default:
                                   break;
                           }
                       } );

        return Object.freeze( symbols ) || DEFAULT_NUMBER_FORMATTING_SYMBOLS;
    };

    /**
     * This subclass of Error is useful when validating function arguments.
     * The message property is overwritten to include the prefix 'IllegalArgumentException: ',
     * so that if only the message is logged, the type of error is not obscured
     */
    class IllegalArgumentError extends Error
    {
        #options;

        constructor( pMessage, pOptions )
        {
            super( pMessage );

            this.#options = Object.freeze( immutableCopy( pOptions || {} ) );
        }

        get options()
        {
            return immutableCopy( this.#options || {} );
        }

        get type()
        {
            return "IllegalArgumentException";
        }

        get prefix()
        {
            return this.type + ": ";
        }

        get message()
        {
            return this.prefix + (super.message.replace( this.prefix, _mt_str ));
        }

        logTo( pLogger, pLevel )
        {
            const logger = pLogger || konsole;

            const level = _str === typeof pLevel ? pLevel.toLowerCase() : _num === typeof pLevel && pLevel >= 0 && pLevel <= 6 ? ["none", "info", "warn", "error", "debug", "trace", "log"][pLevel] : "error";

            if ( _fun === typeof logger[level] )
            {
                logger[level]( this.message, this.options );
            }
        }

        static from( pError )
        {
            return new IllegalArgumentError( pError.message, { cause: pError } );
        }
    }

    /**
     * Returns a new Object whose properties and functions match those of the Object specified.
     * Use this to create a copy of some scope, such as global, self, or the current closure.
     * THIS FUNCTION WILL BIND FUNCTIONS TO THE NEW OBJECT
     * IF YOU WANT TO COPY THE FUNCTIONS INSTEAD. USE FunctionUtils.cjs copyScope INSTEAD
     *
     * @param pScope the object (or scope) whose properties and functions should be copied to the new object to be returned.
     *
     * @returns {Readonly<{}>} a new object with the same properties and functions defined in the specified scope
     */
    const copyScope = function( pScope )
    {
        let scope = pScope || $scope();

        let obj = Object.assign( { ...scope }, scope );

        const entries = Object.entries( obj );

        let variables = {};

        const keysToExclude = ["global", "self", "window", "this", "me"];

        entries.forEach( entry =>
                         {
                             let key = (entry?.length || 0) > 0 ? entry[0] : _mt_str;

                             let value = (entry?.length || 0) > 1 ? entry[1] : key;

                             if ( !(_ud === typeof value || null === value || _symbol === typeof value) )
                             {
                                 if ( _str === typeof key && !(keysToExclude.includes( key )) )
                                 {
                                     variables[key] = value;

                                     if ( _fun === typeof value )
                                     {
                                         value.bind( variables );
                                     }
                                 }
                             }
                         } );

        return Object.freeze( variables );
    };

    const importUtilities = function( pScope, ...pUtils )
    {
        const scope = pScope || $scope();

        const utils = immutableCopy( pUtils || [], { nullToEmptyArray: true, undefinedToEmptyArray: true, depth: 2 } );

        let obj = {};

        for( let util of utils )
        {
            try
            {
                obj = Object.assign( scope, (util || {}) );
            }
            catch( ex )
            {
                console.error( "Could not import " + util?.name + " into scope", scope, ex.message );
            }
        }

        return scope;
    };

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module
     */
    const dependencies =
        {
            // this module has no dependencies
        };

    /**
     * These are default options for the ComparatorFactory class.
     *
     * @type {{caseSensitive: boolean, trimStrings: boolean, nullsFirst: boolean, strict: boolean, reverse: boolean}}
     */
    const DEFAULT_COMPARATOR_OPTIONS =
        {
            strict: true,
            nullsFirst: true,
            caseSensitive: true,
            trimStrings: false,
            reverse: false
        };

    /* abstract*/
    /**
     * This class can be used to create generic comparators.
     * The options (and their corresponding properties) can be used to control the following rules for the comparisons:
     * strict {boolean} if true, values compared must be of the same type and no type coercion will be used
     * nullsFirst {boolean} pass true if null values should be considered less than other values, false if they should be considered greater than other values
     * reverse {boolean} pass true to order values in reverse order (i.e., descending versus ascending)
     * caseSensitive {boolean} [DEFAULTS TO TRUE] pass false if you want string comparisons to ignore case
     * trimStrings {boolean} pass true if strings should be trimmed before comparison
     */
    class ComparatorFactory
    {
        #type;
        #strict = true;
        #nullsFirst = true;
        #reverse = false;
        #caseSensitive = true;
        #trimStrings = false;

        #options = DEFAULT_COMPARATOR_OPTIONS;

        constructor( pType, pOptions = DEFAULT_COMPARATOR_OPTIONS )
        {
            this.#type = pType || _obj;

            this.#options = populateOptions( pOptions, DEFAULT_COMPARATOR_OPTIONS );

            const options = this.#options;

            this.#strict = false !== options?.strict;
            this.#nullsFirst = false !== options?.nullsFirst;
            this.#caseSensitive = false !== options?.caseSensitive;
            this.#trimStrings = false !== options?.trimStrings;
            this.#reverse = true === options?.reverse;
        }

        get type()
        {
            return this.#type;
        }

        set type( value )
        {
            this.#type = !!value;
        }

        get options()
        {
            return populateOptions( {}, this.#options || DEFAULT_COPY_OPTIONS );
        }

        get strict()
        {
            return true === this.#strict;
        }

        set strict( value )
        {
            this.#strict = !!value;
        }

        get nullsFirst()
        {
            return this.#nullsFirst;
        }

        set nullsFirst( value )
        {
            this.#nullsFirst = !!value;
        }

        get caseSensitive()
        {
            return this.#caseSensitive;
        }

        set caseSensitive( value )
        {
            this.#caseSensitive = !!value;
        }

        get trimStrings()
        {
            return this.#trimStrings;
        }

        set trimStrings( value )
        {
            this.#trimStrings = !!value;
        }

        get reverse()
        {
            return this.#reverse;
        }

        set reverse( value )
        {
            this.#reverse = !!value;
        }

        _compare( pA, pB, pOptions )
        {
            const options = populateOptions( pOptions, this.options || DEFAULT_COMPARATOR_OPTIONS );

            let strict = (true === options?.strict) || this.strict;

            let isExpectedType = this.matchesType( pA, pB );

            if ( strict && !isExpectedType )
            {
                return 0;
            }

            let a = pA;
            let b = pB;

            let comp = 0;

            if ( isExpectedType )
            {
                switch ( this.type )
                {
                    case _ud:
                        return 0;

                    case _str:

                        a = this.trimStrings ? (_mt_str + pA).trim() : pA;
                        b = this.trimStrings ? (_mt_str + pB).trim() : pB;

                        if ( !this.caseSensitive )
                        {
                            a = (_mt_str + a).toUpperCase();
                            b = (_mt_str + b).toUpperCase();
                        }

                        comp = a > b ? 1 : a < b ? -1 : 0;

                        break;

                    case _num:
                    case _big:

                        if ( isNaN( pA ) )
                        {
                            if ( isNaN( pB ) )
                            {
                                return 0;
                            }
                            return (this.nullsFirst ? -1 : 1);
                        }
                        else if ( isNaN( pB ) )
                        {
                            return (this.nullsFirst ? 1 : -1);
                        }

                        comp = pA > pB ? 1 : pA < pB ? -1 : 0;

                        break;

                    case _bool:
                        a = (pA ? 1 : -1);
                        b = (pB ? 1 : -1);

                        comp = a > b ? 1 : a < b ? -1 : 0;

                        break;

                    case _fun:
                        return 0;

                    case _symbol:
                        return 0;

                    case _obj:

                        if ( null === pA )
                        {
                            if ( null === pB )
                            {
                                return 0;
                            }
                            return (this.nullsFirst ? -1 : 1);
                        }
                        else if ( null === pB )
                        {
                            return (this.nullsFirst ? 1 : -1);
                        }

                        if ( _fun === typeof pA?.compareTo )
                        {
                            comp = pA.compareTo( pB ) || 0;
                            break;
                        }

                        if ( Array.isArray( pA ) && Array.isArray( pB ) )
                        {
                            let comp = pA.length > pB.length ? -1 : pA.length < pB.length ? 1 : 0;

                            if ( 0 === comp )
                            {
                                for( let i = 0, n = pA.length; i < n && 0 === comp; i++ )
                                {
                                    comp = this._compare( pA[i], pB[i] );
                                }
                            }
                            break;
                        }

                        if ( pA instanceof Date && pB instanceof Date )
                        {
                            comp = pA > pB ? 1 : pA < pB ? -1 : 0;
                            break;
                        }

                        for( let prop in pA )
                        {
                            let propValue = pA[prop];
                            let otherValue = pB[prop];

                            comp = this._compare( propValue, otherValue, options );

                            if ( 0 !== comp )
                            {
                                break;
                            }
                        }

                        break;

                    default:
                        comp = 0;
                }

                return this.reverse ? -comp : comp;
            }

            return 0;
        }

        comparator()
        {
            const me = this;

            return function( pA, pB )
            {
                return me._compare( pA, pB, me.options );
            };
        }

        matchesType( pA, pB )
        {
            let typeofA = typeof pA;
            let typeofB = typeof pB;

            return (typeofA === typeofB) && (typeofA === this.type || pA instanceof this.type) && (typeofB === this.type || pB instanceof this.type);
        }

        nullsFirstComparator()
        {
            const options =
                {
                    type: this.type,
                    strict: this.strict,
                    nullsFirst: true,
                    caseSensitive: this.caseSensitive,
                    trimStrings: this.trimStrings,
                    reverse: this.reverse
                };
            return new ComparatorFactory( this.type, options );
        }

        nullsLastComparator()
        {
            const options =
                {
                    type: this.type,
                    strict: this.strict,
                    nullsFirst: false,
                    caseSensitive: this.caseSensitive,
                    trimStrings: this.trimStrings,
                    reverse: this.reverse
                };
            return new ComparatorFactory( this.type, options ).comparator();
        }

        caseInsensitiveComparator()
        {
            const options =
                {
                    type: this.type,
                    strict: this.strict,
                    nullsFirst: this.nullsFirst,
                    caseSensitive: false,
                    trimStrings: this.trimStrings,
                    reverse: this.reverse
                };
            return new ComparatorFactory( this.type, options ).comparator();
        }

        reverseComparator()
        {
            const options =
                {
                    type: this.type,
                    strict: this.strict,
                    nullsFirst: this.nullsFirst,
                    caseSensitive: this.caseSensitive,
                    trimStrings: this.trimStrings,
                    reverse: true
                };
            return new ComparatorFactory( this.type, options ).comparator();
        }
    }

    /**
     * This is the maximum allowed value for instances of the IterationCap class
     * @type {number} the maximum allowed value for instances of the IterationCap class
     */
    const MAX_ITERATIONS = 10_000;

    /**
     * This class allows us to easily cap an iteration, such as a 'for' loop or a 'while' loop.
     * If there is any chance that an iteration might never complete,
     * use an instance of IterationCap to limit the iteration to a finite number of executions
     *
     * Example:
     *
     const iterationCap = new IterationCap( 10 );

     while ( someConditionIsTrue() && !iterationCap.reached )
     {
     possiblyChangeCondition();
     }

     In this example, the condition _might_ never become false, however...
     The loop will exit after 10 attempts to change the condition
     */
    class IterationCap
    {
        #maxIterations = MAX_ITERATIONS;
        #iterations = 0;

        constructor( pMaxIterations )
        {
            this.#maxIterations = Math.min( Math.max( 1, parseInt( pMaxIterations ) ), MAX_ITERATIONS );

            this.#iterations = 0;
        }

        get iterations()
        {
            return this.#iterations;
        }

        get reached()
        {
            return (this.#iterations++ >= this.#maxIterations);
        }

        canContinue()
        {
            return !this.reached;
        }
    }

    IterationCap.MAX_CAP = MAX_ITERATIONS;

    /**
     * Returns true if the specified value is immutable.
     *
     * Examples of immutable values include:
     * - Objects that are frozen or sealed
     * - Properties of Objects that are defined as writable:false
     * - Strings, Numbers, Booleans, and Symbols
     * - null values, undefined values
     *
     * @param pObject
     * @returns {boolean|boolean}
     */
    const isReadOnly = function( pObject )
    {
        if ( _obj === typeof pObject )
        {
            return (null === pObject) || Object.isFrozen( pObject ) || Object.isSealed( pObject );
        }

        if ( [_num, _big].includes( typeof pObject ) )
        {
            const value = (0 + pObject);

            try
            {
                let n = ++pObject;
                n = --pObject;

                return n !== value;
            }
            catch( ex )
            {
                return true;
            }
        }

        return true;
    };

    /**
     * Returns a read-only copy of an object,
     * whose properties are also read-only copies of properties of the specified object
     * @param pObject {object} the object to freeze
     * @param pStack {[any]} USED INTERNALLY TO PREVENT INFINITE RECURSION, DO NOT SPECIFY A VALUE FROM CLIENT CODE
     *
     * @returns {object} a new object that is a frozen copy of the specified object
     * whose properties are also frozen copies of the specified object's properties
     */
    const deepFreeze = function( pObject, pStack = [] )
    {
        // this an array that holds the keys traversed by any recursive calls to this function
        const stack = localCopy( pStack || [], { undefinedToEmptyArray: true, nullToEmptyArray: true } );

        if ( stack.length >= MAX_STACK_SIZE )
        {
            return (null == pObject || _ud === typeof pObject) ? null : Object.freeze( pObject );
        }

        if ( null == pObject || _ud === typeof pObject )
        {
            return null;
        }

        let obj = pObject;

        if ( _obj === typeof pObject )
        {
            const isArr = isArray( pObject );

            obj = (isArr ? [...pObject] : Object.assign( {}, pObject ));

            const entries = Object.entries( obj );

            for( let entry of entries )
            {
                const key = isArr ? parseInt( entry[0] ) : String( entry[0] );
                const value = entry[1];

                stack.push( key );

                try
                {
                    obj[key] = deepFreeze( value );

                    if ( _fun === typeof value )
                    {
                        value.bind( obj );
                    }
                }
                catch( ex )
                {
                    // occurs when properties are read-only
                    try
                    {
                        obj[key] = obj[key] || value;

                        if ( _fun === typeof value )
                        {
                            value.bind( obj );
                        }
                    }
                    catch( ex2 )
                    {
                        // ignore it
                    }
                }
                finally
                {
                    stack.pop();
                }
            }
        }

        return Object.freeze( obj );
    };

    const mod =
        {
            _ud,
            _obj,
            _fun,
            _str,
            _num,
            _big,
            _bool,
            _symbol,
            _types,
            _validTypes,
            _z,
            _mt_str,
            _mt_chr,
            _dblqt,
            _sglqt,
            _apos,
            _aposFancy,
            _dblqtLeftFancy,
            _dblqtRightFancy,
            _sglqtLeftFancy,
            _sglqtRightFancy,
            _rxLiteral,
            _solidus,
            _slash,
            _reverse_solidus,
            _backslash,
            _semicolon,
            _colon,
            _comma,
            _underscore,
            _hyphen,
            _tilde,
            _spc,
            _dot,
            _ellipsis,
            _lf,
            _crlf,
            _nbsp: " ",
            _ALPHABET_ENGLISH_UCASE,
            _ALPHABET_ENGLISH_LCASE,
            _LETTERS_ENGLISH_UCASE,
            _LETTERS_ENGLISH_LCASE,
            _browser,
            _worker,
            _nodejs,
            _deno,
            _unknown,
            _pathSep,
            _thisDir,
            _prevDir,
            _unixPathSep,
            _unixThisDir,
            _unixPrevDir,
            _defaultLocaleString,
            _defaultLocale,
            _defaultCurrency,
            S_FALSE,
            S_TRUE,
            S_NO,
            S_YES,
            S_DISABLED,
            S_ENABLED,
            S_UNDEFINED,
            S_NULL,
            S_VOID,
            S_OBJECT,
            S_FUNCTION,
            S_STRING,
            S_BOOLEAN,
            S_NUMBER,
            S_BIGINT,
            S_SYMBOL,
            S_Z,
            S_TYPES,
            S_VALID_TYPES,
            S_ERR_PREFIX,
            S_CUSTOM_EVENT,
            S_DEFAULT_OPERATION,
            S_COMMA: _comma,
            S_TILDE: _tilde,
            S_SPACE: _spc,
            S_DOT: _dot,
            _affirmatives,
            _blockCommentStart,
            _blockCommentEnd,
            _inlineCommentStart,
            $scope,
            EMPTY_ARRAY,
            EMPTY_OBJECT,
            RESERVED_WORDS,
            AsyncFunction: (async function() {}).constructor,
            TYPED_ARRAYS,
            TYPED_ARRAY_NAMES,
            ERROR_TYPES,
            ERROR_TYPE_NAMES,
            GLOBAL_TYPES,
            SERIALIZABLE_TYPES,
            GLOBAL_TYPE_NAMES,
            BUILTIN_TYPES,
            BUILTIN_TYPE_NAMES,
            IllegalArgumentError,
            populateOptions,
            copyScope,
            deepFreeze,
            isReadOnly,
            localCopy,
            immutableCopy,
            _fileOptions: { encoding: "utf-8" },
            ignore,
            _rxHeaderComment,
            _rxValidJson,
            _xZ,
            _rxTerminalSemicolon,
            _rxTrailingNewline,
            _rxLeadingNewline,
            _rxLeadingWhitespace,
            _rxTrailingWhitespace,
            _rxVariableToken,
            _currentDirectory: currentDirectory,
            _cwd: currentDirectory,
            DEFAULT_MAX_ITERATIONS: MAX_ITERATIONS,
            DEFAULT_MAX_STACK_DEPTH,
            catchHandler: function( pErr )
            {
                return true;
            },
            dependencies,
            importUtilities,
            classes: { IterationCap, ComparatorFactory, IllegalArgumentError },
            ComparatorFactory,
            IterationCap,
            REG_EXP,
            REG_EXP_DOT,
            REG_EXP_LEADING_DOT,
            REG_EXP_TRAILING_DOT,
            DEFAULT_NUMBER_FORMATTING_SYMBOLS,
            calculateNumberFormattingSymbols
        };

    mod.clone = function()
    {
        return Object.assign( {}, mod );
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
