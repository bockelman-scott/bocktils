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

              expect( literal.split( rx ) ).toEqual( ["/github.com/project","header"] );
          } );

    test( "HASH matches the # character",
          () =>
          {
              const literal = "/github.com/project#header";

              const rx = RE.HASH;

              expect( rx.test( literal ) ).toBe( true );

              expect( rx.test( "\nabc\n" ) ).toBe( false );

              expect( literal.split( rx ) ).toEqual( ["/github.com/project","header"] );
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



} );