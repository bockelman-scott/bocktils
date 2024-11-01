const numParserModule = require( "../src/NumberParser.cjs" );

const NumberParser = numParserModule.classes.NumberParser;

describe( "NumberParser", () =>
{
    test( "Can create a number parser for a Locale", () =>
    {
        const numberParser = new NumberParser( "en-US", {} );

        expect( numberParser instanceof NumberParser ).toBe( true );

        expect( numberParser.locale.baseName ).toEqual( new Intl.Locale( "en-US" ).baseName );
    });

    test( "Can create a number parser from an Intl.NumberFormat", () =>
    {
        const numberFormat = new Intl.NumberFormat( "en-US", {} );

        const numberParser = new NumberParser( numberFormat );

        expect( numberParser instanceof NumberParser ).toBe( true );

        expect( numberParser.locale.baseName ).toEqual( new Intl.Locale( "en-US" ).baseName );
    });

    test( "NumberParser return the correct value for es", () =>
    {
        const numberFormat = new Intl.NumberFormat( "es", {} );

        const numberParser = new NumberParser( numberFormat );

        expect( numberParser instanceof NumberParser ).toBe( true );

        expect( numberParser.locale.baseName ).toEqual( new Intl.Locale( "es" ).baseName );

        expect( numberParser.parse( "1.000,32" ) ).toEqual( 1_000.32 );
    });

    test( "NumberParser return the correct value for de", () =>
    {
        const numberFormat = new Intl.NumberFormat( "de", {} );

        const numberParser = new NumberParser( numberFormat );

        expect( numberParser instanceof NumberParser ).toBe( true );

        expect( numberParser.locale.baseName ).toEqual( new Intl.Locale( "de" ).baseName );

        expect( numberParser.parse( "1.000,32" ) ).toEqual( 1_000.32 );
    });

});