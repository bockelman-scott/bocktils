/**
 * This module exposes classes to digest and expose configuration values,
 * including routes, filters, and handlers,
 * as well as basic variables, such as the port, ssl key paths, etc.
 *
 * @module
 */

(function exposeModule()
{
    const toolbocks = require( "@toolbocks/core" );


    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = toolbocks;

    const { _ud, _mt } = constants;

    class ServerConfiguration
    {
        #port = 3000;
        #useSsl = true;
        #keyPath = _mt;
        #certPath = _mt;

        #filterFactory;
        #filters = [];

        #handlerFactory;

        #routePrefix = _mt;
        #routes = [];


        constructor( pPort = 3000,
                     pUseSsl = false,
                     pKeyPath = _mt,
                     pCertPath = _mt,
                     pFilterFactory,
                     pFilters,
                     pHandlerFactory,
                     pRoutes,
                     pRoutePrefix = _mt )
        {
            this.#port = pPort;
            this.#useSsl = pUseSsl;
            this.#keyPath = pKeyPath;
            this.#certPath = pCertPath;
            this.#filterFactory = pFilterFactory;
            this.#filters = pFilters;
            this.#handlerFactory = pHandlerFactory;
            this.#routePrefix = pRoutePrefix;
            this.#routes = pRoutes;
        }
    }

    class Server
    {

    }

}());
