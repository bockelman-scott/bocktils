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

const configUtils = require( "./config.cjs" );

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

    async function cleanDirectory( pPath )
    {
        let entries = await fsAsync.readdir( pathUtils.normalize( toUnixPath( pPath ) ), { withFileTypes: true } );

        if ( entries && entries.length > 0 )
        {
            for( let i = 0, n = entries.length; i < n; i++ )
            {
                let entry = entries[i];
                if ( entry )
                {
                    let path = toUnixPath( pathUtils.normalize( toUnixPath( entry.path + "/" + entry.name ) ) );
                    if ( entry.isFile() )
                    {
                        await fsAsync.rm( path, { force: true, recursive: true } );
                    }
                    else
                    {
                        await cleanDirectory( path );
                    }
                }
            }
        }

        await fsAsync.rm( pathUtils.normalize( toUnixPath( pPath ) ), { force: true, recursive: true } );
    }

// clean up from last run
    async function clean( pConfig )
    {
        const config = pConfig || await configUtils.getConfiguration( __dirname, "../build/build.config.json" );

        const { directories, srcDir, stagingDir, distDir } = await configUtils.getDirectoryNames( config );

        try
        {
            await cleanDirectory( pathUtils.normalize( toUnixPath( stagingDir ) ) );
        }
        catch( ex )
        {
            // konsole.warn( ex );
        }

        try
        {
            await cleanDirectory( pathUtils.normalize( toUnixPath( distDir ) ) );
        }
        catch( ex )
        {
            // konsole.warn( ex );
        }
    }

    const mod =
        {
            cleanDirectory,
            clean
        };

    // when running in a Node.js environment, we assign the module to the global module.exports
    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    // return the module for environments expecting this function to return the module
    return Object.freeze( mod );

}());
