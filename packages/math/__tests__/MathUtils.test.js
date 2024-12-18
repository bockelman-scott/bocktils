// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );
const mathUtils = require( "../src/MathUtils.cjs" );

describe( "Tests", () =>
{
    test( "Test",
          () =>
          {
              expect( 1 ).toEqual( 1 );
          } );
} );
