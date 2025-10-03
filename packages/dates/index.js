const core = require( "@toolbocks/core" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, funcUtils, localeUtils } = core;

const dateUtils = require( "./src/DateUtils.cjs" );
const dateFormatTokenUtils = require( "./src/DateFormatTokenSet.cjs" );
const dateFormatterUtils = require( "./src/DateFormatter.cjs" );
const dateParserUtils = require( "./src/DateParser.cjs" );

const { _ud = "undefined" } = constants;

const $scope = core?.$scope || constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__DATES_PACKAGE__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            funcUtils,
            localeUtils,
            dateUtils,
            dateFormatTokenUtils,
            dateFormatterUtils,
            dateParserUtils
        };

    const { Result, isDate } = typeUtils;

    const { ToolBocksModule } = moduleUtils;

    const
        {
            DateConstants,
            DateFilters,
            isValidDateArgument,
            avoidWeekend,
            addDays,
            addWorkdays,
            addWeeks,
            subtractDays,
            subtractWeeks,
            toNoon,
            toMidnight,
            firstInstant,
            lastInstant,
            before,
            after,
            equal,
            sortDates,
            earliest,
            latest,
            daysBetween,
            workDaysBetween,
            numDaysInMonth,
            numDaysInYear
        } = dateUtils;

    const
        {
            DEFINED_TOKENS,
            SUPPORTED_TOKENS,
            DEFINED_INTL_OPTIONS,
            SUPPORTED_INTL_OPTIONS,
            ERAS,
            MONTH_NAMES,
            MONTH_NAMES_SHORT,
            DAY_NAMES,
            DAY_NAMES_SHORT,
            DAY_LETTERS,
            REPETITION_RULES
        } = dateFormatTokenUtils;

    const { DateParser } = dateParserUtils;

    const
        {
            resolveDate,
            resolveLocale,
            DEFAULT_LOCALE,
            DEFAULT_TOKEN_SET,
            DEFAULT_FORMAT,
            DateFormatter
        } = dateFormatterUtils;

    const
        {
            getMonthNames,
            getMonthAbbreviations,
            getDayNames,
            getDayAbbreviations,
            getDayLetters,
            getEras,
            getAmPmStrings,
            getFirstDayOfWeek,
            FORMATS
        } = localeUtils;

    const modName = "DatesPackage";

    const modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    let mod =
        {
            dependencies: dependencies,

            DateUtils: dateUtils,
            DateFormatTokenSetUtils: dateFormatTokenUtils,
            DateFormatterUtils: dateFormatterUtils,
            DateParserUtils: dateParserUtils,

            classes:
                {
                    DateFormatter,
                    DateParser
                },
            TOKENS:
                {
                    DEFINED_TOKENS,
                    SUPPORTED_TOKENS,
                    DEFINED_INTL_OPTIONS,
                    SUPPORTED_INTL_OPTIONS,
                    ERAS,
                    MONTH_NAMES,
                    MONTH_NAMES_SHORT,
                    DAY_NAMES,
                    DAY_NAMES_SHORT,
                    DAY_LETTERS,
                    FORMATS,
                    REPETITION_RULES,
                },
            DateFormatter,
            DateParser,

            Result,
            isDate,

            DateConstants,
            DateFilters,

            isValidDateArgument,
            avoidWeekend,
            addDays,
            addWorkdays,
            addWeeks,
            subtractDays,
            subtractWeeks,
            toNoon,
            toMidnight,
            firstInstant,
            lastInstant,
            before,
            after,
            equal,
            sortDates,
            earliest,
            latest,
            daysBetween,
            workDaysBetween,

            getMonthNames,
            getMonthAbbreviations,

            getDayNames,
            getDayAbbreviations,
            getDayLetters,

            getEras,

            getAmPmStrings,

            getFirstDayOfWeek,

            numDaysInMonth,
            numDaysInYear,

            FORMATS,

            resolveDate,
            resolveLocale,

            DEFAULT_LOCALE,
            DEFAULT_TOKEN_SET,
            DEFAULT_FORMAT
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
