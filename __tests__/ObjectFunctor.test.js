// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );
const objectFunctorUtils = require( "../src/ObjectFunctor.cjs" );

const arrayUtils = objectFunctorUtils.dependencies.arrayUtils;
const objectUtils = objectFunctorUtils.dependencies.objectUtils;

const ObjectFunctor = objectFunctorUtils.classes.ObjectFunctor;

describe( "ObjectFunctor", () =>
{
    const obj =
        {
            a:
                {
                    b:
                        {
                            c:
                                {
                                    d: 4
                                }
                        }
                },
            b: {
                c:
                    {
                        d: 4
                    }
            },
            c:
                {
                    d: 4
                },
            d: 4,
            e: "abc",
            f: true,
            g: Symbol.for( "TEST" ),
            h: BigInt( 12 ),
            i: null,
            j: function( pArg ) { return pArg; }
        };

    test( "Construction",
          () =>
          {
              const functor = new ObjectFunctor( obj );

              expect( functor.length ).toEqual( 10 );
/*

              expect( functor.valueOf()["a"] ).toEqual( new ObjectFunctor( obj.a ) );
              expect( functor.valueOf()["b"] ).toEqual( new ObjectFunctor( obj.b ) );

              const o = functor.valueOf();

              const A = o["a"];

              const AB = obj.a.b;

              const functorAB = new ObjectFunctor( AB );

              const oo = functorAB.valueOf();

              expect( A["b"] ).toEqual( oo["b"] );
*/


          } );
} );
