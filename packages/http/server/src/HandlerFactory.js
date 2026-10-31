(function exposeModule()
{
    const toolbocks = require( "@toolbocks/core" );

    const depInjection = require( "@toolbocks/dep-injection" );

    const jsonUtils = require( "@toolbocks/json" );

    const { moduleUtils, constants, typeUtils } = toolbocks;

    const { IllegalStateError, IllegalArgumentError, $ln, lock } = moduleUtils;

    const { _ud } = constants;

    const { isFunction, getClassName } = typeUtils;

    const { DependentObject, Dependencies } = depInjection;

    const { asObject } = jsonUtils;

    /**
     * Base class to extend to create factories that return RequestHandler functions
     * with access to injected dependencies.
     *
     * The createHandler method takes any Express.js-compatible function,
     * that is, a function that takes 2 or 3 arguments: req (Request), res (Response), and optionally "next",
     * and returns a new copy of that function BOUND to the instance of RequestHandlerFactory,
     * this having access to all injected dependencies via the 'this' scope
     *
     * @abstract
     * @class
     */
    class RequestHandlerFactory extends DependentObject
    {
        /**
         * Constructs a factory
         * for binding request handler functions to itself
         * for access to injected dependencies.
         *
         * @param {Dependencies} pDependencies
         * @param {Object} pOptions
         * @param {...*} pArgs
         */
        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );
        }

        /**
         * Returns a function bound to this factory,
         * allowing the function to access properties of this instance.
         *
         * @param {function} pMiddlewareFunction a function that takes a request and a response and handles an HTTP(s) request
         * @returns {function} a function bound to this factory
         */
        createHandler( pMiddlewareFunction )
        {
            // noinspection JSUnresolvedReference
            if ( !(this.initialized || super.initialized) )
            {
                throw new IllegalStateError( `${getClassName( this )} must be initialized before createHandler can be invoked`, { detail: this } );
            }

            if ( isFunction( pMiddlewareFunction ) && $ln( pMiddlewareFunction ) >= 2 )
            {
                return pMiddlewareFunction.bind( this );
            }
            throw new IllegalArgumentError( `${getClassName( this )}::createHandler requires a function with request and response parameters`, { detail: { arg: pMiddlewareFunction } } );
        }
    }

    RequestHandlerFactory.DEPENDENCIES =
        {
            ...(asObject( DependentObject.DEPENDENCIES ))
        };

    const mod =
        {
            classes:
                {
                    RequestHandlerFactory
                },
            RequestHandlerFactory
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
