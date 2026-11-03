(function exposeModule()
{
    const toolbocks = require( "@toolbocks/core" );

    const { RequestHandlerFactory } = require( "./HandlerFactory.js" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = toolbocks;

    const { _ud, _mt } = constants;

    class RequestFilterFactory extends RequestHandlerFactory
    {
        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );
        }
    }

    class ResponseFilterFactory extends RequestFilterFactory
    {
        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );
        }

    }



}());
