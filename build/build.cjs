const fs = require( "fs" );

const uglify = require( "uglify-js" );

const jest = require( "jest" );


/**
 * This statement imports the common utils modules:
 * Constants, TypeUtils, StringUtils, ArrayUtils, ObjectUtils, and JsonUtils
 */
const utils = require( "../utils/CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../utils/CommonUtils.cjs
 */
const constants = utils?.constants || require( "../utils/Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "../utils/TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "../utils/StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "../utils/ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "../utils/ObjectUtils.cjs" );
const jsonUtils = utils?.jsonUtils || require( "../utils/JsonUtils.cjs" );

const logUtils = require( "../utils/LogUtils.cjs" );

/**
 * In lieu of grunt, this file just contains the very specific tasks to build this project
 */
(async function build()
{
    "use strict";

    const toUnixPath = stringUtils.toUnixPath;

    function getConfiguration()
    {
        let configFilepath = toUnixPath( __dirname + "/" + "build.config.json" );

        let contents = fs.readFileSync( configFilepath, { encoding: "utf8" } );

        return jsonUtils.parseJson( contents );
    }

    function getDirectoryNames()
    {
        let directories = config.directories;

        let srcDir = directories.source;

        let stagingDir = directories.staging;

        let distDir = directories.distribution;

        return { directories: directories, srcDir: srcDir, stagingDir: stagingDir, distDir: distDir };
    }

    function getTestResults()
    {
        let filepath = toUnixPath( __dirname + "/ctrf/ctrf-report.json" );

        let contents = fs.readFileSync( filepath, { encoding: "utf8" } );

        return jsonUtils.parseJson( contents );
    }

    function testsPassed( pResults )
    {
        let testSummary = pResults?.summary;

        let testsRun = stringUtils.asInt( testSummary?.tests );
        let testsPassed = stringUtils.asInt( testSummary?.passed );
        let testsFailed = stringUtils.asInt( testSummary?.failed );

        return testsFailed > 0 || (testsRun <= 0 || (testsPassed !== testsRun));
    }

// read build.config.json
    const config = getConfiguration();

    const { directories, srcDir, stagingDir, distDir } = getDirectoryNames();

    async function cleanDirectory( pPath )
    {
        let entries = fs.readdirSync( toUnixPath( pPath ), { withFileTypes: true } );

        if ( entries && entries.length > 0 )
        {
            for( let i = 0, n = entries.length; i < n; i++ )
            {
                let entry = entries[i];
                if ( entry )
                {
                    let path = toUnixPath( entry.path + "/" + entry.name );
                    if( entry.isFile() )
                    {
                        await fs.rm( path, function( pErr ) {} );
                    }
                    else
                    {
                        await cleanDirectory( path );
                    }
                }
            }
        }

        await fs.rm( toUnixPath( pPath ), function( pErr ) {} );
    }

    // clean up from last run
    async function clean()
    {
        await cleanDirectory( toUnixPath( __dirname + "/" + stagingDir ) );
        await cleanDirectory( toUnixPath( __dirname + "/" + distDir ) );

        await fs.rm( toUnixPath( __dirname + "/ctrf/ctrf-report.js" ), function( pErr ) {} );
    }

    await clean();

    // run jest tests, fail the build if any test(s) fail
    async function runTests()
    {
        await jest.run();

        return getTestResults();
    }

    let results = await runTests();

    let retries = 2;

    while ( !testsPassed( results ) && retries-- > 0 )
    {
        results = await runTests();
    }

    if ( !testsPassed( results ) )
    {
        throw new Error( "Unit Tests Failed" );
    }

    // create staging and target directories
    fs.mkdir( toUnixPath( __dirname + "/" + stagingDir ), function( pErr ) {} );
    fs.mkdir( toUnixPath( __dirname + "/" + distDir ), function( pErr ) {} );

    // copy source to staging
    let entries = fs.readdirSync( toUnixPath( srcDir ), { withFileTypes: true } );

    if ( entries && entries.length > 0 )
    {
        for( let i = 0, n = entries.length; i < n; i++ )
        {
            let entry = entries[i];

            let filename = entry.name;

            let src = toUnixPath( srcDir + "/" + filename );

            let dest = toUnixPath( __dirname + "/" + stagingDir + "/" + filename.replace( ".cjs", ".js" ) );

            fs.copyFile( src, dest, function() {} );
        }
    }

    // transform and copy cjs to mjs versions

    // minify all files in staging

    // move final files to the dist directories

}());