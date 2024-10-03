const fsAsync = require( "fs/promises" );

const pathUtils = require( "path" );

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
    const toAbsolutePath = stringUtils.toAbsolutePath;

    const rootDir = pathUtils.normalize( toAbsolutePath( "../../../" ) );

    async function getConfiguration( pPath, pName )
    {
        const filepath = pathUtils.normalize( toUnixPath( pPath || (rootDir + "/build/") ) );
        const filename = pathUtils.normalize( toUnixPath( pName || "build.config.json" ) );

        let configFilepath = toUnixPath( filepath + "/" + filename );

        let contents = await fsAsync.readFile( configFilepath, { encoding: "utf8" } );

        return jsonUtils.parseJson( contents );
    }

    async function getDirectoryNames( pConfig )
    {
        let config = pConfig || await getConfiguration();

        let directories = config.directories;

        let srcDir = directories.source;

        let stagingDir = directories.staging;

        let distDir = directories.distribution;

        let testsDir = directories.tests;

        return {
            directories: directories,
            rootDir: rootDir,
            srcDir: pathUtils.normalize( toUnixPath( rootDir ) + "/" + toUnixPath( srcDir ) ),
            stagingDir: pathUtils.normalize( toUnixPath( rootDir ) + "/" + toUnixPath( stagingDir ) ),
            distDir: pathUtils.normalize( toUnixPath( rootDir ) + "/" + toUnixPath( distDir ) ),
            testsDir:pathUtils.normalize( toUnixPath( rootDir ) + "/" + toUnixPath( testsDir ) )
        };
    }

    // create staging and target directories
    async function createDirectories( pConfig )
    {
        const config = pConfig || await getConfiguration();

        const { directories, srcDir, stagingDir, distDir } = await getDirectoryNames( config );

        try
        {
            await fsAsync.mkdir( toUnixPath( stagingDir ) );
        }
        catch( ex )
        {
            konsole.warn(ex);
        }

        try
        {
            await fsAsync.mkdir( toUnixPath( distDir ) );
        }
        catch( ex )
        {
            konsole.warn(ex);
        }
    }

    const mod =
        {
            getConfiguration,
            getDirectoryNames,
            createDirectories
        };

    // when running in a Node.js environment, we assign the module to the global module.exports
    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    // return the module for environments expecting this function to return the module
    return Object.freeze( mod );

}());
