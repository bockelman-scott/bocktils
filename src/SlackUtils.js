const constants = require( "./Constants.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );
const objectUtils = require( "./ObjectUtils.cjs" );
const funcUtils = require( "./FunctionUtils.cjs" );

const jsonUtils = require( "./JsonUtils.cjs" );

const httpUtils = require( "./HttpUtils.js" );

const guidUtils = require( "./GUIDUtils.cjs" );

const logUtils = require( "./LogUtils.cjs" );

const axios = require( "axios" );

const _ud = constants._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    let no_op = objectUtils.no_op || function() {};
    let catchHandler = funcUtils.catchHandler || function( pErr ) { return true; };

    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const SLACK_WEB_HOOK = "https://hooks.slack.com/services/";

    const DEFAULT_TEAM_ID = "T04HMNX3GE4";

    const DEFAULT_CHANNEL_ID = "B07ECHQPLLE";

    // TODO: encryption scheme
    const DEFAULT_WEBHOOK_SECRET = "S4JGi41VpWAZDl4gACGAjMOM";

    const MAX_INTERVAL = 1_200_000; // 20 minutes in milliseconds
    const MIN_INTERVAL = 300_000; // 5 minutes in milliseconds
    const MAX_SENT_RETAINED = 5;

    const DEFAULT_PREFIX = "MESSAGE {0}: ";

    const QUEUED = "Queued";

    const replacer = function( key, value )
    {
        if ( "function" === typeof value || "bigint" === typeof key || "bigint" === typeof value )
        {
            return undefined;
        }
        return value;
    };

    class SlackMessage
    {
        constructor( pMessage, pTeamId, pChannelId, pSecretKey, pPrefix )
        {
            const source = ((pMessage instanceof this.constructor) ? pMessage : {});

            this._id = source?.id || guidUtils.guid();

            this._teamId = pTeamId || source?.teamId || DEFAULT_TEAM_ID;
            this._channelId = pChannelId || source?.channelId || DEFAULT_CHANNEL_ID;
            this._authentiationId = pSecretKey || source?._authentiationId || DEFAULT_WEBHOOK_SECRET;

            this._enabled = (false !== source?.enabled);
            this._suspended = (true === source?.suspended);

            this._sent = (true === source?.sent);

            this._prefix = asString( pPrefix, true ) || source?.prefix || DEFAULT_PREFIX;

            this._message = this.calculateMessage( pMessage, source );

            this._logger = null; // loaded on-demand
        }

        calculateMessage( pMessage, pSource )
        {
            const source = (pSource instanceof this.constructor) ? pSource : ((isObject( pSource ) && pSource._message) ? pSource : {});

            this._message = source?._message || pMessage;

            switch ( typeof this._message )
            {
                case _str:
                    this._message = asString( this._message, true );
                    break;

                case _num:
                case _big:
                case _bool:
                    this._message = "{value:\"" + asString( this._message, true ) + "\"}";
                    break;

                case _symbol:
                case _fun:
                    this._message = "The message could not be interpreted as text.  The message was specified as a " + (typeof this._message);
                    break;

                case _obj:
                // fall-through; this is the default

                default:
                    let str = jsonUtils.jsonify( this._message, replacer );
                    this._message = asString( str, true );
            }

            return this._message;
        }

        get logger()
        {
            this._logger = this._logger || logUtils.findDefaultLogger();

            return this._logger || logUtils.findDefaultLogger() || console;
        }

        async findLogger()
        {
            return this._logger || await logUtils.findGlobalLogger();
        }

        get prefix()
        {
            return asString( this._prefix ).replace( /\{\d+}/g, (this._id || (new Date().getTime())) );
        }

        set prefix( pPrefix )
        {
            this._prefix = asString( pPrefix, true ) || DEFAULT_PREFIX;
        }

        get id()
        {
            return this._id || (new Date().getTime());
        }

        get sent()
        {
            return this._sent;
        }

        get teamId()
        {
            return this._teamId;
        }

        get channelId()
        {
            return this._channelId;
        }

        disable()
        {
            this._enabled = false;
            this._suspended = true;
        }

        enable()
        {
            this._enabled = true;
            this._suspended = false;
        }

        get enabled()
        {
            return this._enabled;
        }

        suspend()
        {
            this._suspended = true;
        }

        get suspended()
        {
            return this._suspended;
        }

        get message()
        {
            return this._message || "No Text in this Message";
        }

        async send()
        {
            if ( this._sent )
            {
                return { status: httpUtils.STATUS_CODES.ERROR, data: "Message, " + this._id + " was already sent" };
            }

            let response = QUEUED;

            if ( !this.enabled )
            {
                const handler = new SlackMessageHandler( this.teamId, this.channelId, this._authentiationId, this.prefix );

                await handler.queueMessage( this.message );

                return response;
            }

            const axiosConfig =
                {
                    headers:
                        {
                            "Content-Type": "application/json"
                        }
                };

            let url = SLACK_WEB_HOOK;

            url += (this._teamId + "/");
            url += (this._channelId + "/");
            url += (this._authentiationId);

            let messageObject = { "text": this.prefix + "\n" + this._message + "\n" };

            let message = jsonUtils.jsonify( messageObject, replacer );

            messageObject = jsonUtils.parse( asString( message, true ) );

            messageObject.text = asString( Array.isArray( messageObject.text ) ? pruneArray( messageObject.text ).join( _spc ) : asString( messageObject.text, true ), true );

            try
            {
                response = await axios.post( url, messageObject, axiosConfig );
            }
            catch( ex )
            {
                console.warn( logUtils.err( ex ) );

                response = {
                    status: httpUtils.STATUS_CODES.INTERNAL_SERVICE_ERROR,
                    data: ex
                };
            }

            if ( response )
            {
                this._sent = (httpUtils.STATUS_CODES.OK === response?.status);
            }

            return response;
        }
    }

    class SlackMessageHandler
    {
        constructor( pTeamId = DEFAULT_TEAM_ID, pChannelId = DEFAULT_CHANNEL_ID, pSecretKey = DEFAULT_WEBHOOK_SECRET, pPrefix = DEFAULT_PREFIX, pInterval = MAX_INTERVAL )
        {
            this._teamId = pTeamId || DEFAULT_TEAM_ID;
            this._channelId = pChannelId || DEFAULT_CHANNEL_ID;
            this._authentiationId = pSecretKey || DEFAULT_WEBHOOK_SECRET;
            this._prefix = asString( pPrefix, true ) || DEFAULT_PREFIX;

            this._interval = Math.min( MAX_INTERVAL, Math.max( MIN_INTERVAL, asInt( pInterval, 0 ) ) );

            this._sentMessages = [];
            this._queuedMessages = [];

            this._enabled = true;
            this._suspended = false;

            this._logger = null; // loaded on-demand
        }

        flushQueue()
        {
            if ( this.queuedMessages.length > 0 )
            {
                const me = this;

                const processQueuedMessages = async function()
                {
                    const handler = me || this;

                    let queue = handler._queuedMessages || [];
                    let sent = handler._sentMessages || [];

                    return await handler.processQueue( handler, queue, sent );
                };

                setTimeout( processQueuedMessages, this._interval );
            }
        }

        get logger()
        {
            this._logger = this._logger || logUtils.findDefaultLogger();

            return this._logger || logUtils.findDefaultLogger() || console;
        }

        async findLogger()
        {
            return this._logger || await logUtils.findGlobalLogger();
        }

        get teamId()
        {
            return this._teamId;
        }

        get channelId()
        {
            return this._channelId;
        }

        setEnabled( pEnabled )
        {
            const wasEnabled = toBool( this.enabled );

            this._enabled = (_ud === typeof pEnabled) || (toBool( pEnabled ));

            if ( toBool( this._enabled ) && !wasEnabled )
            {
                if ( this.queuedMessages.length > 0 )
                {
                    this.flushQueue();
                }
            }
        }

        disable()
        {
            this._enabled = false;
            this._suspended = true;
        }

        enable()
        {
            this._enabled = true;
            this._suspended = false;
        }

        get enabled()
        {
            return this._enabled;
        }

        setSuspended( pSuspended )
        {
            const wasSuspended = this.suspended;

            this._suspended = (_ud === typeof pSuspended) || (toBool( pSuspended ));

            if ( !this.suspended && wasSuspended )
            {
                if ( this.queuedMessages.length > 0 )
                {
                    this.flushQueue();
                }
            }
        }

        suspend()
        {
            this._suspended = true;
        }

        get suspended()
        {
            return this._suspended;
        }

        get queuedMessages()
        {
            return this._queuedMessages || [];
        }

        get sentMessages()
        {
            return this._sentMessages || [];
        }

        async sendMessage( pMessage )
        {
            let response = "Pending";

            const slackMessage = new SlackMessage( pMessage, this.teamId, this.channelId, this._authentiationId, this._prefix );

            if ( this.enabled && !this.suspended )
            {
                response = await slackMessage.send();

                if ( !isString( response ) )
                {
                    if ( httpUtils.STATUS_CODES.OK === response?.status || slackMessage.sent )
                    {
                        this._sentMessages.push( slackMessage );

                        while ( (this._sentMessages?.length || 0) > MAX_SENT_RETAINED )
                        {
                            this._sentMessages.shift();
                        }

                        const logger = await this.findLogger();

                        if ( logger || this.logger )
                        {
                            (logger || this.logger).info( "Sent Message,", (slackMessage.id + ","), "to Slack Channel:", slackMessage?.channelId ).then( no_op ).catch( catchHandler );
                        }
                    }
                }
            }
            else
            {
                response = await this.queueMessage( slackMessage );
            }

            return response;
        }

        async queueMessage( pMessage )
        {
            const slackMessage = new SlackMessage( pMessage, this._teamId, this._channelId, this._authentiationId, this._prefix );

            this._queuedMessages.push( slackMessage );

            const logger = await this.findLogger();

            if ( logger || this.logger )
            {
                (logger || this.logger).info( "Queued Slack Message:", slackMessage?.message );
            }

            return QUEUED;
        }

        async processQueue( pMessageHandler )
        {
            const handler = pMessageHandler || this;

            if ( handler._suspended )
            {
                if ( this.queuedMessages.length )
                {
                    const me = handler || this;

                    setTimeout( async function() { me.flushQueue(); }, MAX_INTERVAL );
                }
                return;
            }

            let queued = (asArray( handler.queuedMessages || [] ) || []).filter( msg => !msg.sent );

            while ( (queued?.length || 0) > 0 )
            {
                let slackMessage = queued.shift();

                if ( slackMessage && !isBlank( slackMessage?.message ) )
                {
                    let response = await slackMessage.send();

                    if ( !isString( response ) )
                    {
                        if ( httpUtils.STATUS_CODES.OK === response?.status || slackMessage.sent )
                        {
                            handler.sentMessages.push( slackMessage );

                            const logger = await this.findLogger();

                            if ( logger || this.logger )
                            {
                                (logger || this.logger).info( "Sent Message to Slack Channel", slackMessage?.message );
                            }
                        }
                    }
                    else if ( QUEUED !== response && !slackMessage.sent )
                    {
                        queued.push( slackMessage );
                    }
                }
            }

            while ( (handler.sentMessages?.length || 0) > MAX_SENT_RETAINED )
            {
                handler.sentMessages.shift();
            }


            this._queuedMessages = asArray( queued || [] ).filter( msg => !msg.sent );
        }
    }

    const mod =
        {
            classes: { SlackMessage, SlackMessageHandler },
            INSTANCE: new SlackMessageHandler( DEFAULT_TEAM_ID, DEFAULT_CHANNEL_ID, DEFAULT_WEBHOOK_SECRET, DEFAULT_PREFIX ),
            sendMessage: async function( pMessage, pTeamId = DEFAULT_TEAM_ID, pChannelId = DEFAULT_CHANNEL_ID, pSecretKey = DEFAULT_WEBHOOK_SECRET, pPrefix = DEFAULT_PREFIX )
            {
                let handler;

                if ( DEFAULT_TEAM_ID === pTeamId &&
                     DEFAULT_CHANNEL_ID === pChannelId &&
                     DEFAULT_WEBHOOK_SECRET === pSecretKey &&
                     DEFAULT_PREFIX === pPrefix )
                {
                    handler = this.INSTANCE;
                }
                else
                {
                    handler = new SlackMessageHandler( pTeamId, pChannelId, pSecretKey, pPrefix );
                }

                return ((handler.enabled) ? handler.sendMessage( pMessage ) : handler.queueMessage( pMessage ));
            },
            disable: function()
            {
                this.INSTANCE.disable();
            },
            enable: function()
            {
                this.INSTANCE.enable();
            },
            suspend: function()
            {
                this.INSTANCE.suspend();
            },
            setEnabled: function( pEnabled )
            {
                this.INSTANCE.setEnabled( pEnabled );
            },
            flushQueue: function()
            {
                this.INSTANCE.flushQueue();
            }
        };

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
