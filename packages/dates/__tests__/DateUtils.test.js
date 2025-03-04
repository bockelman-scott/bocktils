const core = require( "@toolbocks/core" );

const dateUtils = require( "../src/DateUtils.cjs" );

const { moduleUtils, stringUtils, arrayUtils } = core;

const sum = function( ...pArgs )
{
    const arr = arrayUtils.asArray( pArgs );
    return arr.flat().map( stringUtils.asFloat ).reduce( ( a, c ) => a + c, 0 );
};

const
    {
        DateConstants,

        US_HOLIDAYS,

        ONE_DAY,
        ONE_HOUR,

        calculateNthOccurrenceOfDay,

        before,
        after,
        equal,

        earliest,
        latest,

        numDaysInMonth,
        numDaysInYear,
        isLeapYear,

        addDays,
        subtractDays,

        addWorkdays,

        daysBetween,
        workDaysBetween,

        toNoon,
        toMidnight,
        avoidWeekend,

        addWeeks,
        subtractWeeks,

        lastInstant,

        startOfDecade,
        startOfYear,
        startOfMonth,
        startOfWeek,
        startOfDay,
        startOfHour,
        startOfMinute,

        endOfDecade,
        endOfYear,
        endOfMonth,
        endOfWeek,
        endOfDay,
        endOfHour,
        endOfMinute,

        getWeekdays,
        getBusinessDays,

        isDate,
        isWeekend,
        isHoliday

    } = dateUtils;

const today = new Date();
const yesterday = new Date( today.getTime() - ONE_DAY );
const tomorrow = new Date( today.getTime() + ONE_DAY );

const anHourAgo = new Date( today.getTime() - ONE_HOUR );
const anHourLater = new Date( today.getTime() + ONE_HOUR );

const lastWeek = new Date( today.getTime() - (ONE_DAY * 7) );
const nextWeek = new Date( today.getTime() + (ONE_DAY * 7) );

const lastYear = new Date( today.getTime() - (ONE_DAY * 365) );
const nextYear = new Date( today.getTime() + (ONE_DAY * 365) );

const thursday = new Date( 2024, 9, 17, 9, 37, 0, 0 );
const friday = new Date( 2024, 9, 18, 9, 37, 0, 0 );
const saturday = new Date( 2024, 9, 19, 9, 37, 0, 0 );
const sunday = new Date( 2024, 9, 20, 9, 37, 0, 0 );
const monday = new Date( 2024, 9, 21, 9, 37, 0, 0 );
const tuesday = new Date( 2024, 9, 22, 9, 37, 0, 0 );

describe( "DateUtils.before", () =>
{
    test( "DateUtils.before returns true for ( today, tomorrow )",
          () =>
          {
              expect( before( today, tomorrow ) ).toBe( true );
          } );

    test( "DateUtils.before returns false for ( null, today )",
          () =>
          {
              expect( before( null, today ) ).toBe( false );
          } );

    test( "DateUtils.before returns false for ( yesterday, undefined )",
          () =>
          {
              expect( before( yesterday ) ).toBe( false );
          } );
} );

describe( "DateUtils.after", () =>
{
    test( "DateUtils.after returns false for ( today, tomorrow )",
          () =>
          {
              expect( after( today, tomorrow ) ).toBe( false );
          } );

    test( "DateUtils.after returns false for ( null, today )",
          () =>
          {
              expect( after( null, today ) ).toBe( false );
          } );

    test( "DateUtils.after returns false for ( yesterday, undefined )",
          () =>
          {
              expect( after( yesterday ) ).toBe( false );
          } );
} );

describe( "DateUtils.equal", () =>
{
    test( "DateUtils.equal returns false for ( today, tomorrow )",
          () =>
          {
              expect( equal( today, tomorrow ) ).toBe( false );
          } );

    test( "DateUtils.equal returns false for ( null, today )",
          () =>
          {
              expect( equal( null, today ) ).toBe( false );
          } );

    test( "DateUtils.equal returns false for ( yesterday, undefined )",
          () =>
          {
              expect( equal( yesterday ) ).toBe( false );
          } );

    test( "DateUtils.equal returns true for ( anHourAgo, anHourLater, toNoon )",
          () =>
          {
              let dateA = new Date( 1967, 9, 3, 9, 37, 0, 0 );
              let dateB = new Date( 1967, 9, 3, 8, 37, 0, 0 );

              expect( equal( dateA, dateB, toNoon ) ).toBe( true );
          } );

    test( "DateUtils.equal returns false for ( anHourAgo, anHourLater )",
          () =>
          {
              let dateA = new Date( 1967, 9, 3, 9, 37, 0, 0 );
              let dateB = new Date( 1967, 9, 3, 8, 37, 0, 0 );

              expect( equal( dateA, dateB ) ).toBe( false );
          } );
} );

describe( "DateUtils.earliest and DateUtils.latest", () =>
{
    test( "DateUtils.earliest returns the earliest date from the arguments",
          () =>
          {
              expect( earliest( today, tomorrow, anHourLater, anHourAgo ) ).toEqual( anHourAgo );
          } );

    test( "DateUtils.latest returns the latest date from the arguments",
          () =>
          {
              expect( latest( today, tomorrow, anHourLater, anHourAgo ) ).toEqual( tomorrow );
          } );
} );

test( "DateUtils.numDaysInMonth returns the correct value for leap years",
      () =>
      {
          expect( numDaysInMonth( 1, 2023 ) ).toEqual( 28 );
          expect( numDaysInMonth( 1, 2024 ) ).toEqual( 29 );
      } );

test( "DateUtils.numDaysInYear returns the correct value for leap years",
      () =>
      {
          for( let i = 1967; i <= 2030; i++ )
          {
              const daysInYear = numDaysInYear( i );

              const leapYear = isLeapYear( i );

              expect( daysInYear ).toEqual( leapYear ? 366 : 365 );
          }
      } );

describe( "DateUtils.addDays / subtractDays", () =>
{
    test( "DateUtils.addDays returns January 4th, 2025 when you add 5 days to December 30th, 2024",
          () =>
          {
              let dateA = new Date( 2024, 11, 30, 9, 37, 0, 0 );
              let expected = new Date( 2025, 0, 4, 9, 37, 0, 0 );

              expect( addDays( dateA, 5 ) ).toEqual( expected );
          } );

    test( "DateUtils.addDays returns the expected date even when the number of days is equal to several years",
          () =>
          {
              let dateA = new Date( 1967, 9, 3, 9, 37, 0, 0 );
              let expected = new Date( 2024, 9, 17, 9, 37, 0, 0 );

              const days = daysBetween( dateA, expected );

              expect( addDays( dateA, days ) ).toEqual( expected );

              expect( addDays( dateA, 20_834 ) ).toEqual( expected );
          } );

    test( "DateUtils.addDays returns December 30th, 2024 when you add -5 days from January 4th, 2025",
          () =>
          {
              let dateA = new Date( 2025, 0, 4, 9, 37, 0, 0 );
              let expected = new Date( 2024, 11, 30, 9, 37, 0, 0 );

              expect( addDays( dateA, -5 ) ).toEqual( expected );
          } );

    test( "DateUtils.daysBetween returns -5 for January 4th, 2025 to December 30th, 2024",
          () =>
          {
              let dateA = new Date( 2025, 0, 4, 9, 37, 0, 0 );
              let dateB = new Date( 2024, 11, 30, 9, 37, 0, 0 );

              expect( daysBetween( dateA, dateB ) ).toEqual( -5 );
          } );

    test( "DateUtils.subtractDays returns December 30th, 2024 when you subtract 5 days from January 4th, 2025",
          () =>
          {
              let dateA = new Date( 2025, 0, 4, 9, 37, 0, 0 );
              let expected = new Date( 2024, 11, 30, 9, 37, 0, 0 );

              expect( subtractDays( dateA, 5 ) ).toEqual( expected );
          } );
} );

test( "DateUtils.avoidWeekend returns the following Monday if the specified date is Saturday or Sunday",
      () =>
      {
          expect( avoidWeekend( saturday ) ).toEqual( monday );
          expect( avoidWeekend( sunday ) ).toEqual( monday );
          expect( avoidWeekend( monday ) ).toEqual( monday );
          expect( avoidWeekend( tuesday ) ).toEqual( tuesday );

          expect( addDays( thursday, 2 ) ).toEqual( saturday );

          expect( avoidWeekend( addDays( thursday, 2 ) ) ).toEqual( monday );
      } );

describe( "DateUtils.daysBetween", () =>
{
    test( "DateUtils.daysBetween returns the correct value",
          () =>
          {
              expect( daysBetween( monday, monday ) ).toEqual( 0 );
              expect( daysBetween( monday, tuesday ) ).toEqual( 1 );
              expect( daysBetween( monday, thursday ) ).toEqual( -4 );

              expect( daysBetween( tuesday, monday ) ).toEqual( -1 );
              expect( daysBetween( thursday, monday ) ).toEqual( 4 );
          } );

    test( "DateUtils.daysBetween returns 5 for December 30th, 2024 to January 4th, 2025",
          () =>
          {
              let dateA = new Date( 2024, 11, 30, 9, 37, 0, 0 );
              let dateB = new Date( 2025, 0, 4, 9, 37, 0, 0 );

              expect( daysBetween( dateA, dateB ) ).toEqual( 5 );
          } );

    test( "DateUtils.daysBetween returns 20,834 for October 3rd, 1967 to October 17th, 2024",
          () =>
          {
              let dateA = new Date( 1967, 9, 3, 9, 37, 0, 0 );
              let dateB = new Date( 2024, 9, 17, 9, 37, 0, 0 );

              expect( daysBetween( dateA, dateB ) ).toEqual( 20_834 );
          } );
} );

describe( "DateUtils.addWeeks / subtractWeeks", () =>
{
    test( "DateUtils.addWeeks returns October 3rd, 2024 when you add 0 weeks to October 3rd, 2024",
          () =>
          {
              let dateA = new Date( 2024, 9, 3, 9, 37, 0, 0 );

              expect( addWeeks( dateA, 0 ) ).toEqual( dateA );
          } );

    test( "DateUtils.addWeeks returns October 10th, 2024 when you add 1 week to October 3rd, 2024",
          () =>
          {
              let dateA = new Date( 2024, 9, 3, 9, 37, 0, 0 );
              let expected = new Date( 2024, 9, 10, 9, 37, 0, 0 );

              expect( addWeeks( dateA, 1 ) ).toEqual( expected );
          } );

    test( "DateUtils.addWeeks returns October 17th, 2024 when you add 2 weeks to October 3rd, 2024",
          () =>
          {
              let dateA = new Date( 2024, 9, 3, 9, 37, 0, 0 );
              let expected = new Date( 2024, 9, 17, 9, 37, 0, 0 );

              expect( addWeeks( dateA, 2 ) ).toEqual( expected );
          } );

    test( "DateUtils.subtractWeeks returns October 3rd, 2024 when you subtract 2 weeks from October 17th, 2024",
          () =>
          {
              let dateA = new Date( 2024, 9, 17, 9, 37, 0, 0 );
              let expected = new Date( 2024, 9, 3, 9, 37, 0, 0 );

              expect( subtractWeeks( dateA, 2 ) ).toEqual( expected );
          } );
} );

describe( "DateUtils.startOf...", () =>
{
    test( "DateUtils.startOfYear returns exactly Midnight, January 1st, 2024 for any date in 2024",
          () =>
          {
              let expected = new Date( 2024, 0, 1, 0, 0, 0, 0 );

              let dateA = new Date( 2024, 0, 1, 0, 0, 0, 0 );
              let dateB = new Date( 2024, 9, 3, 9, 37, 0, 0 );
              let dateC = new Date( 2024, 11, 31, 23, 59, 59, 999 );

              expect( startOfYear( expected ) ).toEqual( expected );

              expect( startOfYear( dateA ) ).toEqual( expected );
              expect( startOfYear( dateB ) ).toEqual( expected );
              expect( startOfYear( dateC ) ).toEqual( expected );

          } );

    test( "DateUtils.startOfMonth returns exactly Midnight, February 1st, 2024 for any date in February 2024",
          () =>
          {
              let expected = new Date( 2024, 1, 1, 0, 0, 0, 0 );

              let dateA = new Date( 2024, 1, 1, 0, 0, 0, 0 );
              let dateB = new Date( 2024, 1, 3, 9, 37, 0, 0 );
              let dateC = new Date( 2024, 1, 7, 23, 59, 59, 999 );
              let dateD = new Date( 2024, 1, 29, 23, 59, 59, 999 );

              expect( startOfMonth( expected ) ).toEqual( expected );

              expect( startOfMonth( dateA ) ).toEqual( expected );
              expect( startOfMonth( dateB ) ).toEqual( expected );
              expect( startOfMonth( dateC ) ).toEqual( expected );
              expect( startOfMonth( dateD ) ).toEqual( expected );

          } );

    test( "DateUtils.startOfWeek returns exactly Midnight, October 13th, 2024 for any date in that calendar week",
          () =>
          {
              let expected = new Date( 2024, 9, 13, 0, 0, 0, 0 );

              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2024, 9, 14, 9, 37, 0, 0 );
              let dateC = new Date( 2024, 9, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2024, 9, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2024, 9, 17, 23, 59, 59, 999 );
              let dateF = new Date( 2024, 9, 18, 23, 59, 59, 999 );
              let dateG = new Date( 2024, 9, 19, 23, 59, 59, 999 );

              let dateH = new Date( 2024, 9, 20, 0, 0, 0, 0 );

              expect( startOfWeek( expected ) ).toEqual( expected );

              expect( startOfWeek( dateA ) ).toEqual( expected );
              expect( startOfWeek( dateB ) ).toEqual( expected );
              expect( startOfWeek( dateC ) ).toEqual( expected );
              expect( startOfWeek( dateD ) ).toEqual( expected );
              expect( startOfWeek( dateE ) ).toEqual( expected );
              expect( startOfWeek( dateF ) ).toEqual( expected );
              expect( startOfWeek( dateG ) ).toEqual( expected );

              expect( startOfWeek( dateH ) ).not.toEqual( expected );

          } );

    test( "DateUtils.startOfDay returns exactly Midnight of the same day for any date",
          () =>
          {
              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2023, 9, 14, 9, 37, 0, 0 );
              let dateC = new Date( 2018, 9, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2012, 9, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2010, 9, 17, 23, 59, 59, 999 );
              let dateF = new Date( 2024, 10, 2, 2, 0, 0, 0 );

              expect( startOfDay( dateA ) ).toEqual( new Date( 2024, 9, 13, 0, 0, 0, 0 ) );
              expect( startOfDay( dateA ) ).toEqual( toMidnight( dateA ) );

              expect( startOfDay( dateB ) ).toEqual( new Date( 2023, 9, 14, 0, 0, 0, 0 ) );
              expect( startOfDay( dateB ) ).toEqual( toMidnight( dateB ) );

              expect( startOfDay( dateC ) ).toEqual( new Date( 2018, 9, 15, 0, 0, 0, 0 ) );
              expect( startOfDay( dateC ) ).toEqual( toMidnight( dateC ) );

              expect( startOfDay( dateD ) ).toEqual( new Date( 2012, 9, 16, 0, 0, 0, 0 ) );
              expect( startOfDay( dateD ) ).toEqual( toMidnight( dateD ) );

              expect( startOfDay( dateE ) ).toEqual( new Date( 2010, 9, 17, 0, 0, 0, 0 ) );
              expect( startOfDay( dateE ) ).toEqual( toMidnight( dateE ) );

              expect( startOfDay( dateF ) ).toEqual( new Date( 2024, 10, 2, 0, 0, 0, 0 ) );
              expect( startOfDay( dateF ) ).toEqual( toMidnight( dateF ) );

          } );

    test( "DateUtils.startOfHour returns the first instant of the current hour for any date",
          () =>
          {
              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2023, 9, 14, 9, 37, 0, 0 );
              let dateC = new Date( 2018, 9, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2012, 9, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2010, 9, 17, 23, 59, 59, 999 );
              let dateF = new Date( 2024, 10, 2, 2, 0, 0, 0 );

              expect( startOfHour( dateA ) ).toEqual( new Date( 2024, 9, 13, 1, 0, 0, 0 ) );

              expect( startOfHour( dateB ) ).toEqual( new Date( 2023, 9, 14, 9, 0, 0, 0 ) );

              expect( startOfHour( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 0, 0, 0 ) );

              expect( startOfHour( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 0, 0, 0 ) );

              expect( startOfHour( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 0, 0, 0 ) );

              expect( startOfHour( dateF ) ).toEqual( new Date( 2024, 10, 2, 2, 0, 0, 0 ) );

          } );

    test( "DateUtils.startOfMinute returns the first instant of the current minute for any date",
          () =>
          {
              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2023, 9, 14, 9, 37, 59, 0 );
              let dateC = new Date( 2018, 9, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2012, 9, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2010, 9, 17, 23, 59, 59, 999 );
              let dateF = new Date( 2024, 10, 2, 2, 0, 0, 1 );

              expect( startOfMinute( dateA ) ).toEqual( new Date( 2024, 9, 13, 1, 2, 0, 0 ) );

              expect( startOfMinute( dateB ) ).toEqual( new Date( 2023, 9, 14, 9, 37, 0, 0 ) );

              expect( startOfMinute( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 59, 0, 0 ) );

              expect( startOfMinute( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 59, 0, 0 ) );

              expect( startOfMinute( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 59, 0, 0 ) );

              expect( startOfMinute( dateF ) ).toEqual( new Date( 2024, 10, 2, 2, 0, 0, 0 ) );

          } );

    test( "DateUtils.startOfDecade returns the first instant of the current decade for any date",
          () =>
          {
              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2023, 5, 14, 9, 37, 59, 0 );
              let dateC = new Date( 2018, 3, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2012, 2, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2010, 1, 17, 23, 59, 59, 999 );
              let dateF = new Date( 1967, 10, 2, 2, 0, 0, 1 );

              expect( startOfDecade( dateA ) ).toEqual( new Date( 2020, 0, 1, 0, 0, 0, 0 ) );

              expect( startOfDecade( dateB ) ).toEqual( new Date( 2020, 0, 1, 0, 0, 0, 0 ) );

              expect( startOfDecade( dateC ) ).toEqual( new Date( 2010, 0, 1, 0, 0, 0, 0 ) );

              expect( startOfDecade( dateD ) ).toEqual( new Date( 2010, 0, 1, 0, 0, 0, 0 ) );

              expect( startOfDecade( dateE ) ).toEqual( new Date( 2010, 0, 1, 0, 0, 0, 0 ) );

              expect( startOfDecade( dateF ) ).toEqual( new Date( 1960, 0, 1, 0, 0, 0, 0 ) );

          } );
} );

describe( "DateUtils.endOf...", () =>
{
    test( "DateUtils.endOfYear returns the last millisecond of December 31st, 2024 for any date in 2024",
          () =>
          {
              let expected = new Date( 2024, 11, 31, 23, 59, 59, 999 );

              let dateA = new Date( 2024, 0, 1, 0, 0, 0, 0 );
              let dateB = new Date( 2024, 9, 3, 9, 37, 0, 0 );
              let dateC = new Date( 2024, 11, 31, 23, 59, 59, 999 );

              expect( endOfYear( expected ) ).toEqual( expected );

              expect( endOfYear( dateA ) ).toEqual( expected );
              expect( endOfYear( dateB ) ).toEqual( expected );
              expect( endOfYear( dateC ) ).toEqual( expected );

          } );

    test( "DateUtils.endOfMonth returns the last millisecond of the last day of the month in which the date occurs",
          () =>
          {
              let expected = new Date( 2024, 1, 29, 23, 59, 59, 999 );

              let dateA = new Date( 2024, 1, 1, 0, 0, 0, 0 );
              let dateB = new Date( 2024, 1, 3, 9, 37, 0, 0 );
              let dateC = new Date( 2024, 1, 7, 23, 59, 59, 999 );
              let dateD = new Date( 2024, 1, 29, 23, 59, 59, 999 );

              expect( endOfMonth( expected ) ).toEqual( expected );

              expect( endOfMonth( dateA ) ).toEqual( expected );
              expect( endOfMonth( dateB ) ).toEqual( expected );
              expect( endOfMonth( dateC ) ).toEqual( expected );
              expect( endOfMonth( dateD ) ).toEqual( expected );

              expect( endOfMonth( new Date( 2011, 3, 14, 2, 30, 0, 0 ) ) ).toEqual( new Date( 2011, 3, 30, 23, 59, 59, 999 ) );

          } );

    test( "DateUtils.endOfWeek returns the last millisecond of October 19th, 2024 for any date in that calendar week",
          () =>
          {
              let expected = Object.freeze( new Date( 2024, 9, 19, 23, 59, 59, 999 ) );

              let dateA = Object.freeze( new Date( 2024, 9, 13, 1, 2, 3, 4 ) );
              let dateB = Object.freeze( new Date( 2024, 9, 14, 9, 37, 0, 0 ) );
              let dateC = Object.freeze( new Date( 2024, 9, 15, 23, 59, 59, 999 ) );
              let dateD = Object.freeze( new Date( 2024, 9, 16, 23, 59, 59, 999 ) );
              let dateE = Object.freeze( new Date( 2024, 9, 17, 23, 59, 59, 999 ) );
              let dateF = Object.freeze( new Date( 2024, 9, 18, 23, 59, 59, 999 ) );
              let dateG = Object.freeze( new Date( 2024, 9, 19, 23, 59, 59, 999 ) );

              let dateH = Object.freeze( new Date( 2024, 9, 20, 0, 0, 0, 0 ) );

              expect( endOfWeek( expected ) ).toEqual( expected );

              expect( endOfWeek( dateA ) ).toEqual( expected );
              expect( endOfWeek( dateB ) ).toEqual( expected );
              expect( endOfWeek( dateC ) ).toEqual( expected );
              expect( endOfWeek( dateD ) ).toEqual( expected );
              expect( endOfWeek( dateE ) ).toEqual( expected );
              expect( endOfWeek( dateF ) ).toEqual( expected );
              expect( endOfWeek( dateG ) ).toEqual( expected );

              expect( endOfWeek( dateH ) ).not.toEqual( expected );

          } );

    test( "DateUtils.endOfDay returns the last millisecond of the same day for any date",
          () =>
          {
              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2023, 9, 14, 9, 37, 0, 0 );
              let dateC = new Date( 2018, 9, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2012, 9, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2010, 9, 17, 23, 59, 59, 999 );
              let dateF = new Date( 2024, 10, 2, 2, 0, 0, 0 );

              expect( endOfDay( dateA ) ).toEqual( new Date( 2024, 9, 13, 23, 59, 59, 999 ) );

              const lastInstantOf = lastInstant( dateA );

              expect( endOfDay( dateA ) ).toEqual( lastInstantOf );

              expect( endOfDay( dateB ) ).toEqual( new Date( 2023, 9, 14, 23, 59, 59, 999 ) );
              expect( endOfDay( dateB ) ).toEqual( lastInstant( dateB ) );

              expect( endOfDay( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 59, 59, 999 ) );
              expect( endOfDay( dateC ) ).toEqual( lastInstant( dateC ) );

              expect( endOfDay( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 59, 59, 999 ) );
              expect( endOfDay( dateD ) ).toEqual( lastInstant( dateD ) );

              expect( endOfDay( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 59, 59, 999 ) );
              expect( endOfDay( dateE ) ).toEqual( lastInstant( dateE ) );

              expect( endOfDay( dateF ) ).toEqual( new Date( 2024, 10, 2, 23, 59, 59, 999 ) );
              expect( endOfDay( dateF ) ).toEqual( lastInstant( dateF ) );

          } );

    test( "DateUtils.lastInstant returns the last millisecond of the current hour for any date",
          () =>
          {
              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2023, 9, 14, 9, 37, 0, 0 );
              let dateC = new Date( 2018, 9, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2012, 9, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2010, 9, 17, 23, 59, 59, 999 );
              let dateF = new Date( 2024, 10, 2, 2, 0, 0, 0 );

              expect( endOfHour( dateA ) ).toEqual( new Date( 2024, 9, 13, 1, 59, 59, 999 ) );

              expect( endOfHour( dateB ) ).toEqual( new Date( 2023, 9, 14, 9, 59, 59, 999 ) );

              expect( endOfHour( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 59, 59, 999 ) );

              expect( endOfHour( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 59, 59, 999 ) );

              expect( endOfHour( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 59, 59, 999 ) );

              expect( endOfHour( dateF ) ).toEqual( new Date( 2024, 10, 2, 2, 59, 59, 999 ) );

          } );

    test( "DateUtils.endOfMinute returns the last millisecond of the current minute for any date",
          () =>
          {
              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2023, 9, 14, 9, 37, 59, 0 );
              let dateC = new Date( 2018, 9, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2012, 9, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2010, 9, 17, 23, 59, 59, 999 );
              let dateF = new Date( 2024, 10, 2, 2, 0, 0, 1 );

              expect( endOfMinute( dateA ) ).toEqual( new Date( 2024, 9, 13, 1, 2, 59, 999 ) );

              expect( endOfMinute( dateB ) ).toEqual( new Date( 2023, 9, 14, 9, 37, 59, 999 ) );

              expect( endOfMinute( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 59, 59, 999 ) );

              expect( endOfMinute( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 59, 59, 999 ) );

              expect( endOfMinute( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 59, 59, 999 ) );

              expect( endOfMinute( dateF ) ).toEqual( new Date( 2024, 10, 2, 2, 0, 59, 999 ) );

          } );

    test( "DateUtils.endOfDecade returns the last millisecond of the current decade for any date",
          () =>
          {
              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2023, 5, 14, 9, 37, 59, 0 );
              let dateC = new Date( 2018, 3, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2012, 2, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2010, 1, 17, 23, 59, 59, 999 );
              let dateF = new Date( 1967, 10, 2, 2, 0, 0, 1 );

              expect( endOfDecade( dateA ) ).toEqual( new Date( 2029, 11, 31, 23, 59, 59, 999 ) );

              expect( endOfDecade( dateB ) ).toEqual( new Date( 2029, 11, 31, 23, 59, 59, 999 ) );

              expect( endOfDecade( dateC ) ).toEqual( new Date( 2019, 11, 31, 23, 59, 59, 999 ) );

              expect( endOfDecade( dateD ) ).toEqual( new Date( 2019, 11, 31, 23, 59, 59, 999 ) );

              expect( endOfDecade( dateE ) ).toEqual( new Date( 2019, 11, 31, 23, 59, 59, 999 ) );

              expect( endOfDecade( dateF ) ).toEqual( new Date( 1969, 11, 31, 23, 59, 59, 999 ) );

          } );
} );

describe( "DateUtils.calculateNthOccurrenceOfDay", () =>
{
    test( "The first Monday in March, 2024 is March 4th, 2024",
          () =>
          {
              const dateConstants = DateConstants;

              const firstMonday = calculateNthOccurrenceOfDay( 2024,
                                                               dateConstants.Months.MARCH,
                                                               dateConstants.Occurrence.FIRST,
                                                               dateConstants.Days.MONDAY );

              expect( firstMonday ).toEqual( new Date( 2024, dateConstants.Months.MARCH, 4, 0, 0, 0, 0 ) );
          } );

    test( "The third Thursday in November, 2024 is November 21, 2024",
          () =>
          {
              const dateConstants = DateConstants;

              const thirdThursday = calculateNthOccurrenceOfDay( 2024,
                                                                 dateConstants.Months.NOVEMBER,
                                                                 dateConstants.Occurrence.THIRD,
                                                                 dateConstants.Days.THURSDAY );

              expect( thirdThursday ).toEqual( new Date( 2024, dateConstants.Months.NOVEMBER, 21, 0, 0, 0, 0 ) );
          } );

    test( "The first Tuesday in October, 2024 is October 1st, 2024",
          () =>
          {
              const dateConstants = DateConstants;

              const thirdThursday = calculateNthOccurrenceOfDay( 2024,
                                                                 dateConstants.Months.OCTOBER,
                                                                 dateConstants.Occurrence.FIRST,
                                                                 dateConstants.Days.TUESDAY );

              expect( thirdThursday ).toEqual( new Date( 2024, dateConstants.Months.OCTOBER, 1, 0, 0, 0, 0 ) );
          } );

    test( "The first Wednesday in October, 2024 is October 2nd, 2024",
          () =>
          {
              const dateConstants = DateConstants;

              const thirdThursday = calculateNthOccurrenceOfDay( 2024,
                                                                 dateConstants.Months.OCTOBER,
                                                                 dateConstants.Occurrence.FIRST,
                                                                 dateConstants.Days.WEDNESDAY );

              expect( thirdThursday ).toEqual( new Date( 2024, dateConstants.Months.OCTOBER, 2, 0, 0, 0, 0 ) );
          } );
} );

describe( "Work Day / Business Days functionality", () =>
{
    test( "DateUtils.workDaysBetween October 21st, 2024 and October 21st, 2024 is 0",
          () =>
          {
              const oct21 = new Date( 2024, 9, 21 );

              let workDays = workDaysBetween( oct21, oct21 );

              let calendarDays = daysBetween( oct21, oct21 );

              expect( workDays ).toEqual( 0 );
              expect( workDays ).toEqual( calendarDays );

              expect( addWorkdays( oct21, workDays ) ).toEqual( oct21 );
          } );

    test( "DateUtils.workDaysBetween October 21st, 2024 and October 25th, 2024 is 4",
          () =>
          {
              const oct21 = new Date( 2024, 9, 21 );
              const oct25 = new Date( 2024, 9, 25 );

              let workDays = workDaysBetween( oct21, oct25 );

              let calendarDays = daysBetween( oct21, oct25 );

              expect( workDays ).toEqual( 4 );
              expect( workDays ).toEqual( calendarDays );

              expect( addWorkdays( oct21, workDays ) ).toEqual( oct25 );
          } );

    test( "DateUtils.workDaysBetween October 21st, 2024 and November 8th, 2024 is 14",
          () =>
          {
              const oct21 = new Date( 2024, 9, 21 );
              const nov8 = new Date( 2024, 10, 8 );

              const days = workDaysBetween( oct21, nov8 );

              expect( days ).toEqual( 14 );

              expect( addWorkdays( oct21, days ) ).toEqual( nov8 );
          } );

    test( "DateUtils.workDaysBetween November 8th, 2024 and October 21st, 2024 is -14",
          () =>
          {
              const oct21 = new Date( 2024, 9, 21 );
              const nov8 = new Date( 2024, 10, 8 );

              const days = workDaysBetween( nov8, oct21 );

              expect( days ).toEqual( -14 );

              expect( addWorkdays( nov8, days ) ).toEqual( oct21 );
          } );

    test( "DateUtils.workDaysBetween October 14th, 2024* and October 18th, 2024, accounting for holidays is 4",
          () =>
          {
              const dateA = new Date( 2024, 9, 14 );
              const dateB = new Date( 2024, 9, 18 );

              const daysAccountingForHolidays = workDaysBetween( dateA, dateB, US_HOLIDAYS );

              const daysRegardlessOfHolidays = workDaysBetween( dateA, dateB );

              expect( daysAccountingForHolidays ).toEqual( 4 );

              expect( daysRegardlessOfHolidays ).toEqual( 4 );

              expect( addWorkdays( dateA, daysAccountingForHolidays, US_HOLIDAYS ) ).toEqual( dateB );

          } );

    test( "DateUtils.workDaysBetween October 1st, 2024 and October 31st, 2024, accounting for holidays is 21",
          () =>
          {
              const dateA = new Date( 2024, 9, 1 );
              const dateB = new Date( 2024, 9, 31 );

              const daysRegardlessOfHolidays = workDaysBetween( dateA, dateB );

              const daysAccountingForHolidays = workDaysBetween( dateA, dateB, US_HOLIDAYS );

              expect( daysRegardlessOfHolidays ).toEqual( 22 );

              expect( daysAccountingForHolidays ).toEqual( 21 );

              expect( addWorkdays( dateA, daysRegardlessOfHolidays ) ).toEqual( dateB );

              expect( addWorkdays( dateA, daysAccountingForHolidays, US_HOLIDAYS ) ).toEqual( dateB );

          } );

    test( "DateUtils.weekdays in January 2024 is 23", () =>
    {
        const weekdays = workDaysBetween( new Date( 2023, 11, 31 ), new Date( 2024, 0, 31 ) );

        expect( weekdays ).toEqual( 23 );

        expect( addWorkdays( new Date( 2023, 11, 31 ), weekdays ) ).toEqual( avoidWeekend( new Date( 2024, 0, 31 ), -1 ) );
    } );

    test( "DateUtils.weekdays in February 2024 is 21", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 0, 31 ), new Date( 2024, 1, 29 ) );

        expect( weekdays ).toEqual( 21 );

        expect( addWorkdays( new Date( 2024, 0, 31 ), weekdays ) ).toEqual( avoidWeekend( new Date( 2024, 1, 29 ), -1 ) );
    } );

    test( "DateUtils.weekdays in March 2024 is 21", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 1, 29 ), new Date( 2024, 2, 31 ) );

        expect( weekdays ).toEqual( 21 );

        expect( addWorkdays( new Date( 2024, 1, 29 ), weekdays ) ).toEqual( avoidWeekend( new Date( 2024, 2, 31 ), -1 ) );
    } );

    test( "DateUtils.weekdays in April 2024 is 22", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 2, 31 ), new Date( 2024, 3, 30 ) );

        expect( weekdays ).toEqual( 22 );

        expect( addWorkdays( new Date( 2024, 2, 31 ), weekdays ) ).toEqual( avoidWeekend( new Date( 2024, 3, 30 ), -1 ) );
    } );

    test( "DateUtils.weekdays in May 2024 is 23", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 3, 30 ), new Date( 2024, 4, 31 ) );

        expect( weekdays ).toEqual( 23 );

        expect( addWorkdays( new Date( 2024, 3, 30 ), weekdays ) ).toEqual( avoidWeekend( new Date( 2024, 4, 31 ), -1 ) );
    } );

    test( "DateUtils.weekdays in June 2024 is 20", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 4, 31 ), new Date( 2024, 5, 30 ) );

        expect( weekdays ).toEqual( 20 );

        expect( addWorkdays( new Date( 2024, 4, 31 ), weekdays ) ).toEqual( avoidWeekend( new Date( 2024, 5, 30 ), -1 ) );
    } );

    test( "DateUtils.weekdays in July 2024 is 23", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 5, 30 ), new Date( 2024, 6, 31 ) );

        expect( weekdays ).toEqual( 23 );
    } );

    test( "DateUtils.weekdays in August 2024 is 22", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 6, 31 ), new Date( 2024, 7, 31 ) );

        expect( weekdays ).toEqual( 22 );
    } );

    test( "DateUtils.weekdays in September 2024 is 21", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 7, 31 ), new Date( 2024, 8, 30 ) );

        expect( weekdays ).toEqual( 21 );
    } );

    test( "DateUtils.weekdays in October 2024 is 23", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 8, 30 ), new Date( 2024, 9, 31 ) );

        expect( weekdays ).toEqual( 23 );
    } );

    test( "DateUtils.weekdays in November 2024 is 21", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 9, 31 ), new Date( 2024, 10, 30 ) );

        expect( weekdays ).toEqual( 21 );
    } );

    test( "DateUtils.weekdays in December 2024 is 22", () =>
    {
        const weekdays = workDaysBetween( new Date( 2024, 10, 30 ), new Date( 2024, 11, 31 ) );

        expect( weekdays ).toEqual( 22 );
    } );


    test( "DateUtils.workDaysBetween returns values that can be summed",
          () =>
          {
              let dates = [];

              let workdaysPerMonth = {};
              let workDaysMinusHolidaysPerMonth = {};

              let workdaysPerYear = 0;
              let workdaysPerYearMinusHolidays = 0;

              for( let i = 0; i < 12; i++ )
              {
                  const firstOfMonth = new Date( 2024, i, 1 );
                  dates.push( firstOfMonth );
              }

              dates.forEach( date =>
                             {
                                 const year = date.getFullYear();
                                 const month = date.getMonth();

                                 let priorDay = subtractDays( date, 1 );
                                 let endOfMonth = new Date( year, month, numDaysInMonth( month, year ) );

                                 const between = workDaysBetween( priorDay, endOfMonth );
                                 workdaysPerMonth[month] = between;
                                 workdaysPerYear += between;

                                 const workDaysBetweenMinusHolidays = workDaysBetween( priorDay, endOfMonth, US_HOLIDAYS );
                                 workDaysMinusHolidaysPerMonth[month] = workDaysBetweenMinusHolidays;
                                 workdaysPerYearMinusHolidays += workDaysBetweenMinusHolidays;
                             } );

              const workDays2024 = workDaysBetween( new Date( 2023, 11, 31 ), new Date( 2024, 11, 31 ) );

              const workDays2024MinusHolidays = workDaysBetween( new Date( 2023, 11, 31 ), new Date( 2024, 11, 31 ), US_HOLIDAYS );

              expect( workDays2024 ).toEqual( workdaysPerYear );
              expect( workDays2024MinusHolidays ).toEqual( workdaysPerYearMinusHolidays );

          } );

    test( "DateUtils.daysBetween January 1st, 2020 and December 31st, 2024 when added to the first date returns the second date",
          () =>
          {
              const dateA = Object.freeze( new Date( 2020, 0, 1 ) );
              const dateB = Object.freeze( new Date( 2024, 11, 31 ) );

              const days = daysBetween( dateA, dateB );

              expect( addDays( dateA, days ) ).toEqual( dateB );
          } );

    test( "DateUtils.workDaysBetween January 1st, 2020 and December 31st, 2024, accounting for holidays is ",
          () =>
          {
              const dateA = Object.freeze( new Date( 2020, 0, 1 ) );
              const dateB = Object.freeze( new Date( 2024, 11, 31 ) );

              const daysRegardlessOfHolidays = workDaysBetween( dateA, dateB );

              const daysAccountingForHolidays = workDaysBetween( dateA, dateB, US_HOLIDAYS );

              expect( daysRegardlessOfHolidays ).toEqual( 1_306 );

              expect( daysAccountingForHolidays ).toEqual( 1_259 );

              // expect( addWorkdays( dateA, daysRegardlessOfHolidays ) ).toEqual( avoidWeekend( dateB, -1 ) );

              // expect( addWorkdays( dateA, daysAccountingForHolidays, US_HOLIDAYS ) ).toEqual( avoidWeekend( dateB, -1 ) );

          } );
} );


// uncomment to test DatesIterable; IN their present state, these tests take almost 10 minutes to run, so...
/*
 describe( "getWeekdays", () =>
 {
 test( "weekdays starting with October 3rd, 1967 and ending on April 4th, 1999",
 () =>
 {
 const startDate = new Date( 1967, 9, 3 );
 const endDate = new Date( 1999, 3, 4 );

 const weekdays = getWeekdays( startDate, endDate );

 let count = 0;

 for( let weekday of weekdays )
 {
 count += isDate( weekday ) ? 1 : 0;
 }

 expect( count ).toEqual( 8_219 );
 } );

 test( "Mondays starting with October 3rd, 1967 and ending on April 4th, 1999",
 () =>
 {
 const startDate = new Date( 1967, 9, 3 );
 const endDate = new Date( 1999, 3, 4 );

 let count = 0;

 const iterable = new DatesIterable( startDate, endDate );

 iterable.map( toNoon );

 iterable.filter( ( date ) => null != date && date.getDay() === 1 );

 for( let monday of iterable )
 {
 expect( monday.getHours() ).toEqual( 12 );
 expect( monday.getDay() ).toEqual( 1 );

 count += isDate( monday ) ? 1 : 0;
 }

 expect( count ).toEqual( 1_643 );
 } );
 } );

 describe( "getWorkdays", () =>
 {
 test( "business days starting with October 3rd, 1967 and ending on April 4th, 1999",
 () =>
 {
 const startDate = new Date( 1967, 9, 3 );
 const endDate = new Date( 1999, 3, 4 );

 const weekdays = getBusinessDays( startDate, endDate );

 let count = 0;

 for( let weekday of weekdays )
 {
 count += isDate( weekday ) ? 1 : 0;
 }

 expect( count ).toEqual( 8_219 );
 } );

 test( "Working Mondays starting with October 3rd, 1967 and ending on April 4th, 1999",
 () =>
 {
 const startDate = new Date( 1967, 9, 3 );
 const endDate = new Date( 1999, 3, 4 );

 let count = 0;

 const iterable = new DatesIterable( startDate, endDate );

 iterable.map( toNoon );

 iterable.filter( ( date ) => null != date && date.getDay() === 1 && !isHoliday( date ) );

 for( let monday of iterable )
 {
 expect( monday.getHours() ).toEqual( 12 );
 expect( monday.getDay() ).toEqual( 1 );

 count += isDate( monday ) ? 1 : 0;
 }

 expect( count ).toEqual( 1_643 );
 } );
 } );
 */
