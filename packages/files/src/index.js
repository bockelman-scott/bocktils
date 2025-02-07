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
 * in browsers and workers, this is implemented via the Stream API:
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API}
 */
let stream;

/**
 * Represents the functionality related to resolving file paths and file names.
 * <br>
 * In Node.js, this is the node: path module.
 * <br>
 * When this is unavailable,
 * this module provides its own implementation of the basic functionality.
 * <br>
 *
 * @type {Object|function}
 */
let path;


/**
 * Represents the path of the current working directory.<br>
 * <br>
 * This variable typically holds the absolute path of the directory
 * where the program is being executed.<br>
 * <br>
 *
 * This value may be used for file system operations or to determine
 * the relative locations of other files and directories.<br>
 * <br>
 *
 * @type {string}
 */
let currentDirectory;

/**
 * Represents the root directory of this package.<br>
 * <br>
 *
 * This variable is used as a reference point for resolving
 * file and folder paths relative to the module's base directory.
 * <br>
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

/**
 * The toolbocks/core package provides the building blocks
 * upon which other ToolBocks modules depend.<br>
 * <br>
 */
const core = require( "@toolbocks/core" );

/**
 * These modules are imported from toolbocks/core
 */
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

    // declare variables to hold the execution environment-specific namespace(s)
    let _deno = null;
    let _node = null;

    /*
     * Create local variables for the imported values and functions we use.
     */
    const {
        _mt_str,
        _dot,
        _colon,
        _slash,
        _backslash,
        no_op,
        ignore,
        lock,
        populateOptions,
        mergeOptions,
        Visitor,
        resolveVisitor,
        attempt,
        asyncAttempt,
        objectKeys,
        classes
    } = constants;

    const _pathSep = _slash;

    const { ModulePrototype } = classes;

    const {
        isDefined,
        isNull,
        isString,
        isNumber,
        isArray,
        isDate,
        isNonNullObject,
        isFunction,
        isAsyncFunction,
        isNumeric,
        isError,
        isDirectoryEntry,
        firstMatchingType,
        resolveMoment,
        isValidDateOrNumeric,
        clamp
    } = typeUtils;

    const { asString, asInt, toUnixPath, toBool, isBlank, leftOfLast, rightOfLast } = stringUtils;

    const { varargs, flatArgs, asArray, unique, includesAll, Filters, AsyncBoundedQueue } = arrayUtils;

    const modName = "FileUtils";

    let modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const executionEnvironment = modulePrototype.executionEnvironment;

    const _isNode = executionEnvironment.isNode();
    const _isDeno = executionEnvironment.isDeno();
    const _isBrowser = executionEnvironment.isBrowser();

    let WriteStream;

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

        WriteStream = fs.WriteStream;
    }
    /*## environment-specific:node end ##*/

    /*## environment-specific:deno start ##*/
    if ( _isDeno )
    {
        _node = null;
        _deno = executionEnvironment.DenoGlobal;

        WriteStream = _ud === typeof WritableStream ? null : WritableStream;
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

        WriteStream = _ud === typeof WritableStream ? null : WritableStream;
    }

    /*## environment-specific:browser end ##*/

    /**
     * Dynamically imports the `os`, `fs`, `fs/promises`, `stream`, and `path` Node.js modules<br>
     * and assigns them to variables, 'os', 'fs', 'fsAsync', 'stream', and 'path' respectively.<br>
     * <br>
     * Also sets the 'currentDirectory' variable, using the `path` module
     * and potentially available global variable, __filename.<br>
     * <br>
     * Handles any errors during the module imports
     * by delegating to the `handleError` method,
     * which will emit an 'error' event for which you can listen.
     * <br>
     *
     * @return {Promise<void>} A promise that resolves when the required Node.js modules are successfully imported
     *                         or rejects if an error occurs.
     */
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

    /*
     * If the 'path' module is unavailable in the current execution environment,
     * we define our own methods as proxies
     */
    if ( _ud === typeof path || isNull( path ) )
    {
        path = {

            join: ( ...parts ) => flatArgs( parts ).map( e => toUnixPath( e ) ).join( _pathSep ).replaceAll( /\/\/+/g, _pathSep ),

            basename: ( p ) => toUnixPath( asString( p ) ).substring( toUnixPath( p ).lastIndexOf( _pathSep ) + 1 ),

            dirname: ( p ) => toUnixPath( asString( p ) ).substring( 0, toUnixPath( p ).lastIndexOf( _pathSep ) ) || _dot,

            extname: ( p ) =>
            {
                let s = toUnixPath( asString( p ) );
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
                let segments = flatArgs( ...pathSegments ).map( e => toUnixPath( e ) );
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
            },

            fromDirEntry: ( pEntry ) => !isNull( pEntry ) ? ((pEntry?.parentPath || pEntry?.path) + _pathSep + pEntry?.name) : _mt_str
        };
    }

    /**
     * This class provides a stand-in for fs.Stats or the Deno FileInfo interface.<br>
     * <br>
     * This class provides only those properties this module requires.<br>
     * <br>
     * Properties:
     * - size: Represents the size of the file or directory
     * - atime: Represents the last access time of the file or directory.
     * - mtime: Represents the last modification time of the file or directory.
     * - ctime: Represents the last change time of the file or directory metadata.
     * - birthtime: Represents the creation time of the file or directory.
     *
     * Constructor:
     * - Initializes the class with time-related properties from a given statistics object.
     */
    class StatsProxy
    {
        size;
        atime;
        mtime;
        ctime;
        birthtime;

        constructor( pStats )
        {
            this.size = pStats?.size;
            this.atime = pStats?.atime;
            this.mtime = pStats?.mtime;
            this.ctime = pStats?.ctime;
            this.birthtime = pStats?.birthtime;
        }
    }

    /**
     * Returns the properties an object must have
     * to be considered a valid "FileStats" object.
     *
     * @returns {Array.<string>} The minimal set of properties
     *                           an object must provide to be used as a stats provider
     */
    StatsProxy.keys = () => ["size", "atime", "mtime", "ctime", "birthtime"];

    /**
     * The `FsStats` variable is a conditional assignment that determines the appropriate
     * file system statistics implementation based on the runtime environment.
     *
     * - In a Node.js environment (`_isNode` is true), it references the `fs.Stats` class if available,
     *   or defaults to `StatsProxy`.
     * - In a Deno environment (`_isDeno` is true), it uses the `_deno.FileInfo` class if available,
     *   or defaults to `StatsProxy`.
     * - In other environments or if neither specific API is detected, it defaults to `StatsProxy`.
     *
     * This variable abstracts file system statistics retrieval across different JavaScript runtime environments.
     */
    const FsStats = _isNode ? (fs?.Stats || StatsProxy) : (_isDeno ? (_deno?.FileInfo || StatsProxy) : StatsProxy);

    /**
     * Determines whether the provided entry is a file stats object.
     *
     * This function checks if the given `pEntry` is a valid file stats object.
     * It verifies that the entry is not null, is an object, and matches
     * the required structure for file stats. It also checks whether the
     * entry is an instance of `FsStats` or `StatsProxy`, or has all the keys
     * defined by `StatsProxy`.
     *
     * @param {object} pEntry - The entry to test for file stats compatibility.
     *
     * @returns {boolean} Returns `true` if the entry is a file stats object; otherwise, `false`.
     */
    const isFileStats = function( pEntry )
    {
        if ( isNull( pEntry ) || !isNonNullObject( pEntry ) )
        {
            return false;
        }

        if ( pEntry instanceof FsStats || pEntry instanceof StatsProxy )
        {
            return true;
        }

        const keys = asArray( objectKeys( pEntry ) );

        return includesAll( keys, StatsProxy.keys() );
    };

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

    /**
     * Generates a temporary file name using the given prefix and extension.
     * The file name includes a timestamp and a random string for uniqueness.
     *
     * @param {string} [pPrefix="temp"] - The prefix to use for the file name. Defaults to 'temp' if not provided.
     * @param {string} [pExtension=".tmp"] - The extension to use for the file name. Defaults to '.tmp' if not provided.
     * @return {string} A unique temporary file name.
     */
    function generateTempFileName( pPrefix = "temp", pExtension = ".tmp" )
    {
        const prefix = asString( pPrefix, true ) || "temp";

        const extension = asString( pExtension, true ) || ".tmp";

        const timestamp = asInt( Date.now() );

        return `${prefix}_${timestamp}_${Math.random().toString( 36 ).substring( 2, 15 )}${extension}`;
    }

    /*
     * Defines local variables for the synchronous functions found in the FileSystem API of the current execution environment.
     * Each function is declared with a default implementation
     * that is conditional upon whether we are running in Node.js, Deno, Bun, or a browser
     */
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

        rmdirSync = _isNode ? function( pPath, pOptions )
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

        writeTextFileSync = _isNode ? function( pPath, pContent )
        {
            const filePath = resolvePath( pPath );
            fs.writeFileSync( filePath, asString( pContent ), { encoding: "utf8" } );
        } : _deno?.writeTextFileSync,

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

    /*
     * Defines local variables for the asynchronous functions found in the FileSystem API of the current execution environment.
     * Each function is declared with a default implementation
     * that is conditional upon whether we are running in Node.js, Deno, Bun, or a browser
     */
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

        rmdir = _isNode ? async function( pPath, pOptions )
        {
            const options = mergeOptions( pOptions, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 } );
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

    /*
     * Defines the FileSystem API CONSTANTS normally found in the node:fs module.
     * If we are running in Node.js,
     * this object will be updated to reflect the current and correct values
     * for the Node version running
     */
    let fsConstants =
        {
            F_OK: 0,
            X_OK: 1,
            W_OK: 2,
            R_OK: 4,
            O_RDONLY: 0,
            O_WRONLY: 1,
            O_RDWR: 2,
            O_APPEND: 8,
            O_CREAT: 256,
            O_TRUNC: 512,
            O_EXCL: 1024,
            UV_DIRENT_UNKNOWN: 0,
            UV_DIRENT_FILE: 1,
            UV_DIRENT_DIR: 2,
            UV_DIRENT_LINK: 3,
            UV_DIRENT_FIFO: 4,
            UV_DIRENT_SOCKET: 5,
            UV_DIRENT_CHAR: 6,
            UV_DIRENT_BLOCK: 7,
            UV_FS_COPYFILE_EXCL: 1,
            UV_FS_SYMLINK_DIR: 1,
            UV_FS_SYMLINK_JUNCTION: 2,
            UV_FS_O_FILEMAP: 536870912,
            S_IWUSR: 128,
            S_IRUSR: 256,
            S_IFCHR: 8192,
            S_IFDIR: 16384,
            S_IFREG: 32768,
            S_IFLNK: 40960,
            S_IFMT: 61440,
            COPYFILE_EXCL: 1,
            UV_FS_COPYFILE_FICLONE: 2,
            COPYFILE_FICLONE: 2,
            UV_FS_COPYFILE_FICLONE_FORCE: 4,
            COPYFILE_FICLONE_FORCE: 4
        };

    // update the constants from the execution environment if they are available
    fsConstants = lock( _isNode ? mergeOptions( fsConstants, (fs.constants || fs_constants || fsConstants) ) : fsConstants );

    const MILLIS_PER_SECOND = 1000;
    const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
    const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
    const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;

    /**
     * Resolves a given input to an absolute, normalized Unix-style file system path.
     *
     * @param {string|Array|string[]|Object} pPath - The path input to resolve.
     *        It can be a string, an array of path segments, or an object containing path information.
     *        If null or undefined, a default empty string path is returned.
     * @return {string} The resolved and normalized Unix-style path as a string.
     */
    function resolvePath( pPath )
    {
        let p = _mt_str;

        if ( isNull( pPath ) )
        {
            return p;
        }

        if ( isArray( pPath ) )
        {
            p = attempt( () => path.resolve( ...(asArray( pPath ).flat()) ) );
        }
        else if ( isDirectoryEntry( pPath ) )
        {
            p = attempt( () => path.resolve( path.join( (pPath?.parentPath || pPath?.path || "./"), (pPath.name || _mt_str) ) ) );
        }
        else
        {
            p = attempt( () => path.resolve( toUnixPath( asString( pPath, true, { joinOn: _mt_str } ).trim() ) ) );
        }

        return p || (toUnixPath( asString( p, true ) ));
    }

    /**
     * Resolves the specified directory path to an absolute path, converting it to a Unix-style path format.
     *
     * @param {string|*} pDirectoryPath - The directory path to resolve.
     *                                    If a string is provided,
     *                                    it will be processed and resolved to an absolute path.
     *
     * @return {string} The resolved and normalized directory path in Unix-style format.
     */
    function resolveDirectoryPath( pDirectoryPath )
    {
        return toUnixPath( isString( pDirectoryPath ) ? attempt( () => path.resolve( toUnixPath( asString( pDirectoryPath, true ) ) ) ) : resolvePath( pDirectoryPath ) );
    }

    /**
     * Extracts the path separator from the given file path.<br>
     * This method attempts to resolve the provided path<br>
     * and returns the first occurrence of a path separator (either '/' or '\') in the resolved path.
     *
     * @param {string} pPath - The file path from which to extract the path separator.
     * @return {string} The identified path separator,
     *                  or the default path separator ('/') if none is found.
     */
    function extractPathSeparator( pPath )
    {
        let matches = /([\/\\]+)/.exec( resolvePath( pPath ) );
        return (matches && matches?.length > 1 ? matches[1] : _pathSep);
    }

    /**
     * Processes the given file path and extracts detailed file path information.
     *
     * @param {string} pFilePath - The file path to be processed.
     *
     * @return {Object} An object containing the following properties:<br><br>
     *         filePath: The resolved file path.<br>
     *         dirName: The directory name of the file path.<br>
     *         fileName: The base name of the file including its extension.<br>
     *         extension: The file extension, if any.<br>
     */
    function getFilePathData( pFilePath )
    {
        const filePath = resolvePath( pFilePath );

        const fileName = asString( path.basename( filePath ) || rightOfLast( filePath, _slash ), true );

        const dirName = asString( path.dirname( filePath ) || leftOfLast( filePath, _slash ), true );

        const extension = asString( path.extname( fileName ), true ) || (fileName.lastIndexOf( _dot ) > 0 ? fileName.slice( fileName.lastIndexOf( _dot ) ) : _mt_str);

        return { filePath, dirName, fileName, extension };
    }

    /**
     * Retrieves the file extension from a given file path.
     *
     * @param {string} pFilePath - The full path or name of the file from which to extract the extension.
     *
     * @return {string} The file extension of the given file path.
     *                  Returns an empty string if no extension is found.
     */
    function getFileExtension( pFilePath )
    {
        const { fileName, extension } = getFilePathData( pFilePath );
        return asString( extension, true ) || asString( _dot + rightOfLast( fileName, _dot ), true );
    }

    /**
     * Extracts and returns the file name from the given file path.
     *
     * @param {string} pFilePath - The full path to the file.
     *
     * @return {string} The extracted file name as a string.
     */
    function getFileName( pFilePath )
    {
        const { filePath, fileName } = getFilePathData( pFilePath );
        return asString( (fileName || rightOfLast( filePath, _slash )), true );
    }

    /**
     * Retrieves the directory name from a given file path.
     *
     * @param {string} pFilePath - The file path from which the directory name will be extracted.
     * @return {string} The directory name extracted from the file path.
     */
    function getDirectoryName( pFilePath )
    {
        const { filePath, dirName } = getFilePathData( pFilePath );
        return asString( dirName, true ) || asString( leftOfLast( filePath, _slash ), true );
    }

    /**
     * Returns true if the specified file or directory exists at the given path.
     * <br><br>
     * <b>This function is synchronous</b>
     * <br>
     *
     * @function
     *
     * @param {string} pPath - The path to the file or directory to check.
     *
     * @returns {boolean} Returns true if the file or directory exists, false otherwise.
     */
    const exists = function( pPath )
    {
        let exists;

        try
        {
            accessSync( resolvePath( pPath ), fsConstants.F_OK );
            exists = true;
        }
        catch( ignored )
        {
            exists = false;
        }

        return exists;
    };

    /**
     * Returns true if the specified file or directory exists at the given path.
     * <br><br>
     * <b>This function is <i>asynchronous</i></b>
     * <br>
     *
     * @param {string} pPath - The path to the file or directory to check for existence.
     *
     * @returns {Promise<boolean>} A Promise that resolves to true
     *                             if the file or directory exists,
     *                             false otherwise.
     */
    const asyncExists = async function( pPath )
    {
        let exists;
        try
        {
            await access( resolvePath( pPath ), fsConstants.F_OK );
            exists = true;
        }
        catch( ignored )
        {
            exists = false;
        }
        return exists;
    };

    /**
     * Creates a directory at the specified path if it does not already exist.<br>
     * <br>
     * <b>This function is synchronous</b>
     *
     * This function resolves the provided directory path, converts it to a Unix-style path,
     * checks if the directory exists, and attempts to create it if it does not.
     * <br>
     *
     * The creation process includes options to create parent directories recursively if necessary.
     * <br>
     *
     * If the directory does not exist and cannot be created, a warning is logged.<br>
     * <br>
     *
     * @param {string} pDirectoryPath - The path of the directory to be created.
     *
     * @returns {boolean} Returns true if the directory either already exists
     *                    or was successfully created; otherwise, false.
     */
    const makeDirectory = function( pDirectoryPath )
    {
        let dirPath = attempt( () => resolveDirectoryPath( pDirectoryPath ) );

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
     * Asynchronously creates a directory if it does not already exist.<br>
     * <br>
     * <b>This function is <i>asynchronous</i></b>
     *
     * @param {string} pDirectoryPath - The path of the directory to create.
     *
     * @returns {Promise<boolean>} A Promise that resolves to true if the directory exists
     *                             or is successfully created; otherwise, false
     */
    const asyncMakeDirectory = async function( pDirectoryPath )
    {
        let dirPath = attempt( () => resolveDirectoryPath( pDirectoryPath ) );

        if ( !(await asyncExists( dirPath )) )
        {
            await asyncAttempt( async() => await mkdir( dirPath, { recursive: true } ) );
        }

        return await asyncExists( dirPath );
    };

    /**
     * Removes a directory and its contents at the specified path.<br>
     * <br>
     * <b>This function is synchronous</b>
     * <br>
     *
     * @param {string} pDirectoryPath - The path of the directory to be removed.
     *
     * @returns {boolean} Returns true if the directory was successfully removed, false otherwise.
     */
    const removeDirectory = function( pDirectoryPath )
    {
        let dirPath = attempt( () => resolveDirectoryPath( pDirectoryPath ) );

        attempt( () => rmdirSync( dirPath, { recursive: true } ) );

        return !exists( dirPath );
    };

    /**
     * Asynchronously removes a directory and its contents, including subdirectories and files.<br>
     * <br>
     * <b>This function is <i>asynchronous</i></b>
     * <br>
     * This function resolves the given directory path,
     * then recursively deletes the directory and any of its subdirectories.<br>
     * This function includes error handling to retry the operation up to three times.<br>
     * with a delay between attempts.
     * <br>
     *
     * @param {string} pDirectoryPath - The path of the directory to be removed.
     *
     * @returns {Promise<boolean>} A Promise that resolves to true if the directory was successfully removed or did not exist,
     *                             or false if it still exists.
     */
    const asyncRemoveDirectory = async function( pDirectoryPath )
    {
        let dirPath = attempt( () => resolveDirectoryPath( pDirectoryPath ) );

        await asyncAttempt( async() => await rmdir( dirPath, { recursive: true, maxRetries: 3, retryDelay: 150 } ) );

        return !await asyncExists( dirPath );
    };

    /**
     * Creates a symbolic link between the specified source path and target path.<br>
     * <br>
     * <b>This function is synchronous</b>
     * <br>
     * This function resolves the provided source and target paths,
     * and establishes a symbolic link pointing from the target path to the source path.<br>
     *
     * @param {string} pSourcePath - The source path to which the symbolic link will point.
     *
     * @param {string} pTargetPath - The target path where the symbolic link will be created.
     */
    const link = function( pSourcePath, pTargetPath )
    {
        attempt( () => symlinkSync( resolvePath( pSourcePath ), resolvePath( pTargetPath ) ) );
    };

    /**
     * Asynchronously creates a symlink between a source path and a target path.<br>
     * <br>
     * <b>This function is <i>asynchronous</i></b>
     * <br>
     * This function resolves the provided source and target paths,
     * then asynchronously creates a symbolic link connecting the target path to the source path.<br>
     * <br>
     * The symlink creation process is executed inside an asynchronous wrapper function that handles any errors.<br>
     * <br>
     * Any errors encountered are emitted as events.<br>
     *
     * @param {string} pSourcePath - The file system path to the source file or directory.
     * @param {string} pTargetPath - The file system path to the target file or directory.
     * @returns {Promise<void>} A promise that resolves when the symlink is successfully created.
     */
    const asyncLink = async function( pSourcePath, pTargetPath )
    {
        asyncAttempt( async() => await symlink( resolvePath( pSourcePath ), resolvePath( pTargetPath ) ) );
    };

    /**
     * A constant object representing a set of attributes with default or null values,<br>
     * indicating the absence of any specific file, directory, or symbolic link properties.<br>
     * <br>
     * The `NO_ATTRIBUTES` object includes the following properties:<br>
     * <br>
     * - `isFile`: A function that always returns `false`, indicating the object is not treated as a file.<br>
     * <br>
     * - `isDirectory`: A function that always returns `false`, indicating the object is not treated as a directory.<br>
     * <br>
     * - `isSymbolicLink`: A function that always returns `false`, indicating the object is not treated as a symbolic link.<br>
     * <br>
     * - `size`: Set to `0`, representing zero file size or no content.<br>
     * <br>
     * - `created`: Set to `null`, indicating no creation time is defined.<br>
     * <br>
     * - `modified`: Set to `null`, indicating no last modification time is defined.<br>
     * <br>
     * - `accessed`: Set to `null`, indicating no last access time is defined.<br>
     * <br>
     * - `stats`: An empty object meant to represent the absence of any statistical metadata.<br>
     * <br>
     *
     * This constant is encapsulated in an immutable structure to ensure its properties cannot be modified.
     */
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

    /**
     * Represents a directory entry with associated metadata such as type and path information.<br>
     * <br>
     * Extends the `Visitor` class.<br>
     * <br>
     * This class provides methods to check the type of the directory entry (file, directory, or symbolic link)
     * and allows access to the entry's metadata including name and parent path.<br>
     * <br>
     * This class abstracts the differences between Deno.DirEnt and fs.DirEnt and provides a common interface.<br>
     * <br>
     * @class
     */
    class DirectoryEntry extends Visitor
    {
        #entry;

        #name;
        #isFile;
        #isDirectory;
        #isSymLink;

        #parentPath;

        /**
         * Constructs an instance with the provided directory entry and/or full path.<br>
         * If both values are specified, the full path takes precedence in determining the filepath.<br>
         * <br>
         * Assigns key properties for managing file or directory entries.<br>
         * <br>
         *
         * @param {fs.Dirent|DirectoryObject|DirectoryEntry|Object|string} pDirEntry
         *          An object representing the directory entry,
         *          or a string representing a file path.<br>
         *          If an object is passed,
         *          it should contain attributes such as `name` and `parentPath`,
         *          and/or specific properties or methods for determining the type of the entry.<br>
         *
         * @param {string} pFullPath A full string path to the file or directory.
         *                           Defaults to constructing a path using `pDirEntry` details if not provided.
         *
         * @return {void} Does not return a value. Initializes the instance with resolved file or directory details.
         */
        constructor( pDirEntry, pFullPath )
        {
            super( { filepath: pFullPath || (pDirEntry?.parentPath + _slash + pDirEntry?.name) || _mt_str } );

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

    /**
     * A static factory method to create and return a new DirectoryEntry instance from the specified arguments.<br>
     * <br>
     * <b>This function is synchronous</b>
     * <br>
     *
     * @param {Object} pObject - An object containing information about a directory entry.
     * @param {string} pFullPath - A string representing the full path to the file or directory
     *                             to be represented by the returned instance
     *
     * @returns {DirectoryEntry} A new DirectoryEntry instance constructed from the specified object/data.
     *
     */
    DirectoryEntry.from = function( pObject, pFullPath )
    {
        const object = isNonNullObject( pObject ) ? pObject : {};

        if ( isDirectoryEntry( object ) )
        {
            return new DirectoryEntry( object, resolvePath( pFullPath || ((object?.path || object?.parentPath) + _slash + object?.name) ) );
        }

        return new DirectoryEntry( {
                                       name: object?.name || getFileName( pFullPath ),
                                       parentPath: getDirectoryName( pFullPath ) || object?.parentPath || object?.path,
                                       isFile: isFunction( object?.isFile ) ? object?.isFile() : object?.isFile || false,
                                       isDirectory: isFunction( object?.isDirectory ) ? object?.isDirectory() : object?.isDirectory || false,
                                       isSymbolicLink: isFunction( object?.isSymbolicLink ) ? object?.isSymbolicLink() : object?.isSymbolicLink || object?.isSymLink || false
                                   },
                                   resolvePath( pFullPath || ((object?.path || object?.parentPath) + _slash + object?.name) ) );
    };

    /**
     * Represents a subset of the attributes obtained from calls to stat, lstat, or fstat.<br>
     * <br>
     * @class
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
         * @param {FileStats|FsStats|fs.Stats|fs.Dirent|{size:number,birthtime:Date,mtime:Date,atime:Date}} pStats
         * @param {string} [pFilePath=null]
         */
        constructor( pStats, pFilePath )
        {
            const object = isFileStats( pStats ) ? pStats : attempt( () => statSync( resolvePath( pFilePath || pStats ) ) );

            this.#stats = isNonNullObject( object ) ? { ...object } : {};

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

    /**
     * Returns an instance of FileStats representing a subset of the data returned by calling 'stat' for the file.<br>
     * <br>
     * <b>This function is <i>asynchronous</i></b>
     * <br>
     * @function FileStats.forPath
     *
     * @param {string} pFilePath - The file path for which statistical information is desired.
     *
     * @returns {Object} An object containing statistical data of the file at the specified path.
     */
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
            const stats = await stat( resolvePath( path.normalize( filePath ) ) );
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
     *
     * @return {Promise<boolean>} A promise that resolves to true if the path is a file, false otherwise.
     */
    async function isFile( pPath )
    {
        const fileStats = await FileStats.forPath( resolvePath( pPath ) );
        return fileStats?.isFile() || false;
    }

    /**
     * Asynchronously checks whether the specified path refers to a directory.<br>
     * <br>
     * <b>This function is <i>asynchronous</i></b>
     *
     * @param {string} pPath - The path to check, normalized and resolved to an absolute path.
     *
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isDirectory( pPath )
    {
        const fileStats = await FileStats.forPath( resolvePath( pPath ) );
        return fileStats?.isDirectory() || false;
    }

    /**
     * Asynchronously checks whether the specified path refers to a symbolic link (symlink).<br>
     *
     * @param {string} pPath - The path to check, normalized and resolved to an absolute path.
     *
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isSymbolicLink( pPath )
    {
        const fileStats = await FileStats.forPath( resolvePath( pPath ) );
        return fileStats?.isSymbolicLink() || false;
    }

    /**
     * Removes the file extension from the given file path.<br>
     *
     * @param {string} pPath - The file path from which the extension will be removed.
     *
     * @param {boolean} [pExhaustive=false] If true will remove all text following the first occurrence of a '.',
     *                                      otherwise, removes only the text following the last occurrence of a '.'
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
     * @param {boolean} [pExhaustive=false] If true, replaces all text following the first occurrence of a '.',
     *                                      otherwise, replaces only the text following the last occurrence of a '.'
     *
     * @return {string} The updated file path with the new extension.
     */
    function replaceExtension( pPath, pNewExtension, pExhaustive = false )
    {
        const newExt = asString( pNewExtension, true ).replace( /^\.+/, _mt_str );

        const newFilename = removeExtension( resolvePath( pPath ), pExhaustive );

        return (newFilename + (_dot + newExt)).trim();
    }

    function getEntries( pFilePath )
    {
        const { dirName, fileName } = getFilePathData( pFilePath );
        const entries = attempt( () => readFolderSync( dirName, { withFileTypes: true } ) ) || [];
        return { dirName, fileName, entries };
    }

    /**
     * Retrieves a specific file entry from a directory based on the given file path.<br>
     * <br>
     * <b>This function is synchronous</b>
     * <br>
     *
     * @param {string} pFilePath - The full path to the file whose entry is to be retrieved.
     *
     * @return {Object|undefined} The file entry object if found,
     *                            or undefined if the file does not exist.
     */
    function getFileEntry( pFilePath )
    {
        const { fileName, entries } = getEntries( pFilePath );
        return asArray( entries || [] ).find( entry => entry.name === fileName );
    }

    function getDirectoryEntry( pFilePath )
    {
        const { fileName, entries } = getEntries( pFilePath );
        const found = asArray( entries || [] ).find( entry => entry.name === fileName );
        return found ? DirectoryEntry.from( found, pFilePath ) : FileObject.NO_FILE;
    }

    async function asyncGetFileEntry( pFilePath )
    {
        const { dirName, fileName } = getFilePathData( pFilePath );
        const entries = await asyncAttempt( async() => await readFolder( dirName ) );
        return entries.find( entry => entry.name === fileName );
    }

    async function asyncGetDirectoryEntry( pFilePath )
    {
        const { dirName, fileName } = getFilePathData( pFilePath );
        const entries = await asyncAttempt( async() => await readFolder( dirName ) );
        const found = entries.find( entry => entry.name === fileName );
        return found ? DirectoryEntry.from( found, pFilePath ) : FileObject.NO_FILE;
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
                attempt( () => writeFileSync( filePath, content, { flag: "w", flush: true } ) );
            }
            else if ( _isDeno )
            {
                attempt( () => writeTextFileSync( filePath, content, { append: true, create: pOverwrite } ) );
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
                await asyncAttempt( async() => await writeFile( filePath, content, { flag: "w" } ) );
            }
            else if ( _isDeno )
            {
                await asyncAttempt( async() => await writeTextFile( filePath, content,
                                                                    {
                                                                        append: true,
                                                                        create: pOverwrite
                                                                    } ) );
            }
        }
        else
        {
            const error = new Error( `File, ${filePath}, already exists` );
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

            try
            {
                attempt( () => unlinkSync( filePath ) );

                if ( realPath !== filePath )
                {
                    attempt( () => unlinkSync( realPath ) );
                }
            }
            catch( ignored )
            {
                // ignored
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
                realPath = await asyncAttempt( async() => await realpath( filePath ) );
            }

            try
            {
                await asyncAttempt( () => unlink( filePath ) ).catch( no_op );

                if ( realPath !== filePath )
                {
                    await asyncAttempt( async() => await unlink( realPath ) ).catch( no_op );
                }
            }
            catch( ignored )
            {
                // ignored
            }
        }

        return !(await asyncExists( filePath ));
    };

    const isMatchingDirectory = async( pDirEntry, pDirectoryNameFilter ) =>
    {
        if ( !pDirEntry || !pDirEntry.isDirectory() )
        {
            return false;
        }

        return isAsyncFunction( pDirectoryNameFilter )
               ? await Filters.asyncMeetsCriteria( pDirectoryNameFilter, pDirEntry.name )
               : Filters.meetsCriteria( pDirectoryNameFilter, pDirEntry.name );
    };

    const isMatchingDirectoryObject = async( pDirInfo, pDirectoryFilter ) =>
    {
        const dirInfo = await asyncAttempt( async() => await DirectoryObject.fromAsync( pDirInfo ) );

        const filter = Filters.resolve( pDirectoryFilter, Filters.IDENTITY );

        return dirInfo.isDirectory() && await Filters.asyncMeetsCriteria( filter, dirInfo );
    };

    const isMatchingFile = async( pFileEntry, pFileNameFilter ) =>
    {
        if ( !pFileEntry || !(pFileEntry.isFile() || pFileEntry.isSymbolicLink()) )
        {
            return false;
        }

        return isAsyncFunction( pFileNameFilter )
               ? await Filters.asyncMeetsCriteria( pFileNameFilter, pFileEntry.name )
               : Filters.meetsCriteria( pFileNameFilter, pFileEntry.name );
    };

    const isMatchingFileObject = async( pFileObject, pFilter ) =>
    {
        const fileObj = await asyncAttempt( async() => await FileObject.fromAsync( pFileObject ) );

        const filter = Filters.resolve( pFilter, Filters.NONE );

        return await Filters.asyncMeetsCriteria( filter, fileObj );
    };

    const asyncDeleteMatchingFiles = async( pDirPath, pFileNameFilter, pFollowLinks = false ) =>
    {
        const dirPath = resolveDirectoryPath( pDirPath );

        const { filter } = Filters.resolve( pFileNameFilter, Filters.NONE );

        if ( !(await asyncExists( dirPath )) || !(await isDirectory( dirPath )) )
        {
            return [];
        }

        const files = await asyncAttempt( () => readFolder( dirPath ) );

        const toDelete = [];
        const deletedFiles = [];
        const expectedDeletions = [];

        for await ( const file of files )
        {
            if ( await isMatchingFile( file, filter ) )
            {
                const filePath = resolvePath( path.join( dirPath, file.name ) );

                expectedDeletions.push( filePath );

                const wasDeleted = await asyncDeleteFile( filePath, pFollowLinks ).catch( () => false );

                if ( wasDeleted )
                {
                    deletedFiles.push( filePath );
                }
                else
                {
                    toDelete.push( filePath );
                }
            }
        }

        const { deleted = [], remaining = [] } = asyncAttempt( async() => await retryFailedDeletions( toDelete,
                                                                                                      deletedFiles,
                                                                                                      pFollowLinks ) );

        if ( isArray( deleted ) && deleted.length > 0 )
        {
            deletedFiles.push( ...deleted );
        }

        if ( deletedFiles.length < expectedDeletions.length )
        {
            const error = new Error( `Unable to delete all files matching filter` );
            modulePrototype.handleError( error, asyncDeleteMatchingFiles, pDirPath, pFileNameFilter, pFollowLinks, deletedFiles, remaining, expectedDeletions );
        }

        return unique( deletedFiles );
    };

    const retryFailedDeletions = async( pToDelete, pDeletedFiles = [], pFollowLinks = true ) =>
    {
        const toDelete = asArray( pToDelete );

        while ( toDelete.length )
        {
            const filePath = toDelete.pop();
            if ( await asyncDeleteFile( filePath, !!pFollowLinks ) )
            {
                pDeletedFiles.push( filePath );
            }
        }

        return {
            deleted: pDeletedFiles,
            remaining: pToDelete.filter( filePath => !pDeletedFiles.includes( filePath ) )
        };
    };

    /**
     * This class is a stand-in for the Deno.FsFile object.<br>
     * <br>
     * @class
     */
    class FileProxy
    {
        #entry;

        #fsFile;

        readable;
        writable;

        constructor( pFileEntry, pReadable, pWritable )
        {
            this.#entry = pFileEntry;

            this.readable = pReadable;
            this.writable = pWritable;
        }

        set fsFile( pFile )
        {
            this.#fsFile = pFile;
        }

        get entry()
        {
            return this.#entry;
        }

        [Symbol.dispose]()
        {

        }

        close()
        {

        }

        isTerminal()
        {

        }

        lock()
        {

        }

        lockSync()
        {

        }

        read()
        {

        }

        readSync()
        {

        }

        seek()
        {

        }

        seekSync()
        {

        }

        setRaw()
        {

        }

        stat()
        {

        }

        statSync()
        {

        }

        sync()
        {

        }

        syncData()
        {

        }

        syncDataSync()
        {

        }

        syncSync()
        {

        }

        truncate()
        {

        }

        truncateSync()
        {

        }

        unlock()
        {

        }

        unlockSync()
        {

        }

        utime()
        {

        }

        utimeSync()
        {

        }

        write()
        {

        }

        writeSync()
        {

        }

    }

    /**
     * Defines a proxy for the Deno.FsFile interface if we are running in another execution environment
     * @type {*|(function())}
     */
    const FsFile = _deno?.FsFile || FileProxy;

    const isFsFile = ( pFile ) =>
    {
        return pFile instanceof FsFile || pFile instanceof FileProxy;
    };

    /**
     * This class provides a wrapper for the various attributes related to a file or directory.<br>
     * <br>
     * All operations that return a file or collection of files return instances of this class.<br>
     * <br>
     * Filters and Mappers used when performing collection operations
     * should assume that the element argument will be of this type.<br>
     *
     */
    class FileObject extends EventTarget
    {
        #filepath = _mt_str;

        #stats = null;

        #entry = null;

        #fsFile = null;

        #_isFile = null;
        #_isDirectory = null;
        #_isSymbolicLink = null;

        #created = null;
        #modified = null;
        #accessed = null;

        #size = -1;

        #valid = false;

        constructor( pFilePath, pFileStats = null, pDirEntry = null, pFsFile = null )
        {
            super();

            this.#filepath = resolvePath( pFilePath );

            this.#stats = isFileStats( pFileStats ) ?
                          new FileStats( pFileStats, this.#filepath ) :
                          isDirectoryEntry( pDirEntry ) ?
                          new FileStats( pDirEntry ) : {};

            if ( isFileStats( this.#stats ) )
            {
                this.updateStats( this.#stats );
            }

            this.#entry = isNonNullObject( pDirEntry ) ? new DirectoryEntry( pDirEntry, this.#filepath ) : {};

            this.#fsFile = !isNull( pFsFile ) ? pFsFile : !isNull( pDirEntry ) ? new FsFile( pDirEntry ) : null;

            this.#valid = !isBlank( this.#filepath );
        }

        updateStats( pStats, pPopulateIfMissing = false )
        {
            let stats = pStats || this.#stats;

            const hasValidAttributes = isNonNullObject( stats ) && objectKeys( stats ).length > 0;

            stats = hasValidAttributes ? stats : (pPopulateIfMissing ? new FileStats( statSync( this.filepath ), this.filepath ) : {});

            const createdDate = stats?.created || this.#created;
            const modifiedDate = stats?.modified || this.#modified;
            const accessedDate = stats?.accessed || this.#accessed;

            this.#created = isValidDateOrNumeric( createdDate ) ? new Date( asInt( createdDate ) ) : this.#created;
            this.#modified = isValidDateOrNumeric( modifiedDate ) ? new Date( asInt( modifiedDate ) ) : this.#modified;
            this.#accessed = isValidDateOrNumeric( accessedDate ) ? new Date( asInt( accessedDate ) ) : this.#accessed;

            this.#size = asInt( stats?.size, this.#size );

            this.#_isFile = isFunction( stats?.isFile ) ? stats?.isFile() : this.#_isFile;
            this.#_isDirectory = isFunction( stats?.isDirectory ) ? stats?.isDirectory() : this.#_isDirectory;
            this.#_isSymbolicLink = isFunction( stats?.isSymbolicLink ) ? stats?.isSymbolicLink() : this.#_isSymbolicLink;

            this.#stats = isNonNullObject( stats ) ? new FileStats( stats, this.filepath ) : this.#stats;

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

        get name()
        {
            return this.filename;
        }

        get directory()
        {
            return getDirectoryName( this.filepath );
        }

        get parentPath()
        {
            return this.directory;
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
                this.updateStats( new FileStats( stats, this.filepath ), true );
            }

            return stats || this.#stats;
        }

        async getLStats()
        {
            const me = this;
            const stats = await asyncAttempt( async() => await lstat( (me || this).filepath || this.filepath ) );

            if ( !isNull( stats ) )
            {
                this.updateStats( new FileStats( stats, this.filepath ), true );
            }

            return stats || this.#stats;
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
            if ( await this.isDirectory() )
            {
                return false;
            }

            if ( await this.isFile() || await this.isSymbolicLink() )
            {
                const now = resolveMoment( pNow );

                const age = clamp( await this.calculateAge( now ), 0, 1_000 );

                return age > asInt( pMaxAgeDays, age );
            }

            return false;
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

            return comp > 0 ? 1 : comp < 0 ? -1 : 0;
        }

        async isFile()
        {
            if ( isNull( this.#_isFile, true ) )
            {
                const stats = await this._refreshFileStats();

                this.#_isFile = stats.isFile();
                this.#_isSymbolicLink = stats.isSymbolicLink();
                this.#_isDirectory = stats.isDirectory();
            }

            return this.#_isFile;
        }

        async isSymbolicLink()
        {
            if ( isNull( this.#_isSymbolicLink, true ) )
            {
                const stats = await this._refreshFileStats();

                this.#_isFile = stats.isFile();
                this.#_isSymbolicLink = stats.isSymbolicLink();
                this.#_isDirectory = stats.isDirectory();
            }

            return this.#_isSymbolicLink;
        }

        async isDirectory()
        {
            if ( isNull( this.#_isDirectory, true ) )
            {
                const stats = await this._refreshFileStats();

                this.#_isFile = stats.isFile();
                this.#_isSymbolicLink = stats.isSymbolicLink();
                this.#_isDirectory = stats.isDirectory();
            }

            return this.#_isDirectory;
        }

        async getRealPath()
        {
            if ( await this.isSymbolicLink() )
            {
                return await asyncAttempt( async() => await realpath( this.filepath ) );
            }
            return this.filepath;
        }
    }

    /**
     * Represents a constant `NO_FILE` used to indicate a state where no file is associated or
     * selected, serving as a placeholder or sentinel value.
     *
     * This property can be used to check against or assign a state where
     * no file operations are applicable.
     */
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

    FileObject.fromStats = function( pFilePath, pStats, pDirEntry, pDefaultObject = FileObject.NO_FILE )
    {
        const filePath = resolvePath( pFilePath || pDirEntry );

        if ( !isBlank( filePath ) )
        {
            const stats = new FileStats( isFileStats( pStats ) ? pStats : attempt( () => statSync( filePath ) ) );

            const isFile = isNonNullObject( stats ) ? stats.isFile() || stats.isSymbolicLink() : false;
            const isDirectory = isNonNullObject( stats ) ? stats.isDirectory() : false;

            return isFile ? new FileObject( filePath, stats, pDirEntry ) :
                   (isDirectory ? new DirectoryObject( filePath, stats, pDirEntry ) : (pDefaultObject || FileObject.NO_FILE));
        }

        return pDefaultObject || FileObject.NO_FILE;
    };

    FileObject.from = function( pFilePath, pStats, pDirEntry )
    {
        if ( pFilePath instanceof FileObject )
        {
            return pFilePath;
        }

        return FileObject.fromStats( pFilePath, pStats, pDirEntry, FileObject.NO_FILE );
    };

    FileObject.fromAsync = async function( pFilePath, pStats, pDirEntry )
    {
        if ( pFilePath instanceof FileObject )
        {
            return pFilePath;
        }

        return FileObject.fromStats( pFilePath, pStats, pDirEntry, FileObject.NO_FILE );
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

    class DirectoryObject extends FileObject
    {
        constructor( pFilePath, pFileStats, pDirEntry )
        {
            super( pFilePath, pFileStats, pDirEntry );
        }

        async isFile()
        {
            return Promise.resolve( false );
        }

        async isDirectory()
        {
            return Promise.resolve( true );
        }

        async getFiles()
        {
            const dirPath = resolveDirectoryPath( this.filepath );

            if ( await asyncExists( dirPath ) && await isDirectory( dirPath ) )
            {
                const files = await asyncAttempt( async() => await readFolder( dirPath ) );

                return files.map( e => new FileObject( path.resolve( dirPath, e.name ), e, e ) );
            }

            return [];
        }
    }

    DirectoryObject.NO_DIR = new DirectoryObject( _mt_str, {}, {} );

    DirectoryObject.compare = FileObject.compare;

    DirectoryObject.sort = async function( ...pDirs )
    {
        const dirs = asArray( varargs( ...pDirs ) ).map( pDir => pDir instanceof DirectoryObject ? pDir : new DirectoryObject( pDir ) );

        async function convert( pObject )
        {
            const fileInfo = pObject instanceof DirectoryObject ? pObject : new DirectoryObject( pObject );

            const created = await fileInfo.getCreatedDate();

            const size = await fileInfo.getSize();

            return { fileInfo, created, size };
        }

        const promises = dirs.map( convert );

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

    DirectoryObject.sortDescending = async function( ...pDirs )
    {
        let dirs = await DirectoryObject.sort( ...pDirs );
        return dirs.reverse();
    };

    DirectoryObject.from = function( pFilePath, pStats, pDirEntry )
    {
        if ( pFilePath instanceof DirectoryObject )
        {
            return pFilePath;
        }

        return FileObject.fromStats( pFilePath, pStats, pDirEntry, DirectoryObject.NO_DIR );
    };

    DirectoryObject.fromAsync = async function( pFilePath, pStats, pDirEntry )
    {
        if ( pFilePath instanceof DirectoryObject )
        {
            return pFilePath;
        }

        return FileObject.fromStats( pFilePath, pStats, pDirEntry, DirectoryObject.NO_DIR );
    };

    DirectoryObject.asDirInfo = function( pDir )
    {
        return pDir instanceof DirectoryObject ? pDir : (!isNull( pDir ) ? new DirectoryObject( pDir ) : null);
    };

    DirectoryObject.COMPARATOR = function( pA, pB )
    {
        const a = DirectoryObject.asDirInfo( pA );
        const b = DirectoryObject.asDirInfo( pB );
        return a.compareTo( b );
    };

    const EXPLORER_ENTRY_ACTION =
        {
            CONTINUE: 0,
            STOP: 1,
            SKIP: 2,

            isSkip: function( pAction )
            {
                return pAction === this.SKIP;
            },
            isStop: function( pAction )
            {
                return pAction === this.STOP;
            },
            isContinue: function( pAction )
            {
                return pAction === this.CONTINUE;
            }
        };

    class DirExplorerState
    {
        #id;

        #arguments = {};

        #visitor;
        #fileFilter;
        #directoryFilter;

        #breadthFirst;

        #entry = null;

        #dirPath = null;
        #filePath = null;

        #queue = [];
        #results = [];
        #explored = [];

        constructor( pId, pArguments )
        {
            this.#id = pId;
            this.#arguments = pArguments;
        }
    }

    class DirectoryExplorer
    {
        #visitor = null;

        #directoryFilter = Filters.IDENTITY;
        #fileFilter = Filters.IDENTITY;

        #breadthFirst = false;

        #collectionStates = new AsyncBoundedQueue( 5, [] );

        constructor( pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
        {
            this.#fileFilter = Filters.IS_FILTER( pFileFilter ) ? pFileFilter : Filters.IDENTITY;
            this.#directoryFilter = Filters.IS_FILTER( pDirectoryFilter ) ? pDirectoryFilter : Filters.IDENTITY;
            this.#breadthFirst = !!pBreadthFirst;

            this.#visitor = resolveVisitor( pVisitor,
                                            {
                                                fileFilter: pFileFilter,
                                                directoryFilter: pDirectoryFilter,
                                                breadthFirst: ( !!pBreadthFirst)
                                            } );
        }

        get visitor()
        {
            return resolveVisitor( this.#visitor );
        }

        get directoryFilter()
        {
            return this.#directoryFilter;
        }

        get fileFilter()
        {
            return this.#fileFilter;
        }

        get breadthFirst()
        {
            return this.#breadthFirst;
        }

        async _evaluateDirectory( pDirPath, pDirFilter, pInclusionFilter, pVisitor, pResults = [] )
        {
            if ( isNull( pDirPath ) || isBlank( pDirPath ) )
            {
                return EXPLORER_ENTRY_ACTION.SKIP;
            }

            const dirPath = resolvePath( pDirPath );

            const stats = await asyncAttempt( async() => await stat( dirPath ) );

            const dirInfo = await asyncAttempt( async() => await DirectoryObject.fromAsync( dirPath, stats ) );

            const directoryFilter = Filters.resolve( pDirFilter, Filters.resolve( this.directoryFilter, Filters.IDENTITY ) );

            const inclusionFilter = Filters.resolve( pInclusionFilter, Filters.resolve( this.fileFilter, Filters.IDENTITY ) );

            if ( await isMatchingDirectoryObject( dirInfo, directoryFilter ) )
            {
                if ( await isMatchingFileObject( dirInfo, inclusionFilter ) )
                {
                    pResults.push( dirInfo );
                }

                const visitor = resolveVisitor( pVisitor, { dirPath: dirPath, dir: dirInfo } );

                if ( attempt( () => visitor.visit( dirInfo ) ) )
                {
                    return EXPLORER_ENTRY_ACTION.STOP;
                }

                return EXPLORER_ENTRY_ACTION.CONTINUE;
            }

            return EXPLORER_ENTRY_ACTION.SKIP;
        }

        async _processFileEntry( pFilePath, pEntry, pFilter, pVisitor, pResults )
        {
            if ( isDirectoryEntry( pEntry ) && (pEntry.isFile() || pEntry.isSymbolicLink()) )
            {
                const filePath = resolvePath( pFilePath || pEntry );

                const stats = await asyncAttempt( async() => await stat( filePath ) );

                const entryInfo = await asyncAttempt( async() => await FileObject.fromAsync( filePath, stats, pEntry ) );

                const fileFilter = Filters.resolve( pFilter, Filters.resolve( this.fileFilter, Filters.IDENTITY ) );

                if ( await isMatchingFileObject( entryInfo, fileFilter ) )
                {
                    pResults.push( entryInfo );

                    const visitor = resolveVisitor( pVisitor, { entry: entryInfo } );

                    if ( attempt( () => visitor.visit( entryInfo ) ) )
                    {
                        return EXPLORER_ENTRY_ACTION.STOP;
                    }

                    return EXPLORER_ENTRY_ACTION.CONTINUE;
                }
            }
            return EXPLORER_ENTRY_ACTION.SKIP;
        }

        resolveArguments( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
        {
            const startDirectory = attempt( () => resolveDirectoryPath( pDirectory ) );

            const visitor = resolveVisitor( pVisitor,
                                            {
                                                dir: pDirectory,
                                                fileFilter: pFileFilter,
                                                directoryFilter: pDirectoryFilter,
                                                breadthFirst: ( !!pBreadthFirst)
                                            } );

            const fileFilter = Filters.resolve( pFileFilter, this.#fileFilter );

            const directoryFilter = Filters.resolve( pDirectoryFilter, this.#directoryFilter );

            const breadthFirst = isDefined( pBreadthFirst ) ? !!pBreadthFirst : this.#breadthFirst;

            return { startDirectory, visitor, fileFilter, directoryFilter, breadthFirst };
        }

        async collect( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
        {
            const args = this.resolveArguments( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst );

            const { startDirectory } = args;

            const results = [];

            const explored = [];

            const queue = [startDirectory]; // Queue for BFS

            while ( queue.length > 0 )
            {
                const dirPath = queue.shift();

                if ( explored.includes( dirPath ) )
                {
                    continue;
                }

                const action = await asyncAttempt( async() => await this.exploreDirectory( dirPath, args, results, queue ) );

                if ( EXPLORER_ENTRY_ACTION.isStop( action ) )
                {
                    return results;
                }

                explored.push( dirPath );
            }

            return results;
        }

        async exploreDirectory( pPath, pOptions, pResults = [], pQueue = [] )
        {
            const dirPath = resolvePath( pPath );

            const {
                directoryFilter,
                fileFilter,
                visitor,
                breadthFirst
            } = pOptions || this.resolveArguments( dirPath );

            let action = await this._evaluateDirectory( dirPath,
                                                        directoryFilter,
                                                        fileFilter,
                                                        visitor,
                                                        pResults );

            if ( !EXPLORER_ENTRY_ACTION.isContinue( action ) )
            {
                return action;
            }

            const entries = await asyncAttempt( async() => await readFolder( dirPath ) );

            for await ( const entry of entries )
            {
                if ( !entry )
                {
                    continue;
                }

                const entryPath = resolvePath( path.resolve( path.join( dirPath, entry.name ) ) );

                if ( entry.isFile() || entry.isSymbolicLink() )
                {
                    action = await this._processFileEntry( entryPath, entry, fileFilter, visitor, pResults );

                    if ( EXPLORER_ENTRY_ACTION.isStop( action ) )
                    {
                        return action;
                    }
                }
                else if ( entry.isDirectory() )
                {
                    await this._processDirectory( entryPath, pOptions, breadthFirst, pResults, pQueue );
                }
            }

            return EXPLORER_ENTRY_ACTION.CONTINUE;
        }

        async _processDirectory( pDirPath, pArguments, pBreadthFirst, pResults, pQueue )
        {
            const dirPath = resolvePath( pDirPath );

            if ( pBreadthFirst )
            {
                pQueue.push( dirPath );
            }
            else
            {
                const args = pArguments || this.resolveArguments( dirPath );

                const collected = await asyncAttempt( async() => await this.collect( dirPath, args?.visitor, args?.fileFilter, args?.directoryFilter, pBreadthFirst ) );

                pResults.push( ...(asArray( collected || [] ).flat()) );
            }
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

                    let info = await FileObject.fromAsync( entryPath, entry, entry );

                    // noinspection ES6RedundantAwait
                    if ( await filter( info ) )
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
                            info = await this.findFirst( entryPath, filter, recursive, breadthFirst );

                            // noinspection ES6RedundantAwait
                            if ( await filter( info ) || await filter( entryPath ) )
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

    FileObject.collect = findFiles;

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
            asyncDeleteFile,
            asyncDeleteMatchingFiles,
            createTempFileAsync: asyncCreateTempFile,
            findFiles,

            DirectoryEntry,
            DirectoryExplorer,
            FileStats,
            FileObject,

            access,
            accessSync,
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
            writeFileSync,
            writeTextFile,
            writeTextFileSync,
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

            WriteStream,

            fs_constants,
            fsConstants,
            importNodeModules
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
