// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

/** import the Constants.cjs we are testing */
const constants = require( "../src/Constants.cjs" );

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
