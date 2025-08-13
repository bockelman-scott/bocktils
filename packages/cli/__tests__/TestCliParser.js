// Import the module under test and its dependencies
const { CliParser, CliParameters, CliParameter, classes } = require( "../index.js" );

const { CliArguments } = classes;

describe( "CliParser", () =>
{
    let parser;
    let mockParameters;

    beforeEach( () =>
                {
                    mockParameters = new CliParameters(
                        new CliParameter( "user", "u", "string" ),
                        new CliParameter( "port", "p", "number", 8080 ),
                        new CliParameter( "verbose", "v", "boolean", false )
                    );
                    parser = new CliParser( mockParameters );
                    parser.skip = 2; // Mimic a typical Node.js argv setup
                } );

    // Test for parsing standard command line arguments
    test( "should parse standard arguments correctly", async() =>
    {
        const pCommands = ["node", "script.js", "--user=admin", "-v"];

        parser.assignmentCharacter = "=";

        const args = await parser.parse( pCommands );

        expect( args.getArgumentValue( "user" ) ).toBe( "admin" );
        expect( args.getArgumentValue( "verbose" ) ).toBe( true );
        expect( args.getArgumentValue( "port" ) ).toBe( 8080 ); // Default value should be used
    } );

    // Test for parsing arguments from a file
    test( "should parse arguments from a file path", async() =>
    {
        parser.assignmentCharacter = "=";

        const pCommands = ["node", "script.js", "@__tests__/args.txt"];
        const args = await parser.parse( pCommands );

        expect( args.getArgumentValue( "user" ) ).toBe( "guest" );
        expect( args.getArgumentValue( "verbose" ) ).toBe( true );

        parser.assignmentCharacter = " ";
    } );

    // Test for parsing a JSON object from the command line
    test( "should parse a JSON object from the command line", async() =>
    {
        const jsonString = `{ "user": "apiuser", "port": 9000 }`;
        const pCommands = ["node", "script.js", `\`${jsonString}\``]; // Using backticks for the test
        const args = await parser.parse( pCommands );

        expect( args.getArgumentValue( "user" ) ).toBe( "apiuser" );
        expect( args.getArgumentValue( "port" ) ).toBe( 9000 );
        expect( args.getArgumentValue( "verbose" ) ).toBe( false ); // Default value
    } );

    // Test for parsing a JSON array from the command line
    test( "should parse a JSON array from the command line", async() =>
    {
        const jsonArray = `[ "cliuser", 5000, true ]`;
        const pCommands = ["node", "script.js", `\`${jsonArray}\``];

        // The array values are mapped by position:
        parser.positional = true;

        const args = await parser.parse( pCommands );

        // ["processName", "scriptName", "cliuser", 5000, true]
        expect( args.getArgumentValue( "user" ) ).toBe( "cliuser" );
        expect( args.getArgumentValue( "port" ) ).toBe( 5000 );
        expect( args.getArgumentValue( "verbose" ) ).toBe( true );

        parser.positional = false;
    } );

    // Test edge case with no commands
    test( "should return a default CliArguments object if no commands are provided", async() =>
    {
        const args = await parser.parse( [] );
        expect( args ).toBeInstanceOf( CliArguments );
        expect( args.getArgumentValue( "user" ) ).toBe( null );
    } );

    // Test handling of quotes and whitespace
    test( "should handle leading and trailing quotes and whitespace", async() =>
    {
        const pCommands = ["node", "script.js", `   '{"user":"quoted"}'   `];
        const args = await parser.parse( pCommands );

        expect( args.getArgumentValue( "user" ) ).toBe( "quoted" );
    } );
} );
