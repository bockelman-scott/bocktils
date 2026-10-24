(function exposeModule()
{
    /**
     * Import the core ToolBocks classes and functions.
     * These are general-purpose constants and utilities
     * for inspecting types, manipulating strings, arrays, and objects.
     *
     * Additionally, the core library provides internationalization/localization (i18n, l10n),
     * number parsing, and an event-based error-handling mechanism.
     *
     * For source code and documentation, navigate to:
     * https://github.com/bockelman-scott/bocktils/tree/master/packages/core
     *
     */
    const core = require( "@toolbocks/core" );

    const jsonUtils = require( "@toolbocks/json" );

    /**
     * Import the catalog of known resolvable dependencies.
     *
     * While it is possible for a component to declare a dependency not recorded here,
     * the DependencyDescriptor must provide a means by which the dependency can be fulfilled.
     * This could be in the form of passing a default instance or a default class.
     * This should be a rare case.
     */
    const DEP_CONSTS = require( "./DependencyConstants.json" );

    // destructure the individual utilities module from the imported ToolBocks core library
    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

    const { IllegalArgumentError, ObjectEntry, objectEntries, attempt, dereference, lock } = moduleUtils;

    const { CASE_INSENSITIVE_COLLATOR, _ud, _str, _num, _obj } = constants;

    const { isNull, isNonNullObject, isString, getClassName } = typeUtils;

    const { asString, isBlank, isJson, isJsonObject, ucase } = stringUtils;

    const { asArray } = arrayUtils;

    const { asObject } = jsonUtils;

    /**
     * This class mirrors and provides a typed interface
     * for the values defined in a static JSON file
     * describing the kinds of components available.
     */
    class DependencyConstant
    {
        /**
         * The unique ID of the constant
         */
        #id;

        /**
         * The 'friendly' name of the constant.
         * Also defines the name
         * a dependent component may use to find
         * a component of this type when constructed.
         */
        #name;

        /**
         * Purely documentary property
         * to describe the type and purpose of components of this type
         */
        #description;

        constructor( pId, pName = pId, pDescription = pName )
        {
            this.#id = asString( pId, true );
            this.#name = asString( pName || pId, true );
            this.#description = asString( pDescription || pName, true );
        }

        get id()
        {
            return asString( this.#id, true );
        }

        get name()
        {
            return asString( this.#name || this.id, true );
        }

        get description()
        {
            return asString( this.#description || this.name, true );
        }

        toString()
        {
            return `${getClassName( this )}::${this.id}::${this.name}`;
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        [Symbol.toStringTag]()
        {
            return getClassName( this );
        }

        equals( pOther )
        {
            if ( isNull( pOther ) )
            {
                return false;
            }

            if ( this === pOther )
            {
                return true;
            }

            switch ( typeof pOther )
            {
                case _ud:
                    return false;

                case _str:
                    if ( isJsonObject( pOther ) )
                    {
                        return this.equals( asObject( pOther ) );
                    }
                    return ((ucase( asString( this.name, true ) === ucase( pOther, true ) )) || (ucase( asString( this.id, true ) === ucase( pOther, true ) )));

                case _num:
                    return false;

                case _obj:
                    if ( isNonNullObject( pOther ) || isJsonObject( pOther ) )
                    {
                        const other = asObject( pOther );

                        return (ucase( asString( this.name, true ) === ucase( other.name, true ) )) &&
                               (ucase( asString( this.id, true ) === ucase( other.id, true ) )) &&
                               (ucase( asString( this.description, true ) === ucase( other.description, true ) ));
                    }
                    break;

                default:
                    break;
            }

            return false;
        }

        compareTo( pOther )
        {
            if ( isNull( pOther ) )
            {
                return -1;
            }

            if ( this === pOther )
            {
                return 0;
            }

            let comp = 0;

            switch ( typeof pOther )
            {
                case _ud:
                    return -1;

                case _str:
                    if ( isJsonObject( pOther ) )
                    {
                        return this.compareTo( asObject( pOther ) );
                    }

                    const thisIdPrefix = asArray( asString( this.id, true ).split( /\./ ) )[0] || asString( this.id, true );
                    const thatIdPrefix = asArray( asString( pOther, true ).split( /\./ ) )[0] || asString( pOther, true );

                    comp = CASE_INSENSITIVE_COLLATOR.compare( asString( thisIdPrefix, true ), asString( thatIdPrefix, true ) );

                    if ( 0 === comp )
                    {
                        comp = CASE_INSENSITIVE_COLLATOR.compare( this.id, asString( pOther, true ) );
                    }

                    if ( 0 === comp )
                    {
                        comp = CASE_INSENSITIVE_COLLATOR.compare( this.name, asString( pOther, true ) );
                    }

                    break;

                case _num:
                    return -1;

                case _obj:
                    if ( isNonNullObject( pOther ) || isJsonObject( pOther ) )
                    {
                        const other = dereference( asObject( pOther ) );

                        const thisIdPrefix = asArray( asString( this.id, true ).split( /\./ ) )[0] || asString( this.id, true );
                        const thatIdPrefix = asArray( asString( other.id, true ).split( /\./ ) )[0] || asString( other.id, true );

                        comp = CASE_INSENSITIVE_COLLATOR.compare( asString( thisIdPrefix, true ), asString( thatIdPrefix, true ) );

                        if ( 0 === comp )
                        {
                            comp = CASE_INSENSITIVE_COLLATOR.compare( this.id, other.id );
                        }

                        if ( 0 === comp )
                        {
                            comp = CASE_INSENSITIVE_COLLATOR.compare( this.name, other.name );
                        }

                        if ( 0 === comp )
                        {
                            comp = CASE_INSENSITIVE_COLLATOR.compare( this.description, other.description );
                        }
                    }
                    break;

                default:
                    break;
            }

            return comp;
        }
    }

    DependencyConstant.from = function( pData )
    {
        if ( isNonNullObject( pData ) || (isString( pData ) && isJson( pData )) )
        {
            const data = dereference( asObject( pData ) );

            return (data instanceof DependencyConstant) ? data : new DependencyConstant( data?.id || data?.name,
                                                                                         data?.name || data?.id,
                                                                                         data?.description || data?.name || data?.id );
        }
        else if ( isString( pData ) )
        {
            return new DependencyConstant( pData, pData, pData );
        }

        throw new IllegalArgumentError( `Cannot interpret input as a DependencyConstant`, { data: pData }, pData );
    };

    DependencyConstant.COMPARATOR = ( a, b ) =>
    {
        const aa = DependencyConstant.from( a );
        const bb = DependencyConstant.from( b );

        return aa.compareTo( bb ) || -(bb.compareTo( aa ));
    };

    const DEP_CONSTS_IDS = [];
    const DEP_CONSTS_NAMES = [];

    const DEPS_KEYS_BY_ID = new Map();
    const DEP_CONSTS_BY_ID = new Map();

    // populate maps of DependencyConstants BY ID, BY NAME, etc.
    const DEP_CONSTS_ENTRIES = Object.entries( DEP_CONSTS ) ?? objectEntries( DEP_CONSTS );

    for( let entry of DEP_CONSTS_ENTRIES )
    {
        const key = asString( ObjectEntry.getKey( entry ) );

        const value = attempt( () => DependencyConstant.from( asObject( ObjectEntry.getValue( entry ) ) ) );

        if ( isNonNullObject( value ) )
        {
            const id = value?.id;

            const name = value?.name;

            if ( !isBlank( id ) )
            {
                // add the ID to an array of all constant ID values
                DEP_CONSTS_IDS.push( id );
            }

            if ( !isBlank( name ) )
            {
                // add the name to an array of the constant names
                DEP_CONSTS_NAMES.push( name );
            }

            // add the key to a 'map' of keys by ID (for reverse lookup)
            DEPS_KEYS_BY_ID.set( id, key );

            // add the DependencyConstant to a 'map' of constants by ID (for normal lookup)
            DEP_CONSTS_BY_ID.set( id, value );
        }
    }

    const mod =
        lock( {
                  DEP_CONSTS,
                  DEP_CONSTS_IDS,
                  DEP_CONSTS_NAMES,
                  DEPS_KEYS_BY_ID,
                  DEP_CONSTS_BY_ID,
                  DEP_CONSTS_ENTRIES,
                  DependencyConstant
              } );

    if ( _ud !== typeof module )
    {
        module.exports = mod;
    }

    return mod;

}());
