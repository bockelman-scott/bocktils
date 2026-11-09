(function exposeModule()
{
    const { RequestHandlerFactory } = require( "./HandlerFactory.js" );

    class RequestFilterFactory extends RequestHandlerFactory
    {
        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );
        }

        createFilter( pMiddlewareFunction, pForceAsync = false, pAbortable = false )
        {
            return super.createHandler( pMiddlewareFunction, pForceAsync, pAbortable );
        }
    }

    RequestFilterFactory.DEPENDENCIES = { ...(RequestHandlerFactory.DEPENDENCIES) };

    const mod =
        {
            classes:
                {
                    RequestFilterFactory,
                    RequestHandlerFactory
                },
            RequestFilterFactory
        };

    if ( "undefined" !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
