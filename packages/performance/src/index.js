/**
 * This statement imports the core modules:
 * Constants, TypeUtils, StringUtils, and ArrayUtils
 */
const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const {
    _ud = "undefined", $scope = constants?.$scope || function()
    {
        return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
    }
} = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__HTTP_PERFORMANCE_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const {
        ModuleEvent,
        ToolBocksModule,
        ObjectEntry,
        objectEntries,
        populateOptions,
        resolveError,
        getLastError,
        lock,
        localCopy,
        attempt,
        asyncAttempt,
        isWritable,
        $ln
    } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _slash = "/" } = constants;

    const {
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
        asObject,
        clamp = moduleUtils.clamp
    } = typeUtils;

    const { asString, asInt, toBool, isBlank, cleanUrl, lcase, ucase, capitalize } = stringUtils;

    const modName = "PerformanceUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    class Marker
    {
        #name;
        #timestamp;

        constructor( pName, pTimestamp = Date.now() )
        {
            this.#name = pName;
            this.#timestamp = pTimestamp || Date.now();
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

    class Timing
    {
        #markers = [];

        #comparator = ( a, b ) => a.timestamp > b.timestamp ? 1 : a.timestamp < b.timestamp ? -1 : 0;

        constructor()
        {
            // nothing to see here
        }

        add( pName, pTimestamp = Date.now() )
        {
            this.#markers.push( new Marker( pName, pTimestamp ) );
        }

        get comparator()
        {
            return this.#comparator;
        }

        get markers()
        {
            return [...(this.#markers)];
        }

        get elapsedTime()
        {
            const startTime = asInt( this.#markers[0].timestamp );
            const curTime = asInt( this.#markers[this.#markers.length - 1].timestamp );

            return curTime - startTime;
        }

        measureElapsedTime( pMarkerStartName, pMarkerEndName )
        {
            const marks = this.markers.filter( e => [pMarkerEndName, pMarkerStartName].includes( e.name ) ).sort( this.comparator );

            const startTime = asInt( marks[0].timestamp );
            const curTime = asInt( marks[marks.length - 1].timestamp );

            return curTime - startTime;
        }

        get report()
        {
            if ( this.markers.length <= 0 )
            {
                return [{ "mark": "NO MARKERS", "incrementalTime": 0, "elapsedTime": 0, "totalTime": 0 }];
            }

            const records = [];

            const marks = this.markers.sort( this.comparator );

            const head = marks[0];
            const tail = marks[marks.length - 1];

            const totalTime = asInt( (tail || head).timestamp ) - asInt( head.timestamp );

            let prior = head;

            for( let i = 0, n = marks.length; i < n; i++ )
            {
                const mark = marks[i];

                let incrementalTime = asInt( mark.timestamp ) - asInt( prior?.timestamp || mark.timestamp );
                let elapsed = asInt( mark.timestamp ) - asInt( head?.timestamp || prior?.timestamp || mark.timestamp );

                let record = {
                    "mark": mark.name,
                    "incrementalTime": incrementalTime,
                    "elapsedTime": elapsed,
                    "total": totalTime
                };
                records.push( record );
            }

            return [...records];
        }

        reset()
        {
            this.#markers = [];
        }
    }

    const GLOBAL_TIMER = new Timing();
    $scope()["BOCK_GLOBAL_TIMER"] = $scope()["BOCK_GLOBAL_TIMER"] || GLOBAL_TIMER;

    let mod =
        {
            classes:
                {
                    Marker,
                    Timing
                },
            Timing,
            GLOBAL_TIMER,
            getGlobalTimer: function()
            {
                return $scope()["BOCK_GLOBAL_TIMER"] || GLOBAL_TIMER;
            }
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
