const dateFormatterModule = require( "../src/DateFormatter.cjs" );

const dateUtils = require( "../src/DateUtils.cjs" );

const DateFormatter = dateFormatterModule.DateFormatter;

describe( "DateFormatter", () =>
{
    const date = new Date( 2024, 9, 29, 10, 16 );

    test( "DateFormatter.formatDate with pattern 'MM/dd/yyyy hh:mm:ss'", () =>
    {
        let pattern = "MM/dd/yyyy hh:mm:ss";

        const dateFormatter = new DateFormatter( pattern );

        const formatted = dateFormatter.format( date );

        expect( formatted ).toEqual( "10/29/2024 10:16:00" );
    } );

    test( "DateFormatter.formatDate with pattern 'M/d/yy hh:mm:ss'", () =>
    {
        let pattern = "M/d/yy hh:mm:ss";

        const dateFormatter = new DateFormatter( pattern );

        const formatted = dateFormatter.format( date );

        expect( formatted ).toEqual( "10/29/24 10:16:00" );
    } );
} );
