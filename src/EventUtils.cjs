/** import dependencies **/
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );

/** create an alias for console **/
const konsole = console || {};

/** define a variable for typeof undefined **/
const _ud = constants?._ud || "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__EVENT_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    let _mt_str = constants._mt_str;

    let _fun = constants._fun;
    let _obj = constants._obj;

    let no_op = constants.no_op;
    let ignore = constants.ignore || function() {};
    let populateOptions = constants.populateOptions;

    let isDefined = typeUtils.isDefined;
    let isNull = typeUtils.isNull;
    let isBoolean = typeUtils.isBoolean;
    let isFunction = typeUtils.isFunction;
    let isObject = typeUtils.isObject;
    let getClassName = typeUtils.getClassName;

    let firstMatchingType = typeUtils.firstMatchingType;

    let asString = stringUtils.asString;
    let capitalize = stringUtils.capitalize;
    let lcase = stringUtils.lcase;
    let ucase = stringUtils.ucase;

    let S_ERROR = constants.S_ERROR || "error";

    const S_ON = "on";
    const S_ABORT = "abort";
    const S_CUSTOM_EVENT = "CustomEvent";

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils
        };

    const me = exposeModule || this;

    constants.importUtilities( me || this, ...(Object.values( dependencies )) );

    const NO_HANDLER = function( pEvt, pData )
    {
        konsole.log( "No handler found for event,", pEvt.type, ", Fired on", pEvt.target, " with data: ", (pData || "~no data~") );
        return false;
    };

    function resolveEventName( pEventName, pUncapitalize = false )
    {
        let evtName = (pEventName instanceof Event) ? pEventName?.type || getClassName( pEventName ) : asString( pEventName );

        evtName = asString( ((asString( evtName, true ) || S_ERROR).trim()).replace( /^on/i, _mt_str ), true );

        if ( pUncapitalize )
        {
            evtName = stringUtils.uncapitalize( evtName );
        }

        return evtName;
    }

    function resolveEvent( pEvt )
    {
        const evt = pEvt || $scope()?.event;

        if ( evt instanceof Event )
        {
            return evt;
        }

        return new Event( asString( evt, true ) );
    }

    function isHandlerFunction( pObject )
    {
        return isFunction( pObject ) && pObject?.length > 0;
    }

    function findHandlerMethod( pObject, pEventName )
    {
        const evtName = resolveEventName( pEventName );
        return firstMatchingType( _fun, pObject?.[S_ON + evtName], pObject?.[S_ON + capitalize( evtName )], pObject?.["handle" + capitalize( evtName )], (isHandlerFunction( pObject ) ? pObject : null) );
    }

    function hasHandlerMethod( pObject, pEventName )
    {
        return isHandlerFunction( pObject ) || isHandlerFunction( findHandlerMethod( pObject, resolveEventName( pEventName ) ) );
    }

    function resolveHandler( pObject, pEventName = _mt_str )
    {
        let evtName = resolveEventName( pEventName );

        if ( isObject( pObject ) )
        {
            let handler = pObject || {};

            if ( hasHandlerMethod( pObject, evtName ) )
            {
                return handler;
            }
        }

        return isHandlerFunction( pObject, evtName ) ? pObject : null;
    }

    function resolveEventData( pEvt, pData, pAbortController, pThis, pDispatcher )
    {
        const thiz = !isNull( pThis ) && isObject( pThis ) ? pThis : ($scope() === this ? {} : this || {});

        let evt = resolveEvent( pEvt );

        let data = pData || evt?.detail;

        data = !isNull( data ) ? isObject( data ) ? data : { data } : {};

        data.__event_source = thiz.delegate || thiz;
        data.__dispatcher = !isNull( pDispatcher ) && isObject( pDispatcher ) ? pDispatcher : thiz;

        if ( pAbortController instanceof AbortController )
        {
            data.__abortController = pAbortController;
        }

        return data || {};
    }

    class BespokeEvent extends Event
    {
        #type;
        #detail;

        constructor( pEventName, pData )
        {
            super( resolveEventName( pEventName ) );

            this.#type = resolveEventName( pEventName );
            this.#detail = resolveEventData( this, pData );
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
        CustomEvent = BespokeEvent;
    }

    /**
     *
     * @param {object|Function} pObject
     * @param {string} pEventName
     * @returns {boolean}
     */
    const canHandle = function( pObject, pEventName )
    {
        const evtName = resolveEventName( pEventName );

        const handler = resolveHandler( pObject, evtName );

        return hasHandlerMethod( handler, evtName );
    };

    /**
     *
     * @param {object} pObject
     * @param {string} pEventName
     * @param pOptions
     * @param pThis an object to treat as 'this' inside the handler
     * @returns {(function(*, *): boolean)|*|(function(*, *): (*|undefined))}
     */
    const buildHandler = function( pObject, pEventName, pOptions = DEFAULT_HANDLER_OPTIONS, pThis )
    {
        const evtName = resolveEventName( pEventName );

        const handler = resolveHandler( pObject, evtName );

        if ( null === handler )
        {
            return NO_HANDLER;
        }

        const thiz = firstMatchingType( _obj, (pThis || handler || pObject), (handler || pObject), pObject );

        const options = populateOptions( pOptions, DEFAULT_HANDLER_OPTIONS );

        if ( canHandle( handler, evtName ) )
        {
            const func = (isHandlerFunction( handler ) ? handler : findHandlerMethod( handler, evtName )) || NO_HANDLER;

            return function( pEvt, pData )
            {
                const evt = resolveEvent( pEvt );

                const data = resolveEventData( evt, (pData || evt.detail || options), options?.controller, thiz, options?.dispatcher );

                return func.call( (thiz || handler || pObject), evt, data );
            };
        }

        return NO_HANDLER;
    };

    const DEFAULT_HANDLER_OPTIONS =
        {
            capture: false,
            bubbles: true,
            passive: false,
            once: false,
            signal: null
        };

    function resolveOptions( pOptions )
    {
        return Object.assign( { ...DEFAULT_HANDLER_OPTIONS }, isBoolean( pOptions ) ? { capture: pOptions } : populateOptions( pOptions, DEFAULT_HANDLER_OPTIONS ) );
    }

    const generateHandlerOptions = function( pCapture = DEFAULT_HANDLER_OPTIONS["capture"],
                                             pOnce = DEFAULT_HANDLER_OPTIONS["once"],
                                             pPassive = DEFAULT_HANDLER_OPTIONS["passive"],
                                             pSignal = DEFAULT_HANDLER_OPTIONS["signal"] )
    {
        const options =
            {
                capture: !!pCapture,
                once: !!pOnce,
                passive: !!pPassive,
                signal: pSignal
            };

        return populateOptions( options, DEFAULT_HANDLER_OPTIONS );
    };

    const generateAbortController = function( pOnAbort = no_op )
    {
        const controller = new AbortController();

        const signal = controller.signal;

        if ( isObject( pOnAbort ) || isFunction( pOnAbort ) )
        {
            const handler = resolveHandler( pOnAbort, S_ABORT );

            if ( canHandle( handler, S_ABORT ) )
            {
                signal.addEventListener( S_ABORT, buildHandler( handler, S_ABORT, DEFAULT_HANDLER_OPTIONS, signal ), { signal } );
            }
        }

        return { controller, signal };
    };

    const generateCancelableHandlerOptions = function( pOnAbort )
    {
        const { controller, signal } = generateAbortController( pOnAbort );

        const options = generateHandlerOptions( false, false, false, signal );

        options.controller = controller;
        options.signal = signal;

        return options;
    };

    const kill = function( pEvt )
    {
        const evt = resolveEvent( pEvt );

        if ( evt )
        {
            if ( isFunction( evt?.preventDefault ) )
            {
                evt.preventDefault();
            }

            if ( isFunction( evt.stopPropagation ) )
            {
                evt.stopPropagation();
            }

            evt.cancelBubble = isFunction( evt?.cancelBubble ) ? () => true : true;

            evt.returnValue = false;
        }

        return false;
    };

    const killEvent = function( pEvt, pOnException = ignore )
    {
        const handleError = (isFunction( pOnException )) ? pOnException : ignore;

        try
        {
            return kill( resolveEvent( pEvt ) );
        }
        catch( ex )
        {
            try
            {
                handleError( ex );
            }
            catch( ex2 )
            {
                ignore( ex2 );
            }
        }
    };

    /**
     *
     * @param {object} pTarget
     * @param {string} pEventName
     * @param {Function|object} pHandler
     * @param pOptions
     */
    const replaceEventHandler = function( pTarget, pEventName, pHandler, pOptions )
    {
        const target = firstMatchingType( _obj, pTarget, pHandler, {} );

        if ( target )
        {
            const evtName = resolveEventName( pEventName );

            const options = resolveOptions( pOptions );

            const handler = buildHandler( resolveHandler( pHandler, evtName ), evtName, options, target );

            try
            {
                if ( target instanceof EventTarget || isFunction( target?.addEventListener ) )
                {
                    if ( isFunction( target?.removeEventListener ) )
                    {
                        target.removeEventListener( evtName, handler, options );
                    }

                    if ( isFunction( target?.addEventListener ) )
                    {
                        target.addEventListener( evtName, handler, options );
                    }
                }
            }
            catch( ex )
            {
                konsole.error( "Could not replace event handler for event type,", asString( pEventName ), ", for target, ", (target?.name || typeof target), ex );
            }
        }
    };

    /**
     * Extends EventTarget to be used as a base class
     * for any classes we want to define
     * that can then subscribe to or emit events
     *
     * Or we can use composition by making classes with a property of this type and delegating to it
     */
    class Dispatcher extends EventTarget
    {
        #options;

        #delegate;

        constructor( pOptions = DEFAULT_HANDLER_OPTIONS, pObject = null )
        {
            super();

            this.#options = Object.assign( { ...DEFAULT_HANDLER_OPTIONS }, populateOptions( resolveOptions( pOptions ), DEFAULT_HANDLER_OPTIONS ) );

            if ( !isNull( pObject ) && isObject( pObject ) )
            {
                Dispatcher.bindDispatcher( pObject, this, this.#options );
                this.#delegate = pObject;
            }
        }

        get options()
        {
            return Object.assign( {}, populateOptions( this.#options, DEFAULT_HANDLER_OPTIONS ) );
        }

        get delegate()
        {
            return this.#delegate || this;
        }

        dispatch( pEventName, pData, pAbortController )
        {
            let eventName = resolveEventName( pEventName );

            let data = resolveEventData.call( this.delegate || this, pData, pAbortController, this );

            let evt = new CustomEvent( eventName, data );

            return this.dispatchEvent( evt );
        }

        canHandle( pObject, pEventName )
        {
            return canHandle( pObject, pEventName );
        }

        /**
         *
         * @param {object} pObject
         * @param {string} pEventName
         * @param pOptions
         * @param pThis
         * @returns {*|(function(*, *): (*|undefined))|(function(*, *): boolean)}
         */
        buildHandler( pObject, pEventName, pOptions = DEFAULT_HANDLER_OPTIONS, pThis )
        {
            const options = Object.assign( { ...this.options }, populateOptions( resolveOptions( pOptions ), this.options ) );
            return buildHandler( pObject, resolveEventName( pEventName ), options, firstMatchingType( _obj, pThis, this.delegate, this ) );
        }

        replaceEventHandler( pEventName, pHandler, pOptions )
        {
            const options = Object.assign( { ...this.options }, populateOptions( resolveOptions( pOptions ), this.options ) );
            replaceEventHandler( this, resolveEventName( pEventName ), pHandler, options );
        }

        killEvent( pEvt, pOnException = ignore )
        {
            return killEvent( resolveEvent( pEvt ), pOnException );
        }

        abortEvent( pEvt, pData )
        {
            const evt = resolveEvent( pEvt );

            let data = resolveEventData( evt, (pData || evt.detail || {}) );

            const killed = killEvent( evt, data?.onException );

            if ( data?.__abortController instanceof AbortController )
            {
                try
                {
                    data.__abortController.abort();
                }
                catch( ex )
                {
                    ignore( ex );
                }
            }

            return killed;
        }
    }

    Dispatcher.bindDispatcher = function( pObject, pDispatcher, pOptions )
    {
        const opts = Object.assign( { ...DEFAULT_HANDLER_OPTIONS }, populateOptions( resolveOptions( pOptions ), DEFAULT_HANDLER_OPTIONS ) );

        const dispatcher = pDispatcher instanceof Dispatcher ? pDispatcher : new Dispatcher( opts );

        const obj = isObject( pObject ) && !isNull( pObject ) ? (pObject || {}) : {};

        if ( obj === dispatcher )
        {
            return obj;
        }

        obj.dispatchEvent = function( pEvt )
        {
            const evt = resolveEvent( pEvt );
            dispatcher.dispatchEvent.call( obj, evt );
        };

        function resolveArguments( pOptions, pHandler, pEventName )
        {
            const options = Object.assign( { ...opts }, populateOptions( resolveOptions( pOptions ), opts ) );

            const eventName = resolveEventName( pEventName );
            const handler = dispatcher.buildHandler( pHandler, eventName, options, obj || dispatcher.delegate );

            return { options, handler, eventName };
        }

        obj.addEventListener = function( pEventName, pHandler, pOptions )
        {
            const {
                options,
                handler,
                eventName
            } = resolveArguments( resolveOptions( pOptions ), pHandler, pEventName );
            dispatcher.addEventListener( eventName, handler, options );
        };

        obj.removeEventListener = function( pEventName, pHandler, pOptions )
        {
            const {
                options,
                handler,
                eventName
            } = resolveArguments( resolveOptions( pOptions ), pHandler, pEventName );
            dispatcher.removeEventListener( eventName, handler, options );
        };

        obj.dispatch = function( pEventName, pData, pAbortController )
        {
            dispatcher.dispatch.call( obj, resolveEventName( pEventName ), pData, pAbortController );
        };

        obj.replaceEventHandler = function( pEventName, pHandler, pOptions )
        {
            const {
                options,
                handler,
                eventName
            } = resolveArguments( resolveOptions( pOptions ), pHandler, pEventName );
            dispatcher.replaceEventHandler.call( obj, eventName, handler, options );
        };

        obj.canHandle = function( pObject, pEventName )
        {
            return dispatcher.canHandle.call( obj, (pObject || obj), resolveEventName( pEventName ) );
        };

        obj.buildHandler = function( pObject, pEventName, pOptions )
        {
            const options = Object.assign( { ...opts }, populateOptions( resolveOptions( pOptions ), DEFAULT_HANDLER_OPTIONS ) );
            return dispatcher.buildHandler.call( obj, (pObject || obj), resolveEventName( pEventName ), options, obj || dispatcher.delegate );
        };

        obj.killEvent = function( pEvt, pOnException = ignore )
        {
            const evt = resolveEvent( pEvt );
            return dispatcher.killEvent.call( obj, evt, pOnException );
        };

        obj.abortEvent = function( pEvt, pData )
        {
            const evt = resolveEvent( pEvt );
            const data = resolveEventData( evt, (pData || evt.detail || opts) );
            return dispatcher.abortEvent.call( obj, evt, data );
        };

        return obj;
    };

    const mod =
        {
            dependencies,
            classes: { Dispatcher, BespokeEvent, CustomEvent },
            Dispatcher,
            resolveEvent,
            resolveEventName,
            resolveEventData,
            resolveHandler,
            resolveOptions,
            hasHandlerMethod,
            canHandle,
            buildHandler,
            generateHandlerOptions,
            generateAbortController,
            generateCancelableHandlerOptions,
            replaceEventHandler,
            killEvent
        };

    // when running in a Node.js environment, we assign the module to the global module.exports
    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    // Cache the module in the global scope to avoid re-executing the logic in this IIFE
    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    return Object.freeze( mod );
}());
