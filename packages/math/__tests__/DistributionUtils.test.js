const core = require( "@toolbocks/core" );

const { arrayUtils } = core;

const { asArray } = arrayUtils;

const mathUtils = require( "../src/MathUtils.cjs" );

const { sum, product, quotient } = mathUtils;

const distributionUtils = require( "../src/DistributionUtils.cjs" );

const { generateEvenDistribution, generateDistributionFromSegments, numKeysPerSegment } = distributionUtils;

describe( "generateEvenDistribution", () =>
{
    test( "distribute 12 things across 3 dates evenly",
          () =>
          {
              const dates = [new Date( 2021, 0, 1 ), new Date( 2021, 0, 2 ), new Date( 2021, 0, 3 )];

              const distribution = generateEvenDistribution( 12, dates, 3 );

              expect( distribution.size ).toEqual( 3 );
              expect( distribution.get( dates[0] ) ).toEqual( 4 );
              expect( distribution.get( dates[1] ) ).toEqual( 4 );
              expect( distribution.get( dates[2] ) ).toEqual( 4 );
          } );

    test( "distribute 10 things across 3 dates evenly",
          () =>
          {
              const dates = [new Date( 2021, 0, 1 ), new Date( 2021, 0, 2 ), new Date( 2021, 0, 3 )];

              const distribution = generateEvenDistribution( 10, dates, 3 );

              expect( distribution.size ).toEqual( 3 );
              expect( distribution.get( dates[0] ) ).toEqual( 3.33333 );
              expect( distribution.get( dates[1] ) ).toEqual( 3.33333 );
              expect( distribution.get( dates[2] ) ).toEqual( 3.33334 );
          } );

    test( "distribute 100 things across 3 dates evenly",
          () =>
          {
              const dates = [new Date( 2021, 0, 1 ), new Date( 2021, 0, 2 ), new Date( 2021, 0, 3 )];

              const distribution = generateEvenDistribution( 100, dates, 3 );

              expect( distribution.size ).toEqual( 3 );
              expect( distribution.get( dates[0] ) ).toEqual( 33.33333 );
              expect( distribution.get( dates[1] ) ).toEqual( 33.33333 );
              expect( distribution.get( dates[2] ) ).toEqual( 33.33334 );
          } );

    test( "distribute 111 things across 3 dates evenly",
          () =>
          {
              const dates = [new Date( 2021, 0, 1 ), new Date( 2021, 0, 2 ), new Date( 2021, 0, 3 )];

              const distribution = generateEvenDistribution( 111, dates, 3 );

              expect( distribution.size ).toEqual( 3 );
              expect( distribution.get( dates[0] ) ).toEqual( 37 );
              expect( distribution.get( dates[1] ) ).toEqual( 37 );
              expect( distribution.get( dates[2] ) ).toEqual( 37 );
          } );

    test( "distribute 1111 things across 3 dates evenly",
          () =>
          {
              const dates = [new Date( 2021, 0, 1 ), new Date( 2021, 0, 2 ), new Date( 2021, 0, 3 )];

              const distribution = generateEvenDistribution( 1111, dates, 3 );

              expect( distribution.size ).toEqual( 3 );
              expect( distribution.get( dates[0] ) ).toEqual( 370.33333 );
              expect( distribution.get( dates[1] ) ).toEqual( 370.33333 );
              expect( distribution.get( dates[2] ) ).toEqual( 370.33334 );
          } );

    test( "distribute 1117 things across 23 dates evenly",
          () =>
          {
              const dates = function* ()
              {
                  let date = new Date( 1901, 0, 1 );

                  while ( true )
                  {
                      yield date;
                      date = new Date( date.getTime() + /*7 **/ (1000 * 60 * 60 * 24) );
                  }
              };

              const distribution = generateEvenDistribution( 1117, dates(), 23,
                                                             {
                                                                 precision: 6,
                                                                 allowedRecursions: 3
                                                             } );

              expect( distribution.size ).toEqual( 23 );

              const values = asArray( distribution.values() );

              const summation = values.reduce( ( a, b ) => sum( a, b ), 0 );

              console.log( summation );

              expect( summation ).toEqual( 1117 );

              /*
               expect( distribution.get( dates[0] ) ).toEqual( 370.33333 );
               expect( distribution.get( dates[1] ) ).toEqual( 370.33333 );
               expect( distribution.get( dates[2] ) ).toEqual( 370.33334 );
               */
          } );


} );

describe( "numKeysPerSegment", () =>
{
    test( "4 segments, 23 periods, 100 things",
          () =>
          {
              const segments = [20, 40, 10, 30];

              const perSegment = numKeysPerSegment( segments, 23 );

              expect( perSegment ).toEqual( [6, 6, 5, 6] );
          } );
} );

describe( "generateDistributionFromSegments", () =>
{
    test( "distribute 100 things across 4 quartiles by date",
          () =>
          {
              const total = 100;
              const quartiles = new Map();

              quartiles.set( "Q1", 30 );
              quartiles.set( "Q2", 20 );
              quartiles.set( "Q3", 40 );
              quartiles.set( "Q4", 10 );

              const dates = function* ()
              {
                  let date = new Date( 2021, 0, 1 );
                  while ( true )
                  {
                      yield date;
                      date = new Date( date.getTime() + 7 * (1000 * 60 * 60 * 24) );
                  }
              };

              const distribution = generateDistributionFromSegments( total, quartiles, dates(), 23 );

              console.log( distribution );
          } );
} );