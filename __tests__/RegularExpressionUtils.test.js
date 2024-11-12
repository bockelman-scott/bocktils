const rxUtils = require( "../src/RegularExpressionUtils.cjs" );

const RE = rxUtils.REGULAR_EXPRESSIONS;

const MatchesHelper = rxUtils.classes.MatchesHelper;

describe( "FLAGS", () =>
{
    test( "FLAGS matches valid/supported RegExp flags",
          () =>
          {
              expect( Object.values( rxUtils.FLAGS ).join( "" ) ).toEqual( "gidsmyu" );
          } );

    test( "VALID_FLAGS returns an array of valid/supported RegExp flags",
          () =>
          {
              expect( rxUtils.VALID_FLAGS ).toEqual( ["g", "i", "d", "s", "m", "y", "u"] );
          } );

    test( "cleanFlags returns only valid/supported RegExp flags as string",
          () =>
          {
              expect( rxUtils.cleanFlags( "abcdefghijklmnop" ) ).toEqual( "gidm" );
          } );

    test( "cleanFlags returns only valid/supported RegExp flags as string",
          () =>
          {
              expect( rxUtils.cleanFlags( ...(("abcdefghijklmnop").split( "" )) ) ).toEqual( "gidm" );
          } );
} );

describe( "REGULAR_EXPRESSIONS", () =>
{
    test( "REGEX matches a regular expression literal",
          () =>
          {
              const literal = `/abc/gi`;
              const rx = RE.REGEX;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( /abc/gi ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

          } );

    test( "DOT matches a single literal dot",
          () =>
          {
              const literal = `.`;
              const rx = RE.DOT;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( "a.b.c".split( rx ) ).toEqual( ["a", "b", "c"] );
          } );

    test( "DOUBLE_SLASH matches repeated slashes",
          () =>
          {
              const literal = `a//b//c`;
              const rx = RE.DOUBLE_SLASH;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["a", "b", "c"] );
          } );

    test( "LEADING_NEWLINE matches one or more newlines at the start of a string",
          () =>
          {
              const linuxLiteral = "\n\na\nb\nc\n";

              const windowsLiteral = "\r\n\r\na\r\nb\r\nc\r\n";

              const rx = RE.LEADING_NEWLINE;

              expect( rx.test( linuxLiteral ) ).toBe( true );

              expect( rx.test( windowsLiteral ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( linuxLiteral.replace( rx, "" ) ).toEqual( "a\nb\nc\n" );

              expect( windowsLiteral.replace( rx, "" ) ).toEqual( "a\r\nb\r\nc\r\n" );
          } );

    test( "TRAILING_NEWLINE matches one or more newlines at the end of a string",
          () =>
          {
              const linuxLiteral = "\n\na\nb\nc\n";

              const windowsLiteral = "\r\n\r\na\r\nb\r\nc\r\n";

              const rx = RE.TRAILING_NEWLINE;

              expect( rx.test( linuxLiteral ) ).toBe( true );

              expect( rx.test( windowsLiteral ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( linuxLiteral.replace( rx, "" ) ).toEqual( "\n\na\nb\nc" );

              expect( windowsLiteral.replace( rx, "" ) ).toEqual( "\r\n\r\na\r\nb\r\nc" );
          } );

    test( "TRAILING_SEMICOLON matches one or more semicolons at the end of a string",
          () =>
          {
              const linuxLiteral = "\n\na\nb\nc;\n";

              const windowsLiteral = "\r\n\r\na\r\nb\r\nc;\r\n";

              const rx = RE.TRAILING_SEMICOLON;

              expect( rx.test( linuxLiteral ) ).toBe( true );

              expect( rx.test( windowsLiteral ) ).toBe( true );

              expect( rx.test( "ab;c" ) ).toBe( false );

              expect( linuxLiteral.replace( rx, "" ) ).toEqual( "\n\na\nb\nc" );

              expect( windowsLiteral.replace( rx, "" ) ).toEqual( "\r\n\r\na\r\nb\r\nc" );
          } );

    test( "LEADING_WHITESPACE matches one or more whitespace characters at the start of string",
          () =>
          {
              const linuxLiteral = "\t\n \na\nb\nc\n\t ";

              const windowsLiteral = "\t\r\n \r\na\r\nb\r\nc\r\n\t ";

              const rx = RE.LEADING_WHITESPACE;

              expect( rx.test( linuxLiteral ) ).toBe( true );

              expect( rx.test( windowsLiteral ) ).toBe( true );

              expect( rx.test( "a b c " ) ).toBe( false );

              expect( linuxLiteral.replace( rx, "" ) ).toEqual( "a\nb\nc\n\t " );

              expect( windowsLiteral.replace( rx, "" ) ).toEqual( "a\r\nb\r\nc\r\n\t " );
          } );

    test( "TRAILING_WHITESPACE matches one or more whitespace characters at the end of string",
          () =>
          {
              const linuxLiteral = "\t\n \na\nb\nc\n\t ";

              const windowsLiteral = "\t\r\n \r\na\r\nb\r\nc\r\n\t ";

              const rx = RE.TRAILING_WHITESPACE;

              expect( rx.test( linuxLiteral ) ).toBe( true );

              expect( rx.test( windowsLiteral ) ).toBe( true );

              expect( rx.test( " a b c" ) ).toBe( false );

              expect( linuxLiteral.replace( rx, "" ) ).toEqual( "\t\n \na\nb\nc" );

              expect( windowsLiteral.replace( rx, "" ) ).toEqual( "\t\r\n \r\na\r\nb\r\nc" );
          } );

    test( "VARIABLE_TOKEN_START matches ${ at the start of a string",
          () =>
          {
              const a = "a";

              const s = "${a}";

              const interpolated = `${a}`;

              const rx = RE.VARIABLE_TOKEN_START;

              expect( rx.test( s ) ).toBe( true );

              expect( rx.test( interpolated ) ).toBe( false );

              expect( interpolated ).toEqual( "a" );
          } );

    test( "VARIABLE_TOKEN_END matches '}' of a string",
          () =>
          {
              const a = "a";

              const s = "${a}";

              const interpolated = `${a}`;

              const rx = RE.VARIABLE_TOKEN_END;

              expect( rx.test( s ) ).toBe( true );

              expect( rx.test( interpolated ) ).toBe( false );

              expect( interpolated ).toEqual( "a" );
          } );

    test( "VARIABLE_TOKEN matches ${...} anywhere in a string",
          () =>
          {
              const a = "a";

              const s = "The first lowercase letter of the latin alphabet is '${a}'.";

              const interpolated = `The first lowercase letter of the latin alphabet is '${a}'.`;

              const rx = RE.VARIABLE_TOKEN;

              expect( rx.test( s ) ).toBe( true );

              expect( rx.test( interpolated ) ).toBe( false );

              expect( interpolated ).toEqual( "The first lowercase letter of the latin alphabet is 'a'." );
          } );

    test( "INTEGER matches one or more digits in a string",
          () =>
          {
              const rx = RE.INTEGER;

              expect( rx.test( "abc123" ) ).toBe( true );

              expect( rx.test( "123" ) ).toBe( true );

              expect( rx.test( "-123" ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( rx.test( "123.456" ) ).toBe( true );

              let matches = rx.exec( "abc123d5" );

              expect( matches[0] ).toEqual( "123" );

              expect( matches[1] ).toEqual( "123" );

              matches = rx.exec( "123.456" );

              expect( matches[0] ).toEqual( "123" );

              expect( matches[1] ).toEqual( "123" );

              matches = rx.exec( "-123.456" );

              expect( matches[0] ).toEqual( "-123" );

              expect( matches[1] ).toEqual( "-123" );
          } );

    test( "VALID_INTEGER matches a string if it is  representation of a valid whole number",
          () =>
          {
              const rx = RE.VALID_INTEGER;

              expect( rx.test( "" ) ).toBe( false );

              expect( rx.test( "123" ) ).toBe( true );

              expect( rx.test( " 123" ) ).toBe( false );

              expect( rx.test( "123 " ) ).toBe( false );

              expect( rx.test( "-123" ) ).toBe( true );

              expect( rx.test( "+123" ) ).toBe( false );
          } );

    test( "FLOAT matches one or more digits in a string",
          () =>
          {
              const rx = RE.FLOAT;

              expect( rx.test( "abc123" ) ).toBe( true );

              expect( rx.test( "123" ) ).toBe( true );

              expect( rx.test( "-123" ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( rx.test( "123.456" ) ).toBe( true );

              expect( rx.test( "-123.456" ) ).toBe( true );

              let matches = rx.exec( "abc123.456d7" );

              expect( matches[0] ).toEqual( "123.456" );

              expect( matches[1] ).toEqual( "123.456" );

              expect( matches[2] ).toEqual( ".456" );

              matches = rx.exec( "123.456.789" );

              expect( matches[0] ).toEqual( "123.456" );

              expect( matches[1] ).toEqual( "123.456" );

              expect( matches[2] ).toEqual( ".456" );

              matches = rx.exec( "-123.456.789" );

              expect( matches[0] ).toEqual( "-123.456" );

              expect( matches[1] ).toEqual( "-123.456" );

              expect( matches[2] ).toEqual( ".456" );
          } );

    test( "VALID_FLOAT matches a string if it is a representation of a valid number",
          () =>
          {
              const rx = RE.VALID_FLOAT;

              expect( rx.test( "" ) ).toBe( false );

              expect( rx.test( "123" ) ).toBe( true );

              expect( rx.test( " 123" ) ).toBe( false );

              expect( rx.test( "123 " ) ).toBe( false );

              expect( rx.test( "-123" ) ).toBe( true );

              expect( rx.test( "+123" ) ).toBe( false );


              expect( rx.test( "123.456" ) ).toBe( true );

              expect( rx.test( "123.456.789" ) ).toBe( false );

              expect( rx.test( "123 .456" ) ).toBe( false );

              expect( rx.test( "-123.456" ) ).toBe( true );

              expect( rx.test( "+123.456" ) ).toBe( false );

              expect( rx.test( "-123.456.789" ) ).toBe( false );

          } );

    test( "SLASH matches '/' anywhere in a string",
          () =>
          {
              const literal = "a/b/c";

              const rx = RE.SLASH;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["a", "b", "c"] );

              expect( literal.replace( rx, "" ) ).toEqual( "ab/c" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "" ) ).toEqual( "abc" );
          } );

    test( "LEADING_OR_TRAILING_SLASH matches '/' at the start or end of a string",
          () =>
          {
              const literal = "/a/b/c/";

              const rx = RE.LEADING_OR_TRAILING_SLASH;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["", "a/b/c", ""] );

              expect( literal.replace( rx, "" ) ).toEqual( "a/b/c/" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "" ) ).toEqual( "a/b/c" );
          } );

    test( "BACKSLASH matches '\' anywhere in a string",
          () =>
          {
              const literal = "a\\b\\c";

              const rx = RE.BACKSLASH;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["a", "b", "c"] );

              expect( literal.replace( rx, "" ) ).toEqual( "ab\\c" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "" ) ).toEqual( "abc" );
          } );

    test( "DOLLAR_SYMBOL matches '/' anywhere in a string",
          () =>
          {
              const literal = "a$b$c";

              const rx = RE.DOLLAR_SYMBOL;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["a", "b", "c"] );

              expect( literal.replace( rx, "" ) ).toEqual( "ab$c" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "" ) ).toEqual( "abc" );
          } );

    test( "EXTENSION matches a file name extension",
          () =>
          {
              const literal = "a/b/c/filename.ext";

              const rx = RE.EXTENSION;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              const matches = rx.exec( literal );

              expect( matches[0] ).toEqual( ".ext" );

              const helper = MatchesHelper.execute( rx, literal );

              expect( helper.getText( 0 ) ).toEqual( ".ext" );
          } );

    test( "ASSIGNMENT_OPERATOR matches = or : anywhere in a string",
          () =>
          {
              const literal = "{a:1}";

              const varDeclaration = "const a = 1;";

              const rx = RE.ASSIGNMENT_OPERATOR;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( varDeclaration ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["{a", "1}"] );

              expect( varDeclaration.split( rx ) ).toEqual( ["const a ", " 1;"] );
          } );

    test( "SEPARATOR matches '/' anywhere in a string",
          () =>
          {
              const literal = "a,b,c;d,e,f";

              const rx = RE.SEPARATOR;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["a", "b", "c", "d", "e", "f"] );

              expect( literal.replace( rx, "" ) ).toEqual( "ab,c;d,e,f" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "" ) ).toEqual( "abcdef" );
          } );

    test( "WINDOWS_NEWLINE matches '\r\n' anywhere in a string",
          () =>
          {
              const literal = "a\nb\r\nc";

              const rx = RE.WINDOWS_NEWLINE;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "a\nbc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["a\nb", "c"] );

              expect( literal.replace( rx, "" ) ).toEqual( "a\nbc" );
          } );

    test( "NEWLINE matches '\n' anywhere in a string",
          () =>
          {
              const literal = "a\nb\r\nc";

              const rx = RE.NEWLINE;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "a\r\nbc" ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["a", "b\r", "c"] );

              expect( literal.replace( rx, "" ) ).toEqual( "ab\r\nc" );
          } );

    test( "REDUNDANT_NEWLINES matches multiple line breaks anywhere in a string",
          () =>
          {
              const literal = "a\nb\r\nc\n\n\nd\r\n\r\n\r\ne\r\nf\n\ng";

              const rx = RE.REDUNDANT_NEWLINES;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "a\nbc" ) ).toBe( false );

              expect( literal.replace( rx, "\n" ) ).toEqual( "a\nb\r\nc\nd\r\n\r\n\r\ne\r\nf\n\ng" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "\n" ) ).toEqual( "a\nb\r\nc\nd\ne\r\nf\ng" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "\r\n" ) ).toEqual( "a\nb\r\nc\r\nd\r\ne\r\nf\r\ng" );
          } );

    test( "SIMPLE_FUNCTION_SIGNATURE matches a function signature anywhere in a string",
          () =>
          {
              const literal = "const x = 1;\n\nfunction Test( pArg1, pArg2 )\n{\nconsole.log(pArg1, pArg2);\n}";

              const rx = RE.SIMPLE_FUNCTION_SIGNATURE;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "a\nbc" ) ).toBe( false );

              const matches = rx.exec( literal );

              expect( matches[1] ).toEqual( "function" );
              expect( matches[2] ).toEqual( "Test" );
              expect( matches[3] ).toEqual( " pArg1, pArg2 " );
          } );

    test( "SIMPLE_ASYNC_FUNCTION_SIGNATURE matches an asynchronous function signature anywhere in a string",
          () =>
          {
              const syncFunction = "const x = 1;\n\nfunction Test( pArg1, pArg2 )\n{\nconsole.log(pArg1, pArg2);\n}";

              const asyncFunction = "const x = 1;\n\nasync function Test( pArg1, pArg2 )\n{\nconsole.log(pArg1, pArg2);\n}";

              const rx = RE.SIMPLE_ASYNC_FUNCTION_SIGNATURE;

              expect( rx.test( syncFunction ) ).toBe( false );

              expect( rx.test( asyncFunction ) ).toBe( true );

              const matches = rx.exec( asyncFunction );

              expect( matches[1] ).toEqual( "async" );
              expect( matches[2] ).toEqual( "function" );
              expect( matches[3] ).toEqual( "Test" );
              expect( matches[4] ).toEqual( " pArg1, pArg2 " );
          } );


    test( "NON_INTEGER_DIGIT matches any non-digit character anywhere in a string",
          () =>
          {
              const literal = "abc123def456";

              const rx = RE.NON_INTEGER_DIGIT;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "a\nbc" ) ).toBe( true );

              expect( rx.test( " " ) ).toBe( true );

              expect( rx.test( "0" ) ).toBe( false );

              expect( literal.replace( rx, "" ) ).toEqual( "bc123def456" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "" ) ).toEqual( "123456" );
          } );


    test( "NON_DIGIT matches any non-digit or decimal-point character anywhere in a string",
          () =>
          {
              const literal = "abc1.23def45.6";

              const rx = RE.NON_DIGIT;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "a\nbc" ) ).toBe( true );

              expect( rx.test( " " ) ).toBe( true );

              expect( rx.test( "." ) ).toBe( false );

              expect( literal.replace( rx, "" ) ).toEqual( "bc1.23def45.6" );

              expect( literal.replaceAll( RE.get( rx, "g" ), "" ) ).toEqual( "1.2345.6" );
          } );

    test( "LEFT_TRIM matches any space characters at the start of a string",
          () =>
          {
              const literal = "  \nabc\n   ";

              const rx = RE.LEFT_TRIM;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( rx.test( " " ) ).toBe( true );

              expect( literal.replace( rx, "" ) ).toEqual( "\nabc\n   " );
          } );

    test( "RIGHT_TRIM matches any space characters at the end of a string",
          () =>
          {
              const literal = "  \nabc\n   ";

              const rx = RE.RIGHT_TRIM;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( rx.test( " " ) ).toBe( true );

              expect( literal.replace( rx, "" ) ).toEqual( "  \nabc\n" );
          } );

    test( "LEFT_TRIM_WHITESPACE matches any whitespace characters at the start of a string",
          () =>
          {
              const literal = "  \nabc\n   ";

              const rx = RE.LEFT_TRIM_WHITESPACE;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( true );

              expect( rx.test( "abc\n" ) ).toBe( false );

              expect( rx.test( " " ) ).toBe( true );

              expect( literal.replace( rx, "$1" ) ).toEqual( "abc\n   " );
          } );

    test( "RIGHT_TRIM_WHITESPACE matches any whitespace characters at the start of a string",
          () =>
          {
              const literal = "  \nabc\n   ";

              const rx = RE.RIGHT_TRIM_WHITESPACE;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( true );

              expect( rx.test( "\nabc" ) ).toBe( false );

              expect( rx.test( " " ) ).toBe( true );

              expect( literal.replace( rx, "$1" ) ).toEqual( "  \nabc" );
          } );

    test( "REDUNDANT_SPACE matches any repeated spaces in a string",
          () =>
          {
              const literal = "a  b c  ";

              const rx = RE.REDUNDANT_SPACE;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( rx.test( "\n\nabc\n\n" ) ).toBe( false );

              expect( rx.test( "  " ) ).toBe( true );

              expect( literal.replace( rx, " " ) ).toEqual( "a b c  " );

              expect( literal.replaceAll( RE.get( rx, "g" ), " " ) ).toEqual( "a b c " );
          } );

    test( "REDUNDANT_WHITESPACE matches any repeated whitespace in a string",
          () =>
          {
              const literal = "a  b c\n\n  ";

              const rx = RE.REDUNDANT_WHITESPACE;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( rx.test( "\n\nabc\n\n" ) ).toBe( true );

              expect( rx.test( "\n " ) ).toBe( true );

              expect( literal.replace( rx, " " ) ).toEqual( "a b c\n\n  " );

              expect( literal.replaceAll( RE.get( rx, "g" ), " " ) ).toEqual( "a b c " );
          } );

    test( "OPEN_PAREN matches the ( character anywhere in a string",
          () =>
          {
              const literal = "3 + (6 / 2) - 1";

              const rx = RE.OPEN_PAREN;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( literal.replace( rx, "" ) ).toEqual( "3 + 6 / 2) - 1" );
          } );

    test( "START_OPEN_PAREN matches the ( character only at the start of a string",
          () =>
          {
              const literal = "3 + (6 / 2) - 1";

              const literal2 = "(6 / 2) + 3 - 1";

              const rx = RE.START_OPEN_PAREN;

              expect( rx.test( literal ) ).toBe( false );

              expect( rx.test( literal2 ) ).toBe( true );

              expect( literal.replace( rx, "" ) ).toEqual( "3 + (6 / 2) - 1" );

              expect( literal2.replace( rx, "" ) ).toEqual( "6 / 2) + 3 - 1" );
          } );

    test( "CLOSE_PAREN matches the ) character anywhere in a string",
          () =>
          {
              const literal = "3 + (6 / 2) - 1";

              const rx = RE.CLOSE_PAREN;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( literal.replace( rx, "" ) ).toEqual( "3 + (6 / 2 - 1" );
          } );

    test( "END_CLOSE_PAREN matches the ) character only at the end of a string",
          () =>
          {
              const literal = "3 + (6 / 2) - 1";

              const literal2 = "(6 / 2) + (3 - 1)";

              const rx = RE.END_CLOSE_PAREN;

              expect( rx.test( literal ) ).toBe( false );

              expect( rx.test( literal2 ) ).toBe( true );

              expect( literal.replace( rx, "" ) ).toEqual( "3 + (6 / 2) - 1" );

              expect( literal2.replace( rx, "" ) ).toEqual( "(6 / 2) + (3 - 1" );
          } );

    test( "MATHS_OPERATORS matches any of the simple mathematics operators anywhere in a string",
          () =>
          {
              const literal = " 3 + 2 - 1";

              const rx = RE.MATHS_OPERATORS;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );
          } );

    test( "MATHS_EXPRESSION matches a simple mathematics expression anywhere in a string",
          () =>
          {
              const literal = " (3 + 2) - 1";

              const rx = RE.MATHS_EXPRESSION;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\n(abc)\n" ) ).toBe( false );

              // expect( rx.test( "(6 / 2) + (3 - 1" ) ).toBe( false );
          } );

    test( "QUERY_STRING_SEPARATOR matches the ? in a URL",
          () =>
          {
              const literal = "/github.com/project?published=true";

              const rx = RE.QUERY_STRING_SEPARATOR;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["/github.com/project", "published=true"] );
          } );

    test( "QUESTION_MARK matches any literal question mark ?",
          () =>
          {
              const literal = "Does this test pass?";

              const rx = RE.QUESTION_MARK;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["Does this test pass", ""] );
          } );

    test( "URL_LOCATION_HASH_SEPARATOR matches the # character",
          () =>
          {
              const literal = "/github.com/project#header";

              const rx = RE.URL_LOCATION_HASH_SEPARATOR;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["/github.com/project", "header"] );
          } );

    test( "HASH matches the # character",
          () =>
          {
              const literal = "/github.com/project#header";

              const rx = RE.HASH;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["/github.com/project", "header"] );
          } );

    test( "LEADING_HASH matches # at the start of a string",
          () =>
          {
              const literal = "/github.com/project?published=true";

              const rx = RE.LEADING_HASH;

              expect( rx.test( literal ) ).toBe( false );

              expect( rx.test( "#trending" ) ).toBe( true );
          } );

    test( "LEADING_DOT matches . at the start of a string",
          () =>
          {
              const literal = ".5";

              const rx = RE.LEADING_DOT;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "0.5" ) ).toBe( false );
          } );

    test( "TRAILING_DOT matches . at the end of a string",
          () =>
          {
              const literal = "This is a sentence.";

              const rx = RE.TRAILING_DOT;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "Is this is a sentence?" ) ).toBe( false );
          } );

    test( "LEADING_SLASH matches / at the start of a string",
          () =>
          {
              const literal = "/path/to/file/";

              const rx = RE.LEADING_SLASH;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "path/to/file/" ) ).toBe( false );

              expect( literal.replace( rx, "" ) ).toEqual( "path/to/file/" );
          } );

    test( "TRAILING_SLASH matches / at the start of a string",
          () =>
          {
              const literal = "/path/to/file/";

              const rx = RE.TRAILING_SLASH;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "/path/to/file" ) ).toBe( false );

              expect( literal.replace( rx, "" ) ).toEqual( "/path/to/file" );
          } );

    test( "ARTIFACTS matches 'null', 'void', or 'undefined' anywhere in a string",
          () =>
          {
              const literal = String( null );

              const rx = RE.ARTIFACTS;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "abc" ) ).toBe( false );

              let a = undefined;

              expect( rx.test( "" + a ) ).toBe( true );

              function abc() {}

              expect( rx.test( abc() ) ).toBe( true );

              expect( literal.replace( rx, "" ) ).toEqual( "" );
          } );

    test( "EXTENSION_MATCH matches and captures a file extension at the end of a string",
          () =>
          {
              const literal = "/path/to/file/filename.test.ext";

              const rx = RE.EXTENSION_MATCH;

              const matches = rx.exec( literal );

              expect( matches[0] ).toEqual( ".test.ext" );

              expect( matches[1] ).toEqual( ".test.ext" );

              expect( matches[2] ).toEqual( ".ext" );

              expect( matches[3] ).toEqual( "." );
          } );

    test( "COPYRIGHT_COMMENT matches a block comment that is likely a copyright statement",
          () =>
          {
              const comment = `/**
  Copyright (c) 2015, 2024, BizCo and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://some.link.com/licenses/
*/`;

              const rx = RE.COPYRIGHT_COMMENT;

              expect( rx.test( comment ) ).toBe( true );

              expect( rx.test( "/path/to/file" ) ).toBe( false );

              expect( rx.test( `/** 
              some other block comment
              */` ) ).toBe( false );

              expect( comment.replace( rx, "" ) ).toEqual( "" );
          } );

    test( "FUNCTION_SIGNATURE matches and captures elements of a function signature",
          () =>
          {
              const func = function funky( pArgA, pArgB )
              {
                  return pArgA + pArgB;
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.FUNCTION_SIGNATURE;

              const matches = rx.exec( literal );

              expect( matches[0] ).toEqual( "function funky(pArgA, pArgB)" );
              expect( matches[1] ).toEqual( "function" );
              expect( matches[2] ).toEqual( "function" );
              expect( matches[3] ).toBe( undefined );
              expect( matches[3] ).toBe( undefined );
              expect( matches[5] ).toEqual( "funky" );
              expect( matches[6] ).toEqual( "pArgA, pArgB" );
          } );

    test( "FUNCTION_SIGNATURE matches and captures elements of an IIFE",
          () =>
          {
              const a = 1;
              const b = 2;

              const func = (function funky( pArgA, pArgB )
              {
                  return pArgA + pArgB;
              }( a, b ));

              const literal = `(function funky( pArgA, pArgB )
              {
                  return pArgA + pArgB;
              }(a,b))`;

              const rx = RE.FUNCTION_SIGNATURE;

              const matches = rx.exec( literal );

              expect( matches[0] ).toEqual( "(function funky( pArgA, pArgB )" );
              expect( matches[1] ).toEqual( "(function" );
              expect( matches[2] ).toEqual( "function" );
              expect( matches[3] ).toBe( undefined );
              expect( matches[4] ).toBe( undefined );
              expect( matches[5] ).toEqual( "funky" );
              expect( matches[6] ).toEqual( " pArgA, pArgB " );
          } );

    test( "ASYNC_FUNCTION_SIGNATURE matches and captures elements of an asynchronous function signature",
          () =>
          {
              const func = async function funky( pArgA, pArgB )
              {
                  return pArgA + pArgB;
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.FUNCTION_SIGNATURE;

              const matches = rx.exec( literal );

              expect( matches[0] ).toEqual( "async function funky(pArgA, pArgB)" );
              expect( matches[1] ).toEqual( "async function" );
              expect( matches[2] ).toEqual( "async function" );
              expect( matches[3] ).toBe( "async " );
              expect( matches[4] ).toEqual( " " );
              expect( matches[5] ).toEqual( "funky" );
              expect( matches[6] ).toEqual( "pArgA, pArgB" );
          } );

    test( "FUNCTION_NAME matches and captures the name of a function from its source",
          () =>
          {
              const func = function funky( pArgA, pArgB )
              {
                  return pArgA + pArgB;
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.FUNCTION_NAME;

              const matches = rx.exec( literal );

              expect( matches[1] ).toEqual( "funky" );
          } );

    test( "FUNCTION_PARAMETERS matches and captures the parameters of a function signature",
          () =>
          {
              const func = function funky( pArgA, pArgB )
              {
                  return pArgA + pArgB;
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.FUNCTION_PARAMETERS;

              const matches = rx.exec( literal );

              expect( matches[3] ).toEqual( "pArgA, pArgB" );
          } );

    test( "FUNCTION_BODY_START_HINT matches a special comment",
          () =>
          {
              const func = function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  return pArgA + pArgB;
                  /*+function_body:end*/
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.FUNCTION_BODY_START_HINT;

              expect( rx.test( literal ) ).toBe( true );

              const helper = MatchesHelper.execute( rx, literal );

              const indices = helper.getIndices( 1 );

              expect( indices ).toEqual( [37, 61] );
          } );

    test( "FUNCTION_BODY_END_HINT matches a special comment",
          () =>
          {
              const func = function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  return pArgA + pArgB;
                  /*+function_body:end*/
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.FUNCTION_BODY_END_HINT;

              expect( rx.test( literal ) ).toBe( true );

              const helper = MatchesHelper.execute( rx, literal );

              const indices = helper.getIndices( 1 );

              expect( indices ).toEqual( [96, 118] );
          } );

    test( "FUNCTION_BODY_*_HINTs can be used to extract a function body",
          () =>
          {
              const func = function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  return pArgA + pArgB;
                  /*+function_body:end*/
              };

              const literal = Function.prototype.toString.call( func );

              const rxStart = RE.FUNCTION_BODY_START_HINT;
              const rxEnd = RE.FUNCTION_BODY_END_HINT;

              let helper = MatchesHelper.execute( rxStart, literal );

              const startIndices = helper.getIndices( 1 );

              helper = MatchesHelper.execute( rxEnd, literal );

              const endIndices = helper.getIndices( 1 );

              const body = literal.slice( startIndices[1], endIndices[0] );

              expect( body.replaceAll( RE.get( RE.NEWLINE, "g" ), "" ).trim() ).toEqual( "return pArgA + pArgB;" );

          } );

    test( "ANNOTATED_FUNCTION_BODY can be used to extract a function body",
          () =>
          {
              const func = function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  return pArgA + pArgB;
                  /*+function_body:end*/
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.ANNOTATED_FUNCTION_BODY;

              let helper = MatchesHelper.execute( rx, literal, "is" );

              const body = helper.getText( 1 );

              expect( body.replaceAll( RE.get( RE.NEWLINE, "g" ), "" ).trim() ).toEqual( "return pArgA + pArgB;" );

          } );

    test( "AWAIT_HINT matches a special comment",
          () =>
          {
              const someAsyncFunction = async function()
              {
                  return await Promise.resolve( 2 );
              };

              const func = /*+ async */ function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  return /*+ await */ someAsyncFunction();
                  /*+function_body:end*/
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.AWAIT_HINT;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( Function.prototype.toString.call( someAsyncFunction ) ) ).toBe( false );
          } );

    test( "ASYNC_HINT matches a special comment",
          () =>
          {
              const someAsyncFunction = async function()
              {
                  return await Promise.resolve( 2 );
              };

              const func = /*+ async */ function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  return /*+ await */ someAsyncFunction();
                  /*+function_body:end*/
              };

              const literal = `/*+ async */ function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  return /*+ await */ someAsyncFunction();
                  /*+function_body:end*/
              }`;

              const rx = RE.ASYNC_HINT;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( Function.prototype.toString.call( someAsyncFunction ) ) ).toBe( false );
          } );

    test( "DEPENDENCIES_DECLARATION matches a variable declaration and assignment",
          () =>
          {
              const func = /*+ async */ function funky( pArgA, pArgB )
              {
                  const dependencies =
                      {
                          rxUtils,
                          MatchesHelper
                      };

                  /*+function_body:start*/
                  return pArgA + pArgB;
                  /*+function_body:end*/
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.DEPENDENCIES_DECLARATION;

              expect( rx.test( literal ) ).toBe( true );

              const helper = MatchesHelper.execute( rx, literal );

              const dependencies = helper.getText( 4 ).split( /[,\s]/ ).filter( e => "" !== e );

              expect( dependencies ).toEqual( ["rxUtils", "MatchesHelper"] );
          } );

    test( "FUNCTION_DECLARATION matches a function declaration",
          () =>
          {
              const someAsyncFunction = async function()
              {
                  return await Promise.resolve( 2 );
              };

              const func = /*+ async */ function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  return /*+ await */ someAsyncFunction();
                  /*+function_body:end*/
              };

              const rx = RE.FUNCTION_DECLARATION;

              let literal = Function.prototype.toString.call( func );

              expect( rx.test( literal ) ).toBe( true );

              const matches = rx.exec( literal );

              literal = Function.prototype.toString.call( someAsyncFunction );

              expect( rx.test( literal ) ).toBe( true );

              expect( matches[2].trim() ).toEqual( "funky" );
          } );

    test( "VARIABLE_DECLARATION matches a variable declaration",
          () =>
          {
              const someAsyncFunction = async function()
              {
                  let a = 1;
                  const b = "2";
                  var c = true;

                  return await Promise.resolve( 2 );
              };

              const func = /*+ async */ function funky( pArgA, pArgB )
              {
                  /*+function_body:start*/
                  let a = pArgA;
                  const b = pArgB;
                  var c = [pArgA, pArgB];

                  return /*+ await */ someAsyncFunction();
                  /*+function_body:end*/
              };

              const literal = Function.prototype.toString.call( func );

              const rx = RE.get( RE.VARIABLE_DECLARATION, "g", "s", "d" );


              let matches = rx.exec( literal );

              expect( matches[3].trim() ).toEqual( "a" );

              expect( matches[4].trim() ).toEqual( "=" );

              expect( matches[5].trim() ).toEqual( "pArgA" );


              matches = rx.exec( literal );

              expect( matches[3].trim() ).toEqual( "b" );

              expect( matches[4].trim() ).toEqual( "=" );

              expect( matches[5].trim() ).toEqual( "pArgB" );


              matches = rx.exec( literal );

              expect( matches[3].trim() ).toEqual( "c" );

              expect( matches[4].trim() ).toEqual( "=" );

              expect( matches[5].trim() ).toEqual( "[pArgA, pArgB]" );

          } );
} );


describe( "exposed functions", () =>
{
    test( "flags returns a string of flags ordered according to their position in the VALID_FLAGS array",
          () =>
          {
              const flags = RE.flags( "a", "m", "i", "d", "g", "e", 4, true, {}, [], "gis" );

              expect( flags ).toEqual( "gidsm" );
          } );

    test( "clone returns a new mutable instance of the RegExp (or RegExp pattern) specified",
          () =>
          {
              const rxA = /\s+/gis;
              let rxAA = RE.clone( rxA );

              const rxB = RE.clone( "\\s+" );
              let rxBB = RE.clone( rxB, "gis" );

              const rxC = RE.clone( "/\\s+/gis" );
              let rxCC = RE.clone( rxC );

              const rx = RE.SLASH;
              let rxx = RE.clone( rx, "gis" );

              const literal = "a /path/to/file ";

              expect( rxA === rxAA ).toBe( false );
              expect( rxB === rxBB ).toBe( false );
              expect( rxC === rxCC ).toBe( false );
              expect( rx === rxx ).toBe( false );

              expect( Object.isFrozen( rx ) ).toBe( true );
              expect( Object.isFrozen( rxx ) ).toBe( false );


              expect( rxA.test( literal ) ).toBe( true );

              expect( rxA.lastIndex ).toEqual( 2 );

              expect( rxA.test( literal ) ).toBe( true );

              expect( rxA.lastIndex ).toEqual( 16 );


              expect( rxAA.lastIndex <= 0 ).toBe( true );

              expect( rxAA.test( literal ) ).toBe( true );

              expect( rxAA.lastIndex ).toEqual( 2 );

              expect( rxAA.test( literal ) ).toBe( true );

              expect( rxAA.lastIndex ).toEqual( 16 );


              rxAA = RE.clone( rxAA );

              expect( rxAA.lastIndex <= 0 ).toBe( true );

              expect( rxAA.test( literal ) ).toBe( true );

              expect( rxAA.lastIndex ).toEqual( 2 );

              expect( rxAA.test( literal ) ).toBe( true );

              expect( rxAA.lastIndex ).toEqual( 16 );


              ////

              expect( rxB.test( literal ) ).toBe( true );

              expect( rxB.lastIndex ).toEqual( 0 );

              expect( rxB.test( literal ) ).toBe( true );

              expect( rxB.lastIndex ).toEqual( 0 );


              expect( rxBB.lastIndex <= 0 ).toBe( true );

              expect( rxBB.test( literal ) ).toBe( true );

              expect( rxBB.lastIndex ).toEqual( 2 );

              expect( rxBB.test( literal ) ).toBe( true );

              expect( rxBB.lastIndex ).toEqual( 16 );


              rxBB = RE.clone( rxBB );

              expect( rxBB.lastIndex <= 0 ).toBe( true );

              expect( rxBB.test( literal ) ).toBe( true );

              expect( rxBB.lastIndex ).toEqual( 2 );

              expect( rxBB.test( literal ) ).toBe( true );

              expect( rxBB.lastIndex ).toEqual( 16 );


////
              expect( rxC.test( literal ) ).toBe( true );

              expect( rxC.lastIndex ).toEqual( 2 );

              expect( rxC.test( literal ) ).toBe( true );

              expect( rxC.lastIndex ).toEqual( 16 );


              expect( rxCC.lastIndex <= 0 ).toBe( true );

              expect( rxCC.test( literal ) ).toBe( true );

              expect( rxCC.lastIndex ).toEqual( 2 );

              expect( rxCC.test( literal ) ).toBe( true );

              expect( rxCC.lastIndex ).toEqual( 16 );


              rxCC = RE.clone( rxCC );

              expect( rxCC.lastIndex <= 0 ).toBe( true );

              expect( rxCC.test( literal ) ).toBe( true );

              expect( rxCC.lastIndex ).toEqual( 2 );

              expect( rxCC.test( literal ) ).toBe( true );

              expect( rxCC.lastIndex ).toEqual( 16 );

////
              expect( rx.test( literal ) ).toBe( true );

              expect( rx.lastIndex ).toEqual( 0 );

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.lastIndex ).toEqual( 0 );


              expect( rxx.lastIndex <= 0 ).toBe( true );

              expect( rxx.test( literal ) ).toBe( true );

              expect( rxx.lastIndex ).toEqual( 3 );

              expect( rxx.test( literal ) ).toBe( true );

              expect( rxx.lastIndex ).toEqual( 8 );

              expect( rxx.test( literal ) ).toBe( true );

              expect( rxx.lastIndex ).toEqual( 11 );


              rxx = RE.clone( rxx );

              expect( rxx.lastIndex <= 0 ).toBe( true );

              expect( rxx.test( literal ) ).toBe( true );

              expect( rxx.lastIndex ).toEqual( 3 );

              expect( rxx.test( literal ) ).toBe( true );

              expect( rxx.lastIndex ).toEqual( 8 );

              expect( rxx.test( literal ) ).toBe( true );

              expect( rxx.lastIndex ).toEqual( 11 );
          } );

    test( "extractFlags returns a string of flags from the specified argument",
          () =>
          {
              const rx = RE.clone( RE.SLASH, "gis" );
              const rxA = /\s+/gis;
              const rxB = "\\s+";
              const rxC = "/\\s+/gis";

              expect( RE.extractFlags( rx ) ).toEqual( "gis" );
              expect( RE.extractFlags( rxA ) ).toEqual( "gis" );
              expect( RE.extractFlags( rxB ) ).toEqual( "" );
              expect( RE.extractFlags( rxC ) ).toEqual( "gis" );

              expect( RE.extractFlags( /a/ ) ).toEqual( "" );
              expect( RE.extractFlags( /a/i ) ).toEqual( "i" );


          } );

    test( "'get' returns a mutable RegExp according to the arguments specified",
          () =>
          {
              const rx = RE.SLASH;

              const rxA = /\s+/gis;
              const rxB = "\\s+";
              const rxC = "/\\s+/gis";

              const rxx = RE.get( rx );

              const rxAA = RE.get( rxA, RE.extractFlags( rxA ) );
              const rxBB = RE.get( rxB );
              const rxCC = RE.get( rxC );

              expect( Object.isFrozen( rx ) ).toBe( true );

              expect( rxx instanceof RegExp ).toBe( true );
              expect( Object.isFrozen( rxx ) ).toBe( false );

              expect( rxA instanceof RegExp ).toBe( true );
              expect( Object.isFrozen( rxA ) ).toBe( false );

              expect( rxAA instanceof RegExp ).toBe( true );
              expect( Object.isFrozen( rxAA ) ).toBe( false );

              expect( rxB instanceof RegExp ).toBe( false );
              expect( Object.isFrozen( rxB ) ).toBe( true ); // strings are immutable

              expect( rxBB instanceof RegExp ).toBe( true );
              expect( Object.isFrozen( rxBB ) ).toBe( false );

              expect( rxC instanceof RegExp ).toBe( false );
              expect( Object.isFrozen( rxC ) ).toBe( true ); // strings are immutable

              expect( rxCC instanceof RegExp ).toBe( true );
              expect( Object.isFrozen( rxCC ) ).toBe( false );

              expect( rxA.flags ).toEqual( "gis" );
              expect( rxAA.flags ).toEqual( "gis" );

              expect( rxC.flags ).toBe( undefined );
              expect( rxCC.flags ).toEqual( "gis" );
          } );

    test( "'compose' returns a mutable RegExp composed of the patterns of the RegExp objects specified",
          () =>
          {
              const rx = RE.compose( RE.VARIABLE_TOKEN_START, /[^}]+/, RE.VARIABLE_TOKEN_END );

              const a = "a";

              const s = "The first lowercase letter of the latin alphabet is '${a}'.";

              const interpolated = `The first lowercase letter of the latin alphabet is '${a}'.`;

              expect( rx.test( s ) ).toBe( true );

              expect( rx.test( interpolated ) ).toBe( false );

              expect( interpolated ).toEqual( "The first lowercase letter of the latin alphabet is 'a'." );
          } );


    test( "reset returns an instance of the RegExp with a fresh state",
          () =>
          {
              let rx = RE.SLASH;
              let rxA = /\s+/gis;
              let rxB = RE.clone( "\\s+" );
              let rxC = RE.clone( "/\\s+/gis" );

              const literal = "a /path/to/file ";

              expect( rxA.test( literal ) ).toBe( true );
              expect( rxA.lastIndex ).toEqual( 2 );
              expect( rxA.test( literal ) ).toBe( true );
              expect( rxA.lastIndex ).toEqual( 16 );

              rxA = RE.reset( rxA );

              expect( rxA.lastIndex <= 0 ).toBe( true );

              expect( rxA.test( literal ) ).toBe( true );
              expect( rxA.lastIndex ).toEqual( 2 );
              expect( rxA.test( literal ) ).toBe( true );
              expect( rxA.lastIndex ).toEqual( 16 );

              ////

              expect( rxB.test( literal ) ).toBe( true );
              expect( rxB.lastIndex ).toEqual( 0 );
              expect( rxB.test( literal ) ).toBe( true );
              expect( rxB.lastIndex ).toEqual( 0 );

              rxB = RE.reset( rxB );

              expect( rxB.lastIndex <= 0 ).toBe( true );

              expect( rxB.test( literal ) ).toBe( true );
              expect( rxB.lastIndex <= 0 ).toBe( true );
              expect( rxB.test( literal ) ).toBe( true );
              expect( rxB.lastIndex <= 0 ).toBe( true );

////
              expect( rxC.test( literal ) ).toBe( true );
              expect( rxC.lastIndex ).toEqual( 2 );
              expect( rxC.test( literal ) ).toBe( true );
              expect( rxC.lastIndex ).toEqual( 16 );

              rxC = RE.reset( rxC );

              expect( rxC.lastIndex <= 0 ).toBe( true );

              expect( rxC.test( literal ) ).toBe( true );
              expect( rxC.lastIndex ).toEqual( 2 );
              expect( rxC.test( literal ) ).toBe( true );
              expect( rxC.lastIndex ).toEqual( 16 );

////
              expect( rx.test( literal ) ).toBe( true );
              expect( rx.lastIndex <= 0 ).toBe( true );
              expect( rx.test( literal ) ).toBe( true );
              expect( rx.lastIndex <= 0 ).toBe( true );

              rx = RE.reset( rx );

              expect( rx.test( literal ) ).toBe( true );
              expect( rx.lastIndex <= 0 ).toBe( true );
              expect( rx.test( literal ) ).toBe( true );
              expect( rx.lastIndex <= 0 ).toBe( true );

          } );
} );

describe( "MatchesHelper", () =>
{
    test( "Static method, execute, returns a new MatchesHelper",
          () =>
          {
              const rx = /([ab]??)?([bc]??)?([cd]??)?/;

              const textA = "abc";
              const textB = "bcd";
              const textC = "cde";

              let helper = MatchesHelper.execute( rx, textA );

              expect( helper.getText( 1 ) ).toEqual( "a" );
              expect( helper.getText( 2 ) ).toEqual( "b" );
              expect( helper.getText( 3 ) ).toEqual( "c" );

              helper = MatchesHelper.execute( rx, textB );

              expect( helper.getText( 1 ) ).toEqual( "b" );
              expect( helper.getText( 2 ) ).toEqual( "c" );
              expect( helper.getText( 3 ) ).toEqual( "d" );

              helper = MatchesHelper.execute( rx, textC );

              expect( helper.getText( 1 ) ).toEqual( undefined );
              expect( helper.getText( 2 ) ).toEqual( "c" );
              expect( helper.getText( 3 ) ).toEqual( "d" );

          } );

    test( "MatchesHelper::matches property is the same as the returned value from exec",
          () =>
          {
              const rx = /([ab]??)?([bc]??)?([cd]??)?/;

              const textA = "abc";
              const textB = "bcd";
              const textC = "cde";

              let matches = rx.exec( textA );
              let helper = MatchesHelper.execute( rx, textA );
              expect( [].concat( matches ) ).toEqual( [].concat( helper.matches ) );

              matches = rx.exec( textB );
              helper = MatchesHelper.execute( rx, textB );
              expect( [].concat( matches ) ).toEqual( [].concat( helper.matches ) );

              matches = rx.exec( textC );
              helper = MatchesHelper.execute( rx, textC );
              expect( [].concat( matches ) ).toEqual( [].concat( helper.matches ) );
          } );

    test( "MatchesHelper::getIndices returns the start and end index of each matched group",
          () =>
          {
              const rx = /([ab]??)?([bc]??)?([cd]??)?/d;

              const textA = "abc";
              const textB = "bcd";
              const textC = "cde";

              let helper = MatchesHelper.execute( rx, textA );

              expect( helper.getIndices( 1 ) ).toEqual( [0, 1] );
              expect( helper.getIndices( 2 ) ).toEqual( [1, 2] );
              expect( helper.getIndices( 3 ) ).toEqual( [2, 3] );

              helper = MatchesHelper.execute( rx, textB );

              expect( helper.getIndices( 1 ) ).toEqual( [0, 1] );
              expect( helper.getIndices( 2 ) ).toEqual( [1, 2] );
              expect( helper.getIndices( 3 ) ).toEqual( [2, 3] );

              helper = MatchesHelper.execute( rx, textC );

              expect( helper.getIndices( 1 ) ).toEqual( [] );
              expect( helper.getIndices( 2 ) ).toEqual( [0, 1] );
              expect( helper.getIndices( 3 ) ).toEqual( [1, 2] );
          } );
} );
