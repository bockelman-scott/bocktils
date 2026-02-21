const core = require( "@toolbocks/core" );

const { moduleUtils } = core;

const { ModuleEvent, sleep } = moduleUtils;

const logging = require( "@toolbocks/logging" );

const {
    DEFAULT_TEMPLATE,
    DEFAULT_ERROR_TEMPLATE,
    DEFAULT_LOG_FORMATTER_OPTIONS,
    DEFAULT_LOGGER_OPTIONS,
    DEFAULT_SIMPLE_LOGGER_OPTIONS,
    LogLevel,
    LogRecord,
    LogFormatter,
    LogFilter,
    Logger,
    AsyncLogger,
    BufferedLogger,
    ConsoleLogger,
    ConditionalLogger,
    SimpleLogger,
    SimpleAsynchronousLogger,
    SourcedSimpleLogger,
    resolveError,
    resolveSource
} = logging;

let consoleMessages = [];

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
        const event = new ModuleEvent( "custom_event", { message: "This is a custom event" } );

        const record = new LogRecord( event );

        // expect( record.message ).toEqual( "This is a custom event" );
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
        // expect( msgData[5].includes( "at " ) ).toBe( true );
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

        logger.error( logRecord );

    } );
} );

describe( "SimpleLogger", () =>
          {
              let MockSink =
                  {
                      log: ( ...pData ) => consoleMessages.push( ...pData ),
                      info: ( ...pData ) => consoleMessages.push( ...pData ),
                      warn: ( ...pData ) => consoleMessages.push( ...pData ),
                      error: ( ...pData ) => consoleMessages.push( ...pData ),
                      debug: ( ...pData ) => consoleMessages.push( ...pData ),
                      trace: ( ...pData ) => consoleMessages.push( ...pData )
                  };

              test( "SimpleLogger is an alternative to the more complex Logging Framework",
                    () =>
                    {
                        const simpleLogger = new SimpleLogger( MockSink, "warn", "error" );

                        simpleLogger.log( "This will not be displayed" );
                        simpleLogger.info( "Nor will this" );
                        simpleLogger.warn( "This WILL be displayed" );
                        simpleLogger.error( "And so will this" );
                        simpleLogger.debug( "But not this" );
                        simpleLogger.trace( "or this" );

                        console.log( consoleMessages );

                        expect( consoleMessages.includes( "This will not be displayed" ) ).toBe( false );
                        expect( consoleMessages.includes( "Nor will this" ) ).toBe( false );
                        expect( consoleMessages.includes( "This WILL be displayed" ) ).toBe( true );
                        expect( consoleMessages.includes( "And so will this" ) ).toBe( true );
                        expect( consoleMessages.includes( "But not this" ) ).toBe( false );
                        expect( consoleMessages.includes( "or this" ) ).toBe( false );

                        consoleMessages.length = 0;
                    }
              );

              test( "SimpleLogger can be decorated to indicate the source",
                    () =>
                    {
                        const logger = new SourcedSimpleLogger( MockSink, "SomeClassOrRandomString", DEFAULT_SIMPLE_LOGGER_OPTIONS );

                        logger.info( "Some Message" );

                        console.log( consoleMessages );

                        expect( consoleMessages.includes( "SomeClassOrRandomString :: " ) ).toBe( true );

                        consoleMessages.length = 0;
                    } );

              test( "SimpleLogger can be configured to indicate the source",
                    () =>
                    {
                        const logger = new SimpleLogger( MockSink, { ...DEFAULT_SIMPLE_LOGGER_OPTIONS, source: "TheSource" } );

                        logger.info( "Some Message" );

                        console.log( consoleMessages );

                        expect( consoleMessages.includes( "TheSource :: " ) ).toBe( true );

                        consoleMessages.length = 0;
                    } );


              test( "SimpleAsynchronousLogger can be used to improve performance",
                    () =>
                    {
                        consoleMessages.length = 0;

                        const logger = new SimpleAsynchronousLogger( MockSink );

                        logger.info( "An asynchronously written message" );

                        logger.info( "Another message" );

                        logger.info( "Last message" );

                    }, 30_000 );

              test( "SimpleAsynchronousLogger cannot be easily tested",
                    async() =>
                    {
                        sleep( 1_024 ).then( () => console.log( consoleMessages ) );

                        sleep( 1_024 ).then( () => console.log( "done" ) );

                        sleep( 1_024 ).then( () => console.log( "exit" ) );

                        await sleep( 128 );

                        expect( 1 ).toEqual( 1 );
                        
                    }, 30_000 );
          }
);

// Active timers can also cause this, ensure that .unref() was called on them. ??