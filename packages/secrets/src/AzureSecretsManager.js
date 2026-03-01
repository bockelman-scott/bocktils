(function exposeModule()
{
    const secretsModule = require( "./SecretsManager.js" );

    const { SecretsManager } = secretsModule;

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

        constructor( pSource, pPrefix, pOptions = {} )
        {
            super( pSource, pPrefix, pOptions );

            this.#keyVaultName = ucase( asString( pSource, true ) );
            this.#keyVaultUrl = this.options.keyVaultUrl || `https://${lcase( this.source )}.vault.azure.net`;
        }

        get keyVaultName()
        {
            return this.#keyVaultName ||  super.getCachedSecret( "KV-NAME" );
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

        async getSecret( pKey )
        {
            const me = this;

            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let client = (me || this).client || new SecretClient( this.keyVaultUrl, this.credential );

            let secret = await asyncAttempt( async() => client.getSecret( createKey( (me || this).prefix, key ) ) );

            secret = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            if ( isNull( secret ) || isBlank( secret ) )
            {
                secret = await asyncAttempt( async() => client.getSecret( key ) );
            }

            secret = isNonNullObject( secret ) ? (secret?.value || secret) : secret;

            secret = (isString( secret ) && !isBlank( secret )) ? secret : ((isNonNullObject( secret ) ? secret.value : await super.getSecret( key )) || super.getSecret( key ));

            if ( !isNull( secret ) && this.allowCache && this.canCache( key ) )
            {
                this.cacheSecret( createKey( this.prefix, key ), secret );
                this.cacheSecret( key, secret );
                this.cacheSecret( ucase( asString( key, true ) ), secret );
            }

            return isNonNullObject( secret ) ? (secret?.value || secret) : secret;
        }

        async get( pKey )
        {
            let key = asString( pKey, true ).replaceAll( /_/g, _hyphen );

            if ( this.invalidKeys.includes( key ) || !(SecretsManager.isValidKey( key ) || SecretsManager.isValidKey( pKey )) )
            {
                return null;
            }

            let secret = this.getCachedSecret( key );

            secret = isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;

            if ( !isNull( secret ) && !isBlank( secret ) )
            {
                return secret;
            }

            secret = await asyncAttempt( async() => await this.getSecret( key ) );

            secret = isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;

            if ( secret && this.canCache( key ) )
            {
                this.cacheSecret( key, secret );
            }

            return isNonNullObject( secret ) ? (secret?.value || secret?.Value || secret) : secret;
        }
    }

    const DEFAULT_AZURE_OPTIONS =
        {
            secretsManagerClass: AzureSecretsManager,
            keyStoreName: _mt
        };


}());

