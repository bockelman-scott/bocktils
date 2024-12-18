const dateFormatterModule = require( "../src/DateFormatter.cjs" );

const constants = require( "@toolbocks/core/src/Constants.cjs" );
const dateUtils = require( "../src/DateUtils.cjs" );

const DateFormatter = dateFormatterModule.DateFormatter;

describe( "DateFormatter", () =>
{
    const date = new Date( 2024, 9, 29, 10, 16 ); // October 29th, 2024 10:16 am

    const date2 = new Date( 2024, 6, 3, 9, 6, 4, 20 ); // July 3rd, 2024 09:06 am

    const date3 = new Date( 2024, 1, 1, 20, 45, 33, 66 ); // February 1st, 2024 08:45:33 pm

    const examples =
        [
            {
                locale: "en-US",
                format: "MM/dd/yyyy hh:mm:ss",
                tests:
                    [
                        { date: date, expected: "10/29/2024 10:16:00" },
                        { date: date2, expected: "07/03/2024 09:06:04" },
                        { date: date3, expected: "02/01/2024 08:45:33" }
                    ]
            },
            {
                locale: "en-US",
                format: "M/d/yy hh:mm:ss",
                tests:
                    [
                        { date: date, expected: "10/29/24 10:16:00" },
                        { date: date2, expected: "7/3/24 09:06:04" },
                        { date: date3, expected: "2/1/24 08:45:33" }
                    ]
            },
            {
                locale: "en-US",
                format: "E, dd MMM yyyy HH:mm:ss",
                tests:
                    [
                        { date: date, expected: "T, 29 Oct 2024 10:16:00" },
                        { date: date2, expected: "W, 03 Jul 2024 09:06:04" },
                        { date: date3, expected: "R, 01 Feb 2024 20:45:33" }
                    ]
            },
            {
                locale: "en-US",
                format: "EEE, d MMMM yy h:m:s a",
                tests:
                    [
                        { date: date, expected: "Tue, 29 October 24 10:16:0 AM" },
                        { date: date2, expected: "Wed, 3 July 24 9:6:4 AM" },
                        { date: date3, expected: "Thu, 1 February 24 8:45:33 PM" }
                    ]
            },
            {
                locale: "es",
                format: "MM/dd/yyyy hh:mm:ss",
                tests:
                    [
                        { date: date, expected: "10/29/2024 10:16:00" },
                        { date: date2, expected: "07/03/2024 09:06:04" },
                        { date: date3, expected: "02/01/2024 08:45:33" }
                    ]
            },
            {
                locale: "es",
                format: "E, dd MMM yyyy HH:mm:ss",
                tests:
                    [
                        { date: date, expected: "M, 29 oct 2024 10:16:00" },
                        { date: date2, expected: "X, 03 jul 2024 09:06:04" },
                        { date: date3, expected: "J, 01 feb 2024 20:45:33" }
                    ]
            },
            {
                locale: "es",
                format: "EEE, d MMMM yy h:m:s a",
                tests:
                    [
                        { date: date, expected: "mar, 29 octubre 24 10:16:0 a." + constants._nbsp + "m." },
                        { date: date2, expected: "mié, 3 julio 24 9:6:4 a. m." },
                        { date: date3, expected: "jue, 1 febrero 24 8:45:33 p. m." }
                    ]
            }
        ];

    test( "DateFormatter.formatDate with pattern 'MM/dd/yyyy hh:mm:ss'", () =>
    {
        let pattern = "MM/dd/yyyy hh:mm:ss";

        const dateFormatter = new DateFormatter( pattern );

        let formatted = dateFormatter.format( date );

        expect( formatted ).toEqual( "10/29/2024 10:16:00" );

        formatted = dateFormatter.format( date2 );

        expect( formatted ).toEqual( "07/03/2024 09:06:04" );
    } );

    test( "DateFormatter.formatDate with pattern 'M/d/yy hh:mm:ss'", () =>
    {
        let pattern = "M/d/yy hh:mm:ss";

        const dateFormatter = new DateFormatter( pattern );

        let formatted = dateFormatter.format( date );

        expect( formatted ).toEqual( "10/29/24 10:16:00" );

        formatted = dateFormatter.format( date2 );

        expect( formatted ).toEqual( "7/3/24 09:06:04" );
    } );

    test( "DateFormatter.formatDate works with the examples given", () =>
    {
        for( let i = 0, n = examples.length; i < n; ++i )
        {
            let example = examples[i];

            let dateFormatter = new DateFormatter( example.format, example.locale );

            let tests = example.tests;

            for( let i = 0, n = tests.length; i < n; ++i )
            {
                let t = tests[i];

                expect( dateFormatter.format( t.date ) ).toEqual( t.expected );
            }
        }
    } );
} );
