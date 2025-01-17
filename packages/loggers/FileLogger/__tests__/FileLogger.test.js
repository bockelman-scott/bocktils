const path = require( "path" );

const core = require( "@toolbocks/core" );

const fileLogger = require( "../src/index.js" );


const { classes: fileLoggerClasses, FileLogger } = fileLogger;

const { LogRecord, LogLevel } = fileLoggerClasses;

const currentDirectory = path.dirname( __filename );

const projectRootDirectory = path.resolve( currentDirectory, "../../../../" );

const logDir = path.resolve( projectRootDirectory, "logs" );

describe( "FileLogger", () =>
{
    test( "FileLogger can be constructed", () =>
    {
        let logger = new FileLogger( { directory: logDir } );

        expect( logger.directory ).toEqual( logDir );

        logger = new FileLogger( { directory: logDir } );

        expect( logger.directory ).toEqual( logDir );

        let record = new LogRecord( "This is information",
                                    "info",
                                    null,
                                    "FileLogger.test.js",
                                    "Info 1",
                                    "Info 2",
                                    23 );

        logger.info( record );
    } );

    test( "FileLogger writes warnings to a file", () =>
    {
        let logger = new FileLogger( { directory: logDir } );

        let record = new LogRecord( "This is a warning",
                                    "warn",
                                    null,
                                    "FileLogger.test.js",
                                    "Warning 1",
                                    "Some other data",
                                    777 );

        logger.warn( record );
    } );

    test( "FileLogger writes errors to a file", () =>
    {
        let logger = new FileLogger( { directory: logDir } );

        let record = new LogRecord( "This is an error",
                                    "error",
                                    null,
                                    "FileLogger.test.js",
                                    "Ack!",
                                    "Nack!",
                                    666 );

        logger.error( record );
    } );

    test( "FileLogger ignores debugging messages as configured by default", () =>
    {
        let logger = new FileLogger( { directory: logDir } );

        let record = new LogRecord( "This is ignored",
                                    "debug",
                                    null,
                                    "FileLogger.test.js",
                                    "a bunch of details",
                                    "more details" );

        logger.debug( record );

        logger = new FileLogger( { directory: logDir, level: LogLevel.DEBUG } );

        record = new LogRecord( "This is not ignored",
                                "debug",
                                null,
                                "FileLogger.test.js",
                                "configured to log debug messages",
                                "more details" );

        logger.debug( record );

    } );
} );
