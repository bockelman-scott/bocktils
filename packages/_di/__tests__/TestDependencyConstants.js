// noinspection JSUnresolvedReference

const toolbocks = require( "@toolbocks/core" );

const { moduleUtils, constants, typeUtils } = toolbocks;

const { getClassName } = typeUtils;

const depInjection = require( "@toolbocks/dep-injection" );

const { DEP_CONSTS, DEP_CONSTS_BY_ID, DependencyConstant } = depInjection;

describe( "Dependency Constants are Exposed", () =>
{
    test( "DEP_CONSTS is an object", () =>
    {
        expect( typeof DEP_CONSTS ).toEqual( "object" );

        expect( Object.keys( DEP_CONSTS ).length > 10 ).toBe( true );

        // console.log( Object.values( DEP_CONSTS ) );
    } );

    test( "DEP_CONSTS_BY_ID provides lookup", () =>
    {
        let secretsManagerConstant = DEP_CONSTS_BY_ID.get( "secrets.secretsManager" );

        expect( secretsManagerConstant.id ).toEqual( "secrets.secretsManager" );
        expect( secretsManagerConstant.name ).toEqual( "secretsManager" );
        expect( secretsManagerConstant.description ).toEqual( "Secrets Manager for obtaining API Keys and other secrets" );

    } );

    test( "DEP_CONSTS_BY_ID returns an object of class, DependencyConstant", () =>
    {
        let secretsManagerConstant = DEP_CONSTS_BY_ID.get( "secrets.secretsManager" );

        expect( typeof secretsManagerConstant ).toBe( "object" );

        expect( getClassName(secretsManagerConstant) ).toEqual( "DependencyConstant" );
    } );


} );