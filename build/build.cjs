const fs = require( "fs" );
const fsAsync = require( "fs/promises" );

const uglify = require( "uglify-js" );

const jest = require( "jest" );

/**
 * This statement imports the common utils modules:
 * Constants, TypeUtils, StringUtils, ArrayUtils, ObjectUtils, and JsonUtils
 */
const utils = require( "../src/CommonUtils.cjs" );

/**
 * Establish separate constants for each of the common utilities imported
 * @see ../src/CommonUtils.cjs
 */
const constants = utils?.constants || require( "../src/Constants.cjs" );
const typeUtils = utils?.typeUtils || require( "../src/TypeUtils.cjs" );
const stringUtils = utils?.stringUtils || require( "../src/StringUtils.cjs" );
const arrayUtils = utils?.arrayUtils || require( "../src/ArrayUtils.cjs" );
const objectUtils = utils?.objectUtils || require( "../src/ObjectUtils.cjs" );
const jsonUtils = utils?.jsonUtils || require( "../src/JsonUtils.cjs" );

const configUtils = require( "./build-utils/config.cjs" );
const cleanUtils = require( "./build-utils/clean.cjs" );


/**
 * In lieu of grunt, this file just contains the very specific tasks to build this project
 */
(async function build()
{
    "use strict";

    const toUnixPath = stringUtils.toUnixPath;

    // read build.config.json
    const config = await configUtils.getConfiguration( __dirname, "build.config.json" );

    const { directories, srcDir, stagingDir, distDir } = await configUtils.getDirectoryNames( config );

    await cleanUtils.clean( config );

    await configUtils.createDirectories( config );

    // run jest tests, fail the build if any test(s) fail

    // copy source to staging

    async function copySourceToStaging()
    {
        let entries = await fsAsync.readdir( toUnixPath( srcDir ), { withFileTypes: true } );

        if ( entries && entries.length > 0 )
        {
            for( let i = 0, n = entries.length; i < n; i++ )
            {
                let entry = entries[i];

                if ( !entry.isFile() )
                {
                    continue;
                }

                let filename = entry.name;

                let src = toUnixPath( srcDir + "/" + filename );

                let dest = toUnixPath( stagingDir + "/" + filename.replace( ".cjs", ".js" ) );

                await fsAsync.copyFile( src, dest );
            }
        }
    }

    await copySourceToStaging();

    // transform and copy cjs to mjs versions

    async function transformCjsToMjs( pPath, pName )
    {
        const filepath = toUnixPath( pPath + "/" + pName );

        let contents = await fsAsync.readFile( filepath, { encoding: "utf8" } );

        let rx = /(const|let|var)[ \s]+([^ \s]+)[ \s]+=[ \s]+require[ \s]*\([ \s]*["']([^'"]+)["'][ \s]*\)/;

        let matches = rx.exec( contents );

        while ( matches && matches.length )
        {
            let moduleName = matches[3];

            moduleName = moduleName.replace( /\.cjs$/, ".mjs" );

            contents = contents.replace( rx, "import " + matches[2] + " from \"" + moduleName + "\"" );

            matches = rx.exec( contents );
        }

        let modName = pName.replace( /\.js|\.cjs$/g, "" );

        contents = contents.replace( "(function exposeModule()", "const " + modName + " = (function exposeModule()" );

        contents = contents.replace( /\.cjs$/g, ".mjs" );

        contents += "\nexport default " + modName + ";\n";

        return contents;
    }

    async function writeEs6Modules()
    {
        let files = await fsAsync.readdir( toUnixPath( stagingDir ), { withFileTypes: true } );

        await fsAsync.mkdir( toUnixPath( stagingDir + "/es6/" ) );

        for( let file of files )
        {
            if ( file.isFile() )
            {
                let contents = await transformCjsToMjs( file.path, file.name );

                await fsAsync.writeFile( toUnixPath( file.path + "/es6/" + file.name.replace( /\.js|\.cjs/, ".mjs" ) ), contents );
            }
        }
    }

    await writeEs6Modules();

    // minify all files in staging


    // move final files to the dist directories

}());
