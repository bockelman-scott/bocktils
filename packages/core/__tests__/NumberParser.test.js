const numParserModule = require( "../src/NumberParser.cjs" );

const { NumberParser, pctToDec, decToPct } = numParserModule;

describe( "NumberParser", () =>
{
    test( "Can create a number parser for a Locale", () =>
    {
        const numberParser = new NumberParser( "en-US", {} );

        expect( numberParser instanceof NumberParser ).toBe( true );

        expect( numberParser.locale.baseName ).toEqual( new Intl.Locale( "en-US" ).baseName );
    } );

    test( "Can create a number parser from an Intl.NumberFormat", () =>
    {
        const numberFormat = new Intl.NumberFormat( "en-US", {} );

        const numberParser = new NumberParser( numberFormat );

        expect( numberParser instanceof NumberParser ).toBe( true );

        expect( numberParser.locale.baseName ).toEqual( new Intl.Locale( "en-US" ).baseName );
    } );

    test( "NumberParser return the correct value for es", () =>
    {
        const numberFormat = new Intl.NumberFormat( "es", {} );

        const numberParser = new NumberParser( numberFormat );

        expect( numberParser instanceof NumberParser ).toBe( true );

        expect( numberParser.locale.baseName ).toEqual( new Intl.Locale( "es" ).baseName );

        expect( numberParser.parse( "1.000,32" ) ).toEqual( 1_000.32 );
    } );

    test( "NumberParser return the correct value for de", () =>
    {
        const numberFormat = new Intl.NumberFormat( "de", {} );

        const numberParser = new NumberParser( numberFormat );

        expect( numberParser instanceof NumberParser ).toBe( true );

        expect( numberParser.locale.baseName ).toEqual( new Intl.Locale( "de" ).baseName );

        expect( numberParser.parse( "1.000,32" ) ).toEqual( 1_000.32 );

        expect( numberParser.percentToDecimal( "75,32" ) ).toEqual( 0.7532 );
    } );

    test( "Convert Percentage to Decimal", () =>
    {
        let value = 75.5;
        expect( pctToDec( value ) ).toEqual( 75.5 / 100 );

        value = "75.5";
        expect( pctToDec( value ) ).toEqual( 75.5 / 100 );

        value = NaN;
        expect( pctToDec( value ) ).toEqual( 0 );
    } );

    test( "Convert Decimal to Percent", () =>
    {
        let value = 0.755;
        expect( decToPct( value ) ).toEqual( value * 100 );

        value = "0.755";
        expect( decToPct( value ) ).toEqual( 0.755 * 100 );

        value = NaN;
        expect( decToPct( value ) ).toEqual( 0 );
    } );

} );