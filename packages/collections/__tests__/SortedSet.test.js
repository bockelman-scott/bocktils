/** import the utilities to test **/

const collectionUtils = require( "../SortedSet.js" );

const { TYPES, SortedSet } = collectionUtils;

class A
{
    #id;
    #propertyName;

    constructor( pId, pName )
    {
        this.#id = pId;
        this.#propertyName = pName;
    }

    compareTo( pOther )
    {

    }

    equals( pOther )
    {

    }
}

class B extends A
{
    #anotherProperty;

    constructor( pId, pName, pAnotherProperty )
    {
        super( pId, pName );

        this.#anotherProperty = pAnotherProperty;
    }

    compareTo( pOther )
    {

    }

    equals( pOther )
    {

    }
}

describe( "SortedSet Constructors", () =>
{
    test( "Construct SortedSet of Bs",
          () =>
          {
              let collection = new SortedSet( B, [] );

              expect( collection instanceof SortedSet ).toBe( true );

              expect( collection.type ).toEqual( B );

              collection.add( new B( 1, "abc", "def" ) );
              collection.add( new B( 2, "xyz", "uvw" ) );

              expect( collection.size ).toEqual( 2 );

              collection.add( new B( 1, "abc", "def" ) );
              collection.add( new B( 2, "xyz", "uvw" ) );

              expect( collection.size ).toEqual( 2 );


          } );

} );


