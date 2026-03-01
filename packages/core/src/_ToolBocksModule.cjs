// noinspection JSCheckFunctionSignatures,JSUnresolvedReference

/**
 * @fileoverview
 * @name ToolBocksModule
 * @author Scott Bockelman
 * @license MIT
 *
 * <p>
 *     This module is the 'bootstrap' module for all modules
 *     in the <b>ToolBocks</b>&trade; packages.
 *     <br>
 * </p>
 * <br>
 * <p>
 *     This module defines the base class
 *     that all the other modules extend,
 *     <br>
 *     allowing their functions to report errors as events (instead of throwing),
 *     <br>
 *     and for consumer code to add event listeners for such errors
 *     and/or other 'interesting' events,
 *     <br>
 *     <br>
 *     You can also set either a global logger or per-module loggers,
 *     <br>
 *     which will write to the destination(s) of your choice
 *     when or if an error event is dispatched.
 *     <br>
 *     Some common loggers are available in the <i>@toolbocks/loggers</i> package(s).
 *     <br>
 * </p>
 * <br>
 * <p>
 *     Other useful functionality defined in the base module includes:
 *     <br>
 * <ul>
 * <li>
 *     the ability to detect (and escape) infinite recursion, or 'cycles',
 *     <br>
 *     across one or more function calls or within an object hierarchy
 *     <br>
 * </li>
 * <li>
 *     the ability to cap any iteration to a maximum number of loops,
 *     <br>
 *     regardless of the status of the loop condition
 *     <br>
 * </li>
 * <li>
 *     the ability to create "deep",
 *     and optionally immutable, copies of objects
 *     <br>
 * </li>
 * <li>
 *     and the ability to reliably merge options
 *     passed to functions that also have default options
 *     <br>
 * </li>
 * </ul>
 * </p>
 *
 * <br>
 *
 * <p>
 *     Other common functions exported with this module
 *     <br>
 *     include 4 variations of a function to <b>attempt</b> an operation.
 *     <br>
 *     <br>
 *     These functions provide a more concise way
 *     to execute code that might throw an error.
 *     <br>
 *     <br>
 *     Any errors that are encountered
 *     are handled internally by notifying event handlers.
 *     <br>
 *     <br>
 *     <br>
 *     The <b>objectEntries</b>, <b>objectKeys</b>, and <b>objectValues</b> functions
 *     <br>
 *     provide a common and concise way to get the properties of any object,
 *     <br>
 *     regardless of whether it is a Map, a Set, an object literal, an array,
 *     or an instance of a class with private properties.
 *     <br>
 *     <br>
 *     If a property has an accessor or is publicly accessible,
 *     it will be included in the collection.
 *     <br>
 *     <br>
 *     Likewise, <b>getProperty</b>, <b>setProperty</b>, and <b>hasProperty</b>
 *     <br>
 *     all provide the ability to access or modify any property
 *     that is not read-only.
 *     <br>
 *     <br>
 *     Finally, this module exports a number of useful classes,
 *     <br>
 *     for interrogating the runtime,
 *     creating custom events and custom errors,
 *     inspecting an error's stack trace (regardless of runtime),
 *     and supporting the "Gang of Four" Visitor pattern,
 *     as well as a few other helpful functions,
 *     many of which can also be imported from other core modules.
 *     <br>
 * </p>
 * <br>
 * @see ToolBocksModule
 * @see ToolBocksModuleEvent
 *
 * @see IllegalArgumentError
 * @see StackTrace
 *
 * @see IterationCap
 *
 * <br>
 */

/**
 * Indicates whether this module is running in debug mode.
 * When running in debug mode,
 * logging is more verbose and some type and/or null checks are more explicit and log unexpected conditions
 * @type {boolean} true to see more verbose logging and type checking messages
 */
let DEBUG_MODE = false;

// defines a variable for typeof undefined
const _ud = "undefined";

// define variables for stdout and stderr (in a node.js runtime)
const _bock_std_out = ((_ud !== typeof process) ? ((_ud !== typeof process.stdout) ? process.stdout : { write: () => null }) : { write: () => null });

// define variables for stdout and stderr (in a node.js runtime)
const _bock_std_err = ((_ud !== typeof process) ? ((_ud !== typeof process.stdout) ? process.stdout : { write: () => null }) : { write: () => null });

/**
 * This is a last resort 'logger' that writes directly to stdout or stderr if available
 * @param {WriteStream} pOut - the WriteStream (e.g., stdout or stderr) to which to write
 * @param {...*} pArgs one or more arguments to convert to strings and write to stderr or stdout
 * @private
 */
const _bock_write = ( pOut, ...pArgs ) =>
{
    try
    {
        let message = [...(pArgs || [])].filter( e => _ud !== typeof e && null !== e ).map( e => String( e ) ).join( ", " );

        let _out = (pOut && pOut.write) ? pOut : (_bock_std_out || _bock_std_err);

        if ( _out )
        {
            _out.write( message );
        }
        else
        {
            (_bock_std_out || _bock_std_err).write( message );
        }
    }
    catch( e )
    {
        // ignored
    }
};

/**
 * This is a 'stand-in' for the Console if it is absent.
 * It will attempt to write directly to stdout or stderr.
 * @type {{log: function(...[*]): void, info: function(...[*]): void, warn: function(...[*]): void, error: function(...[*]): void, debug: function(...[*]): void, trace: function(...[*]): void}}
 */
const mockConsole =
    {
        log: ( ...pArgs ) => _bock_write( _bock_std_out, ...pArgs ),
        info: ( ...pArgs ) => _bock_write( _bock_std_out, ...pArgs ),
        warn: ( ...pArgs ) => _bock_write( _bock_std_out, ...pArgs ),
        error: ( ...pArgs ) => _bock_write( _bock_std_err, ...pArgs ),
        debug: ( ...pArgs ) => _bock_write( _bock_std_out, ...pArgs ),
        trace: ( ...pArgs ) => _bock_write( _bock_std_out, ...pArgs )
    };

/**
 * An alias for the console object available in most environments.<br>
 * We create an alias for the console to reduce lint complaints.<br>
 * @type {ILogger|console|Console|{}}
 */
const konsole = _ud === typeof console ? mockConsole : (console || mockConsole);

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 * @return {Object} The global scope, a.k.a. globalThis, for the current execution environment
 */
const $scope = () => ((_ud === typeof globalThis) ? (_ud === typeof global ? (_ud === typeof self ? this : self ?? this) : global ?? this) : globalThis ?? this);

/**
 * ENV is an object that provides access to the application's environment variables.
 * <br>
 * <br>
 * Environment variables are found
 * based on the runtime context (Node.js, Deno, etc.)
 * <br>
 * <br>
 * In Node.js, the environment variables defined in `process.env` are returned.
 * <br>
 * <br>
 * In Deno, environment variables are retrieved using `Deno.env.toObject()`.
 * <br>
 * <br>
 * In other environments, if a scoped variable named `__BOCK_MODULE_ENVIRONMENT__`
 * <br>
 * can be found, it will be assumed to be an object literal of key/value pairs representing environment variables.
 * <br>
 * <br>
 * If no variables or objects are found, the default is to return an execution mode object (`{ "MODE": "DEV" }`).
 * <br>
 * <br>
 *
 * @type {Object}
 *
 * The object is populated using an IIFE (Immediately Invoked Function Expression)
 * that accepts one argument and returns the _ENV object.
 * <br>
 * <br>
 * @param {Object} [pScope=$scope()] - The global scope or an object that provides access
 *                                     to the environment information in the absence of the process or Deno objects.
 *
 * @returns {Object} An object containing the current environment variables.
 */
const _ENV = (function( pScope = $scope() )
{
    let scp = pScope || $scope();

    let environment = {};

    if ( _ud !== typeof process )
    {
        environment = process?.env;
    }
    else if ( _ud !== typeof Deno )
    {
        try
        {
            environment = Deno?.env?.toObject();
        }
        catch( ex )
        {
            (konsole || console).error( "Could not load environment", ex.message, ex );
        }
    }
    else
    {
        environment = ((scp || {})["__BOCK_MODULE_ENVIRONMENT__"]) || scp?.navigator || { "MODE": "DEV" };
    }

    return environment || {};
});

/**
 * This variable is dynamically populated based on the runtime environment.
 * <br>
 * The value is an array representing the command-line arguments passed to the application.
 * <br>
 * Arguments are aggregated based on the detected runtime environment, such as Node.js, Deno, or a browser or Worker.
 * <br>
 * <br>
 * - In a Node.js environment: `process.argv` is used.
 * <br>
 * <br>
 * - In a Deno environment: `Deno.args` is used,
 * <br>
 * <br>
 * Otherwise, the value is an empty array.
 * <br>
 *
 * @type {Array.<string>}
 */
const CMD_LINE_ARGS = [...(_ud !== typeof process ? process?.argv || [] : (_ud !== typeof Deno ? Deno?.args || [] : []))];

// noinspection OverlyNestedFunctionJS,FunctionTooLongJS,OverlyComplexFunctionJS
/**
 * This module is constructed by an Immediately Invoked Function Expression (IIFE).
 * see: <a href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE">MDN: IIFE</a> for more information on this design pattern
 */
(function exposeModule( pEnvironment = (_ENV || {}), ...pArgs )
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__MODULE_BASE_MODULE__";

    // defines the key under which we store a Module cache
    const MODULE_CACHE_GLOBAL_KEY = "__BOCK_MODULE_CACHE__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * This is a cache of constructed and loaded modules.<br>
     * @type {Object}
     * @dict
     */
    let MODULE_CACHE = $scope[MODULE_CACHE_GLOBAL_KEY] || {};

    // store the MODULE_CACHE in the global scope
    $scope[MODULE_CACHE_GLOBAL_KEY] = $scope[MODULE_CACHE_GLOBAL_KEY] || MODULE_CACHE;
    MODULE_CACHE = $scope[MODULE_CACHE_GLOBAL_KEY] || MODULE_CACHE || {};

    // if this module already exists in our MODULE_CACHE,
    // we return it (instead of re-executing the code to create it)
    if ( MODULE_CACHE && null != MODULE_CACHE[INTERNAL_NAME] )
    {
        return MODULE_CACHE[INTERNAL_NAME];
    }

    /* This is the internal name of this module; it is exported as ToolBocksModule */
    const modName = "ToolBocksModule";

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import a leaf module
     * and then use the other utilities as properties of that module.
     * <br><br>
     * This is the only module that has NO DEPENDENCIES
     * <br>
     * @dict
     * @type {Object}
     */
    const dependencies =
        {
            // this module has no dependencies
        };

    /*
     * Defines some useful constants we need before loading the Constants module
     * We define these using a 'fake' destructuring with default values to reduce verbosity
     * and to save memory in the internal String table
     */
    const
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

            _mt_str = "",
            _mt = _mt_str,
            _mt_chr = "",
            _spc = " ",
            _dot = ".",
            _comma = ",",
            _underscore = "_",
            _colon = ":",
            _asterisk = "*",
            _unknown = "Unknown",

            S_NONE = "none",
            S_LOG = "log",
            S_ERROR = "error",
            S_WARN = "warn",
            S_INFO = "info",
            S_DEBUG = "debug",
            S_TRACE = "trace",

            S_CUSTOM = "custom",

            S_ERR_PREFIX = `An ${S_ERROR} occurred`,
            S_DEFAULT_OPERATION = "The script encountered an unexpected condition",

            EMPTY_OBJECT = Object.freeze( {} ),
            EMPTY_ARRAY = Object.freeze( [] ),

            AsyncFunction = (async function() {}).constructor

        } = (dependencies || {});

    const DEFAULT_LOCALE_STRING = "en-US";

    const ENDIAN =
        {
            BIG: "big",
            LITTLE: "little"
        };

    /**
     * Alias for Object.freeze
     */
    const freeze = Object.freeze;

    /**
     * An alias for the native Function.prototype.toString method.<br>
     * This function returns the string representation of a specified function.<br>
     * This is normally the source code of the function.<br>
     *
     * @returns {string} the string representation of a specified function
     */
    const functionToString = Function.prototype.toString;

    /**
     * An alias for the Object.prototype.toString method.<br>
     * <br>
     * Normally returns a string representing the object type of the given value.<br>
     * Typically used to determine the internal class of an object
     * by extracting the string from its output, such as `[object <i>Type</i]`.
     *
     * @returns {string} a string representing the object type of the given value
     */
    const objectToString = Object.prototype.toString;

    /**
     * An alais for the Error.prototype.toString method.<br>
     * <br>
     *
     * @returns {string} a string representing the error specified (usually the error type and message)
     */
    const errorToString = Error.prototype.toString;


    /**
     * A constant array of the standard JavaScript error types.<br>
     * <br>
     * This array contains the constructors for the basic built-in error types in JavaScript.<br>
     * <br>
     */
    const ERROR_TYPES = [Error, AggregateError, RangeError, ReferenceError, SyntaxError, URIError];

    /**
     * A constant array of the prototype instances of each Error Type
     * @type {unknown[]}
     */
    const ERROR_PROTOTYPES = ERROR_TYPES.map( e => e.prototype || Object.getPrototypeOf( e ) ).filter( e => null !== e && e !== Object );

    /**
     * A constant array of the names (strings) of the basic error Types
     * @type {Array.<String>}
     */
    const ERROR_TYPE_NAMES = ERROR_TYPES.map( e => e.name || functionToString.call( e ) );


    /**
     * A constant array of the standard JavaScript primitive wrapper types.<br>
     * <br>
     * <br>
     * This array includes:<br>
     * - String: The wrapper for the string primitive type.<br>
     * - Number: The wrapper for the number primitive type.<br>
     * - Boolean: The wrapper for the boolean primitive type.<br>
     * - BigInt: The wrapper for the bigint primitive type.<br>
     * <br>
     * <br>
     * Note: JavaScript wrapper types are distinct from their primitive values.<br>
     * The typeof a JavaScript wrapper is "object", rather than the primitive type it "boxes", or wraps.
     */
    const PRIMITIVE_WRAPPER_TYPES = [String, Number, Boolean, BigInt];

    /**
     * A constant array of the prototype instances of the standard JavaScript primitive wrapper types.
     */
    const PRIMITIVE_WRAPPER_PROTOTYPES = PRIMITIVE_WRAPPER_TYPES.map( e => e.prototype || Object.getPrototypeOf( e ) ).filter( e => null !== e && e !== Object );

    /**
     * A constant array of the name (strings) of the standard JavaScript primitive wrapper types.
     */
    const PRIMITIVE_WRAPPER_TYPE_NAMES = PRIMITIVE_WRAPPER_TYPES.map( e => e.name || functionToString.call( e ) );


    /**
     * GLOBAL_TYPES is an array containing all standard JavaScript global object types and structures
     * expected to exist in any execution context.<br>
     * <br>
     * The purpose of this array is to provide a comprehensive list of global types
     * that can be iterated or evaluated for type validation.<br>
     * <br>
     *
     * The array includes:<br>
     * - Array<br>
     * - Function<br>
     * - Date<br>
     * - RegExp<br>
     * - Symbol<br>
     * - Map<br>
     * - Set<br>
     * - Promise<br>
     * - ArrayBuffer<br>
     * - DataView<br>
     * - WeakMap<br>
     * - WeakRef<br>
     * - WeakSet<br>
     * <br>
     * as well as the contents of `ERROR_TYPES` and `PRIMITIVE_WRAPPER_TYPES`
     *
     */
    const GLOBAL_TYPES = [Array, Function, Date, RegExp, Symbol, Map, Set, Promise, ArrayBuffer, DataView, WeakMap, WeakRef, WeakSet, ...ERROR_TYPES, ...PRIMITIVE_WRAPPER_TYPES];

    const GLOBAL_TYPE_PROTOTYPES = GLOBAL_TYPES.map( e => e.prototype || Object.getPrototypeOf( e ) ).filter( e => null !== e && e !== Object );

    const GLOBAL_TYPE_NAMES = GLOBAL_TYPES.map( e => e.name || functionToString.call( e ) );

    const TYPED_ARRAYS = freeze( [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array] );

    /**
     * A constant array of the property names of properties that should not be serialized or persisted
     */
    const TRANSIENT_PROPERTIES = freeze( ["constructor", "prototype", "isPrototypeOf", "__proto__", "hasOwnProperty", "propertyIsEnumerable", "toJson", "toObject", "toString", "toLocaleString", "valueOf", "global", "this", "toString", "class", "lastAccessed"] );

    /**
     * A constant string representing the default error message.<br>
     * It is constructed by joining `S_ERR_PREFIX` and `S_DEFAULT_OPERATION` with a space.<br>
     * This value can be used to represent a generic or default error message across an application.<br>
     */
    const S_DEFAULT_ERROR_MESSAGE = [S_ERR_PREFIX, S_DEFAULT_OPERATION].join( _spc );

    /**
     * A constant string representing the default error message
     * used when a call to the function, attempt or asyncAttempt, fail.
     * <br>
     *
     */
    const ATTEMPT_FAILED = [S_ERR_PREFIX, "attempting to execute the specified function, "].join( _spc );

    /**
     * A constant string representing the default error message
     * used when the value passed to the function, attempt or asyncAttempt, is not a function.
     * <br>
     */
    const NOT_A_FUNCTION = "The specified value is not a function";

    /**
     * This is a function that just does nothing.<br>
     * This is useful when you need a default or placeholder
     * for a missing argument or expected function.<br>
     * <br>
     * Note that this function returns itself,
     * so if you need a function that returns false or no value,
     * use op_false.<br>
     * <br>
     */
    const no_op = () => { return no_op; };

    /**
     * A function that always returns the boolean value, true.
     *
     * This function does not accept any arguments and is designed to return true
     * unconditionally.
     *
     * Commonly used as a utility in scenarios where a function
     * that always evaluates to true is required.
     *
     * @function
     * @returns {boolean} Returns the boolean value, true.
     */
    const op_true = () => true;

    /**
     * A function that always returns the boolean value, false.
     *
     * This function does not accept any arguments and is designed to return false
     * unconditionally.
     *
     * Commonly used as a utility in scenarios where a function
     * that always evaluates to false is required.
     *
     * @function
     *
     * @returns {boolean} Returns the boolean value, false.
     */
    const op_false = () => false;

    /**
     * Returns the specified argument(s) as-is
     * or as an array when multiple values are passed.<br>
     * <br>
     * If no arguments are passed, returns an empty array.<br>
     *
     * @param {...*} pArg - The argument(s) to return.
     * @returns {*} The argument specified or an array containing all arguments if multiple values are passed.<br>
     * If no arguments are passed, returns an empty array.<br>
     */
    const op_identity = ( ...pArg ) => [...(pArg || [])].length > 1 ? [...(pArg || [])] : [...(pArg || [])][0];

    /**
     * Enables DEBUG_MODE if it is not already enabled by checking the environment and command line arguments
     * Note that DEBUG_MODE can only ever be turned on during execution.  It cannot be subsequently disabled.
     * @returns {boolean}
     */
    function configureDebugMode()
    {
        if ( !DEBUG_MODE )
        {
            const _environs = pEnvironment || _ENV || { "get": function( pKey ) { return $scope()[pKey]; } };

            DEBUG_MODE = DEBUG_MODE || (_fun === typeof (_environs?.get)) ? ["true", "1", S_DEBUG, S_TRACE, true].includes( _environs?.get( S_DEBUG ) ) : ["true", "1", S_DEBUG, S_TRACE, true].includes( _environs?.[S_DEBUG] );

            DEBUG_MODE = DEBUG_MODE || [...(pArgs || CMD_LINE_ARGS || [])].includes( "-debug" );
        }
        return DEBUG_MODE;
    }

    // enabled DEBUG_MODE if it is not already enabled
    DEBUG_MODE = DEBUG_MODE || configureDebugMode();

    /**
     * @typedef {Object} ILogger
     * @property {function(...*)} log A function that takes one or more arguments and 'logs' them with log level, 'log'
     * @property {function(...*)} info A function that takes one or more arguments and 'logs' them with log level, 'info'
     * @property {function(...*)} warn A function that takes one or more arguments and 'logs' them with log level, 'warn'
     * @property {function(...*)} debug A function that takes one or more arguments and 'logs' them with log level, 'debug'
     * @property {function(...*)} error A function that takes one or more arguments and 'logs' them with log level, 'error'
     */

    /**
     * Used as an 'interface' (or more technically, an Abstract Class).
     * By extending EventTarget, this class and its subclasses
     * can behave as listeners (for error events for example)
     * and/or dispatch events instead of writing messages to a specific destination
     *
     * @class
     */
    class ILogger extends EventTarget
    {
        constructor()
        {
            super();
        }

        log( ...pData ) {};

        info( ...pData ) {};

        warn( ...pData ) {};

        debug( ...pData ) {};

        error( ...pData ) {};

        trace( ...pData ) {};
    }

    /**
     * Returns true if the specified value is a subclasses of ILogger
     * or implements the 5 required methods (treating 'trace' as optional)
     * expected of any logger, (log, info, warn, error, and debug)
     *
     * @param {*} pObj the value to evaluate, expected to be an object that implements the 5 required methods:log, info, warn, error, and debug
     *
     * @returns {boolean} true if the object can be used as a logger
     */
    ILogger.isLogger = function( pObj )
    {
        if ( _ud !== typeof pObj && _obj === typeof pObj && null !== pObj )
        {
            if ( pObj instanceof ILogger || console === pObj || konsole === pObj )
            {
                return true;
            }

            return (_fun === typeof pObj.log) &&
                   (_fun === typeof pObj.info) &&
                   (_fun === typeof pObj.warn) &&
                   (_fun === typeof pObj.error) &&
                   (_fun === typeof pObj.debug);
        }

        return false;
    };

    /**
     * Defines a logger that implements the expected methods but does not do anything.<br>
     * This is used when logging is disabled<br>
     * which might be desirable if consumers prefer to handle errors via event listeners instead.<br>
     * @type {ILogger}
     */
    let MockLogger = new ILogger();

    // we add a property indicating that this logger does not actually do anything
    // noinspection JSUndefinedPropertyAssignment
    MockLogger.mocked = true;

    // we also prevent this 'logger' from being modified
    // noinspection JSUnusedAssignment
    MockLogger = Object.freeze( Object.seal( MockLogger ) );

    /*
     * The following functions are used only in this base module,
     * because more sophisticated functions to detect and convert types
     * are exposed in a separate TypeUtils module.
     *
     * * External code should prefer those functions over these rudimentary checks. *
     *
     * Developers might be tempted to use node:util.
     * This is totally acceptable if the code is never expected to run on any other platform or runtime.
     * The ToolBocks utilities attempt to remain isomorphic and environment-agnostic where plausible.
     */

    /**
     * Returns true if the specified value is undefined.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is undefined.
     */
    const isUndefined = pObj => _ud === typeof pObj || undefined === pObj;

    /**
     * Returns true if the specified value is null or undefined.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is null or undefined.
     */
    const isNull = pObj => _ud === typeof pObj || null === pObj;

    /**
     * Returns true if the specified value is a string.<br>
     * This will return true even if the string is an empty string.<br>
     * To check for a non-empty string, use _isValidStr
     * or the TypeUtils module's isEmpty or isBlank
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a string.
     */
    const isStr = pObj => _str === typeof pObj || pObj instanceof String;

    /**
     * Returns true if the specified value is a string with one or more non-whitespace characters.
     *
     * @param {*} e The value to evaluate
     *
     * @returns {boolean} true if the specified value is a string with one or more non-whitespace characters.
     */
    const _isValidStr = e => isStr( e ) && (_mt_str !== String( e ).trim());

    /**
     * Returns true if the specified value is a function.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a function.
     */
    const isFunc = pObj => _fun === typeof pObj || pObj instanceof Function;

    /**
     * Returns true if the specified value is an object.<br>
     * Note that null *is* an object.<br>
     * To discover only a non-null object, use isNonNullObj<br>
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is an object.
     */
    const isObj = pObj => _obj === typeof pObj;

    /**
     * Returns true if the specified argument is an array.<br>
     * Some ancient environments did not define an isArray method on the built-in Array class,
     * so we define our own for safety.<br>
     * @param {*} pObject A value to evaluate
     * @returns {boolean} true if the specified argument is an array
     */
    let isArray = ( pObject ) =>
    {
        if ( isFunc( Array.isArray ) )
        {
            // rewrite the function if the environment defines Array.isArray
            isArray = ( pObject ) => (_ud !== typeof pObject) && Array.isArray( pObject );
            return !isNull( pObject ) && Array.isArray( pObject );
        }
        return !isNull( pObject ) && ((isFunc( Array.isArray ) && Array.isArray( pObject )) || objectToString.call( pObject ) === "[object Array]");
    };

    const _asArr = ( pArr ) => isNull( pArr ) ? [] : (isArray( pArr ) ? pArr : !isNull( pArr?.[Symbol.iterator] ) ? [...(pArr || [])] : [pArr]);

    /**
     * Returns true if the specified value is a (primitive) BigInt.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a (primitive) BigInt.
     */
    const isBig = pObj => _big === typeof pObj;

    /**
     * Returns true if the specified value is a (primitive) number.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a (primitive) number.
     */
    const isNum = pObj => isBig( pObj ) || (_num === typeof pObj && !isNaN( pObj ) && isFinite( pObj ));

    /**
     * Returns true if the specified value is a number or string representing a number.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value can be used as a number.
     */
    const isNumeric = pObj => isNum( pObj ) || ((isStr( pObj ) && /[0-9.-]/.test( pObj )) && !isNaN( attempt( () => parseFloat( pObj ) ) ));

    /**
     * Returns true if the specified value is a (primitive) boolean.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a (primitive) boolean.
     */
    const isBool = pObj => _bool === typeof pObj;

    /**
     * Returns true if the specified value is a Symbol.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a Symbol.
     */
    const isSymbol = pObj => _symbol === typeof pObj;

    /**
     * Returns true if the specified value is a Date.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a Date.
     */
    const isDate = pObj => !isNull( pObj ) && isObj( pObj ) && (pObj instanceof Date || pObj?.constructor === Date || objectToString.call( pObj || {} ) === "[object Date]");

    /**
     * Returns true if the specified value is a RegExp (regular expression object).
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a RegExp (regular expression object).
     */
    const isRegExp = pObj => !isNull( pObj ) && isObj( pObj ) && pObj instanceof RegExp;

    /**
     * Returns true if the specified value is an Error (or a subclass of Error).
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is an Error (or a subclass of Error).
     */
    const isError = Error.isError || (( pObj ) => isObj( pObj ) && pObj instanceof Error);

    /**
     * Returns true if the specified value is an instance of Map or a subclass of Map.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is an instance of Map or a subclass of Map.
     */
    const isMap = pObj => isObj( pObj ) && pObj instanceof Map;

    /**
     * Returns true if the specified value is an instance of Set or a subclass of Set
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is an instance of Set or a subclass of Set.
     */
    const isSet = pObj => isObj( pObj ) && pObj instanceof Set;

    /**
     * Returns true if the specified value is an object <i>and is not null<i>.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is an object <i>and is not null<i>.
     */
    const isNonNullObj = pObj => isObj( pObj ) && !isNull( pObj );

    /**
     * Returns true if the specified value is null or not an object.
     * This is the inverse of isNonNullObj.
     * @param pObj
     * @returns {boolean}
     */
    const isInvalidObj = pObj => !isNonNullObj( pObj );

    /**
     * Returns true if the specified value is of a primitive type (that is, not an object or function).
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is of a primitive type (that is, not an object or function).
     */
    const isPrimitive = pObj => !isObj( pObj ) && (isStr( pObj ) || isNum( pObj ) || isBool( pObj ) || isBig( pObj ) || isSymbol( pObj ));

    /**
     * Returns true if the specified value is a JavaScript class.<br>
     * This is done by checking that the value is a function,
     * and that its source starts with the word, "class" <br>
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a JavaScript class.
     */
    const isClass = pObj => isFunc( pObj ) && (/^class\s/.test( (functionToString.call( pObj, pObj )).trim() ));

    /**
     * Returns true if the specified value is an instance of a class.
     *
     * The criteria for a value to be considered an instance of a class
     * is that the value is on Object, is non-null, not a plain object literal,
     * and has a constructor function in its prototype chain associated with a user-defined class.
     *
     * @function
     * @param {*} pObj - The value to be evaluated.
     * @returns {boolean} Returns true if the specified value appears to be a class instance; otherwise, false.
     */
    const isClassInstance = pObj => isNonNullObj( pObj ) && isClass( pObj?.constructor || Object.getPrototypeOf( pObj )?.constructor );

    /**
     * Returns true if the specified value is a "boxed" primitive.
     * For example, if the value is an instance of String,
     * this function returns true because String is the "boxed" version of a string.
     *
     * This is one of the 'uglier' parts of JavaScript, owing its lineage to Java.
     * Arguably, there legitimate use cases
     * for distinguishing between primitives and object wrapping those primitives,
     * but these are rare enough that the languages should have left the wrapping or boxing of primitives up the the developers
     * (IMHO)
     *
     * @param {*} pObj the value to evaluate
     * @returns {boolean} true if the specified object is the 'wrapper' or 'boxed' version of a primitive scalar
     */
    const isPrimitiveWrapper = pObj => isObj( pObj ) && (PRIMITIVE_WRAPPER_TYPES.some( e => pObj instanceof e ));

    /**
     * Returns true if the specified value is an object that is not null
     * and is an instance of one of the values in the GLOBAL_TYPES array.<br>
     * <br>
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is an instance of a globally defined/built-in type.
     */
    const isGlobalType = pObj => isNonNullObj( pObj ) &&
                                 (([...GLOBAL_TYPES].some( e => pObj instanceof e )) ||
                                  GLOBAL_TYPES.includes( Object.getPrototypeOf( pObj )?.constructor || pObj?.constructor ));

    /**
     * Returns true if the specified value is an asynchronous function.
     *
     * @function
     * @param {any} pObject - The value to be evaluated.
     * @returns {boolean} true if the value is an asynchronous function, otherwise false.
     */
    const isAsyncFunction = function( pObject )
    {
        return isFunc( pObject ) && (pObject.constructor === AsyncFunction || pObject === AsyncFunction);
    };

    /**
     * Returns true if the specified value is a Promise.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a Promise.
     */
    const isPromise = pObj => isObj( pObj ) && pObj instanceof Promise;

    /**
     * Returns true if the specified value is '<i>thenable</i>'.<br>
     * That is, that the value is either a Promise or an object that defines a function named 'then'<br>
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is '<i>thenable</i>'.
     */
    const isThenable = pObj => !isNull( pObj ) && isObj( pObj ) && (isPromise( pObj ) || isFunc( pObj.then ));

    /**
     * Returns true if the specified value is immutable.<br>
     * <br>
     * Examples of immutable values include:<br>
     * <ul>
     * <li>Objects that are frozen or sealed</li>
     * <li>Properties of Objects that are defined as writable:false</li>
     * <li>Strings, Numbers, Booleans, and Symbols<li>
     * <li>null values, undefined values</li>
     * </ul>
     * <br>
     * @param {*} pObject Any object or value that might be immutable
     * @returns {boolean} true if the specified value is immutable
     */
    const isReadOnly = ( pObject ) => !isObj( pObject ) || (isNull( pObject ) || Object.isFrozen( pObject ) || Object.isSealed( pObject ));

    /**
     * Returns true if the specified value is a WeakSet, WeakMap, or WeakRef
     * @param pObj
     */
    const isWeak = ( pObj ) => !isNull( pObj ) && isObj( pObj ) && (pObj instanceof WeakRef || pObj instanceof WeakSet || pObj instanceof WeakMap);

    /**
     * Returns true if the specified object is a WeakRef
     * @param pObj
     */
    const isRef = ( pObj ) => isWeak( pObj ) && pObj instanceof WeakRef;

    /**
     * Dereferences an object or returns a default value based on the provided type.
     *
     * This function checks whether the input object is a WeakRef (using `isRef`).
     * If so, it attempts to dereference it.
     *
     * If the dereferenced value or the input itself is not null, that value is returned.
     * Otherwise, the function generates a value or object based on the specified type.
     *
     * If the type is a string, the function calculates the return value
     * based on the pre-defined string types like `_str`, `_num`, `_bool`, etc.
     *
     * For certain types like arrays or objects, empty constructs are returned.
     *
     * If the type is a constructor function,
     * the function attempts to create a new instance of that type,
     * falling back to a default object for failure cases.
     *
     * If the type is an array or object, the function creates and returns a new copy of it.
     *
     * @param {*} pObj - The input object to be dereferenced or returned based on the input and specified expected type.
     *
     * @param {*} [pType=Object] - The type expected to be returned,
     *                             used to determine the return value when the referenced value is null
     *                             or the input object is null.
     *
     *                             This can be a string, constructor function, array, or object.
     *
     * @returns {*} The dereferenced value or a default value based on the specified expected type.
     */
    const dereference = ( pObj, pType = Object ) =>
    {
        let target = ( !isNull( pObj ) && isRef( pObj )) ? (pObj.deref() ?? null) : pObj;

        if ( !isNull( target ) )
        {
            return target;
        }

        if ( !isNull( pType ) )
        {
            if ( isStr( pType ) )
            {
                switch ( _asStr( pType ) )
                {
                    case _str:
                        return _mt_str;

                    case _num:
                    case _big:
                        return 0;

                    case _bool:
                        return false;

                    case _symbol:
                        return Symbol.for( "~~no_value~~" );

                    case _fun:
                        return no_op.bind( {} );

                    case _obj:
                        return {};

                    case "Array":
                    case "array":
                    case "arr":
                        return [];

                    default:
                        return {};
                }
            }
            else if ( isFunc( pType ) )
            {
                if ( Array === pType )
                {
                    return [];
                }
                else if ( Object === pType )
                {
                    return {};
                }
                else if ( Date === pType )
                {
                    return new Date( 0 );
                }
                else if ( RegExp === pType )
                {
                    return /.*/g;
                }
                else if ( Number === pType )
                {
                    return 0;
                }
                else if ( String === pType )
                {
                    return _mt_str;
                }
                else
                {
                    try
                    {
                        return new pType( pObj );
                    }
                    catch( ex )
                    {
                        try
                        {
                            return pType.call( pObj );
                        }
                        catch( ex2 )
                        {

                        }
                        return {};
                    }
                }
            }
            else
            {
                if ( isArray( pType ) )
                {
                    return [...pType];
                }
                if ( isObj( pType ) )
                {
                    return { ...(pObj ?? {}) };
                }
            }
        }

        return target;
    };

    /**
     * Returns true if the execution context is <i>most likely</i> Node.js<br>
     * by checking for the existence of<br>
     * a global 'module' property,<br>
     * a global function named 'require'<br>
     * and the absence of globally defined symbols for 'self', 'window', and 'Deno'
     *
     * @function
     * @returns {boolean} true if the execution context is <i>most likely</i> Node.js
     */
    let isNodeJs = () =>
    {
        if ( (_ud === typeof self) && (_ud === typeof window) && (_ud !== typeof module) && (isFunc( require )) )
        {
            if ( _ud === typeof Deno && (_ud !== typeof process) )
            {
                const is = !isAsyncFunction( require );
                isNodeJs = () => is;
                return is;
            }
        }
        return false;
    };

    /**
     * Returns true if the current runtime environment is Deno.
     *
     * This function determines if the execution environment is Deno by verifying
     * that it is not running in a Node.js environment and by checking for the existence
     * of the `Deno` global object.
     *
     * @function
     * @returns {boolean} Returns true if the runtime environment is Deno, otherwise false.
     */
    const isDeno = () => !isNodeJs() && (_ud !== typeof Deno);

    /**
     * Returns true if the current execution content is a Worker or ServiceWorker.<br>
     *
     * @returns true if the current execution content is a Worker or ServiceWorker.
     */
    const isWorker = function()
    {
        // @TODO
    };

    /**
     * Returns true if the current execution environment is a web browser.<br>
     *
     * @function
     * @returns true if the current execution environment is a web browser.<br>
     */
    const isBrowser = () => ( !isNodeJs() && !isDeno() && (_ud !== typeof window) && (_ud !== typeof document) && (_ud !== typeof navigator));

    /**
     * Returns the value of the length or size property of the specified value.
     *
     * By default, will return the value of this property
     * from anything passed that has either a length or value property.
     *
     * If called with 2 arguments, the second argument is a boolean
     * indicating that the function should only return >= 0
     * if the specified value is an array, a set, a map, a function, or a string
     *
     * @param pVal
     * @param pStrict
     *
     * @returns {number}
     */
    const $ln = ( pVal, pStrict = false ) => !pStrict ? parseInt( pVal?.length || pVal?.size || 0 ) : (isArray( pVal ) || isSet( pVal ) || isStr( pVal ) || isMap( pVal ) || isFunc( pVal )) ? parseInt( pVal?.length || pVal?.size || 0 ) : -1;

    /**
     * Converts the input into a string representation.
     * If the input is already a string, it is returned as-is.
     *
     * @function
     * @param {*} e - The input value to be converted to a string.
     * @returns {string} The string representation of the input.
     */
    const _asStr = e => isStr( e ) ? String( e ) : (isFunc( e?.valueOf ) ? String( e.valueOf() ) : String( (_mt_str + String( e )) ));

    const _trim = s => (_asStr( s )).replace( /^\s+/, _mt ).replace( /\s+$/, _mt ).trim();

    /**
     * Converts the input value to a lowercase string
     *
     * The provided value is first cast to a string using the `_asStr` function
     * and then converted to lowercase.
     *
     * @param {*} e - The input value to be transformed to lowercase.
     * @returns {string} - The lowercase string representation of the input value.
     */
    const _lcase = e => _asStr( e ).toLowerCase();

    /**
     * Converts the input value to all uppercase.
     *
     * The provided value is first cast to a string using the `_asStr` function
     * and then converted to lowercase.
     *
     * @param {any} e - The input value to be transformed to uppercase.
     * @returns {string} The uppercase string representation of the input value.
     */
    const _ucase = e => _asStr( e ).toUpperCase();

    const _lct = e => _lcase( _trim( e ) ).trim();
    const _uct = e => _ucase( _trim( e ) ).trim();

    /**
     * Replaces all occurrences of whitespace in a given string with a specified character.
     *
     * @param {string} pStr - The string potentially containing whitespace characters to be replaced
     * @param {string} [pChar=_underscore] - The character with which to replace whitespace.
     *                                       Defaults to an underscore (_)
     * @returns {string} A new string with all whitespace replaced by the specified character.
     */
    const _spcToChar = ( pStr, pChar = _underscore ) => _asStr( pStr ).replaceAll( /\s+/g, (isStr( pChar ) ? pChar || _underscore : _underscore) );

    /**
     * Returns the integer value of the specified argument, if possible.
     * Returns 0 if the argument cannot be parsed as a number or results in NaN or Infinity (or -Infinity)
     *
     * @param pVal
     * @returns {number|*}
     * @private
     */
    const _asInt = ( pVal ) =>
    {
        if ( pVal && isNumeric( pVal ) )
        {
            let val = attempt( () => parseInt( pVal ) );
            if ( isNum( val ) && !(isNaN( val ) || !isFinite( val )) )
            {
                return val;
            }
        }
        return 0;
    };

    /**
     * Returns the float (or double) decimal value of the specified argument, if possible.
     * Returns 0.0 if the argument cannot be parsed as a number or results in NaN or Infinity (or -Infinity)
     *
     * @param pVal
     * @returns {number|*}
     * @private
     */
    const _asFloat = ( pVal ) =>
    {
        if ( pVal && isNumeric( pVal ) )
        {
            let val = attempt( () => parseFloat( pVal ) );
            if ( isNum( val ) )
            {
                return val;
            }
        }
        return 0.0;
    };

    /**
     * Returns the Nth element of a collection,
     * the Nth character of a string,
     * or the Nth property of an object (ordering of properties is not guaranteed)
     *
     * @param {Array|String|Map|Set|Object|*} pArr the value whose length or size should be returned
     * @param {number} pIdx the index of the element, character, or property to return
     */
    const $nth = ( pArr, pIdx = 0 ) =>
    {
        const arr = (isArray( pArr ) || (_str === typeof pArr)) ? pArr : (isFunc( pArr[Symbol.iterator] ) ? [...(pArr || [])] : isObj( pArr ) ? Object.values( pArr ) : [pArr]);

        const length = $ln( arr );

        let idx = _asInt( pIdx );

        idx = idx < 0 ? (length + idx) : idx;

        return (idx < length ? arr[idx] : undefined);
    };

    /**
     * Returns the last element, last character, or last property (ording not garanteed)
     * of the specific array, Set, Map, string, or object
     * @param pArr
     */
    const $last = ( pArr ) =>
    {
        return $nth( pArr, -1 );
    };

    /**
     * Returns a value not less than a minimum value and not greater than a maximum value.<br>
     * <br>
     * This is just shorthand for: <i>Math.min( Math.max( pNum, pMin ), pMax )</i><br>
     * <br>
     * If the specified value is a number within the range<br>
     * defined by the minimum and maximum values,<br>
     * that value is returned.<br>
     * <br>
     * If the specified value is a number less than the minium value,<br>
     * the minimum value is returned.<br>
     * <br>
     * If the specified value is a number greater than the maximum value,<br>
     * the maximum value is returned.<br>
     * <br>
     * If the specified value is not a number, that value is returned unchanged.<br>
     *
     * @param {number} pNum - The number to be clamped.
     * @param {number} pMin - The inclusive minimum boundary.
     * @param {number} pMax - The inclusive maximum boundary.
     *
     * @returns {number} A number within the specified range, or the original value if it's not a number.
     */
    const clamp = ( pNum, pMin, pMax ) => isNum( pNum ) ? Math.min( Math.max( pNum, pMin ), pMax ) : pNum;

    /**
     * Rounds a number to the nearest specified multiple.
     *
     * @param {number} pNum The number to be rounded. Can be positive, negative, or zero.
     * @param {number} pMultiple The multiple to round to (e.g., 4, 5, 8, 10, 16, 32, 50, 100).
     * Must be a non-zero number.
     * @returns {number} The rounded number, or the original number if 'multiple' is zero.
     */
    function roundToNearestMultiple( pNum, pMultiple )
    {
        let num = _asFloat( pNum );

        let multiple = _asFloat( pMultiple );

        if ( 0 === multiple )
        {
            return num;
        }

        return Math.round( pNum / pMultiple ) * pMultiple;
    }

    /**
     * Returns the percentage the value provided as 'done' represents of the specified total,
     * rounded to the nearest half percent
     * @param pDone
     * @param pTotal
     */
    function calculatePercentComplete( pDone, pTotal )
    {
        let done = _asFloat( pDone );
        let total = _asFloat( pTotal, 1.0 );

        const minValue = 0.000001;

        let ratio = Math.max( done, minValue ) / Math.max( total, minValue );

        return roundToNearestMultiple( (ratio * 100), 0.5 );
    }

    /**
     * Returns the number of millisecnds between the since value and the until value
     * @param pSince
     * @param pUntil
     */
    function calculateElapsedTime( pSince, pUntil = new Date() )
    {
        return attempt( () => (new Date( pUntil || Date.now() ) - new Date( pSince ).getTime()) ) || 0;
    }

    /**
     * Returns a human-readable value representing the number of millseconds specified.
     * The format is hh:mm.ss
     * @param pElapsedMilliseconds
     */
    function formatElapsedTime( pElapsedMilliseconds )
    {
        let totalSeconds = Math.floor( _asInt( pElapsedMilliseconds ) / 1_000 );
        let hours = Math.floor( totalSeconds / 3600 );
        let minutes = Math.floor( (totalSeconds % 3600) / 60 );
        let seconds = totalSeconds % 60;

        let hoursPart = (hours > 0) ? (_asStr( hours, true ).padStart( 2, "0" ) + ":") : "00:";
        let minutesPart = (minutes > 0) ? ((hours > 0) ? (_asStr( minutes, true ).padStart( 2, "0" ) + ".") : (_asStr( minutes, true ) + ".")) : "00.";
        let secondsPart = (minutes > 0 || hours > 0) ? _asStr( seconds, true ).padStart( 2, "0" ) : _asStr( seconds, true ).padStart( 2, "0" ) || "00";

        if ( hours > 0 || minutes > 0 || seconds > 0 )
        {
            return hoursPart + minutesPart + secondsPart;
        }

        // Explicitly handle 0 elapsed time
        return "00:00.00";
    }

    /**
     * Returns the number of milliseconds expected to be required to reach 100%
     * when calculating the percentage complete of 'done' versus 'total'
     * according to the time already elapsed.
     *
     * @param pDone
     * @param pTotal
     * @param pElapsedTime
     */
    function calculateEstimatedTimeRemaining( pDone, pTotal, pElapsedTime )
    {
        let done = _asFloat( pDone );
        let total = _asFloat( pTotal, 1.0 );
        let elapsed = _asFloat( pElapsedTime );

        const minValue = 0.000001;

        // Avoid division by zero by using a minimum value
        done = Math.max( done, minValue );

        // If nothing is done yet or elapsed time is 0, we can't estimate
        if ( done <= minValue || elapsed <= 0 )
        {
            return Infinity;
        }

        // Calculate rate of progress (units per time)
        let rate = done / elapsed;

        // Calculate remaining work
        let remaining = Math.max( total - done, 0 );

        // Calculate estimated time remaining based on the current rate
        return remaining / rate;
    }

    /*
     * This code attempts to poly-fill the Promise.try functionality.
     * Promise.try may not be widely supported in all environments
     * at the time of this library's inception
     */
    if ( !isFunc( Promise?.try ) )
    {
        try
        {
            Promise.try = async function( pFunction, ...pArgs )
            {
                try
                {
                    if ( isAsyncFunction( pFunction ) )
                    {
                        return await pFunction.call( $scope(), ...pArgs );
                    }
                    else if ( isFunc( pFunction ) )
                    {
                        return pFunction.call( $scope(), ...pArgs );
                    }
                    else
                    {
                        return Promise.reject( new Error( NOT_A_FUNCTION ) );
                    }
                }
                catch( ex )
                {
                    return Promise.reject( ex );
                }
            };
        }
        catch( err )
        {
            (konsole || console || mockConsole).error( "Unable to define the Promise.try method", err );
        }
    }

    const nameFromSource = ( pFunction ) =>
    {
        let s = _asStr( functionToString.call( pFunction, pFunction ) ).trim();
        s = s.replace( /function /, _mt_str ).trim().replace( /\s*\(.*\).*/, _mt_str ).trim();
        return s.replace( /function\s+/, _mt_str ).trim().replace( /\s*\(.*\).*/, _mt_str ).trim();
    };

    function hasCustomConstructor( pObject )
    {
        if ( isInvalidObj( pObject ) )
        {
            return false;
        }

        let constructorFunction = pObject?.constructor || Object.getPrototypeOf( pObject )?.constructor;

        if ( !isFunc( constructorFunction ) )
        {
            return false;
        }

        return ![...GLOBAL_TYPE_NAMES, "Object"].includes( constructorFunction?.name || nameFromSource( constructorFunction ) );
    }

    /**
     * An environment-agnostic (isomorphic) safe stringifier.
     * Handles: Circular References, BigInt, Map, Set, and Date.
     *
     * Useful for preventing crashes related to simply trying to log an error, for example
     */
    function serialize( pValue, pSpaces = 0 )
    {
        if ( isStr( pValue ) || (isNum( pValue ) && !isBig( pValue )) || isBool( pValue ) )
        {
            return pValue;
        }

        const visited = new WeakMap();

        // Note that the replacer function's 'this' context is the parent object of the current value
        return JSON.stringify( pValue, function( key, value )
        {
            // We handle BigInt immediately.
            // Node.js JSON.stringify will literally 'panic' and crash otherwise
            if ( _big === typeof value )
            {
                return `${value.toString()}n`;
            }

            if ( isFunc( value ) )
            {
                return `FUNCTION[${value?.name || nameFromSource( value ) || "anonymous"}]`;
            }

            // Then we handle potentially cyclic object graphs and Collections classes
            if ( _obj === typeof value && null !== value )
            {
                if ( isPrimitiveWrapper( value ) && isFunc( value?.valueOf ) )
                {
                    let val = value.valueOf();
                    if ( isBig( val ) )
                    {
                        `${val.toString()}n`;
                    }
                    if ( isStr( val ) || (isNum( val ) && !isBig( val )) || isBool( val ) )
                    {
                        return val;
                    }
                }

                // we find the path of the parent object, so we can remember it
                const parentPath = visited.get( this ) || "^";

                // we build the property path to the current object, so we can store it
                const currentPath = key ? `${parentPath}.${key}` : parentPath;

                // here, we avoid the infinite loop, stack overflow, or potential runtime crash
                if ( visited.has( value ) )
                {
                    // (@path;@base:root):
                    return "${(@path;@base:root):" + `${(visited.get( value ) || (_isValidStr( key ) ? key.replace( /^\^?\.|^\^/, _mt ) : "~~"))}` + "}";
                }

                // We store the property path for subsequent encounters
                visited.set( value, currentPath );

                // We transform Sets, Maps, and Dates into serializable structures
                if ( value instanceof Set )
                {
                    return Array.from( value );
                }

                if ( value instanceof Map )
                {
                    return Object.fromEntries( value );
                }

                if ( value instanceof Date )
                {
                    return value.getTime();
                }
            }

            return value;

        }, pSpaces );
    }

    const LOG_LEVELS =
        {
            LOG: S_LOG,
            INFO: S_INFO,
            WARN: S_WARN,
            ERROR: S_ERROR,
            DEBUG: S_DEBUG,
            TRACE: S_TRACE
        };

    const DEFAULT_KONSOLE_OPTIONS =
        {
            defaultLogger: konsole,
            addFormatting: true,
            logEmptyMessages: false,
            addFormattingToEmptyMessages: false
        };

    /**
     * A 'safe' implementation of ILogger
     * that uses the serialize function to stringify the message arguments.
     *
     * This prevents allowing the runtime to attempt to stringify
     * objects that might have circular references, which can crash some runtimes.
     *
     * NOTE: This became necessary after upgrading to node.js 24+
     * The undici implementation in later versions of node.js
     * blows up on some object graphs,
     * especially Errors with potentially cyclic references,
     * or an overridden 'cause' property
     *
     * @param pSink the 'writer' or another instance of ILogger
     *
     * @class
     * @Ilogger
     */
    class Konsole extends ILogger
    {
        #logger = konsole;

        #logEmptyMessages = true;

        #addFormatting = false;

        #addFormattingToEmptyMessages = false;

        constructor( pSink, pOptions = DEFAULT_KONSOLE_OPTIONS )
        {
            super();

            const options = { ...DEFAULT_KONSOLE_OPTIONS, ...(pOptions || {}) };

            const sink = pSink || options.defaultLogger;

            this.#logger = ILogger.isLogger( sink ) ? sink : konsole;

            this.#addFormatting = options.addFormatting;

            this.#addFormattingToEmptyMessages = options.addFormattingToEmptyMessages;

            this.#logEmptyMessages = options.logEmptyMessages;

            let count = 0;

            while ( !isNull( this.#logger ) && this.#logger instanceof this.constructor && count++ < 5 )
            {
                this.#logger = Object.getPrototypeOf( this.#logger ) || konsole;
            }

            this.#logger = this.#logger || konsole || mockConsole;
        }

        static formatTimeStamp( pDate )
        {
            let timestamp = isDate( pDate ) ? (pDate || new Date()) : new Date();

            let s = _asStr( timestamp.getFullYear() ).padStart( 4, "0" ) + "-" +
                    _asStr( timestamp.getMonth() + 1 ).padStart( 2, "0" ) + "-" +
                    _asStr( timestamp.getDate() ).padStart( 2, "0" ) + " " +
                    _asStr( timestamp.getHours() ).padStart( 2, "0" ) + ":" +
                    _asStr( timestamp.getMinutes() ).padStart( 2, "0" ) + "." +
                    _asStr( timestamp.getSeconds() ).padStart( 2, "0" ) + "," +
                    _asStr( timestamp.getMilliseconds() ).padStart( 3, "0" ) + " -> ";

            return _asStr( s );
        }

        get logger()
        {
            return this.#logger ?? konsole;
        }

        get addFormatting()
        {
            return !!this.#addFormatting;
        }

        get logEmptyMessages()
        {
            return !!this.#logEmptyMessages;
        }

        get addFormattingToEmptyMessages()
        {
            return !!this.#addFormattingToEmptyMessages && this.logEmptyMessages;
        }

        addSource( ...pMsg )
        {
            // overridden by subclasses or decorators
            return [...pMsg];
        }

        addPrefix( pDate, level, ...pMsgs )
        {
            let msgs = [...pMsgs];

            let TSP = Konsole.formatTimeStamp( pDate ?? new Date() );

            let lvl = _asStr( ("log" === level ? "info" : level) ).trim();
            let LVL = ("[" + _ucase( lvl ) + "]").padEnd( 8, _spc );

            msgs = this.addSource( ...msgs );

            msgs.unshift( TSP );
            msgs.unshift( LVL );

            return [...(msgs || pMsgs)];
        }

        #_log( pLevel, ...pData )
        {
            try
            {
                const level = _lct( pLevel || LOG_LEVELS.LOG ) || LOG_LEVELS.LOG;

                const data = [...(pData || [])].map( e => serialize( e ) );

                const isValidMessage = e => !isStr( e ) || _isValidStr( e );

                let msg = [...data];

                if ( !(msg.some( isValidMessage ) || this.logEmptyMessages) )
                {
                    return;
                }

                if ( this.addFormatting && (msg.some( isValidMessage ) || this.addFormattingToEmptyMessages) )
                {
                    msg = this.addPrefix( new Date(), level, ...msg );
                }

                if ( isFunc( this.logger[level] ) )
                {
                    this.logger[level]( ...(msg || []) );
                }
                else if ( isFunc( this.logger?.log ) )
                {
                    this.logger.log( ...msg );
                }
                else
                {
                    if ( isFunc( konsole[level] ) )
                    {
                        konsole[level]( ...msg );
                    }
                    else
                    {
                        konsole.log( ...msg );
                    }
                }
            }
            catch( ex )
            {
                // ignored; I mean, what are we going to do, log the error that occurred logging the error?
            }
        }

        log( ...pData )
        {
            return this.#_log( LOG_LEVELS.LOG, ...pData );
        }

        info( ...pData )
        {
            return this.#_log( LOG_LEVELS.INFO, ...pData );
        }

        warn( ...pData )
        {
            return this.#_log( LOG_LEVELS.WARN, ...pData );
        }

        debug( ...pData )
        {
            return this.#_log( LOG_LEVELS.DEBUG, ...pData );
        }

        error( ...pData )
        {
            return this.#_log( LOG_LEVELS.ERROR, ...pData );
        }

        trace( ...pData )
        {
            return this.#_log( LOG_LEVELS.TRACE, ...pData );
        }
    }

    /**
     * nothing written to the log
     */
    const SILENCED_LOG_LEVELS = [];

    /**
     * only errors are written to the log
     */
    const QUIETER_LOG_LEVELS = [LOG_LEVELS.ERROR];

    /**
     * only errors and warnings are written to the log
     */
    const QUIET_LOG_LEVELS = [LOG_LEVELS.WARN, ...QUIETER_LOG_LEVELS];

    /**
     * generic messages, informational messages, errors, and warnings are all written to the log
     */
    const MODEST_LOG_LEVELS = [LOG_LEVELS.LOG, LOG_LEVELS.INFO, ...QUIET_LOG_LEVELS];

    /**
     * debugging messages as well as
     * generic messages, informational messages, errors, and warnings are all written to the log
     */
    const DEBUG_LOG_LEVELS = [LOG_LEVELS.DEBUG, ...MODEST_LOG_LEVELS];

    /**
     * every kind of message is written to the log
     */
    const VERBOSE_LOG_LEVELS = [LOG_LEVELS.TRACE, ...DEBUG_LOG_LEVELS];

    function unwrapKonsoleLogger( pSink )
    {
        let sink = pSink;

        let count = 0;

        while ( !isNull( pSink ) && pSink instanceof Konsole && count++ < 5 )
        {
            sink = Object.getPrototypeOf( pSink );
        }

        return sink || konsole || mockConsole;
    }

    /**
     * A subclass of Konsole (a serialization-safe logger)
     * that only logs messages associated with the levels enabled
     * for the instance.
     *
     * Rather than use the notion of levels with ordinal values
     * and setting a value to indicate the lowest or highest level to log,
     * which always causes some confusion (at least for me),
     * this class expects each level to be specified separately.
     *
     * @class
     * @ILogger
     *
     */
    class ConditionalLogger extends Konsole
    {
        #levels = MODEST_LOG_LEVELS;

        /**
         * Constructs an instance of the ConditionalLogger class.
         *
         * This is a subclass of Konsole (a serialization-safe logger)
         * that only logs messages associated with the levels enabled
         * for this instance.
         *
         * @param {ILogger} pSink - The underlying logger that will write messages to a destination, such as a file, a socket, a database, or the console
         * @param pOptions
         * @param {...string} pLevels - One or more LOG_LEVELS indicating which message this instance will log and which it will ignore
         * @return An instance of the ConditionalLogger class configured to safely log messages associated with one of the levels specified
         *
         * @constructor
         */
        constructor( pSink, pOptions, ...pLevels )
        {
            super( unwrapKonsoleLogger( pSink ), pOptions );

            this.#levels = [...(pLevels || pOptions?.levels || [])].flat();

            this.#levels = $ln( this.#levels ) < 1 ? [...(MODEST_LOG_LEVELS)] : this.#levels;
        }

        get levels()
        {
            return [...(this.#levels || [])];
        }

        isEnabledForLevel( pLevel )
        {
            return (this.levels).map( _lcase ).includes( _lcase( pLevel ) );
        }

        log( ...pData )
        {
            if ( this.isEnabledForLevel( LOG_LEVELS.LOG ) )
            {
                super.log( ...pData );
            }
        }

        info( ...pData )
        {
            if ( this.isEnabledForLevel( LOG_LEVELS.INFO ) )
            {
                super.info( ...pData );
            }
        }

        warn( ...pData )
        {
            if ( this.isEnabledForLevel( LOG_LEVELS.WARN ) )
            {
                super.warn( ...pData );
            }
        }

        debug( ...pData )
        {
            if ( this.isEnabledForLevel( LOG_LEVELS.DEBUG ) )
            {
                super.debug( ...pData );
            }
        }

        error( ...pData )
        {
            if ( this.isEnabledForLevel( LOG_LEVELS.ERROR ) )
            {
                super.error( ...pData );
            }
        }

        trace( ...pData )
        {
            if ( this.isEnabledForLevel( LOG_LEVELS.TRACE ) )
            {
                super.trace( ...pData );
            }
        }
    }

    const INTERNAL_LOGGER = new ConditionalLogger( (konsole || console || mockConsole), ...(DEBUG_MODE ? DEBUG_LOG_LEVELS : MODEST_LOG_LEVELS) );
    const DEBUG_LOGGER = new ConditionalLogger( (konsole || console || mockConsole), ...DEBUG_LOG_LEVELS );
    const PRODUCTION_LOGGER = new ConditionalLogger( (konsole || console || mockConsole), ...QUIET_LOG_LEVELS );

    /**
     * Executes a function with the specified arguments,
     * handling both synchronous and asynchronous function execution.<br>
     * <br>
     * Catches and processes any errors that occur during the function execution,<br>
     * rather than allowing them to propagate to the calling code.<br>
     * <br>
     * Callers can control how these errors are handled
     * by overwriting this function's 'handleError' method.<br>
     * <br>
     * The Module Prototype, for example, replaces 'handleError'
     * with a call to its reportError method, which emits an error event and/or writes to a user-specified logger.<br>
     * <br>
     *
     * @param {Function} pFunction The function to be executed. Can be a synchronous or asynchronous function.
     * @param {...any} pArgs The arguments to pass to the function when it is invoked.
     * @return {any|Promise<any>} Returns the result of the function execution.
     *                            If the function is asynchronous,
     *                            a Promise is returned resolving to the result.
     */
    function handleAttempt( pFunction, ...pArgs )
    {
        let args = [...(pArgs || [])];

        let func = isFunc( pFunction ) ? pFunction : ($ln( args ) <= 0 ? null : args.find( e => isFunc( e ) ));

        if ( isFunc( func ) )
        {
            if ( handleAttempt.trace )
            {
                attemptSilent( () => handleAttempt.traceFunctionCall( func, ...args ) );
            }

            handleAttempt.lastError = null;
            delete handleAttempt.lastError;

            try
            {
                return isAsyncFunction( func ) ? ((async() => func( ...pArgs ).then( r => r ))()) : func( ...pArgs );
            }
            catch( ex )
            {
                handleAttempt.lastError = ex;

                try
                {
                    attemptSilent( () => handleAttempt.handleError( ex, (pFunction?.name || nameFromSource( pFunction )), ...pArgs ) );
                }
                catch( e )
                {
                    konsole.error( "An unusual and unexpected error occurred while handling an error while attempting to execute a function or method" );
                }
            }
        }
        else
        {
            const error = resolveError( new Error( NOT_A_FUNCTION ) );

            handleAttempt.lastError = error;

            attemptSilent( () => handleAttempt.handleError( error, (pFunction?.name || nameFromSource( pFunction )), ...pArgs ) );

            // Return the value that was specified;
            // it's not an executable/invocable object,
            // so it might be the developers' intent to wait for it for some reason
            return pFunction;
        }

        // we only reach this code if the specified function encountered an error,
        // so the best strategy is to return null and allow the developer to troubleshoot the error
        return null;
    }

    /**
     * Handles any errors that occur during a call to one of the 'attempt' functions.<br>
     * <br>
     *
     * This function is intended to consume any errors that occur
     * when performing an operation via the handleAttempt function (called internally by each of the 'attempt' functions).
     * It avoids propagating the error(s) to consumer code, preferring to use the libray convention of emitting an event.<br>
     * <br>
     * <b>NOTE</b> <i>This is the DEFAULT implementation
     * and is replaced with the ToolBocksModule 'reportError' method
     * once that class is defined.</i><br>
     *
     * @memberof handleAttempt
     *
     * @param {Error|Function} pError - The error encountered during the attempted function call.
     * @param {Function} [pFunction] - The function that was being executed when the error occurred
     * @param {...*} [pArgs] - The arguments that were passed to the function that threw an error
     */
    handleAttempt.handleError = function( pError, pFunction, ...pArgs )
    {
        if ( isError( pError ) )
        {
            handleAttempt.lastError = pError;

            // we still wrap our attempt to log the error in a try/catch here,
            // because it is still conceivable that a serialization error
            // could crash the process if the error is not handled
            try
            {
                let args =
                    [
                        (pError instanceof Error ? ATTEMPT_FAILED : NOT_A_FUNCTION),
                        (pError?.message || (pFunction?.name || nameFromSource( pFunction )) || _mt_str),
                        (pError || {}),
                        ...pArgs
                    ];

                INTERNAL_LOGGER.error( ...args );
            }
            catch( ex )
            {
                try
                {
                    mockConsole.error( ex?.message || ex );
                    mockConsole.error( pError?.message || pError?.name || pError );
                }
                catch( e2 )
                {
                    konsole.log( "An unusual and unexpected error occurred while attempting to log an error" );
                }
            }
        }
    };

    handleAttempt.trace = false;

    handleAttempt.enableTrace = function()
    {
        handleAttempt.trace = true;
    };

    handleAttempt.traceFunctionCall = ( pFunction, ...pArgs ) =>
    {
        if ( !handleAttempt.trace )
        {
            return pFunction;
        }

        if ( INTERNAL_LOGGER.levels.include( LOG_LEVELS.TRACE ) )
        {
            try
            {
                const name = pFunction?.name || nameFromSource( pFunction ) || "An anonymous function";

                const hasArguments = [...(pArgs || [])].length > 0;

                INTERNAL_LOGGER.trace( "Calling", name, ...(hasArguments ? ["with arguments:", ...pArgs].map( e => String( attemptSilent( () => serialize( e ) ) ) ) : ["without arguments"]) );
            }
            catch( e )
            {
                konsole.log( "An unusual and unexpected error occurred while calling the trace method on the internal logger" );
            }
        }

        // we return the function being traced, in case the caller wants it back
        return pFunction;
    };

    /**
     * Returns the last Error encountered by a call to 'attempt', 'asyncAttempt', 'attemptMethod', or 'asyncAttemptMethod'
     *
     * By using the 'attempt' idiom, you can avoid littering code with try/catch blocks
     * that do little more than log the error or rethrow it.
     *
     * However, there are some use cases in which you want to know if an error was encountered
     * and then execute different code based on the error.
     *
     * This function exists for those few cases.
     *
     * @returns {Error|undefined|null} the last error caught by an attempt to execute a function
     *                                 or null or undefined if the last executed function completed without error.
     */
    function getLastError()
    {
        return handleAttempt.lastError;
    }

    /**
     * Asynchronously returns a Promise that resolves to the last error encountered by an attempt to execute a function.
     * @see #getLastError
     * @returns {Promise<Awaited<null|Error|undefined>>} the last error caught by an attempt to execute a function
     *                                                   or null or undefined
     *                                                   if the last executed function completed
     *                                                   without error.
     */
    async function asyncGetLastError()
    {
        return Promise.resolve( handleAttempt.lastError );
    }

    /**
     * An asynchronous version of handleAttempt
     * Used when attempting to execute asynchronous functions or methods.
     *
     * @param {function} pFunction
     * @param {...*} pArgs
     *
     * @returns {Promise<*>} the return value of the executed function
     */
    async function asyncHandleAttempt( pFunction, ...pArgs )
    {
        if ( isFunc( pFunction ) )
        {
            if ( !isAsyncFunction( pFunction ) )
            {
                return handleAttempt( pFunction, ...pArgs );
            }

            handleAttempt.traceFunctionCall( pFunction, ...pArgs );

            return await pFunction( ...pArgs ).catch( ex => handleAttempt.handleError( ex, (pFunction?.name || nameFromSource( pFunction )), ...pArgs ) );
        }
        else
        {
            const error = resolveError( new Error( NOT_A_FUNCTION ) );

            handleAttempt.lastError = error;

            attemptSilent( () => handleAttempt.handleError( error, (pFunction?.name || nameFromSource( pFunction )), ...pArgs ) );

            // Return the value that was specified;
            // it's not an executable/invocable object,
            // so it might be the developers' intent to wait for it for some reason
            return pFunction;
        }
    }

    /**
     * Executes the specified function with the provided arguments
     * and handles the execution using the handleAttempt function,
     * consuming any errors that may occur
     * by calling the 'handleAttempt.handleError' function
     * instead of propagating the errors.
     *
     * @param {Function|NodeRequire} pFunction The function to attempt to execute.
     * @param {...*} pArgs The arguments to pass to the function being executed.
     * @return {*} The result returned by executing the function.
     */
    function attempt( pFunction, ...pArgs )
    {
        return handleAttempt( pFunction, ...pArgs );
    }

    /**
     * Attempts to execute the specified function.
     *
     * If an error is encountered, it is not logged.
     *
     * The error is, however, available from getLastError if necessary.
     *
     * @param pFunction the function to execute
     * @param pArgs any arguments that should be passed to the function
     *
     * @returns {*} the return value of the specified function if it completes successfully.
     *              If the function throws an error, no value is returned.
     *              If the specified function is not executable (that is, it is not a function),
     *              that value is returned.
     */
    function attemptSilent( pFunction, ...pArgs )
    {
        if ( isFunc( pFunction ) )
        {
            if ( isAsyncFunction( pFunction ) )
            {
                try
                {
                    return (async function()
                    {
                        try
                        {
                            handleAttempt.lastError = null;

                            return await pFunction( ...pArgs );
                        }
                        catch( ex )
                        {
                            // ignored, silently, but we make the error available if desired
                            handleAttempt.lastError = ex;
                        }
                    }()).then( r => r ).catch( no_op );
                }
                catch( e2 )
                {
                    // ignored, silently, but made available unless it would obscure the error thrown from the nested try/catch
                    if ( !isError( handleAttempt.lastError ) )
                    {
                        handleAttempt.lastError = e2;
                    }
                }
            }
            else
            {
                try
                {
                    handleAttempt.lastError = null;

                    return pFunction( ...pArgs );
                }
                catch( ex )
                {
                    // ignored, silently
                    handleAttempt.lastError = ex;
                }
            }
        }
        return pFunction;
    }

    /**
     * Executes a specified function asynchronously with the provided arguments
     * and handles the execution using the handleAttempt function,
     * consuming any errors that may occur
     * by calling the 'handleAttempt.handleError' function
     * instead of propagating the errors.
     *
     * @param {Function} pFunction The function to attempt to execute.
     * @param {...*} pArgs The arguments to pass to the function being executed.
     * @return {Promise<*>} A Promise that resolves to the result of executing the function.
     */
    async function asyncAttempt( pFunction, ...pArgs )
    {
        return await asyncHandleAttempt( pFunction, ...pArgs );
    }

    async function asyncAttemptSilent( pFunction, ...pArgs )
    {
        if ( isFunc( pFunction ) )
        {
            try
            {
                handleAttempt.lastError = null;

                return await pFunction( ...pArgs );
            }
            catch( ex )
            {
                // ignored, silently
                handleAttempt.lastError = ex;
            }
        }

        return pFunction;
    }

    /**
     * Returns true if the specified function can be bound to a specified object or function context.
     *
     * The function checks if the provided function is a valid function<br>
     * and if the context is an object or a function, allowing the method to be bound to it.<br>
     * <br>
     *
     * @param {Function} pMethod - The function to evaluate.
     * @param {Object|Function} pThis - The context to which the function is or could be bound.
     * @returns {boolean} true if the method is a function
     *                    and the context is an object or a function,
     *                    otherwise false.
     */
    const canBind = ( pMethod, pThis ) => isFunc( pMethod ) && (isNonNullObj( pThis ) || isFunc( pThis ));

    /**
     * Returns a valid function
     * based on the specified parameters.<br>
     * <br>
     *
     * @param {Function|string} pMethod - The method to be resolved. It can be a function or a string representing a method name.
     * @param {object|Function} pThis - The context or object that may contain the method if `pMethod` is a string or function to which the method is bound or could be bound.
     * @returns {Function} - Returns the specified function or a fallback function if the method cannot be resolved.
     */
    const resolveMethod = ( pMethod, pThis ) => canBind( pMethod, pThis ) || (isFunc( pMethod ) && isFunc( pThis?.[pMethod?.name] )) ? pMethod : (isStr( pMethod ) && (isNonNullObj( pThis ) || isFunc( pThis )) ? pThis[pMethod] || (() => pMethod || pThis) : (() => pMethod || pThis));

    /**
     * Binds a method to a specific context and optionally pre-sets additional arguments.
     * This function attempts to resolve and bind the given method to the provided context.
     * If binding is not possible, it returns the unresolved method.
     *
     * @param {Function|string} pMethod - The method to bind, either as a function or a string representing the method name.
     * @param {Object} pThis - The context (this) to which to bind the method.
     * @param {...*} pArgs - Optional arguments to preset for the method.
     *
     * @return {Function} The bound method if binding is successful; otherwise, the unresolved method.
     */
    function bindMethod( pMethod, pThis, ...pArgs )
    {
        const method = resolveMethod( pMethod, pThis );

        if ( canBind( method, pThis ) )
        {
            return attempt( () => method.bind( pThis, ...pArgs ) );
        }

        return method;
    }

    /**
     * Calls the specified method with the arguments passed,
     * using the specified object as the 'this' context to which the function is bound
     * or will be temporarily bound during execution.<br>
     * <br>
     *
     * If the specified method cannot be executed or the context is invalid,
     * the method is returned without being executed.
     *
     * @param {Object|Function} pThis - The object on which the method should be called.
     * @param {Function} pMethod - The function or method to be executed.
     * @param {...*} pArgs - Zero or more arguments to be passed to the method.
     *
     * @return {*} The result of the executed method or the method itself if it is not executable or cannot be bound to the context
     */
    function attemptMethod( pThis, pMethod, ...pArgs )
    {
        let method = resolveMethod( pMethod, pThis );

        if ( isFunc( method ) )
        {
            if ( canBind( method, pThis ) )
            {
                method = bindMethod( method, pThis, ...pArgs );
                return attempt( () => method() );
            }

            return attempt( () => method( ...pArgs ) );
        }

        return handleAttempt.handleError( new Error( NOT_A_FUNCTION ), pThis, pMethod, ...pArgs );
    }

    /**
     * Calls the specified asynchronous method with the arguments passed,
     * using the specified object as the 'this' context to which the function is bound
     * or will be temporarily bound during execution.<br>
     * <br>
     *
     * If the specified method cannot be executed or the context is invalid,
     * the method is returned without being executed.
     *
     * @param {Object|Function} pThis - The object on which the method should be called.
     * @param {Function} pMethod - The function or method to be executed.
     * @param {...*} pArgs - Zero or more arguments to be passed to the method.
     *
     * @return {Promise<*>} A Promise that resolves to the result of the executed method
     * or the method itself if it is not executable or cannot be bound to the specified context
     */
    async function asyncAttemptMethod( pThis, pMethod, ...pArgs )
    {
        let method = resolveMethod( pMethod, pThis );

        if ( isAsyncFunction( method ) )
        {
            if ( canBind( method, pThis ) )
            {
                method = bindMethod( method, pThis, ...pArgs );
                return await asyncAttempt( async() => await method() );
            }

            return await asyncAttempt( async() => await method.call( (pThis || $scope()), ...pArgs ) );
        }
        else if ( isFunc( method ) )
        {
            return attemptMethod( pThis, method, ...pArgs );
        }

        return handleAttempt.handleError( new Error( NOT_A_FUNCTION ), pThis, pMethod, ...pArgs );
    }

    /**
     * Asynchronously executes a function without blocking and without any callbacks.<br>
     * Does not require try/catch; any errors are simply ignored, as per the "and forget" semantics.<br>
     *
     * @param {Function|AsyncFunction} pAsyncFunction The function to execute
     * @param {...*} pArgs Zero or more arguments to pass to the function
     */
    const fireAndForget = function( pAsyncFunction, ...pArgs )
    {
        const func = pAsyncFunction || no_op;

        const args = [...(pArgs || [])];

        if ( isAsyncFunction( func ) )
        {
            setTimeout( function()
                        {
                            handleAttempt.traceFunctionCall( func, ...args );

                            func( ...(args || pArgs || []) ).then( no_op ).catch( no_op );

                        }, 10, ...(args || pArgs || []) );
        }
        else if ( isFunc( func ) )
        {
            async function _( ...pArgs )
            {
                attempt( () => func( ...(pArgs || args || []) ) );
            }

            fireAndForget( _, ...(args || pArgs || []) );
        }
    };

    /**
     * Synchronously executes a specified callback function with the provided arguments.<br>
     *
     * @param {Function} pCallback - The callback function to be executed.
     *                               If the callback is an asynchronous function,
     *                               it is executed using the "fire and forget" mechanism.
     *
     * @param {...*} pArgs - Optional arguments to be passed to the callback function.
     *
     * @return {void} This function does not return any value.<br>
     *                The callback is responsible for any desired side effects.
     */
    function executeCallback( pCallback, ...pArgs )
    {
        if ( isFunc( pCallback ) )
        {
            const args = [...(pArgs || [])];

            if ( isAsyncFunction( pCallback ) )
            {
                fireAndForget( pCallback, ...(args || []) );
            }
            else
            {
                attempt( pCallback, ...(args || []) );
            }
        }
    }

    /**
     * Asynchronously executes the specified function and if the function executes without error,
     * returns the value returned by that function.
     *
     * If an error is encountered, or the function returns null or does not return a value,
     * the value specified as the default is returned.
     *
     * If no default value is specified and an error is encountered, that error is thrown.
     *
     * If that behavior is undesirable, combine this with asyncAttempt
     *
     * @param pFunction
     * @param pDefault
     * @param pArgs
     * @returns {Promise<*|Error>}
     */
    const asyncTryOrElse = async( pFunction, pDefault, ...pArgs ) =>
    {
        let args = [...(pArgs || [])];

        let func = isFunc( pFunction ) ? pFunction : ($ln( args ) <= 0 ? null : args.find( e => isFunc( e ) ));

        if ( isFunc( func ) )
        {
            if ( handleAttempt.trace )
            {
                attemptSilent( () => handleAttempt.traceFunctionCall( func, ...args ) );
            }

            handleAttempt.lastError = null;
            delete handleAttempt.lastError;

            try
            {
                return await func( ...args ) ?? pDefault;
            }
            catch( ex )
            {
                if ( pDefault )
                {
                    return pDefault;
                }
                else
                {
                    throw ex;
                }
            }
        }
        else
        {
            handleAttempt.lastError = resolveError( new Error( NOT_A_FUNCTION ) );
        }

        return pDefault ?? handleAttempt.lastError ?? new Error( NOT_A_FUNCTION );
    };


    /**
     * Synchronously executes the specified function and if the function executes without error,
     * returns the value returned by that function.
     *
     * If an error is encountered, or the function returns null or does not return a value,
     * the value specified as the default is returned.
     *
     * If no default value is specified and an error is encountered, that error is thrown.
     *
     * If that behavior is undesirable, combine this with the attempt function
     *
     * @param pFunction
     * @param pDefault
     * @param pArgs
     * @returns {Promise<*|Error>}
     */
    const tryOrElse = ( pFunction, pDefault, ...pArgs ) =>
    {
        let args = [...(pArgs || [])];

        let func = isFunc( pFunction ) ? pFunction : ($ln( args ) <= 0 ? null : args.find( e => isFunc( e ) ));

        if ( isFunc( func ) )
        {
            if ( handleAttempt.trace )
            {
                attemptSilent( () => handleAttempt.traceFunctionCall( func, ...args ) );
            }

            handleAttempt.lastError = null;
            delete handleAttempt.lastError;

            try
            {
                return isAsyncFunction( func ) ?
                       ((async() => asyncTryOrElse( func, ...pArgs ).catch( ex =>
                                                                            {
                                                                                handleAttempt.lastError = ex;
                                                                                attemptSilent( () => handleAttempt.handleError( ex, pFunction, ...pArgs ) );
                                                                                return pDefault || ex;
                                                                            } ).then( r => r ))()) :
                       func( ...pArgs ) ?? pDefault;
            }
            catch( ex )
            {
                if ( pDefault )
                {
                    return pDefault;
                }
                else
                {
                    throw ex;
                }
            }
        }
        else
        {
            handleAttempt.lastError = resolveError( new Error( NOT_A_FUNCTION ) );
        }

        return pDefault ?? handleAttempt.lastError;
    };

    /**
     * Returns true if the specified value is an array and every element of that array is also an array.
     * @param pArray
     */
    const is2dArray = ( pArray ) => isArray( pArray ) && $ln( pArray ) > 0 && pArray.every( row => isArray( row ) );

    /**
     * Returns true if the specified value is a 2-dimensional array
     * and the second dimension arrays are of length 2 (or 3, to account for the ObjectEntry structure)
     * (suggesting that those arrays should be treated as if the value at index 0 is a key and the value at index 1 is a value)
     * @param pArray
     */
    const isKeyValueArray = ( pArray ) => is2dArray( pArray ) && pArray.every( row => $ln( row ) >= 2 && $ln( row ) <= 3 && isStr( row[0] ) );

    /**
     * Returns a non-null object.<br>
     * Returns the specified object if it meets the criteria of being a non-null object.<br>
     * @param {*} pObject The object to return if it is actually a non-null object
     * @param {boolean} [pAcceptArray=false] Whether to treat an array as an object for this purpose
     * @returns {Object} The object specified if it is a non-null object or an empty object; never returns null.
     */
    const resolveObject = ( pObject, pAcceptArray = false ) => isNonNullObj( pObject ) ? (!!pAcceptArray || !isArray( pObject ) ? pObject : {}) : {};

    /**
     * Returns true if the specified object has the specified property.
     * The property 'name' can be a path to a value, such as 'obj.prop1.prop2.prop3',
     * making this more powerful and useful than Object.hasOwn.
     * @param pObject
     * @param pPropertyName
     * @returns {boolean}
     */
    const hasProperty = function( pObject, pPropertyName )
    {
        let propertyName = _asStr( pPropertyName ).replace( /^#/, _mt_str ).trim();

        if ( propertyName )
        {
            const obj = resolveObject( pObject );

            if ( propertyName.includes( "." ) || propertyName.includes( "[" ) )
            {
                while ( propertyName.includes( "[" ) )
                {
                    propertyName = propertyName.replace( /\[(\w+)]/, ".$1" );
                }

                let paths = [...(propertyName.split( /\./ ))];

                let o = obj;

                while ( isNonNullObj( o ) && $ln( paths ) > 0 )
                {
                    let key = _asStr( paths.shift() ).trim();
                    o = o[key];
                }

                return $ln( paths ) <= 0 && !isNull( o );
            }

            return Object.hasOwn( obj, propertyName ) || (propertyName in obj);
        }

        return false;
    };

    /**
     * Returns true if the specified property of the specified object is mutable.
     *
     * @param pObj
     * @param pPropertyName
     * @param pIncludeInherited
     */
    function isWritable( pObj, pPropertyName, pIncludeInherited = false )
    {
        let propertyName = _asStr( pPropertyName ).trim();

        if ( isNull( pObj ) || (_mt_str === propertyName) )
        {
            return false;
        }

        if ( hasProperty( pObj, propertyName ) )
        {
            let descriptor = Object.getOwnPropertyDescriptor( pObj, propertyName ) || Object.getOwnPropertyDescriptor( pObj, propertyName.replace( /^#/, _mt ) );

            if ( descriptor )
            {
                return (descriptor.writable && descriptor.enumerable) || isFunction( descriptor.set );
            }
        }

        if ( pIncludeInherited )
        {
            const proto = Object.getPrototypeOf( pObj );

            if ( isNonNullObject( proto ) && Object !== proto )
            {
                return isWritable( proto, propertyName );
            }
        }

        return false;
    }

    /**
     * A class for generating universally unique identifiers (UUIDs).
     * This class provides a method to generate random UUIDs. It uses the
     * native `crypto` module for UUID generation when available, falling back
     * to a custom implementation if necessary.
     */
    class UUIDGenerator
    {
        #krypto = $scope().crypto || ((isDeno() && _ud !== typeof Deno) ? Deno.crypto : attempt( () => require( "node:crypto" ) )) || attempt( () => require( "crypto" ) );

        constructor()
        {
        }

        randomUUID()
        {
            if ( isNull( this.#krypto ) )
            {
                const uuid = "00000000-0000-0000-0000-000000000000";

                return uuid.replaceAll( /0/g, () => parseInt( Math.random() * 10 ) );
            }

            return this.#krypto.randomUUID();
        }
    }

    /**
     * A class to handle and manage an array of string arguments where each argument can optionally
     * represent key-value mappings separated by an equals sign ("=").
     */
    class Args
    {
        #args = [];
        #map = {};

        /**
         * Constructs and initializes an instance of the Args class
         * with the specified arguments.<br>
         * <br>
         * The arguments are used to populate an internal map of key/value pairs.<br>
         * <br>
         * The initialization process involves checking if arguments are provided
         * and then constructing a mapping of key-value pairs based on the provided arguments.<br>
         *
         * @param {...*} pArgs - Zero or more arguments,
         *                       which are used to populate the internal map
         *                       if they are present and are strings.
         *
         * @return {Args} This constructor does not explicitly return any value.
         */
        constructor( ...pArgs )
        {
            if ( pArgs && isArray( pArgs ) && pArgs.length > 0 )
            {
                this.#args = [...pArgs];

                const populateMap = e =>
                {
                    const parts = _asStr( e ).split( "=" );
                    const key = _trim( parts.length ? _trim( parts[0] ) : _mt_str );
                    const value = parts.length > 1 ? _asStr( parts[1] || key ) : key;

                    if ( key && value )
                    {
                        this.#map[key] = value;
                        this.#map[_lcase( key )] = value;
                        this.#map[_ucase( key )] = value;
                    }
                };

                if ( this.#args.length > 0 )
                {
                    (this.#args.filter( e => null != e && isStr( e ) )).forEach( populateMap );
                }
            }
        }

        /**
         * Returns a copy of the array of arguments represented by this instance.
         *
         * @return {Array} A copy of the array containing the stored arguments.
         */
        get args()
        {
            return [...(this.#args || [])];
        }

        /**
         * Returns a new Map populated with the entries from the internal map.
         *
         * @return {Map} A new Map object containing the entries from the internal map.
         */
        get map()
        {
            return new Map( Object.entries( this.#map ) );
        }

        /**
         * Retrieves the value associated with the given key.<br>
         * If the key is not found, the specified default value is returned.<br>
         *
         * @param {string} pKey - The key, or argument name, to use to retrieve the value of the argument.
         * @param {*} pDefaultValue - The default value to return if no value is found for the specified key.
         * @return {*} The value associated with the key, or the default value if the key is not found.
         */
        get( pKey, pDefaultValue )
        {
            let keys = [pKey, _lcase( pKey ), _ucase( pKey )];
            let values = keys.map( e => this.#map[e] );
            let value = values.find( e => null != e );
            return value || pDefaultValue;
        }
    }

    /**
     * Represents the set of arguments passed to the IIFE that constructs a module.<br>
     * Extends the base Args class and allows passing additional parameters to the constructor.<br>
     * <br>
     * This class is primarily used to handle and manage arguments required
     * by a specific module. It serves as a wrapper for parameterized arguments.<br>
     * <br>
     * Inherits from the Args class.
     *
     * @class
     */
    class ModuleArgs extends Args
    {
        constructor( ...pArgs )
        {
            super( ...pArgs );
        }
    }

    /**
     * CmdLineArgs extends the Args class to handle and process command line arguments.<br>
     * <br>
     * This class is designed to accept a variable number arguments<br>
     * that are passed either on the command line
     * when executing the process that hosts this module<br>
     * or by another process that spawns or executes the process loading this module.<br>
     * <br>
     * It can be utilized to create utilities, command line tools, or any other
     * functionality requiring parsing and management of command line arguments
     * or parameters passed to a host process.<br>
     * <br>
     *
     * @class
     * @extends Args
     *
     * @param {...any} pArgs - The arguments passed on the command line
     *                         or by a script that launched the application using this module.
     */
    class CmdLineArgs extends Args
    {
        constructor( ...pArgs )
        {
            super( ...pArgs );
        }
    }

    /**
     * Represents the arguments passed to the function that created this module.
     * @type {ModuleArgs}
     */
    const MODULE_ARGUMENTS = new ModuleArgs( ...pArgs );

    /**
     * Represents the arguments passed on the command line when the application using this module was executed.
     *
     * @type {CmdLineArgs}
     */
    const ARGUMENTS = new CmdLineArgs( CMD_LINE_ARGS || (_ud !== typeof process ? process.argv : (_ud !== typeof Deno ? Deno.args : [])) );

    /**
     * Represents the environment variables configured for the current runtime
     * @type {{key:string,value:string}}
     */
    const ENVIRONMENT = resolveObject( pEnvironment || _ENV, false );

    function initializeRecursionArgs( pVisited, pStack, pDepth, pOptions )
    {
        const options = Object.assign( {}, { ...(pOptions || {}) } );

        return {
            visited: pVisited || options?.visited || new WeakSet(),
            stack: [...(pStack || options?.stack || [])],
            depth: pDepth || options?.depth || 0
        };
    }

    /**
     * Defines the default value to use in recursive functions to bail out before causing a stack overflow.<br>
     * <br>
     * Most functions that use recursion accept an options object that allows you to provide a different value for maxStackSize.<br>
     * <br>
     * @type {number}
     * @const
     */
    const MAX_STACK_SIZE = 16;

    /**
     * Returns true if the executing code appears to have entered an infinite loop.<br>
     * <br>
     * Common scenarios in which this might occur include parsing or generating JSON
     * containing self-references or circular references,
     * iterating an object's entries if the object contains
     * self-references or circular references,
     * or executing other recursive code where the base case is unexpectedly never reached.<br>
     * <br>
     * This function attempts to detect potential infinite loops
     * by inspecting the contents of an array passed as the first argument.<br>
     * <br>
     * The first argument is an array that holds strings indicative of some operation or step that has been called recursively.
     * <br>
     * <br>
     * The second argument is the number of contiguous operations that,
     * if repeated as a sequence, might indicate an infinite loop
     * <br>
     * <br>
     * The third argument is the number of times
     * a sequence of contiguous operations must be found
     * before being considered to be in an infinite loop
     * <br>
     * <br>
     * Example: ["a", "b", "c", "d", "e", "b", "c", "a", "b", "c", "d", "a", "b", "c", "d"] - starts to repeat at index 7, and repeats 2 times
     *
     * @param {Array<string>} pStack an array of operations or paths representing a sequence of function calls or elements processed
     *
     * @param {Number} pRunLength the number of contiguous elements to consider a sequence
     *
     * @param {Number} pMaxRepetitions the maximum number of times a sequence of run-length operations can appear before being considered a repeating/infinite loop
     *
     * @param pOnDetected {function} (optional) function to call when a cycle has been detected, defaults to a no-op
     *
     * @returns true if cycles are detected
     */
    const detectCycles = function( pStack, pRunLength = 5, pMaxRepetitions = 3, pOnDetected = no_op )
    {
        /**
         * The list of operations that have occurred thus far
         * @type {Array.<string>}
         */
        const _stack = [...(pStack || [])];

        /**
         * The current length of the stack
         * @type {number}
         */
        const stackLength = _stack.length;

        /**
         * The length of a single repeating sequence to recognize
         * @type {number}
         */
        let runLength = pRunLength || 3;

        /**
         * The maximum number of times a sequence can repeat before this function will return true
         * @type {number}
         */
        const maxRepeats = pMaxRepetitions || 3;

        // if the list of operations
        // isn't even as long as it would have to be
        // to contain > maximum repetitions, return false
        if ( stackLength < (runLength * maxRepeats) )
        {
            return false;
        }

        /**
         * an array to hold the sequences
         *
         * @type {Array.<string>}
         */
        let runs = [];

        /**
         * This is a helper function used by the detectCycles function
         * used to prevent infinite loops when recursive calls
         * do not have a natural or dependable base case.
         * <br>
         * @param {Array} pStack an array that is appended with each iteration of a recursive function.<br>
         *                       If this array contains repeated sequences of a specified length,
         *                       we assume we have entered an infinite loop.<br>
         *
         * @param {number} pIteration
         * @param {number} pStackLength
         * @param {number} pRunLength
         * @param {Array}  pBuffer an array to hold the calculated 'runs' of a sequence
         * @private
         */
        function _calculateRuns( pStack, pIteration, pStackLength, pRunLength, pBuffer )
        {
            for( let i = 0, n = pStackLength; i < n; i += pRunLength )
            {
                let start = i + pIteration;

                const end = Math.min( start + pRunLength, pStackLength );

                const seq = String( _mt_str + (pStack.slice( start, end ).join( "*" )) ).trim();

                (pBuffer || runs).push( seq );
            }
        }

        /**
         * Using a nested loop algorithm...
         *
         * To account for the possibility
         * that there is a repeating sequence that is LONGER than the runLength specified,
         * we have an outer loop that increases the runLength by 1
         *
         * In the next-most inner loop,
         * we stagger the start index into the array by 1
         * each time we iterate the next-most-outer loop
         *
         * Within the innermost loop,
         * we get the number of elements for each sequence
         * and create a string we can compare to other sequences
         * then compare and count repetitions, returning true if we reach or exceed
         * the maximum number of repetitions of a sequence
         */

        const threshold = (stackLength / maxRepeats);

        while ( runLength <= threshold )
        {
            for( let j = 0, m = stackLength; j < m; j++ )
            {
                _calculateRuns( _stack, j, stackLength, runLength, runs );

                if ( runs.length < maxRepeats )
                {
                    return false;
                }

                let repetitions = 1; // the first instance counts

                for( let i = 0, n = runs.length - 1; i < n; i++ )
                {
                    repetitions += ((runs[i] === runs[i + 1]) ? 1 : 0);
                }

                if ( repetitions >= maxRepeats )
                {
                    executeCallback( pOnDetected, _stack, runs, repetitions, runLength, maxRepeats );

                    return true;
                }

                runs.length = 0;
            }

            runLength += 1;
        }

        return false;
    };

    /**
     * This class wraps the 2-element arrays returned from Object::entries,
     * so we can treat them like objects with a key and a value property instead of an array.
     * This class extends Array, so it retains all the functionality normally available for Object entries
     */
    class ObjectEntry extends Array
    {
        #key;
        #value;
        #type;

        #parent;

        constructor( ...pArgs )
        {
            super( ...(pArgs || []) );

            this.#key = _mt_str;
            this.#value = null;

            if ( isArray( pArgs ) )
            {
                const args = [...pArgs];

                const len = $ln( args );

                this.#key = len > 0 ? args[0] : this[0] || _mt_str;
                this.#value = len > 1 ? args[1] || this[1] : this[1] || this.#value;
                this.#parent = len > 2 ? args[2] || this[2] : this[2];
            }

            this.#type = typeof this.#value;
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get key()
        {
            return this.#key || ($ln( this ) > 0 ? this[0] : _mt_str);
        }

        get value()
        {
            return this.#value || ($ln( this ) > 1 ? this[1] : null);
        }

        get type()
        {
            return typeof this.value;
        }

        get parent()
        {
            return this.#parent || ($ln( this ) > 2 ? (isNonNullObj( this[2] ) ? this[2] : null) : null);
        }

        /**
         * Returns true if the value property of this entry is null or undefined
         * @returns {*}
         */
        isEmpty()
        {
            return isNull( this.value );
        }

        /**
         * Returns true if this entry has a string key and a defined/non-null value
         * @returns {*|boolean}
         */
        isValid()
        {
            return isStr( this.key ) && !this.isEmpty();
        }

        /**
         * Redefine the map function of the superclass, Array
         * We only want to apply the function to the value AND we want to return a new ObjectEntry, not a raw array
         * @param pFunction
         */
        map( pFunction )
        {
            if ( isFunc( pFunction ) )
            {
                const me = this;
                const thiz = this.constructor[Symbol.species] || me.constructor;
                return new thiz( this.key, attempt( () => pFunction.call( (me || this), (me || this).value ), (me || this).parent ) );
            }
            return this;
        }

        meetsCriteria( pFunction )
        {
            if ( isFunc( pFunction ) )
            {
                const me = this;
                return attempt( () => pFunction.call( (me || this), (me || this).value ) );
            }
            return this.isValid();
        }

        #_handleFold( pVisited = new Set(), pStack = [], pDepth = 0 )
        {
            let key = this.key || this[0];
            let value = this.value || this[1];

            if ( value instanceof this.constructor )
            {
                const { visited, stack, depth } = initializeRecursionArgs( pVisited, pStack, pDepth );

                if ( detectCycles( stack, 5, 3 ) || depth > MAX_STACK_SIZE )
                {
                    return value;
                }

                value = value.#_handleFold( visited, [...stack, key], depth + 1 );
            }

            return !isNull( key ) ? { [key]: value } : {};
        }

        fold()
        {
            return this.#_handleFold();
        }

        valueOf()
        {
            return this.value;
        }

        toArray( pVisited = new Set(), pStack = [], pDepth = 0 )
        {
            let key = this.key || this[0];
            let value = this.value || this[1];

            if ( value instanceof this.constructor )
            {
                const { visited, stack, depth } = initializeRecursionArgs( pVisited, pStack, pDepth );

                if ( detectCycles( stack, 5, 3 ) || depth > MAX_STACK_SIZE )
                {
                    return [key, [value?.key, value?.value, value?.parent], value];
                }

                value = attempt( () => value.toArray( visited, [...stack, key], depth + 1 ) );
            }

            return [key, value, this.parent];
        }
    }

    ObjectEntry.sort = function( pEntries, pCaseSensitive = false )
    {
        const arr = _asArr( pEntries ).filter( e => ObjectEntry.isValidEntry( e, true ) );

        const collator = new Intl.Collator( DEFAULT_LOCALE_STRING, { sensitivity: (pCaseSensitive ? "case" : "base") } );

        let comparator = ( a, b ) =>
        {
            const aa = _asStr( ObjectEntry.getKey( a ) );
            const bb = _asStr( ObjectEntry.getKey( b ) );

            return collator.compare( aa, bb );
        };

        return arr.sort( comparator );
    };

    ObjectEntry.foldEntry = function( pEntry )
    {
        let key = pEntry?.key || pEntry[0] || _mt_str;
        let value = pEntry?.value || pEntry[1] || null;

        if ( value instanceof ObjectEntry )
        {
            value = value.fold();
        }

        return { key, value };
    };

    ObjectEntry.foldEntries = function( pEntries )
    {
        let entries = !isNull( pEntries ) && isArray( pEntries ) ? [...(pEntries || [])] : [];

        let results = [];

        for( let entry of entries )
        {
            const { key, value } = ObjectEntry.foldEntry( entry );
            results.push( [key, value, (entry?.parent || entry[2] || null)] );
        }

        return results;
    };

    ObjectEntry.unwrapValues = function( pObject )
    {
        let entries = attempt( () => isNonNullObj( pObject ) && !isKeyValueArray( pObject ) ? objectEntries( pObject ) || [] : isArray( pObject ) ? [...pObject] : [pObject] );

        let results = [];

        const visited = new Set();
        const stack = [];

        if ( entries && $ln( entries ) )
        {
            for( let entry of entries )
            {
                if ( isNull( entry ) )
                {
                    continue;
                }

                const key = ObjectEntry.getKey( entry );

                let value = ObjectEntry.getValue( entry );

                if ( !(isNull( key ) || isNull( value ) || key === _mt_str) )
                {
                    if ( value instanceof ObjectEntry && value.isValid() )
                    {
                        if ( detectCycles( stack, 5, 3 ) )
                        {
                            results.push( [value?.key || key, value?.value || value, value?.parent || pObject] );
                            continue;
                        }

                        value = attempt( () => value.toArray( visited, [...stack, key], 0 ) );
                    }
                }

                results.push( [key, value, pObject] );
            }
        }

        return results;
    };

    ObjectEntry.from = function( ...pArgs )
    {
        const args = isArray( pArgs ) ? pArgs : [pArgs];
        if ( args.length === 1 )
        {
            const arg = args[0] || [];
            if ( arg instanceof ObjectEntry )
            {
                return arg;
            }
        }
        return new ObjectEntry( ...args );
    };

    ObjectEntry.toObject = function( pEntries )
    {
        let entries = !isNull( pEntries ) && isKeyValueArray( pEntries ) ? [...(pEntries || [])] : objectEntries( pEntries );

        let obj = {};

        if ( isArray( entries ) && entries.length > 0 )
        {
            for( let entry of entries )
            {
                const { key, value } = ObjectEntry.foldEntry( entry );
                obj[key] = value;
            }
        }

        return obj;
    };

    ObjectEntry.fromEntries = function( pEntries )
    {
        if ( pEntries )
        {
            if ( isArray( pEntries ) || pEntries[Symbol.iterator] )
            {
                return _asArr( pEntries ).filter( e => isArray( e ) && $ln( e ) >= 2 ).map( e => new ObjectEntry( e[0], e[1], e ) );
            }
            else if ( isObj( pEntries ) )
            {
                return ObjectEntry.fromEntries( Object.entries( pEntries || {} ) );
            }
        }
        return [];
    };

    ObjectEntry.getKey = ( entry ) => isNull( entry ) ? _mt_str : (entry?.key || entry[0] || _mt_str);
    ObjectEntry.getValue = ( entry ) => isNull( entry ) ? null : (entry?.value ?? entry[1] ?? null);
    ObjectEntry.getType = ( entry ) => isNull( entry ) ? _ud : entry?.type || typeof (ObjectEntry.getValue( entry ));

    ObjectEntry.iterate = function( pObject, pVisitor, pVisited = new Set(), pStack = [] )
    {
        const visitor = resolveVisitor( pVisitor, options );

        const recursive = options.recursive || false;

        const { visited, stack } = initializeRecursionArgs( pVisited, pStack, 0 );

        if ( pObject )
        {
            const entries = objectEntries( pObject );

            if ( entries && entries.length )
            {
                for( let entry of entries )
                {
                    if ( isNull( entry ) )
                    {
                        continue;
                    }

                    const key = ObjectEntry.getKey( entry );
                    const value = ObjectEntry.getValue( entry );

                    const quit = visitor.visit( entry, key, value );

                    if ( quit )
                    {
                        break;
                    }

                    if ( recursive && isNonNullObj( value ) && !detectCycles( stack, 5, 3 ) )
                    {
                        ObjectEntry.iterate( value, visitor, visited, [...stack, key] );
                    }

                    visited.add( value );
                }
            }

            visited.add( pObject );
        }

        return visitor;
    };

    ObjectEntry.COMPARATOR = ( a, b ) =>
    {
        let keyA = _uct( ObjectEntry.getKey( a ) );
        let keyB = _uct( ObjectEntry.getKey( b ) );

        let comp = (keyA < keyB) ? -1 : (keyA > keyB) ? 1 : 0;

        if ( 0 === comp )
        {
            let valA = ObjectEntry.getValue( a );
            let valB = ObjectEntry.getValue( b );

            const typeA = typeof valA;
            const typeB = typeof valB;

            if ( [_str, _num].includes( typeA ) && [_str, _num].includes( typeB ) )
            {
                if ( _num === typeA && _num === typeB )
                {
                    comp = valA - valB;
                }
                else
                {
                    let strA = _uct( valA );
                    let strB = _uct( valB );

                    comp = (strA < strB) ? -1 : (strA > strB) ? 1 : 0;
                }
            }
        }

        return comp;
    };

    ObjectEntry.entriesToObject = function( pEntries )
    {
        let obj = {};

        if ( !isNull( pEntries ) && (isArray( pEntries ) || !isNull( pEntries[Symbol.iterator] )) )
        {
            try
            {
                for( let entry of pEntries )
                {
                    const key = ObjectEntry.getKey( entry );
                    const value = ObjectEntry.getValue( entry );

                    if ( value )
                    {
                        obj[key] = lock( value );
                    }
                }
            }
            catch( ex )
            {
                INTERNAL_LOGGER.error( ex );
            }
        }

        return obj;
    };

    const isValidEntry = e => isArray( e ) && ($ln( e ) > 1) && !(isNull( e[0] ) || isNull( e[1] )) && ( !isStr( e[0] ) || (_isValidStr( e[0] )));

    const makeObjectEntryMapper = ( pParent ) => ( e, i ) => e instanceof ObjectEntry ? e : ($ln( e ) > 1 ? ObjectEntry.from( (e[0] ?? i), (e[1] ?? e?.value), (e[2] ?? e?.parent ?? pParent ?? e) ) : [(e?.key ?? i), (e?.value ?? e[0]), e?.parent ?? pParent ?? e]);

    const stringifyKeys = e => (isArray( e ) ? [(_trim( String( e.key || e[0] ) )).replace( /^#/, _mt ), (e.value || e[1]), (e.parent || e[2])] : isNull( e ) ? [_mt, null] : e);

    const processEntries = ( pEntries = [], pParent ) =>
    {
        let entries = [];

        if ( !isNull( pEntries ) )
        {
            if ( pEntries instanceof ObjectEntry )
            {
                return [pEntries];
            }

            const filter = ( e ) => (isNonNullObj( e ) || isArray( e )) && !isFunc( e );

            const mapper = makeObjectEntryMapper( pParent );

            if ( isArray( pEntries ) || !isNull( pEntries[Symbol.iterator] ) )
            {
                entries = [...(pEntries || [])];
            }
            else if ( isMap( pEntries ) || isFunc( pEntries?.entries ) )
            {
                entries = [...(pEntries.entries() || [])];
            }
            else if ( isSet( pEntries ) || isFunc( pEntries?.values ) )
            {
                entries = [...(pEntries.values() || [])];
            }
            else
            {
                entries = isObj( pEntries ) ? (Object.entries( pEntries )) : [pEntries];
            }

            entries = entries.filter( filter ).map( mapper );
        }

        entries = _asArr( entries ).filter( isValidEntry ).map( stringifyKeys ).filter( e => isNotTransient( e[0] ) && !(_ud === typeof e[1] || isNull( e[1] )) );

        return [...(new Set( entries || [] ))].filter( isValidEntry ).map( e => ObjectEntry.from( e.key || e[0], e.value || e[1], (e.parent ?? e[2] ?? pParent) ) );
    };

    function extractClassSource( pObject )
    {
        if ( _ud === typeof pObject || isNull( pObject ) )
        {
            return _mt;
        }

        const ctr = isClass( pObject ) || isFunc( pObject ) ? pObject : (pObject?.constructor || Object.getPrototypeOf( pObject )?.constructor);

        return isClass( ctr ) || isFunc( ctr ) ? functionToString.call( ctr ) : _mt;
    }

    function extractClassName( pObject )
    {
        if ( _ud === typeof pObject || isNull( pObject ) )
        {
            return _mt;
        }

        const s = extractClassSource( pObject );

        if ( _isValidStr( s ) )
        {
            const rx = /\s*class\s*(\w+)\s+/;
            const matches = rx.exec( s );
            return (matches && $ln( matches ) > 1) ? _trim( matches[1] ) : _mt;
        }

        return _mt;
    }

    function getPrivates( pObject, pCollection, pCallback )
    {
        if ( _ud === typeof pObject || isNull( pObject ) )
        {
            return [];
        }

        let collection = ((_ud === typeof pCollection || isNull( pCollection ))) ? [] : (isArray( pCollection ) ? (pCollection instanceof ObjectEntry ? [pCollection] : [...pCollection]) : []) || [];

        let source = extractClassSource( Object.getPrototypeOf( pObject ) );

        if ( source )
        {
            const visited = new Set();

            let rx = /(get +(\w+)\( *\))|(#([^;\r\n,\s(#]+)[;\r\n,])/;

            let matches = attempt( () => rx.exec( source ) );

            while ( matches && matches?.length > 2 && source?.length > 4 )
            {
                let match = matches[2] || matches[4];

                let name = match ? String( match ).trim().replace( /^#/, _mt_str ) : _mt_str;

                if ( match && !visited.has( name ) )
                {
                    const value = attemptSilent( () => pObject[name] ) || attemptSilent( () => pObject[("#" + name)] );

                    const entry = [name, value, pObject];

                    if ( isValidEntry( entry ) )
                    {
                        if ( isFunc( pCallback ) )
                        {
                            attempt( () => pCallback.call( pObject, collection, entry ) );
                        }
                        else
                        {
                            collection.push( entry );
                        }
                        visited.add( name );
                    }
                }

                source = source.slice( matches.index + (match?.length || 0) + 4 );

                matches = attempt( () => rx.exec( source ) );
            }
        }

        return collection;
    }

    function getPrivateEntries( pObject )
    {
        return getPrivates( pObject, [], ( collection, entry ) => isNull( collection.find( e => ObjectEntry.getKey( entry ) === ObjectEntry.getKey( e ) ) ) ? collection.push( entry ) : no_op() );
    }

    function populateDateEntries( pEntries, pDate )
    {
        const date = pDate || new Date();

        pEntries.push( ["intValue", date.getTime(), date] );
        pEntries.push( ["string", date.toString(), date] );
        pEntries.push( ["isoString", date.toISOString(), date] );
        pEntries.push( ["localeString", date.toLocaleString(), date] );
        pEntries.push( ["timestamp", date.getTime(), date] );
        pEntries.push( ["day", date.getDay(), date] );
        pEntries.push( ["year", date.getFullYear(), date] );
        pEntries.push( ["month", date.getMonth(), date] );
        pEntries.push( ["date", date.getDate(), date] );
        pEntries.push( ["hours", date.getHours(), date] );
        pEntries.push( ["minutes", date.getMinutes(), date] );
        pEntries.push( ["seconds", date.getSeconds(), date] );
        pEntries.push( ["milliseconds", date.getMilliseconds(), date] );
    }

    function populateRegExpEntries( pEntries, pRx )
    {
        const rx = pRx || /_/;

        pEntries.push( ["pattern", rx.toString(), rx] );
        pEntries.push( ["source", rx.source, rx] );
        pEntries.push( ["flags", rx.flags || _mt_str, rx] );
        pEntries.push( ["lastIndex", rx.lastIndex, rx] );

        pEntries.push( ["global", rx.global, rx] );
        pEntries.push( ["ignoreCase", rx.ignoreCase, rx] );
        pEntries.push( ["multiline", rx.multiline, rx] );
        pEntries.push( ["sticky", rx.sticky, rx] );
        pEntries.push( ["unicode", rx.unicode, rx] );
    }

    function _getPrototypeClassName( pPrototype )
    {
        return isNull( pPrototype ) ? _mt : (extractClassName( pPrototype ) ?? pPrototype?.name);
    }

    function _isUserDefinedObject( pPrototype )
    {
        let className = _getPrototypeClassName( pPrototype );

        return !isNull( pPrototype ) &&
               ![_mt, "Object", ...GLOBAL_TYPE_NAMES].includes( className ) &&
               ![Object, ...GLOBAL_TYPES].includes( pPrototype );
    }

    const rxNative = /^__\w+__$/;

    const notTransient = (( e ) => !(rxNative.test( _asStr( e ) ) || TRANSIENT_PROPERTIES.includes( _asStr( e ) )));

    function getDefaultEntries( pObject, pCount = 0, pStack = [] )
    {
        if ( isNull( pObject ) || !isObj( pObject ) )
        {
            return [];
        }

        const obj = isNonNullObj( pObject ) ? pObject : {};

        const stack = [...(_asArr( pStack || [] ))];

        const entries = [];

        const callback = ( pKey ) =>
        {
            const key = _trim( String( pKey ) );

            if ( _isValidStr( key ) && isNull( entries.find( e => (key === ObjectEntry.getKey( e )) ) ) )
            {
                try
                {
                    const value = obj[key];
                    const entry = [key, value, obj];
                    if ( isValidEntry( entry ) && !(entries.map( e => ObjectEntry.getKey( e ) ).includes( key )) )
                    {
                        entries.push( entry );
                    }
                }
                catch( ex )
                {
                    //ignored
                }
            }
        };

        if ( [Date, RegExp].find( e => pObject instanceof e ) )
        {
            if ( pObject instanceof Date )
            {
                populateDateEntries( entries, pObject );
            }

            if ( pObject instanceof RegExp )
            {
                populateRegExpEntries( entries, pObject );
            }

            return entries;
        }

        attempt( () =>
                     [
                         ...Object.getOwnPropertyNames( pObject ),
                         ...Object.getOwnPropertySymbols( pObject )
                     ].filter( notTransient ).forEach( callback ) );

        let count = _asInt( pCount ) || 0;

        if ( count > 5 || detectCycles( stack, 5, 3 ) )
        {
            return entries || [];
        }

        let prototype = Object.getPrototypeOf( pObject );

        if ( prototype )
        {
            let className = _getPrototypeClassName( prototype );

            while ( _isUserDefinedObject( prototype ) && count < 10 )
            {
                attempt( () =>
                             [
                                 ...Object.getOwnPropertyNames( prototype ),
                                 ...Object.getOwnPropertySymbols( prototype )
                             ].filter( notTransient ).forEach( callback ) );

                prototype = Object.getPrototypeOf( prototype );

                className = _getPrototypeClassName( prototype );
            }
        }

        return [...(new Set( entries ))];
    }

    function initializeEntries( pObject )
    {
        if ( isNull( pObject ) || !isObj( pObject ) || $scope() === pObject )
        {
            return [];
        }

        if ( pObject instanceof ObjectEntry )
        {
            return [pObject];
        }

        const mapper = makeObjectEntryMapper( pObject );

        if ( isArray( pObject ) || TYPED_ARRAYS.some( e => pObject instanceof e ) )
        {
            const arr = _asArr( pObject );
            return arr.map( ( e, i ) => new ObjectEntry( i, e, pObject ) );
        }

        if ( isMap( pObject ) || isFunc( pObject?.entries ) )
        {
            return [...(pObject.entries() || [])].map( mapper );
        }

        if ( isSet( pObject ) || isFunc( pObject?.values ) )
        {
            return [...(pObject.values() || [])].map( mapper );
        }

        if ( pObject instanceof WeakRef )
        {
            let object = attempt( () => dereference( pObject ) ) || pObject;
            if ( isNonNullObj( object ) && (object !== pObject) && !(object instanceof WeakRef) )
            {
                return initializeEntries( object );
            }
        }

        return getDefaultEntries( pObject );
    }

    function getEntries( pObject, pVisited = new Set(), pStack = [], pDepth = 0 )
    {
        if ( isNull( pObject ) || !isObj( pObject ) || $scope() === pObject )
        {
            return [];
        }

        if ( pObject instanceof ObjectEntry )
        {
            return [pObject];
        }

        const { visited, stack, depth } = initializeRecursionArgs( pVisited, pStack, pDepth );

        const entries = initializeEntries( pObject ) || [];

        if ( isInfiniteLoop( pObject, visited, stack, depth ) )
        {
            return entries;
        }

        visited.add( pObject );

        const privateEntries = getPrivateEntries( pObject ) || [];

        if ( privateEntries && $ln( privateEntries ) )
        {
            const notAlreadyPresent = e =>
            {
                const searchPredicate = t => ObjectEntry.getKey( e ) === ObjectEntry.getKey( t );

                return isNull( entries.find( searchPredicate ) );
            };

            entries.push( ...((_asArr( privateEntries.filter( notAlreadyPresent ) )) || []) );
        }

        return processEntries( _asArr( entries || [] ), pObject );
    }

    function objectEntries( ...pObject )
    {
        let objects = [...(isArray( pObject ) ? _asArr( pObject ).filter( isNonNullObj ) : [pObject])].filter( e => _obj === typeof e );

        objects = isNull( objects ) ? [] : (!isArray( objects ) ? [] : objects.filter( e => isNonNullObj( e ) && ($scope() !== e) ));

        if ( $ln( objects ) <= 0 )
        {
            return [];
        }

        let entries = [];

        const populateEntry = e => isValidEntry( e ) ? entries.push( e ) : no_op();

        if ( 1 === $ln( objects ) )
        {
            let object = objects[0];

            if ( isNonNullObj( object ) )
            {
                if ( pObject instanceof ObjectEntry )
                {
                    populateEntry( pObject );
                    return entries;
                }

                const items = (getEntries( object ) || []).filter( isNonNullObj );

                if ( $ln( items ) > 0 )
                {
                    _asArr( items || [] ).forEach( populateEntry );

                    entries = processEntries( entries, object || pObject );
                }
            }
        }
        else if ( $ln( objects ) > 0 )
        {
            for( let object of objects )
            {
                const items = objectEntries( object ).filter( isValidEntry );
                if ( $ln( items ) > 0 )
                {
                    _asArr( items || [] ).forEach( populateEntry );
                }
            }
        }

        return entries.map( e => e instanceof ObjectEntry ? e : ObjectEntry.from( e ) );
    }

    function objectValues( pObject )
    {
        const values = [...((isNonNullObj( pObject ) ? (isMap( pObject ) || isSet( pObject ) || isFunc( pObject?.values ) ? attempt( () => [...(pObject.values() || Object.values( pObject || {} ) || [])] ) || attempt( () => [...(Object.values( pObject || {} ) || [])] ) : (Object.values( pObject || {} )) || []) : []) || [])];
        attemptSilent( () => ([...((objectEntries( pObject || {} ) || []) || [])].filter( e => isArray( e ) && $ln( e ) > 1 )).forEach( e => values.push( e[1] ) ) );
        return [...(new Set( _asArr( values ).filter( e => _ud !== typeof e && null !== e ) ))];
    }

    function objectKeys( pObject )
    {
        const keys = (isNonNullObj( pObject ) ? (isMap( pObject ) || isFunc( pObject?.keys ) ? [...(pObject.keys() || [])] : Object.keys( pObject || {} )) : []) || [];
        attemptSilent( () => ([...((objectEntries( pObject || {} ) || []) || [])].filter( e => isArray( e ) && $ln( e ) > 0 )).forEach( e => keys.push( e[0] ) ) );
        return [...(new Set( _asArr( keys ).filter( e => null != e && isStr( e ) && _isValidStr( e ) ) ))];
    }

    function toMap( pObject )
    {
        let map = new Map();

        if ( isNonNullObj( pObject ) )
        {
            if ( isMap( pObject ) || isFunc( pObject.entries ) )
            {
                return new Map( pObject.entries() );
            }

            const entries = objectEntries( pObject );

            if ( $ln( entries ) )
            {
                entries.forEach( entry =>
                                 {
                                     const key = ObjectEntry.getKey( entry );
                                     const value = ObjectEntry.getValue( entry );

                                     if ( isStr( key ) && !isNull( value ) )
                                     {
                                         map.set( String( key ), value );
                                     }
                                 } );
            }
        }

        return map;
    }

    ObjectEntry.isValidEntry = function( pEntry, pLax = false )
    {
        let valid = !isNull( pEntry ) && ((pEntry instanceof ObjectEntry) && pEntry.isValid());

        if ( !valid && !!pLax )
        {
            valid = isValidEntry( pEntry );
        }

        return valid;
    };


    function populateProperties( pTarget, pSource, ...pOmit )
    {
        let target = resolveObject( pTarget || {} );

        if ( !isReadOnly( target ) )
        {
            let source = resolveObject( pSource || {} );

            let skip = [...((pOmit || []) || [])];

            attempt( () => objectEntries( source ).forEach( entry =>
                                                            {
                                                                let prop = ObjectEntry.getKey( entry );
                                                                let value = ObjectEntry.getValue( entry );

                                                                if ( ( !skip.includes( prop ) || isNull( target[prop] )) && isWritable( target, prop ) )
                                                                {
                                                                    attemptSilent( () => (target[prop] = target[prop] || (isArray( value ) ? [...((value || []) || [])] : value) || target[prop]) );
                                                                }
                                                            } ) );
        }

        return target;
    }

    function overwriteProperties( pTarget, pSource, ...pOmit )
    {
        let target = resolveObject( pTarget || {} );

        if ( !isReadOnly( target ) )
        {
            let source = resolveObject( pSource || {} );

            let skip = [...((pOmit || []) || [])];

            objectEntries( source ).forEach( entry =>
                                             {
                                                 let prop = ObjectEntry.getKey( entry );
                                                 let value = ObjectEntry.getValue( entry );

                                                 if ( !skip.includes( prop ) && (isNull( target[prop] ) || isWritable( target, prop )) )
                                                 {
                                                     attemptSilent( () => (target[prop] = (isArray( value ) ? [...((value || []) || [])] : value) || target[prop]) );
                                                 }
                                             } );
        }

        return target;
    }

    const isInfiniteLoop = ( object, visited, stack, depth ) => visited.has( object ) || detectCycles( stack, 5, 3 ) || depth > MAX_STACK_SIZE;

    const DEFAULT_IS_LITERAL_OPTIONS =
        {
            recursive: true,
        };

    /**
     * Returns true if the specified value is an object literal.<br>
     * An object literal is an object or array
     * that is not constructed as an instance of a class or built-in type.<br>
     * <br>
     *
     * <br>
     * @param {*} pObject - The value to be evaluated.
     * @param pOptions
     * @param pVisited
     * @param pStack
     * @param pDepth
     * @return {boolean} Returns true if the input is an object literal, otherwise false.
     */
    function isObjectLiteral( pObject,
                              pOptions = DEFAULT_IS_LITERAL_OPTIONS,
                              pVisited = new Set(),
                              pStack = [],
                              pDepth = 0 )
    {
        const options = { ...DEFAULT_IS_LITERAL_OPTIONS, ...(pOptions || {}) };

        const { visited, stack, depth } = initializeRecursionArgs( pVisited, pStack, pDepth, options );

        let isLiteral = false;

        if ( isNonNullObj( pObject ) )
        {
            const matchedTypes = GLOBAL_TYPES.filter( e => pObject instanceof e );

            if ( $ln( matchedTypes ) > 0 )
            {
                return false;
            }

            const proto = Object.getPrototypeOf( pObject );

            const hasUserDefinedConstructor = hasCustomConstructor( pObject );

            isLiteral = (isNull( proto ) || !hasUserDefinedConstructor);

            if ( isInfiniteLoop( pObject, visited, stack, depth ) )
            {
                return isLiteral;
            }

            if ( isArray( pObject ) )
            {
                isLiteral = attempt( () => pObject.every( (( e, i ) => isNull( e ) || isPrimitive( e ) || isObjectLiteral( e, options, visited, [...stack, String( i )] )) ) );

                visited.add( pObject );

                return isLiteral;
            }

            if ( isLiteral && options?.recursive )
            {
                const entries = isNonNullObj( pObject ) ? objectEntries( pObject ) : isArray( pObject ) ? pObject.map( ( e, i ) => [String( i ), e] ) : [];

                while ( entries.length > 0 && isLiteral )
                {
                    const entry = entries.shift();

                    if ( entry )
                    {
                        const value = entry?.value || entry[1];

                        isLiteral = isNull( value ) || isPrimitive( value ) || isObjectLiteral( value, options, visited, [...stack, (entry.key || entry[0])] );

                        if ( isNonNullObj( value ) )
                        {
                            visited.add( value );
                        }
                    }
                }
            }

            visited.add( pObject );
        }

        return isLiteral;
    }

    class ObjectRegistry
    {
        #registerPrimitives = false;
        #registerPredefined = false;
        #registerArrays = false;
        #registerFunctions = false;

        #map = new WeakMap();
        #created = new WeakMap();

        #guidGenerator = $scope().crypto || ((isDeno() && _ud !== typeof Deno) ? Deno.crypto : attempt( () => require( "node:crypto" ) )) || attempt( () => require( "crypto" ) ) || new UUIDGenerator();

        constructor( pRegisterPrimitives = false, pRegisterPredefined = false, pRegisterArrays = false, pRegisterFunctions = false )
        {
            this.#registerPrimitives = !!pRegisterPrimitives;
            this.#registerPredefined = !!pRegisterPredefined;
            this.#registerArrays = !!pRegisterArrays;
            this.#registerFunctions = !!pRegisterFunctions;
        }

        #generateGuid()
        {
            return (this.#guidGenerator || new UUIDGenerator()).randomUUID();
        }

        #generateTimestamp()
        {
            return Date.now();
        }

        register( pObject )
        {
            if ( isNull( pObject ) || isPrimitive( pObject ) )
            {
                return ObjectRegistry.NOT_REGISTERED;
            }

            let guid = this.#map.get( pObject );

            if ( isNull( guid ) || String( guid ).startsWith( ObjectRegistry.NOT_REGISTERED ) )
            {
                if ( isNull( pObject ) || !(isObj( pObject ) || ( !this.#registerFunctions && isFunc( pObject ))) )
                {
                    return ObjectRegistry.NOT_REGISTERED;
                }

                if ( !(this.#registerPrimitives || this.#registerPredefined) && isPrimitiveWrapper( pObject ) )
                {
                    return ObjectRegistry.NOT_REGISTERED;
                }
                else if ( !this.#registerPredefined && isGlobalType( pObject ) )
                {
                    if ( !this.#registerArrays || !(isArray( pObject ) || isSet( pObject )) )
                    {
                        return ObjectRegistry.NOT_REGISTERED;
                    }
                }

                if ( isFunc( pObject ) && this.#registerFunctions )
                {
                    if ( !this.#registerPredefined &&
                         isClass( pObject ) &&
                         GLOBAL_TYPES.includes( pObject ) )
                    {
                        return ObjectRegistry.NOT_REGISTERED;
                    }
                }

                guid = this.#generateGuid( pObject );
                this.#map.set( pObject, guid );

                let timestamp = this.#created.get( pObject ) || this.#generateTimestamp();
                this.#created.set( pObject, timestamp );
            }

            return guid;
        }

        getGuid( pObject )
        {
            if ( isNull( pObject ) || isPrimitive( pObject ) )
            {
                return ObjectRegistry.NOT_REGISTERED + _underscore + String( (Math.random() + 1) * Date.now() );
            }

            return this.#map.get( pObject ) || this.register( pObject );
        }

        getCreated( pObject )
        {
            if ( isNull( pObject ) || isPrimitive( pObject ) )
            {
                return -1;
            }

            let timestamp = -1;

            if ( isNonNullObj( pObject ) )
            {
                timestamp = this.#created.get( pObject ) || this.#generateTimestamp();
                this.#created.set( pObject, timestamp );
            }

            return timestamp;
        }

        identical( pObjectA, pObjectB )
        {
            if ( (isNull( pObjectA ) && isNull( pObjectB )) || pObjectA === pObjectB )
            {
                return true;
            }

            if ( !(isObj( pObjectA ) || isFunc( pObjectA )) || !(isObj( pObjectB ) || isFunc( pObjectB )) )
            {
                return false;
            }

            return (this.getGuid( pObjectA ) === this.getGuid( pObjectB ));
        }

        /**
         * Returns true if the 2 objects (or functions) are *very likely*
         * either identical or represent the same data
         *
         * @param {Object|Function} pObjectA The first of 2 objects or functions to compare
         * @param {Object|Function} pObjectB The object or function to compare to the first
         * @param pStack
         * @returns {boolean} true if the specified objects or functions
         *                    are the same object or function
         *                    or if the 2 objects appear to represent the same data.
         *
         *                    This method trades certainty for performance.
         *                    To accurately and reliably compare 2 objects for equality,
         *                    use the ObjectUtils package
         */
        similar( pObjectA, pObjectB, pStack = [] )
        {
            // if they are the same value, object, or function, return true
            if ( pObjectA === pObjectB || this.identical( pObjectA, pObjectB ) )
            {
                return true;
            }

            const stack = [...(pStack || [])];

            if ( detectCycles( stack, 3, 3 ) )
            {
                INTERNAL_LOGGER.error( `An infinite loop was encountered while comparing 2 objects: stack=[${stack.join( "->" )}]` );
                return false;
            }

            // if both values are objects
            if ( isNonNullObj( pObjectA ) && isNonNullObj( pObjectB ) )
            {
                const keysA = Object.keys( pObjectA );
                const keysB = Object.keys( pObjectB );

                // if the objects have a different number of properties, return false
                if ( $ln( keysA ) !== $ln( keysB ) )
                {
                    return false;
                }

                // prepare to compare whether the objects have the same property names
                const commonKeysA = [...keysA].filter( e => keysB.includes( e ) );
                const commonKeysB = [...keysB].filter( e => keysA.includes( e ) );

                // if the collections of common property names are of different lengths, return false
                if ( $ln( commonKeysA ) !== $ln( commonKeysB ) ||
                     $ln( commonKeysA ) !== $ln( keysB ) ||
                     $ln( commonKeysB ) !== $ln( keysA ) )
                {
                    return false;
                }

                // if both objects have the same set of properties,
                // we recursively compare their properties
                for( let key of keysA )
                {
                    let valueA = pObjectA[key];
                    let valueB = pObjectB[key];

                    if ( (isNull( valueA ) && !isNull( valueB )) || ( !isNull( valueA ) && isNull( valueB )) )
                    {
                        return false;
                    }

                    if ( isPrimitive( valueA ) )
                    {
                        if ( valueA !== valueB )
                        {
                            return false;
                        }
                    }
                    else if ( isPrimitiveWrapper( valueA ) && isPrimitiveWrapper( valueB ) )
                    {
                        let a = isFunction( valueA.valueOf ) ? valueA.valueOf() : isFunction( valueA.toString ) ? valueA.toString() : (_mt + valueA);

                        let b = isFunction( valueB.valueOf ) ? valueB.valueOf() : isFunction( valueB.toString ) ? valueB.toString() : (_mt + valueB);

                        if ( a !== b )
                        {
                            return false;
                        }
                    }
                    else if ( isNonNullObj( valueA ) && isNonNullObj( valueB ) )
                    {
                        if ( !this.similar( valueA, valueB, [...stack, key] ) )
                        {
                            return false;
                        }
                    }
                    else if ( $ln( valueA ) !== $ln( valueB ) )
                    {
                        return false;
                    }
                }

                // if we get this far, the objects might not be the same,
                // but they are certainly similar
                return true;
            }
            else if ( isFunc( pObjectA ) && isFunc( pObjectB ) )
            {
                return String( _mt_str + functionToString.call( pObjectA ) ).trim() === String( _mt_str + functionToString.call( pObjectB ) ).trim();
            }

            return false;
        }

        areEqual( pObjectA, pObjectB, pStack = [] )
        {
            if ( pObjectA === pObjectB || this.identical( pObjectA, pObjectB ) )
            {
                return true;
            }

            const stack = [...(pStack || [])];

            if ( detectCycles( stack, 3, 3 ) )
            {
                INTERNAL_LOGGER.error( `An infinite loop was encountered while comparing 2 objects: stack=[${stack.join( "->" )}]` );
                return false;
            }

            if ( this.similar( pObjectA, pObjectB, stack ) )
            {
                //TODO: additional checks
                return true;
            }

            return false;
        }
    }

    ObjectRegistry.NOT_REGISTERED = "__unregistered__";
    ObjectRegistry.DEFAULT_INSTANCE = new ObjectRegistry();

    const OBJECT_REGISTRY = $scope()["__BOCK_OBJECT_REGISTRY__"] = ($scope()["__BOCK_OBJECT_REGISTRY__"] || ObjectRegistry.DEFAULT_INSTANCE);

    class Merger
    {
        #objects;

        constructor( ...pObjects )
        {
            let arr = [...(pObjects || [])].filter( isNonNullObj );
            this.#objects = arr.reverse();
        }

        get merged()
        {
            let visited = new Map();
            let stack = [];

            let arr = [...(this.#objects || [])].filter( isNonNullObj );

            if ( 1 === arr.length )
            {
                return Object.assign( {}, arr[0] || {} );
            }

            let obj = {};

            while ( arr.length )
            {
                obj = this.merge( obj, arr.shift(), visited, stack );
            }

            return Object.assign( {}, obj );
        }

        resolveObject( pObj, pAsArray = false )
        {
            return isNull( pObj ) ? (!!pAsArray ? [] : {}) : !isObj( pObj ) ? (!!pAsArray ? [pObj] : { value: pObj }) : pObj;
        }

        calculateValue( pValue, pDefault )
        {
            if ( isNull( pValue ) )
            {
                return pDefault;
            }
            return isObj( pValue ) ? (isArray( pValue ) ? [...pValue] : isMap( pValue ) ? new Map( pValue ) : isSet( pValue ) ? new Set( pValue ) : isRegExp( pValue ) ? pValue : isDate( pValue ) ? new Date( pValue ) : pValue) : pValue;
        }

        merge( pObjA, pObjB, pVisited = new Map(), pStack = [] )
        {
            let visited = pVisited || new Map();
            let stack = pStack || [];

            const source = this.resolveObject( pObjB );
            const target = this.resolveObject( pObjA );

            const sourceGuid = ObjectRegistry.DEFAULT_INSTANCE.getGuid( source );
            const targetGuid = ObjectRegistry.DEFAULT_INSTANCE.getGuid( target );

            if ( detectCycles( stack, 3, 3 ) )
            {
                return Object.assign( {}, visited.get( targetGuid ) || visited.get( sourceGuid ) || target || source );
            }

            visited.set( sourceGuid, source );
            visited.set( targetGuid, target );

            stack.push( sourceGuid );
            stack.push( targetGuid );

            let obj = Object.assign( {}, target );

            const entries = Object.entries( source );

            for( let entry of entries )
            {
                let key = _asStr( entry[0] ).trim();
                let value = entry[1];

                if ( key && !isNull( value ) && !(key.startsWith( "__" )) )
                {
                    let existing = obj[key];

                    if ( isNull( existing ) )
                    {
                        obj[key] = this.calculateValue( value, existing );
                    }
                    else
                    {
                        switch ( typeof existing )
                        {
                            case _obj:
                                if ( isArray( existing ) )
                                {
                                    existing = [...(existing || [])];

                                    if ( isArray( value ) )
                                    {
                                        for( let i = value.length; i--; )
                                        {
                                            existing[i] = this.calculateValue( value[i], existing[i] );
                                        }
                                    }
                                    obj[key] = [...existing];
                                }
                                else
                                {
                                    obj[key] = this.merge( obj[key], value, visited, stack.concat( OBJECT_REGISTRY.getGuid( obj[key] ) ).concat( OBJECT_REGISTRY.getGuid( value ) ) );
                                }

                                break;

                            case _fun:
                                if ( isFunc( value ) )
                                {
                                    obj[key] = value.bind( obj );
                                }
                                break;

                            default:
                                obj[key] = this.calculateValue( value, obj[key] );
                                break;
                        }
                    }
                }
            }

            return Object.assign( {}, obj );
        }
    }

    /**
     * Performs only a 1-level depth copy; shallow at depths beyond that.
     * Objects encountered during the copy that are NOT object literals are not decomposed.
     * Objects encountered during the copy that are NOT object literals that have a clone method ARE cloned.
     * This is intended for more performance-sensitive usage where a deep copy is not necessary
     * @param pOptions
     * @param pDefaults
     */
    function resolveOptions( pOptions, ...pDefaults )
    {
        let sources = [...(pDefaults || [])].filter( isNonNullObj );

        if ( isNonNullObj( pOptions ) )
        {
            sources.unshift( Object.assign( {}, resolveObject( pOptions || {}, true ) ) );
        }

        sources = sources.reverse();

        let options = {};

        function copyProperties( pTarget, pSource, pDepth = 0, pVisited = new Map(), pStack = [] )
        {
            let depth = _asInt( pDepth || 0, 0 ) || 0;

            let visited = isMap( pVisited ) ? pVisited : new Map();

            let stack = [...(pStack || [])];

            if ( isInvalidObj( pSource ) || visited.has( OBJECT_REGISTRTY.getGuid( pSource ) ) )
            {
                return pTarget;
            }

            if ( depth > 1 || !isObjectLiteral( pSource ) || detectCycles( stack, 3, 3 ) )
            {
                return Object.assign( (pTarget || options),
                                      isFunc( pSource?.clone ) ?
                                      attempt( () => pSource.clone() )
                                                               : pSource );
            }

            const entries = objectEntries( pSource );

            visited.set( OBJECT_REGISTRY.getGuid( pSource ), pSource );

            entries.forEach( entry =>
                             {
                                 const key = ObjectEntry.getKey( entry );
                                 const value = ObjectEntry.getValue( entry );

                                 if ( key && (_ud !== typeof value) )
                                 {
                                     pTarget[key] = (isNonNullObj( value ) ?
                                                     copyProperties( (pTarget[key] || (isArray( value ) ? [] : {})),
                                                                     value,
                                                                     ++depth,
                                                                     visited,
                                                                     stack.concat( key ) ) :
                                                     isBool( pTarget[key] ) ? (null === value ? false : !!value) :
                                                     value);
                                 }
                             } );

            return pTarget;
        }

        for( let source of sources )
        {
            try
            {
                options = { ...options, ...source };

                options = copyProperties( options, source ) || { ...(source || {}), ...(options || {}) };
            }
            catch( ex )
            {
                // ignore this...
            }
        }

        return options;
    }

    const populateOptions = function( pOptions, ...pDefaults )
    {
        let options = isNonNullObj( pOptions ) ? pOptions : {};
        let defaults = isArray( pDefaults ) ? [...(pDefaults || [])] : isNull( pDefaults ) ? [{}] : [pDefaults];
        return attempt( () => resolveOptions( options, ...defaults ) );
    };

    function resolveTransientProperties( pOptions )
    {
        const options = { ...{ transientProperties: [...TRANSIENT_PROPERTIES] }, ...(pOptions || {}) };

        return [...(new Set( [...TRANSIENT_PROPERTIES, ...(([options.transientProperties] || []).flat())] ))];
    }

    const isTransient = function( pPropertyName, pOptions )
    {
        const transientProperties = resolveTransientProperties( pOptions );
        return transientProperties.includes( pPropertyName );
    };

    const isNotTransient = function( pPropertyName, pOptions )
    {
        return !isTransient( pPropertyName, pOptions );
    };

    /**
     * The ExecutionMode class represents a mode of execution,
     * such as "Production", "Development", "Testing", etc.
     * <br>
     * <br>
     * The mode also defines whether 'tracing' is enabled,
     * which is usually reserved for Debugging-related modes.
     * <br>
     * @class
     */
    class ExecutionMode
    {
        #name;
        #traceEnabled;

        #options;

        /**
         * Constructs an instance of the ExecutionMode class.<br>
         * <br>
         *
         * @param {string} pName - The name of the mode.
         *
         * @param {boolean} [pTraceEnabled=false] - Optional flag to enable or disable tracing. Defaults to false.
         *
         * @param pOptions
         * @return {ExecutionMode} A new instance of the class with the specified name and trace settings.
         */
        constructor( pName, pTraceEnabled = false, pOptions = {} )
        {
            this.#name = _spcToChar( _ucase( _asStr( pName || S_NONE ).trim() ) );

            this.#traceEnabled = !!pTraceEnabled;

            this.#options = { ...(pOptions || {}) };
        }

        /**
         * Returns the name of this mode.<br>
         * The name is always an uppercase string
         * with any whitespace replaced with underscore characters
         *
         * @return {string} The formatted name in uppercase.
         */
        get name()
        {
            return _spcToChar( _ucase( _asStr( this.#name ).trim() ) );
        }

        get options()
        {
            return { ...(this.#options || {}) };
        }

        /**
         * Returns true if this mode supports trace-level debugging.
         *
         * @return {boolean} true if this mode supports trace-level debugging.
         */
        get traceEnabled()
        {
            return !!this.#traceEnabled;
        }

        /**
         * Returns true if the specified object is the same as this object.<br>
         * The other object is the same if it is actually this exact object
         * or if it's name is the same as the name of this instance.
         * <br>
         *
         * @param {Object} pOther - The object to compare to this instance.
         *
         * @return {boolean} true if the objects are considered equal, false otherwise.
         */
        equals( pOther )
        {
            return (this === pOther) || (_ucase( _asStr( this.name ) ).trim()) === (_ucase( _asStr( pOther?.name ) ).trim());
        }
    }

    /**
     * Enumeration representing the default execution modes.<br>
     */
    ExecutionMode.MODES =
        {
            NONE: freeze( new ExecutionMode( _ucase( S_NONE ), false ) ),
            PROD: freeze( new ExecutionMode( "PRODUCTION", false ) ),
            PRODUCTION: freeze( new ExecutionMode( "PRODUCTION", false ) ),
            DEV: freeze( new ExecutionMode( "DEVELOPMENT", false ) ),
            DEVELOPMENT: freeze( new ExecutionMode( "DEVELOPMENT", false ) ),
            DEBUG: freeze( new ExecutionMode( "DEBUG", true ) ),
            TEST: freeze( new ExecutionMode( "TEST", true ) ),
            TRACE: freeze( new ExecutionMode( "TRACE", true ) )
        };

    ExecutionMode.isProduction = function( pMode = CURRENT_MODE )
    {
        return ExecutionMode.MODES.PROD.equals( pMode || CURRENT_MODE ) || ExecutionMode.MODES.PRODUCTION.equals( pMode || CURRENT_MODE );
    };
    // adds each Execution Mode constant as a static member of the ExecutionMode class
    Object.entries( ExecutionMode.MODES ).forEach( ( [key, value] ) =>
                                                   {
                                                       ExecutionMode[key] = value;
                                                   } );

    // noinspection OverlyComplexFunctionJS
    ExecutionMode.from = function( pArg )
    {
        let arg = isNumeric( pArg ) ? _asInt( pArg ) : _asStr( pArg );

        if ( isNumber( arg ) )
        {
            switch ( _asInt( arg ) )
            {
                case 0:
                    return ExecutionMode.MODES.NONE;

                case 1:
                    return ExecutionMode.MODES.PROD;

                case 2:
                    return ExecutionMode.MODES.DEV;

                case 3:
                    return ExecutionMode.MODES.DEBUG;

                case 4:
                    return ExecutionMode.MODES.TEST;

                case 5:
                    return ExecutionMode.MODES.TRACE;

                default:
                    return ExecutionMode.MODES.DEFAULT;
            }
        }
        else if ( isStr( arg ) )
        {
            if ( (/prod/i).test( arg ) )
            {
                return ExecutionMode.MODES.PROD;
            }

            if ( (/dev/i).test( arg ) )
            {
                return ExecutionMode.MODES.DEV;
            }

            if ( (/debug/i).test( arg ) )
            {
                return ExecutionMode.MODES.DEBUG;
            }

            if ( (/test|qa/i).test( arg ) )
            {
                return ExecutionMode.MODES.TEST;
            }

            if ( (/trace|verbose/i).test( arg ) )
            {
                return ExecutionMode.MODES.TRACE;
            }

            return Execution.MODES.DEFAULT;
        }

        return Execution.MODES.DEFAULT;
    };

    ExecutionMode.calculate = function()
    {
        if ( _ud !== typeof process )
        {
            const execMode = _asStr( process.env["EXECUTION-MODE"], true ) || _mt_str;

            if ( "PRODUCTION" === _ucase( execMode ) )
            {
                return ExecutionMode.MODES.PROD;
            }

            if ( _mt_str !== execMode.trim() )
            {
                return ExecutionMode[_ucase( execMode )] || ExecutionMode.MODES.DEFAULT;
            }

            return ExecutionMode.MODES.DEFAULT;
        }
        return ExecutionMode.MODES.DEFAULT;
    };

    /**
     * This constant represents the default execution mode
     * if no mode is defined when the module is loaded.
     * @type {ExecutionMode}
     */
    ExecutionMode.MODES.DEFAULT = freeze( ExecutionMode.MODES.DEV );

    /**
     * This static member represents the default execution mode to be assumed
     * when no mode is defined when the module is loaded.
     * @type {ExecutionMode}
     */
    ExecutionMode.DEFAULT = freeze( ExecutionMode.MODES.DEFAULT );

    /**
     * This constant represents the current ExecutionMode.<br>
     * The ExecutionMode can be set in the Environment
     * or passed on the command line when the application using this module is executed.
     * <br><br>
     * A value passed on the command line takes precedence over any environment variables set.
     * <br>
     * @type {ExecutionMode}
     */
    const CURRENT_MODE = freeze( ExecutionMode.MODES[ARGUMENTS.get( "mode", "~~" )] ||
                                 ExecutionMode.MODES[ENVIRONMENT["EXECUTION-MODE"]] ||
                                 ExecutionMode.calculate() ||
                                 ExecutionMode.DEFAULT );

    /**
     * This static member is set to the current execution mode.<br>
     *
     * @type {ExecutionMode}
     */
    ExecutionMode.CURRENT = freeze( CURRENT_MODE || ExecutionMode.DEFAULT );

    /**
     * Defines a new execution mode for the program.<br>
     * <br>
     * An execution mode specifies a particular configuration or setup in which the program operates.<br>
     * <br>
     *
     * @param {string} pName - The name of the execution mode to define.
     * @param {boolean} [pTraceEnabled=false] Whether to emit more verbose information during application execution.
     * @returns {ExecutionMode} The newly defined Execution MOde if it did not already exist.
     * @throws {Error} Throws an error if the name is not valid or collides with an existing mode.
     */
    ExecutionMode.defineMode = function( pName, pTraceEnabled = false )
    {
        if ( isStr( pName ) && _mt_str !== _asStr( pName ).trim() )
        {
            const name = _spcToChar( _ucase( _asStr( pName || S_NONE ).trim() ) );
            const traceEnabled = !!pTraceEnabled;

            if ( null == ExecutionMode[name] )
            {
                const executionMode = new ExecutionMode( name, traceEnabled );

                ExecutionMode.MODES[name] = freeze( executionMode );
                ExecutionMode[name] = freeze( executionMode );

                return executionMode;
            }
        }
        throw new Error( `Invalid or existing mode name: ${pName}` );
    };

    if ( ExecutionMode.CURRENT.traceEnabled )
    {
        handleAttempt.enableTrace();
    }

    /**
     * This is the object used by some environments to export functionality.<br>
     * In other environments, we just provide an empty object to avoid checking for the environment.<br>
     * @type {NodeModule|Object}
     */
    const MODULE_OBJECT = (_ud !== typeof module) ? module : { exports: {} };

    /**
     * Returns an object corresponding to a set of default options with one or more properties
     * overridden or added by the properties of the specified pOptions
     *
     * @param {Object} pOptions  An object whose properties should be used
     * @param {...Object} pDefaults One or more objects holding defaults for the properties to be used
     * @returns {Object} A new object combining the defaults with the specified options
     */
    function deepMergeOptions( pOptions, ...pDefaults )
    {
        return (((new Merger( pOptions, ...pDefaults )).merged) || pOptions || {});
    }

    /**
     *
     */
    function getRuntimeLocale()
    {
        const format = new Intl.DateTimeFormat() || new Intl.NumberFormat();

        const resolvedOptions = format?.resolvedOptions();

        return resolvedOptions?.locale || new Intl.Locale( DEFAULT_LOCALE_STRING );
    }

    const runtimeLocaleString = () => getRuntimeLocale()?.baseName || DEFAULT_LOCALE_STRING;

    const getMessagesLocale = function( pEnvironment = ENVIRONMENT )
    {
        const environment = resolveObject( pEnvironment || _ENV, false );

        let locale = environment?.LC_ALL ||
                     environment?.LC_MESSAGES ||
                     environment?.LANG ||
                     getRuntimeLocale();

        if ( locale instanceof Intl.Locale )
        {
            return locale;
        }

        return getRuntimeLocale();
    };

    /**
     * Returns the Locale string, such as "en-US",
     * representing the language and region
     * that will be used to resolve messages
     * that are specified using features of the ResourceUtils module.
     * <br><br>
     * This is either the default locale for the system hosting the runtime<br>
     * or can be specified by any one of the following environment properties:<br>
     * <br>
     * LC_ALL
     * LC_MESSAGES
     * LANG
     *
     * @returns the Locale string, such as "en-US", representing the language and region
     * that will be used to resolve messages
     */
    const getMessagesLocaleString = function( pEnvironment = ENVIRONMENT )
    {
        let locale = getMessagesLocale( pEnvironment || ENVIRONMENT );

        if ( locale instanceof Intl.Locale )
        {
            return (locale?.baseName || runtimeLocaleString());
        }

        if ( isStr( locale ) )
        {
            attempt( () => locale = new Intl.Locale( locale ) );
        }

        return (locale instanceof Intl.Locale) ? locale.baseName || locale.toString() : runtimeLocaleString();
    };

    /**
     * This class provides a representation of an execution environment<br>
     * which encapsulates global scope, process metadata, localization, runtime capabilities, platform details, and other
     * environment-specific resources.<br>
     * <br>
     * It can be used to differentiate between different runtime contexts,
     * such as Node.js, Deno, and browser environments.<br>
     *
     * @class
     */
    class ExecutionEnvironment
    {
        #process;

        #versions;
        #version;

        #console;

        #document;
        #window;
        #navigator;
        #userAgent;
        #location;
        #history;
        #performance;
        #customElements;

        #fetch;

        #DenoGlobal;

        #ENV = { ...ENVIRONMENT };
        #ARGUMENTS = lock( ARGUMENTS );

        #localeCode = getMessagesLocaleString( ENVIRONMENT );

        #mode = CURRENT_MODE;

        // noinspection OverlyComplexFunctionJS
        constructor( pGlobalScope )
        {
            const globalScope = pGlobalScope || $scope();

            this.#ENV = { ...ENVIRONMENT };
            this.#ARGUMENTS = lock( ARGUMENTS );

            this.#DenoGlobal = _ud === typeof Deno && _ud === typeof globalScope?.Deno ? null : (_ud !== typeof Deno ? Deno : null) || globalScope?.Deno;

            this.#process = _ud !== typeof process ? process : this.#DenoGlobal || null;

            this.#versions = this.#process?.versions || this.#DenoGlobal?.version || {};

            this.#version = this.#versions?.node || this.#versions?.deno;

            this.#mode = ExecutionMode.calculate() || CURRENT_MODE;

            this.#console = (DEBUG_MODE || this.#mode?.traceEnabled) ? DEBUG_LOGGER : (ExecutionMode.isProduction( this.#mode ) ? PRODUCTION_LOGGER : INTERNAL_LOGGER);

            this.#window = _ud !== typeof window ? window : null;

            this.#document = _ud !== typeof document ? document : _ud === typeof window ? null : window?.document;

            this.#navigator = _ud !== typeof navigator ? navigator : (_ud !== typeof window ? window?.navigator : null);

            this.#userAgent = this.#navigator?.userAgent || (_ud === typeof window ? null : window?.navigator?.userAgent);

            this.#location = _ud !== typeof location ? location : (_ud === typeof window ? null : window?.location);

            this.#history = _ud !== typeof history ? history : (_ud === typeof window ? null : window?.history);

            this.#performance = _ud !== typeof performance ? performance : null;

            this.#customElements = _ud !== typeof customElements ? customElements : null;

            this.#fetch = _ud !== typeof fetch && isFunc( fetch ) ? fetch : null;

            this.#localeCode = this.#navigator?.language || getMessagesLocaleString( this.#ENV ) || DEFAULT_LOCALE_STRING;
        }

        clone()
        {
            return new ExecutionEnvironment( this.globalScope );
        }

        get globalScope()
        {
            return $scope();
        }

        get process()
        {
            return this.#process;
        }

        get DenoGlobal()
        {
            return this.#DenoGlobal;
        }

        get versions()
        {
            return this.#versions || {};
        }

        get version()
        {
            return this.#version || this.versions?.node || this.versions?.deno || _unknown;
        }

        get console()
        {
            return this.#console || (DEBUG_MODE || this.#mode?.traceEnabled) ? DEBUG_LOGGER : (ExecutionMode.isProduction( this.#mode ) ? PRODUCTION_LOGGER : INTERNAL_LOGGER);
        }

        get fetch()
        {
            return this.#fetch;
        }

        isNode()
        {
            return isNodeJs() && (null != this.process) && (null == this.#DenoGlobal);
        }

        isDeno()
        {
            return !this.isNode() && isDeno() && (null != this.#DenoGlobal);
        }

        isBrowser()
        {
            return !(this.isNode() || this.isDeno()) && isBrowser() && null != this.#window && null != this.#document && null != this.#navigator;
        }

        get navigator()
        {
            return this.#navigator || (_ud !== typeof window ? window?.navigator : (_ud !== typeof navigator ? navigator : null));
        }

        get localeCode()
        {
            return this.isBrowser() ? (this.navigator?.language || this.#localeCode || getMessagesLocaleString( this.ENV ) || DEFAULT_LOCALE_STRING) : this.#localeCode || getMessagesLocaleString( this.ENV ) || DEFAULT_LOCALE_STRING;
        }

        get userAgent()
        {
            return (_mt_str + (this.#userAgent || _mt_str)).trim();
        }

        canUseFetch()
        {
            const func = (null != this.#fetch) || (null != this.globalScope?.fetch) ? this.#fetch || this.globalScope?.fetch : null;

            return null != func && isFunc( func );
        }

        parseUserAgent( pUserAgent )
        {
            const userAgent = (_mt_str + (pUserAgent || this.userAgent || _mt_str)).trim();

            // TODO: improve when necessary

            const rx = /^([\w\/.]*)\s*(\([^)]+\))\s*([\w\/.]*)*\s*(\([^)]+\))*\s*([\w\/.]*)*\s*([\w\/.]*)*\s*([\w\/.]*)*\s*/i;

            const matches = rx.exec( userAgent );

            let ua = _mt_str;
            let browser = { name: _mt_str, version: _mt_str };
            let engine = { name: _mt_str, version: _mt_str };
            let os = { name: _mt_str, version: _mt_str };
            let cpu = { architectures: [] };

            if ( matches && matches.length > 0 )
            {
                ua = matches[0] || userAgent;

                let sBrowserString = (matches.length > 5 ? matches[5] : matches[1]) || _mt_str;
                const browserParts = sBrowserString.split( /\/\s*/ );

                browser.name = browserParts[0] || _mt_str;
                browser.version = browserParts[1] || _mt_str;

                let osString = ((matches.length > 2 ? matches[2] : _mt_str) || _mt_str).replaceAll( /[)(]/g, _mt_str );
                const osParts = osString.split( /;\s*/ ).map( e => e.trim() );
                const nameParts = osParts[0].split( /\s+/ );
                os.name = nameParts[0] + (nameParts.length > 1 ? " " + nameParts[1] : _mt_str);
                os.version = osParts[0].replaceAll( /[^\d.]/g, _mt_str );

                osParts.slice( 1 ).forEach( e =>
                                            {
                                                cpu.architectures.push( e.trim() );
                                            } );

                let sEngineString = (matches.length > 3 ? matches[3] : _mt_str) || _mt_str;
                const engineParts = sEngineString.split( /\/\s*/ );

                engine.name = engineParts[0] || _mt_str;
                engine.version = engineParts[1] || _mt_str;
            }

            return {
                ua,
                browser,
                engine,
                os,
                cpu
            };
        }

        get operatingSystem()
        {
            const os = this.process?.platform || this.#DenoGlobal?.build?.os || this.parseUserAgent( this.userAgent )?.os?.name || _mt_str;
            return (os || _unknown).toLowerCase();
        }

        isWindows()
        {
            const os = this.operatingSystem || this.process?.platform || this.#DenoGlobal?.build?.os || _unknown;

            return ["windows", "win32", "win64"].includes( os.toLowerCase() ) || os.toLowerCase().startsWith( "windows" );
        }

        isLinux()
        {
            const os = this.operatingSystem || this.process?.platform || this.#DenoGlobal?.build?.os || _unknown;

            return ["linux", "ubuntu", "debian"].includes( os.toLowerCase() );
        }

        get mode()
        {
            return this.#mode;
        }

        get ENV()
        {
            return lock( this.#ENV || {} );
        }

        get ARGUMENTS()
        {
            return this.#ARGUMENTS;
        }

        get tmpDirectoryName()
        {
            return this.ENV?.TMPDIR || (this.isWindows() ? "C:\\Windows\\Temp" : "/tmp");
        }

        get ModuleCache()
        {
            return ToolBocksModule.MODULE_CACHE || MODULE_CACHE || MODULE_OBJECT;
        }

        cacheModule( pModuleName, pModulePath, pModule )
        {
            if ( isNonNullObj( pModule ) || isFunc( pModule ) )
            {
                const moduleName = _asStr( pModuleName || pModulePath || pModule?.moduleName || pModule?.name ).trim();

                this.ModuleCache[moduleName] = this.ModuleCache[moduleName] || pModule;

                if ( this.isDeno() )
                {
                    const modulePath = _asStr( pModulePath || pModuleName ).trim();

                    asyncAttempt( async() => await Deno.cache( modulePath ) ).then( no_op ).catch( no_op );
                }
            }

            return pModule;
        }

        toString()
        {
            let s = "EXECUTION ENVIRONMENT\n";

            s += this.printRuntime( s );

            s += (this.operatingSystem ? ("OS: " + (this.operatingSystem) + "\n") : _mt_str);

            s += (this.localeCode ? ("Locale: " + (this.localeCode) + "\n") : _mt_str);

            s += (this.mode ? ("Mode: " + (this.mode.name) + "\n") : _mt_str);

            s += this.printEnvironmentVariables();

            s += this.printModuleArguments( s );

            return s + "\n\n";
        }

        printModuleArguments()
        {
            let s = _mt_str;

            if ( isNonNullObj( this.ARGUMENTS ) && Object.keys( this.ARGUMENTS ).length > 0 )
            {
                s += "ARGUMENTS: \n";
                s += serialize( this.ARGUMENTS, 4 );
                s += "\n";
            }

            return s;
        }

        printEnvironmentVariables()
        {
            let s = _mt_str;

            if ( isNonNullObj( this.ENV ) && Object.keys( this.ENV ).length > 0 )
            {
                s += "ENV: \n";
                s += serialize( this.ENV, 4 );
                s += "\n";
            }

            return s;
        }

        printRuntime()
        {
            let s = "Runtime: ";

            s += isNodeJs() ? "Node.js" : isDeno() ? "Deno" : isBrowser() ? "Browser" : _unknown;
            s += isNodeJs() || isDeno() ? (", Version: " + this.version) : _mt_str;
            s += isBrowser() ? (": " + this.userAgent) : _mt_str;

            return s + "\n";
        }
    }

    ExecutionEnvironment.getInstance = function()
    {
        return new ExecutionEnvironment( $scope() );
    };

    /**
     * Returns true if the specified value is a Node.js process.<br>
     * <br>
     * This method returns true if the current execution environment is Node
     * and the specified value is an object with the 'allowedNodeEnvironmentFlags' property.
     * <br>
     *
     * @returns {boolean} true if the specified value is a Node.js process
     */
    ExecutionEnvironment.isNodeProcess = function( pProcess )
    {
        return isNodeJs() && isObj( pProcess ) && (_ud !== typeof pProcess?.allowedNodeEnvironmentFlags);
    };

    /**
     * Returns true if the specified Promise result is in a 'fulfilled' state.<br>
     * <br>
     * This is most useful in the context of Promise.allSettled
     * <br>
     *
     * @function isFulfilled
     * @param {Object|string} pResult - The result object to evaluate.<br>
     *
     * @returns {boolean} Returns true if the result has a status of 'fulfilled', false otherwise.
     */
    const isFulfilled = function( pResult )
    {
        const result = resolveObject( pResult ) || pResult || {};
        return "fulfilled" === (result?.status || result);
    };

    /**
     * Returns true if the specified Promise result is in a 'rejected' state.<br>
     * <br>
     * This is most useful in the context of Promise.allSettled
     * <br>
     *
     * @function isRejected
     * @param {Object|string} pResult - The result object to evaluate.<br>
     *
     * @returns {boolean} Returns true if the result has a status of 'rejected', false otherwise.
     */
    const isRejected = function( pResult )
    {
        const result = resolveObject( pResult ) || pResult || {};
        return "rejected" === (result?.status || result);
    };

    /**
     * This class is a wrapper that represents the results of a collection of settled promises.<br>
     * Provides information about the status,
     * resolved value,
     * or the rejection reason of each settled promise.
     *
     * @class
     */
    class PromiseResult extends Array
    {
        /**
         *
         * @param {Array.<{status:string,value:*,reason:string}>} pResult
         */
        constructor( pResult )
        {
            super( ...(pResult || [pResult]) );
        }

        getStatus( pIndex = 0 )
        {
            return (this.length > pIndex ? this[pIndex]?.status : _unknown) || "rejected";
        }

        getValue( pIndex = 0 )
        {
            return (this.length > pIndex ? this[pIndex]?.value : this) || this;
        }

        getReason( pIndex = 0 )
        {
            return (this.length > pIndex ? (this[pIndex]?.reason || _mt_str) : _unknown) || "no such promise";
        }

        get allFulfilled()
        {
            return this.every( isFulfilled );
        }

        get anyFulfilled()
        {
            return this.some( isFulfilled );
        }

        get allRejected()
        {
            return this.every( isRejected );
        }

        get anyRejected()
        {
            return this.some( isRejected );
        }

        get fulfilled()
        {
            return this.filter( isFulfilled ).map( e => e?.value );
        }

        get rejected()
        {
            return this.filter( isRejected ).map( e => e?.reason );
        }

        get pending()
        {
            return this.filter( e => !isFulfilled( e ) && !isRejected( e ) );
        }

        forEachFulfilled( pCallback, pThis )
        {
            (this.fulfilled || []).forEach( pCallback, pThis );
        }

        forEachRejected( pCallback, pThis )
        {
            (this.rejected || []).forEach( pCallback, pThis );
        }

        forEachPending( pCallback, pThis )
        {
            (this.pending || []).forEach( pCallback, pThis );
        }
    }

    /**
     * Returns the type or name of an event based on the input provided.<br>
     *
     * The method supports various input types
     * such as Event objects, strings, or objects containing event-related data.
     * <br>
     *
     * @param {Event|string|Object} pEventName The event or event-related data,
     *                                         which can be an Event instance,
     *                                         a string representing the event name,
     *                                         or an object with event-related properties.<br>
     *
     * @param {Object} [pOptions] Optional parameter containing additional data
     *                            that may help resolve the event type.
     *
     * @return {string} The resolved event type or name as a string.
     *                  Returns a default value of "custom" if the event type cannot be resolved.
     */
    function resolveEventType( pEventName, pOptions )
    {
        if ( pEventName instanceof Event )
        {
            return (pEventName.type || pEventName?.name) || ((null != pOptions) ? resolveEventType( pOptions ) : S_CUSTOM);
        }
        else if ( isStr( pEventName ) )
        {
            return (_mt_str + pEventName).trim();
        }
        else if ( isObj( pEventName ) )
        {
            if ( pEventName?.event instanceof Event )
            {
                return resolveEventType( pEventName?.event );
            }

            return pEventName?.type || pEventName?.name || S_CUSTOM;
        }

        return S_CUSTOM;
    }

    /**
     * Resolves and returns event options
     * by combining event-specific options, data, and other provided values
     * into a unified structure.
     * <br>
     * <br>
     * This function handles objects with nested `detail` properties,
     * default values, and also resolves the event type.
     *
     * @function
     *
     * @param {Event|string|Object} pEventName - The event or the name of the event
     *                                           for which options are resolved.
     *
     * @param {Object} [pData] - Optional event data which can include a `detail` property
     *                           or other relevant data properties.
     *
     * @param {Object} [pOptions] - Optional additional options for the event configuration.
     *
     * @returns {Object} An object containing the resolved event type, data, and options:<br><br>
     *                   - `type`: The resolved event type based on the event name and options.<br>
     *                   - `data`: The resolved event data, which may include `detail`
     *                             or other relevant information.<br>
     *                   - `options`: The final merged options object for the event<br>
     */
    const resolveEventOptions = function( pEventName, pData, pOptions )
    {
        if ( pEventName instanceof ToolBocksModuleEvent || (_ud !== typeof CustomEvent && pEventName instanceof CustomEvent) )
        {
            return {
                type: resolveEventType( pEventName?.type || pEventName?.name || pEventName ),
                data: (pEventName?.detail || pEventName?.data || pData),
                options: populateOptions( pOptions, (pEventName?.detail || pEventName?.data || pData) )
            };
        }

        const options =
            {
                ...(pOptions || {}),
                ...(pData?.detail || pData || {}),
                ...(pData || {}), traceEnabled: false
            };

        const type = resolveEventType( pEventName, options );

        const optionsDetail = options?.detail || options;

        let data = (isObj( pData ) ? (pData?.detail || pData?.data || pData) : optionsDetail) || optionsDetail;

        data = (data?.detail || data?.data || data || options?.detail || options || options?.data || options || {});

        return { type, data, options };
    };

    const CustomEventClass = (_ud === typeof CustomEvent) ? Event : CustomEvent;

    // noinspection JSClosureCompilerSyntax
    /**
     * This class defines a Custom Event that can be used to communicate with interested consumers.<br>
     * <br>
     * @see <a href="https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent">MDN: CustomEvent</a>
     * <br>
     * Use the 'detail' property to share data with event handlers.<br>
     * <br>
     * <br>
     * Note: ToolBocks modules use instances of this event to communicate when errors have occurred rather than writing to the console.<br>
     * @class
     * @extends Event
     */
    class ToolBocksModuleEvent extends CustomEventClass
    {
        #type;
        #detail;

        #options;
        #occurred;

        #traceEnabled = CURRENT_MODE?.traceEnabled || false;

        /**
         *
         * @constructor
         * @param {string|Event} pEventName The name or type of Event to construct
         * @param {Object} pData The data to include in the event's detail property
         *
         * @param {Object} pOptions
         *
         * @see ToolBocksModule#reportError
         * @see ToolBocksModule#dispatchEvent
         */
        constructor( pEventName, pData, pOptions )
        {
            super( resolveEventOptions( pEventName, pData, pOptions )?.type || S_CUSTOM,
                   resolveEventOptions( pEventName, pData, pOptions )?.options );

            const { type, data, options } = resolveEventOptions( pEventName, pData, pOptions );

            this.#type = type || "ToolBocksModuleEvent";

            this.#detail = data?.detail || data?.data || data || pData || options?.detail || options?.data || {};

            this.#traceEnabled = !!options.traceEnabled;

            this.id = "Event_" + (options?.id || (Date.now()));

            this.#options = { ...(options || {}) };

            this.#occurred = (pEventName instanceof this.constructor ? pEventName?.occurred : new Date()) || new Date();
        }

        get traceEnabled()
        {
            return !!this.#traceEnabled;
        }

        get options()
        {
            return populateOptions( {}, this.#options );
        }

        mergeOptions( pOptions )
        {
            this.#options = populateOptions( pOptions || this.#options, this.options || {} );
            return this.options;
        }

        get occurred()
        {
            this.#occurred = this.#occurred || new Date();
            return new Date( this.#occurred );
        }

        /**
         * Returns a constructor for this class.
         * @returns {ToolBocksModuleEvent}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        clone()
        {
            return new ToolBocksModuleEvent( this.type, this.detail, this.options );
        }

        /**
         * Returns the name or type of this event, such as "error" or "load"
         * @returns {string} The name or type of this event, such as "error" or "load"
         */
        get type()
        {
            return this.#type || super.type;
        }

        get message()
        {
            let s = _asStr( "An event of type, " + _asStr( this.type || this ) + ", occurred" );

            if ( !isNull( this.detail ) && isObj( this.detail ) )
            {
                const entries = objectEntries( this.detail );
                if ( entries && $ln( entries ) > 0 )
                {
                    s += ", with details: \n";
                    for( let entry of entries )
                    {
                        const key = _asStr( ObjectEntry.getKey( entry ) ).trim();
                        const value = ObjectEntry.getValue( entry );

                        s += key + ": " + attempt( () => _asStr( value ) ) + "\n";
                    }
                }
            }
            return _asStr( s );
        }

        /**
         * Returns the data included with this event,
         * <br>
         * such as the Error that was caught, the module that was loaded, the message that was sent or received, etc.<br>
         * @returns {Object} The data included with this event
         */
        get detail()
        {
            return this.#detail || super.detail || super.data;
        }

        get details()
        {
            return this.detail;
        }

        mergeData( pData )
        {
            this.#detail = populateOptions( (pData?.detail || pData?.data || pData), this.detail );
            return this.detail;
        }
    }

    /**
     * If the environment does not define CustomEvent,<br>
     * we define a global property using our custom event, ModuleEvent
     * @see ToolBocksModuleEvent
     */
    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ToolBocksModuleEvent;
        $scope()["CustomEvent"] = CustomEvent;
    }

    /**
     * Returns an instance of ToolBocksModuleEvent
     * based on the provided input.
     *
     * @function
     * @param {Event|CustomEvent|ToolBocksModuleEvent|*} pEvent - The object to be resolved as an Event
     *        If not provided, the function will attempt to retrieve the event from the current scope.
     *
     * @param {*} [pData] - Optional data to be associated with the new `ToolBocksModuleEvent` if a new event is created.
     *
     * @param {*} [pOptions] - Configuration options to be associated with the new `ToolBocksModuleEvent` if applicable.
     *
     * @returns {CustomEvent|ToolBocksModuleEvent} - Returns the resolved event.
     *                                               <br>
     *                                               <br>
     *                                               If the specified event is already
     *                                               a `CustomEvent` or `ToolBocksModuleEvent`,<br>
     *                                               the specified options and data are merged with the existing
     *                                               properties and then the updated object is returned.
     *                                               <br>
     *                                               <br>
     *                                               Otherwise, a new `ToolBocksModuleEvent`
     *                                               is created and returned.
     */
    const resolveEvent = function( pEvent, pData, pOptions )
    {
        const evt = pEvent || $scope()?.event;

        if ( evt instanceof ToolBocksModuleEvent )
        {
            evt.mergeOptions( pOptions );
            evt.mergeData( pData );
            return evt;
        }

        return new ToolBocksModuleEvent( evt, (pData || evt.data || evt.detail), pOptions );
    };

    /**
     * Suspends the execution of the asynchronous function for a specified number of milliseconds.
     *
     * @param {number} pMilliseconds - The number of milliseconds to pause execution.
     *
     * @return {Promise<void>} A promise that resolves after the specified delay.
     */
    function sleep( pMilliseconds )
    {
        // noinspection DynamicallyGeneratedCodeJS,JSValidateTypes,TypeScriptUMDGlobal
        return new Promise( resolve => setTimeout( resolve, pMilliseconds ) );
    }

    /**
     * Suspends the execution of an asynchronous function
     * for at least the specified number of milliseconds.
     *
     * The exact time to suspend execution is calculated
     * by multiplying the specified value by a random number between 0.1 and 1
     * and adding that value to the specified number of milliseconds.
     *
     * This can help in some scenarios by adding a little bit of 'jitter'
     * to the forced delays between the execution of network calls
     * that might otherwise become a 'thundering herd'
     *
     * @param {number} pMilliseconds - The minimum number of milliseconds to pause execution.
     *
     * @return {Promise<void>} A promise that resolves after the specified delay.
     */
    function doze( pMilliseconds )
    {
        const millis = pMilliseconds + ((Math.random() + 0.1) * pMilliseconds);
        return sleep( Math.floor( millis ) );
    }

    // noinspection DynamicallyGeneratedCodeJS,JSValidateTypes,TypeScriptUMDGlobal
    const gc = () => new Promise( resolve => setImmediate( resolve ) );

    /**
     * Default options for the bracketsToDots function,
     * which transforms a propertyPath expressed with the index operator ([])
     * to a propertyPath expressed using dot notation.
     *
     * @type {{numericIndexOnly: boolean, useOptionalSyntax: boolean}}
     */
    const BRACKETS_TO_DOTS_OPTIONS = { numericIndexOnly: true, useOptionalSyntax: false };

    /**
     * This function converts a property path expressed with the index operator ([])
     * to a property path expressed using dot notation.<br>
     * <br>
     * A property path such as arr[0][0][0] is transformed into arr.0.0.0,
     * taking advantage of the fact that arrays are really just objects whose properties look like integers
     *
     * @param {string} pPropertyPath a property name or path to a property
     *
     * @param {object} [pOptions=BRACKETS_TO_DOTS_OPTIONS] An object defining how to transform the specified value.<br>
     *                                                     In particular, whether to transform only numeric indices (or also strings),
     *                                                     and whether to transform the path into a.b.c or a?.b?.c
     *
     * @returns {string} a property name or path using dot notation instead of brackets.
     */
    const bracketsToDots = function( pPropertyPath, pOptions = BRACKETS_TO_DOTS_OPTIONS )
    {
        const options = { ...BRACKETS_TO_DOTS_OPTIONS, ...(pOptions || {}) };

        let propertyName = (_mt_str + (isStr( pPropertyPath ) ? _asStr( pPropertyPath ).trim() : _mt_str).trim());

        if ( _mt_str !== propertyName )
        {
            // the regular expression is used to convert array bracket access into dot property access
            const rx = options?.numericIndexOnly ? /\[(\d+)]/g : /\[([^\]]+)]/g;

            // convert something like arr[0][0][0] into arr.0.0.0,
            // taking advantage of the fact that arrays are really just objects whose properties look like integers
            propertyName = rx.test( propertyName ) ? propertyName.replaceAll( rx, ((options.useOptionalSyntax ? "?" : "") + ".$1") ) : propertyName;

            // remove any leading or trailing dots or doubled dots,
            // because those would be missing or empty property names
            propertyName = propertyName.replace( /^\.+/, _mt_str ).replace( /\.+$/, _mt_str ).replaceAll( /\.{2,}/g, _dot );

            // remove any quotation marks
            propertyName = propertyName.replaceAll( /(\.['"`]?)/g, _dot ).replaceAll( /['"`]?\./g, _dot );
        }

        return propertyName;
    };

    /**
     * Converts the provided arguments into a single string.
     *
     * The function accepts any number of arguments, flattens them to a single-level array (if nested),
     * converts each into a string, trims whitespace,
     * and then concatenates all elements into a single string separated by a space.
     *
     * @function
     * @param {...*} pArgs - One or more strings or values that can be coerced to strings<br>
     *                       (or arrays of strings or values that can be coerced to strings)<br>
     *                       to be concatenated into a single string, or <i>phrase</i>.<br>
     *
     * @returns {string} A concatenated string representation of the arguments.
     */
    const asPhrase = ( ...pArgs ) => [...pArgs].flat( Infinity ).map( e => String( e ) ).join( _spc );

    /**
     * @typedef {Object} CopyOptions
     * @property {number} maxStackSize The value to use in a recursive function to bail out before causing a stack overflow, defaults to 32
     * @property {Object|Array.<*>|null} nullReplacement The value to substitute if a null value is encountered
     * @property {*} undefinedReplacement The value to substitute if an undefined value is encountered
     * @property {number} depth The depth to copy. Properties at a greater depth are returned as pointers to the original values
     * @property {boolean} freeze Whether to return an immutable object or not
     * @property {boolean} [includeClassNames=false] Whether to add an entry named "class"
     *                                               with the name of the constructor function
     *                                               used to instantiate the object;
     *                                               can be useful for debugging, otherwise, not-so-much
     */

    /**
     * These are the default options used with the localCopy and immutableCopy functions.<br>
     *
     * @type {CopyOptions}
     * @see CopyOptions
     */
    const DEFAULT_COPY_OPTIONS =
        {
            maxStackSize: MAX_STACK_SIZE,
            nullReplacement: EMPTY_OBJECT,
            undefinedReplacement: EMPTY_OBJECT,
            maxDepth: 99,
            freeze: false,
            includeClassNames: false
        };

    const FAST_COPY_OPTIONS =
        {
            maxStackSize: 16,
            nullReplacement: EMPTY_OBJECT,
            undefinedReplacement: EMPTY_OBJECT,
            maxDepth: 5,
            freeze: false,
            includeClassNames: false
        };

    /**
     * These are the default options used with the immutableCopy function.<br>
     * Note that these are the same as the {@link DEFAULT_COPY_OPTIONS} but with 'freeze' set to true.<br>
     *
     * @type {CopyOptions}
     * @see CopyOptions
     */
    const IMMUTABLE_COPY_OPTIONS = { ...DEFAULT_COPY_OPTIONS, freeze: true };

    const FAST_IMMUTABLE_COPY_OPTIONS = { ...FAST_COPY_OPTIONS, freeze: true };

    /**
     * This is a 'helper' function for reading a numeric property of the localCopy or immutableCopy options
     * @param {Object} pOptions An object expected to have a property with the name specified
     * @param {string} pProperty The name of the property
     * @param {number} pDefault  The default value to return if the named option is not present or not a numeric value
     * @returns {number} An integer value representing the value of that property
     * @private
     */
    function _getNumericOption( pOptions, pProperty, pDefault )
    {
        const options = resolveOptions( pOptions, DEFAULT_COPY_OPTIONS );
        const option = options[pProperty] || pDefault || 0;
        return Math.max( 0, parseInt( isNum( option ) ? option : ((/^[\d.]$/.test( option )) ? option : (isNum( pDefault ) ? pDefault : 0)) ) );
    }

    /**
     * This is a 'helper' function for reading the depth property of the localCopy or immutableCopy options
     * @param {Object} pOptions An object expected to have a property named, depth
     * @returns {number} An integer value representing the value of that property
     * @private
     */
    const _getDepth = ( pOptions ) => _getNumericOption( pOptions, "depth", 0 );

    /**
     * This is a 'helper' function for reading the maxStackSize property of the localCopy or immutableCopy options
     * @param {Object} pOptions An object expected to have a property named, maxStackSize
     * @returns {number} An integer value representing the value of that property
     * @private
     */
    const _getMaxStackSize = ( pOptions ) => Math.min( MAX_STACK_SIZE, _getNumericOption( pOptions, "maxStackSize", MAX_STACK_SIZE ) );

    /**
     * Calls Object::freeze on any defined non-null value specified<br>
     * and returns the <u>same</u> object or value, now <i>frozen</i>
     * <br>
     * @param {*} pObject An object or array (or any other value) you want to freeze
     * @param {CopyOptions} pOptions An object describing how to handle undefined and null values
     *
     * @returns {*} The value specified as an immutable value or object
     */
    const lock = function( pObject, pOptions = IMMUTABLE_COPY_OPTIONS )
    {
        const options = { ...IMMUTABLE_COPY_OPTIONS, ...(pOptions | {}) };

        if ( _ud === typeof pObject )
        {
            return freeze( (null === options?.undefinedReplacement) ? null : (options?.undefinedReplacement ?? null) );
        }

        if ( null === pObject )
        {
            return freeze( (null === options?.nullReplacement) ? null : (options?.nullReplacement ?? EMPTY_OBJECT) );
        }

        return freeze( pObject );
    };

    /**
     * Provide a shim until https://github.com/tc39/proposal-is-error is widely available
     * @type {*|(function(*): (boolean|*))}
     */
    Error.isError = Error.isError || function( pError )
    {
        if ( isNull( pError ) || isPrimitive( pError ) || isFunc( pError ) )
        {
            return false;
        }

        if ( pError instanceof Error || pError?.prototype instanceof Error || pError?.constructor === Error || pError?.prototype?.constructor === Error )
        {
            return true;
        }

        let is = false;

        if ( isObj( pError ) )
        {
            is = _isValidStr( pError?.name || pError?.message || pError?.stack );
            is = is && (_asStr( pError?.name || pError?.message ).includes( "Error" ));
        }

        return is;
    };

    /**
     * Returns a string compatible with the StackTrace parseFrame method<br>
     *
     * @param {Error|string} pError An Error or a string representing a stack trace
     *
     * @returns {string} a string compatible with the StackTrace parseFrame method
     */
    function generateStack( pError )
    {
        let stack = pError instanceof Error ? (pError?.stack || pError?.cause?.stack) : isStr( pError ) ? pError : _mt_str;

        if ( _ud === typeof stack || null == stack || !isStr( stack ) )
        {
            stack = pError?.toString() || ((pError?.name || pError?.type) + _colon + _spc + (_mt_str + pError?.message).replace( (pError?.name || pError?.type || "~!~"), _mt_str )) + "\n";

            stack += "at (" + (pError?.fileName || _unknown) + _colon + (pError?.lineNumber || _unknown) + _colon + (pError?.columnNumber || _unknown) + ")\n";
        }

        return stack;
    }

    /**
     * @typedef {Object} StackFrame
     * @property {string} methodName The name of the function or method executed
     * @property {string} fileName The name of the source file in which the function or method is defined
     * @property {number} lineNumber The line number in the source file defining the executed statement
     * @property {number} columnNumber The position in the line where execution began
     */

    /**
     * Resolves and returns the most appropriate error stack information from the provided arguments.
     *
     * @param {string|Error} pStack The primary stack information, which can be a string or an Error object.
     * @param {Error} pError A secondary Error object used to derive stack information if the primary stack is unavailable or invalid.
     * @return {string} The resolved error stack as a string. Returns an empty string if no valid stack information is found.
     */
    function resolveErrorStack( pStack, pError )
    {
        let errorStack = pStack || pError?.stack || pError?.cause?.stack || pError;

        if ( pStack instanceof String || isStr( pStack ) )
        {
            errorStack = (pStack || generateStack( pError ) || generateStack( pStack ) || _mt_str);
        }
        else if ( Error.isError( pStack ) || pStack instanceof Error )
        {
            errorStack = (pStack.stack || pStack?.cause?.stack || generateStack( pStack || pError ) || generateStack( pError ) || _mt_str);
        }

        return errorStack || pError?.stack || generateStack( pError ) || generateStack( pStack );
    }

    /**
     * This class provides cross-environment functionality related to an error's stack (trace)
     * <br>
     * For more robust functionality, consider <a href="https://github.com/stacktracejs/stacktrace.js">GitHub: stacktrace.js</a>
     * @class
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

        /**
         * @constructor
         * @param {string|Error} pStack A stack trace provide by the Error.stack property if it exists
         * @param {Error} pError The Error whose stack trace is being captured
         */
        constructor( pStack, pError )
        {
            const error = isError( pError ) ? pError : isError( pStack ) ? pStack : new Error( pStack || "StackTrace" );

            const me = this;

            this.#stack = resolveErrorStack( pStack, error ) || pStack;

            this.#frames = attempt( () => (me || this).parseFrames() );

            this.#parts = this.parseFrame( Math.max( 0, Math.min( 1, $ln( this.#frames ) - 1 ) ) );

            this.#methodName = this.#parts.methodName;
            this.#fileName = this.#parts.fileName;
            this.#lineNumber = this.#parts.lineNumber;
            this.#columnNumber = this.#parts.columnNumber;

            this.clone = () => new ((me || this).constructor || (me || this))( this.#stack, error );
        }

        /**
         * Returns a constructor for this class.
         * @returns {StackTrace}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * The stack trace string
         * @type {string}
         * @returns {string}
         */
        get stack()
        {
            return this.#stack || _mt_str;
        }

        /**
         * Returns an array of strings corresponding to the stack frames found in the stack trace.
         * @returns {Array.<string>} An array of strings corresponding to the stack frames found in the stack trace.
         */
        get frames()
        {
            this.#frames = $ln( this.#frames ) > 0 ? (this.#frames || []) : attempt( () => this.parseFrames() );
            return [...(this.#frames || [])];
        }

        /**
         * Parses a stack trace string into an array of stack frames.
         * @returns {Array.<string>} An array of strings corresponding to the stack frames found in the stack trace.
         */
        parseFrames()
        {
            let arr = [].concat( this.stack.split( /(\r\n)|\n/ ) );
            arr = arr.filter( e => (/(at)|@/).test( e ) ).map( e => e.replace( /at\s+([^ (]+)\s*/, "$1@" ).trim() );
            arr = arr.map( e => e.replaceAll( /[A-Z]:\\/g, _mt_str ).trim() );
            return arr.map( e => e.replaceAll( /[)(]/g, _mt_str ) ).map( e => e.replace( /@$/, _mt_str ).trim() );
        }

        /**
         * Returns a StackFrame object corresponding to the specified frame
         * @param {number|string} pFrame The frame to parse
         * @returns {StackFrame} An object with the method name,
         * source file name, line number, and column number<br>
         * corresponding to the call stack represented by the specified frame
         */
        parseFrame( pFrame )
        {
            let frame = isNum( pFrame ) ? this.frames[pFrame] : pFrame;

            let rx = /((\w*)@)?([^:]+):(\d+):(\d+)/;

            let matches = rx.exec( frame );

            let parsed = {};

            if ( matches && matches.length )
            {
                function trimMatch( pMatch )
                {
                    return (pMatch || _mt_str).replace( /@$/, _mt_str ).replace( /^:/, _mt_str );
                }

                let methodName = trimMatch( matches.length > 2 ? matches[2] : _mt_str );
                let fileName = trimMatch( matches.length > 3 ? matches[3] : _mt_str );
                let lineNumber = trimMatch( matches.length > 4 ? matches[4] : _mt_str );
                let columnNumber = trimMatch( matches.length > 5 ? matches[5] : _mt_str );

                parsed = { methodName, fileName, lineNumber, columnNumber };
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
     * This is the default error message used if there is no message available for an error
     * @type {string}
     * @const
     * @see {@link S_ERR_PREFIX}
     * @see {@link S_DEFAULT_OPERATION}
     */
    const DEFAULT_ERROR_MSG = [S_ERR_PREFIX, ": ", S_DEFAULT_OPERATION].join( _spc );

    /**
     * Returns a valid log level based on the specified value.<br>
     * The method maps the input to a predefined set of log levels,
     * corresponding to the methods of ILogger types.<br>
     *
     * @param {string|number} pLevel - the name or numeric value representing a log level.<br>
     *                                 This can be a string (log level name) or a number (log level index).<br>
     *                                 Valid strings are case-insensitive
     *                                 and should correspond to predefined log levels.
     *                                 Valid numbers are between 0 and 6,
     *                                 corresponding to the following log levels:
     *                                 0 = NONE, 1 = LOG, 2 = ERROR, 3 = WARN, 4 = INFO, 5 = DEBUG, 6 = TRACE
     *
     *
     * @return {string} The resolved log level.<br>
     *                  If the input is invalid or does not match any predefined log level,
     *                  the default value, "error", is returned.
     */
    function resolveLogLevel( pLevel )
    {
        const levels = [S_NONE, S_LOG, S_ERROR, S_WARN, S_INFO, S_DEBUG, S_TRACE, S_LOG].map( e => _lcase( e.trim() ) );
        let level = (isStr( pLevel )) ? _lcase( _asStr( pLevel ).trim() ) : (isNum( pLevel ) && pLevel >= 0 && pLevel <= 6 ? levels[pLevel] : S_ERROR);
        return (levels.includes( level ) ? level : S_ERROR);
    }

    /**
     * Initializes the message passed to the __Error constructor.
     */
    function initializeMessage( pMessageOrError )
    {
        if ( isError( pMessageOrError ) )
        {
            return pMessageOrError.message || pMessageOrError.name || errorToString.call( pMessageOrError, pMessageOrError ) || DEFAULT_ERROR_MSG;
        }
        return _asStr( pMessageOrError || DEFAULT_ERROR_MSG ) || DEFAULT_ERROR_MSG;
    }

    /**
     * This class allows custom Errors to be defined.
     * <br><br>
     * This class and its subclasses also provide a stack trace regardless of browser or environment.
     * <br>
     * @class
     * @extends Error
     * @see {@link #StackTrace}
     */
    class __Error extends Error
    {
        #options;

        #type;

        #trace;

        #code;
        #referenceId;

        #occurred;

        #args = [];

        /**
         * Constructs an instance of the custom Error class, __Error.<br>
         * @constructor
         * @param {string|Error} pMsgOrErr The error message or an Error whose message should be used as the error message
         * @param {Object} [pOptions={}] An object that will be available as a property of this Error
         * @param {...*} [pArgs=null] One or more values to include in the error message
         */
        constructor( pMsgOrErr, pOptions = {}, ...pArgs )
        {
            super( initializeMessage( pMsgOrErr ), { ...(pOptions || {}) } );

            const me = this;

            this.#options = attemptSilent( () => Object.assign( {}, { ...(pOptions || {}) } ) ) || {};

            this.#type = attemptSilent( () => me.getErrorTypeOrName( pMsgOrErr ).replace( /^__/, _mt_str ) );

            this.#code = attemptSilent( () => me.calculateErrorCode( pMsgOrErr, this.#options ) );

            this.#referenceId = attemptSilent( () => me.calculateReferenceId( pMsgOrErr || me ) );

            // Capture stack trace if available
            attemptSilent( () => Error.captureStackTrace ? Error.captureStackTrace( this, Error ) : no_op() );

            this.stack = (isError( this.cause ) ? this.cause?.stack : (isError( pMsgOrErr ) ? pMsgOrErr.stack || this.stack : this.stack)) || this.stack;

            this.#occurred = isError( pMsgOrErr ) ? OBJECT_REGISTRY.getCreated( pMsgOrErr ) : isError( this.cause ) ? OBJECT_REGISTRY.getCreated( this.cause ) : new Date();
            this.#occurred = isDate( this.#occurred ) ? this.#occurred : this.#occurred >= 0 ? new Date( this.#occurred ) : new Date();

            this.#trace = attemptSilent( () => this.#options?.stackTrace || ((isError( pMsgOrErr ) ? new StackTrace( (pMsgOrErr?.stack || this.stack), pMsgOrErr ) : null)) );

            if ( !isNull( pArgs ) && isArray( pArgs ) )
            {
                this.#args.push( ...((pArgs || [])) );
            }
            else if ( isArray( this.#options?.arguments ) )
            {
                this.#args.push( ...((this.#options?.arguments || [])) );
            }
        }

        get occurred()
        {
            return new Date( this.#occurred || OBJECT_REGISTRY.getCreated( this ) );
        }

        calculateReferenceId( pMsgOrErr )
        {
            return this.#options?.referenceId || ((isError( pMsgOrErr ) ? pMsgOrErr?.referenceId || __Error.generateReferenceId( this, this.#code ) : __Error.generateReferenceId( this, this.#code )) || this.#referenceId);
        }

        calculateErrorCode( pMsgOrErr, pOptions )
        {
            return pOptions?.code || this.#options?.code || (isNum( pMsgOrErr ) ? pMsgOrErr : ((isError( pMsgOrErr ) && this !== pMsgOrErr) ? pMsgOrErr?.code : null)) || this.#code;
        }

        /**
         * Returns the error type or name for the given message or defaults.
         */
        getErrorTypeOrName( pError )
        {
            if ( pError instanceof Error || isNonNullObj( pError ) )
            {
                return _asStr( pError.type || pError.name || pError.constructor?.name || "Error" ).replace( /^__/, _mt_str );
            }
            return _asStr( this.constructor?.name || "Error" ).replace( /^__/, _mt_str );
        }

        /**
         * Returns a constructor for this class.
         * @returns {__Error}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        get options()
        {
            return immutableCopy( this.#options || {} );
        }

        get args()
        {
            return $ln( this.#args ) ? [...(this.#args)] : [];
        }

        get name()
        {
            return this.constructor?.name || super.name;
        }

        get type()
        {
            return this.#type || this.name;
        }

        get prefix()
        {
            return this.name + " -> ";
        }

        get message()
        {
            return this.prefix + ((super.message).replace( this.prefix, _mt_str ));
        }

        toString()
        {
            return this.message;
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

        get code()
        {
            this.#code = this.#code || this.calculateErrorCode( this );
            return this.#code || this.calculateErrorCode( this );
        }

        get referenceId()
        {
            this.#referenceId = this.#referenceId || this.calculateReferenceId( this );
            return this.#referenceId || this.calculateReferenceId( this );
        }

        /**
         * Writes this error to the specified logger if the logger is enabled for the specified level
         * @param {ILogger} pLogger A logger to record the error
         * @param {string|number} pLevel The logging level to use when recording the error
         */
        logTo( pLogger, pLevel )
        {
            const level = resolveLogLevel( pLevel );

            const logger = ToolBocksModule.resolveLogger( pLogger, ExecutionMode.isProduction( CURRENT_MODE ) ? PRODUCTION_LOGGER : (DEBUG_MODE ? DEBUG_LOGGER : INTERNAL_LOGGER) );

            if ( isFunc( logger[level] ) )
            {
                attemptMethod( logger, logger[level], this.toString(), this.options, this );
            }
        }

        cloneOptions( pOptions = {} )
        {
            let options = { ...(this.options || {}), ...(resolveObject( pOptions || {} ) || {}) };
            return localCopy( options );
        }

        /**
         * Creates a new instance of the current object with the same message and options.<br>
         * <br>
         * The options are cloned, preserving their properties, and any missing
         * properties in the cloned options are filled from the current instance.
         *
         * @return {__Error} A new instance of this object with the same properties as the original.
         */
        clone()
        {
            let options = this.cloneOptions();

            options.cause = options.cause || this.cause;
            options.stackTrace = options.stackTrace || this.stackTrace || this.#trace;

            return new this.constructor( this.message, options );
        }
    }

    __Error.NEXT_REF_ID = 10_000;

    /**
     * Generates and returns a unique reference ID for an error instance.
     *
     * This method creates a distinctive identifier that can be used to track
     * or log error instances for debugging, logging, monitoring, or support purposes.
     *
     * @function
     *
     * @returns {string} A string of the form,
     * 'Reference ID: ({error_code}): {#####}'  or 'Reference ID: {#####}',
     * where {#####} is a number between 10,000 and 999,999
     * and the code may or may not be present,
     * depending on whether a code for the error is defined.
     */
    __Error.generateReferenceId = function( pError, pCode )
    {
        let nextId = ++__Error.NEXT_REF_ID;

        nextId = nextId > 999_999 ? 10_000 : nextId;

        const code = pCode || pError?.code;

        return "Reference ID:" + (code ? " (" + (_asStr( code )) + "): " : _spc) + nextId;
    };

    /**
     * This subclass of Error is useful when validating function arguments.
     * <br>
     * The message property is overwritten to include the prefix 'IllegalArgumentException',<br>
     * so that if only the message is logged, the type of error is not obscured.
     * <br>
     * @class
     * @extends __Error
     */
    class IllegalArgumentError extends __Error
    {
        #illegalArguments = [];

        /**
         * @constructor
         * @param {string|Error} pMessage The error message or an Error whose message should be used as the error message
         * @param {Object} pOptions An object that will be available as a property of this Error
         * @param {...*} [pArgs=null] One or more values to be included in the error message
         */
        constructor( pMessage, pOptions, ...pArgs )
        {
            super( pMessage, pOptions, ...pArgs );

            // Capture stack trace if available
            attemptSilent( () => Error.captureStackTrace ? Error.captureStackTrace( this, Error ) : no_op() );

            let options = { ...(pOptions || {}) };

            if ( isArray( options.arguments || options.illegalArguments ) )
            {
                this.#illegalArguments.push( ...(options.arguments || options.illegalArguments || []) );
            }
        }

        /**
         * Returns a constructor for this class.
         * @returns {IllegalArgumentError}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        get illegalArguments()
        {
            return [...(this.#illegalArguments || [])];
        }

        get args()
        {
            return [...(super.args), ...(this.illegalArguments)];
        }

        get prefix()
        {
            return this.name + " -> ";
        }

        get message()
        {
            return this.prefix + ((super.message).replace( this.prefix, _mt_str ).replace( super.prefix, _mt_str ));
        }

        /**
         * @inheritDoc
         * @returns {string}
         */
        toString()
        {
            return this.prefix + ((this.message).replace( this.prefix, _mt_str ).replace( super.prefix, _mt_str ));
        }

        /**
         * Creates and returns a new instance of the current object with the same properties as the original.
         * Copies the provided options and sets default values for cause and stackTrace if not already provided.
         *
         * @return {IllegalArgumentError} A new instance of IllegalArgumentError with cloned properties.
         */
        clone()
        {
            const options = this.cloneOptions( this.options );

            options.cause = options.cause || this.cause;
            options.stackTrace = options.stackTrace || this.stackTrace;

            return new this.constructor( this.message, options );
        }
    }

    class IllegalStateError extends __Error
    {
        constructor( pMessage, pOptions, ...pArgs )
        {
            super( pMessage, pOptions, ...pArgs );

            // Capture stack trace if available
            attemptSilent( () => Error.captureStackTrace ? Error.captureStackTrace( this, this.constructor ) : no_op() );
        }

        /**
         * Returns a constructor for this class.
         * @returns {IllegalStateError}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        clone()
        {
            const options = this.cloneOptions( this.options );

            options.cause = options.cause || this.cause;
            options.stackTrace = options.stackTrace || this.stackTrace;

            return new this.constructor( this.message, options );
        }
    }

    class IllegalAccessError extends __Error
    {
        constructor( pMsgOrErr, pOptions, ...pArgs )
        {
            super( pMsgOrErr, pOptions, ...pArgs );
        }
    }

    function _fromErrorArray( pError, pMessage, pErrors )
    {
        let errors = (isArray( pError )) ? [...(pError || [])] : [pError];

        for( let i = 0, n = $ln( errors ); i < n; i++ )
        {
            let err = errors[i];

            if ( isArray( pMessage ) )
            {
                pErrors.push( resolveError( err, pMessage[i] || _mt_str ) );
            }
            else
            {
                pErrors.push( resolveError( err, pMessage ) );
            }
        }

        return isError( pErrors[0] ) && pErrors[0] instanceof __Error ?
               pErrors[0] :
               new __Error( pErrors[0],
                            {
                                errors: pErrors,
                                message: pMessage || pError
                            } );
    }

    function _fromMessageArray( pMessage, pError, pErrors )
    {
        let messages = isArray( pMessage ) ? [...(pMessage || [])] : [pMessage];

        for( let i = 0, n = $ln( messages ); i < n; i++ )
        {
            let msg = message[i];
            if ( isArray( pError ) )
            {
                pErrors.push( resolveError( msg, pError[i] || pError ) );
            }
            else
            {
                pErrors.push( resolveError( msg, pError ) );
            }
        }

        return isError( pErrors[0] ) && pErrors[0] instanceof __Error ?
               pErrors[0] :
               new __Error( pErrors[0],
                            {
                                errors: pErrors,
                                message: pError
                            } );
    }

    function _handleMissingError( pError, pMessage )
    {
        const lastError = getLastError();

        const resolver = ( e ) => resolveError( e, e?.message || (isString( pMessage ) ? pMessage : isString( pError ) ? pError : e?.message || (isError( pError ) ? pError?.message : _mt) || (isError( pMessage ) ? pMessage?.message : _mt) || (isError( lastError ) ? lastError?.message : _mt) || _mt) );

        let errors = [lastError || {}, pError || {}, pMessage || {}].filter( isError ).map( resolver );

        errors.push( ...(isArray( lastError ) ? lastError : []) ).filter( isError ).map( resolver );
        errors.push( ...(isArray( pError ) ? pError : []) ).filter( isError ).map( resolver );
        errors.push( ...(isArray( pMessage ) ? pMessage : []) ).filter( isError ).map( resolver );

        if ( $ln( errors ) > 0 )
        {
            return resolveError( errors[0], (errors[0]?.message || pMessage), ...errors );
        }

        return new __Error( DEFAULT_ERROR_MSG,
                            {
                                errors: ([lastError, pError, pMessage].filter( isError ) || []),
                                messages: ([lastError, pError, pMessage].filter( isString ) || []),
                            } );
    }

    /**
     * Returns an instance of the custom __Error class from the arguments specified.
     * <br><br>
     * If the first argument is already an instance of __Error, just returns that instance.
     * <br>
     * If the first argument is an instance of Error, constructs a new __Error,
     * using the provided error's name and setting this instance's cause to the specified error.
     * <br><br>
     * If a string is specified for the second argument, that string is used as the message for the returned Error.
     * <br>
     * @param {Error|string} pError  An Error or a string with which to create a new Error
     * @param {string|Error} pMessage A string to use as the message property of the returned Error or an Error whose message will be used instead
     * @param {...*} [pArgs=null] One or more arguments to use if this function requires constructing a new __Error instance
     * @returns {__Error} an Error (actually an instance of __Error, which provides an environment-agnostic stack trace)
     */
    function resolveError( pError, pMessage, ...pArgs )
    {
        const lastError = getLastError();

        let candidates =
            [
                ...(isArray( lastError ) ? lastError : [lastError || {}]),
                ...(isArray( pError ) ? pError : [pError || {}]),
                ...(isArray( pMessage ) ? pMessage : [pMessage || {}]),
                ...(isArray( pMessage ) && _asArr( pMessage ).some( isString ) ? _asArr( pMessage ).filter( isString ).map( e => new __Error( e ) ) : []),
                ...pArgs
            ].filter( e => isError( e ) || e instanceof __Error );

        if ( $ln( candidates ) )
        {
            return new __Error( candidates[0] );
        }
        return null;
    }

    /**
     * Returns a string used when emitting the error event from a function or method.
     * <br>
     * Constructs a string of the form {ModuleName}::{FunctionName}
     * <br>
     * @param {string|function|Object} pModule The name of the module in which the error occurred
     * @param {string|function} pFunction The name of the function (or the function itself) in which the error occurred
     *
     * @returns {string} A string used when emitting the error event from a function or method
     */
    const calculateErrorSourceName = function( pModule, pFunction )
    {
        const modName = isObj( pModule ) ? _asStr( pModule?.moduleName || pModule?.name || pModule ) : isStr( pModule ) ? pModule : _unknown;
        const funName = isFunc( pFunction ) ? _asStr( (pFunction?.name || nameFromSource( pFunction )) || "anonymous" ) : isStr( pFunction ) ? pFunction : _unknown;

        return _asStr( modName || pModule ) + (_colon + _colon) + _asStr( funName || pFunction );
    };

    /**
     * Represents detailed information about a specific source code location.<br>
     * <br>
     * Useful in reporting errors.<br>
     * @class
     */
    class SourceInfo
    {
        #fileName;
        #lineNumber;
        #columnNumber;

        #module;
        #method;
        #source;

        /**
         * Constructs an instance with details about a specific error source.
         *
         * @param {string|Object} pModule - The module or the name of the module where the error occurred.
         * @param {string|function} pMethod - The function or the name of the function where the error occurred.
         * @param {string} pFileName - The name of the file where the error occurred.
         * @param {number} pLineNumber - The line number in the file where the error occurred.
         * @param {number} pColumnNumber - The column number in the line where the error occurred.
         * @return {SourceInfo} A new instance containing information about the error source.
         */
        constructor( pModule, pMethod, pFileName, pLineNumber, pColumnNumber )
        {
            this.#fileName = _asStr( pFileName || (_ud === typeof __filename ? _unknown : __filename) );
            this.#lineNumber = pLineNumber || -1;
            this.#columnNumber = pColumnNumber || -1;

            this.#module = pModule;
            this.#method = pMethod;

            this.#source = calculateErrorSourceName( pModule, pMethod );
        }

        get fileName()
        {
            return this.#fileName;
        }

        get lineNumber()
        {
            return this.#lineNumber;
        }

        get columnNumber()
        {
            return this.#columnNumber;
        }

        get module()
        {
            return this.#module;
        }

        get method()
        {
            return this.#method;
        }

        get source()
        {
            return this.#source;
        }

        clone()
        {
            return new this.constructor( this.module, this.method, this.fileName, this.lineNumber, this.columnNumber );
        }
    }

    /**
     * @typedef {Object} ErrorDetail
     * @property {Error} error The Error encountered
     * @property {string} message The error message
     * @property {string|number}  level The suggested log level for the error encountered
     * @property {string} method The function or method being executed when the error was encountered
     * @property {...*} extra Other data the error handler might provide to help understand or troubleshoot the error
     */

    /**
     * @event load
     */

    /**
     * @typedef {Object} IStatefulListener
     * @property {function(Event,...*):void} handleEvent A method to handle an event
     */

    /**
     * This is a base class that can be extended to implement IStatefulListener<br>
     * <br>
     * A stateful listener is any object that implements the IStatefulListener interface.<br>
     * That is, it simply has to have a method named "handleEvent"<br>
     * that accepts an Event (and optionally, one or more additional arguments)<br>
     * <br>
     * Stateful listeners can be useful<br>
     * when the behavior of the handler depends on some state<br>
     * that might be maintained by the listener.<br>
     * <br>
     * An example might be a listener that is notified<br>
     * when fetch requests are made and when fetch requests complete<br>
     * and keep track of the order in which the requests were made<br>
     * in order to either process responses in a particular order<br>
     * or to discard all but the most recent response.<br>
     *
     * @class
     */
    class StatefulListener
    {
        /**
         * @type {number}
         */
        #id;

        /**
         * @type {string}
         */
        #name;

        /**
         * @type {Object}
         */
        #options;

        /**
         *
         * @type ExecutionMode
         */
        #mode;

        /**
         * Generates the next unique identifier for a StatefulListener.
         *
         * This function increments and returns the next numeric identifier
         * by accessing the `NEXT_ID` static property of the `StatefulListener` class.
         * <br>
         * <br>
         * Suitable for creating unique IDs for internal mechanisms
         * where distinguishing between different instances of listeners
         * or components is required.
         * <br>
         * @function
         * @protected
         * @returns {number} The next unique identifier.
         */
        static nextId = () => StatefulListener.NEXT_ID++;

        constructor( pName, pOptions )
        {
            this.#id = StatefulListener.nextId();

            if ( this.#id > 999_999_999 )
            {
                StatefulListener.NEXT_ID = 1;
            }

            this.#options = Object.assign( {}, pOptions || {} );

            this.#name = (isStr( pName ) ? pName : this.#options?.name) || ("StatefulListener_" + String( this.#id ));

            this.#mode = this.#options?.mode instanceof ExecutionMode ? this.#options?.mode : CURRENT_MODE;

            if ( ExecutionMode.MODES.TEST.equals( this.#mode ) || this.#mode?.traceEnabled )
            {
                this.eventsHandled = [];
            }

            this.clone = function()
            {
                let copy = { ...this };
                copy.id = this.id;
                copy.prototype = this.constructor;
                copy.constructor = this.constructor;
                return copy;
            };
        }

        /**
         * Accessor property that specifies the constructor function to use when creating derived objects.<br>
         * <br>
         * This property is used to override the default constructor for certain methods that construct a new instance of the object.
         *
         * @return {Function} The constructor function to use for derived objects.
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Handles an event.<br>
         * This method is intended to be overridden in a subclass,<br>
         * as it is not implemented in the base class.
         * <br>
         *
         * @param {Event|ToolBocksModuleEvent} pEvent - The event object containing details about the event to handle.
         * @param {...*} [pExtra] - Additional data or parameters that may be passed with the event.
         */
        handleEvent( pEvent, ...pExtra )
        {
            const evt = resolveEvent( pEvent );

            // the only thing implemented in the base class is for debugging and testing modes
            if ( isArray( this.eventsHandled ) )
            {
                this.eventsHandled.push( { event: evt, extra: [...(pExtra || [])] } );

                if ( $ln( this.eventsHandled ) > 64 )
                {
                    attemptSilent( () => this.eventsHandled = [...(this.eventsHandled.slice( 64 ))] );
                }
            }
        }

        /**
         * Retrieves the unique identifier of this instance.
         * @return {number} The unique identifier for this instance.
         */
        get id()
        {
            return this.#id;
        }

        /**
         * Retrieves the name of this instance.
         *
         * @return {string} The name associated with this object.
         */
        get name()
        {
            return this.#name;
        }

        /**
         * Retrieves an immutable copy of the options used when this instance was constructed.
         *
         * @return {Object} An immutable copy of the options used when this instance was constructed.
         */
        get options()
        {
            return immutableCopy( this.#options );
        }

        /**
         * Retrieves the name of the constructor function of the current object.
         * This is typically used to identify the class of an instance.
         *
         * @return {string|undefined} The name of the constructor function that created this instance
         */
        get type()
        {
            return this.constructor?.name;
        }

        get mode()
        {
            return this.#mode || CURRENT_MODE;
        }

        get traceEnabled()
        {
            return this.mode?.traceEnabled || false;
        }

        /**
         * Compares the current object with another object to determine equality.<br>
         * @param {Object} pOther The object to compare with the current object.
         * @return {boolean} Returns true if the objects are equal, otherwise false.
         */
        equals( pOther )
        {
            if ( null == pOther )
            {
                return false;
            }

            if ( this === pOther )
            {
                return true;
            }

            if ( pOther instanceof this.constructor || isFunc( pOther?.handleEvent ) )
            {
                return (this.#id === pOther?.id);
            }
        }

        /**
         * Compares this object with the specified object for order.
         *
         * @param {Object} pOther - The object to compare with this instance.<br>
         * It must be of the same type or an object with a compatible structure.<br>
         * If null, undefined, or not of the expected type,<br>
         * -1 is returned, indicated that this instance should be considered less than the other object<br>
         * <br>
         * @return {number} A negative integer, zero, or a positive integer if this object is considered
         * less than, equal to, or greater than the specified object, respectively.<br>
         */
        compareTo( pOther )
        {
            if ( null == pOther || !(pOther instanceof this.constructor || isFunc( pOther?.handleEvent )) )
            {
                return -1;
            }

            if ( this === pOther || this.equals( pOther ) )
            {
                return 0;
            }

            return (this.#id - (pOther?.id || 1));
        }
    }

    /**
     * A static property that holds the next unique identifier to be used
     * by StatefulListener instances. This property is used to ensure
     * each StatefulListener instance receives a unique numeric ID.
     *
     * @type {number}
     * @static
     * @protected
     */
    StatefulListener.NEXT_ID = 1;

    /**
     * Represents a visitor class to support the common Visitor Pattern.
     * This class also extends the EventTarget interface
     * to enable event dispatching, specifically for the "visit" event.
     * Subclasses can use and/or extend its functionality to define their own visiting logic.
     */
    class Visitor extends EventTarget
    {
        #options;

        #visitFunction;

        constructor( pVisitFunction, pOptions )
        {
            super();

            this.#options = Object.assign( {}, pOptions || {} );

            this.#visitFunction = isFunc( pVisitFunction ) ? pVisitFunction.bind( this ) : isFunc( this.#options?.visit ) ? this.#options?.visit.bind( this ) : null;
        }

        get options()
        {
            return Object.assign( {}, this.#options || {} );
        }

        mergeOptions( pOptions )
        {
            if ( isNonNullObj( pOptions ) )
            {
                this.#options = populateOptions( pOptions || this.#options || {}, this.#options || {} );
            }

            return this;
        }

        /**
         * Base class implementation of the visit method.<br>
         * Dispatches a "visit" event with the visited object or value as its 'detail' data.<br>
         * Subclasses should override this method<br>
         * and only call super.visit() if they want to dispatch the "visit" event<br>
         * <br>
         * Normally, this method should not return a value,<br>
         * however, if you want to stop the iteration based on the visited data,<br>
         * return true or a 'truthy' value.<br>
         * <br>
         * All, but only, the accepting functions and methods in the ToolBocks library<br>
         * are <i>guaranteed</i> to honor this contract.<br>
         * If you write your own 'accept' method to take instances of this class or its subclasses,<br>
         * please either honor the contract or document that you do not.
         * <br>
         *
         * @param {*} pVisited - The object or data being visited.
         *
         * @param {...*} [pExtra] Additional arguments a particular iterator might pass
         *
         * @return {void|boolean} Normally does not return a value,
         *                        but if desired, return true or a 'truthy' value to stop an iteration
         */
        visit( pVisited, ...pExtra )
        {
            this.dispatchEvent( new ToolBocksModuleEvent( "visit",
                                                          pVisited,
                                                          populateOptions( this.#options,
                                                                           {
                                                                               detail: pVisited,
                                                                               data: pVisited
                                                                           } ) ) );

            if ( isFunc( this.#visitFunction ) )
            {
                const me = this;

                if ( isAsyncFunction( this.#visitFunction ) )
                {
                    asyncAttempt( async() => await (me || this).#visitFunction.call( (me || this), pVisited, ...pExtra ) ).then( no_op ).catch( ex => this.dispatchEvent( new ToolBocksModuleEvent( S_ERROR, {
                        error: ex,
                        detail: ex
                    } ) ) );
                }
                else
                {
                    attempt( () => (me || this).#visitFunction.call( (me || this), pVisited, ...pExtra ) );
                }
            }
        }
    }

    /**
     * Returns true if the specified value can be used as a Visitor.<br>
     * <br>
     * An object can be used as a Visitor if it is an instance of Visitor
     * or if it has a method named "visit"
     * <br>
     * @param {Visitor|object} pVisitor The object to evaluate
     *
     * @returns {boolean} true if the specified value can be used as a Visitor
     */
    Visitor.isVisitor = ( pVisitor ) => (pVisitor instanceof Visitor || isFunc( pVisitor?.visit ));

    // noinspection JSClosureCompilerSyntax
    /**
     * This subclass of Visitor allows using any function as a visitor.<br>
     * <br>
     * Constructing an instance of this class with a valid function will result in a Visitor
     * whose visit method calls that function and passes the argument passed to the visit method to that function.
     *
     * @class
     * @extends Visitor
     */
    class AdHocVisitor extends Visitor
    {
        #func = no_op;

        /**
         * Constructs an instance of the Visitor class
         * that will call the provided function when the visit method is called.
         * <br>
         *
         * @param {Function} pFunction - A function to be invoked when the visit method is called.
         *                               It should accept a single parameter `pVisited`
         *                               The function should only return a value
         *                               if the intent is to abort the current iteration of the visited object.
         *                               In that case, the function should return the boolean value, true
         *
         * @param {Object} pOptions - Configuration options for the class.
         *                            These options are passed to the superclass constructor.
         *
         * @return {AdHocVisitor} An instance of Visitor
         *
         * @constructor
         */
        constructor( pFunction, pOptions )
        {
            super( pFunction, pOptions );

            const me = this;

            if ( isFunc( pFunction ) )
            {
                this.#func = function( pVisited, ...pExtra )
                {
                    try
                    {
                        return pFunction.call( (me || this), pVisited, ...pExtra );
                    }
                    catch( ex )
                    {
                        this.dispatchEvent( new ToolBocksModuleEvent( S_ERROR,
                                                                      {
                                                                          error: ex,
                                                                          message: ex.message,
                                                                          visited: pVisited,
                                                                          args: [...(pExtra || [] || [])]
                                                                      }, populateOptions( {
                                                                                              detail: pVisited,
                                                                                              data: pVisited,
                                                                                              error: ex
                                                                                          }, this.options ) ) );
                    }
                }.bind( me || this );
            }
        }

        /**
         * Called by an object's internal iterator.
         *
         * @param {*} pVisited The value currently being 'visited' by the internal iterator
         *
         * @param {...*} [pExtra] Other values an internal iterator might pass to the visitor
         *
         * @returns {void|boolean} Returns true IFF the intent is to abort the internal iteration.
         */
        visit( pVisited, ...pExtra )
        {
            const me = this;
            return attempt( () => (me || this).#func.call( (me || this), pVisited, ...pExtra ) );
        }
    }

    // noinspection JSClosureCompilerSyntax
    /**
     * This subclass of Visitor is a no op visitor.<br>
     * Instances of this class can be used when a Visitor is expected,
     * but you do not want to do anything when visit is called.
     *
     * @class
     * @extends Visitor
     */
    class NullVisitor extends Visitor
    {
        constructor( pOptions )
        {
            super( null, pOptions );
        }

        /**
         * Called by an object's internal iterator.
         *
         * @param {*} pVisited The value currently being 'visited' by the internal iterator
         *
         * @param {...*} [pExtra] Other values an internal iterator might pass to the visitor
         *
         * @returns {void|boolean} THIS IMPLEMENTATION IS A NO OP.
         */
        visit( pVisited, ...pExtra )
        {
            // no op
        }
    }

    /**
     * Resolves and returns an appropriate visitor instance based on the provided input.
     *
     * This function processes a given visitor object or function, and determines the most appropriate
     * visitor to use by evaluating its type and applying any specified options. It supports the following cases:
     * - If the input is an instance of `Visitor`, it merges the provided options and returns the modified visitor.
     * - If the input is a valid visitor function, it wraps the function in an `AdHocVisitor` and applies the options.
     * - If the input does not correspond to any valid visitor, it defaults to returning an instance of `NullVisitor`.
     *
     * @param {Visitor|Function|Object} pVisitor - The visitor object or function to be used to construct a Visitor.
     *
     * @param {Object} [pOptions={}] - Optional configurations to customize the behavior of the resolved visitor.
     *
     * @returns {Visitor} The resolved visitor instance.
     */
    const resolveVisitor = function( pVisitor, pOptions = {} )
    {
        if ( Visitor.isVisitor( pVisitor ) )
        {
            if ( pVisitor instanceof Visitor )
            {
                return pVisitor.mergeOptions( pOptions ) || pVisitor;
            }
            return new AdHocVisitor( pVisitor?.visit || pVisitor, pOptions );
        }
        else if ( isFunc( pVisitor ) )
        {
            return new AdHocVisitor( pVisitor, pOptions );
        }

        return new NullVisitor( pOptions );
    };

    /**
     * This is the base class for all the ToolBocks&trade; modules.
     * <br><br>
     * It extends EventTarget to allow module functions to emit events
     * <br>when errors or other <i>interesting</i> events occur.
     * <br><br>
     * Consuming code can add event listeners to react appropriately.
     * <br>
     * <br>
     * An example would be to use event handlers to log errors,<br>
     * allowing the consumer code to use whatever mechanism is desired for logging,<br>
     * rather than this library spewing unnecessarily to the console.
     * <br>
     * <br>
     * Module documentation will list all the events (other than "error") for which a consumer might listen.
     * <br>
     * @extends EventTarget
     */
    class ToolBocksModule extends EventTarget
    {
        // the name of this instance, or module
        #moduleName;

        // the key under which this module may be cached in global scope
        #cacheKey;

        #executionEnvironment;

        #traceEnabled = false;

        #moduleArguments = MODULE_ARGUMENTS;

        #debugMode = DEBUG_MODE;

        // a global logger to be used with all instances of this class that do not have their own logger
        static #globalLogger = null;

        // an instance-specific logger to be used instead of any potentially defined global logger
        #logger;

        // a boolean to control whether global logging is enabled
        static #globalLoggingEnabled = true;

        // a boolean to control whether this instance will write to a log
        #loggingEnabled = true;

        // a map of stateful listeners by event (string)
        #statefulListeners = {};

        /**
         * Constructs a new instance, or module, to expose functionality to consumers.
         * <br>
         * <br>
         * @constructor
         *
         * @param {string|ToolBocksModule|Object} pModuleName The name of this instance, or another instance<br>
         *                                                 from which to inherit the name and other properties
         * @param {string} pCacheKey A unique key to use to cache this module in global scope to improve performance
         * @param {Object} [pOptions={}]
         * @param {ModuleArgs} [pModuleArguments=MODULE_ARGUMENTS]
         */
        constructor( pModuleName, pCacheKey = INTERNAL_NAME || pModuleName, pOptions = {}, pModuleArguments = MODULE_ARGUMENTS )
        {
            super();

            const me = this;

            this.#moduleName = (isStr( pModuleName )) ? pModuleName : (isObj( pModuleName ) ? pModuleName?.moduleName || pModuleName?.name || modName : _mt_str) || modName;
            this.#cacheKey = (isStr( pCacheKey )) ? pCacheKey : (isObj( pModuleName ) ? pModuleName?.cacheKey || INTERNAL_NAME : _mt_str) || INTERNAL_NAME;

            this.#moduleName = this.#moduleName || modName;
            this.#cacheKey = this.#cacheKey || INTERNAL_NAME;

            const options = { ...(resolveObject( pOptions || {} ) || {}) };

            this.#traceEnabled = !!options.traceEnabled;

            const logger = objectValues( options ).find( e => ToolBocksModule.isLogger( e ) );

            this.#logger = ToolBocksModule.isLogger( logger ) ? logger : null;

            attempt( () => me.#processOptions( options ) );

            this.#moduleArguments = pModuleArguments || MODULE_ARGUMENTS || { "get": function( pKey ) {} };

            this.#debugMode = this.#debugMode || DEBUG_MODE || attempt( () => this.#moduleArguments.get( "-debug" ) );

            // if the constructor is called with an object, instead of a string,
            // inherit its properties and functions
            if ( isObj( pModuleName ) )
            {
                this.extend( pModuleName );
            }

            // cache this module to avoid unnecessary reconstruction
            if ( this.#moduleName && isStr( this.#moduleName ) )
            {
                MODULE_CACHE[this.#moduleName] = MODULE_CACHE[this.#moduleName] || this;
            }

            if ( this.#cacheKey && isStr( this.#cacheKey ) )
            {
                MODULE_CACHE[this.#cacheKey] = MODULE_CACHE[this.#cacheKey] || this;
            }

            handleAttempt.handleError = function( pError, pContext, ...pExtra )
            {
                if ( isError( pError ) )
                {
                    const error = resolveError( pError, pError?.message, ...pExtra );

                    handleAttempt.lastError = error;

                    attemptSilent( () => (me || this).reportError( error, error?.message, S_ERROR, (me || this).calculateErrorSourceName( (me || this), pContext || handleAttempt ), ...pExtra ) );
                }
            };
        }

        #processOptions( pOptions = {} )
        {
            const me = this;

            const options = { ...(resolveObject( pOptions || {} ) || {}) };

            const entries = objectEntries( options );

            function addListeners( value, key )
            {
                if ( value instanceof StatefulListener )
                {
                    let evtType = _asStr( key ).replace( /^on/i, _mt );
                    if ( evtType )
                    {
                        attempt( () => me.addStatefulListener( value, evtType ) );
                    }
                }
                else if ( isArray( value ) && [...(value || [])].some( e => e instanceof StatefulListener ) )
                {
                    attempt( () => [...(value || [])].forEach( elem => addListeners( elem, key ) ) );
                }
                else if ( isMap( value ) || isNonNullObj( value ) )
                {
                    let listenerEntries = attempt( () => objectEntries( value ) ) || [];

                    if ( listenerEntries && $ln( listenerEntries ) > 0 )
                    {
                        listenerEntries.forEach( listenerEntry =>
                                                 {
                                                     let listener = ObjectEntry.getValue( listenerEntry );

                                                     let types = listenerEntry[0] || ObjectEntry.getKey( listenerEntry );
                                                     types = isArray( types ) ? types : (isStr( types ) ? [types] : []);

                                                     if ( isNonNullObj( listener ) && listener instanceof StatefulListener )
                                                     {
                                                         attempt( () => me.addStatefulListener( listener, ...(types || []) ) );
                                                     }
                                                     else if ( isFunc( listener ) || (isNonNullObj( listener ) && isFunc( listener.handleEvent )) )
                                                     {
                                                         for( let type of types )
                                                         {
                                                             attempt( () => me.addEventListener( type, listener ) );
                                                         }
                                                     }
                                                 } );
                    }
                }
            }

            if ( entries )
            {
                attempt( () => entries.forEach( entry =>
                                                {
                                                    const key = ObjectEntry.getKey( entry );
                                                    const value = ObjectEntry.getValue( entry );

                                                    if ( ["listener", "listeners"].includes( key ) || value instanceof StatefulListener )
                                                    {
                                                        addListeners( value, key );
                                                    }
                                                } ) );
            }
        }

        isDebugMode()
        {
            return this.#debugMode;
        }

        /**
         * Creates and returns a shallow copy of the current module instance.
         *
         * @return {ToolBocksModule} A shallow copy of the module
         */
        clone()
        {
            const copy = { ...this };
            copy.constructor = this.constructor;
            Object.setPrototypeOf( copy, Object.getPrototypeOf( this ) );
            return copy;
        }

        /**
         * Returns a constructor for this class.
         * @returns {ToolBocksModule}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        get traceEnabled()
        {
            return !!this.#traceEnabled;
        }

        trace( pMessage, pOptions )
        {
            if ( this.traceEnabled )
            {
                INTERNAL_LOGGER.trace( pMessage, pOptions || "Called without options" );

                this.dispatchEvent( new ToolBocksModuleEvent( S_TRACE, pMessage, pOptions ) );
            }
        }

        addEventListener( pType, pCallback, pOptions )
        {
            super.addEventListener( pType, pCallback, pOptions );

            if ( this.traceEnabled )
            {
                this.trace( "addEventListener", {
                    moduleName: this.moduleName,
                    type: pType,
                    callback: pCallback,
                    options: pOptions
                } );
            }
        }

        addStatefulListener( pListener, ...pTypes )
        {
            if ( pListener instanceof StatefulListener )
            {
                if ( null != pTypes && pTypes.length > 0 )
                {
                    const types = [...pTypes].map( _asStr ).filter( _isValidStr ).map( _lcase );

                    for( let type of types )
                    {
                        const listeners = this.#statefulListeners[type];

                        if ( null == listeners )
                        {
                            this.#statefulListeners[type] = [pListener];
                        }
                        else
                        {
                            listeners.push( pListener );
                        }
                    }

                    if ( this.traceEnabled )
                    {
                        this.trace( "addStatefulListener", { moduleName: this.moduleName, types, pListener } );
                    }
                }

                return true;
            }
            return false;
        }

        dispatchEvent( pEvent, pData, pOptions )
        {
            const evt = resolveEvent( pEvent, pData, pOptions );

            const dispatched = super.dispatchEvent( evt );

            if ( dispatched )
            {
                const type = (String( evt.type ) || _mt_str).toLowerCase();

                const listeners = this.#statefulListeners[type];

                if ( null != listeners )
                {
                    for( let listener of listeners )
                    {
                        attempt( () => listener.handleEvent( evt, evt?.detail, pData, pOptions ) );
                    }
                }

                if ( this.traceEnabled )
                {
                    this.trace( "dispatchEvent", { moduleName: this.moduleName, event: evt || pEvent, listeners } );
                }
            }
        }

        removeEventListener( pType, pCallback, pOptions )
        {
            super.removeEventListener( pType, pCallback, pOptions );

            if ( pCallback instanceof StatefulListener )
            {
                this.removeStatefulListener( pCallback, pType );
            }

            if ( this.traceEnabled )
            {
                this.trace( "removeEventListener", {
                    moduleName: this.moduleName,
                    type: pType,
                    callback: pCallback,
                    options: pOptions
                } );
            }
        }

        /**
         * Removes the specified listener<br>
         * or stops this module from notifying this listener of events of the type(s) specified in the second argument<br>
         *
         * @param {Object|number} pListener The listener to remove or the numeric ID of the listener to remove
         * @param {...(string|Event)} pTypes The types for which the listener should no longer be notified.<br>
         *                                   If this is null or an empty array or includes the value, "*",<br>
         *                                   The listener will be removed entirely and no longer notified of <i>any</i> events.<br>
         *
         *
         */
        removeStatefulListener( pListener, ...pTypes )
        {
            let id = (pListener instanceof StatefulListener || (isNum( pListener?.id ) && pListener?.id > 0)) ? pListener?.id : (isNum( pListener )) ? pListener : 0;

            const forAllTypes = (null == pTypes || 0 === pTypes.length || pTypes.includes( _asterisk ));

            let types = forAllTypes ? Object.keys( this.#statefulListeners ) : [...pTypes].map( _asStr ).filter( _isValidStr ).map( _lcase );

            for( let type of types )
            {
                const listeners = this.#statefulListeners[type];

                const index = null != listeners && listeners.length ? listeners.findIndex( l => l.id === id ) : -1;

                const toRemove = (index >= 0);

                if ( toRemove )
                {
                    listeners.splice( index, 1 );

                    if ( this.traceEnabled )
                    {
                        this.trace( "removeStatefulListener", {
                            moduleName: this.moduleName,
                            type,
                            toRemove,
                            listeners
                        } );
                    }
                }
            }
        }

        /**
         * Returns the global scope (globalThis) in which this code is executing.<br>
         * @returns {Object} the global scope, or globalThis, in which this code is executing
         */
        get globalScope()
        {
            return $scope();
        }

        /**
         * Returns the name of this module
         * @returns {string} The name of this module
         */
        get moduleName()
        {
            return String( this.#moduleName || this.#cacheKey );
        }

        /**
         * Returns the key under which this module may be cached in the global scope
         * @returns {string} The key under which this module may be cached in the global scope
         */
        get cacheKey()
        {
            return String( this.#cacheKey || this.#moduleName );
        }

        getMessagesLocaleString()
        {
            return this.executionEnvironment?.localeCode || getMessagesLocaleString();
        }

        /**
         * Returns a string used when emitting the error event from a function or method.
         * <br><br>
         * Constructs a string of the form {ModuleName}::{FunctionName}<br>
         * @param {string|Object|function} pModuleName The name of the module in which the error occurred
         * @default The name of this module
         * @param {string|function} pFunction The name of the function (or the function itself) in which the error occurred
         * @returns {string} A string used when emitting the error event from a function or method
         */
        calculateErrorSourceName( pModuleName, pFunction )
        {
            return calculateErrorSourceName( (pModuleName || this.moduleName), pFunction );
        }

        /**
         * Returns the instance-specific logger for this module<br>
         * or the global logger, if no instance-specific logger is defined.
         * <br><br>
         * If logging is disabled, this property returns a Mock logger.<br>
         * If logging is enabled, but neither an instance-specific nor a global logger is specified,
         * returns the Console object
         *
         * @returns {ILogger|MockLogger|console} an object with the following methods: log, info, warn, debug, error, and trace
         */
        get logger()
        {
            let logger;

            if ( this.#loggingEnabled )
            {
                if ( ToolBocksModule.#globalLoggingEnabled )
                {
                    logger = ToolBocksModule.resolveLogger( ToolBocksModule.getGlobalLogger() || this.#logger, this.#logger || INTERNAL_LOGGER );
                }

                logger = ToolBocksModule.resolveLogger( logger, this.#logger, ((DEBUG_MODE || CURRENT_MODE.traceEnabled) ? DEBUG_LOGGER : (ExecutionMode.isProduction( CURRENT_MODE ) ? PRODUCTION_LOGGER : INTERNAL_LOGGER)) );

                return logger instanceof ConditionalLogger ? logger : (DEBUG_MODE || CURRENT_MODE.traceEnabled) ? DEBUG_LOGGER : (ExecutionMode.isProduction( CURRENT_MODE ) ? PRODUCTION_LOGGER : INTERNAL_LOGGER);
            }

            return logger || MockLogger;
        }

        /**
         * Defines an instance-specific logger<br>
         * (if the specified argument defines the 6 required methods,<br>
         * log, info, warn, error, debug, and trace).
         * <br>
         * @param {ILogger|console} pLogger An object defining the 6 required methods, log, info, warn, error, debug, and trace
         */
        set logger( pLogger )
        {
            if ( ToolBocksModule.isLogger( pLogger ) )
            {
                this.#logger = ToolBocksModule.resolveLogger( pLogger, this.#logger, ToolBocksModule.getGlobalLogger() );
            }
        }

        /**
         * Disables logging for this instance.
         * <br><br>
         * If you want to add an event listener for errors and warnings instead,
         * you may want to call this method to avoid redundant logging.
         * <br>
         */
        disableLogging()
        {
            this.#loggingEnabled = false;
        }

        /**
         * Enables logging for this instance.
         * <br><br>
         * This instance will write to either the instance-specific logger, the global logger, or the console,
         * depending on whether a logger has been set at either the global or instance level.
         * <br>
         */
        enableLogging()
        {
            this.#loggingEnabled = true;
        }

        /**
         * Returns true if the specified object implements the 5 expected methods:<br>
         * log, info, warn, error, and debug (and optionally, trace)
         * <br>
         * @param {Object|ILogger} pLogger An object that may or may not be a logger
         * @returns {boolean} true of the specified object implements the 5 expected methods:
         * log, info, warn, error, and debug (and optionally, trace)
         */
        static isLogger( pLogger )
        {
            if ( _ud === typeof pLogger || null === pLogger )
            {
                return false;
            }
            return (pLogger instanceof ILogger) || (isNonNullObj( pLogger )
                                                    && isFunc( pLogger[S_LOG] )
                                                    && isFunc( pLogger[S_INFO] )
                                                    && isFunc( pLogger[S_WARN] )
                                                    && isFunc( pLogger[S_DEBUG] )
                                                    && isFunc( pLogger[S_ERROR] ));
        }

        /**
         * Defines a logger to use for any module that does not have an instance-specific logger.
         * @param {Object} pLogger an object defining the 6 required methods: log, info, warn, error, debug, and trace
         */
        static setGlobalLogger( pLogger )
        {
            if ( ToolBocksModule.isLogger( pLogger ) )
            {
                ToolBocksModule.#globalLogger = pLogger;
            }
        };

        /**
         * Returns the logger used for any module that does not have an instance-specific logger
         * or null if no global logger is defined.
         * <br>
         * @returns {ILogger|null} The logger used for any module that does not have an instance-specific logger
         * or null if no global logger is defined
         */
        static getGlobalLogger()
        {
            return ToolBocksModule.#globalLoggingEnabled ? ToolBocksModule.#globalLogger : MockLogger;
        }

        /**
         * Disables logging for any module that does not define an instance-specific logger
         */
        static disableGlobalLogger()
        {
            ToolBocksModule.#globalLoggingEnabled = false;
        }

        /**
         * Enables logging for any module that does not define an instance-specific logger
         * or that has not disabled logging at the instance-level
         */
        static enableGlobalLogger()
        {
            ToolBocksModule.#globalLoggingEnabled = true;
        }

        /**
         * Returns an object conforming to the expected interface of ILogger.
         *
         * That is, this method returns an object with at least the following methods:
         * log( ...pData ), info( ...pData ), warn( ...pData ), error( ...pData ), and debug( ...pData ),
         * with an inherent assumption that the data passed to one of those methods will be written as strings to some destination.
         * The destination may be a file, a stream, the Windows Event Log, or even just /dev/null
         *
         * If the specified object, pLogger, conforms to the expected interface, it is returned unchanged.
         * Otherwise, if a default is provided, as pDefault, and that object conforms to the expected interface, it is returned.
         * Otherwise, if there is a global logger attached to the ToolBocksModule class, that object is returned.
         * If none of those conditions are met, this method returns the console object defined for the current execution environment.
         *
         * @param {object|ILogger} pLogger the object to use for logging, if it conforms to the expected interface
         * @param {...object} pAlternatives
         * @returns {ILogger|Console} an object that supports the expected logging methods
         */
        static resolveLogger( pLogger, ...pAlternatives )
        {
            if ( ToolBocksModule.isLogger( pLogger ) && !pLogger.mocked )
            {
                return pLogger;
            }

            let alternatives = !isNull( pAlternatives ) ? (isArray( pAlternatives ) ? [...pAlternatives] : [pAlternatives]) : [];
            alternatives = alternatives.filter( e => isNonNullObj( e ) && ToolBocksModule.isLogger( e ) );

            for( let alternative of alternatives )
            {
                if ( ToolBocksModule.isLogger( alternative ) && !alternative.mocked )
                {
                    return alternative;
                }
            }

            let logger = ToolBocksModule.getGlobalLogger();

            if ( ToolBocksModule.isLogger( logger ) && !logger.mocked )
            {
                return logger;
            }

            return MockLogger;
        }

        /**
         * Conditionally writes the specified data element(s) to this module's logger or a global logger,
         * if logging is enabled for this module or global logging is enabled
         * @param {...*} pMsg one or more items to be converted to strings and written to a log-specific destimation
         */
        logMessage( ...pMsg )
        {
            if ( this.#loggingEnabled || ToolBocksModule.#globalLoggingEnabled )
            {
                const writer = this.logger || INTERNAL_LOGGER || konsole;
                attempt( () => writer.log( ...pMsg ) );
            }
        }

        /**
         * Conditionally writes the specified data element(s) to this module's logger or a global logger,
         * if logging is enabled for this module or global logging is enabled.
         *
         * If the specified logger supports filtering or formatting by level,
         * applies that filtering or formatting as defined for warnings
         *
         * @param {...*} pMsg one or more items to be converted to strings and written to a log-specific destimation
         */
        logWarning( ...pMsg )
        {
            if ( this.#loggingEnabled || ToolBocksModule.#globalLoggingEnabled )
            {
                const writer = this.logger || INTERNAL_LOGGER || konsole;
                attempt( () => writer.warn( ...pMsg ) );
            }
        }

        /**
         * Conditionally writes the specified data element(s) to this module's logger or a global logger,
         * if logging is enabled for this module or global logging is enabled.
         *
         * If the specified logger supports filtering or formatting by level,
         * applies that filtering or formatting as defined for errors
         *
         * @param {...*} pMsg one or more items to be converted to strings and written to a log-specific destimation
         */
        logError( ...pMsg )
        {
            if ( this.#loggingEnabled || ToolBocksModule.#globalLoggingEnabled )
            {
                const writer = this.logger || INTERNAL_LOGGER || konsole;
                attempt( () => writer.error( ...pMsg ) );
            }
        }

        /**
         * Notifies event handlers listening for the "error" event of the error encountered.
         * <br><br>
         * Writes to the defined logger, if logging is enabled.
         * <br>
         * <br>
         * The event object passed to the event handlers includes a detail property with: <br>
         * the Error object, <br>
         * a message, <br>
         * the recommended log level (for example, error, info, warn, etc.),<br>
         * and the 'source' of the error
         * (a string description of the module and function where the error occurred).
         * <br>
         *
         * @param {Error} pError The error encountered
         * @param {string} pMessage A specific error message relevant to the occurrence
         * @param {string} pLevel The log level suggested for the error, such as "warn" or "error"
         * @param {string} pSource A description of the source of the error, such as the module and function where the error occurred
         * @param {...*} pExtra  One or more extra values to log or include in the dispatched event
         *
         * @type {function}
         *
         * @see resolveError
         * @see calculateErrorSourceName
         * @see ErrorDetail
         *
         */
        reportError( pError,
                     pMessage = (pError?.message || pError?.name || S_DEFAULT_OPERATION),
                     pLevel = S_ERROR,
                     pSource = _mt_str,
                     ...pExtra )
        {
            try
            {
                let s = _mt_str + ((isStr( pMessage ) ? pMessage : _mt) || pError?.message || pError?.name || S_DEFAULT_OPERATION);

                const err = resolveError( (isError( pError ) ? pError : isError( pMessage ) ? pMessage : {}), s );

                s = _mt_str + (err?.message || err?.name || s || S_DEFAULT_OPERATION);

                let level = resolveLogLevel( _lcase( _asStr( pLevel ).trim() ) );

                level = [S_LOG, S_INFO, S_WARN, S_ERROR, S_DEBUG].includes( level || S_ERROR ) ? level : S_ERROR;

                let extra = S_TRACE === level ? [...pExtra] : [];

                let msg = [S_ERR_PREFIX, s, err, ...extra].map( e => attemptSilent( () => serialize( e ) ) );

                if ( this.traceEnabled )
                {
                    this.trace( "reportError", { moduleName: this.moduleName, err, msg, level, source: pSource } );
                }

                if ( this.#loggingEnabled && ToolBocksModule.isLogger( this.logger ) )
                {
                    let logr = ToolBocksModule.resolveLogger( this.logger, INTERNAL_LOGGER );
                    attemptMethod( logr, logr[level], ...msg );
                }

                try
                {
                    const data =
                        {
                            error: err,
                            message: msg.filter( e => isStr( e ) ).join( _spc ),
                            level: level,
                            method: _mt_str + ((_mt_str + pSource) || this.moduleName || "BockModule"),
                            extra: [...pExtra]
                        };

                    this.dispatchEvent( new ToolBocksModuleEvent( S_ERROR, data, data ) );
                }
                catch( ex2 )
                {
                    //ignored
                }
            }
            catch( ex )
            {
                // ignored
            }
        }

        resolveErrorSource( pContext, pError )
        {
            return this.calculateErrorSourceName( this, pContext?.name || pContext || pError?.stack || pError );
        }

        /**
         * Convenience method to call reportError
         * @param {Error|string} pError the error to report
         * @param {object|function} [pContext=this] the context in which the error occurred
         * @param {...*} pExtra one or more value to include in the event dispatched and/or log message written when reporting the error
         */
        handleError( pError, pContext = this, ...pExtra )
        {
            if ( isError( pError ) )
            {
                const source = this.resolveErrorSource( pContext, pError );
                attemptSilent( () => this.reportError( pError, (pError?.message || pError?.name || pError?.type || S_DEFAULT_ERROR_MESSAGE), S_ERROR, source, ...pExtra ) );
            }
        }

        /**
         * Calls handleError without blocking the current event loop.
         *
         * @param {Error|string} pError the error to report
         * @param {object|function} [pContext=this] the context in which the error occurred
         * @param {...*} pExtra one or more value to include in the event dispatched and/or log message written when reporting the error
         *
         * @returns {Promise<void>} Calling code should NOT await this promise or call this method with an expectation of processing a return value.
         *                          This method is designed to be a "fire-and-forget" mechanism for reporting an error or exception without blocking the current event loop
         */
        async handleErrorAsync( pError, pContext, ...pExtra )
        {
            if ( isError( pError ) )
            {
                const me = this;

                const source = this.resolveErrorSource( pContext, pError );

                const error = resolveError( pError, pError?.message );

                const msg = pError?.message || S_DEFAULT_ERROR_MESSAGE;

                const extra = [...pExtra];

                const func = async function()
                {
                    attemptSilent( () => me.reportError( error, msg, S_ERROR, source, ...extra ) );
                }.bind( me );

                setTimeout( func, 10 );
            }
        }

        /**
         * Alias for this.handleErrorAsync
         *
         * @param {Error|string} pError the error to report
         * @param {object|function} [pContext=this] the context in which the error occurred
         * @param {...*} pExtra one or more value to include in the event dispatched and/or log message written when reporting the error
         *
         * @returns {Promise<void>} Calling code should NOT await this promise or call this method with an expectation of processing a return value.
         *                          This method is designed to be a "fire-and-forget" mechanism for reporting an error or exception without blocking the current event loop         */
        async asyncHandleError( pError, pContext, ...pExtra )
        {
            if ( isError( pError ) )
            {
                this.handleErrorAsync( pError, pContext, ...pExtra ).then( no_op ).catch( no_op );
            }
        }

        /**
         * Returns true if this module is read-only
         * @returns {boolean} true if this module is read-only
         */
        get locked()
        {
            return isReadOnly( this );
        }

        dereference( pObject, pType )
        {
            return attempt( () => dereference( pObject, pType ) );
        }

        /**
         * Adds the properties and functions of the object to this instance, or module
         * @param {Object} pObject An object defining one or more properties or methods to add to this module
         * @returns {ToolBocksModule} This instance, now augmented with the properties and methods of the specified object
         */
        extend( pObject )
        {
            if ( isNonNullObj( pObject ) )
            {
                if ( !this.locked )
                {
                    if ( isArray( pObject ) )
                    {
                        let mod = this;

                        for( const obj of pObject )
                        {
                            mod = this.extend( obj );
                        }

                        return mod || this;
                    }

                    const extendedInstance = Object.assign( this, pObject || {} );
                    Object.setPrototypeOf( extendedInstance, Object.getPrototypeOf( this ) );

                    return extendedInstance;
                }

                let toolbocksModule = new ToolBocksModule( pObject );

                let extendedModule = Object.assign( toolbocksModule, pObject );
                Object.setPrototypeOf( extendedModule, Object.getPrototypeOf( this ) );

                return extendedModule;
            }

            return this;
        }

        /**
         * Exports this module for use in other modules or consumer applications.
         * <br>
         * In some environments, this adds this instance to module/exports, which must be passed in.
         * <br>
         * In other environments, this method just returns the module, after caching it in the global scope.
         * <br>
         *
         * @param {Object} pObject Another module or object whose properties and functions will be added to this instance
         * @param {string} pCacheKey A unique key under which to cache this module in the global scope
         * @param pModuleScope {NodeModule|Object} the local module object from which the object is defined
         *
         * @returns {ToolBocksModule} This instance, potentially extended with properties and functions from the specified object
         * <br>
         * Emits a "load" event with this module as its detail data
         * @fires load
         */
        expose( pObject, pCacheKey, pModuleScope = MODULE_OBJECT )
        {
            let mod = pObject || this;

            if ( isNonNullObj( mod ) && !(mod instanceof this.constructor) )
            {
                mod = this.extend( mod );
            }

            const MODULE = pModuleScope || (_ud !== typeof module ? module : {});

            if ( _ud !== typeof MODULE )
            {
                MODULE.exports = lock( mod || this );
            }

            const key = isStr( pCacheKey ) ? _asStr( pCacheKey ).trim() : _mt_str;

            if ( $scope() && _mt_str !== key.trim() )
            {
                $scope()[key] = lock( mod || this );
            }

            mod.dispatchEvent( new ToolBocksModuleEvent( "load", mod, this ) );

            return lock( mod || this );
        }

        /**
         * Asynchronously extends this module and emits the load event when complete
         * @param {Object} pObject Another module or object whose properties and functions will be added to this instance
         * @returns {Promise<ToolBocksModule>} A Promise that resolves to the updated module
         * @fires load
         */
        async enhance( pObject )
        {
            const mod = this.extend( pObject );

            const object = isNonNullObj( pObject ) ? { ...pObject } : {};

            mod.dispatchEvent( new ToolBocksModuleEvent( "load", mod, { ...object } ) );

            return mod;
        }

        /**
         * This is a static factory method to construct a new instance of the ToolBocksModule.
         * <br>
         * If the module has already been constructed and loaded, it may be returned from the cache.
         * <br>
         * @param {string} pModuleName The name of the module to construct
         * @param {string} pCacheKey A key that may be used to cache the module in the global scope
         * @param {Object} pObject (optional) another module or object whose properties and functions will be added to the new instance
         * @returns {ToolBocksModule} A newly constructed Module with the specified name or the existing module if it is found in the cache
         */
        static create( pModuleName, pCacheKey, pObject )
        {
            let toolbocksModule = isStr( pModuleName ) ? MODULE_CACHE[pModuleName] : null;

            toolbocksModule = toolbocksModule || (isStr( pCacheKey ) ? MODULE_CACHE[pCacheKey] : new ToolBocksModule( pModuleName, pCacheKey ));
            toolbocksModule = toolbocksModule || new ToolBocksModule( pModuleName, pCacheKey );

            if ( isNonNullObj( pObject ) )
            {
                toolbocksModule = toolbocksModule.extend( pObject ) || toolbocksModule;
            }

            return toolbocksModule;
        }

        /**
         * Returns an object representing the current execution environment, such as Node, Deno, a Browser, or a Worker.
         *
         * @returns {*}
         */
        get executionEnvironment()
        {
            if ( null == this.#executionEnvironment )
            {
                this.#executionEnvironment = new ExecutionEnvironment( this.globalScope );
            }
            return this.#executionEnvironment;
        }

        get executionMode()
        {
            return this.executionEnvironment.mode;
        }

        attempt( pFunction, ...pArgs )
        {
            const me = this;

            const { func, result, handle } = this.initializeAttempt( pFunction, me );

            try
            {
                handleAttempt.handleError = handle;

                result.returnValue = attempt( pFunction, ...pArgs );
            }
            catch( ex )
            {
                attemptSilent( () => handle( ex, func, ...pArgs ) );
            }

            return this.calculateResult( result );
        }

        async asyncAttempt( pFunction, ...pArgs )
        {
            const me = this;

            const { func, result, handle } = this.initializeAttempt( pFunction, me );

            try
            {
                handleAttempt.handleError = handle;

                result.returnValue = await asyncAttempt( pFunction, ...pArgs );
            }
            catch( ex )
            {
                attemptSilent( () => handle( ex, func, ...pArgs ) );
            }

            return this.calculateResult( result );
        }

        attemptMethod( pThis, pMethod, ...pArgs )
        {
            const thiz = (isNonNullObj( pThis ) ? pThis : this) || this;

            const { func, result, handle } = this.initializeAttempt( pMethod, thiz );

            try
            {
                handleAttempt.handleError = handle;

                result.returnValue = attemptMethod( thiz, func, ...pArgs );
            }
            catch( ex )
            {
                attemptSilent( () => handle( ex, func, ...pArgs ) );
            }

            return this.calculateResult( result );
        }

        async asyncAttemptMethod( pObject, pMethod, ...pArgs )
        {
            const me = this;

            const { func, result, handle } = this.initializeAttempt( pMethod, me );

            try
            {
                handleAttempt.handleError = handle;

                result.returnValue = await asyncAttemptMethod( me, func, ...pArgs );
            }
            catch( ex )
            {
                attemptSilent( () => handle( ex, func, ...pArgs ) );
            }

            return this.calculateResult( result );
        }

        initializeAttempt( pMethod, pThis )
        {
            const me = this;

            const thiz = pThis || this;

            const func = resolveMethod( pMethod, thiz ) || (isFunc( pMethod ) ? pMethod : () => pMethod);

            const result = this.initializeResult( func );

            const handle = function( pError, pFunction, ...pArgs )
            {
                const error = resolveError( pError, (pFunction || func)?.name );

                result.exceptions.push( error );

                handleAttempt.lastError = handle.lastError = error;

                attemptSilent( () => me.reportError( error, error?.message, S_ERROR, me.calculateErrorSourceName( (thiz || me), (pFunction || func) ), ...pArgs ) );
            };

            return { func, result, handle };
        }

        initializeResult( pValue )
        {
            return { returnValue: pValue, exceptions: [], hasErrors: function() { return this.exceptions.length > 0;} };
        }

        calculateResult( pResult )
        {
            const result = pResult || this.initializeResult();

            return {
                returnValue: result?.exceptions?.length <= 0 ? result?.returnValue : null,
                exceptions: [...(result.exceptions || [])],
                errors: [...(result.exceptions || [])],
                hasErrors: () => result?.exceptions?.length > 0,
            };
        }
    }

    ToolBocksModule.DEBUG_MODE = DEBUG_MODE;

    /**
     * Define a cache scoped to the ToolBocksModule namespace.<br>
     * <br>
     * This property is used to store and manage cached module data.<br>
     *
     * It is intended to store modules that have already been resolved and loaded,
     * potentially improving performance by reducing redundant computations.<br>
     * <br>
     * This cache is implemented as a POJO data structure
     * that maps module identifiers to their corresponding cached instances.<br>
     */
    ToolBocksModule.MODULE_CACHE = ToolBocksModule.MODULE_CACHE || MODULE_CACHE;
    MODULE_CACHE = ToolBocksModule.MODULE_CACHE;

    ToolBocksModule.OBJECT_REGISTRY = ToolBocksModule.OBJECT_REGISTRY = $scope()["__BOCK_OBJECT_REGISTRY__"] = ($scope()["__BOCK_OBJECT_REGISTRY__"] || OBJECT_REGISTRY || new ObjectRegistry());

    /**
     * Defines a private instance of the ToolBocksModule
     * to be used in functions that are not defined as methods
     * @see _copy
     * @type {ToolBocksModule}
     */
    const GLOBAL_INSTANCE = new ToolBocksModule( "GLOBAL_INSTANCE", "__BOCK__MODULE_PROTOTYPE_GLOBAL_INSTANCE__", { logger: INTERNAL_LOGGER } );

    MODULE_CACHE["GLOBAL_INSTANCE"] = GLOBAL_INSTANCE;
    MODULE_CACHE["__BOCK__MODULE_PROTOTYPE_GLOBAL_INSTANCE__"] = GLOBAL_INSTANCE;

    /**
     * Makes the specified object available as a module that can be imported or required by other code
     * @param {Object|ToolBocksModule} pObject The object or module to export
     * @param {string} pCacheKey A key under which the exported module may be cached
     * @returns {ToolBocksModule} The exported module
     */
    function exportModule( pObject, pCacheKey )
    {
        let mod = (isNonNullObj( pObject ) || isClass( pObject ) ? pObject : {}) || {};

        const cacheKey = isStr( pCacheKey ) && _mt_str !== _asStr( pCacheKey ).trim() ? _asStr( pCacheKey ).trim() : mod?.moduleName || ObjectRegistry.DEFAULT_INSTANCE.register( mod );

        if ( isNonNullObj( mod ) && (mod instanceof ToolBocksModule) )
        {
            return mod.expose( mod, cacheKey );
        }

        let toolbocksModule = new ToolBocksModule( mod, cacheKey );

        mod = toolbocksModule.extend( mod || pObject );

        return mod.expose( mod, cacheKey );
    }

    // make the function available as a static method
    ToolBocksModule.exportModule = exportModule;

    // We replace the handleAttempt error handler (temporarily) with the ToolBocksModule method
    // The constructor of a ToolBocksModule will replace the handler with its own instance method.
    handleAttempt.handleError = ( pError, pFunction, ...pArgs ) =>
    {
        attemptSilent( () => GLOBAL_INSTANCE.handleError( pError, (pFunction?.name || nameFromSource( pFunction )), ...pArgs ) );
    };

    /**
     * Asynchronously import a module into the current scope.
     * <br>
     * Emits the load Event before returning the Promise that resolves to the required/imported module.
     * <br>
     * @param {string} pModulePath The name of, filepath to, or URL of, the required module
     * @returns {Promise<ToolBocksModule>} A Promise that resolves to the requested module
     */
    async function requireModule( pModulePath )
    {
        let mod = MODULE_CACHE[pModulePath];

        if ( null != mod && mod instanceof ToolBocksModule )
        {
            return mod;
        }

        if ( isNodeJs() )
        {
            mod = attempt( require, pModulePath );
        }

        if ( null == mod )
        {
            try
            {
                mod = await import(pModulePath);
            }
            catch( ex )
            {
                GLOBAL_INSTANCE.reportError( ex, `importing module ${pModulePath}`, S_ERROR, "Module::requireModule" );
            }
        }

        if ( isNonNullObj( mod ) && (mod instanceof Promise) )
        {
            mod = await Promise.resolve( mod );
        }

        if ( null != mod )
        {
            mod = (mod instanceof ToolBocksModule) ? mod : exportModule( mod, pModulePath );

            GLOBAL_INSTANCE.dispatchEvent( new ToolBocksModuleEvent( "load", mod, { module_path: pModulePath } ) );
        }

        return mod;
    }


    /**
     * Resolves and normalizes the options used when copying objects
     * by merging user-provided options with default values.<br>
     * <br>
     *
     * @param {Object} [pOptions=DEFAULT_COPY_OPTIONS] An object representing user-defined options for the functions that copy objects.
     *                                                 If not provided, default options are used.
     *
     * @return {Object} An object containing resolved options,
     *                  including the calculated max stack size,
     *                  and a boolean indicating if the copy should be locked/frozen.
     */
    function resolveCopyOptions( pOptions = DEFAULT_COPY_OPTIONS )
    {
        const resolvedOptions = { ...DEFAULT_COPY_OPTIONS, ...(pOptions || {}) };

        const maxDepth = resolvedOptions?.maxDepth;

        const depth = _getDepth( resolvedOptions );
        const maxStackSize = _getMaxStackSize( resolvedOptions );
        const freeze = true === resolvedOptions.freeze;

        resolvedOptions.depth = depth;
        resolvedOptions.maxStackSize = maxStackSize;

        return { resolvedOptions, maxStackSize, maxDepth, freeze };
    }

    /**
     * Creates a deep clone of the specified array
     *
     * @function
     *
     * @param {Array} array - The array to be cloned.
     *
     * @param {Object} options - Options specifying the behavior of the cloning process.
     *
     * @param {Array} stack - A stack keeping track of the cloning process context to prevent circular references.
     *
     * @returns {Array} - Returns a new array containing copies of each element.
     *
     * @private
     */
    const cloneArray = ( array, options, stack ) =>
    {
        let clone = [...(dereference( array, Array ) || array || [])];

        if ( detectCycles( stack, 5, 3 ) )
        {
            return clone;
        }

        return clone.map( ( item, index ) => _copy( item, options, [...stack, index] ) );
    };

    function cloneMap( pMap, pEntries, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        const options = { ...DEFAULT_COPY_OPTIONS, ...(pOptions || {}) };

        const map = pMap instanceof WeakMap || (WeakMap === options.expectedType) ? new WeakMap() : new Map();

        const entries = pEntries || objectEntries( pMap );

        entries.forEach( ( entry ) =>
                         {
                             const key = ObjectEntry.getKey( entry );
                             const value = ObjectEntry.getValue( entry );

                             map.set( key, _copy( value, pOptions, [...(pStack || []), key] ) );
                         } );

        return map;
    }

    function cloneSet( pSet, pEntries, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        const options = { ...DEFAULT_COPY_OPTIONS, ...(pOptions || {}) };

        const set = (pSet instanceof WeakSet || (WeakSet === options.expectedType)) ? new WeakSet() : new Set();

        const entries = pEntries || objectEntries( pSet );

        entries.forEach( ( entry ) =>
                         {
                             const key = ObjectEntry.getKey( entry );
                             const value = ObjectEntry.getValue( entry );

                             set.add( _copy( value, pOptions, [...(pStack || []), key] ) );
                         } );
        return set;
    }

    function cloneObjectLiteral( pClone, pEntries, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        let isWeakRef = isRef( pClone );

        const options = resolveCopyOptions( pOptions );

        const clone = isWeakRef ? (dereference( pClone, (options?.expectedType || _obj) ) || {}) : { ...(pClone || {}) };

        const entries = pEntries || objectEntries( clone );

        const stack = pStack || options.stack || [];

        for( const entry of entries )
        {
            const key = ObjectEntry.getKey( entry ) || _mt_str;
            const value = ObjectEntry.getValue( entry ) || null;

            if ( !isNull( key ) )
            {
                const copiedValue = _copy( value, options, [...stack, key] );
                clone[key] = (typeof copiedValue === _fun) ? copiedValue.bind( clone ) : copiedValue;
            }
        }

        return isWeakRef ? new WeakRef( clone ) : clone;
    }

    /**
     * Recursively creates a deep copy of the specified object.<br>
     * <br>
     *
     * @param {Object} pObject - The object to be cloned.
     *                          If the object contains its own `clone` method,
     *                          that method will be used for cloning.
     *
     * @param {Object} pOptions - Configuration options for cloning behavior.
     *
     * @param {Array} pStack -    An array used to track the object's cloning stack
     *                           and prevent infinite loops if the object contains self-referential data.
     *
     * @returns {Object} - A deep copy of the specified object.
     *                     Properties are copied based on the provided options,
     *                     and methods are re-bound to the cloned object if applicable.
     *
     * @private
     */
    const cloneObject = ( pObject, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] ) =>
    {
        const isWeakRef = isRef( pObject );

        const options = resolveCopyOptions( pOptions );

        let obj = isWeakRef ? (dereference( pObject, (options?.expectedType || _obj) ) || {}) : (isNull( pObject ) ? {} : pObject);

        let clone = attempt( () => (isFunc( obj?.clone )) ? obj.clone() : { ...obj } );

        let clazz = isClass( obj ) ? obj : [obj?.constructor, obj?.prototype?.constructor, obj?.prototype, Object.getPrototypeOf( obj ), Object.getPrototypeOf( obj )?.constructor].find( isClass );

        const stack = [...(pStack || [])];

        if ( detectCycles( stack, 5, 3 ) )
        {
            clone = isClass( clazz ) && isFunc( clazz.fromLiteral ) ? clazz.fromLiteral( clone ) : clone;
            return isWeakRef ? new WeakRef( clone ) : clone;
        }

        if ( isDate( obj ) )
        {
            const date = new Date( obj.getTime() );
            return isWeakRef ? new WeakRef( date ) : date;
        }

        if ( isRegExp( obj ) )
        {
            const rx = new RegExp( obj.source, obj.flags );
            return isWeakRef ? new WeakRef( rx ) : rx;
        }

        if ( isPrimitive( obj ) )
        {
            return obj;
        }

        if ( isPrimitiveWrapper( obj ) )
        {
            return obj.valueOf();
        }

        const entries = objectEntries( obj );

        if ( isMap( clone ) || clone instanceof WeakMap )
        {
            clone = cloneMap( clone, entries, { ...(options || {}), ...({ expectedType: isWeak( clone ) ? WeakMap : Map }) }, stack );
        }
        else if ( isSet( clone ) || clone instanceof WeakSet )
        {
            clone = cloneSet( clone, entries, { ...(options || {}), ...({ expectedType: isWeak( clone ) ? WeakSet : Set }) }, stack );
        }
        else if ( isError( clone ) )
        {
            clone = new __Error( clone, { stack: clone.stack }, ...(clone.args || []) );
            clone.stack = obj.stack || clone.stack;
            clone = resolveError( clone, clone.message, ...(clone.args || []) );
        }
        else
        {
            clone = cloneObjectLiteral( clone, entries, { ...(options || {}), ...({ expectedType: isArray( clone ) ? Array : Object }) }, stack );
        }

        if ( !!!pOptions?.includeClassNames )
        {
            delete clone["class"];
        }

        if ( isClass( clazz ) && isFunc( clazz.fromLiteral ) )
        {
            clone = clazz.fromLiteral( clone );
        }

        return isWeakRef ? new WeakRef( clone ) : clone;
    };

    /**
     * Handles the replacement of undefined values during a copy operation.
     *
     * @param {Object} pObject - The object being processed. This parameter is currently unused in the function implementation.
     * @param {Object} pOptions - An options object that may contain an `undefinedReplacement` property. If `undefinedReplacement` is not provided, the default value is `null`.
     * @param {Function} pFreezeFunction - A function that will be applied to the replacement value for undefined.
     * @return {any} The result of applying `pFreezeFunction` to the `undefinedReplacement` value or `null` if no replacement was specified.
     */
    function handleCopyUndefined( pObject, pOptions, pFreezeFunction )
    {
        let undefinedReplacement = pOptions.undefinedReplacement ?? null;

        if ( isNonNullObj( undefinedReplacement ) )
        {
            undefinedReplacement = Object.assign( {}, undefinedReplacement );
        }

        return pFreezeFunction( undefinedReplacement );
    }

    /**
     * Handles the replacement of a null value within an object during a copy operation.
     *
     * @param {Object} pObject - The object being processed. This parameter is currently unused in this function.
     * @param {Object} pOptions - An object containing options for the operation. Specifically, it may include a `nullReplacement` property defining the value to replace null values with.
     * @param {Function} pFreezeFunction - A function that will process and freeze the null replacement value.
     * @return {*} Returns the result of the pFreezeFunction applied to the replacement value for null.
     */
    function handleCopyNull( pObject, pOptions, pFreezeFunction )
    {
        let nullReplacement = pOptions.nullReplacement ?? EMPTY_OBJECT;

        if ( isNonNullObj( nullReplacement ) )
        {
            nullReplacement = Object.assign( {}, nullReplacement );
        }

        return pFreezeFunction( nullReplacement );
    }

    /**
     * Handles the operation of copying a string.
     *
     * @param {string} pString - The string to be copied.
     * @return {string} A copy of the string
     */
    function handleCopyString( pString )
    {
        return String( _mt_str + _asStr( pString ) );
    }

    function handleCopyNumber( pNumber )
    {
        return (_big === typeof pNumber) ? BigInt( pNumber ) : parseFloat( pNumber );
    }

    function handleCopyBoolean( pBoolean )
    {
        return pBoolean === true;
    }

    function handleCopyFunction( pFunction )
    {
        return (isFunc( pFunction )) ? pFunction : () => pFunction;
    }

    function handleCopySymbol( pSymbol )
    {
        return pSymbol;
    }

    function handleCopyObject( pObject, pOptions = DEFAULT_COPY_OPTIONS, pFreezeFunction, pStack )
    {
        const options = resolveCopyOptions( pOptions );

        if ( _ud === typeof pObject )
        {
            return handleCopyUndefined( pObject, options, pFreezeFunction );
        }

        if ( null === pObject )
        {
            return handleCopyNull( pObject, options, pFreezeFunction );
        }

        const isWeakRef = isRef( pObject );

        let clone = isWeakRef ? dereference( pObject, (options?.expectedType || _obj) ) : pObject;

        let clazz = isClass( clone ) ? clone : [clone?.constructor, clone?.prototype?.constructor, clone?.prototype, Object.getPrototypeOf( clone ), Object.getPrototypeOf( clone )?.constructor].find( isClass );

        if ( clone instanceof Date )
        {
            clone = new Date( clone.getTime() );
        }
        else if ( clone instanceof RegExp )
        {
            clone = new RegExp( clone, clone.flags || _mt_str );
        }
        else if ( isArray( clone ) || isArray( pObject ) )
        {
            clone = cloneArray( (clone || pObject), { ...(options || {}), ...({ expectedType: Array }) }, pStack );
        }
        else
        {
            clone = attempt( () => cloneObject( clone, options, pStack ) ) || clone;
        }

        if ( !!!pOptions?.includeClassNames )
        {
            attempt( () => delete clone["class"] );
        }

        if ( isClass( clazz ) && isFunc( clazz.fromLiteral ) )
        {
            clone = clazz.fromLiteral( clone );
        }

        clone = isWeakRef ? new WeakRef( clone ) : clone;

        return isFunc( pFreezeFunction ) ? attempt( () => pFreezeFunction( clone ) || clone ) : clone;
    }

    const CopyHandlers = new Map();

    CopyHandlers.set( _ud, handleCopyUndefined );
    CopyHandlers.set( _str, handleCopyString );
    CopyHandlers.set( _num, handleCopyNumber );
    CopyHandlers.set( _big, handleCopyNumber );
    CopyHandlers.set( _bool, handleCopyBoolean );
    CopyHandlers.set( _fun, handleCopyFunction );
    CopyHandlers.set( _symbol, handleCopySymbol );
    CopyHandlers.set( _obj, handleCopyObject );
    CopyHandlers.set( _asterisk, ( pObject ) => pObject );

    /**
     * Returns a deep copy of the value specified.
     * <br>
     * Used by localCopy and immutableCopy functions.
     * <br>
     * This function is not exported.
     *
     * @param {*} pObject The value to copy
     *
     * @param {CopyOptions} pOptions  An object specifying how to handle undefined and null values
     * as well as whether and how deep to copy an object or array value
     *
     * @param {Array.<*>} pStack  USED INTERNALLY TO PREVENT INFINITE RECURSION, DO NOT SPECIFY A VALUE FROM CLIENT CODE
     *
     * @returns {*} A copy of the value specified
     *
     * @private
     */
    const _copy = function( pObject, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        const { resolvedOptions, freeze } = resolveCopyOptions( pOptions );

        const maybeFreeze = ( item ) => (freeze ? lock( item ) : item);

        const stack = [...(pStack || [])];

        const obj = dereference( pObject, resolvedOptions?.expectedType || _obj ) || pObject;

        if ( detectCycles( stack, 5, 3 ) )
        {
            return maybeFreeze( obj );
        }

        const handler = CopyHandlers.get( typeof obj ) || CopyHandlers.get( _asterisk );

        return attempt( () => handler( (pObject || obj), resolvedOptions, maybeFreeze, stack ) );
    };

    _copy.CopyHandlers = CopyHandlers;

    /**
     * Returns a local (mutable) copy of the value specified.
     *
     * @param {*} pObject The value to copy
     *
     * @param {CopyOptions} pOptions An object specifying how to handle undefined and null values
     * as well as whether and how deep to copy an object or array value
     *
     * @param {Array.<*>} pStack USED INTERNALLY TO PREVENT INFINITE RECURSION, DO NOT SPECIFY A VALUE FROM CLIENT CODE
     *
     * @returns {*} A copy of the value specified
     */
    const localCopy = function( pObject, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        return _copy( pObject, pOptions, pStack );
    };

    /**
     * Returns an immutable copy of the value specified.
     *
     * @param {*} pObject The value to copy
     * @param {CopyOptions} pOptions An object specifying how to handle undefined and null values
     * as well as whether and how deep to copy an object or array value
     * @param {Array.<*>} pStack USED INTERNALLY TO PREVENT INFINITE RECURSION, DO NOT SPECIFY A VALUE FROM CLIENT CODE
     * @returns {*} an immutable copy of the value specified
     */
    const immutableCopy = function( pObject, pOptions = IMMUTABLE_COPY_OPTIONS, pStack = [] )
    {
        const options = { ...IMMUTABLE_COPY_OPTIONS, ...(pOptions || {}), ...({ freeze: true }) };

        options.freeze = true;

        return _copy( pObject, options, (pStack || []) );
    };

    /**
     * Defines a constant for an invalid entry
     * @type {Readonly<ObjectEntry>}
     */
    ObjectEntry.INVALID_ENTRY = lock( new ObjectEntry() );

    const isTerminal = ( obj, lastObj ) => (obj === lastObj) ||
                                           obj === Object ||
                                           obj?.constructor === Object ||
                                           obj.constructor === Array ||
                                           obj === Array;

    function propertyDescriptors( pObject, pSearchPrototypeChain = true )
    {
        let obj = isRef( pObject ) ? pObject.deref() ?? pObject : pObject;

        let lastObj = null;

        let descriptors = {};

        let objectProperties = {};

        const iterationCap = new IterationCap( 16 );

        while ( isNonNullObj( obj ) && !iterationCap.reached )
        {
            lastObj = obj;

            objectProperties = Object.getOwnPropertyDescriptors( obj || {} );

            descriptors = mergeObjects( descriptors, objectProperties );

            obj = pSearchPrototypeChain ? Object.getPrototypeOf( obj ) || obj?.constructor?.prototype : null;

            obj = (isNull( obj ) || (obj === lastObj || isTerminal( obj, lastObj ))) ? null : obj;

            if ( isNull( obj ) )
            {
                break;
            }
        }

        return descriptors;
    }

    function propertyNames( pObject, pSearchPrototypeChain = true )
    {
        let names = [];

        let obj = isRef( pObject ) ? pObject.deref() || pObject : pObject;

        let lastObj = null;

        const iterationCap = new IterationCap( 32 );

        while ( isNonNullObj( obj ) && !iterationCap.reached )
        {
            names.push( ...(Object.getOwnPropertyNames( obj || {} ) || []) );

            lastObj = obj;

            obj = pSearchPrototypeChain ? Object.getPrototypeOf( obj ) || obj?.constructor?.prototype : null;

            obj = (obj === lastObj || isTerminal( obj, lastObj )) ? null : obj;
        }

        return [...(new Set( names ))];
    }

    const objectMethods = ( pObject, pSearchPrototypeChain = true ) =>
    {
        const descriptors = propertyDescriptors( pObject, pSearchPrototypeChain );

        const methods = Object.getOwnPropertyNames( descriptors ).filter( e => isFunc( descriptors[e]?.value ) );

        return [...(new Set( methods ))];
    };

    function toNodePathArray( pPropertyPath )
    {
        const removeOptionalSyntax = e => isStr( e ) ? String( e ).trim().replaceAll( /\?+/g, _mt_str ) : isArray( e ) ? e.map( removeOptionalSyntax ) : e;

        const toDotNotation = e => isStr( e ) ? bracketsToDots( e, { numericIndexOnly: false } ).trim().split( _dot ) : isArray( e ) ? e.map( toDotNotation ) : e;

        const removeHashSign = e => isStr( e ) ? String( e ).trim().replace( /^#/, _mt_str ) : isArray( e ) ? e.map( removeHashSign ) : e;

        const isValidArgument = e => isStr( e ) && e.trim().length > 0;
        const isValidPathElement = e => isValidArgument( e ) && !(/[.\s#]/).test( e );

        let propertyPath = attempt( () => arguments.length > 1 ? [...arguments].map( removeHashSign ).map( removeOptionalSyntax ).filter( isValidArgument ) : pPropertyPath ) || pPropertyPath;

        let arr = isArray( propertyPath ) ? propertyPath.map( removeHashSign ).map( removeOptionalSyntax ).map( toDotNotation ).flat() : propertyPath;

        arr = (isStr( arr ) ? bracketsToDots( arr, { numericIndexOnly: false } ).split( _dot ) : (isArray( arr ) ? arr.map( toDotNotation ).flat() : [String( arr )]).filter( isValidArgument )).flat();

        arr = arr.map( toDotNotation ).flat().map( removeOptionalSyntax ).flat();

        arr = arr.map( removeHashSign ).flat().filter( isValidArgument ).map( e => e.trim().replaceAll( /^\.+|\.+$/g, _mt_str ) ).filter( isValidArgument );

        return arr.filter( isValidPathElement );
    }

    const _toCamel = e => e.includes( _dot ) ? e.split( _dot ).map( _toCamel ).join( _dot ) : e.includes( _underscore ) ? e.replace( /^_+/, _mt ).split( /_/ ).map( ( s, i ) => (0 === i ? _lcase( s.slice( 0, 1 ) ) : _ucase( s.slice( 0, 1 ) )) + s.slice( 1 ) ).join( _mt ) : _lcase( e.slice( 0, 1 ) ) + e.slice( 1 );
    const _toPascal = e => e.includes( _dot ) ? e.split( _dot ).map( _toPascal ).join( _dot ) : e.includes( _underscore ) ? e.split( /_/ ).map( s => _ucase( s.slice( 0, 1 ) ) + s.slice( 1 ) ).join( _mt ) : _ucase( e.slice( 0, 1 ) ) + e.slice( 1 );
    const _toSnake = e => e.includes( _dot ) ? e.split( _dot ).map( _toSnake ).join( _dot ) : e.replaceAll( /([A-Z])/g, ( match ) => ("_" + _lcase( match )) ).replace( /^_/, _mt ).replaceAll( /_+/g, _underscore );
    const _toSnakeStrict = e => _lcase( _toSnake( e ) );

    /**
     * This function ensures that property paths do not start or end with a dot or contain spaces.
     * @param e the path component
     * @returns {string} a valid property key or key.path
     * @private
     */
    const _cleanPath = (( e ) => _trim( String( e ) ).replace( /^\./, _mt ).replace( /\.$/, _mt ));

    const _preparePaths = ( ...pPropertyPaths ) => [...(pPropertyPaths || [])].filter( _isValidStr ).map( _cleanPath );

    /**
     * Converts any value into something that is compatible with the _property function.
     *
     * @param pObject
     * @param pPropertyPaths
     * @returns {*}
     */
    const _prepareContainer = ( pObject, ...pPropertyPaths ) => (isNonNullObj( pObject ) || isArray( pObject )) ? pObject : isFunc( pObject ) ? () => attempt( () => pObject( ...pPropertyPaths ) ) : [...(pPropertyPaths || [])].reduce( ( acc, path ) => ({ ...acc, ...path.split( "." ).reduceRight( ( val, key ) => ({ [key]: val }), pObject ) }), {} );


    const makeMutator = ( pObj, pName = _mt ) =>
    {
        if ( isNull( pObj ) || !(isObj( pObj ) || isArray( pObj )) )
        {
            return ( pKey = pName, pValue ) => new ObjectEntry( pKey, pValue, pObj );
        }

        if ( isArray( pObj ) )
        {
            return ( pKey = pName, pValue ) =>
            {
                if ( isNumeric( pKey ) )
                {
                    let idx = _asInt( pKey );
                    if ( idx < $ln( pObj ) )
                    {
                        return _asArr( pObj ).splice( idx, 0, pValue );
                    }
                    return [...(_asArr( pObj )), pValue];
                }
            };
        }

        if ( isMap( pObj ) || (isFunc( pObj?.set ) && (2 === $ln( pObj?.set ))) )
        {
            return ( pKey = pName, pValue ) => pObj.set( pKey, pValue );
        }

        if ( isFunc( pObj?.add ) )
        {
            return ( pKey = pName, pValue ) => pObj.add( pValue );
        }

        return ( pKey = pName, pValue ) => attempt( () => pObj[pKey] = pValue );
    };

    /**
     * This function returns a function that knows how to address an object holding the value(s) we seek.
     * That is, if it is a Map or Headers or other container exposing a 'get' method to retrieve values,
     * the returned function closes over the Map (or map-like object) and uses the key in the call to its 'get'.
     * If the object is just a POJO, the returned version closes over this object literal and uses bracket syntax to access its properties.
     *
     * @param pObj The object, Map, or map-like object from which to retrieve values
     * @param pName
     * @returns {(function(*): *)|(function(*): *)} the function to call with the key
     */
    const makeAccessor = ( pObj, pName = _mt ) =>
    {
        if ( isMap( pObj ) || (isFunc( pObj?.get ) && (1 === $ln( pObj?.get ))) )
        {
            return ( pKey = pName ) => pObj.get( pKey );
        }

        return ( pKey = pName ) => pObj[pKey];
    };

    const makeDeleter = ( pObj, pName = _mt ) =>
    {
        if ( isMap( pObj ) || (isFunc( pObj?.delete ) && (1 === $ln( pObj?.delete ))) )
        {
            return ( pKey = pName ) => attempt( () => pObj.delete( pKey ) );
        }
        else if ( (isFunc( pObj?.remove ) && (1 === $ln( pObj?.remove ))) )
        {
            return ( pKey = pName ) => attempt( () => pObj.remove( pKey ) );
        }

        return ( pKey = pName ) => attempt( () => delete pObj[pKey] );
    };

    const makeAppender = ( pObj, pName ) =>
    {
        if ( isMap( pObj ) || (isFunc( pObj?.append ) && (2 === $ln( pObj?.append ))) )
        {
            return ( pKey = pName, pValue ) => attempt( () => pObj.append( pKey, pValue ) );
        }
        else if ( isFunc( pObj?.add ) )
        {
            return ( pKey = pName, pValue ) => attempt( () => pObj.add( pValue ) );
        }

        const accessor = makeAccessor( pObj, pName );

        return ( pKey = pName, pValue ) => attempt( () =>
                                                    {
                                                        let existing = accessor( pKey );

                                                        let value = pValue ?? existing;

                                                        if ( isArray( existing ) )
                                                        {
                                                            value = [...(new Set( [...existing, ...(isArray( pValue ) ? pValue : [pValue])] ))];
                                                        }
                                                        else if ( isNonNullObj( existing ) )
                                                        {
                                                            if ( (isFunction( existing?.equals ) && !existing.equals( pValue )) || !OBJECT_REGISTRY.areEqual( existing, pValue ) )
                                                            {
                                                                value = { ...existing, ...(isNonNullObj( pValue ) ? pValue : { [name]: pValue }) };
                                                            }
                                                            else
                                                            {
                                                                value = existing;
                                                            }
                                                        }
                                                        else if ( isNumeric( existing ) || isNumeric( pValue ) || isBool( existing ) || isBool( pValue ) )
                                                        {
                                                            value = pValue ?? existing;
                                                        }
                                                        else if ( _isValidStr( existing ) )
                                                        {
                                                            let exStr = _asStr( existing || _mt ).replace( /undefined|null|void/, _mt );
                                                            let newStr = _asStr( pValue || mt ).replace( /undefined|null|void/, _mt );

                                                            value = (_ucase( exStr.trim() ) === _ucase( newStr.trim() )) ? exStr : (exStr + ", " + newStr);
                                                        }

                                                        return ((isFunc( pObj?.set ) && (2 === $ln( pObj?.set )))) ? attempt( () => pObj.set( pKey, value ) ) : attempt( () => pObj[pKey] = value );
                                                    } );
    };


    function _property( pObject, pPropertyPath, pValue )
    {
        if ( isNull( pObject ) || !isObj( pObject ) || (_ud === typeof pPropertyPath) || (_mt_str === String( pPropertyPath )) )
        {
            return pObject;
        }

        let keys = toNodePathArray( pPropertyPath );

        if ( DEBUG_MODE )
        {
            INTERNAL_LOGGER.debug( `_property called with keys: ${keys.join( _dot )}` );
        }

        let mutator = ( !isNull( pValue ) || arguments.length > 2) ? ( object, key, value ) =>
        {
            if ( isMap( object ) || (isFunc( object?.set ) && (2 === $ln( object?.set ))) )
            {
                attempt( () => object.set( key, ((keys.length > 0) ? (isMap( object ) ? object.get( key ) ?? new Map() : object[key] ?? {}) : value || pValue) ) );
                return isFunction( object.get ) ? object.get( key ) : object[key];
            }
            else
            {
                attempt( () => object[key] = ((keys.length > 0) ? (isArray( pObject ) || (/^d+$/.test( String( key ) )) ? [] : {}) : (value || pValue)) );
            }

            return _property( object, key );

        } : null;

        let value = isRef( pObject ) ? dereference( pObject ) : pObject;

        // create a temporary copy of the current node/value, so we can try different variations of the key
        let root = isArray( value ) ? [...(_asArr( value ))] : value;

        while ( keys.length > 0 && isNonNullObj( value ) )
        {
            const key = String( keys.shift() ).trim().replace( /^#/, _mt_str );

            INTERNAL_LOGGER.debug( `Trying key: ${key}, of ${$ln( keys )} remaining` );

            if ( isFunc( mutator ) )
            {
                value = mutator( value, key, pValue );
            }
            else
            {
                // create a temporary copy of the current node/value, so we can try different variations of the key
                let node = isArray( value ) ? [...(_asArr( value ))] : value;

                // try array index or key 'as-is'; this is the 'expected' property key
                let accessor = makeAccessor( node );
                value = (isArray( node ) && /^\d+$/.test( key )) ? node[_asInt( key )] : accessor( key );

                // if the value is null, undefined, or an empty string, try PascalCase, camelCase, and snake_case variations
                value = value || accessor( _toPascal( key ) ) || accessor( _toCamel( key ) ) || accessor( _toSnake( key ), node ) || accessor( _toSnakeStrict( key ), node ) || accessor( _ucase( key ) ) || accessor( _lcase( key ) );

                // if the value is still null, undefined, or an empty string, try finding the property on the 'root'
                accessor = makeAccessor( root );
                value = value || accessor( key ) || accessor( _toPascal( key ) ) || accessor( _toCamel( key ) ) || accessor( _toSnake( key ) ) || accessor( _toSnakeStrict( key ) ) || accessor( _ucase( key ) ) || accessor( _lcase( key ) );
            }
        }

        if ( $ln( keys ) > 0 )
        {
            INTERNAL_LOGGER.warn( `There are ${$ln( keys )} remaining` );
        }

        return value;
    }

    /**
     * Returns the value of a property from an object, specified by a property <i>path</i>.<br>
     * A property path is either a string
     * of the form <i>keyToObject1.keyToObject2.keyToObjectN.key</i> or an array of such keys.<br>
     * <br>
     * The function will follow the keys from the object specified until all keys have been used
     * or an intermediary object is null or not an object<br>
     * <br>
     * If all the keys in the path have been followed,
     * the value found at that node are returned.<br>
     * The returned value does not necessarily have to be a scalar value or even non-null.<br>
     * <br>
     * If the root object specified is null or not an object,
     * the function will return the specified value or the value specified for the property path.<br>
     * <br>
     *
     * @param {Object} pObject - The root object from which to retrieve the property value.
     * @param {string|Array.<string>} pPropertyPath - The property path (as a string or an array of strings)<br>
     *                                                specifying the property to retrieve.<br>
     *
     * @return {*} The value of the specified property if resolved, otherwise null.
     */
    function getProperty( pObject, pPropertyPath )
    {
        if ( isNull( pObject ) || !isObj( pObject ) || isNull( pPropertyPath ) || (isStr( pPropertyPath ) && !_isValidStr( pPropertyPath )) )
        {
            INTERNAL_LOGGER.warn( `getProperty called on ${isNull( pObject ) ? "a null value, returning null" : !isObj( pObject ) ? "a scalar value, returning that value" : "without a valid property name or path, returning the target"}` );

            return pObject;
        }
        return attempt( () => _property( pObject, pPropertyPath ) );
    }

    /**
     * Sets a property on the specified object using the property path and value.<br>
     * If the property path does not exist, it will create the necessary structure.<br>
     *
     * @param {Object} pObject The target object on which the property (or properties) is/are to be set or created.
     *
     * @param {string|Array.<string>} pPropertyPath The property path (as a string or an array of strings)<br>
     *                                              specifying the property or properties to create and set to the specified value.
     *
     * @param {*} pValue The value to set at the specified property path.
     *
     * @return {Object} The updated object with the property set.
     */
    function setProperty( pObject, pPropertyPath, pValue )
    {
        if ( isNull( pObject ) || !isObj( pObject ) || isReadOnly( pObject ) )
        {
            const target = isNull( pObject ) ? "null" : !isObj( pObject ) ? "a scalar value" : "a read-only object";
            throw new IllegalArgumentError( `Cannot modify the properties of ${target}` );
        }
        return attempt( () => _property( pObject, pPropertyPath, pValue ) );
    }

    /**
     * Returns the value of a property by trying each of the specified paths.
     * This can be useful when reading properties from an object that may take one of several shapes.
     * @param pObject the object from which to read the property value
     * @param pPropertyPaths one or more possible paths to the value
     * @returns {*|null} the value value of the property if found, otherwise null
     */
    function readProperty( pObject, ...pPropertyPaths )
    {
        const paths = _preparePaths( ...pPropertyPaths );

        const obj = _prepareContainer( pObject, ...paths );

        let value = null;

        while ( (null === value || (isStr( value ) && !_isValidStr( value ))) && $ln( paths ) > 0 )
        {
            let path = paths.shift();

            // try the path as-is, as camelCase, as PascalCase, as snake_Case, and as snake_case
            value = getProperty( obj, path ) ||
                    getProperty( obj, _toCamel( path ) ) ||
                    getProperty( obj, _toPascal( path ) ) ||
                    getProperty( obj, _toSnake( path ) ) ||
                    getProperty( obj, _toSnakeStrict( path ) ) ||
                    getProperty( obj, _lcase( path ) ) ||
                    getProperty( obj, _ucase( path ) );
        }

        return value;
    }

    function readScalarProperty( pObject, pType = _str, ...pPropertyPaths )
    {
        const paths = [...(pPropertyPaths || [])].filter( _isValidStr ).map( _cleanPath );

        const obj = _prepareContainer( pObject, ...paths );

        const type = ["*", ...(_validTypes)].includes( _lct( pType ) ) ? _lct( pType ) : _str;

        const isValidValue = ( v ) => (null !== v) && (_ud !== typeof v) && ((type === typeof v) || ([_str, _num, _bool].includes( typeof v ) && "*" === type));

        let value = null;

        while ( (null === value || !isValidValue( value )) && $ln( paths ) > 0 )
        {
            let path = paths.shift();

            // try the path as-is, as camelCase, as PascalCase, as snake_Case, and as snake_case
            value = getProperty( obj, path );

            value = isValidValue( value ) ? value : getProperty( obj, _toCamel( path ) );
            value = isValidValue( value ) ? value : getProperty( obj, _toPascal( path ) );
            value = isValidValue( value ) ? value : getProperty( obj, _toSnake( path ) );
            value = isValidValue( value ) ? value : getProperty( obj, _toSnakeStrict( path ) );
            value = isValidValue( value ) ? value : getProperty( obj, _ucase( path ) );
            value = isValidValue( value ) ? value : getProperty( obj, _lcase( path ) );

            if ( isValidValue( value ) )
            {
                break;
            }
        }

        return isValidValue( value ) ? value : null;
    }

    function removeProperties( pObject, ...pPropertyPaths )
    {
        if ( isNull( pObject ) || !isObj( pObject ) || isNull( pPropertyPaths ) || $ln( _asArr( pPropertyPaths ) ) <= 0 || !(_asArr( pPropertyPaths ).some( _isValidStr )) )
        {
            INTERNAL_LOGGER.warn( `removeProperties called on ${isNull( pObject ) ? "a null value, nothing changed" : !isObj( pObject ) ? "a scalar value, nothing changed" : "without a valid property name or path, nothing changed"}` );

            return pObject;
        }

        let paths = _asArr( pPropertyPaths );

        for( let path of paths )
        {
            const keys = toNodePathArray( path );

            let node = pObject;

            while ( !isNull( node ) && $ln( keys ) > 0 )
            {
                const accessor = makeAccessor( node );

                const key = keys.shift();

                node = accessor( key ) ?? accessor( _toCamel( key ) ) ?? accessor( _toPascal( key ) ) ?? accessor( _toSnake( key ) ) ?? accessor( _toSnakeStrict( key ) ) ?? accessor( _lcase( key ) ) ?? accessor( _case( key ) );

                if ( isNonNullObj( node ) && 1 === $ln( keys ) )
                {
                    const remover = makeDeleter( node );
                    attempt( () => remover( keys.shift() ) );
                }
            }
        }
    }

    function mergeOptions( pOptions, ...pDefaults )
    {
        const defaults = [...(pDefaults || [{}])].filter( isNonNullObj );

        return {
            ...defaults.reduce( ( p, c ) => ({ ...p, ...c }), {} ),
            ...(pOptions || {}),
        };
    }

    const mergeObjects = mergeOptions;

    /**
     * Returns a read-only copy of an object,
     * whose properties are also read-only copies of properties of the specified object
     * @param {Object} pObject The object to freeze
     * @param {Array.<*>} pStack USED INTERNALLY TO PREVENT INFINITE RECURSION,
     *                           DO NOT SPECIFY A VALUE FROM CLIENT CODE
     *
     * @returns {Object} A new object that is a frozen copy of the specified object
     * whose properties are also frozen copies of the specified object's properties
     */
    const deepFreeze = function( pObject, pStack = [] )
    {
        return immutableCopy( pObject, IMMUTABLE_COPY_OPTIONS, pStack );
    };

    const resolveType = ( pValue, pType ) =>
    {
        let type = pType || typeof pValue;
        type = (_validTypes.includes( type ) || isFunc( type )) ? type : typeof pValue;
        return isStr( type ) && type === typeof pValue ? type : (isFunc( type ) && pValue instanceof type ? type : typeof pValue);
    };

    /**
     * This is the maximum allowed value for instances of the IterationCap class
     * @type {number}
     * @const
     */
    const MAX_ITERATIONS = 10_000;

    /**
     * This class allows us to easily cap an iteration,<br>
     * such as a 'for' loop or a 'while' loop.
     * <br><br>
     * If there is any chance that an iteration might never complete,<br>
     * use an instance of IterationCap to limit the iteration to a finite number of executions<br>
     * <br>
     * @example
     * const iterationCap = new IterationCap( 10 );
     *
     * while ( someConditionIsTrue() && !iterationCap.reached )
     * {
     *        possiblyChangeCondition();
     * }
     *
     * In this example, the condition might never become false, however...
     *
     * The loop will exit after 10 attempts to change the condition.
     */
    class IterationCap
    {
        #maxIterations = MAX_ITERATIONS;
        #iterations = 0;

        /**
         * Constructs an instance of IterationCap.
         * @constructor
         * @param {number|string} pMaxIterations The maximum number of iterations to allow
         */
        constructor( pMaxIterations )
        {
            this.#maxIterations = clamp( parseInt( pMaxIterations ), 1, MAX_ITERATIONS );

            this.#iterations = 0;
        }

        /**
         * Returns a constructor for this class.
         * @returns {IterationCap}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * The number of iteration performed thus far
         * @type {number}
         */
        get iterations()
        {
            return this.#iterations;
        }

        /**
         * @type {boolean}
         *
         * @returns {boolean} true when the number of iterations has reached the specified limit
         */
        get reached()
        {
            return (this.#iterations++ >= this.#maxIterations);
        }

        /**
         * Sets iterations back to 0, allowing this instance to be reused
         */
        reset()
        {
            this.#iterations = 0;
        }
    }

    IterationCap.MAX_CAP = MAX_ITERATIONS;

    const COMPARE_LESS_THAN = -1;
    const COMPARE_EQUAL = 0;
    const COMPARE_GREATER_THAN = 1;

    const resolveComparator = ( pComparator ) => isFunc( pComparator?.compare ) ? pComparator : (isFunc( pComparator ) && $ln( pComparator ) >= 2) ? { compare: pComparator } : { compare: ( a, b ) => (isNum( a ) && isNum( b )) ? (a - b) : ((a > b) ? 1 : ((a < b) ? 1 : 0)) };

    const compare = ( pFirst, pSecond, pNullsFirst = true ) =>
    {
        let comp = COMPARE_EQUAL;

        if ( isFunc( pFirst?.lessThan ) )
        {
            comp = pFirst.lessThan( pSecond, pNullsFirst ) ? COMPARE_LESS_THAN : COMPARE_EQUAL;
        }

        if ( COMPARE_EQUAL === comp && (isFunc( pSecond?.lessThan )) )
        {
            comp = pSecond.lessThan( pFirst, pNullsFirst ) ? COMPARE_GREATER_THAN : COMPARE_EQUAL;
        }

        if ( COMPARE_EQUAL === comp )
        {
            return pFirst < pSecond ? COMPARE_LESS_THAN : (pFirst > pSecond ? COMPARE_GREATER_THAN : COMPARE_EQUAL);
        }

        return comp;
    };

    const compareTo = ( pFirst, pSecond, pNullsFirst = true ) =>
    {
        let comp = COMPARE_EQUAL;

        if ( isFunc( pFirst?.compareTo ) )
        {
            comp = pFirst.compareTo( pSecond, pNullsFirst );
        }

        if ( COMPARE_EQUAL === comp && isFunc( pSecond?.compareTo ) )
        {
            comp = pSecond.compareTo( pFirst, pNullsFirst );
            if ( COMPARE_EQUAL !== comp )
            {
                return -comp;
            }
        }

        return compare( pFirst, pSecond, pNullsFirst ) || COMPARE_EQUAL;
    };

    const compareNullable = ( pFirst, pSecond, pNullsFirst = true, pComparator = { compare: compareTo } ) =>
    {
        if ( isNull( pFirst ) )
        {
            return isNull( pSecond ) ? COMPARE_EQUAL : (pNullsFirst ? COMPARE_LESS_THAN : COMPARE_GREATER_THAN);
        }
        else if ( isNull( pSecond ) )
        {
            return (pNullsFirst ? COMPARE_GREATER_THAN : COMPARE_LESS_THAN);
        }

        const comparator = resolveComparator( pComparator );

        if ( isFunc( comparator?.compare ) )
        {
            return attempt( () => comparator.compare( pFirst, pSecond, pNullsFirst ) );
        }
        else if ( isFunc( comparator ) )
        {
            return attempt( () => comparator.call( this, pFirst, pSecond, pNullsFirst ) );
        }

        return COMPARE_EQUAL;
    };

    /**
     * Returns true if EXACTLY one condition is true.
     * Evaluates ALL conditions, does not shortcut.
     *
     * @param {...*} pConditions One or more expressions that evaluate to a boolean, true or false
     *
     * @returns {boolean} true if EXACTLY one condition is true.
     */
    const Xor = ( ...pConditions ) =>
    {
        let conditions = [...(pConditions || [])];
        conditions = conditions.filter( c => !!c );
        return 1 === conditions.length;
    };

    const Nand = ( ...pConditions ) =>
    {
        let conditions = [...(pConditions || [])];
        conditions = conditions.filter( c => !!c );
        return conditions.length < [...(pConditions || [])].length;
    };

    /**
     * Base class to be used for all objects in a domain, if desired.
     */
    class ToolBocksObject
    {
        #zTarget;
        #zArgs;

        constructor( ...pArgs )
        {
            this.#zTarget = new EventTarget();

            let args = [...(pArgs || [])];

            this.#zArgs = (args && args.length) ? [...args] : [];
        }

        dispatchEvent( pEvent )
        {
            return this.#zTarget.dispatchEvent( resolveEvent( pEvent, pEvent?.data || pEvent?.detail || pEvent, { source: this } ) );
        }

        addEventListener( pType, pHandler, pOptions )
        {
            this.#zTarget.addEventListener( pType, pHandler, pOptions );
        }

        removeEventListener( pType, pHandler, pOptions )
        {
            this.#zTarget.removeEventListener( pType, pHandler, pOptions );
        }

        get instanceId()
        {
            return OBJECT_REGISTRY.getGuid( this );
        }

        get instanceCreated()
        {
            return OBJECT_REGISTRY.getCreated( this );
        }

        clone()
        {
            return localCopy( this );
        }

        equals( pOther )
        {
            return OBJECT_REGISTRY.identical( this, pOther ) || OBJECT_REGISTRY.similar( this, pOther );
        }

        compareTo( pOther )
        {
            if ( isNull( pOther ) || !isObj( pOther ) )
            {
                return -1;
            }

            if ( this.equals( pOther ) )
            {
                return 0;
            }

            let comp = 0;

            let props = ["name", "lastModified", "lastModifiedDate", "createdDate", "id"];

            while ( 0 === comp && $ln( props ) > 0 )
            {
                let prop = props.shift();

                if ( hasProperty( this, prop ) && hasProperty( pOther, prop ) )
                {
                    let a = attempt( () => getProperty( this, prop ) );
                    let b = attempt( () => getProperty( pOther, prop ) );

                    comp = (_num === typeof a && _num === typeof b) ? (a - b) : (a < b ? -1 : a > b ? 1 : 0);
                }
            }

            return comp;
        }

        serialize()
        {
            const me = this;

            let s = String( attempt( () => serialize( me ) || serialize( me.clone() ) ) ) || String( attempt( () => serialize( me.clone() ) ) );

            if ( _mt === String( s ).trim() )
            {
                s = `![ENTRIES=[` + objectEntries( this ).map( e => [ObjectEntry.getKey( e ), ToolBocksObject.serialize( Object.getValue( e ) )] ).join( ", " ) + `]]`;
            }

            return s;
        }

    }

    ToolBocksObject.serialize = ( pObject = {} ) => attempt( () => serialize( pObject ) );

    ToolBocksObject.deserialize = function( pData, pClass )
    {
        let obj = isStr( pData ) ? attempt( () => JSON.parse( _asStr( pData ) ) ) : isNonNullObj( pData ) ? { ...(pData) } : {};
        attempt( () => Object.setPrototypeOf( obj, pClass?.prototype || Object.getPrototypeOf( pClass ) ) );
        return obj;
    };

    const mod =
        {
            $scope,

            ModuleEvent: ToolBocksModuleEvent,
            ToolBocksModule,
            CustomEvent,

            CURRENT_MODE,
            ARGUMENTS,

            EMPTY_OBJECT,
            EMPTY_ARRAY,

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

            _mt_str,
            _mt_chr,
            _spc,
            _dot,
            _comma,
            _underscore,
            _colon,

            _unknown,

            S_LOG,
            S_ERROR,
            S_WARN,
            S_DEBUG,
            S_INFO,
            S_TRACE,

            S_ERR_PREFIX,
            S_DEFAULT_OPERATION,

            S_DEFAULT_ERROR_MESSAGE,

            ATTEMPT_FAILED,
            NOT_A_FUNCTION,

            TRANSIENT_PROPERTIES,

            ENDIAN,

            detectCycles,

            resolveError,
            resolveEvent,
            resolveEventType,
            resolveObject,
            resolveMethod,
            resolveLogLevel,
            resolveType,
            resolveTransientProperties,
            resolveVisitor,

            DEFAULT_COPY_OPTIONS: lock( DEFAULT_COPY_OPTIONS ),

            AsyncFunction,

            Xor,
            Nand,

            no_op,
            op_true,
            op_false,
            op_identity,

            sleep,
            doze,
            gc,

            functionToString,
            objectToString,
            errorToString,

            clamp,
            bracketsToDots,

            roundToNearestMultiple,
            calculatePercentComplete,
            calculateElapsedTime,
            calculateEstimatedTimeRemaining,
            formatElapsedTime,

            TYPES_CHECKS:
                {
                    GLOBAL_TYPES,
                    ERROR_TYPES,
                    PRIMITIVE_WRAPPER_TYPES,
                    isStr,
                    isFunc,
                    isObj,
                    isArray,
                    is2dArray,
                    isKeyValueArray,
                    isDate,
                    isRegExp,
                    isNum,
                    isBig,
                    isBool,
                    isSymbol,
                    isNull,
                    isUndefined,
                    isNonNullObj,
                    isPrimitive,
                    isThenable,
                    isPromise,
                    isError,
                    isAsyncFunction,
                    isMap,
                    isSet,
                    isObjectLiteral,
                    isClass,
                    isClassInstance,
                    isGlobalType,
                    isLogger: ToolBocksModule.isLogger,
                    isVisitor: Visitor.isVisitor,
                    _isValidStr,
                    _validTypes,
                    isPrimitiveWrapper,
                    isWeak,
                    isRef
                },

            TYPE_HELPERS:
                {
                    clamp,
                    _asInt,
                    _asFloat,
                    _asStr,
                    _lcase,
                    _ucase,
                    _spcToChar,
                    roundToNearestMultiple,
                    calculatePercentComplete,
                    calculateElapsedTime,
                    calculateEstimatedTimeRemaining,
                    formatElapsedTime
                },

            dereference,

            isObjectLiteral,
            isReadOnly,

            resolveOptions,
            populateOptions,
            deepMergeOptions,
            mergeOptions,

            canBind,
            bindMethod,

            attempt,
            attemptMethod,
            asyncAttempt,
            asyncAttemptMethod,

            getLastError,
            asyncGetLastError,

            attemptSilent,
            asyncAttemptSilent,

            fireAndForget,
            executeCallback,

            asPhrase,

            objectEntries,

            objectValues,
            objectKeys,
            objectMethods,

            serialize,

            toMap,

            propertyNames,
            propertyDescriptors,

            isWritable,
            populateProperties,
            overwriteProperties,

            toNodePathArray,

            getProperty,
            setProperty,
            hasProperty,

            readProperty,
            readScalarProperty,

            removeProperties,

            makeMutator,
            makeAccessor,
            makeAppender,
            makeDeleter,

            lock,
            deepFreeze,

            localCopy,
            immutableCopy,

            compareNullable,

            $ln,
            $nth,
            $last,

            OBJECT_REGISTRY,
            getGuid: function( pObject )
            {
                return (OBJECT_REGISTRY || new ObjectRegistry()).getGuid( pObject );
            },
            __Error,
            ExecutionEnvironment,
            ExecutionMode,
            IllegalArgumentError,
            IllegalStateError,
            IllegalAccessError,
            IterationCap,
            SourceInfo,
            StackTrace,
            StatefulListener,
            ObjectRegistry,
            ObjectEntry,
            Visitor,

            ILogger,
            Konsole,
            ConditionalLogger,

            Merger,
            mergeObjects: function( ...pObjects )
            {
                return attempt( () => (new Merger( ...pObjects )).merged );
            },

            isLogger: ToolBocksModule.isLogger,
            calculateErrorSourceName,

            getExecutionEnvironment: function()
            {
                return GLOBAL_INSTANCE.executionEnvironment;
            },
            getRuntimeLocale,
            getMessagesLocale,

            getMessagesLocaleString,
            runtimeLocaleString,
            getRuntimeLocaleString: function()
            {
                return runtimeLocaleString();
            },

            isFulfilled,
            isRejected,

            konsole,

            getGlobalLogger: function()
            {
                return ToolBocksModule.getGlobalLogger();
            },

            setGlobalLogger: function( pLogger )
            {
                ToolBocksModule.setGlobalLogger( pLogger );
            },

            getModeAwareLogger: function( pSink )
            {
                if ( DEBUG_MODE )
                {
                    return new ConditionalLogger( (pSink || konsole), ...(DEBUG_LOG_LEVELS) );
                }

                let con = this.getExecutionEnvironment?.console;

                if ( !isNull( con ) && ToolBocksModule.isLogger( con ) )
                {
                    return con;
                }

                if ( isNull( pSink ) || !ToolBocksModule.isLogger( pSink ) )
                {
                    return DEBUG_MODE ? DEBUG_LOGGER : ExecutionMode.isProduction( CURRENT_MODE ) ? PRODUCTION_LOGGER : INTERNAL_LOGGER;
                }

                let levels = [...(DEBUG_MODE ? DEBUG_LOG_LEVELS : ExecutionMode.isProduction( CURRENT_MODE ) ? QUIET_LOG_LEVELS : MODEST_LOG_LEVELS)];

                return new ConditionalLogger( (pSink || konsole), ...(levels) );
            },

            getProductionLogger: function( pSink )
            {
                if ( isNull( pSink ) || !ToolBocksModule.isLogger( pSink ) )
                {
                    return PRODUCTION_LOGGER;
                }

                return new ConditionalLogger( ToolBockModule.resolveLogger( pSink, konsole ),
                                              ...(QUIET_LOG_LEVELS) );
            },

            exportModule,
            requireModule,
            importModule: requireModule,

            classes:
                {
                    Args,
                    CmdLineArgs,
                    ExecutionEnvironment,
                    ExecutionMode,
                    __Error,
                    IllegalArgumentError,
                    IllegalStateError,
                    IllegalAccessError,
                    IterationCap,
                    ModuleArgs,
                    ModuleEvent: ToolBocksModuleEvent,
                    ObjectRegistry,
                    ObjectEntry,
                    Merger,
                    PromiseResult,
                    SourceInfo,
                    StackTrace,
                    StatefulListener,
                    ToolBocksModule,
                    Visitor,
                    ILogger,
                    Konsole,
                    ConditionalLogger
                }
        };

    // adds the module to module.exports (if it exists) and then returns the module
    return exportModule( mod, INTERNAL_NAME );

}( _ENV, ...CMD_LINE_ARGS ));
