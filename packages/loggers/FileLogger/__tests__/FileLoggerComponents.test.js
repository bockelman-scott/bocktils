const fs = require( "fs" );
const fsAsync = fs.promises;
const path = require( "path" );

const core = require( "@toolbocks/core" );

const fileUtils = require( "@toolbocks/files" );

const fileLogger = require( "../src/index.js" );

const { typeUtils, stringUtils } = core;

const { isString, isFunction } = typeUtils;

const { asString } = stringUtils;

const {
    resolvePath,
    resolveDirectoryPath,
    extractPathSeparator,
    getFilePathData,
    getFileName,
    getDirectoryName,
    getFileExtension,
} = fileUtils;

const {
    classes: fileLoggerClasses,
    LogFilePattern,
    LogFileRetentionPolicy,
    FileRotationIntervalUnit,
    FileRotationInterval,
    LogFileRotationPolicy,
    DEFAULTS
} = fileLogger;

const {
    FileObject,
    LogLevel,
    LogFormatter
} = fileLoggerClasses;

const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;
const MILLIS_PER_WEEK = 7 * MILLIS_PER_DAY;

const currentDirectory = path.dirname( __filename );

const srcDirectory = path.resolve( currentDirectory, "../src" );

const projectRootDirectory = path.resolve( currentDirectory, "../../../../" );

const testDirectory = path.resolve( projectRootDirectory, "test_data" );

const testSubDirectory = path.resolve( testDirectory, "base64" );

describe( "LogFilePattern", () =>
{
    const stats = fs.statSync( path.resolve( testSubDirectory, "1000.data" ) );

    const fakeInfo = new FileObject( path.resolve( testSubDirectory, "1000.data" ), stats.birthtime, stats.size );

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

        // expect( pattern.generateFileName( fakeInfo, 3 ) ).toEqual( "application-20241013.log" );

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

describe( "FileObject", () =>
{
    test( "FileObject is a 'smart-wrapper' for files collected from directory", async() =>
    {
        const fileInfo = new FileObject( path.resolve( srcDirectory + "/index.js" ) );

        const created = await fileInfo.getCreatedDate();

        // expect( created.toString() ).toEqual( "Sat Jan 04 2025 20:25:59 GMT-0600 (Central Standard Time)" );

        const size = await fileInfo.getSize();

        expect( size ).toBeGreaterThan( 0 );

        expect( size ).toBeGreaterThan( 52_000 );

        expect( size ).toBeLessThan( 75_000 );

        let age = await fileInfo.calculateAge( new Date( created.getTime() + MILLIS_PER_WEEK ) );

        expect( age ).toEqual( 7 );

        age = await fileInfo.calculateAge( new Date( created.getTime() + MILLIS_PER_WEEK + (MILLIS_PER_HOUR) ) );

        expect( age ).toEqual( 7 );

        let expired = await fileInfo.isExpired( 2 );

        // expect( expired ).toBe( true );

        expired = await fileInfo.isExpired( 20_000 );

        expect( expired ).toBe( false );

        const otherFileInfo = new FileObject( __filename );

        const comp = await fileInfo.compareTo( otherFileInfo );

        expect( comp ).toEqual( 1 );

        return Promise.resolve( true );
    } );

    test( "FileObject.sort is a static method to sort instances asynchronously", async() =>
    {
        let directoryPath = testSubDirectory;

        let files = await fsAsync.readdir( directoryPath );

        files = files.map( file => path.join( directoryPath, file ) );


        let sorted = await FileObject.sort( ...files );

        sorted = sorted.map( e => (e.toString() + "\n") );

        expect( sorted.length ).toEqual( 13 );

        expect( sorted[11].replace( /\n+$/, "" ).endsWith( "all_bones_mp3_zip.data" ) ).toBe( true );


        sorted = await FileObject.sortDescending( ...files );

        sorted = sorted.map( e => (e.toString() + "\n") );

        expect( sorted.length ).toEqual( 13 );

        expect( sorted[0].replace( /\n+$/, "" ).endsWith( "justin.image.data" ) ).toBe( true );


        return Promise.resolve( true );
    }, 10_000 );

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

        const fileFilter = e => asString( e.filename, true ).startsWith( "1" ) || (isString( e ) && asString( e, true ).startsWith( "1" ));

        const files = await retentionPolicy.collectFiles( testSubDirectory, null, fileFilter );

        expect( files.length ).toEqual( 10 );

        const strings = files.map( e => e.toString() );

        expect( strings.length ).toEqual( 10 );

        const sorted = strings.sort() || [];

        expect( getFileName( sorted[0] ) ).toEqual( "1000.data" );

        return Promise.resolve( true );
    } );

    test( "LogFileRetentionPolicy has a method to find expired files", async() =>
    {
        let retentionPolicy = new LogFileRetentionPolicy( 30, 10 );

        const files = await retentionPolicy.findExpiredFiles( testSubDirectory, new Date() );

        expect( files.length ).toEqual( 13 );

        expect( files.every( e => e instanceof FileObject ) ).toBe( true );


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

        expect( defaultPolicy.maxSize ).toEqual( 25_000 );

        expect( defaultPolicy.maxBytes ).toEqual( 25_000 * 1_024 );

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
