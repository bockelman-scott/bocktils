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
 * @see {@link __Error},
 * @see IllegalArgumentError
 * @see StackTrace
 *
 * @see IterationCap
 *
 * <br>
 */

// defines a variable for typeof undefined
const _ud = "undefined";

/**
 * An alias for the console object available in most environments.<br>
 * We create an alias for console to reduce lint complaints.<br>
 * @type {ILogger|console|Console|{}}
 */
const konsole = _ud === typeof console ? {} : console || {};

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 * @return {Object} The global scope, a.k.a. globalThis, for the current execution environment
 */
const $scope = () => (_ud === typeof self ? ((_ud === typeof global) ? (_ud === typeof globalThis ? {} : globalThis || {}) : (global || (_ud === typeof globalThis ? this || {} : globalThis || this || {}) || this || {})) : (self || (_ud === typeof globalThis ? this || {} : globalThis || this || {})));

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
            konsole.error( "Could not load environment", ex.message, ex );
        }
    }
    else
    {
        environment = (scp || {})["__BOCK_MODULE_ENVIRONMENT__"] || scp?.navigator || { "MODE": "DEV" };
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

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

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
     * Defines some useful constants we need prior to loading the Constants module
     * We define these using a 'fake' destructuring with default values to reduce verbosity
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
            _mt_chr = "",
            _spc = " ",
            _dot = ".",
            _comma = ",",
            _underscore = "_",
            _colon = ":",
            _semicolon = ";",
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

            S_ERR_PREFIX = `An ${S_ERROR} occurred while`,
            S_DEFAULT_OPERATION = "executing script",

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
     * A constant function that always returns the boolean value, true.
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
     * A constant function that always returns the boolean value, false.
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
     * @typedef {Object} ILogger
     * @property {function(...*)} log A function that takes one or more arguments and 'logs' them with log level, 'log'
     * @property {function(...*)} info A function that takes one or more arguments and 'logs' them with log level, 'info'
     * @property {function(...*)} warn A function that takes one or more arguments and 'logs' them with log level, 'warn'
     * @property {function(...*)} debug A function that takes one or more arguments and 'logs' them with log level, 'debug'
     * @property {function(...*)} error A function that takes one or more arguments and 'logs' them with log level, 'error'
     */

    /**
     * Defines a logger that implements the expected methods, but does not do anything.<br>
     * This is used when logging is disabled,<br>
     * which might be desirable if consumers prefer to handle errors via event listeners instead.<br>
     * @type {ILogger}
     */
    const MockLogger =
        {
            log: no_op,
            info: no_op,
            warn: no_op,
            debug: no_op,
            error: no_op,
            trace: no_op
        };

    /*
     * The following functions are used in the base module,
     * because more sophisticated functions to detect and convert types
     * are exposed in a separate TypeUtils module.
     *
     * External code should prefer those functions over these rudimentary checks.
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
     * Returns true if the specified value is a (primitive) string.<br>
     * This will return true if the string is an empty string.<br>
     * To check for a non-empty string, use _isValidStr
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a (primitive) string.
     */
    const isStr = pObj => _str === typeof pObj;

    /**
     * Returns true if the specified value is a (primitive) string with one or more non-whitespace characters.
     *
     * @param {*} e The value to evaluate
     *
     * @returns {boolean} true if the specified value is a (primitive) string with one or more non-whitespace characters.
     */
    const _isValidStr = e => isStr( e ) && (_mt_str !== e.trim());

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
    const isNumeric = pObj => isNum( pObj ) || isStr( pObj ) && /[0-9.-]/.test( pObj ) && !isNaN( attempt( () => parseFloat( pObj ) ) );

    /**
     * Returns true if the specified value is a (primitive) boolean.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a (primitive) boolean.
     */
    const isBool = pObj => _bool === typeof pObj;

    /**
     * Returns true if the specified value is a (primitive) BigInt.
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a (primitive) BigInt.
     */
    const isBig = pObj => _big === typeof pObj;

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
     * Returns true if the specified value is of a primitive type (that is, not an object or function).
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is of a primitive type (that is, not an object or function).
     */
    const isPrimitive = pObj => !isObj( pObj ) && (isStr( pObj ) || isNum( pObj ) || isBool( pObj ) || isBig( pObj ) || isSymbol( pObj ));

    /**
     * Returns true if the specified value is a JavaScript class.<br>
     * This is done by checking that the value is a function and its source starts with the word, "class" <br>
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is a JavaScript class.
     */
    const isClass = pObj => isFunc( pObj ) && (/^class\s/.test( (functionToString.call( pObj, pObj )).trim() ));

    /**
     * A constant array of the standard JavaScript error types.<br>
     * <br>
     * This array contains the constructors for the basic built-in error types in JavaScript.<br>
     * <br>
     */
    const ERROR_TYPES = [Error, AggregateError, RangeError, ReferenceError, SyntaxError, URIError];

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

    const isPrimitiveWrapper = pObj => isObj( pObj ) && PRIMITIVE_WRAPPER_TYPES.filter( e => pObj instanceof e ).length > 0;

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

    /**
     * Returns true if the specified value is an object that is not null
     * and is an instance of one of the values in the GLOBAL_TYPES array.<br>
     * <br>
     *
     * @param {*} pObj The value to evaluate
     *
     * @returns {boolean} true if the specified value is an instance of a globally-defined/built-in type.
     */
    const isGlobalType = pObj => isNonNullObj( pObj ) && [...GLOBAL_TYPES].filter( e => pObj instanceof e ).length > 0;

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
     * Converts the input into a string representation.
     * If the input is already a string, it is returned as-is.
     *
     * @function
     * @param {*} e - The input value to be converted to a string.
     * @returns {string} The string representation of the input.
     */
    const _asStr = e => isStr( e ) ? e : (isFunc( e?.valueOf ) ? String( e.valueOf() ) : String( (_mt_str + String( e )) ));

    /**
     * Converts the input value to a lowercase string.
     *
     * The provided value is first cast to a string using the `_asStr` function,
     * and then converted to lowercase.
     *
     * @param {*} e - The input value to be transformed to lowercase.
     * @returns {string} - The lowercase string representation of the input value.
     */
    const _lcase = e => _asStr( e ).toLowerCase();

    /**
     * Converts the input value to an uppercase.
     *
     * The provided value is first cast to a string using the `_asStr` function,
     * and then converted to lowercase.
     *
     * @param {any} e - The input value to be transformed to uppercase.
     * @returns {string} The uppercase string representation of the input value.
     */
    const _ucase = e => _asStr( e ).toUpperCase();

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
            konsole.error( "Unable to define the Promise.try method", err );
        }
    }

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
        if ( isFunc( pFunction ) )
        {
            if ( handleAttempt.trace )
            {
                handleAttempt.traceFunctionCall( pFunction, ...pArgs );
            }

            handleAttempt.lastError = null;
            delete handleAttempt.lastError;

            try
            {
                return !isAsyncFunction( pFunction ) ?
                       pFunction.call( $scope(), ...pArgs ) :
                       pFunction.call( $scope(), ...pArgs ).then( result => result );
            }
            catch( ex )
            {
                handleAttempt.lastError = ex;
                handleAttempt.handleError( ex, pFunction, ...pArgs );
            }
        }
        else
        {
            const error = new Error( NOT_A_FUNCTION );
            handleAttempt.lastError = error;
            handleAttempt.handleError( error, pFunction, ...pArgs );
        }

        return pFunction;
    }

    handleAttempt.traceFunctionCall = ( pFunction, ...pArgs ) =>
    {
        if ( !handleAttempt.trace )
        {
            return;
        }

        const nameFromSource = ( pFunction ) =>
        {
            let s = _asStr( functionToString.call( pFunction, pFunction ) ).trim();
            s = s.replace( /function /, _mt_str ).trim().replace( /\s*\(.*\).*/, _mt_str ).trim();
            return s.replace( /function\s+/, _mt_str ).trim().replace( /\s*\(.*\).*/, _mt_str ).trim();
        };

        const name = pFunction?.name || nameFromSource( pFunction ) || "An anonymous function";

        const hasArguments = [...(pArgs || [])].length > 0;

        konsole.trace( "Calling", name, ...(hasArguments ? ["with arguments:", ...pArgs].map( e => String( e ) + "\n" ) : ["without arguments"]) );
    };

    /**
     * An asynchronous version of handleAttempt
     * Used when attempting to execute asynchronous functions or methods.
     *
     * @param {function} pFunction
     * @param {...*} pArgs
     *
     * @returns {Promise<*>}
     */
    async function asyncHandleAttempt( pFunction, ...pArgs )
    {
        if ( !isAsyncFunction( pFunction ) )
        {
            return handleAttempt( pFunction, ...pArgs );
        }
        else
        {
            handleAttempt.traceFunctionCall( pFunction, ...pArgs );
        }

        return await pFunction.call( $scope(), ...pArgs ).catch( ex => handleAttempt.handleError( ex, pFunction, ...pArgs ) );
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
     * @function handleError
     *
     * @memberof handleAttempt
     *
     * @param {Error|Function} pError - The error encountered during the attempted function call.
     * @param {Function} [pFunction] - The function that was being executed when the error occurred
     * @param {...*} [pArgs] - The arguments that were passed to the function that threw an error
     */
    handleAttempt.handleError = function( pError, pFunction, ...pArgs )
    {
        handleAttempt.lastError = pError;
        konsole.error( (pError instanceof Error ? ATTEMPT_FAILED : NOT_A_FUNCTION), pError?.message || pFunction?.name || _mt_str, pError || {}, pFunction || {}, ...pArgs );
    };

    handleAttempt.trace = false;

    handleAttempt.enableTrace = function()
    {
        handleAttempt.trace = true;
    };

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

    function getLastError()
    {
        return handleAttempt.lastError;
    }

    async function getLastAsynchronousError()
    {
        return Promise.resolve( handleAttempt.lastError );
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
        const method = resolveMethod( pMethod, pThis );

        if ( isFunc( method ) )
        {
            if ( canBind( method, pThis ) )
            {
                return attempt( () => method.call( pThis, ...pArgs ) );
            }

            return attempt( () => method.call( $scope(), ...pArgs ) );
        }

        handleAttempt.handleError( new Error( NOT_A_FUNCTION ), pThis, pMethod, ...pArgs );

        return method || pThis;
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
        const method = resolveMethod( pMethod, pThis );

        if ( isAsyncFunction( method ) )
        {
            if ( canBind( method, pThis ) )
            {
                return await asyncAttempt( async() => await method.call( pThis, ...pArgs ) );
            }

            return await asyncAttempt( async() => await method.call( $scope(), ...pArgs ) );
        }
        else if ( isFunc( method ) )
        {
            return attemptMethod( pThis, method, ...pArgs );
        }

        handleAttempt.handleError( new Error( NOT_A_FUNCTION ), pThis, pMethod, ...pArgs );

        return method || pThis;
    }

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

                            func.call( $scope(), ...(args || pArgs || []) ).then( no_op ).catch( no_op );

                        }, 10, ...(args || pArgs || []) );
        }
        else if ( isFunc( func ) )
        {
            async function _( ...pArgs )
            {
                attempt( func.call( $scope(), ...(pArgs || args || []) ), ...(pArgs || args || []) );
            }

            fireAndForget( _, ...(args || pArgs || []) );
        }
    };

    /**
     * This is an internal cache of constructed and loaded modules.<br>
     * @type {Object}
     * @dict
     * @private
     */
    let MODULE_CACHE = {};

    /* This is the internal name of this module; it is exported as ToolBocksModule */
    const modName = "ToolBocksModule";

    /**
     * Returns true if the specified argument is an array.<br>
     * Some ancient environments did not define an isArray method on the built-in Array class,
     * so we define our own for safety.<br>
     * @param {*} pObject A value to evaluate
     * @returns {boolean} true if the specified argument is an array
     */
    function isArray( pObject )
    {
        return !isNull( pObject ) && ((isFunc( Array.isArray ) && Array.isArray( pObject )) || objectToString.call( pObject ) === "[object Array]");
    }

    const is2dArray = ( pArray ) => isArray( pArray ) && pArray.length > 0 && pArray.every( row => isArray( row ) );

    const isKeyValueArray = ( pArray ) => is2dArray( pArray ) && pArray.every( row => row.length >= 2 && row.length <= 3 && isStr( row[0] ) );

    /**
     * Returns a non-null object.<br>
     * Returns the specified object if it meets the criteria of being a non-null object.<br>
     * @param {*} pObject The object to return if it is actually a non-null object
     * @param {boolean} [pAcceptArray=false] Whether to treat an array as an object for this purpose
     * @returns {Object} The object specified if it is a non-null object or an empty object; never returns null.
     */
    const resolveObject = ( pObject, pAcceptArray = false ) => isNonNullObj( pObject ) ? (!!pAcceptArray || !isArray( pObject ) ? pObject : {}) : {};

    const isWritable = function( pObj, pPropertyName )
    {
        let hasProperty = ({}).hasOwnProperty.call( pObj, pPropertyName );

        if ( hasProperty )
        {
            let descriptor = Object.getOwnPropertyDescriptor( pObj, pPropertyName );

            if ( descriptor )
            {
                return ((descriptor.writable && descriptor.enumerable) || (isFunc( descriptor.set )));
            }
        }

        return false;
    };

    /**
     * Alias for Object.freeze
     */
    const freeze = Object.freeze;

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
                    const key = _asStr( parts.length ? _asStr( parts[0] ).trim() : _mt_str ).trim();
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
         * @param {object} [pOptions] Any arbitrary object that might need to be associated with a particular mode.
         *
         * @return {ExecutionMode} A new instance of the class with the specified name and trace settings.
         */
        constructor( pName, pTraceEnabled = false, pOptions = {} )
        {
            this.#name = _spcToChar( _ucase( _asStr( pName || S_NONE ).trim() ) );

            this.#traceEnabled = !!pTraceEnabled;

            this.#options = populateOptions( pOptions || {}, {} );
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
         * Write the specified message to the console using the console.trace method.<br>
         * In addition to writing the message,
         * this instance is included as a second argument
         * and will also be written to the console.<br>
         *
         * @param {*} pMsg A message or value to write to the console, using the console.trace method.
         */
        trace( pMsg )
        {
            konsole.trace( pMsg, this );
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
            NONE: freeze( new ExecutionMode( S_NONE, false ) ),
            PROD: freeze( new ExecutionMode( "PRODUCTION", false ) ),
            DEV: freeze( new ExecutionMode( "DEVELOPMENT", false ) ),
            DEBUG: freeze( new ExecutionMode( "DEBUG", true ) ),
            TEST: freeze( new ExecutionMode( "TEST", true ) ),
            TRACE: freeze( new ExecutionMode( "TRACE", true ) )
        };

    // adds each Execution Mode constant as a static member of the ExecutionMode class
    Object.entries( ExecutionMode.MODES ).forEach( ( [key, value] ) =>
                                                   {
                                                       ExecutionMode[key] = value;
                                                   } );

    ExecutionMode.from = function( pArg )
    {
        let arg = isNumeric( pArg ) ? asInt( pArg ) : asString( pArg );

        if ( isNumber( arg ) )
        {
            switch ( asInt( arg ) )
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
        else if ( isString( arg ) )
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
     * <br>
     * @type {ExecutionMode}
     */
    const CURRENT_MODE = freeze( ExecutionMode.MODES[ENVIRONMENT["MODE"]] || ExecutionMode.MODES[ARGUMENTS.get( "mode", ExecutionMode.DEFAULT )] || ExecutionMode.DEFAULT );

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
     * @param {Object} pDefaults An object holding defaults for the properties to be used
     * @returns {Object} An object combining the defaults with the specified options
     */
    function populateOptions( pOptions, ...pDefaults )
    {
        let sources = [...(pDefaults || [])].map( e => resolveObject( e || {}, true ) );

        if ( isNonNullObj( pOptions ) )
        {
            sources.push( resolveObject( pOptions || pDefaults || {}, true ) );
        }

        sources = sources.filter( e => isNonNullObj( e ) );

        return Object.assign( {}, ...sources );
    }

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
    const isNode = function()
    {
        if ( (_ud === typeof self) && (_ud === typeof window) && (_ud !== typeof module) && (isFunc( require )) )
        {
            if ( _ud === typeof Deno && (_ud !== typeof process) )
            {
                return !isAsyncFunction( require );
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
    const isDeno = () => !isNode() && (_ud !== typeof Deno);

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
    const isBrowser = () => ( !isNode() && !isDeno() && (_ud !== typeof window) && (_ud !== typeof document) && (_ud !== typeof navigator));

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
    const getMessagesLocale = function( pEnvironment = ENVIRONMENT )
    {
        const environment = resolveObject( pEnvironment || _ENV, false );

        let locale = environment?.LC_ALL || environment?.LC_MESSAGES || environment?.LANG || getRuntimeLocale();

        return _mt_str + (isStr( locale ) ? locale : (locale?.basename || runtimeLocaleString()));
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

        #localeCode = getMessagesLocale( ENVIRONMENT );

        #mode = CURRENT_MODE;

        // noinspection OverlyComplexFunctionJS
        constructor( pGlobalScope )
        {
            const globalScope = pGlobalScope || $scope();

            this.#DenoGlobal = _ud === typeof Deno && _ud === typeof globalScope?.Deno ? null : (_ud !== typeof Deno ? Deno : null) || globalScope?.Deno;

            this.#process = _ud !== typeof process ? process : this.#DenoGlobal || null;

            this.#versions = this.#process?.versions || this.#DenoGlobal?.version || {};

            this.#version = this.#versions?.node || this.#versions?.deno;

            this.#console = (_ud !== typeof console && isFunc( console?.log )) ? console : MockLogger;

            this.#window = _ud !== typeof window ? window : null;

            this.#document = _ud !== typeof document ? document : _ud === typeof window ? null : window?.document;

            this.#navigator = _ud !== typeof navigator ? navigator : (_ud !== typeof window ? window?.navigator : null);

            this.#userAgent = this.#navigator?.userAgent || (_ud === typeof window ? null : window?.navigator?.userAgent);

            this.#location = _ud !== typeof location ? location : (_ud === typeof window ? null : window?.location);

            this.#history = _ud !== typeof history ? history : (_ud === typeof window ? null : window?.history);

            this.#performance = _ud !== typeof performance ? performance : null;

            this.#customElements = _ud !== typeof customElements ? customElements : null;

            this.#fetch = _ud !== typeof fetch && isFunc( fetch ) ? fetch : null;

            this.#ENV = { ...ENVIRONMENT };
            this.#ARGUMENTS = lock( ARGUMENTS );

            this.#localeCode = this.#navigator?.language || getMessagesLocale( this.#ENV ) || DEFAULT_LOCALE_STRING;

            this.#mode = CURRENT_MODE;
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
            return this.#console || konsole || MockLogger;
        }

        get fetch()
        {
            return this.#fetch;
        }

        isNode()
        {
            return isNode() && (null != this.process) && (null == this.#DenoGlobal);
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
            return this.isBrowser() ? (this.navigator?.language || this.#localeCode || getMessagesLocale( this.ENV ) || DEFAULT_LOCALE_STRING) : this.#localeCode || getMessagesLocale( this.ENV ) || DEFAULT_LOCALE_STRING;
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
            return ToolBocksModule.MODULE_CACHE || MODULE_CACHE;
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
                s += JSON.stringify( this.ARGUMENTS, null, 4 );
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
                s += JSON.stringify( this.ENV, null, 4 );
                s += "\n";
            }

            return s;
        }

        printRuntime()
        {
            let s = "Runtime: ";

            s += isNode() ? "Node.js" : isDeno() ? "Deno" : isBrowser() ? "Browser" : _unknown;
            s += isNode() || isDeno() ? (", Version: " + this.version) : _mt_str;
            s += isBrowser() ? (": " + this.userAgent) : _mt_str;

            return s + "\n";
        }
    }

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
        return isNode() && isObj( pProcess ) && (_ud !== typeof pProcess?.allowedNodeEnvironmentFlags);
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
        if ( pEventName instanceof ToolBocksModuleEvent )
        {
            return {
                type: resolveEventType( pEventName?.type ),
                data: (pEventName?.detail || pEventName?.data),
                options: populateOptions( pOptions, (pEventName?.detail || pEventName?.data || pData) )
            };
        }

        if ( _ud !== typeof CustomEvent && pEventName instanceof CustomEvent )
        {
            return {
                type: resolveEventType( pEventName?.type ),
                data: (pEventName?.detail || pEventName?.data),
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

        let data = (isObj( pData ) ? (pData?.detail || pData) : optionsDetail) || optionsDetail;

        data = data?.detail || data?.data || data || options?.detail || options || options?.data || options || {};

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

            this.#detail = data?.detail || data || pData || options?.detail || options || {};

            this.#traceEnabled = !!options.traceEnabled;

            this.id = "Event_" + (options?.id || ((new Date().getTime())));

            this.#options = populateOptions( options, {} );

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
            this.#detail = populateOptions( (pData?.detail || pData), this.detail );
            return this.detail;
        }

        trace( pMsg )
        {
            konsole.trace( pMsg, this );
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

        return new ToolBocksModuleEvent( evt, pData, pOptions );
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
        return new Promise( resolve => setTimeout( resolve, pMilliseconds ) );
    }

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

            pBuffer.push( seq );
        }
    }

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
        const options = populateOptions( pOptions || {}, BRACKETS_TO_DOTS_OPTIONS );

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

    const TRANSIENT_PROPERTIES = freeze( ["constructor", "prototype", "toJson", "toObject", "global", "this", "toString", "__GUID"] );

    function resolveTransientProperties( pOptions )
    {
        const options = populateOptions( pOptions || {}, { transientProperties: [...TRANSIENT_PROPERTIES] } );
        return [...(new Set( [...TRANSIENT_PROPERTIES, ...(([options.transientProperties] || []).flat())] ))];
    }

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
     * Defines the default value to use in recursive functions to bail out before causing a stack overflow.<br>
     * <br>
     * Most functions that use recursion accept an options object that allows you to provide a different value for maxStackSize.<br>
     * <br>
     * @type {number}
     * @const
     */
    const MAX_STACK_SIZE = 32;

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
            depth: 99,
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
    let IMMUTABLE_COPY_OPTIONS = { ...DEFAULT_COPY_OPTIONS };
    IMMUTABLE_COPY_OPTIONS.freeze = true;

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
        const options = populateOptions( pOptions, DEFAULT_COPY_OPTIONS );
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
        const options = populateOptions( pOptions, IMMUTABLE_COPY_OPTIONS );

        if ( _ud === typeof pObject )
        {
            return freeze( null === options?.undefinedReplacement ? null : options?.undefinedReplacement ?? null );
        }

        if ( null === pObject )
        {
            return freeze( null === options?.nullReplacement ? null : options?.nullReplacement ?? EMPTY_OBJECT );
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
        let stack = pError instanceof Error ? pError?.stack : isStr( pError ) ? pError : _mt_str;

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
        let errorStack = pStack || pError?.stack || pError;

        if ( pStack instanceof String || isStr( pStack ) )
        {
            errorStack = (pStack || generateStack( pError ) || generateStack( pStack ) || _mt_str);
        }
        else if ( Error.isError( pStack ) || pStack instanceof Error )
        {
            errorStack = (pStack.stack || generateStack( pStack ) || generateStack( pError ) || _mt_str);
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

            this.#stack = resolveErrorStack( pStack, error ) || pStack;

            this.#frames = this.parseFrames();

            this.#parts = this.parseFrame( Math.min( 1, this.#frames?.length - 1 ) );

            this.#methodName = this.#parts.methodName;
            this.#fileName = this.#parts.fileName;
            this.#lineNumber = this.#parts.lineNumber;
            this.#columnNumber = this.#parts.columnNumber;

            const me = this;
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
            this.#frames = this.#frames?.length ? this.#frames : this.parseFrames();
            return this.#frames;
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
    const DEFAULT_ERROR_MSG = [S_ERR_PREFIX, S_DEFAULT_OPERATION].join( _spc );

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
        #msg;
        #options;

        #type;
        #name;

        #cause = null;

        #trace;

        #code;
        #referenceId;

        #occurred;

        /**
         * Constructs an instance of the custom Error class, __Error.<br>
         * @constructor
         * @param {string|Error} pMsgOrErr The error message or an Error whose message should be used as the error message
         * @param {Object} [pOptions={}] An object that will be available as a property of this Error
         */
        constructor( pMsgOrErr, pOptions = {} )
        {
            super( initializeMessage( pMsgOrErr ) );

            this.#options = populateOptions( pOptions, {} );

            this.#type = this.getErrorTypeOrName( pMsgOrErr ).replace( /^__/, _mt_str );
            this.#name = this.getErrorTypeOrName( pMsgOrErr ).replace( /^__/, _mt_str );

            this.#msg = super.message;

            this.#cause = this.determineCause( pMsgOrErr, this.#options?.cause );

            this.#code = this.calculateErrorCode( pMsgOrErr, this.#options );

            this.#referenceId = this.calculateReferenceId( pMsgOrErr );

            // Capture stack trace if available
            if ( Error.captureStackTrace )
            {
                Error.captureStackTrace( this, Error );
            }

            if ( isError( pMsgOrErr ) )
            {
                this.stack = pMsgOrErr.stack || this.stack;
            }

            this.#occurred = isError( pMsgOrErr ) ? pMsgOrErr[OBJECT_CREATED] : isError( this.#cause ) ? this.#cause[OBJECT_CREATED] : new Date();

            this.#trace = this.#options?.stackTrace || ((isError( pMsgOrErr ) ? new StackTrace( (pMsgOrErr?.stack || this.stack), pMsgOrErr ) : null));
        }

        get occurred()
        {
            return new Date( this.#occurred || this[OBJECT_CREATED] );
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
            if ( pError instanceof Error )
            {
                return _asStr( pError.type || pError.name || this.constructor?.name || "Error" ).replace( /^__/, _mt_str );
            }
            return _asStr( this.constructor?.name || "Error" ).replace( /^__/, _mt_str );
        }

        /**
         * Determines the cause of the error based on provided options or message.
         */
        determineCause( pError, pCause )
        {
            return (pCause instanceof Error ? pCause : (isError( pError ) ? pError?.cause || pError : null)) || this.#cause;
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

        get name()
        {
            return this.#name || super.name || this.constructor?.name;
        }

        get type()
        {
            return this.#type || this.name;
        }

        get prefix()
        {
            return this.name + ": ";
        }

        get message()
        {
            return this.prefix + ((this.#msg || super.message).replace( this.prefix, _mt_str ));
        }

        toString()
        {
            return this.prefix + ((this.message || super.message).replace( this.prefix, _mt_str ));
        }

        get cause()
        {
            this.#cause = this.#cause || (isError( this.#options?.cause ) ? this.#options?.cause : super.cause) || super.cause;
            return this.#cause;
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
            const logger = pLogger || konsole;

            const level = resolveLogLevel( pLevel );

            if ( isFunc( logger[level] ) )
            {
                attemptMethod( logger, logger[level], this.toString(), this.options, this );
            }
        }

        cloneOptions( pOptions )
        {
            let options = populateOptions( pOptions, { ...this.options } );
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
            let options = this.cloneOptions( this.options );

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
        /**
         * @constructor
         * @param {string|Error} pMessage The error message or an Error whose message should be used as the error message
         * @param {Object} pOptions An object that will be available as a property of this Error
         */
        constructor( pMessage, pOptions )
        {
            super( pMessage, pOptions );

            if ( Error.captureStackTrace )
            {
                Error.captureStackTrace( this, this.constructor );
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

        /**
         * @inheritDoc
         * @returns {string}
         */
        toString()
        {
            return this.prefix + ((this.message || super.message).replace( this.prefix, _mt_str ));
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
     * @returns {__Error} an Error (actually an instance of __Error, which provides an environment-agnostic stack trace)
     */
    function resolveError( pError, pMessage )
    {
        if ( !(isError( pError ) || isError( pMessage ) || (_isValidStr( pMessage ) || _isValidStr( pError ))) )
        {
            return null;
        }

        const msg = _isValidStr( pMessage ) ? pMessage : _isValidStr( pError ) ? pError : pError?.message || pMessage?.message || DEFAULT_ERROR_MSG;

        let cause = isError( pError ) ? pError : isError( pMessage ) ? pMessage : null;

        let options = isError( cause ) ? { message: msg, cause } : { message: msg };

        let errors = ([pError, pMessage]).map( e => e instanceof __Error ? e : (isError( e ) ? new __Error( e, options ) : new __Error( msg, options )) );

        return errors.length > 0 ? errors[0] : new __Error( msg, options );
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
        const funName = isFunc( pFunction ) ? _asStr( pFunction?.name || "anonymous" ) : isStr( pFunction ) ? pFunction : _unknown;

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

            this.#options = populateOptions( pOptions, {} );

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
            // the only thing implemented in the base class is for debugging and testing modes
            if ( isArray( this.eventsHandled ) )
            {
                this.eventsHandled.push( { event: pEvent, extra: [...(pExtra || [])] } );
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

            this.#options = populateOptions( pOptions || {}, {} );

            this.#visitFunction = isFunc( pVisitFunction ) ? pVisitFunction.bind( this ) : null;
        }

        get options()
        {
            return populateOptions( this.#options || {}, {} );
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
                attempt( () => (me || this).#visitFunction.call( (me || this), pVisited, ...pExtra ) );
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
                        this.dispatchEvent( new ToolBocksModuleEvent( "error",
                                                                      {
                                                                          error: ex,
                                                                          message: ex.message,
                                                                          visited: pVisited,
                                                                          args: [...(asArray( pExtra || [] ) || [])]
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

        #executionEnvironment;

        #traceEnabled = false;

        #moduleArguments;

        /**
         * Constructs a new instance, or module, to expose functionality to consumers.
         * <br>
         * <br>
         * @constructor
         *
         * @param {string|ToolBocksModule|Object} pModuleName The name of this instance, or another instance<br>
         *                                                 from which to inherit the name and other properties
         * @param {string} pCacheKey A unique key to use to cache this module in global scope to improve performance
         * @param {boolean} pTraceEnabled
         * @param {ModuleArgs} [pModuleArguments=MODULE_ARGUMENTS]
         */
        constructor( pModuleName, pCacheKey, pTraceEnabled = CURRENT_MODE?.traceEnabled || false, pModuleArguments = MODULE_ARGUMENTS )
        {
            super();

            this.#moduleName = (isStr( pModuleName )) ? pModuleName : (isObj( pModuleName ) ? pModuleName?.moduleName || pModuleName?.name || pModuleName?.cacheKey : _mt_str) || modName;
            this.#cacheKey = (isStr( pCacheKey )) ? pCacheKey : (isObj( pModuleName ) ? pModuleName?.cacheKey || pModuleName?.moduleName || pModuleName?.name : _mt_str) || INTERNAL_NAME;

            this.#moduleName = this.#moduleName || this.#cacheKey || modName;
            this.#cacheKey = this.#cacheKey || this.#moduleName || this.__GUID || INTERNAL_NAME;

            this.#traceEnabled = !!pTraceEnabled;

            this.#moduleArguments = pModuleArguments || MODULE_ARGUMENTS;

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

            const me = this;

            handleAttempt.handleError = function( pError, pContext, ...pExtra )
            {
                const error = resolveError( pError, pError?.message );

                handleAttempt.lastError = error;

                (me || this).reportError( error, error?.message, S_ERROR, (me || this).calculateErrorSourceName( (me || this), pContext || handleAttempt ), ...pExtra );
            };
        }

        /**
         * Creates and returns a shallow copy of the current module instance.
         *
         * @return {ToolBocksModule} A shallow copy of the module
         */
        clone()
        {
            const copy = { ...this };
            copy.prototype = this.constructor;
            copy.constructor = this.constructor;
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
                konsole.trace( pMessage, pOptions || "Called without options" );

                this.dispatchEvent( new ToolBocksModuleEvent( "trace", pMessage, pOptions ) );
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

        getMessagesLocale()
        {
            return this.executionEnvironment?.localeCode || getMessagesLocale();
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
                    logger = ToolBocksModule.getGlobalLogger() || this.#logger;
                }

                logger = this.#logger || logger || konsole;
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
                this.#logger = pLogger;
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
         * Returns true of the specified object implements the 6 expected methods:<br>
         * log, info, warn, error, debug, and trace
         * <br>
         * @param {Object|ILogger} pLogger An object that may or may not be a logger
         * @returns {boolean} true of the specified object implements the 6 expected methods:
         * log, info, warn, error, debug, and trace
         */
        static isLogger( pLogger )
        {
            return (isNonNullObj( pLogger )
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
         * Notifies event handlers listening for the "error" event of the error encountered.
         * <br><br>
         * Also, optionally, writes to the logger defined, if logging is enabled.
         * <br>
         * <br>
         * The event object passed to the event handlers includes a detail property with<br>
         * the Error object,<br>
         * a message,<br>
         * the recommended log level (for example, error, info, warn, etc.),<br>
         * and the 'source' of the error (a string description of the module and function where the error occurred).
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
                     pMessage = pError?.message || S_DEFAULT_OPERATION,
                     pLevel = S_ERROR,
                     pSource = _mt_str,
                     ...pExtra )
        {
            try
            {
                const s = _mt_str + (pMessage || pError?.message || S_DEFAULT_OPERATION);

                const err = resolveError( pError, s );

                let msg = [S_ERR_PREFIX, s, err, ...pExtra];

                let level = _lcase( _asStr( pLevel ).trim() );

                level = [S_LOG, S_INFO, S_WARN, S_DEBUG, S_ERROR].includes( level || S_ERROR ) ? level : S_ERROR;

                if ( this.traceEnabled )
                {
                    this.trace( "reportError", { moduleName: this.moduleName, err, msg, level, source: pSource } );
                }

                if ( this.#loggingEnabled && ToolBocksModule.isLogger( this.logger ) )
                {
                    attemptMethod( this.logger, this.logger[level], ...msg );
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
                    konsole.error( ex2, ...msg );
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

        handleError( pError, pContext, ...pExtra )
        {
            const source = this.resolveErrorSource( pContext, pError );
            this.reportError( pError, pError?.message || S_DEFAULT_ERROR_MESSAGE, S_ERROR, source, ...pExtra );
        }

        async handleErrorAsync( pError, pContext, ...pExtra )
        {
            const me = this;

            const source = this.resolveErrorSource( pContext, pError );

            const error = resolveError( pError, pError?.message );

            const msg = pError?.message || S_DEFAULT_ERROR_MESSAGE;

            const extra = [...pExtra];

            const func = async function()
            {
                me.reportError( error, msg, S_ERROR, source, ...extra );
            };

            setTimeout( func, 10 );
        }

        /**
         * Returns true if this module is read-only
         * @returns {boolean} true if this module is read-only
         */
        get locked()
        {
            return isReadOnly( this );
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

                    return Object.assign( this, pObject || {} );
                }

                let toolbocksModule = new ToolBocksModule( pObject );

                return Object.assign( toolbocksModule, pObject );
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

            mod.dispatchEvent( new CustomEvent( "load", mod ) );

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

            dispatchEvent( new ToolBocksModuleEvent( "load", mod, { ...object } ) );

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
                toolbocksModule.extend( pObject );
            }

            return toolbocksModule;
        }

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
                handle( ex, func, ...pArgs );
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
                handle( ex, func, ...pArgs );
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
                handle( ex, func, ...pArgs );
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
                handle( ex, func, ...pArgs );
            }

            return this.calculateResult( result );
        }

        initializeAttempt( pMethod, pThis )
        {
            const thiz = pThis || this;

            const func = resolveMethod( pMethod, thiz ) || (isFunc( pMethod ) ? pMethod : () => pMethod);

            const result = this.initializeResult( func );

            const handle = function( pError, pFunction, ...pArgs )
            {
                const error = resolveError( pError, (pFunction || func)?.name );

                result.exceptions.push( error );

                handleAttempt.lastError = handle.lastError = error;

                thiz.reportError( error, error?.message, S_ERROR, thiz.calculateErrorSourceName( thiz, (pFunction || func) ), ...pArgs );
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

    /**
     * Define a cache scoped to the BlockModulePrototype namespace.<br>
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

    /**
     * Defines a private instance of the ToolBocksModule
     * to be used in functions that are not defined as methods
     * @see _copy
     * @type {ToolBocksModule}
     */
    const GLOBAL_INSTANCE = new ToolBocksModule( "GLOBAL_INSTANCE", "__BOCK__MODULE_PROTOTYPE_GLOBAL_INSTANCE__" );

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

        const cacheKey = isStr( pCacheKey ) && _mt_str !== _asStr( pCacheKey ).trim() ? _asStr( pCacheKey ).trim() : mod?.moduleName || mod?.__GUID;

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
        GLOBAL_INSTANCE.handleError( pError, pFunction, ...pArgs );
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

        if ( isNode() )
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

    function hasNoConstructor( pObject )
    {
        let constructorFunction = pObject.constructor || Object.getPrototypeOf( pObject )?.constructor;
        return ( !isFunc( constructorFunction ) || (["Object"].includes( constructorFunction?.name ) || [Object].includes( constructorFunction )));
    }

    const isInfiniteLoop = ( object, visited, stack, depth ) => visited.has( object ) || detectCycles( stack, 5, 5 ) || depth > MAX_STACK_SIZE;

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
    function isObjectLiteral( pObject, pOptions = DEFAULT_IS_LITERAL_OPTIONS, pVisited = new Set(), pStack = [], pDepth = 0 )
    {
        const options = populateOptions( pOptions, DEFAULT_IS_LITERAL_OPTIONS );

        const { visited, stack, depth } = initializeRecursionArgs( pVisited, pStack, pDepth, options );

        let isLiteral = false;

        if ( isNonNullObj( pObject ) )
        {
            isLiteral = hasNoConstructor( pObject );

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
        const resolvedOptions = populateOptions( pOptions, DEFAULT_COPY_OPTIONS );
        const depth = _getDepth( resolvedOptions );
        const maxStackSize = _getMaxStackSize( resolvedOptions );
        const freeze = resolvedOptions.freeze === true;

        resolvedOptions.depth = depth;
        resolvedOptions.maxStackSize = maxStackSize;

        return { resolvedOptions, maxStackSize, freeze };
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
        let clone = [...array];

        if ( detectCycles( stack, 5, 5 ) )
        {
            return clone;
        }

        return clone.map( ( item, index ) => _copy( item, options, [...stack, index] ) );
    };

    function cloneMap( pMap, pEntries, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        const map = new Map();

        const entries = pEntries || objectEntries( pMap );

        entries.forEach( ( entry ) => map.set( entry.key || entry[0], _copy( entry.value || entry[1], pOptions, [...(pStack || []), (entry.key || entry[0])] ) ) );

        return map;
    }

    function cloneSet( pSet, pEntries, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        const set = new Set();

        const entries = pEntries || objectEntries( pSet );

        entries.forEach( ( entry ) => set.add( _copy( (entry.value || entry[1]), pOptions, [...(pStack || []), (entry.key || entry[0])] ) ) );

        return set;
    }

    function cloneObjectLiteral( pClone, pEntries, pOptions = DEFAULT_COPY_OPTIONS, pStack = [] )
    {
        const clone = pClone || {};

        const entries = pEntries || objectEntries( clone );

        const options = resolveCopyOptions( pOptions );

        const stack = pStack || options.stack || [];

        for( const entry of entries )
        {
            const key = !isNull( entry ) ? (entry.key || entry[0]) : _mt_str;
            const value = !isNull( entry ) ? (entry.value || entry[1]) : null;

            if ( !isNull( key ) && !isNull( value ) )
            {
                const copiedValue = _copy( value, populateOptions( options, pOptions ), [...stack, key] );
                clone[key] = (typeof copiedValue === _fun) ? copiedValue.bind( clone ) : copiedValue;
            }
        }

        return clone;
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
        let clone = attempt( () => (isFunc( pObject.clone )) ? pObject.clone() : (isObjectLiteral( pObject ) ? { ...pObject } : pObject) ) || {};

        const stack = [...(pStack || [])];

        if ( detectCycles( stack, 5, 5 ) )
        {
            return clone;
        }

        if ( isDate( pObject ) )
        {
            return new Date( pObject.getTime() );
        }

        if ( isRegExp( pObject ) )
        {
            return new RegExp( pObject.source, pObject.flags );
        }

        if ( isPrimitive( pObject ) )
        {
            return pObject;
        }

        if ( isPrimitiveWrapper( pObject ) )
        {
            return pObject.valueOf();
        }

        const entries = objectEntries( pObject );

        if ( isMap( clone ) )
        {
            clone = cloneMap( clone, entries, pOptions, stack );
        }
        else if ( isSet( clone ) )
        {
            clone = cloneSet( clone, entries, pOptions, stack );
        }
        else if ( isError( clone ) )
        {
            clone = new __Error( clone, { stack: clone.stack } );
            clone.stack = pObject.stack || clone.stack;
        }
        else
        {
            clone = cloneObjectLiteral( clone, entries, pOptions, stack );
        }

        if ( !!!pOptions?.includeClassNames )
        {
            delete clone["class"];
        }

        return clone;
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
        const undefinedReplacement = pOptions.undefinedReplacement ?? null;
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
        const nullReplacement = pOptions.nullReplacement ?? EMPTY_OBJECT;
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
        return String( _mt_str + pString );
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
        if ( _ud === typeof pObject )
        {
            return handleCopyUndefined( pObject, pOptions, pFreezeFunction );
        }

        if ( null === pObject )
        {
            return handleCopyNull( pObject, pOptions, pFreezeFunction );
        }

        let clone;

        if ( pObject instanceof Date )
        {
            clone = new Date( pObject.getTime() );
        }
        else if ( pObject instanceof RegExp )
        {
            clone = new RegExp( pObject, pObject.flags || _mt_str );
        }
        else if ( isArray( pObject ) )
        {
            clone = cloneArray( pObject, pOptions, pStack );
        }
        else
        {
            clone = attempt( () => cloneObject( pObject, pOptions, pStack ) ) || clone;
        }

        if ( !!!pOptions?.includeClassNames )
        {
            delete clone["class"];
        }

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

        if ( detectCycles( stack, 5, 5 ) )
        {
            return maybeFreeze( pObject );
        }

        const handler = CopyHandlers.get( typeof pObject ) || CopyHandlers.get( _asterisk );

        return attempt( () => handler( pObject, resolvedOptions, maybeFreeze, stack ) );
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
        const options = populateOptions( pOptions, IMMUTABLE_COPY_OPTIONS );
        options.freeze = true;
        return _copy( pObject, options, pStack );
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
            super( ...pArgs );

            this.#key = _mt_str;
            this.#value = null;

            if ( isArray( pArgs ) )
            {
                const args = [...pArgs];

                this.#key = (args?.length || 0) > 0 ? args[0] : this[0] || _mt_str;
                this.#value = (args?.length || 0) > 1 ? args[1] || this[1] : this[1];
                this.#parent = (args?.length || 0) > 2 ? args[2] || this[2] : this[2];
            }

            this.#type = typeof this.#value;
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get key()
        {
            return this.#key || (this.length > 0 ? this[0] : _mt_str);
        }

        get value()
        {
            return this.#value || (this.length > 1 ? this[1] : null);
        }

        get type()
        {
            return this.#type;
        }

        get parent()
        {
            return this.#parent || (this.length > 2 ? this[2] : null);
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

                if ( detectCycles( stack, 5, 5 ) || depth > MAX_STACK_SIZE )
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
            let key = this.key;
            let value = this.value;

            if ( value instanceof this.constructor )
            {
                const { visited, stack, depth } = initializeRecursionArgs( pVisited, pStack, pDepth );

                if ( detectCycles( stack, 5, 5 ) || depth > 32 )
                {
                    return [key, [value?.key, value?.value, value?.parent], this.parent];
                }

                value = attempt( () => value.toArray( visited, [...stack, key], depth + 1 ) );
            }

            return [key, value, this.parent];
        }
    }

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
        let entries = isNonNullObj( pObject ) && !isKeyValueArray( pObject ) ? objectEntries( pObject ) : isArray( pObject ) ? [...pObject] : [pObject];

        let results = [];

        const visited = new Set();
        const stack = [];

        for( let entry of entries )
        {
            const key = ObjectEntry.getKey( entry );

            let value = ObjectEntry.getValue( entry );

            if ( !(isNull( key ) || isNull( value ) || key === _mt_str) )
            {
                if ( value instanceof ObjectEntry && value.isValid() )
                {
                    if ( detectCycles( stack, 5, 5 ) )
                    {
                        results.push( [key, value, value?.parent] );
                        results.push( [value?.key, value?.value, value?.parent] );
                        continue;
                    }

                    value = attempt( () => value.toArray( visited, [...stack, key], 0 ) );
                }
            }

            results.push( [key, value, pObject] );
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

    ObjectEntry.getKey = ( entry ) => isNull( entry ) ? _mt_str : entry?.key || entry[0] || _mt_str;
    ObjectEntry.getValue = ( entry ) => isNull( entry ) ? null : entry?.value || entry[1] || null;

    ObjectEntry.iterate = function( pObject, pVisitor, pOptions = {}, pVisited = new Set(), pStack = [] )
    {
        const options = populateOptions( pOptions, {} );

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
                    if( isNull( entry ) )
                    {
                        continue;
                    }

                    const key = ObjectEntry.getKey( entry );
                    const value = ObjectEntry.getValue( entry );

                    const quit = visitor.visit( entry, key, value, options );

                    if ( quit )
                    {
                        break;
                    }

                    if ( recursive && isNonNullObj( value ) && !detectCycles( stack, 5, 5 ) )
                    {
                        ObjectEntry.iterate( value, visitor, options, visited, [...stack, key] );
                    }

                    visited.add( value );
                }
            }

            visited.add( pObject );
        }

        return visitor;
    };

    const crypto = $scope().crypto || ((isDeno() && _ud !== typeof Deno) ? Deno.crypto : attempt( () => require( "node:crypto" ) )) || attempt( () => require( "crypto" ) );

    const UNIQUE_OBJECT_ID = Symbol.for( "__BOCK__UNIQUE_OBJECT_ID__" ) || Symbol( "__BOCK__UNIQUE_OBJECT_ID__" );
    const OBJECT_CREATED = Symbol.for( "__BOCK__OBJECT_CREATED__" ) || Symbol( "__BOCK__OBJECT_CREATED__" );

    if ( crypto )
    {
        try
        {
            Object.defineProperty( Object.prototype,
                                   UNIQUE_OBJECT_ID,
                                   {
                                       get: function()
                                       {
                                           this.__unique_object_id__ = (this.__unique_object_id__ || attempt( () => crypto.randomUUID() ));
                                           return this.__unique_object_id__ || new Date().getTime();
                                       },
                                       set: no_op,
                                       enumerable: false,
                                   } );

            Object.defineProperty( Object.prototype,
                                   "__GUID",
                                   {
                                       get: function()
                                       {
                                           return this[UNIQUE_OBJECT_ID] || this.__unique_object_id__ || attempt( () => crypto.randomUUID() );
                                       },
                                       set: no_op,
                                       enumerable: false,
                                   } );

            Object.prototype.getUniqueObjectInstanceId = function()
            {
                return this[UNIQUE_OBJECT_ID] || this.__GUID || this.__unique_object_id__;
            };
        }
        catch( ex )
        {
            // objects won't have a UNIQUE_OBJECT_ID unless they already do
        }
    }

    try
    {
        Object.defineProperty( Object.prototype,
                               OBJECT_CREATED,
                               {
                                   configurable: false,
                                   writable: false,
                                   enumerable: false,
                                   value: new Date().getTime()
                               } );

        Object.defineProperty( Error.prototype,
                               OBJECT_CREATED,
                               {
                                   configurable: false,
                                   writable: false,
                                   enumerable: false,
                                   value: new Date()
                               } );
    }
    catch( ex )
    {
        GLOBAL_INSTANCE.handleError( ex, exposeModule, "Could not define OBJECT_CREATED property on Object and Error prototypes" );
    }

    /**
     * Defines a constant for an invalid entry
     * @type {Readonly<ObjectEntry>}
     */
    ObjectEntry.INVALID_ENTRY = lock( new ObjectEntry() );

    const isNotTransient = e => !["__GUID", "__unique_object_id__", UNIQUE_OBJECT_ID].includes( e.key || e[0] );

    const isValidEntry = e => isArray( e ) && !(isNull( e[0] ) || isNull( e[1] ));

    const stringifyKeys = e => (isArray( e ) && (_symbol !== typeof e[0])) ? [(_mt_str + (e?.key || e[0])).trim().replace( /^#/, _mt_str ), (e?.value || e[1])] : isNull( e ) ? [_mt_str, null] : e;

    const processEntries = ( pEntries, pParent ) =>
    {
        let entries = pEntries.filter( isValidEntry ).map( stringifyKeys ).filter( isNotTransient );

        return [...(new Set( entries ))].filter( isValidEntry ).map( e => ObjectEntry.from( e[0], e[1], (pParent || e[2]) ) );
    };

    function extractClassSource( pObject )
    {
        const ctr = isClass( pObject ) || isFunc( pObject ) ? pObject : (pObject?.constructor || Object.getPrototypeOf( pObject )?.constructor);

        return isClass( ctr ) || isFunc( ctr ) ? functionToString.call( ctr ) : _mt_str;
    }

    function getPrivates( pObject, pCollection, pCallback )
    {
        if ( isNull( pObject ) )
        {
            return [];
        }

        let collection = (isArray( pCollection ) ? [...pCollection] : []) || [];

        let source = extractClassSource( pObject?.constructor || pObject?.prototype || pObject );

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
                    const value = attempt( () => pObject[name] );

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
        return getPrivates( pObject, [], ( collection, entry ) => collection.push( entry ) );
    }

    function populateDateEntries( pEntries, pDate )
    {
        const date = pDate || new Date();

        pEntries.push( ["string", date.toString()] );
        pEntries.push( ["isoString", date.toISOString()] );
        pEntries.push( ["localeString", date.toLocaleString()] );
        pEntries.push( ["timestamp", date.getTime()] );
        pEntries.push( ["day", date.getDay()] );
        pEntries.push( ["year", date.getFullYear()] );
        pEntries.push( ["month", date.getMonth()] );
        pEntries.push( ["date", date.getDate()] );
        pEntries.push( ["hours", date.getHours()] );
        pEntries.push( ["minutes", date.getMinutes()] );
        pEntries.push( ["seconds", date.getSeconds()] );
        pEntries.push( ["milliseconds", date.getMilliseconds()] );
    }

    function populateRegExpEntries( pEntries, pRx )
    {
        const rx = pRx || /_/;

        pEntries.push( ["pattern", rx.toString()] );
        pEntries.push( ["source", rx.source] );
        pEntries.push( ["flags", rx.flags || _mt_str] );
        pEntries.push( ["lastIndex", rx.lastIndex] );

        pEntries.push( ["global", rx.global] );
        pEntries.push( ["ignoreCase", rx.ignoreCase] );
        pEntries.push( ["multiline", rx.multiline] );
        pEntries.push( ["sticky", rx.sticky] );
        pEntries.push( ["unicode", rx.unicode] );
    }

    function getGlobalTypeEntries( pObject )
    {
        let entries = [];

        if ( !isNonNullObj( pObject ) || pObject === $scope() )
        {
            return [];
        }

        if ( isGlobalType( pObject ) )
        {
            entries.push( ["class", objectToString.call( pObject ).replace( /^\[object (.*)]$/, "$1" )] );
        }
        else if ( isClassInstance( pObject ) )
        {
            let source = functionToString.call( pObject?.constructor || pObject ).replace( /^\[object (.*)]$/, "$1" );
            entries.push( ["class", (source.replace( /\r\n/, _spc ).split( _spc ))[1]] );
        }

        if ( isFunc( pObject ) || pObject instanceof Function )
        {
            entries.push( ["name", pObject?.name || "anonymous"] );
            entries.push( ["length", pObject?.length || 0] );
        }

        if ( isDate( pObject ) )
        {
            populateDateEntries( entries, pObject );
        }

        if ( isRegExp( pObject ) )
        {
            populateRegExpEntries( entries, pObject );
        }

        if ( isPromise( pObject ) )
        {
            entries.push( ["status", pObject.status, pObject] );
            entries.push( ["reason", pObject.reason, pObject] );
        }

        if ( isError( pObject ) )
        {
            entries.push( ["type", objectToString.call( pObject ).replace( /^\[object (.*)]$/, "$1" ), pObject] );
            entries.push( ["name", pObject?.name || pObject?.type, pObject] );
            entries.push( ["message", pObject.message, pObject] );
            entries.push( ["stack", pObject.stack, pObject] );
        }

        return processEntries( entries, pObject );
    }

    const TYPE_DETECTORS = freeze(
        [
            { name: "map", method: isMap },
            { name: "set", method: isSet },
            { name: "array", method: isArray },

            { name: "class_instance", method: isClassInstance },
            { name: "global_type", method: isGlobalType }
        ] );

    function calculateObjectType( pObject, pTypeDetectors = TYPE_DETECTORS )
    {
        let objectType = _mt_str;

        let typeDetectors = [...new Set( [...(pTypeDetectors || []), ...TYPE_DETECTORS] )];

        while ( _mt_str === objectType && typeDetectors.length > 0 )
        {
            const detector = typeDetectors.shift();

            if ( detector.method( pObject ) )
            {
                objectType = detector.name || _mt_str;
                break;
            }
        }

        return objectType || "literal";
    }

    function getDefaultEntries( pObject )
    {
        let entries = [];

        [...Object.getOwnPropertyNames( pObject ),
         ...Object.getOwnPropertySymbols( pObject )].forEach( ( key ) =>
                                                              {
                                                                  const value = pObject[key];
                                                                  const entry = [key, value];
                                                                  if ( isValidEntry( entry ) )
                                                                  {
                                                                      entries.push( entry );
                                                                  }
                                                              } );
        return entries;
    }

    function initializeEntries( pObject )
    {
        return isArray( pObject ) ?
               pObject.map( ( e, i ) => [i, e] ) :
               isMap( pObject ) ?
                   [...pObject.entries()] :
               isSet( pObject ) ?
               ([...pObject.values()].map( ( e, i ) => [i, e] )) :
               Object.entries( pObject || {} );
    }

    function initializeRecursionArgs( pVisited, pStack, pDepth, pOptions )
    {
        const options = Object.assign( {}, { ...(pOptions || {}) } );

        return {
            visited: pVisited || options?.visited || new Set(),
            stack: [...(pStack || options?.stack || [])],
            depth: pDepth || options?.depth || 0
        };
    }

    function getEntriesForType( pObjectType, pObject, pEntries )
    {
        let entries = pEntries || [];

        const objectType = pObjectType || "literal";

        switch ( objectType )
        {
            case "literal":
                entries = Object.entries( pObject || {} ) || pEntries || [];
                break;

            case "class_instance":
                entries = [...(new Set( [...entries, ...getPrivateEntries( pObject )] ))];
            // do not break;
            // fall-through

            case "global_type":
                entries = [...(new Set( [...entries, ...(getGlobalTypeEntries( pObject ) || [])] ))];
                break;

            case "map":
                entries = [...pObject.entries()];
                break;

            case "set":
                entries = ([...pObject.values()].map( ( e, i ) => [i, e] ));
                break;

            case "array":
                entries = pObject.map( ( e, i ) => [i, e] );
                break;

            default:
                entries = getDefaultEntries( pObject );
                break;
        }

        return entries;
    }

    function getEntries( pObject, pVisited = new Set(), pStack = [], pDepth = 0 )
    {
        if ( !isNonNullObj( pObject ) )
        {
            return [];
        }

        if ( pObject instanceof ObjectEntry )
        {
            return [pObject];
        }

        let entries = initializeEntries( pObject );

        const { visited, stack, depth } = initializeRecursionArgs( pVisited, pStack, pDepth );

        if ( isInfiniteLoop( pObject, visited, stack, depth ) )
        {
            return entries;
        }

        const objectType = calculateObjectType( pObject );

        entries = getEntriesForType( objectType, pObject, entries );

        visited.add( pObject );

        return processEntries( entries, pObject );
    }

    function objectEntries( ...pObject )
    {
        let objects = isArray( pObject ) ? pObject.filter( isNonNullObj ) : [pObject];

        let entries = [];

        const populateEntry = e => isValidEntry( e ) ? entries.push( e ) : no_op();

        function updateEntries( pEntries )
        {
            if ( pEntries && isArray( pEntries ) && pEntries.length > 0 )
            {
                pEntries.forEach( populateEntry );
            }
        }

        if ( objects.length === 1 )
        {
            let object = objects[0];

            if ( isNonNullObj( object ) )
            {
                if ( pObject instanceof ObjectEntry )
                {
                    return [pObject];
                }

                const items = attempt( () => getEntries( object ) );

                updateEntries( items );

                entries = attempt( () => processEntries( entries, object || pObject ) );
            }
        }
        else
        {
            for( let object of objects )
            {
                const items = objectEntries( object );
                updateEntries( items );
            }
        }

        return entries.map( e => ObjectEntry.from( e ) );
    }

    function objectValues( pObject )
    {
        const values = (isNonNullObj( pObject ) ? Object.values( pObject || {} ) : []) || [];
        objectEntries( pObject ).forEach( e => values.push( e[1] ) );
        return [...(new Set( values.filter( e => _ud !== typeof e && null !== e ) ))];
    }

    function objectKeys( pObject )
    {
        const keys = (isNonNullObj( pObject ) ? Object.keys( pObject || {} ) : []) || [];
        objectEntries( pObject ).forEach( e => keys.push( e[0] ) );
        return [...(new Set( keys.filter( e => null != e && isStr( e ) ) ))];
    }

    const isTerminal = ( obj, lastObj ) => (obj === lastObj) ||
                                           obj === Object ||
                                           obj?.constructor === Object ||
                                           obj.constructor === Array ||
                                           obj === Array;

    function propertyDescriptors( pObject, pSearchPrototypeChain = true )
    {
        let obj = pObject;

        let lastObj = null;

        let descriptors = {};

        let objectProperties = {};

        const iterationCap = new IterationCap( 32 );

        while ( isNonNullObj( obj ) && !iterationCap.reached )
        {
            objectProperties = Object.getOwnPropertyDescriptors( obj || {} );

            descriptors = mergeObjects( descriptors, objectProperties );

            lastObj = obj;

            obj = pSearchPrototypeChain ? Object.getPrototypeOf( obj ) || obj?.constructor?.prototype : null;

            obj = (obj === lastObj || isTerminal( obj, lastObj )) ? null : obj;
        }

        return descriptors;
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
        const isValidPathElement = e => isValidArgument( e ) && /[^.\s#]+/.test( e );

        let propertyPath = arguments.length > 1 ? [...arguments].filter( isValidArgument ) : pPropertyPath;

        let arr = isArray( propertyPath ) ? propertyPath.map( toDotNotation ).flat() : propertyPath;

        arr = (isStr( arr ) ? bracketsToDots( arr, { numericIndexOnly: false } ).split( _dot ) : (isArray( arr ) ? arr.map( toDotNotation ).flat() : [String( arr )]).filter( isValidArgument )).flat();

        arr = arr.map( toDotNotation ).flat().map( removeOptionalSyntax ).flat();

        arr = arr.map( removeHashSign ).flat().filter( isValidArgument ).map( e => e.trim().replaceAll( /^\.+|\.+$/g, _mt_str ) ).filter( isValidArgument );

        return arr.filter( isValidPathElement );
    }

    function _property( pObject, pPropertyPath, pValue )
    {
        if ( !isNonNullObj( pObject ) )
        {
            return pObject;
        }

        let keys = toNodePathArray( pPropertyPath );

        let mutator = (arguments.length > 2 || !isNull( pValue )) ? ( object, key, value ) =>
        {
            object[key] = (keys.length > 0) ? {} : (value || pValue);
            return object[key];
        } : null;

        let value = pObject;

        while ( keys.length > 0 && isNonNullObj( value ) )
        {
            const key = String( keys.shift() ).trim().replace( /^#/, _mt_str );

            if ( isFunc( mutator ) )
            {
                value = mutator( value, key, pValue );
            }
            else
            {
                value = isArray( value ) && /^\d+$/.test( key ) ? value[Number( key )] : value[key];
            }
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
        return attempt( () => _property( pObject, pPropertyPath, pValue ) );
    }

    const hasProperty = ( pObject, pPropertyPath ) => !isNull( getProperty( pObject, pPropertyPath ) );

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

    const resolveComparator = ( pComparator ) => isFunc( pComparator?.compare ) ? pComparator : isFunc( pComparator ) ? { compare: pComparator } : { compare: ( a, b ) => 0 };

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
            return comparator.compare( pFirst, pSecond, pNullsFirst );
        }

        return null;
    };

    const mod =
        {
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

            functionToString,
            objectToString,
            errorToString,

            clamp,
            bracketsToDots,

            TYPES_CHECKS:
                {
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
                    isVisitor: Visitor.isVisitor
                },

            isObjectLiteral,
            isReadOnly,

            populateOptions,
            mergeOptions,

            canBind,
            bindMethod,

            isWritable,

            attempt,
            attemptMethod,
            asyncAttempt,
            asyncAttemptMethod,

            fireAndForget,
            executeCallback,

            asPhrase,

            objectEntries,

            objectValues,
            objectKeys,
            objectMethods,

            propertyDescriptors,

            toNodePathArray,
            getProperty,
            setProperty,
            hasProperty,

            lock,
            deepFreeze,

            localCopy,
            immutableCopy,

            compareNullable,

            __Error,
            ExecutionEnvironment,
            ExecutionMode,
            IllegalArgumentError,
            IterationCap,
            SourceInfo,
            StackTrace,
            StatefulListener,
            ObjectEntry,
            Visitor,

            isLogger: ToolBocksModule.isLogger,
            calculateErrorSourceName,

            getExecutionEnvironment: function()
            {
                return GLOBAL_INSTANCE.executionEnvironment;
            },
            getRuntimeLocale,
            getMessagesLocale,

            runtimeLocaleString,

            isFulfilled,
            isRejected,

            getGlobalLogger: function()
            {
                return ToolBocksModule.getGlobalLogger();
            },
            setGlobalLogger: function( pLogger )
            {
                ToolBocksModule.setGlobalLogger( pLogger );
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
                    IterationCap,
                    ModuleArgs,
                    ModuleEvent: ToolBocksModuleEvent,
                    ObjectEntry,
                    PromiseResult,
                    SourceInfo,
                    StackTrace,
                    StatefulListener,
                    ToolBocksModule,
                    Visitor
                }
        };

    // adds the module to module.exports (if it exists) and then returns the module
    return exportModule( mod, INTERNAL_NAME );

}( _ENV, ...CMD_LINE_ARGS ));
