/**
 * This statement imports the common utils modules:
 * Constants, TypeUtils, StringUtils, ArrayUtils, ObjectUtils, and JsonUtils
 */
const utils = require( "./CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../utils/CommonUtils.cjs
 */
const constants = utils?.constants || require( "./Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "./TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "./StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "./ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "./ObjectUtils.cjs" );
const jsonUtils = utils?.jsonUtils || require( "./JsonUtils.cjs" );

const logUtils = require( "./LogUtils.cjs" );

(function makeModule()
{
    let _mt_str = constants._mt_str || "";

    let _str = constants._str || "string";
    let _obj = constants._obj || "object";
    let _fun = constants._fun || "function";

    let asString = stringUtils.asString || function( s ) { return ((_mt_str + s).trim()); };
    let isBlank = stringUtils.isBlank || function( s ) { return _mt_str === asString( s, true ).trim(); };

    let isString = objectUtils.isString || function( s ) { return _str === typeof s; };
    let isObject = objectUtils.isObject || function( o ) { return _obj === typeof o; };
    let isFunction = objectUtils.isFunction || function( o ) { return _fun === typeof o; };

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    utils.importUtilities( this, utils, constants, stringUtils, arrayUtils, objectUtils );

    class ActivityType
    {
        #name;
        #code;
        #description;

        #error;

        constructor( pName, pCode, pDescription )
        {
            this.#name = asString( pName );
            this.#code = asString( pCode );
            this.#description = asString( pDescription );
        }

        get name()
        {
            return this.#name;
        }

        get code()
        {
            return this.#code;
        }

        get description()
        {
            return this.#description;
        }

        get isError()
        {
            return this.#error;
        }

        set isError( value )
        {
            this.#error = value;
        }
    }

    const REQUEST_RECEIVED = new ActivityType( "REQUEST_RECEIVED", "01", "A request was received" );
    const REQUEST_PARSED = new ActivityType( "REQUEST_PARSED", "02", "A request was parsed" );

    const RESPONSE_SENT = new ActivityType( "RESPONSE_SENT", "99", "A response was sent" );

    class Activity
    {
        #payload;
        #type;
        #requestId;

        constructor( pPayload, pType, pRequestId )
        {
            this.#payload = pPayload;
            this.#type = pType;
            this.#requestId = pRequestId;
        }

        get payload()
        {
            return this.#payload;
        }

        get type()
        {
            return this.#type;
        }

        get requestId()
        {
            return this.#requestId;
        }
    }

    /**
     * This class is used to create an object that will log activities
     * to a storage container and (optionally) to a log file
     *
     * Optionally, given a remote URI, it can post activities to a central server
     * for offsite observation
     *
     * This class is intended for creating long-lived instances.
     * For convenience and additional functionality, @see RequestActivityLogger,
     * which is intended for request-scoped activities
     */
    class ActivityLogger
    {
        #database;
        #logger;
        #remoteUrl;
        #defaultStorageCollection = "activities";
        #storageOverrides = {};

        constructor( pDatabase, pLogger, pStorageCollection, pRemoteUrl )
        {
            this.#database = pDatabase;

            this.#logger = pLogger;

            this.#remoteUrl = asString( pRemoteUrl, true ) || _mt_str;

            this.#defaultStorageCollection = "activities";

            this.#storageOverrides = {};
        }

        get logger()
        {
            return this.#logger || logUtils.findDefaultLogger() || console;
        }

        async findLogger()
        {
            return this.#logger || await logUtils.findGlobalLogger();
        }

        get remoteUrl()
        {
            return this.#remoteUrl;
        }

        async getDatabase()
        {
            if ( this.#database && isFunction( this.#database?.insert ) )
            {
                return Promise.resolve( this.#database );
            }
            return Promise.resolve( { insert: no_op } );
        }

        overrideStorageCollectionFor( pType, pCollectionName )
        {
            if ( !(isBlank( pType ) || isBlank( pCollectionName )) )
            {
                this.#storageOverrides[pType] = pCollectionName;
            }
        }

        getStorageCollectionFor( pType )
        {
            return this.#storageOverrides[pType] || this.#defaultStorageCollection || "activities";
        }

        async logActivity( pPayload, pActivityType, pRequestId )
        {
            let payload = pPayload;
            let activityType = pActivityType;
            let requestId = pRequestId;

            const activity = new Activity( payload, activityType, requestId );

            const db = await this.getDatabase();

            if ( db && isFunction( db?.insert ) )
            {
                try
                {
                    const collectionName = this.getStorageCollectionFor( pActivityType ) || this.#defaultStorageCollection;

                    await db.insert( collectionName, activity );
                }
                catch( ex )
                {
                    const logger = await this.findLogger();

                    if ( logger || this.logger )
                    {
                        (logger || this.logger).error( "Could not insert an activity record for " + (activity?.type || " this operation"), logUtils.err( ex ) );
                    }
                }
            }

            const logger = await this.findLogger();

            if ( logger || this.logger )
            {
                if ( activityType.isError )
                {
                    (logger || this.logger).error( activity );
                }
                else
                {
                    (logger || this.logger).info( activity );
                }
            }

            if ( !isBlank( this.#remoteUrl ) )
            {
                // TODO
            }

            return activity;
        }

        requestSpecificActivityLogger( pRequestId )
        {
            if ( !isBlank( this.requestId ) && asString( this.requestId, true ) === asString( pRequestId, true ) )
            {
                return this;
            }
            return new RequestActivityLogger( pRequestId || this.requestId, this._database, this._logger, this._remoteUrl );
        }
    }

    Activity.Types.entries().forEach( entry => ActivityLogger.prototype["log" + asString( entry[0] )] = (async function( pRequestId, pPayload ) { await this.logActivity( pRequestId, entry[1], pPayload ); }) );

    /**
     * This subclass is intended for creating an activity logger
     * scoped to the lifetime of a specific request.
     *
     * DO NOT REUSE INSTANCES OF THIS CLASS FOR MULTIPLE REQUESTS
     */
    class RequestActivityLogger extends ActivityLogger
    {
        constructor( pRequestId, pDatabase, pLogger, pRemoteUrl )
        {
            super( pDatabase, pLogger, pRemoteUrl );

            this._requestId = pRequestId || "--unidentified request--";

            this._activitiesPerformed = [];
        }

        get requestId()
        {
            return this._requestId || "--unidentified request--";
        }

        // noinspection FunctionWithInconsistentReturnsJS
        async logActivity( pActivityType, pPayload )
        {
            let args = arguments;

            let requestId = this.requestId;
            let activityType = pActivityType;
            let payload = pPayload || [...args].slice( 1 );

            if ( !stringUtils.isAllCaps( args[0], false ) && (objectUtils.isString( args[1] ) && stringUtils.isAllCaps( args[1], false )) )
            {
                requestId = pActivityType || this.requestId || "--unidentified request--";
                activityType = pPayload || [...args].slice( 1 );
                payload = ([...args].slice( 2 ));
            }

            const activity = await super.logActivity( requestId, activityType, payload );

            this._activitiesPerformed.push( activity );

            return activity;
        }

        async logError( pError )
        {
            let args = arguments;

            let requestId = this.requestId || "--unidentified request--";
            let payload = pError || [...args].slice( 0 );

            if ( args.length > 1 )
            {
                requestId = pError || this.requestId || "--unidentified request--";
                payload = [...args].slice( 1 );
            }

            const activity = await super.logActivity( requestId, "ERROR_ENCOUNTERED", ...[(payload || pError)] );

            this._activitiesPerformed.push( activity );

            return activity;
        }

        get activitiesPerformed()
        {
            return [].concat( this._activitiesPerformed || [] );
        }
    }

    /**
     * This is a factory method that can be called with either:
     *
     *        pRequestId, pDatabase, pLogger, pRemoteUrl
     * or
     *        pDatabase, pLogger, pRemoteUrl
     *
     * Depending on the types of the arguments passed,
     * this method will return either a RequestActivityLogger or an ActivityLogger
     *
     * @param pRequestId either the string identifying a specific request being handled
     *                   or a Persistent Storage Handler (that is, a database, for example)
     * @param pDatabase  either an object that provides persistence methods, such as insert, select, update, or remove
     *                   or an object that provides console-like logging functionality, such as info, warn, debug, and error
     * @param pLogger    either an object that provides console-like logging functionality, such as info, warn, debug, and error
     *                   or a string representing a remote API endpoint to which data can be posted
     * @param pRemoteUrl either a string representing a remote API endpoint to which data can be posted
     *                   or -- undefined --
     */
    const createActivityLogger = function( pRequestId, pDatabase, pLogger, pRemoteUrl )
    {
        const requestId = isString( pRequestId ) ? pRequestId : _mt_str;
        const database = (isObject( pDatabase ) && isFunction( pDatabase?.insert )) ? pDatabase : pRequestId;
        const logger = (isObject( pLogger ) && isFunction( pLogger?.info || pLogger?.warn )) ? pLogger : pDatabase;
        const remoteUrl = (isString( pRemoteUrl && asString( pRemoteUrl, true ).startsWith( "http" ) )) ? pRemoteUrl : (isString( pLogger ) ? pLogger : null);

        const activityLogger = new ActivityLogger( database, logger, remoteUrl );

        if ( !isBlank( requestId ) )
        {
            return activityLogger.requestSpecificActivityLogger( requestId );
        }

        return activityLogger;
    };

    const mod =
        {
            classes: { ActivityLogger, Activity, RequestActivityLogger },
            ActivityLogger,
            Activity,
            ActivityTypes: Activity.Types,
            RequestActivityLogger,
            createActivityLogger,
            logActivity: async function( pRequestId, pActivityType, pPayload, pDatabase, pLogger )
            {
                const activityLogger = new ActivityLogger( pDatabase, pLogger );
                await activityLogger.logActivity( pRequestId, pActivityType, pPayload );
            },
            createRequestSpecificActivityLogger: async function( pRequestId, pDatabase, pLogger, pRemoteUrl )
            {
                return new RequestActivityLogger( pRequestId, pDatabase, pLogger, pRemoteUrl );
            }
        };

    Activity.Types.entries().forEach( entry => mod[entry[0]] = entry[1] );

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
