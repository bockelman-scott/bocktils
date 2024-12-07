/** create an alias for console **/
const konsole = console || {};

/** define a variable for typeof undefined **/
const _ud = "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__MODULE_PROTOTYPE__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const S_OBJECT = "object";
    const S_FUNCTION = "function";

    const S_LOG = "log";
    const S_ERROR = "error";
    const S_WARN = "warn";
    const S_DEBUG = "debug";
    const S_INFO = "info";

    class BockModuleEvent extends Event
    {
        #type;
        #detail;

        constructor( pEventName, pData )
        {
            super( pEventName );

            this.#type = pEventName || "BockModuleEvent";
            this.#detail = S_OBJECT === typeof pData ? pData || {} : {};
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

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = BockModuleEvent;
    }

    class BockModulePrototype extends EventTarget
    {
        #moduleName;
        #cacheKey;

        #logger;

        constructor( pModuleName, pCacheKey )
        {
            super();

            this.#moduleName = pModuleName || "BockModulePrototype";
            this.#cacheKey = pCacheKey || INTERNAL_NAME;
        }

        get moduleName()
        {
            return this.#moduleName || this.#cacheKey;
        }

        get cacheKey()
        {
            return this.#cacheKey || this.#moduleName;
        }

        get logger()
        {
            return this.#logger || konsole;
        }

        set logger( pLogger )
        {
            if ( BockModulePrototype.isLogger( pLogger ) )
            {
                this.#logger = pLogger;
            }
        }

        static isLogger( pLogger )
        {
            return (S_OBJECT === typeof pLogger
                    && null !== pLogger
                    && S_FUNCTION === typeof pLogger[S_LOG]
                    && S_FUNCTION === typeof pLogger[S_INFO]
                    && S_FUNCTION === typeof pLogger[S_WARN]
                    && S_FUNCTION === typeof pLogger[S_DEBUG]
                    && S_FUNCTION === typeof pLogger[S_ERROR]);
        }
    }

    const mod =
        {
            BockModuleEvent,
            BockModulePrototype,
            CustomEvent,
            isLogger:BockModulePrototype.isLogger,
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
