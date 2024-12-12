const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );

const crypto = require( "crypto" );

const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK__GUID_UTILITIES__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module
     */
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            crypto
        };


    const { _mt_str, populateOptions, lock, classes } = constants;

    const { asString, isBlank, asInt } = stringUtils;

    const { ModuleEvent, ModulePrototype } = classes;

    const modName = "GUIDUtils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const MAX_CACHED_VALUES = 10_000;
    const DEFAULT_CACHED_VALUES = 1_000;

    const RandomUUIDOptions = { disableEntropyCache: true, preload: false, numPreload: 0 };

    // noinspection SpellCheckingInspection
    class GUIDMaker
    {
        #options;
        #cached;

        constructor( pOptions )
        {
            this.#options = lock( populateOptions( pOptions, RandomUUIDOptions ) );

            this.#cached = [];

            if ( this.#options.preload )
            {
                let num = Math.max( 10, Math.min( MAX_CACHED_VALUES, asInt( this.#options.numPreload, DEFAULT_CACHED_VALUES ) || DEFAULT_CACHED_VALUES ) );

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
            return Object.assign( {}, this.#options || RandomUUIDOptions );
        }

        uuid()
        {
            return crypto.randomUUID( this.options );
        }

        guid()
        {
            let value = _mt_str;

            if ( this.#cached.length > 0 )
            {
                value = asString( this.#cached.shift(), true );
            }

            if ( !isBlank( value ) )
            {
                return asString( value, true );
            }

            value = asString( this.uuid(), true );

            if ( !isBlank( value ) )
            {
                return value;
            }

            return "0000-0000-0000-0000";
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
                return crypto.randomUUID( RandomUUIDOptions );
            }
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
