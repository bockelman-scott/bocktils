const mathUtils = require( "../src/MathUtils.cjs" );

const core = require( "@toolbocks/core" );

const { stringUtils } = core;

const { asInt } = stringUtils;

const { resolveNullOrNaN, isBetween, quotient, ROUNDING_MODE, round } = mathUtils;

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

              expect( z ).toEqual( 12 / 23 );

          } );
} );

describe( "rounding", () =>
{
    const inputs = [-3.5, -3.45, -3.445, -3.4545,
                    -2.5, -2.45, -2.445, -2.4545,
                    -1.5, -1.45, -1.445, -1.4545,
                    0.5, 0.45, 0.445, 0.4545,
                    1.5, 1.45, 1.445, 1.4545,
                    2.5, 2.45, 2.445, 2.4545,
                    3.5, 3.45, 3.445, 3.4545];

    function makeHalfUpMapper( pPrecision )
    {
        const places = asInt( pPrecision );

        function simpleRound( pNum )
        {
            if ( places <= 0 )
            {
                return Math.round( pNum );
            }

            let p = Math.pow( 10, places );
            let n = pNum * p;
            let r = Math.round( n );

            return (r / p);
        }

        return e => simpleRound( e );
    }

    const half_up = [];
    half_up[0] = inputs.map( makeHalfUpMapper( 0 ) );
    half_up[1] = inputs.map( makeHalfUpMapper( 1 ) );
    half_up[2] = inputs.map( makeHalfUpMapper( 2 ) );

    const half_down = [];
    half_down[0] = [
        -3,
        -3,
        -3,
        -3,
        -2,
        -2,
        -2,
        -2,
        -1,
        -1,
        -1,
        -1,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        2,
        2,
        2,
        2,
        3,
        3,
        3,
        3
    ];
    half_down[1] = [
        -3.5,
        -3.4,
        -3.4,
        -3.4,
        -2.5,
        -2.4,
        -2.4,
        -2.4,
        -1.5,
        -1.4,
        -1.4,
        -1.4,
        0.5,
        0.4,
        0.4,
        0.4,
        1.5,
        1.4,
        1.4,
        1.4,
        2.5,
        2.4,
        2.4,
        2.4,
        3.5,
        3.4,
        3.4,
        3.4
    ];
    half_down[2] = [
        -3.5,
        -3.45,
        -3.44,
        -3.45,
        -2.5,
        -2.45,
        -2.44,
        -2.45,
        -1.5,
        -1.45,
        -1.44,
        -1.45,
        0.5,
        0.45,
        0.44,
        0.45,
        1.5,
        1.45,
        1.44,
        1.45,
        2.5,
        2.45,
        2.44,
        2.45,
        3.5,
        3.45,
        3.44,
        3.45
    ];

    const half_even = [];
    const half_odd = [];

    const half_even_towards_infinity = [];
    const half_away_from_zero = [];
    const half_towards_infinity = [];

    test( "Round HALF_UP",
          () =>
          {
              let expectedValues = [];
              for( let p = 0; p < 3; p++ )
              {
                  expectedValues = half_up[p];

                  for( let i = 0, n = inputs.length; i < n; i++ )
                  {
                      const rounded = round( inputs[i], p, ROUNDING_MODE.HALF_UP );

                      // console.log( inputs[i], p, rounded );

                      expect( rounded ).toEqual( expectedValues[i] );
                  }
              }

          } );

    test( "Round HALF_DOWN",
          () =>
          {
              let expectedValues = [];
              for( let p = 0; p < 3; p++ )
              {
                  expectedValues = half_down[p];

                  for( let i = 0, n = inputs.length; i < n; i++ )
                  {
                      const rounded = round( inputs[i], p, ROUNDING_MODE.HALF_DOWN );

                      // console.log( inputs[i], p, rounded );

                      expect( rounded ).toEqual( expectedValues[i] );
                  }
              }
          } );

    test( "Round HALF_EVEN",
          () =>
          {
              expect( round( -2.5, 0, ROUNDING_MODE.HALF_EVEN ) ).toEqual( -2 );
          } );

    test( "Round HALF_ODD",
          () =>
          {
          } );

} );