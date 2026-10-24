// noinspection JSUnresolvedReference

const toolbocks = require( "@toolbocks/core" );

const { SecretsManager } = require( "@toolbocks/secrets" );

const { moduleUtils, constants, typeUtils } = toolbocks;

const { $ln } = moduleUtils;

const { getClassName } = typeUtils;

const depInjection = require( "@toolbocks/dep-injection" );

const { Dependency } = depInjection;

class SomeClassA
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

    someMethodOfA()
    {
        return "someMethodOfA::" + this.#id;
    }
}

class SomeClassB extends SomeClassA
{
    #name;

    constructor( pId, pName )
    {
        super( pId );

        this.#name = pName;
    }

    someMethodOfB()
    {
        return "someMethodOfB::" + this.id + "::" + this.#name;
    }
}

class SomeClassC extends SomeClassB
{
    #value = 0;

    constructor( pId, pName, value )
    {
        super( pId, pName );
        this.#value = value;
    }

    someMethodOfC()
    {
        return super.someMethodOfB() + "::" + this.#value;
    }
}

describe( "Dependency", () =>
{
    test( "Anything can become a Dependency", () =>
    {
        let dependency = new Dependency( new SomeClassB( 23, "Karl" ) );

        expect( getClassName( dependency ) ).toEqual( "Dependency" );
        expect( typeof dependency.init ).toEqual( "function" );

        expect( dependency.someMethodOfA() ).toEqual( "someMethodOfA::23" );

        expect( dependency.someMethodOfB() ).toEqual( "someMethodOfB::23::Karl" );
    } );

    test( "A Dependency knows what TYPE it decorates", () =>
    {
        let dependency = new Dependency( new SomeClassB( 23, "Karl" ) );

        expect( Dependency.isOfClass( dependency, SomeClassB ) ).toBe( true );
        expect( Dependency.isOfClass( dependency.componentClass, SomeClassB ) ).toBe( true );

        expect( Dependency.isOfClass( dependency, SomeClassA ) ).toBe( true );
        expect( Dependency.isOfClass( dependency.componentClass, SomeClassA ) ).toBe( true );

        expect( Dependency.isOfClass( dependency, SomeClassC ) ).toBe( false );
        expect( Dependency.isOfClass( dependency.componentClass, SomeClassC ) ).toBe( false );
    } );

    test( "Dependencies cannot be double-wrapped", () =>
    {
        let dependency = new Dependency( new SomeClassB( 23, "Karl" ) );
        dependency = new Dependency( dependency );
        dependency = new Dependency( dependency );
        dependency = new Dependency( dependency );

        expect( Dependency.isDependency( dependency ) ).toBe( true );

        expect( Dependency.isOfClass( dependency, SomeClassB ) ).toBe( true );
        expect( Dependency.isOfClass( dependency.componentClass, SomeClassB ) ).toBe( true );

        expect( Dependency.isOfClass( dependency, SomeClassA ) ).toBe( true );
        expect( Dependency.isOfClass( dependency.componentClass, SomeClassA ) ).toBe( true );

        expect( Dependency.isOfClass( dependency, SomeClassC ) ).toBe( false );
        expect( Dependency.isOfClass( dependency.componentClass, SomeClassC ) ).toBe( false );


        expect( getClassName( dependency ) ).toEqual( "Dependency" );
        expect( typeof dependency.init ).toEqual( "function" );

        expect( dependency.someMethodOfA() ).toEqual( "someMethodOfA::23" );

        expect( dependency.someMethodOfB() ).toEqual( "someMethodOfB::23::Karl" );
    } );

    test( "A Dependency can be initialized and disposed", async() =>
    {
        let dependency = new Dependency( new SomeClassB( 23, "Karl" ) );

        dependency = await dependency.init();

        expect( dependency.initialized ).toBe( true );

        dependency = await dependency.dispose();

        expect( dependency.initialized ).toBe( false );
    } );

} );