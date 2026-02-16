const moduleUtils = require( "./_ToolBocksModule.cjs" );
const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );

const { _ud = "undefined", $scope = moduleUtils.$scope } = constants;

const crypto = $scope().crypto || require( "crypto" );

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__GUID_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { OBJECT_REGISTRY, ToolBocksModule, clamp, lock } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _hyphen = "-" } = constants;

    const { isNull, isFunction, isUUID } = typeUtils;

    const { asString, isBlank, asInt } = stringUtils;

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
            }
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
