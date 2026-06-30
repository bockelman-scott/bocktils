const core = require( "@toolbocks/core" );

const { typeUtils } = core;

const { TimeZone, findTimeZone } = require( "../src/TimeZoneUtils.js" );

const { isClass, getClassName } = typeUtils;

describe( "TimeZone Utils", () =>
{
    test( "TimeZone class exists", () =>
    {
        expect( isClass( TimeZone ) ).toBe( true );
        expect( getClassName( TimeZone ) ).toEqual( "TimeZone" );
    } );

    test( "TimeZone class exposes static constants", () =>
    {
        expect( typeof TimeZone.US_TIMEZONES ).toEqual( "object" );
        expect( Object.keys( TimeZone.US_TIMEZONES ).length ).toEqual( 21 );

        expect( typeof TimeZone.US_TIMEZONES_BY_STATE ).toEqual( "object" );
        expect( Object.keys( TimeZone.US_TIMEZONES_BY_STATE ).length ).toEqual( 51 );

        expect( typeof TimeZone.US_TIMEZONE_EXCEPTIONS_BY_ZIPCODE_PREFIX ).toEqual( "object" );
        expect( Object.keys( TimeZone.US_TIMEZONE_EXCEPTIONS_BY_ZIPCODE_PREFIX ).length ).toEqual( 41 );

        expect( typeof TimeZone.SPLIT_STATE_EXCEPTIONS ).toEqual( "object" );
        expect( Object.keys( TimeZone.SPLIT_STATE_EXCEPTIONS ).length ).toEqual( 4 );
    } );

    test( "TimeZone Utils allows us to find the most likely timezone for a location",
          () =>
          {
              let timeZone = findTimeZone( "IL", "60148" );
              expect( timeZone.name ).toEqual( "America/Chicago" );

              timeZone = findTimeZone( "FL", "");
              expect( timeZone.name ).toEqual( "America/New_York" );

              timeZone = findTimeZone( "FL", "47900");
              expect( timeZone.name ).toEqual( "America/Chicago" );
          } );

} );
