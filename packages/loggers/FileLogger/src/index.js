const core = require( "@toolbocks/core" );

const loggingUtils = require( "@toolbocks/logging" );

const fileUtils = require( "@toolbocks/files" );

/*
 const fs = require( "node:fs" );
 const fsAsync = require( "node:fs/promises" );
 const path = require( "node:path" );
 */

const { constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

const {
    AsyncLogger,
    LogLevel,
    LogFormatter,
    LogFilter,
    LogRecord,
    DEFAULT_LOGGER_OPTIONS,
    resolveError,
    resolveSource,
    resolveFormatter,
    resolveFilter,
} = loggingUtils;

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

// noinspection FunctionTooLongJS
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__FILE_LOGGER__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const modName = "FileLogger";

    const {
        classes,
        _mt_str,
        _hyphen,
        _underscore,
        _dot,
        _lf,
        _fun,
        lock,
        populateOptions,
        mergeOptions,
        no_op,
        IterationCap,
        isLogger,
        MILLIS_PER,
        MESSAGES_LOCALE,
        getMessagesLocale,
        attempt,
        asyncAttempt,
    } = constants;

    const {
        isNull,
        isNumeric,
        isInteger,
        isString,
        isDate,
        isFunction,
        isNonNullObject,
        firstMatchingType
    } = typeUtils;

    const { ModulePrototype } = classes;

    const { asString, asInt, asFloat, isBlank, ucase, toBool } = stringUtils;

    const { varargs, asArray, Filters, AsyncBoundedQueue } = arrayUtils;

    const {
        resolvePath,
        getFileName,
        getFileExtension,
        getDirectoryName,
        exists,
        readFolder,
        stat,
        rm,
        rename,
        accessSync,
        statSync,
        makeDirectory,
        createWriteStream,
        writeTextFileSync,
        FileObject,
        fsConstants,
        WriteStream,
    } = fileUtils;

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
            localeUtils,
            loggingUtils
        };

    const F_APPEND = "a";
    const RX_EOS = "$";

    const TIMESTAMP_RESOLUTION =
        {
            YEAR: 1,
            MONTH: 2,
            DAY: 3,
            HOUR: 4,
            MINUTE: 5,
            SECOND: 6,
            MILLISECOND: 7
        };

    const DEFAULTS =
        {
            FILE_PATH: "./logs",
            FILE_NAME: "application",
            FILE_EXTENSION: (_dot + "log"),
            SEPARATOR: _hyphen,
            PREFIX: _mt_str,
            TIMESTAMP_RESOLUTION: TIMESTAMP_RESOLUTION.DAY
        };

    const MILLIS_PER_SECOND = MILLIS_PER.SECOND;
    const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
    const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
    const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;
    const MILLIS_PER_WEEK = 7 * MILLIS_PER_DAY;

    const ZERO = "0";

    const resolveMoment = ( pNow ) => isDate( pNow ) ? pNow || new Date() : new Date();

    const getMidnight = ( pDate ) => new Date( resolveMoment( pDate ) ).setHours( 23, 59, 59, 999 );

    let modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const messagesLocale = MESSAGES_LOCALE || getMessagesLocale();

    class LogFilePattern
    {
        #name;
        #extension;
        #separator;
        #prefix;

        #timestampResolution;

        constructor( pName = DEFAULTS.FILE_NAME,
                     pExtension = DEFAULTS.FILE_EXTENSION,
                     pSeparator = DEFAULTS.SEPARATOR,
                     pPrefix = DEFAULTS.PREFIX,
                     pResolution = DEFAULTS.TIMESTAMP_RESOLUTION )
        {
            this.#name = asString( pName, true );
            this.#extension = asString( pExtension, true );
            this.#separator = asString( pSeparator, true );
            this.#prefix = asString( pPrefix, true );
            this.#timestampResolution = Math.max( 1, asInt( pResolution, DEFAULTS.TIMESTAMP_RESOLUTION ) );
        }

        get name()
        {
            return asString( this.#name, true );
        }

        get extension()
        {
            return asString( this.#extension );
        }

        get separator()
        {
            return asString( this.#separator, true );
        }

        get prefix()
        {
            return asString( this.#prefix, true );
        }

        get timestampResolution()
        {
            return Math.min( Math.max( TIMESTAMP_RESOLUTION.YEAR, asInt( this.#timestampResolution, DEFAULTS.TIMESTAMP_RESOLUTION ) ), TIMESTAMP_RESOLUTION.MILLISECOND );
        }

        generateTimestamp( pDateOrFileInfo, pResolution = DEFAULTS.TIMESTAMP_RESOLUTION )
        {
            let date = isDate( pDateOrFileInfo ) ? pDateOrFileInfo : (pDateOrFileInfo instanceof FileObject ? pDateOrFileInfo.created : null);

            if ( !isNull( date ) && isDate( date ) )
            {
                const resolution = asInt( pResolution, 0 ) || this.timestampResolution;

                const fullYear = resolution > 0 ? asString( date.getFullYear(), true ).padStart( 4, ZERO ) : _mt_str;
                const month = resolution > 1 ? asString( date.getMonth() + 1, true ).padStart( 2, ZERO ) : _mt_str;
                const day = resolution > 2 ? asString( date.getDate(), true ).padStart( 2, ZERO ) : _mt_str;
                const hour = resolution > 3 ? asString( date.getHours(), true ).padStart( 2, ZERO ) : _mt_str;
                const minute = resolution > 4 ? asString( date.getMinutes(), true ).padStart( 2, ZERO ) : _mt_str;
                const second = resolution > 5 ? asString( date.getSeconds(), true ).padStart( 2, ZERO ) : _mt_str;
                const millisecond = resolution > 6 ? asString( date.getMilliseconds(), true ).padStart( 3, ZERO ) : _mt_str;
                return `${fullYear}${month}${day}${hour}${minute}${second}${millisecond}`;
            }

            return _mt_str;
        }

        generateFileName( pDateOrFileInfo = null, pResolution = DEFAULTS.TIMESTAMP_RESOLUTION )
        {
            const prefix = !isBlank( this.prefix ) ? (this.prefix + this.separator) : _mt_str;

            const name = this.name || DEFAULTS.FILE_NAME;

            const extension = this.extension || DEFAULTS.FILE_EXTENSION;

            const timestamp = this.generateTimestamp( pDateOrFileInfo, asInt( pResolution || this.timestampResolution, this.timestampResolution ) ) || _mt_str;

            const filename = prefix + name + (!isBlank( timestamp ) ? (this.separator + timestamp) : _mt_str) + _dot + (extension.replace( /^\.+/, _mt_str ));

            return filename.replace( /^([\W_.-]+)/, _mt_str );
        }

        static fromString( pPattern )
        {
            const pattern = asString( pPattern, true );

            const parts = pattern.split( _dot );

            const reSuffix = /[\/\\\d_-]+$/;

            let name = asString( parts.length > 0 ? parts[0] : DEFAULTS.FILE_NAME ).replace( reSuffix, _mt_str );

            let extension = parts.length > 1 ? parts.slice( 1 ).join( _dot ).replace( reSuffix, _mt_str ) : DEFAULTS.FILE_EXTENSION;

            const nameParts = name.split( /[\/\\\s.;:_-]+/g );

            let prefix = _mt_str;

            let separator = DEFAULTS.SEPARATOR;

            if ( nameParts.length > 1 )
            {
                let matches = /([\/\\\s.;:_-]+)/.exec( name );

                if ( matches && matches.length > 1 )
                {
                    separator = asString( matches[1] || DEFAULTS.SEPARATOR, true );
                }

                prefix = nameParts[0];
                name = nameParts.slice( 1 ).join( separator );
            }

            return new LogFilePattern( name, extension, separator, prefix );
        }

        toString()
        {
            return this.generateFileName();
        }

        [Symbol.species]()
        {
            return this;
        }

        [Symbol.toPrimitive]( pHint )
        {
            return this.toString();
        }

        [Symbol.toStringTag]()
        {
            return this.toString();
        }
    }

    DEFAULTS.FILE_PATTERN = lock( new LogFilePattern( DEFAULTS.FILE_NAME, DEFAULTS.FILE_EXTENSION, DEFAULTS.SEPARATOR, DEFAULTS.PREFIX, DEFAULTS.TIMESTAMP_RESOLUTION ) );

    LogFilePattern.DEFAULT = DEFAULTS.FILE_PATTERN;

    LogFilePattern.resolve = function( pOptions )
    {
        if ( pOptions instanceof LogFilePattern )
        {
            return pOptions;
        }

        const options = populateOptions( pOptions || {}, DEFAULTS.FILE_LOGGER_OPTIONS );

        if ( options.filePattern instanceof LogFilePattern )
        {
            return options.filePattern;
        }

        let filePattern = LogFilePattern.fromString( asString( options.filePattern, true ) );

        if ( filePattern instanceof LogFilePattern )
        {
            return filePattern;
        }

        return LogFilePattern.DEFAULT;
    };

    const DEL = "delete";
    const ARCH = "archive";

    const RETENTION_OPERATION =
        {
            DELETE: DEL,
            ARCHIVE: ARCH
        };

    function resolveRetentionOperation( pOperation )
    {
        let s = ucase( asString( pOperation, true ) );

        let operation = RETENTION_OPERATION[s];

        if ( isNull( operation ) || isBlank( operation ) )
        {
            operation = RETENTION_OPERATION.DELETE;
        }

        return operation;
    }

    function resolveArchiver( pArchiver )
    {
        return isFunction( pArchiver ) ? pArchiver : isNonNullObject( pArchiver ) && isFunction( pArchiver.archive ) ? pArchiver : null;
    }

    class LogFileRetentionPolicy
    {
        #maxDays;
        #maxFiles;

        #operation;
        #archiver = null;

        constructor( pMaximumDays, pMaximumFiles, pOperation = RETENTION_OPERATION.DELETE, pArchiver = null )
        {
            this.#maxDays = Math.max( 1, asInt( pMaximumDays ) );
            this.#maxFiles = Math.max( 1, asInt( pMaximumFiles ) );

            this.#operation = resolveRetentionOperation( pOperation ) || RETENTION_OPERATION.DELETE;
            this.#archiver = resolveArchiver( pArchiver );
        }

        get maxDays()
        {
            return Math.max( 1, asInt( this.#maxDays ) );
        }

        get maxFiles()
        {
            return Math.max( 1, asInt( this.#maxFiles ) );
        }

        get operation()
        {
            return resolveRetentionOperation( this.#operation );
        }

        get archiver()
        {
            return resolveArchiver( this.#archiver );
        }

        async collectFiles( pDirectory, pVisitor, pFileFilter, pDirectoryFilter, pBreadthFirst )
        {
            const fileFilter = Filters.compose( pFileFilter, async( e ) =>
            {
                const fileObj = await asyncAttempt( async() => await FileObject.fromAsync( e ) );
                return !isNull( fileObj ) && (await fileObj.isFile() || await fileObj.isSymbolicLink());
            } );

            let collected = await asyncAttempt( async() => await FileObject.collect( pDirectory, pVisitor, fileFilter, pDirectoryFilter, pBreadthFirst ) );

            collected = collected.length > 0 ? await asyncAttempt( async() => FileObject.sort( ...collected ) ) : [];

            return collected;
        }

        async findExpiredFiles( pDirectory, pNow )
        {
            const now = resolveMoment( pNow );

            const maxDays = this.maxDays;

            const criteria = async( pFile ) => await FileObject.from( pFile ).isExpired( maxDays, now );

            const fileInfos = await this.collectFiles( pDirectory, null, criteria );

            if ( fileInfos.length <= 0 )
            {
                return [];
            }

            return await Filters.asyncFilter( criteria, fileInfos );
        }

        async deleteExpiredFiles( pDirectory, pNow )
        {
            const me = this;

            const now = resolveMoment( pNow );

            let toDelete = await asyncAttempt( async() => await (me || this).findExpiredFiles( pDirectory, now ) );

            if ( toDelete.length <= 0 )
            {
                return [];
            }

            toDelete = await Filters.asyncFilter( async( pFile ) => await FileObject.from( pFile ).isExpired( (me || this).maxDays, now ), toDelete );

            return await asyncAttempt( async() => await (me || this).deleteFiles( ...toDelete ) );
        }

        async deleteFiles( ...pToDelete )
        {
            const toDelete = asArray( varargs( ...pToDelete ) );

            const deleted = [];

            if ( toDelete.length <= 0 )
            {
                return deleted;
            }

            const iterationCap = new IterationCap( (asInt( toDelete.length ) + 1) * 2 );

            while ( toDelete.length && !iterationCap.reached )
            {
                const file = toDelete.shift();

                const filePath = resolvePath( file.filepath || asString( file, true ) );

                try
                {
                    await rm( filePath, { force: true } );
                    deleted.push( filePath );
                    konsole.info( "Deleted log file", filePath );
                }
                catch( ex )
                {
                    konsole.error( "An error occurred while deleting log file", filePath, file, ex );
                }
            }

            return deleted;
        }

        async archiveExpiredFiles( pDirectory, pArchiver, pNow )
        {
            const me = this;

            const now = resolveMoment( pNow );

            const toArchive = await asyncAttempt( async() => await (me || this).findExpiredFiles( pDirectory, now ) );

            if ( toArchive.length <= 0 )
            {
                return [];
            }

            const archiver = resolveArchiver( pArchiver || this.archiver );

            if ( isNull( archiver ) )
            {
                konsole.error( "No valid archiver is defined for the log file retention policy", this, pArchiver );

                return [];
            }

            return await asyncAttempt( async() => await (me || this).archiveFiles( archiver, toArchive ) );
        }

        async archiveFiles( pArchiver, pToArchive )
        {
            if ( pToArchive.length <= 0 )
            {
                return [];
            }

            const archiver = resolveArchiver( pArchiver || this.archiver );

            if ( isNull( archiver ) )
            {
                konsole.error( "No valid archiver is defined for the log file retention policy", this, pArchiver );

                return [];
            }

            const archived = [];

            const method = firstMatchingType( _fun, pArchiver.archive, pArchiver );

            const iterationCap = new IterationCap( (asInt( pToArchive.length ) + 1) * 2 );

            while ( pToArchive.length && !iterationCap.reached )
            {
                const file = pToArchive.shift();

                const filepath = resolvePath( file.filepath || asString( file, true ) );

                await ((async( path, func ) =>
                {
                    try
                    {
                        const pathname = resolvePath( asString( path || filepath, true ) || filepath );

                        const result = await func.call( pArchiver, pathname );

                        konsole.info( "Archived expired log file:", pathname, isNull( result ) ? "successfully" : "with result", result );

                        archived.push( pathname );
                    }
                    catch( ex )
                    {
                        konsole.error( "An error occurred while archiving expired log file:", path, ex.message, ex );
                    }

                })( filepath, method ));
            }

            return archived;
        }

        async maxFilesExceededBy( pDirectory )
        {
            const entries = await asyncAttempt( async() => await readFolder( pDirectory, { withFileTypes: true } ) );
            return (entries?.length || 0) - this.maxFiles;
        }

        async handleOldestFiles( pDirectory, pNumToHandle = 1 )
        {
            const fileInfos = await this.collectFiles( pDirectory );

            if ( fileInfos.length <= 0 )
            {
                return { deleted: [], archived: [] };
            }

            let deleted = [];
            let archived = [];

            const num = Math.min( fileInfos.length, Math.max( 1, asInt( pNumToHandle ) ) );

            let files = await FileObject.sortDescending( ...fileInfos );

            files = files.slice( 0, num );

            if ( RETENTION_OPERATION.DELETE === this.operation )
            {
                deleted = await this.deleteFiles( ...(files || []) );
            }
            else if ( RETENTION_OPERATION.ARCHIVE === this.operation )
            {
                archived = await this.archiveFiles( this.archiver, ...(files || []) );
            }

            return { deleted, archived };
        }

        async run( pDirectory, pLogger, pNow )
        {
            let removed = [];

            let moved = [];

            const now = resolveMoment( pNow );

            if ( RETENTION_OPERATION.DELETE === this.operation )
            {
                removed = await this.deleteExpiredFiles( pDirectory, now );
            }
            else if ( RETENTION_OPERATION.ARCHIVE === this.operation )
            {
                moved = await this.archiveExpiredFiles( pDirectory, now );
            }

            const exceededBy = await this.maxFilesExceededBy( pDirectory );

            if ( exceededBy > 0 )
            {
                let { deleted, archived } = await this.handleOldestFiles( pDirectory, exceededBy );
                removed = removed.concat( deleted ).flat();
                moved = moved.concat( archived ).flat();
            }

            return { removed, moved };
        }
    }

    /**
     * A constant defining the default file retention policy for log files.<br>
     * <br>
     * The retention policy enforces rules for managing log file storage based on
     * the configured maximum number of days to retain files and the maximum number
     * of files allowed in the storage.<br>
     * <br>
     * This helps prevent excessive storage usage
     * and ensures efficient log file management.<br>
     * <br>
     * <br>
     * The default policy is configured to retain:<br>
     * - Log files for 30 days.<br>
     * - A maximum of 10 files.<br>
     * <br>
     *
     * @type LogFileRetentionPolicy
     * @constant
     * @readonly
     */
    DEFAULTS.FILE_RETENTION_POLICY = lock( new LogFileRetentionPolicy( 30, 10 ) );

    LogFileRetentionPolicy.DEFAULT = DEFAULTS.FILE_RETENTION_POLICY;

    LogFileRetentionPolicy.resolve = function( pOptions )
    {
        if ( pOptions instanceof LogFileRetentionPolicy )
        {
            return pOptions;
        }

        const options = populateOptions( pOptions || {}, DEFAULTS.FILE_LOGGER_OPTIONS );

        if ( options.retentionPolicy instanceof LogFileRetentionPolicy )
        {
            return options.retentionPolicy;
        }

        return LogFileRetentionPolicy.DEFAULT;
    };

    class FileRotationIntervalUnit
    {
        #name;
        #milliseconds;

        constructor( pName, pMilliseconds )
        {
            this.#name = ucase( asString( pName, true ) );
            this.#milliseconds = asInt( pMilliseconds );

            FileRotationIntervalUnit.CACHE[this.#name] = this;
            FileRotationIntervalUnit.values.push( this );
        }

        get milliseconds()
        {
            return this.#milliseconds;
        }

        get name()
        {
            return this.#name;
        }

        compareTo( pUnit )
        {
            const otherMillis = pUnit instanceof this.constructor ? pUnit.milliseconds : asInt( pUnit );
            return otherMillis - this.milliseconds;
        }
    }

    FileRotationIntervalUnit.CACHE = {};

    FileRotationIntervalUnit.values = [];

    FileRotationIntervalUnit.WEEK = new FileRotationIntervalUnit( "WEEK", MILLIS_PER_WEEK );
    FileRotationIntervalUnit.DAY = new FileRotationIntervalUnit( "DAY", MILLIS_PER_DAY );
    FileRotationIntervalUnit.HOUR = new FileRotationIntervalUnit( "HOUR", MILLIS_PER_HOUR );
    FileRotationIntervalUnit.MINUTE = new FileRotationIntervalUnit( "MINUTE", MILLIS_PER_MINUTE );
    FileRotationIntervalUnit.SECOND = new FileRotationIntervalUnit( "SECOND", MILLIS_PER_SECOND );
    FileRotationIntervalUnit.MILLISECOND = new FileRotationIntervalUnit( "MILLISECOND", 1 );

    FileRotationIntervalUnit.values = FileRotationIntervalUnit.values.sort( ( pA, pB ) => pA.compareTo( pB ) );

    FileRotationIntervalUnit.resolve = function( pValue )
    {
        if ( pValue instanceof FileRotationIntervalUnit )
        {
            return pValue;
        }

        if ( isNumeric( pValue ) )
        {
            let value = isInteger( pValue ) ? asInt( pValue ) : asFloat( pValue );

            for( let unit of FileRotationIntervalUnit.values )
            {
                if ( ((value % unit.milliseconds) === 0) || value > unit.milliseconds )
                {
                    return unit;
                }
            }

            return FileRotationIntervalUnit.MILLISECOND;
        }

        if ( isString( pValue ) && !isBlank( pValue ) )
        {
            return FileRotationIntervalUnit.CACHE[ucase( asString( pValue, true ) )] || FileRotationIntervalUnit.DAY;
        }

        return FileRotationIntervalUnit.DAY;
    };

    class FileRotationInterval
    {
        #value;
        #unit;

        constructor( pValue, pUnit )
        {
            this.#value = asInt( pValue );
            this.#unit = FileRotationIntervalUnit.resolve( pUnit );
        }

        get value()
        {
            return asInt( this.#value );
        }

        get unit()
        {
            return FileRotationIntervalUnit.resolve( this.#unit );
        }

        get milliseconds()
        {
            return this.unit.milliseconds * this.value;
        }
    }

    /**
     * The default file rotation interval used for log file management.<br>
     * <br>
     *
     * This value defines the time period after which a file should be rotated
     * automatically.<br>
     * <br>
     *
     * By default, it is set to rotate every day.<br>
     *
     * @type {FileRotationInterval}
     * @constant
     * @readonly
     */
    FileRotationInterval.DEFAULT = new FileRotationInterval( 1, FileRotationIntervalUnit.DAY );

    FileRotationInterval.resolve = function( pValue )
    {
        if ( pValue instanceof FileRotationInterval )
        {
            return pValue;
        }

        if ( isNumeric( pValue ) || isString( pValue ) )
        {
            const unit = FileRotationIntervalUnit.resolve( pValue );
            return new FileRotationInterval( 1, unit );
        }

        return FileRotationInterval.DEFAULT;
    };

    const MAX_LOG_FILE_SIZE_KB = 100;

    class LogFileRotationPolicy
    {
        #interval = FileRotationInterval.DEFAULT;
        #maxSize = MAX_LOG_FILE_SIZE_KB;

        constructor( pInterval, pMaximumKbs )
        {
            this.#interval = FileRotationInterval.resolve( pInterval );
            this.#maxSize = asInt( pMaximumKbs, MAX_LOG_FILE_SIZE_KB );
        }

        get interval()
        {
            return lock( FileRotationInterval.resolve( this.#interval ) );
        }

        get maxSize()
        {
            return asInt( this.#maxSize, MAX_LOG_FILE_SIZE_KB );
        }

        get milliseconds()
        {
            return this.interval.milliseconds;
        }

        get maxBytes()
        {
            return 1_024 * this.maxSize;
        }
    }

    LogFileRotationPolicy.fromExisting = function( pExisting, pOptions )
    {
        const options = populateOptions( pOptions || {}, DEFAULTS.FILE_LOGGER_OPTIONS );

        let existing = (pExisting instanceof LogFileRotationPolicy) ? pExisting : options.rotationPolicy || new LogFileRotationPolicy( FileRotationInterval.DEFAULT, MAX_LOG_FILE_SIZE_KB );

        const interval = isNull( options?.interval ) ? existing.interval : FileRotationInterval.resolve( options.interval );

        const maxSize = isNull( options?.maxSize ) ? existing.maxSize : asInt( options.maxSize, MAX_LOG_FILE_SIZE_KB );

        return new LogFileRotationPolicy( interval, maxSize );
    };

    /**
     * The default file rotation policy for log files.
     *
     * This variable specifies the policy used to manage the rotation of log files.
     * It applies a log file rotation mechanism based on a predefined time interval
     * and maximum file size. The rotation ensures that logs are archived and
     * managed efficiently to prevent excessive file growth and maintain readability.
     *
     * @type LogFileRotationPolicy
     * @constant
     * @readonly
     */
    DEFAULTS.FILE_ROTATION_POLICY = lock( new LogFileRotationPolicy( FileRotationInterval.DEFAULT, MAX_LOG_FILE_SIZE_KB ) );

    LogFileRotationPolicy.DEFAULT = DEFAULTS.FILE_ROTATION_POLICY;

    LogFileRotationPolicy.resolve = function( pOptions )
    {
        if ( pOptions instanceof LogFileRotationPolicy )
        {
            return pOptions;
        }

        const options = populateOptions( pOptions || {}, DEFAULTS.FILE_LOGGER_OPTIONS );

        if ( options.rotationPolicy instanceof LogFileRotationPolicy )
        {
            return LogFileRotationPolicy.fromExisting( options.rotationPolicy, options );
        }
        else if ( isNonNullObject( options ) )
        {
            const fileRotationInterval = FileRotationInterval.resolve( options?.interval );

            const maxKb = isNumeric( options.maxSize ) ? asInt( options.maxSize, MAX_LOG_FILE_SIZE_KB ) : MAX_LOG_FILE_SIZE_KB;

            if ( isNonNullObject( fileRotationInterval ) && (isNumeric( maxKb ) && asInt( maxKb ) > 0) )
            {
                return new LogFileRotationPolicy( fileRotationInterval, maxKb );
            }
        }

        return LogFileRotationPolicy.DEFAULT;
    };

    /**
     * @typedef {Object} FileLoggerOptions
     *
     * @property {string} directory The path to the directory where log files will be written
     *
     * @property {LogFilePattern|string} filePattern An object defining how to create log file names<br>
     *                                               or a string that can be interpreted as a LogFilePattern
     *
     * @property {Object|function} timestampFormatter An Object with a format method or a function
     *                                                that take a Date and returns a string representing the timestamp
     *
     * @property {LogFilter|function(LogRecord):boolean} [filter=Filters.IDENTITY] A LogFilter or a filter function<br>
     *                                              whose return value will determine
     *                                              whether a log message is written or discarded.
     *
     * @property {LogLevel|string|number} level The finest-grained LogLevel this logger will log.<br>
     *                                          <br>
     *                                          For example, specifying LogLevel.WARN will allow this Logger
     *                                          to log messages marked as warnings or errors,<br>
     *                                          but messages marked as informational, debugging, or trace<br>
     *                                          will be ignored
     *
     * @property {LogFormatter|function} logFormatter An object with a format method or function<br>
     *                                                that takes a LogRecord<br>
     *                                                and returns a string or an array to be written to the log.<br>
     *
     * @property {LogFileRetentionPolicy} retentionPolicy An object describing how long to keep log files before deleting them<br>
     *                                                    and/or the maximum number of files to keep<br>
     *
     * @property {LogFileRotationPolicy} rotationPolicy An object describing how often to rotate log files<br>
     *                                                  and/or the maximum size (in Kilobytes) a log file may be before being replaced<br>
     *
     */

    function resolveLevel( pOptions, pOtherOptions )
    {
        if ( pOptions instanceof LogLevel )
        {
            return pOptions;
        }

        if ( pOtherOptions instanceof LogLevel )
        {
            return pOtherOptions;
        }

        const options = populateOptions( pOptions, DEFAULTS.FILE_LOGGER_OPTIONS );
        const otherOptions = populateOptions( pOtherOptions, DEFAULT_LOGGER_OPTIONS );

        return LogLevel.resolveLevel( options.level || otherOptions.level ) ||
               LogLevel.resolveLevel( otherOptions.level ) ||
               LogLevel.DEFAULT;
    }

    /**
     * These are the default configuration options for a file-based logger.<br>
     * <br>
     * These are used to define the directory for log files,
     * file naming patterns,
     * the log level, and
     * policies for file retention and rotation.<br>
     * <br>
     * Properties:
     * - directory: Represents the directory path where log files are saved.
     * - filePattern: Specifies the naming pattern for log files.
     * - timestampFormatter: Custom formatter for timestamps in logs. Null by default.
     * - filter: Optional filter to include or exclude specific log entries. Null by default.
     * - level: Defines the default logging level. Logs at this level or higher will be recorded.
     * - logFormatter: Custom formatter for log messages. Null by default.
     * - retentionPolicy: Determines the policy for retaining old log files.
     * - rotationPolicy: Specifies the behavior for log file rotation.
     *
     * @type {FileLoggerOptions}
     */
    DEFAULTS.FILE_LOGGER_OPTIONS = lock(
        {
            directory: DEFAULTS.FILE_PATH,
            filePattern: DEFAULTS.FILE_PATTERN,
            timestampFormatter: null,
            filter: null,
            level: LogLevel.DEFAULT,
            logFormatter: LogFormatter.DEFAULT,
            retentionPolicy: DEFAULTS.FILE_RETENTION_POLICY,
            rotationPolicy: DEFAULTS.FILE_ROTATION_POLICY
        } );

    class FileLogger extends AsyncLogger
    {
        #options;
        #otherOptions;

        #created = new Date();

        #directory;
        #filePattern;
        #timestampFormatter;
        #level;
        #filter;
        #formatter;
        #retentionPolicy;
        #rotationPolicy;

        #currentFilename;
        #currentFilePath;

        #stream;

        #suspended;

        #queue;

        _rotationTimerId = null;
        _retentionTimerId = null;

        #lastRotationDate;
        #lastRetentionPolicyRunDate;

        constructor( pFileLoggerOptions = DEFAULTS.FILE_LOGGER_OPTIONS,
                     pOtherOptions = DEFAULT_LOGGER_OPTIONS )
        {
            super( mergeOptions( pFileLoggerOptions, pOtherOptions, DEFAULTS.FILE_LOGGER_OPTIONS ) );

            const options = populateOptions( pFileLoggerOptions || super.options || {}, DEFAULTS.FILE_LOGGER_OPTIONS );
            const otherOptions = populateOptions( pOtherOptions || super.options || {}, DEFAULT_LOGGER_OPTIONS );

            this.#options = lock( options );
            this.#otherOptions = lock( otherOptions );

            this.#directory = resolvePath( asString( options.directory, true ) );

            this.#filePattern = LogFilePattern.resolve( options ) || LogFilePattern.DEFAULT;

            this.#timestampFormatter = options.timestampFormatter ||
                {
                    format: ( pDate ) => pDate.toLocaleString( [this.locale], options )
                };

            this.#level = resolveLevel( options, otherOptions );

            this.#filter = resolveFilter( options.filter || otherOptions.filter, options ) || Filters.IDENTITY;

            this.#formatter = resolveFormatter( options.logFormatter || otherOptions.logFormatter || LogFormatter.DEFAULT ) || LogFormatter.DEFAULT;

            this.#retentionPolicy = LogFileRetentionPolicy.resolve( options ) || LogFileRetentionPolicy.DEFAULT;

            this.#rotationPolicy = LogFileRotationPolicy.resolve( options ) || LogFileRotationPolicy.DEFAULT;

            this.#queue = new AsyncBoundedQueue( 1_000 );

            this._initializeDirectory();

            let { filename, filePath } = this.calculateFilePath();

            this._initializeLogFile( filename, filePath, 0 );

            const now = this.#created || new Date();

            this._initializeRotation( now );

            this._initializeRetention( now );

            this.#lastRotationDate = null;
            this.#lastRetentionPolicyRunDate = null;
        }

        get options()
        {
            return populateOptions( this.#options || {}, populateOptions( super.options, DEFAULTS.FILE_LOGGER_OPTIONS ) );
        }

        get otherOptions()
        {
            return populateOptions( this.#otherOptions || {}, populateOptions( super.options, DEFAULT_LOGGER_OPTIONS ) );
        }

        resolveLevel( pLevel, pOptions )
        {
            if ( pLevel instanceof LogLevel )
            {
                return pLevel;
            }

            const options = populateOptions( pOptions || this.options, DEFAULTS.FILE_LOGGER_OPTIONS );
            return resolveLevel( options, this.otherOptions );
        }

        resolveFilePattern( pPattern, pOptions )
        {
            if ( pPattern instanceof LogFilePattern )
            {
                return pPattern;
            }

            const options = populateOptions( pOptions || this.options, this.options );
            return LogFilePattern.resolve( options );
        }

        get directory()
        {
            return asString( this.#directory || DEFAULTS.FILE_PATH, true );
        }

        get filePattern()
        {
            return this.resolveFilePattern( this.#filePattern, this.options );
        }

        get filepath()
        {
            return asString( this.#currentFilePath, true ) || this.calculateFilePath().filePath;
        }

        get filename()
        {
            return asString( this.#currentFilename, true ) || this.calculateFilePath().filename;
        }

        get timestampFormatter()
        {
            return this.#timestampFormatter;
        }

        get asynchronous()
        {
            return true;
        }

        get level()
        {
            return this.resolveLevel( this.#level || super.level, this.options );
        }

        get filter()
        {
            return this.#filter || super.filter;
        }

        get formatter()
        {
            return this.#formatter || super.logFormatter;
        }

        get logFormatter()
        {
            return this.formatter;
        }

        get retentionPolicy()
        {
            return this.#retentionPolicy;
        }

        get rotationPolicy()
        {
            return this.#rotationPolicy;
        }

        get suspended()
        {
            return toBool( this.#suspended );
        }

        set suspended( pBool )
        {
            this.#suspended = toBool( pBool );
        }

        _initializeDirectory()
        {
            let directoryExists = exists( this.#directory );

            if ( !directoryExists )
            {
                directoryExists = makeDirectory( this.#directory );
            }

            if ( !directoryExists )
            {
                konsole.error( "Unable to create log directory", this.#directory, "Trying default log file path", DEFAULTS.FILE_PATH );

                this.#directory = DEFAULTS.FILE_PATH;

                directoryExists = exists( this.#directory );

                if ( !directoryExists )
                {
                    konsole.error( "Unable to create usable log directory", this.#directory, "This logger will be disabled" );

                    this.#level = LogLevel.OFF;
                    this.disable();
                }
            }
        }

        _initializeLogFile( pFileName, pFilePath, pRetries )
        {
            const retries = asInt( pRetries || 0 );

            const {
                filename = asString( pFileName || this.#currentFilename, true ),
                filePath = asString( pFilePath || this.#currentFilePath, true )
            } = this.calculateFilePath();

            if ( retries > 2 )
            {
                konsole.error( "Unable to create log file", filePath, "after", retries, "retries. This logger is disabled" );
                this.#level = LogLevel.OFF;
                this.disable();
                return false;
            }

            let needsToBeCreated = !exists( filePath );

            this.suspended = needsToBeCreated;

            if ( !needsToBeCreated )
            {
                const stats = statSync( filePath );

                if ( stats.isFile() )
                {
                    try
                    {
                        accessSync( filePath, fsConstants.F_OK );

                        this.#currentFilename = filename;
                        this.#currentFilePath = filePath;

                        needsToBeCreated = false;

                        konsole.info( "Logging to", filePath, "is", this.enabled ? "enabled" : "disabled" );
                    }
                    catch( ex )
                    {
                        needsToBeCreated = true;
                        konsole.warn( "Unable to access log file", filePath, ex );
                    }
                }
                else
                {
                    needsToBeCreated = true;
                }
            }

            if ( needsToBeCreated )
            {
                this.suspended = needsToBeCreated;

                try
                {
                    const fileCreationDate = new Date().toLocaleString( this.locale );

                    writeTextFileSync( filePath, "********** LOG FILE CREATED AT " + fileCreationDate + " **********\n\n", { encoding: "utf8" } );

                    needsToBeCreated = !exists( filePath );

                    if ( !needsToBeCreated )
                    {
                        this.#currentFilename = filename;
                        this.#currentFilePath = filePath;

                        konsole.info( "Logging to", filePath, "is", this.enabled ? "enabled" : "disabled" );
                    }
                }
                catch( ex )
                {
                    konsole.error( "Unable to create log file:", filePath, "Retrying...", ex );

                    this._initializeLogFile( filename, filePath, retries + 1 );
                }
            }

            this.suspended = needsToBeCreated;

            return !needsToBeCreated;
        }

        calculateFilePath( pDateOrFileInfo = null, pResolution = DEFAULTS.TIMESTAMP_RESOLUTION )
        {
            const pattern = this.filePattern;

            const filename = pattern.generateFileName( pDateOrFileInfo, pResolution );

            const filePath = resolvePath( [this.directory, filename] );

            return { filename, filePath };
        }

        get lastRotationDate()
        {
            return this.#lastRotationDate;
        }

        get lastRetentionPolicyRunDate()
        {
            return this.#lastRetentionPolicyRunDate;
        }

        isOpen()
        {
            return null !== this.#stream && this.#stream instanceof WriteStream;
        }

        isClosed()
        {
            return null === this.#stream || !(this.#stream instanceof WriteStream);
        }

        async _open()
        {
            const me = this;

            if ( this.isOpen() )
            {
                return true;
            }

            this.suspended = true;

            try
            {
                this.#stream = createWriteStream( this.filepath, { flags: F_APPEND } ); // 'a' for append

                // Ensure the stream is closed on exit, SIGINT, and SIGTERM
                if ( null != process && (null === this.exitEventsHandled || false === this.exitEventsHandled) )
                {
                    process.on( "beforeExit", async() => (me || this)._close().then( no_op ).catch( no_op ) );

                    process.on( "exit", () => (me || this)._forceClose() );
                    process.on( "SIGINT", () => (me || this)._forceClose() );
                    process.on( "SIGTERM", () => (me || this)._forceClose() );

                    this.exitEventsHandled = true;
                }

                if ( this.#stream )
                {
                    this.#stream.on( "error", ( err ) =>
                    {
                        konsole.error( "An error occurred while writing to log file:", (me || this).filepath, err );
                        (me || this)._forceClose(); // Close the stream on error
                    } );
                }
            }
            catch( ex )
            {
                konsole.error( "Unable to open log file:", (me || this).filepath, ex );
            }

            (me || this).suspended = !(me || this).isOpen();

            return (me || this).isOpen();
        }

        async _close()
        {
            const me = this;

            if ( this.isOpen() )
            {
                await this.flush().then( no_op ).catch( ex => konsole.error( ex ) );

                this.#stream.end( () =>
                                  {
                                      konsole.log( "Closed log file:", (me || this).filepath );
                                  } );

                this.#stream.removeAllListeners();

                this.#stream = null; // Prevent further writes

                this.suspended = true;
            }

            return this.isClosed();
        }

        _forceClose()
        {
            const me = this;

            if ( this.isOpen() )
            {
                (me || this).flush().then( no_op ).catch( ex => konsole.error( ex ) );

                (me || this).#stream.end( () =>
                                          {
                                              konsole.log( "Force closed the log file:", (me || this).filepath, "Some messages may have been lost", this.#queue );
                                          } );

                (me || this).#stream = null; // Prevent further writes

                (me || this).suspended = true;
            }
        }

        async writeLogRecord( pLogRecord )
        {
            if ( !this.filter.isLoggable( pLogRecord ) || !this.enabled )
            {
                return;
            }

            let record = pLogRecord instanceof LogRecord ? pLogRecord : new LogRecord( pLogRecord );

            if ( !this.level.isEnabled( record?.level || this.level ) )
            {
                return;
            }

            let open = this.isOpen() || await this._open();

            if ( open && !this.suspended )
            {
                let msg = isString( pLogRecord ) ? pLogRecord : this.formatter.format( record );
                this._writeToLog( msg ).then( no_op ).catch( ex => konsole.error( ex ) );
            }
            else
            {
                this.#queue.enqueue( record );
            }
        }

        async _writeToLog( pString )
        {
            let open = this.isOpen() || await this._open();

            const msg = isString( pString ) ? pString : asArray( pString ).join( _mt_str );

            if ( open && !this.suspended )
            {
                const me = this;

                this.#stream.write( _lf + (asString( msg ) + _lf), ( err ) =>
                {
                    if ( err )
                    {
                        konsole.error( "An error occurred while writing to the log file:", (me || this).filepath, err );

                        (me || this)._close().then( no_op ).catch( ex => konsole.error( ex ) );

                        (me || this).#queue.enqueue( msg );
                    }
                } );
            }
            else
            {
                this.#queue.enqueue( msg );
            }

            this.checkAndRotateIfMaxSize().then( no_op ).catch( ex => konsole.error( ex ) );
        }

        async checkAndRotateIfMaxSize()
        {
            const me = this;

            const policy = (me || this).rotationPolicy;

            const stats = await stat( (me || this).filepath );

            const fileSize = asInt( stats.size );

            if ( fileSize >= policy.maxBytes )
            {
                this.suspended = true;

                await (me || this).rotateLogFile( (me || this), TIMESTAMP_RESOLUTION.MILLISECOND, false );

                konsole.log( "Rotated log file due to maximum size reached:", (me || this).filepath );

                this.suspended = false;
            }
        }

        async _log( ...pData )
        {
            const arr = asArray( varargs( ...pData ) );

            if ( 1 === arr.length && arr[0] instanceof LogRecord )
            {
                this.writeLogRecord( arr[0] ).then( no_op ).catch( ex => konsole.error( ex ) );
            }
            else
            {
                this._writeToLog( arr.join( _mt_str ) ).then( no_op ).catch( ex => konsole.error( ex ) );
            }
        }

        info( ...pData )
        {
            if ( this.enabled && this.level.isEnabled( LogLevel.INFO ) )
            {
                this._log( ...pData ).then( no_op ).catch( ex => konsole.error( ex ) );
            }
        }

        warn( ...pData )
        {
            if ( this.enabled && this.level.isEnabled( LogLevel.WARN ) )
            {
                this._log( ...pData ).then( no_op ).catch( ex => konsole.error( ex ) );
            }
        }

        error( ...pData )
        {
            if ( this.enabled && this.level.isEnabled( LogLevel.ERROR ) )
            {
                this._log( ...pData ).then( no_op ).catch( ex => konsole.error( ex ) );
            }
        }

        debug( ...pData )
        {
            if ( this.enabled && this.level.isEnabled( LogLevel.DEBUG ) )
            {
                this._log( ...pData ).then( no_op ).catch( ex => konsole.error( ex ) );
            }
        }

        trace( ...pData )
        {
            if ( this.enabled && this.level.isEnabled( LogLevel.TRACE ) )
            {
                this._log( ...pData ).then( no_op ).catch( ex => konsole.error( ex ) );
            }
        }

        async flush()
        {
            const iterationCap = new IterationCap( this.#queue.size + 16 );

            if ( !(await this.#queue.isEmpty()) )
            {
                for await ( let entry of this.#queue )
                {
                    if ( entry )
                    {
                        await this._writeToLog( entry );
                    }

                    if ( iterationCap.reached )
                    {
                        break;
                    }
                }
            }
        }

        async rotateLogFile( pThis, pTimestampResolution, pResetInterval = true )
        {
            const me = pThis || this;

            const filePattern = me.filePattern;

            const filepath = me.filepath;

            const filename = me.filename;

            const fileInfo = FileObject.from( filepath );

            const archivedFilePath = me.calculateFilePath( fileInfo, asInt( pTimestampResolution, filePattern.timestampResolution ) );

            let archivedPath = resolvePath( archivedFilePath.filePath );

            let fileExists = await exists( archivedPath );

            let counter = 1;

            while ( fileExists )
            {
                const sep = filePattern.separator || _underscore;

                let extension = filePattern.extension || getFileExtension( archivedPath );

                archivedPath = archivedPath.replace( new RegExp( ("\\." + extension.replace( /^\.+/, _mt_str ) + RX_EOS) ), _mt_str );

                archivedPath = archivedPath.replace( new RegExp( sep + "\\d{1,3}$|" + sep + counter + RX_EOS ), _mt_str );

                archivedPath += sep + (asString( counter++ ).trim()) + (extension || ".log");

                fileExists = await exists( archivedPath );
            }

            await me.flush().then( no_op ).catch( ex => konsole.error( ex ) );

            await me._close();

            await rename( filepath, archivedPath );

            konsole.info( "Rotating log file:", me.filepath, "copied to:", archivedPath );

            await me._initializeLogFile( filename, filepath, 0 );

            await me._open();

            const rotationHandler = async function() { await me.rotateLogFile.call( me, me, pTimestampResolution, pResetInterval ); };

            if ( isNull( me._rotationTimerId ) || asInt( me._rotationTimerId ) === 0 || !!pResetInterval )
            {
                clearTimeout( me._rotationTimerId );

                const policy = me.rotationPolicy || DEFAULTS.FILE_ROTATION_POLICY;

                me._rotationTimerId = setTimeout( rotationHandler, policy.milliseconds );
            }

            const now = new Date();

            this.#lastRotationDate = now;

            const runRetention = (isNull( me._retentionTimerId )) || (isDate( me.lastRetentionPolicyRunDate ) && (me.lastRetentionPolicyRunDate.getTime() - now.getTime()) > MILLIS_PER.DAY);

            if ( runRetention )
            {
                await me.runRetentionPolicy( me.directory, me, now ).then( no_op ).catch( ex => konsole.error( ex ) );
            }

            return archivedPath;
        }

        _initializeRotation( pNow )
        {
            const now = resolveMoment( pNow );

            const midnight = getMidnight( now );

            const firstInterval = (midnight - now);

            const me = this;

            const rotationFunction = async function() { await (me || this).rotateLogFile.call( me, me, DEFAULTS.TIMESTAMP_RESOLUTION, true ); };

            this._rotationTimerId = setTimeout( rotationFunction, firstInterval );
        }

        _initializeRetention( pNow )
        {
            const me = this;

            const now = resolveMoment( pNow );

            const midnight = getMidnight( now );

            const firstInterval = ((midnight - now) + MILLIS_PER_HOUR);

            const directory = (me || this).directory;

            const policy = LogFileRetentionPolicy.resolve( { retentionPolicy: me.runRetentionPolicy } );

            const runPolicy = (me || this).runRetentionPolicy;

            if ( !isFunction( runPolicy ) )
            {
                konsole.error( "Invalid retention policy", policy, "for logger", me );
            }

            const retentionFunction = async function() { await asyncAttempt( () => runPolicy.call( me, directory, me ) ); };

            this._retentionTimerId = setTimeout( retentionFunction, firstInterval );
        }

        async runRetentionPolicy( pDirectory, pLogger, pNow )
        {
            const me = this || pLogger;

            const now = resolveMoment( pNow );

            const directory = attempt( () => resolvePath( asString( pDirectory || (me || this).directory, true ) ) );

            const policy = (me || this).retentionPolicy;

            const { removed, moved } = await asyncAttempt( async() => await policy.run( directory, (me || this) ) );

            const logMsg = ["Log file retention policy executed. Removed ", removed.length, " files, moved ", moved.length, " files.", removed, moved];

            konsole.info( ...logMsg );

            const logger = isLogger( pLogger ) ? (pLogger || me || this) : (me || this);

            if ( isLogger( logger ) )
            {
                logger.info( ...logMsg );
            }

            const runPolicy = (me || this).runRetentionPolicy || this.runRetentionPolicy || this;

            const retentionFunction = async function() { await runPolicy.call( me, directory ); };

            const completedTime = new Date();

            this.#lastRetentionPolicyRunDate = completedTime;

            if ( !isNull( this._retentionTimerId ) )
            {
                clearTimeout( this._retentionTimerId );
            }

            this._retentionTimerId = setTimeout( retentionFunction, (MILLIS_PER_DAY - (now - completedTime)) );
        }
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    LogLevel,
                    LogFormatter,
                    LogFilter,
                    LogRecord,
                    LogFilePattern,
                    FileObject,
                    LogFileRetentionPolicy,
                    FileRotationIntervalUnit,
                    FileRotationInterval,
                    LogFileRotationPolicy,
                    FileLogger
                },
            TIMESTAMP_RESOLUTION,
            DEFAULTS: lock( DEFAULTS ),
            RETENTION_OPERATION,
            resolveRetentionOperation,
            resolveArchiver,
            resolveError,
            resolveSource,
            resolveFormatter,
            resolveFilter,
            LogFilePattern,
            FileObject,
            LogFileRetentionPolicy,
            FileRotationIntervalUnit,
            FileRotationInterval,
            LogFileRotationPolicy,
            FileLogger,
            messagesLocale
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
