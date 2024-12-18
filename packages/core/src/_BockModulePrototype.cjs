/**
 * @fileoverview
 * @name ModulePrototype
 *
 * This module is the 'bootstrap' module for modules in the ToolBocks packages.
 *
 * This module defines a base class that all the other modules extend
 * allowing their functions to report errors as events (instead of throwing),
 * allowing consumer code to add event listeners for error and other 'interesting' events,
 * and/or to set either a global logger or per-module loggers.
 *
 * Other useful functionality here includes:
 * <ul>
 * <li>ability to cap any iteration to a maximum number of loops</li>
 * <li>ability to create "deep" local and/or immutable copies of objects</li>
 * <li>ability to reliably process options passed to functions that have default options</li>
 * <li>and a factory for creating common comparison functions</li>
 * </ul>
 *
 *
 * @see BockModulePrototype
 * @see BockModuleEvent
 * @see __Error,
 * @see IllegalArgumentError
 * @see StackTrace
 * @see IterationCap
 * @see ComparatorFactory
 *
 * @author Scott Bockelman
 * @license MIT
 */

/* create an alias for console */
const konsole = console || {};

/* define a variable for typeof undefined */
const _ud = "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 * @return the global scope, a.k.a. globalThis for the current execution environment
 */
const $scope = function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? (_ud === typeof globalThis ? {} : globalThis || {}) : (global || (_ud === typeof globalThis ? {} : globalThis || {}) || {})) : (self || (_ud === typeof globalThis ? {} : globalThis || {})));
};

/**
 * This is the Immediately Invoked Function Expression (IIFE) that defines this module.
 * see: https://developer.mozilla.org/en-US/docs/Glossary/IIFE for more information on this design pattern
 * @emits event::load
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__MODULE_PROTOTYPE__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module.
     *
     * This is the only module that has NO DEPENDENCIES
     */
    const dependencies =
        {
            // this module has no dependencies
        };

    /**
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
            _unknown = "Unknown",

            S_LOG = "log",
            S_ERROR = "error",
            S_WARN = "warn",
            S_DEBUG = "debug",
            S_INFO = "info",
            S_TRACE = "trace",

            S_ERR_PREFIX = `An ${S_ERROR} occurred while`,
            S_DEFAULT_OPERATION = "executing script",

            EMPTY_OBJECT = Object.freeze( {} ),
            EMPTY_ARRAY = Object.freeze( [] )

        } = (dependencies || {});

    /**
     * Returns true if the specified argument is an array.
     * Some ancient environments did not define an isArray method on the built-in Array class,
     * so we define our own for safety.
     * @param pObject {any}
     * @returns {boolean} true if the specified argument is an array
     */
    function isArray( pObject )
    {
        return (_fun === typeof Array.isArray && Array.isArray( pObject )) || {}.toString.call( pObject ) === "[object Array]";
    }

    /**
     * This is the object used by some environments to export functionality.
     * In other environments, we just provide an empty object to avoid checking for the environment.
     * @type {NodeModule|{}}
     */
    const SCOPE_MODULE = (_ud !== typeof module) ? module : {};

    /**
     * Returns true if the execution context is most likely Node.js
     * by checking for the existence of a global 'module' property, a global function named 'require'
     * and the absence of globally defined symbols for 'self' and 'window'
     * @returns {boolean} true if the execution context is most likely Node.js
     */
    const isNode = function()
    {
        return (_ud === typeof self && _ud === typeof window) && (_ud !== typeof module) && (_fun === typeof require);
    };

    /**
     * This class defines a Custom Event other modules can use to communicate with interested consumers.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
     *
     * Use the 'detail' property to share data with event handlers
     * @class
     */
    class BockModuleEvent extends Event
    {
        #type;
        #detail;

        constructor( pEventName, pData )
        {
            super( (pEventName instanceof Event) ? (pEventName.type || pEventName.name) : pEventName );

            this.#type = ((pEventName instanceof Event) ? (pEventName.type || pEventName.name) : pEventName) || "BockModuleEvent";
            this.#detail = _obj === typeof pData ? (pData || ((pEventName instanceof Event) ? (pEventName.detail || {}) : pData || {})) : !(_ud === typeof pData || null == pData) ? { pData } : {};
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get type()
        {
            return this.#type || super.type;
        }

        get detail()
        {
            return this.#detail || super.detail;
        }
    }

    /**
     * If the environment does not define CustomEvent, define it to be our custom event, defined above
     */
    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = BockModuleEvent;
        $scope()["CustomEvent"] = CustomEvent;
    }

    /**
     * Defines a function that just does nothing.
     * This is useful when you need a default for a missing argument or expected function
     */
    function no_op()
    {
        // do nothing
    }

    /**
     * Defines a logger that implements the expected methods, but does not do anything.
     * This is used when logging is disabled,
     * which might be desirable if consumers prefer to handle errors via event listeners instead
     * @type {{warn: no_op, trace: no_op, debug: no_op, log: no_op, error: no_op, info: no_op}}
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

    /**
     * Returns true if the specified value is immutable.
     *
     * Examples of immutable values include:
     * - Objects that are frozen or sealed
     * - Properties of Objects that are defined as writable:false
     * - Strings, Numbers, Booleans, and Symbols
     * - null values, undefined values
     *
     * @param pObject {any} any object or value that might be immutable
     * @returns {boolean}
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
     * Defines the default value to use in recursive functions to bail out before causing a stack overflow.
     * Most functions that use recursion accept an options object that allows you to provide a different value for maxStackSize
     * @type {number}
     * @const
     */
    const MAX_STACK_SIZE = 32;

    /**
     * These are the default options used with the localCopy and immutableCopy functions.
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
            maxStackSize: MAX_STACK_SIZE,
            nullToEmptyObject: false,
            nullToEmptyArray: false,
            undefinedToNull: false,
            undefinedToEmptyObject: false,
            undefinedToEmptyArray: false,
            depth: 99,
            freeze: false
        } );

    /**
     * These are the default options used with the immutableCopy function.
     * Note that these are the same as the DEFAULT_COPY_OPTIONS but with 'freeze' set to true.
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
    const IMMUTABLE_COPY_OPTIONS = { ...DEFAULT_COPY_OPTIONS };
    IMMUTABLE_COPY_OPTIONS.freeze = true;

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

    /**
     * This is a 'helper' function for reading a numeric property of the localCopy or immutableCopy options
     * @param pOptions {object} an object expected to have a property with the name specified
     * @param pProperty {string} the name of the property
     * @param pDefault {number} the default value to return if the named option is not present or not a numeric value
     * @returns {number} an integer value representing the value of that property
     * @private
     */
    function _getNumericOption( pOptions, pProperty, pDefault )
    {
        const options = populateOptions( pOptions, DEFAULT_COPY_OPTIONS );
        const option = options[pProperty] || pDefault || 0;
        return Math.max( 0, parseInt( (_num === typeof option) ? option : ((/^[\d.]$/.test( option )) ? option : (_num === typeof pDefault ? pDefault : 0)) ) );
    }

    /**
     * This is a 'helper' function for reading the depth property of the localCopy or immutableCopy options
     * @param pOptions {object} an object expected to have a property named, depth
     * @returns {number} an integer value representing the value of that property
     * @private
     */
    function _getDepth( pOptions )
    {
        return _getNumericOption( pOptions, "depth", 0 );
    }

    /**
     * This is a 'helper' function for reading the maxStackSize property of the localCopy or immutableCopy options
     * @param pOptions {object} an object expected to have a property named, maxStackSize
     * @returns {number} an integer value representing the value of that property
     * @private
     */
    function _getMaxStackSize( pOptions )
    {
        return Math.min( MAX_STACK_SIZE, _getNumericOption( pOptions, "maxStackSize", MAX_STACK_SIZE ) );
    }

    /**
     * Calls Object::freeze on any defined non-null value specified and returns the _same_ object or value, now frozen
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
     * Returns a string compatible with the StackTrace parseFrame method
     *
     * @param pError {Error} an Error or a string representing a stack trace
     *
     * @returns {string} a string compatible with the StackTrace parseFrame method
     */
    function generateStack( pError )
    {
        let stack = pError instanceof Error ? pError?.stack : _str === typeof pError ? pError : _mt_str;

        if ( _ud === typeof stack || null == stack || _str !== typeof stack )
        {
            stack = pError?.toString() || ((pError?.name || pError?.type) + _colon + _spc + (_mt_str + pError?.message).replace( (pError?.name || pError?.type || "~!~"), _mt_str )) + "\n";

            stack += "at (" + (pError?.fileName || _unknown) + _colon + (pError?.lineNumber || _unknown) + _colon + (pError?.columnNumber || _unknown) + ")\n";
        }

        return stack;
    }

    /**
     * This class provides cross-environment functionality related to an error's stack (trace)
     * For more robust functionality, consider https://github.com/stacktracejs/stacktrace.js
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

        static get [Symbol.species]()
        {
            return this;
        }

        get stack()
        {
            return this.#stack || _mt_str;
        }

        get frames()
        {
            this.#frames = this.#frames?.length ? this.#frames : this.parseFrames();
            return this.#frames;
        }

        parseFrames()
        {
            let arr = [].concat( this.stack.split( /(\r\n)|\n/ ) );
            arr = arr.filter( e => (/(at)|@/).test( e ) ).map( e => e.replace( /at\s+([^ (]+)\s*/, "$1@" ).trim() );
            arr = arr.map( e => e.replaceAll( /[A-Z]:\\/g, _mt_str ).trim() );
            return arr.map( e => e.replaceAll( /[)(]/g, _mt_str ) ).map( e => e.replace( /@$/, _mt_str ).trim() );
        }

        parseFrame( pFrame )
        {
            let frame = _num === typeof pFrame ? this.frames[pFrame] : pFrame;

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
     * Defines a default error message to use if there is no message available for an error
     * @type {string}
     * @const
     */
    const DEFAULT_ERROR_MSG = [S_ERR_PREFIX, S_DEFAULT_OPERATION].join( _spc );

    /**
     * This class allows custom Errors to be defined.
     * This class and its subclasses also provide a stack trace regardless of browser or environment
     * @class
     * @extends Error
     * @see StackTrace
     */
    class __Error extends Error
    {
        #msg;
        #options;

        #type;
        #name;
        #cause;

        #trace;

        constructor( pMessage, pOptions )
        {
            super( (_str === typeof pMessage ? (pMessage || DEFAULT_ERROR_MSG) : ((pMessage instanceof Error) ? (pMessage.message || pMessage.name || DEFAULT_ERROR_MSG) : DEFAULT_ERROR_MSG)) );

            this.#type = ((pMessage instanceof Error) ? pMessage.type || pMessage.name : (this.constructor?.name)).replace( /^__/, _mt_str );
            this.#name = ((pMessage instanceof Error) ? pMessage.name || pMessage.type : (this.constructor?.name)).replace( /^__/, _mt_str );

            if ( Error.captureStackTrace )
            {
                Error.captureStackTrace( this, this.constructor );
            }

            this.#msg = (_str === typeof pMessage) ? (pMessage || super.message) : ((pMessage instanceof Error) ? pMessage.message || super.message : DEFAULT_ERROR_MSG);

            this.#options = immutableCopy( pOptions || {} );

            this.#cause = (this.#options?.cause instanceof Error ? this.#options?.cause : (pMessage instanceof Error ? pMessage : null) || (pMessage instanceof Error ? pMessage : null));
        }

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
            this.#cause = this.#cause || (this.#options?.cause instanceof Error ? this.#options?.cause : super.cause) || super.cause;
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

    /**
     * This subclass of Error is useful when validating function arguments.
     * The message property is overwritten to include the prefix 'IllegalArgumentException',
     * so that if only the message is logged, the type of error is not obscured
     * @class
     * @extends __Error
     */
    class IllegalArgumentError extends __Error
    {
        constructor( pMessage, pOptions )
        {
            super( pMessage, pOptions );

            if ( Error.captureStackTrace )
            {
                Error.captureStackTrace( this, this.constructor );
            }
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    /**
     * Returns an instance of the custom __Error class from the arguments specified.
     * If the first argument is already an instance of __Error, just returns that instance.
     * If the first argument is an instance of Error, constructs a new __Error,
     * using the provided error's name and setting this instance's cause to the specified error.
     * If a string is specified for the second argument, that string is used as the message for the returned Error
     * @param pError {Error|string} perhaps an Error or a string with which to create a new Error
     * @param pMessage {string|Error} a string to use as the message property of the returned Error or an Error whose message will be used instead
     * @returns {__Error} an Error (actually an instance of __Error, which provides an environment-agnostic stack trace)
     */
    function resolveError( pError, pMessage = DEFAULT_ERROR_MSG )
    {
        if ( pError instanceof Error )
        {
            return new __Error( pError );
        }

        let cause = pError instanceof Error ? pError : pMessage instanceof Error ? pMessage : null;

        return new __Error( (pMessage || pError || DEFAULT_ERROR_MSG), { cause } );
    }

    /**
     * Returns a string used when emitting the error event from a function or method.
     * Constructs a string of the form {ModuleName}::{FunctionName}
     * @param pModule {string} the name of the module in which the error occurred
     * @param pFunction {string|function} the name of the function (or the function itself) in which the error occurred
     * @returns {string} a string used when emitting the error event from a function or method
     */
    const calculateErrorSourceName = function( pModule, pFunction )
    {
        const modName = _obj === typeof pModule ? (pModule?.moduleName || pModule?.name) : _str === typeof pModule ? pModule : _unknown;
        const funName = _fun === typeof pFunction ? (pFunction?.name || "anonymous") : _str === typeof pFunction ? pFunction : _unknown;

        return (modName || pModule) + _colon + _colon + (funName || pFunction);
    };

    /**
     * An internal cache of constructed and loaded modules
     * @type {object}
     * @dict
     * @private
     */
    const MODULE_CACHE = {};

    /**
     * This is the base class for all the ToolBocks modules.
     * It extends EventTarget to allow module functions to emit events when errors occur
     * or when other 'interesting' events occur.
     *
     * Consuming code can add event listeners to react appropriately.
     * An example would be to use event handlers to log errors,
     * allowing the consumer code to use whatever mechanism is desired for logging,
     * rather than this library spewing unnecessarily to the console.
     *
     * Module documentation will list all the events (other than "error") for which a consumer might listen.
     */
    class BockModulePrototype extends EventTarget
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

        /**
         * Constructs a new instance, or module, to expose functionality to consumers.
         *
         * @param pModuleName {string|BockModulePrototype} the name of this instance,
         *                                                 or another instance from which to inherit the name and other properties
         * @param pCacheKey {string} a unique key to use to cache this module in global scope to improve performance
         */
        constructor( pModuleName, pCacheKey )
        {
            super();

            this.#moduleName = (_str === typeof pModuleName) ? pModuleName || "BockModulePrototype" : (_obj === typeof pModuleName ? pModuleName?.moduleName || pModuleName?.name : _mt_str) || "BockModulePrototype";
            this.#cacheKey = (_str === typeof pCacheKey) ? pCacheKey || INTERNAL_NAME : (_obj === typeof pModuleName ? pModuleName?.cacheKey || pModuleName?.name : _mt_str);

            // if the constructor is called with an object, instead of a string, inherit its properties and functions
            if ( _obj === typeof pModuleName )
            {
                this.extend( pModuleName );
            }

            MODULE_CACHE[this.#moduleName] = this;
            MODULE_CACHE[this.#cacheKey] = this;
        }

        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Returns the global scope (globalThis) in which this code is executing
         * @returns {object}
         */
        get globalScope()
        {
            return $scope();
        }

        /**
         * Returns the name of this module
         * @returns {string} the name of this module
         */
        get moduleName()
        {
            return this.#moduleName || this.#cacheKey;
        }

        /**
         * Returns the key under which this module may be cached in the global scope
         * @returns {string} the key under which this module may be cached in the global scope
         */
        get cacheKey()
        {
            return this.#cacheKey || this.#moduleName;
        }

        /**
         * Returns a string used when emitting the error event from a function or method.
         * Constructs a string of the form {ModuleName}::{FunctionName}
         * @param pModuleName {string} the name of the module in which the error occurred
         * @default the name of this module
         * @param pFunction {string|function} the name of the function (or the function itself) in which the error occurred
         * @returns {string} a string used when emitting the error event from a function or method
         */
        calculateErrorSourceName( pModuleName, pFunction )
        {
            return calculateErrorSourceName( (pModuleName || this.moduleName), pFunction );
        }

        /**
         * Returns the instance-specific logger for this module
         * or the global logger, if no instance-specific logger is defined.
         *
         * If logging is disabled, this property returns a Mock logger.
         * If logging is enabled, but neither an instance-specific nor a global logger is specified, returns the Console object
         *
         * @returns {object|MockLogger} an object with the following methods: log, info, warn, debug, error, and trace
         */
        get logger()
        {
            let logger;

            if ( this.#loggingEnabled )
            {
                if ( BockModulePrototype.#globalLoggingEnabled )
                {
                    logger = BockModulePrototype.getGlobalLogger();
                }

                logger = this.#logger || logger || konsole;
            }

            return logger || MockLogger;
        }

        /**
         * Defines an instance-specific logger (if the specified argument defines the 6 required methods, log, info, warn, error, debug, and trace)
         * @param pLogger an object defining the 6 required methods, log, info, warn, error, debug, and trace
         */
        set logger( pLogger )
        {
            if ( BockModulePrototype.isLogger( pLogger ) )
            {
                this.#logger = pLogger;
            }
        }

        /**
         * Disables logging for this instance.
         * If you want to add an event listener for errors and warnings instead,
         * you may want to call this method to avoid redundant logging
         */
        disableLogging()
        {
            this.#loggingEnabled = false;
        }

        /**
         * Enables logging for this instance.
         * This instance will write to either the instance-specific logger, the global logger, or the console,
         * depending on whether a logger has been set at either the global or instance level
         */
        enableLogging()
        {
            this.#loggingEnabled = true;
        }

        /**
         * Returns true of the specified object implements the 6 expected methods:
         * log, info, warn, error, debug, and trace
         *
         * @param pLogger {object} an object that may or may not be a logger
         * @returns {boolean} true of the specified object implements the 6 expected methods:
         * log, info, warn, error, debug, and trace
         */
        static isLogger( pLogger )
        {
            return (_obj === typeof pLogger
                    && null !== pLogger
                    && _fun === typeof pLogger[S_LOG]
                    && _fun === typeof pLogger[S_INFO]
                    && _fun === typeof pLogger[S_WARN]
                    && _fun === typeof pLogger[S_DEBUG]
                    && _fun === typeof pLogger[S_ERROR]);
        }

        /**
         * Defines a logger to use for any module that does not have an instance-specific logger
         * @param pLogger an object defining the 6 required methods, log, info, warn, error, debug, and trace
         */
        static setGlobalLogger( pLogger )
        {
            if ( BockModulePrototype.isLogger( pLogger ) )
            {
                BockModulePrototype.#globalLogger = pLogger;
            }
        };

        /**
         * Returns the logger used for any module that does not have an instance-specific logger
         * or null if no global logger is defined
         * @returns {object|null}
         */
        static getGlobalLogger()
        {
            return BockModulePrototype.#globalLogger;
        }

        /**
         * Disables logging for any module that does not define an instance-specific logger
         */
        static disableGlobalLogger()
        {
            BockModulePrototype.#globalLoggingEnabled = false;
        }

        /**
         * Enables logging for any module that does not define an instance-specific logger
         * or that has not disabled logging at the instance-level
         */
        static enableGlobalLogger()
        {
            BockModulePrototype.#globalLoggingEnabled = true;
        }

        /**
         * Notifies event handlers listening for the "error" event of the error encountered.
         * Also, optionally, writes to the logger defined, if logging is enabled
         *
         * The event object passed to the event handlers includes a detail property with...
         * the Error object,
         * a message,
         * the log level (for example, error, info, warn, etc.),
         * and the 'source' of the error (a string description of the module and function where the error occurred)
         *
         * @param pError {Error} the error encountered
         * @param pMessage {string} a specific error message relevant to the occurrence
         * @param pLevel {string} the log level suggested for the error, such as "warn" or "error"
         * @param pSource {string} a description of the source of the error, such as the module and function where the error occurred
         * @param pExtra {...any} one or more extra values to log or include in the dispatched event
         * @see resolveError
         * @see calculateErrorSourceName
         *
         */
        reportError( pError, pMessage = pError?.message || S_DEFAULT_OPERATION, pLevel = S_ERROR, pSource = _mt_str, ...pExtra )
        {
            try
            {
                const s = _mt_str + (pMessage || pError?.message || S_DEFAULT_OPERATION);

                const err = resolveError( pError, s );

                let msg = [S_ERR_PREFIX, s, err, ...pExtra];

                let level = (_mt_str + pLevel).trim().toLowerCase();

                level = [S_LOG, S_INFO, S_WARN, S_DEBUG, S_ERROR].includes( level || S_ERROR ) ? level : S_ERROR;

                try
                {
                    if ( BockModulePrototype.isLogger( this.logger ) )
                    {
                        this.logger[level]( ...msg );
                    }
                }
                catch( ex2 )
                {
                    konsole.error( ex2, ...msg );
                }

                try
                {
                    this.dispatchEvent( new CustomEvent( S_ERROR,
                                                         {
                                                             error: err,
                                                             message: msg.filter( e => _str === typeof e ).join( _spc ),
                                                             level: level,
                                                             method: _mt_str + ((_mt_str + pSource) || this.moduleName || "BockModule"),
                                                             extra: [...pExtra]
                                                         } ) );
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
         * @param pObject {object} an object defining one or more properties or methods to add to this module
         * @returns {BockModulePrototype} this instance, now augmented with the properties and methods of the specified object
         */
        extend( pObject )
        {
            if ( null != pObject && _obj === typeof pObject )
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

                let modulePrototype = new BockModulePrototype( pObject );

                return Object.assign( modulePrototype, pObject );
            }

            return this;
        }

        /**
         * Exports this module for use in other modules or consumer applications.
         * In some environments, this adds this instance to module/exports, which must be passed in.
         * In other environments, this method just returns the module, after caching it in the global scope.
         *
         * @param pObject {object} another module or object whose properties and functions will be added to this instance
         * @param pCacheKey {string} a unique key under which to cache this module in the global scope
         * @param pModuleScope {NodeModule} the local module object from which the object is defined
         *
         * @returns {BockModulePrototype} this instance, potentially extended with properties and functions from the specified object
         *
         * Emits a "load" event with this module as its detail data
         * @emits event::load
         */
        expose( pObject, pCacheKey, pModuleScope = SCOPE_MODULE )
        {
            let mod = pObject || this;

            if ( null != mod && _obj === typeof mod && !(mod instanceof this.constructor) )
            {
                mod = this.extend( mod );
            }

            const MODULE = pModuleScope || (_ud !== typeof module ? module : {});

            if ( _ud !== typeof MODULE )
            {
                MODULE.exports = lock( mod || this );
            }

            const key = _str === typeof pCacheKey ? (_mt_str + pCacheKey).trim() : _mt_str;

            if ( $scope() && _mt_str !== key.trim() )
            {
                $scope()[key] = lock( mod || this );
            }

            mod.dispatchEvent( new CustomEvent( "load", mod ) );

            return lock( mod || this );
        }

        /**
         * Asynchronously extend this module and emit the load event when complete
         * @param pObject {object} another module or object whose properties and functions will be added to this instance
         * @returns {Promise<BockModulePrototype>} a Promise that resolves to the updated module
         */
        async enhance( pObject )
        {
            const mod = this.extend( pObject );

            dispatchEvent( new CustomEvent( "load", mod ) );

            return mod;
        }

        /**
         * This is a static factory method to construct new instance of the ModulePrototype
         * @param pModuleName {string} the name of the module to construct
         * @param pCacheKey {string} a key that may be used to cache the module in the global scope
         * @param pObject {object} (optional) another module or object whose properties and functions will be added to the new instance
         * @returns {BockModulePrototype} a newly constructed Module with the specified name
         */
        static create( pModuleName, pCacheKey, pObject )
        {
            let modulePrototype = (_str === typeof pModuleName) ? MODULE_CACHE[pModuleName] : null;
            modulePrototype = modulePrototype || (_str === typeof pCacheKey ? MODULE_CACHE[pCacheKey] : new BockModulePrototype( pModuleName, pCacheKey ));
            modulePrototype = modulePrototype || new BockModulePrototype( pModuleName, pCacheKey );

            if ( null != pObject && _obj === typeof pObject )
            {
                modulePrototype.extend( pObject );
            }

            return modulePrototype;
        }
    }

    /**
     * Defines a private instance of the ModulePrototype
     * to be used in functions that are not defined as methods
     * @see _copy
     * @type {BockModulePrototype}
     */
    const GLOBAL_INSTANCE = new BockModulePrototype( "GLOBAL_INSTANCE", "__BOCK__MODULE_PROTOTYPE_GLOBAL_INSTANCE__" );

    MODULE_CACHE["GLOBAL_INSTANCE"] = GLOBAL_INSTANCE;
    MODULE_CACHE["__BOCK__MODULE_PROTOTYPE_GLOBAL_INSTANCE__"] = GLOBAL_INSTANCE;

    /**
     * Makes the specified object available as module that can be imported or required by other code
     * @param pObject {object|BockModulePrototype} the object or module to export
     * @param pCacheKey {string} a key under which the exported module may be cached
     * @returns {BockModulePrototype} the exported module
     */
    function exportModule( pObject, pCacheKey )
    {
        let mod = pObject;

        if ( null != mod && _obj === typeof mod && (mod instanceof BockModulePrototype) )
        {
            return mod.expose( mod, pCacheKey );
        }

        let modulePrototype = new BockModulePrototype( mod, pCacheKey );

        mod = modulePrototype.extend( mod || pObject );

        return mod.expose( mod, pCacheKey );
    }

    BockModulePrototype.exportModule = exportModule;

    /**
     * Asynchronously import a module into the current scope
     * @param pModulePath {string} the name of, or filepath to, the required module
     * @returns {Promise<BockModulePrototype>} a Promise that resolves to the requested module
     */
    async function requireModule( pModulePath )
    {
        let mod = MODULE_CACHE[pModulePath];

        if ( null != mod && mod instanceof BockModulePrototype )
        {
            return mod;
        }

        if ( isNode() )
        {
            try
            {
                mod = require( pModulePath );
            }
            catch( ex )
            {
                GLOBAL_INSTANCE.reportError( ex, `requiring module ${pModulePath}`, S_ERROR, "Module::requireModule" );
            }
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

        if ( _obj === typeof mod && null != mod )
        {
            mod = new BockModulePrototype( mod );

            GLOBAL_INSTANCE.dispatchEvent( new CustomEvent( "load", mod ) );
        }

        return mod;
    }

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

        const maxStackSize = _getMaxStackSize( options );
        options.maxStackSize = maxStackSize;

        if ( stack.length > maxStackSize )
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
                                        GLOBAL_INSTANCE.reportError( ex, key + " could not be bound to the clone", S_WARN, this?.name );
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

    /**
     * Attempts to coerce, or cast, the specified value to the specified type
     * @param pValue {any} a value to convert to another type, if possible
     * @param pType {string|function} the type or class to which to convert the specified value
     * @param pStack USED INTERNALLY TO PREVENT INFINITE RECURSION
     * @returns {Date|string[]|bigint|number|symbol|*|(function(): *)|string|boolean|(function(): *)}
     * @private
     */
    const _coerce = function( pValue, pType, pStack = [] )
    {
        let a = (_ud === typeof pValue || null === pValue) ? null : pValue;

        let type = pType || typeof a;

        type = (_validTypes.includes( type ) || _fun === typeof type) ? type : typeof a;

        if ( type === typeof a || (_fun === typeof type && a instanceof type) )
        {
            return a;
        }

        const stack = pStack || [];

        if ( (stack?.length || 0) > MAX_STACK_SIZE )
        {
            GLOBAL_INSTANCE.reportError( (new __Error( "Maximum Stack Size Exceeded" )), "Maximum Stack Size Exceeded while coercing a value to another type", S_WARN, this?.name );

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
                return Symbol.for( (_mt_str + _coerce( a, _str, stack.concat( a ) )) );

            case _obj:
                return [(_mt_str + _coerce( a, _str, stack.concat( a ) ))];

            default:
                if ( type === Date || typeof type === Date )
                {
                    return new Date( _coerce( a, _num, stack.concat( a ) ) );
                }

                if ( type === RegExp || typeof type === RegExp )
                {
                    let regExp = _coerce( a, _str, stack.concat( a ) );

                    try
                    {
                        regExp = new RegExp( regExp );
                    }
                    catch( ex )
                    {

                    }

                    return regExp;
                }

                return _coerce( a, typeof type, stack.concat( a ) );
        }
    };

    /**
     * These are default options for the ComparatorFactory class.
     * @const
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
            coerce: false,
            maxStackSize: MAX_STACK_SIZE
        };

    /**
     * This class can be used to create generic comparators.
     *
     * The options (and their corresponding properties) can be used to control
     * the following rules for the comparisons:
     *
     * strict {boolean} if true, values compared must be of the same type and no type coercion will be used
     *
     * nullsFirst {boolean} pass true if null values should be considered less than other values,
     *                           false if they should be considered greater than other values
     *
     * reverse {boolean} pass true to order values in reverse order (i.e., descending versus ascending)
     *
     * caseSensitive {boolean} [DEFAULTS TO TRUE] pass false if you want string comparisons to ignore case
     *
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
        #maxStackSize = MAX_STACK_SIZE;

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
            this.#maxStackSize = Math.max( 2, _getMaxStackSize( options ) );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get type()
        {
            return this.#type || "*";
        }

        set type( pType )
        {
            this.#type = pType || this.#type;
        }

        get maxStackSize()
        {
            return (_num === typeof this.#maxStackSize ? Math.max( 2, Math.min( this.#maxStackSize, MAX_STACK_SIZE ) ) : MAX_STACK_SIZE);
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
                coerce: (false === overrides?.coerce ? false : overrides?.coerce || this.coerce),
                maxStackSize: Math.max( 2, Math.min( _num === typeof overrides?.maxStackSize ? overrides?.maxStackSize : this.maxStackSize, MAX_STACK_SIZE ) ),
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

            let stack = options.stack || [];

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
                                    comp = this._compare( a[i], b[i], { stack, ...options } );
                                }
                            }
                        }

                        comp = a.length > 1 ? 1 : comp = a.length > 0 ? this._compare( a[0], b, { stack, ...options } ) : _mt_str === (_mt_str + b) ? 0 : -1;

                        break;
                    }
                    else if ( isArray( b ) )
                    {
                        comp = b.length > 1 ? -1 : comp = b.length > 0 ? this._compare( a, b[0], { stack, ...options } ) : _mt_str === (_mt_str + a) ? 0 : 1;
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

                        comp = this._compare( propValue, otherValue, { stack, ...options } );

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

        /**
         * Returns a function that can be passed to the 'sort' method of an order-able object, such as Array
         * @returns {function(*, *): number} a function that can be passed to the 'sort' method of an order-able object, such as Array
         */
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

        /**
         * Returns a function to sort elements or properties of an order-able object, such as an array
         * that treats null values as less than any other values
         * @see ComparatorFactory#comparator
         * @returns {function(*, *): number}
         */
        nullsFirstComparator()
        {
            const options = this._copyOptions( { nullsFirst: true } );
            return new ComparatorFactory( this.type, options ).comparator();
        }

        /**
         * Returns a function to sort elements or properties of an order-able object, such as an array
         * that treats null values as greater than any other values
         * @see ComparatorFactory#comparator
         * @returns {function(*, *): number}
         */
        nullsLastComparator()
        {
            const options = this._copyOptions( { nullsFirst: false } );
            return new ComparatorFactory( this.type, options ).comparator();
        }

        /**
         * Returns a function to sort elements or properties of an order-able object, such as an array
         * that compares string values without regard to case
         * @see ComparatorFactory#comparator
         * @returns {function(*, *): number}
         */
        caseInsensitiveComparator()
        {
            const options = this._copyOptions( { caseSensitive: false, type: "string" } );
            return new ComparatorFactory( options?.type || this.type, options ).comparator();
        }

        /**
         * Returns a function to sort elements or properties of an order-able object, such as an array
         * that will reverse the order ordinarily obtained
         * @see ComparatorFactory#comparator
         * @returns {function(*, *): number}
         */
        reverseComparator()
        {
            const options = this._copyOptions( { reverse: true } );
            return new ComparatorFactory( this.type, options ).comparator();
        }
    }

    /**
     * This is the maximum allowed value for instances of the IterationCap class
     * @type {number} the maximum allowed value for instances of the IterationCap class
     * @const
     */
    const MAX_ITERATIONS = 10_000;

    /**
     * This class allows us to easily cap an iteration, such as a 'for' loop or a 'while' loop.
     * If there is any chance that an iteration might never complete,
     * use an instance of IterationCap to limit the iteration to a finite number of executions
     *
     * @example
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

    /**
     * Defines the properties and functions to export as a module.
     * Note that this object will be assigned to an instance of BockModulePrototype before it is exported/returned
     */
    const mod =
        {
            BockModuleEvent,
            BockModulePrototype,
            CustomEvent,
            isLogger: BockModulePrototype.isLogger,
            calculateErrorSourceName,
            reportError: function( pThis, pError, pMessage = pError?.message || S_DEFAULT_OPERATION, pLevel = S_ERROR, pSource = _mt_str, ...pExtra )
            {
                if ( pThis instanceof BockModulePrototype )
                {
                    pThis.reportError( pError, pMessage, pLevel, pSource, ...pExtra );
                }
                const modulePrototype = new BockModulePrototype( pThis?.name );
                modulePrototype.reportError.call( pThis || modulePrototype, pError, pMessage, pLevel, pSource );
            },
            getGlobalLogger: function()
            {
                return BockModulePrototype.getGlobalLogger();
            },
            setGlobalLogger: function( pLogger )
            {
                BockModulePrototype.setGlobalLogger( pLogger );
            },
            exportModule,
            requireModule,
            importModule: requireModule,

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

            resolveError,

            EMPTY_OBJECT,
            EMPTY_ARRAY,

            isReadOnly,
            populateOptions,
            lock,
            deepFreeze,
            DEFAULT_COPY_OPTIONS,
            localCopy,
            immutableCopy,

            StackTrace,
            __Error,
            IllegalArgumentError,
            IterationCap,
            ComparatorFactory
        };

    return exportModule( mod, INTERNAL_NAME );

}());
