const fs = require( "fs" );
const fsAsync = fs.promises;
const path = require( "path" );

const core = require( "@toolbocks/core" );

const logging = require( "@toolbocks/logging" );

const fileLogger = require( "../src/index.js" );

const { classes, LogFilePattern } = fileLogger;

const { LogRecord, FileInfo } = classes;

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


describe( "LogFilePattern", () =>
{
    test( "LogFilePattern describes how to name the files", () =>
    {
        const defaultPattern = new LogFilePattern();

        expect( defaultPattern.toString() ).toEqual( "application.log" );

        let pattern = new LogFilePattern( "server", "record", "_" );

        let fileName = pattern.generateFileName( 1 );

        expect( fileName ).toEqual( "server_1.record" );

        pattern = new LogFilePattern( "application", ".log", "-", "bock" );

        fileName = pattern.generateFileName( 3 );

        expect( fileName ).toEqual( "bock-application-3.log" );

        pattern = LogFilePattern.fromString( "application.log" );

        expect( pattern.generateFileName() ).toEqual( "application.log" );

        expect( pattern.generateFileName( 5 ) ).toEqual( "application-5.log" );

        pattern = LogFilePattern.fromString( "bock-application.log" );

        expect( pattern.generateFileName() ).toEqual( "bock-application.log" );


        pattern = LogFilePattern.fromString( "bock-application-7.log" );

        expect( pattern.generateFileName() ).toEqual( "bock-application.log" );

        expect( pattern.generateFileName( 5 ) ).toEqual( "bock-application-5.log" );


        pattern = LogFilePattern.fromString( "bock_application_7.log" );

        expect( pattern.generateFileName() ).toEqual( "bock_application.log" );

        expect( pattern.generateFileName( 5 ) ).toEqual( "bock_application_5.log" );

    } );
} );

describe( "FileInfo", () =>
{
    test( "FileInfo is a 'smart-wrapper' for files collected from directory", async() =>
    {
        const fileInfo = new FileInfo( "../FileLogger/src/index.js" );

        const created = await fileInfo.getCreatedDate();

        expect( created.toString() ).toEqual( "Sat Jan 04 2025 20:25:59 GMT-0600 (Central Standard Time)" );

        const size = await fileInfo.getSize();

        expect( size ).toBeGreaterThan( 0 );

        expect( size ).toBeGreaterThan( 52_000 );

        expect( size ).toBeLessThan( 55_000 );

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
    } );

    test( "FileInfo.sort is a static method to sort instances asynchronously", async() =>
    {
        let directoryPath = "../../../test_data/base64";

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
    } );


} );