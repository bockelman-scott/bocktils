const core = require( "@toolbocks/core" );

const { arrayUtils } = core;

const { asArray } = arrayUtils;

const mathUtils = require( "../src/MathUtils.cjs" );

const { sum, product, quotient } = mathUtils;

const distributionUtils = require( "../src/DistributionUtils.cjs" );

const { generateEvenDistribution, transformDistribution, numKeysPerSegment, numSegmentsPerKey } = distributionUtils;

distributionUtils.disableLogging();
mathUtils.disableLogging();

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
              expect( distribution.get( dates[0] ) ).toEqual( 3.333333 );
              expect( distribution.get( dates[1] ) ).toEqual( 3.333333 );
              expect( distribution.get( dates[2] ) ).toEqual( 3.333334 );
          } );

    test( "distribute 100 things across 3 dates evenly",
          () =>
          {
              const dates = [new Date( 2021, 0, 1 ), new Date( 2021, 0, 2 ), new Date( 2021, 0, 3 )];

              const distribution = generateEvenDistribution( 100, dates, 3 );

              expect( distribution.size ).toEqual( 3 );
              expect( distribution.get( dates[0] ) ).toEqual( 33.333333 );
              expect( distribution.get( dates[1] ) ).toEqual( 33.333333 );
              expect( distribution.get( dates[2] ) ).toEqual( 33.333334 );
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
              expect( distribution.get( dates[0] ) ).toEqual( 370.333333 );
              expect( distribution.get( dates[1] ) ).toEqual( 370.333333 );
              expect( distribution.get( dates[2] ) ).toEqual( 370.333334 );
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

              const distribution = generateEvenDistribution( 1117,
                                                             dates(),
                                                             23,
                                                             null,
                                                             {
                                                                 precision: 6,
                                                                 allowedRecursions: 3
                                                             } );

              expect( distribution.size ).toEqual( 23 );

              const values = asArray( distribution.values() );

              const summation = values.reduce( ( a, b ) => sum( a, b ), 0 );

              // console.log( summation );

              expect( summation ).toEqual( 1117 );
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
/*

 describe( "numSegmentsPerKey", () =>
 {
 test( "4 segments, 3 periods",
 () =>
 {
 const segments = [20, 40, 10, 30];

 const perSegment = numSegmentsPerKey( segments, 3 );

 expect( perSegment.reduce( ( a, b ) => a + b, 0 ) ).toEqual( segments.length );

 expect( perSegment ).toEqual( [1, 2, 1] );
 } );

 test( "7 segments, 3 periods",
 () =>
 {
 const segments = [10, 20, 30, 5, 10, 5, 20];

 const perSegment = numSegmentsPerKey( segments, 3 );

 expect( perSegment.reduce( ( a, b ) => a + b, 0 ) ).toEqual( segments.length );

 expect( perSegment ).toEqual( [2, 3, 2] );
 } );

 test( "10 segments, 5 periods",
 () =>
 {
 const segments = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];

 const perSegment = numSegmentsPerKey( segments, 5 );

 expect( perSegment.reduce( ( a, b ) => a + b, 0 ) ).toEqual( segments.length );

 expect( perSegment ).toEqual( [2, 2, 2, 2, 2] );
 } );

 test( "10 segments, 5 periods, non-uniform",
 () =>
 {
 const segments = [1, 1, 1, 17, 10, 50, 5, 5, 5, 5];

 const perSegment = numSegmentsPerKey( segments, 5 );

 expect( perSegment.reduce( ( a, b ) => a + b, 0 ) ).toEqual( segments.length );

 expect( perSegment ).toEqual( [2, 2, 2, 2, 2] );
 } );
 } );
 */

describe( "transformDistribution", () =>
{
    test( "distribute 100 things across 4 quartiles by date",
          () =>
          {
              const total = 100;
              const quartiles = new Map();

              quartiles.set( "Q1", 20 );
              quartiles.set( "Q2", 40 );
              quartiles.set( "Q3", 10 );
              quartiles.set( "Q4", 30 );

              const dates = function* ()
              {
                  let date = new Date( 2021, 0, 1 );
                  while ( true )
                  {
                      yield date;
                      date = new Date( date.getTime() + 7 * (1000 * 60 * 60 * 24) );
                  }
              };

              // pTotal, pIterable, pNumEntries, pModelDistribution, pOptions
              const distribution = transformDistribution( total, dates(), 23, quartiles );

              expect( distribution.size ).toEqual( 23 );
              expect( asArray( distribution.values() ).reduce( ( a, b ) => a + b, 0 ) ).toEqual( 100 );

              const firstSegment = asArray( distribution.values() ).filter( ( e, i ) => i < 6 );
              const secondSegment = asArray( distribution.values() ).filter( ( e, i ) => i >= 6 && i < 12 );
              const thirdSegment = asArray( distribution.values() ).filter( ( e, i ) => i >= 12 && i < 17 );
              const fourthSegment = asArray( distribution.values() ).filter( ( e, i ) => i >= 17 );

              expect( Math.round( firstSegment.reduce( ( a, b ) => a + b, 0 ) ) ).toEqual( 20 );
              expect( Math.round( secondSegment.reduce( ( a, b ) => a + b, 0 ) ) ).toEqual( 40 );
              expect( Math.round( thirdSegment.reduce( ( a, b ) => a + b, 0 ) ) ).toEqual( 10 );
              expect( Math.round( fourthSegment.reduce( ( a, b ) => a + b, 0 ) ) ).toEqual( 30 );

              console.log( distribution );
          } );
} );