/** import the dependencies **/
const constants = require( "../src/Constants.cjs" );

/** import the utilities we are testing */
const stringUtils = require( "../src/StringUtils.cjs" );

const {
    asString,
    asKey,
    isEmpty,
    isBlank,
    asInt,
    toCanonicalNumericFormat,
    findDuplicatedSubstrings,
    findCommonSubstrings,
    includesAll,
    cleanUrl,
    $last,
    $nth
} = stringUtils;

const repoName = "bocktils";

function testAsString( pStr, pTrim, pOptions )
{
    Object.assign( this, constants );
    Object.assign( this, stringUtils );

    return asString( pStr, pTrim, pOptions );
}

let strings = ["abc", "abd", "bcd", "cbd", "dbc", "acb", "dogs", "cats", "lions", "lion", "cat", "Dog", "Cat", "ABC", "AbC", "CAB", "DDD", "CBD", "DBC", "ACb", "DOGS", "DoGs", "CATS", "cAtS", "   abc", "abc   ", "   ", "", "   CAB   "];

describe( "asString", () =>
{
    test( "asString(string) returns the input string",
          () => expect( "abc" === testAsString( "abc" ) ).toBe( true )
    );

    test( "asString(string) returns the input string with whitespace",
          () => expect( " abc " === testAsString( " abc " ) ).toBe( true )
    );

    test( "asString(string, true) returns the trimmed string",
          () => expect( "abc" === testAsString( " abc ", true ) ).toBe( true )
    );

    test( "asString(string, true) returns the trimmed string - with newlines",
          () => expect( "abc" === testAsString( " \nabc\r\n    ", true ) ).toBe( true )
    );

    test( "asString(string, true) returns the trimmed string without removing redundant spaces",
          () => expect( "a  b  c" === testAsString( " a  b  c ", true ) ).toBe( true )
    );

    test( "asString(string, true) returns the numeric string",
          () =>
          {
              expect( "123" === testAsString( " 123 ", true ) ).toBe( true );
          }
    );

    test( "asString(string, true) returns the numeric float string",
          () =>
          {
              expect( "123.45" === testAsString( " 123.45\n", true ) ).toBe( true );
          }
    );

    test( "asString(string, true, {assumeNumeric: true}) returns the numeric string",
          () =>
          {
              expect( testAsString( " 123.45678xyz ", true, { assumeNumeric: true } ) ).toEqual( "123.45678" );
          }
    );

    test( "asString(number) returns the numeric string",
          () =>
          {
              expect( testAsString( 123.456, true, { assumeNumeric: true } ) ).toEqual( "123.456" );
          }
    );

    test( "asString(true) returns the string corresponding to the boolean literal, \"true\"",
          () =>
          {
              expect( testAsString( true ) ).toEqual( "true" );
          }
    );

    test( "asString(false) returns the string corresponding to the boolean literal, \"false\"",
          () =>
          {
              expect( testAsString( false ) ).toEqual( "false" );
          }
    );

    test( "asString([\"a\",\"b\",\"c\"], true, {joinOn:_comma}) returns the string \"abc\"",
          () =>
          {
              let _comma = constants?._comma || ",";

              expect( testAsString( ["a", "b", "c"], true, { joinOn: _comma } ) ).toEqual( "a,b,c" );
          }
    );

    test( "asString([\"a \",\"b \",\"c \"], true, {joinOn:_comma}) returns the string \"abc\"",
          () =>
          {
              let _comma = constants?._comma || ",";

              expect( testAsString( ["a ", "b ", "c "], true, { joinOn: _comma } ) ).toEqual( "a,b,c" );
          }
    );

    test( "asString([\"a \",\"b \",\"c \"], false, {joinOn:_comma}) returns the string \"a ,b ,c \"",
          () =>
          {
              let _comma = constants?._comma || ",";

              expect( testAsString( ["a ", "b ", "c "], false, { joinOn: _comma } ) ).toEqual( "a ,b ,c " );
          }
    );

    test( "asString({}, false) returns the empty object literal",
          () =>
          {
              expect( testAsString( {} ) ).toEqual( "{}" );
          }
    );

    test( "String.prototype.asString",
          () =>
          {
              let s = "abc_xyz";
              let ss = s.asString();
              expect( s === ss ).toBe( true );
          } );

    test( "Number.prototype.asString",
          () =>
          {
              let n = 123.456;
              let s = n.asString();
              expect( s === ("" + n) ).toBe( true );
          } );

    test( "Boolean.prototype.asString, true",
          () =>
          {
              let b = true;
              let s = b.asString();
              expect( s === "true" ).toBe( true ) && expect( "string" === typeof s ).toBe( true );
          } );

    test( "Boolean.prototype.asString, false",
          () =>
          {
              let b = false;
              let s = b.asString();
              expect( "string" === typeof s ).toBe( true ) && expect( s === "false" ).toBe( true );
          } );
} );

class TestStringUtilsClassA
{
    constructor()
    {
        this.foo = "foo";
        this.bar = "bar";
    }
}

class TestStringUtilsClassB extends TestStringUtilsClassA
{
    constructor()
    {
        super();

        this.baz = "baz";
    }
}

function TestFunction()
{
    // nothing here
}

describe( "Objects asString", () =>
{
    test( "asString(TestStringUtilsClassB) returns the empty string",
          () =>
          {
              expect( testAsString( TestStringUtilsClassB ) ).toEqual( "" );
          }
    );

    test( "asString(TestStringUtilsClassB, false, {omitFunctions: false}) returns \"TestStringUtilsClassB\"",
          () =>
          {
              expect( testAsString( TestStringUtilsClassB, false, { omitFunctions: false } ) ).toEqual( "TestStringUtilsClassB" );
          }
    );

    test( "asString(new TestStringUtilsClassB(), false, {omitFunctions: false}) returns TestStringUtilsClassB",
          () =>
          {
              expect( testAsString( new TestStringUtilsClassB() ) ).toEqual( "TestStringUtilsClassB" );
          }
    );

    test( "asString(TestFunction, false, {omitFunctions: false}) returns TestFunction",
          () =>
          {
              expect( testAsString( TestFunction, false, { omitFunctions: false } ) ).toEqual( "TestFunction" );
          }
    );

    test( "asString(Boolean(false)) returns the string corresponding to the boolean literal, \"false\"",
          () =>
          {
              expect( testAsString( Boolean( false ) ) ).toEqual( "false" );
          }
    );

    test( "asString(Boolean(true)) returns the string corresponding to the boolean literal, \"true\"",
          () =>
          {
              expect( testAsString( Boolean( true ) ) ).toEqual( "true" );
          }
    );

    test( "asString(Number(123.321)) returns the string corresponding to the boolean literal, \"123.321\"",
          () =>
          {
              expect( testAsString( Number( 123.321 ) ) ).toEqual( "123.321" );
          }
    );

    let dateFormatter = function( pDate )
    {
        let date = pDate instanceof Date ? new Date( pDate.getTime() ) : "number" === typeof pDate ? new Date( pDate ) : new Date();

        let fullYear = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        return (month + "/" + day + "/" + fullYear).trim();
    };

    test( "asString(new Date(),false, {dateFormatter: dateFormatter}) returns the string corresponding to the boolean literal, \"false\"",
          () =>
          {
              let now = new Date();

              let expected = dateFormatter( now );

              expect( testAsString( now, false, { dateFormatter } ) ).toEqual( expected );
          }
    );

    test( "asString(/^abc\s/) returns the string, \"/^abc\\s/\"",
          () =>
          {
              expect( testAsString( /^abc\s/ ) ).toEqual( "/^abc\\s/" );
          }
    );

    let someObject =
        {
            toString: function()
            {
                return "I am some object";
            }
        };

    test( "asString(someObject) returns the string, \"I am some object\"",
          () =>
          {
              expect( testAsString( someObject ) ).toEqual( "I am some object" );
          }
    );


    let someOtherObject =
        {
            toJson: function()
            {
                return `{"name":"Roger","age":62,"married":true,"children":[{"name":"Kerry","age":23,"married":false,"children":[]}]}`;
            }
        };


    test( "asString(someOtherObject) returns the string, \"{\"name\":\"Roger\",\"age\":62,\"married\":true,\"children\":[{\"name\":\"Kerry\",\"age\":23,\"married\":false,\"children\":[]}]}\"",
          () =>
          {
              expect( testAsString( someOtherObject ) ).toEqual( `{"name":"Roger","age":62,"married":true,"children":[{"name":"Kerry","age":23,"married":false,"children":[]}]}` );
          }
    );
} );

describe( "C-String", () =>
{
    test( "round trip string to and from c-string",
          () =>
          {
              let s = "ABC123 456XYZ";

              let buffer = stringUtils.toCString( s );

              let s2 = stringUtils.fromCString( buffer );

              expect( s2 ).toEqual( s );
          }
    );
} );

describe( "Interpolation", () =>
{

    test( "formatMessage(\"This {0} a {1}, but this {0} {2} in a {3}) returns 'This is a message, but this is not in a bottle'",
          () =>
          {
              let data = ["is", "message", "not", "bottle"];
              let msg = stringUtils.formatMessage( "This {0} a {1}, but this {0} {2} in a {3}", ...data );

              expect( msg ).toEqual( "This is a message, but this is not in a bottle" );
          }
    );

    let verb = "is";
    let noun_1 = "message";
    let negative = "not";
    let noun_2 = "bottle";

    test( `interpolate("This ${verb} a ${noun_1}, but this ${verb} ${negative} in a ${noun_2}) returns 'This is a message, but this is not in a bottle'`,
          () =>
          {
              let scope =
                  {
                      verb,
                      noun_1,
                      noun_2,
                      negative
                  };

              let input = "This ${verb} a ${noun_1}, but this ${verb} ${negative} in a ${noun_2}";

              let msg = stringUtils.interpolate( input, scope );

              expect( msg ).toEqual( "This is a message, but this is not in a bottle" );
          }
    );
} );

describe( "validIdentifier", () =>
{
    test( "validIdentifier( '0xyz' ) return 'xyz",
          () =>
          {
              let s = "0xyz";

              expect( stringUtils.validIdentifier( s ) ).toEqual( "xyz" );
          }
    );

    test( "validIdentifier('xyz/a') return 'xyza'",
          () =>
          {
              let s = "xyz/a";

              expect( stringUtils.validIdentifier( s ) ).toEqual( "xyza" );
          }
    );
} );

describe( "asKey", () =>
{
    test( "asKey(0) == \"0\"", () => expect( asKey( 0 ) ).toEqual( 0 ) );

    test( "asKey(123) == \"123\"", () => expect( asKey( 123 ) ).toEqual( 123 ) );

    test( "asKey(/123/) == \"123\"", () => expect( asKey( "/123/" ) ).toEqual( "\"123\"" ) );
} );

describe( "isEmpty", () =>
{
    test( "isEmpty(\"abc\") is false", () => expect( isEmpty( "abc" ) ).toBe( false ) );

    test( "isEmpty(\"\") is true", () => expect( isEmpty( "" ) ).toBe( true ) );

    test( "isEmpty(\" \") is false", () => expect( isEmpty( " " ) ).toBe( false ) );
} );

describe( "isBlank", () =>
{
    test( "isBlank(\" \") is true", () => expect( isBlank( " " ) ).toBe( true ) );

    test( "isBlank(\"\\r\\n \\t\") is true", () => expect( isBlank( "\r\n  \t" ) ).toBe( true ) );
} );

describe( "Detecting Capitalization", () =>
{
    test( "isAllCaps(ABC) is true", () => expect( stringUtils.isAllCaps( "ABC" ) ).toBe( true ) );

    test( "isAllCaps(AbC) is false", () => expect( stringUtils.isAllCaps( "AbC" ) ).toEqual( false ) );

    test( "isNoCaps(ABC) is false", () => expect( stringUtils.isNoCaps( "ABC" ) ).toBe( false ) );

    test( "isNoCaps(AbC) is false", () => expect( stringUtils.isNoCaps( "AbC" ) ).toEqual( false ) );

    test( "isNoCaps(abc) is true", () => expect( stringUtils.isNoCaps( "abc" ) ).toEqual( true ) );

    test( "isNoCaps(abc0) is false", () => expect( stringUtils.isNoCaps( "abc0" ) ).toEqual( true ) );

    test( "isAllCaps(ABC0, {allowDigits: false}) is false", () => expect( stringUtils.isAllCaps( "ABC0", { allowDigits: false } ) ).toEqual( false ) );

    test( "isAllCaps(ABC0, {allowDigits: true}) is true", () => expect( stringUtils.isAllCaps( "ABC0", { allowDigits: true } ) ).toEqual( true ) );
} );


describe( "Changing Capitalization", () =>
{
    test( "capitalize( 'abc' ) === 'Abc'", () =>
    {
        expect( stringUtils.capitalize( "abc" ) ).toEqual( "Abc" );
    } );

    test( "capitalize( 'onError' ) === 'Onerror'", () =>
    {
        expect( stringUtils.capitalize( "onError" ) ).toEqual( "Onerror" );
    } );

    test( "capitalize( 'onError', true ) === 'OnError'", () =>
    {
        expect( stringUtils.capitalize( "onError", true ) ).toEqual( "OnError" );
    } );

    test( "capitalize( 123 ) === '123'", () =>
    {
        expect( stringUtils.capitalize( 123 ) ).toEqual( "123" );
    } );

    test( "capitalize( true ) === 'True'", () =>
    {
        expect( stringUtils.capitalize( true ) ).toEqual( "True" );
    } );


    test( "uncapitalize( 'Error' ) === 'error'", () =>
    {
        expect( stringUtils.uncapitalize( "Error" ) ).toEqual( "error" );
    } );

    test( "uncapitalize( 'OnError' ) === 'onError'", () =>
    {
        expect( stringUtils.uncapitalize( "OnError" ) ).toEqual( "onError" );
    } );

} );

describe( "Numeric-related 'helpers'", () =>
{
    test( "occurrencesOf('abcbc','c') === 2 ",
          () =>
          {
              let s = "abcbc";
              let count = stringUtils.occurrencesOf( s, "c" );
              expect( count ).toEqual( 2 );
          }
    );

    test( "occurrencesOf('abcbc','d') === 0 ",
          () =>
          {
              let s = "abcbc";
              let count = stringUtils.occurrencesOf( s, "d" );
              expect( count ).toEqual( 0 );
          }
    );

    test( "occurrencesOf('1,000.00',',') === 1 ",
          () =>
          {
              let s = "1,000.00";
              let count = stringUtils.occurrencesOf( s, "," );
              expect( count ).toEqual( 1 );

              count = stringUtils.occurrencesOf( s, "." );
              expect( count ).toEqual( 1 );

              count = stringUtils.occurrencesOf( s, "0" );
              expect( count ).toEqual( 5 );
          }
    );

    test( "calculateDecimalSymbols('de')",
          () =>
          {
              const decimalSymbols = stringUtils.calculateDecimalSymbols( "de" );

              expect( decimalSymbols?.grouping_separator ).toEqual( "." );
              expect( decimalSymbols?.decimal_point ).toEqual( "," );
          }
    );

    test( "toCanonicalNumericFormat removes grouping separators",
          () =>
          {
              let s = "1,234.567";

              s = toCanonicalNumericFormat( s );

              expect( s ).toEqual( "1234.567" );

              expect( parseFloat( s ) ).toEqual( 1_234.567 );
          }
    );

    test( "toCanonicalNumericFormat corrects for suspicious mismatch between input and locale",
          () =>
          {
              let s = "1.234.567,89";

              s = toCanonicalNumericFormat( s );

              expect( s ).toEqual( "1234567.89" );

              expect( stringUtils.asFloat( s ) ).toEqual( 1_234_567.89 );
          }
    );

    test( "toCanonicalNumericFormat respects corrected options",
          () =>
          {
              const options =
                  {
                      decimal_point: ",",
                      grouping_separator: ".",
                      currency_symbol: /\$|USD/
                  };

              let s = "1.234.567,89";

              s = toCanonicalNumericFormat( s, options );

              expect( s ).toEqual( "1234567.89" );

              expect( stringUtils.asFloat( s, 0, options ) ).toEqual( 1_234_567.89 );
          }
    );

} );

describe( "leftOf", () =>
{
    test( "leftOf('abc','c') === 'ab' ",
          () =>
          {
              let s = "abc";
              let lo = stringUtils.leftOf( s, "c", false );
              expect( lo ).toEqual( "ab" );
          }
    );

    test( "leftOf('abcdef','c') === 'ab' ",
          () =>
          {
              let s = "abcdef";
              let lo = stringUtils.leftOf( s, "c" );
              expect( lo ).toEqual( "ab" );
          }
    );

    test( "leftOf('abcdef','a') === '' ",
          () =>
          {
              let s = "abcdef";
              let lo = stringUtils.leftOf( s, "a" );
              expect( lo ).toEqual( "" );
          }
    );
} );

describe( "leftOfLast", () =>
{
    test( "leftOfLast('abcabc','c') === 'abcab' ",
          () =>
          {
              let s = "abcabc";
              let lo = stringUtils.leftOfLast( s, "c", false );
              expect( lo ).toEqual( "abcab" );
          }
    );

    test( "leftOfLast('abcdef','a') === '' ",
          () =>
          {
              let s = "abcdef";
              let lo = stringUtils.leftOfLast( s, "a" );
              expect( lo ).toEqual( "" );
          }
    );
} );

describe( "rightOf", () =>
{
    test( "rightOf('abcdef','c') === 'def'",
          () =>
          {
              let s = "abcdef";
              let ro = stringUtils.rightOf( s, "c" );
              expect( ro ).toEqual( "def" );
          }
    );
} );

describe( "rightOfLast", () =>
{
    test( "rightOfLast('abcdefabcxyz','c') === 'xyz'",
          () =>
          {
              let s = "abcdefabcxyz";
              let ro = stringUtils.rightOfLast( s, "c" );
              expect( ro ).toEqual( "xyz" );
          }
    );

    test( "rightOfLast('abcdefabcxyz','c') === 'xyz'",
          () =>
          {
              let s = "abcdefabcxyz";
              let ro = stringUtils.rightOfLast( s, "c" );
              expect( ro ).toEqual( "xyz" );
          }
    );
} );

describe( "isJson", () =>
{
    test( "isJson('{}')",
          () =>
          {
              const s = "{}";
              expect( stringUtils.isJson( s ) ).toBe( true );
          }
    );

    test( "isJson('[]')",
          () =>
          {
              const s = "[]";
              expect( stringUtils.isJson( s ) ).toBe( true );
          }
    );

    test( "isJson(null)",
          () =>
          {
              const s = null;
              expect( stringUtils.isJson( s ) ).toBe( false );
          }
    );
} );

describe( "trimming", () =>
{
    test( "trimLeadingCharacters('0005010') === '5010'",
          () =>
          {
              let s = "005010";
              expect( stringUtils.trimLeadingCharacters( s ) ).toBe( "5010" );
          }
    );

    test( "trimLeadingCharacters('xxx5010', 'x') === '5010'",
          () =>
          {
              let s = "xxx5010";
              expect( stringUtils.trimLeadingCharacters( s, "x" ) ).toBe( "5010" );
          }
    );

    test( "trimMatchingChars(' abc abc xyz abc ', ' ', {} ) === ",
          () =>
          {
              expect( stringUtils.trimMatchingChars( " abc abc xyz abc ", " ", {} ) ).toBe( "abc abc xyz abc" );
          }
    );

    test( "trimMatchingChars(' abc abc xyz abc ', ' ', { leading: false, trailing: true, anywhere: false, case_sensitive: true } ) === ",
          () =>
          {
              expect( stringUtils.trimMatchingChars( " abc abc xyz abc ", " ",
                                                     {
                                                         leading: false,
                                                         trailing: true,
                                                         anywhere: false,
                                                         case_sensitive: true
                                                     } ) ).toBe( " abc abc xyz abc" );
          }
    );

    test( "trimMatchingChars(' abc abc xyz abc ', ' ', { leading: true, trailing: false, anywhere: false, case_sensitive: true } ) === ",
          () =>
          {
              expect( stringUtils.trimMatchingChars( " abc abc xyz abc ", " ",
                                                     {
                                                         leading: true,
                                                         trailing: false,
                                                         anywhere: false,
                                                         case_sensitive: true
                                                     } ) ).toBe( "abc abc xyz abc " );
          }
    );

    test( "trimMatchingChars(' abc abc xyz abc ', ' ', { leading: true, trailing: true, anywhere: true, case_sensitive: true } ) === ",
          () =>
          {
              expect( stringUtils.trimMatchingChars( " abc abc xyz abc ", " ",
                                                     {
                                                         leading: true,
                                                         trailing: true,
                                                         anywhere: true,
                                                         case_sensitive: true
                                                     } ) ).toBe( "abcabcxyzabc" );
          }
    );
} );

describe( "asInt", () =>
{
    test( "asInt (leading zero)",
          () =>
          {
              let s = "01";
              let n = asInt( s );
              expect( n ).toEqual( 1 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (from float)",
          () =>
          {
              let s = 12.57;
              let n = asInt( s );
              expect( n ).toEqual( 13 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (from float, rounded down)",
          () =>
          {
              let s = 12.34;
              let n = asInt( s );
              expect( n ).toEqual( 12 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (from boolean, true)",
          () =>
          {
              let s = true;
              let n = asInt( s );
              expect( n ).toEqual( 1 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (from boolean, false)",
          () =>
          {
              let s = false;
              let n = asInt( s );
              expect( n ).toEqual( 0 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (octal)",
          () =>
          {
              let s = "0o012.34";
              let n = asInt( s );
              expect( n ).toEqual( 10 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (hexadecimal)",
          () =>
          {
              let s = "0x004";
              let n = asInt( s );
              expect( n ).toEqual( 4 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (hexadecimal)",
          () =>
          {
              let s = "0x009b";
              let n = asInt( s );
              expect( n ).toEqual( 155 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (unparseable), defaults to zero",
          () =>
          {
              let s = "not~a~number";
              let n = asInt( s );
              expect( n ).toEqual( 0 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asInt (unparseable), defaults to -1",
          () =>
          {
              let s = "not~a~number";
              let n = asInt( s, -1 );
              expect( n ).toEqual( -1 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "String.prototype.asInt() === ",
          () =>
          {
              let s = "123";
              let n = s.asInt();
              expect( n ).toEqual( 123 ) && expect( "number" === typeof n );
          } );

    test( "Number.prototype.asInt() === ",
          () =>
          {
              let s = 123.45;
              let n = s.asInt();
              expect( n ).toEqual( 123 ) && expect( "number" === typeof n );
          } );

    test( "Number.prototype.asInt() === ",
          () =>
          {
              let s = 123.57;
              let n = s.asInt();
              expect( n ).toEqual( 124 ) && expect( "number" === typeof n );
          } );

    test( "Boolean.prototype.asInt() === ",
          () =>
          {
              let s = Boolean( true );
              let n = s.asInt();
              expect( n ).toEqual( 1 ) && expect( "number" === typeof n );
          } );

} );

describe( "asFloat", () =>
{
    test( "asFloat (leading zero)",
          () =>
          {
              let s = "01";
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 1.0 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (from float)",
          () =>
          {
              let s = 12.57;
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 12.57 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (from float, no rounding)",
          () =>
          {
              let s = 12.34;
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 12.34 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (from boolean, true)",
          () =>
          {
              let s = true;
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 1.0 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (from Boolean.TRUE)",
          () =>
          {
              let s = Boolean( true );
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 1.0 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "Boolean.prototype.asFloat()",
          () =>
          {
              let s = Boolean( true );
              let n = s.asFloat();
              expect( n ).toEqual( 1.0 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (from boolean, false)",
          () =>
          {
              let s = false;
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 0.0 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (octal)",
          () =>
          {
              let s = "0o012.34";
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 10.4375 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (hexadecimal)",
          () =>
          {
              let s = "0x004";
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 4.00 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (hexadecimal)",
          () =>
          {
              let s = "0x009b";
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 155.00 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (unparseable), defaults to zero",
          () =>
          {
              let s = "not~a~number";
              let n = stringUtils.asFloat( s );
              expect( n ).toEqual( 0.0 ) && expect( typeof n ).toBe( "number" );
          }
    );

    test( "asFloat (unparseable), defaults to -1",
          () =>
          {
              let s = "not~a~number";
              let n = stringUtils.asFloat( s, -1 );
              expect( n ).toEqual( -1.0 ) && expect( typeof n ).toBe( "number" );
          }
    );
} );

describe( "safeIndex", () =>
{
    test( "safeIndex(8, 'abcdef', { defaultToEnd: false }",
          () =>
          {
              expect( stringUtils.safeIndex( 8, "abcdef", { defaultToEnd: false } ) ).toEqual( 0 );
          } );


    test( "safeIndex(8, 'abcdef', { defaultToEnd: true }",
          () =>
          {
              expect( stringUtils.safeIndex( 8, "abcdef", { defaultToEnd: true } ) ).toEqual( 5 );
          } );

    test( "safeIndex(6, 'abcdefghi', { defaultToEnd: false, min:3, max:11 }",
          () =>
          {
              expect( stringUtils.safeIndex( 6, "abcdefghi", { defaultToEnd: true, min: 5, max: 11 } ) ).toEqual( 6 );
          } );

    test( "safeIndex(3, 'abcdefghi', { defaultToEnd: false, min:5, max:11 }",
          () =>
          {
              expect( stringUtils.safeIndex( 3, "abcdefghi", { defaultToEnd: false, min: 5, max: 11 } ) ).toEqual( 5 );
          } );

    test( "safeIndex(15, 'abcdefghi', { defaultToEnd: false, min:3, max:5 }",
          () =>
          {
              expect( stringUtils.safeIndex( 15, "abcdefghi", { defaultToEnd: false, min: 5, max: 11 } ) ).toEqual( 5 );
          } );
} );

describe( "endsWithAny", () =>
{
    test( "endsWithAny - expected true",
          () =>
          {
              let s = "abcdef";
              expect( stringUtils.endsWithAny( s, ["a", "bcd", "ef", "def"] ) ).toBe( true );
          } );

    test( "endsWithAny - expected false",
          () =>
          {
              let s = "abcdef";
              expect( stringUtils.endsWithAny( s, ["a", "bcd", "fgh", "hij"] ) ).toBe( false );
          } );

    test( "endsWithAny('',[]) === true",
          () =>
          {
              let s = "";
              expect( stringUtils.endsWithAny( s, [] ) ).toBe( true );
          } );

} );

describe( "startsWithAny", () =>
{
    test( "startsWithAny - expected true",
          () =>
          {
              let s = "abcdef";
              expect( stringUtils.startsWithAny( s, ["a", "abc", "ef", "def"] ) ).toBe( true );
          } );

    test( "startsWithAny - expected false",
          () =>
          {
              let s = "abcdef";
              expect( stringUtils.startsWithAny( s, ["bcd", "fgh", "hij"] ) ).toBe( false );
          } );

    test( "startsWithAny('',[]) === true",
          () =>
          {
              let s = "";
              expect( stringUtils.startsWithAny( s, [] ) ).toBe( true );
          } );
} );

describe( "includesAny", () =>
{
    test( "includesAny - expected true",
          () =>
          {
              let s = "abcdef";
              expect( stringUtils.includesAny( s, ["ef", "def"] ) ).toBe( true );
          } );

    test( "includesAny - expected false",
          () =>
          {
              let s = "abcdef";
              expect( stringUtils.includesAny( s, ["cba", "fgh", "hij"] ) ).toBe( false );
          } );

    test( "includesAny('',[]) === true",
          () =>
          {
              let s = "";
              expect( stringUtils.includesAny( s, [] ) ).toBe( true );
          } );
} );

describe( "includesAll", () =>
{
    test( "includesAll - expected true",
          () =>
          {
              let s = "abcdef";
              expect( includesAll( s, ["a", "ef", "def"] ) ).toBe( true );
          } );

    test( "includesAll - expected false",
          () =>
          {
              let s = "abcdef";
              expect( includesAll( s, ["a", "bcd", "fgh", "hij"] ) ).toBe( false );
          } );

    test( "includesAll('',[]) === true",
          () =>
          {
              let s = "";
              expect( includesAll( s, [] ) ).toBe( true );
          } );
} );

describe( "toBool", () =>
{
    test( "evaluateBoolean( true ) === true",
          () =>
          {
              let val = true;
              let b = stringUtils.evaluateBoolean( val );
              expect( b ).toBe( true );
          } );

    test( "evaluateBoolean( false ) === false",
          () =>
          {
              let val = false;
              let b = stringUtils.evaluateBoolean( val );
              expect( b ).toBe( false );
          } );

    test( "evaluateBoolean( 1 ) === true",
          () =>
          {
              let val = 1;
              let b = stringUtils.evaluateBoolean( val );
              expect( b ).toBe( true );
          } );

    test( "evaluateBoolean( -1 ) === false",
          () =>
          {
              let val = -1;
              let b = stringUtils.evaluateBoolean( val );
              expect( b ).toBe( false );
          } );

    test( "evaluateBoolean( 'enabled' ) === true",
          () =>
          {
              let val = "enabled";
              let b = stringUtils.evaluateBoolean( val );
              expect( b ).toBe( true );
          } );

    test( "evaluateBoolean( 'eNabLed' ) === true",
          () =>
          {
              let val = "eNabLed";
              let b = stringUtils.evaluateBoolean( val );
              expect( b ).toBe( true );
          } );

    test( "evaluateBoolean( 'On' ) === true",
          () =>
          {
              let val = "On";
              let b = stringUtils.evaluateBoolean( val );
              expect( b ).toBe( true );
          } );

    /*
     test( "Boolean(true).evaluate === true",
     () =>
     {
     let b = (new Boolean( true )).evaluate();
     expect( b ).toBe( true );
     } );

     test( "Boolean(false).evaluate === false",
     () =>
     {
     let b = (new Boolean( false )).evaluate();
     expect( b ).toBe( false );
     } );
     */
} );

describe( "Line breaks", () =>
{
    test( "toUnixLinebreaks",
          () =>
          {
              let path = "a\r\nb\r\nc\r\n";
              let unixPath = stringUtils.toUnixLinebreaks( path );
              expect( unixPath === "a\nb\nc\n" ).toBe( true );
          } );

    test( "toUnixLinebreaks - with leading",
          () =>
          {
              let path = "\r\na\r\nb\r\nc\r\n";
              let unixPath = stringUtils.toUnixLinebreaks( path );
              expect( unixPath === "\na\nb\nc\n" ).toBe( true );
          } );

    test( "toUnixLinebreaks - without cr",
          () =>
          {
              let path = "a\nb\nc\n";
              let unixPath = stringUtils.toUnixLinebreaks( path );
              expect( unixPath === "a\nb\nc\n" ).toBe( true );
          } );

    test( "toWindowsLinebreaks",
          () =>
          {
              let path = "a\nb\nc\n";
              let winPath = stringUtils.toWindowsLinebreaks( path );
              expect( winPath === "a\r\nb\r\nc\r\n" ).toBe( true );
          } );

    test( "toWindowsLinebreaks - with leading",
          () =>
          {
              let path = "\na\nb\r\nc\n";
              let winPath = stringUtils.toWindowsLinebreaks( path );
              expect( winPath === "\r\na\r\nb\r\nc\r\n" ).toBe( true );
          } );

    test( "toWindowsLinebreaks - already windows",
          () =>
          {
              let path = "a\r\nb\r\nc\r\n";
              let winPath = stringUtils.toWindowsLinebreaks( path );
              expect( winPath === "a\r\nb\r\nc\r\n" ).toBe( true );
          } );

    test( "toWindowsLinebreaks - mixed and unordered breaks",
          () =>
          {
              let path = "a\nb\rc\n\r";
              let winPath = stringUtils.toWindowsLinebreaks( path );
              expect( winPath === "a\r\nb\r\nc\r\n" ).toBe( true );
          } );
} );

describe( "Paths", () =>
{
    test( "toUnixPath",
          () =>
          {
              let path = "G:\\My Drive\\Projects";
              let filepath = stringUtils.toUnixPath( path );
              expect( filepath ).toEqual( "G:/My\ Drive/Projects" );
          } );

    test( "toUnixPath - and read directory",
          () =>
          {
              const user_name = require( "os" ).userInfo().username;
              let path = `C:\\Users\\${user_name}\\OneDrive\\Documents`;
              let filepath = stringUtils.toUnixPath( path );

              expect( filepath ).toEqual( `C:/Users/${user_name}/OneDrive/Documents` );

              let fs = require( "fs" );
              let dir = fs.readdirSync( filepath, { encoding: "utf8" } );

              expect( dir?.length > 0 ).toBe( true );
          } );

    test( "isRelativePath",
          () =>
          {
              let path = `..\\..\\..Documents`;
              expect( stringUtils.isRelativePath( path ) ).toBe( true );
          } );

    test( "isRelativePath",
          () =>
          {
              let path = `..`;
              expect( stringUtils.isRelativePath( path ) ).toBe( true );
          } );

    test( "toAbsolutePath",
          () =>
          {
              let path = "../src/StringUtils.cjs";
              let absolutePath = stringUtils.toAbsolutePath( path, __dirname );
              expect( absolutePath ).toEqual( `C:/Projects/${repoName}/packages/core/src/StringUtils.cjs` );
          } );
} );

describe( "isValidString", () =>
{
    test( "isValidString - 1",
          () =>
          {
              let s = "";
              expect( stringUtils.isValidString( s ) ).toBe( false );
          } );

    test( "isValidString - 2",
          () =>
          {
              let s = "abc";
              expect( stringUtils.isValidString( s ) ).toBe( true );
          } );

    test( "isValidString - 3",
          () =>
          {
              let s = "void";
              expect( stringUtils.isValidString( s, true, false ) ).toBe( false );
          } );

    test( "isValidString - 4",
          () =>
          {
              let s = "void";
              expect( stringUtils.isValidString( s, true, true ) ).toBe( true );
          } );

    test( "isValidString - 5",
          () =>
          {
              let s = "null";
              expect( stringUtils.isValidString( s, true, false ) ).toBe( false );
          } );
} );

describe( "isValidJson", () =>
{
    test( "isValidJsonObject - 1",
          () =>
          {
              let s = "{}";
              expect( stringUtils.isValidJsonObject( s ) ).toBe( true );
          } );

    test( "isValidJsonObject - 2",
          () =>
          {
              let s = "{\"a\":\"1\"}";
              expect( stringUtils.isValidJsonObject( s ) ).toBe( true );
          } );

    test( "isValidJsonObject - 3",
          () =>
          {
              let s = "[]";
              expect( stringUtils.isValidJsonObject( s ) ).toBe( false );
          } );

    test( "isValidJsonObject - 4",
          () =>
          {
              let s = "abc";
              expect( stringUtils.isValidJsonObject( s ) ).toBe( false );
          } );

    test( "isValidJsonObject - 5",
          () =>
          {
              let s = "{\"a\":\"1\"}";
              expect( stringUtils.isValidJsonObject( s, true ) ).toBe( true );
          } );

    test( "isValidJsonObject - 6",
          () =>
          {
              let s = "{\"a\"\"1\"}";
              expect( stringUtils.isValidJsonObject( s, true ) ).toBe( false );
          } );

    test( "isValidJsonArray - 1",
          () =>
          {
              let s = "{}";
              expect( stringUtils.isValidJsonArray( s ) ).toBe( false );
          } );

    test( "isValidJsonArray - 2",
          () =>
          {
              let s = "[\"a\",\"1\"]";
              expect( stringUtils.isValidJsonArray( s ) ).toBe( true );
          } );

    test( "isValidJsonArray - 3",
          () =>
          {
              let s = "{}";
              expect( stringUtils.isValidJsonArray( s ) ).toBe( false );
          } );

    test( "isValidJsonArray - 4",
          () =>
          {
              let s = "abc";
              expect( stringUtils.isValidJsonArray( s ) ).toBe( false );
          } );

    test( "isValidJsonArray - 5",
          () =>
          {
              let s = "[1,\"a\"]";
              expect( stringUtils.isValidJsonArray( s, true ) ).toBe( true );
          } );

    test( "isValidJsonArray - 6",
          () =>
          {
              let s = "[1\"a\"]";
              expect( stringUtils.isValidJsonArray( s, true ) ).toBe( false );
          } );

    test( "isValidJson - 1",
          () =>
          {
              let s = "[1,\"a\"]";
              expect( stringUtils.isValidJson( s ) ).toBe( true );
          } );

    test( "isValidJson - 2",
          () =>
          {
              let s = "[1\"a\"]";
              expect( stringUtils.isValidJson( s ) ).toBe( true );
          } );

    test( "isValidJson - 3",
          () =>
          {
              let s = "[1\"a\"]";
              expect( stringUtils.isValidJson( s, { testJson: true } ) ).toBe( false );
          } );
} );

describe( "isValidNumber or Numeric", () =>
{
    test( "isValidNumber('a') === false",
          () =>
          {
              let s = "a";
              expect( stringUtils.isValidNumber( s ) ).toBe( false );
          } );

    test( "isValidNumber('1') === false",
          () =>
          {
              let s = "1";
              expect( stringUtils.isValidNumber( s ) ).toBe( false );
          } );

    test( "isValidNumeric('1') === true",
          () =>
          {
              let s = "1";
              expect( stringUtils.isValidNumeric( s ) ).toBe( true );
          } );
} );

describe( "lcase is shorthand for toLowerCase()", () =>
{
    test( "lcase('ABC') === 'abc'",
          () =>
          {
              let s = "ABC";
              expect( stringUtils.lcase( s ) ).toEqual( "abc" );
          } );

    test( "lcase('abc') === 'abc'",
          () =>
          {
              let s = "abc";
              expect( stringUtils.lcase( s ) ).toEqual( "abc" );
          } );

    test( "lcase('123') === '123'",
          () =>
          {
              let s = "123";
              expect( stringUtils.lcase( s ) ).toEqual( "123" );
          } );

    test( "lcase(123) === '123'",
          () =>
          {
              let n = 123;
              expect( stringUtils.lcase( n ) ).toEqual( "123" );
          } );
} );

describe( "ucase is shorthand for toUpperCase()", () =>
{
    test( "ucase('ABC') === 'ABC'",
          () =>
          {
              let s = "ABC";
              expect( stringUtils.ucase( s ) ).toEqual( "ABC" );
          } );

    test( "ucase('abc') === 'ABC'",
          () =>
          {
              let s = "abc";
              expect( stringUtils.ucase( s ) ).toEqual( "ABC" );
          } );

    test( "ucase('123') === '123'",
          () =>
          {
              let s = "123";
              expect( stringUtils.ucase( s ) ).toEqual( "123" );
          } );

    test( "ucase(123) === '123'",
          () =>
          {
              let n = 123;
              expect( stringUtils.ucase( n ) ).toEqual( "123" );
          } );
} );

describe( "toProperCase", () =>
{
    test( "toProperCase('courtney thorne-smith') === 'Courtney Thorne-Smith'",
          () =>
          {
              let s = "courtney thorne-smith";
              expect( stringUtils.toProperCase( s ) ).toEqual( "Courtney Thorne-Smith" );
          } );

    test( "toProperCase('thomas o\'neil') === 'Thomas O\'Neil'",
          () =>
          {
              let s = "thomas o'neil";
              expect( stringUtils.toProperCase( s ) ).toEqual( "Thomas O'Neil" );
          } );

    test( "toProperCase('mac mcnamara') === 'Mac McNamara'",
          () =>
          {
              let s = "mac mcnamara";
              expect( stringUtils.toProperCase( s ) ).toEqual( "Mac McNamara" );
          } );
} );

describe( "toCamelCase", () =>
{
    test( "toCamelCase('a_variable_name') === 'aVariableName'",
          () =>
          {
              let s = "a_variable_name";
              expect( stringUtils.toCamelCase( s ) ).toEqual( "aVariableName" );
          } );

    test( "toCamelCase('a__variable__name') === 'aVariableName'",
          () =>
          {
              let s = "a__variable__name";
              expect( stringUtils.toCamelCase( s ) ).toEqual( "aVariableName" );
          } );

    test( "toCamelCase('A_Variable_Name') === 'aVariableName'",
          () =>
          {
              let s = "A_Variable_Name";
              expect( stringUtils.toCamelCase( s ) ).toEqual( "aVariableName" );
          } );
} );

describe( "toSnakeCase", () =>
{
    test( "toSnakeCase('aVariableName') === 'a_variable_name'",
          () =>
          {
              let s = "aVariableName";
              expect( stringUtils.toSnakeCase( s ) ).toEqual( "a_variable_name" );
          } );

    test( "toSnakeCase('a_Variable_Name') === 'a_variable_name'",
          () =>
          {
              let s = "a_Variable_Name";
              expect( stringUtils.toSnakeCase( s ) ).toEqual( "a_variable_name" );
          } );

    test( "toSnakeCase('A__Variable__Name') === 'a_variable_name'",
          () =>
          {
              let s = "A__Variable__Name";
              expect( stringUtils.toSnakeCase( s ) ).toEqual( "a_variable_name" );
          } );
} );

describe( "copyString prevents variable aliases", () =>
{
    test( "copyString('abc') === 'abc'",
          () =>
          {
              let s = "abc";
              expect( stringUtils.copyString( s ) ).toEqual( "abc" );
          } );

    test( "copyString('  abc  ') === '  abc  '",
          () =>
          {
              let s = "  abc  ";
              expect( stringUtils.copyString( s ) ).toEqual( "  abc  " );
          } );

    test( "copyString('abc') === 'abc', but not the *same*",
          () =>
          {
              // make a string
              let s = "abc";

              // make a 'copy' of the variable; one might think that s1 simply points to s
              let s1 = s;

              // make a 'copy' of the string in variable s
              // this is unnecessary, as we will prove below
              let s2 = stringUtils.copyString( s );

              // add characters to s1 (this actually creates a new String)
              s1 += "def";

              expect( s !== s1 && s === s2 && s2 !== s1 ).toBe( true );
          } );
} );

describe( "isUnpopulated", () =>
{
    test( "isUnpopulated('') === true",
          () =>
          {
              let s = "";
              expect( stringUtils.isUnpopulated( s ) ).toBe( true );
          } );

    test( "isUnpopulated(new String('')) === true",
          () =>
          {
              let s = new String( "" );
              expect( stringUtils.isUnpopulated( s ) ).toBe( true );
          } );

    test( "isUnpopulated(new String('abc')) === false",
          () =>
          {
              let s = new String( "abc" );
              expect( stringUtils.isUnpopulated( s ) ).toBe( false );
          } );

    test( "isUnpopulated(789) === true",
          () =>
          {
              let s = 789;
              expect( stringUtils.isUnpopulated( s ) ).toBe( true );
          } );

    test( "isUnpopulated({}) === true",
          () =>
          {
              let s = {};
              expect( stringUtils.isUnpopulated( s ) ).toBe( true );
          } );
} );

describe( "reverseString", () =>
{
    test( "reverseString('a b c d E f g H') === 'H g f E d c b a'",
          () =>
          {
              let s = "a b c d E f g H";
              expect( stringUtils.reverseString( s ) ).toEqual( "H g f E d c b a" );
          } );
} );

describe( "tidy is a supercharged function with many options", () =>
{
    test( "tidy('abc') === 'abc'",
          () =>
          {
              let s = "abc";
              expect( stringUtils.tidy( s ) ).toEqual( "abc" );
          } );

    test( "tidy(' abc ') === 'abc'",
          () =>
          {
              let s = " abc ";
              expect( stringUtils.tidy( s ) ).toEqual( "abc" );
          } );

    test( "tidy(' abc ', {trim:false}) === ' abc '",
          () =>
          {
              let s = " abc ";
              expect( stringUtils.tidy( s, { trim: false } ) ).toEqual( " abc " );
          } );

    test( "tidy(' Abc ', {lowercase:true}) === 'abc'",
          () =>
          {
              let s = " Abc ";
              expect( stringUtils.tidy( s, { lowercase: true } ) ).toEqual( "abc" );
          } );

    test( "tidy(' Abc ', {trim:false, lowercase:true}) === 'abc'",
          () =>
          {
              let s = " Abc ";
              expect( stringUtils.tidy( s, { trim: false, lowercase: true } ) ).toEqual( " abc " );
          } );

    test( "tidy('  A  b c  ', {removeRedundantSpaces:true, lowercase:true}) === 'a b c'",
          () =>
          {
              expect( stringUtils.tidy( "  A  b c  ", {
                  removeRedundantSpaces: true,
                  lowercase: true
              } ) ).toEqual( "a b c" );
          } );

    test( "tidy('  A  b c  ', {removeRedundantSpaces:true, uppercase:true}) === 'A B C'",
          () =>
          {
              expect( stringUtils.tidy( "  A  b c  ", {
                  removeRedundantSpaces: true,
                  uppercase: true
              } ) ).toEqual( "A B C" );
          } );

    test( "tidy('A\tb\tc', {removeRedundantSpaces:false, replaceTabsWithSpaces:true, lowercase: true}) === 'a b c'",
          () =>
          {
              let s = "A\tb\tc";
              expect( stringUtils.tidy( s, {
                  removeRedundantSpaces: false,
                  replaceTabsWithSpaces: true,
                  lowercase: true
              } ) ).toEqual( "a    b    c" );
          } );

    test( "tidy('A\tb\tc', {removeRedundantSpaces:false, replaceTabsWithSpaces:true, lowercase: true, spacesPerTab:2}) === 'a b c'",
          () =>
          {
              let s = "A\tb\tc";
              expect( stringUtils.tidy( s, {
                  removeRedundantSpaces: false,
                  replaceTabsWithSpaces: true,
                  lowercase: true,
                  spacesPerTab: 2
              } ) ).toEqual( "a  b  c" );
          } );

    test( "tidy('A\tb\tc', {replaceTabsWithSpaces:true, lowercase: true, spacesPerTab:1}) === 'a b c'",
          () =>
          {
              let s = "A\tb\tc";
              expect( stringUtils.tidy( s, {
                  replaceTabsWithSpaces: true,
                  lowercase: true,
                  spacesPerTab: 1
              } ) ).toEqual( "a b c" );
          } );

    test( "tidy('A\tb\tc', {replaceTabsWithSpaces:true, removeRedundantSpaces:false, trim:false}) === '    A    b    c '",
          () =>
          {
              let s = "\tA\tb\tc ";
              expect( stringUtils.tidy( s,
                                        {
                                            replaceTabsWithSpaces: true,
                                            removeRedundantSpaces: false,
                                            trim: false
                                        } ) ).toEqual( "    A    b    c " );
          } );

    test( "tidy(' A    b  c ', {replaceSpacesWithTabs:true,removeRedundantSpaces:true}) === 'A b c'",
          () =>
          {
              let s = " A    b  c ";
              expect( stringUtils.tidy( s, { replaceSpacesWithTabs: true, spacesPerTab: 4 } ) ).toEqual( "A b c" );
          } );

    test( "tidy(' A    b  c ', {replaceSpacesWithTabs:true, removeRedundantSpaces:false}) === 'A\tb  c'",
          () =>
          {
              let s = " A    b  c ";
              expect( stringUtils.tidy( s,
                                        {
                                            replaceSpacesWithTabs: true,
                                            removeRedundantSpaces: false
                                        } ) ).toEqual( "A\tb  c" );
          } );

    const padString = function( pStr )
    {
        return pStr.padStart( 5, "*" );
    };

    test( "tidy('Abc', {functions:[padString]}) === '**Abc'",
          () =>
          {
              let s = "Abc";
              expect( stringUtils.tidy( s, { functions: [padString] } ) ).toEqual( "**Abc" );
          } );

    const noOp = function()
    {
        return "doesn't matter";
    };

    test( "tidy('Abc', {functions:[noOp]}) === 'Abc'",
          () =>
          {
              let s = "Abc";
              expect( stringUtils.tidy( s, { functions: [noOp] } ) ).toEqual( "Abc" );
          } );

    const reverse = function( pStr )
    {
        return stringUtils.reverseString( pStr );
    };

    test( "tidy('Abc', {functions:[reverse]}) === 'cbA'",
          () =>
          {
              let s = "Abc";
              expect( stringUtils.tidy( s, { functions: [reverse] } ) ).toEqual( "cbA" );
          } );
} );

describe( "findDuplicatedSubstrings", () =>
{
    test( "findDuplicatedSubstrings in a path or list", () =>
    {
        let s = "a/b/c/a/b/c/d/e/a/b/c";

        let commonSubstrings = findDuplicatedSubstrings( s );

        expect( commonSubstrings[0] ).toEqual( "/a/b/c" );
        expect( commonSubstrings[1] ).toEqual( "a/b/c/" );

        commonSubstrings = findDuplicatedSubstrings( s, { ignored: ["/"] } );

        expect( commonSubstrings ).toEqual( ["a", "b", "c"] );

        s = "apple,apples,applesauce,banana,snapple,band,bandaid,banana split,banana pudding,";

        commonSubstrings = findDuplicatedSubstrings( s );

        expect( commonSubstrings[0] ).toEqual( ",banana " );

        commonSubstrings = findDuplicatedSubstrings( s, { ignored: [",", " "] } );

        expect( commonSubstrings.slice( 0, 2 ) ).toEqual( ["apples", "banana"] );

    } );

    test( "findDuplicatedSubstrings without regard to case", () =>
    {
        let s = "a/b/c/A/B/c/d/e/a/b/C";

        let commonSubstrings = findDuplicatedSubstrings( s );

        expect( commonSubstrings[0] ).toEqual( "a/b/" );

        commonSubstrings = findDuplicatedSubstrings( s, { ignoreCase: true } );

        expect( commonSubstrings[0] ).toEqual( "/A/B/c" );
        expect( commonSubstrings[1] ).toEqual( "a/b/c/" );
    } );

} );

describe( "cleanUrl", () =>
{
    test( "cleanUrl preserves protocol", () =>
    {
        let url = "https://some.domain.com/some_page/1/2/3?a=b#xyz";

        let clean = cleanUrl( url );

        expect( clean ).toEqual( url );
    } );

    test( "cleanUrl preserves case", () =>
    {
        let url = "https://Some.Domain.com/Some_Page/1/2/3?a=b#xyz";

        let clean = cleanUrl( url );

        expect( clean ).toEqual( url );
    } );

    test( "cleanUrl can change to lower case", () =>
    {
        let url = "https://some.domain.com/Some_Page/1/2/3?a=b#xyz";

        let clean = cleanUrl( url, true, true, false );

        expect( clean ).toEqual( "https://some.domain.com/some_page/1/2/3?a=b#xyz" );
    } );

    test( "cleanUrl can discard protocol", () =>
    {
        let url = "https://some.domain.com/Some_Page/1/2/3?a=b#xyz";

        let clean = cleanUrl( url, true, false, true );

        expect( clean ).toEqual( "some.domain.com/Some_Page/1/2/3?a=b#xyz" );
    } );

    test( "cleanUrl can discard a trailing slash", () =>
    {
        let url = "https://some.domain.com/Some_Page/";

        let clean = cleanUrl( url, false );

        expect( clean ).toEqual( "https://some.domain.com/Some_Page" );
    } );
    /*
     test( "cleanUrl can handle file:// protocol", () =>
     {
     let url = "file://";

     let clean = cleanUrl( url, false );

     expect( clean ).toEqual( "" );
     } );
     */

} );

describe( "findCommonSubstrings", () =>
{
    test( "findCommonSubstrings in a set of strings", () =>
    {
        let strings = ["abcdefg", "bcde", "defghi"];

        const commonSubstrings = findCommonSubstrings( strings );

        expect( commonSubstrings ).toEqual( ["de", "d"] );
    } );

    test( "findCommonSubstrings in a set of Address Line 1", () =>
    {
        let strings = ["2760 South Highland Ave", "2760 South Highland Ave"];

        let lengths = strings.map( e => e.length );

        let maxLength = Math.max( ...lengths );

        let minLength = Math.min( ...lengths );

        let avg = (minLength + maxLength) / 2;

        let threshold = asInt( 0.50 * avg );

        let commonSubstrings = findCommonSubstrings( strings );

        commonSubstrings = commonSubstrings.filter( e => e.length > threshold );

        // expect( commonSubstrings ).toEqual( ["de", "d"] );
    } );

} );