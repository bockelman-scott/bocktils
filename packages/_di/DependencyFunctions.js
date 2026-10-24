(function exposeModule()
{
    /**
     * Import the core ToolBocks classes and functions.
     * These are general-purpose constants and utilities
     * for inspecting types, manipulating strings, arrays, and objects.
     *
     * Additionally, the core library provides internationalization/localization (i18n, l10n),
     * number parsing, and an event-based error-handling mechanism.
     *
     * For source code and documentation, navigate to:
     * https://github.com/bockelman-scott/bocktils/tree/master/packages/core
     *
     */
    const core = require( "@toolbocks/core" );

    /**
     * Import the basic logging utilities
     */
    const logUtils = require( "@toolbocks/logging" );

    const dependencyConstants = require( "./DependencyConstant.js" );

    // destructure the individual utilities module from the imported ToolBocks core library
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, guidUtils } = core;

    const { lock, no_op } = moduleUtils;

    const { _ud = "undefined" } = constants;

    // destructure the classes and function from ToolBocks TypeUtils module that are used in this module
    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isFunction,
            isAsyncFunction,
            isDate,
            isString
        } = typeUtils;

    // destructure the specific functions from the ToolBocks String Utilities module that are used in this module
    const { isJson } = stringUtils;

    // destructure the specific functions from the ToolBocks Array Utilities module that are used in this module
    const { asArray } = arrayUtils;

    const { SimpleLogger } = logUtils;

    const { DEP_CONSTS } = dependencyConstants;

    // these are used for locale-aware string comparisons
    const CASE_INSENSITIVE_COLLATOR = new Intl.Collator( ["en", "es"], { sensitivity: "base", numeric: true } );
    const CASE_SENSITIVE_COLLATOR = new Intl.Collator( ["en", "es"], { sensitivity: "case", numeric: true } );

    const DEFAULT_LOGGER = new SimpleLogger( console );

    /**
     * Returns true if the specified value is an object or a string that is a JSON representation of an object
     * @param {Object|String} pValue - a non-null object or a string that is the JSON representation of an object
     * @returns {boolean}
     */
    function isObjOrJson( pValue )
    {
        return isNonNullObject( pValue ) || (isString( pValue ) && isJson( pValue ));
    }

    /**
     * Returns true if the specified value is an object with a method named 'dispose'.
     *
     * Objects that need to perform finalization and/or release resources
     * should define a synchronous or asynchronous method named 'dispose' which can be called
     * when the object is no longer required.
     *
     * @param {Object} pObject The object to evaluate
     * @returns {boolean} Returns true if the object has a dispose method
     */
    const isDisposable = ( pObject ) => isNonNullObject( pObject ) && isFunction( pObject.dispose );

    /**
     * Returns true if the specified value is an object with an asynchronous method named 'dispose'
     *
     * @param {Object} pObject The object to evaluate
     * @returns {boolean} Returns true if the object has an asynchronous dispose method
     */
    const isAsyncDisposable = ( pObject ) => isDisposable( pObject ) && isAsyncFunction( pObject.dispose );


    /**
     * Returns true if the specified value is an object with a method named 'init'
     *
     * @param {Object} pObject The object to evaluate
     * @returns {boolean} Returns true if the object has an init method
     */
    const isInitializable = ( pObject ) => isNonNullObject( pObject ) && isFunction( pObject.init );

    /**
     * Returns true if the specified value is an object with an asynchronous method named 'init'
     *
     * @param {Object} pObject The object to evaluate
     * @returns {boolean} Returns true if the object has an asynchronous init method
     */
    const isAsyncInitializable = ( pObject ) => isInitializable( pObject ) && isAsyncFunction( pObject.init );


    /**
     * Returns true if the specified value is an object with an initialized property
     * and that property's value === true
     *
     * Note that property value must be exactly equal to the boolean value,
     * 'truthy'-only values will otherwise be regarded as false
     *
     * @param {object} pObject The object to evaluate
     * @returns {boolean} true, if and only if, the object has a property named 'initialized'
     *                    and that property's value is exactly equal to the boolean, true.
     */
    const isInitialized = ( pObject ) => isNonNullObject( pObject ) && ( !isInitializable( pObject ) || (true === pObject.initialized || isDate( pObject.initDate )));

    const isDisposed = ( pObject ) => isNull( pObject ) || !isObject( pObject ) || (isInitializable( pObject ) && !isInitialized( pObject ));


    /**
     * Returns an integer value that is less than zero.
     *
     * Can be used to indicate an object has yet to be persisted
     * or does not participate in a persistence strategy in which a numeric ID is relevant.
     *
     * @returns {number} an integer value that is less than zero
     */
    const generateTemporaryId = () =>
    {
        // values <= 0 indicate that the object is newly created or does not have a relevant ID
        return -(Date.now());
    };

    /**
     * Return a GUID (Globally Unique Identifier) to be used as temporary ID.
     *
     * @returns {string} A randomly generated GUID.
     */
    const generateGuid = () =>
    {
        return guidUtils.uuid();
    };

    const hashContent = ( pContent ) =>
    {
        return guidUtils.hashSync( pContent, "sha256" );
    };


    /**
     * This constant defines the method names that can represent 'init' or 'dispose'
     */
    const DEPENDENCY_METHODS = lock( {
                                         INIT: lock( ["init", "open", "start", "acquire", "connect", "execute"] ),
                                         DISPOSE: lock( ["dispose", "close", "stop", "release", "disconnect", "exit"] )
                                     } );

    const DEPENDENCY_EVENTS = lock( {
                                        INITIALIZED: "DependencyInitialized",
                                        DISPOSED: "DependencyDisposed",
                                        DEPENDENCY_REGISTERED: "DependencyRegistered",
                                        DEPENDENCY_UNREGISTERED: "DependencyUnregistered",
                                        REGISTRY_ERROR: "RegistryError"
                                    } );

    /**
     * Returns true if the specified object
     * has one of the methods listed in the
     * DEPENDENCY_METHODS.DISPOSE array.
     *
     * @param {object} pObject the object to evaluate
     *
     * @returns {boolean} true if the object has a method that can be used to 'dispose',
     *                    or otherwise deactivate it.
     *
     *                    The assumption is that the component may hold system, or external, resources
     *                    that should be released before the object is garbage collected.
     */
    const isComponentDisposable = ( pObject ) =>
    {
        return isNonNullObject( pObject ) &&
               asArray( DEPENDENCY_METHODS.DISPOSE ).some( e => isFunction( pObject[e] ) );
    };

    /**
     * Returns true if the specified object
     * has one of the methods listed in the
     * DEPENDENCY_METHODS.INIT array.
     *
     * @param {object} pObject the object to evaluate
     * @returns {boolean} true if the object has a method that can be used to initialize or activate it.
     *
     *                    The assumption is that the component needs
     *                    to connect to, or acquire, external or system resources
     *                    before it can be used.
     */
    const isComponentInitializable = ( pObject ) =>
    {
        return isNonNullObject( pObject ) &&
               asArray( DEPENDENCY_METHODS.INIT ).some( e => isFunction( pObject[e] ) );
    };

    const initializeComponent = (async( pComponent, ...pArgs ) =>
    {
        let component = pComponent;

        if ( isComponentInitializable( pComponent ) && !isInitialized( component ) )
        {
            let initMethod = asArray( DEPENDENCY_METHODS.INIT ).find( e => isFunction( pComponent[e] ) );

            initMethod = isFunction( initMethod ) ? initMethod : ((isString( initMethod ) ? pComponent[initMethod] : (isNonNullObject( initMethod ) ? (initMethod?.init ?? no_op) : no_op)));

            if ( isFunction( initMethod ) )
            {
                component = await initMethod.bind( pComponent ).call( pComponent, ...pArgs );
            }
        }

        return await (component ?? pComponent);
    });

    const disposeComponent = ( pComponent, ...pArgs ) =>
    {
        let component = pComponent;

        if ( isComponentDisposable( pComponent ) )
        {
            let disposeMethod = asArray( DEPENDENCY_METHODS.DISPOSE ).find( e => isFunction( pComponent[e] ) );

            disposeMethod = isFunction( disposeMethod ) ? disposeMethod.bind( pComponent ) : (isString( disposeMethod ) ? pComponent[disposeMethod] : (isNonNullObject( disposeMethod ) ? disposeMethod.dispose ?? no_op : no_op));

            if ( isFunction( disposeMethod ) )
            {
                component = disposeMethod.bind( pComponent ).call( pComponent, ...pArgs );
            }
        }

        return component ?? pComponent;
    };

    /**
     * Returns true if the specified object has a compatible init-like method and a compatible dispose-like method
     * @param {Object} pObject - the object to evaluate
     * @returns {boolean} true if the specified object has a compatible init-like method and a compatible dispose-like method
     */
    const isComponent = ( pObject ) => isNonNullObject( pObject ) && isComponentInitializable( pObject ) && isComponentDisposable( pObject );

    const mod =
        lock( {
                  DEP_CONSTS,
                  DEPENDENCY_METHODS,
                  DEPENDENCY_EVENTS,

                  CASE_INSENSITIVE_COLLATOR,
                  CASE_SENSITIVE_COLLATOR,

                  DEFAULT_LOGGER,

                  isObjOrJson,

                  isDisposable,
                  isAsyncDisposable,
                  isComponentDisposable,
                  isDisposed,
                  disposeComponent,

                  isInitializable,
                  isAsyncInitializable,
                  isComponentInitializable,
                  isInitialized,
                  initializeComponent,

                  isComponent,

                  generateTemporaryId,
                  generateGuid,

                  hashContent
              } );

    if ( _ud !== typeof module )
    {
        module.exports = mod;
    }

    return mod;

}());
