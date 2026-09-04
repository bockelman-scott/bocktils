(function exposeModule()
{
    const azureIdentity = require( "@azure/identity" );
    const azureSecrets = require( "@azure/keyvault-secrets" );

    const core = require( "@toolbocks/core" );

    const secretsModule = require( "@toolbocks/secrets" );

    const { moduleUtils, constants, typeUtils, stringUtils } = core;

    const { asyncAttempt, lock } = moduleUtils;

    const { _ud, _mt, _hyphen, $scope } = constants;

    const { isNull } = typeUtils;

    const { asString, isBlank, ucase, lcase } = stringUtils;

    const
        {
            SECRETS_STRATEGY,
            SECRET_VERSION,
            DEFAULT_OPTIONS,
            SecretsManager,
            registerSecretsManagerClass
        } = secretsModule;

    const { ChainedTokenCredential, DefaultAzureCredential } = azureIdentity;

    const { SecretClient } = azureSecrets;

    const AZURE_OPTIONS =
        lock( {
                  ...DEFAULT_OPTIONS,
                  source: _mt,
                  separator: _hyphen
              } );


    /**
     * This subclass of SecretsManager uses the Azure Key Vault to store and retrieve values.
     * <br>
     * <br>
     * @class
     * @extends #SecretsManager
     */
    class AzureSecretsManager extends SecretsManager
    {
        #keyVaultName;
        #keyVaultUrl;
        #credential;
        #client;

        constructor( pOptions = { ...AZURE_OPTIONS }, ...pArgs )
        {
            super( pOptions, ...pArgs );

            this.#keyVaultName = ucase( asString( this.source, true ) );
            this.#keyVaultUrl = this.options.keyVaultUrl || `https://${lcase( this.source )}.vault.azure.net`;
        }

        get keyVaultName()
        {
            return this.#keyVaultName || super.getCachedSecret( "KV-NAME" );
        }

        get keyVaultUrl()
        {
            this.#keyVaultUrl = this.#keyVaultUrl || `https://${lcase( this.keyVaultName )}.vault.azure.net`;
            return this.#keyVaultUrl;
        }

        set keyVaultUrl( pUrl )
        {
            this.#keyVaultUrl = pUrl || `https://${lcase( this.keyVaultName )}.vault.azure.net`;
        }

        get credential()
        {
            this.#credential = this.#credential || new DefaultAzureCredential();
            return this.#credential;
        }

        set credential( pValue )
        {
            let isCredential = pValue instanceof ChainedTokenCredential || pValue instanceof DefaultAzureCredential;
            this.#credential = isCredential ? pValue : (this.#credential || new DefaultAzureCredential());
        }

        get client()
        {
            this.#client = this.#client || new SecretClient( this.keyVaultUrl, this.credential );
            return this.#client;
        }

        set client( pClient )
        {
            this.#client = (pClient instanceof SecretClient) ? pClient : (this.#client || new SecretClient( this.keyVaultUrl, this.credential ));
        }

        async getSecret( pKey, pVersion = SECRET_VERSION.CURRENT )
        {
            const me = this;

            let key = this.resolveKey( pKey ) || asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.restrictKeys && !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let client = (me || this).client || new SecretClient( this.keyVaultUrl, this.credential );

            let secret = await asyncAttempt( async() => client.getSecret( key ) );

            secret = this.resolveSecretValue( secret, key );

            if ( isNull( secret ) || isBlank( secret ) )
            {
                secret = await asyncAttempt( async() => client.getSecret( key ) );
            }

            secret = this.resolveSecretValue( secret, key );

            if ( !isNull( secret ) && this.allowCache && this.canCache( key ) )
            {
                this.cacheSecret( key, secret );
                this.cacheSecret( ucase( asString( key, true ) ), secret );
            }

            return this.resolveSecretValue( secret, key );
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
            let key = this.resolveKey( pKey );

            if ( this.restrictKeys || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let secret = this.getCachedSecret( key );

            if ( !isNull( secret ) )
            {
                secret = this.resolveSecretValue( secret, key );

                if ( !(isNull( secret ) || isBlank( secret )) )
                {
                    return secret;
                }
            }

            secret = await asyncAttempt( async() => await this.getSecret( key ) );

            if ( secret && this.canCache( key ) )
            {
                this.cacheSecret( key, secret );
            }

            return this.resolveSecretValue( secret, key );
        }
    }

    registerSecretsManagerClass( SECRETS_STRATEGY.AZURE, AzureSecretsManager );

    const mod =
        {
            classes:
                {
                    SecretsManager,
                    AzureSecretsManager
                },
            AzureSecretsManager
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    $scope["AzureSecretsManager"] = AzureSecretsManager;

    return lock( mod );

}());
