const core = require( "@toolbocks/core" );

const jsonUtils = require( "@toolbocks/json" );

const { moduleUtils, constants, typeUtils } = core;

const
    {
        isArray,
        toObjectLiteral
    } = typeUtils;

const
    {
        asObject,
        asJson,
        parseJson
    } = jsonUtils;

describe( "JsonUtils", () =>
{
    class A
    {
        #id;

        constructor( pId )
        {
            this.#id = pId;
        }

        get id()
        {
            return this.#id;
        }

        echo( pMsg )
        {
            console.log( pMsg );
        }
    }

    class B extends A
    {
        #name;

        constructor( pId, pName )
        {
            super( pId );
            this.#name = pName;
        }

        get name()
        {
            return this.#name;
        }

        silence( pMsg )
        {
            console.log( "shhhhhh", pMsg );
        }
    }

    test( "asObject - variations", () =>
    {
        let a = new A( 23 );
        let b = new B( 45, "Fred" );
        let c = { a, b };

        const oA = asObject( a );
        const oB = asObject( b );
        const oC = asObject( c );

        expect( oA === a ).toBe( true );
        expect( oB === b ).toBe( true );
        expect( oC === c ).toBe( true );

        expect( typeof oA.echo ).toEqual( "function" );
        expect( typeof oB.echo ).toEqual( "function" );
        expect( typeof oB.silence ).toEqual( "function" );
        expect( oA.silence ).toBe( undefined );

        const options = { omitFunctions: false };

        let aa = toObjectLiteral( a, options );
        let bb = toObjectLiteral( b, options );
        let cc = toObjectLiteral( c, options );

        const oAA = asObject( aa );
        const oBB = asObject( bb );
        const oCC = asObject( cc );

        expect( typeof oAA.echo ).toEqual( "function" );
        expect( typeof oBB.echo ).toEqual( "function" );
        expect( typeof oBB.silence ).toEqual( "function" );
        expect( oAA.silence ).toBe( undefined );

        expect( typeof oCC.a.echo ).toEqual( "function" );
        expect( typeof oCC.b.echo ).toEqual( "function" );
        expect( typeof oCC.b.silence ).toEqual( "function" );
        expect( typeof oCC.a.silence ).toEqual( "undefined" );

        let json = `{"a":23,"b":45}`;

        let object = asObject( json );

        expect( object.a ).toEqual( 23 );
        expect( object.b ).toEqual( 45 );

        json = `[0,1,2,3,"a","b","c","d","e"]`;
        object = asObject( json );

        expect( isArray( object ) ).toBe( true );
        expect( object.length ).toEqual( 9 );
        expect( object[5] ).toEqual( "b" );

        let oo = asObject( "some string" );
        expect( typeof oo ).toEqual( "object" );
        expect( String( oo ) ).toEqual( "some string" );

    } );

    test( "asObject - Maps",
          () =>
          {
              let map = new Map();
              map.set( "a", new A( 23 ) );
              map.set( "b", new B( 45, "Fred" ) );
              map.set( "c", new WeakRef( new A( 17 ) ) );

              let obj = asObject( toObjectLiteral( map, { omitFunctions: false } ) );

              expect( typeof obj["a"] ).toEqual( "object" );

              const c = asObject( obj["c"] );

              expect( typeof c ).toEqual( "object" );
              expect( c.id ).toEqual( 17 );
              expect( typeof c.echo ).toEqual( "function" );

              const b = asObject( obj["b"] );

              expect( typeof b ).toEqual( "object" );
              expect( b.id ).toEqual( 45 );
              expect( typeof b.echo ).toEqual( "function" );

          } );


} );