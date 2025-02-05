/**
 * @fileoverview
 * @name FileUtils
 * @author Scott Bockelman
 * @license MIT
 *
 * <p>This module exposes functions and classes for working with a local file system.</p>
 * <br>
 * These functions and classes aim to provide an abstraction and execution-environment agnostic adapter
 * to allow (to the extent possible) the same code using these functions and/or classes to work without modification
 * in Node.js, Deno, Browsers and Workers.
 * <br>
 */

/**
 * Represents the operating system API for working with the host system.<br>
 * In Node.js, this is "os", in Deno, this is the "Deno" global,
 * in browsers and workers, this is implemented via XmlHttpRequest (though discouraged and deprecated)
 *
 * @type {Object}
 */
let os;

/**
 * Represents the synchronous or callback-required API for working with a file system.<br>
 * In Node.js, this is "fs", in Deno, this is the "Deno" global,
 * in browsers and workers, this is implemented via XmlHttpRequest (though discouraged and deprecated)
 *
 * @type {Object}
 */
let fs;

/**
 * Represent the asynchronous API for working with a file system.<br>
 * In Node.js, this is "fs/promises", in Deno, this is the "Deno" global,
 * in browsers and workers, this is implemented via the Fetch API
 *
 * @type {Object}
 */
let fsAsync;

/**
 * Represent the stream API for working with streams.
 * In Node.js, this is "node:streams", in Deno, this is the "Deno" global,
 * in browsers and workers, this is implemented via WebSockets
 */
let stream;

/**
 * Represents the functionality related to resolving file paths and file names.
 * In Node.js, this is the node: path module.  In Deno, this is @TODO
 * In browsers, this is... @TODO
 *
 * @type {Object|function}
 */
let path;


/**
 * Represents the path of the current working directory.
 * This variable typically holds the absolute path of the directory
 * where the program is being executed.
 *
 * This value may be used for file system operations or to determine
 * the relative locations of other files and directories.
 *
 * Note: Ensure proper handling when manipulating or joining paths
 * to avoid errors related to file system operations.
 *
 * @type {string}
 */
let currentDirectory;

/**
 * Represents the root directory of the project.
 * This variable is used as a reference point for resolving
 * file and folder paths relative to the project's base directory.
 *
 * @type {string}
 */
let projectRootDirectory;

/**
 * Represents the default file system path <i>or URL</i> used as the base directory
 * for finding and loading resources.<br>
 *
 * @type {string}
 */
let defaultPath;

const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

/* define a variable for typeof undefined **/
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 * @type {function():Object}
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

// noinspection OverlyComplexFunctionJS,FunctionTooLongJS
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__FILE_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    let _deno = null;
    let _node = null;

    /*
     * Create local variables for the imported values and functions we use.
     */
    const {
        _str,
        _mt_str,
        _dot,
        _colon,
        _slash,
        _backslash,
        S_ERROR,
        no_op,
        ignore,
        lock,
        populateOptions,
        mergeOptions,
        immutableCopy,
        resolveVisitor,
        attempt,
        asyncAttempt,
        classes
    } = constants;

    const _pathSep = _slash;

    const { ModuleEvent, ModulePrototype, ExecutionEnvironment, Visitor } = classes;

    const {
        isDefined,
        isNull,
        isString,
        isNumber,
        isObject,
        isArray,
        isTypedArray,
        isDate,
        isNonNullObject,
        isFunction,
        isNumeric,
        isError,
        isDirectoryEntry,
        firstMatchingType,
        resolveMoment,
        isValidDateOrNumeric,
        VisitedSet,
        clamp
    } = typeUtils;

    const { asString, asInt, toUnixPath, toBool, isBlank, leftOfLast, rightOfLast } = stringUtils;

    const { varargs, asArray, Filters } = arrayUtils;

    const modName = "FileUtils";

    let modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const executionEnvironment = modulePrototype.executionEnvironment;

    const _isNode = executionEnvironment.isNode();
    const _isDeno = executionEnvironment.isDeno();
    const _isBrowser = executionEnvironment.isBrowser();

    /*## environment-specific:node start ##*/
    if ( _isNode )
    {
        _node = $scope();
        _deno = null;

        os = require( "node:os" );
        fs = require( "node:fs" );
        fsAsync = require( "node:fs/promises" );
        stream = require( "node:stream" );
        path = require( "node:path" );
        currentDirectory = path.dirname( __filename );
        projectRootDirectory = path.resolve( currentDirectory, "../../../" );
        defaultPath = path.resolve( currentDirectory, "../messages/defaults.json" );
    }
    /*## environment-specific:node end ##*/

    /*## environment-specific:deno start ##*/
    if ( _isDeno )
    {
        _node = null;
        _deno = executionEnvironment.DenoGlobal;
    }
    /*## environment-specific:deno end ##*/

    /*## environment-specific:browser start ##*/
    if ( _isBrowser )
    {
        _node = null;
        _deno = null;

        os = _ud !== typeof navigator ? navigator : {};
        fsAsync = _ud !== typeof fetch ? isFunction( fetch ) ? {} : {} : {};
        fs = fsAsync;
        stream = {};
        path = null;
        currentDirectory = _ud !== typeof window ? window.location.pathname : _mt_str;
        projectRootDirectory = _mt_str;
        defaultPath = currentDirectory;
    }

    /*## environment-specific:browser end ##*/


    async function importNodeModules()
    {
        try
        {
            os = require( "node:os" ) || os;
            fs = require( "node:fs" ) || fs;
            fsAsync = require( "node:fs/promises" ) || fsAsync;
            stream = require( "node:stream" ) || stream;
            path = require( "node:path" ) || path;
            currentDirectory = path.dirname( __filename ) || currentDirectory;
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, exposeModule, os, fs, fsAsync, stream, path, currentDirectory, projectRootDirectory, defaultPath );
        }
    }

    if ( _ud === typeof path || isNull( path ) )
    {
        path = {
            join: ( ...parts ) => parts.map( e => toUnixPath( e ) ).join( _pathSep ).replaceAll( /\/\/+/g, _pathSep ),
            basename: ( p ) => toUnixPath( p ).substring( toUnixPath( p ).lastIndexOf( _pathSep ) + 1 ),
            dirname: ( p ) => toUnixPath( p ).substring( 0, toUnixPath( p ).lastIndexOf( _pathSep ) ) || _dot,
            extname: ( p ) =>
            {
                let s = toUnixPath( p );
                const lastDot = s.lastIndexOf( _dot );
                if ( lastDot === -1 || lastDot === s.length - 1 )
                {
                    return _mt_str;
                }
                return s.substring( lastDot );
            },
            resolve: ( ...pathSegments ) =>
            {
                let resolvedPath = _mt_str;
                let segments = asArray( varargs( ...pathSegments ) ).map( e => toUnixPath( e ) );
                for( const segment of segments )
                {
                    if ( segment.startsWith( _pathSep ) )
                    {
                        resolvedPath = segment;
                    }
                    else if ( isBlank( resolvedPath ) )
                    {
                        resolvedPath = segment;
                    }
                    else
                    {
                        resolvedPath += _pathSep + segment;
                    }
                }
                return toUnixPath( resolvedPath );
            },
            isAbsolute: ( p ) =>
            {
                const s = toUnixPath( asString( p, true ) );
                return (s.startsWith( _pathSep ) || s.startsWith( _backslash ) || /^[A-Z]?:/.test( s )) && !s.includes( ".." );
            },
            normalize: ( p ) => toUnixPath( p ).replace( /\/\/+/g, _pathSep ).replace( /\/$/, _mt_str ),
            sep: _pathSep,
            delimiter: _colon,
            parse: ( pathString ) =>
            {
                const base = path.basename( pathString );
                const dir = path.dirname( pathString );
                const ext = path.extname( pathString );
                const name = base.substring( 0, base.length - ext.length );
                const root = pathString.startsWith( _pathSep ) ? _pathSep : _mt_str;
                return {
                    root: root,
                    dir: dir,
                    base: base,
                    ext: ext,
                    name: name
                };
            },
            format: ( pathObject ) =>
            {
                return toUnixPath( pathObject.dir + _pathSep + pathObject.base );
            }
        };
    }

    const FsFile = _deno?.FsFile || function() {};

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import this module<br>
     * and then use the other utilities as properties of this module.
     * <br>
     * @dict
     * @type {Object}
     */
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    function generateTempFileName( pPrefix = "temp", pExtension = ".tmp" )
    {
        const prefix = asString( pPrefix, true ) || "temp";

        const extension = asString( pExtension, true ) || ".tmp";

        const timestamp = asInt( Date.now() );

        return `${prefix}_${timestamp}_${Math.random().toString( 36 ).substring( 2, 15 )}${extension}`;
    }

    const {
        accessSync = _isNode ? fs.accessSync : function( pPath )
        {
            try
            {
                _deno.statSync( resolvePath( pPath ) );
                return true;
            }
            catch( ex )
            {
                modulePrototype.handleError( ex, access, pPath );
            }
            return false;
        },
        statSync = _isNode ? fs.statSync : _deno?.statSync,
        realpathSync = _isNode ? fs.realpathSync : _deno?.realPathSync,
        mkdirSync = _isNode ? fs.mkdirSync : _deno?.mkdirSync,
        rmdirSync = _isNode ? fs.rmdirSync || function( pPath, pOptions )
        {
            const options = mergeOptions( pOptions, { recurse: true, force: true, maxRetries: 3, retryDelay: 150 } );
            const filePath = resolveDirectoryPath( pPath );
            fs.rm( filePath, options );
        } : _deno?.removeSync,
        readdirSync = _isNode ? fs.readdirSync : _deno?.readDirSync,
        readFolderSync = _isNode ? function( pPath )
                                 {
                                     return fs.readdirSync( resolvePath( pPath ), { withFileTypes: true } );
                                 } :
                         function( pPath )
                         {
                             return _deno?.readDirSync( resolvePath( pPath ) );
                         },
        symlinkSync = _isNode ? fs.symlinkSync : _deno?.symlinkSync,
        unlinkSync = _isNode ? fs.unlinkSync : _deno?.removeSync,
        createWriteStream = _isNode ? fs.createWriteStream : function( pPath, pOptions )
        {

        },
        writeFileSync = _isNode ? fs.writeFileSync : _deno?.writeFileSync,
        writeTextFileSync = _isNode ? fs.writeFileSync : _deno?.writeTextFileSync,

        chmodSync = _isNode ? fs.chmodSync : _deno?.chmodSync,
        chownSync = _isNode ? fs.chownSync : _deno?.chownSync,
        closeSync = _isNode ? fs.closeSync : _deno?.closeSync || async function( pFsFile )
        {
            if ( pFsFile && isFunction( pFsFile?.close ) )
            {
                asyncAttempt( pFsFile.close() ).then( no_op ).catch( no_op );
            }
        },
        copyFileSync = _isNode ? fs.copyFileSync : _deno?.copyFileSync,
        createSync = _isNode ? function( pPath )
        {
            fs.writeFileSync( resolvePath( pPath ), _mt_str, { encoding: "utf8" } );
        } : _deno?.createSync,
        linkSync = _isNode ? fs.linkSync : _deno?.linkSync,
        lstatSync = _isNode ? fs.lstatSync : _deno?.lstatSync,
        makeTempDirSync = _isNode ? fs.mkdtempSync : _deno?.makeTempDirSync,
        makeTempFileSync = _isNode ? function( pPrefix = "temp", pExtension = ".tmp", pDirectory = null )
        {
            const tempFileName = generateTempFileName( pPrefix, pExtension );
            writeFileSync( pDirectory || asString( os.tempDir() || executionEnvironment.tmpDirectoryName, true ), _mt_str, { flag: "w" } );
            return tempFileName;
        } : function( pPrefix = "temp", pExtension = ".tmp", pDirectory = null )
                           {
                               return _deno?.makeTempFileSync( {
                                                                   prefix: pPrefix,
                                                                   suffix: pExtension,
                                                                   dir: pDirectory
                                                               }, );
                           },
        openSync = _isNode ? fs.openSync : _deno?.openSync,
        readDirSync = _isNode ? fs.readdirSync : _deno?.readDirSync,
        readFileSync = _isNode ? fs.readFileSync : _deno?.readFileSync,
        readLinkSync = _isNode ? fs.readlinkSync : _deno?.readLinkSync,
        readTextFileSync = _isNode ? function( pPath )
        {
            return fs.readFileSync( pPath, { encoding: "utf-8" } );
        } : _deno?.readTextFileSync,
        realPathSync = _isNode ? fs.realpathSync : _deno?.realPathSync,
        removeSync = _isNode ? fs.rmSync : _deno?.removeSync,
        renameSync = _isNode ? fs.renameSync : _deno?.renameSync,
        truncateSync = _isNode ? fs.truncateSync : _deno?.truncateSync,
        utimeSync = _isNode ? fs.utimesSync : _deno?.utimeSync,
        constants: fs_constants,
    } = (fs || _deno || _node || {});

    const {
        access = _isNode ? fsAsync.access : async function( pPath )
        {
            try
            {
                await stat( pPath );
                return true;
            }
            catch( ex )
            {
                modulePrototype.handleError( ex, access, pPath );
            }
            return false;
        },
        readdir = _isNode ? fsAsync.readdir : _deno?.readDir,
        readFolder = _isNode ? (async function( pPath )
        {
            return await fsAsync.readdir( resolvePath( pPath ), { withFileTypes: true } );
        }) : (_deno?.readDir ||
              async function( pPath )
              {
                  return await fsAsync.readdir( resolvePath( pPath ), { withFileTypes: true } );
              }),
        listFolderEntries = async function( pPath, pOptions )
        {
            const filePath = resolvePath( pPath );

            if ( isFunction( readdir ) )
            {
                return await readdir( filePath );
            }
            else if ( isFunction( _deno?.readDir ) )
            {
                const names = [];

                const entries = await _deno.readDir( filePath, pOptions );

                for await ( const entry of entries )
                {
                    names.push( path.join( pPath, entry.name ) );
                }

                return names;
            }
        },
        writeFile = _isNode ? fs.writeFile : _deno?.writeFile,
        writeTextFile = _isNode ? fs.writeFile : _deno?.writeTextFile,
        realpath = _isNode ? fs.realpath : _deno?.realPath,
        stat = _isNode ? fsAsync.stat : _deno?.stat,
        lstat = _isNode ? fsAsync.lstat : _deno?.lstat,
        rm = _isNode ? fsAsync.rm : _deno?.remove,
        rmdir = _isNode ? fsAsync.rmdir || async function( pPath, pOptions )
        {
            const options = mergeOptions( pOptions, { recurse: true, force: true, maxRetries: 3, retryDelay: 150 } );
            const filePath = resolveDirectoryPath( pPath );
            await fsAsync.rm( filePath, options );
        } : _deno?.remove,
        rename = _isNode ? fsAsync.rename : _deno?.rename,
        symlink = _isNode ? fsAsync.symlink : _deno?.symlink,
        unlink = _isNode ? fsAsync.unlink : _deno?.unlink,

        chmod = _isNode ? fsAsync.chmod : _deno?.chmod,
        chown = _isNode ? fsAsync.chown : _deno?.chown,
        close = _isNode ? fs.closeSync : _deno?.close || function( pFsFile )
        {
            if ( pFsFile && isFunction( pFsFile?.close ) )
            {
                pFsFile.close();
            }
        },
        copyFile = _isNode ? fsAsync.copyFile : _deno?.copyFile,
        create = _isNode ? async function( pPath, pOptions )
        {
            fs.writeFile( resolvePath( pPath ), _mt_str, populateOptions( pOptions, { encoding: "utf8" } ) );
        } : _deno?.create,
        makeTempDir = _isNode ? fsAsync.mkdtemp : _deno?.makeTempDir,
        makeTempFile = _isNode ? async function( pPrefix = "temp", pExtension = ".tmp", pDirectory = null )
        {
            const tempFileName = generateTempFileName( pPrefix, pExtension );
            await fsAsync.writeFile( pDirectory || asString( os.tempDir() || pDirectory ), _mt_str, {
                encoding: "utf-8",
                flag: "w"
            } );
            return tempFileName;
        } : _deno?.makeTempFile,
        mkdir = _isNode ? fsAsync.mkdir : _deno?.mkdir || _deno?.mkDir,
        open = _isNode ? fsAsync.open : _deno?.open,
        readDir = _isNode ? fsAsync.readdir : _deno?.readDir,
        readFile = _isNode ? fsAsync.readFile : _deno?.readFile,
        readLink = _isNode ? fsAsync.readlink : _deno?.readLink,
        readTextFile = _isNode ? async function( pPath ) { return await fsAsync.readFile( pPath, { encoding: "utf-8" } ); } : _deno?.readTextFile,
        realPath = _isNode ? fsAsync.realpath : _deno?.realPath,
        remove = _isNode ? fsAsync.rm : _deno?.remove,
        truncate = _isNode ? fsAsync.truncate : _deno?.truncate,
        umask = _isNode ? process.umask : _deno?.umask,
        utime = _isNode ? fsAsync.utimes : _deno?.utime,
        watchFs = _isNode ? fsAsync.watch : _deno?.watchFs,

    } = (fsAsync || _deno || _node || {});

    const F_OK = _isNode ? fs_constants.F_OK : _isDeno ? 0 : 0;

    const MILLIS_PER_SECOND = 1000;
    const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
    const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
    const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;

    function resolvePath( pPath )
    {
        let p = _mt_str;

        if ( isNull( pPath ) )
        {
            return p;
        }

        if ( isArray( pPath ) )
        {
            p = path.resolve( ...(asArray( pPath ).flat()) );
        }
        else if ( isObject( pPath ) )
        {
            p = path.resolve( path.join( (pPath?.parentPath || pPath?.path || "./"), (pPath.name || _mt_str) ) );
        }
        else
        {
            p = path.resolve( toUnixPath( asString( pPath, true ).trim() ) );
        }

        return toUnixPath( asString( p, true ) );
    }

    function resolveDirectoryPath( pDirectoryPath )
    {
        return toUnixPath( isString( pDirectoryPath ) ? path.resolve( toUnixPath( asString( pDirectoryPath, true ) ) ) : resolvePath( pDirectoryPath ) );
    }

    function extractPathSeparator( pPath )
    {
        let matches = /([\/\\]+)/.exec( resolvePath( pPath ) );
        return (matches && matches?.length > 1 ? matches[1] : _pathSep);
    }

    function getFilePathData( pFilePath )
    {
        const filePath = resolvePath( pFilePath );

        const fileName = asString( path.basename( filePath ) || rightOfLast( filePath, _slash ), true );

        const dirName = asString( path.dirname( filePath ) || leftOfLast( filePath, _slash ), true );

        const extension = asString( path.extname( fileName ), true ) || (fileName.lastIndexOf( _dot ) > 0 ? fileName.slice( fileName.lastIndexOf( _dot ) ) : _mt_str);

        return { filePath, dirName, fileName, extension };
    }

    function getFileExtension( pFilePath )
    {
        const { fileName, extension } = getFilePathData( pFilePath );
        return asString( extension, true ) || asString( _dot + rightOfLast( fileName, _dot ), true );
    }

    function getFileName( pFilePath )
    {
        const { filePath, fileName } = getFilePathData( pFilePath );
        return asString( (fileName || rightOfLast( filePath, _slash )), true );
    }

    function getDirectoryName( pFilePath )
    {
        const { filePath, dirName } = getFilePathData( pFilePath );
        return asString( dirName, true ) || asString( leftOfLast( filePath, _slash ), true );
    }

    const exists = function( pPath )
    {
        let exists;

        try
        {
            accessSync( resolvePath( pPath ), F_OK );
            exists = true;
        }
        catch( ignored )
        {
            exists = false;
        }

        return exists;
    };

    const asyncExists = async function( pPath )
    {
        let exists;
        try
        {
            await access( resolvePath( pPath ), F_OK );
            exists = true;
        }
        catch( ignored )
        {
            exists = false;
        }
        return exists;
    };

    /**
     * Creates a directory at the specified path if it does not already exist.
     *
     * This function resolves the provided directory path, converts it to a Unix-style path,
     * checks if the directory exists, and attempts to create it if it does not. The creation
     * process includes options to create parent directories recursively if necessary.
     *
     * If the directory does not exist and cannot be created, a warning is logged.
     *
     * @param {string} pDirectoryPath - The path of the directory to be created. The path is
     *                                   resolved and processed to ensure validity.
     * @returns {boolean} Returns true if the directory either already exists or was successfully created;
     *                    otherwise, false.
     */
    const makeDirectory = function( pDirectoryPath )
    {
        let dirPath = resolveDirectoryPath( pDirectoryPath );

        if ( !exists( dirPath ) )
        {
            attempt( () =>
                     {
                         mkdirSync( dirPath, { recursive: true } );
                     } );
        }

        return exists( dirPath );
    };

    /**
     * Asynchronously creates a directory if it does not already exist.
     *
     * @param {string} pDirectoryPath - The path of the directory to create. The path will be
     * converted to Unix-style before attempting to create the directory.
     * @returns {Promise<boolean>} Resolves with `true` if the directory exists or is successfully created,
     * otherwise resolves with `false`.
     */
    const asyncMakeDirectory = async function( pDirectoryPath )
    {
        let dirPath = resolveDirectoryPath( pDirectoryPath );

        await asyncAttempt( async() => await fsAsync.mkdir( dirPath, { recursive: true } ) );

        return await asyncExists( dirPath );
    };

    const removeDirectory = function( pDirectoryPath )
    {
        let dirPath = resolveDirectoryPath( pDirectoryPath );

        attempt( () => rmdirSync( dirPath, { recursive: true } ) );

        return !exists( dirPath );
    };

    const asyncRemoveDirectory = async function( pDirectoryPath )
    {
        let dirPath = resolveDirectoryPath( pDirectoryPath );

        await asyncAttempt( async() => await rmdir( dirPath, { recursive: true, maxRetries: 3, retryDelay: 150 } ) );

        return !await asyncExists( dirPath );
    };

    const link = function( pSourcePath, pTargetPath )
    {
        attempt( () => symlinkSync( resolvePath( pSourcePath ), resolvePath( pTargetPath ) ) );
    };

    const asyncLink = async function( pSourcePath, pTargetPath )
    {
        asyncAttempt( async() => await symlink( resolvePath( pSourcePath ), resolvePath( pTargetPath ) ) );
    };

    const NO_ATTRIBUTES = lock( {
                                    isFile: () => false,
                                    isDirectory: () => false,
                                    isSymbolicLink: () => false,
                                    size: 0,
                                    created: null,
                                    modified: null,
                                    accessed: null,
                                    stats: {}
                                } );

    class DirectoryEntry
    {
        #entry;

        #name;
        #isFile;
        #isDirectory;
        #isSymLink;

        #parentPath;

        constructor( pDirEntry, pFullPath )
        {
            const object = isNonNullObject( pDirEntry ) ? pDirEntry : isString( pDirEntry ) ? { name: getFileName( pDirEntry ) } : {};

            this.#entry = isDirectoryEntry( object ) ? pDirEntry : null;

            this.#name = object?.name || (isString( pDirEntry ) ? getFileName( pDirEntry ) : null);

            this.#parentPath = object?.parentPath || object?.path || (isString( pFullPath ) ? getDirectoryName( pFullPath ) : null);

            this.#isFile = isFunction( object?.isFile ) ? object?.isFile() : object?.isFile || false;

            this.#isDirectory = isFunction( object?.isDirectory ) ? object?.isDirectory() : object?.isDirectory || false;

            this.#isSymLink = isFunction( object?.isSymbolicLink ) ? object?.isSymbolicLink() : object?.isSymbolicLink || object?.isSymLink || false;
        }

        isFile()
        {
            return this.#isFile || ( !isNull( this.#entry ) && (isFunction( this.#entry.isFile ) ? this.#entry.isFile() : this.#entry.isFile));
        }

        isDirectory()
        {
            return this.#isDirectory || ( !isNull( this.#entry ) && (isFunction( this.#entry.isDirectory ) ? this.#entry.isDirectory() : this.#entry.isDirectory));
        }

        isSymLink()
        {
            return this.#isSymLink || ( !isNull( this.#entry ) && (isFunction( this.#entry.isSymbolicLink ) ? this.#entry.isSymbolicLink() : this.#entry.isSymLink));
        }

        get name()
        {
            return asString( this.#name, true );
        }

        get entry()
        {
            return this.#entry || {
                name: this.#name,
                isDirectory: this.#isDirectory,
                isFile: this.#isFile,
                isSymLink: this.#isSymLink,
                parentPath: this.#parentPath
            };
        }

        get parentPath()
        {
            return asString( this.#parentPath || this.entry?.parentPath || _mt_str, true );
        }
    }

    DirectoryEntry.from = function( pObject, pFullPath )
    {
        const object = isNonNullObject( pObject ) ? pObject : {};

        if ( isDirectoryEntry( object ) )
        {
            return new DirectoryEntry( object, pFullPath );
        }

        return new DirectoryEntry( {
                                       name: object?.name,
                                       isFile: isFunction( object?.isFile ) ? object?.isFile() : object?.isFile || false,
                                       isDirectory: isFunction( object?.isDirectory ) ? object?.isDirectory() : object?.isDirectory || false,
                                       isSymbolicLink: isFunction( object?.isSymbolicLink ) ? object?.isSymbolicLink() : object?.isSymbolicLink || object?.isSymLink || false
                                   },
                                   resolvePath( pFullPath ) );
    };

    /**
     * Represents a subset of the attributes of a file or directory
     * obtained from calls to stat, lstat, or fstat.<br>
     * <br>
     *
     */
    class FileStats
    {
        #stats;

        #size;

        #_isFile;
        #_isDirectory;
        #_isSymbolicLink;

        #created;
        #modified;
        #accessed;

        #filePath;

        /**
         * Constructs an instance of the FileStats class
         * from an object whose structure matches that of the Node.js fs.Stats class
         *
         * @param {fs.Stats|fs.Dirent|{size:number,birthtime:Date,mtime:Date,atime:Date}} pObject
         * @param {string} [pFilePath=null]
         */
        constructor( pObject, pFilePath )
        {
            const object = isObject( pObject ) ? (isDirectoryEntry( pObject ) ? DirectoryEntry.from( pObject, pFilePath ) : pObject) : {};

            this.#stats = { ...object };

            this.#size = asInt( object?.size, 0 );

            this.#created = isDate( object?.birthtime ) ? new Date( object?.birthtime ) : object?.created;
            this.#modified = isDate( object?.mtime ) ? new Date( object?.mtime ) : object?.modified;
            this.#accessed = isDate( object?.atime ) ? new Date( object?.atime ) : object?.accessed;

            this.#_isFile = isFunction( object?.isFile ) ? object?.isFile() : object?.isFile || false;
            this.#_isDirectory = isFunction( object?.isDirectory ) ? object?.isDirectory() : object?.isDirectory || false;
            this.#_isSymbolicLink = isFunction( object?.isSymbolicLink ) ? object?.isSymbolicLink() : object?.isSymbolicLink || object?.isSymLink || false;

            this.#filePath = resolvePath( pFilePath || (asString( path.resolve( object?.parentPath || object?.path || _mt_str, object?.name || _mt_str ), true )) );
        }

        get size()
        {
            let sz = asInt( this.#size );

            if ( sz <= 0 )
            {
                let stats = this.stats;

                if ( !isNumber( stats.size ) )
                {
                    stats = this.updateStats();
                }

                this.#size = stats.size;
            }

            return asInt( this.#size );
        }

        updateStats()
        {
            let stats = this.stats;

            const filePath = this.filePath;

            if ( !isBlank( filePath ) )
            {
                stats = attempt( () => statSync( filePath ) );

                this.#stats = { ...stats };
            }

            return stats || this.stats;
        }

        isFile()
        {
            return toBool( this.#_isFile );
        }

        isDirectory()
        {
            return toBool( this.#_isDirectory );
        }

        isSymbolicLink()
        {
            return toBool( this.#_isSymbolicLink );
        }

        get created()
        {
            return isValidDateOrNumeric( this.#created ) ? new Date( this.#created ) : this.birthtime;
        }

        get modified()
        {
            return isValidDateOrNumeric( this.#modified ) ? new Date( this.#modified ) : this.mtime;
        }

        get accessed()
        {
            return isValidDateOrNumeric( this.#accessed ) ? new Date( this.#accessed ) : this.atime;
        }

        get filePath()
        {
            return asString( this.#filePath, true );
        }

        get stats()
        {
            return this.#stats || (!isBlank( this.filePath ) ? statSync( this.filePath ) : {});
        }

        get birthtime()
        {
            if ( !isDate( this.#created ) )
            {
                let stats = this.stats;

                if ( !isDate( stats?.birthtime ) )
                {
                    stats = this.updateStats();
                }

                this.#created = new Date( stats.birthtime );
            }

            return new Date( this.#created );
        }

        get mtime()
        {
            if ( !isDate( this.#modified ) )
            {
                let stats = this.stats;

                if ( !isDate( stats?.mtime ) )
                {
                    stats = this.updateStats();
                }

                this.#modified = new Date( stats.mtime );
            }

            return new Date( this.#modified );
        }

        get atime()
        {
            if ( !isDate( this.#accessed ) )
            {
                let stats = this.stats;

                if ( !isDate( stats?.atime ) )
                {
                    stats = this.updateStats();
                }

                this.#accessed = new Date( stats.atime );
            }
            return new Date( this.#accessed );
        }
    }

    FileStats.forPath = async function( pFilePath )
    {
        const filePath = resolvePath( pFilePath );

        if ( isBlank( filePath ) )
        {
            modulePrototype.handleError( new IllegalArgumentError( "Path is required", {} ), FileStats.forPath, pFilePath, filePath );
            return NO_ATTRIBUTES;
        }

        try
        {
            const stats = await stat( path.normalize( filePath ) );
            return new FileStats( stats, filePath );
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, FileStats.forPath, pFilePath );
        }

        return NO_ATTRIBUTES;
    };

    /**
     * Asynchronously checks if the given path is a file.
     *
     * @param {string} pPath - The path to check, provided as a string.
     * @return {Promise<boolean>} A promise that resolves to `true` if the path is a file, `false` otherwise.
     */
    async function isFile( pPath )
    {
        const fileStates = await FileStats.forPath( resolvePath( pPath ) );
        return fileStates?.isFile() || false;
    }

    /**
     * Checks whether the specified path refers to a directory.
     *
     * @param {string} pPath - The path to check, normalized and resolved to an absolute path.
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isDirectory( pPath )
    {
        const fileStats = await FileStats.forPath( resolvePath( pPath ) );
        return fileStats?.isDirectory() || false;
    }

    /**
     * Checks whether the specified path refers to a directory.
     *
     * @param {string} pPath - The path to check, normalized and resolved to an absolute path.
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isSymbolicLink( pPath )
    {
        const fileStats = await FileStats.forPath( resolvePath( pPath ) );
        return fileStats?.isSymbolicLink() || false;
    }

    /**
     * Removes the file extension from the given file path.
     *
     * @param {string} pPath - The file path from which the extension will be removed.
     *
     * @param {boolean} [pExhaustive=false]
     *
     * @return {string} The file path without the extension(s).
     */
    function removeExtension( pPath, pExhaustive = false )
    {
        let filepath = resolvePath( pPath );

        const ext = getFileExtension( filepath );

        const rxExt = new RegExp( (ext + "$") );

        filepath = filepath.replace( rxExt, _mt_str );
        filepath = filepath.replace( /[\/\\]+$/, _mt_str );
        filepath = filepath.replace( rxExt, _mt_str );

        const exhaustive = !!pExhaustive;

        if ( exhaustive )
        {
            const name = asString( path.basename( filepath ), true );

            while ( !isBlank( name ) && !name.startsWith( _dot ) && /(\.\w*)$/.test( name ) )
            {
                filepath = removeExtension( filepath, exhaustive );
            }
        }

        return filepath.trim();
    }

    /**
     * Replaces the extension of a given file path with a new extension.
     *
     * @param {string} pPath - The file path whose extension needs to be replaced.
     * @param {string} pNewExtension - The new extension to be applied to the file path.
     * @param pExhaustive
     * @return {string} The updated file path with the new extension.
     */
    function replaceExtension( pPath, pNewExtension, pExhaustive = false )
    {
        const newExt = asString( pNewExtension, true ).replace( /^\.+/, _mt_str );

        const newFilename = removeExtension( resolvePath( pPath ), pExhaustive );

        return (newFilename + (_dot + newExt)).trim();
    }

    function getFileEntry( pFilePath )
    {
        const { dirName, fileName } = getFilePathData( pFilePath );

        const entries = readFolderSync( dirName, { withFileTypes: true } );

        return entries.find( entry => entry.name === fileName );
    }

    async function asyncGetFileEntry( pFilePath )
    {
        const { dirName, fileName } = getFilePathData( pFilePath );

        const entries = await readFolder( dirName );

        return entries.find( entry => entry.name === fileName );
    }

    function getTempDirectory()
    {
        return (_isNode && os) ? attempt( () => os.tmpdir() ) || executionEnvironment.tmpDirectoryName : executionEnvironment.tmpDirectoryName;
    }

    const resolveTempFileArguments = function( pPrefix = "temp", pExtension = ".tmp", pDirectory = null )
    {
        const tempDir = isNull( pDirectory ) ? getTempDirectory() : resolveDirectoryPath( pDirectory );

        const prefix = asString( pPrefix, true ) || "temp";
        const extension = asString( pExtension, true ) || ".tmp";

        const randomFileName = generateTempFileName( prefix, extension );

        const filePath = path.join( tempDir, randomFileName );

        return {
            tempDir,
            prefix,
            extension,
            filePath,
        };
    };

    function createTempFile( pPrefix = "temp", pExtension = ".tmp", pDirectory = null )
    {
        let { tempDir, prefix, extension, filePath } = resolveTempFileArguments( pPrefix, pExtension, pDirectory );

        try
        {
            if ( _isDeno && isFunction( _deno.makeTempFileSync ) )
            {
                filePath = _deno.makeTempFileSync( { dir: tempDir, prefix: prefix, suffix: extension } );
            }
            else
            {
                writeFileSync( filePath, _mt_str, { flag: "w" } );
            }
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, createTempFile, pPrefix, pExtension, pDirectory );
        }

        return getFileEntry( filePath );
    }

    async function asyncCreateTempFile( pPrefix = "temp", pExtension = ".tmp", pDirectory = null )
    {
        let { tempDir, prefix, extension, filePath } = resolveTempFileArguments( pPrefix, pExtension, pDirectory );

        try
        {
            if ( _isDeno && isFunction( _deno?.makeTempFile ) )
            {
                filePath = await _deno.makeTempFile( { dir: tempDir, prefix: prefix, suffix: extension } );
            }
            else
            {
                await writeFile( filePath, _mt_str, { flag: "w" } );
            }
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, asyncCreateTempFile, pPrefix, pExtension, pDirectory );
        }

        return await asyncGetFileEntry( filePath );
    }

    function createTextFile( pFilePath, pContent = _mt_str, pOverwrite = false )
    {
        const filePath = resolvePath( pFilePath );
        const content = asString( pContent );

        if ( pOverwrite || !exists( filePath ) )
        {
            if ( _isNode )
            {
                writeFileSync( filePath, content, { flag: "w", flush: true } );
            }
            else if ( _isDeno )
            {
                writeTextFileSync( filePath, content, { append: true, create: pOverwrite } );
            }
        }
        else
        {
            const error = new Error( `File ${filePath} already exists` );
            modulePrototype.handleError( error, createTextFile, pFilePath, pContent, pOverwrite );
        }

        return getFileEntry( filePath );
    }

    async function asyncCreateTextFile( pFilePath, pContent, pOverwrite = false )
    {
        const filePath = resolvePath( pFilePath );

        const content = asString( pContent );

        if ( pOverwrite || !exists( filePath ) )
        {
            if ( _isNode )
            {
                await writeFile( filePath, content, { flag: "w" } );
            }
            else if ( _isDeno )
            {
                await writeTextFile( filePath, content, { append: true, create: pOverwrite } );
            }
        }
        else
        {
            const error = new Error( `File ${filePath} already exists` );
            modulePrototype.handleError( error, asyncCreateTextFile, pFilePath, pContent, pOverwrite );
        }

        return await asyncGetFileEntry( filePath );
    }

    const deleteFile = function( pFilePath, pFollowLinks = false )
    {
        const filePath = resolvePath( pFilePath );

        if ( exists( filePath ) )
        {
            let realPath = filePath;

            if ( pFollowLinks )
            {
                isSymbolicLink( filePath ).then( ( pResult ) =>
                                                 {
                                                     if ( !isError( pResult ) && true === pResult )
                                                     {
                                                         realPath = attempt( () => realpathSync( filePath ) );

                                                         if ( realPath !== filePath )
                                                         {
                                                             attempt( () => unlinkSync( realPath ) );
                                                         }
                                                     }
                                                 } ).catch( ( err ) => modulePrototype.handleError( err, deleteFile, pFilePath, filePath, realPath ) );
            }

            attempt( () => unlinkSync( filePath ) );

            if ( realPath !== filePath )
            {
                attempt( () => unlinkSync( realPath ) );
            }
        }

        return !exists( filePath );
    };

    const asyncDeleteFile = async function( pFilePath, pFollowLinks = false )
    {
        const filePath = resolvePath( pFilePath );

        if ( await asyncExists( filePath ) )
        {
            let realPath = filePath;

            if ( pFollowLinks && await isSymbolicLink( filePath ) )
            {
                realPath = await realpath( filePath );
            }

            await asyncAttempt( () => unlink( filePath ) );

            if ( realPath !== filePath )
            {
                await asyncAttempt( async() => await unlink( realPath ) );
            }
        }

        return !(await asyncExists( filePath ));
    };

    const deleteMatchingFiles = function( pDirectoryPath, pFileNameFilter, pFollowLinks = false )
    {
        const dirPath = resolveDirectoryPath( pDirectoryPath );

        const filter = Filters.IS_FILTER( pFileNameFilter ) ? pFileNameFilter : Filters.NONE;

        const deleted = [];

        if ( exists( dirPath ) && isDirectory( dirPath ) )
        {
            const files = readFolderSync( dirPath, { withFileTypes: true } );

            for( const file of files )
            {
                if ( !isNull( file ) )
                {
                    if ( (file.isFile() || file.isSymbolicLink()) && filter( file.name ) )
                    {
                        const filePath = resolvePath( path.join( dirPath, file.name ) );
                        if ( deleteFile( filePath, pFollowLinks ) )
                        {
                            deleted.push( filePath );
                        }
                    }
                }
            }
        }

        return deleted;
    };

    const asyncDeleteMatchingFiles = async function( pDirectoryPath, pFileNameFilter, pFollowLinks = false )
    {
        const dirPath = resolveDirectoryPath( pDirectoryPath );

        const filter = Filters.IS_FILTER( pFileNameFilter ) ? pFileNameFilter : Filters.NONE;

        const deleted = [];

        if ( await asyncExists( dirPath ) && await isDirectory( dirPath ) )
        {
            const files = await readFolder( dirPath );

            for await ( const file of files )
            {
                if ( !isNull( file ) )
                {
                    if ( (file.isFile() || file.isSymbolicLink()) && filter( file.name ) )
                    {
                        const filePath = resolvePath( path.join( dirPath, file.name ) );
                        if ( await asyncDeleteFile( filePath, pFollowLinks ) )
                        {
                            deleted.push( filePath );
                        }
                    }
                }
            }
        }

        return deleted;
    };

    class FileObject extends EventTarget
    {
        #filepath;
        #attributes;
        #entry;

        #fsFile;

        #_isFile;
        #_isDirectory;
        #_isSymbolicLink;

        #created;
        #modified;
        #accessed;

        #size;

        #valid;

        constructor( pFilePath, pFileAttributes = null, pDirEntry = null )
        {
            super();

            this.#filepath = resolvePath( pFilePath );

            this.#attributes = isNonNullObject( pFileAttributes ) ?
                               new FileStats( pFileAttributes, this.#filepath ) :
                               isNonNullObject( pDirEntry ) ?
                               new FileStats( pDirEntry ) : {};

            this.updateAttributes( this.#attributes );

            this.#entry = isNonNullObject( pDirEntry ) ? new DirectoryEntry( pDirEntry, this.#filepath ) : {};

            this.#valid = !isBlank( this.#filepath );
        }

        updateAttributes( pAttributes, pPopulateIfMissing = false )
        {
            let attributes = pAttributes || this.#attributes;

            attributes = (isNonNullObject( attributes ) && Object.keys( attributes ).length > 0) ? attributes : (pPopulateIfMissing ? new FileStats( statSync( this.filepath ), this.filepath ) : {});

            const createdDate = attributes?.created || this.#created;
            const modifiedDate = attributes?.modified || this.#modified;
            const accessedDate = attributes?.accessed || this.#accessed;

            this.#created = isValidDateOrNumeric( createdDate ) ? new Date( asInt( createdDate ) ) : this.#created;
            this.#modified = isValidDateOrNumeric( modifiedDate ) ? new Date( asInt( modifiedDate ) ) : this.#modified;
            this.#accessed = isValidDateOrNumeric( accessedDate ) ? new Date( asInt( accessedDate ) ) : this.#accessed;

            this.#size = asInt( attributes?.size, this.#size );

            this.#_isFile = isFunction( attributes?.isFile ) ? attributes?.isFile() : this.#_isFile;
            this.#_isDirectory = isFunction( attributes?.isDirectory ) ? attributes?.isDirectory() : this.#_isDirectory;
            this.#_isSymbolicLink = isFunction( attributes?.isSymbolicLink ) ? attributes?.isSymbolicLink() : this.#_isSymbolicLink;

            this.#attributes = isNonNullObject( attributes ) ? new FileStats( attributes, this.filepath ) : this.#attributes;

            return this;
        }

        get filepath()
        {
            return asString( this.#filepath, true );
        }

        get filename()
        {
            return getFileName( this.filepath );
        }

        get directory()
        {
            return getDirectoryName( this.filepath );
        }

        toString()
        {
            return this.filepath;
        }

        [Symbol.toPrimitive]( pHint )
        {
            return this.filepath;
        }

        [Symbol.toStringTag]()
        {
            return this.filepath;
        }

        async getStats()
        {
            const me = this;
            const stats = await asyncAttempt( async() => await stat( (me || this).filepath || this.filepath ) );

            if ( !isNull( stats ) )
            {
                this.updateAttributes( new FileStats( stats, this.filepath ), true );
            }

            return stats || this.#attributes;
        }

        async getLStats()
        {
            const me = this;
            const stats = await asyncAttempt( async() => await lstat( (me || this).filepath || this.filepath ) );

            if ( !isNull( stats ) )
            {
                this.updateAttributes( new FileStats( stats, this.filepath ), true );
            }

            return stats || this.#attributes;
        }

        async _refreshFileStats()
        {
            const me = this;
            return await asyncAttempt( async() => await (me || this).getStats() );
        }

        async _refreshStats()
        {
            const me = this;
            return await asyncAttempt( async() => (await (me || this).isSymbolicLink() ? await (me || this).getLStats() : await (me || this).getStats()) );
        }

        async getSize()
        {
            if ( isNull( this.#size ) || !isNumeric( this.#size ) || this.#size <= 0 )
            {
                const stats = await this._refreshFileStats();
                this.#size = stats.size;
            }

            return this.#size;
        }

        get size()
        {
            const me = this;
            return asInt( this.#size ) > 0 ? this.#size : attempt( statSync( (me || this).filepath || this.filepath ) ).size;
        }

        async getCreatedDate()
        {
            if ( isNull( this.#created ) || !isDate( this.#created ) )
            {
                const stats = await this._refreshStats();
                this.#created = new Date( stats.birthtime || stats.created || this.#created );
            }
            return new Date( this.#created );
        }

        get created()
        {
            const me = this;
            return isDate( this.#created ) ? new Date( this.#created ) : attempt( () => statSync( (me || this).filepath ) ).birthtime;
        }

        async getModifiedDate()
        {
            if ( isNull( this.#modified ) || !isDate( this.#modified ) )
            {
                const stats = await this._refreshStats();
                this.#modified = new Date( stats.mtime );
            }
            return new Date( this.#modified );
        }

        async getAccessedDate()
        {
            if ( isNull( this.#accessed ) || !isDate( this.#accessed ) )
            {
                const stats = await this._refreshStats();
                this.#accessed = new Date( stats.atime );
            }
            return new Date( this.#accessed );
        }

        async calculateAge( pNow )
        {
            const now = resolveMoment( pNow );
            const createdDate = await this.getCreatedDate();
            return isDate( createdDate ) ? Math.floor( (now.getTime() - createdDate.getTime()) / (MILLIS_PER_DAY) ) : 0;
        }

        async isExpired( pMaxAgeDays, pNow )
        {
            const now = resolveMoment( pNow );
            const age = clamp( await this.calculateAge( now ), 0, 1_000 );
            return age > asInt( pMaxAgeDays, age );
        }

        async compareTo( pOther )
        {
            const now = new Date();

            const other = pOther instanceof this.constructor ? pOther : new FileObject( pOther );

            const thisCreated = await this.getCreatedDate();

            const createdDate = firstMatchingType( Date, thisCreated, now );

            const otherCreated = await other.getCreatedDate();

            const otherCreatedDate = firstMatchingType( Date, otherCreated, now );

            const thisTime = isDate( createdDate ) ? createdDate.getTime() : isNumeric( createdDate ) ? asInt( createdDate ) : 0;

            const otherTime = isDate( otherCreatedDate ) ? otherCreatedDate.getTime() : isNumeric( otherCreatedDate ) ? asInt( otherCreatedDate ) : 0;

            let comp = thisTime - otherTime;

            if ( 0 === comp )
            {
                comp = this.filepath.localeCompare( other.filepath );
            }

            return comp;
        }

        async isFile()
        {
            if ( isNull( this._isFile ) )
            {
                const stats = await this._refreshFileStats();

                this._isFile = stats.isFile();
                this._isSymbolicLink = stats.isSymbolicLink();
                this._isDirectory = stats.isDirectory();
            }

            return this._isFile;
        }

        async isSymbolicLink()
        {
            if ( isNull( this._isSymbolicLink ) )
            {
                const stats = await this._refreshFileStats();

                this._isFile = stats.isFile();
                this._isSymbolicLink = stats.isSymbolicLink();
                this._isDirectory = stats.isDirectory();
            }

            return this._isSymbolicLink;
        }

        async isDirectory()
        {
            if ( isNull( this._isDirectory ) )
            {
                const stats = await this._refreshFileStats();

                this._isFile = stats.isFile();
                this._isSymbolicLink = stats.isSymbolicLink();
                this._isDirectory = stats.isDirectory();
            }

            return this._isDirectory;
        }

        async getRealPath()
        {
            if ( await this.isSymbolicLink() )
            {
                return await realpath( this.filepath );
            }
            return this.filepath;
        }
    }

    FileObject.NO_FILE = new FileObject( _mt_str, {}, {} );

    FileObject.compare = async function( pA, pB )
    {
        const a = pA instanceof FileObject ? pA : new FileObject( pA );
        const b = pB instanceof FileObject ? pB : new FileObject( pB );
        return await a.compareTo( b );
    };

    FileObject.sort = async function( ...pFiles )
    {
        const files = asArray( varargs( ...pFiles ) ).map( pFile => pFile instanceof FileObject ? pFile : new FileObject( pFile ) );

        async function convert( pFile )
        {
            const fileInfo = pFile instanceof FileObject ? pFile : new FileObject( pFile );

            const created = await fileInfo.getCreatedDate();

            const size = await fileInfo.getSize();

            return { fileInfo, created, size };
        }

        const promises = files.map( convert );

        const comparator = function( pA, pB )
        {
            let comp = pA.created.getTime() - pB.created.getTime();
            if ( 0 === comp )
            {
                comp = pA.size - pB.size;
            }
            if ( 0 === comp )
            {
                comp = pA.fileInfo.filepath.localeCompare( pB.fileInfo.filepath );
            }
            return comp;
        };

        let results = await Promise.all( promises );

        let sorted = results.sort( comparator );

        sorted = sorted.map( e => e.fileInfo );

        return sorted;
    };

    FileObject.sortDescending = async function( ...pFiles )
    {
        let files = await FileObject.sort( ...pFiles );
        return files.reverse();
    };

    FileObject.from = function( pFilePath, pStats, pDirEntry )
    {
        if ( pFilePath instanceof FileObject )
        {
            return pFilePath;
        }

        const filePath = resolvePath( pFilePath );

        if ( !isBlank( filePath ) )
        {
            const stats = pStats || attempt( () => statSync( filePath ) );
            return new FileObject( filePath, stats, pDirEntry );
        }

        return FileObject.NO_FILE;
    };

    FileObject.fromAsync = async function( pFilePath, pStats, pDirEntry )
    {
        if ( pFilePath instanceof FileObject )
        {
            return pFilePath;
        }

        const filePath = resolvePath( pFilePath );

        if ( !isBlank( filePath ) )
        {
            const stats = pStats || await asyncAttempt( async() => await stat( filePath ) );
            return new FileObject( filePath, stats, pDirEntry );
        }

        return FileObject.NO_FILE;
    };

    FileObject.asFileInfo = function( pFile )
    {
        return pFile instanceof FileObject ? pFile : (!isNull( pFile ) ? new FileObject( pFile ) : null);
    };

    FileObject.COMPARATOR = function( pA, pB )
    {
        const a = FileObject.asFileInfo( pA );
        const b = FileObject.asFileInfo( pB );
        return a.compareTo( b );
    };

    const EXPLORER_ENTRY_ACTION =
        {
            CONTINUE: 0,
            STOP: 1,
            SKIP: 2,
        };

    class DirectoryExplorer
    {
        #visitor = null;

        #directoryFilter = Filters.IDENTITY;
        #fileFilter = Filters.IDENTITY;

        #breadthFirst = false;

        constructor( pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
        {
            this.#visitor = resolveVisitor( pVisitor );

            this.#fileFilter = Filters.IS_FILTER( pFileFilter ) ? pFileFilter : Filters.IDENTITY;
            this.#directoryFilter = Filters.IS_FILTER( pDirectoryFilter ) ? pDirectoryFilter : Filters.IDENTITY;
            this.#breadthFirst = !!pBreadthFirst;
        }

        async _processDirectoryEntry( pDirectory, pDirectoryFilter, pIncludeFilter, pVisitor, pResults )
        {
            if ( isNull( pDirectory ) )
            {
                return EXPLORER_ENTRY_ACTION.SKIP;
            }

            const dirInfo = await FileObject.fromAsync( pDirectory, null, pDirectory );

            if ( pDirectoryFilter( dirInfo ) || pDirectoryFilter( pDirectory ) )
            {
                if ( pIncludeFilter( dirInfo ) || pIncludeFilter( dirInfo.filepath ) )
                {
                    pResults.push( dirInfo );
                }

                if ( pVisitor.visit( dirInfo ) )
                {
                    return EXPLORER_ENTRY_ACTION.STOP;
                }

                return EXPLORER_ENTRY_ACTION.CONTINUE;
            }

            return EXPLORER_ENTRY_ACTION.SKIP;
        }

        async _processFileEntry( pFilePath, pEntry, pFilter, pVisitor, pResults )
        {
            if ( !isNull( pEntry ) && (pEntry.isFile() || pEntry.isSymbolicLink()) )
            {
                const filePath = resolvePath( pFilePath || pEntry );

                const entryInfo = await FileObject.fromAsync( filePath, null, pEntry );

                if ( pFilter( entryInfo ) || pFilter( filePath ) )
                {
                    pResults.push( entryInfo );

                    if ( pVisitor.visit( entryInfo ) )
                    {
                        return EXPLORER_ENTRY_ACTION.STOP;
                    }

                    return EXPLORER_ENTRY_ACTION.CONTINUE;
                }
            }
            return EXPLORER_ENTRY_ACTION.SKIP;
        }

        async exploreDirectory( pDirectory, pVisitor, pFilter, pResults = [] )
        {
            const dirPath = resolveDirectoryPath( pDirectory );

            const visitor = resolveVisitor( pVisitor );

            const filter = Filters.IS_FILTER( pFilter ) ? pFilter : this.#fileFilter;

            const results = pResults || [];

            const entries = await asyncAttempt( async() => await readFolder( dirPath ) );

            for await ( const entry of entries )
            {
                if ( !isNull( entry ) )
                {
                    const entryPath = path.resolve( path.join( dirPath, entry.name ) );

                    const filePath = resolvePath( entryPath || entry );

                    let action = await this._processFileEntry( filePath, entry, filter, visitor, results );

                    if ( EXPLORER_ENTRY_ACTION.STOP === action )
                    {
                        return results;
                    }
                }
            }

            return results;
        }

        resolveArguments( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
        {
            const startDirectory = resolveDirectoryPath( pDirectory );

            const visitor = resolveVisitor( pVisitor );

            const fileFilter = Filters.IS_FILTER( pFileFilter ) ? pFileFilter : this.#fileFilter;

            const directoryFilter = Filters.IS_FILTER( pDirectoryFilter ) ? pDirectoryFilter : this.#directoryFilter;

            const breadthFirst = isDefined( pBreadthFirst ) ? !!pBreadthFirst : this.#breadthFirst;

            return { startDirectory, visitor, fileFilter, directoryFilter, breadthFirst };
        }

        async collect( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
        {
            const {
                startDirectory,
                visitor,
                fileFilter,
                directoryFilter,
                breadthFirst
            } = this.resolveArguments( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst );

            const results = [];

            const explored = [];

            const queue = [startDirectory]; // Queue for BFS

            while ( queue.length > 0 )
            {
                let dirPath = queue.shift();

                if ( explored.includes( dirPath ) )
                {
                    continue;
                }

                let action = await this._processDirectoryEntry( dirPath, directoryFilter, fileFilter, visitor, results );

                if ( EXPLORER_ENTRY_ACTION.STOP === action )
                {
                    return results;
                }

                if ( EXPLORER_ENTRY_ACTION.SKIP === action )
                {
                    continue;
                }

                const entries = await asyncAttempt( async() => await readFolder( dirPath ) );

                for await ( const entry of entries )
                {
                    if ( isNull( entry ) )
                    {
                        continue;
                    }

                    const entryPath = path.resolve( path.join( dirPath, entry.name ) );

                    if ( entry.isFile() || entry.isSymbolicLink() )
                    {
                        action = await this._processFileEntry( entryPath, entry, fileFilter, visitor, results );

                        if ( EXPLORER_ENTRY_ACTION.STOP === action )
                        {
                            return results;
                        }
                    }

                    if ( entry.isDirectory() )
                    {
                        if ( breadthFirst )
                        {
                            queue.push( entryPath );
                        }
                        else
                        {
                            const collected = await this.collect( entryPath, visitor, fileFilter, directoryFilter, breadthFirst );

                            results.push( ...(asArray( collected ).flat()) );
                        }
                    }
                }

                explored.push( dirPath );
            }

            return results;
        }

        async findFirst( pDirectory, pFilter, pRecursive = false, pBreadthFirst = false )
        {
            const directoryPath = resolveDirectoryPath( pDirectory );

            const filter = Filters.IS_FILTER( pFilter ) ? pFilter : this.#fileFilter;

            const recursive = !!pRecursive;

            const breadthFirst = !!pBreadthFirst;

            let fileInfo = null;

            const queue = [directoryPath];

            const explored = [];

            while ( queue.length > 0 )
            {
                const dirPath = queue.shift();

                if ( explored.includes( dirPath ) )
                {
                    continue;
                }

                const entries = await asyncAttempt( async() => await readFolder( dirPath ) );

                for await ( const entry of entries )
                {
                    const entryPath = path.resolve( path.join( dirPath, entry.name ) );

                    let info = await FileObject.fromAsync( entryPath, null, entry );

                    if ( filter( info ) || filter( entryPath ) )
                    {
                        fileInfo = info;
                        break;
                    }

                    if ( entry.isDirectory() && recursive )
                    {
                        if ( breadthFirst )
                        {
                            queue.push( entryPath );
                        }
                        else
                        {
                            info = await this.findFirst( entryPath, filter, pRecursive, pBreadthFirst );

                            if ( filter( info ) || filter( entryPath ) )
                            {
                                fileInfo = info;
                                break;
                            }
                        }
                    }
                }

                explored.push( dirPath );
            }

            return fileInfo;
        }
    }

    const findFiles = async function( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
    {
        const explorer = new DirectoryExplorer( pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst );
        return await explorer.collect( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst );
    };

    FileObject.collect = async function( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
    {
        const explorer = new DirectoryExplorer( pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst );
        return await explorer.collect( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst );
    };

    let mod =
        {
            dependencies,
            classes:
                {
                    DirectoryEntry,
                    DirectoryExplorer,
                    FileStats,
                    FileObject
                },
            NO_ATTRIBUTES,
            exists,
            asyncExists,
            makeDirectory,
            asyncMakeDirectory,
            removeDirectory,
            asyncRemoveDirectory,
            link,
            asyncLink,
            isFile,
            isDirectory,
            isSymbolicLink,
            resolvePath,
            resolveDirectoryPath,
            extractPathSeparator,
            getFilePathData,
            getFileName,
            getDirectoryName,
            getFileExtension,
            removeExtension,
            replaceExtension,
            getTempDirectory,
            generateTempFileName,
            createTempFile,
            asyncCreateTempFile,
            createTextFile,
            asyncCreateTextFile,
            getFileEntry,
            asyncGetFileEntry,
            deleteFile,
            deleteMatchingFiles,
            asyncDeleteFile,
            asyncDeleteMatchingFiles,
            createTempFileAsync: asyncCreateTempFile,
            findFiles,

            DirectoryEntry,
            DirectoryExplorer,
            FileStats,
            FileObject,

            readdirSync,
            createWriteStream,
            chmodSync,
            chownSync,
            closeSync,
            copyFileSync,
            createSync,
            linkSync,
            lstatSync,
            makeTempDirSync,
            makeTempFileSync,
            openSync,
            readDirSync,
            readFileSync,
            readLinkSync,
            readTextFileSync,
            realPathSync,
            removeSync,
            renameSync,
            truncateSync,
            utimeSync,
            listFolderEntries,
            rm,
            writeFile,
            writeTextFile,
            realpath,
            stat,
            statSync,
            lstat,
            rmdir,
            rename,
            symlink,
            unlink,
            chmod,
            chown,
            close,
            copyFile,
            create,
            makeTempDir,
            makeTempFile,
            mkdir,
            open,
            readDir,
            readFile,
            readLink,
            readTextFile,
            realPath,
            remove,
            truncate,
            umask,
            utime,
            watchFs,


        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
