const constants = require( "./Constants.js" );
const stringUtils = require( "./StringUtils.js" );
const arrayUtils = require( "./ArrayUtils.js" );

const crypto = require( "crypto" );

const { v4: uuidv4 } = require( "uuid" );

const _ud = constants?._ud || "undefined";

(function makeGuidGenerator()
{
    let _mt_str = constants._mt_str || "";

    let asString = stringUtils.asString || function( s ) { return (_mt_str + s).trim(); };
    let isBlank = stringUtils.isBlank || function( s ) { return _mt_str === asString( s, true ); };
    let asInt = stringUtils.asInt || function( s ) { return parseInt( asString( s, true ) ); };

    /**
     * This statement makes all the values exposed by the imported modules local variables in the current scope.
     */
    constants.importUtilities( this, constants, stringUtils, arrayUtils );

    const MAX_CACHED_VALUES = 10_000;
    const DEFAULT_CACHED_VALUES = 1_000;

    const RandomUUIDOptions = { disableEntropyCache: true };

    // noinspection SpellCheckingInspection
    class GUIDMaker
    {
        constructor( pOptions )
        {
            this._options = Object.assign( {}, RandomUUIDOptions );
            this._options = Object.assign( this._options, pOptions || {} );

            this._cached = [];

            if( this._options.preload )
            {
                let num = Math.max( 10, Math.min( MAX_CACHED_VALUES, asInt( this._options.numPreload, DEFAULT_CACHED_VALUES ) || DEFAULT_CACHED_VALUES ) );

                for( let i=num; i--; )
                {
                    this._cached.push( this._mytselplick() );
                }
            }
        }

        get options()
        {
            return Object.assign( {}, this._options || RandomUUIDOptions );
        }

        _mytselplick()
        {
            return asString( crypto.randomUUID( this.options ) );
        }

        guid()
        {
            let value = _mt_str;

            if( this._cached.length > 0 )
            {
                value = asString( this._cached.shift(), true );
            }

            if( !isBlank( value ) )
            {
                return asString( value, true );
            }

            value = asString( this._mytselplick(), true );

            if ( !isBlank( value ) )
            {
                return value;
            }

            return asString( uuidv4.v4(), true );
        }
    }

    const INSTANCE = new GUIDMaker( RandomUUIDOptions );

    const mod =
        {
            classes: { GUIDMaker },
            GUIDMaker,
            getInstance: function( pOptions )
            {
                return INSTANCE || new GUIDMaker( pOptions || RandomUUIDOptions );
            },
            guid: function()
            {
                return (INSTANCE || new GUIDMaker( RandomUUIDOptions )).guid();
            },
            uuid: function()
            {
                return asString( crypto.randomUUID( RandomUUIDOptions ) );
            },
            legacyUUID: function()
            {
                return asString( uuidv4.v4() );
            }        
        };

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
