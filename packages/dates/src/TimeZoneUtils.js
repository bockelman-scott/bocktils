(function exposeModule()
{
    const core = require( "@toolbocks/core" );

    const dateUtils = require( "./DateUtils.cjs" );

    /**
     * Establish separate constants for each of the utilities imported
     * @see ../src/CoreUtils.cjs
     */
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

    const { $ln, lock, attempt } = moduleUtils;

    const { _ud, _mt, _underscore, _hyphen, _minus, _colon, $scope } = constants;

    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isDate,
            isString,
            isDateString,
            isValidDateOrNumeric,
            isArray,
            isLikeArray
        } = typeUtils;

    const { asString, asInt, isBlank, ucase, leftOf, rightOf, rightOfLast } = stringUtils;

    const { US_STATES_BY_NAME, US_STATES, resolveUsStateAbbr } = localeUtils;

    const { MILLIS_PER, rxTz, resolveDate } = dateUtils;

    const INTERNAL_NAME = "__BOCK__TZ_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * Represents a longitudinal slice of the Earth
     * in which local time is expressed in common.
     *
     * A time zone is defined
     * by its offset from Universal Time Coordinates (UTC),
     * formerly known as GMT, or Greenwich Meantime, due to colonialism.
     */
    class TimeZone
    {
        /**
         * Unique String describing the Time Zone,
         * such as Central_Daylight or Central_Standard
         *
         * NOTE: While this value should be unique across any collection of Time Zones,
         * the 'name' property is expected to be repeated (for zones with a standard and daylight saving mode)
         */
        #key;

        /**
         * Common Name for the Time Zone,
         * such as America/New_York
         */
        #name;

        /**
         * IANA abbreviation for the Time Zone,
         * such as EST or EDT
         */
        #abbreviation;

        /**
         * The number of milliseconds +/- from the UTC Time Zone
         */
        #utcOffset;

        constructor( pKey, pName, pAbbreviation, pUtcOffset )
        {
            this.#key = asString( pKey, true ).replaceAll( /\s+/g, _underscore );
            this.#name = asString( pName, true );
            this.#abbreviation = asString( pAbbreviation, true );
            this.#utcOffset = asInt( pUtcOffset );

            lock( this );
        }

        get key()
        {
            return asString( this.#key, true );
        }

        get name()
        {
            return asString( this.#name, true );
        }

        get abbreviation()
        {
            return asString( this.#abbreviation, true );
        }

        get utcOffset()
        {
            return asInt( this.#utcOffset );
        }
    }

    const US_TIMEZONES =
        lock( {
                  "HAST": new TimeZone( "Hawaii-Aleutian_Standard", "Pacific/Honolulu", "HAST", -36000000 ),
                  "HST": new TimeZone( "Hawaii_Standard", "Pacific/Honolulu", "HST", -36000000 ),
                  "AKST": new TimeZone( "Alaska_Standard", "America/Anchorage", "AKST" - 32400000 ),
                  "HADT": new TimeZone( "Hawaii-Aleutian_Daylight", "Pacific/Honolulu", "HADT" - 32400000 ),
                  "HDT": new TimeZone( "Hawaii_Daylight", "Pacific/Honolulu", "HDT", -32400000 ),
                  "AKDT": new TimeZone( "Alaska_Daylight", "America/Anchorage", "AKDT", -28800000 ),
                  "PST": new TimeZone( "Pacific_Standard", "America/Los_Angeles", "PST", -28800000 ),
                  "MST": new TimeZone( "Mountain_Standard", "America/Denver", "MST", -25200000 ),
                  "PDT": new TimeZone( "Pacific_Daylight", "America/Los_Angeles", "PDT", -25200000 ),
                  "CST": new TimeZone( "Central_Standard", "America/Chicago", "CST", -21600000 ),
                  "MDT": new TimeZone( "Mountain_Daylight", "America/Phoenix", "MDT", -21600000 ),
                  "CDT": new TimeZone( "Central_Daylight", "America/Chicago", "CDT", -18000000 ),
                  "EST": new TimeZone( "Eastern_Standard", "America/New_York", "EST", -18000000 ),
                  "AST": new TimeZone( "Atlantic_Standard", "Canada/Newfoundland", "AST", -14400000 ),
                  "EDT": new TimeZone( "Eastern_Daylight", "America/New_York", "EDT", -14400000 ),
                  "NST": new TimeZone( "Newfoundland_Standard", "Canada/Newfoundland", "NST", -12600000 ),
                  "NT": new TimeZone( "Newfoundland", "Canada/Newfoundland", "NT", -12600000 ),
                  "ADT": new TimeZone( "Atlantic_Daylight", "Canada/Newfoundland", "ADT", -10800000 ),
                  "NDT": new TimeZone( "Newfoundland_Daylight", "Canada/Newfoundland", "NDT", -9000000 ),
                  "GMT": new TimeZone( "Greenwich_Mean", "Europe/Greenwich", "GMT", 0 ),
                  "UTC": new TimeZone( "Coordinated Universal Time", "UTC", "UTC", 0 )
              } );

    /**
     * Dominant Timezone Map for all 50 US States + DC.
     * States that cross timezone boundaries are assigned a 'SPLIT_*' key
     * to force evaluation via the SPLIT_STATE_EXCEPTIONS.
     */
    const US_TIMEZONES_BY_STATE =
        lock( {
                  "AL": US_TIMEZONES["CST"],
                  "AK": US_TIMEZONES["AKST"], // Note: Outlying Aleutian Islands use America/Adak, but Anchorage handles ~99% of population
                  "AZ": US_TIMEZONES["MST"],  // Arizona does not observe DST (except the Navajo Nation)
                  "AR": US_TIMEZONES["CST"],
                  "CA": US_TIMEZONES["PST"],
                  "CO": US_TIMEZONES["MST"],
                  "CT": US_TIMEZONES["EST"],
                  "DE": US_TIMEZONES["EST"],
                  "DC": US_TIMEZONES["EST"],
                  "FL": "SPLIT_EASTERN_CENTRAL",
                  "GA": US_TIMEZONES["EST"],
                  "HI": US_TIMEZONES["HST"],  // Hawaii does not observe DST
                  "ID": "SPLIT_MOUNTAIN_PACIFIC",
                  "IL": US_TIMEZONES["CST"],
                  "IN": "SPLIT_EASTERN_CENTRAL",
                  "IA": US_TIMEZONES["CST"],
                  "KS": "SPLIT_CENTRAL_MOUNTAIN",
                  "KY": "SPLIT_EASTERN_CENTRAL",
                  "LA": US_TIMEZONES["CST"],
                  "ME": US_TIMEZONES["EST"],
                  "MD": US_TIMEZONES["EST"],
                  "MA": US_TIMEZONES["EST"],
                  "MI": "SPLIT_EASTERN_CENTRAL",
                  "MN": US_TIMEZONES["CST"],
                  "MS": US_TIMEZONES["CST"],
                  "MO": US_TIMEZONES["CST"],
                  "MT": US_TIMEZONES["MST"],
                  "NE": "SPLIT_CENTRAL_MOUNTAIN",
                  "NV": US_TIMEZONES["PST"], // Mostly Pacific, small towns use Mountain but lack distinct 3-digit prefixes
                  "NH": US_TIMEZONES["EST"],
                  "NJ": US_TIMEZONES["EST"],
                  "NM": US_TIMEZONES["MST"],
                  "NY": US_TIMEZONES["EST"],
                  "NC": US_TIMEZONES["EST"],
                  "ND": "SPLIT_CENTRAL_MOUNTAIN",
                  "OH": US_TIMEZONES["EST"],
                  "OK": US_TIMEZONES["CST"],
                  "OR": "SPLIT_PACIFIC_MOUNTAIN",
                  "PA": US_TIMEZONES["EST"],
                  "RI": US_TIMEZONES["EST"],
                  "SC": US_TIMEZONES["EST"],
                  "SD": "SPLIT_CENTRAL_MOUNTAIN",
                  "TN": "SPLIT_EASTERN_CENTRAL",
                  "TX": "SPLIT_CENTRAL_MOUNTAIN",
                  "UT": US_TIMEZONES["MST"],
                  "VT": US_TIMEZONES["EST"],
                  "VA": US_TIMEZONES["EST"],
                  "WA": US_TIMEZONES["PST"],
                  "WV": US_TIMEZONES["EST"],
                  "WI": US_TIMEZONES["CST"],
                  "WY": US_TIMEZONES["MST"]
              } );

    const US_TIMEZONE_EXCEPTIONS_BY_ZIPCODE_PREFIX =
        lock( {
                  "324": US_TIMEZONES["CST"],
                  "325": US_TIMEZONES["CST"],
                  "498": US_TIMEZONES["CST"],
                  "499": US_TIMEZONES["CST"],
                  "420": US_TIMEZONES["CST"],
                  "421": US_TIMEZONES["CST"],
                  "422": US_TIMEZONES["CST"],
                  "423": US_TIMEZONES["CST"],
                  "424": US_TIMEZONES["CST"],
                  "427": US_TIMEZONES["CST"],
                  "463": US_TIMEZONES["CST"],
                  "464": US_TIMEZONES["CST"],
                  "476": US_TIMEZONES["CST"],
                  "477": US_TIMEZONES["CST"],
                  "478": US_TIMEZONES["CST"],
                  "479": US_TIMEZONES["CST"],
                  "370": US_TIMEZONES["CST"],
                  "371": US_TIMEZONES["CST"],
                  "372": US_TIMEZONES["CST"],
                  "380": US_TIMEZONES["CST"],
                  "381": US_TIMEZONES["CST"],
                  "382": US_TIMEZONES["CST"],
                  "383": US_TIMEZONES["CST"],
                  "384": US_TIMEZONES["CST"],
                  "385": US_TIMEZONES["CST"],

                  "678": US_TIMEZONES["MST"],
                  "679": US_TIMEZONES["MST"],
                  "691": US_TIMEZONES["MST"],
                  "692": US_TIMEZONES["MST"],
                  "693": US_TIMEZONES["MST"],
                  "586": US_TIMEZONES["MST"],
                  "587": US_TIMEZONES["MST"],
                  "588": US_TIMEZONES["MST"],
                  "575": US_TIMEZONES["MST"],
                  "576": US_TIMEZONES["MST"],
                  "577": US_TIMEZONES["MST"],
                  "798": US_TIMEZONES["MST"],
                  "799": US_TIMEZONES["MST"],
                  "979": US_TIMEZONES["MST"],

                  "835": US_TIMEZONES["PST"],
                  "838": US_TIMEZONES["PST"]
              } );

    /**
     * 3-Digit ZIP Code Prefix Exception Resolver for Split States.
     * Maps the minority population regions to their correct IANA timezone.
     */
    const SPLIT_STATE_EXCEPTIONS =
        lock( {
                  "SPLIT_EASTERN_CENTRAL":
                      lock( {
                                // Default to Eastern Time
                                default: US_TIMEZONES["EST"],
                                exceptions: lock( [
                                                      lock( { zone: US_TIMEZONES["CST"], prefix: ["324", "325"] } ), // Florida Panhandle (West of Apalachicola River)
                                                      {
                                                          zone: US_TIMEZONES["CST"],
                                                          prefix: ["463", "464", "476", "477", "478", "479"]
                                                      }, // Indiana (Gary & Evansville regions)
                                                      lock( {
                                                                zone: US_TIMEZONES["CST"],
                                                                prefix: ["420", "421", "422", "423", "424", "427"]
                                                            } ), // Western Kentucky
                                                      lock( { zone: US_TIMEZONES["CST"], prefix: ["498", "499"] } ), // Michigan Upper Peninsula borders (Counties adjacent to WI)
                                                      lock( {
                                                                zone: US_TIMEZONES["CST"],
                                                                prefix: ["370", "371", "372", "380", "381", "382", "383", "384", "385"]
                                                            } ) // Middle & West Tennessee (e.g., Nashville/Memphis)
                                                  ] )
                            } ),
                  "SPLIT_CENTRAL_MOUNTAIN":
                      lock( {
                                // Default to Central Time
                                default: US_TIMEZONES["CST"],
                                exceptions: lock( [
                                                      lock( { zone: US_TIMEZONES["MST"], prefix: ["678", "679"] } ), // Western Kansas
                                                      lock( {
                                                                zone: US_TIMEZONES["MST"],
                                                                prefix: ["691", "692", "693"]
                                                            } ), // Western Nebraska (Panhandle)
                                                      lock( {
                                                                zone: US_TIMEZONES["MST"],
                                                                prefix: ["586", "587", "588"]
                                                            } ), // Southwestern North Dakota
                                                      lock( {
                                                                zone: US_TIMEZONES["MST"],
                                                                prefix: ["575", "576", "577"]
                                                            } ), // Western South Dakota (West of Missouri River)
                                                      lock( { zone: US_TIMEZONES["MST"], prefix: ["798", "799"] } ) // West Texas (El Paso & Hudspeth counties)
                                                  ] )
                            } ),
                  "SPLIT_MOUNTAIN_PACIFIC":
                      lock( {
                                // Default to Mountain Time
                                default: US_TIMEZONES["MST"],
                                exceptions: lock( [
                                                      lock( { zone: US_TIMEZONES["PST"], prefix: ["835", "838"] } ) // Northern Idaho (Panhandle, North of Salmon River)
                                                  ] )
                            } ),
                  "SPLIT_PACIFIC_MOUNTAIN":
                      lock( {
                                // Default to Pacific Standard Time
                                default: US_TIMEZONES["PST"],
                                exceptions: lock( [
                                                      lock( { zone: US_TIMEZONES["MST"], prefix: ["979"] } ) // Eastern Oregon (Malheur County edge)
                                                  ] )
                            } )
              } );

    const findTimeZone = function( pState, pZipCode )
    {
        const stateAbbr = attempt( () => resolveUsStateAbbr( pState ) );

        if ( !isBlank( stateAbbr ) )
        {
            let timeZone = US_TIMEZONES_BY_STATE[stateAbbr];

            if ( isNull( timeZone ) )
            {
                return US_TIMEZONES["EST"];
            }

            if ( isNonNullObject( timeZone ) && timeZone instanceof TimeZone )
            {
                return timeZone;
            }

            if ( isString( timeZone ) || ( !isObject( timeZone )) )
            {
                // handle the outliers

                const zip = asString( pZipCode, true ).replaceAll( /\D/g, _mt );

                const xp = SPLIT_STATE_EXCEPTIONS[timeZone];

                if ( isNonNullObject( xp ) )
                {
                    if ( $ln( zip ) >= 5 )
                    {
                        const key = asString( zip, true ).slice( 0, 3 );
                        timeZone = US_TIMEZONE_EXCEPTIONS_BY_ZIPCODE_PREFIX[key] ?? xp.default;
                    }
                    else
                    {
                        timeZone = xp.default ?? US_TIMEZONES["EST"];
                    }
                }
                else
                {
                    timeZone = US_TIMEZONES["EST"];
                }
            }

            return isNonNullObject( timeZone ) ? timeZone ?? US_TIMEZONES["EST"] : US_TIMEZONES["EST"];
        }
    };

    TimeZone.US_TIMEZONES = lock( US_TIMEZONES );
    TimeZone.US_TIMEZONES_BY_STATE = lock( US_TIMEZONES_BY_STATE );
    TimeZone.US_TIMEZONE_EXCEPTIONS_BY_ZIPCODE_PREFIX = lock( US_TIMEZONE_EXCEPTIONS_BY_ZIPCODE_PREFIX );
    TimeZone.SPLIT_STATE_EXCEPTIONS = lock( SPLIT_STATE_EXCEPTIONS );

    const mod =
        {
            US_TIMEZONES,
            US_TIMEZONES_BY_STATE,
            US_TIMEZONE_EXCEPTIONS_BY_ZIPCODE_PREFIX,
            US_STATES,
            US_STATES_BY_NAME,
            classes:
                {
                    TimeZone
                },
            TimeZone,
            findTimeZone
        };

    $scope()[INTERNAL_NAME] = lock( mod );

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    return lock( mod );

}());
