// noinspection JSUnresolvedReference

const toolbocks = require( "@toolbocks/core" );

const { SimpleLogger } = require( "@toolbocks/logging" );

const { moduleUtils, constants, typeUtils } = toolbocks;

const { $ln } = moduleUtils;

const { getClassName } = typeUtils;

const depInjection = require( "@toolbocks/dep-injection" );

const { Dependencies, Dependency, DependentObject } = depInjection;

class SomeDependency
{
    constructor()
    {

    }

    someMethod()
    {
        console.log( `${getClassName( this )} someMethod called` );

        return 4;
    }
}

class SomeClassA extends DependentObject
{
    #someDependency;

    constructor( pDependencies, pOptions, ...pArgs )
    {
        super( pDependencies, pOptions, ...pArgs );

        this.#someDependency = pDependencies.findDependency( "someDependency" );
    }

    someMethodOfA()
    {
        return this.#someDependency.someMethod();
    }
}

describe( "DependentObject", () =>
{
    test( "A DependentObject receives dependencies when constructed", () =>
    {
        const dependency = new Dependency( new SomeDependency(), "someDependency" );
        const logger = new Dependency( new SimpleLogger( console ), "logger", "logging.logger" );
        const dependencies = new Dependencies( logger, dependency );
        const a = new SomeClassA( dependencies );
        expect( a.someMethodOfA() ).toEqual( 4 );
    } );

} );