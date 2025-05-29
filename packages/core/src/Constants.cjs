/**
 * @fileOverview
 * This module defines a number of useful constants<br>
 * and utility functions common to JavaScript applications.<br>
 * <br>
 * Using constants for string literals reduces bugs caused by typos,
 * allows better minification,
 * and <i>may</i> reduce memory consumption in <i>some</i> execution contexts.
 * <br>
 *
 * @module Constants
 *
 * @author Scott Bockelman
 * @license MIT
 */

// import the only dependency for this module
const moduleUtils = require( "./_ToolBocksModule.cjs" );

// noinspection FunctionTooLongJS
/**
 * This module is constructed by an Immediately Invoked Function Expression (IIFE).
 * see: <a href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE">MDN: IIFE</a> for more information on this design pattern
 */
(function exposeModule()
{
    /**
     * This is the typeof a variable that does not exist
     * or has been declared without a default value<br>
     * <br>
     * Value: "undefined"<br>
     * <br>
     * @type {string}
     * @alias module:Constants#_ud
     */
    const _ud = "undefined";

    /**
     * This function returns the globalThis for the environment in which the code is currently executing<br>
     * <br>
     * @type {function():object}
     * @alias module:Constants.$scope
     */
    const $scope = function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    };

    /**
     * This is a (hopefully) unique string we use to cache this module.<br>
     *
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

    const
        {
            ModuleEvent,
            ToolBocksModule,
            ENDIAN,
            no_op,
            op_true,
            op_false,
            op_identity,
            lock,
            getMessagesLocale
        } = moduleUtils;

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import this module<br>
     * and then import or use the other utilities<br>
     * as properties of this module.
     * <br>
     * @dict
     * @type {Object}
     * @alias module:Constants#dependencies
     */
    const dependencies =
        {
            moduleUtils
        };

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    /**
     * Represents the name of the module<br>
     * This name is used when error events are emitted to indicate the source of the error.
     * @type {string}
     */
    const modName = "Constants";

    /**
     * This is the object that is returned from this function.
     * <br>
     * This object is the Constants module<br>
     * <br>
     * The variables and functions defined in this file are added to the module before it is exported and returned.
     * <br>
     * @type {ToolBocksModule}
     */
    let modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    /**
     * This is the default limit for recursive functions
     * that cannot have a base-case to escape infinite execution
     *
     * @type {number}
     */
    const DEFAULT_MAX_STACK_DEPTH = 12;

    /**
     * We use a single variable declaration
     * to define the many constants we will export as members of the module object
     * so we can use them within this module as well
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

            _types = lock( [_ud, _obj, _fun, _str, _bool, _num, _big, _symbol] ),
            _validTypes = lock( [_obj, _fun, _str, _bool, _num, _big, _symbol] ),

            _worker = "Worker",
            _browser = "Browser",
            _nodejs = "NodeJs",
            _deno = "Deno",
            _unknown = "Unknown",

            _mt_str = "",
            _mt_chr = "",
            _mt = _mt_str,
            _spc = " ",
            _dot = ".",
            _comma = ",",
            _underscore = "_",
            _usc = _underscore,
            _hyphen = "-",
            _hy = _hyphen,
            _asterisk = "*",
            _ampersand = "&",
            _equals = "=",
            _eq = _equals,
            _assignment = "=",
            _multiply = _asterisk,
            _minus = _hyphen,
            _plus = "+",
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
            _pipe = "|",
            _question = "?",

            _ALPHABET_ENGLISH_UCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            _ALPHABET_ENGLISH_LCASE = _ALPHABET_ENGLISH_UCASE.toLowerCase(),
            _LETTERS_ENGLISH_UCASE = lock( _ALPHABET_ENGLISH_UCASE.split( _mt_chr ) ),
            _LETTERS_ENGLISH_LCASE = lock( _ALPHABET_ENGLISH_LCASE.split( _mt_chr ) ),

            _DIGIT_CHARACTERS = "0123456789",

            DIGITS = lock( _DIGIT_CHARACTERS.split( _mt_chr ) ),
            DIGITS_MAP = lock( new Map( DIGITS.map( ( e, i ) => [e, i] ) ) ),

            HEX_DIGITS = lock( (_DIGIT_CHARACTERS + _ALPHABET_ENGLISH_UCASE.slice( 0, 6 )).split( _mt_str ) ),
            HEX_DIGITS_MAP = lock( new Map( HEX_DIGITS.map( ( e, i ) => [e, i] ) ) ),

            OCT_DIGITS = lock( (_DIGIT_CHARACTERS.slice( 0, 8 )).split( _mt_str ) ),
            OCT_DIGITS_MAP = lock( new Map( OCT_DIGITS.map( ( e, i ) => [e, i] ) ) ),

            BIN_DIGITS = lock( (_DIGIT_CHARACTERS.slice( 0, 2 )).split( _mt_str ) ),
            BIN_DIGITS_MAP = lock( new Map( BIN_DIGITS.map( ( e, i ) => [e, i] ) ) ),

            _zero = "0",

            _rxLiteral = "/",
            _solidus = "/",
            _slash = "/",
            _reverse_solidus = "\\",
            _backslash = "\\",
            _divide = _slash,

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
            _rxNullTerminator = /\u0000+$/,

            _rxTerminalSemicolon = /;+$/,
            _rxTrailingNewline = /((\r\n)|(\n))+$/,
            _rxLeadingNewline = /^((\r\n)|(\n))+/,
            _rxLeadingWhitespace = /^\s+/,
            _rxTrailingWhitespace = /\s+$/,

            _rxVariableToken = /\$\{[^}]+}/,

            _rxFunctionSignature = /^(\(?\s*((async(\s+))?\s*function))\s*?([$_\w]+[$_\w]*)?\s*\((\s*(([$_\w]+[$_\w]*\s*,?)\s*)*(\.{3}([$_\w]+[$_\w]*\s*,?)*\s*)*)(?<!,\s*)\)/,
            _rxFunction = /^(async )*function/,
            _rxClass = /^class/,

            _defaultLocaleString = "en-US",
            _defaultLocale = lock( new Intl.Locale( _defaultLocaleString ) ),
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

            S_TYPES = lock( _types.join( _comma ) ),
            S_VALID_TYPES = lock( _validTypes.join( _comma ) ),

            S_LOG = "log",
            S_ERROR = "error",
            S_WARN = "warn",
            S_DEBUG = "debug",
            S_INFO = "info",
            S_TRACE = "trace",

            S_ERR_PREFIX = `An ${S_ERROR} occurred while`,
            S_DEFAULT_OPERATION = "executing script",

            EMPTY_ARRAY = lock( [] ),
            EMPTY_OBJECT = lock( {} ),

            TYPED_ARRAYS = lock( [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array] ),

            ERROR_TYPES = lock( [Error, AggregateError, RangeError, ReferenceError, SyntaxError, URIError] ),

            PRIMITIVE_WRAPPER_TYPES = lock( [String, Number, Boolean, BigInt] ),

            GLOBAL_TYPES = lock( [Object, Array, Function, Date, RegExp, Symbol, Math, JSON, Map, Set, Promise, ArrayBuffer, SharedArrayBuffer, DataView, WeakMap, WeakRef, WeakSet, ...PRIMITIVE_WRAPPER_TYPES] ),

            BUILTIN_TYPES = lock( [].concat( ...TYPED_ARRAYS ).concat( ...ERROR_TYPES ).concat( ...GLOBAL_TYPES ) ),

            TYPED_ARRAY_NAMES = lock( ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float16Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"] ),

            ERROR_TYPE_NAMES = lock( ["Error", "AggregateError", "RangeError", "ReferenceError", "SyntaxError", "URIError"] ),

            GLOBAL_TYPE_NAMES = lock( ["Object", "Array", "Function", "String", "Number", "Boolean", "BigInt", "Date", "RegExp", "Symbol", "Math", "JSON", "Map", "Set", "Promise", "ArrayBuffer", "SharedArrayBuffer", "DataView", "WeakMap", "WeakRef", "WeakSet"] ),

            BUILTIN_TYPE_NAMES = lock( [].concat( ...TYPED_ARRAY_NAMES ).concat( ...ERROR_TYPE_NAMES ).concat( ...GLOBAL_TYPE_NAMES ) ),

            SERIALIZABLE_TYPES = lock( [Object, String, Number, Boolean, Array, Date, RegExp, Error] ),

            /**
             * Strings that are interpreted as 'true' when encountered in JSON or other configuration contexts
             */
            _affirmatives = lock( [].concat( ...([S_TRUE, "1", "on", S_ENABLED, "t", S_YES]) ) ),

            ignore = no_op,

            RESERVED_WORDS = lock(
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
            clamp = ( pNum, pMin, pMax ) => Math.min( Math.max( pNum, pMin ), pMax ),
            functionToString = Function.prototype.toString,
            funcName = function( pFunction )
            {
                return (_fun === typeof pFunction ? pFunction?.name || functionToString.call( pFunction, pFunction ) : (_mt_str + pFunction));
            },
            MESSAGES_LOCALE = getMessagesLocale()
        } = (moduleUtils || $scope() || {});

    /**
     * Represents a set of time durations in milliseconds.
     * Provides constants for easily converting time units into milliseconds.
     *
     * Properties:
     * - SECOND: The number of milliseconds in one second.
     * - MINUTE: The number of milliseconds in one minute.
     * - HOUR: The number of milliseconds in one hour.
     * - DAY: The number of milliseconds in one day.
     * - WEEK: The number of milliseconds in one week.
     */
    const MILLIS_PER =
        {
            SECOND: 1000,
            MINUTE: 60 * 1000,
            HOUR: 60 * 60 * 1000,
            DAY: 24 * 60 * 60 * 1000,
            WEEK: 7 * 24 * 60 * 60 * 1000
        };

    /**
     * A constant object that defines the number of nanoseconds in various units of time.
     *
     * Properties:
     * - MICROSECOND: The number of nanoseconds in one microsecond (1,000 nanoseconds).
     * - MILLISECOND: The number of nanoseconds in one millisecond (1,000,000 nanoseconds).
     * - SECOND: The number of nanoseconds in one second (1,000,000,000 nanoseconds).
     * - MINUTE: The number of nanoseconds in one minute (60,000,000,000 nanoseconds).
     * - HOUR: The number of nanoseconds in one hour (3,600,000,000,000 nanoseconds).
     * - DAY: The number of nanoseconds in one day (86,400,000,000,000 nanoseconds).
     * - WEEK: The number of nanoseconds in one week (604,800,000,000,000 nanoseconds).
     */
    const NANOS_PER =
        {
            MICROSECOND: 1000,
            MILLISECOND: 1000 * 1000,
            SECOND: 1000 * 1000 * 1000,
            MINUTE: 60 * 1000 * 1000 * 1000,
            HOUR: 60 * 60 * 1000 * 1000 * 1000,
            DAY: 24 * 60 * 60 * 1000 * 1000 * 1000,
            WEEK: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000
        };

    /**
     * An array of the Number constants
     * @type {string[]}
     */
    const NumberProperties = ["EPSILON",
                              "MAX_SAFE_INTEGER",
                              "MAX_VALUE",
                              "MIN_SAFE_INTEGER",
                              "MIN_VALUE",
                              "NaN",
                              "NEGATIVE_INFINITY",
                              "POSITIVE_INFINITY"];

    /**
     * Returns true if the specified object implements the ILogger interface.<br>
     * <br>
     * That is, this function returns true if the specified object has the following methods:<br>
     * <br>
     * log, info, warn, debug, error, and trace
     * <br>
     * @type {(function((Object|ILogger)): boolean)}
     *
     * @return true if the specified object implements the ILogger interface
     *
     * @alias module:Constants.isLogger
     */
    const isLogger = ToolBocksModule.isLogger;

    /**
     * This is a regular expression that matches a single dot character anywhere in a string<br>
     *
     * @type {RegExp}
     *
     * @alias module:Constants#REG_EXP_DOT
     */
    const REG_EXP_DOT = /\./;

    /**
     * This is a regular expression that matches a single dot character at the start of a string<br>
     *
     * @type {RegExp}
     *
     * @alias module:Constants#REG_EXP_LEADING_DOT
     */
    const REG_EXP_LEADING_DOT = /^\./;

    /**
     * This is a regular expression that matches a single dot character at the end of a string<br>
     *
     * @type {RegExp}
     *
     * @alias module:Constants#REG_EXP_TRAILING_DOT
     */
    const REG_EXP_TRAILING_DOT = /\.$/;

    /**
     * @namespace {object} REG_EXP
     *
     * This is an object that encapsulates
     * a few useful regular expressions<br>
     *
     * @const
     * @alias module:Constants#REG_EXP
     */
    const REG_EXP = lock(
        {
            /**
             * A regular expression for matching a dot character ('.').
             * This regular expression matches a literal dot anywhere a string.
             *
             * @constant {RegExp} DOT
             *
             * @alias module:Constants#REG_EXP#DOT
             */
            DOT: REG_EXP_DOT,
            /**
             * Regular expression for matching a single leading dot<br>
             * Used to identify and process strings that begin with a period<br>
             *
             * @constant {RegExp} LEADING_DOT
             *
             * @alias module:Constants#REG_EXP#LEADING_DOT
             */
            LEADING_DOT: REG_EXP_LEADING_DOT,
            /**
             * Regular expression for matching a single trailing dot<br>
             * Used to identify and process strings that end with a period<br>
             *
             * @constant {RegExp} TRAILING_DOT
             *
             * @alias module:Constants#REG_EXP#TRAILING_DOT
             */
            TRAILING_DOT: REG_EXP_TRAILING_DOT,
            /**
             * Regular expression for matching block comments in source code<br>
             *
             * @constant {RegExp} BLOCK_COMMENT
             *
             * @alias module:Constants#REG_EXP#BLOCK_COMMENT
             */
            BLOCK_COMMENT: _rxHeaderComment,
            /**
             * Regular expression for matching valid JSON text<br>
             *
             * @constant {RegExp} VALID_JSON
             *
             * @alias module:Constants#REG_EXP#VALID_JSON
             */
            VALID_JSON: _rxValidJson,
            /**
             * Regular expression for matching the null-terminator<br>
             * Used when processing strings<br>
             * that have either been returned from C-based addons<br>
             * or being used as arguments to C-based addon methods<br>
             *
             * @constant {RegExp} NULL_TERMINATOR
             *
             * @alias module:Constants#REG_EXP#NULL_TERMINATOR
             */
            NULL_TERMINATOR: _xZ,
            /**
             * Regular expression for matching one or more trailing semicolons<br>
             * Useful when parsing source code<br>
             *
             * @constant {RegExp} TERMINAL_SEMICOLON
             *
             * @alias module:Constants#REG_EXP#TERMINAL_SEMICOLON
             */
            TERMINAL_SEMICOLON: _rxTerminalSemicolon,
            /**
             * Regular expression for matching one or more trailing newline characters<br>
             *
             * @constant {RegExp} TRAILING_NEWLINE
             *
             * @alias module:Constants#REG_EXP#TRAILING_NEWLINE
             */
            TRAILING_NEWLINE: _rxTrailingNewline,
            /**
             * Regular expression for matching one or more leading newline characters<br>
             *
             * @constant {RegExp} LEADING_NEWLINE
             *
             * @alias module:Constants#REG_EXP#LEADING_NEWLINE
             */
            LEADING_NEWLINE: _rxLeadingNewline,
            /**
             * Regular expression for matching one or more leading whitespace characters<br>
             *
             * @constant {RegExp} LEADING_WHITESPACE
             *
             * @alias module:Constants#REG_EXP#LEADING_WHITESPACE
             */
            LEADING_WHITESPACE: _rxLeadingWhitespace,
            /**
             * Regular expression for matching one or more trailing whitespace characters<br>
             *
             * @constant {RegExp} TRAILING_WHITESPACE
             *
             * @alias module:Constants#REG_EXP#TRAILING_WHITESPACE
             */
            TRAILING_WHITESPACE: _rxTrailingWhitespace,
            /**
             * Regular expression for matching a token for variable interpolation<br>
             * for example that might be found in a template string<br>
             *
             * @constant {RegExp} VARIABLE_TOKEN
             *
             * @alias module:Constants#REG_EXP#VARIABLE_TOKEN
             */
            VARIABLE_TOKEN: _rxVariableToken
        } );

    /**
     * @typedef {Object} NumberFormattingSymbols
     *
     * @property [decimal_point="."] The character used to separate the integer portion from the fractional portion of a value
     *
     * @property [grouping_separator=","] The character used to group the integer portion of a value<br>
     *                                    into easier-to-read sequences, usually of 3 digits.<br>
     *
     * @property [currency_symbol=/\$|USD/] A regular expression used to identify (and potentially remove)<br>
     *                                      the currency symbol from a string<br>
     *                                      prior to parsing it as a number<br>
     */

    /**
     * These are the default values assumed for number formatting
     * @const
     * @type {NumberFormattingSymbols}
     *
     * @alias module:Constants#DEFAULT_NUMBER_FORMATTING_SYMBOLS
     */
    const DEFAULT_NUMBER_FORMATTING_SYMBOLS = lock(
        {
            decimal_point: ".",
            grouping_separator: ",",
            currency_symbol: /\$|USD/,
            currency: "USD"
        } );

    /**
     * Returns the string representing the specified Locale,
     * or the default locale if no Locale is provided or the string is empty
     * <br>
     * <br>
     * @param {Intl.Locale|string} pLocale - The Locale or string to resolve
     * @returns the string representing the specified Locale,
     * or the default locale if no Locale is provided or the string is empty
     *
     * @alias module:Constants.resolveLocaleString
     */
    function resolveLocaleString( pLocale )
    {
        if ( pLocale instanceof Intl.Locale )
        {
            return pLocale?.baseName || _defaultLocaleString;
        }

        if ( null == pLocale || _mt_str === pLocale )
        {
            const numberFormat = new Intl.NumberFormat();
            const resolvedOptions = numberFormat.resolvedOptions();
            const locale = resolvedOptions?.locale;

            return (_mt_str + locale?.baseName) || _defaultLocaleString;
        }

        return (_mt_str + pLocale) || _defaultLocaleString;
    }

    /**
     * Returns an object defining the {@link NumberFormattingSymbols}
     * to use when formatting or parsing numbers for the specified Locale<br>
     *
     * @param {string|Intl.Locale} pLocale The Locale for which to calculate the symbols
     * @param {string} pCurrency  The currency for which to calculate the symbol used when formatting numbers as currency
     *
     * @returns {NumberFormattingSymbols} An object defining the symbols to use when formatting or parsing numbers as per the specified Locale
     *
     * @alias module:Constants.calculateNumberFormattingSymbols
     */
    const calculateNumberFormattingSymbols = function( pLocale, pCurrency )
    {
        let localeString = resolveLocaleString( pLocale );

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

        return lock( symbols ) || DEFAULT_NUMBER_FORMATTING_SYMBOLS;
    };

    let mod =
        {
            /**
             * Returns the global object representing the execution context.<br>
             * In a browser, this is typically the window or worker or service worker,
             * while in Node.js or other environments, it is either 'global' or the globalThis.
             *
             * @alias module:Constants.$scope
             */
            $scope,

            dependencies,

            /**
             * This is the 'base' module upon which all other ToolBocks&trade; modules depend and extend.
             * @alias module:Constants.moduleUtils
             */
            moduleUtils,

            /**
             * The ToolBockModule custom event class
             */
            ModuleEvent,

            ENDIAN,

            /**
             * The string returned by the typeof operator when applied to a variable that is <i>undefined</i>
             * <br>
             * Value: "undefined"
             * @const
             * @type {string}
             * @alias module:Constants#_ud
             */
            _ud,

            /**
             * The string returned by the typeof operator when applied to an {@link Object}<br>
             * Value: "object"
             * @const
             * @type {string}
             * @alias module:Constants#_obj
             */
            _obj,

            /**
             * The string returned by the typeof operator when applied to a {@link Function}<br>
             * Value: "function"
             * @const
             * @type {string}
             * @alias module:Constants#_fun
             */
            _fun,

            /**
             * The string returned by the typeof operator when applied to a {@link String}<br>
             * Value: "string"
             * @const
             * @type {string}
             * @alias module:Constants#_str
             */
            _str,

            /**
             * The string returned by the typeof operator when applied to a {@link Number}<br>
             * Value: "number"
             * @const
             * @type {string}
             * @alias module:Constants#_num
             */
            _num,

            /**
             * The string returned by the typeof operator when applied to a {@link BigInt}<br>
             * Value: "bigint"
             * @const
             * @type {string}
             * @alias module:Constants#_big
             */
            _big,

            /**
             * The string returned by the typeof operator when applied to a {@link boolean}<br>
             * Value: "boolean"
             * @const
             * @type {string}
             * @alias module:Constants#_bool
             */
            _bool,

            /**
             * The string returned by the typeof operator when applied to a {@link Symbol}<br>
             * Value: "symbol"
             * @const
             * @type {string}
             * @alias module:Constants#_symbol
             */
            _symbol,

            /**
             * An array of the defined JavaScript Types, including "undefined"<br>
             * @const
             * @type {Array<string>}
             * @alias module:Constants#_types
             */
            _types,

            /**
             * An array of the JavaScript Types that represent defined variables, that is, the types excluding "undefined"<br>
             * @const
             * @type {Array<string>}
             * @alias module:Constants#_validTypes
             */
            _validTypes,

            /**
             * The null terminator character, often used in C-like languages to indicate the end of a string.
             * <br><br>
             * @const
             * @type {string}
             * @alias module:Constants#_z
             */
            _z,

            /**
             * The empty string<br>
             * Value: ""<br>
             * @const
             * @type {string}
             * @alias module:Constants#_mt_str
             */
            _mt_str,

            /**
             * The empty character<br>
             * Value: ''<br>
             * @const
             * @type {string}
             * @alias module:Constants#_mt_chr
             */
            _mt_chr,

            /**
             * A double-quote character; ASCII CODE 34<br>
             * Value: " <br>
             * @type {string}
             * @alias module:Constants#_dblqt
             */
            _dblqt,

            /**
             * A single-quote character; ASCII CODE 39<br>
             * Value: ' <br>
             * @const
             * @type {string}
             * @alias module:Constants#_sglqt
             */
            _sglqt,

            /**
             * An apostrophe character; ASCII CODE 39<br>
             * Value: ' <br>
             * @const
             * @type {string}
             * @alias module:Constants#_apos
             */
            _apos,

            /**
             * A <i>fancy</i> apostrophe character; Character Code 8217<br>
             * Value: &#8217; <br>
             * @const
             * @type {string}
             * @alias module:Constants#_aposFancy
             */
            _aposFancy,

            /**
             * A <i>fancy</i> opening quote character; Character Code 8220<br>
             * Value: &#8220; <br>
             * @const
             * @type {string}
             * @alias module:Constants#_dblqtLeftFancy
             */
            _dblqtLeftFancy,

            /**
             * A <i>fancy</i> closing quote character; Character Code 8221<br>
             * Value: &#8221; <br>
             * @const
             * @type {string}
             * @alias module:Constants#_dblqtRightFancy
             */
            _dblqtRightFancy,

            /**
             * A <i>fancy</i> opening single quote character; Character Code 8216<br>
             * Value: &#8216; <br>
             * @const
             * @type {string}
             * @alias module:Constants#_sglqtLeftFancy
             */
            _sglqtLeftFancy,

            /**
             * A <i>fancy</i> closing single quote character; Character Code 8217<br>
             * Value: &#8217; <br>
             * @const
             * @type {string}
             * @alias module:Constants#_sglqtRightFancy
             */
            _sglqtRightFancy,

            /**
             * The character used to delimit a regular expression literal <br>
             * Value: / <br>
             * @const
             * @type {string}
             * @alias module:Constants#_rxLiteral
             */
            _rxLiteral,

            /**
             * The character used to separate file paths on unix-like systems<br>
             * Value: / <br>
             * @const
             * @type {string}
             * @alias module:Constants#_solidus
             */
            _solidus,

            /**
             * The character used to separate alternatives in a phrase such as "and/or"<br>
             * Value: / <br>
             * @const
             * @type {string}
             * @alias module:Constants#_slash
             */
            _slash,

            /**
             * The character used to indicate a division operation in most programming languages<br>
             * Value: / <br>
             * @const
             * @type {string}
             * @alias module:Constants#_divide
             */
            _divide,

            /**
             * The character used to separate file paths on Windows or DOS-like systems<br>
             * Value: \ <br>
             * @const
             * @type {string}
             * @alias module:Constants#_reverse_solidus
             */
            _reverse_solidus,

            /**
             * The backslash character<br>
             * Value: \ <br>
             * @const
             * @type {string}
             * @alias module:Constants#_backslash
             */
            _backslash,

            /**
             * The semicolon character, often used to indicate the end of a statement in C-like languages<br>
             * Value: ; <br>
             * @const
             * @type {string}
             * @alias module:Constants#_semicolon
             */
            _semicolon,

            /**
             * The colon character, used to assign values to keys in an object literal<br>
             * Value: : <br>
             * @const
             * @type {string}
             * @alias module:Constants#_colon
             */
            _colon,

            /**
             * The pipe character<br>
             * Value: | <br>
             * @const
             * @type {string}
             * @alias module:Constants#_pipe
             */
            _pipe,

            /**
             * The question mark character, often used in URLs to append a query string<br>
             * Value: ? <br>
             * @const
             * @type {string}
             * @alias module:Constants#_question
             */
            _question,

            /**
             * The comma character<br>
             * Value: , <br>
             * @const
             * @type {string}
             * @alias module:Constants#_comma
             */
            _comma,

            /**
             * The underscore character, often used in variable names when using "snake case"<br>
             * Value: _ <br>
             * @const
             * @type {string}
             * @alias module:Constants#_underscore
             */
            _underscore,

            /**
             * The hyphen character, often used to break a word across lines<br>
             * Value: - <br>
             * @const
             * @type {string}
             * @alias module:Constants#_hyphen
             */
            _hyphen,

            /**
             * The asterisk character, often used as to indicate there is more information in a footnote<br>
             * Value: * <br>
             * @const
             * @type {string}
             * @alias module:Constants#_asterisk
             */
            _asterisk,

            /**
             * The ampersand character, sometimes used in place of the word 'and' and also used to start HTML entity codes<br>
             * Value: & <br>
             * @const
             * @type {string}
             * @alias module:Constants#_ampersand
             */
            _ampersand,

            /**
             * The 'equals' sign, used in mathematics to indicate equality,<br>
             * but also used to assign values to variables or separate key/value pairs in external text<br>
             * <br>
             * Value: = <br>
             * @const
             * @type {string}
             * @alias module:Constants#_equals
             */
            _equals,

            /**
             * Also the equals signs character, used to assign values to variables or separate key/value pairs in external text<br>
             * Value: = <br>
             * @const
             * @type {string}
             * @alias module:Constants#_assignment
             */
            _assignment,

            /**
             * The asterisk character, often used as the multiplication operator in many programming languages<br>
             * Value: * <br>
             * @const
             * @type {string}
             * @alias module:Constants#_multiply
             */
            _multiply,

            /**
             * The character used to indicate the subtraction operation<br>
             * Value: - <br>
             * @const
             * @type {string}
             * @alias module:Constants#_minus
             */
            _minus,

            /**
             * The character used to indicate the addition operation or a positive number<br>
             * Value: + <br>
             * @const
             * @type {string}
             * @alias module:Constants#_plus
             */
            _plus,

            /**
             * The tilde character, often found on the same key as ` on most keyboards<br>
             * Value: ~ <br>
             * @const
             * @type {string}
             * @alias module:Constants#_tilde
             */
            _tilde,

            /**
             * A single space character, often used to separate words in phrases and sentences<br>
             * Character code: 32
             * Value: " " <br>
             * @const
             * @type {string}
             * @alias module:Constants#_spc
             */
            _spc,

            /**
             * A dot or period character, often used to indicate the end of a sentence<br>
             * Value: . <br>
             * @const
             * @type {string}
             * @alias module:Constants#_dot
             */
            _dot,

            /**
             * The sequence of characters used to indicate some characters have been omitted<br>
             * Value: ... <br>
             * @const
             * @type {string}
             * @alias module:Constants#_ellipsis
             */
            _ellipsis,

            /**
             * The TAB character sometimes used to indent characters, but frowned upon as a means of indenting code<br>
             * Character Code: 9
             * Value: "\t" <br>
             * @const
             * @type {string}
             * @alias module:Constants#_tab
             */
            _tab,

            /**
             * The linefeed character used to indicate a new line on unix-like systems<br>
             * Character Code: 10
             * Value: "\n" <br>
             * @const
             * @type {string}
             * @alias module:Constants#_lf
             */
            _lf,

            /**
             * The character sequence used to indicate a newline on Windows<br>
             * Carriage Return followed by Line Feed
             * Character Code(s): 13, 10
             * Value: "\r\n" <br>
             * @const
             * @type {string}
             * @alias module:Constants#_crlf
             */
            _crlf,

            /**
             * A non-breaking space character, often used in HTML to preserve whitespace that might otherwise be ignored/removed<br>
             * Character Code: 161
             * Value: &nbsp; <br>
             * @const
             * @type {string}
             * @alias module:Constants#_nbsp
             */
            _nbsp: " ",

            /**
             * The UPPERCASE letters of the English alphabet: ABCDEFGHIJKLMNOPQRSTUVWXYZ
             * @const
             * @type {string}
             * @alias module:Constants#_ALPHABET_ENGLISH_UCASE
             */
            _ALPHABET_ENGLISH_UCASE,

            /**
             * The lowercase letters of the English alphabet: abcdefghijklmnopqrstuvwxyz
             * @const
             * @type {string}
             * @alias module:Constants#_ALPHABET_ENGLISH_UCASE
             */
            _ALPHABET_ENGLISH_LCASE,

            /**
             * An array of the UPPERCASE letters of the English alphabet
             * @const
             * @type {Array<string>}
             * @alias module:Constants#_LETTERS_ENGLISH_UCASE
             */
            _LETTERS_ENGLISH_UCASE,

            /**
             * An array of the lowercase letters of the English alphabet
             * @const
             * @type {Array<string>}
             * @alias module:Constants#_LETTERS_ENGLISH_LCASE
             */
            _LETTERS_ENGLISH_LCASE,

            /**
             * The characters used to represent base-10 numbers: 0123456789
             * @const
             * @type {string}
             * @alias module:Constants#_DIGIT_CHARACTERS
             */
            _DIGIT_CHARACTERS,

            /**
             * An array of the digit characters used to represent base-10 numbers
             * @const
             * @type {Array<string>}
             * @alias module:Constants#DIGITS
             */
            DIGITS,

            /**
             * A map of number values by digit
             * @const
             * @type {Map<string,number>}
             * @alias module:Constants#DIGITS_MAP
             */
            DIGITS_MAP,

            /**
             * An array of the characters used to represent base-16 numbers: 0123456789ABCDEF
             * @const
             * @type {Array<string>}
             * @alias module:Constants#HEX_DIGITS
             */
            HEX_DIGITS,

            /**
             * A map of numerical values by hexadecimal digit character
             * @const
             * @type {Map<string,number>}
             * @alias module:Constants#HEX_DIGITS_MAP
             */
            HEX_DIGITS_MAP,

            /**
             * An array of the characters used to represent base-8 numbers: 01234567
             * @const
             * @type {Array<string>}
             * @alias module:Constants#OCT_DIGITS
             */
            OCT_DIGITS,

            /**
             * A map of numerical values by octal digit character
             * @const
             * @type {Map<string, number>}
             * @alias module:Constants#OCT_DIGITS_MAP
             */
            OCT_DIGITS_MAP,

            /**
             * An array of the characters used to represent base-2 numbers: 01
             * @const
             * @type {Array<string>}
             * @alias module:Constants#BIN_DIGITS
             */
            BIN_DIGITS,

            /**
             * A map of numerical values by binary digit character
             * @const
             * @type {Map<string,number>}
             * @alias module:Constants#BIN_DIGITS_MAP
             */
            BIN_DIGITS_MAP,

            /**
             * The string value of the number, 0
             * @const
             * @type {string}
             * @alias module:Constants#_zero
             */
            _zero,

            /**
             * An object defining the number of milliseconds per
             * SECOND, MINUTE, HOUR, DAY, and WEEK
             */
            MILLIS_PER,

            /**
             * An object defining the number of nanoseconds per
             * MICROSECOND, MILLISECOND, SECOND, MINUTE, HOUR, DAY, and WEEK
             */
            NANOS_PER,

            /**
             * The word, "Browser"
             * @const
             * @type {string}
             * @alias module:Constants#_browser
             */
            _browser,

            /**
             * The word, "Worker"
             * @const
             * @type {string}
             * @alias module:Constants#_worker
             */
            _worker,

            /**
             * The word, "NodeJs"
             * @const
             * @type {string}
             * @alias module:Constants#_nodejs
             */
            _nodejs,

            /**
             * The word, "Deno"
             * @const
             * @type {string}
             * @alias module:Constants#_deno
             */
            _deno,

            /**
             * The word, "Unknown"
             * @const
             * @type {string}
             * @alias module:Constants#_unknown
             */
            _unknown,

            /**
             * Either a backslash or a slash depending on the execution environment
             * @const
             * @type {string}
             * @alias module:Constants#_pathSep
             */
            _pathSep,

            /**
             * The character sequence "./" (or .\) indicating the current directory
             * @const
             * @type {string}
             * @alias module:Constants#_thisDir
             */
            _thisDir,

            /**
             * The character sequence "../" (or ..\) indicating the parent directory
             * @const
             * @type {string}
             * @alias module:Constants#_prevDir
             */
            _prevDir,

            /**
             * The character used to separate filepath segments on unix-like operating systems
             * @const
             * @type {string}
             * @alias module:Constants#_unixPathSep
             */
            _unixPathSep,

            /**
             * The character sequence "./" indicating the current directory (on unix-like operating systems)
             * @const
             * @type {string}
             * @alias module:Constants#_unixThisDir
             */
            _unixThisDir,

            /**
             * The character sequence "../" indicating the parent directory (on unix-like operating systems)
             * @const
             * @type {string}
             * @alias module:Constants#_unixPrevDir
             */
            _unixPrevDir,

            /**
             * The string used for the default locale, "en-US"
             * @const
             * @type {string}
             * @alias module:Constants#_defaultLocaleString
             */
            _defaultLocaleString,

            /**
             * The default {@link Intl.Locale} object
             * @const
             * @type {Intl.Locale}
             * @alias module:Constants#_defaultLocale
             */
            _defaultLocale,

            /**
             * The default currency string,"USD"
             * @const
             * @type {string}
             * @alias module:Constants#_defaultCurrency
             */
            _defaultCurrency,

            /**
             * The word, "false"
             * @const
             * @type {string}
             * @alias module:Constants#S_FALSE
             */
            S_FALSE,

            /**
             * The word, "true"
             * @const
             * @type {string}
             * @alias module:Constants#S_TRUE
             */
            S_TRUE,

            /**
             * The word, "no"
             * @const
             * @type {string}
             * @alias module:Constants#S_NO
             */
            S_NO,

            /**
             * The word, "yes"
             * @const
             * @type {string}
             * @alias module:Constants#S_YES
             */
            S_YES,

            /**
             * The word, "disabled"
             * @const
             * @type {string}
             * @alias module:Constants#S_DISABLED
             */
            S_DISABLED,

            /**
             * The word, "enabled"
             * @const
             * @type {string}
             * @alias module:Constants#S_ENABLED
             */
            S_ENABLED,

            /**
             * The word, "undefined"
             * @const
             * @type {string}
             * @alias module:Constants#S_UNDEFINED
             */
            S_UNDEFINED,

            /**
             * The word, "null"
             * @const
             * @type {string}
             * @alias module:Constants#S_NULL
             */
            S_NULL,

            /**
             * The word, "void"
             * @const
             * @type {string}
             * @alias module:Constants#S_VOID
             */
            S_VOID,

            /**
             * The word, "object"
             * @const
             * @type {string}
             * @alias module:Constants#S_OBJECT
             */
            S_OBJECT,

            /**
             * The word, "function"
             * @const
             * @type {string}
             * @alias module:Constants#S_FUNCTION
             */
            S_FUNCTION,

            /**
             * The word, "string"
             * @const
             * @type {string}
             * @alias module:Constants#S_STRING
             */
            S_STRING,

            /**
             * The word, "boolean"
             * @const
             * @type {string}
             * @alias module:Constants#S_BOOLEAN
             */
            S_BOOLEAN,

            /**
             * The word, "number"
             * @const
             * @type {string}
             * @alias module:Constants#S_NUMBER
             */
            S_NUMBER,

            /**
             * The word, "bigint"
             * @const
             * @type {string}
             * @alias module:Constants#S_BIGINT
             */
            S_BIGINT,

            /**
             * The word, "symbol"
             * @const
             * @type {string}
             * @alias module:Constants#S_SYMBOL
             */
            S_SYMBOL,

            /**
             * The null-terminator character
             * @const
             * @type {string}
             * @alias module:Constants#S_Z
             */
            S_Z,

            /**
             * A comma separated list of the defined JavaScript types
             * @const
             * @type {string}
             * @alias module:Constants#S_TYPES
             */
            S_TYPES,

            /**
             * A comma separated list of the "valid" JavaScript types
             * @const
             * @type {string}
             * @alias module:Constants#S_VALID_TYPES
             */
            S_VALID_TYPES,

            /**
             * The word, "log", corresponding to the method name of a logger
             * @const
             * @type {string}
             * @alias module:Constants#S_LOG
             */
            S_LOG,

            /**
             * The word, "info", corresponding to the method name of a logger
             * @const
             * @type {string}
             * @alias module:Constants#S_INFO
             */
            S_INFO,

            /**
             * The word, "warn", corresponding to the method name of a logger
             * @const
             * @type {string}
             * @alias module:Constants#S_WARN
             */
            S_WARN,

            /**
             * The word, "debug", corresponding to the method name of a logger
             * @const
             * @type {string}
             * @alias module:Constants#S_DEBUG
             */
            S_DEBUG,

            /**
             * The word, "trace", corresponding to the method name of a logger
             * @const
             * @type {string}
             * @alias module:Constants#S_TRACE
             */
            S_TRACE,

            /**
             * The word, "error", corresponding to the method name of a logger
             * @const
             * @type {string}
             * @alias module:Constants#S_ERROR
             */
            S_ERROR,

            /**
             * The phrase, "An error occurred while", used when no other error message is available
             * @const
             * @type {string}
             * @alias module:Constants#S_ERR_PREFIX
             */
            S_ERR_PREFIX,

            /**
             * The phrase, "executing script", corresponding to the method name of a logger
             * @const
             * @type {string}
             * @alias module:Constants#S_DEFAULT_OPERATION
             */
            S_DEFAULT_OPERATION,

            /**
             * The comma character<br>
             * Value: , <br>
             * @const
             * @type {string}
             * @alias module:Constants#S_COMMA
             */
            S_COMMA: _comma,

            /**
             * The tilde character<br>
             * Value: ~ <br>
             * @const
             * @type {string}
             * @alias module:Constants#S_TILDE
             */
            S_TILDE: _tilde,

            /**
             * A single space character<br>
             * Value: " " <br>
             * @const
             * @type {string}
             * @alias module:Constants#S_TILDE
             */
            S_SPACE: _spc,

            /**
             * A dot, or period
             * Value: . <br>
             * @const
             * @type {string}
             * @alias module:Constants#S_SPACE
             */
            S_DOT: _dot,

            /**
             * An array of strings that are interpreted as 'true'<br>
             * when encountered in configuration contexts
             *
             * @const
             * @type {Array<string>}
             * @alias module:Constants#_affirmatives
             */
            _affirmatives,

            /**
             * The character sequence that indicates the beginning of block comment in source code<br>
             * @const
             * @type {string}
             * @alias module:Constants#_blockCommentStart
             */
            _blockCommentStart,

            /**
             * The character sequence that indicates the end of block comment in source code<br>
             * @const
             * @type {string}
             * @alias module:Constants#_blockCommentEnd
             */
            _blockCommentEnd,

            /**
             * The character sequence that indicates the start of an inline comment in source code<br>
             * @const
             * @type {string}
             * @alias module:Constants#_inlineCommentStart
             */
            _inlineCommentStart,

            /**
             * An object defining the usual file options to use for file read/write operations.<br>
             * @const
             * @type {Object}
             * @property {string} [encoding="utf-8"] Specifies the character encoding used, which is "utf-8".
             * @alias module:Constants#_fileOptions
             */
            _fileOptions: lock( { encoding: "utf-8" } ),

            /**
             * An immutable array with no elements
             * @const
             * @readonly
             * @type {Array<*>}
             * @alias module:Constants#EMPTY_ARRAY
             */
            EMPTY_ARRAY,

            /**
             * An immutable object with no properties
             * @const
             * @readonly
             * @type {Object}
             * @alias module:Constants#EMPTY_OBJECT
             */
            EMPTY_OBJECT,

            /**
             * An array of the JavaScript reserved words.
             * @const
             * @readonly
             * @type {Array<*>}
             * @alias module:Constants#RESERVED_WORDS
             */
            RESERVED_WORDS,

            /**
             * The constructor, and <i>Type</i>, for async functions.<br>
             * @const
             * @type {function}
             * @alias module:Constants#AsyncFunction
             */
            AsyncFunction: (async function() {}).constructor,

            /**
             * An array of all the currently defined/supported JavaScript TypedArray classes.<br>
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#TYPED_ARRAYS
             */
            TYPED_ARRAYS,

            /**
             * An array of strings corresponding to all the currently defined/supported JavaScript TypedArray classes.<br>
             * @const
             * @readonly
             * @type {Array<string>}
             * @alias module:Constants#TYPED_ARRAY_NAMES
             */
            TYPED_ARRAY_NAMES,

            /**
             * An array of a subset of the currently defined/supported JavaScript Error classes.<br>
             * <br>
             * These are the error types most likely to exist across execution environments
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#ERROR_TYPES
             */
            ERROR_TYPES,

            /**
             * An array of strings corresponding to the subset of JavaScript Error classes included in {@link ERROR_TYPES}.<br>
             * <br>
             * These are the error types most likely to exist across execution environments
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#ERROR_TYPE_NAMES
             */
            ERROR_TYPE_NAMES,

            /**
             * An array of the currently defined/supported JavaScript Objects that correspond to JavScript primitives.<br>
             * <br>
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#PRIMITIVE_WRAPPER_TYPES
             */
            PRIMITIVE_WRAPPER_TYPES,

            /**
             * An array of the currently defined/supported JavaScript classes, such as Date, RegExp, etc.<br>
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#GLOBAL_TYPES
             */
            GLOBAL_TYPES,

            /**
             * An array of the classes that can be serialized by structuredClone.<br>
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#SERIALIZABLE_TYPES
             */
            SERIALIZABLE_TYPES,

            /**
             * An array of strings corresponding to the subset of classes included in {@link GLOBAL_TYPES}.<br>
             * <br>
             * These are the error types most likely to exist across execution environments
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#GLOBAL_TYPE_NAMES
             */
            GLOBAL_TYPE_NAMES,

            /**
             * An array of all the elements of {@link TYPED_ARRAYS}, {@link ERROR_TYPES}, and {@link GLOBAL_TYPES}.<br>
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#BUILTIN_TYPES
             */
            BUILTIN_TYPES,

            /**
             * An array of strings corresponding to the elements in {@link BUILTIN_TYPES}.<br>
             * @const
             * @readonly
             * @type {Array<function>}
             * @alias module:Constants#BUILTIN_TYPE_NAMES
             */
            BUILTIN_TYPE_NAMES,

            _rxFunctionSignature,
            _rxFunction,
            _rxClass,

            /**
             * A regular expression that matches a block comment.<br>
             * @const
             * @type {RegExp}
             * @alias module:Constants#_rxHeaderComment
             */
            _rxHeaderComment,

            /**
             * A regular expression that matches a valid JSON string.<br>
             * @const
             * @type {RegExp}
             * @alias module:Constants#_rxValidJson
             */
            _rxValidJson,

            /**
             * A regular expression that matches the null-terminator character.<br>
             * @const
             * @type {RegExp}
             * @see {@link _z}
             * @alias module:Constants#_xZ
             */
            _xZ,

            /**
             * A regular expression that matches the null-terminator character at the end of a string.<br>
             * @const
             * @type {RegExp}
             * @see {@link _z}
             * @see {@link _xZ}
             * @alias module:Constants#_rxNullTerminator
             */
            _rxNullTerminator,

            /**
             * A regular expression that matches one or more semicolons at the end of a string.<br>
             * @const
             * @type {RegExp}
             * @alias module:Constants#_rxTerminalSemicolon
             */
            _rxTerminalSemicolon,

            /**
             * A regular expression that matches one or more newline characters at the end of a string.<br>
             * <br>
             * Note that this regular expression will match either
             * the Windows character sequence of \r\n or the unix character \n<br>
             * @const
             * @type {RegExp}
             * @alias module:Constants#_rxTrailingNewline
             */
            _rxTrailingNewline,

            /**
             * A regular expression that matches one or more newline characters at the start of a string.<br>
             * <br>
             * Note that this regular expression will match either
             * the Windows character sequence of \r\n or the unix character \n<br>
             * @const
             * @type {RegExp}
             * @alias module:Constants#_rxLeadingNewline
             */
            _rxLeadingNewline,

            /**
             * A regular expression that matches one or more whitespace characters at the start of a string.<br>
             * @const
             * @type {RegExp}
             * @alias module:Constants#_rxTrailingNewline
             */
            _rxLeadingWhitespace,

            /**
             * A regular expression that matches one or more whitespace characters at the end of a string.<br>
             * @const
             * @type {RegExp}
             * @alias module:Constants#_rxTrailingNewline
             */
            _rxTrailingWhitespace,

            /**
             * A regular expression that matches the character sequence often used as interpolation placeholders in template strings<br>
             * <br>
             * That is, this regular expression matches the ${foo} in the template `This is a ${foo} library`
             * @const
             * @type {RegExp}
             * @alias module:Constants#_rxVariableToken
             */
            _rxVariableToken,

            /**
             * This is the default limit for recursive functions
             * that cannot have a base-case to escape infinite execution
             *
             * @const
             * @type {number}
             *
             * @alias module:Constants#DEFAULT_MAX_STACK_DEPTH
             */
            DEFAULT_MAX_STACK_DEPTH,

            /**
             * An object whose properties are some common useful regular expressions.
             * @alias module:Constants#REG_EXP
             */
            REG_EXP,

            /**
             * This constant defines the default properties for
             * the decimal separator, grouping separator, and currency symbol (regular expression).
             * <br>
             * <br>
             * @alias module:Constants#DEFAULT_NUMBER_FORMATTING_SYMBOLS
             */
            DEFAULT_NUMBER_FORMATTING_SYMBOLS,

            /**
             * A function that does nothing.<br>
             * Useful when you want to pass a function to a method<br>
             * that might otherwise use some default behavior<br>
             * if no argument is provided
             *
             * @type {function}
             *
             * @alias module:Constants#no_op
             */
            no_op,

            /**
             * A function used in a 'catch' clause that does nothing.<br>
             * Useful when your IDE or linter would otherwise complain<br>
             * when you legitimately do not need to handle the error<br>
             *
             * @type {function}
             *
             * @alias module:Constants#ignore
             */
            ignore,

            op_true,

            op_false,

            op_identity,

            calculateNumberFormattingSymbols,

            clamp,

            /**
             * Returns the name or source for the specified Function<br>
             *
             * @type {function(function):string}
             * @param {function} pFunction The function whose name should be returned.<br>
             * If the function has no non-empty name property, the function's source code is returned<br>
             * @return the name or source of the specified Function<br>
             * @alias module:Constants#funcName
             */
            funcName,

            MESSAGES_LOCALE,

            NumberProperties
        };

    // makes the properties of mod available as properties and methods of the modulePrototype
    mod = modulePrototype.extend( mod );

    // Exports this module
    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
