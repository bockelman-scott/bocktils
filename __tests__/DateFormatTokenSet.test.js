const tokenSet = require( "../packages/dates/src/DateFormatTokenSet.cjs" );

const stringUtils = require( "../packages/core/src/StringUtils.cjs" );

const objectUtils = require( "../packages/common/src/ObjectUtils.cjs" );

const dateUtils = require( "../packages/dates/src/DateUtils.cjs" );

const javaTokensData = require( "../__test_data__/JavaDateTokensTestData.json" );

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

const TokenSet = tokenClasses.TokenSet;

const defaultTokenSet = tokenSet.getDefaultTokenSet();

let asString = stringUtils.asString;

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

        expect( token.format( new Date( 2024, 9, 26, 9, 0, 0 ) ) ).toEqual( "AM" );
    } );

    test( "TokenAmPm returns pm after noon", () =>
    {
        const token = new TokenAmPm();

        expect( token.format( new Date( 2024, 9, 26, 11, 0, 0 ) ) ).toEqual( "PM" );
    } );

    test( "TokenAmPm returns pm for noon", () =>
    {
        const token = new TokenAmPm();

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "PM" );
    } );

    test( "TokenAmPm returns am for midnight", () =>
    {
        const token = new TokenAmPm();

        expect( token.format( new Date( 2024, 9, 26, 0, 0, 0 ) ) ).toEqual( "AM" );
    } );

    test( "TokenAmPm returns the specified strings", () =>
    {
        const token = new TokenAmPm( "a", "am", "pm" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "pm" );
        expect( token.format( dateUtils.toMidnight( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "am" );
    } );
} );

describe( "TokenYear", () =>
{
    test( "TokenYear returns 2024 for 2024 when the token is y", () =>
    {
        const token = new TokenYear( "y" );

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 26, 8, 0, 0 ) ) ) ).toEqual( "2024" );
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

        expect( token.format( dateUtils.toNoon( new Date( 2024, 9, 3, 8, 0, 0 ) ) ) ).toEqual( "Thu" );
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

    test( "TokenHour returns 8 when the token is k", () =>
    {
        const token = new TokenHour( "H", 1, 24 );

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

} );

describe( "TokenMinute", () =>
{
    test( "TokenMinute returns 5 when the token is m", () =>
    {
        const token = new TokenMinute( "m" );

        expect( token.format( new Date( 2024, 9, 3, 8, 5, 0 ) ) ).toEqual( "5" );
    } );

    test( "TokenMinute returns 05 when the token is mm", () =>
    {
        const token = new TokenMinute( "mm" );

        expect( token.format( new Date( 2024, 9, 3, 8, 5, 0 ) ) ).toEqual( "05" );
    } );

} );

describe( "TokenSecond", () =>
{
    test( "TokenSecond returns 5 when the token is s", () =>
    {
        const token = new TokenSecond( "s" );

        expect( token.format( new Date( 2024, 9, 3, 8, 5, 5 ) ) ).toEqual( "5" );
    } );

    test( "TokenSecond returns 05 when the token is ss", () =>
    {
        const token = new TokenSecond( "ss" );

        expect( token.format( new Date( 2024, 9, 3, 8, 5, 5 ) ) ).toEqual( "05" );
    } );

} );

describe( "TokenMillisecond", () =>
{
    test( "TokenMillisecond returns 5 when the token is S", () =>
    {
        const token = new TokenMillisecond( "S" );

        expect( token.format( new Date( 2024, 9, 3, 8, 5, 5, 5 ) ) ).toEqual( "5" );
    } );

    test( "TokenSecond returns 05 when the token is ss", () =>
    {
        const token = new TokenMillisecond( "SS" );

        expect( token.format( new Date( 2024, 9, 3, 8, 5, 5, 5 ) ) ).toEqual( "05" );
    } );

    test( "TokenSecond returns 005 when the token is SSS", () =>
    {
        const token = new TokenMillisecond( "SSS" );

        expect( token.format( new Date( 2024, 9, 3, 8, 5, 5, 5 ) ) ).toEqual( "005" );
    } );

} );


describe( "TokenSet Locales", () =>
{
    test( "TokenSet constructed for es locale uses Spanish month names", () =>
    {
        const tokenSet = new TokenSet( "es" );

        expect( tokenSet.monthNames ).toEqual( [
                                                   "enero",
                                                   "febrero",
                                                   "marzo",
                                                   "abril",
                                                   "mayo",
                                                   "junio",
                                                   "julio",
                                                   "agosto",
                                                   "septiembre",
                                                   "octubre",
                                                   "noviembre",
                                                   "diciembre"
                                               ] );

        expect( tokenSet.monthAbbreviations ).toEqual( [
                                                           "ene",
                                                           "feb",
                                                           "mar",
                                                           "abr",
                                                           "may",
                                                           "jun",
                                                           "jul",
                                                           "ago",
                                                           "sept",
                                                           "oct",
                                                           "nov",
                                                           "dic"
                                                       ] );

    } );

    test( "TokenSet constructed for es locale uses Spanish day names", () =>
    {
        const tokenSet = new TokenSet( "es" );

        expect( tokenSet.dayNames ).toEqual( [
                                                 "domingo",
                                                 "lunes",
                                                 "martes",
                                                 "miércoles",
                                                 "jueves",
                                                 "viernes",
                                                 "sábado"
                                             ] );

        expect( tokenSet.dayAbbreviations ).toEqual( [
                                                         "dom",
                                                         "lun",
                                                         "mar",
                                                         "mié",
                                                         "jue",
                                                         "vie",
                                                         "sáb"
                                                     ] );

        expect( tokenSet.dayLetters ).toEqual( [
                                                   "D",
                                                   "L",
                                                   "M",
                                                   "X",
                                                   "J",
                                                   "V",
                                                   "S"
                                               ] );
    } );

    test( "TokenSet constructed for es locale uses Spanish terms for am/pm", () =>
    {
        const tokenSet = new TokenSet( "es" );

        expect( tokenSet.amString ).toEqual( "a. m." );
        expect( tokenSet.pmString ).toEqual( "p. m." );
    } );

    test( "TokenSet constructed for es locale uses Spanish terms for Era", () =>
    {
        const tokenSet = new TokenSet( "es" );

        const eras = tokenSet.eras;

        // AD
        expect( eras[0].name ).toEqual( "d. C." );
        expect( eras[0].longName ).toEqual( "después de Cristo" );

        //BC
        expect( eras[1].name ).toEqual( "a. C." );
        expect( eras[1].longName ).toEqual( "antes de Cristo" );

    } );


} );

describe( "Java Compatibility", () =>
{
    test( "Tokens Produce same values as Java SimpleDateFormat", () =>
    {
        const dates = [].concat( javaTokensData.dates );

        for( let dateObj of dates )
        {
            const date = new Date( dateObj.date );

            const entries = objectUtils.getEntries( dateObj );

            for( let entry of entries )
            {
                const key = entry.key;

                const char = key.slice( 0, 1 );

                if ( !tokenSet.SUPPORTED_TOKENS.includes( char ) )
                {
                    continue;
                }

                if ( ["date", "EE", "S", "SS", "SSS"].includes( key ) )
                {
                    continue;
                }

                const token = defaultTokenSet.getToken( key );

                expect( "For date, " + date + ", " + key + ": " + asString( token instanceof Token ) ).toEqual( "For date, " + date + ", " + key + ": true" );

                expect( "For date, " + date + ", " + key + ": " + token.format( date ) ).toEqual( "For date, " + date + ", " + key + ": " + entry.value );
            }
        }

    } );
} );


