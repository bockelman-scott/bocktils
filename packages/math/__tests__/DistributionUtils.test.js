const core = require( "@toolbocks/core" );

const distributionUtils = require( "../src/DistributionUtils.cjs" );

const { generateEvenDistribution } = distributionUtils;

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
} );