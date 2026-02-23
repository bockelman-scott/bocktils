const moduleUtils = require( "./_ToolBocksModule.cjs" );
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );

const { _ud = "undefined", $scope = moduleUtils.$scope, _fun } = constants;

const crypto = $scope()?.crypto ?? (_ud !== typeof require && _fun === typeof require) ? require( "crypto" ) : undefined;

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__GUID_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { OBJECT_REGISTRY, ToolBocksModule, attempt, asyncAttempt, clamp, lock } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _hyphen = "-" } = constants;

    const { isNull, isFunction, isUUID } = typeUtils;

    const { asString, isBlank, asInt, repeat } = stringUtils;

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module
     */
    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils
        };

    const modName = "GUIDUtils";

    const toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const MAX_NUM_CACHED_VALUES = 10_000;
    const DEFAULT_NUM_CACHED_VALUES = 1_000;

    const RandomUUIDOptions = { disableEntropyCache: true, preload: false, numPreload: 0 };

    function generate()
    {
        const quad = () => Math.floor( (1 + Math.random()) * 0x10000 ).toString( 16 ).slice( 1 );
        const octet = () => quad() + quad();
        const duodec = () => octet() + quad();
        return [octet(), quad(), quad(), quad(), duodec()].join( _hyphen );
    }

    function randomBytes( pNumberOfBytes )
    {
        const numBytes = clamp( asInt( pNumberOfBytes, 0 ), 8, (2 ** 16) );

        const bytes = new Uint8Array( numBytes );

        if ( crypto && isFunction( crypto?.getRandomValues ) )
        {
            return crypto.getRandomValues( bytes );
        }
        else
        {
            let byte = 0;

            for( let i = 0; i < numBytes; i++ )
            {
                byte = clamp( Math.floor( Math.random() * 256 ), 0, 255 );
                bytes[i] = byte;
            }
        }
        return bytes;
    }

    // noinspection SpellCheckingInspection
    class GUIDMaker
    {
        #options;
        #cached;

        constructor( pOptions )
        {
            this.#options = lock( { ...RandomUUIDOptions, ...(pOptions || {}) } );

            this.#cached = [];

            if ( this.#options.preload )
            {
                let num = clamp( asInt( this.#options.numPreload, DEFAULT_NUM_CACHED_VALUES ), 10, MAX_NUM_CACHED_VALUES );

                for( let i = num; i--; )
                {
                    this.#cached.push( asString( this.uuid(), true ) );
                }
            }
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get options()
        {
            return { ...RandomUUIDOptions, ...(this.#options || {}) };
        }

        uuid()
        {
            if ( !isNull( crypto ) && isFunction( crypto.randomUUID ) )
            {
                let value = crypto.randomUUID( { disableEntropyCache: this.options.disableEntropyCache } );

                if ( !isBlank( value ) && isUUID( value ) )
                {
                    return asString( value, true );
                }

                return generate();
            }

            return generate();
        }

        guid()
        {
            let value = _mt_str;

            if ( this.#cached.length > 0 )
            {
                value = asString( this.#cached.shift(), true );
            }

            if ( !isBlank( value ) && isUUID( value ) )
            {
                return asString( value, true );
            }

            value = asString( this.uuid(), true );

            if ( !isBlank( value ) && isUUID( value ) )
            {
                return value;
            }

            return generate();
        }

        getRandomBytes( pNumBytes )
        {
            return randomBytes( asInt( pNumBytes ) );
        }
    }

    const HASH_ALGO = "sha256";

    const hash = async( pContent, pHashAlgorithm ) =>
    {
        const encoder = (_ud !== typeof TextEncoder) ? new TextEncoder() :
            {
                encode: ( pIn ) =>
                {
                    return new Uint8Array( ((pIn).split( _mt )).map( e => e.charCodeAt( 0 ) ) );
                }
            };

        let data = encoder.encode( asString( pContent ) );

        // Create a hash object
        const hasher = ((_ud !== typeof crypto && !isNull( crypto )) && isFunction( crypto?.createHash )) ? crypto.createHash( pHashAlgorithm || HASH_ALGO ) : null;

        if ( hasher )
        {
            await asyncAttempt( () => hasher.update( data ) );
            return hasher.digest( "hex" );
        }

        let useCrypto = (_ud !== typeof crypto && !isNull( crypto )) && _ud !== typeof crypto.subtle;

        let buffer = useCrypto ? await crypto.subtle.digest( (pHashAlgorithm || HASH_ALGO), data ) : data.map( ( e, i ) => e + ((i % 7) << 3) );

        const arr = [...(new Uint8Array( buffer ))];

        const padLeft = isFunction( _mt.padStart ) ? ( pStr, pLen = 2 ) => asString( pStr ).padStart( asInt( pLen ), "0" ) : ( pStr, pLen = 2 ) => ((repeat( "0", asInt( pLen ) - $ln( asString( pStr ) ) + asString( pStr ) ).substring( -(asInt( pLen )) )));

        let mapper = ( b ) => padLeft( Number( b ).toString( 16 ), 2 );

        return arr.map( mapper ).join( _mt );
    };

    const hashSync = ( s ) =>
    {
        // Create a hash object
        const hasher = ((_ud !== typeof crypto && !isNull( crypto )) && isFunction( crypto?.createHash )) ? crypto.createHash( pHashAlgorithm || HASH_ALGO ) : null;

        if ( hasher )
        {
            attempt( () => hasher.update( data ) );
            return hasher.digest( "hex" );
        }

        let arr = asString( s ).split( _mt ).map( e => e.charCodeAt( 0 ) );

        arr = arr.reverse();

        let arr2 = [];

        for( let i = 0, n = $ln( arr ); i < n; i += 16 )
        {
            arr2.push( arr.slice( i, i + 16 ).reduce( ( a, c ) => a + c, 0 ) );
        }

        arr2 = arr2.map( e => Number( e ).toString( 36 ) );

        return arr2.join( _mt );
    };

    const INSTANCE = new GUIDMaker( RandomUUIDOptions );

    let mod =
        {
            dependencies,
            classes: { GUIDMaker },
            GUIDMaker,
            guid: function()
            {
                return (INSTANCE || new GUIDMaker( RandomUUIDOptions )).guid();
            },
            uuid: function()
            {
                return new GUIDMaker( RandomUUIDOptions ).uuid();
            },
            getGuid: function( pObject )
            {
                return OBJECT_REGISTRY.getGuid( pObject );
            },
            randomBytes,
            getRandomBytes: function( pNumBytes )
            {
                return (INSTANCE || new GUIDMaker( RandomUUIDOptions )).getRandomBytes( pNumBytes );
            },
            hash,
            hashSync
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
