/** create an alias for console **/
const konsole = console || {};

/** define a variable for typeof undefined **/
const _ud = "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? (_ud === typeof globalThis ? {} : globalThis || {}) : (global || (_ud === typeof globalThis ? {} : globalThis || {}) || {})) : (self || (_ud === typeof globalThis ? {} : globalThis || {})));
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

    const SCOPE_MODULE = (_ud !== typeof module) ? module : {};

    const EMPTY_STRING = "";

    const S_OBJECT = "object";
    const S_FUNCTION = "function";
    const S_STRING = "string";

    const S_LOG = "log";
    const S_ERROR = "error";
    const S_WARN = "warn";
    const S_DEBUG = "debug";
    const S_INFO = "info";
    const S_TRACE = "trace";

    const S_ERR_PREFIX = `An ${S_ERROR} occurred while`;
    const S_DEFAULT_OPERATION = "executing script";

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

            this.#moduleName = (S_STRING === typeof pModuleName) ? pModuleName || "BockModulePrototype" : (S_OBJECT === typeof pModuleName ? pModuleName?.moduleName || pModuleName?.name : EMPTY_STRING) || "BockModulePrototype";
            this.#cacheKey = (S_STRING === typeof pCacheKey) ? pCacheKey || INTERNAL_NAME : (S_OBJECT === typeof pModuleName ? pModuleName?.cacheKey || pModuleName?.name : EMPTY_STRING);

            if ( S_OBJECT === typeof pModuleName )
            {
                this.extend( pModuleName );
            }
        }

        get globalScope()
        {
            return $scope();
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

        reportError( pError, pMessage = S_DEFAULT_OPERATION, pLevel = S_ERROR, pSource = EMPTY_STRING )
        {
            try
            {
                const s = EMPTY_STRING + (pMessage || S_DEFAULT_OPERATION);

                const err = pError || new Error( s );

                let msg = [S_ERR_PREFIX, s, err];

                try
                {
                    let level = (EMPTY_STRING + pLevel).trim().toLowerCase();
                    level = [S_LOG, S_INFO, S_WARN, S_DEBUG, S_ERROR].includes( level || S_ERROR ) ? level : S_ERROR;

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
                                                             message: msg.filter( e => "string" === typeof e ).join( " " ),
                                                             method: EMPTY_STRING + ((EMPTY_STRING + pSource) || this.moduleName || "BockModule"),
                                                         } ) );
                }
                catch( ex2 )
                {
                    konsole.error( ex2 );
                }
            }
            catch( ex )
            {
                // ignored
            }
        }

        get locked()
        {
            return (Object.isFrozen( this ) || Object.isSealed( this ));
        }

        extend( pObject )
        {
            if ( null != pObject && S_OBJECT === typeof pObject )
            {
                if ( !this.locked )
                {
                    return Object.assign( this, pObject || {} );
                }

                let modulePrototype = new BockModulePrototype( pObject );

                return Object.assign( modulePrototype, pObject );
            }

            return this;
        }

        expose( pObject, pCacheKey, pModuleScope = SCOPE_MODULE )
        {
            let mod = pObject || this;

            if ( null != mod && S_OBJECT === typeof mod && !(mod instanceof this.constructor) )
            {
                mod = this.extend( mod );
            }

            const MODULE = pModuleScope || (_ud !== typeof module ? module : {});

            if ( _ud !== typeof MODULE )
            {
                MODULE.exports = Object.freeze( mod || this );
            }

            const key = S_STRING === typeof pCacheKey ? (EMPTY_STRING + pCacheKey).trim() : EMPTY_STRING;

            if ( $scope() && EMPTY_STRING !== key.trim() )
            {
                $scope()[key] = Object.freeze( mod || this );
            }

            mod.dispatchEvent( new CustomEvent( "load", mod ) );

            return Object.freeze( mod || this );
        }
    }

    function exportModule( pObject, pCacheKey )
    {
        let mod = pObject;

        if ( null != mod && S_OBJECT === typeof mod && (mod instanceof this.constructor) )
        {
            mod.expose( mod, pCacheKey );
        }

        let modulePrototype = new BockModulePrototype( mod );

        mod = modulePrototype.extend( mod || pObject );

        return mod.expose( mod, pCacheKey );
    }

    BockModulePrototype.exportModule = exportModule;

    const mod =
        {
            BockModuleEvent,
            BockModulePrototype,
            CustomEvent,
            isLogger: BockModulePrototype.isLogger,
            reportError: function( pThis, pError, pMessage = S_DEFAULT_OPERATION, pLevel = S_ERROR, pSource = EMPTY_STRING )
            {
                if ( pThis instanceof BockModulePrototype )
                {
                    pThis.reportError( pError, pMessage, pLevel, pSource );
                }
                const modulePrototype = new BockModulePrototype( pThis?.name );
                modulePrototype.reportError.call( pThis || modulePrototype, pError, pMessage, pLevel, pSource );
            },
            exportModule
        };

    return exportModule( mod, INTERNAL_NAME );

}());
