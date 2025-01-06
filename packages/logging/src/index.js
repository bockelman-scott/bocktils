const core = require( "@toolbocks/core" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined" } = constants;

const konsole = console;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__LOGGING_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import this module<br>
     * and then import or use the other utilities<br>
     * as properties of this module.
     * <br>
     * @dict
     * @type {Object}
     * @alias module:ArrayUtils#dependencies
     */
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils
        };

    const {
        classes,
        _mt_str,
        _spc,
        _comma,
        _num,
        _obj,
        _fun,
        _lf,
        _crlf,
        lock,
        funcAsString,
        populateOptions,
        _defaultLocaleString = "en-US",
        S_ERROR = "error",
        no_op,
        ignore,
        resolveError
    } = constants;

    const { ModuleEvent, ModulePrototype, StatefulListener } = classes;

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

    const { isNull, isString, isNumeric, isNumber, isObject, isFunction, isDate } = typeUtils;

    const { asString, asInt, isBlank, lcase, ucase, trimLeadingCharacters } = stringUtils;

    const { asArray, varargs, Filters, concatenateConsecutiveStrings } = arrayUtils;


    const modulePrototype = new ModulePrototype( "LoggingUtils", INTERNAL_NAME );

    class LogLevel
    {
        #id;
        #name;

        constructor( pId, pName )
        {
            this.#id = isNumeric( pId ) ? asInt( pId ) : 0;
            this.#name = lcase( asString( pName, true ) );

            LogLevel.CACHE[this.#id] = this;
            LogLevel.CACHE[this.#name] = this;
        }

        get id() { return this.#id; }

        get name() { return this.#name; }

        toString() { return this.#name; }

        [Symbol.toPrimitive]( hint )
        {
            return this.#name;
        }

        [Symbol.toStringTag]()
        {
            return this.#name;
        }

        equals( pLevel )
        {
            if ( pLevel instanceof this.constructor )
            {
                return this.#id === pLevel.id || this.#name === pLevel.name;
            }

            if ( isNumeric( pLevel ) )
            {
                return this.#id === asInt( pLevel );
            }

            if ( isString( pLevel ) )
            {
                return this.#name === lcase( asString( pLevel, true ) );
            }
        }

        isLessThan( pLevel )
        {
            return this.compareTo( pLevel ) < 0;
        }

        isGreaterThan( pLevel )
        {
            return this.compareTo( pLevel ) > 0;
        }

        compareTo( pLevel )
        {
            const other = (pLevel instanceof this.constructor) ? pLevel : (LogLevel.getLevel( pLevel ) || isNumeric( pLevel ) ? asInt( pLevel ) : pLevel);

            if ( other instanceof this.constructor )
            {
                return this.#id < other.id ? -1 : (this.#id > other.id ? 1 : 0);
            }
            else if ( isNumber( other ) )
            {
                return this.#id < other ? -1 : (this.#id > other ? 1 : 0);
            }

            return 1;
        }

        isEnabled( pLevel )
        {
            return this.compareTo( pLevel ) <= 0;
        }
    }

    LogLevel.CACHE = {};

    LogLevel.getLevel = function( pIdOrName )
    {
        return (pIdOrName instanceof LogLevel) ? pIdOrName : (LogLevel.CACHE[pIdOrName] || LogLevel.CACHE[lcase( asString( pIdOrName, true ) )]);
    };

    LogLevel.ALL = lock( new LogLevel( Number.MAX_SAFE_INTEGER, "ALL" ) );
    LogLevel.ERROR = lock( new LogLevel( 200, "ERROR" ) );
    LogLevel.WARN = lock( new LogLevel( 300, "WARN" ) );
    LogLevel.INFO = lock( new LogLevel( 400, "INFO" ) );
    LogLevel.DEBUG = lock( new LogLevel( 500, "DEBUG" ) );
    LogLevel.TRACE = lock( new LogLevel( 600, "TRACE" ) );
    LogLevel.OFF = lock( new LogLevel( 0, "OFF" ) );
    LogLevel.NONE = lock( LogLevel.OFF );

    function resolveSource( pSource )
    {
        if ( isString( pSource ) )
        {
            return asString( pSource, true );
        }

        switch ( typeof pSource )
        {
            case _obj:
                if ( isNull( pSource ) )
                {
                    return _mt_str;
                }

                return {}.toString.call( pSource, pSource ) || asString( pSource, true );

            case _fun:
                return pSource?.name || funcAsString( pSource );

            case _num:
                return asString( pSource );

            default:
                return _mt_str;
        }


        // : isNull( pSource ) ? _mt_str : pSource;
    }

    class LogRecord
    {
        #timestamp;

        #level = LogLevel.INFO;

        #source = _mt_str;
        #error = null;
        #message = _mt_str;

        #data = [];

        constructor( pLevel, pMessage, pError, pSource, ...pData )
        {
            this.#timestamp = new Date();

            this.#level = pLevel instanceof LogLevel ? pLevel : LogLevel.getLevel( pLevel ) || LogLevel.INFO;

            this.#message = asString( pMessage );

            this.#error = resolveError( pError, this.#message );

            this.#source = resolveSource( pSource );

            this.#data = asArray( varargs( ...pData ) );
        }

        get timestamp()
        {
            return this.#timestamp;
        }

        get level()
        {
            this.#level = (this.#level instanceof LogLevel) ? this.#level : LogLevel.getLevel( this.#level ) || LogLevel.INFO;
            return this.#level;
        }

        get source()
        {
            return this.#source;
        }

        get error()
        {
            return this.#error;
        }

        get stackTrace()
        {
            return this.error?.stackTrace || this.error?.stack || null;
        }

        get stack()
        {
            let s = _mt_str;

            if ( isObject( this.stackTrace ) && !isNull( this.stackTrace ) )
            {
                s = asString( this.stackTrace.stack || this.error?.stack || _mt_str );
            }
            else if ( isString( this.stackTrace ) )
            {
                s = asString( this.stackTrace );
            }

            s = s.replace( this.error?.message || _mt_str, _mt_str );
            s = s.replace( /^Error:\s*/, _mt_str );

            return trimLeadingCharacters( trimLeadingCharacters( s, _crlf, _mt_str ), _lf, _mt_str );
        }

        get message()
        {
            return this.#message;
        }

        get data()
        {
            return asArray( this.#data );
        }

        format( pFormatter )
        {
            if ( pFormatter instanceof LogFormatter || isFunction( pFormatter?.format ) )
            {
                return pFormatter.format( this );
            }

            return [
                this.timestamp,
                (this.level?.name || this.level),
                this.message,
                this.source,
                this.error,
                (this.stack || this.error?.stack),
                this.error?.message,
                ...this.data];
        }

        toString()
        {
            return this.format( {} ).join( _lf );
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

    const DEFAULT_TEMPLATE = `[{level}] - [{timestamp}] - [{source}]: {message}`;
    const DEFAULT_ERROR_TEMPLATE = `{errorName}: {errorMessage}{stackTrace}`;

    /**
     * @typedef {Object} LogFormatterOptions
     *
     * @property {string} [template=DEFAULT_TEMPLATE] A string to use as a template when writing a LogRecord.<br>
     *                                                <br>
     *                                                <b>Unlike a template string literal, this cannot contain the normal ${} style tokens.</b>
     *                                                <br>
     *                                                <br>Instead use {variableName} or {argumentPosition}</b>
     *                                                <br>
     *                                                The string will be interpolated in a function
     *                                                in which the following variables will be defined
     *                                                and passed in the following order:<br>
     *                                                timestamp - the formatted DateTime<br>
     *                                                level - the level of the LogRecord<br>
     *                                                message - the message to be logged (not necessarily the same as an error message)<br>
     *                                                source - a string describing the context in which the log message was generated (or the error occurred)
     *
     * @property {string} [errorTemplate=DEFAULT_ERROR_TEMPLATE] A string to use as a template
     *                                                           when writing the error information
     *                                                           from the LogRecord, if there is one.<br>
     *                                                           <br>
     *                                                           <b>Unlike a template string literal, this cannot contain the normal ${} style tokens.</b>
     *                                                           <br>
     *                                                           <br>Instead use {variableName} or {argumentPosition}</b>
     *                                                           <br>
     *                                                           The string will be interpolated in a function
     *                                                           in which the following variables will be defined
     *                                                           and passed in the following order:<br>
     *                                                           errorName - the type or name of the error, if there is an error associated with the LogRecord<br>
     *                                                           errorMessage - the error.message, if there is an error associated with the LogRecord<br>
     *                                                           stackTrace - the error.stack, if there is an error associated with the LogRecord<br>
     *
     *
     * @property {boolean} [includeStackTrace=true] When the LogRecord includes an error,
     *                                              this property determines whether the stack trace will be logged.<br>
     *
     * @property {Object|function(Date):string} [dateFormatter=null] An object or function
     *                                                               that will format the timestamp if supplied.<br>
     *                                                               <br>
     *                                                               By default, the timestamp will be formatted
     *                                                               by calling the Date's #toLocaleString method.<br>
     *
     * @property {string|Intl.Locale} [locale=en-US] The Locale to use when formatting the timestamp.<br>
     */

    const DEFAULT_LOG_FORMATTER_OPTIONS =
        {
            template: DEFAULT_TEMPLATE,
            errorTemplate: DEFAULT_ERROR_TEMPLATE,
            includeStackTrace: true,
            dateFormatter: null,
            locale: _defaultLocaleString
        };

    class LogFormatter
    {
        #options;

        #locale;

        #template = DEFAULT_TEMPLATE;
        #errorTemplate = DEFAULT_ERROR_TEMPLATE;

        #includeStackTrace = true;

        #dateFormatter;

        constructor( pOptions = DEFAULT_LOG_FORMATTER_OPTIONS )
        {
            const options = populateOptions( pOptions, DEFAULT_LOG_FORMATTER_OPTIONS );

            this.#options = options;

            this.#template = options.template || DEFAULT_TEMPLATE;
            this.#errorTemplate = options.errorTemplate || DEFAULT_ERROR_TEMPLATE;
            this.#includeStackTrace = !!options?.includeStackTrace;
            this.#dateFormatter = options?.dateFormatter;

            this.#locale = options?.locale instanceof Intl.Locale ? options.locale : new Intl.Locale( options?.locale || _defaultLocaleString );
        }

        get options()
        {
            return populateOptions( this.#options, DEFAULT_LOG_FORMATTER_OPTIONS );
        }

        get locale()
        {
            return this.#locale;
        }

        get template()
        {
            return this.#template || DEFAULT_TEMPLATE;
        }

        get errorTemplate()
        {
            return this.#errorTemplate || DEFAULT_ERROR_TEMPLATE;
        }

        get includeStackTrace()
        {
            return !!this.#includeStackTrace;
        }

        get dateFormatter()
        {
            this.#dateFormatter = (this.#dateFormatter ||
                {
                    format: ( pDate ) => pDate.toLocaleString( [this.locale] )
                });

            if ( isFunction( this.#dateFormatter?.format ) )
            {
                return this.#dateFormatter;
            }
            else if ( isFunction( this.#dateFormatter ) )
            {
                this.#dateFormatter = { format: this.#dateFormatter };
            }

            return this.#dateFormatter || {
                format: ( pDate ) => pDate.toLocaleString( [this.locale] )
            };
        }

        _populateTemplate( pTimestamp, pLevel, pMessage, pSource )
        {
            let timestamp = asString( isDate( pTimestamp ) ? this.dateFormatter.format( pTimestamp ) : pTimestamp, true );

            let level = ucase( isString( pLevel ) ? asString( pLevel, true ) : pLevel?.name || asString( pLevel, true ) );

            let message = asString( pMessage, true );

            let source = asString( pSource, true );

            let template = this.template.replaceAll( "{timestamp}", timestamp ).replaceAll( "{0}", timestamp );

            if ( !isBlank( level ) )
            {
                template = template.replaceAll( "{level}", level ).replaceAll( "{1}", level );
            }
            else
            {
                template = template.replaceAll( /\[?\{level}]?/g, _mt_str ).replaceAll( /\[?\{1}]?/g, level );
            }

            if ( !isBlank( message ) )
            {
                template = template.replaceAll( "{message}", message ).replaceAll( "{2}", message );
            }
            else
            {
                template = template.replaceAll( /\[?\{message}]?/g, _mt_str ).replaceAll( /\[?\{2}]?/g, message );
            }
            if ( !isBlank( source ) )
            {
                template = template.replaceAll( "{source}", source ).replaceAll( "{3}", source );
            }
            else
            {
                template = template.replaceAll( /\[?\{source}]?/g, _mt_str ).replaceAll( /\[?\{3}]?/g, source );
            }

            template = trimLeadingCharacters( template.trim(), _spc, _mt_str ).replaceAll( /\n +/g, _lf ).replace( /^\s+/, _mt_str );

            return template;
        }

        _populateErrorTemplate( pError, pStackTrace, pErrorMessage )
        {
            let errorName = asString( (pError?.name || pError?.type || _mt_str), true );
            let errorMessage = asString( (pErrorMessage || pError?.message || _mt_str), true );
            let stackTrace = asString( (this.includeStackTrace ? asString( pStackTrace || pError?.stack || _mt_str ) : _mt_str), true );

            if ( isBlank( errorName + errorMessage + stackTrace ) )
            {
                return _mt_str;
            }

            let template = this.errorTemplate;

            if ( !isBlank( errorName ) )
            {
                template = template.replaceAll( "{errorName}", errorName ).replaceAll( "{0}", errorName );
            }
            else
            {
                template = template.replaceAll( /\[?\{errorName}]?/g, _mt_str ).replaceAll( /\[?\{0}]?/g, _mt_str );
            }

            if ( !isBlank( errorMessage ) )
            {
                template = template.replaceAll( "{errorMessage}", errorMessage ).replaceAll( "{1}", errorMessage );
            }
            else
            {
                template = template.replaceAll( /\[?\{errorMessage}]?/g, _mt_str ).replaceAll( /\[?\{1}]?/g, _mt_str );
            }

            if ( !isBlank( stackTrace ) )
            {
                template = template.replaceAll( "{stackTrace}", (_lf + stackTrace) ).replaceAll( "{2}", (_lf + stackTrace) );
            }
            else
            {
                template = template.replaceAll( /\[?\{stackTrace}]?/g, _mt_str ).replaceAll( /\[?\{2}]?/g, _mt_str );
            }

            template = trimLeadingCharacters( template.trim() );

            template = template.replaceAll( /\n +/g, _lf );

            return template;
        }

        format( pLogRecord )
        {
            const logRecord = pLogRecord instanceof LogRecord ? pLogRecord : new LogRecord( pLogRecord );

            const timestamp = logRecord.timestamp;
            const level = logRecord.level;
            const message = logRecord.message;
            const source = logRecord.source;
            const error = logRecord.error;
            const stackTrace = logRecord.stack;
            const data = asArray( logRecord.data );

            const timestampString = asString( isDate( timestamp ) ? this.dateFormatter.format( timestamp ) : timestamp, true );

            let arr = [];

            const msg = this._populateTemplate( timestampString, level, message, source );

            arr.push( msg );

            if ( data?.length > 0 )
            {

                arr.push( "[DATA:" );
                arr = arr.concat( ...(asArray( data ).map( ( e, i, a ) => _spc + ((i < (a.length - 1)) ? (e + _comma) : e + "]") )) );
            }

            arr = concatenateConsecutiveStrings( _spc, arr );

            const errorMsg = this._populateErrorTemplate( error, stackTrace, error?.message || message );

            if ( !isBlank( errorMsg ) )
            {
                arr.push( _lf );
                arr.push( trimLeadingCharacters( errorMsg, _spc, _mt_str ) );
            }

            arr.push( _lf, _lf, _lf );

            return lock( arr );
        }
    }

    class LogFilter
    {
        #filterFunction;

        constructor( pFunction )
        {
            if ( pFunction instanceof this.constructor )
            {
                this.#filterFunction = pFunction.filterFunction;
            }
            else
            {
                this.#filterFunction = Filters.IS_FILTER( pFunction ) ? pFunction : Filters.IDENTITY;
            }
        }

        isLoggable( pLogRecord )
        {
            return this.#filterFunction( pLogRecord || {} );
        }

        get filterFunction()
        {
            return Filters.IS_FILTER( this.#filterFunction ) ? this.#filterFunction : Filters.IDENTITY;
        }
    }

    /**
     * @typedef {Object} LoggerOptions An object specifying properties used
     *                                 to configure a Logger or a subclass of Logger<br>
     *
     * @property {LogFormatterOptions} [logFormatterOptions=DEFAULT_LOG_FORMATTER_OPTIONS] An object to provide global defaults for a Logger or subclass of Logger<br>
     *
     * @property {boolean} [asynchronous=false] Specifies whether to perform logging operations synchronously or asynchronously<br>
     *
     * @property {boolean} [buffered=false] Specifies whether to temporarily store log messages until the bufferInterval has passed<br>
     *
     * @property {number} [bufferIntervalMs=60_000] The number of milliseconds to wait before writing buffered log messages<br>
     *                                              Has no effect if buffered is false
     *
     * @property {LogFilter|function(LogRecord):boolean} [filter=Filters.IDENTITY] A LogFilter or a filter function<br>
     *                                              whose return value will determine
     *                                              whether a log message is written or discarded.
     *
     */

    const DEFAULT_LOGGER_OPTIONS =
        {
            logFormatterOptions: DEFAULT_LOG_FORMATTER_OPTIONS,
            asynchronous: false,
            buffered: false,
            bufferIntervalMs: 60_000,
        };

    class Logger extends StatefulListener
    {
        #options;
        #loggers = [];

        #filter = Filters.IDENTITY;

        #asynchronous = false;
        #buffered = false;
        #bufferIntervalMs = 60_000;

        #buffer = [];
        #bufferTimer;

        #level = LogLevel.INFO;
        #logFormatterOptions = DEFAULT_LOG_FORMATTER_OPTIONS;
        #logFormatter;

        constructor( pOptions = DEFAULT_LOGGER_OPTIONS, ...pLoggers )
        {
            super();

            this.#options = populateOptions( pOptions, DEFAULT_LOGGER_OPTIONS );
            this.#loggers = asArray( varargs( ...pLoggers ) );

            this.#filter = new LogFilter( this.#options?.filter || Filters.IDENTITY );

            this.#asynchronous = this.#options?.asynchronous || false;
            this.#buffered = this.#options?.buffered || false;
            this.#bufferIntervalMs = asInt( this.#options?.bufferIntervalMs || this.#bufferIntervalMs, 60_000 );

            this.#level = LogLevel.getLevel( this.#options?.level || LogLevel.INFO ) || LogLevel.INFO;
            this.#logFormatterOptions = this.#options?.logFormatterOptions || DEFAULT_LOG_FORMATTER_OPTIONS;
            this.#logFormatter = new LogFormatter( this.#logFormatterOptions );
        }

        get options()
        {
            return populateOptions( this.#options || {}, DEFAULT_LOGGER_OPTIONS );
        }

        get level()
        {
            this.#level = (this.#level instanceof LogLevel ? this.#level : LogLevel.getLevel( this.#level )) || LogLevel.INFO;
        }

        get logFormatterOptions()
        {
            return populateOptions( this.#logFormatterOptions, DEFAULT_LOG_FORMATTER_OPTIONS );
        }

        get logFormatter()
        {
            return !isNull( this.#logFormatter ) && isFunction( this.#logFormatter?.format ) ? this.#logFormatter : new LogFormatter( this.logFormatterOptions );
        }

        get filter()
        {
            if ( this.#filter instanceof LogFilter )
            {
                return this.#filter;
            }
            else if ( Filters.IS_FILTER( this.#filter ) )
            {
                this.#filter = new LogFilter( this.#filter );
            }
            return this.#filter;
        }

        get loggers()
        {
            return asArray( this.#loggers );
        }

        get asynchronous()
        {
            return this.#asynchronous;
        }

        get buffered()
        {
            return this.#buffered;
        }

        get bufferIntervalMs()
        {
            return Math.max( 1_000, asInt( this.#bufferIntervalMs, 60_000 ) );
        }

        get buffer()
        {
            return this.#buffer;
        }

        get bufferTimer()
        {
            return this.#bufferTimer;
        }

        isEnabledFor( pLevel )
        {
            return this.level.isEnabled( pLevel );
        }

        log( pLogRecord )
        {
            let logRecord = pLogRecord instanceof LogRecord ? pLogRecord || {} : new LogRecord( S_ERROR, asString( pLogRecord ) );

            let level = LogLevel.getLevel( logRecord?.level || S_ERROR ) || this.level;

            let methodName = lcase( (level instanceof LogLevel) ? level.name || asString( level ) : lcase( asString( level, true ) ) );

            if ( this.isEnabledFor( level ) )
            {
                for( let logger of this.loggers )
                {
                    if ( this === logger || (isFunction( logger?.isEnabledFor ) && !logger.isEnabledFor( level )) )
                    {
                        continue;
                    }

                    const method = logger[methodName];

                    if ( isFunction( method ) )
                    {
                        let args = asArray( isFunction( logRecord?.format ) ? logRecord.format( this.logFormatter ) : this.logFormatter?.format( logRecord ) );
                        method.call( logger, ...args );
                    }
                }
            }
        }

        async logAsync( pLogRecord )
        {
            let me = this;
            let logRecord = pLogRecord || {};
            let func = async() =>
            {
                me.log( logRecord );
            };
            setTimeout( func, 20 );
        }

        info( ...pArgs )
        {
            // should be implemented by subclasses that are added to this instance
            if ( this.loggers.length <= 0 )
            {
                konsole.info( ...pArgs );
            }
        }

        warn( ...pArgs )
        {
            // should be implemented by subclasses that are added to this instance
            if ( this.loggers.length <= 0 )
            {
                konsole.warn( ...pArgs );
            }
        }

        error( ...pArgs )
        {
            // should be implemented by subclasses that are added to this instance
            if ( this.loggers.length <= 0 )
            {
                konsole.error( ...pArgs );
            }
        }

        debug( ...pArgs )
        {
            // should be implemented by subclasses that are added to this instance
            if ( this.loggers.length <= 0 )
            {
                konsole.debug( ...pArgs );
            }
        }

        trace( ...pArgs )
        {
            // should be implemented by subclasses that are added to this instance
            if ( this.loggers.length <= 0 )
            {
                konsole.trace( ...pArgs );
            }
        }

        isLoggable( pLogRecord )
        {
            let loggable = true;

            let logRecord = pLogRecord || {};

            if ( this.filter instanceof LogFilter )
            {
                loggable = this.filter.isLoggable( logRecord );
            }
            else if ( Filters.IS_FILTER( this.filter ) )
            {
                loggable = this.filter( logRecord );
            }

            return loggable;
        }

        processBuffer()
        {
            while ( this.buffer?.length > 0 )
            {
                const logRecord = this.buffer.shift();
                if ( this.asynchronous )
                {
                    this.logAsync( logRecord ).then( no_op ).catch( ignore );
                }
            }

            this.#bufferTimer = null;
        }

        processEvent( pEvent )
        {
            let type = pEvent?.type || S_ERROR;
            let detail = pEvent?.detail || pEvent;
            let target = pEvent?.target || this;

            let logRecord;

            if ( !isNull( detail ) && isObject( detail ) )
            {
                logRecord = new LogRecord( detail.level || S_ERROR,
                                           detail.message || type,
                                           detail.error || pEvent,
                                           detail.source || target?.name || asString( target ),
                                           ...detail.data );

            }
            else
            {
                logRecord = new LogRecord( type,
                                           detail,
                                           pEvent,
                                           target?.name || asString( target ) );
            }

            if ( !this.isLoggable( logRecord ) )
            {
                return;
            }

            if ( this.buffered )
            {
                const me = this;

                this.buffer.push( logRecord );

                function flushBuffer()
                {
                    me.processBuffer();
                }

                this.bufferTimer = this.bufferTimer || setTimeout( flushBuffer, this.bufferIntervalMs );

                return;
            }

            this.log( logRecord );
        }

        async handleEventAsync( pEvent )
        {
            const me = this;
            const event = pEvent || {};

            const func = async() =>
            {
                me.processEvent( event );
            };

            setTimeout( func, 20 );
        }

        handleEvent( pEvent )
        {
            if ( this.asynchronous )
            {
                this.handleEventAsync( pEvent ).then( no_op ).catch( ignore );
            }
            else
            {
                this.processEvent( pEvent );
            }
        }

        onError( pError )
        {
            let detail = pError;

            if ( pError instanceof Error )
            {
                detail = {
                    error: pError,
                    message: pError.message,
                    stackTrace: pError.stackTrace || pError.stack || _mt_str,
                    level: S_ERROR
                };
            }

            if ( pError instanceof Event )
            {
                this.handleEvent( pError );
            }
            else
            {
                this.handleEvent( new CustomEvent( S_ERROR, { detail } ) );
            }
        }
    }

    class AsyncLogger extends Logger
    {
        constructor( pOptions = DEFAULT_LOGGER_OPTIONS, ...pLoggers )
        {
            super( pOptions, ...pLoggers );
        }

        get asynchronous()
        {
            return true;
        }
    }

    class BufferedLogger extends Logger
    {
        constructor( pOptions = DEFAULT_LOGGER_OPTIONS, ...pLoggers )
        {
            super( pOptions, ...pLoggers );
        }

        get buffered()
        {
            return true;
        }
    }

    class ConsoleLogger extends Logger
    {
        constructor( pOptions = DEFAULT_LOGGER_OPTIONS )
        {
            super( pOptions );
        }

        info( ...pArgs )
        {
            konsole.info( ...pArgs );
        }

        warn( ...pArgs )
        {
            konsole.warn( ...pArgs );
        }

        error( ...pArgs )
        {
            konsole.error( ...pArgs );
        }

        debug( ...pArgs )
        {
            konsole.debug( ...pArgs );
        }

        trace( ...pArgs )
        {
            konsole.trace( ...pArgs );
        }
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    ModuleEvent,
                    StatefulListener,
                    LogLevel,
                    LogRecord,
                    LogFormatter,
                    LogFilter,
                    Logger,
                    AsyncLogger,
                    BufferedLogger,
                    ConsoleLogger
                },
            DEFAULT_TEMPLATE,
            DEFAULT_ERROR_TEMPLATE,
            DEFAULT_LOG_FORMATTER_OPTIONS,
            DEFAULT_LOGGER_OPTIONS,
            LogLevel,
            LogRecord,
            LogFormatter,
            LogFilter,
            Logger,
            AsyncLogger,
            BufferedLogger,
            ConsoleLogger,
            resolveError,
            resolveSource,
        };

    // makes the properties of mod available as properties and methods of the modulePrototype
    mod = modulePrototype.extend( mod );

    // Exports this module
    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
