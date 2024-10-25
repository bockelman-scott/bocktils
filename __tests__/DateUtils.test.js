const dateUtils = require( "../src/DateUtils.cjs" );

const constants = dateUtils?.dependencies?.constants || require( "../src/Constants.cjs" );
const typeUtils = dateUtils?.dependencies?.typeUtils || require( "../src/TypeUtils.cjs" );
const stringUtils = dateUtils?.dependencies?.stringUtils || require( "../src/StringUtils.cjs" );
const arrayUtils = dateUtils?.dependencies?.arrayUtils || require( "../src/ArrayUtils.cjs" );
const objectUtils = dateUtils?.dependencies?.objectUtils || require( "../src/ObjectUtils.cjs" );

const today = new Date();
const yesterday = new Date( today.getTime() - dateUtils.ONE_DAY );
const tomorrow = new Date( today.getTime() + dateUtils.ONE_DAY );

const anHourAgo = new Date( today.getTime() - dateUtils.ONE_HOUR );
const anHourLater = new Date( today.getTime() + dateUtils.ONE_HOUR );

const lastWeek = new Date( today.getTime() - (dateUtils.ONE_DAY * 7) );
const nextWeek = new Date( today.getTime() + (dateUtils.ONE_DAY * 7) );

const lastYear = new Date( today.getTime() - (dateUtils.ONE_DAY * 365) );
const nextYear = new Date( today.getTime() + (dateUtils.ONE_DAY * 365) );

const thursday = new Date( 2024, 9, 17, 9, 37, 0, 0 );
const friday = new Date( 2024, 9, 18, 9, 37, 0, 0 );
const saturday = new Date( 2024, 9, 19, 9, 37, 0, 0 );
const sunday = new Date( 2024, 9, 20, 9, 37, 0, 0 );
const monday = new Date( 2024, 9, 21, 9, 37, 0, 0 );
const tuesday = new Date( 2024, 9, 22, 9, 37, 0, 0 );

const sum = function( ...pArgs )
{
    const arr = arrayUtils.asArray( pArgs );
    return arr.flat().map( stringUtils.asFloat ).reduce( ( a, c ) => a + c, 0 );
};

describe( "DateUtils.before", () =>
{
    test( "DateUtils.before returns true for ( today, tomorrow )",
          () =>
          {
              expect( dateUtils.before( today, tomorrow ) ).toBe( true );
          } );

    test( "DateUtils.before returns false for ( null, today )",
          () =>
          {
              expect( dateUtils.before( null, today ) ).toBe( false );
          } );

    test( "DateUtils.before returns true for ( yesterday, undefined )",
          () =>
          {
              expect( dateUtils.before( yesterday ) ).toBe( true );
          } );
} );

describe( "DateUtils.after", () =>
{
    test( "DateUtils.after returns false for ( today, tomorrow )",
          () =>
          {
              expect( dateUtils.after( today, tomorrow ) ).toBe( false );
          } );

    test( "DateUtils.after returns false for ( null, today )",
          () =>
          {
              expect( dateUtils.after( null, today ) ).toBe( false );
          } );

    test( "DateUtils.after returns true for ( yesterday, undefined )",
          () =>
          {
              expect( dateUtils.after( yesterday ) ).toBe( true );
          } );
} );

describe( "DateUtils.equal", () =>
{
    test( "DateUtils.equal returns false for ( today, tomorrow )",
          () =>
          {
              expect( dateUtils.equal( today, tomorrow ) ).toBe( false );
          } );

    test( "DateUtils.equal returns false for ( null, today )",
          () =>
          {
              expect( dateUtils.equal( null, today ) ).toBe( false );
          } );

    test( "DateUtils.equal returns true for ( yesterday, undefined )",
          () =>
          {
              expect( dateUtils.equal( yesterday ) ).toBe( true );
          } );

    test( "DateUtils.equal returns true for ( anHourAgo, anHourLater, toNoon )",
          () =>
          {
              let dateA = new Date( 1967, 9, 3, 9, 37, 0, 0 );
              let dateB = new Date( 1967, 9, 3, 8, 37, 0, 0 );

              expect( dateUtils.equal( dateA, dateB, dateUtils.toNoon ) ).toBe( true );
          } );

    test( "DateUtils.equal returns false for ( anHourAgo, anHourLater )",
          () =>
          {
              let dateA = new Date( 1967, 9, 3, 9, 37, 0, 0 );
              let dateB = new Date( 1967, 9, 3, 8, 37, 0, 0 );

              expect( dateUtils.equal( dateA, dateB ) ).toBe( false );
          } );
} );

describe( "DateUtils.earliest and DateUtils.latest", () =>
{
    test( "DateUtils.earliest returns the earliest date from the arguments",
          () =>
          {
              expect( dateUtils.earliest( today, tomorrow, anHourLater, anHourAgo ) ).toEqual( anHourAgo );
          } );

    test( "DateUtils.latest returns the latest date from the arguments",
          () =>
          {
              expect( dateUtils.latest( today, tomorrow, anHourLater, anHourAgo ) ).toEqual( tomorrow );
          } );
} );

test( "DateUtils.numDaysInMonth returns the correct value for leap years",
      () =>
      {
          expect( dateUtils.numDaysInMonth( 1, 2023 ) ).toEqual( 28 );
          expect( dateUtils.numDaysInMonth( 1, 2024 ) ).toEqual( 29 );
      } );

test( "DateUtils.numDaysInYear returns the correct value for leap years",
      () =>
      {
          for( let i = 1967; i <= 2030; i++ )
          {
              const daysInYear = dateUtils.numDaysInYear( i );

              const leapYear = dateUtils.isLeapYear( i );

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

              expect( dateUtils.addDays( dateA, 5 ) ).toEqual( expected );
          } );

    test( "DateUtils.addDays returns the expected date even when the number of days is equal to several years",
          () =>
          {
              let dateA = new Date( 1967, 9, 3, 9, 37, 0, 0 );
              let expected = new Date( 2024, 9, 17, 9, 37, 0, 0 );

              const days = dateUtils.daysBetween( dateA, expected );

              expect( dateUtils.addDays( dateA, days ) ).toEqual( expected );

              expect( dateUtils.addDays( dateA, 20_834 ) ).toEqual( expected );
          } );

    test( "DateUtils.addDays returns December 30th, 2024 when you add -5 days from January 4th, 2025",
          () =>
          {
              let dateA = new Date( 2025, 0, 4, 9, 37, 0, 0 );
              let expected = new Date( 2024, 11, 30, 9, 37, 0, 0 );

              expect( dateUtils.addDays( dateA, -5 ) ).toEqual( expected );
          } );

    test( "DateUtils.daysBetween returns -5 for January 4th, 2025 to December 30th, 2024",
          () =>
          {
              let dateA = new Date( 2025, 0, 4, 9, 37, 0, 0 );
              let dateB = new Date( 2024, 11, 30, 9, 37, 0, 0 );

              expect( dateUtils.daysBetween( dateA, dateB ) ).toEqual( -5 );
          } );

    test( "DateUtils.subtractDays returns December 30th, 2024 when you subtract 5 days from January 4th, 2025",
          () =>
          {
              let dateA = new Date( 2025, 0, 4, 9, 37, 0, 0 );
              let expected = new Date( 2024, 11, 30, 9, 37, 0, 0 );

              expect( dateUtils.subtractDays( dateA, 5 ) ).toEqual( expected );
          } );
} );

test( "DateUtils.avoidWeekend returns the following Monday if the specified date is Saturday or Sunday",
      () =>
      {
          expect( dateUtils.avoidWeekend( saturday ) ).toEqual( monday );
          expect( dateUtils.avoidWeekend( sunday ) ).toEqual( monday );
          expect( dateUtils.avoidWeekend( monday ) ).toEqual( monday );
          expect( dateUtils.avoidWeekend( tuesday ) ).toEqual( tuesday );

          expect( dateUtils.addDays( thursday, 2 ) ).toEqual( saturday );

          expect( dateUtils.avoidWeekend( dateUtils.addDays( thursday, 2 ) ) ).toEqual( monday );
      } );

describe( "DateUtils.daysBetween", () =>
{
    test( "DateUtils.daysBetween returns the correct value",
          () =>
          {
              expect( dateUtils.daysBetween( monday, monday ) ).toEqual( 0 );
              expect( dateUtils.daysBetween( monday, tuesday ) ).toEqual( 1 );
              expect( dateUtils.daysBetween( monday, thursday ) ).toEqual( -4 );

              expect( dateUtils.daysBetween( tuesday, monday ) ).toEqual( -1 );
              expect( dateUtils.daysBetween( thursday, monday ) ).toEqual( 4 );
          } );

    test( "DateUtils.daysBetween returns 5 for December 30th, 2024 to January 4th, 2025",
          () =>
          {
              let dateA = new Date( 2024, 11, 30, 9, 37, 0, 0 );
              let dateB = new Date( 2025, 0, 4, 9, 37, 0, 0 );

              expect( dateUtils.daysBetween( dateA, dateB ) ).toEqual( 5 );
          } );

    test( "DateUtils.daysBetween returns 20,834 for October 3rd, 1967 to October 17th, 2024",
          () =>
          {
              let dateA = new Date( 1967, 9, 3, 9, 37, 0, 0 );
              let dateB = new Date( 2024, 9, 17, 9, 37, 0, 0 );

              expect( dateUtils.daysBetween( dateA, dateB ) ).toEqual( 20_834 );
          } );
} );

describe( "DateUtils.addWeeks / subtractWeeks", () =>
{
    test( "DateUtils.addWeeks returns October 3rd, 2024 when you add 0 weeks to October 3rd, 2024",
          () =>
          {
              let dateA = new Date( 2024, 9, 3, 9, 37, 0, 0 );

              expect( dateUtils.addWeeks( dateA, 0 ) ).toEqual( dateA );
          } );

    test( "DateUtils.addWeeks returns October 10th, 2024 when you add 1 week to October 3rd, 2024",
          () =>
          {
              let dateA = new Date( 2024, 9, 3, 9, 37, 0, 0 );
              let expected = new Date( 2024, 9, 10, 9, 37, 0, 0 );

              expect( dateUtils.addWeeks( dateA, 1 ) ).toEqual( expected );
          } );

    test( "DateUtils.addWeeks returns October 17th, 2024 when you add 2 weeks to October 3rd, 2024",
          () =>
          {
              let dateA = new Date( 2024, 9, 3, 9, 37, 0, 0 );
              let expected = new Date( 2024, 9, 17, 9, 37, 0, 0 );

              expect( dateUtils.addWeeks( dateA, 2 ) ).toEqual( expected );
          } );

    test( "DateUtils.subtractWeeks returns October 3rd, 2024 when you subtract 2 weeks from October 17th, 2024",
          () =>
          {
              let dateA = new Date( 2024, 9, 17, 9, 37, 0, 0 );
              let expected = new Date( 2024, 9, 3, 9, 37, 0, 0 );

              expect( dateUtils.subtractWeeks( dateA, 2 ) ).toEqual( expected );
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

              expect( dateUtils.startOfYear( expected ) ).toEqual( expected );

              expect( dateUtils.startOfYear( dateA ) ).toEqual( expected );
              expect( dateUtils.startOfYear( dateB ) ).toEqual( expected );
              expect( dateUtils.startOfYear( dateC ) ).toEqual( expected );

          } );

    test( "DateUtils.startOfMonth returns exactly Midnight, February 1st, 2024 for any date in February 2024",
          () =>
          {
              let expected = new Date( 2024, 1, 1, 0, 0, 0, 0 );

              let dateA = new Date( 2024, 1, 1, 0, 0, 0, 0 );
              let dateB = new Date( 2024, 1, 3, 9, 37, 0, 0 );
              let dateC = new Date( 2024, 1, 7, 23, 59, 59, 999 );
              let dateD = new Date( 2024, 1, 29, 23, 59, 59, 999 );

              expect( dateUtils.startOfMonth( expected ) ).toEqual( expected );

              expect( dateUtils.startOfMonth( dateA ) ).toEqual( expected );
              expect( dateUtils.startOfMonth( dateB ) ).toEqual( expected );
              expect( dateUtils.startOfMonth( dateC ) ).toEqual( expected );
              expect( dateUtils.startOfMonth( dateD ) ).toEqual( expected );

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

              expect( dateUtils.startOfWeek( expected ) ).toEqual( expected );

              expect( dateUtils.startOfWeek( dateA ) ).toEqual( expected );
              expect( dateUtils.startOfWeek( dateB ) ).toEqual( expected );
              expect( dateUtils.startOfWeek( dateC ) ).toEqual( expected );
              expect( dateUtils.startOfWeek( dateD ) ).toEqual( expected );
              expect( dateUtils.startOfWeek( dateE ) ).toEqual( expected );
              expect( dateUtils.startOfWeek( dateF ) ).toEqual( expected );
              expect( dateUtils.startOfWeek( dateG ) ).toEqual( expected );

              expect( dateUtils.startOfWeek( dateH ) ).not.toEqual( expected );

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

              expect( dateUtils.startOfDay( dateA ) ).toEqual( new Date( 2024, 9, 13, 0, 0, 0, 0 ) );
              expect( dateUtils.startOfDay( dateA ) ).toEqual( dateUtils.toMidnight( dateA ) );

              expect( dateUtils.startOfDay( dateB ) ).toEqual( new Date( 2023, 9, 14, 0, 0, 0, 0 ) );
              expect( dateUtils.startOfDay( dateB ) ).toEqual( dateUtils.toMidnight( dateB ) );

              expect( dateUtils.startOfDay( dateC ) ).toEqual( new Date( 2018, 9, 15, 0, 0, 0, 0 ) );
              expect( dateUtils.startOfDay( dateC ) ).toEqual( dateUtils.toMidnight( dateC ) );

              expect( dateUtils.startOfDay( dateD ) ).toEqual( new Date( 2012, 9, 16, 0, 0, 0, 0 ) );
              expect( dateUtils.startOfDay( dateD ) ).toEqual( dateUtils.toMidnight( dateD ) );

              expect( dateUtils.startOfDay( dateE ) ).toEqual( new Date( 2010, 9, 17, 0, 0, 0, 0 ) );
              expect( dateUtils.startOfDay( dateE ) ).toEqual( dateUtils.toMidnight( dateE ) );

              expect( dateUtils.startOfDay( dateF ) ).toEqual( new Date( 2024, 10, 2, 0, 0, 0, 0 ) );
              expect( dateUtils.startOfDay( dateF ) ).toEqual( dateUtils.toMidnight( dateF ) );

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

              expect( dateUtils.startOfHour( dateA ) ).toEqual( new Date( 2024, 9, 13, 1, 0, 0, 0 ) );

              expect( dateUtils.startOfHour( dateB ) ).toEqual( new Date( 2023, 9, 14, 9, 0, 0, 0 ) );

              expect( dateUtils.startOfHour( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 0, 0, 0 ) );

              expect( dateUtils.startOfHour( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 0, 0, 0 ) );

              expect( dateUtils.startOfHour( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 0, 0, 0 ) );

              expect( dateUtils.startOfHour( dateF ) ).toEqual( new Date( 2024, 10, 2, 2, 0, 0, 0 ) );

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

              expect( dateUtils.startOfMinute( dateA ) ).toEqual( new Date( 2024, 9, 13, 1, 2, 0, 0 ) );

              expect( dateUtils.startOfMinute( dateB ) ).toEqual( new Date( 2023, 9, 14, 9, 37, 0, 0 ) );

              expect( dateUtils.startOfMinute( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 59, 0, 0 ) );

              expect( dateUtils.startOfMinute( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 59, 0, 0 ) );

              expect( dateUtils.startOfMinute( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 59, 0, 0 ) );

              expect( dateUtils.startOfMinute( dateF ) ).toEqual( new Date( 2024, 10, 2, 2, 0, 0, 0 ) );

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

              expect( dateUtils.startOfDecade( dateA ) ).toEqual( new Date( 2020, 0, 1, 0, 0, 0, 0 ) );

              expect( dateUtils.startOfDecade( dateB ) ).toEqual( new Date( 2020, 0, 1, 0, 0, 0, 0 ) );

              expect( dateUtils.startOfDecade( dateC ) ).toEqual( new Date( 2010, 0, 1, 0, 0, 0, 0 ) );

              expect( dateUtils.startOfDecade( dateD ) ).toEqual( new Date( 2010, 0, 1, 0, 0, 0, 0 ) );

              expect( dateUtils.startOfDecade( dateE ) ).toEqual( new Date( 2010, 0, 1, 0, 0, 0, 0 ) );

              expect( dateUtils.startOfDecade( dateF ) ).toEqual( new Date( 1960, 0, 1, 0, 0, 0, 0 ) );

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

              expect( dateUtils.endOfYear( expected ) ).toEqual( expected );

              expect( dateUtils.endOfYear( dateA ) ).toEqual( expected );
              expect( dateUtils.endOfYear( dateB ) ).toEqual( expected );
              expect( dateUtils.endOfYear( dateC ) ).toEqual( expected );

          } );

    test( "DateUtils.endOfMonth returns the last millisecond of the last day of the month in which the date occurs",
          () =>
          {
              let expected = new Date( 2024, 1, 29, 23, 59, 59, 999 );

              let dateA = new Date( 2024, 1, 1, 0, 0, 0, 0 );
              let dateB = new Date( 2024, 1, 3, 9, 37, 0, 0 );
              let dateC = new Date( 2024, 1, 7, 23, 59, 59, 999 );
              let dateD = new Date( 2024, 1, 29, 23, 59, 59, 999 );

              expect( dateUtils.endOfMonth( expected ) ).toEqual( expected );

              expect( dateUtils.endOfMonth( dateA ) ).toEqual( expected );
              expect( dateUtils.endOfMonth( dateB ) ).toEqual( expected );
              expect( dateUtils.endOfMonth( dateC ) ).toEqual( expected );
              expect( dateUtils.endOfMonth( dateD ) ).toEqual( expected );

              expect( dateUtils.endOfMonth( new Date( 2011, 3, 14, 2, 30, 0, 0 ) ) ).toEqual( new Date( 2011, 3, 30, 23, 59, 59, 999 ) );

          } );

    test( "DateUtils.endOfWeek returns the last millisecond of October 19th, 2024 for any date in that calendar week",
          () =>
          {
              let expected = new Date( 2024, 9, 19, 23, 59, 59, 999 );

              let dateA = new Date( 2024, 9, 13, 1, 2, 3, 4 );
              let dateB = new Date( 2024, 9, 14, 9, 37, 0, 0 );
              let dateC = new Date( 2024, 9, 15, 23, 59, 59, 999 );
              let dateD = new Date( 2024, 9, 16, 23, 59, 59, 999 );
              let dateE = new Date( 2024, 9, 17, 23, 59, 59, 999 );
              let dateF = new Date( 2024, 9, 18, 23, 59, 59, 999 );
              let dateG = new Date( 2024, 9, 19, 23, 59, 59, 999 );

              let dateH = new Date( 2024, 9, 20, 0, 0, 0, 0 );

              expect( dateUtils.endOfWeek( expected ) ).toEqual( expected );

              expect( dateUtils.endOfWeek( dateA ) ).toEqual( expected );
              expect( dateUtils.endOfWeek( dateB ) ).toEqual( expected );
              expect( dateUtils.endOfWeek( dateC ) ).toEqual( expected );
              expect( dateUtils.endOfWeek( dateD ) ).toEqual( expected );
              expect( dateUtils.endOfWeek( dateE ) ).toEqual( expected );
              expect( dateUtils.endOfWeek( dateF ) ).toEqual( expected );
              expect( dateUtils.endOfWeek( dateG ) ).toEqual( expected );

              expect( dateUtils.endOfWeek( dateH ) ).not.toEqual( expected );

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

              expect( dateUtils.endOfDay( dateA ) ).toEqual( new Date( 2024, 9, 13, 23, 59, 59, 999 ) );
              expect( dateUtils.endOfDay( dateA ) ).toEqual( dateUtils.lastInstant( dateA ) );

              expect( dateUtils.endOfDay( dateB ) ).toEqual( new Date( 2023, 9, 14, 23, 59, 59, 999 ) );
              expect( dateUtils.endOfDay( dateB ) ).toEqual( dateUtils.lastInstant( dateB ) );

              expect( dateUtils.endOfDay( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 59, 59, 999 ) );
              expect( dateUtils.endOfDay( dateC ) ).toEqual( dateUtils.lastInstant( dateC ) );

              expect( dateUtils.endOfDay( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 59, 59, 999 ) );
              expect( dateUtils.endOfDay( dateD ) ).toEqual( dateUtils.lastInstant( dateD ) );

              expect( dateUtils.endOfDay( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 59, 59, 999 ) );
              expect( dateUtils.endOfDay( dateE ) ).toEqual( dateUtils.lastInstant( dateE ) );

              expect( dateUtils.endOfDay( dateF ) ).toEqual( new Date( 2024, 10, 2, 23, 59, 59, 999 ) );
              expect( dateUtils.endOfDay( dateF ) ).toEqual( dateUtils.lastInstant( dateF ) );

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

              expect( dateUtils.endOfHour( dateA ) ).toEqual( new Date( 2024, 9, 13, 1, 59, 59, 999 ) );

              expect( dateUtils.endOfHour( dateB ) ).toEqual( new Date( 2023, 9, 14, 9, 59, 59, 999 ) );

              expect( dateUtils.endOfHour( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfHour( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfHour( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfHour( dateF ) ).toEqual( new Date( 2024, 10, 2, 2, 59, 59, 999 ) );

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

              expect( dateUtils.endOfMinute( dateA ) ).toEqual( new Date( 2024, 9, 13, 1, 2, 59, 999 ) );

              expect( dateUtils.endOfMinute( dateB ) ).toEqual( new Date( 2023, 9, 14, 9, 37, 59, 999 ) );

              expect( dateUtils.endOfMinute( dateC ) ).toEqual( new Date( 2018, 9, 15, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfMinute( dateD ) ).toEqual( new Date( 2012, 9, 16, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfMinute( dateE ) ).toEqual( new Date( 2010, 9, 17, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfMinute( dateF ) ).toEqual( new Date( 2024, 10, 2, 2, 0, 59, 999 ) );

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

              expect( dateUtils.endOfDecade( dateA ) ).toEqual( new Date( 2029, 11, 31, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfDecade( dateB ) ).toEqual( new Date( 2029, 11, 31, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfDecade( dateC ) ).toEqual( new Date( 2019, 11, 31, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfDecade( dateD ) ).toEqual( new Date( 2019, 11, 31, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfDecade( dateE ) ).toEqual( new Date( 2019, 11, 31, 23, 59, 59, 999 ) );

              expect( dateUtils.endOfDecade( dateF ) ).toEqual( new Date( 1969, 11, 31, 23, 59, 59, 999 ) );

          } );
} );

describe( "DateUtils.calculateNthOccurrenceOfDay", () =>
{
    test( "The first Monday in March, 2024 is March 4th, 2024",
          () =>
          {
              const dateConstants = dateUtils.DateConstants;

              const firstMonday = dateUtils.calculateNthOccurrenceOfDay( 2024,
                                                                         dateConstants.Months.MARCH,
                                                                         dateConstants.Occurrence.FIRST,
                                                                         dateConstants.Days.MONDAY );

              expect( firstMonday ).toEqual( new Date( 2024, dateConstants.Months.MARCH, 4, 0, 0, 0, 0 ) );
          } );

    test( "The third Thursday in November, 2024 is November 21, 2024",
          () =>
          {
              const dateConstants = dateUtils.DateConstants;

              const thirdThursday = dateUtils.calculateNthOccurrenceOfDay( 2024,
                                                                           dateConstants.Months.NOVEMBER,
                                                                           dateConstants.Occurrence.THIRD,
                                                                           dateConstants.Days.THURSDAY );

              expect( thirdThursday ).toEqual( new Date( 2024, dateConstants.Months.NOVEMBER, 21, 0, 0, 0, 0 ) );
          } );

    test( "The first Tuesday in October, 2024 is October 1st, 2024",
          () =>
          {
              const dateConstants = dateUtils.DateConstants;

              const thirdThursday = dateUtils.calculateNthOccurrenceOfDay( 2024,
                                                                           dateConstants.Months.OCTOBER,
                                                                           dateConstants.Occurrence.FIRST,
                                                                           dateConstants.Days.TUESDAY );

              expect( thirdThursday ).toEqual( new Date( 2024, dateConstants.Months.OCTOBER, 1, 0, 0, 0, 0 ) );
          } );

    test( "The first Wednesday in October, 2024 is October 2nd, 2024",
          () =>
          {
              const dateConstants = dateUtils.DateConstants;

              const thirdThursday = dateUtils.calculateNthOccurrenceOfDay( 2024,
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

              let workDays = dateUtils.workDaysBetween( oct21, oct21 );

              let calendarDays = dateUtils.daysBetween( oct21, oct21 );

              expect( workDays ).toEqual( 0 );
              expect( workDays ).toEqual( calendarDays );

              expect( dateUtils.addWorkdays( oct21, workDays ) ).toEqual( oct21 );
          } );

    test( "DateUtils.workDaysBetween October 21st, 2024 and October 25th, 2024 is 4",
          () =>
          {
              const oct21 = new Date( 2024, 9, 21 );
              const oct25 = new Date( 2024, 9, 25 );

              let workDays = dateUtils.workDaysBetween( oct21, oct25 );

              let calendarDays = dateUtils.daysBetween( oct21, oct25 );

              expect( workDays ).toEqual( 4 );
              expect( workDays ).toEqual( calendarDays );

              expect( dateUtils.addWorkdays( oct21, workDays ) ).toEqual( oct25 );
          } );

    test( "DateUtils.workDaysBetween October 21st, 2024 and November 8th, 2024 is 14",
          () =>
          {
              const oct21 = new Date( 2024, 9, 21 );
              const nov8 = new Date( 2024, 10, 8 );

              const days = dateUtils.workDaysBetween( oct21, nov8 );

              expect( days ).toEqual( 14 );

              expect( dateUtils.addWorkdays( oct21, days ) ).toEqual( nov8 );
          } );

    test( "DateUtils.workDaysBetween November 8th, 2024 and October 21st, 2024 is -14",
          () =>
          {
              const oct21 = new Date( 2024, 9, 21 );
              const nov8 = new Date( 2024, 10, 8 );

              const days = dateUtils.workDaysBetween( nov8, oct21 );

              expect( days ).toEqual( -14 );

              expect( dateUtils.addWorkdays( nov8, days ) ).toEqual( oct21 );
          } );

    test( "DateUtils.workDaysBetween October 14th, 2024* and October 18th, 2024, accounting for holidays is 4",
          () =>
          {
              const dateA = new Date( 2024, 9, 14 );
              const dateB = new Date( 2024, 9, 18 );

              const daysAccountingForHolidays = dateUtils.workDaysBetween( dateA, dateB, dateUtils.US_HOLIDAYS );

              const daysRegardlessOfHolidays = dateUtils.workDaysBetween( dateA, dateB );

              expect( daysAccountingForHolidays ).toEqual( 4 );

              expect( daysRegardlessOfHolidays ).toEqual( 4 );

              expect( dateUtils.addWorkdays( dateA, daysAccountingForHolidays, dateUtils.US_HOLIDAYS ) ).toEqual( dateB );

          } );

    test( "DateUtils.workDaysBetween October 1st, 2024 and October 31st, 2024, accounting for holidays is 21",
          () =>
          {
              const dateA = new Date( 2024, 9, 1 );
              const dateB = new Date( 2024, 9, 31 );

              const daysRegardlessOfHolidays = dateUtils.workDaysBetween( dateA, dateB );

              const daysAccountingForHolidays = dateUtils.workDaysBetween( dateA, dateB, dateUtils.US_HOLIDAYS );

              expect( daysRegardlessOfHolidays ).toEqual( 22 );

              expect( daysAccountingForHolidays ).toEqual( 21 );

              expect( dateUtils.addWorkdays( dateA, daysRegardlessOfHolidays ) ).toEqual( dateB );

              expect( dateUtils.addWorkdays( dateA, daysAccountingForHolidays, dateUtils.US_HOLIDAYS ) ).toEqual( dateB );

          } );

    test( "DateUtils.weekdays in January 2024 is 23", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2023, 11, 31 ), new Date( 2024, 0, 31 ) );

        expect( weekdays ).toEqual( 23 );

        expect( dateUtils.addWorkdays( new Date( 2023, 11, 31 ), weekdays ) ).toEqual( dateUtils.avoidWeekend( new Date( 2024, 0, 31 ), -1 ) );
    } );

    test( "DateUtils.weekdays in February 2024 is 21", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 0, 31 ), new Date( 2024, 1, 29 ) );

        expect( weekdays ).toEqual( 21 );

        expect( dateUtils.addWorkdays( new Date( 2024, 0, 31 ), weekdays ) ).toEqual( dateUtils.avoidWeekend( new Date( 2024, 1, 29 ), -1 ) );
    } );

    test( "DateUtils.weekdays in March 2024 is 21", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 1, 29 ), new Date( 2024, 2, 31 ) );

        expect( weekdays ).toEqual( 21 );

        expect( dateUtils.addWorkdays( new Date( 2024, 1, 29 ), weekdays ) ).toEqual( dateUtils.avoidWeekend( new Date( 2024, 2, 31 ), -1 ) );
    } );

    test( "DateUtils.weekdays in April 2024 is 22", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 2, 31 ), new Date( 2024, 3, 30 ) );

        expect( weekdays ).toEqual( 22 );

        expect( dateUtils.addWorkdays( new Date( 2024, 2, 31 ), weekdays ) ).toEqual( dateUtils.avoidWeekend( new Date( 2024, 3, 30 ), -1 ) );
    } );

    test( "DateUtils.weekdays in May 2024 is 23", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 3, 30 ), new Date( 2024, 4, 31 ) );

        expect( weekdays ).toEqual( 23 );

        expect( dateUtils.addWorkdays( new Date( 2024, 3, 30 ), weekdays ) ).toEqual( dateUtils.avoidWeekend( new Date( 2024, 4, 31 ), -1 ) );
    } );

    test( "DateUtils.weekdays in June 2024 is 20", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 4, 31 ), new Date( 2024, 5, 30 ) );

        expect( weekdays ).toEqual( 20 );

        expect( dateUtils.addWorkdays( new Date( 2024, 4, 31 ), weekdays ) ).toEqual( dateUtils.avoidWeekend( new Date( 2024, 5, 30 ), -1 ) );
    } );

    test( "DateUtils.weekdays in July 2024 is 23", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 5, 30 ), new Date( 2024, 6, 31 ) );

        expect( weekdays ).toEqual( 23 );
    } );

    test( "DateUtils.weekdays in August 2024 is 22", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 6, 31 ), new Date( 2024, 7, 31 ) );

        expect( weekdays ).toEqual( 22 );
    } );

    test( "DateUtils.weekdays in September 2024 is 21", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 7, 31 ), new Date( 2024, 8, 30 ) );

        expect( weekdays ).toEqual( 21 );
    } );

    test( "DateUtils.weekdays in October 2024 is 23", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 8, 30 ), new Date( 2024, 9, 31 ) );

        expect( weekdays ).toEqual( 23 );
    } );

    test( "DateUtils.weekdays in November 2024 is 21", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 9, 31 ), new Date( 2024, 10, 30 ) );

        expect( weekdays ).toEqual( 21 );
    } );

    test( "DateUtils.weekdays in December 2024 is 22", () =>
    {
        const weekdays = dateUtils.workDaysBetween( new Date( 2024, 10, 30 ), new Date( 2024, 11, 31 ) );

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

                                 let priorDay = dateUtils.subtractDays( date, 1 );
                                 let endOfMonth = new Date( year, month, dateUtils.numDaysInMonth( month, year ) );

                                 const workDaysBetween = dateUtils.workDaysBetween( priorDay, endOfMonth );
                                 workdaysPerMonth[month] = workDaysBetween;
                                 workdaysPerYear += workDaysBetween;

                                 const workDaysBetweenMinusHolidays = dateUtils.workDaysBetween( priorDay, endOfMonth, dateUtils.US_HOLIDAYS );
                                 workDaysMinusHolidaysPerMonth[month] = workDaysBetweenMinusHolidays;
                                 workdaysPerYearMinusHolidays += workDaysBetweenMinusHolidays;
                             } );

              const workDays2024 = dateUtils.workDaysBetween( new Date( 2023, 11, 31 ), new Date( 2024, 11, 31 ) );

              const workDays2024MinusHolidays = dateUtils.workDaysBetween( new Date( 2023, 11, 31 ), new Date( 2024, 11, 31 ), dateUtils.US_HOLIDAYS );

              expect( workDays2024 ).toEqual( workdaysPerYear );
              expect( workDays2024MinusHolidays ).toEqual( workdaysPerYearMinusHolidays );

          } );

    test( "DateUtils.daysBetween January 1st, 2020 and December 31st, 2024 when added to the first date returns the second date",
          () =>
          {
              const dateA = Object.freeze( new Date( 2020, 0, 1 ) );
              const dateB = Object.freeze( new Date( 2024, 11, 31 ) );

              const days = dateUtils.daysBetween( dateA, dateB );

              expect( dateUtils.addDays( dateA, days ) ).toEqual( dateB );
          } );

    test( "DateUtils.workDaysBetween January 1st, 2020 and December 31st, 2024, accounting for holidays is ",
          () =>
          {
              const dateA = Object.freeze( new Date( 2020, 0, 1 ) );
              const dateB = Object.freeze( new Date( 2024, 11, 31 ) );

              const daysRegardlessOfHolidays = dateUtils.workDaysBetween( dateA, dateB );

              const daysAccountingForHolidays = dateUtils.workDaysBetween( dateA, dateB, dateUtils.US_HOLIDAYS );

              expect( daysRegardlessOfHolidays ).toEqual( 1_306 );

              expect( daysAccountingForHolidays ).toEqual( 1_259 );

              // expect( dateUtils.addWorkdays( dateA, daysRegardlessOfHolidays ) ).toEqual( dateUtils.avoidWeekend( dateB, -1 ) );

              // expect( dateUtils.addWorkdays( dateA, daysAccountingForHolidays, dateUtils.US_HOLIDAYS ) ).toEqual( dateUtils.avoidWeekend( dateB, -1 ) );

          } );
} );