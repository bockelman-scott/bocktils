const core = require( "@toolbocks/core" );
const loggingUtils = require( "@toolbocks/logging" );

const fs = require( "fs" );
const fsAsync = require( "fs/promises" );
const path = require( "node:path" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

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
    const INTERNAL_NAME = "__BOCK__FILE_LOGGER__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const modName = "FileLogger";

    const { classes, _mt_str, _hyphen, _dot, _lf, lock, populateOptions, no_op } = constants;

    const { isNull, isNumeric, isInteger, isString } = typeUtils;

    const { ModulePrototype, ModuleEvent } = classes;

    const { asString, asInt, asFloat, isBlank, ucase, toUnixPath } = stringUtils;

    const { varargs, asArray, Filters, AsyncBoundedQueue } = arrayUtils;

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
            loggingUtils
        };

    const DEFAULT_FILE_EXTENSION = (_dot + "log");
    const DEFAULT_FILE_NAME = "application";
    const DEFAULT_FILE_PATH = "./logs";
    const DEFAULT_SEPARATOR = _hyphen;

    class LogFilePattern
    {
        #name;
        #extension;
        #separator;
        #prefix;

        constructor( pName, pExtension, pSeparator, pPrefix )
        {
            this.#name = asString( pName, true );
            this.#extension = asString( pExtension, true );
            this.#separator = asString( pSeparator, true );
            this.#prefix = asString( pPrefix, true );
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

        generateFileName( pIteration )
        {
            const iteration = asInt( pIteration, 0 );
            const prefix = !isBlank( this.prefix ) ? (this.prefix + this.separator) : _mt_str;
            const name = this.name || DEFAULT_FILE_NAME;
            const extension = this.extension || DEFAULT_FILE_EXTENSION;
            return prefix + name + (iteration > 0 ? (this.separator + iteration) : _mt_str) + extension;
        }

        static fromString( pPattern )
        {
            const pattern = asString( pPattern, true );

            const parts = pattern.split( _dot );

            let name = parts.length > 0 ? parts[0] : DEFAULT_FILE_NAME;

            let extension = parts.length > 1 ? parts.slice( 1 ).join( _dot ).replace( /[\/\\\d_-]+$/, _mt_str ) : DEFAULT_FILE_EXTENSION;

            const nameParts = name.split( /[\/\\\s.;:_-]+/g );

            let prefix = _mt_str;

            let separator = DEFAULT_SEPARATOR;

            if ( nameParts.length > 1 )
            {
                let matches = /([\/\\\s.;:_-]+)/.exec( name );

                if ( matches && matches.length > 1 )
                {
                    separator = asString( matches[1] || DEFAULT_SEPARATOR, true );
                }

                prefix = nameParts[0];
                name = nameParts.slice( 1 ).join( separator );
            }

            return new LogFilePattern( name, extension, separator, prefix );
        }
    }

    const DEFAULT_FILE_PATTERN = lock( new LogFilePattern( DEFAULT_FILE_NAME, DEFAULT_FILE_EXTENSION, _mt_str, _hyphen ) );

    LogFilePattern.DEFAULT = DEFAULT_FILE_PATTERN;

    LogFilePattern.resolve = function( pOptions )
    {
        const options = populateOptions( pOptions || {}, DEFAULT_FILE_LOGGER_OPTIONS );

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

    class LogFileRetentionPolicy
    {
        #maxDays;
        #maxFiles;

        constructor( pMaximumDays, pMaximumFiles )
        {
            this.#maxDays = asInt( pMaximumDays );
            this.#maxFiles = asInt( pMaximumFiles );
        }

        get maxDays()
        {
            return this.#maxDays;
        }

        get maxFiles()
        {
            return this.#maxFiles;
        }

        isOlderThanMaxDays( pFile )
        {
            return false;
        }

        hasReachedMaxFiles( pDirectory )
        {
            return false;
        }

        deleteExpiredFiles( pDirectory )
        {

        }

        deleteOldestFile( pDirectory )
        {

        }

        async run( pDirectory )
        {

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
    const DEFAULT_FILE_RETENTION_POLICY = lock( new LogFileRetentionPolicy( 30, 10 ) );

    LogFileRetentionPolicy.DEFAULT = DEFAULT_FILE_RETENTION_POLICY;

    LogFileRetentionPolicy.resolve = function( pOptions )
    {
        const options = populateOptions( pOptions || {}, DEFAULT_FILE_LOGGER_OPTIONS );

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

    FileRotationIntervalUnit.WEEK = new FileRotationIntervalUnit( "WEEK", 7 * 24 * 60 * 60 * 1000 );
    FileRotationIntervalUnit.DAY = new FileRotationIntervalUnit( "DAY", 24 * 60 * 60 * 1000 );
    FileRotationIntervalUnit.HOUR = new FileRotationIntervalUnit( "HOUR", 60 * 60 * 1000 );
    FileRotationIntervalUnit.MINUTE = new FileRotationIntervalUnit( "MINUTE", 60 * 1000 );
    FileRotationIntervalUnit.SECOND = new FileRotationIntervalUnit( "SECOND", 1000 );
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

        if ( isString( pValue ) )
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

    FileRotationInterval.resolve = function( pValue )
    {
        if ( pValue instanceof FileRotationInterval )
        {
            return pValue;
        }

        if ( isNumeric( pValue ) )
        {
            const unit = FileRotationIntervalUnit.resolve( pValue );
            return new FileRotationInterval( asInt( pValue ), unit );
        }

        if ( isString( pValue ) )
        {
            const unit = FileRotationIntervalUnit.resolve( pValue );
            return new FileRotationInterval( 1, unit );
        }

        return new FileRotationInterval( 1, FileRotationIntervalUnit.DAY );
    };

    class LogFileRotationPolicy
    {
        #interval;
        #maxSize;

        constructor( pInterval, pMaximumKbs )
        {
            this.#interval = FileRotationInterval.resolve( pInterval );
            this.#maxSize = asInt( pMaximumKbs );
        }

        get interval()
        {
            return this.#interval;
        }

        get maxSize()
        {
            return this.#maxSize;
        }

        get milliseconds()
        {
            return this.interval.milliseconds;
        }

        get maxBytes()
        {
            return 1_204 * this.maxSize;
        }

        isOlderThanInterval( pFile )
        {
            return false;
        }

        hasReachedMaxSize( pFile )
        {
            return false;
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
    const DEFAULT_FILE_ROTATION_INTERVAL = lock( new FileRotationInterval( 1, FileRotationIntervalUnit.DAY ) );

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
    const DEFAULT_FILE_ROTATION_POLICY = lock( new LogFileRotationPolicy( DEFAULT_FILE_ROTATION_INTERVAL, 100 ) );

    LogFileRotationPolicy.DEFAULT = DEFAULT_FILE_ROTATION_POLICY;

    LogFileRotationPolicy.resolve = function( pOptions )
    {
        const options = populateOptions( pOptions || {}, DEFAULT_FILE_LOGGER_OPTIONS );

        if ( options.rotationPolicy instanceof LogFileRotationPolicy )
        {
            return options.rotationPolicy;
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
        const options = populateOptions( pOptions, DEFAULT_FILE_LOGGER_OPTIONS );
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
    const DEFAULT_FILE_LOGGER_OPTIONS =
        {
            directory: DEFAULT_FILE_PATH,
            filePattern: DEFAULT_FILE_PATTERN,
            timestampFormatter: null,
            filter: null,
            level: LogLevel.DEFAULT,
            logFormatter: LogFormatter.DEFAULT,
            retentionPolicy: DEFAULT_FILE_RETENTION_POLICY,
            rotationPolicy: DEFAULT_FILE_ROTATION_POLICY
        };

    const exists = function( pPath )
    {
        let exists;

        try
        {
            fs.accessSync( pPath, fs.constants.W_OK );

            exists = true;
        }
        catch( ex )
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
            await fsAsync.access( pPath, fs.constants.W_OK );
        }
        catch( ex )
        {
            exists = false;
        }
        return exists;
    };

    const makeDirectory = function( pDirectoryPath )
    {
        let logDir = toUnixPath( asString( pDirectoryPath, true ) );

        let success = false;

        if ( !exists( logDir ) )
        {
            try
            {
                fs.mkdirSync( logDir, { recursive: true } );

                success = exists( logDir );
            }
            catch( ex )
            {
                konsole.warn( logDir, "does not exists and could not be created", ex );
            }
        }

        return success;
    };

    const asyncMakeDirectory = async function( pDirectoryPath )
    {
        let logDir = toUnixPath( asString( pDirectoryPath, true ) );

        let success = false;

        if ( !await asyncExists( logDir ) )
        {
            try
            {
                await fsAsync.mkdir( logDir, { recursive: true } );

                success = await asyncExists( logDir );
            }
            catch( ex )
            {
                konsole.warn( logDir, "does not exists and could not be created", ex );
            }
        }
        return success;
    };


    class FileLogger extends AsyncLogger
    {
        #options;
        #otherOptions;

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

        #queue = new AsyncBoundedQueue( 1000 );

        constructor( pFileLoggerOptions = DEFAULT_FILE_LOGGER_OPTIONS, pOtherOptions = DEFAULT_LOGGER_OPTIONS )
        {
            super( pOtherOptions );

            const options = populateOptions( this, pFileLoggerOptions, DEFAULT_FILE_LOGGER_OPTIONS );
            const otherOptions = populateOptions( this, pOtherOptions, DEFAULT_LOGGER_OPTIONS );

            this.#options = lock( options );
            this.#otherOptions = lock( otherOptions );

            this.#directory = path.resolve( toUnixPath( asString( options.directory, true ) ) );

            this.#filePattern = LogFilePattern.resolve( options ) || LogFilePattern.DEFAULT;

            this.#timestampFormatter = options.timestampFormatter ||
                {
                    format: ( pDate ) => pDate.toLocaleString( [this.locale] )
                };

            this.#level = resolveLevel( options, otherOptions );

            this.#filter = resolveFilter( options.filter || otherOptions.filter, options ) || Filters.IDENTITY;

            this.#formatter = resolveFormatter( options.logFormatter || otherOptions.logFormatter || LogFormatter.DEFAULT ) || LogFormatter.DEFAULT;

            this.#retentionPolicy = LogFileRetentionPolicy.resolve( options ) || LogFileRetentionPolicy.DEFAULT;

            this.#rotationPolicy = LogFileRotationPolicy.resolve( options ) || LogFileRotationPolicy.DEFAULT;

            this._initializeDirectory();

            this._initializeLogFile( this.calculateFilepath().filename, this.calculateFilepath().filePath, 0 );

            this._initializeRotation();

            this._initializeRetention();
        }

        get options()
        {
            return populateOptions( this.#options || {}, DEFAULT_FILE_LOGGER_OPTIONS );
        }

        get otherOptions()
        {
            return populateOptions( this.#otherOptions || {}, DEFAULT_LOGGER_OPTIONS );
        }

        resolveLevel( pLevel, pOptions )
        {
            if ( pLevel instanceof LogLevel )
            {
                return pLevel;
            }

            const options = populateOptions( pOptions || this.options, DEFAULT_FILE_LOGGER_OPTIONS );
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
            return asString( this.#directory || DEFAULT_FILE_PATH, true );
        }

        get filePattern()
        {
            return this.resolveFilePattern( this.#filePattern, this.options );
        }

        get filepath()
        {
            return asString( this.#currentFilePath, true ) || this.calculateFilepath().filePath;
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

        get logFormatter()
        {
            return this.#formatter || super.logFormatter;
        }

        get formatter()
        {
            return this.#formatter || super.logFormatter;
        }

        get retentionPolicy()
        {
            return this.#retentionPolicy;
        }

        get rotationPolicy()
        {
            return this.#rotationPolicy;
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
                konsole.error( "Unable to create log directory", this.#directory, "Trying default log file path", DEFAULT_FILE_PATH );

                this.#directory = DEFAULT_FILE_PATH;

                directoryExists = exists( this.#directory );

                if ( !directoryExists )
                {
                    konsole.error( "Unable to create usable log directory", this.#directory, "This logger will be disabled" );

                    this.#level = LogLevel.OFF;

                    this.disable();
                }
            }
        }

        _initializeLogFile( pFilename, pFilepath, pRetries )
        {
            const retries = asInt( pRetries || 0 );

            const { filename, filePath } =
            {
                filename: asString( pFilename, true ) || this.calculateFilepath().filename,
                filepath: asString( pFilepath, true ) || this.calculateFilepath().filePath
            } || this.calculateFilepath();

            if ( retries > 2 )
            {
                konsole.error( "Unable to create log file", filePath, "after", retries, "retries. This logger is disabled" );
                this.#level = LogLevel.OFF;
                this.disable();
                return false;
            }

            let needsToBeCreated = true;

            if ( exists( filePath ) )
            {
                const stats = fs.statSync( filePath );

                if ( stats.isFile() && fs.accessSync( filePath, fs.R_OK | fs.W_OK ) )
                {
                    this.#currentFilename = filename;
                    this.#currentFilePath = filePath;

                    needsToBeCreated = false;

                    konsole.info( "Logging to", filePath, "is", this.enabled ? "enabled" : "disabled" );
                }
            }

            if ( needsToBeCreated )
            {
                try
                {
                    fs.writeFileSync( filePath, _mt_str );
                }
                catch( ex )
                {
                    konsole.error( "Unable to create log file:", filePath, "Retrying...", ex );
                }

                this._initializeLogFile( filename, filePath, retries + 1 );
            }

            return !needsToBeCreated;
        }

        calculateFilepath( pIteration )
        {
            const pattern = this.filePattern;

            const filename = pattern.generateFileName( pIteration );

            const filePath = path.resolve( path.join( this.directory, filename ) );

            return { filename, filePath };
        }

        isOpen()
        {
            return null !== this.#stream;
        }

        isClosed()
        {
            return null === this.#stream;
        }

        async _open()
        {
            const me = this;

            if ( this.isOpen() )
            {
                return true;
            }

            this.#stream = fs.createWriteStream( this.filepath, { flags: "a" } ); // 'a' for append

            // Ensure the stream is closed on exit, SIGINT, and SIGTERM
            if ( null != process )
            {
                process.on( "exit", () => (me || this)._close() );
                process.on( "SIGINT", () => (me || this)._close() );
                process.on( "SIGTERM", () => (me || this)._close() );
            }

            this.#stream.on( "error", ( err ) =>
            {
                konsole.error( "An error occurred while writing to log file:", this.filepath, err );
                (me || this)._close(); // Close the stream on error
            } );

            return this.isOpen();
        }

        _close()
        {
            if ( this.#stream )
            {
                this.#stream.end( () =>
                                  {
                                      konsole.log( "Closed log file:", this.filepath );
                                  } );

                this.#stream = null; // Prevent further writes
            }

            return this.isClosed();
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

            if ( open )
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

            if ( open )
            {
                const msg = isString( pString ) ? pString : asArray( pString ).join( _mt_str );

                this.#stream.write( asString( msg ) + _lf, ( err ) =>
                {
                    if ( err )
                    {
                        konsole.error( "An error occurred while writing to the log file:", this.filepath, err );
                        this._close();
                    }
                } );
            }
            else
            {
                this.#queue.enqueue( pString );
            }

            const policy = this.rotationPolicy;

            const stats = await fsAsync.stat( this.filepath );

            const fileSize = asInt( stats.size );

            if ( fileSize >= policy.maxBytes )
            {
                await this.rotateLogFile( this, false );
            }
        }

        async _log( ...pData )
        {
            const arr = asArray( varargs( ...pData ) );
            this._writeToLog( arr.join( _mt_str ) ).then( no_op ).catch( ex => konsole.error( ex ) );
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
            if ( !this.#queue.isEmpty() )
            {
                for await ( let entry of this.#queue )
                {
                    await this._writeToLog( entry );
                }
            }
        }

        async rotateLogFile( pThis, pResetInterval = true )
        {
            const me = pThis || this;

            const filePattern = me.filePattern;

            const extension = filePattern.extension;

            const separator = filePattern.separator;

            const filepath = this.filepath;

            let iteration = 0;

            const withoutExtension = asString( filepath.replace( new RegExp( "\\\.?" + extension + "$" ), _mt_str ), true );

            const rx = new RegExp( separator + "(\\d+)$" );

            const matches = rx.exec( withoutExtension );

            if ( matches && matches.length > 1 )
            {
                iteration = parseInt( matches[1] );
            }

            const newFilepath = this.calculateFilepath( iteration + 1 );

            konsole.info( "Rotating log file", me.filepath, "replaced by", newFilepath );

            me._close();

            this._initializeLogFile( newFilepath.filename, newFilepath.filePath, 0 );

            await me._open();

            const rotationHandler = function() { me.rotateLogFile.call( me, me ); };

            if ( isNull( me._rotationTimerId ) || asInt( me._rotationTimerId ) === 0 || !!pResetInterval )
            {
                clearTimeout( me._rotationTimerId );

                const policy = me.rotationPolicy || DEFAULT_FILE_ROTATION_POLICY;

                me._rotationTimerId = setTimeout( rotationHandler, policy.milliseconds );
            }
        }

        _initializeRotation()
        {
            let now = new Date();

            let midnight = new Date().setHours( 23, 59, 59, 999 );

            let firstInterval = (midnight - now);

            const me = this;

            const rotationFunction = async function() { await (me || this).rotateLogFile( me ); };

            this._rotationTimerId = setTimeout( rotationFunction, firstInterval );
        }

        _initializeRetention()
        {
            const me = this;
        }

    }

}());