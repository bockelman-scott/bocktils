const fsAsync = require( "fs/promises" );

const pathUtils = require( "path" );

const jest = require( "jest" );

/**
 * This statement imports the common utils modules:
 * Constants, TypeUtils, StringUtils, ArrayUtils, ObjectUtils, and JsonUtils
 */
const utils = require( "../../src/CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const constants = utils?.constants || require( "../../src/Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "../../src/TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "../../src/StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "../../src/ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "../../src/ObjectUtils.cjs" );
const jsonUtils = utils?.jsonUtils || require( "../../src/JsonUtils.cjs" );

/** create an alias for console **/
const konsole = console || {};

/** define a variable for typeof undefined **/
const _ud = constants?._ud || "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const toUnixPath = stringUtils.toUnixPath;

    async function getTestResults( pPath, pName )
    {
        let filepath = toUnixPath( pPath || __dirname );

        let filename = toUnixPath( pName || "ctrf-report.json" );

        let contents = await fsAsync.readFile( toUnixPath( filepath + "/" + filename ), { encoding: "utf8" } );

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

    async function runTests()
    {
        await jest.run();

        return getTestResults();
    }

    async function run()
    {
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

        return results;
    }

    const mod =
        {
            getTestResults,
            testsPassed,
            run
        };

    // when running in a Node.js environment, we assign the module to the global module.exports
    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    // return the module for environments expecting this function to return the module
    return Object.freeze( mod );

}());
