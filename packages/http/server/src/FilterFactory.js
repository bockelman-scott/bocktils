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

    const mod =
        {
            classes:
                {
                    RequestFilterFactory
                },
            RequestFilterFactory
        };

    if ( "undefined" !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
