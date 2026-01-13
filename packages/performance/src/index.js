/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

let jsonUtils = require( "@toolbocks/json" );

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

    const {
        ModuleEvent,
        ToolBocksModule,
        IllegalArgumentError,
        ObjectEntry,
        objectEntries,
        populateOptions,
        resolveEvent,
        resolveError,
        getLastError,
        lock,
        localCopy,
        attempt,
        asyncAttempt,
        isWritable,
        $ln,
        $nth,
        $last
    } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _slash = "/" } = constants;

    const
        {
            isNull,
            isNonNullObject,
            isNonNullValue,
            isError,
            isFunction,
            isAsyncFunction,
            isString,
            isJson,
            isNumeric,
            isNullOrNaN,
            isDate,
            isDateString,
            isReadOnly,
            isPromise,
            isScalar,
            firstMatchingType,
            clamp = moduleUtils.clamp
        } = typeUtils;

    const { asString, asInt, isBlank, getFunctionName } = stringUtils;

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
    }

    class PerformanceRecord
    {
        #mark;
        #incrementalTime;
        #elapsedTime;
        #totalTime;

        constructor( pMarker, pIncrementalTime, pElapsedTime, pTotalTime )
        {
            this.#mark = resolveMarkerName( pMarker );
            this.#incrementalTime = asInt( pIncrementalTime );
            this.#elapsedTime = asInt( pElapsedTime );
            this.#totalTime = asInt( pTotalTime );
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

        toLiteral()
        {
            return asJson( this );
        }
    }

    /**
     * The Timing class provides functionality
     * for managing performance markers
     * and calculating elapsed time between markers.
     *
     * It is useful for tracking events, their timestamps, and generating performance reports.
     */
    class Timing
    {
        #__eventTarget = new EventTarget();

        #markers = [];

        #comparator = ( a, b ) => a.timestamp > b.timestamp ? 1 : a.timestamp < b.timestamp ? -1 : 0;

        constructor()
        {
            // nothing to see here
        }

        addEventListener( pEventName, pListener, pOptions )
        {
            this.#__eventTarget.addEventListener( pEventName, pListener, pOptions );
        }

        removeEventListener( pEventName, pListener, pOptions )
        {
            this.#__eventTarget.removeEventListener( pEventName, pListener, pOptions );
        }

        dispatch( pEvent )
        {
            this.#__eventTarget.dispatchEvent( resolveEvent( pEvent ) );
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
        add( pName, pTimestamp = Date.now() )
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

            const record = new PerformanceRecord( marker, incremental, this.elapsedTime, this.measureElapsedTime( this.firstMarker, marker ) );

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
         * @return {Array<Object>} An array of objects,
         *                         each containing the following properties:
         *
         *                          - `mark` {string}: The name of the mark.
         *                          - `incrementalTime` {number}: The time difference between the current mark and the previous one.
         *                          - `elapsedTime` {number}: The time difference between the current mark and the first mark.
         *                          - `total` {number}: The total time between the first and last marks.
         *
         * If no markers are available,
         * returns a default object with all values equal to zero and "NO MARKERS" as the mark name.
         */
        get report()
        {
            let markers = asArray( this.markers || [] );

            if ( $ln( markers ) <= 0 )
            {
                return [{ "mark": "NO MARKERS", "incrementalTime": 0, "elapsedTime": 0, "totalTime": 0 }];
            }

            const records = [];

            const marks = markers.sort( this.comparator );

            const head = marks[0];
            const tail = $last( marks ) || head;

            const totalTime = asInt( (tail || head).timestamp ) - asInt( head.timestamp );

            let prior = head;

            for( let i = 0, n = $ln( marks ); i < n; i++ )
            {
                const mark = marks[i];

                let incrementalTime = asInt( mark.timestamp ) - asInt( prior?.timestamp || mark.timestamp );
                let elapsed = asInt( mark.timestamp ) - asInt( head?.timestamp || prior?.timestamp || mark.timestamp );

                let record =
                    {
                        "mark": mark.name,
                        "incrementalTime": incrementalTime,
                        "elapsedTime": elapsed,
                        "total": totalTime
                    };

                records.push( record );
            }

            this.dispatch( new ModuleEvent( "ReportGenerated",
                                            {
                                                detail: records,
                                                target: this,
                                                occurred: Date.now()
                                            }, { markers: this.markers } ) );

            return records;
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
                    Timing
                },
            Timing,
            PerformanceRecord,
            GLOBAL_TIMER,
            getGlobalTimer,
            addPerformanceMarker,
            getElapsedTime,
            timed
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
