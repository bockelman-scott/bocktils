const core = require( "@toolbocks/core" );

const logging = require( "../src/index.js" );

const {
    DEFAULT_TEMPLATE,
    DEFAULT_ERROR_TEMPLATE,
    DEFAULT_LOG_FORMATTER_OPTIONS,
    DEFAULT_LOGGER_OPTIONS,
    LogLevel,
    LogRecord,
    LogFormatter,
    LogFilter,
    Logger,
    AsyncLogger,
    BufferedLogger,
    ConsoleLogger,
    resolveError,
    resolveSource
} = logging;

const logRecord = new LogRecord( "debug",
                                 "This is a test",
                                 new Error( "This is an error" ),
                                 "Logging.test.js",
                                 "Data 1",
                                 "Data 2",
                                 5 );

describe( "LogLevel", () =>
{
    test( "LogLevel.getLevel", () =>
    {
        const lvlDebug = LogLevel.getLevel( "debug" );

        expect( lvlDebug instanceof LogLevel ).toBe( true );

        expect( lvlDebug.id ).toEqual( 500 );
        expect( lvlDebug.name ).toEqual( "debug" );

        const lvlError = LogLevel.getLevel( 200 );

        expect( lvlError instanceof LogLevel ).toBe( true );

        expect( lvlError.id ).toEqual( 200 );
        expect( lvlError.name ).toEqual( "error" );

        expect( lvlDebug.compareTo( lvlError ) ).toEqual( 1 );
        expect( lvlError.isLessThan( lvlDebug ) ).toBe( true );

        expect( lvlDebug.isEnabled( lvlError ) ).toBe( false );
        expect( lvlError.isEnabled( lvlDebug ) ).toBe( true );

        expect( "" + lvlDebug ).toEqual( "debug" );
    } );
} );

describe( "LogRecord", () =>
{
    test( "LogRecord construction", () =>
    {
        const msgData = logRecord.format( {} );

        expect( msgData[1] ).toEqual( "debug" );
        expect( msgData[2] ).toEqual( "This is a test" );
        expect( msgData[3] ).toEqual( "Logging.test.js" );
        expect( msgData[4] instanceof Error ).toBe( true );
        expect( msgData[5].includes( "at " ) ).toBe( true );
        expect( msgData[6] ).toEqual( "This is an error" );
        expect( msgData[7] ).toEqual( "Data 1" );
        expect( msgData[8] ).toEqual( "Data 2" );
        expect( msgData[9] ).toEqual( 5 );
    } );
} );

describe( "LogFormatter", () =>
{
    test( "LogFormatter formats LogRecords", () =>
    {
        const formatter = new LogFormatter();

        const logMsg = formatter.format( logRecord );

        console.log( ...logMsg );

    } );
} );

describe( "LogFilter", () =>
{
    test( "LogFilter can discard messages", () =>
    {
        let filter = ( record ) => record.level.id <= 300;

        expect( new LogFilter( filter ).isLoggable( logRecord ) ).toBe( false );
    } );
} );


describe( "ConsoleLogger", () =>
{
    test( "ConsoleLogger logs to the console", () =>
    {
        jest.spyOn(console, 'log');

        const consoleLogger = new ConsoleLogger();

        // new Logger( {}, consoleLogger ).log( logRecord );

        new Logger( { buffered: true }, consoleLogger ).error( logRecord );

        const formatter = new LogFormatter();

        const logMsg = formatter.format( logRecord );

        setTimeout(() => {
            expect(console.log).toHaveBeenCalledWith( logMsg );
            console.log.mockRestore(); // Restore the original console.log
            done(); // Signal test completion
        }, 70_000);
    } );
} );