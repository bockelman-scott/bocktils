/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

const jsonUtils = require( "@toolbocks/json" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__PERFORMANCE_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const
        {
            ModuleEvent,
            ToolBocksModule,
            IllegalArgumentError,
            resolveEvent,
            lock,
            attempt,
            asyncAttempt,
            $ln,
            $last
        } = moduleUtils;

    const { _mt } = constants;

    const { isNull, isNonNullObject, isFunction, isAsyncFunction, isString, isNumeric, isDate } = typeUtils;

    const { asString, asInt, toBool, isBlank, isJsonObject, getFunctionName, ucase } = stringUtils;

    const { asArray } = arrayUtils;

    const { asObject, asJson } = jsonUtils;

    const modName = "PerformanceUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const MARKER_PREFIX = `Performance Marker `;

    let MARKER_ID = 0;

    const nextMarkerId = () =>
    {
        MARKER_ID = MARKER_ID < 999_999 ? (MARKER_ID + 1) : 1;
        return MARKER_ID;
    };

    const resolveMarkerName = ( pName = null ) =>
    {
        if ( isString( pName ) || isNumeric( pName ) )
        {
            return asString( pName, true ) || (MARKER_PREFIX + asString( nextMarkerId(), true ));
        }
        else if ( isNonNullObject( pName ) )
        {
            return resolveMarkerName( pName.name || pName.id );
        }
        return (MARKER_PREFIX + asString( nextMarkerId(), true ));
    };

    const COMPARATOR = ( a, b ) => a.timestamp > b.timestamp ? 1 : a.timestamp < b.timestamp ? -1 : 0;

    class Marker
    {
        #name;
        #timestamp;

        constructor( pName, pTimestamp = Date.now() )
        {
            this.#name = resolveMarkerName( pName );
            this.#timestamp = (isNumeric( pTimestamp ) ? asInt( pTimestamp ) : (isDate( pTimestamp ) ? pTimestamp.getTime() : Date.now())) || Date.now();
        }

        get name()
        {
            return asString( this.#name, true );
        }

        get timestamp()
        {
            return asInt( this.#timestamp );
        }

        compareTo( pOther )
        {
            if ( isNull( pOther ) )
            {
                return -1;
            }

            const other = Marker.from( pOther );

            return COMPARATOR( this, other );
        }
    }

    Marker.from = function( pObject )
    {
        if ( isNull( pObject ) )
        {
            return new Marker( "NULL" );
        }

        if ( isNonNullObject( pObject ) || isJsonObject( pObject ) )
        {
            const obj = asObject( pObject );

            if ( obj instanceof Marker )
            {
                return obj;
            }

            return new Marker( obj.name || obj.id, obj.timestamp ?? obj.date );
        }

        if ( isNumeric( pObject ) || isDate( pObject ) )
        {
            return new Marker( "ANONYMOUS", new Date( pObject ).getTime() );
        }

        if ( isString( pObject ) )
        {
            return new Marker( asString( pObject, true ) );
        }

        return new Marker( asString( pObject, true ) );
    };

    class PerformanceRecord
    {
        #mark;
        #incrementalTime;
        #elapsedTime;
        #totalTime;

        #timestamp;

        constructor( pMarker, pIncrementalTime, pElapsedTime, pTotalTime )
        {
            this.#mark = resolveMarkerName( pMarker );
            this.#incrementalTime = asInt( pIncrementalTime );
            this.#elapsedTime = asInt( pElapsedTime );
            this.#totalTime = asInt( pTotalTime );

            this.#timestamp = isNonNullObject( pMarker ) ? pMarker?.timestamp : Date.now();
        }

        get mark()
        {
            return resolveMarkerName( this.#mark );
        }

        get incrementalTime()
        {
            return asInt( this.#incrementalTime );
        }

        get elapsedTime()
        {
            return asInt( this.#elapsedTime );
        }

        get totalTime()
        {
            return asInt( this.#totalTime );
        }

        get timestamp()
        {
            return this.#timestamp;
        }

        toLiteral()
        {
            return asJson( this );
        }
    }

    class MemoryRecord
    {

    }

    // noinspection JSUnusedLocalSymbols
    class NullTiming extends EventTarget
    {
        #FIRST_MARKER;
        #LAST_MARKER;

        constructor()
        {
            super();

            this.#FIRST_MARKER = lock( Marker.from( "FIRST" ) );
            this.#LAST_MARKER = lock( Marker.from( "LAST" ) );
        }

        // noinspection JSUnusedLocalSymbols
        add( pName, pTimestamp )
        {
            // no op
        }

        get comparator()
        {
            return COMPARATOR;
        }

        get markers()
        {
            return lock( [this.#FIRST_MARKER, this.#LAST_MARKER] );
        }

        get firstMarker()
        {
            return lock( this.#FIRST_MARKER );
        }

        get lastMarker()
        {
            return lock( this.#LAST_MARKER );
        }

        getMarker( pName )
        {
            const name = asString( pName, true );
            if ( ["FIRST", "LAST"].includes( ucase( name ) ) )
            {
                return "LAST" === ucase( name ) ? this.#LAST_MARKER : this.#FIRST_MARKER;
            }
            return new Marker( name );
        }

        get elapsedTime()
        {
            return 0;
        }

        measureElapsedTime( pMarkerStartName, pMarkerEndName )
        {
            return 0;
        }

        get report()
        {
            return [];
        }

        reset()
        {
            this.#FIRST_MARKER = lock( Marker.from( "FIRST" ) );
            this.#LAST_MARKER = lock( Marker.from( "LAST" ) );
        }

        logResults( pLogger )
        {
            // no op
        }

        dispatch( pEvent )
        {
            this.dispatchEvent( resolveEvent( pEvent ) );
        }
    }

    /**
     * The Timing class provides functionality
     * for managing performance markers
     * and calculating elapsed time between markers.
     *
     * It is useful for tracking events, their timestamps, and generating performance reports.
     */
    class Timing extends NullTiming
    {
        #zTarget = new EventTarget();

        #markers = [];

        #records = [];

        #comparator = COMPARATOR;

        constructor()
        {
            super();
        }

        addEventListener( pEventName, pListener, pOptions )
        {
            this.#zTarget.addEventListener( pEventName, pListener, pOptions );
        }

        removeEventListener( pEventName, pListener, pOptions )
        {
            this.#zTarget.removeEventListener( pEventName, pListener, pOptions );
        }

        dispatch( pEvent )
        {
            this.#zTarget.dispatchEvent( resolveEvent( pEvent ) );
        }

        /**
         * Adds a new marker to the collection.
         *
         * @param {string|Marker} pName - The name of the marker or an instance of the Marker class.
         * @param {number|Date} [pTimestamp=Date.now()] - The timestamp for the marker.
         *                                                Defaults to the current date and time
         *                                                if not provided.
         *
         * @return {PerformanceRecord} - Returns a PerformanceRecord with the incremental, elapsed, and total time
         */
        add( pName, pTimestamp = (pName?.timestamp ?? Date.now()) )
        {
            const timestamp = (isNumeric( pTimestamp ) || isDate( pTimestamp )) ?
                              pTimestamp :
                              isNonNullObject( pName ) ?
                              pName.timestamp :
                              (pTimestamp || Date.now());

            const priorMarker = this.lastMarker;

            const marker = new Marker( pName, timestamp );

            this.#markers.push( marker );

            const incremental = (isNonNullObject( priorMarker )) ? this.measureElapsedTime( priorMarker, marker ) : 0;

            const record = lock( new PerformanceRecord( marker, incremental, this.elapsedTime, this.measureElapsedTime( this.firstMarker, marker ) ) );

            this.#records.push( record );

            this.dispatch( new ModuleEvent( "MarkAdded", { detail: record, target: this, occurred: timestamp }, {} ) );

            return record;
        }

        /**
         * Returns the comparator used to order events (a.k.a. performance markers)
         *
         * @returns {function(*, *): number}
         */
        get comparator()
        {
            return this.#comparator;
        }

        /**
         * Retrieves a read-only array of the currently recorded performance markers.
         *
         * The returned array is a copy of the internal markers collection,
         * ensuring the original data remains secure and immutable.
         *
         * @return {Array} A read-only array of the currently recorded performance markers.
         */
        get markers()
        {
            return lock( [...(this.#markers)] );
        }

        /**
         * Retrieves the first marker from the list of markers.
         * If no markers are present, a new default marker with the label "Start" is returned.
         *
         * @return {Marker} The first marker in the list or a default "Start" marker if the list is empty.
         */
        get firstMarker()
        {
            const markers = asArray( this.markers || [] );
            return $ln( markers ) > 0 ? markers[0] : new Marker( "Start" );
        }

        /**
         * Retrieves the last marker from the markers array.
         * If the markers array is empty or not defined
         * returns a new Marker instance with a generic marker name.
         *
         * @return {Marker} The last marker in the array
         *                  or a new Marker instance if no markers exist.
         */
        get lastMarker()
        {
            const markers = asArray( this.markers || [] );
            return $ln( markers ) > 0 ? $last( markers ) : new Marker( resolveMarkerName() );
        }

        /**
         * Retrieves the first marker object that matches the specified name
         * from the currently recorded performance markers.
         *
         * @param {string} pName The name of the marker to retrieve. Must be a non-blank string.
         * @return {Object|null} The matching marker object if found; otherwise, null.
         * @throws {IllegalArgumentError} If the provided name is blank or invalid.
         */
        getMarker( pName )
        {
            let markers = [...(asArray( this.markers || [] ))];
            const name = asString( pName, true );
            if ( isBlank( name ) )
            {
                throw new IllegalArgumentError( `This method requires a valid name. ${pName} is not a valid performance marker name`, {} );
            }
            markers = markers.filter( e => isNonNullObject( e ) && e.name === name );
            return $ln( markers ) > 0 ? markers[0] : null;
        }

        /**
         * Returns an array of the performance records captured
         * @returns {Array.<PerformanceRecord>} an array of the performance records captured
         */
        get records()
        {
            return [...(asArray( this.#records ?? [] ))];
        }

        /**
         * Calculates the elapsed time in milliseconds between the first and last markers.
         * If no markers are present, returns 0.
         *
         * @return {number} The elapsed time in milliseconds, or 0 if no markers exist.
         */
        get elapsedTime()
        {
            let markers = asArray( this.markers || [] );

            if ( $ln( markers ) > 0 )
            {
                let first = markers[0];
                let last = $last( markers ) || first;

                const startTime = asInt( first.timestamp );
                const curTime = asInt( last.timestamp );

                return curTime - startTime;
            }

            return 0;
        }

        /**
         * Measures the elapsed time between two specified markers.
         *
         * @param {string|Marker} pMarkerStartName - The name of the start marker.
         * @param {string|Marker} pMarkerEndName - The name of the end marker.
         * @return {number} The elapsed time in milliseconds between the specified markers.
         *                  Returns 0 if markers are not found or no time elapsed.
         */
        measureElapsedTime( pMarkerStartName, pMarkerEndName )
        {
            const startName = resolveMarkerName( pMarkerStartName );
            const endName = resolveMarkerName( pMarkerEndName );

            if ( startName === endName )
            {
                return 0;
            }

            let marks = this.markers.filter( e => [startName, endName].includes( e.name ) );
            marks = marks.sort( this.comparator );

            if ( $ln( marks ) > 0 )
            {
                let first = marks[0];
                let last = $last( marks ) || first;

                const startTime = asInt( first.timestamp );
                const curTime = asInt( last.timestamp );

                return curTime - startTime;
            }

            return 0;
        }

        /**
         * Generates a performance report based on the currently recorded performance markers,
         * calculating incremental, elapsed, and total times for each.
         *
         * @return {string} a CSV compatible string, consisting of one line for each performance record.
         */
        get report()
        {
            let records = [...(asArray( this.records ?? [] ))];

            if ( $ln( records ) > 0 )
            {
                const totalTime = this.elapsedTime;

                let s = `"marker","incremental_time","elapsed_time","total_time"` + "\n";

                for( let record of records )
                {
                    s += `"${record.mark}", "${record.incrementalTime}", "${record.elapsedTime}", "${totalTime || record.totalTime}"` + "\n";
                }

                return s;
            }

            return _mt;
        }

        logResults( pLogger )
        {
            const logger = ToolBocksModule.resolveLogger( pLogger, ToolBocksModule.getGlobalLogger(), console );
            attempt( () => logger.log( "\n" + this.report + "\n" ) );
        }

        /**
         * Resets the internal state by clearing all performance markers.
         * @return {void} Does not return a value.
         */
        reset()
        {
            this.#markers = [];
        }
    }

    /**
     * Represents a globally accessible timer instance
     * used for tracking or measuring the performance of operations.
     *
     * The `GLOBAL_TIMER` instance is shared across the application to centralize timing utilities.
     * It is initialized as an instance of the `Timing` class.
     */
    const GLOBAL_TIMER = new Timing();

    // add the GLOBAL_TIMER to the global scope
    $scope()["BOCK_GLOBAL_TIMER"] = $scope()["BOCK_GLOBAL_TIMER"] || GLOBAL_TIMER;

    /**
     * Returns the global timer instance.
     *
     * This function checks for the existence of a specific property in the current scope
     * and returns it if available.
     *
     * If the property is not defined in the scope, it falls back
     * to using the global `GLOBAL_TIMER` variable.
     *
     * @returns {any} The global timer value from the current scope or the global fallback.
     */
    const getGlobalTimer = () => $scope()["BOCK_GLOBAL_TIMER"] || GLOBAL_TIMER;

    /**
     * Adds a performance marker to the global timer.
     *
     * @param {string} pName - The name of the performance marker to add.
     *
     * @param {number} [pTimestamp=Date.now()] - The timestamp for the performance marker.
     *                                           Defaults to the current time if not provided.
     *
     * @returns {number} the elapsed time for the currently recorded operations
     */
    const addPerformanceMarker = ( pName, pTimestamp = Date.now() ) => getGlobalTimer().add( pName, pTimestamp );

    /**
     * Calculates and returns the elapsed time (in milliseconds)
     * between the specified markers.
     *
     * @function
     * @param {string|null} [pStartMarker=null] - The starting marker for the time measurement.
     *                                            If null, defaults to the first recorded performance marker.
     *
     * @param {string|null} [pEndMarker=null]   - The ending marker for the time measurement.
     *                                            If null, defaults to the most recently recorded performance marker.
     *
     * @returns {number} The elapsed time in milliseconds between the specified markers.
     */
    const getElapsedTime = ( pStartMarker = null, pEndMarker = null ) =>
    {
        const globalTimer = getGlobalTimer() || GLOBAL_TIMER;

        return globalTimer.measureElapsedTime( pStartMarker, pEndMarker );
    };

    async function timed( pFunction, pTimer, pListener, pOptions )
    {
        const startTime = new Date();

        let returnValue = null;

        if ( isFunction( pFunction ) )
        {
            const timing = pTimer instanceof Timing ? pTimer : new Timing();

            if ( pListener )
            {
                timing.addEventListener( "FunctionInvoked", pListener );
            }

            timing.add( `Invoked ${pFunction.name || getFunctionName( pFunction )}`, startTime.getTime() );

            let options = asObject( pOptions || {} );

            let args = asArray( options.arguments || [] );

            let evt = new ModuleEvent( "FunctionInvoked",
                                       {
                                           detail: pFunction,
                                           target: timing,
                                           occurred: startTime.getTime()
                                       }, {} );

            timing.dispatch( evt );

            if ( isAsyncFunction( pFunction ) )
            {
                returnValue = await asyncAttempt( async() => await pFunction( ...args ) );
            }
            else
            {
                returnValue = attempt( () => pFunction( ...args ) );
            }

            const endTime = new Date();

            timing.add( `Completed ${pFunction.name || getFunctionName( pFunction )}`, endTime.getTime() );

            evt = new ModuleEvent( "FunctionCompleted",
                                   {
                                       detail: pFunction,
                                       target: timing,
                                       occurred: endTime.getTime()
                                   }, {} );

            timing.dispatch( evt );

            if ( pListener )
            {
                timing.removeEventListener( "FunctionCompleted", pListener );
            }
        }

        return returnValue;
    }

    let mod =
        {
            classes:
                {
                    Marker,
                    PerformanceRecord,
                    NullTiming,
                    Timing
                },
            NullTiming,
            Timing,
            PerformanceRecord,
            getPerformanceTimer: function( pIsDebug = false )
            {
                return toBool( pIsDebug ) ? new Timing() : new NullTiming();
            },
            GLOBAL_TIMER,
            getGlobalTimer,
            addPerformanceMarker,
            getElapsedTime,
            timed
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
