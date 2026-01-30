// noinspection GrazieInspection

/**
 * @overview
 *
 * This file defines classes for handling HTTP Requests,
 * especially those to API endpoints that impose Rate Limits.
 *
 * Its dependencies are limited to those exposed by other @toolbocks modules
 * or that are built in to node.js.
 *
 * The design goals are as follows:
 *
 * Clients of this module do not necessarily need to be aware of the rate-limiting details.
 * Clients can pass one or more instances of the RateLimits class if desired, but this should be optional,
 * and instead rely on the 'x-rate-limit' (and related) response headers
 * to interactively configure and vary behavior for each HTTP request.
 *
 * The base class, HttpClient defines the interface for the clients/consumers.
 *
 * The base class defaults to using a default delegate.
 * Subclasses can provide their own implementations of methods
 * or fallback on the super class/default delegate.
 *
 * The default implementations will use fetch (or node:fetch),
 * but subclasses using Axios are also expected.
 *
 * It should also be plausible to use other HTTP client libraries, including XmlHttpRequest.
 *
 */
/**
 * Import the http package for its Agent class.
 */
const http = require( "http" );

/**
 * Import the https package for its Agent class.
 */
const https = require( "https" );

/**
 * Imports the @toolbocks/core modules for the utility functions required
 */
const core = require( "@toolbocks/core" );

/**
 * Imports the @toolbocks/json module for the utility functions necessary to more safely parse or render JSON.
 */
const jsonUtils = require( "@toolbocks/json" );


/**
 * Imports the core constants
 */
const { constants } = core;

// Provides shorthand for the "undefined" Type
const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
/**
 * This is the IIFE that defines the classes, variables, and functions that are exported as a module.
 * Note that the exported module extends ToolBocksModule (from @toolbocks/core moduleUtils)
 */
// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK_HTTP_AGENT__";

    // if this module has already been defined and exported, return that instance
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    // import the specific modules from @toolbocks/core that are necessary for this module
    const { moduleUtils, typeUtils, stringUtils } = core;

    // import the classes, variables, and functions defined in moduleUtils that are used in this module
    const { ToolBocksModule, lock } = moduleUtils;

    // import the useful functions from the core module, TypeUtils
    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isNullOrNaN,
            isBoolean,
            clamp
        } = typeUtils;

    // import the useful functions from the core module, StringUtils
    const
        {
            asString,
            asInt,
            lcase
        } = stringUtils;

    // import the functions from the JSON Utilities that we use in this module
    const { asObject, asJson } = jsonUtils;

    const modName = "HttpAgentUtils";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    /**
     * This class is used to define the configuration of an Http (or Https) Agent.
     * Notably, this class exposes properties for whether to use keepAlive, and if so, the duration (in milliseconds).
     * While these options are defined by creating instances of this class,
     * they must be passed as POJOs (plain old JavaScript objects),
     * for which purpose the toObjectLiteral method is provided.
     * @class
     */
    class HttpAgentConfig
    {
        #keepAlive = true;
        #keepAliveMsecs = 10_000;
        #maxFreeSockets = 256;
        #maxTotalSockets = Infinity;
        #rejectUnauthorized = false;

        /**
         * Constructs an instance of the HttpAgentConfig class,
         * used to define the options passed to the constructor or either http.Agent or https.Agent.
         *
         * @param {boolean} [pKeepAlive=true]               A boolean indicating whether connections
         *                                                  should be kept alive for some period of time to be reused
         *
         * @param {number} [pKeepAliveMilliseconds=10000]   A number defining the length of time,
         *                                                  in milliseconds, that connections should be kept alive,
         *                                                  if keepAlive is true
         *
         * @param {number} [pMaxFreeSockets=256]
         * @param {number} [pMaxTotalSockets=Infinity]
         * @param {boolean} [pRejectUnauthorized=false]
         */
        constructor( pKeepAlive = true,
                     pKeepAliveMilliseconds = 10_000,
                     pMaxFreeSockets = 256,
                     pMaxTotalSockets = Infinity,
                     pRejectUnauthorized = false )
        {
            this.#keepAlive = !!pKeepAlive;
            this.#keepAliveMsecs = isNullOrNaN( pKeepAliveMilliseconds ) ? 10_000 : clamp( asInt( pKeepAliveMilliseconds, 10_000 ), 3_000, 300_000 );
            this.#maxFreeSockets = isNullOrNaN( pMaxFreeSockets ) ? Infinity : (clamp( asInt( pMaxFreeSockets, 256 ), 64, 1_024 ));
            this.#maxTotalSockets = isNullOrNaN( pMaxTotalSockets ) ? Infinity : (asInt( pMaxTotalSockets ) > 0 && asInt( pMaxTotalSockets ) > asInt( pMaxFreeSockets ) ? asInt( pMaxTotalSockets ) : Infinity);
            this.#rejectUnauthorized = !!pRejectUnauthorized;
        }

        equals( pOther )
        {
            if ( isNonNullObject( pOther ) )
            {
                return (pOther.keepAlive === this.keepAlive) &&
                       (pOther.keepAliveMsecs === this.keepAliveMsecs) &&
                       (( !isFinite( pOther.maxFreeSockets ) && !isFinite( this.maxFreeSockets )) || (pOther.maxFreeSockets === this.maxFreeSockets)) &&
                       (( !isFinite( pOther.maxTotalSockets ) && !isFinite( this.maxTotalSockets )) || (pOther.maxTotalSockets === this.maxTotalSockets));
            }
            return false;
        }

        get keepAlive()
        {
            return !!this.#keepAlive;
        }

        get keepAliveMsecs()
        {
            if ( isNullOrNaN( this.#keepAliveMsecs ) )
            {
                return 3_000;
            }

            return clamp( asInt( this.#keepAliveMsecs, 3_000 ), 1_000, 300_000 );
        }

        get maxFreeSockets()
        {
            if ( isNullOrNaN( this.#maxFreeSockets ) )
            {
                return Infinity;
            }

            return clamp( asInt( this.#maxFreeSockets, 256 ), 64, 1_024 );
        }

        get maxTotalSockets()
        {
            if ( isNullOrNaN( this.#maxTotalSockets ) )
            {
                return Infinity;
            }
            const maxTotal = asInt( this.#maxTotalSockets );
            return asInt( maxTotal ) > 0 && asInt( maxTotal ) > asInt( this.maxFreeSockets ) ? asInt( maxTotal ) : Infinity;
        }

        get rejectUnauthorized()
        {
            return !!this.#rejectUnauthorized;
        }

        /**
         * Returns an object literal whose properties are those of this instance.
         * @returns {Object} an object literal whose properties are those of this instance.
         */
        toLiteral()
        {
            let literal = {};

            literal["keepAlive"] = this.keepAlive;
            literal["keepAliveMsecs"] = this.keepAliveMsecs;
            literal["maxFreeSockets"] = this.maxFreeSockets;
            literal["maxTotalSockets"] = this.maxTotalSockets;
            literal["rejectUnauthorized"] = this.rejectUnauthorized;

            return literal;
        }

        /**
         * Returns a JSON representation of this instance
         * @returns {String} a JSON representation of this instance
         */
        toString()
        {
            return asJson( this );
        }
    }

    class HttpAgentConfigExtended extends HttpAgentConfig
    {
        #agentKeepAliveTimeoutBuffer;
        #scheduling;
        #timeout;

        constructor( pKeepAlive = true,
                     pKeepAliveMilliseconds = 15_000,
                     pMaxFreeSockets = 64,
                     pMaxTotalSockets = Infinity,
                     pRejectUnauthorized = false,
                     pAgentKeepAliveTimeoutBuffer = 1_500,
                     pScheduling = "lifo",
                     pTimeout = 15_000 )
        {
            super( pKeepAlive, pKeepAliveMilliseconds, pMaxFreeSockets, pMaxTotalSockets, pRejectUnauthorized );

            this.#agentKeepAliveTimeoutBuffer = clamp( asInt( pAgentKeepAliveTimeoutBuffer, 1_500 ), 128, 4_500 );

            this.#scheduling = lcase( asString( pScheduling || "lifo" ) );
            this.#scheduling = ["lifo", "fifo"].includes( this.#scheduling ) ? this.#scheduling : "lifo";

            this.#timeout = clamp( asInt( pTimeout ), 5_000, 19_000 );
            this.freeSocketTimeout = asInt( this.#timeout );
        }

        get agentKeepAliveTimeoutBuffer()
        {
            return clamp( asInt( this.#agentKeepAliveTimeoutBuffer, 1_500 ), 128, 4_500 );
        }

        get scheduling()
        {
            return lcase( asString( this.#scheduling, true ) || "lifo" );
        }

        get timeout()
        {
            return clamp( asInt( this.#timeout ), 5_000, 19_000 );
        }

        equals( pOther )
        {
            if ( super.equals( pOther ) )
            {
                return pOther?.scheduling === this.scheduling &&
                       pOther?.timeout === this.timeout &&
                       pOther?.agentKeepAliveTimeoutBuffer === this.agentKeepAliveTimeoutBuffer;
            }
            return false;
        }

        toLiteral()
        {
            let literal = super.toLiteral();

            literal["agentKeepAliveTimeoutBuffer"] = this.agentKeepAliveTimeoutBuffer;
            literal["scheduling"] = this.scheduling;
            literal["timeout"] = this.timeout;

            return literal;
        }

        toString()
        {
            return asJson( this );
        }
    }

    HttpAgentConfig.fromLiteral = function( pObject )
    {
        if ( isNonNullObject( pObject ) )
        {
            if ( !isNull( pObject.agentKeepAliveTimeoutBuffer ) || !isNull( pObject.timeout ) || !isNull( pObject.scheduling ) )
            {
                return new HttpAgentConfigExtended( pObject.keepAlive ?? true,
                                                    pObject.keepAliveMsecs ?? 10_000,
                                                    pObject.maxFreeSockets ?? 256,
                                                    pObject.maxTotalSockets ?? Infinity,
                                                    pObject.rejectUnauthorized ?? false,
                                                    pObject.agentKeepAliveTimeoutBuffer ?? 1_500,
                                                    pObject.scheduling ?? "lifo",
                                                    pObject.timeout ?? 15_000 );
            }
            else
            {
                return new HttpAgentConfig( pObject.keepAlive ?? true,
                                            pObject.keepAliveMsecs ?? 10_000,
                                            pObject.maxFreeSockets ?? 256,
                                            pObject.maxTotalSockets ?? Infinity,
                                            pObject.rejectUnauthorized ?? false );
            }
        }
    };

    HttpAgentConfigExtended.fromLiteral = function( pObject )
    {
        return new HttpAgentConfigExtended( pObject.keepAlive ?? true,
                                            pObject.keepAliveMsecs ?? 10_000,
                                            pObject.maxFreeSockets ?? 256,
                                            pObject.maxTotalSockets ?? Infinity,
                                            pObject.rejectUnauthorized ?? false,
                                            pObject.agentKeepAliveTimeoutBuffer ?? 1_500,
                                            pObject.scheduling ?? "lifo",
                                            pObject.timeout ?? 15_000 );
    };

    // create an instance of the HttpAgentConfig class
    // to define configuration properties
    // for the http and http agents using the class defaults
    const HTTP_AGENT_DEFAULT_CFG = lock( new HttpAgentConfig() );

    // create another instance more suitable for reading streams
    // from cloudflare/S3 backed servers
    const HTTP_AGENT_DOWNLOAD_CFG = lock( new HttpAgentConfigExtended() );

    // create a global instance of http.Agent using the default HttpAgentConfig
    const HTTP_AGENT = new http.Agent( HTTP_AGENT_DEFAULT_CFG.toLiteral() );

    // create a global instance of https.Agent using the default HttpAgentConfig
    const HTTPS_AGENT = new https.Agent( HTTP_AGENT_DEFAULT_CFG.toLiteral() );

    HttpAgentConfig.getDefault = function()
    {
        return HTTP_AGENT_DEFAULT_CFG;
    };

    HttpAgentConfig.getDownloadDefault = function()
    {
        return HTTP_AGENT_DOWNLOAD_CFG;
    };

    HttpAgentConfig.getForContext = function( pContext )
    {
        let context = isNonNullObject( pContext ) ? asObject( pContext ) : isBoolean( pContext ) ? { "forDownload": pContext } : {};

        if ( context?.forDownload )
        {
            return HttpAgentConfig.getDownloadDefault();
        }
        return HttpAgentConfig.getDefault();
    };

    HttpAgentConfig.asExtended = ( pAgentConfig ) => (isNonNullObject( pAgentConfig ) && (pAgentConfig instanceof HttpAgentConfigExtended));

    HttpAgentConfig.resolveAgentConfig = function( pAgentConfig, pExtended = HttpAgentConfig.asExtended( pAgentConfig ) )
    {
        if ( isNonNullObject( pAgentConfig ) )
        {
            if ( pExtended ? (pAgentConfig instanceof HttpAgentConfigExtended) : (pAgentConfig instanceof HttpAgentConfig) )
            {
                return pAgentConfig;
            }

            const defaultConfig = !!pExtended ? HttpAgentConfig.getDownloadDefault() : HttpAgentConfig.getDefault();

            if ( pAgentConfig instanceof http.Agent || pAgentConfig instanceof https.Agent || !!pExtended )
            {
                return new HttpAgentConfigExtended( pAgentConfig?.keepAlive ?? defaultConfig.keepAlive,
                                                    pAgentConfig?.keepAliveMsecs ?? defaultConfig.keepAliveMsecs,
                                                    pAgentConfig?.maxFreeSockets ?? defaultConfig.maxFreeSockets,
                                                    pAgentConfig?.maxTotalSockets ?? defaultConfig.maxTotalSockets,
                                                    pAgentConfig?.rejectUnauthorized ?? defaultConfig.rejectUnauthorized,
                                                    pAgentConfig?.agentKeepAliveTimeoutBuffer ?? defaultConfig.agentKeepAliveTimeoutBuffer ?? 1_500,
                                                    pAgentConfig?.scheduling ?? defaultConfig.scheduling ?? "lifo",
                                                    pAgentConfig?.timeout ?? defaultConfig.timeout ?? 15_000 ) || defaultConfig;

            }

            return new HttpAgentConfig( pAgentConfig?.keepAlive ?? defaultConfig.keepAlive,
                                        pAgentConfig?.keepAliveMsecs ?? defaultConfig.keepAliveMsecs,
                                        pAgentConfig?.maxFreeSockets ?? defaultConfig.maxFreeSockets,
                                        pAgentConfig?.maxTotalSockets ?? defaultConfig.maxTotalSockets,
                                        pAgentConfig?.rejectUnauthorized ?? defaultConfig.rejectUnauthorized ) || defaultConfig;
        }

        return !!pExtended ? HttpAgentConfig.getDownloadDefault() : HttpAgentConfig.getDefault();
    };

    function createHttpAgent( pHttpAgentConfig, pExtended = HttpAgentConfig.asExtended( pHttpAgentConfig ) )
    {
        const agentConfig = HttpAgentConfig.resolveAgentConfig( pHttpAgentConfig, pExtended );
        return new http.Agent( agentConfig.toLiteral() );
    }

    function createHttpsAgent( pHttpAgentConfig, pExtended = HttpAgentConfig.asExtended( pHttpAgentConfig ) )
    {
        const agentConfig = HttpAgentConfig.resolveAgentConfig( pHttpAgentConfig, pExtended );
        return new https.Agent( agentConfig.toLiteral() );
    }

    function resolveHttpAgent( pAgent, pAgentConfig = HTTP_AGENT_DEFAULT_CFG, pExtended = HttpAgentConfig.asExtended( pAgentConfig ) )
    {
        const extended = !!pExtended || HttpAgentConfig.asExtended( pAgentConfig );

        const agentConfig = HttpAgentConfig.resolveAgentConfig( pAgentConfig, extended );

        if ( isNonNullObject( pAgent ) && (pAgent instanceof http.Agent) )
        {
            if ( agentConfig.equals( pAgent ) )
            {
                return pAgent;
            }
            return createHttpAgent( agentConfig, extended );
        }

        if ( (isNonNullObject( HTTP_AGENT ) && (HTTP_AGENT instanceof http.Agent)) &&
             (extended ? HTTP_AGENT_DOWNLOAD_CFG : HTTP_AGENT_DEFAULT_CFG).equals( agentConfig ) )
        {
            return HTTP_AGENT;
        }

        return createHttpAgent( agentConfig, extended );
    }

    function resolveHttpsAgent( pAgent, pAgentConfig = HTTP_AGENT_DEFAULT_CFG, pExtended = HttpAgentConfig.asExtended( pAgentConfig ) )
    {
        const extended = !!pExtended || HttpAgentConfig.asExtended( pAgentConfig );

        const agentConfig = HttpAgentConfig.resolveAgentConfig( pAgentConfig, pExtended );

        if ( isNonNullObject( pAgent ) && (pAgent instanceof https.Agent) )
        {
            if ( agentConfig.equals( pAgent ) )
            {
                return pAgent;
            }
            return createHttpsAgent( agentConfig, extended );
        }

        if ( (isNonNullObject( HTTPS_AGENT ) && (HTTPS_AGENT instanceof https.Agent)) &&
             (extended ? HTTP_AGENT_DOWNLOAD_CFG : HTTP_AGENT_DEFAULT_CFG).equals( agentConfig ) )
        {
            return HTTPS_AGENT;
        }

        return createHttpsAgent( agentConfig, extended );
    }

    /**
     * This function is used to ensure that no configuration
     * has inadvertently replaced the http and/or https Agents with object literals.
     *
     * This can happen if configurations are "merged"
     * using Object.assign or object spread syntax (e.g., {...cfg1, ...cfg2})
     *
     * We try to respect any configuration settings the original agents had,
     * but if that is not plausible, we set the agents to the defaults as defined in this module.
     *
     * @param {Object|HttpConfig} pConfig  the configuration to examine (and repair, if necessary)
     *
     * @param {boolean} [pForDownload=false] indicates whether the agent(s) should be optimized for downloading binary data
     *
     * @returns {Object|HttpConfig}        the same configuration object specified,
     *                                     but with the http and http agent properties corrected, if necessary,
     *                                     to hold actual instances of http.Agent or https.Agent.
     */
    function fixAgents( pConfig, pForDownload = false )
    {
        if ( isNull( pConfig ) || !isObject( pConfig ) )
        {
            const agentConfig = HttpAgentConfig.getForContext( pForDownload );

            return {
                httpAgent: resolveHttpAgent( HTTP_AGENT, agentConfig ),
                httpsAgent: resolveHttpsAgent( HTTPS_AGENT, agentConfig )
            };
        }

        // Resets the property to an instance of http.Agent
        // We expect the variable, httpAgent, to hold an instance of http.Agent,
        // but if it is null or undefined or has been replaced with an object literal,
        // a new instance is created
        if ( (isNull( pConfig.httpAgent ) || !(pConfig.httpAgent instanceof http.Agent)) )
        {
            // Check for the scenario in which configs have been merged
            // perhaps by using spread syntax or calls to toObjectLiteral
            // resulting in an object that "looks like" an http.Agent, but is not an instance of the class
            if ( isNonNullObject( pConfig.httpAgent ) )
            {
                const agentConfig = HttpAgentConfig.resolveAgentConfig( pConfig.httpAgent || HttpAgentConfig.getForContext( pForDownload ) );
                const agent = resolveHttpAgent( pConfig.httpAgent, agentConfig, HttpAgentConfig.asExtended( agentConfig ) );
                pConfig.httpAgent = agent || HTTP_AGENT || createHttpAgent( agentConfig, pForDownload );
            }
            else
            {
                pConfig.httpAgent = resolveHttpAgent( HTTP_AGENT, HttpAgentConfig.getForContext( pForDownload ) );
            }
        }

        // Resets the property to an instance of http.Agent
        // We expect the variable, httpAgent, to hold an instance of https.Agent,
        // but if it is null or undefined or has been replaced with an object literal,
        // a new instance is created
        if ( (isNull( pConfig.httpsAgent ) || !(pConfig.httpsAgent instanceof https.Agent)) )
        {
            // Check for the scenario in which configs have been merged
            // perhaps by using spread syntax or calls to toObjectLiteral
            // resulting in an object that "looks like" an https.Agent, but is not an instance of the class
            if ( isNonNullObject( pConfig.httpsAgent ) )
            {
                const agentConfig = HttpAgentConfig.resolveAgentConfig( pConfig.httpsAgent || HttpAgentConfig.getForContext( pForDownload ) );
                const agent = resolveHttpsAgent( pConfig.httpsAgent, agentConfig, HttpAgentConfig.asExtended( agentConfig ) );
                pConfig.httpsAgent = agent || HTTPS_AGENT || createHttpsAgent( agentConfig, pForDownload );
            }
            else
            {
                pConfig.httpsAgent = resolveHttpsAgent( HTTPS_AGENT, HttpAgentConfig.getForContext( pForDownload ) );
            }
        }

        return pConfig;
    }

    HttpAgentConfig.fixAgents = fixAgents;
    HttpAgentConfig.resolveHttpAgent = resolveHttpAgent;
    HttpAgentConfig.resolveHttpsAgent = resolveHttpsAgent;

    let mod =
        {
            dependencies:
                {
                    http,
                    https,
                    core,
                    moduleUtils,
                    typeUtils,
                    stringUtils,
                    jsonUtils
                },
            classes:
                {
                    HttpAgentConfig,
                    HttpAgentConfigExtended
                },

            HTTP_AGENT_DEFAULT_CFG,
            HTTP_AGENT_DOWNLOAD_CFG,

            HttpAgentConfig,
            HttpAgentConfigExtended,

            resolveHttpAgent,
            resolveHttpsAgent,

            createHttpAgent,
            createHttpsAgent,

            httpAgent: HTTP_AGENT,
            httpsAgent: HTTPS_AGENT,

            HTTP_AGENT,
            HTTPS_AGENT,

            fixAgents
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
