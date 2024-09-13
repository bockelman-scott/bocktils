/**
 * Defines several useful constants and utility functions common to JavaScript applications.
 */

(function exposeConstants()
{
    // The typeof a variable that does not exist or has been declared without a default value
    const _ud = "undefined";

    /**
     * This function returns the globalThis for the environment in which the code is currently executing
     */
    const $scope = function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
    };

    const INTERNAL_NAME = "__BOCK__CONSTANTS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const operatingSystem = ("" + (require( "os" )?.platform)).toLowerCase();

    const isWindows = function( pOs ) { return ["windows", "win32", "windows_nt"].includes( pOs || operatingSystem ); };

    const EOL = isWindows( operatingSystem ) ? "\r\n" : "\n";

    const currentDirectory = (_ud !== typeof process) ? process.cwd() : ((_ud !== typeof __dirname) ? __dirname : ".");

    const DEFAULT_MAX_ITERATIONS = 1_000;

    const DEFAULT_MAX_STACK_DEPTH = 12;

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
            _eol = EOL,
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

            _rxLiteral = "/",
            _solidus = "/",
            _slash = "/",
            _reverse_solidus = "\\",
            _backslash = "\\",

            _pathSep = ((_ud === typeof process) ? _slash : isWindows() ? _backslash : _slash),
            _prevDir = (_dot + _dot + _pathSep),
            _thisDir = (_dot + _pathSep),

            _unixPathSep = _slash,
            _unixPrevDir = (_dot + _dot + _unixPathSep),
            _unixThisDir = (_dot + _unixPathSep),

            _blockCommentStart = "/*",
            _blockCommentEnd = "*/",
            _inlineCommentStart = "//",

            _rxHeaderComment = /^\/\*.*?\*\//s,
            _rxValidJson = /^([{\[])(.*)*([}\]])$/s,

            _xZ = /\u0000/,

            _rxTerminalSemicolon = /;+$/,
            _rxTrailingNewline = /\n+$/,
            _rxLeadingNewline = /^\n+/,
            _rxLeadingWhitespace = /^\s+/,
            _rxTrailingWhitespace = /\s+$/,

            _rxVariableToken = /\$\{\s*(\w+)\s*}/,

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

            BUILTIN_TYPES = [].concat( TYPED_ARRAYS ).concat( ERROR_TYPES ).concat( GLOBAL_TYPES ),

            TYPED_ARRAY_NAMES = ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float16Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"],

            ERROR_TYPE_NAMES = ["Error", "AggregateError", "RangeError", "ReferenceError", "SyntaxError", "URIError"],

            GLOBAL_TYPE_NAMES = ["Object", "Function", "String", "Number", "Boolean", "Array", "BigInt", "Date", "RegExp", "Symbol", "Math", "JSON", "Map", "Set", "Promise", "ArrayBuffer", "SharedArrayBuffer", "DataView", "WeakMap", "WeakRef", "WeakSet"],

            BUILTIN_TYPE_NAMES = [].concat( TYPED_ARRAY_NAMES ).concat( ERROR_TYPE_NAMES ).concat( GLOBAL_TYPE_NAMES ),

            /**
             * Strings that are interpreted as 'true' when encountered in JSON or other configuration contexts
             */
            _affirmatives = [].concat( ...([S_TRUE, "1", "on", S_ENABLED, "t", S_YES]) ),

            ignore = function() { },

            RESERVED_WORDS =
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
                 "with"]
        } = ($scope() || {});

    class IllegalArgumentError extends Error
    {
        constructor( pMessage, pOptions, pLineNumber )
        {
            super( pMessage, pOptions, pLineNumber );

            const options = _obj === typeof pOptions ? Object.assign( {}, pOptions || {} ) : { options: pOptions || __filename };

            this._options = Object.freeze( options );
        }

        get type()
        {
            return "IllegalArgumentException";
        }

        get message()
        {
            return this.type + ": " + super.message;
        }
    }

    /**
     * Returns a new Object whose properties and functions match those of the Object specified.
     * Use this to create a copy of some scope, such as global, self, or the current closure.
     * THIS FUNCTION WILL BIND FUNCTIONS TO THE NEW OBJECT
     * IF YOU WANT TO COPY THE FUNCTIONS INSTEAD. USE FunctionUtils.js copyScope INSTEAD
     *
     * @param pScope the object (or scope) whose properties and functions should be copied to the new object to be returned.
     *
     * @returns {Readonly<{}>} a new object with the same properties and functions defined in the specified scope
     */
    const copyScope = function( pScope )
    {
        let scope = pScope || $scope();

        let obj = { ...scope };

        obj = Object.assign( {}, scope );

        const entries = Object.entries( obj );

        let variables = {};

        entries.forEach( entry =>
                         {
                             let key = (entry?.length || 0) > 0 ? entry[0] : _mt_str;

                             let value = (entry?.length || 0) > 1 ? entry[1] : key;

                             if ( !(_ud === typeof value || null === value || _fun === typeof value || _symbol === typeof value) )
                             {
                                 if ( _str === typeof key && !(["global", "self", "window", "this", "me"].includes( key )) )
                                 {
                                     variables[key] = value;

                                     if ( _fun === typeof value )
                                     {
                                         value.bind( obj );
                                     }
                                 }
                             }
                         } );

        return Object.freeze( variables );
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
            _eol,
            _browser,
            _worker,
            _nodejs,
            _unknown,
            _pathSep,
            _thisDir,
            _prevDir,
            _unixPathSep,
            _unixThisDir,
            _unixPrevDir,
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
            GLOBAL_TYPE_NAMES,
            BUILTIN_TYPES,
            BUILTIN_TYPE_NAMES,
            IllegalArgumentError,
            copyScope,
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
            MAX_ITERATIONS: DEFAULT_MAX_ITERATIONS,
            MAX_STACK_DEPTH: DEFAULT_MAX_STACK_DEPTH,
            catchHandler: function( pErr )
            {
                return true;
            },
            dependencies
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
