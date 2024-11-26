// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

/** import the Constants.cjs we are testing */
const constants = require( "../src/Constants.cjs" );

describe( "Affirmatives", () =>
{
    function TestAffirmatives( pVal )
    {
        return constants?._affirmatives.includes( pVal );
    }

    test( "affirmatives include 'enabled'", () =>
    {
        expect( TestAffirmatives( "enabled" ) ).toBe( true );
    } );

    test( "affirmatives include 't'", () =>
    {
        expect( TestAffirmatives( "t" ) ).toBe( true );
    } );

    test( "affirmatives do not include 'foo'", () =>
    {
        expect( TestAffirmatives( "foo" ) ).toBe( false );
    } );
} );


describe( "populateOptions", () =>
{
    const defaults =
        {
            a: 1,
            b: 2,
            c: 3,
            d: true
        };

    const options =
        {
            a: 10,
            d: false,
            e: 23
        };

    test( "populateOptions overwrites defaults", () =>
    {
        expect( constants.populateOptions( options, defaults ) ).toEqual(
            {
                a: 10,
                b: 2,
                c: 3,
                d: false,
                e: 23
            } );
    } );

    test( "populateOptions always returns an object", () =>
    {
        expect( constants.populateOptions( null ) ).toEqual( {} );
    } );

    test( "populateOptions can handle null", () =>
    {
        expect( constants.populateOptions( null, defaults ) ).toEqual( defaults );
    } );

    test( "populateOptions can handle unexpected arguments", () =>
    {
        expect( constants.populateOptions( [1, 2, 3], [4, 5, 6] ) ).toEqual( { "0": 1, "1": 2, "2": 3 } );
    } );

    test( "populateOptions can handle unexpected defaults", () =>
    {
        expect( constants.populateOptions( [4, 5, 6], { "0": 1, "1": 2, "2": 3 } ) ).toEqual( {
                                                                                                  "0": 4,
                                                                                                  "1": 5,
                                                                                                  "2": 6
                                                                                              } );
    } );

} );

describe( "localCopy", () =>
{
    let arr = ["a", "b", "c", "d"];
    let obj = { a: 1, b: 2, letters: arr };

    function f( pObject, ...pArgs )
    {
        let localArray = constants.localCopy( pArgs );
        localArray.push( "f", "g", "h" );

        let doubledArray = [...pArgs];
        doubledArray.push( "w", "x", "y" );

        let shadowedArray = pArgs;
        shadowedArray.push( "z" );

        let localObject = constants.localCopy( pObject );
        localObject.a = 11;
        localObject.c = 42;

        let shadowedObject = pObject;
        shadowedObject.a = -1;
        shadowedObject.b = -2;
        shadowedObject.d = -4;

        let objectDouble = { ...pObject };
        objectDouble.a = 100;
        objectDouble.b = 200;
        objectDouble.d = 300;

        return { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble };
    }

    function g( pObject )
    {
        const localObject = constants.localCopy( pObject );

        const spreadObject = { ...pObject };

        localObject.letters.push( "q", "r", "s" );

        spreadObject.letters.push( "t", "u", "v" );

        return { localObject, spreadObject };
    }

    test( "localCopy makes a new value that is not a reference to the source", () =>
    {
        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //

        const alias = arr;

        const copy = constants.localCopy( arr );

        expect( copy ).toEqual( arr );

        expect( copy === arr ).toBe( false );
        expect( alias === arr ).toBe( true );

        let { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble }
            = f( obj, ...arr );

        expect( arr ).toEqual( ["a", "b", "c", "d"] );

        expect( localArray ).toEqual( ["a", "b", "c", "d", "f", "g", "h"] );
        expect( localArray === arr ).toBe( false );

        expect( shadowedArray ).toEqual( ["a", "b", "c", "d", "z"] );

        expect( doubledArray ).toEqual( ["a", "b", "c", "d", "w", "x", "y"] );
        expect( doubledArray === arr ).toBe( false );


        expect( localObject ).toEqual( { a: 11, b: 2, c: 42, letters: arr } );
        expect( localObject === obj ).toBe( false );

        expect( shadowedObject ).toEqual( { a: -1, b: -2, d: -4, letters: arr } );
        expect( shadowedObject === obj ).toBe( true );

        expect( objectDouble ).toEqual( { a: 100, b: 200, d: 300, letters: arr } );
        expect( objectDouble === obj ).toBe( false );

        expect( objectDouble.letters ).toEqual( arr );

        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //
    } );

    test( "localCopy is safer than the spread operator", () =>
    {
        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //

        const { localObject, spreadObject } = g( obj );

        expect( localObject === obj ).toBe( false );
        expect( spreadObject === obj ).toBe( false );

        expect( localObject ).toEqual( { a: 1, b: 2, letters: ["a", "b", "c", "d", "q", "r", "s"] } );

        expect( spreadObject ).toEqual( { a: 1, b: 2, letters: ["a", "b", "c", "d", "t", "u", "v"] } );

        expect( spreadObject ).toEqual( { a: 1, b: 2, letters: arr } );
        expect( arr ).toEqual( ["a", "b", "c", "d", "t", "u", "v"] );

        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //
    } );

} );

describe( "immutableCopy", () =>
{
    let arr = ["a", "b", "c", "d"];
    let obj = { a: 1, b: 2, letters: arr };

    function f( pObject, ...pArgs )
    {
        let localArray = constants.immutableCopy( pArgs );
        try
        {
            localArray.push( "f", "g", "h" );
        }
        catch( ex )
        {
            // localArray should be immutable, so we expect this
        }

        let doubledArray = [...pArgs];
        doubledArray.push( "w", "x", "y" );

        let shadowedArray = pArgs;
        shadowedArray.push( "z" );

        let localObject = constants.immutableCopy( pObject );

        try
        {
            localObject.a = 11;
            localObject.c = 42;
        }
        catch( ex )
        {
            // localObject should be immutable, so we expect this
        }

        try
        {
            localObject.letters.push( "ZZ" );
        }
        catch( ex )
        {
            // localObject should be immutable, so we expect this
        }

        let shadowedObject = pObject;
        shadowedObject.a = -1;
        shadowedObject.b = -2;
        shadowedObject.d = -4;

        let objectDouble = { ...pObject };
        objectDouble.a = 100;
        objectDouble.b = 200;
        objectDouble.d = 300;

        return { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble };
    }

    test( "immutableCopy makes a new read-only value that is not a reference to the source", () =>
    {
        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //

        const alias = arr;

        const copy = constants.immutableCopy( arr );

        expect( copy ).toEqual( arr );
        expect( Object.isFrozen( copy ) ).toBe( true );

        expect( copy === arr ).toBe( false );
        expect( alias === arr ).toBe( true );

        let { localArray, shadowedArray, doubledArray, localObject, shadowedObject, objectDouble }
            = f( obj, ...arr );

        expect( arr ).toEqual( ["a", "b", "c", "d"] );

        expect( localArray ).toEqual( ["a", "b", "c", "d"] );
        expect( localArray === arr ).toBe( false );
        expect( Object.isFrozen( localArray ) ).toBe( true );

        expect( shadowedArray ).toEqual( ["a", "b", "c", "d", "z"] );
        expect( doubledArray ).toEqual( ["a", "b", "c", "d", "w", "x", "y"] );
        expect( doubledArray === arr ).toBe( false );

        expect( localObject ).toEqual( { a: 1, b: 2, letters: arr } );
        expect( localObject === obj ).toBe( false );
        expect( Object.isFrozen( localObject ) ).toBe( true );
        expect( Object.isFrozen( localObject.letters ) ).toBe( true );

        expect( shadowedObject ).toEqual( { a: -1, b: -2, d: -4, letters: arr } );
        expect( shadowedObject === obj ).toBe( true );

        expect( objectDouble ).toEqual( { a: 100, b: 200, d: 300, letters: arr } );
        expect( objectDouble === obj ).toBe( false );

        expect( objectDouble.letters ).toEqual( arr );

        // restore test data
        arr = ["a", "b", "c", "d"];
        obj = { a: 1, b: 2, letters: arr };
        //
    } );

} );

describe( "copyScope", () =>
{
    function TestCopyScope( pScope )
    {
        const me = pScope || TestCopyScope || this;

        me.x = 1;
        me.y = 2;
        me.z = 3;

        let obj = constants.copyScope( me );

        return obj?.x === me.x && obj?.y === me.y && obj?.z === me.z;
    }

    test( "copyScope returns variables", () =>
    {
        expect( TestCopyScope() ).toBe( true );
    } );
} );

