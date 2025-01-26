/**
 * @fileoverview
 * @name ModulePrototype
 * @author Scott Bockelman
 * @license MIT
 *
 * <p>This module is the 'bootstrap' module for all modules in the ToolBocks&trade; packages.</p>
 * <p>This module defines a base class that all the other modules extend<br>
 * allowing their functions to report errors as events (instead of throwing),<br>
 * allowing consumer code to add event listeners for error and other 'interesting' events,<br>
 * and/or to set either a global logger or per-module loggers.</p>
 * <br>
 *
 * <p>Other useful functionality defined in this module includes:<br>
 * <ul>
 * <li>the ability to cap any iteration to a maximum number of loops</li>
 * <li>the ability to create "deep" local and/or immutable copies of objects</li>
 * <li>the ability to reliably process options passed to functions that have default options</li>
 * <li>and a factory for creating common comparison functions</li>
 * </ul>
 * <br>
 * </p>
 *
 * @see BockModulePrototype
 * @see BockModuleEvent
 * @see {@link __Error},
 * @see IllegalArgumentError
 * @see StackTrace
 * @see IterationCap
 * @see {@link ComparatorFactory}
 *
 * <br>
 */

/**
 * An alias for the console object available in most environments.<br>
 * We create an alias for console to reduce lint complaints.<br>
 * @type {ILogger|console|Console|{}}
 */
const konsole = console || {};

// defines a variable for typeof undefined
const _ud = "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 * @return {Object} The global scope, a.k.a. globalThis, for the current execution environment
 */
const $scope = () => (_ud === typeof self ? ((_ud === typeof global) ? (_ud === typeof globalThis ? {} : globalThis || {}) : (global || (_ud === typeof globalThis ? this || {} : globalThis || this || {}) || this || {})) : (self || (_ud === typeof globalThis ? this || {} : globalThis || this || {})));

const ENV = (_ud !== typeof process ? process.env : ($scope() || {})["__BOCK_MODULE_ENVIRONMENT__"] || { "MODE": "DEV" });

const CMD_LINE_ARGS = [...(_ud !== typeof process ? process.argv || [] : [])];

/**
 * This module is constructed by an Immediately Invoked Function Expression (IIFE).
 * see: <a href="https://developer.mozilla.org/en-US/docs/Glossary/IIFE">MDN: IIFE</a> for more information on this design pattern
 */
(function exposeModule( pEnvironment = (ENV || {}), ...pArgs )
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__MODULE_PROTOTYPE__";

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
            _unknown = "Unknown",

            S_NONE = "none",
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

    const modName = "BockModulePrototype";

    /**
     * Returns true if the specified argument is an array.<br>
     * Some ancient environments did not define an isArray method on the built-in Array class,
     * so we define our own for safety.<br>
     * @param {*} pObject A value to evaluate
     * @returns {boolean} true if the specified argument is an array
     */
    function isArray( pObject )
    {
        return (_fun === typeof Array.isArray && Array.isArray( pObject )) || {}.toString.call( pObject ) === "[object Array]";
    }

    /**
     * Returns a non-null object. Returns the specified object if meets the criteria of being a non-null object.<br>
     * @param {*} pObject The object to return if it is actually a non-null object
     * @param {boolean} [pAcceptArray=false] Whether to treat an array as an object for this purpose
     * @returns {Object} The object specified if it is a non-null object or an empty object; never returns null.
     * @private
     */
    function resolveObject( pObject, pAcceptArray = false )
    {
        return (_obj === typeof pObject && null != pObject) ? (!!pAcceptArray || !isArray( pObject ) ? pObject : {}) : {};
    }

    const S_DEFAULT_ERROR_MESSAGE = [S_ERR_PREFIX, S_DEFAULT_OPERATION].join( _spc );

    class Args
    {
        #args = [];
        #map = {};

        constructor( ...pArgs )
        {
            if ( pArgs && isArray( pArgs ) && pArgs.length > 0 )
            {
                this.#args = [...pArgs];

                const populateMap = e =>
                {
                    const parts = e.split( "=" );
                    const key = (parts.length ? parts[0].trim() : _mt_str).trim();
                    const value = parts.length > 1 ? parts[1]?.trim() : key;

                    if ( key && value )
                    {
                        this.#map[key] = value;
                        this.#map[key.toLowerCase()] = value;
                        this.#map[key.toUpperCase()] = value;
                    }
                };

                if ( this.#args.length > 0 )
                {
                    this.#args.filter( e => null != e && _str === typeof e ).forEach( populateMap );
                }
            }
        }

        get args()
        {
            return [...(this.#args || [])];
        }

        get map()
        {
            return new Map( Object.entries( this.#map ) );
        }

        get( pKey, pDefaultValue )
        {
            let keys = [pKey, pKey.toLowerCase(), pKey.toUpperCase()];
            let values = keys.map( e => this.#map[e] );
            let value = values.find( e => null != e );
            return value || pDefaultValue;
        }
    }

    class ModuleArgs extends Args
    {
        constructor( ...pArgs )
        {
            super( ...pArgs );
        }
    }

    class CmdLineArgs extends Args
    {
        constructor( ...pArgs )
        {
            super( ...pArgs );
        }
    }

    const MODULE_ARGUMENTS = new ModuleArgs( ...pArgs );

    const ARGUMENTS = new CmdLineArgs( CMD_LINE_ARGS || (_ud === typeof process ? process.argv : []) );

    const ENVIRONMENT = resolveObject( pEnvironment || ENV, false );

    class ExecutionMode
    {
        #name;
        #traceEnabled;

        constructor( pName, pTraceEnabled = false )
        {
            this.#name = (_mt_str + (pName || S_NONE)).trim().toUpperCase();
            this.#traceEnabled = !!pTraceEnabled;
        }

        get name()
        {
            return (_mt_str + this.#name).trim().toUpperCase();
        }

        get traceEnabled()
        {
            return this.#traceEnabled;
        }

        trace( pMsg )
        {
            konsole.trace( pMsg, this );
        }
    }

    ExecutionMode.MODES =
        {
            NONE: Object.freeze( new ExecutionMode( S_NONE, false ) ),
            PROD: Object.freeze( new ExecutionMode( "PRODUCTION", false ) ),
            DEV: Object.freeze( new ExecutionMode( "DEVELOPMENT", false ) ),
            DEBUG: Object.freeze( new ExecutionMode( "DEBUG", true ) ),
            TEST: Object.freeze( new ExecutionMode( "TEST", true ) ),
            TRACE: Object.freeze( new ExecutionMode( "TRACE", true ) )
        };

    Object.entries( ExecutionMode.MODES ).forEach( ( [key, value] ) =>
                                                   {
                                                       ExecutionMode[key] = value;
                                                   } );

    ExecutionMode.MODES.DEFAULT = Object.freeze( ExecutionMode.MODES.DEV );
    ExecutionMode.DEFAULT = Object.freeze( ExecutionMode.MODES.DEFAULT );

    const CURRENT_MODE = Object.freeze( ExecutionMode.MODES[ENVIRONMENT.MODE] || ExecutionMode.MODES[ARGUMENTS.get( "mode" )] || ExecutionMode.DEFAULT );
    ExecutionMode.CURRENT = Object.freeze( CURRENT_MODE );

    ExecutionMode.defineMode = function( pName, pTraceEnabled = false )
    {
        if ( pName && pName.length > 0 )
        {
            const name = (_mt_str + (pName || S_NONE)).trim().toUpperCase();
            const traceEnabled = !!pTraceEnabled;

            if ( null == ExecutionMode[name] )
            {
                const executionMode = new ExecutionMode( name, traceEnabled );

                ExecutionMode.MODES[name] = Object.freeze( executionMode );
                ExecutionMode[name] = Object.freeze( executionMode );

                return executionMode;
            }
        }
        throw new Error( `Invalid or existing mode name: ${pName}` );
    };

    /**
     * This is the object used by some environments to export functionality.<br>
     * In other environments, we just provide an empty object to avoid checking for the environment.<br>
     * @type {NodeModule|Object}
     */
    const MODULE_OBJECT = (_ud !== typeof module) ? module : {};

    /**
     * Returns true if the execution context is <i>most likely</i> Node.js<br>
     * by checking for the existence of<br>
     * a global 'module' property,<br>
     * a global function named 'require'<br>
     * and the absence of globally defined symbols for 'self' and 'window'
     * @returns {boolean} true if the execution context is <i>most likely</i> Node.js
     */
    const isNode = function()
    {
        return (_ud === typeof self && _ud === typeof window) && (_ud !== typeof module) && (_fun === typeof require);
    };

    const getMessagesLocale = function( pEnvironment = ENVIRONMENT )
    {
        const environment = resolveObject( pEnvironment || ENV, false );

        let locale = environment?.LC_ALL || environment?.LC_MESSAGES || environment?.LANG || Intl.DateTimeFormat().resolvedOptions().locale;

        return _mt_str + (_str === typeof locale ? locale : locale?.basename || Intl.DateTimeFormat().resolvedOptions().locale);
    };

    class ExecutionEnvironment
    {
        #globalScope;

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

        constructor( pGlobalScope )
        {
            this.#globalScope = pGlobalScope || $scope();

            this.#DenoGlobal = _ud === typeof Deno && _ud === typeof this.#globalScope?.Deno ? null : (_ud === typeof Deno ? Deno : null) || this.#globalScope?.Deno;

            this.#process = _ud !== typeof process ? process : this.#DenoGlobal || null;

            this.#versions = this.#process?.versions || this.#DenoGlobal?.version || {};

            this.#version = this.#versions?.node || this.#versions?.deno;

            this.#console = (_ud !== typeof console && _fun === typeof console?.log) ? console : null;

            this.#window = _ud !== typeof window ? window : null;

            this.#document = _ud !== typeof document ? document : _ud === typeof window ? null : window.document;

            this.#navigator = _ud !== typeof navigator ? navigator : null;

            this.#userAgent = _ud !== typeof navigator ? navigator?.userAgent : _ud === typeof window ? null : window?.navigator?.userAgent;

            this.#location = _ud !== typeof location ? location : null;

            this.#history = _ud !== typeof history ? history : null;

            this.#performance = _ud !== typeof performance ? performance : null;

            this.#customElements = _ud !== typeof customElements ? customElements : null;

            this.#fetch = _ud !== typeof fetch && _fun === typeof fetch ? fetch : null;

            this.#ENV = { ...ENVIRONMENT };
            this.#ARGUMENTS = lock( ARGUMENTS );

            this.#localeCode = this.#navigator?.language || getMessagesLocale( this.#ENV ) || "en-US";

            this.#mode = CURRENT_MODE;
        }

        clone()
        {
            return new ExecutionEnvironment( this.globalScope );
        }

        get globalScope()
        {
            return this.#globalScope || $scope();
        }

        get process()
        {
            return this.#process;
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
            return this.#console;
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
            return !this.isNode() && (null != this.#DenoGlobal);
        }

        isBrowser()
        {
            return !(this.isNode() || this.isDeno()) && null != this.#window && null != this.#document && null != this.#navigator;
        }

        get navigator()
        {
            return this.#navigator;
        }

        get localeCode()
        {
            return this.isBrowser() ? (this.navigator?.language || this.#localeCode || getMessagesLocale( this.ENV ) || "en-US") : this.#localeCode || getMessagesLocale( this.ENV ) || "en-US";
        }

        get userAgent()
        {
            return (_mt_str + (this.#userAgent || _mt_str)).trim();
        }

        canUseFetch()
        {
            const func = (null != this.#fetch) || (null != this.globalScope?.fetch) ? this.#fetch || this.globalScope?.fetch : null;

            return null != func && _fun === typeof func;
        }

        parseUserAgent( pUserAgent )
        {
            // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36

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
            const os = this.process?.platform || this.#DenoGlobal?.build?.os || this.parseUserAgent( this.userAgent ).os.name || _mt_str;
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
    }

    const isFulfilled = function( pResult )
    {
        const result = resolveObject( pResult ) || pResult || {};
        return "fulfilled" === (result?.status || result);
    };

    const isRejected = function( pResult )
    {
        const result = resolveObject( pResult ) || pResult || {};
        return "rejected" === (result?.status || result);
    };

    class PromiseResult
    {
        #result;
        #status;
        #value;
        #reason;

        constructor( pResult, pStatus, pValue, pReason )
        {
            this.#result = pResult || { status: pStatus, value: pValue, reason: pReason };
            this.#status = pResult?.status || pStatus || "pending";
            this.#value = pResult?.value || pValue;
            this.#reason = pResult?.reason || pReason;
        }

        get status()
        {
            return (_mt_str + this.#status).trim();
        }

        get value()
        {
            return this.#value;
        }

        get reason()
        {
            return this.#reason;
        }

        isFulfilled()
        {
            const result = resolveObject( this.#result );
            return "fulfilled" === this.status || ("fulfilled" === (result?.status || result));
        };

        isRejected()
        {
            const result = resolveObject( this.#result );
            return "rejected" === this.status || "rejected" === (result?.status || result);
        };
    }

    function resolveEventType( pEventName, pOptions )
    {
        if ( pEventName instanceof Event )
        {
            return (pEventName.type || pEventName.name) || ((null != pOptions) ? resolveEventType( pOptions ) : "custom");
        }
        else if ( _str === typeof pEventName )
        {
            return pEventName.trim();
        }
        else if ( _obj === typeof pEventName )
        {
            if ( pEventName?.event instanceof Event )
            {
                return resolveEventType( pEventName?.event );
            }

            return pEventName?.type || pEventName?.name || "custom";
        }

        return "custom";
    }

    const resolveEventOptions = function( pEventName, pOptions, pData )
    {
        const options =
            {
                ...(pOptions || {}),
                ...(pData?.detail || pData || {}),
                ...(pData || {}), traceEnabled: false
            };

        const type = resolveEventType( pEventName, options );

        const optionsDetail = options?.detail || options;

        let data = (_obj === typeof pData ? (pData?.detail || pData) : optionsDetail) || optionsDetail;

        data = data?.detail || data || options?.detail || options || {};

        return { type, data, options };
    };

    /**
     * This class defines a Custom Event other modules can use to communicate with interested consumers.<br>
     * @see <a href="https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent">MDN: CustomEvent</a>
     * <br>
     * Use the 'detail' property to share data with event handlers.<br>
     * @class
     */
    class BockModuleEvent extends Event
    {
        #type;
        #detail;

        #traceEnabled = CURRENT_MODE?.traceEnabled || false;

        /**
         *
         * @constructor
         * @param {string|Event} pEventName The name or type of Event to construct
         * @param {Object} pData The data to include in the event's detail property
         *
         * @param {Object} pOptions
         *
         * @see BockModulePrototype#reportError
         * @see BockModulePrototype#dispatchEvent
         */
        constructor( pEventName, pData, pOptions )
        {
            super( resolveEventOptions( pEventName, pOptions, pData ).type || "custom",
                   resolveEventOptions( pEventName, pOptions, pData ).options );

            const { type, data, options } = resolveEventOptions( pEventName, pOptions, pData );

            this.#type = type || "BockModuleEvent";

            this.#detail = data?.detail || data || options?.detail || options || {};

            this.#traceEnabled = !!options.traceEnabled;

            this.id = "Event_" + (options?.id || ((new Date().getTime())));
        }

        get traceEnabled()
        {
            return this.#traceEnabled;
        }

        /**
         * Returns a constructor for this class.
         * @returns {BockModuleEvent}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        clone()
        {
            return new BockModuleEvent( this.type, this.detail, this.traceEnabled );
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
            return this.#detail || super.detail;
        }

        trace( pMsg )
        {
            konsole.trace( pMsg, this );
        }
    }

    /**
     * If the environment does not define CustomEvent,<br>
     * we define a global property using our custom event, ModuleEvent
     * @see BockModuleEvent
     */
    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = BockModuleEvent;
        $scope()["CustomEvent"] = CustomEvent;
    }

    const resolveEvent = function( pEvent, pData, pOptions )
    {
        const evt = pEvent || $scope()?.event;

        if ( evt instanceof CustomEvent || evt instanceof BockModuleEvent )
        {
            return evt;
        }

        if ( evt instanceof Event )
        {
            return new CustomEvent( evt, pOptions );
        }

        return new CustomEvent( evt, pOptions );
    };

    /**
     * This is a function that just does nothing.<br>
     * This is useful when you need a default for a missing argument or expected function.<br>
     */
    function no_op()
    {
        // do nothing
    }

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
    const isReadOnly = function( pObject )
    {
        if ( _obj === typeof pObject )
        {
            return (null === pObject) || Object.isFrozen( pObject ) || Object.isSealed( pObject );
        }

        return true;
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
    const asPhrase = function( ...pArgs )
    {
        return [...pArgs].flat( Infinity ).map( e => (_mt_str + e).trim() ).join( _spc );
    };

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
     */

    /**
     * These are the default options used with the localCopy and immutableCopy functions.<br>
     *
     * @type {CopyOptions}
     * @see CopyOptions
     */
    const DEFAULT_COPY_OPTIONS = Object.freeze(
        {
            maxStackSize: MAX_STACK_SIZE,
            nullReplacement: EMPTY_OBJECT,
            undefinedReplacement: EMPTY_OBJECT,
            depth: 99,
            freeze: false
        } );

    /**
     * These are the default options used with the immutableCopy function.<br>
     * Note that these are the same as the {@link DEFAULT_COPY_OPTIONS} but with 'freeze' set to true.<br>
     *
     * @type {CopyOptions}
     * @see CopyOptions
     */
    let IMMUTABLE_COPY_OPTIONS = { ...DEFAULT_COPY_OPTIONS };
    IMMUTABLE_COPY_OPTIONS.freeze = true;
    IMMUTABLE_COPY_OPTIONS = Object.freeze( IMMUTABLE_COPY_OPTIONS );

    /**
     * Returns an object corresponding to a set of default options with one or more properties
     * overridden or added by the properties of the specified pOptions
     *
     * @param {Object} pOptions  An object whose properties should be used
     * @param {Object} pDefaults An object holding defaults for the properties to be used
     * @returns {Object} An object combining the defaults with the specified options
     */
    function populateOptions( pOptions, pDefaults )
    {
        const defaults = Object.assign( {}, (_obj === typeof pDefaults && null != pDefaults) ? { ...pDefaults } : {} );
        return Object.assign( resolveObject( defaults || {}, true ), resolveObject( pOptions || pDefaults || {}, true ) );
    }

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
        return Math.max( 0, parseInt( (_num === typeof option) ? option : ((/^[\d.]$/.test( option )) ? option : (_num === typeof pDefault ? pDefault : 0)) ) );
    }

    /**
     * This is a 'helper' function for reading the depth property of the localCopy or immutableCopy options
     * @param {Object} pOptions An object expected to have a property named, depth
     * @returns {number} An integer value representing the value of that property
     * @private
     */
    function _getDepth( pOptions )
    {
        return _getNumericOption( pOptions, "depth", 0 );
    }

    /**
     * This is a 'helper' function for reading the maxStackSize property of the localCopy or immutableCopy options
     * @param {Object} pOptions An object expected to have a property named, maxStackSize
     * @returns {number} An integer value representing the value of that property
     * @private
     */
    function _getMaxStackSize( pOptions )
    {
        return Math.min( MAX_STACK_SIZE, _getNumericOption( pOptions, "maxStackSize", MAX_STACK_SIZE ) );
    }

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
            return (null === options?.undefinedReplacement ? null : options?.undefinedReplacement ?? null);
        }

        if ( null === pObject )
        {
            return (null === options?.nullReplacement ? null : options?.nullReplacement ?? EMPTY_OBJECT);
        }

        return Object.freeze( pObject );
    };

    /**
     * Returns a string compatible with the StackTrace parseFrame method<br>
     *
     * @param {Error} pError An Error or a string representing a stack trace
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
     * @typedef {Object} StackFrame
     * @property {string} methodName The name of the function or method executed
     * @property {string} fileName The name of the source file in which the function or method is defined
     * @property {number} lineNumber The line number in the source file defining the executed statement
     * @property {number} columnNumber The position in the line where execution began
     */

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

            this.clone = function()
            {
                return new this.constructor( this.#stack, pError );
            };
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
     * This is the default error message used if there is no message available for an error
     * @type {string}
     * @const
     * @see {@link S_ERR_PREFIX}
     * @see {@link S_DEFAULT_OPERATION}
     */
    const DEFAULT_ERROR_MSG = [S_ERR_PREFIX, S_DEFAULT_OPERATION].join( _spc );

    function resolveLogLevel( pLevel )
    {
        const levels = [S_NONE, S_LOG, S_WARN, S_ERROR, S_DEBUG, S_TRACE, S_LOG];
        let level = (_str === typeof pLevel) ? pLevel.toLowerCase() : (_num === typeof pLevel && pLevel >= 0 && pLevel <= 6 ? levels[pLevel] : S_ERROR);
        return (levels.includes( level ) ? level : S_ERROR);
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
        #cause;

        #trace;

        #code;
        #referenceId;

        /**
         * Constructs an instance of the custom Error class, __Error.<br>
         * @constructor
         * @param {string|Error} pMessage The error message or an Error whose message should be used as the error message
         * @param {Object} [pOptions={}] An object that will be available as a property of this Error
         */
        constructor( pMessage, pOptions = {} )
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

            this.#code = (this.#options?.code || _num === typeof pMessage ? pMessage : null);
            this.#referenceId = this.#options?.referenceId || __Error.generateReferenceId( this, this.#code );
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

        /**
         * Writes this error to the specified logger if the logger is enabled for the specified level
         * @param {ILogger} pLogger A logger to record the error
         * @param {string|number} pLevel The logging level to use when recording the error
         */
        logTo( pLogger, pLevel )
        {
            const logger = pLogger || konsole;

            const level = resolveLogLevel( pLevel );

            if ( _fun === typeof logger[level] )
            {
                logger[level]( this.toString(), this.options );
            }
        }

        clone()
        {
            return new this.constructor( this.message, this.options );
        }
    }

    __Error.NEXT_REF_ID = 10000;

    __Error.generateReferenceId = function( pError, pCode )
    {
        return "Reference ID:" + (pCode ? " (" + (_num === typeof pCode ? String( pCode ) : _asStr( pCode )) + "): " : _mt_str) + (++__Error.NEXT_REF_ID);
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

        clone()
        {
            return new this.constructor( this.message, this.options );
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
     * @returns {__Error} an Error (actually an instance of __Error), which provides an environment-agnostic stack trace)
     */
    function resolveError( pError, pMessage )
    {
        if ( !(pError instanceof Error || pMessage instanceof Error || (_str === typeof pMessage && !(_mt_str === pMessage.trim()))) )
        {
            return null;
        }

        if ( pError instanceof Error )
        {
            return new __Error( pError );
        }
        else if ( pMessage instanceof Error )
        {
            return new __Error( pMessage );
        }

        let cause = pError instanceof Error ? pError : pMessage instanceof Error ? pMessage : null;

        if ( cause instanceof Error )
        {
            return new __Error( (pError?.message || pMessage || pError || DEFAULT_ERROR_MSG), { cause } );
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
        const modName = _obj === typeof pModule ? (pModule?.moduleName || pModule?.name) : _str === typeof pModule ? pModule : _unknown;
        const funName = _fun === typeof pFunction ? (pFunction?.name || "anonymous") : _str === typeof pFunction ? pFunction : _unknown;

        return (modName || pModule) + _colon + _colon + (funName || pFunction);
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
            this.#fileName = pFileName || (_ud === typeof __filename ? _unknown : __filename);
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

            this.#options = populateOptions( pOptions, {} );

            this.#name = (_str === typeof pName ? pName : this.#options?.name) || ("StatefulListener_" + String( this.#id ));

            this.#mode = this.#options?.mode instanceof ExecutionMode ? this.#options?.mode : CURRENT_MODE;

            if ( ExecutionMode.MODES.TEST === this.#mode || this.#mode?.traceEnabled )
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
        [Symbol.species]()
        {
            return this;
        }

        /**
         * Handles an event.<br>
         * This method is intended to be overridden in a subclass,<br>
         * as it is not implemented in the base class.
         * <br>
         *
         * @param {Event|BockModuleEvent} pEvent - The event object containing details about the event to handle.
         * @param {...*} [pExtra] - Additional data or parameters that may be passed with the event.
         */
        handleEvent( pEvent, ...pExtra )
        {
            // the only thing implemented in the base class is for debugging and testing modes
            if ( this.eventsHandled )
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

            if ( pOther instanceof this.constructor || _fun === typeof pOther?.handleEvent )
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
            if ( null == pOther || !(pOther instanceof this.constructor || _fun === typeof pOther?.handleEvent) )
            {
                return -1;
            }

            if ( this === pOther )
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
     * This is an internal cache of constructed and loaded modules.<br>
     * @type {Object}
     * @dict
     * @private
     */
    const MODULE_CACHE = {};

    const _asStr = e => _str === typeof e ? e : e?.type || e?.name || null;
    const _validStr = e => _str === typeof e && _mt_str !== e.trim();
    const _lcaseStr = e => e.trim().toLowerCase();

    /**
     * Represents a visitor class to support the common Visitor Pattern.
     * This class also extends the EventTarget interface
     * to enable event dispatching, specifically for the "visit" event.
     * Subclasses can use and/or extend its functionality to define their own visiting logic.
     */
    class Visitor extends EventTarget
    {
        #options;

        constructor( pOptions )
        {
            super();

            this.#options = populateOptions( pOptions || {}, {} );
        }

        get options()
        {
            return populateOptions( this.#options || {}, {} );
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
         * @return {void|boolean} Normally does not return a value,
         *                        but if desired, return true or a 'truthy' value to stop an iteration
         */
        visit( pVisited )
        {
            this.dispatchEvent( new BockModuleEvent( "visit", pVisited, populateOptions( this.#options, { detail: pVisited } ) ) );
        }
    }

    class AdHocVisitor extends Visitor
    {
        #func = no_op;

        constructor( pFunction, pOptions )
        {
            super( pOptions );

            if ( _fun === typeof pFunction )
            {
                this.#func = function( pVisited )
                {
                    try
                    {
                        return pFunction( pVisited );
                    }
                    catch( ex )
                    {
                        this.dispatchEvent( new BockModuleEvent( "error", {
                            error: ex,
                            message: ex.message,
                            visited: pVisited
                        }, populateOptions( this.options, { detail: pVisited } ) ) );
                    }
                };
            }
        }

        visit( pVisited )
        {
            return this.#func( pVisited );
        }
    }

    class NullVisitor extends Visitor
    {
        constructor( pOptions )
        {
            super( pOptions );
        }

        visit( pVisited )
        {
            // no op
        }
    }

    const resolveVisitor = function( pVisitor )
    {
        if ( pVisitor instanceof Visitor || _fun === typeof pVisitor?.visit )
        {
            return pVisitor;
        }
        else if ( _fun === typeof pVisitor )
        {
            return new AdHocVisitor( pVisitor );
        }

        return new NullVisitor( {} );
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

        // a map of stateful listeners by event (string)
        #statefulListeners = {};

        #executionEnvironment;

        #traceEnabled = false;

        /**
         * Constructs a new instance, or module, to expose functionality to consumers.
         * <br>
         * <br>
         * @constructor
         *
         * @param {string|BockModulePrototype|Object} pModuleName The name of this instance, or another instance<br>
         *                                                 from which to inherit the name and other properties
         * @param {string} pCacheKey A unique key to use to cache this module in global scope to improve performance
         * @param {boolean} pTraceEnabled
         * @param {ModuleArgs} [pModuleArguments=MODULE_ARGUMENTS]
         */
        constructor( pModuleName, pCacheKey, pTraceEnabled = CURRENT_MODE?.traceEnabled || false, pModuleArguments = MODULE_ARGUMENTS )
        {
            super();

            this.#moduleName = (_str === typeof pModuleName) ? pModuleName || modName : (_obj === typeof pModuleName ? pModuleName?.moduleName || pModuleName?.name : _mt_str) || modName;
            this.#cacheKey = (_str === typeof pCacheKey) ? pCacheKey || INTERNAL_NAME : (_obj === typeof pModuleName ? pModuleName?.cacheKey || pModuleName?.name : _mt_str);

            this.#traceEnabled = !!pTraceEnabled;

            // if the constructor is called with an object, instead of a string,
            // inherit its properties and functions
            if ( _obj === typeof pModuleName )
            {
                this.extend( pModuleName );
            }

            // cache this module to avoid unnecessary reconstruction
            MODULE_CACHE[this.#moduleName] = this;
            MODULE_CACHE[this.#cacheKey] = this;
        }

        clone()
        {
            const copy = { ...this };
            copy.prototype = this.constructor;
            copy.constructor = this.constructor;
            return copy;
        }

        /**
         * Returns a constructor for this class.
         * @returns {BockModulePrototype}
         */
        static get [Symbol.species]()
        {
            return this;
        }

        get traceEnabled()
        {
            return this.#traceEnabled;
        }

        trace( pMessage, pOptions )
        {
            if ( this.traceEnabled )
            {
                konsole.trace( pMessage, pOptions || "Called without options" );
            }
        }

        addEventListener( type, callback, options )
        {
            super.addEventListener( type, callback, options );

            if ( this.traceEnabled )
            {
                this.trace( "addEventListener", { moduleName: this.moduleName, type, callback, options } );
            }
        }

        addStatefulListener( pListener, ...pTypes )
        {
            if ( pListener instanceof StatefulListener )
            {
                if ( null != pTypes && pTypes.length > 0 )
                {
                    const types = [...pTypes].map( _asStr ).filter( _validStr ).map( _lcaseStr );

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
                        try
                        {
                            listener.handleEvent( evt, evt?.detail, pData, pOptions );
                        }
                        catch( ex )
                        {
                            // ignore errors thrown by 'external' code
                        }
                    }
                }

                if ( this.traceEnabled )
                {
                    this.trace( "dispatchEvent", { moduleName: this.moduleName, event: evt || pEvent, listeners } );
                }
            }
        }

        removeEventListener( type, callback, options )
        {
            super.removeEventListener( type, callback, options );

            if ( callback instanceof StatefulListener )
            {
                this.removeStatefulListener( callback, type );
            }

            if ( this.traceEnabled )
            {
                this.trace( "removeEventListener", { moduleName: this.moduleName, type, callback, options } );
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
            let id = (pListener instanceof StatefulListener || (_num === typeof pListener?.id && pListener?.id > 0)) ? pListener?.id : (_num === typeof pListener) ? pListener : 0;

            const forAllTypes = (null == pTypes || 0 === pTypes.length || pTypes.includes( "*" ));

            let types = forAllTypes ? Object.keys( this.#statefulListeners ) : [...pTypes].map( _asStr ).filter( _validStr ).map( _lcaseStr );

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
            return this.#moduleName || this.#cacheKey;
        }

        /**
         * Returns the key under which this module may be cached in the global scope
         * @returns {string} The key under which this module may be cached in the global scope
         */
        get cacheKey()
        {
            return this.#cacheKey || this.#moduleName;
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
                if ( BockModulePrototype.#globalLoggingEnabled )
                {
                    logger = BockModulePrototype.getGlobalLogger();
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
            if ( BockModulePrototype.isLogger( pLogger ) )
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
            return (_obj === typeof pLogger
                    && null !== pLogger
                    && _fun === typeof pLogger[S_LOG]
                    && _fun === typeof pLogger[S_INFO]
                    && _fun === typeof pLogger[S_WARN]
                    && _fun === typeof pLogger[S_DEBUG]
                    && _fun === typeof pLogger[S_ERROR]);
        }

        /**
         * Defines a logger to use for any module that does not have an instance-specific logger.
         * @param {Object} pLogger an object defining the 6 required methods: log, info, warn, error, debug, and trace
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
         * or null if no global logger is defined.
         * <br>
         * @returns {ILogger|null} The logger used for any module that does not have an instance-specific logger
         * or null if no global logger is defined
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

                let level = (_mt_str + pLevel).trim().toLowerCase();

                level = [S_LOG, S_INFO, S_WARN, S_DEBUG, S_ERROR].includes( level || S_ERROR ) ? level : S_ERROR;

                if ( this.traceEnabled )
                {
                    this.trace( "reportError", { moduleName: this.moduleName, err, msg, level, source: pSource } );
                }

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

        handleError( pError, pContext, ...pExtra )
        {
            const source = this.calculateErrorSourceName( this, pContext?.name || pContext || pError?.stack || pError );
            this.reportError( pError, pError?.message || S_DEFAULT_ERROR_MESSAGE, S_ERROR, source, ...pExtra );
        }

        async handleErrorAsync( pError, pContext, ...pExtra )
        {
            const me = this;

            const source = this.calculateErrorSourceName( this, pContext?.name || pContext || pError?.stack || pError );

            const func = async function( pError, pContext, ...pExtra )
            {
                me.reportError( pError, pError?.message || S_DEFAULT_ERROR_MESSAGE, S_ERROR, source, ...pExtra );
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
         * @returns {BockModulePrototype} This instance, now augmented with the properties and methods of the specified object
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
         * @returns {BockModulePrototype} This instance, potentially extended with properties and functions from the specified object
         * <br>
         * Emits a "load" event with this module as its detail data
         * @fires load
         */
        expose( pObject, pCacheKey, pModuleScope = MODULE_OBJECT )
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
         * Asynchronously extends this module and emits the load event when complete
         * @param {Object} pObject Another module or object whose properties and functions will be added to this instance
         * @returns {Promise<BockModulePrototype>} A Promise that resolves to the updated module
         * @fires load
         */
        async enhance( pObject )
        {
            const mod = this.extend( pObject );

            dispatchEvent( new CustomEvent( "load", mod ) );

            return mod;
        }

        /**
         * This is a static factory method to construct a new instance of the ModulePrototype.
         * <br>
         * If the module has already been constructed and loaded, it may be returned from the cache.
         * <br>
         * @param {string} pModuleName The name of the module to construct
         * @param {string} pCacheKey A key that may be used to cache the module in the global scope
         * @param {Object} pObject (optional) another module or object whose properties and functions will be added to the new instance
         * @returns {BockModulePrototype} A newly constructed Module with the specified name or the existing module if it is found in the cache
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

        get executionEnvironment()
        {
            if ( null == this.#executionEnvironment )
            {
                this.#executionEnvironment = new ExecutionEnvironment( this.globalScope );
            }
            return this.#executionEnvironment;
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
     * Makes the specified object available as a module that can be imported or required by other code
     * @param {Object|BockModulePrototype} pObject The object or module to export
     * @param {string} pCacheKey A key under which the exported module may be cached
     * @returns {BockModulePrototype} The exported module
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
     * Asynchronously import a module into the current scope.
     * <br>
     * Emits the load Event before returning the Promise that resolves to the required/imported module.
     * <br>
     * @param {string} pModulePath The name of, or filepath to, the required module
     * @returns {Promise<BockModulePrototype>} A Promise that resolves to the requested module
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
        }

        if ( null != mod && mod instanceof BockModulePrototype )
        {
            GLOBAL_INSTANCE.dispatchEvent( new CustomEvent( "load", mod ) );
        }

        return mod;
    }

    function isObjectLiteral( pObject )
    {
        if ( _obj === typeof pObject && null != pObject )
        {
            let constructorFunction = pObject.constructor || Object.getPrototypeOf( pObject )?.constructor;

            return (_fun !== typeof constructorFunction || ("Object" === constructorFunction.name || Object === constructorFunction));
        }
        return false;
    }

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
                let obj = (null === options?.undefinedReplacement ? null : options?.undefinedReplacement ?? null);
                return freeze ? lock( obj ) : obj;

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
                    let obj = (null === options?.nullReplacement ? null : options?.nullReplacement ?? EMPTY_OBJECT);
                    return freeze ? lock( obj ) : obj;
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
                    if ( _fun === typeof pObject?.clone )
                    {
                        clone = pObject.clone();
                    }
                    else
                    {
                        clone = !isObjectLiteral( pObject ) ? pObject : Object.assign( {}, pObject );

                        if ( depth > 0 )
                        {
                            options.depth = depth - 1;

                            stack.push( clone );

                            try
                            {
                                const entries = objectEntries( pObject );

                                for( let entry of entries )
                                {
                                    if ( null == entry || entry?.length < 2 )
                                    {
                                        continue;
                                    }

                                    const key = entry[0];
                                    const value = entry[1];

                                    try
                                    {
                                        clone[key] = _copy( value, options, stack.concat( key ) );
                                    }
                                    catch( exSet )
                                    {
                                        //ignore
                                    }

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
        }

        return freeze ? lock( clone ) : clone;
    };

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

    function objectEntries( pObject )
    {
        let entries = [];

        const stringifyKeys = e => (_symbol !== typeof e[0]) ? [(_mt_str + (e[0])).trim(), e[1]] : [e[0], e[1]];

        if ( _obj === typeof pObject && null != pObject )
        {
            (Object.entries( pObject || {} )).forEach( e => entries.push( e ) );

            entries = entries.map( stringifyKeys );

            if ( isObjectLiteral( pObject ) && entries.length > 0 )
            {
                return entries;
            }

            if ( pObject instanceof Map )
            {
                entries = (entries.concat( ...(pObject.entries()) ));
            }
            else if ( pObject instanceof Set || isArray( pObject ) )
            {
                entries = (entries.concat( ...([...(new Set( pObject ).entries())].map( stringifyKeys )) ));
            }

            try
            {
                const propertyNames = [...Object.getOwnPropertyNames( pObject ), ...Object.getOwnPropertySymbols( pObject )];

                propertyNames.forEach( ( key ) =>
                                       {
                                           const value = pObject[key];
                                           if ( null != value )
                                           {
                                               entries.push( [key, value] );
                                           }
                                       } );
            }
            catch( ex )
            {
                // ignored
            }

            entries = entries.map( stringifyKeys );

            let source = _fun === typeof pObject?.constructor ? Function.prototype.toString.call( pObject.constructor ) : _str;
            let rx = /(get +(\w+)\( *\))|(#(\w)[;\r\n,])/;
            let matches = rx.exec( source );
            while ( matches && matches?.length > 2 && source?.length > 4 )
            {
                let match = matches[2];
                entries.push( [match, pObject[match]] );
                source = source.slice( matches.index + match.length + 4 );
                matches = rx.exec( source );
            }
        }

        return [...new Set( entries )].filter( e => null != e[1] ).map( stringifyKeys );
    }

    function objectValues( pObject )
    {
        const values = [];
        objectEntries( pObject ).forEach( e => values.push( e[1] ) );
        return values;
    }

    function objectKeys( pObject )
    {
        const keys = [];
        objectEntries( pObject ).forEach( e => keys.push( e[0] ) );
        return keys;
    }

    function mergeOptions( pOptions, ...pDefaults )
    {
        const maxMergeDepth = 12;

        let obj = {};

        let arr = [...(pDefaults || [])].filter( e => _obj === typeof e && null != e );

        arr.unshift( pOptions || {} );

        arr = arr.filter( e => _obj === typeof e && null != e ).map( e => localCopy( e ) );

        function merge( pDepth, pObj, pValue, pKey )
        {
            const kee = (_mt_str + (pKey || pObj || "value"));

            const o = (_obj === typeof pObj) ? (pObj || { [kee]: pValue }) : { [kee]: pObj || {} };

            const val = localCopy( (_obj === typeof pValue) ? (pValue || { [kee]: pValue }) : { [kee]: pValue } );

            if ( pDepth > maxMergeDepth )
            {
                return val || o;
            }

            const kvPairs = objectEntries( val );

            for( const [k, v] of kvPairs )
            {
                if ( null === v || _ud === typeof v || (_obj === typeof v && Object.keys( v || {} ).length === 0) )
                {
                    continue;
                }

                if ( !(k in o) || null === o[k] || _ud === typeof o[k] || (_obj === typeof o[k] && Object.keys( o[k] || {} ).length === 0) )
                {
                    o[k] = v;
                }
                else if ( _obj === typeof v && _obj === typeof o[k] )
                {
                    o[k] = merge( ++pDepth, o[k], v, k );
                }
                else
                {
                    o[k] = (_obj === typeof o[k] ? merge( ++pDepth, o[k], { [k]: v }, k ) : v);
                }
            }

            return o;
        }

        for( let i = arr.length; i--; )
        {
            let entries = objectEntries( arr[i] );

            for( const [key, value] of entries )
            {
                let mergeDepth = 0;

                if ( null === value || _ud === typeof value )
                {
                    continue;
                }

                if ( !(key in obj) || null === obj[key] || _ud === typeof obj[key] || Object.keys( obj[key] || {} ).length === 0 )
                {
                    obj[key] = value;
                }
                else if ( _obj === typeof value && _obj === typeof obj[key] )
                {
                    obj[key] = merge( ++mergeDepth, obj[key], value, key );
                }
                else
                {
                    obj[key] = (_obj === typeof obj[key] ? merge( ++mergeDepth, obj[key], { [key]: value }, key ) : value);
                }
            }
        }

        return obj;
    }


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

    /**
     * Attempts to coerce, or cast, the specified value to the specified type
     * @param {*} pValue A value to convert to another type, if possible
     * @param {string|function} pType  The type or class to which to convert the specified value
     * @param pStack USED INTERNALLY TO PREVENT INFINITE RECURSION
     * @returns {*} A value of the type or class requested (if possible)
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
                if ( type === Date || typeof type === Date || type instanceof Date )
                {
                    return new Date( _coerce( a, _num, stack.concat( a ) ) );
                }

                if ( type === RegExp || typeof type === RegExp || type instanceof RegExp )
                {
                    let regExp = _coerce( a, _str, stack.concat( a ) );

                    try
                    {
                        regExp = new RegExp( regExp );
                    }
                    catch( ex )
                    {
                        GLOBAL_INSTANCE.reportError( ex, ex.message, S_WARN, this?.name );
                    }

                    return regExp;
                }

                return _coerce( a, typeof type, stack.concat( a ) );
        }
    };

    /**
     * @typedef {Object} ComparatorOptions
     * @property {string|function} [type='*'] The type or class the compared values should be coerced to before being compared.<br> Defaults to '*' meaning the comparator will compare any 2 compatible types / values<br>
     * @property {boolean} [strict=true] If true, values compared must be of the same type and no type coercion will be used
     * @property {boolean} [nullsFirst=true] If true, null values will be considered less than other values,<br> If false, null values will be considered greater than other values<br>
     * @property {boolean} [caseSensitive=true] If true, strings are compared according to case as well as content.<br> If false, strings are compared without regard to case.<br>
     * @property {boolean} [trimStrings=false] If true, whitespace is ignored when comparing string values
     * @property {boolean} [reverse=false] If true, items will be ordered in 'descending' order
     * @property {boolean} [coerce=false] If true, values will be coerced to the same type before comparison
     * @property {number} [maxStackSize=MAX_STACK_SIZE] The number of recursive calls allowed
     */

    /**
     * These are default options for the ComparatorFactory class.
     * @const
     * @type {ComparatorOptions}
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
     * <br><br>
     * ComparatorOptions can be used to control how the returned comparators behave.
     * <br><br>
     *
     * @see ComparatorOptions
     *
     * @class
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

        /**
         * Constructs an instance of the factory.
         * <br><br>
         * The factory itself is <b>not</b> a comparator.
         * <br>
         * Call the {@link ComparatorFactory#comparator} method to obtain a comparator after configuring the desired ComparatorOptions.
         * <br>
         * @constructor
         * @param {string|function} [pType='*'] The type of values that will be compared
         * @param {ComparatorOptions} [pOptions=DEFAULT_COMPARATOR_OPTIONS] An object describing how a comparator will behave.
         * @see ComparatorOptions
         */
        constructor( pType = "*", pOptions = DEFAULT_COMPARATOR_OPTIONS )
        {
            this.#options = populateOptions( pOptions, DEFAULT_COMPARATOR_OPTIONS );

            this.#type = pType || this.#options?.type || "*";

            const options = this.#options;

            this.#strict = false !== options?.strict && ("*" !== this.#type);
            this.#nullsFirst = false !== options?.nullsFirst;
            this.#caseSensitive = false !== options?.caseSensitive;
            this.#trimStrings = false !== options?.trimStrings;
            this.#reverse = true === options?.reverse;
            this.#coerce = true === options?.coerce;
            this.#maxStackSize = Math.max( 2, _getMaxStackSize( options ) );
        }

        clone()
        {
            return new ComparatorFactory( this.type, this.options );
        }

        /**
         * Returns a constructor for this class.
         * @returns {ComparatorFactory}
         */
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
            this.#type = pType || this.#type || "*";
        }

        get maxStackSize()
        {
            return (_num === typeof this.#maxStackSize ? Math.max( 2, Math.min( this.#maxStackSize, MAX_STACK_SIZE ) ) : MAX_STACK_SIZE);
        }

        set maxStackSize( pValue )
        {
            this.#maxStackSize = (_num === typeof pValue ? Math.max( 2, Math.min( pValue || this.#maxStackSize, MAX_STACK_SIZE ) ) : MAX_STACK_SIZE);
        }

        _copyOptions( pOverrides )
        {
            const overrides = populateOptions( pOverrides, populateOptions( this.#options || {}, DEFAULT_COMPARATOR_OPTIONS ) );

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
            return populateOptions( this._copyOptions(), populateOptions( this.#options || {}, DEFAULT_COMPARATOR_OPTIONS ) );
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
            const options = populateOptions( pOptions, populateOptions( this.options || {}, DEFAULT_COMPARATOR_OPTIONS ) );

            let stack = options.stack || [];

            let strict = (true === options?.strict) || this.strict;

            let coerce = (true === options?.coerce) || this.coerce;

            let nullsFirst = (true === options?.nullsFirst) || this.nullsFirst;

            let trimStrings = (true === options?.trimStrings) || this.trimStrings;

            let caseSensitive = (true === options?.caseSensitive) || this.caseSensitive;

            let reverse = (true === options?.reverse) || this.reverse;

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
                    return nullsFirst ? -1 : 1;

                case _str:

                    a = (null === a) ? _mt_str : a;
                    b = (null === b) ? _mt_str : b;

                    a = _mt_str + (trimStrings ? (_mt_str + a).trim() : a);
                    b = _mt_str + (trimStrings ? (_mt_str + b).trim() : b);

                    if ( !caseSensitive )
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
                        return (nullsFirst ? -1 : 1);
                    }
                    else if ( isNaN( b ) || null === b )
                    {
                        return (nullsFirst ? 1 : -1);
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
                        return (nullsFirst ? -1 : 1);
                    }
                    else if ( null === b )
                    {
                        return (nullsFirst ? 1 : -1);
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

            return (reverse ? -comp : comp);
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
         * Returns a function to sort elements or properties of an order-able object, such as an array<br>
         * that treats null values as less than any other values
         * @see {@link ComparatorFactory#comparator}
         * @returns {function(*, *): number}
         */
        nullsFirstComparator()
        {
            const options = this._copyOptions( { nullsFirst: true } );
            return new ComparatorFactory( this.type, options ).comparator();
        }

        /**
         * Returns a function to sort elements or properties of an order-able object, such as an array<br>
         * that treats null values as greater than any other values
         * @see {@link ComparatorFactory#comparator}
         * @returns {function(*, *): number}
         */
        nullsLastComparator()
        {
            const options = this._copyOptions( { nullsFirst: false } );
            return new ComparatorFactory( this.type, options ).comparator();
        }

        /**
         * Returns a function to sort elements or properties of an order-able object, such as an array<br>
         * that compares string values without regard to case
         * @see {@link ComparatorFactory#comparator}
         * @returns {function(*, *): number}
         */
        caseInsensitiveComparator()
        {
            const options = this._copyOptions( { caseSensitive: false, type: "string" } );
            return new ComparatorFactory( options?.type || this.type, options ).comparator();
        }

        /**
         * Returns a function to sort elements or properties of an order-able object, such as an array<br>
         * that will reverse the order ordinarily obtained
         * @see {@link ComparatorFactory#comparator}
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
            this.#maxIterations = Math.min( Math.max( 1, parseInt( pMaxIterations ) ), MAX_ITERATIONS );

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

    const mod =
        {
            ModuleEvent: BockModuleEvent,
            ModulePrototype: BockModulePrototype,
            CustomEvent,
            isLogger: BockModulePrototype.isLogger,
            calculateErrorSourceName,
            notify: function( pFromModule,
                              pError,
                              pMessage = pError?.message || S_DEFAULT_OPERATION,
                              pLevel = S_ERROR,
                              pSource = _mt_str,
                              ...pExtra )
            {
                let thiz = pFromModule || this || GLOBAL_INSTANCE;

                if ( thiz instanceof BockModulePrototype )
                {
                    thiz.reportError( pError, pMessage, pLevel, pSource, ...pExtra );
                }
                else
                {
                    GLOBAL_INSTANCE.reportError( pError, pMessage, pLevel, pSource, ...pExtra );
                }
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
            sleep,

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
            resolveEvent,

            EMPTY_OBJECT,
            EMPTY_ARRAY,

            asPhrase,

            isReadOnly,
            isObjectLiteral,
            objectEntries,
            objectValues,
            objectKeys,
            populateOptions,
            mergeOptions,
            lock,
            deepFreeze,
            DEFAULT_COPY_OPTIONS,
            localCopy,
            immutableCopy,

            ExecutionMode,
            ExecutionEnvironment,
            SourceInfo,
            StackTrace,
            __Error,
            IllegalArgumentError,
            IterationCap,
            ComparatorFactory,
            StatefulListener,
            Visitor,

            resolveVisitor,

            CURRENT_MODE,
            ARGUMENTS,

            getExecutionEnvironment: function()
            {
                return new ExecutionEnvironment();
            },

            getMessagesLocale,

            isFulfilled,
            isRejected,

            classes:
                {
                    Args,
                    ModuleArgs,
                    CmdLineArgs,
                    ExecutionMode,
                    ExecutionEnvironment,
                    PromiseResult,
                    ModuleEvent: BockModuleEvent,
                    ModulePrototype: BockModulePrototype,
                    SourceInfo,
                    StackTrace,
                    __Error,
                    IllegalArgumentError,
                    IterationCap,
                    ComparatorFactory,
                    StatefulListener,
                    Visitor
                }
        };

    // adds the module to module.exports (if it exists) and then returns the module
    return exportModule( mod, INTERNAL_NAME );

}( ENV, ...CMD_LINE_ARGS ));
