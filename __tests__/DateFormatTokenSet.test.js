const tokenSet = require( "../src/DateFormatTokenSet.cjs" );

const dateUtils = require( "../src/DateUtils.cjs" );

const tokenClasses = tokenSet.classes;

const Token = tokenClasses.Token;
const TokenLiteral = tokenClasses.TokenLiteral;
const TokenEra = tokenClasses.TokenEra;
const TokenAmPm = tokenClasses.TokenAmPm;
const TokenYear = tokenClasses.TokenYear;
const TokenMonth = tokenClasses.TokenMonth;
const TokenMonthDay = tokenClasses.TokenMonthDay;
const TokenDayName = tokenClasses.TokenDayName;
const TokenDayNumber = tokenClasses.TokenDayNumber;
const TokenHour = tokenClasses.TokenHour;
const TokenMinute = tokenClasses.TokenMinute;
const TokenSecond = tokenClasses.TokenSecond;
const TokenMillisecond = tokenClasses.TokenMillisecond;

describe( "TokenLiteral", () =>
{
    test( "TokenLiteral - space returns a space", () =>
    {
        const token = new TokenLiteral( " " );

        expect( token.format( new Date() ) ).toEqual( " " );
    } );

    test( "TokenLiteral - / returns a /", () =>
    {
        const token = new TokenLiteral( "/" );

        expect( token.format( new Date() ) ).toEqual( "/" );
    } );

    test( "TokenLiteral - multiple characters returns all the characters", () =>
    {
        const token = new TokenLiteral( "a bc d" );

        expect( token.format( new Date() ) ).toEqual( "a bc d" );
    } );
} );

describe( "TokenEra", () =>
{
    test( "TokenEra - returns AD for current date", () =>
    {
        const token = new TokenEra();

        expect( token.format( new Date() ) ).toEqual( "AD" );
    } );

    test( "TokenEra - returns BC for prehistoric times", () =>
    {
        const token = new TokenEra();

        expect( token.format( new Date( -1, 0, 0, 0, 0, 0 ) ) ).toEqual( "BC" );
    } );
} );

describe( "TokenAmPm", () =>
{
    test( "TokenAmPm returns am for morning", () =>
    {
        const token = new TokenAmPm();

        expect( token.format( new Date( 2024, 9, 26, 9, 0, 0 ) ) ).toEqual( "am" );
    } );

    test( "TokenAmPm returns pm after noon", () =>
    {
        const token = new TokenAmPm();

        expect( token.format( new Date( 2024, 9, 26, 11, 0, 0 ) ) ).toEqual( "pm" );
    } );

    test( "TokenAmPm returns pm for noon", () =>
    {
        const token = new TokenAmPm();

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "pm" );
    } );

    test( "TokenAmPm returns am for midnight", () =>
    {
        const token = new TokenAmPm();

        expect( token.format( new Date( 2024, 9, 26, 0, 0, 0 ) ) ).toEqual( "am" );
    } );

    test( "TokenAmPm returns the specified strings", () =>
    {
        const token = new TokenAmPm( "a", "AM", "PM" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "PM" );
        expect( token.format( dateUtils.toMidnight( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "AM" );
    } );
} );

describe( "TokenYear", () =>
{
    test( "TokenYear returns 24 for 2024 when the token is y", () =>
    {
        const token = new TokenYear( "y" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "24" );
    } );

    test( "TokenYear returns 24 for 2024 when the token is yy", () =>
    {
        const token = new TokenYear( "yy" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "24" );
    } );

    test( "TokenYear returns 2024 for 2024 when the token is yyy", () =>
    {
        const token = new TokenYear( "yyy" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "2024" );
    } );

    test( "TokenYear returns 2024 for 2024 when the token is yyyy", () =>
    {
        const token = new TokenYear( "yyyy" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "2024" );
    } );

    test( "TokenYear returns 2024 for 2024 when the token is yyyyyyy", () =>
    {
        const token = new TokenYear( "yyyyyyy" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "2024" );
    } );
} );

describe( "TokenMonth", () =>
{
    test( "TokenMonth returns October when the token is MMMM", () =>
    {
        const token = new TokenMonth( "MMMM" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "October" );
    } );

    test( "TokenMonth returns Oct when the token is MMM", () =>
    {
        const token = new TokenMonth( "MMM" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "Oct" );
    } );

    test( "TokenMonth returns '08' when the token is MM", () =>
    {
        const token = new TokenMonth( "MM" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 7, 26, 8, 0, 0 ) ) ) ).toEqual( "08" );
    } );

    test( "TokenMonth returns '8' when the token is M", () =>
    {
        const token = new TokenMonth( "M" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 7, 26, 8, 0, 0 ) ) ) ).toEqual( "8" );
    } );
} );

describe( "TokenMonthDay", () =>
{
    test( "TokenMonthDay returns '3' when the token is d", () =>
    {
        const token = new TokenMonthDay( "d" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "3" );
    } );

    test( "TokenMonthDay returns '03' when the token is dd", () =>
    {
        const token = new TokenMonthDay( "dd" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "03" );
    } );

    test( "TokenMonthDay returns '03' when the token is ddd", () =>
    {
        const token = new TokenMonthDay( "ddd" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "03" );
    } );
} );

describe( "TokenDayName", () =>
{
    test( "TokenDayName returns R when the token is E", () =>
    {
        const token = new TokenDayName( "E" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "R" );
    } );

    test( "TokenDayName returns R when the token is EE", () =>
    {
        const token = new TokenDayName( "EE" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "R" );
    } );

    test( "TokenDayName returns Thurs when the token is EEE", () =>
    {
        const token = new TokenDayName( "EEE" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "Thurs" );
    } );

    test( "TokenDayName returns Thursday when the token is EEEE", () =>
    {
        const token = new TokenDayName( "EEEE" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "Thursday" );
    } );
} );

describe( "TokenDayNumber", () =>
{
    test( "TokenDayNumber returns 4 when the token is u", () =>
    {
        const token = new TokenDayNumber( "u" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "4" );
    } );

    test( "TokenDayNumber returns 04 when the token is uu", () =>
    {
        const token = new TokenDayNumber( "uu" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "04" );
    } );

    test( "TokenDayNumber returns 04 when the token is uuuuu", () =>
    {
        const token = new TokenDayNumber( "uuuuu" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "04" );
    } );

    test( "TokenDayNumber returns 7 when the day is Sunday", () =>
    {
        const token = new TokenDayNumber( "u" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 6, 8, 0, 0 ) ) ) ).toEqual( "7" );
    } );
} );

describe( "TokenHour", () =>
{
    test( "TokenHour returns 8 when the token is H", () =>
    {
        const token = new TokenHour( "H", 0, 23 );

        expect( token.format( new Date( 2024, 9, 3, 8, 0, 0 ) ) ).toEqual( "8" );
    } );

    test( "TokenHour returns 08 when the token is HH", () =>
    {
        const token = new TokenHour( "HH", 0, 23 );

        expect( token.format( new Date( 2024, 9, 3, 8, 0, 0 ) ) ).toEqual( "08" );
    } );

    test( "TokenHour returns 008 when the token is HHH", () =>
    {
        const token = new TokenHour( "HHH", 0, 23 );

        expect( token.format( new Date( 2024, 9, 3, 8, 0, 0 ) ) ).toEqual( "008" );
    } );

    test( "TokenHour returns 9 when the token is k", () =>
    {
        const token = new TokenHour( "H", 1, 24 );

        expect( token.format( new Date( 2024, 9, 3, 8, 0, 0 ) ) ).toEqual( "9" );
    } );

    test( "TokenHour returns 08 when the token is HH", () =>
    {
        const token = new TokenHour( "HH", 0, 23 );

        expect( token.format( new Date( 2024, 9, 3, 8, 0, 0 ) ) ).toEqual( "08" );
    } );

    test( "TokenHour returns 008 when the token is HHH", () =>
    {
        const token = new TokenHour( "HHH", 0, 23 );

        expect( token.format( new Date( 2024, 9, 3, 8, 0, 0 ) ) ).toEqual( "008" );
    } );

} );



