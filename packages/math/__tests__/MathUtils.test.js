const mathUtils = require( "../src/MathUtils.cjs" );

const core = require( "@toolbocks/core" );

const { stringUtils, arrayUtils } = core;

const { asInt } = stringUtils;

const { range } = arrayUtils;

const {
    resolveNullOrNaN,
    isBetween,
    gcd,
    decimalExpansion,
    toSignificantDigits,
    product,
    quotient,
    ROUNDING_MODE,
    round,
    classes
} = mathUtils;

const Rational = classes.Rational;

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

describe( "toSignificantDigits", () =>
{
    test( "significant digits - 1",
          () =>
          {
              let n = toSignificantDigits( 4.0000000000000003e-7, 7 );

              expect( decimalExpansion( n ) ).toEqual( "0.0000004" );

              expect( n ).toEqual( parseFloat( decimalExpansion( n ) ) );
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

              expect( quotient( 0.1, 0.3 ) ).toEqual( 0.3333333333333333 );

              expect( quotient( 0.01, 0.03 ) ).toEqual( 0.3333333333333333 );

              expect( quotient( 0.2, 0.3 ) ).toEqual( 0.6666666666666666 );

              expect( quotient( 0.02, 0.03 ) ).toEqual( 0.6666666666666666 );

              expect( quotient( 10, 3 ) ).toEqual( 3.3333333333333333 );


          } );
} );

describe( "product", () =>
{
    test( "product (is a safe multiplication)",
          () =>
          {
              expect( product( 0, 0 ) ).toEqual( 0 );

              expect( product( 1, 0 ) ).toEqual( 0 );

              expect( product( 0, 1 ) ).toEqual( 0 );

              expect( product( 2, 3 ) ).toEqual( 6 );

              expect( product( 2, 2, 2 ) ).toEqual( 8 );

              expect( product( 2, 2, 2, 2 ) ).toEqual( 16 );

              expect( product( 7, 6, 3 ) ).toEqual( 126 );

              expect( product( 7, 6, 3, 7 ) ).toEqual( 882 );

              expect( product( 7, 6, 3, 7, 2 ) ).toEqual( 1764 );

              expect( product( 7, 6, 3, 7, 2, 11 ) ).toEqual( 19_404 );
          } );

    test( "product can multiply 'real' numbers",
          () =>
          {
              // halves
              expect( product( 0.5, 8 ) ).toEqual( 4 );

              expect( product( 0.5, 0.8 ) ).toEqual( 0.4 );

              expect( product( 0.5, 0.08 ) ).toEqual( 0.04 );

              expect( product( 0.5, 0.0000008 ) ).toEqual( 0.0000004 );


              expect( product( 0.5, 7 ) ).toEqual( 3.5 );

              expect( product( 0.5, 0.7 ) ).toEqual( 0.35 );

              expect( product( 0.5, 0.07 ) ).toEqual( 0.035 );

              expect( product( 0.5, 0.007 ) ).toEqual( 0.0035 );

              expect( product( 0.5, 0.0007 ) ).toEqual( 0.00035 );

              expect( product( 0.5, 0.0000007 ) ).toEqual( 0.00000035 );


              // eighths and three-eighths
              expect( product( 0.125, 8 ) ).toEqual( 1 );

              expect( product( 0.375, 8 ) ).toEqual( 3 );

              expect( product( 0.375, 0.8 ) ).toEqual( 0.3 );

              expect( product( 0.375, 0.08 ) ).toEqual( 0.03 );


              // sixteenths
              expect( product( 0.0625, 16 ) ).toEqual( 1 );
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

describe( "Rational Numbers", () =>
{
    function generateRationals( pNumerators, pDenominators, pOptions )
    {
        let options = pOptions || {};

        let rationals = [];

        for( let numerator of pNumerators )
        {
            for( let denominator of pDenominators )
            {
                rationals.push( new Rational( numerator, denominator, options ) );
            }
        }

        return rationals;
    }

    test( "Rationals are reduced to common form",
          () =>
          {
              const twoFourths = new Rational( 2, 4 );

              expect( twoFourths.toString() ).toEqual( "1/2" );

              const numerators = range( 1, 23 );
              const denominators = range( 1, 23 );

              let rationals = generateRationals( numerators, denominators );

              expect( rationals.every( e => gcd( e.numerator, e.denominator ) < 2 ) ).toBe( true );
          } );

    test( "Rationals are approximated to the largest allowed denominator",
          () =>
          {
              let numerators = range( 23, 33 );
              let denominators = range( 2000, 2100 );

              let options =
                  {
                      defaultDenominator: 1,
                      defaultNumerator: 1,
                      largestAllowedDenominator: 2048
                  };

              let rationals = generateRationals( numerators, denominators, options );

              expect( rationals.every( e => e.denominator <= options.largestAllowedDenominator ) ).toBe( true );

              expect( rationals.every( e => e.discrepancy <= 0.0005 ) ).toBe( true );

          } );

    test( "Rationals are approximated to greater accuracy when the largest allowed denominator is increased",
          () =>
          {
              let powersOfTwo = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

              let maximumDiscrepancy = 1;
              let lastDiscrepancy = maximumDiscrepancy;

              for( let power of powersOfTwo )
              {
                  let numerators = range( 23, 33 );

                  let denominators = range( 2 ** power - 10, 2 ** power + 10 );

                  let options =
                      {
                          defaultDenominator: 1,
                          defaultNumerator: 1,
                          largestAllowedDenominator: 2 ** power
                      };

                  let rationals = generateRationals( numerators, denominators, options );

                  expect( rationals.every( e => e.denominator <= options.largestAllowedDenominator ) ).toBe( true );

                  rationals = rationals.map( e => e.discrepancy );

                  maximumDiscrepancy = rationals.reduce( ( p, e ) => Math.max( p, e ), 0 );

                  // console.log( maximumDiscrepancy, lastDiscrepancy, power, options.largestAllowedDenominator );

                  expect( maximumDiscrepancy ).toBeLessThan( lastDiscrepancy );

                  lastDiscrepancy = maximumDiscrepancy;
              }
          } );
} );

describe( "Rational Addition", () =>
{
    test( "Rationals can be added",
          () =>
          {
              expect( new Rational( 1, 2 ).add( new Rational( 1, 2 ) ).toString() ).toEqual( "1" );

              expect( new Rational( 1, 2 ).add( new Rational( 1, 4 ) ).toString() ).toEqual( "3/4" );

              expect( new Rational( 3, 16 ).add( new Rational( 1, 4 ) ).toString() ).toEqual( "7/16" );

              expect( new Rational( 1, 2 ).add( new Rational( 1, 4 ).add( .25 ) ).toString() ).toEqual( "1" );


          } );
} );

describe( "Rational Subtraction", () =>
{
    test( "Rationals can be subtracted",
          () =>
          {
              expect( new Rational( 1, 2 ).subtract( new Rational( 1, 2 ) ).toString() ).toEqual( "0" );

              expect( new Rational( 1, 2 ).subtract( new Rational( 1, 4 ) ).toString() ).toEqual( "1/4" );

              expect( new Rational( 3, 16 ).subtract( new Rational( 1, 4 ) ).toString() ).toEqual( "-1/16" );

              expect( (new Rational( 1, 4 ).subtract( 0.25 )).toString() ).toEqual( "0" );

              expect( (new Rational( 1, 2 ).subtract( new Rational( 1, 4 ) )).subtract( .25 ).toString() ).toEqual( "0" );


              expect( new Rational( -1, 2 ).subtract( new Rational( 1, 2 ) ).toString() ).toEqual( "-1" );
              expect( new Rational( -1, 2 ).subtract( new Rational( -1, 2 ) ).toString() ).toEqual( "0" );
              expect( new Rational( -3, 4 ).subtract( new Rational( 1, 4 ) ).toString() ).toEqual( "-1" );
              expect( new Rational( -5, 6 ).subtract( new Rational( 1, 3 ) ).toString() ).toEqual( "-7/6" );

              expect( new Rational( 1, 3 ).subtract( new Rational( -2, 3 ) ).toString() ).toEqual( "1" );
              expect( new Rational( 3, 4 ).subtract( new Rational( -1, 4 ) ).toString() ).toEqual( "1" );
              expect( new Rational( -2, 7 ).subtract( new Rational( -3, 7 ) ).toString() ).toEqual( "1/7" );
              expect( new Rational( 5, 12 ).subtract( new Rational( -7, 12 ) ).toString() ).toEqual( "1" );

              expect( new Rational( -1, 8 ).subtract( 0.125 ).toString() ).toEqual( "-1/4" );
              // expect( (new Rational( 2, 5 ).subtract( new Rational( -3, 10 ) )).subtract( -0.1 ).toString() ).toEqual( "1" );
          } );
} );


describe( "Rational Multiplication", () =>
{
    test( "Rationals can be multiplied",
          () =>
          {
              expect( new Rational( 1, 2 ).multiply( new Rational( 1, 2 ) ).toString() ).toEqual( "1/4" );

              expect( new Rational( 1, 2 ).multiply( new Rational( 1, 4 ) ).toString() ).toEqual( "1/8" );

              expect( new Rational( 3, 16 ).multiply( new Rational( 1, 4 ) ).toString() ).toEqual( "3/64" );

              expect( new Rational( 3, 16 ).multiply( new Rational( 1, 2 ) ).toString() ).toEqual( "3/32" );

              expect( new Rational( 3, 16 ).multiply( new Rational( 1, 3 ) ).toString() ).toEqual( "1/16" );

              expect( new Rational( 3, 16 ).multiply( new Rational( 0 ) ).toString() ).toEqual( "0" );


              expect( new Rational( 1, 2 ).multiply( new Rational( 1, 2 ), new Rational( 1, 2 ) ).toString() ).toEqual( "1/8" );
              expect( new Rational( 1, 3 ).multiply( new Rational( 1, 4 ), new Rational( 2, 5 ) ).toString() ).toEqual( "1/30" );

              expect( new Rational( 2, 7 ).multiply( new Rational( 1, 2 ), new Rational( 3, 4 ) ).toString() ).toEqual( "3/28" );

              expect( new Rational( 5, 9 ).multiply( new Rational( 1, 3 ), new Rational( 2, 5 ), new Rational( 3, 7 ) ).toString() ).toEqual( "2/63" );
          } );
} );

describe( "Rational Division", () =>
{
    test( "Rationals can be divided",
          () =>
          {
              expect( new Rational( 1, 2 ).divide( new Rational( 1, 2 ) ).toString() ).toEqual( "1" );


              expect( new Rational( 1, 2 ).divide( new Rational( 1, 4 ) ).toString() ).toEqual( "2" );
              expect( new Rational( 3, 4 ).divide( new Rational( 2, 3 ) ).toString() ).toEqual( "9/8" );

              expect( new Rational( 5, 6 ).divide( new Rational( 2, 3 ) ).toString() ).toEqual( "5/4" );

              expect( new Rational( 0, 1 ).divide( new Rational( 3, 5 ) ).toString() ).toEqual( "0" );

              expect( new Rational( 5, 6 ).divide( new Rational( 1, 1 ) ).toString() ).toEqual( "5/6" );

              expect( new Rational( -1, 2 ).divide( new Rational( 1, 3 ) ).toString() ).toEqual( "-3/2" );

              expect( new Rational( 7, 8 ).divide( new Rational( -3, 4 ) ).toString() ).toEqual( "-7/6" );

              const q = new Rational( 1, 3 ).divide( new Rational( 0, 1 ) );

              expect( q.toString() ).toEqual( "0" );
          } );
} );


describe( "sum", () =>
{
    const { sum } = mathUtils;

    test( "sums are limited to the appropriate number of significant digits",
          () =>
          {
              expect( 0.1 + 0.2 ).toEqual( 0.30000000000000004 );
              expect( sum( 0.1, 0.2 ) ).toEqual( 0.3 );

              expect( 0.1 + 0.2 + 0.07 ).toEqual( 0.37000000000000005 );
              expect( sum( 0.1, 0.2, 0.07 ) ).toEqual( 0.37 );

              expect( sum( 0.1234, 0.8766 ) ).toEqual( 1.0 );
              expect( sum( 1.1, -1.1 ) ).toEqual( 0 );
              expect( sum( -0.1, -0.2, -0.3 ) ).toEqual( -0.6 );
              expect( sum( 1e3, 2e3, 3e3 ) ).toEqual( 6000 );
              expect( sum( 0.0001, 0.0002 ).toFixed( 6 ) ).toEqual( "0.000300" );
              expect( sum( Number.MAX_SAFE_INTEGER, 1 ) ).toEqual( Number.MAX_SAFE_INTEGER + 1 );

          } );
} );


describe( "difference", () =>
{
    const { difference } = mathUtils;

    test( "differences are limited to the appropriate number of significant digits",
          () =>
          {
              expect( 0.3 - 0.2 ).toEqual( 0.09999999999999998 );
              expect( difference( 0.3, 0.2 ) ).toEqual( 0.1 );

              expect( difference( 1.5, 0.5 ) ).toEqual( 1.0 );
              expect( difference( 10, 7.8 ) ).toEqual( 2.2 );
              expect( difference( -1, -0.5 ) ).toEqual( -0.5 );
              expect( difference( 5.002, 2.001 ) ).toEqual( 3.001 );
              expect( difference( 0.3, 0.3 ) ).toEqual( 0 );
              expect( difference( 1000, 999.999 ) ).toEqual( 0.001 );

              expect( difference( 3, 1, 1 ) ).toEqual( 1 );
              expect( difference( 10, 2, 3 ) ).toEqual( 5 );
              expect( difference( 100, 50, 25, 10 ) ).toEqual( 15 );
              expect( difference( 5, 2, 1, 1 ) ).toEqual( 1 );
              expect( difference( 1.5, 0.5, 0.5 ) ).toEqual( 0.5 );
              expect( difference( 50, 20, 10, 5, 15 ) ).toEqual( 0 );
          } );
} );
