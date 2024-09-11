const os = require( "os" );

const fs = require( "fs" );
const fsAsync = require( "fs/promises" );

const utils = require( "../utils/CommonUtils" );

const constants = utils?.constants || require( "../utils/Constants.js" );
const stringUtils = utils?.stringUtils || require( "../utils/StringUtils.js" );
const arrayUtils = utils?.arrayUtils || require( "../utils/ArrayUtils.js" );
const objectUtils = utils?.objectUtils || require( "../utils/ObjectUtils.js" );

const dateUtils = require( "./DateUtils.js" );

const envUtils = require( "./EnvironmentUtils.js" );
const { catchHandler } = require("./FunctionUtils.js");

const _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

const OPERATING_SYSTEM = os.platform() || process?.platform;

const isWindows = envUtils?.isWindows || function()
{
    return ["windows", "win32", "windows_nt"].includes( (OPERATING_SYSTEM).trim().toLowerCase() );
};

const _isNodeJs = envUtils.isNodeJs();

(function makeModule()
{
    const MAXIMUM_DAYS_LOG_FILE_RETENTION = 180;
    const MINIMUM_DAYS_LOG_FILE_RETENTION = 14;
    const DEFAULT_DAYS_LOG_FILE_RETENTION = 60;

    const TIME_ELEVEN_PM = 23;
    const TIME_LAST_MINUTE_OR_SECOND = 59;
    const TIME_LAST_MILLISECOND = 999;

    const MAX_ASCII_CODEPOINT = 127;

    let _mt_str = constants?._mt_str || "";
    let _mt_chr = constants?._mt_chr || "";

    let _spc = constants?._spc || " ";
    let _dot = constants?._dot || ".";
    let _crlf = constants?._crlf || "\r\n";
    let _lf = constants?._lf || "\n";

    let _str = constants?._str || "string";
    let _obj = constants?._obj || "object";
    let _num = constants?._num || "number";
    let _big = constants?._big || "bigint";
    let _fun = constants?._fun || "function";

    let asString = stringUtils?.asString || function( s ) { return (_mt_str + s).trim(); };
    let isBlank = stringUtils?.isBlank || function( s ) { return _mt_str === asString( s, true ).trim(); };
    let tidy = stringUtils?.tidy || function( s ) { return (_mt_str + s).trim(); };
    let ucase = stringUtils?.ucase || function( s ) { return asString( s ).toUpperCase(); };
    let lcase = stringUtils?.lcase || function( s ) { return asString( s ).toLowerCase(); };

    let pruneArray = arrayUtils?.pruneArray || function( pArr ) { return pArr.filter( e => !(typeof e === _ud || null == e || isBlank( e ) || ([_num, _big].includes( typeof e ) && isNaN( e ))) ); };

    let asInt = stringUtils?.asInt || function( s ) { return parseInt( asString( s ) ); };
    let forceToArray = arrayUtils?.forceToArray || function( pArr ) { return Array.isArray( pArr ) ? pArr : [pArr]; };

    let toUnixPath = stringUtils?.toUnixPath || function( s ) { return asString( s, true ).replace( /[\/\\]/g, S_PATH_SEP ).replace( /\/\//g, S_PATH_SEP ); };

    let isPopulated = objectUtils?.isPopulated || function( pObj ) { return null != pObj && (Object.entries( pObj )?.length || 0) > 0; };
    let toBool = objectUtils?.toBool || function( pVal ) { return null != pVal && pVal; };

    let isFunction = objectUtils.isFunction || function( pObj ) { return _fun === typeof pObj; };

    let no_op = objectUtils?.no_op || function() {};

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils, envUtils );

    const INTERNAL_NAME = "__BOCK__SIMPLE_LOGGER__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const rootDir = __dirname.replace( /utils/, _mt_str );

    const S_LOG_DIR = "logs";
    const S_LOG_EXT = "log";
    const S_LOGGING_TO = "Logging to ";
    const S_ERR_MKDIR = "Could not make directory,";
    const S_LOGGER_INITIALIZED = "Initialized logger...";
    const S_GENERIC_EVENT_MSG = "An Event Occurred";

    const S_GLOBAL_PROPERTY = "defaultLogger";

    const DEFAULT_SOURCE = "SyncEngage"; // TODO: read from configuration
    const S_EVENT_SOURCE = "SyncEngage"; // TODO: read from configuration

    const DEFAULT_LOG_TYPE = "production";
    const DEV_LOG_TYPE = "dev";
    const UAT_LOG_TYPE = "uat";
    const TEST_LOG_TYPE = "test";

    const S_CONSOLE = "console";
    const S_FILE = "file";
    const S_EVENT_LOG = "event_log";
    const S_DATABASE = "db";

    const S_TOKEN_START = "[";
    const S_TOKEN_END = "]";

    const M_LOG = "log";
    const M_INFO = "info";
    const M_WARN = "warn";
    const M_DEBUG = "debug";
    const M_ERROR = "error";
    const M_TRACE = "trace";

    const S_PATH_SEP = constants._unixPathSep || "/";

    const args = process.argv.slice( 2 ); // dev, prod, uat, scott, etc.

    const separator = _dot;


    const LOG_LEVEL =
        Object.freeze( {
                           NONE: 0,
                           FATAL: 100,
                           ERROR: 200,
                           WARN: 300,
                           INFO: 400,
                           DEBUG: 500,
                           TRACE: 600,
                           ALL: 2147483647,
                       } );

    let LOG_FILE_DEFAULTS =
        {
            rootDir: rootDir,
            thisDir: __dirname,
            pwd: process.cwd(),
            cfg: [].concat( ...args ),
            directory: S_LOG_DIR,
            extension: S_LOG_EXT,
            separator,
            verbose: false,
            timestampOptions:
                {
                    dateOnly: true,
                    timeOnly: false,
                    dateSeparator: separator,
                    timeSeparator: separator,
                    dateTimeGutter: separator
                },
            rootLogger: console,
            echo: false,
            days_to_retain_logs: 30,
            level: LOG_LEVEL.INFO,
            levels:
                {
                    [S_FILE]: LOG_LEVEL.INFO,
                    [S_DATABASE]: LOG_LEVEL.ERROR,
                    [S_CONSOLE]: LOG_LEVEL.INFO
                }
        };

    /**
     * This is an alias for the console, to avoid warnings related to uses of console.log, for example
     */
    let konsole = console;

    const containsPlaceholders = function( pMsg )
    {
        return pMsg.includes( "{" ) &&
               pMsg.includes( "}" ) &&
               (/\{\d+}/.test( pMsg ) || /\{\w+}/.test( pMsg ));
    };

    const replaceIndexPlaceholders = function( pMsg, ...pData )
    {
        return stringUtils.formatMessage( pMsg, ...pData );
    };

    const replaceMappedPlaceholders = function( pMsg, pMap )
    {
        return stringUtils.interpolate( pMsg, pMap );
    };

    const err = function( pError, pOptions = LOG_FILE_DEFAULTS )
    {
        const ops = objectUtils.ingest( {}, LOG_FILE_DEFAULTS, pOptions || {} );

        if ( ops?.verbose )
        {
            return pError;
        }

        return pError.message;
    };

    const ignore = function( pError )
    {
        // ignore it
    };

    const makeTimestamp = function( pDateTime, pOptions )
    {
        const options = objectUtils.ingest( {}, LOG_FILE_DEFAULTS, pOptions || {} );

        const now = (_obj === typeof pDateTime || _num === typeof pDateTime) ?
                    (pDateTime instanceof Date ? pDateTime : new Date()) :
                    new Date();

        const year = now.getFullYear();
        const month = (now.getMonth() + 1);
        const day = now.getDate();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();

        const padChar = "0";

        const yrStr = (_mt_str + year).padStart( 4, padChar );
        const moStr = (_mt_str + month).padStart( 2, padChar );
        const dayStr = (_mt_str + day).padStart( 2, padChar );

        const hrStr = (_mt_str + hour).padStart( 2, padChar );
        const mnStr = (_mt_str + minute).padStart( 2, padChar );
        const secStr = (_mt_str + second).padStart( 2, padChar );

        let defaultOptions =
            {
                dateOnly: options.dateOnly || false,
                timeOnly: options.timeOnly || false,
                dateSeparator: options.dateSeparator || _dot,
                timeSeparator: options.timeSeparator || _dot,
                dateTimeGutter: options.dateTimeGutter || _dot,
                prefix: options.prefix || _mt_str,
                suffix: options.suffix || _mt_str,
                days_to_retain_logs: 30
            };

        defaultOptions = Object.assign( defaultOptions, (pOptions?.timestampOptions || defaultOptions) );

        const opts = Object.assign( defaultOptions, pOptions || defaultOptions );

        let s = (_mt_str + (asString( opts?.prefix ) || _mt_str));

        let sep = opts?.dateSeparator || _dot;

        if ( !opts?.timeOnly )
        {
            s += yrStr + sep + moStr + sep + dayStr + (!opts?.dateOnly ? opts?.dateTimeGutter || _spc : _mt_str);
        }

        if ( !opts?.dateOnly )
        {
            sep = opts?.timeSeparator || _dot;
            s += hrStr + sep + mnStr + sep + secStr;
        }

        s += (_mt_str + (opts?.suffix || _mt_str));

        return s;
    };

    const writeToEventLog = async function( pSource = DEFAULT_SOURCE, ...pData )
    {
        try
        {
            if ( envUtils.isWindows() )
            {
                try
                {
                    const EventLogger = require( "node-windows" )?.EventLogger;

                    if ( EventLogger )
                    {
                        const sourceName = pSource || S_EVENT_SOURCE;

                        try
                        {
                            const eventLog = new EventLogger( sourceName );

                            if ( eventLog )
                            {
                                eventLog.info( ([].concat( ...(pData || [S_GENERIC_EVENT_MSG]) )).join( _crlf ), function( err ) {} );
                            }
                        }
                        catch( ex2 )
                        {
                            ignore( ex2 );
                        }
                    }
                }
                catch( ex1 )
                {
                    ignore( ex1 );
                }
            }
        }
        catch( ex )
        {
            ignore( ex );
        }
    };

    class LogLevel
    {
        constructor( pName, pValue )
        {
            Object.defineProperty( this, "name",
                                   {
                                       configurable: false,
                                       writable: false,
                                       enumerable: false,
                                       value: ucase( asString( pName, true ) )
                                   } );

            Object.defineProperty( this, "value",
                                   {
                                       configurable: false,
                                       writable: false,
                                       enumerable: false,
                                       value: asInt( pValue )
                                   } );
        }

        isEnabled( pLogger, pFor = S_CONSOLE )
        {
            const logger = pLogger || {};

            let level = logger?.level?.value || 0;

            if ( pFor )
            {
                level = (logger?.levels?.[ucase( asString( pFor ) )]?.value || level) || LOG_LEVEL.ERROR;
            }

            return level >= this.value;
        }

        get token()
        {
            return (S_TOKEN_START + (this.name.toUpperCase()) + S_TOKEN_END).padEnd( 9, _spc );
        }

        makePrefix( pPrefix )
        {
            const prefix = asString( pPrefix, true ) || _mt_str;

            if ( prefix )
            {
                return this.token + " (" + prefix + ") -> ";
            }

            return this.token;
        }
    }

    LogLevel.NONE = Object.freeze( new LogLevel( "NONE", LOG_LEVEL.NONE ) );
    LogLevel.FATAL = Object.freeze( new LogLevel( "FATAL", LOG_LEVEL.FATAL ) );
    LogLevel.ERROR = Object.freeze( new LogLevel( "ERROR", LOG_LEVEL.ERROR ) );
    LogLevel.WARN = Object.freeze( new LogLevel( "WARN", LOG_LEVEL.WARN ) );
    LogLevel.INFO = Object.freeze( new LogLevel( "INFO", LOG_LEVEL.INFO ) );
    LogLevel.DEBUG = Object.freeze( new LogLevel( "DEBUG", LOG_LEVEL.DEBUG ) );
    LogLevel.TRACE = Object.freeze( new LogLevel( "TRACE", LOG_LEVEL.TRACE ) );
    LogLevel.ALL = Object.freeze( new LogLevel( "ALL", LOG_LEVEL.ALL ) );

    LogLevel.fromValue = function( pInt )
    {
        let val = Math.floor( pInt || 0 );

        if ( isNaN( val ) || !isFinite( val ) )
        {
            val = LogLevel.NONE;
        }

        switch ( val )
        {
            case LOG_LEVEL.NONE:
                return LogLevel.NONE;

            case LOG_LEVEL.FATAL:
                return LogLevel.FATAL;

            case LOG_LEVEL.ERROR:
                return LogLevel.ERROR;

            case LOG_LEVEL.WARN:
                return LogLevel.WARN;

            case LOG_LEVEL.INFO:
                return LogLevel.INFO;

            case LOG_LEVEL.DEBUG:
                return LogLevel.DEBUG;

            case LOG_LEVEL.TRACE:
                return LogLevel.TRACE;

            case LOG_LEVEL.ALL:
                return LogLevel.ALL;

            default:
                if ( val > LOG_LEVEL.TRACE )
                {
                    return LogLevel.ALL;
                }
                if ( val > LOG_LEVEL.DEBUG )
                {
                    return LogLevel.TRACE;
                }
                if ( val > LOG_LEVEL.INFO )
                {
                    return LogLevel.DEBUG;
                }
                if ( val > LOG_LEVEL.WARN )
                {
                    return LogLevel.INFO;
                }
                if ( val > LOG_LEVEL.ERROR )
                {
                    return LogLevel.WARN;
                }
                if ( val > LOG_LEVEL.FATAL )
                {
                    return LogLevel.ERROR;
                }
                if ( val > LOG_LEVEL.NONE )
                {
                    return LogLevel.FATAL;
                }
                return LogLevel.NONE;
        }
    };

    LogLevel.fromName = function( pName )
    {
        const nm = ucase( asString( _mt_str + (pName || _mt_str) ).toUpperCase() );

        const value = asInt( LOG_LEVEL[nm], 0 ) || 0;

        return LogLevel.fromValue( value ) || LogLevel.NONE;
    };

    LogLevel.from = function( pValue )
    {
        if ( _str === typeof pValue )
        {
            return LogLevel.fromName( pValue );
        }

        if ( _num === typeof pValue )
        {
            return LogLevel.fromValue( pValue );
        }

        return LogLevel.NONE;
    };

    const generateLogFileDirectory = function( opts )
    {
        let logDir = toUnixPath( (opts.rootDir || rootDir) + S_PATH_SEP + (opts.directory || S_LOG_DIR) + S_PATH_SEP ).trim();

        if ( _str === typeof logDir && !isBlank( asString( logDir, true ) ) )
        {
            logDir = asString( logDir, true ).trim();

            let exists;

            try
            {
                fs.accessSync( logDir, fs.constants.W_OK );

                exists = true;
            }
            catch( exAccess )
            {
                exists = false;

                try
                {
                    fs.mkdirSync( logDir, { recursive: true } );

                    exists = true;
                }
                catch( exMkDir )
                {
                    konsole.warn( S_ERR_MKDIR, logDir, exMkDir );
                }

                ignore( exAccess );
            }

            if ( !exists )
            {
                try
                {
                    fs.mkdirSync( logDir, { recursive: true } );

                    exists = true;
                }
                catch( exMkDir )
                {
                    konsole.warn( S_ERR_MKDIR, logDir, exMkDir );
                }
            }

            if ( !exists )
            {
                logDir = _mt_str;
            }
        }

        return toUnixPath( logDir || (rootDir + "/logs") );
    };

    function generateFilename( opts, type, sep, extension )
    {
        const now = new Date();

        const timestampOptions = opts?.timestampOptions || LOG_FILE_DEFAULTS.timestampOptions;

        let ts = makeTimestamp( now, timestampOptions );

        return (type || DEFAULT_LOG_TYPE) + sep + ts + ("." + (extension || S_LOG_EXT));
    }

    const generateLogFilePath = function( pOptions = LOG_FILE_DEFAULTS )
    {
        let opts = Object.assign( {}, LOG_FILE_DEFAULTS || {} );
        opts = Object.assign( opts, pOptions || LOG_FILE_DEFAULTS || {} );

        const currentFilePath = opts.currentFilePath || opts.currentFilename;
        const currentFilename = opts.currentFilename || opts.currentFilePath;

        const extension = (_mt_str + (opts?.extension || S_LOG_EXT)).replace( /^\.+/, _mt_str );

        const type = (_mt_str + (opts?.cfg || DEFAULT_LOG_TYPE)).trim();

        const sep = (_mt_str + (opts?.separator || ".")).trim();

        const logDir = generateLogFileDirectory( opts );

        const directory = _mt_str === logDir ? _mt_str : (logDir + S_PATH_SEP);

        let filename = generateFilename( opts, type, sep, extension );

        let filepath = toUnixPath( directory + filename ).trim();

        if ( filepath === currentFilePath || filename === currentFilePath || filename === currentFilename )
        {
            let now = new Date().getTime();

            let midnight = new Date().setHours( TIME_ELEVEN_PM, TIME_LAST_MINUTE_OR_SECOND, TIME_LAST_MINUTE_OR_SECOND, TIME_LAST_MILLISECOND );

            if ( midnight - now <= 10_000 )
            {
                const timestampOptions = opts?.timestampOptions || LOG_FILE_DEFAULTS.timestampOptions;

                const timestamp = makeTimestamp( new Date( midnight + 10_001 ), timestampOptions );

                filename = (type || DEFAULT_LOG_TYPE) + sep + timestamp + ("." + (extension || S_LOG_EXT));
            }

            filepath = toUnixPath( directory + filename ).trim();
        }

        return filepath;
    };

    class DefaultEncrypter
    {
        constructor( pDelegate )
        {
            this._delegate = pDelegate;
        }

        encode( pContent )
        {
            if ( this._delegate && isFunction( this._delegate?.encode ) )
            {
                return this._delegate.encode( pContent );
            }

            let chars = pContent.split( _mt_chr );
            let content = _mt_str;

            for( let i = 0, n = chars?.length; i < n; i++ )
            {
                const chrCode = chars[i].charCodeAt( 0 );

                if ( chrCode < MAX_ASCII_CODEPOINT )
                {
                    content += String.fromCharCode( chrCode + 1 );
                }
            }

            return content + "\n-- \n";
        }

        decode( pContent )
        {
            // NOPE; not here
        }
    }

    class Logger
    {
        constructor( pOptions = LOG_FILE_DEFAULTS )
        {
            this._options = Object.assign( {}, LOG_FILE_DEFAULTS || {} );
            this._options = Object.assign( this._options, pOptions || LOG_FILE_DEFAULTS || {} );

            this._daysToRetainLogs = this._calculateRetentionPolicy();

            this._console = this._options.rootLogger || konsole;

            this._echo = !(this._console === console || this._console === konsole) && toBool( this._options.echo );

            this._directory = generateLogFileDirectory( this._options?.directory || S_LOG_DIR ) || (this._options?.directory || S_LOG_DIR);

            this._filename = generateFilename( this._options, (this._options?.cfg || DEFAULT_LOG_TYPE), (this._options?.separator || "."), ((_mt_str + (this._options?.extension || S_LOG_EXT)).replace( /^\.+/, _mt_str )) ) || this._options?.filename;

            this._filepath = generateLogFilePath( this._options ) || toUnixPath( this.directory + this.filename );

            this._remoteUrl = asString( tidy( this._options.remoteUrl ) || tidy( this._options.remoteLoggingUrl ), true );

            this._level = LogLevel.from( this._options.level );

            this._levels =
                {
                    [S_CONSOLE]: LogLevel.from( this._options?.levels?.[S_CONSOLE] ) || this._level,
                    [S_FILE]: LogLevel.from( this._options?.levels?.[S_FILE] ) || this._level,
                    [S_DATABASE]: LogLevel.from( this._options?.levels?.[S_DATABASE] ) || this._level
                };

            this._prefix = this._options.prefix || _mt_str;

            this._map = {};

            this._variables = [];

            this._verbose = this._options?.verbose || this._console?.verbose || konsole?.verbose;

            this.fs = fs;

            this._options.currentFilename = this._options.currentFilePath = toUnixPath( asString( this._filepath, true ).trim() );

            this._options = Object.freeze( this._options );

            this._refreshInterval = dateUtils.MILLIS_PER.DAY;

            this._stream = this._open();

            this.initializeRotation();
        }

        get options()
        {
            return Object.freeze( Object.assign( {}, this._options || {} ) );
        }

        get daysToRetainLogs()
        {
            return this._calculateRetentionPolicy( this._daysToRetainLogs );
        }

        set daysToRetainLogs( pDays )
        {
            this._daysToRetainLogs = this._calculateRetentionPolicy( pDays );
        }

        get directory()
        {
            if ( !isBlank( asString( this._directory, true ) ) )
            {
                return toUnixPath( this._directory + S_PATH_SEP );
            }
            return S_LOG_DIR;
        }

        get filename()
        {
            if ( !isBlank( asString( this._filename, true ) ) )
            {
                return toUnixPath( asString( this._filename, true ).replace( /^[\r\n\/\\ +?&=]/, _mt_str ) ).trim();
            }
            return generateFilename( this.options, (this.options.type || "dev"), (this.options.separator || _dot), (this.options.extension || ".log") );
        }

        get filepath()
        {
            if ( !isBlank( this._filepath ) )
            {
                return toUnixPath( asString( this._filepath, true ) );
            }

            this._filepath = toUnixPath( this.directory + this.filename );

            return this._filepath;
        }

        _calculateRetentionPolicy( pDaysToRetain )
        {
            let days = asInt( pDaysToRetain, 0 ) ||
                       asInt( this.options?.daysToRetainLogs, 0 ) ||
                       asInt( this.options?.days_to_retain_logs, 0 ) || 0;

            const maxDays = Math.min( 1_826, MAXIMUM_DAYS_LOG_FILE_RETENTION );
            const minDays = Math.max( 0, MINIMUM_DAYS_LOG_FILE_RETENTION );

            return Math.min( maxDays, Math.max( minDays, days ) );
        }

        get level()
        {
            return this._level;
        }

        get levels()
        {
            return Object.freeze( Object.assign( {}, this._levels ) );
        }

        get remoteUrl()
        {
            return this._remoteUrl || _mt_str;
        }

        set level( pLevel )
        {
            this._level = pLevel instanceof LogLevel ? pLevel : LogLevel.from( pLevel );
        }

        initializeRotation()
        {
            let now = new Date();

            let midnight = new Date().setHours( TIME_ELEVEN_PM, TIME_LAST_MINUTE_OR_SECOND, TIME_LAST_MINUTE_OR_SECOND, TIME_LAST_MILLISECOND );

            let firstInterval = (midnight - now);

            const me = this;

            const rotationFunction = async function() { await (me || this).rotateLogFile( { thiz: me, dis: this } ); };

            this._timerId = setTimeout( rotationFunction, firstInterval );
        }

        formatMessage( pMsg, pMap, ...pData )
        {
            let msg = asString( pMsg );

            msg = replaceMappedPlaceholders( msg, pMap || pData );

            return replaceIndexPlaceholders( msg, ...pData );
        }

        generateLogName( pOptions = LOG_FILE_DEFAULTS )
        {
            let options = Object.assign( {}, LOG_FILE_DEFAULTS || {} );
            options = Object.assign( options, pOptions || this.options || LOG_FILE_DEFAULTS || {} );

            return generateLogFilePath( options );
        }

        get timerId()
        {
            return this._timerId || 0;
        }

        get refreshInterval()
        {
            return this._refreshInterval || dateUtils.MILLIS_PER.DAY;
        }

        async deleteOldLogFiles( pOptions )
        {
            let options = Object.assign( {}, LOG_FILE_DEFAULTS || {} );
            options = Object.assign( options, this.options || {} );
            options = Object.assign( options, (pOptions || this.options || LOG_FILE_DEFAULTS || {}) );

            const me = options.thiz || options.dis || this;

            const daysRetention = this._calculateRetentionPolicy() || DEFAULT_DAYS_LOG_FILE_RETENTION;

            const cutoffDate = new Date( (new Date().getTime()) - (dateUtils.MILLIS_PER.DAY * daysRetention) );

            let numFilesDeleted = 0;

            try
            {
                const dirs = fs.readdirSync( toUnixPath( this.directory ), {
                    withFileTypes: true,
                    recursive: true,
                    encoding: "utf-8"
                } );

                const processOldLogs = async function( pDirs )
                {
                    if ( pDirs )
                    {
                        let filesToDelete = [];

                        let files = pDirs;

                        for( let i = 0, n = (files?.length || 0); i < n; i++ )
                        {
                            let entry = files[i];

                            if ( entry && entry.isFile() )
                            {
                                const filepath = toUnixPath( entry.path + S_PATH_SEP + entry.name );

                                const stats = await fsAsync.stat( filepath );

                                const lastModified = new Date( stats.mtimeMs );

                                if ( lastModified < cutoffDate )
                                {
                                    filesToDelete.push( filepath );
                                }
                            }
                        }

                        for( let i = 0, n = filesToDelete?.length || 0; i < n; i++ )
                        {
                            const filename = filesToDelete[i];

                            try
                            {
                                await fsAsync.rm( filename );

                                await me.info( "Deleted log, " + filename + ", as per retention policy" );

                                numFilesDeleted += 1;
                            }
                            catch( ex )
                            {
                                me.error( ex ).then( no_op ).catch( catchHandler );
                            }
                        }
                    }
                };

                if ( dirs && dirs?.length )
                {
                    me.info( "Searching for expired log files" );

                    processOldLogs( dirs ).then( no_op ).catch( catchHandler );
                }
            }
            catch( ex )
            {
                me.error( ex ).then( no_op ).catch( catchHandler );
            }

            return numFilesDeleted;
        }

        async rotateLogFile( pOptions = LOG_FILE_DEFAULTS )
        {
            let options = Object.assign( {}, LOG_FILE_DEFAULTS || {} );
            options = Object.assign( options, this.options || {} );
            options = Object.assign( options, (pOptions || this.options || LOG_FILE_DEFAULTS || {}) );

            const me = options.thiz || options.dis || this;

            await me.info( "Rotating Log File..." );

            me._close();

            me._filename = me.generateLogName( options );

            me._open();

            const rotationHandler = function() { me.rotateLogFile( { thiz: (me || this), dis: this || me } ); };

            me._timerId = setTimeout( rotationHandler, this.refreshInterval );

            try
            {
                await me.deleteOldLogFiles( options ).then( ( pNum ) => 
                    { 
                        me.info( "Removed", asString( (asInt( pNum || 0 ) || 0), true ), ("stale log file" + ((asInt( pNum || 0 ) || 0) === 1 ? "" : "s")) );
                    } ).catch( catchHandler );
            }
            catch( ex )
            {
                me.error( me.err( ex ) ).then( no_op ).catch( catchHandler );
            }
        }

        set prefix( pPrefix )
        {
            this._prefix = pPrefix || _mt_str;
        }

        get prefix()
        {
            return this._prefix || _mt_str;
        }

        get map()
        {
            return this._map || {};
        }

        get variables()
        {
            return this._variables || [];
        }

        get timestamp()
        {
            return makeTimestamp( new Date() );
        }

        get verbose()
        {
            return this._verbose || this._console?.verbose || konsole?.verbose;
        }

        isOpen()
        {
            return null != this._stream;
        }

        _close()
        {
            if ( this._stream )
            {
                this._stream.end();
                this._stream = null;
            }
        }

        async closeLogFile()
        {
            this._close();
        }

        isClosed()
        {
            return null == this._stream;
        }

        _open()
        {
            if ( this.filepath )
            {
                if ( this.isOpen() )
                {
                    return this._stream;
                }

                const FS = (this.fs || fs || (_isNodeJs ? ((isFunction( require ) ? require : $scope()?.require) || $scope()?.require)( "fs" ) : {}));

                this._stream = FS.createWriteStream( this.filepath, { flags: "a" } );

                if ( this.isOpen() )
                {
                    this.info( S_LOGGING_TO + this.filepath ).then( no_op ).catch( catchHandler );
                }
            }

            return this._stream;
        }

        async openLogFile()
        {
            if ( this.filepath )
            {
                if ( this.isOpen() )
                {
                    return this._stream;
                }

                const FS = (this.fs || fs || (_isNodeJs ? ((isFunction( require ) ? require : $scope()?.require) || $scope()?.require)( "fs" ) : {}));

                this._stream = FS.createWriteStream( this.filepath, { flags: "a" } );

                await this.info( S_LOGGING_TO + this.filepath );
            }

            return this._stream;
        }

        get echoToConsole()
        {
            return toBool( this._echo );
        }

        set echoToConsole( pEcho )
        {
            this._echo = toBool( ( !(this._console === console || this._console === konsole) && pEcho) );
        }

        async echo( pMethod, ...pData )
        {
            if ( this.echoToConsole )
            {
                const method = console[pMethod || M_LOG];

                if ( method )
                {
                    method( ...pData );
                }
            }
        }

        err( pError )
        {
            if ( pError && this.verbose )
            {
                return pError;
            }

            return pError?.message || pError;
        }

        ignore()
        {
            return true;
        }

        prependPrefix( pMethod, pPrefix, pData )
        {
            const method = ucase( asString( pMethod, true ) ).trim();

            const level = LogLevel.from( method );

            const prefix = level.makePrefix( pPrefix );

            let data = [].concat( forceToArray( pData || [] ) ) || [];

            data.unshift( prefix, this.timestamp, " -> " );
            data.push( "\n" );

            return data;
        }

        async _writeEvent( ...pData )
        {
            const data = [].concat( ...(pData || []) );

            if ( !isWindows || (null == data || data.length <= 0) )
            {
                return;
            }

            (async function( pSource )
            {
                try
                {
                    writeToEventLog( (pSource || this.source || S_EVENT_SOURCE), ...data ).then( no_op ).catch( catchHandler );
                }
                catch( ex )
                {
                    console.error( ex.message );
                }
            }( this.source || S_EVENT_SOURCE )).then( no_op ).catch( catchHandler );
        }

        async _writeToFile( pLevel, ...pData )
        {
            if ( this._filepath )
            {
                const me = this;

                const data = [].concat( ...(pData || []) );

                if ( null == data || data.length <= 0 )
                {
                    return false;
                }

                const content = this.prepareContent( S_FILE, ...pData );

                if ( content )
                {
                    (async function( pContent )
                    {
                        let content = asString( pContent );

                        if ( content )
                        {
                            const stream = me.isOpen() ? me._stream : await me.openLogFile();

                            stream.write( content + _lf );
                        }

                        return true;

                    }( content )).then( no_op );
                }
            }

            return true;
        }

        async _log( pMethod, pPrefix, pMap, pValues, ...pData )
        {
            let data = pruneArray( [].concat( forceToArray( pData ) ) );

            if ( null == data || ((data?.length || 0) <= 0) )
            {
                return pData;
            }

            let method = lcase( asString( pMethod, true ) || M_LOG );

            const methodLevel = LogLevel.from( method );

            if ( !(methodLevel.isEnabled( this, S_CONSOLE ) || methodLevel.isEnabled( this, S_FILE ) || methodLevel.isEnabled( this, S_DATABASE ) || methodLevel.isEnabled( this )) )
            {
                return pData;
            }

            const thiz = this;

            const logMethod = lcase( method );

            let prefix = asString( pPrefix, true ) || _mt_str;

            let map = pMap instanceof Map ? pMap : (isPopulated( pMap ) ? new Map( Object.entries( pMap ) ) : {});
            let values = [].concat( forceToArray( pValues || [] ) );

            data = data.map( e => this.formatMessage( e, map, values ) );
            data = this.prependPrefix( method, prefix, data );

            if ( (methodLevel.isEnabled( this, S_CONSOLE )) || this.echoToConsole )
            {
                try
                {
                    this._console[logMethod]( ...data );
                }
                catch( ex )
                {
                    console.error( ex );
                }

                if ( this.echoToConsole )
                {
                    try
                    {
                        konsole[logMethod]( ...data );
                    }
                    catch( ex )
                    {
                        console.error( ex );
                    }
                }
            }

            if ( methodLevel.isEnabled( this, S_FILE ) )
            {
                let me = thiz || this;

                (async function()
                {
                    me._writeToFile( method, ...data ).then( no_op ).catch( catchHandler );
                    me = null;
                }()).then( no_op ).catch( catchHandler );

                if ( methodLevel.isEnabled( this, S_EVENT_LOG ) && this.writeEvents )
                {
                    let me = this;

                    (async function()
                    {
                        me._writeEvent( ...data ).then( no_op ).catch( catchHandler );
                        me = null;
                    }()).then( no_op ).catch( catchHandler );
                }
            }

            return data || [];
        }

        async log( ...pData )
        {
            let data = pruneArray( [].concat( forceToArray( pData ) ) );

            if ( null != data && ((data?.length || 0) > 0) )
            {
                this._log( M_LOG, this.prefix, this.map, this.variables, ...pData ).then( no_op ).catch( catchHandler );
            }
        }

        async info( ...pData )
        {
            let data = pruneArray( [].concat( forceToArray( pData ) ) );

            if ( null != data && ((data?.length || 0) > 0) )
            {
                this._log( M_INFO, this.prefix, this.map, this.variables, ...pData ).then( no_op ).catch( catchHandler );
            }
        }

        async warn( ...pData )
        {
            let data = pruneArray( [].concat( forceToArray( pData ) ) );

            if ( null != data && ((data?.length || 0) > 0) )
            {
                this._log( M_WARN, this.prefix, this.map, this.variables, ...pData ).then( no_op ).catch( catchHandler );
            }
        }

        async error( ...pData )
        {
            let data = pruneArray( [].concat( forceToArray( pData ) ) );

            if ( null != data && ((data?.length || 0) > 0) )
            {
                this._log( M_ERROR, this.prefix, this.map, this.variables, ...pData ).then( no_op ).catch( catchHandler );
            }
        }

        async debug( ...pData )
        {
            let data = pruneArray( [].concat( forceToArray( pData ) ) );

            if ( null != data && ((data?.length || 0) > 0) )
            {
                this._log( M_DEBUG, this.prefix, this.map, this.variables, ...pData ).then( no_op ).catch( catchHandler );
            }
        }

        async trace( ...pData )
        {
            if ( this.verbose )
            {
                let data = pruneArray( [].concat( forceToArray( pData ) ) );

                if ( null != data && ((data?.length || 0) > 0) )
                {
                    await this._log( M_TRACE, this.prefix, this.map, this.variables, ...pData );
                }
            }
        }

        prepareContent( pFor, ...pData )
        {
            const data = forceToArray( pData );

            if ( data && data?.length )
            {
                return data.join( _spc );
            }

            return _mt_str;
        }
    }

    class EncryptingLogger extends Logger
    {
        constructor( pPrefix, pEncoder, pOptions = LOG_FILE_DEFAULTS )
        {
            super( pOptions );

            this._encrypter = pEncoder || this.options?.securityHandler || this.options?.encrypter || new DefaultEncrypter( pOptions );

            if ( !isFunction( this._encrypter?.encode ) )
            {
                let candidates = [pEncoder, this.options?.securityHandler, this.options?.encrypter, new DefaultEncrypter( pOptions )];

                while ( !isFunction( this._encrypter?.encode ) && candidates.length > 0 )
                {
                    this._encrypter = candidates.shift();
                }
            }
        }

        get encrypter()
        {
            this._encrypter = this._encrypter || new DefaultEncrypter( this.options );

            return this._encrypter || new DefaultEncrypter( this.options );
        }

        prepareContent( pFor, ...pData )
        {
            let content = super.prepareContent( pFor, ...pData );

            switch ( pFor )
            {


                default:
                    content = this.encrypter.encode( content );
                    break;
            }

            return content;
        }
    }

    class LoggerFactory
    {
        constructor( pOptions = LOG_FILE_DEFAULTS )
        {
            this._options = Object.assign( {}, LOG_FILE_DEFAULTS || {} );
            this._options = Object.assign( this._options, pOptions || LOG_FILE_DEFAULTS || {} );
            this._options = Object.freeze( this._options );

            this.loggers = {};
        }

        get options()
        {
            return Object.freeze( Object.assign( {}, this._options ) );
        }

        findDefaultLogger( pOptions = LOG_FILE_DEFAULTS )
        {
            const scp = $scope() || (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));

            const useEncryption = pOptions?.encodeContent || pOptions?.encryptContent || null != pOptions?.encoder;

            let logger = scp[S_GLOBAL_PROPERTY] || scp?.defaultLogger || (useEncryption ? new EncryptingLogger( pOptions?.prefix, pOptions?.encoder, pOptions ) : new Logger( pOptions ));

            if ( null == logger )
            {
                logger = useEncryption ?
                         new EncryptingLogger( pOptions?.prefix, pOptions?.encoder, pOptions ) :
                         new Logger( pOptions );

                if ( logger )
                {
                    (logger || this.loggers[S_GLOBAL_PROPERTY]).info( S_LOGGER_INITIALIZED ).then( no_op ).catch( catchHandler );
                }

                logger._open();
            }

            this.loggers[S_GLOBAL_PROPERTY] = logger || this.loggers[S_GLOBAL_PROPERTY];

            return logger;
        }

        async findGlobalLogger( pOptions = LOG_FILE_DEFAULTS )
        {
            const defaultLogger = this.findDefaultLogger( pOptions );

            if ( !defaultLogger.isOpen() )
            {
                await defaultLogger.openLogFile();
            }

            return defaultLogger;
        }

        async findOrCreateLogger( pPrefix, pEncoder, pOptions )
        {
            const options = Object.assign( {}, pOptions || LOG_FILE_DEFAULTS || {} );

            const key = ucase( asString( pPrefix, true ).trim() );

            options.prefix = pPrefix;

            const useEncryption = pOptions?.encodeContent || pOptions?.encryptContent || null != pOptions?.encoder;

            let logger = this.loggers[key] || (useEncryption ?
                                               new EncryptingLogger( pPrefix, pEncoder, options ) :
                                               new Logger( options ));

            if ( null == logger || logger.isClosed() )
            {
                logger = new Logger( options );
            }

            this.loggers[key] = logger;

            return logger;
        }

        async createLogger( pOptions )
        {
            let options = Object.assign( {}, LOG_FILE_DEFAULTS || {} );
            options = Object.assign( options, pOptions || LOG_FILE_DEFAULTS || {} );

            const key = ucase( asString( options.prefix, true ) || ucase( asString( options.key, true ) ) );

            let logger;

            const loggerClass = options.loggerClass;

            if ( !objectUtils.isUndefined( loggerClass ) && objectUtils.isClass( loggerClass ) )
            {
                logger = new loggerClass( options );
            }
            else
            {
                const useEncryption = pOptions?.encodeContent || pOptions?.encryptContent || null != pOptions?.encoder;

                logger = (useEncryption ?
                          new EncryptingLogger( options?.prefix || options.key, options.encoder, options ) :
                          new Logger( options ));
            }

            this.loggers[key] = logger;

            return logger;
        }

        closeLoggers()
        {
            let loggers = this.loggers;

            const entries = Object.entries( loggers || {} );

            let keys = [];

            if ( loggers && (entries?.length || 0) > 0 )
            {
                for( let entry of entries )
                {
                    let key = entry[0];
                    let logger = entry[1];

                    if ( logger && isFunction( logger._close ) )
                    {
                        try
                        {
                            logger._close();
                            keys.push( key );
                        }
                        catch( ex )
                        {
                            console.error( ex );
                        }
                    }
                }
            }

            for( let key of keys )
            {
                this.loggers = objectUtils.removeProperty( this.loggers, key );
            }
        }
    }

    const DEFAULT_FACTORY = new LoggerFactory();

    let mod =
        {
            Logger,
            LogLevel,
            EncryptingLogger,
            LoggerFactory,
            LOG_FILE_DEFAULTS: Object.freeze( Object.assign( {}, LOG_FILE_DEFAULTS ) ),
            DEFAULT_FACTORY,
            findGlobalLogger: async function( pOptions = LOG_FILE_DEFAULTS )
            {
                return await DEFAULT_FACTORY.findGlobalLogger( pOptions );
            },
            findDefaultLogger: function( pOptions = LOG_FILE_DEFAULTS )
            {
                return DEFAULT_FACTORY.findDefaultLogger( pOptions );
            },
            findOrCreateLogger: async function( pPrefix, pEncoder, pOptions )
            {
                return await DEFAULT_FACTORY.findOrCreateLogger( pPrefix, pEncoder, pOptions );
            },
            createLogger: async function( pOptions )
            {
                return await DEFAULT_FACTORY.createLogger( pOptions );
            },
            closeLoggers: function( pLoggers )
            {
                DEFAULT_FACTORY.closeLoggers();

                if ( pLoggers )
                {
                    switch ( typeof pLoggers )
                    {
                        case _ud:
                            break;

                        case _obj:
                            let entries = pLoggers;

                            if ( objectUtils.isArray( pLoggers ) )
                            {
                                entries = forceToArray( pLoggers );
                            }

                            entries = Object.entries( pLoggers );

                            for( let entry of entries )
                            {
                                const logger = ((entry?.length || 0) > 1) ? entry[1] : entry;

                                if ( logger && (isFunction( logger?._close ) || isFunction( logger.close )) )
                                {
                                    try
                                    {
                                        (logger._close || logger.close)();
                                    }
                                    catch( ex )
                                    {
                                        console.error( ex );
                                    }
                                }
                            }
                    }
                }
            },
            DEFAULT_DAYS_LOG_FILE_RETENTION,
            DEFAULT_SOURCE,
            DEFAULT_LOG_TYPE,
            MAXIMUM_DAYS_LOG_FILE_RETENTION,
            MINIMUM_DAYS_LOG_FILE_RETENTION,
            OPERATING_SYSTEM,
            isWindows,
            isNodeJs: function()
            {
                return _isNodeJs;
            },
            GLOBAL_KEY: S_GLOBAL_PROPERTY,
            containsPlaceholders,
            replaceIndexPlaceholders,
            replaceMappedPlaceholders,
            writeToEventLog,
            makeTimestamp,
            ignore,
            err
        };

    if ( _ud !== typeof module )
    {
        try
        {
            module.exports = Object.freeze( mod );
        }
        catch( ex )
        {
            konsole.warn( ex.message );
        }

    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
