/** import the utilities to test **/

const collectionUtils = require( "../Collection.js" );

const { TYPES, Collection } = collectionUtils;

class A
{
    #propertyName;

    constructor( pName )
    {
        this.#propertyName = pName;
    }
}

class B extends A
{
    #anotherProperty;

    constructor( pName, pAnotherProperty )
    {
        super( pName );

        this.#anotherProperty = pAnotherProperty;
    }
}

describe( "TYPES exist", () =>
{
    test( "Enumerate TYPES",
          () =>
          {
              expect( Object.keys( TYPES ).length ).toEqual( 7 );
              expect( Object.values( TYPES ).length ).toEqual( 7 );

              expect( Object.keys( TYPES ) ).toEqual( ["ANY", "string", "number", "bigint", "boolean", "function", "symbol"] );
              expect( Object.values( TYPES ) ).toEqual( ["*", "string", "number", "bigint", "boolean", "function", "symbol"] );
          } );
} );

describe( "Collection Constructors", () =>
{
    test( "Construct Mixed-type Collection",
          () =>
          {
              let collection = new Collection();

              expect( collection instanceof Collection ).toBe( true );

              expect( collection.type ).toEqual( TYPES.ANY );

              collection.add( 4 );
              collection.add( "five" );
              collection.add( { value: 6 } );
              collection.add( { value: "seven" } );
              collection.add( [8, 9] );

              expect( collection.size ).toEqual( 5 );

              let collection_2 = new Collection( TYPES.ANY, [4, "five", { value: 6 }, { value: "seven" }, [8, 9]] );

              expect( collection_2 instanceof Collection ).toBe( true );

              expect( collection_2.type ).toEqual( TYPES.ANY );

              expect( collection_2.size ).toEqual( 5 );

              expect( collection ).toEqual( collection_2 );

              expect( collection.equals( collection_2 ) ).toBe( true );
          } );

    test( "Construct Numeric Collection",
          () =>
          {
              let collection = new Collection( "number" );

              collection.add( 4 );

              expect( collection.size ).toEqual( 1 );

              try
              {
                  collection.add( "four" );
              }
              catch( ex )
              {
                  console.log( ex );
              }

              expect( collection.size ).toEqual( 1 );

          } );


    test( "Construct Classed Collection",
          () =>
          {
              let collection = new Collection( A );

              collection.add( new A("Scott") );

              expect( collection.size ).toEqual( 1 );

              collection.add( new B("Debby","Cernich") );

              expect( collection.size ).toEqual( 2 );

              try
              {
                  collection.add( "four" );
              }
              catch( ex )
              {
                  console.log( ex );
              }

              expect( collection.size ).toEqual( 2 );

          } );
} );


