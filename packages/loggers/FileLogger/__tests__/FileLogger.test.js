const fs = require( "fs" );
const fsAsync = fs.promises;
const path = require( "path" );

const core = require( "@toolbocks/core" );

const logging = require( "@toolbocks/logging" );

const fileLogger = require( "../src/index.js" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

const { sleep } = constants;

const { isString } = typeUtils;

const { asString, isBlank } = stringUtils;

const {
    classes: fileLoggerClasses,
    LogFilePattern,
    LogFileRetentionPolicy,
    FileRotationIntervalUnit,
    FileRotationInterval,
    LogFileRotationPolicy,
    DEFAULTS,
    FileLogger,
    TIMESTAMP_RESOLUTION
} = fileLogger;

const {
    LogRecord,
    FileInfo,
    LogLevel,
    LogFormatter
} = fileLoggerClasses;

const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;
const MILLIS_PER_WEEK = 7 * MILLIS_PER_DAY;

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

const currentWorkingDirectory = process.cwd();

const currentFile = __filename;

const currentDirectory = path.dirname( __filename );

const srcDirectory = path.resolve( currentDirectory, "../src" );

const projectRootDirectory = path.resolve( currentDirectory, "../../../../" );

const testDirectory = path.resolve( projectRootDirectory, "test_data" );

const testSubDirectory = path.resolve( testDirectory, "base64" );

const logDir = path.resolve( projectRootDirectory, "logs" );

describe( "LogFilePattern", () =>
{
    const stats = fs.statSync( path.resolve( testSubDirectory, "1000.data" ) );

    const fakeInfo = new FileInfo( path.resolve( testSubDirectory, "1000.data" ), stats.birthtime, stats.size );

    test( "LogFilePattern describes how to name the files", () =>
    {
        const defaultPattern = new LogFilePattern();

        expect( defaultPattern.toString() ).toEqual( "application.log" );

        let pattern = new LogFilePattern( "server", "record", "_" );

        let fileName = pattern.generateFileName();

        expect( fileName ).toEqual( "server.record" );

        pattern = new LogFilePattern( "application", ".log", "-", "bock" );

        fileName = pattern.generateFileName();

        expect( fileName ).toEqual( "bock-application.log" );

        pattern = LogFilePattern.fromString( "application.log" );

        expect( pattern.generateFileName() ).toEqual( "application.log" );

        expect( pattern.generateFileName( fakeInfo, 3 ) ).toEqual( "application-20241013.log" );

        pattern = LogFilePattern.fromString( "bock-application.log" );

        expect( pattern.generateFileName() ).toEqual( "bock-application.log" );


        pattern = LogFilePattern.fromString( "bock-application-7.log" );

        expect( pattern.generateFileName() ).toEqual( "bock-application.log" );

        expect( pattern.generateFileName() ).toEqual( "bock-application.log" );


        pattern = LogFilePattern.fromString( "bock_application_7.log" );

        expect( pattern.generateFileName() ).toEqual( "bock_application.log" );

        expect( pattern.generateFileName() ).toEqual( "bock_application.log" );

        pattern = LogFilePattern.DEFAULT;

        expect( pattern.generateFileName() ).toEqual( "application.log" );

    } );
} );

describe( "FileInfo", () =>
{
    test( "FileInfo is a 'smart-wrapper' for files collected from directory", async() =>
    {
        const fileInfo = new FileInfo( path.resolve( srcDirectory + "/index.js" ) );

        const created = await fileInfo.getCreatedDate();

        expect( created.toString() ).toEqual( "Sat Jan 04 2025 20:25:59 GMT-0600 (Central Standard Time)" );

        const size = await fileInfo.getSize();

        expect( size ).toBeGreaterThan( 0 );

        expect( size ).toBeGreaterThan( 52_000 );

        expect( size ).toBeLessThan( 75_000 );

        let age = await fileInfo.calculateAge( new Date( created.getTime() + MILLIS_PER_WEEK ) );

        expect( age ).toEqual( 7 );

        age = await fileInfo.calculateAge( new Date( created.getTime() + MILLIS_PER_WEEK + (MILLIS_PER_HOUR) ) );

        expect( age ).toEqual( 7 );

        let expired = await fileInfo.isExpired( 2 );

        expect( expired ).toBe( true );

        expired = await fileInfo.isExpired( 20_000 );

        expect( expired ).toBe( false );

        const otherFileInfo = new FileInfo( __filename );

        const comp = await fileInfo.compareTo( otherFileInfo );

        expect( comp ).toEqual( 1 ); // this file was created later

        return Promise.resolve( true );
    } );

    test( "FileInfo.sort is a static method to sort instances asynchronously", async() =>
    {
        let directoryPath = testSubDirectory;

        let files = await fsAsync.readdir( directoryPath );

        files = files.map( file => path.join( directoryPath, file ) );


        let sorted = await FileInfo.sort( ...files );

        sorted = sorted.map( e => (e.toString() + "\n") );

        expect( sorted.length ).toEqual( 12 );

        expect( sorted[11].replace( /\n+$/, "" ).endsWith( "all_bones_mp3_zip.data" ) ).toBe( true );


        sorted = await FileInfo.sortDescending( ...files );

        sorted = sorted.map( e => (e.toString() + "\n") );

        expect( sorted.length ).toEqual( 12 );

        expect( sorted[0].replace( /\n+$/, "" ).endsWith( "all_bones_mp3_zip.data" ) ).toBe( true );


        return Promise.resolve( true );
    } );

} );

describe( "LogFileRetentionPolicy", () =>
{
    test( "LogFileRetentionPolicy defines how long to keep log files", () =>
    {
        // pMaximumDays, pMaximumFiles,
        let retentionPolicy = new LogFileRetentionPolicy( 30, 10 );

        expect( retentionPolicy.maxDays ).toEqual( 30 );
        expect( retentionPolicy.maxFiles ).toEqual( 10 );

        expect( retentionPolicy.operation ).toEqual( "delete" );
        expect( retentionPolicy.archiver ).toBe( null );
    } );

    test( "LogFileRetentionPolicy has a method to collect a list of file information", async() =>
    {
        // pMaximumDays, pMaximumFiles,
        let retentionPolicy = new LogFileRetentionPolicy( 30, 10 );

        const files = await retentionPolicy.collectFiles( testSubDirectory, e => asString( e.filename ).startsWith( "1" ) );

        expect( files.length ).toEqual( 10 );

        const strings = files.map( e => e.toString() );

        expect( strings.length ).toEqual( 10 );

        expect( path.basename( strings.sort()[0] ) ).toEqual( "1000.data" );


        return Promise.resolve( true );
    } );

    test( "LogFileRetentionPolicy has a method to find expired files", async() =>
    {
        let retentionPolicy = new LogFileRetentionPolicy( 30, 10 );

        const files = await retentionPolicy.findExpiredFiles( testSubDirectory, new Date() );

        expect( files.length ).toEqual( 12 );

        expect( files.every( e => isString( e ) ) ).toBe( true );


        return Promise.resolve( true );
    } );

} );

describe( "FileRotationIntervalUnit", () =>
{
    test( "FileRotationIntervalUnit defines the available file rotation interval units", () =>
    {
        const cache = FileRotationIntervalUnit.CACHE;

        expect( Object.keys( cache ).length ).toEqual( 6 );

        expect( cache.WEEK.milliseconds ).toEqual( 604_800_000 );

        expect( cache.DAY.milliseconds ).toEqual( 86_400_000 );

        expect( cache.HOUR.milliseconds ).toEqual( 3_600_000 );

        expect( cache.MINUTE.milliseconds ).toEqual( 60_000 );

        expect( cache.SECOND.milliseconds ).toEqual( 1_000 );
    } );
} );

describe( "FileRotationInterval", () =>
{
    test( "FileRotationInterval defines the available file rotation intervals", () =>
    {
        expect( FileRotationInterval.resolve( 86_400_000 ) ).toEqual( new FileRotationInterval( 1, FileRotationIntervalUnit.DAY ) );

        expect( FileRotationInterval.resolve( 43_200_000 ) ).toEqual( new FileRotationInterval( 12, FileRotationIntervalUnit.HOUR ) );

        expect( new FileRotationInterval( 10, FileRotationIntervalUnit.HOUR ).milliseconds ).toEqual( 36_000_000 );
    } );
} );

describe( "LogFileRotationPolicy", () =>
{
    test( "LogFileRotationPolicy defines when the current log file is closed and replaced by another", () =>
    {
        const defaultPolicy = LogFileRotationPolicy.DEFAULT;

        expect( defaultPolicy.interval ).toEqual( new FileRotationInterval( 1, FileRotationIntervalUnit.DAY ) );

        expect( defaultPolicy.maxSize ).toEqual( 100 );

        expect( defaultPolicy.maxBytes ).toEqual( 100 * 1_024 );

        expect( defaultPolicy.milliseconds ).toEqual( 86_400_000 );

        let policy = LogFileRotationPolicy.resolve( { interval: 86_400_000, maxSize: 100 } );

        expect( policy.interval ).toEqual( new FileRotationInterval( 1, FileRotationIntervalUnit.DAY ) );

        expect( policy.maxSize ).toEqual( 100 );

        expect( policy.maxBytes ).toEqual( 100 * 1_024 );

        policy = LogFileRotationPolicy.resolve( { interval: 43_200_000, maxSize: 23 } );

        expect( policy.interval ).toEqual( new FileRotationInterval( 12, FileRotationIntervalUnit.HOUR ) );

        expect( policy.maxSize ).toEqual( 23 );

        expect( policy.maxBytes ).toEqual( 23 * 1_024 );
    } );
} );

describe( "DEFAULTS.FILE_LOGGER_OPTIONS", () =>
{
    test( "DEFAULTS.FILE_LOGGER_OPTIONS defines reasonable defaults", () =>
    {
        expect( DEFAULTS.FILE_LOGGER_OPTIONS ).toEqual( {
                                                            directory: DEFAULTS.FILE_PATH,
                                                            filePattern: DEFAULTS.FILE_PATTERN,
                                                            timestampFormatter: null,
                                                            filter: null,
                                                            level: LogLevel.DEFAULT,
                                                            logFormatter: LogFormatter.DEFAULT,
                                                            retentionPolicy: DEFAULTS.FILE_RETENTION_POLICY,
                                                            rotationPolicy: DEFAULTS.FILE_ROTATION_POLICY
                                                        } );
    } );
} );

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

describe( "Log Rotation", () =>
{
    test( "Log Files are 'rotated'", async() =>
    {
        let logger = new FileLogger( { directory: logDir } );

        expect( logger.directory ).toEqual( logDir );

        let record = new LogRecord( "This is information",
                                    "info",
                                    null,
                                    "FileLogger.test.js",
                                    "Info 1",
                                    "Info 2",
                                    23 );

        logger.info( record );

        const archivedPath = await logger.rotateLogFile( logger, TIMESTAMP_RESOLUTION.HOUR );

        const content = await fsAsync.readFile( archivedPath, "utf8" );

        expect( !isBlank( content ) ).toBe( true );

        console.log( archivedPath );

        console.log( content );
    } );
} );


/*

describe( "FileLogger is an Event Handler", () =>
{
    let logger = new FileLogger( { directory: logDir } );

    let eventDispatched = null;

    test( "handleEvent", async() =>
    {
        eventMaker.addEventListener( "error", logger );

        eventMaker.addEventListener( "custom", logger );

        let customEvent = new CustomEvent( "custom", { message: "This is a custom event" } );

        eventMaker.dispatchEvent( customEvent );


        customEvent = new CustomEvent( "error", { error: new Error( "This is an error event" ) } );

        eventMaker.dispatchEvent( customEvent );

        eventDispatched = customEvent;
    } );

    test( "eventHandled", async() =>
    {
        if ( eventDispatched )
        {
            sleep( 1000 );

            const content = await fsAsync.readFile( path.resolve( logDir + "/application.log" ), "utf8" );

            let lines = content.split( "\n" ).filter( line => line.trim().length > 0 );

            lines = lines.filter( line => !line.trim().startsWith( "at" ) );

            expect( lines[lines.length - 1].includes( "This is an error event" ) ).toBe( true );
        }

        return Promise.resolve( true );
    } );

} );


*/

/*

 describe( "Cleanup", () =>
 {
 test( "Delete the log files", async() =>
 {
 sleep( 90_000 );
 await fsAsync.readdir( logDir, { withFileTypes: true } ).then( files =>
 {
 files.forEach( file =>
 {
 if ( file.isFile() )
 {
 // fsAsync.unlink( path.resolve( logDir, file.name ) );
 }
 } );
 } );
 } );
 } );

 */
jest.clearAllTimers();