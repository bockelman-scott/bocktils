/**
 * Defines several useful constants and utility functions common to JavaScript applications.
 * Using constants for string literals reduces bugs caused by typos,
 * allows better minification,
 * and _may_ reduce memory consumption in _some_ interpreters
 */

const bockModuleBootstrap = require( "./_BockModulePrototype.cjs" );

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
            bockModuleBootstrap
        };

    const
        {
            BockModuleEvent: ModuleEvent,
            BockModulePrototype: ModulePrototype,
            isReadOnly,
            populateOptions,
            lock,
            deepFreeze,
            localCopy,
            immutableCopy,
            StackTrace,
            __Error,
            IllegalArgumentError,
            IterationCap,
            ComparatorFactory
        } = bockModuleBootstrap;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    let modulePrototype = new ModulePrototype( "Constants", INTERNAL_NAME );

    /**
     * This is the default limit for recursive functions that cannot have a base-case to escape infinite execution
     * @type {number} the default limit for recursive functions that cannot have a base-case
     */
    const DEFAULT_MAX_STACK_DEPTH = 12;

    /**
     * We use a single variable declaration
     * to define the many constants we will export as members of the module object
     * so we can use them in this module as well
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

            S_LOG = "log",
            S_ERROR = "error",
            S_WARN = "warn",
            S_DEBUG = "debug",
            S_INFO = "info",
            S_TRACE = "trace",

            S_ERR_PREFIX = `An ${S_ERROR} occurred while`,
            S_DEFAULT_OPERATION = "executing script",

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

            // does nothing, on purpose
            no_op = function() {},

            ignore = no_op,

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
            funcToString = Function.prototype.toString,
            funcAsString = function( pFunction )
            {
                return (_fun === typeof pFunction ? pFunction?.name || funcToString.call( pFunction, pFunction ) : (_mt_str + pFunction));
            }
        } = (bockModuleBootstrap || $scope() || {});

    const isLogger = ModulePrototype.isLogger;

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

    let mod =
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
            S_LOG,
            S_INFO,
            S_WARN,
            S_DEBUG,
            S_TRACE,
            S_ERROR,
            S_ERR_PREFIX,
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
            DEFAULT_MAX_STACK_DEPTH,
            REG_EXP,
            REG_EXP_DOT,
            REG_EXP_LEADING_DOT,
            REG_EXP_TRAILING_DOT,
            DEFAULT_NUMBER_FORMATTING_SYMBOLS,
            dependencies,
            classes:
                {
                    IterationCap,
                    ComparatorFactory,
                    StackTrace,
                    __Error,
                    IllegalArgumentError,
                    ModuleEvent,
                    ModulePrototype,
                    CustomEvent
                },
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
            funcToString,
            funcAsString,
            isLogger,
            testLogger: function( ...pTestData )
            {
                (this.logger || modulePrototype.logger).warn( ...pTestData );
            }
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
