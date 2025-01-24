const os = require( "os" );
const fs = require( "node:fs" );
const fsAsync = require( "node:fs/promises" );
const path = require( "node:path" );
const stream = require( "node:stream" );

const { Transform } = stream;

const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

const konsole = console;

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

(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__FILE_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

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
            fs,
            fsAsync,
            path
        };

    /*
     * Create local variables for the imported values and functions we use.
     */
    const {
        _str,
        _mt_str,
        _dot,
        _pathSep,
        _prevDir,
        S_ERROR,
        ignore,
        populateOptions,
        classes
    } = constants;

    const { ModuleEvent, ModulePrototype } = classes;

    const {
        isNull,
        isObject,
        isArray,
        isTypedArray,
        isDate,
        isNonNullObject,
        isFunction,
        isNumeric,
        firstMatchingType,
        resolveMoment,
        isValidDateOrNumeric
    } = typeUtils;

    const { asString, asInt, toUnixPath, toBool, isBlank } = stringUtils;

    const { varargs, asArray, Filters } = arrayUtils;

    const { accessSync, statSync, mkdirSync, createWriteStream, writeFileSync, constants: fs_constants, } = fs;

    const { access, readdir, opendir, stat, lstat, rm, rename } = fsAsync;


    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const modName = "FileUtils";

    let modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const MILLIS_PER_SECOND = 1000;
    const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
    const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
    const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;

    const errPrefix = "An error occurred while ";

    const errMsg = errPrefix + "{0} {1} {2}";

    const statErrorMessage = errPrefix + "calculating {0} of the file";

    const interpolateErrorMessage = function( pMessage, ...pArgs )
    {
        let args = asArray( varargs( ...pArgs ) );
        let msg = asString( pMessage, true ) || statErrorMessage;
        msg = msg.replaceAll( /\{(\d+)}/g, ( match, index ) => args[index] );
        return msg.replaceAll( /\{(\d+)}/g, _mt_str );
    };

    /**
     * Represents a subset of the attributes of a file or directory obtained from calls to stat, lstat, or fstat.<br>
     * <br>
     *
     */
    class FileAttributes
    {
        #stats;

        #size;

        #_isFile;
        #_isDirectory;
        #_isSymbolicLink;

        #created;
        #modified;
        #accessed;

        /**
         * Constructs an instance of the FileAttributes class
         * from an object whose structure matches that of the Node.js fs.Stats class
         *
         * @param {fs.Stats|{size:number,birthtime:Date,mtime:Date,atime:Date}} pObject
         */
        constructor( pObject )
        {
            const object = isObject( pObject ) ? pObject : {};

            this.#stats = { ...object };

            this.#size = asInt( object?.size, 0 );

            this.#created = isDate( object?.birthtime ) ? new Date( object?.birthtime ) : null;
            this.#modified = isDate( object?.mtime ) ? new Date( object?.mtime ) : null;
            this.#accessed = isDate( object?.atime ) ? new Date( object?.atime ) : null;

            this.#_isFile = isFunction( object?.isFile ) ? object?.isFile() : false;
            this.#_isDirectory = isFunction( object?.isDirectory ) ? object?.isDirectory() : false;
            this.#_isSymbolicLink = isFunction( object?.isSymbolicLink ) ? object?.isSymbolicLink() : false;
        }

        get size()
        {
            return asInt( this.#size );
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
            return this.#created;
        }

        get modified()
        {
            return this.#modified;
        }

        get accessed()
        {
            return this.#accessed;
        }

        get stats()
        {
            return this.#stats;
        }
    }

    FileAttributes.forPath = async function( pFilePath )
    {
        const stats = await stat( path.normalize( pFilePath ) );
        return new FileAttributes( stats );
    };

    /**
     * Converts the input buffer or array-like object into an array.
     *
     * @param {Buffer|Array|TypedArray|any} pBuffer - The input data which can be a buffer, array, typed array, or any other object.
     * @return {Array|any} An array representation of the input, or the input itself if it does not match the expected types.
     */
    function arrayFromBuffer( pBuffer )
    {
        return asArray( pBuffer instanceof Buffer ? new Uint8Array( pBuffer ) : isArray( pBuffer ) || isTypedArray( pBuffer ) ? new Uint8Array( pBuffer ) : pBuffer );
    }

    /**
     * Creates a typed array from a given buffer or array-like object.
     *
     * @param {Buffer|Array|TypedArray} pBuffer - The input buffer, array, or typed array to transform into a typed array.
     * @param {Function|*} [pArrayClass=Uint8Array] - The constructor for the target typed array class. Defaults to Uint8Array if not provided.
     * @return {TypedArray} A new typed array instance created from the input buffer or array-like object.
     */
    function typedArrayFromBuffer( pBuffer, pArrayClass = Uint8Array )
    {
        const ArrayClass = pArrayClass || Uint8Array;
        return (pBuffer instanceof Buffer ? new ArrayClass( pBuffer ) : isArray( pBuffer ) || isTypedArray( pBuffer ) ? new ArrayClass( pBuffer ) : new ArrayClass( asArray( pBuffer ) ));
    }

    function extractPathSeparator( pPath )
    {
        let path = asString( pPath ).trim();

        let matches = /([\/\\]+)/.exec( path );

        return (matches && matches?.length > 1 ? matches[1] : _pathSep);
    }

    const upDirs = function( pNumDirs )
    {
        let numDirs = Math.floor( pNumDirs || 0 );

        numDirs = isNaN( numDirs ) || !isFinite( numDirs ) || numDirs < 0 ? 0 : numDirs;

        let path = _mt_str;

        for( let i = numDirs; i--; )
        {
            path += _prevDir + _pathSep;
        }

        return path || _mt_str;
    };

    const exists = function( pPath )
    {
        let exists;
        try
        {
            accessSync( pPath, fs.constants.F_OK );
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
            await access( pPath, fs.constants.F_OK );
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
        let dirPath = path.resolve( toUnixPath( asString( pDirectoryPath, true ) ) );

        let success = false;

        if ( !exists( dirPath ) )
        {
            try
            {
                mkdirSync( dirPath, { recursive: true } );

                success = exists( dirPath );
            }
            catch( ex )
            {
                konsole.warn( dirPath, "does not exist and could not be created", ex );
            }
        }

        return success;
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
        let dirPath = toUnixPath( asString( pDirectoryPath, true ) );

        let success = false;

        if ( !await asyncExists( dirPath ) )
        {
            try
            {
                await fsAsync.mkdir( dirPath, { recursive: true } );

                success = await asyncExists( dirPath );
            }
            catch( ex )
            {
                konsole.warn( dirPath, "does not exist and could not be created", ex );
            }
        }
        return success;
    };

    /**
     * Asynchronously checks if the given path is a file.
     *
     * @param {string} pPath - The path to check, provided as a string.
     * @return {Promise<boolean>} A promise that resolves to `true` if the path is a file, `false` otherwise.
     */
    async function isFile( pPath )
    {
        const fileAttributes = await FileAttributes.forPath( pPath );
        return fileAttributes?.isFile() || false;
    }

    /**
     * Checks whether the specified path refers to a directory.
     *
     * @param {string} pPath - The path to check, normalized and resolved to an absolute path.
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isDirectory( pPath )
    {
        const fileAttributes = await FileAttributes.forPath( pPath );
        return fileAttributes?.isDirectory() || false;
    }

    /**
     * Checks whether the specified path refers to a directory.
     *
     * @param {string} pPath - The path to check, normalized and resolved to an absolute path.
     * @return {Promise<boolean>} A promise that resolves to true if the path is a directory, otherwise false.
     */
    async function isSymbolicLink( pPath )
    {
        const fileAttributes = await FileAttributes.forPath( pPath );
        return fileAttributes?.isSymbolicLink() || false;
    }

    function resolvePath( pPath )
    {
        return isArray( pPath ) ? path.resolve( asArray( pPath ) ) : path.resolve( asString( pPath, true ) );
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

        const ext = path.extname( filepath );
        const rxExt = new RegExp( (ext + "$") );

        filepath = filepath.replace( rxExt, _mt_str );
        filepath = filepath.replace( /[\/\\]+$/, _mt_str );
        filepath = filepath.replace( rxExt, _mt_str );

        if ( !!pExhaustive )
        {
            const name = asString( path.basename( filepath ) );

            while ( !isBlank( name ) && !name.startsWith( _dot ) && /(\.\w)$/.test( name ) )
            {
                filepath = removeExtension( filepath, pExhaustive );
            }
        }

        return filepath.trim();
    }

    /**
     * Replaces the extension of a given file path with a new extension.
     *
     * @param {string} pPath - The file path whose extension needs to be replaced.
     * @param {string} pNewExtension - The new extension to be applied to the file path.
     * @return {string} The updated file path with the new extension.
     */
    function replaceExtension( pPath, pNewExtension )
    {
        let filepath = resolvePath( pPath );

        const newExt = asString( pNewExtension, true ).replace( /^\.+/, _mt_str );

        const newFilename = removeExtension( filepath );

        return (newFilename + (_dot + newExt)).trim();
    }

    function getTempDirectory()
    {
        return os.tmpdir();
    }

    function generateTempFileName( pPrefix = "temp", pExtension = ".tmp" )
    {
        // Generate a unique filename
        const prefix = asString( pPrefix, true ) || "temp";

        const extension = asString( pExtension, true ) || ".tmp";

        const timestamp = asInt( Date.now() );

        return `${prefix}_${timestamp}_${Math.random().toString( 36 ).substring( 2, 15 )}${extension}`;
    }

    function createTempFile()
    {
        const tempDir = getTempDirectory();

        const randomFileName = generateTempFileName();

        const filePath = path.join( tempDir, randomFileName );

        // Create an empty file
        fs.writeFileSync( filePath, _mt_str, { flag: "w" } );

        return filePath;
    }

    async function createTempFileAsync()
    {
        const tempDir = getTempDirectory();
        const randomFileName = generateTempFileName();
        const filePath = path.join( tempDir, randomFileName );
        await fsAsync.writeFile( filePath, _mt_str, { flag: "w" } );
        return filePath;
    }

    /**
     * @typedef {string} DirectorySearchReturnType
     */

    const DIR_SEARCH_RETURN_TYPES =
        {
            "PATH": "Path",
            "FILEINFO": "FileInfo",
            "ENTRY": "DirEntry",
            "CONTENTS": "FileContents",
        };

    /**
     * @typedef {Object} DirectorySearchOptions
     *
     * @property {function(fs.Dirent):boolean} [entry_filter= Filters.IDENTITY] A filter to determine what directories to explore
     * @property {function(FileInfo):boolean}  [file_filter=null] A filter to determine what files to include in results
     * @property {boolean} [breadthFirst=false] Whether to perform a breadth first search or (by default) depth first search
     * @property {DirectorySearchReturnType} [returnType=DIR_SEARCH_RETURN_TYPES.FILEINFO] What kind of data should be in the results array
     * @property {boolean} [stopOnFirstMatch=false] Whether to return as soon as one or more results are available without exploring other directories
     *
     */

    /**
     *
     * @type {DirectorySearchOptions}
     */
    const DIR_SEARCH_OPTIONS =
        {
            entry_filter: Filters.IDENTITY,
            file_filter: null,
            breadthFirst: false,
            returnType: DIR_SEARCH_RETURN_TYPES.FILEINFO,
            stopOnFirstMatch: false,
        };

    /**
     * Resolves and constructs search options from the provided parameters.
     *
     * @param {DirectorySearchOptions} pOptions - An object containing search configuration options.
     * @param {string} pStartDirectory - The starting directory path for the search operation.
     * @return {Object} Returns an object containing the resolved search options:
     *                  startDirectory, entryFilter, fileFilter, breadthFirst, returnType,
     *                  queue, entries, and a condition function to determine the search flow.
     */
    function resolveSearchOptions( pOptions, pStartDirectory )
    {
        const options = populateOptions( pOptions, DIR_SEARCH_OPTIONS );

        const entryFilter = Filters.IS_FILTER( options.entry_filter ) ? options.entry_filter : Filters.IDENTITY;

        const fileFilter = Filters.IS_FILTER( options.file_filter ) ? options.file_filter : null;

        const startDirectory = path.resolve( pStartDirectory );

        const breadthFirst = options.breadthFirst;

        const returnType = options.returnType;

        const queue = [startDirectory]; // Queue for BFS

        let entries = [];

        let firstIteration = true;

        const condition = breadthFirst ? () => queue.length > 0 : () => entries.length > 0 || firstIteration;

        return { startDirectory, entryFilter, fileFilter, breadthFirst, returnType, queue, entries, condition };
    }

    /**
     * Find a file (or files) or a subdirectory meeting specified criteria,
     * using either breadth-first or depth-first search
     *
     * @param {string} pStartDirectory
     * @param pOptions
     * @return {Array<string|FileInfo|fs.Dirent>} An array of paths, FileInfo objects, or directory entries depending on the options passed
     */
    async function find( pStartDirectory, pOptions = DIR_SEARCH_OPTIONS )
    {
        const options = populateOptions( pOptions, DIR_SEARCH_OPTIONS );

        let {
            startDirectory = path.resolve( pStartDirectory ),
            entryFilter,
            fileFilter,
            breadthFirst,
            returnType,
            entries,
            queue,
            condition
        } = resolveSearchOptions( options, pStartDirectory );

        let results = [];

        const matchingCriteria = async function( pEntry )
        {
            let matching = [];

            if ( !isNull( pEntry ) && entryFilter( pEntry ) )
            {
                const fullPath = path.join( (pEntry.parentPath || pEntry.path), pEntry.name );

                let files = [pEntry];

                let directoryEntries = new Map();
                directoryEntries.set( fullPath, pEntry );

                if ( pEntry.isDirectory() )
                {
                    const items = await fsAsync.readdir( fullPath, { withFileTypes: true } );
                    if ( items && items.length > 0 )
                    {
                        files.push( ...items );

                        items.forEach( item => directoryEntries.set( path.join( (item.parentPath || item.path), item.name ), item ) );
                    }
                }

                let fileInfos = files.map( file => new FileInfo( path.join( (file.parentPath || file.path), file.name ) ) );

                for( const fileInfo of fileInfos )
                {
                    const stats = await fileInfo.getStats();
                    fileInfo.updateAttributes( stats );
                }

                if ( Filters.IS_FILTER( fileFilter ) )
                {
                    fileInfos = fileInfos.filter( fileFilter );
                }

                matching.push( ...fileInfos );

                if ( returnType === DIR_SEARCH_RETURN_TYPES.ENTRY )
                {
                    matching = matching.map( fileInfo => directoryEntries.get( fileInfo.filepath ) );
                }
                else if ( returnType === DIR_SEARCH_RETURN_TYPES.PATH )
                {
                    matching = matching.map( fileInfo => fileInfo.filepath );
                }
                else if ( returnType === DIR_SEARCH_RETURN_TYPES.CONTENTS )
                {
                    matching = matching.map( fileInfo => fileInfo.isFile() || fileInfo.isSymbolicLink() ? fs.readFileSync( fileInfo.filepath, { encoding: "utf8" } ) : fs.readdirSync( fileInfo.filepath ) );
                }
            }

            return matching;
        };

        while ( condition() )
        {
            const currentDir = queue.shift();

            try
            {
                entries = await fsAsync.readdir( currentDir, { withFileTypes: true } );

                for( const entry of entries )
                {
                    const fullPath = path.join( currentDir, entry.name );

                    const matching = asArray( await matchingCriteria( entry ) );

                    if ( matching?.length > 0 )
                    {
                        results.push( ...matching );

                        if ( options.stopOnFirstMatch )
                        {
                            return results;
                        }
                    }

                    if ( breadthFirst && entry.isDirectory() )
                    {
                        queue.push( fullPath ); // Add subdirectory to queue
                    }
                    else
                    {
                        results.push( await find( fullPath, pOptions ) );

                        if ( results.length > 0 && options.stopOnFirstMatch )
                        {
                            return results;
                        }
                    }
                }
            }
            catch( err )
            {
                console.error( `Error reading directory ${currentDir}:`, err );
            }
        }

        return results;
    }

    /**
     * Breadth-first algorithm, returning every file that meets the filter or
     * directory containing files that meet the filter
     *
     * @param pStartDirectory
     * @param pFileFilter
     * @return
     */
    function collectFiles( pStartDirectory, pFileFilter )
    {

    }

    /**
     * Returns true if the specified directory name is a path component of the specified directory.
     *
     * @param pDirectory
     * @param pDirectoryName
     * @param pIgnoreCase
     * @return
     */
    function containsSubdirectory( pDirectory,
                                   pDirectoryName,
                                   pIgnoreCase )
    {

    }

    /**
     * Returns true if the specified directory contains one or more files accepted by the specified FilenameFilter
     * Used to find library and class paths for specific library files
     *
     * @param pDirectory  - the directory to search
     * @param pFileFilter - the filter criteria one or more files must match for this method to return true
     * @return - true if the specified directory contains files matching the criteria expressed by the filter
     */
    function containsMatchingFiles( pDirectory, pFileFilter )
    {

    }

    class FileInfo
    {
        #filepath;
        #attributes;

        #_isFile;
        #_isDirectory;
        #_isSymbolicLink;

        #created;
        #modified;
        #accessed;

        #size;

        constructor( pFilePath, pFileAttributes = {} )
        {
            this.#filepath = path.resolve( asString( pFilePath, true ) );

            this.#attributes = isObject( pFileAttributes ) ? pFileAttributes : {};

            this.updateAttributes( this.#attributes );
        }

        updateAttributes( pAttributes )
        {
            const attributes = pAttributes || this.#attributes;

            const createdDate = attributes?.created;
            const modifiedDate = attributes?.modified;
            const accessedDate = attributes?.accessed;

            this.#created = isValidDateOrNumeric( createdDate ) ? new Date( asInt( createdDate ) ) : null;
            this.#modified = isValidDateOrNumeric( modifiedDate ) ? new Date( asInt( modifiedDate ) ) : null;
            this.#accessed = isValidDateOrNumeric( accessedDate ) ? new Date( asInt( accessedDate ) ) : null;

            this.#size = asInt( attributes?.size, this.#size );

            this.#_isFile = isFunction( attributes?.isFile ) ? attributes?.isFile() : false;
            this.#_isDirectory = isFunction( attributes?.isDirectory ) ? attributes?.isDirectory() : false;
            this.#_isSymbolicLink = isFunction( attributes?.isSymbolicLink ) ? attributes?.isSymbolicLink() : false;

            this.#attributes = new FileAttributes( attributes );
        }

        get filepath()
        {
            return this.#filepath;
        }

        get filename()
        {
            return path.basename( this.filepath );
        }

        get directory()
        {
            return path.dirname( this.filepath );
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
            const stats = await stat( this.filepath );

            if ( !isNull( stats ) )
            {
                this.updateAttributes( stats );
            }

            return stats;
        }

        async getLStats()
        {
            const stats = await lstat( this.filepath );

            if ( !isNull( stats ) )
            {
                this.updateAttributes( stats );
            }

            return stats;
        }

        async getSize()
        {
            if ( isNull( this.#size ) || !isNumeric( this.#size ) || this.#size <= 0 )
            {
                try
                {
                    const stats = await this.getStats();
                    this.#size = stats.size;
                }
                catch( ex )
                {
                    konsole.error( "An error occurred while calculating the size of the log file", this.filepath, ex.message, ex );
                }
            }

            return this.#size;
        }

        get size()
        {
            return asInt( this.#size ) > 0 ? this.#size : statSync( this.filepath ).size;
        }

        async getCreatedDate()
        {
            if ( isNull( this.#created ) || !isDate( this.#created ) )
            {
                try
                {
                    const stats = await this.isSymbolicLink() ? await this.getLStats() : await this.getStats();
                    this.#created = stats.birthtime;
                }
                catch( ex )
                {
                    konsole.error( "An error occurred while calculating the creation date of the log file", this.filepath, ex.message, ex );
                }
            }
            return this.#created;
        }

        get created()
        {
            return isDate( this.#created ) ? this.#created : statSync( this.filepath ).birthtime;
        }

        async getModifiedDate()
        {
            if ( isNull( this.#modified ) || !isDate( this.#modified ) )
            {
                try
                {
                    const stats = await this.isSymbolicLink() ? await this.getLStats() : await this.getStats();
                    this.#modified = stats.mtime;
                }
                catch( ex )
                {
                    konsole.error( "An error occurred while calculating the modification date of the log file", this.filepath, ex.message, ex );
                }
            }
        }

        async getAccessedDate()
        {
            if ( isNull( this.#accessed ) || !isDate( this.#accessed ) )
            {
                try
                {
                    const stats = await this.isSymbolicLink() ? await this.getLStats() : await this.getStats();
                    this.#accessed = stats.atime;
                }
                catch( ex )
                {
                    konsole.error( "An error occurred while calculating the access date of the log file", this.filepath, ex.message, ex );
                }
            }
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
            const age = Math.min( Math.max( 0, await this.calculateAge( now ) ), 1_000 );
            return age > asInt( pMaxAgeDays, age );
        }

        async compareTo( pOther )
        {
            const now = new Date();

            const other = pOther instanceof this.constructor ? pOther : new FileInfo( pOther );

            const thisCreated = await this.getCreatedDate();

            const createdDate = firstMatchingType( Date, thisCreated, now );

            const otherCreated = await other.getCreatedDate();

            const otherCreatedDate = firstMatchingType( Date, otherCreated, now );

            const thisTime = isDate( createdDate ) ? createdDate.getTime() : isNumeric( createdDate ) ? asInt( createdDate ) : 0;

            const otherTime = isDate( otherCreatedDate ) ? otherCreatedDate.getTime() : isNumeric( otherCreatedDate ) ? asInt( otherCreatedDate ) : 0;

            let comp = thisTime - otherTime;

            if ( comp === 0 )
            {
                comp = this.filepath.localeCompare( other.filepath );
            }

            return comp;
        }

        async isFile()
        {
            if ( isNull( this._isFile ) )
            {
                const stats = await this.getStats();

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
                const stats = await this.getStats();

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
                const stats = await this.getStats();

                this._isFile = stats.isFile();
                this._isSymbolicLink = stats.isSymbolicLink();
                this._isDirectory = stats.isDirectory();
            }

            return this._isDirectory;
        }
    }

    FileInfo.compare = async function( pA, pB )
    {
        const a = pA instanceof FileInfo ? pA : new FileInfo( pA );
        const b = pB instanceof FileInfo ? pB : new FileInfo( pB );
        return await a.compareTo( b );
    };

    FileInfo.sort = async function( ...pFiles )
    {
        const files = asArray( varargs( ...pFiles ) ).map( pFile => pFile instanceof FileInfo ? pFile : new FileInfo( pFile ) );

        async function convert( pFile )
        {
            const fileInfo = pFile instanceof FileInfo ? pFile : new FileInfo( pFile );

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

    FileInfo.sortDescending = async function( ...pFiles )
    {
        let files = await FileInfo.sort( ...pFiles );
        return files.reverse();
    };

    FileInfo.from = function( pFilePath, pCreatedDate = null, pSize = 0 )
    {
        if ( pFilePath instanceof FileInfo )
        {
            return pFilePath;
        }
        return new FileInfo( pFilePath, pCreatedDate, pSize );
    };

    FileInfo.fromAsync = async function( pFilePath )
    {
        if ( pFilePath instanceof FileInfo )
        {
            return pFilePath;
        }
        const stats = await stat( pFilePath );
        return new FileInfo( pFilePath, stats.birthtime, stats.size );
    };

    FileInfo.asFileInfo = function( pFile )
    {
        return pFile instanceof FileInfo ? pFile : (!isNull( pFile ) ? new FileInfo( pFile ) : null);
    };

    FileInfo.COMPARATOR = function( pA, pB )
    {
        const a = FileInfo.asFileInfo( pA );
        const b = FileInfo.asFileInfo( pB );
        return a.compareTo( b );
    };

    FileInfo.collect = async function( pDirectory, pFilter, pRecursionLevel = 0 )
    {
        let files = [];

        const directory = path.resolve( toUnixPath( pDirectory ) );

        const filter = Filters.IS_FILTER( pFilter ) ? pFilter : isNonNullObject( pFilter ) && isFunction( pFilter.test ) ? pFilter?.test || pFilter : Filters.IDENTITY;

        const recursionLevel = asInt( pRecursionLevel, 0 );

        let dir = null;

        try
        {
            dir = await opendir( directory );

            for await ( const dirent of dir )
            {
                if ( dirent.isFile() )
                {
                    const filepath = path.resolve( directory, dirent.name );

                    const stats = await stat( filepath );

                    const fileInfo = new FileInfo( filepath,
                                                   new FileAttributes( stats.size,
                                                                       stats.birthtime,
                                                                       stats.mtime,
                                                                       stats.atime,
                                                                       true,
                                                                       false ),
                                                   stats.size,
                                                   stats.birthtime,
                                                   stats.mtime,
                                                   stats.atime,
                                                   stats.isFile(),
                                                   stats.isSymbolicLink() );

                    if ( filter( fileInfo ) )
                    {
                        files.push( fileInfo );
                    }
                }
                else if ( dirent.isDirectory() && recursionLevel > 0 )
                {
                    const filepath = path.resolve( directory, dirent.name );

                    const items = await FileInfo.collect( filepath, filter, Math.max( recursionLevel - 1, 0 ) );

                    files.push( items );
                }
            }
        }
        catch( ex )
        {
            konsole.error( interpolateErrorMessage( errMsg, "collecting files from", "the directory", directory ), directory, ex.message, ex );
        }

        if ( recursionLevel <= 0 )
        {
            files = files.length > 0 ? await FileInfo.sort( ...files ) : [];
        }

        return files;
    };


    let mod =
        {
            dependencies
        };


    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
