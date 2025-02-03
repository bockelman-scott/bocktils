const core = require( "@toolbocks/core" );

const dateParserModule = require( "../src/DateParser.cjs" );

const { constants } = core;

const { DateParser, TimeZone } = dateParserModule;

describe( "DateParser", () =>
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

    test( "DateParser.parse with pattern 'MM/dd/yyyy hh:mm:ss'", () =>
    {
        let pattern = "MM/dd/yyyy hh:mm:ss";

        let formatted = "10/29/2024 10:16:00";

        // pFormat, pLocale, pTokenSet, pOptions
        const dateParser = new DateParser( pattern );

        const parsed = dateParser.parse( formatted );

        expect( parsed ).toEqual( date );
    } );

    test( "DateParser.parse with pattern 'MM/dd/yyyy hh:mm:ss a'", () =>
    {
        let dateTime = new Date( 2024, 9, 29, 22, 16 );

        let pattern = "MM/dd/yyyy hh:mm:ss a";

        let formatted = "10/29/2024 10:16:00 PM";

        // pFormat, pLocale, pTokenSet, pOptions
        const dateParser = new DateParser( pattern );

        const parsed = dateParser.parse( formatted );

        expect( parsed ).toEqual( dateTime );
    } );

    test( "DateParser.parse with pattern 'M/d/yy hh:mm:ss.SSS'", () =>
    {
        let pattern = "M/d/yy hh:mm:ss.SSS";

        let formatted = "7/3/24 09:06:04.020";

        const dateParser = new DateParser( pattern );

        const parsed = dateParser.parse( formatted );

        expect( parsed ).toEqual( date2 );
    } );

    test( "DateParser.parse with pattern 'E, dd MMM yyyy HH:mm:ss'", () =>
    {
        let pattern = "E, dd MMM yyyy HH:mm:ss";

        let formatted = "W, 03 Jul 2024 09:06:04";

        let expected = new Date( date2 );

        const dateParser = new DateParser( pattern );

        const parsed = dateParser.parse( formatted );

        if ( !/\.S+/.test( pattern ) )
        {
            expected.setMilliseconds( 0 );
        }

        if ( !/:s+/.test( pattern ) )
        {
            expected.setSeconds( 0 );
        }

        if ( !/:m+/.test( pattern ) )
        {
            expected.setMinutes( 0 );
        }

        let success = Math.abs( parsed.getTime() - expected.getTime() ) < 500;

        if ( !success && !/a/.test( pattern ) )
        {
            expected.setHours( expected.getHours() - 12 );
        }

        expect( parsed ).toEqual( expected );
    } );

    // E, dd MMM yyyy HH:mm:ss

    test( "DateParser.parse works with the examples given", () =>
    {
        for( let i = 0, n = examples.length; i < n; ++i )
        {
            let example = examples[i];

            const dateParser = new DateParser( example.format, example.locale );

            let tests = example.tests;

            for( let i = 0, n = tests.length; i < n; ++i )
            {
                let t = tests[i];

                const parsed = dateParser.parse( t.expected );

                const expected = new Date( t.date );

                if ( !/\.S+/.test( example.format ) )
                {
                    expected.setMilliseconds( 0 );
                }

                if ( !/:s+/.test( example.format ) )
                {
                    expected.setSeconds( 0 );
                }

                if ( !/:m+/.test( example.format ) )
                {
                    expected.setMinutes( 0 );
                }

                let success = Math.abs( parsed.getTime() - expected.getTime() ) < 500;

                if ( !success && !/a/.test( example.format ) )
                {
                    expected.setHours( expected.getHours() - 12 );

                    success = Math.abs( parsed.getTime() - expected.getTime() ) < 500;
                }

                const results =
                    {
                        locale: example.locale,
                        format: example.format,
                        dateString: t.expected,
                        date: expected.toLocaleString( example.locale ),
                        parsedDate: parsed.toLocaleString( example.locale ),
                        passed: success
                    };

                const expectedResults = Object.assign( {}, results );
                expectedResults.passed = true;

                expect( results ).toEqual( expectedResults );
            }
        }
    } );
} );


describe( "TimeZone", () =>
{
    test( "TimeZone.DATA can be loaded at runtime", async() =>
    {
        console.log( typeof TimeZone );

        await TimeZone.loadTimeZoneData();

        console.log( TimeZone.DATA );

    } );
} );
