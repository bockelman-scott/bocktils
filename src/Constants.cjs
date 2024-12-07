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
     * An alias for the console to reduce lint-ing alerts for any reasonable use of console.log
     * @type {console | Console}
     */
    const konsole = console;

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
            _tab = "\t",
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

            HEX_DIGITS = "0123456789ABCDEF".split( _mt_str ),
            HEX_DIGITS_MAP = new Map( HEX_DIGITS.map( ( e, i ) => [e, i] ) ),
            OCT_DIGITS = "01234567".split( _mt_str ),
            OCT_DIGITS_MAP = new Map( OCT_DIGITS.map( ( e, i ) => [e, i] ) ),

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

            S_TYPES = _types.join( _comma ),
            S_VALID_TYPES = _validTypes.join( _comma ),

            S_ERROR = "error",
            S_ERR_PREFIX = `An ${S_ERROR} occurred while`,
            S_DEFAULT_OPERATION = "executing script",

            S_CUSTOM_EVENT = "CustomEvent",

            EMPTY_ARRAY = Object.freeze( [] ),
            EMPTY_OBJECT = Object.freeze( {} ),

            TYPED_ARRAYS = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array],

            ERROR_TYPES = [Error, AggregateError, RangeError, ReferenceError, SyntaxError, URIError],

            PRIMITIVE_WRAPPER_TYPES = [String, Number, Boolean, BigInt],

            GLOBAL_TYPES = [Object, Array, Function, ...PRIMITIVE_WRAPPER_TYPES, Date, RegExp, Symbol, Math, JSON, Map, Set, Promise, ArrayBuffer, SharedArrayBuffer, DataView, WeakMap, WeakRef, WeakSet],

            BUILTIN_TYPES = [].concat( ...TYPED_ARRAYS ).concat( ...ERROR_TYPES ).concat( ...GLOBAL_TYPES ),

            TYPED_ARRAY_NAMES = ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float16Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"],

            ERROR_TYPE_NAMES = ["Error", "AggregateError", "RangeError", "ReferenceError", "SyntaxError", "URIError"],

            GLOBAL_TYPE_NAMES = ["Object", "Array", "Function", "String", "Number", "Boolean", "BigInt", "Date", "RegExp", "Symbol", "Math", "JSON", "Map", "Set", "Promise", "ArrayBuffer", "SharedArrayBuffer", "DataView", "WeakMap", "WeakRef", "WeakSet"],

            BUILTIN_TYPE_NAMES = [].concat( ...TYPED_ARRAY_NAMES ).concat( ...ERROR_TYPE_NAMES ).concat( ...GLOBAL_TYPE_NAMES ),

            SERIALIZABLE_TYPES = [Object, String, Number, Boolean, Array, Date, RegExp, Error],

            /**
             * Strings that are interpreted as 'true' when encountered in JSON or other configuration contexts
             */
            _affirmatives = [].concat( ...([S_TRUE, "1", "on", S_ENABLED, "t", S_YES]) ),

            ignore = function() { },

            // does nothing, on purpose
            no_op = function() {},

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
                 "with"] ),
            funcToString = Function.prototype.toString
        } = ($scope() || {});

    function isArray( pObject )
    {
        return (_fun === typeof Array.isArray && Array.isArray( pObject )) || {}.toString.call( pObject ) === "[object Array]";
    }

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

        return true;
    };

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
    const DEFAULT_COPY_OPTIONS = Object.freeze(
        {
            nullToEmptyObject: false,
            nullToEmptyArray: false,
            undefinedToNull: false,
            undefinedToEmptyObject: false,
            undefinedToEmptyArray: false,
            depth: 99,
            freeze: false
        } );

    const IMMUTABLE_COPY_OPTIONS = { ...DEFAULT_COPY_OPTIONS };
    IMMUTABLE_COPY_OPTIONS.freeze = true;

    const MAX_STACK_SIZE = 32;

    /**
     * Returns an object corresponding to a set of default options with one or more properties
     * overridden or added by the properties of the specified pOptions
     *
     * @param pOptions {object} an object whose properties should be used
     * @param pDefaults {object} an object holding defaults for the properties to be used
     * @returns {object} an object combining the defaults with the specified options
     */
    function populateOptions( pOptions, pDefaults )
    {
        const defaults = Object.assign( {}, (_obj === typeof pDefaults && null != pDefaults) ? { ...pDefaults } : {} );
        return Object.assign( (defaults || {}), (pOptions || pDefaults || {}) );
    }

    function _getDepth( pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_COPY_OPTIONS );
        return Math.max( 0, _num === typeof options.depth ? options.depth : 0 );
    }

    /**
     * Calls Object.freeze on any defined non-null value specified and returns the same value, now frozen
     *
     * @param pObject {any} an object or array (or any other value) you want to freeze
     * @param pOptions {object} an object describing how to handle undefined and null values
     *
     * @returns {Function|Readonly<{}>|null|Readonly<*[]>|undefined}
     */
    const lock = function( pObject, pOptions = IMMUTABLE_COPY_OPTIONS )
    {
        const options = populateOptions( pOptions, IMMUTABLE_COPY_OPTIONS );

        if ( _ud === typeof pObject )
        {
            return options?.undefinedToNull ? null : (options?.undefinedToEmptyObject ? EMPTY_OBJECT : options?.undefinedToEmptyArray ? EMPTY_ARRAY : undefined);
        }

        if ( null === pObject )
        {
            return options?.nullToEmptyObject ? EMPTY_OBJECT : (options.nullToEmptyArray ? EMPTY_OBJECT : null);
        }

        return Object.freeze( pObject );
    };

    /**
     * Returns a deep copy of the value specified.
     * Used by localCopy and immutableCopy functions.
     * This function should not be exported.
     *
     * @param pObject {any} the value to copy
     *
     * @param pOptions {object} an object specifying how to handle undefined and null values
     * as well as whether and how deep to copy an object or array value
     *
     * @param pStack {[any]} USED INTERNALLY TO PREVENT INFINITE RECURSION, DO NOT SPECIFY A VALUE FROM CLIENT CODE
     *
     * @returns {bigint|number|string|null|{}|undefined|{}|*[]|Readonly<{}>|*|Function|boolean} an immutable copy of the value specified
     *
     * @private
     */
    const _copy = function( pObject, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        const options = populateOptions( pOptions, DEFAULT_COPY_OPTIONS );

        const depth = _getDepth( options );
        options.depth = depth;

        const freeze = (true === options.freeze);

        let clone = pObject;

        const stack = [].concat( pStack || [] );

        if ( stack.length > MAX_STACK_SIZE )
        {
            return freeze ? lock( clone ) : clone;
        }

        switch ( typeof pObject )
        {
            case _ud:
                return options?.undefinedToNull ? null : (options?.undefinedToEmptyObject ? (freeze ? EMPTY_OBJECT : {}) : options?.undefinedToEmptyArray ? (freeze ? EMPTY_ARRAY : []) : undefined);

            case _str:
                return (_mt_str + pObject);

            case _num:
                return parseFloat( pObject );

            case _big:
                return BigInt( pObject );

            case _bool:
                return Boolean( pObject );

            case _fun:
                return (freeze ? lock( pObject ) : pObject);

            case _symbol:
                return pObject;

            case _obj:
                if ( null == pObject )
                {
                    return options?.nullToEmptyObject ? (freeze ? EMPTY_OBJECT : {}) : options?.nullToEmptyArray ? (freeze ? EMPTY_ARRAY : []) : null;
                }

                if ( pObject instanceof Date )
                {
                    clone = new Date( pObject.getTime() );
                }
                else if ( pObject instanceof RegExp )
                {
                    clone = new RegExp( pObject, (pObject.flags || _mt_str) );
                }
                else if ( isArray( pObject ) )
                {
                    clone = [...pObject];

                    if ( depth > 0 )
                    {
                        options.depth = depth - 1;

                        stack.push( clone );

                        try
                        {
                            clone = clone.map( ( e, i ) => _copy( e, options, stack.concat( i ) ) );
                        }
                        finally
                        {
                            stack.pop();
                        }
                    }
                }
                else
                {
                    clone = Object.assign( {}, pObject );

                    if ( depth > 0 )
                    {
                        options.depth = depth - 1;

                        stack.push( clone );

                        try
                        {
                            const entries = Object.entries( pObject );

                            for( let entry of entries )
                            {
                                const key = entry[0];
                                const value = entry[1];

                                clone[key] = _copy( value, options, stack.concat( key ) );

                                if ( _fun === typeof clone[key] )
                                {
                                    try
                                    {
                                        clone[key].bind( clone );
                                    }
                                    catch( ex )
                                    {
                                        konsole.warn( key, "could not be bound to the clone", ex );
                                    }
                                }
                            }
                        }
                        finally
                        {
                            stack.pop();
                        }
                    }
                }
        }

        return freeze ? lock( clone ) : clone;
    };

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
    const localCopy = function( pObject, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        return _copy( pObject, pOptions, pStack );
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
    const immutableCopy = function( pObject, pOptions = IMMUTABLE_COPY_OPTIONS, pStack = [] )
    {
        const options = populateOptions( pOptions, IMMUTABLE_COPY_OPTIONS );
        options.freeze = true;
        return _copy( pObject, options, pStack );
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
     * Returns a string compatible with the StackTrace parseFrame method
     *
     * @param pError {Error}
     *
     * @returns {string} a string compatible with the StackTrace parseFrame method
     */
    function generateStack( pError )
    {
        if ( !(pError instanceof Error) )
        {
            return _mt_str;
        }

        let stack = pError?.stack;

        if ( _ud === typeof stack || null == stack || _str !== typeof stack )
        {
            stack = pError?.toString() || (pError?.name + _colon + _spc + (_mt_str + pError?.message).replace( (pError?.name || "~!~"), _mt_str )) + "\n";

            stack += "at (" + (pError?.fileName || _unknown) + _colon + (pError?.lineNumber || _unknown) + _colon + (pError?.columnNumber || _unknown) + ")\n";
        }

        return stack;
    }

    /**
     * This class provides cross-environment functionality related to an error's stack (trace)
     * For more robust functionality, consider https://github.com/stacktracejs/stacktrace.js
     */
    class StackTrace
    {
        #stack;
        #frames;
        #parts;

        #methodName;
        #fileName;
        #lineNumber;
        #columnNumber;

        constructor( pStack, pError )
        {
            this.#stack = (pStack instanceof String ?
                           pStack :
                           pStack instanceof Error ?
                           (pStack?.stack || generateStack( pStack ))
                                                   : _mt_str)
                          || pError?.stack
                          || generateStack( pError )
                          || generateStack( pStack );

            this.#frames = this.parseFrames();

            this.#parts = this.parseFrame( Math.min( 1, this.#frames?.length - 1 ) );

            this.#methodName = this.#parts.methodName;
            this.#fileName = this.#parts.fileName;
            this.#lineNumber = this.#parts.lineNumber;
            this.#columnNumber = this.#parts.columnNumber;
        }

        get stack()
        {
            return this.#stack;
        }

        get frames()
        {
            this.#frames = this.#frames?.length ? this.#frames : this.parseFrames();
            return this.#frames;
        }

        parseFrames()
        {
            let arr = [].concat( this.stack.split( /(\r\n)|\n/ ) );
            arr = arr.filter( e => (/(at)|@/).test( e ) ).map( e => e.replace( /at /, "@" ).trim() );
            return arr.map( e => e.replaceAll( /[A-Z]:\\/g, _mt_str ).trim() );
        }

        parseFrame( pFrame )
        {
            let frame = _num === typeof pFrame ? this.frames[pFrame] : pFrame;

            let rx = /((([^@(]\s*)*)([@(])([^)\n]+)([)\n]|$))/;   //// TODO

            let matches = rx.exec( frame );

            let parsed = {};

            if ( matches && matches.length )
            {
                parsed.methodName = matches?.length > 2 ? matches[2] : _unknown;

                const parts = matches?.length > 5 ? (matches[5]).split( _colon ) : _unknown;

                parsed.fileName = parts?.length > 0 ? parts[0] : _unknown;
                parsed.lineNumber = parts?.length > 1 ? parts[1] : 0;
                parsed.columnNumber = parts?.length > 2 ? parts[2] : 0;
            }

            return parsed;
        }

        get parts()
        {
            this.#parts = (this.#parts && Object.keys( this.#parts ).length > 0) ? this.#parts || this.parseFrame( 0 ) : this.parseFrame( 0 );
            return immutableCopy( this.#parts );
        }

        get methodName()
        {
            this.#methodName = this.#methodName || this.parts?.methodName;
            return this.#methodName;
        }

        get fileName()
        {
            this.#fileName = this.#fileName || this.parts?.fileName;
            return this.#fileName || this.parts?.fileName;
        }

        get lineNumber()
        {
            this.#lineNumber = this.#lineNumber || this.parts?.lineNumber;
            return this.#lineNumber || this.parts?.lineNumber;
        }

        get columnNumber()
        {
            this.#columnNumber = this.#columnNumber || this.parts?.columnNumber;
            return this.#columnNumber || this.parts?.columnNumber;
        }
    }

    /**
     * This class provides for custom Errors to be defined.
     * This class and its subclasses also should be able to provide a stack trace
     * regardless of browser or environment
     */
    class __Error extends Error
    {
        #msg;
        #options;

        #trace;

        constructor( pMessage, pOptions )
        {
            super( pMessage, pOptions );

            if ( Error.captureStackTrace )
            {
                Error.captureStackTrace( this, this.constructor );
            }

            this.#msg = pMessage || super.message;

            this.#options = immutableCopy( pOptions || {} );
        }

        get options()
        {
            return immutableCopy( this.#options || {} );
        }

        get type()
        {
            return "__Error";
        }

        get prefix()
        {
            return this.type + ": ";
        }

        get message()
        {
            return this.prefix + ((this.#msg || super.message).replace( this.prefix, _mt_str ));
        }

        toString()
        {
            return this.prefix + ((this.#msg || super.message).replace( this.prefix, _mt_str ));
        }

        get cause()
        {
            return (this.#options?.cause instanceof Error ? this.#options?.cause : super.cause) || super.cause;
        }

        get stackTrace()
        {
            this.#trace = this.#trace || new StackTrace( this.stack || this.cause?.stack || generateStack( this ), this );
            return this.#trace;
        }

        get fileName()
        {
            return super.fileName || this.stackTrace?.fileName;
        }

        get lineNumber()
        {
            return super.lineNumber || this.stackTrace?.lineNumber;
        }

        get columnNumber()
        {
            return super.columnNumber || this.stackTrace?.columnNumber;
        }

        logTo( pLogger, pLevel )
        {
            const logger = pLogger || konsole;

            const level = _str === typeof pLevel ? pLevel.toLowerCase() : _num === typeof pLevel && pLevel >= 0 && pLevel <= 6 ? ["none", "info", "warn", "error", "debug", "trace", "log"][pLevel] : "error";

            if ( _fun === typeof logger[level] )
            {
                logger[level]( this.toString(), this.options );
            }
        }
    }

    __Error.prototype.name = "__Error";

    /**
     * This subclass of Error is useful when validating function arguments.
     * The message property is overwritten to include the prefix 'IllegalArgumentException: ',
     * so that if only the message is logged, the type of error is not obscured
     */
    class IllegalArgumentError extends __Error
    {
        #mess;

        constructor( pMessage, pOptions )
        {
            super( pMessage, pOptions );

            if ( Error.captureStackTrace )
            {
                Error.captureStackTrace( this, this.constructor );
            }

            this.#mess = pMessage || super.message;
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
            return this.prefix + ((this.#mess || super.message).replace( this.prefix, _mt_str ));
        }

        toString()
        {
            return this.prefix + ((this.#mess || super.message).replace( this.prefix, _mt_str ));
        }

        static from( pError )
        {
            return new IllegalArgumentError( pError.message, { cause: pError } );
        }
    }

    IllegalArgumentError.prototype.name = "IllegalArgumentError";

    const _coerce = function( pValue, pType )
    {
        let a = (_ud === typeof pValue || null === pValue) ? null : pValue;

        let type = pType || typeof a;

        type = (_validTypes.includes( type ) || _fun === typeof type) ? type : typeof a;

        if ( type === typeof a || (_fun === typeof type && a instanceof type) )
        {
            return a;
        }

        switch ( type )
        {
            case _str:
                return _mt_str + (null === a ? _mt_str : a);

            case _num:
                return parseFloat( _mt_str + (null === a ? _mt_str : a) );

            case _big:
                return BigInt( (_mt_str + (null === a ? _mt_str : a)).replace( /n$/, _mt_str ) );

            case _bool:
                return Boolean( a );

            case _fun:
                return _fun === typeof a ? a : function() { return a; };

            case _symbol:
                return Symbol.for( (_mt_str + _coerce( a, _str )) );

            case _obj:
                return [(_mt_str + _coerce( a, _str ))];

            default:
                if ( type === Date || typeof type === Date )
                {
                    return new Date( _coerce( a, _num ) );
                }

                if ( type === RegExp || typeof type === RegExp )
                {
                    let regExp = _coerce( a, _str );

                    try
                    {
                        regExp = new RegExp( regExp );
                    }
                    catch( ex )
                    {

                    }

                    return regExp;
                }

                return _coerce( a, typeof type );
        }
    };

    /**
     * These are default options for the ComparatorFactory class.
     *
     * @type {{caseSensitive: boolean, trimStrings: boolean, nullsFirst: boolean, strict: boolean, reverse: boolean}}
     */
    const DEFAULT_COMPARATOR_OPTIONS =
        {
            type: "*",
            strict: true,
            nullsFirst: true,
            caseSensitive: true,
            trimStrings: false,
            reverse: false,
            coerce: false
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
        #coerce = false;

        #options = DEFAULT_COMPARATOR_OPTIONS;

        constructor( pType, pOptions = DEFAULT_COMPARATOR_OPTIONS )
        {
            this.#options = populateOptions( pOptions, DEFAULT_COMPARATOR_OPTIONS );

            this.#type = pType || this.#options?.type || _obj;

            const options = this.#options;

            this.#strict = false !== options?.strict && ("*" !== this.#type);
            this.#nullsFirst = false !== options?.nullsFirst;
            this.#caseSensitive = false !== options?.caseSensitive;
            this.#trimStrings = false !== options?.trimStrings;
            this.#reverse = true === options?.reverse;
            this.#coerce = true === options?.coerce;
        }

        get type()
        {
            return this.#type || "*";
        }

        set type( pType )
        {
            this.#type = pType || this.#type;
        }

        _copyOptions( pOverrides )
        {
            const overrides = populateOptions( pOverrides, this.#options || DEFAULT_COMPARATOR_OPTIONS );

            return {
                type: overrides?.type || this.type || "*",
                strict: (false === overrides?.strict ? false : overrides?.strict || this.strict),
                nullsFirst: (false === overrides?.nullsFirst ? false : overrides?.nullsFirst || this.nullsFirst),
                caseSensitive: (false === overrides?.caseSensitive ? false : overrides?.caseSensitive || this.caseSensitive),
                trimStrings: (false === overrides?.trimStrings ? false : overrides?.trimStrings || this.trimStrings),
                reverse: (false === overrides?.reverse ? false : overrides?.reverse || this.reverse),
                coerce: (false === overrides?.coerce ? false : overrides?.coerce || this.coerce)
            };
        }

        get options()
        {
            return populateOptions( this._copyOptions(), (this.#options || DEFAULT_COMPARATOR_OPTIONS) );
        }

        get strict()
        {
            return true === this.#strict && "*" !== this.type;
        }

        set strict( pStrict )
        {
            this.#strict = !!pStrict;
        }

        get coerce()
        {
            return this.#coerce;
        }

        set coerce( pCoerce )
        {
            this.#coerce = pCoerce;
        }

        get nullsFirst()
        {
            return this.#nullsFirst;
        }

        set nullsFirst( pNullsFirst )
        {
            this.#nullsFirst = !!pNullsFirst;
        }

        get caseSensitive()
        {
            return this.#caseSensitive;
        }

        set caseSensitive( pCaseSensitive )
        {
            this.#caseSensitive = !!pCaseSensitive;
        }

        get trimStrings()
        {
            return this.#trimStrings;
        }

        set trimStrings( pTrimStrings )
        {
            this.#trimStrings = !!pTrimStrings;
        }

        get reverse()
        {
            return this.#reverse;
        }

        set reverse( pReverse )
        {
            this.#reverse = !!pReverse;
        }

        _compare( pA, pB, pOptions )
        {
            const options = populateOptions( pOptions, this.options || DEFAULT_COMPARATOR_OPTIONS );

            let strict = (true === options?.strict) || this.strict;

            let coerce = (true === options?.coerce) || this.coerce;

            let a = pA;
            let b = pB;

            a = _symbol === typeof a ? Symbol.keyFor( a ) : a;
            b = _symbol === typeof b ? Symbol.keyFor( b ) : b;

            a = a || (0 === a ? 0 : false === a ? false : _mt_str === a ? a : null);
            b = b || (0 === b ? 0 : false === b ? false : _mt_str === b ? b : null);

            let type = (_ud === typeof a || null === a) ? ((_ud === typeof b || null === b) ? _ud : typeof b) : typeof a;

            if ( coerce )
            {
                type = ("*" !== this.type && _ud !== this.type && _ud !== typeof this.type) ? this.type : _str;

                a = _coerce( a, type );
                b = _coerce( b, type );
            }

            let isExpectedType = this.matchesType( a, b );

            if ( strict && !isExpectedType )
            {
                return 0;
            }

            let comp = 0;

            switch ( (type || this.type) )
            {
                case _ud:
                    return this.nullsFirst ? -1 : 1;

                case _str:

                    a = (null === a) ? _mt_str : a;
                    b = (null === b) ? _mt_str : b;

                    a = _mt_str + (this.trimStrings ? (_mt_str + a).trim() : a);
                    b = _mt_str + (this.trimStrings ? (_mt_str + b).trim() : b);

                    if ( !this.caseSensitive )
                    {
                        a = (_mt_str + a).toUpperCase();
                        b = (_mt_str + b).toUpperCase();
                    }

                    comp = a > b ? 1 : a < b ? -1 : 0;

                    break;

                case _num:
                case _big:

                    a = null === a ? NaN : parseFloat( a );
                    b = null === b ? NaN : parseFloat( b );

                    if ( isNaN( a ) || null === a )
                    {
                        if ( isNaN( b ) || null === b )
                        {
                            return 0;
                        }
                        return (this.nullsFirst ? -1 : 1);
                    }
                    else if ( isNaN( b ) || null === b )
                    {
                        return (this.nullsFirst ? 1 : -1);
                    }

                    comp = a > b ? 1 : a < b ? -1 : 0;

                    break;

                case _bool:
                    a = (a ? 1 : -1);
                    b = (b ? 1 : -1);

                    comp = a > b ? 1 : a < b ? -1 : 0;

                    break;

                case _fun:
                    return 0;

                case _symbol:
                    return 0;

                case _obj:

                    if ( null === a )
                    {
                        if ( null === b )
                        {
                            return 0;
                        }
                        return (this.nullsFirst ? -1 : 1);
                    }
                    else if ( null === b )
                    {
                        return (this.nullsFirst ? 1 : -1);
                    }

                    if ( _fun === typeof a?.compareTo )
                    {
                        comp = a.compareTo( b ) || 0;
                        break;
                    }

                    if ( isArray( a ) )
                    {
                        if ( isArray( b ) )
                        {
                            let comp = a.length > b.length ? 1 : a.length < b.length ? -1 : 0;

                            if ( 0 === comp )
                            {
                                for( let i = 0, n = a.length; i < n && 0 === comp; i++ )
                                {
                                    comp = this._compare( a[i], b[i] );
                                }
                            }
                        }

                        comp = a.length > 1 ? 1 : comp = a.length > 0 ? this._compare( a[0], b ) : _mt_str === (_mt_str + b) ? 0 : -1;

                        break;
                    }
                    else if ( isArray( b ) )
                    {
                        comp = b.length > 1 ? -1 : comp = b.length > 0 ? this._compare( a, b[0] ) : _mt_str === (_mt_str + a) ? 0 : 1;
                        break;
                    }

                    if ( a instanceof Date || [_num, _big].includes( typeof a ) )
                    {
                        if ( b instanceof Date || [_num, _big].includes( typeof b ) )
                        {
                            comp = a > b ? 1 : a < b ? -1 : 0;
                        }
                        break;
                    }

                    if ( a instanceof RegExp || [_str].includes( typeof a ) )
                    {
                        let sa = a.toString();

                        if ( b instanceof RegExp || [_str].includes( typeof b ) )
                        {
                            let sb = b.toString();

                            const comparator = new ComparatorFactory( _str ).comparator();

                            comp = comparator( sa, sb );
                        }
                        break;
                    }

                    for( let prop in a )
                    {
                        let propValue = a[prop];
                        let otherValue = b[prop];

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

        comparator()
        {
            const me = this;

            return function( pA, pB )
            {
                return me._compare( pA, pB, me.options );
            };
        }

        matchesType( pA, pB, pType )
        {
            let type = pType || this.type;

            const typeIsClass = _fun === typeof type;

            if ( "*" === type )
            {
                return true;
            }

            let a = pA;
            let b = pB;

            if ( this.coerce )
            {
                a = _coerce( a, type );
                b = _coerce( b, type );
            }

            if ( null === pA || _ud === typeof pA )
            {
                if ( null === pB || _ud === typeof pB )
                {
                    return true;
                }
                return (typeof b === type || (typeIsClass && pB instanceof type));
            }
            else if ( null === pB || _ud === typeof pB )
            {
                return (typeof a === type || (typeIsClass && pA instanceof type));
            }

            return (typeof a === typeof b) && (typeof a === type || (typeIsClass && a instanceof type)) && (typeof b === type || (typeIsClass && b instanceof type));
        }

        nullsFirstComparator()
        {
            const options = this._copyOptions( { nullsFirst: true } );
            return new ComparatorFactory( this.type, options ).comparator();
        }

        nullsLastComparator()
        {
            const options = this._copyOptions( { nullsFirst: false } );
            return new ComparatorFactory( this.type, options ).comparator();
        }

        caseInsensitiveComparator()
        {
            const options = this._copyOptions( { caseSensitive: false, type: "string" } );
            return new ComparatorFactory( options?.type || this.type, options ).comparator();
        }

        reverseComparator()
        {
            const options = this._copyOptions( { reverse: true } );
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
    }

    IterationCap.MAX_CAP = MAX_ITERATIONS;

    /**
     * Returns a read-only copy of an object,
     * whose properties are also read-only copies of properties of the specified object
     * @param pObject {object} the object to freeze
     * @param pStack {[any]} USED INTERNALLY TO PREVENT INFINITE RECURSION,
     *                       DO NOT SPECIFY A VALUE FROM CLIENT CODE
     *
     * @returns {object} a new object that is a frozen copy of the specified object
     * whose properties are also frozen copies of the specified object's properties
     */
    const deepFreeze = function( pObject, pStack = [] )
    {
        return immutableCopy( pObject, IMMUTABLE_COPY_OPTIONS, pStack );
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
            _tab,
            _lf,
            _crlf,
            _nbsp: " ",
            _ALPHABET_ENGLISH_UCASE,
            _ALPHABET_ENGLISH_LCASE,
            _LETTERS_ENGLISH_UCASE,
            _LETTERS_ENGLISH_LCASE,
            HEX_DIGITS,
            HEX_DIGITS_MAP,
            OCT_DIGITS,
            OCT_DIGITS_MAP,
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
            S_ERROR,
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
            _fileOptions: { encoding: "utf-8" },
            EMPTY_ARRAY,
            EMPTY_OBJECT,
            RESERVED_WORDS,
            AsyncFunction: (async function() {}).constructor,
            TYPED_ARRAYS,
            TYPED_ARRAY_NAMES,
            ERROR_TYPES,
            ERROR_TYPE_NAMES,
            PRIMITIVE_WRAPPER_TYPES,
            GLOBAL_TYPES,
            SERIALIZABLE_TYPES,
            GLOBAL_TYPE_NAMES,
            BUILTIN_TYPES,
            BUILTIN_TYPE_NAMES,
            _rxHeaderComment,
            _rxValidJson,
            _xZ,
            _rxTerminalSemicolon,
            _rxTrailingNewline,
            _rxLeadingNewline,
            _rxLeadingWhitespace,
            _rxTrailingWhitespace,
            _rxVariableToken,
            DEFAULT_MAX_ITERATIONS: MAX_ITERATIONS,
            DEFAULT_MAX_STACK_DEPTH,
            REG_EXP,
            REG_EXP_DOT,
            REG_EXP_LEADING_DOT,
            REG_EXP_TRAILING_DOT,
            DEFAULT_NUMBER_FORMATTING_SYMBOLS,
            dependencies,
            classes: { IterationCap, ComparatorFactory, StackTrace, __Error, IllegalArgumentError },
            IterationCap,
            IllegalArgumentError,
            ComparatorFactory,
            $scope,
            no_op,
            ignore,
            populateOptions,
            isReadOnly,
            localCopy,
            immutableCopy,
            lock,
            deepFreeze,
            calculateNumberFormattingSymbols,
            funcToString
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
