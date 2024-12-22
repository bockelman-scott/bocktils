const mathUtils = require( "../src/MathUtils.cjs" );

const { resolveNullOrNaN, isBetween, quotient } = mathUtils;

mathUtils.disableLogging();

describe( "resolveNullOrNaN", () =>
{
    test( "resolveNullOrNaN for valid argument, number",
          () =>
          {
              expect( resolveNullOrNaN( 1 ) ).toEqual( 1 );
              expect( resolveNullOrNaN( 0.23 ) ).toEqual( 0.23 );
              expect( resolveNullOrNaN( -1 ) ).toEqual( -1 );
              expect( resolveNullOrNaN( 0xFF ) ).toEqual( 255 );
          } );

    test( "resolveNullOrNaN for valid argument, numeric string",
          () =>
          {
              expect( resolveNullOrNaN( "1" ) ).toEqual( 1 );
              expect( resolveNullOrNaN( "0.23" ) ).toEqual( 0.23 );
              expect( resolveNullOrNaN( "-1" ) ).toEqual( -1 );
              expect( resolveNullOrNaN( "0xFF" ) ).toEqual( 255 );
          } );

    test( "resolveNullOrNaN for invalid argument, non-numeric string",
          () =>
          {
              expect( resolveNullOrNaN( "abc" ) ).toEqual( 0 );
              expect( resolveNullOrNaN( "" ) ).toEqual( 0 );
              expect( resolveNullOrNaN( "---" ) ).toEqual( 0 );
              expect( resolveNullOrNaN( "0xFG" ) ).toEqual( 0 );

              // now with default values

              expect( resolveNullOrNaN( "abc", 9 ) ).toEqual( 9 );
              expect( resolveNullOrNaN( "", 7 ) ).toEqual( 7 );
              expect( resolveNullOrNaN( "---", 23 ) ).toEqual( 23 );
              expect( resolveNullOrNaN( "0xFG", 15 ) ).toEqual( 15 );

          } );

    test( "resolveNullOrNaN for invalid argument, non-numeric values",
          () =>
          {
              expect( resolveNullOrNaN( [] ) ).toEqual( 0 );
              expect( resolveNullOrNaN( {} ) ).toEqual( 0 );
              expect( resolveNullOrNaN( [""] ) ).toEqual( 0 );
              expect( resolveNullOrNaN( ["---", "+++"] ) ).toEqual( 0 );
              expect( resolveNullOrNaN( ["0xFG"] ) ).toEqual( 0 );

              // now with default values

              const obj = { a: 1, b: 2 };

              expect( resolveNullOrNaN( obj, Object.keys( obj ).length ) ).toEqual( 2 );
              expect( resolveNullOrNaN( ["abc"], 9 ) ).toEqual( 9 );
              expect( resolveNullOrNaN( [""], 7 ) ).toEqual( 7 );
              expect( resolveNullOrNaN( ["---", "+++"], 23 ) ).toEqual( 23 );
              expect( resolveNullOrNaN( ["0xFG"], 15 ) ).toEqual( 15 );

          } );

    test( "resolveNullOrNaN for NaN or Infinity",
          () =>
          {
              expect( resolveNullOrNaN( NaN ) ).toEqual( 0 );
              expect( resolveNullOrNaN( Infinity ) ).toEqual( 0 );
              expect( resolveNullOrNaN( -Infinity ) ).toEqual( 0 );
              expect( resolveNullOrNaN( 1 / 0 ) ).toEqual( 0 );

              expect( resolveNullOrNaN( NaN, 1 ) ).toEqual( 1 );
              expect( resolveNullOrNaN( Infinity, Number.MAX_VALUE ) ).toEqual( Number.MAX_VALUE );
              expect( resolveNullOrNaN( -Infinity, Number.MIN_VALUE ) ).toEqual( Number.MIN_VALUE );
              expect( resolveNullOrNaN( 1 / 0, Infinity ) ).toEqual( 0 );
              expect( resolveNullOrNaN( 1 / 0, 777 ) ).toEqual( 777 );
          } );
} );

describe( "isBetween", () =>
{
    test( "0 isBetween -1 and 1",
          () =>
          {
              expect( isBetween( 0, -1, 1 ) ).toBe( true );
          } );

    test( "1 isBetween -1 and 1",
          () =>
          {
              expect( isBetween( 1, -1, 1 ) ).toBe( true );
          } );

    test( "1 isBetween -1 and 1, exclusive is false",
          () =>
          {
              expect( isBetween( 1, -1, 1, false ) ).toBe( false );
          } );
} );

describe( "quotient", () =>
{
    test( "quotient (is a safe division)",
          () =>
          {
              let x = 1;
              let y = 0;

              let z = quotient( x, y );

              expect( z ).toEqual( 0 );

              z = quotient( x, y, { byZero: 17 } );

              expect( z ).toEqual( 17 );

              z = quotient( x, y, { byZero: Infinity } );

              expect( z ).toEqual( 0 );

              z = quotient( x, y, { defaultQuotient: 23 } );

              expect( z ).toEqual( 23 );

              z = quotient( 0, y );

              expect( z ).toEqual( 0 );

              y = 1;

              z = quotient( x, y );

              expect( z ).toEqual( 1 );

              x = NaN;

              z = quotient( x, y );

              expect( z ).toEqual( 1 );


              x = 12;

              y = NaN;

              z = quotient( x, y );

              expect( z ).toEqual( 12 );


              z = quotient( x, y, { defaultDivisor: 23 } );

              expect( z ).toEqual( 12/23 );

          } );
} );
