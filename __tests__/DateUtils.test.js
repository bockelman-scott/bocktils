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

test( "DateUtils.numDaysIn returns the correct value for leap years",
      () =>
      {
          expect( dateUtils.numDaysIn( 1, 2023 ) ).toEqual( 28 );
          expect( dateUtils.numDaysIn( 1, 2024 ) ).toEqual( 29 );
      } );

test( "DateUtils.addDays returns January 4th, 2025 when you add 5 days to December 30th, 2024",
      () =>
      {
          let dateA = new Date( 2024, 11, 30, 9, 37, 0, 0 );
          let expected = new Date( 2025, 0, 4, 9, 37, 0, 0 );

          expect( dateUtils.addDays( dateA, 5 ) ).toEqual( expected );
      } );

test( "DateUtils.addDays returns December 30th, 2024 when you add -5 days from January 4th, 2025",
      () =>
      {
          let dateA = new Date( 2025, 0, 4, 9, 37, 0, 0 );
          let expected = new Date( 2024, 11, 30, 9, 37, 0, 0 );

          expect( dateUtils.addDays( dateA, -5 ) ).toEqual( expected );
      } );

test( "DateUtils.subtractDays returns December 30th, 2024 when you subtract 5 days from January 4th, 2025",
      () =>
      {
          let dateA = new Date( 2025, 0, 4, 9, 37, 0, 0 );
          let expected = new Date( 2024, 11, 30, 9, 37, 0, 0 );

          expect( dateUtils.subtractDays( dateA, 5 ) ).toEqual( expected );
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

test( "DateUtils.daysBetween returns the correct value",
      () =>
      {
          expect( dateUtils.daysBetween( monday, monday ) ).toEqual( 0 );
          expect( dateUtils.daysBetween( monday, tuesday ) ).toEqual( 1 );
          expect( dateUtils.daysBetween( monday, thursday ) ).toEqual( -4 );

          expect( dateUtils.daysBetween( tuesday, monday ) ).toEqual( -1 );
          expect( dateUtils.daysBetween( thursday, monday ) ).toEqual( 4 );
      } );