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
 * in Node.js, Deno, Browsers, and Workers.
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
 * Import bufferUtils, if for no other reason than the side-effect of creating a globally-defined Buffer class
 */
const bufferUtils = require( "@toolbocks/buffer" );

/**
 * These modules are imported from toolbocks/core
 */
const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

/* define a variable for typeof undefined **/
const { _ud = "undefined", konsole = console } = constants;

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

    const
        {
            ToolBocksModule,
            lock,
            populateOptions,
            mergeOptions,
            Visitor,
            NullVisitor,
            resolveVisitor,
            attempt,
            asyncAttempt,
            objectKeys,
            IllegalArgumentError,
            $ln
        } = moduleUtils;

    /*
     * Create local variables for the imported values and functions we use.
     */
    const
        {
            _mt_str,
            _dot,
            _colon,
            _semicolon,
            _slash,
            _backslash,
            no_op,
            ignore
        } = constants;

    const _pathSep = _slash;

    let _pathDelimiter = _colon;

    const
        {
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

    const { varargs, asArgs, flatArgs, asArray, unique, includesAll, Filters, AsyncBoundedQueue } = arrayUtils;

    let
        {
            Buffer = $scope().Buffer,
            File = $scope().File,
            Blob = $scope().Blob,
            TextEncoder = $scope().TextEncoder,
            TextDecoder = $scope().TextDecoder,
            arrayFromBuffer,
            typedArrayFromBuffer
        } = bufferUtils;

    const modName = "FileUtils";

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const executionEnvironment = toolBocksModule.executionEnvironment;

    const _isNode = executionEnvironment.isNode();
    const _isDeno = executionEnvironment.isDeno();
    const _isBrowser = executionEnvironment.isBrowser();

    const _isWindows = executionEnvironment.isWindows();
    const _isLinux = executionEnvironment.isLinux();

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

        currentDirectory = process.cwd() || __dirname;
        projectRootDirectory = path.resolve( __dirname, "../../../" );
        defaultPath = path.resolve( currentDirectory, "../messages/defaults.json" );

        WriteStream = fs.WriteStream;
    }
    /*## environment-specific:node end ##*/

    /*## environment-specific:deno start ##*/
    if ( _isDeno )
    {
        _node = null;

        try
        {
            _deno = executionEnvironment.DenoGlobal;
            currentDirectory = _deno.cwd();
        }
        catch( ex )
        {
            toolBocksModule.handleError( ex, "FileUtils::Deno.currentDirectory", executionEnvironment );
            currentDirectory = currentDirectory || _pathSep;
        }

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

        File = File || $scope().File;
        Blob = Blob || $scope().Blob;

        TextEncoder = TextEncoder || $scope().TextEncoder;
        TextDecoder = TextDecoder || $scope().TextDecoder;
    }

    /*## environment-specific:browser end ##*/

    _pathDelimiter = _isWindows ? _semicolon : _colon;

    /**
     * Dynamically imports the `os`, `fs`, `fs/promises`, `stream`, and `path` Node.js modules<br>
     * and assigns them to variables, 'os', 'fs', 'fsAsync', 'stream', and 'path' respectively.<br>
     * <br>
     * Also sets the 'currentDirectory' variable
     * <br>
     * <br>
     * Handles any errors during the module imports
     * by delegating to the `handleError` method,
     * which will emit an 'error' event for which you can listen.
     * <br>
     *
     * @return {Promise<{object}>}  A promise that resolves when
     *                              the required Node.js modules are successfully imported
     *                              or rejects if an error occurs.
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
            currentDirectory = process.cwd() || __dirname || currentDirectory;

            return Promise.resolve(
                {
                    os,
                    fs,
                    fsAsync,
                    stream,
                    path,
                    currentDirectory,
                    projectRootDirectory,
                    defaultPath
                }
            );
        }
        catch( ex )
        {
            toolBocksModule.handleError( ex, exposeModule, os, fs, fsAsync, stream, path, currentDirectory, projectRootDirectory, defaultPath );
        }
    }

    function isCompatiblePathModule( pPathModule )
    {
        if ( isNull( pPathModule ) || !(isNonNullObject( pPathModule ) || isFunction( pPathModule )) )
        {
            return false;
        }

        const requiredMethods = [
            "resolve",
            "join",
            "basename",
            "dirname",
            "extname",
            "isAbsolute",
            "normalize",
            "parse",
            "format"
        ];

        for( const method of requiredMethods )
        {
            if ( !isFunction( pPathModule[method] ) )
            {
                return false;
            }
        }

        return true;
    }

    function getCurrentDirectory()
    {
        if ( _isNode )
        {
            return process.cwd() || __dirname || currentDirectory;
        }
        else if ( _isDeno )
        {
            _deno = _deno || executionEnvironment.DenoGlobal;

            try
            {
                return _deno.cwd();
            }
            catch( ex )
            {
                toolBocksModule.handleError( ex, "FileUtils::Deno.currentDirectory", executionEnvironment );
                return currentDirectory || _pathSep;
            }
        }
        else if ( _isBrowser )
        {
            return ((_ud !== typeof window) ? window.location?.pathname : _mt_str) || currentDirectory;
        }
    }

    class PathUtils
    {
        #libraryModule;

        #currentDirectory;

        #sep = _pathSep;

        #delimiter = _pathDelimiter;

        constructor( pPathSeparator = _pathSep,
                     pPathDelimiter = _pathDelimiter,
                     pCurrentDirectory = attempt( () => getCurrentDirectory() ) || !_isBrowser ? pPathSeparator : _mt_str )
        {
            if ( _isNode )
            {
                this.#libraryModule = path || require( "node:path" );
            }
            else if ( _isDeno )
            {
                this.#libraryModule = _deno.path || path || this;
            }
            else if ( _isBrowser )
            {
                this.#libraryModule = this;
            }

            if ( !isCompatiblePathModule( this.#libraryModule ) )
            {
                this.#libraryModule = this;
            }

            this.#sep = pPathSeparator || _pathSep;
            this.#delimiter = pPathDelimiter || _colon;
            this.#currentDirectory = pCurrentDirectory || attempt( () => getCurrentDirectory() ) || currentDirectory || _pathSep;
        }

        get sep()
        {
            return this.#sep || _pathSep;
        }

        get pathSeparator()
        {
            return this.sep || _pathSep;
        }

        get delimiter()
        {
            return this.#delimiter || _colon;
        }

        get pathDelimiter()
        {
            return this.delimiter || _colon;
        }

        get currentDirectory()
        {
            return attempt( () => getCurrentDirectory() ) || this.#currentDirectory || currentDirectory || _pathSep;
        }

        get libraryModule()
        {
            return isCompatiblePathModule( this.#libraryModule ) ? this.#libraryModule : this;
        }

        isAbsolute( pPath )
        {
            const s = toUnixPath( asString( pPath, true ) );
            return (s.startsWith( _pathSep ) || s.startsWith( _backslash ) || /^[A-Z]?:/.test( s ));
        }

        normalize( pPath )
        {
            let unixPath = toUnixPath( asString( pPath, true ) );

            if ( isBlank( unixPath ) )
            {
                return _dot;
            }

            // Keep track if the original path had a root (e.g., '/', 'C:/')
            const startsWithSeparator = unixPath.startsWith( this.sep );
            const startsWithWindowsRoot = /^[A-Z]:\//i.test( unixPath );

            let hadRoot = startsWithSeparator || startsWithWindowsRoot;

            let root = (startsWithSeparator) ? this.sep : (startsWithWindowsRoot) ? unixPath.substring( 0, unixPath.indexOf( this.sep ) + 1 ) : _mt_str;

            const parts = [];

            const segments = unixPath.split( this.sep ).filter( e => !isBlank( e ) && e !== _dot );

            for( const part of segments )
            {
                if ( part === ".." )
                {
                    // If there are parts to pop, and the path segment isn't itself '..'
                    // (which would mean we're accumulating '..' for relative paths going above the CWD)
                    if ( parts.length > 0 && parts[parts.length - 1] !== ".." )
                    {
                        parts.pop();
                    }
                    else if ( !hadRoot )
                    {
                        // If it started relative and we're at the beginning (parts is empty),
                        // and we encounter '..', we need to keep it to signify going "up"
                        // from the current directory.
                        parts.push( part );
                    }
                }
                else
                {
                    parts.push( part );
                }
            }

            let normalizedPath = parts.join( this.sep );

            // If the path was absolute (had a root), ensure the final path retains its root.
            if ( hadRoot && !normalizedPath.startsWith( root ) )
            {
                return toUnixPath( root + normalizedPath );
            }

            return (isBlank( normalizedPath )) ? _dot : normalizedPath;
        }

        resolve( ...pPathSegments )
        {
            let resolvedPath = _mt_str;

            let foundAbsolute = false;

            let initialPathHadRoot = false; // To track if the final resolved base path was absolute

            const segments = flatArgs( pPathSegments ).filter( isString ).filter( e => !isBlank( e ) ).map( e => toUnixPath( e ) );

            for( let i = segments.length; i--; )
            {
                const segment = segments[i];

                if ( isBlank( segment ) )
                {
                    continue;
                }

                if ( this.isAbsolute( segment ) )
                {
                    resolvedPath = segment;

                    foundAbsolute = true;

                    initialPathHadRoot = true; // Mark that an absolute segment was found

                    break;
                }

                resolvedPath = isBlank( resolvedPath ) ? segment : (segment + this.sep + resolvedPath);
            }

            // If no absolute path was found among segments, prepend the currentDirectory.
            if ( !foundAbsolute )
            {
                const normalizedCwd = toUnixPath( this.currentDirectory );

                // path.resolve always assumes CWD is absolute.
                resolvedPath = normalizedCwd + this.sep + resolvedPath;

                // The result will be absolute due to CWD being absolute, so set the flag.
                initialPathHadRoot = true;
            }

            // Now, pass the combined path to the normalize method for cleaning up '.', '..', and //
            resolvedPath = this.normalize( resolvedPath );

            // A final check to ensure absolute paths don't lose their root if they normalize to '.'
            // e.g., path.resolve('/a/..') should be '/' not '.'
            if ( isBlank( resolvedPath ) && initialPathHadRoot )
            {
                // Reconstruct the root from the initial resolvedPath or currentDirectory
                const tempPath = toUnixPath( this.currentDirectory ); // Fallback to currentDirectory's root

                if ( this.isAbsolute( tempPath ) )
                {
                    if ( tempPath.startsWith( this.sep ) )
                    {
                        return this.sep;
                    }
                    if ( /^[A-Z]:\//i.test( tempPath ) )
                    {
                        return tempPath.substring( 0, tempPath.indexOf( this.sep ) + 1 );
                    }
                }
            }

            return resolvedPath;
        }

        join( ...parts )
        {
            return flatArgs( parts ).filter( isString ).map( e => toUnixPath( e ) ).join( this.sep ).replaceAll( /\/\/+/g, this.sep );
        }

        basename( pPath )
        {
            const unixPath = toUnixPath( asString( pPath ) );

            const lastIndexOfSeparator = unixPath.lastIndexOf( this.sep );

            if ( lastIndexOfSeparator >= 0 )
            {
                return (unixPath.substring( lastIndexOfSeparator + 1 )) || unixPath;
            }

            return unixPath;
        }

        dirname( pPath )
        {
            const unixPath = toUnixPath( asString( pPath ) ).trim();

            const lastIndexOfSeparator = unixPath.lastIndexOf( this.sep );

            if ( lastIndexOfSeparator > 0 )
            {
                return (unixPath.substring( 0, lastIndexOfSeparator )) || _dot;
            }

            return _dot;
        }

        extname( pPath )
        {
            let unixPath = toUnixPath( asString( pPath ) ).trim();

            const lastIndexOfDot = unixPath.lastIndexOf( _dot );

            if ( lastIndexOfDot <= 0 || lastIndexOfDot >= unixPath.length - 1 )
            {
                return _mt_str;
            }

            return unixPath.substring( lastIndexOfDot );
        }

        parse( pPath )
        {
            const library = this.#libraryModule || path || this;

            const base = library.basename( pPath );

            const dir = library.dirname( pPath );

            const ext = library.extname( pPath );

            const name = base.substring( 0, Math.max( 0, base.length - ext.length ) ) || asString( base, true );

            const root = pPath.startsWith( _pathSep ) ? _pathSep : _mt_str;

            return { root, dir, base, ext, name };
        }

        format( pPathObject )
        {
            return toUnixPath( (pPathObject?.dir || ".") + _pathSep + (pPathObject?.base || _mt_str) );
        }

        fromDirEntry( pEntry )
        {
            return !isNull( pEntry ) ?
                   ((pEntry?.parentPath || pEntry?.path) + _pathSep + pEntry?.name)
                                     : _mt_str;
        }
    }

    /*
     * If the 'path' module is unavailable in the current execution environment,
     * we define our own methods as proxies
     */
    if ( _ud === typeof path || isNull( path ) || !isCompatiblePathModule( path ) )
    {
        path = new PathUtils();
    }

    PathUtils.instance = function()
    {
        if ( isCompatiblePathModule( path ) )
        {
            if ( !isFunction( path.fromDirEntry ) )
            {
                try
                {
                    path.fromDirEntry = function( pEntry )
                    {
                        return !isNull( pEntry ) ?
                               ((pEntry?.parentPath || pEntry?.path) + _pathSep + pEntry?.name)
                                                 : _mt_str;
                    };
                }
                catch( ex )
                {
                    toolBocksModule.handleError( ex, "PathUtils::instance::extending_module", PathUtils );
                }
            }
            return path;
        }
        return new PathUtils( _pathSep, _pathDelimiter, getCurrentDirectory() );
    };

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
            arrayUtils,
            bufferUtils
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

    class BrowserWriteStream
    {
        #dataChunks = [];
        #filePath;

        constructor( pFilePath )
        {
            this.#filePath = resolvePath( pFilePath );
        }

        write( pChunk )
        {
            this.#dataChunks.push( pChunk );
        }

        close()
        {
            const blob = attempt( () => new Blob( this.#dataChunks ) );
            const url = attempt( () => URL.createObjectURL( blob ) );

            if ( !isNull( blob ) && !isBlank( url ) && (_ud !== typeof document) )
            {
                const a = document.createElement( "a" );

                if ( a )
                {
                    a.href = url;

                    a.download = (asString( this.#filePath, true ).split( "/" ).pop()) || true;

                    document.body.appendChild( a );

                    a.click();

                    document.body.removeChild( a );
                }

                attempt( () => URL.revokeObjectURL( url ) );
            }
        }
    }

    /*
     * Defines local variables for the synchronous functions found in the FileSystem API of the current execution environment.
     * Each function is declared with a default implementation
     * that is conditional upon whether we are running in Node.js, Deno, Bun, or a browser
     */
    const {

        Dir = _isNode ? fs.Dir : null,

        accessSync = _isNode ? fs.accessSync : function( pPath )
        {
            try
            {
                _deno.statSync( resolvePath( pPath ) );
                return true;
            }
            catch( ex )
            {
                toolBocksModule.handleError( ex, access, pPath );
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
            if ( _isDeno )
            {
                // TODO
            }
            else
            {
                return new BrowserWriteStream( pPath );
            }
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

            const directory = pDirectory || asString( os.tempDir() || executionEnvironment.tmpDirectoryName );

            const tempFilePath = resolvePath( [directory, tempFileName] );

            writeFileSync( tempFilePath, _mt_str, { flag: "w", encoding: "utf8" } );

            return tempFilePath;

        } : function( pPrefix = "temp", pExtension = ".tmp", pDirectory = null )
                           {
                               return _deno?.makeTempFileSync( {
                                                                   prefix: pPrefix,
                                                                   suffix: pExtension,
                                                                   dir: pDirectory
                                                               }, );
                           },

        openSync = _isNode ? fs.openSync : _deno?.openSync,

        opendirSync = _isNode ? fs.opendirSync : _deno?.readDirSync,

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
                toolBocksModule.handleError( ex, access, pPath );
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

                let pathLib = PathUtils.instance();

                for await ( const entry of entries )
                {
                    names.push( pathLib.join( pPath, entry.name ) );
                }

                return names;
            }
        },

        writeFile = _isNode ? fsAsync.writeFile : _deno?.writeFile,

        writeTextFile = _isNode ? fsAsync.writeFile : _deno?.writeTextFile,

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
            fsAsync.writeFile( resolvePath( pPath ), _mt_str, populateOptions( pOptions, { encoding: "utf8" } ) );
        } : _deno?.create,

        makeTempDir = _isNode ? fsAsync.mkdtemp : _deno?.makeTempDir,

        makeTempFile = _isNode ? async function( pPrefix = "temp", pExtension = ".tmp", pDirectory = null )
        {
            const tempFileName = generateTempFileName( pPrefix, pExtension );

            let directory = resolvePath( pDirectory || asString( os.tempDir() || pDirectory ) );

            let tempFilePath = resolvePath( [directory, tempFileName] );

            await fsAsync.writeFile( tempFilePath, _mt_str, { encoding: "utf-8", flag: "w" } );

            return tempFilePath;

        } : _deno?.makeTempFile,

        mkdir = _isNode ? fsAsync.mkdir : _deno?.mkdir || _deno?.mkDir,

        open = _isNode ? fsAsync.open : _deno?.open,

        opendir = _isNode ? fsAsync.opendir : _deno?.readDir,

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
    fsConstants = lock( _isNode ? populateOptions( fsConstants, (fs.constants || fs_constants || fsConstants) ) : fsConstants );

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
    function resolvePath( ...pPath )
    {
        const pathLib = PathUtils.instance();

        let p = _mt_str;

        if ( isNull( pPath ) )
        {
            return pathLib.resolve( "." );
        }

        let components = asArray( pPath );

        if ( $ln( components ) <= 0 )
        {
            return pathLib.resolve( "." );
        }

        if ( $ln( components ) <= 1 )
        {
            components = asString( components[0], true );
        }

        if ( isArray( components ) )
        {
            p = attempt( () => pathLib.resolve( ...(asArray( components ).flat()) ) );
        }
        else if ( isDirectoryEntry( components ) )
        {
            p = attempt( () => pathLib.resolve( pathLib.join( (components?.parentPath || components?.path || "./"), (components.name || _mt_str) ) ) );
        }
        else
        {
            p = attempt( () => pathLib.resolve( toUnixPath( asString( components, true, { joinOn: _mt_str } ).trim() ) ) );
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
        const pathLib = PathUtils.instance();
        return toUnixPath( isString( pDirectoryPath ) ? attempt( () => pathLib.resolve( toUnixPath( asString( pDirectoryPath, true ) ) ) ) : resolvePath( pDirectoryPath ) );
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
        let pathLib = PathUtils.instance();

        const filePath = resolvePath( pFilePath );

        const fileName = asString( pathLib.basename( filePath ) || rightOfLast( filePath, _slash ), true );

        const dirName = asString( pathLib.dirname( filePath ) || leftOfLast( filePath, _slash ), true );

        const extension = asString( pathLib.extname( fileName ), true ) || (fileName.lastIndexOf( _dot ) > 0 ? fileName.slice( fileName.lastIndexOf( _dot ) ) : _mt_str);

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
        const { fileName, extension } = attempt( () => getFilePathData( pFilePath ) );
        return asString( extension, true ) || asString( _dot + rightOfLast( (fileName || pFilePath), _dot ), true );
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
        const { filePath, fileName } = attempt( () => getFilePathData( pFilePath ) );
        return asString( (fileName || rightOfLast( (filePath || pFilePath), _slash )), true );
    }

    /**
     * Retrieves the directory name from a given file path.
     *
     * @param {string} pFilePath - The file path from which the directory name will be extracted.
     * @return {string} The directory name extracted from the file path.
     */
    function getDirectoryName( pFilePath )
    {
        const { filePath, dirName } = attempt( () => getFilePathData( pFilePath ) );
        return asString( dirName, true ) || asString( leftOfLast( (filePath || pFilePath), _slash ), true );
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
            let pathLib = PathUtils.instance();

            const object = isFileStats( pStats ) ? pStats : attempt( () => statSync( resolvePath( pFilePath || pStats ) ) );

            this.#stats = isNonNullObject( object ) ? { ...object } : {};

            this.#size = asInt( object?.size, 0 );

            this.#created = isDate( object?.birthtime ) ? new Date( object?.birthtime ) : object?.created;
            this.#modified = isDate( object?.mtime ) ? new Date( object?.mtime ) : object?.modified;
            this.#accessed = isDate( object?.atime ) ? new Date( object?.atime ) : object?.accessed;

            this.#_isFile = isFunction( object?.isFile ) ? object?.isFile() : object?.isFile || false;
            this.#_isDirectory = isFunction( object?.isDirectory ) ? object?.isDirectory() : object?.isDirectory || false;
            this.#_isSymbolicLink = isFunction( object?.isSymbolicLink ) ? object?.isSymbolicLink() : object?.isSymbolicLink || object?.isSymLink || false;

            this.#filePath = resolvePath( pFilePath || (asString( pathLib.resolve( object?.parentPath || object?.path || _mt_str, object?.name || _mt_str ), true )) );
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
     * @function FileStats.fromFilePath
     *
     * @param {string} pFilePath - The file path for which statistical information is desired.
     *
     * @returns {Object} An object containing statistical data of the file at the specified path.
     */
    FileStats.fromFilePath = async function( pFilePath )
    {
        const filePath = resolvePath( pFilePath );

        if ( isBlank( filePath ) )
        {
            toolBocksModule.handleError( new IllegalArgumentError( "Path is required", {} ), FileStats.fromFilePath, pFilePath, filePath );
            return NO_ATTRIBUTES;
        }

        try
        {
            let pathLib = PathUtils.instance();
            const stats = await stat( resolvePath( pathLib.normalize( filePath ) ) );
            return new FileStats( stats, filePath );
        }
        catch( ex )
        {
            toolBocksModule.handleError( ex, FileStats.fromFilePath, pFilePath );
        }

        return NO_ATTRIBUTES;
    };

    FileStats.fromStats = function( pStats, pFilePath )
    {
        return new FileStats( pStats, pFilePath );
    };

    FileStats.fromDirEnt = function( pDirEntry, pFilePath )
    {
        const filePath = resolvePath( pFilePath || ((pDirEntry?.parentPath || pDirEntry?.path || _mt_str) + _slash + (pDirEntry?.name || _mt_str)) );

        if ( !isBlank( filePath ) )
        {
            return FileStats.fromFilePath( filePath );
        }

        toolBocksModule.reportError( new Error( `Unable to create FileStats from directory entry: ${pDirEntry}` ) );

        return {};
    };

    FileStats.fromFileProxy = function( pProxy, pFilePath )
    {
        const filePath = resolvePath( pFilePath || pProxy?.filePath || _mt_str );

        if ( isNonNullObject( pProxy ) && isFunction( pProxy.statSync ) )
        {
            return new FileStats( pProxy.statSync(), filePath );
        }

        return FileStats.fromFilePath( filePath );
    };

    FileStats.from = function( pObject, pFilePath )
    {
        if ( isDirectoryEntry( pObject ) )
        {
            return FileStats.fromDirEnt( pObject, pFilePath );
        }

        if ( isFileStats( pObject ) )
        {
            return FileStats.fromStats( pObject, pFilePath );
        }

        if ( pObject instanceof FileProxy )
        {
            return FileStats.fromFileProxy( pObject, pFilePath );
        }

        if ( isString( pObject ) )
        {
            return FileStats.fromFilePath( pObject );
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
        if ( isFunction( File ) && pPath instanceof File )
        {
            return true;
        }

        if ( isDirectoryEntry( pPath ) )
        {
            return isFunction( pPath.isFile ) ? pPath.isFile() : pPath.isFile;
        }

        const fileStats = await FileStats.fromFilePath( resolvePath( pPath ) );
        return fileStats?.isFile() || false;
    }

    /**
     * Asynchronously checks whether the specified path refers to a directory.<br>
     * <br>
     * <b>This function is <i>asynchronous</i></b>
     *
     * @param {string} pPath - The path to check, (normalized and resolved to an absolute path).
     *
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isDirectory( pPath )
    {
        if ( !isNull( Dir ) && pPath instanceof Dir )
        {
            return true;
        }

        const fileStats = await FileStats.fromFilePath( resolvePath( pPath ) );
        return fileStats?.isDirectory() || false;
    }

    /**
     * Asynchronously checks whether the specified path refers to a symbolic link (symlink).<br>
     *
     * @param {string} pPath - The path to check, (normalized and resolved to an absolute path).
     *
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isSymbolicLink( pPath )
    {
        const fileStats = await FileStats.fromFilePath( resolvePath( pPath ) );
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
        let filepath = asString( pPath, true );

        const ext = getFileExtension( filepath );

        const rxExt = new RegExp( (ext + "$") );

        filepath = filepath.replace( rxExt, _mt_str );
        filepath = filepath.replace( /[\/\\]+$/, _mt_str );
        filepath = filepath.replace( rxExt, _mt_str );

        const exhaustive = !!pExhaustive;

        if ( exhaustive )
        {
            let pathLib = PathUtils.instance();

            const name = asString( pathLib.basename( filepath ), true );

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

        const newFilename = removeExtension( asString( pPath, true ), pExhaustive );

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
        let pathLib = PathUtils.instance();

        const tempDir = isNull( pDirectory ) ? getTempDirectory() : resolveDirectoryPath( pDirectory );

        const prefix = asString( pPrefix, true ) || "temp";
        const extension = asString( pExtension, true ) || ".tmp";

        const randomFileName = generateTempFileName( prefix, extension );

        const filePath = pathLib.join( tempDir, randomFileName );

        return {
            tempDir,
            prefix,
            extension,
            filePath
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
            toolBocksModule.handleError( ex, createTempFile, pPrefix, pExtension, pDirectory );
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
            toolBocksModule.handleError( ex, asyncCreateTempFile, pPrefix, pExtension, pDirectory );
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
            toolBocksModule.handleError( error, createTextFile, pFilePath, pContent, pOverwrite );
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
            toolBocksModule.handleError( error, asyncCreateTextFile, pFilePath, pContent, pOverwrite );
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
                                                 } ).catch( ( err ) => toolBocksModule.handleError( err, deleteFile, pFilePath, filePath, realPath ) );
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
                let pathLib = PathUtils.instance();

                const filePath = resolvePath( pathLib.join( dirPath, file.name ) );

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
            toolBocksModule.handleError( error, asyncDeleteMatchingFiles, pDirPath, pFileNameFilter, pFollowLinks, deletedFiles, remaining, expectedDeletions );
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
     * This class is a stand-in for the Deno.FsFile, Node.Js FileHandle object, or the Wen API File object.<br>
     * <br>
     * @class
     */
    class FileProxy extends EventTarget
    {
        #filePath;

        #fsFile;
        #fileHandle;
        #file;

        constructor( pFilePath, pFileHandle )
        {
            super();

            this.#filePath = resolvePath( pFilePath );

            this.#fileHandle = isFileHandle( pFileHandle ) ? pFileHandle : null;
            this.#fsFile = isFsFile( pFileHandle ) ? pFileHandle : null;
        }

        get filePath()
        {
            return this.#filePath;
        }

        async getFile()
        {
            if ( isNull( this.#file ) )
            {
                this.#file = isDefined( File ) ? await asyncAttempt( async() => new File() ) : this;
            }
            return this.#file;
        }

        async getFileHandle()
        {
            if ( isFileHandle( this.#fileHandle ) )
            {
                return this.#fileHandle;
            }

            const fileHandle = asyncAttempt( async() => await open( this.#filePath, { read: true, write: true } ) );

            if ( !isNull( fileHandle ) && isFileHandle( fileHandle ) )
            {
                this.#fileHandle = fileHandle;
                return fileHandle;
            }

            return this;
        }

        set fsFile( pFsFile )
        {
            if ( isFsFile( pFsFile ) )
            {
                this.#fsFile = pFsFile;
            }
            else if ( isFileHandle( pFsFile ) )
            {
                this.#fileHandle = pFsFile;
            }
        }

        async getFsFile()
        {
            if ( isFsFile( this.#fsFile ) )
            {
                return this.#fsFile;
            }

            const fsFile = asyncAttempt( async() => await open( this.#filePath, { read: true, write: true } ) );

            if ( !isNull( fsFile ) && isFsFile( fsFile ) )
            {
                this.#fsFile = fsFile;
                return fsFile;
            }

            return this;
        }

        set fileHandle( pFileHandle )
        {
            if ( isFileHandle( pFileHandle ) )
            {
                this.#fileHandle = pFileHandle;
            }
            else if ( isFsFile( pFileHandle ) )
            {
                this.#fsFile = pFileHandle;
            }
        }

        notMe( pObject )
        {
            return this !== pObject;
        }

        [Symbol.dispose]()
        {
            this.close().then( no_op ).catch( toolBocksModule.handleError );
        }

        async close()
        {
            let emit = false;

            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                await asyncAttempt( async() => await this.#fsFile.close() );
                emit = true;
            }
            else if ( !isNull( this.#fileHandle ) && this.notMe( this.#fileHandle ) )
            {
                close( this.#fileHandle );
                emit = true;
            }

            if ( emit )
            {
                this.dispatchEvent( new Event( "close" ) );
            }
        }

        closeSync()
        {
            let emit = false;

            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                this.#fsFile.closeSync();
                emit = true;
            }
            else if ( !isNull( this.#fileHandle ) && this.notMe( this.#fileHandle ) )
            {
                closeSync( this.#fileHandle?.fd ).then( r => r );

                emit = true;
            }

            if ( emit )
            {
                this.dispatchEvent( new Event( "close" ) );
            }
        }

        isTerminal()
        {
            if ( !isNull( this.#fsFile ) )
            {
                return this.#fsFile.isTerminal();
            }
            // no Node.js equivalent?
            return false;
        }

        async lock()
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                const fsFile = this.#fsFile;
                return asyncAttempt( async() => fsFile.lock() );
            }
            // no Node.js equivalent?
        }

        lockSync()
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                const fsFile = this.#fsFile;
                return attempt( () => fsFile.lockSync() );
            }
            // no Node.js equivalent?
        }

        async read( pBuffer )
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                const fsFile = this.#fsFile;
                asyncAttempt( async() => fsFile.read( pBuffer ) );
                return { buffer: pBuffer, bytesRead: fsFile.bytesRead };
            }

            if ( !isNull( this.#fileHandle ) && this.notMe( this.#fileHandle ) )
            {
                const fileHandle = this.#fileHandle;
                asyncAttempt( async() => fileHandle.read( pBuffer ) );
            }

            const me = this;

            const filePath = this.filePath;

            const proxy = asyncAttempt( async() => await me.getFileHandle( filePath ) || await me.getFsFile( filePath ) );

            if ( !isNull( proxy ) && this.notMe( proxy ) )
            {
                const { buffer, bytesRead } = asyncAttempt( async() => await proxy.read( pBuffer ) );
                return { buffer, bytesRead };
            }

            const buffer = asyncAttempt( async() => await readFile( filePath ) );

            const bytesCopied = buffer.copy( pBuffer );

            return { buffer, bytesRead: bytesCopied };
        }

        readSync( pBuffer )
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                const fsFile = this.#fsFile;
                return { buffer: pBuffer, bytesRead: fsFile.readSync() };
            }

            const filePath = this.filePath;

            const buffer = attempt( () => readFileSync( filePath ) );

            const bytesCopied = buffer.copy( pBuffer );

            return { buffer, bytesRead: bytesCopied };
        }

        async seek( pOffset, pWhence = FileProxy.SeekMode.Current )
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                return this.#fsFile.seek( asInt( pOffset, pWhence ), pWhence );
            }
            // no Node.js equivalent?
        }

        seekSync( pOffset, pWhence = FileProxy.SeekMode.Current )
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                return this.#fsFile.seekSync( asInt( pOffset, pWhence ), pWhence );
            }
            // no Node.js equivalent?
        }

        setRaw( pMode, pOptions )
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                return this.#fsFile.setRaw( pMode, pOptions );
            }
            // no Node.js equivalent?
        }

        async stat()
        {
            const proxy = !isNull( this.#fsFile ) ? this.#fsFile : !isNull( this.#fileHandle ) ? this.#fileHandle : null;

            if ( !isNull( proxy ) && this.notMe( proxy ) )
            {
                return asyncAttempt( async() => await proxy.stat() );
            }

            const filePath = this.filePath;
            return asyncAttempt( async() => await stat( filePath ) );
        }

        statSync()
        {
            const proxy = !isNull( this.#fsFile ) ? this.#fsFile : null;

            if ( !isNull( proxy ) && this.notMe( proxy ) )
            {
                return attempt( () => proxy.statSync() );
            }

            const filePath = this.filePath;
            return attempt( () => statSync( filePath ) );
        }

        async sync()
        {
            const proxy = !isNull( this.#fsFile ) ? this.#fsFile : (!isNull( this.#fileHandle ) ? this.#fileHandle : null);

            if ( !isNull( proxy ) && this.notMe( proxy ) )
            {
                return asyncAttempt( async() => await proxy.sync() );
            }

            const filePath = this.filePath;
            return asyncAttempt( async() => fsAsync.sync( filePath ) );
        }

        syncData()
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                return this.#fsFile.syncData();
            }

            const me = this;
            return asyncAttempt( async() => await me.sync() );
        }

        syncDataSync()
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                return this.#fsFile.syncDataSync();
            }
            const me = this;
            return asyncAttempt( async() => await me.sync() );
        }

        syncSync()
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                return this.#fsFile.syncSync();
            }
            const me = this;
            return asyncAttempt( async() => await me.sync() );
        }

        truncate( pLength )
        {
            const proxy = !isNull( this.#fsFile ) ? this.#fsFile : (!isNull( this.#fileHandle ) ? this.#fileHandle : null);

            if ( !isNull( proxy ) && this.notMe( proxy ) )
            {
                return asyncAttempt( async() => await proxy.truncate( asInt( pLength ) ) );
            }

            const filePath = this.filePath;

            return asyncAttempt( async() => await fsAsync.truncate( filePath, asInt( pLength ) ) );
        }

        truncateSync( pLength )
        {
            const proxy = !isNull( this.#fsFile ) ? this.#fsFile : (!isNull( this.#fileHandle ) ? this.#fileHandle : null);

            if ( !isNull( proxy ) && this.notMe( proxy ) )
            {
                return asyncAttempt( async() => await proxy.truncateSync( asInt( pLength ) ) );
            }

            const filePath = this.filePath;

            return attempt( () => fs.truncateSync( filePath, asInt( pLength ) ) );
        }

        unlock()
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                const fsFile = this.#fsFile;
                return asyncAttempt( async() => fsFile.unlock() );
            }
            // no Node.js equivalent?
        }

        unlockSync()
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                const fsFile = this.#fsFile;
                return attempt( () => fsFile.unlockSync() );
            }
            // no Node.js equivalent?
        }

        async utime( pAccessTime, pModificationTime )
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                const fsFile = this.#fsFile;
                return asyncAttempt( async() => fsFile.utime( pAccessTime, pModificationTime ) );
            }

            if ( !isNull( this.#fileHandle ) && this.notMe( this.#fileHandle ) )
            {
                const fileHandle = this.#fileHandle;
                asyncAttempt( async() => fileHandle.utimes( pAccessTime, pModificationTime ) );
            }

            const filePath = this.filePath;

            asyncAttempt( async() => await fsAsync.utimes( filePath, pAccessTime, pModificationTime ) );
        }

        utimeSync( pAccessTime, pModificationTime )
        {
            if ( !isNull( this.#fsFile ) && this.notMe( this.#fsFile ) )
            {
                const fsFile = this.#fsFile;
                return attempt( () => fsFile.utimeSync( pAccessTime, pModificationTime ) );
            }

            const filePath = this.filePath;

            attempt( () => fs.utimesSync( filePath, pAccessTime, pModificationTime ) );
        }

        write()
        {

        }

        writeSync()
        {

        }

    }

    FileProxy.SeekMode =
        {
            Start: 0,
            Current: 1,
            End: 2
        };

    /**
     * Defines a proxy for the Deno.FsFile interface if we are running in another execution environment
     * @type {*|(function())}
     */
    const FsFile = _deno?.FsFile || FileProxy;

    const isFsFile = ( pFile ) =>
    {
        if ( _isDeno )
        {
            if ( isNonNullObject( pFile )
                 && isFunction( pFile.close )
                 && isFunction( pFile.read )
                 && isFunction( pFile.write )
                 && isFunction( pFile.stat )
                 && isFunction( pFile.lock )
                 && isFunction( pFile.seek )
                 && isFunction( pFile.isTerminal )
                 && isFunction( pFile.setRaw ) )
            {
                return true;
            }
        }

        return _isDeno && (pFile instanceof FsFile || pFile instanceof FileProxy);
    };

    const isFileHandle = ( pFileHandle ) =>
    {
        if ( _isNode )
        {
            return (isNonNullObject( pFileHandle )
                    && isFunction( pFileHandle.close )
                    && isFunction( pFileHandle.read )
                    && isFunction( pFileHandle.write )
                    && isFunction( pFileHandle.stat )
                    && isFunction( pFileHandle.createReadStream )
                    && isFunction( pFileHandle.createWriteStream )
                    && isFunction( pFileHandle.datasync ));
        }
        return false;
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

        #fileProxy = null;

        #_isFile = null;
        #_isDirectory = null;
        #_isSymbolicLink = null;

        #created = null;
        #modified = null;
        #accessed = null;

        #size = -1;

        #valid = false;

        constructor( pFilePath, pFileStats = null, pDirEntry = null )
        {
            super();

            this.#filepath = resolvePath( pFilePath );

            this.#stats = FileStats.from( pFileStats );

            if ( isFileStats( this.#stats ) )
            {
                this.updateStats( this.#stats );
            }

            this.#entry = isNonNullObject( pDirEntry ) ? new DirectoryEntry( pDirEntry, this.#filepath ) : {};

            this.#valid = !isBlank( this.#filepath );

            this.#fileProxy = this.#valid ? new FileProxy( this.#filepath ) : null;
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

        get extension()
        {
            return getFileExtension( this.filepath );
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
                let pathLib = PathUtils.instance();

                const files = await asyncAttempt( async() => await readFolder( dirPath ) );

                return files.map( e => new FileObject( pathLib.resolve( dirPath, e.name ), e, e ) );
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

        _debugNumTakes = 0;
        _debugNumPuts = 0;

        constructor( pId, pArguments )
        {
            this.#id = pId;
            this.#arguments = mergeOptions( pArguments, this.#arguments || {} );

            this.#visitor = resolveVisitor( this.#arguments.visitor );
            this.#fileFilter = Filters.resolve( this.#arguments.fileFilter );
            this.#directoryFilter = Filters.resolve( this.#arguments.directoryFilter );
            this.#breadthFirst = this.#arguments.breadthFirst || false;

            this.#entry = this.#arguments.entry || null;
            this.#dirPath = this.#arguments.dirPath || null;
            this.#filePath = this.#arguments.filePath || null;

            this.#queue = this.#arguments.queue || [];
            this.#results = this.#arguments.results || [];
            this.#explored = this.#arguments.explored || [];
        }

        get id()
        {
            return this.#id;
        }

        get entry()
        {
            return !isNull( this.#entry ) ? new DirectoryEntry( this.#entry, asString( this.#filePath || this.#dirPath, true ) ) : null;
        }

        get dirPath()
        {
            return resolvePath( asString( this.#dirPath, true ) );
        }

        set dirPath( pDirPath )
        {
            if ( !isBlank( pDirPath ) )
            {
                this.#dirPath = resolvePath( asString( pDirPath, true ) );
                this.#filePath = _mt_str;
            }
        }

        get filePath()
        {
            return resolvePath( asString( this.#filePath, true ) );
        }

        set filePath( pFilePath )
        {
            this.#filePath = resolvePath( pFilePath );
        }

        get visitor()
        {
            return resolveVisitor( this.#visitor, {} );
        }

        get fileFilter()
        {
            return this.#fileFilter;
        }

        get directoryFilter()
        {
            return this.#directoryFilter;
        }

        get breadthFirst()
        {
            return this.#breadthFirst;
        }

        isQueueEmpty()
        {
            return this.#queue.length <= 0;
        }

        take()
        {
            this._debugNumTakes++;

            if ( !this.isQueueEmpty() )
            {
                return this.#queue.shift();
            }
        }

        enQueue( pPath )
        {
            this._debugNumPuts++;

            this.#queue.push( pPath );
        }

        setExplored( pPath )
        {
            this.#explored.push( resolvePath( pPath ) );
            this.#explored = unique( this.#explored );
        }

        isExplored( pPath )
        {
            return asArray( this.#explored ).includes( resolvePath( pPath ) );
        }

        display()
        {
            konsole.log( "SEARCH STATE", this.id, "\n",
                         "EXPLORED:", this.#explored, "\n",
                         "QUEUED:", this.#queue, "\n",
                         "RESULTS:", this.#results,
                         "NUM_TAKES:", this._debugNumTakes,
                         "NUM_PUTS:", this._debugNumPuts, "\n\n" );
        }

        addResult( pResult )
        {
            this.#results.push( pResult );
        }

        addResults( ...pResults )
        {
            this.#results.push( ...(asArgs( ...pResults )) );
        }

        getResults()
        {
            return [...(asArray( this.#results ))];
        }

        get args()
        {
            return lock( { ...this.#arguments } );
        }
    }

    class DirectoryExplorer
    {
        #visitor = null;

        #directoryFilter = Filters.IDENTITY;
        #fileFilter = Filters.IDENTITY;

        #breadthFirst = false;

        #collectionStateId = 0;

        #collectionStates;

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

            this.#collectionStates = new AsyncBoundedQueue( 5, [] );
        }

        get visitor()
        {
            return resolveVisitor( this.#visitor );
        }

        get directoryFilter()
        {
            return Filters.resolve( this.#directoryFilter );
        }

        get fileFilter()
        {
            return Filters.resolve( this.#fileFilter );
        }

        get breadthFirst()
        {
            return this.#breadthFirst;
        }

        async resolveSearchState( pSearchState )
        {
            let searchState = pSearchState || await this.#collectionStates.peek();

            if ( isNull( searchState ) || !(searchState instanceof DirExplorerState) )
            {
                searchState = new DirExplorerState( ++this.#collectionStateId,
                                                    {
                                                        visitor: resolveVisitor( this.visitor ),
                                                        fileFilter: Filters.resolve( this.fileFilter ),
                                                        directoryFilter: Filters.resolve( this.directoryFilter ),
                                                        breadthFirst: this.breadthFirst
                                                    } );

                await this.#collectionStates.enQueue( searchState );
            }

            return searchState;
        }

        async _evaluateDirectory( pDirPath, pSearchState )
        {
            if ( isNull( pDirPath ) || isBlank( pDirPath ) )
            {
                return EXPLORER_ENTRY_ACTION.SKIP;
            }

            const searchState = await this.resolveSearchState( pSearchState );

            const dirPath = resolvePath( pDirPath );

            if ( searchState.isExplored( dirPath ) )
            {
                return EXPLORER_ENTRY_ACTION.SKIP;
            }

            const stats = await asyncAttempt( async() => await stat( dirPath ) );

            const dirInfo = await asyncAttempt( async() => await DirectoryObject.fromAsync( dirPath, stats ) );

            const directoryFilter = Filters.resolve( searchState.directoryFilter, Filters.resolve( this.directoryFilter, Filters.IDENTITY ) );

            const inclusionFilter = Filters.resolve( searchState.fileFilter, Filters.resolve( this.fileFilter, Filters.IDENTITY ) );

            if ( await isMatchingDirectoryObject( dirInfo, directoryFilter ) )
            {
                searchState.dirPath = dirPath;

                if ( await isMatchingFileObject( dirInfo, inclusionFilter ) )
                {
                    searchState.addResult( dirInfo );
                }

                const visitor = resolveVisitor( searchState.visitor,
                                                {
                                                    dir: dirInfo,
                                                    fileFilter: inclusionFilter,
                                                    directoryFilter: directoryFilter
                                                } );

                if ( await asyncAttempt( async() => await visitor.visit( dirInfo ) ) )
                {
                    return EXPLORER_ENTRY_ACTION.STOP;
                }

                return EXPLORER_ENTRY_ACTION.CONTINUE;
            }

            return EXPLORER_ENTRY_ACTION.SKIP;
        }

        async _processFileEntry( pFilePath, pEntry, pSearchState )
        {
            if ( isDirectoryEntry( pEntry ) && (pEntry.isFile() || pEntry.isSymbolicLink()) )
            {
                const filePath = resolvePath( pFilePath || pEntry );

                const searchState = await this.resolveSearchState( pSearchState );

                const stats = await asyncAttempt( async() => await stat( filePath ) );

                const entryInfo = await asyncAttempt( async() => await FileObject.fromAsync( filePath, stats, pEntry ) );

                const fileFilter = Filters.resolve( searchState.fileFilter, Filters.resolve( this.fileFilter, Filters.IDENTITY ) );

                if ( await isMatchingFileObject( entryInfo, fileFilter ) )
                {
                    searchState.filePath = filePath;

                    searchState.addResult( entryInfo );

                    const visitor = resolveVisitor( searchState.visitor,
                                                    {
                                                        entry: entryInfo,
                                                        fileFilter: fileFilter,
                                                        filePath: filePath
                                                    } );

                    if ( await asyncAttempt( async() => await visitor.visit( entryInfo ) ) )
                    {
                        return EXPLORER_ENTRY_ACTION.STOP;
                    }

                    return EXPLORER_ENTRY_ACTION.CONTINUE;
                }
            }
            return EXPLORER_ENTRY_ACTION.SKIP;
        }

        async resolveArguments( pDirectory, pSearchState )
        {
            const directory = resolveDirectoryPath( pDirectory );

            const searchState = await this.resolveSearchState( pSearchState );

            const visitor = resolveVisitor( searchState?.visitor || this.visitor, searchState?.args || {} );

            const fileFilter = Filters.resolve( searchState.fileFilter, this.#fileFilter );

            const directoryFilter = Filters.resolve( searchState.directoryFilter, this.#directoryFilter );

            const breadthFirst = isDefined( searchState.breadthFirst ) ? !!searchState.breadthFirst : this.#breadthFirst;

            return { directory, visitor, fileFilter, directoryFilter, breadthFirst };
        }

        async collect( pDirectory )
        {
            const searchState = new DirExplorerState( ++this.#collectionStateId,
                                                      {
                                                          visitor: resolveVisitor( this.visitor ),
                                                          fileFilter: Filters.resolve( this.fileFilter ),
                                                          directoryFilter: Filters.resolve( this.directoryFilter ),
                                                          breadthFirst: this.breadthFirst,
                                                          dirPath: resolveDirectoryPath( pDirectory )
                                                      } );

            await this.#collectionStates.enQueue( searchState );

            const args = await this.resolveArguments( pDirectory, searchState );

            const { directory } = args;

            searchState.enQueue( directory );

            while ( !searchState.isQueueEmpty() )
            {
                const dirPath = resolvePath( searchState.take() );

                if ( isBlank( dirPath ) || searchState.isExplored( dirPath ) )
                {
                    continue;
                }

                searchState.dirPath = dirPath;

                const action = await asyncAttempt( async() => await this._exploreDirectory( dirPath, searchState ) );

                searchState.setExplored( dirPath );

                if ( EXPLORER_ENTRY_ACTION.isStop( action ) )
                {
                    break;
                }
            }

            // searchState.display();

            const results = searchState.getResults();

            await this.#collectionStates.remove( searchState );

            return results;
        }

        async visit( pDirectory, pVisitor )
        {
            this.#visitor = resolveVisitor( pVisitor || this.visitor ) || resolveVisitor( this.visitor ) || new NullVisitor();
            return await this.collect( pDirectory );
        }

        async _exploreDirectory( pPath, pSearchState )
        {
            const dirPath = resolvePath( pPath );

            const searchState = await this.resolveSearchState( pSearchState );

            searchState.dirPath = dirPath;

            let action = await this._evaluateDirectory( dirPath, searchState );

            if ( !EXPLORER_ENTRY_ACTION.isContinue( action ) )
            {
                return action;
            }

            const entries = await asyncAttempt( async() => await readFolder( dirPath ) );

            let pathLib = PathUtils.instance();

            for await ( const entry of entries )
            {
                if ( !entry )
                {
                    continue;
                }

                const entryPath = resolvePath( pathLib.resolve( pathLib.join( dirPath, entry.name ) ) );

                if ( entry.isFile() || entry.isSymbolicLink() )
                {
                    searchState.filePath = entryPath;

                    action = await this._processFileEntry( entryPath, entry, searchState );

                    if ( EXPLORER_ENTRY_ACTION.isStop( action ) )
                    {
                        return action;
                    }
                }
                else if ( entry.isDirectory() && !searchState.isExplored( entryPath ) )
                {
                    searchState.dirPath = entryPath;

                    await this._processDirectory( entryPath, searchState );
                }
            }

            return EXPLORER_ENTRY_ACTION.CONTINUE;
        }

        async _processDirectory( pDirPath, pSearchState )
        {
            const dirPath = resolvePath( pDirPath );

            const searchState = await this.resolveSearchState( pSearchState );

            if ( searchState.breadthFirst && !searchState.isExplored( dirPath ) )
            {
                searchState.enQueue( dirPath );
            }
            else
            {
                await asyncAttempt( async() => await this._exploreDirectory( dirPath, searchState ) );
                searchState.setExplored( dirPath );
            }
        }

        async _findFirst( pDirectory, pSearchState, pRecursive )
        {
            const searchState = await this.resolveSearchState( pSearchState );

            const dirPath = resolveDirectoryPath( pDirectory );

            const filter = Filters.resolve( searchState.fileFilter, this.fileFilter );

            searchState.dirPath = dirPath;

            let fileInfo = null;

            const recursive = !!pRecursive;

            const entries = await asyncAttempt( async() => await readFolder( dirPath ) );

            let pathLib = PathUtils.instance();

            for await ( const entry of entries )
            {
                const entryPath = resolvePath( pathLib.resolve( pathLib.join( dirPath, entry.name ) ) );

                let info = await FileObject.fromAsync( entryPath, entry, entry );

                if ( await isMatchingFileObject( info, filter ) )
                {
                    fileInfo = info;

                    searchState.filePath = entryPath;
                    searchState.addResult( info );

                    break;
                }

                if ( entry.isDirectory() && recursive )
                {
                    if ( searchState.breadthFirst && !searchState.isExplored( entryPath ) )
                    {
                        searchState.enQueue( entryPath );
                    }
                    else
                    {
                        fileInfo = await this._findFirst( entryPath, searchState );
                    }
                }
            }

            return fileInfo;
        }

        async findFirst( pDirectory, pFilter, pRecursive = false, pBreadthFirst = false )
        {
            const searchState = new DirExplorerState( ++this.#collectionStateId,
                                                      {
                                                          visitor: resolveVisitor( this.visitor ),
                                                          fileFilter: Filters.resolve( pFilter, this.fileFilter || Filters.IDENTITY ),
                                                          directoryFilter: Filters.resolve( this.directoryFilter ),
                                                          breadthFirst: pBreadthFirst,
                                                          dirPath: resolveDirectoryPath( pDirectory )
                                                      } );

            await this.#collectionStates.enQueue( searchState );

            const recursive = !!pRecursive;

            const directory = resolveDirectoryPath( pDirectory );

            searchState.enQueue( directory );

            let fileInfo = null;

            while ( !searchState.isQueueEmpty() && isNull( fileInfo ) )
            {
                const dirPath = resolvePath( searchState.take() );

                if ( isBlank( dirPath ) || searchState.isExplored( dirPath ) )
                {
                    continue;
                }

                fileInfo = await this._findFirst( dirPath, searchState, recursive );

                searchState.setExplored( dirPath );
            }

            await this.#collectionStates.remove( searchState );

            return fileInfo;
        }
    }

    const findFiles = async function( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
    {
        const explorer = new DirectoryExplorer( pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst );
        return await explorer.collect( pDirectory );
    };

    FileObject.collect = findFiles;

    const supportedMimeTypes =
        [
            "application/json",
            "application/xml",
            "text/xml",
            "text/html",
            "text/plain",
            "text/csv",
            "application/zip",
            "image/png",
            "image/svg+xml"
        ];

    const supportedExtensions =
        [
            "json",
            "xml",
            "xml",
            "html",
            "text",
            "csv",
            "zip",
            "png",
            "svg"
        ];

    const calculateMimeType = async function( pBinaryData )
    {
        if ( isNonNullObject( pBinaryData ) || isArray( pBinaryData ) )
        {
            // return await asyncAttempt( async() => await mimetics( pBinaryData ) );
        }
    };

    let mod =
        {
            dependencies,
            classes:
                {
                    DirectoryEntry,
                    DirectoryExplorer,
                    FileStats,
                    FileObject,
                    PathUtils
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
            PathUtils,

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
            opendir,
            opendirSync,
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
            importNodeModules,

            calculateMimeType,

            supportedMimeTypes,
            supportedExtensions
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
