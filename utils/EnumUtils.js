const utils = require( "./CommonUtils.js" );

const $scope = utils?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exportCommonUtilities()
{
    ((utils || utils?.constants).importUtilities || utils?.constants?.importUtilities)( this, utils );

    const INTERNAL_NAME = "__BOCK__ENUM_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const constants = utils.constants || this.constants;

    const IllegalArgumentError = constants.IllegalArgumentError;

    class EnumValue
    {
        constructor( pOrdinal, pValue )
        {
            this._ordinal = pOrdinal;
            this._value = pValue;
        }

        get ordinal()
        {
            return this._ordinal;
        }

        get value()
        {
            return this._value;
        }

        toString()
        {
            return asString( this.value );
        }

        toEntry()
        {
            return [this._ordinal, this._value];
        }

        toObject()
        {
            const obj = {};

            obj[asString( this.this.ordinal )] = this.value;

            return obj;
        }
    }

    /**
     * Creates an object that can be used similar to an enum
     * The enumerable properties will be uppercase and the values *should* be of the same type
     * Examples:
     *      const Colors = new Enum(["RED","#F00"], ["GREEN","#0F0"], ["BLUE","#00F"]);
     *
     *      console.log( Colors.BLUE ); // "#00F"
     *
     * or
     *
     *      const Colors = new Enum(["RED", "#F00", "GREEN","#0F0", "BLUE","#00F"]);
     *
     *      console.log( Colors.BLUE ); // "#00F"
     *
     * or
     *
     *      const Colors = new Enum({"RED":"#F00"}, {"green":"#0F0"}, {"BLUE":"#00F"});
     *
     *      console.log( Colors.GREEN ); // "#0F0"
     *
     * or
     *
     *      const Colors = new Enum({"RED":"#F00", "GREEN":"#0F0", "Blue":"#00F"});
     *
     *      console.log( Colors.BLUE ); // "#00F"
     *
     *
     **/
    class Enum
    {
        constructor( ...pValues )
        {
            if ( _ud === typeof pValues || null == pValues )
            {
                throw new IllegalArgumentError( "An Enum must have at least one member" );
            }

            this._length = 0;

            this._map = new Map();
            this._array = [];

            const args = isArray( pValues ) ?
                         [].concat( forceToArray( pValues ) || [] ) || [] :
                         isObject( pValues ) ? [].concat( Object.assign( {}, pValues ) || {} ) : [pValues];

            switch ( args.length )
            {
                case 0:
                    throw new IllegalArgumentError( "An Enum must have at least one member" );

                case 1:
                    // do we have a single array, (which could be an array of entries)
                    // or an array of alternating values
                    // or a single object defining the enum

                    let arg = args[0];

                    this.processArg( arg );

                    break;

                default:
                    // multiple entries
                    for( let i = 0, n = args.length; i < n; i++ )
                    {
                        let arg = args[i];
                        this.processArg( arg );
                    }
                    break;
            }

            Object.defineProperty( this, "defined", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: true
            } );
        }

        isDefined()
        {
            return this.defined;
        }

        processArg( arg )
        {
            switch ( typeof arg )
            {
                case _obj:
                    if ( isArray( arg ) )
                    {
                        if ( 0 !== arg.length % 2 )
                        {
                            throw new IllegalArgumentError( "An Enum must be defined with a balanced list of name/value pairs" );
                        }
                        else
                        {
                            for( let i = 0, n = arg.length; i < n; i += 2 )
                            {
                                const key = ucase( asString( arg[i] ) );
                                const value = arg[i + 1];

                                this.addValue( key, value );
                            }
                        }
                    }
                    else if ( isPopulated( arg ) )
                    {
                        const entries = Object.entries( arg );

                        for( let i = 0, n = entries.length; i < n; i++ )
                        {
                            const entry = entries[i];

                            if ( isPopulatedArray( entry, 2 ) )
                            {
                                const key = ucase( asString( entry[0] ) );
                                const value = entry[1];

                                this.addValue( key, value );
                            }
                        }
                    }
                    break;


                default:
                    throw new IllegalArgumentError( "Usage: new Enum( Object | Array ) where the array is either an array of entries or an array with an even number of elements describing key, value, key, value ... pairs" );

            }
        }

        addValue( pKey, pValue )
        {
            if ( !this.isDefined() )
            {
                if ( !(_ud === typeof pValue || null == pValue) )
                {
                    Object.defineProperty( this,
                                           pKey,
                                           {
                                               configurable: false,
                                               enumerable: true,
                                               writable: false,
                                               value: pValue
                                           } );

                    let ordinal = this._length;

                    Object.defineProperty( this,
                                           ordinal,
                                           {
                                               configurable: false,
                                               enumerable: true,
                                               writable: false,
                                               value: new EnumValue( ordinal, pValue )
                                           } );

                    this._length += 1;

                    this._map.set( pKey, pValue );
                    this._array.push( pValue );
                }
            }
        }

        get length()
        {
            return this._length;
        }

        getValue( pKey )
        {
            return this[pKey] || this[ucase(pKey)] || this._map.get( pKey ) || ( isNumeric( pKey ) ? this._array[asInt(pKey)] : null );
        }

        toString()
        {
            let s = _mt_str;

            const propertyNames = Object.getOwnPropertyNames( this );

            let prependComma = false;

            for( let i = 0, n = propertyNames.length; i < n; i++ )
            {
                const propertyName = propertyNames[i];

                const value = this[propertyName];

                if ( value instanceof EnumValue )
                {
                    continue;
                }

                s += ((prependComma ? _comma : _mt_str) + propertyName + "=" + value);

                prependComma = true;
            }
        }

        toObject()
        {
            const me = this;

            const obj = {};

            const propertyNames = Object.getOwnPropertyNames( this );

            propertyNames.forEach( name => obj[name] = me[name] );

            return Object.freeze( obj );
        }

        entries()
        {
            const obj = this.toObject();

            return Object.entries( obj );
        }

        values()
        {
            const obj = this.toObject();

            return Object.values( obj );
        }

        keys()
        {
            const obj = this.toObject();

            return Object.keys( obj );
        }
    }

    class StringEnum
    {
        constructor( pString )
        {
            this._str = asString( pString );
        }

        at( pIndex )
        {
            return this._str.at( pIndex );
        }

        charAt( pIndex )
        {
            return this._str.charAt( pIndex );
        }

        charCodeAt( pIndex )
        {
            return this._str.charCodeAt( pIndex );
        }

        codePointAt( pPosition )
        {
            return this._str.codePointAt( pPosition );
        }

        concat( ...pStrings )
        {
            return this._str.concat( ...pStrings );
        }

        endsWith( pString, pEndPosition )
        {
            return this._str.endsWith( pString, pEndPosition );
        }

        static fromCharCode( ...pCodes )
        {
            return String.fromCharCode( ...pCodes );
        }

        includes( pString )
        {
            return this._str.includes( pString );
        }

        indexOf( pString, pStart )
        {
            return this._str.indexOf( pString, pStart );
        }

        lastIndexOf( pString, pPosition )
        {
            return this._str.lastIndexOf( pString, pPosition );
        }

        get length()
        {
            return this._str.length;
        }

        localeCompare( pString )
        {
            return this._str.localeCompare( pString );
        }

        match( pRegEx )
        {
            return this._str.match( pRegEx );
        }

        padEnd( pMaxLength, pFillWith )
        {
            return this._str.padEnd( pMaxLength, pFillWith );
        }

        padStart( pMaxLength, pFillWith )
        {
            return this._str.padStart( pMaxLength, pFillWith );
        }

        repeat( pTimes )
        {
            return this._str.repeat( pTimes );
        }

        replace( pToReplace, pReplacement )
        {
            return this._str.replace( pToReplace, pReplacement );
        }

        replaceAll( pToReplace, pReplacement )
        {
            return this._str.replaceAll( pToReplace, pReplacement );
        }

        search( pRegEx )
        {
            return this._str.search( pRegEx );
        }

        slice( pNumber, pEnd )
        {
            return this._str.slice( pNumber, pEnd );
        }

        split( pSeparator, pLimit )
        {
            return this._str.split( pSeparator, pLimit );
        }

        startsWith( pString, pPosition )
        {
            return this._str.startsWith( pString, pPosition );
        }

        substr( pFrom, pLength )
        {
            return this._str.substr( pFrom, pLength );
        }

        substring( pStart, pEnd )
        {
            return this._str.substring( pStart, pEnd );
        }

        toLocaleLowerCase()
        {
            return this._str.toLocaleLowerCase();
        }

        toLocaleUpperCase()
        {
            return this._str.toLocaleUpperCase();
        }

        toLowerCase()
        {
            return lcase( this._str );
        }

        toString()
        {
            return this._str;
        }

        toUpperCase()
        {
            return ucase( this._str );
        }

        trim()
        {
            return this._str.trim();
        }

        trimEnd()
        {
            return this._str.trimEnd();
        }

        trimStart()
        {
            return this._str.trimStart();
        }

        valueOf()
        {
            return this._str.valueOf();
        }
    }

    const mod =
        {
            Enum,
            StringEnum
        };

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
