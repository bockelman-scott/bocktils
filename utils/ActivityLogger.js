/**
 * This statement imports the common utils modules:
 * Constants, StringUtils, ArrayUtils, ObjectUtils, and JsonUtils
 */
const utils = require( "./CommonUtils" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../utils/CommonUtils.js
 */
const constants = utils?.constants || require( "../utils/Constants.js" );
const stringUtils = utils?.stringUtils || require( "../utils/StringUtils.js" );
const arrayUtils = utils?.arrayUtils || require( "../utils/ArrayUtils.js" );
const objectUtils = utils?.objectUtils || require( "../utils/ObjectUtils.js" );
const jsonUtils = utils?.jsonUtils || require( "../utils/JsonUtils.js" );

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
    constants.importUtilities( this, utils, constants, stringUtils, arrayUtils, objectUtils );

    /**
     * This class is used to create an object that will log activities
     * to the local storage container and to the log file
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
        constructor( pDatabase, pLogger, pRemoteUrl )
        {
            this._database = pDatabase;

            this._logger = pLogger;

            this._remoteUrl = asString( pRemoteUrl, true ) || _mt_str;

            this._defaultStorageCollection = "activities";

            this._storageOverrides = {};
        }

        get logger()
        {
            return this._logger || logUtils.findDefaultLogger() || console;
        }

        async findLogger()
        {
            return this._logger || await logUtils.findGlobalLogger();
        }

        get remoteUrl()
        {
            return this._remoteUrl;
        }

        get Types()
        {
            return Activity.Types;
        }

        async getDatabase()
        {
            if ( this._database && this._database instanceof Database )
            {
                return Promise.resolve( this._database );
            }

            let { server, db } = await databaseFactoryModule.findDatabaseServer();

            this._database = db;

            return Promise.resolve( this._database );
        }

        overrideStorageCollectionFor( pType, pCollectionName )
        {
            if ( !(isBlank( pType ) || isBlank( pCollectionName )) )
            {
                this._storageOverrides[pType] = pCollectionName;
            }
        }

        getStorageCollectionFor( pType )
        {
            return this._storageOverrides[pType] || this._defaultStorageCollection || "activities";
        }

        async logActivity( pRequestId, pActivityType, pPayload )
        {
            let args = arguments;

            let requestId = pRequestId;
            let activityType = pActivityType;
            let payload = pPayload;

            if ( args.length < 3 || stringUtils.isAllCaps( args[0], false ) )
            {
                requestId = this.requestId || pRequestId;
                activityType = pRequestId || pActivityType;
                payload = pActivityType || pPayload;
            }

            const activity = Activity.create( requestId, activityType, payload );

            const db = await this.getDatabase();

            if ( db )
            {
                try
                {
                    const collectionName = this.getStorageCollectionFor( pActivityType ) || this._defaultStorageCollection;

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
                if ( activityType.includes( "ERROR" ) )
                {
                    (logger || this.logger).error( activity?.message || activity );
                }
                else
                {
                    (logger || this.logger).info( activity?.message || activity );
                }
            }

            if ( !isBlank( this._remoteUrl ) )
            {
                // TODO
            }

            return activity;
        }

        async logError( pRequestId, pError )
        {
            let args = arguments;

            let requestId = pRequestId;

            let activityType = this.Types.ERROR_ENCOUNTERED || this.Types.getValue( "ERROR_ENCOUNTERED" );

            let payload = pError || { "message": "An error occurred while handling request, " + requestId || "--unidentified request--" };

            if ( args.length < 2 )
            {
                requestId = this.requestId || pRequestId;

                payload = pRequestId || { "message": "An error occurred while handling request, " + requestId || "--unidentified request--" };
            }

            return await this.logActivity( requestId, activityType, payload );
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
