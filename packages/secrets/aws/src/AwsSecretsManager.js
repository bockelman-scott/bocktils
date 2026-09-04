(function exposeModule()
{
    const awsSecretsManagerSdk = require( "@aws-sdk/client-secrets-manager" );

    const core = require( "@toolbocks/core" );

    const jsonUtils = require( "@toolbocks/json" );

    const logUtils = require( "@toolbocks/logging" );

    const secretsModule = require( "@toolbocks/secrets" );

    const { moduleUtils, constants, typeUtils, stringUtils } = core;

    const { ExecutionEnvironment, ModuleEvent, readProperty, attempt, asyncAttempt, lock } = moduleUtils;

    const { _ud, _mt, _underscore, $scope } = constants;

    const { isNull, isNonNullObject, isString } = typeUtils;

    const { asString, isBlank, toBool, ucase } = stringUtils;

    const { asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const
        {
            SECRETS_STRATEGY,
            SECRET_VERSION,
            DEFAULT_OPTIONS,
            SecretsManager,
            LocalSecretsManager,
            registerSecretsManagerClass
        } = secretsModule;

    const
        {
            SecretsManagerClient,
            GetSecretValueCommand,
            ListSecretsCommand,
            BatchGetSecretValueCommand
        } = awsSecretsManagerSdk;


    const EXECUTION_ENVIRONMENT = ExecutionEnvironment.getInstance( $scope() );

    const ENV = EXECUTION_ENVIRONMENT.process?.env ?? EXECUTION_ENVIRONMENT.ENV ?? $scope();

    const DEFAULT_AWS_OPTIONS =
        {
            ...DEFAULT_OPTIONS,
            allowCache: true,
            excludeFromCache: [],
            restrictKeys: false,
            separator: _underscore,
            config:
                {
                    region: ENV["AWS_REGION"] || "us-east-1",
                    accessKeyId: _mt,
                    secretAccessKey: _mt,
                    sessionToken: _mt,
                    credentials:
                        {
                            accessKeyId: _mt,
                            secretAccessKey: _mt,
                            sessionToken: _mt
                        }
                },
            logger: new SourcedSimpleLogger( new SimpleLogger( ToolBocksModule.getGlobalLogger() ?? console ), "AwsSecretsManager" )
        };

    class AwsSecretsManager extends SecretsManager
    {
        #sdkClient;

        #fallback = new LocalSecretsManager( DEFAULT_AWS_OPTIONS );

        constructor( pOptions = DEFAULT_AWS_OPTIONS, ...pArgs )
        {
            super( { ...DEFAULT_AWS_OPTIONS, ...asObject( pOptions ) }, ...pArgs );

            const { config, client } = this.#resolveOptions( {
                                                                 ...DEFAULT_AWS_OPTIONS,
                                                                 ...(asObject( this.options ?? {} )),
                                                                 ...(asObject( pOptions ?? {} ))
                                                             } );

            this.#sdkClient = this.#sdkClient ?? client ?? new SecretsManagerClient( config ?? {} );
        }

        #resolveOptions( pOptions = DEFAULT_AWS_OPTIONS )
        {
            let options = { ...DEFAULT_AWS_OPTIONS, ...(asObject( pOptions ?? {} )) };

            let config = null;

            if ( isNonNullObject( options.credentials ) )
            {
                config = { credentials: options.credentials };
            }
            else if ( !(isBlank( options.accessKeyId ) || isBlank( options.secretAccessKey )) )
            {
                config =
                    {
                        credentials:
                            {
                                accessKeyId: options.accessKeyId,
                                secretAccessKey: options.secretAccessKey
                            }
                    };

                if ( !isBlank( options.sessionToken ) )
                {
                    config.credentials.sessionToken = options.sessionToken;
                }
            }

            if ( null !== config && isNonNullObject( config ) )
            {
                config.credentials = config.credentials ?? {};
                if ( !(isBlank( options.accessKeyId ) || isBlank( options.secretAccessKey )) )
                {
                    config.credentials.accessKeyId = config.credentials.accessKeyId || options.accessKeyId;
                    config.credentials.secretAccessKey = config.credentials.secretAccessKey || options.secretAccessKey;
                }
                if ( !isBlank( options.sessionToken ) )
                {
                    config.credentials.sessionToken = config.credentials.sessionToken || options.sessionToken;
                }
            }

            let awsClient = readProperty( options, "sdkClient", "awsClient", "client" ) ?? options.sdkClient ?? options.client;

            if ( isNonNullObject( awsClient ) )
            {
                if ( asObject( awsClient ?? {} ) instanceof SecretsManagerClient )
                {
                    this.#sdkClient = awsClient;
                }
            }

            return { config, client: this.#sdkClient };
        }

        resolveKey( pKey )
        {
            let key = asString( pKey, true );

            if ( /^arn:aws:/.test( key ) )
            {
                return asString( key, true );
            }

            return super.resolveKey( key );
        }

        async getSecret( pKey, pVersion = SECRET_VERSION.CURRENT )
        {
            const key = this.resolveKey( pKey );

            if ( isNull( this.#sdkClient ) )
            {
                return (ENV[key] ?? ENV[pKey] ?? await this.#fallback.getSecret( pKey, pVersion ) ?? super.getSecret( pKey, pVersion ));
            }

            const payload = { SecretId: key };

            if ( !isBlank( pVersion ) && ucase( asString( pVersion, true ) ) !== SECRET_VERSION.CURRENT )
            {
                payload["VersionId"] = asString( pVersion, true ) || "AWSCURRENT";
            }

            let arn = null, secret = null;

            const command = new GetSecretValueCommand( payload );

            const response = await asyncAttempt( async() => await this.#sdkClient.send( command ) );

            if ( !isNull( response ) )
            {
                const obj = asObject( response );

                arn = readProperty( obj, "ARN", "arn" ) || obj["ARN"];

                secret = readProperty( obj, "SecretString", "SecretBinary" ) ?? obj["SecretString"] ?? obj["SecretBinary"];
                secret = secret ?? super.resolveSecretValue( obj, key );
            }

            if ( !isNull( secret ) && ( !isString( secret ) || !isBlank( secret )) )
            {
                if ( this.canCache( key ) )
                {
                    this.cacheSecret( key, secret );
                    if ( !isBlank( arn ) )
                    {
                        this.cacheSecret( arn, secret );
                    }
                }
            }

            return secret;
        }

        /*
         * IMPORTANT!!!  THE METHOD SIGNATURE FOR get MUST NOT PROVIDE A DEFAULT FOR pVersion
         * This is because of how JavaScript determines the 'length' of a function.
         * We do not want this 'get' to appear to have length === 1,
         * because readProperty will try to call it.
         * TRUST ME!
         */

        async get( pKey, pVersion, pIgnoreCache = false )
        {
            const key = this.resolveKey( pKey );

            let ignoreCache = toBool( pIgnoreCache );

            // try the cache first
            let secret = (ignoreCache ? null : this.getCachedSecret( key ));

            // if found in the cache... return the value
            if ( !isNull( secret ) && ( !isString( secret ) || !isBlank( secret )) )
            {
                return this.resolveSecretValue( secret, key );
            }

            secret = await this.getSecret( key, pVersion ) ?? ENV[key] ?? ENV[pKey];

            if ( !isNull( secret ) && ( !isString( secret ) || !isBlank( secret )) )
            {
                return this.resolveSecretValue( secret, key );
            }

            const version = (SECRET_VERSION.CURRENT === asString(pVersion,true) ? "AWSCURRENT" : pVersion) || "AWSCURRENT";

            attempt( () => this.dispatchEvent( new ModuleEvent( "error",
                                                                {
                                                                    key: pKey,
                                                                    version: version,
                                                                    message: "Cannot find value for key, " + pKey + ", version: " + version
                                                                }, {} ) ) );

            return null;
        }

        async preload()
        {

        }
    }

}());
