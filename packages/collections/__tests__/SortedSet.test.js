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

    get id()
    {
        return this.#id;
    }

    get propertyName()
    {
        return this.#propertyName;
    }

    compareTo( pOther )
    {
        if ( pOther instanceof this.constructor )
        {
            let comp = this.propertyName < pOther.propertyName ? -1 : this.propertyName > pOther.propertyName ? 1 : 0;

            if ( 0 === comp )
            {
                comp = this.id < pOther.id ? -1 : this.id > pOther.id ? 1 : 0;
            }

            return comp;
        }

        return -1;
    }

    equals( pOther )
    {
        return 0 === this.compareTo( pOther );
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

    get anotherProperty()
    {
        return this.#anotherProperty;
    }

    compareTo( pOther )
    {
        if ( pOther instanceof this.constructor || pOther instanceof A )
        {
            let comp = super.compareTo( pOther );

            if ( 0 === comp )
            {
                comp = this.anotherProperty < pOther.anotherProperty ? -1 : this.anotherProperty > pOther.anotherProperty ? 1 : 0;
            }

            return comp;
        }

        return -1;
    }

    equals( pOther )
    {
        return super.equals( pOther ) && (0 === this.compareTo( pOther ));
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


              let arr = [new B( 1, "abc", "def" ), new B( 2, "xyz", "uvw" ), new B( 1, "abc", "def" ), new B( 2, "xyz", "uvw" )];

              collection = SortedSet.from( arr );

              expect( collection.size ).toEqual( 2 );
          } );

    test( "Construct SortedSet of As",
          () =>
          {
              let collection = new SortedSet( A, [] );

              expect( collection instanceof SortedSet ).toBe( true );

              expect( collection.type ).toEqual( A );

              collection.add( new B( 1, "abc", "def" ) );
              collection.add( new B( 2, "xyz", "uvw" ) );

              expect( collection.size ).toEqual( 2 );

              collection.add( new B( 1, "abc", "def" ) );
              collection.add( new B( 2, "xyz", "uvw" ) );

              expect( collection.size ).toEqual( 2 );
          } );

    test( "Construct SortedSet of Dates",
          () =>
          {
              const _now = new Date();

              let dates = [_now, new Date( _now.getTime() - 864_000 ), new Date( 2025, 3, 3, 3, 3 ), _now];

              const sortedSet = SortedSet.from( dates );

              expect( sortedSet.type === Date ).toBe( true );

              expect( sortedSet.size ).toEqual( 3 );
          } );

} );

describe( "SortedSet Methods", () =>
{
    test( "SortedSet -- add", () =>
    {

    } );

    test( "SortedSet -- addAll", () =>
    {

    } );

    test( "SortedSet -- contains", () =>
    {

    } );

    test( "SortedSet -- containsAll", () =>
    {

    } );

    test( "SortedSet -- first", () =>
    {

    } );

    test( "SortedSet -- last", () =>
    {

    } );

    test( "SortedSet -- headSet", () =>
    {

    } );

    test( "SortedSet -- tailSet", () =>
    {

    } );

    test( "SortedSet -- subSet", () =>
    {

    } );

    test( "SortedSet -- remove", () =>
    {

    } );

    test( "SortedSet -- removeAll", () =>
    {

    } );

    test( "SortedSet -- retainAll", () =>
    {

    } );

} );



