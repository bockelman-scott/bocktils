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
        S_ERROR,
        no_op,
        ignore,
        lock,
        populateOptions,
        immutableCopy,
        resolveVisitor,
        classes
    } = constants;

    const { ModuleEvent, ModulePrototype, Visitor } = classes;

    const {
        isDefined,
        isNull,
        isString,
        isObject,
        isArray,
        isTypedArray,
        isDate,
        isNonNullObject,
        isFunction,
        isNumeric,
        firstMatchingType,
        resolveMoment,
        isValidDateOrNumeric,
        VisitedSet
    } = typeUtils;

    const { asString, asInt, toUnixPath, toBool, isBlank } = stringUtils;

    const { varargs, asArray, Filters } = arrayUtils;

    const {
        accessSync,
        statSync,
        mkdirSync,
        rmdirSync,
        readdirSync,
        symlinkSync,
        createWriteStream,
        writeFileSync,
        constants: fs_constants,
    } = fs;

    const {
        access,
        readdir,
        opendir,
        stat,
        lstat,
        rm,
        rmdir,
        rename,
        symlink
    } = fsAsync;


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

    function resolvePath( pPath )
    {
        if ( isArray( pPath ) )
        {
            return path.resolve( ...(asArray( pPath ).flat()) );
        }
        else if ( isObject( pPath ) )
        {
            return path.resolve( path.join( pPath?.parentPath || pPath?.path || "./", pPath.name || _mt_str ) );
        }
        else
        {
            return path.resolve( asString( pPath, true ) );
        }
    }

    function extractPathSeparator( pPath )
    {
        let path = asString( pPath ).trim();

        let matches = /([\/\\]+)/.exec( path );

        return (matches && matches?.length > 1 ? matches[1] : _pathSep);
    }

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
                modulePrototype.handleError( ex, makeDirectory, dirPath );
            }
        }

        return success;
    };

    const removeDirectory = function( pDirectoryPath )
    {
        let dirPath = path.resolve( toUnixPath( asString( pDirectoryPath, true ) ) );
        try
        {
            rmdirSync( dirPath, { recursive: true } );
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, removeDirectory, dirPath );
        }
    };

    const asyncRemoveDirectory = async function( pDirectoryPath )
    {
        let dirPath = path.resolve( toUnixPath( asString( pDirectoryPath, true ) ) );
        try
        {
            await rmdir( dirPath, { recursive: true } );
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, asyncRemoveDirectory, dirPath );
        }
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
                modulePrototype.handleError( ex, asyncMakeDirectory, dirPath );
            }
        }
        return success;
    };

    const link = function( pSourcePath, pTargetPath )
    {
        const sourcePath = resolvePath( pSourcePath );
        const targetPath = resolvePath( pTargetPath );
        try
        {
            symlinkSync( sourcePath, targetPath );
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, link, pSourcePath, pTargetPath );
        }
    };

    const asyncLink = async function( pSourcePath, pTargetPath )
    {
        const sourcePath = resolvePath( pSourcePath );
        const targetPath = resolvePath( pTargetPath );
        try
        {
            await fsAsync.symlink( sourcePath, targetPath );
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, asyncLink, pSourcePath, pTargetPath );
        }
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

            this.#created = isDate( object?.birthtime ) ? new Date( object?.birthtime ) : object?.created;
            this.#modified = isDate( object?.mtime ) ? new Date( object?.mtime ) : object?.modified;
            this.#accessed = isDate( object?.atime ) ? new Date( object?.atime ) : object?.accessed;

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
            return isValidDateOrNumeric( this.#created ) ? new Date( this.#created ) : null;
        }

        get modified()
        {
            return isValidDateOrNumeric( this.#modified ) ? new Date( this.#modified ) : null;
        }

        get accessed()
        {
            return isValidDateOrNumeric( this.#accessed ) ? new Date( this.#accessed ) : null;
        }

        get stats()
        {
            return this.#stats;
        }
    }

    FileAttributes.forPath = async function( pFilePath )
    {
        const filePath = resolvePath( pFilePath );

        if ( isBlank( filePath ) )
        {
            modulePrototype.handleError( new IllegalArgumentError( "Path is required", {} ), FileAttributes.forPath, pFilePath, filePath );
            return NO_ATTRIBUTES;
        }

        try
        {
            const stats = await stat( path.normalize( filePath ) );
            return new FileAttributes( stats );
        }
        catch( ex )
        {
            modulePrototype.handleError( ex, FileAttributes.forPath, pFilePath );
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

    function getFileEntry( pFilePath )
    {
        const dirPath = path.dirname( pFilePath );
        const entries = readdirSync( dirPath, { withFileTypes: true } );
        const fileName = path.basename( pFilePath );

        return entries.find( entry => entry.name === fileName );
    }

    async function asyncGetFileEntry( pFilePath )
    {
        const dirPath = path.dirname( pFilePath );
        const entries = await readdir( dirPath, { withFileTypes: true } );
        const fileName = path.basename( pFilePath );

        return entries.find( entry => entry.name === fileName );
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

    const resolveTempFileArguments = function()
    {
        const tempDir = getTempDirectory();

        const randomFileName = generateTempFileName();

        const filePath = path.join( tempDir, randomFileName );

        return {
            tempDir,
            randomFileName,
            filePath,
        };
    };

    function createTempFile()
    {
        const { tempDir, randomFileName, filePath } = resolveTempFileArguments();

        fs.writeFileSync( filePath, _mt_str, { flag: "w" } );

        return getFileEntry( filePath );
    }

    async function asyncCreateTempFile()
    {
        const { tempDir, randomFileName, filePath } = resolveTempFileArguments();

        await fsAsync.writeFile( filePath, _mt_str, { flag: "w" } );

        return await asyncGetFileEntry( filePath );
    }

    function createFile( pFilePath, pContent = _mt_str, pOverwrite = false )
    {
        const filePath = resolvePath( pFilePath );
        const content = asString( pContent, true );

        if ( pOverwrite || !exists( filePath ) )
        {
            fs.writeFileSync( filePath, content, { flag: "w" } );

            return getFileEntry( filePath );
        }

        const error = new Error( `File ${filePath} already exists` );

        modulePrototype.handleError( error, createFile, pFilePath, pContent, pOverwrite );

        return error;
    }

    async function asyncCreateFile( pFilePath, pContent, pOverwrite = false )
    {
        const filePath = resolvePath( pFilePath );

        const content = asString( pContent, true );

        if ( pOverwrite || !exists( filePath ) )
        {
            await fsAsync.writeFile( filePath, content, { flag: "w" } );

            return await asyncGetFileEntry( filePath );
        }

        const error = new Error( `File ${filePath} already exists` );

        modulePrototype.handleError( error, asyncCreateFile, pFilePath, pContent, pOverwrite );

        return error;
    }

    const deleteFile = function( pFilePath, pFollowLinks = false )
    {
        const filePath = resolvePath( pFilePath );
        if ( exists( filePath ) )
        {
            if ( pFollowLinks && isSymbolicLink( filePath ) )
            {
                // TODO;
            }
            fs.unlinkSync( filePath );
        }
    };

    const deleteMatchingFiles = function( pDirectoryPath, pFileNameFilter, pFollowLinks = false )
    {
        const dirPath = resolvePath( pDirectoryPath );

        const filter = Filters.IS_FILTER( pFileNameFilter ) ? pFileNameFilter : Filters.NONE;

        if ( exists( dirPath ) && isDirectory( dirPath ) )
        {
            const files = readdirSync( dirPath, { withFileTypes: true } );

            for( const file of files )
            {
                if ( (file.isFile() || file.isSymbolicLink()) && filter( file.name ) )
                {
                    if ( isSymbolicLink( path.join( dirPath, file.name ) ) && pFollowLinks )
                    {
                        const linkTarget = fs.readlinkSync( path.join( dirPath, file.name ) );
                        if ( exists( linkTarget ) )
                        {
                            deleteMatchingFiles( linkTarget, filter, pFollowLinks );
                        }
                    }
                    fs.unlinkSync( path.join( dirPath, file.name ) );
                }
            }
        }
    };

    const asyncDeleteFile = async function( pFilePath, pFollowLinks = false )
    {
        const filePath = resolvePath( pFilePath );
        if ( await asyncExists( filePath ) )
        {
            if ( pFollowLinks && await isSymbolicLink( filePath ) )
            {
                // TODO;
            }
            await fsAsync.unlink( filePath );
        }
    };

    const asyncDeleteMatchingFiles = async function( pDirectoryPath, pFileNameFilter, pFollowLinks = false )
    {
        const dirPath = resolvePath( pDirectoryPath );

        const filter = Filters.IS_FILTER( pFileNameFilter ) ? pFileNameFilter : Filters.NONE;

        if ( await asyncExists( dirPath ) && await isDirectory( dirPath ) )
        {
            const files = await readdir( dirPath, { withFileTypes: true } );

            for( const file of files )
            {
                if ( (file.isFile() || file.isSymbolicLink()) && filter( file.name ) )
                {
                    if ( await isSymbolicLink( path.join( dirPath, file.name ) ) && pFollowLinks )
                    {
                        const linkTarget = await fsAsync.readlink( path.join( dirPath, file.name ) );
                        if ( await asyncExists( linkTarget ) )
                        {
                            await asyncDeleteMatchingFiles( linkTarget, filter, pFollowLinks );
                        }
                    }
                    await fsAsync.unlink( path.join( dirPath, file.name ) );
                }
            }
        }
    };


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
            this.#filepath = isString( pFilePath ) ? path.resolve( asString( pFilePath, true ) ) : path.join( (pFilePath?.parentPath || pFilePath?.path) || _mt_str, pFilePath?.name || _mt_str );

            this.#attributes = isObject( pFileAttributes ) ? new FileAttributes( pFileAttributes ) : {};

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

            return this;
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

    FileInfo.from = function( pFilePath )
    {
        if ( pFilePath instanceof FileInfo )
        {
            return pFilePath;
        }
        const stats = statSync( pFilePath );
        return new FileInfo( pFilePath, stats );
    };

    FileInfo.fromAsync = async function( pFilePath )
    {
        if ( pFilePath instanceof FileInfo )
        {
            return pFilePath;
        }
        const stats = await stat( pFilePath );
        return new FileInfo( pFilePath, stats );
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

    FileInfo.collect = async function( pDirectory )
    {

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
            const dirInfo = await FileInfo.fromAsync( pDirectory );

            if ( pDirectoryFilter( dirInfo ) || pDirectoryFilter( pDirectory ) )
            {
                if ( pIncludeFilter( dirInfo ) || pIncludeFilter( pDirectory ) )
                {
                    pResults.push( dirInfo );

                    if ( pVisitor.visit( dirInfo ) )
                    {
                        return EXPLORER_ENTRY_ACTION.STOP;
                    }
                }

                return EXPLORER_ENTRY_ACTION.CONTINUE;
            }

            return EXPLORER_ENTRY_ACTION.SKIP;
        }

        async _processFileEntry( pFilePath, pEntry, pFilter, pVisitor, pResults )
        {
            if ( !isNull( pEntry ) && (pEntry.isFile() || pEntry.isSymbolicLink()) )
            {
                const entryInfo = await FileInfo.fromAsync( pFilePath );

                if ( pFilter( entryInfo ) || pFilter( pFilePath ) )
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
            const dirPath = resolvePath( pDirectory );
            const visitor = resolveVisitor( pVisitor );
            const filter = Filters.IS_FILTER( pFilter ) ? pFilter : this.#directoryFilter;
            const results = pResults || [];

            const entries = await fsAsync.readdir( dirPath, { withFileTypes: true } );

            for( const entry of entries )
            {
                const entryPath = path.resolve( path.join( pDirectory, entry.name ) );

                let action = await this._processFileEntry( entryPath, entry, filter, visitor, results );

                if ( EXPLORER_ENTRY_ACTION.STOP === action )
                {
                    return results;
                }
            }

            return results;
        }

        resolveArguments( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
        {
            const startDirectory = resolvePath( pDirectory );
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

                const entries = await fsAsync.readdir( dirPath, { withFileTypes: true } );

                for( const entry of entries )
                {
                    const entryPath = path.resolve( path.join( dirPath, entry.name ) );

                    action = await this._processFileEntry( entryPath, entry, fileFilter, visitor, results );

                    if ( EXPLORER_ENTRY_ACTION.STOP === action )
                    {
                        return results;
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
            const directoryPath = resolvePath( pDirectory );

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

                const entries = await fsAsync.readdir( dirPath, { withFileTypes: true } );

                for( const entry of entries )
                {
                    const entryPath = path.resolve( path.join( dirPath, entry.name ) );

                    let info = await FileInfo.fromAsync( entryPath );

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

    let mod =
        {
            dependencies,
            classes:
                {
                    FileAttributes,
                    FileInfo
                },
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
            extractPathSeparator,
            removeExtension,
            replaceExtension,
            getTempDirectory,
            generateTempFileName,
            createTempFile,
            asyncCreateTempFile,
            createFile,
            asyncCreateFile,
            getFileEntry,
            asyncGetFileEntry,
            deleteFile,
            deleteMatchingFiles,
            asyncDeleteFile,
            asyncDeleteMatchingFiles,
            createTempFileAsync: asyncCreateTempFile,
            findFiles,
            FileAttributes,
            FileInfo
        };


    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
