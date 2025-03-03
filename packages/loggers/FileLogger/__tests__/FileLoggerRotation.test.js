const fs = require( "fs" );
const fsAsync = fs.promises;
const path = require( "path" );

const core = require( "@toolbocks/core" );

const fileUtils = require( "@toolbocks/files" );

const fileLogger = require( "../src/index.js" );

const { stringUtils } = core;

const { isBlank } = stringUtils;

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
    FileLogger,
    TIMESTAMP_RESOLUTION
} = fileLogger;

const { LogRecord } = fileLoggerClasses;

const currentDirectory = path.dirname( __filename );

const projectRootDirectory = path.resolve( currentDirectory, "../../../../" );

const logDir = resolvePath( path.resolve( projectRootDirectory, "logs" ) );

describe( "Log Rotation", () =>
{
    jest.useFakeTimers();

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

        for( let i = 0; i < 10; i++ )
        {
            logger.info( record );

            const archivedPath = await logger.rotateLogFile( logger, TIMESTAMP_RESOLUTION.HOUR );

            const content = await fsAsync.readFile( archivedPath, "utf8" );

            expect( !isBlank( content ) ).toBe( true );
        }
    } );

    jest.clearAllTimers();
} );

jest.clearAllTimers();
