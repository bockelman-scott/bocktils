const core = require( "@toolbocks/core" );

const logging = require( "@toolbocks/logging" );

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

const logRecord = new LogRecord( "This is a test",
                                 "debug",
                                 new Error( "This is an error" ),
                                 "Logging.test.js",
                                 "Data 1",
                                 "Data 2",
                                 5 );

class EventMaker extends EventTarget
{
    constructor()
    {
        super();
    }
}

const eventMaker = new EventMaker();

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

        expect( lvlDebug.isEnabled( lvlError ) ).toBe( true );
        expect( lvlError.isEnabled( lvlDebug ) ).toBe( false );

        expect( "" + lvlDebug ).toEqual( "debug" );
    } );
} );

describe( "LogRecord", () =>
{
    test( "LogRecord from Error", () =>
    {
        const error = new Error( "This is an error" );
        const record = new LogRecord( error );

        expect( record.message ).toEqual( "This is an error" );
        expect( record.level.id ).toEqual( LogLevel.ERROR.id );
        expect( record.error instanceof Error ).toBe( true );
        expect( record.source ).toBeDefined();
        expect( record.data ).toEqual( [] );
    } );

    test( "LogRecord from Event", () =>
    {
        const event = new CustomEvent( "custom_event", { message: "This is a custom event" } );

        const record = new LogRecord( event );

        expect( record.message ).toEqual( "This is a custom event" );
        expect( record.level.id ).toEqual( LogLevel.DEFAULT.id );
        expect( record.error instanceof Error ).toBe( false );
        expect( record.source ).toEqual( "custom_event" );
        expect( record.data ).toEqual( [] );
    } );

    test( "LogRecord from LogRecord", () =>
    {
        const record = new LogRecord( logRecord );

        expect( record.message ).toEqual( "This is a test" );
        expect( record.level.id ).toEqual( LogLevel.DEBUG.id );
        expect( record.error instanceof Error ).toBe( true );
        expect( record.source ).toEqual( "Logging.test.js" );
        expect( record.data ).toEqual( ["Data 1", "Data 2", 5] );
    } );

    test( "LogRecord from LogRecord plus arguments", () =>
    {
        const record = new LogRecord( logRecord, "warn", new Error( "This error is new" ), "__Logging.test.js__", "Data 3", "Data 4", 6 );

        expect( record.message ).toEqual( "This is a test" );
        expect( record.level.id ).toEqual( LogLevel.WARN.id );
        expect( record.error instanceof Error ).toBe( true );
        expect( record.source ).toEqual( "__Logging.test.js__" );
        expect( record.data ).toEqual( ["Data 1", "Data 2", 5, "Data 3", "Data 4", 6] );
    } );

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


describe( "Loggers are Event Handlers", () =>
{
    const consoleLogger = new ConsoleLogger();
    const logger = new Logger( {}, consoleLogger );

    test( "handleEvent", () =>
    {
        jest.spyOn( console, "error" );

        eventMaker.addEventListener( "error", logger );

        eventMaker.dispatchEvent( new CustomEvent( "error", { error: new Error( "This is an error" ) } ) );

        expect( console.error ).toHaveBeenCalled();

        console.error.mockRestore(); // Restore the original console.log
    } );

} );


describe( "ConsoleLogger", () =>
{
    test( "ConsoleLogger logs to the console", () =>
    {
        jest.spyOn( console, "error" );

        const consoleLogger = new ConsoleLogger();

        const logger = new Logger( { buffered: true }, consoleLogger );

        logger.error( logRecord );

        setTimeout( () =>
                    {
                        expect( console.error ).toHaveBeenCalled();
                        console.error.mockRestore(); // Restore the original console.log
                    }, 70_000 );

        expect( logger.buffered ).toBe( true );
    } );
} );

describe( "AsyncLogger", () =>
{
    test( "AsyncLogger is a logger that writes to its destination asynchronously", () =>
    {
        const logger = new AsyncLogger( {}, new ConsoleLogger() );

        expect( logger.asynchronous ).toBe( true );

        jest.spyOn( console, "error" );

        logger.error( logRecord );

        setTimeout( () =>
                    {
                        expect( console.error ).toHaveBeenCalled();
                        console.error.mockRestore(); // Restore the original console.log
                    }, 20 );
    } );
} );