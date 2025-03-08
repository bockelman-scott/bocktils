/**
 * @fileoverview
 * @name ResourceUtils
 * @author Scott Bockelman
 * @license MIT
 *
 * <p>This module exposes classes for working with externalized strings.</p>
 * <br>
 * In addition to providing the ability to localize text to support various languages and locales,
 * these classes also provide the ability to override text based on other factors,<br>
 * such as a specific customer or release of an application.<br>
 * <br>
 */

/**
 * Import the core modules of the ToolBocks&trade; library.
 * These modules provide a number of essential utility functions
 * and foundational features provided by the ToolBocks&trade; framework.
 * <br>
 * @type {ToolBocksModule|Object}
 */
const core = require( "@toolbocks/core" );

/**
 * Import the file system utilities for execution-environment agnostic functionality
 * @type {ToolBocksModule|Object}
 */
const fileUtils = require( "@toolbocks/files" );

/**
 * Import the JSON related modules which expose functions for working with JSON data,<br>
 * even structures that might contain circular references or self-references.
 * <br>
 * @type {ToolBocksModule|Object}
 */
const jsonUtils = require( "@toolbocks/json" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

/* define a variable for typeof undefined **/
const { _ud = "undefined", $scope } = constants;

// noinspection FunctionTooLongJS
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__RESOURCE_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const {
        Xor,
        Nand,
        ToolBocksModule,
        ObjectEntry,
        objectEntries,
        objectKeys,
        attempt,
        asyncAttempt,
        resolveError,
        getMessagesLocale,
        isFulfilled,
        isRejected,
        asPhrase,
        lock,
        populateOptions,
        mergeOptions,
        immutableCopy,
        no_op,
        IterationCap,
        isLogger,
        compareNullable

    } = moduleUtils;

    const {
        _mt_str,
        _spc,
        _hyphen,
        _underscore,
        _equals,
        _colon,
        _dot,
        _lf,
        _str,
        _num,
        _big,
        _bool,
        _symbol,
        _obj,
        _fun,
        S_ENABLED,
        S_DISABLED,
        S_ERROR,
        S_WARN,
        S_ERR_PREFIX,
        MILLIS_PER,
        MESSAGES_LOCALE,
    } = constants;

    const {
        isNull,
        isNumeric,
        isInteger,
        isString,
        isEmptyString,
        isDate,
        isFunction,
        isObject,
        isArray,
        is2dArray,
        isKeyValueArray,
        isClass,
        isNonNullObject,
        isNonNullValue,
        isMap,
        isPromise,
        firstMatchingType,
        instanceOfAny,
        isAssignableTo,
        toIterable
    } = typeUtils;

    const {
        asString,
        asInt,
        asFloat,
        isBlank,
        isJson,
        lcase,
        ucase,
        toUnixPath,
        toBool,
        endsWithAny,
        leftOf,
        rightOf,
        leftOfLast,
        rightOfLast,
        isFilePath,
        isLegalFileName
    } = stringUtils;

    const { varargs, flatArgs, asArray, unique, Filters, AsyncBoundedQueue } = arrayUtils;

    const {
        DEFAULT_LOCALE,
        DEFAULT_LOCALE_STRING,
        isLocale,
        isDefaultLocale,
        isDefaultLanguage,
        isDefaultRegion,
        resolveLocale,
        LocaleResourcesBase,
        parseLocale
    } = localeUtils;

    const { asJson, parseJson } = jsonUtils;

    const {
        resolvePath,
        getFilePathData,
        getDirectoryName,
        getFileName,
        getFileExtension,
        readTextFile,
        writeTextFile
    } = fileUtils;


    const modName = "ResourceUtils";


    /**
     * Represents the path of the current working directory.
     * This variable typically holds the absolute path of the directory
     * where the program is being executed.
     *
     * This value may be used for file system operations or to determine
     * the relative locations of other files and directories.
     *
     * Note: Ensure proper handling when manipulating or joining paths
     * to avoid errors related to file system operations.
     *
     * @type {string}
     */
    let currentDirectory = getDirectoryName( __filename );

    /**
     * Represents the root directory of the project.
     * This variable is used as a reference point for resolving
     * file and folder paths relative to the project's base directory.
     *
     * @type {string}
     */
    let projectRootDirectory = resolvePath( currentDirectory, "../../../" );

    /**
     * Represents the default file system path <i>or URL</i> used as the base directory
     * for finding and loading resources.<br>
     *
     * @type {string}
     */
    let defaultPath = resolvePath( currentDirectory, "../properties/messages.properties" );

    /**
     * An object containing default messages used for various notifications,
     * alerts, or informational purposes throughout an application or library.
     * <br>
     * <br>
     * These messages serve as pre-defined text that can be reused in
     * different parts of the codebase to ensure consistency.<br>
     * <br>
     *
     * This object typically includes strings
     * representing basic concepts relevant to the application or library,
     * rather than feature-specific messages
     *
     * @type {Object.<string, string>}
     */
    let defaultMessages;

    /**
     * Represents the default locale used in the application for internationalization or localization purposes.
     * <br>
     * <br>
     * This variable typically stores a string value that adheres to IETF BCP 47 language tag standards,
     * such as "en-US" for American English or "fr-FR" for French in France,
     * but can also be assigned to an instance of Intl.Locale.
     * <br>
     * Usages of the value will convert between the string and object accordingly.
     * <br>
     * @type {string|Intl.Locale}
     */
    let defaultLocale = getMessagesLocale();

    /**
     * This is a dictionary of this module's dependencies.
     * <br>
     * It is exported as a property of this module,
     * allowing us to just import this module<br>
     * and then use the other utilities as properties of this module.
     * <br>
     * @dict
     * @type {Object}
     */
    const dependencies =
        {
            moduleUtils,
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils
        };

    let toolBocksModule = new ToolBocksModule( modName, INTERNAL_NAME );

    const executionEnvironment = toolBocksModule.executionEnvironment;

    const _isBrowser = executionEnvironment.isBrowser();

    const rxFileHeader = /^\s*\[[^\]]+]\s*/;

    const extractFileHeader = function( pString )
    {
        if ( isString( pString ) && !isBlank( pString ) )
        {
            const s = leftOf( asString( pString, true ), /\r?\n/ );

            const matches = rxFileHeader.exec( s );

            return matches ? matches[0] : _mt_str;
        }

        return _mt_str;
    };

    /**
     * This class <i>roughly approximates</i> the structure and functionality of the java.utils.Properties class.
     * <br>
     * @see {@link https://docs.oracle.com/javase/8/docs/api/java/util/Properties.html}
     * <br>
     * <br>
     * This class holds a set of key/value pairs where both the key and value are strings.
     * <br>
     * <br>
     * Additionally, instances of this class can be nested
     * to provide fallback or default values for properties
     * that are not overridden for a specific context.
     * <br>
     * <br>
     * @class
     * @extends Map
     *
     */
    class Properties extends Map
    {
        #name = "Properties";

        #family = "Properties";

        #locale = DEFAULT_LOCALE;

        /**
         * Nested instance holding default values for keys not defined in this instance
         * @type {Map|Properties}
         */
        #defaults;

        #additionalKeys;

        /**
         * Constructs a new instance of the Properties class
         * and initializes the default/fallback properties if specified.
         * <br>
         * <br>
         *
         * @param {string} [pName='Properties']  A name to identify this instance.
         *                                       The name should be composed of
         *                                       the "family" + hierarchical modifiers
         *                                       that allow the construction of multiple levels
         *                                       of fallback to find the most relevant value
         *                                       for a particular key.
         *                                       <br>
         *                                       <br>
         *                                       Alternatively, you can pass the 'family' name
         *                                       and provide one or more additional keys
         *                                       to be appended to the name
         *
         * @param {Properties|Map} [pDefaults] - The default values to use when retrieving values.
         *                                       This should be another instance of the Properties class or a Map.
         *
         * @param {Intl.Locale|string} [pLocale=DEFAULT_LOCALE] The locale with which these properties are associated
         *
         * @param {...string} [pAdditionalKeys] Zero or more additional strings to uniquely identify this instance
         *
         * @return {Properties}
         */
        constructor( pName, pLocale = DEFAULT_LOCALE, pDefaults = new Map(), ...pAdditionalKeys )
        {
            super();

            this.#family = this.calculateFamilyName( pName, pLocale );

            this.#name = asString( pName || this.#name, true ) || this.calculateName( pName, pLocale ) || this.#family;

            const hasDefaults = isNonNullObject( pDefaults ) &&
                                (isMap( pDefaults ) || pDefaults instanceof this.constructor) &&
                                pDefaults !== this &&
                                pDefaults?.size > 0;

            this.#defaults = hasDefaults ? this.#initializeDefaults( pDefaults ) : new Map();

            this.#locale = resolveLocale( pLocale || this.#locale );

            this.#name += !isDefaultLocale( this.#locale ) ? (_hyphen + this.#locale.toString()) : _mt_str;

            const additionalKeys = flatArgs( varargs( ...pAdditionalKeys ) ).filter( e => isString( e ) && !isBlank( e ) );

            if ( additionalKeys.length > 0 )
            {
                this.#additionalKeys = [...(additionalKeys || [])];

                this.#name += (_hyphen + additionalKeys.join( _hyphen ));
            }
        }

        calculateFamilyName( pName, pLocale )
        {
            let nm = asString( (asString( pName, true ) || this.#name) || this.#name, true );

            let locale = resolveLocale( pLocale || this.#locale ) || DEFAULT_LOCALE;

            let separator = nm.includes( _underscore ) ? _underscore : _hyphen;

            let parts = nm.replace( locale.toString(), _mt_str ).split( /[_-]/ );

            parts = parts.filter( e => !isBlank( e ) );
            parts = parts.filter( e => lcase( e ) !== lcase( asString( locale.language, true ) ) );
            parts = parts.filter( e => lcase( e ) !== lcase( asString( locale.region, true ) ) );
            parts = parts.filter( e => lcase( e ) !== lcase( asString( locale.script, true ) ) );

            return parts.join( separator );
        }

        calculateName( pName, pLocale )
        {
            let nm = asString( (asString( pName, true ) || this.#name) || this.#name, true );

            let locale = resolveLocale( pLocale || this.#locale ) || DEFAULT_LOCALE;

            let separator = nm.includes( _underscore ) ? _underscore : _hyphen;

            let parts = nm.replace( locale.toString(), _mt_str ).split( /[_-]/ );

            parts = parts.filter( e => !isBlank( e ) );
            parts = parts.filter( e => lcase( e ) !== lcase( asString( locale.language, true ) ) );
            parts = parts.filter( e => lcase( e ) !== lcase( asString( locale.region, true ) ) );
            parts = parts.filter( e => lcase( e ) !== lcase( asString( locale.script, true ) ) );

            return parts.join( separator ) + (_hyphen + locale.toString());
        }


        get name()
        {
            return asString( this.#name, true ) || ((asString( this.#family, true ) || "Properties") + (isNonNullObject( this.#locale ) ? (_hyphen + this.#locale.toString()) : _mt_str));
        }

        get family()
        {
            return this.#family || this.calculateFamilyName( this.#name, this.#locale );
        }

        get locale()
        {
            return resolveLocale( this.#locale ) || DEFAULT_LOCALE;
        }

        get additionalKeys()
        {
            return [...(this.#additionalKeys || [])];
        }

        /**
         * Generates the default properties object
         * to provide the fallback values
         * for keys not defined for this specific instance
         *
         * @private
         */
        #initializeDefaults( pDefaults )
        {
            const name = pDefaults?.name || (this.#name + _underscore + "defaults");

            const locale = resolveLocale( pDefaults?.locale ) || this.locale;

            const properties = new Properties( name, locale );

            let map = Properties.isProperties( pDefaults ) && this !== pDefaults ? pDefaults : properties;

            this.#defaults = (map instanceof this.constructor) ? lock( map ) : isMap( map ) ? map.forEach( ( v, k ) => properties.set( k, v ) ) : properties;

            return this.#defaults || properties;
        }

        /**
         * Returns a read-only copy of the Properties object providing the default, or fallback, values
         * for this instance
         *
         * @returns {Properties} a read-only copy of the Properties object providing the default, or fallback, values
         */
        get defaults()
        {
            return (this.hasValidDefaults() ? lock( this.#defaults ) : lock( new Properties() ));
        }

        /**
         * Sets the specified defaults to be the defaults, or fallback, properties for this instance
         *
         * @param pDefaults
         */
        set defaults( pDefaults )
        {
            this.#defaults = lock( this.#initializeDefaults( pDefaults ) );
        }

        get size()
        {
            return unique( [...(super.keys() || []), ...(this.defaults?.keys() || [])] ).length;
        }

        static get [Symbol.species]()
        {
            return this;
        }

        [Symbol.iterator]()
        {
            return toIterable( lock( [...this.entries()] ) );
        }

        /**
         * Returns all available key/value pairs,
         * including those that are defined in the default/fallback properties.
         * <br>
         *
         * @returns {Array.<Array.<string>>}
         */
        entries()
        {
            let arr = [...(super.entries() || [])];

            if ( this.hasValidDefaults() )
            {
                this.defaults.forEach( ( v, k ) => !super.has( k ) ? arr.push( [asString( k ), asString( v )] ) : no_op );
            }

            return lock( [...arr] );
        }

        /**
         * Returns all defined keys,
         * including those that are defined in the default/fallback properties.
         * <br>
         *
         * @returns {Array.<string>}
         */
        keys()
        {
            const arr = [...(super.keys() || [])];

            if ( this.hasValidDefaults() )
            {
                this.defaults.forEach( ( v, k ) => !super.has( k ) ? arr.push( asString( k ) ) : no_op );
            }

            return lock( [...arr] );
        }

        /**
         * Returns all defined values,
         * including those that are defined in the default/fallback properties.
         * <br>
         *
         * @returns {Array.<string>}
         */
        values()
        {
            const arr = [...(super.values() || [])];

            if ( this.hasValidDefaults() )
            {
                this.defaults.forEach( ( v, k ) => !super.has( k ) ? arr.push( asString( v ) ) : no_op );
            }

            return lock( [...arr] );
        }

        /**
         * Removes only the key/value pairs specific to this instance,
         * <i>preserving</i> those in the defaults, or backing, map/properties
         *
         * @return {void}
         */
        clearOverrides()
        {
            super.clear();
        }

        /**
         * Removes only the default, or backing/fallback, key/value pairs,
         * preserving the key/values specific to this instance
         *
         * @return {void}
         */
        clearDefaults()
        {
            this.#defaults = new Properties();
        }

        /**
         * Removes <b>ALL<b> key/value pairs,
         * including those in the defaults, or backing, map/properties
         *
         * @return {void}
         */
        clear()
        {
            this.clearOverrides();

            if ( this.hasValidDefaults() )
            {
                this.clearDefaults();
            }
        }

        /**
         * Executes the specified function once for each key-value pair in this collection.
         * <br>
         *
         * @param {Function} pFunction A function to execute for each key-value pair.
         *                             It is called with three arguments:
         *                             the value of the current element,
         *                             the key of the current element,
         *                             and the collection object being traversed.
         *
         * @param {*} [pThis] Optional. Value to use as `this` when executing `pFunction`.
         *
         * @return {void} Does not return a value.
         */
        forEach( pFunction, pThis )
        {
            const me = this;
            this.entries().forEach( e => pFunction.call( pThis || me || this, asString( e[1] ), asString( e[0] ), this ) );
        }

        set( pKey, pValue )
        {
            const key = asString( pKey, true );

            return super.set( key, asString( pValue ) );
        }

        /**
         * Retrieves the value associated with the specified key.<br>
         * <br>
         * The value may be retrieved from the defaults
         * if it is not present in the entries specific to this collection.
         *
         * @param {string} pKey - The key whose associated value is to be returned
         * @return {string} The value associated with the specified key
         *
         */
        get( pKey )
        {
            const key = asString( pKey, true );

            let value = super.get( key );

            if ( (isNull( value ) || isBlank( value )) && this.hasValidDefaults() )
            {
                value = this.defaults.get( key );
            }

            return isNonNullValue( value ) && !isEmptyString( value ) ? asString( value ) : (pKey instanceof ResourceKey ? pKey.defaultValue : _mt_str);
        }

        /**
         * Returns true if the specified key corresponds to a non-empty value available in this collection.
         *
         * @param {string} pKey the key to evaluate
         * @returns {boolean|*} true if the specified key corresponds to a non-empty value available in this collection
         */
        has( pKey )
        {
            const key = asString( pKey, true );
            return super.has( key ) || (this.hasValidDefaults() && this.defaults.has( key ));
        }

        /**
         * Returns true if this collection is populated
         * with a non-null/non-empty set of defaults, or fallback, properties
         *
         * @returns {*|boolean} true if this collection is populated
         * with a non-null/non-empty set of defaults, or fallback, properties
         *
         */
        hasValidDefaults()
        {
            return Properties.isProperties( this.#defaults ) &&
                   (this.#defaults !== this) &&
                   (this.#defaults.size > 0);
        }

        /**
         * Populates this instance with key/value pairs.<br>
         * <br>
         * The source can be the contents of a properties file,
         * an array of strings, each representing a key/value pair,
         * a 2d array (an array of key/pairs),
         * a Map, or another Properties object
         *
         * @param {string|Array.<string>|Array.<Array.<string>>|Map|Properties} pSource The source from which to load key/value data
         *
         * @param pOptions
         *
         * @returns {Properties} this instance, now populated with the key/value pairs found in the specified source
         */
        load( pSource, pOptions = DEFAULT_PROPERTIES_OPTIONS )
        {
            const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

            let name = options.name || pSource?.name || this.name;
            let locale = resolveLocale( options.locale || pSource?.locale || this.locale );

            options.name = name || options.name || this.name;
            options.locale = locale || options.locale || this.locale;

            let source = pSource;

            if ( isString( source ) )
            {
                source = Properties.fromPropertiesString( source, options );
            }
            else if ( isArray( source ) )
            {
                if ( isKeyValueArray( source ) )
                {
                    source = Properties.from2dArray( source, options );
                }
                else
                {
                    source = Properties.fromLines( source, options );
                }
            }
            else if ( isMap( source ) )
            {
                source = Properties.fromObject( source, options );
            }

            if ( Properties.isProperties( source ) )
            {
                source.forEach( ( v, k ) => this.set( asString( k ), asString( v ) ) );
            }

            return this;
        }

        /**
         * Returns a string representing the instance specific key/value pairs available.
         * That is, this method excludes the defaults.
         * This string is formatted as suitable for saving as a *.properties file
         */
        toString()
        {
            let str = "[" + this.name + "]\n";

            const entries = [...(super.entries() || [])];

            entries.forEach( e => str += `${e[0]}=${e[1]}\n` );

            return str;
        }

        [Symbol.toPrimitive]( pHint )
        {
            return this.toString();
        }

        /**
         * Writes the instance-specific properties to the file specified.
         * The file will not contain properties defined in the defaults.
         *
         * @param pFilePath
         * @returns {Promise<*>}
         */
        async writeToFile( pFilePath )
        {
            const s = this.toString();
            return await asyncAttempt( async() => await writeTextFile( resolvePath( pFilePath ), s ) );
        }
    }

    const DEFAULT_PROPERTIES = new Properties();

    /**
     * Returns true if the specified value is a Map or an instance of Properties
     */
    Properties.isProperties = function( pObject )
    {
        return isNonNullObject( pObject ) && (isMap( pObject ) || pObject instanceof Properties);
    };

    Properties.comparator = function( pA, pB )
    {
        if ( pA === pB )
        {
            return 0;
        }

        if ( !Properties.isProperties( pA ) || !Properties.isProperties( pB ) )
        {
            return 1;
        }

        function localeData( pProperties )
        {
            const locale = pProperties?.locale;

            const name = asString( pProperties?.name, true ) || pProperties.calculateName( pProperties?.name || pProperties?.family, pProperties?.locale );

            const parts = name.split( /[_-]/ ).filter( e => e.length > 0 );

            let base = pProperties?.family || asString( parts[0], true );
            let language = lcase( asString( locale?.language, true ) || (parts.length > 1 ? asString( parts[1], true ) : DEFAULT_LOCALE_STRING) );
            let region = lcase( asString( locale?.region, true ) || (parts.length > 2 ? asString( parts[2], true ) : _mt_str) );

            return { locale, name, parts, base, language, region };
        }

        return compareNullable( pA, pB, false, ( a, b ) =>
        {
            const {
                locale: localeA,
                name: nameA,
                parts: partsA,
                base: baseA,
                language: langA,
                region: regionA
            } = localeData( a );

            const {
                locale: localeB,
                name: nameB,
                parts: partsB,
                base: baseB,
                language: langB,
                region: regionB
            } = localeData( b );

            let delta = baseA.localeCompare( baseB );

            if ( 0 !== delta )
            {
                return delta;
            }

            delta = langA.localeCompare( langB );

            if ( 0 !== delta )
            {
                return isDefaultLanguage( langA ) ? -1 : isDefaultLanguage( langB ) ? 1 : delta;
            }

            delta = regionA.localeCompare( regionB );

            if ( 0 !== delta )
            {
                return isDefaultRegion( regionA ) ? -1 : isDefaultRegion( regionB ) ? 1 : delta;
            }

            delta = (partsA.length || 0) - (partsB.length || 0);

            if ( delta > 0 )
            {
                return 1;
            }
            else if ( delta < 0 )
            {
                return -1;
            }

            for( let i = 0, n = Math.min( partsA.length, partsB.length ); i < n && 0 === delta; i++ )
            {
                const partA = partsA[i];
                const partB = partsB[i];

                delta = partA.localeCompare( partB );
            }

            return delta;
        } );
    };

    Properties.sort = function( ...pProperties )
    {
        const props = flatArgs( varargs( ...pProperties ) ).filter( e => e instanceof Properties );
        return props.sort( Properties.comparator );
    };

    /**
     * @typedef {object} PropertiesLoadOptions Options that control how to load properties files
     *
     * @property {string} [assignment='='] The character to be interpreted as the assignment operator of a value to a key
     * @property {boolean} [trim=true] Whether to remove leading and trailing whitespace from values
     *
     * @property {string} [name] The name to use for the resulting Properties instance
     * @property {Intl.Locale|string} [locale] The locale to assign to the resulting Properties instance
     */

    /**
     * These are the default options used when loading properties
     *
     * @type {PropertiesLoadOptions}
     */
    const DEFAULT_PROPERTIES_OPTIONS =
        {
            assignment: _equals,
            trim: true,
            name: null,
            locale: null
        };


    const isPropertyFileHeader = ( content ) => isString( content ) && rxFileHeader.test( asString( content, true ) );

    /*
     * Returns true if the string is either a valid key or valid line in a properties file
     */
    const isValidPropertyKey = e => isString( e ) && !isBlank( e ) && !(asString( e, true ).startsWith( "#" ) || asString( e, true ).startsWith( "!" ));

    /*
     * Returns true if the string represents a valid line in a properties file
     */
    const isValidPropertyFileEntry = e => isValidPropertyKey( e ) && Xor( e.includes( _equals ), e.includes( _colon ) );

    /*
     * Returns true if the content has a [tag] or contains at least one valid property
     */
    const isValidPropertiesContent = ( content ) => isString( content ) &&
                                                    !isBlank( content ) &&
                                                    (isPropertyFileHeader( content ) || isValidPropertyFileEntry( content ));

    Properties.extractFileHeader = extractFileHeader;

    Properties.nameFromPrefix = function( pPrefix )
    {
        if ( isString( pPrefix ) && isPropertyFileHeader( pPrefix ) )
        {
            let prefix = leftOf( asString( pPrefix, true ), /\r?\n/ );

            prefix = prefix.replace( /^\[/, _mt_str ).replace( /]$/, _mt_str ).trim();

            prefix = prefix.includes( "/" ) ? (rightOfLast( prefix, "/" ) || prefix) : (prefix.includes( "\\" ) ? rightOfLast( prefix, "\\" ) || prefix : prefix) || prefix;

            prefix = (prefix.includes( _dot ) ? leftOf( prefix, _dot ) : prefix);

            const parts = prefix.split( /[_\/\\-]/ );

            const family = asString( parts.shift(), true ).replaceAll( /[_-]+/g, _mt_str );

            const localeString = parts.join( _hyphen ) || _mt_str;

            return {
                filePath: prefix,
                dirName: _mt_str,
                fileName: prefix,
                extension: _mt_str,
                family,
                name: prefix,
                localeString
            };
        }
        return Properties.nameFromPath( pPrefix );
    };

    Properties.nameFromPath = function( pFilePath )
    {
        let path = asString( pFilePath, true ).replace( /^\[/, _mt_str ).replace( /]$/, _mt_str ).trim();

        const { filePath, dirName, fileName, extension } = getFilePathData( path );

        let name = asString( fileName, true ).replace( new RegExp( extension ), _mt_str ).replace( /\.+$/, _mt_str );

        const parts = name.split( /[_\/\\-]/ );

        const family = asString( parts.shift(), true ).replaceAll( /[_-]+/g, _mt_str );

        name = asString( family, true );

        let localeString = _mt_str;

        while ( parts.length > 0 )
        {
            const part = asString( parts.shift(), true );

            const localePart = _hyphen + part;

            localeString += localePart;
        }

        localeString = localeString.replace( /^[_-]+/, _mt_str ).replace( /[_-]+$/, _mt_str );

        if ( isLocale( localeString ) )
        {
            let locale = attempt( () => resolveLocale( localeString ) );

            if ( isNonNullObject( locale ) && (locale.toString() === localeString || localeString.startsWith( locale.baseName )) )
            {
                name += _hyphen + localeString;
            }
        }

        return { filePath, dirName, fileName, extension, family, name, localeString };
    };

    Properties.localeFromPath = function( pFilePath )
    {
        let locale = DEFAULT_LOCALE;

        const {
            filePath,
            dirName,
            fileName,
            extension,
            family,
            name,
            localeString
        } = Properties.nameFromPath( pFilePath );

        if ( isLocale( localeString ) )
        {
            locale = attempt( () => resolveLocale( localeString ) );
        }
        else
        {
            let arr = dirName.split( /[_-]+/ ).filter( e => !isBlank( e ) );

            let s = asString( arr.join( _hyphen ), true );

            while ( !isLocale( s ) && arr.length > 0 )
            {
                arr.shift();

                s = asString( arr.join( _hyphen ), true );

                locale = attempt( () => resolveLocale( s ) );
            }
        }

        return attempt( () => resolveLocale( locale ) );
    };

    /**
     * Returns a new instance of Properties populated with the key/value pairs in the specified array.
     * @param {Array<Array.<string>>} pKvPairs An array of arrays,
     *                                         where each element is a 2-element array
     *                                         containing the key and its associated value
     *
     * @param {PropertiesLoadOptions} [pOptions=DEFAULT_PROPERTIES_OPTIONS] An object defining properties
     *                                                                      that control how to handle the input data.
     *
     */
    Properties.from2dArray = function( pKvPairs, pOptions = DEFAULT_PROPERTIES_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

        let kvPairs = asArray( pKvPairs );

        if ( options.trim )
        {
            kvPairs = kvPairs.map( e => e.map( e => e.trim() ) );
        }

        const map = new Map( kvPairs );

        const properties = new Properties( options.name, options.locale );

        return properties.load( map, options );
    };

    /**
     * Returns a new instance of Properties
     * populated with the data in an array of strings,
     * where each string is formatted as either key=value or key:value.
     *
     * @param {Array.<string>} pArr An array of strings,
     * each representing a key/value pair,
     * formatted as either key=value or key:value.
     *
     * @param {PropertiesLoadOptions} pOptions An object defining the assignment operator to expect and whether to trim values.
     *
     * @returns {Properties} a new instance of Properties
     * populated with the data in an array of strings,
     * where each string is formatted as either key=value or key:value.
     *
     */
    Properties.fromLines = function( pArr, pOptions = DEFAULT_PROPERTIES_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

        let arr = asArray( pArr ).filter( e => isString( e ) );

        arr = arr.map( e => e.trim() ).filter( e => !isBlank( e ) && isValidPropertyFileEntry( e ) );

        let kvPairs = arr.map( e => e.split( options.assignment ) );

        return Properties.from2dArray( kvPairs, options );
    };

    /**
     * Returns a new instance of Properties loaded with the key/value pairs found by
     * parsing the specified string.<br>
     * <br>
     *
     * The input string should contain key-value pairs separated by newlines,
     * where each pair is formatted as either "key=value" or "key:value", as specified in the options.
     *
     * @function
     * @name Properties.fromPropertiesString
     *
     * @param {string} pString - The string containing key-value pairs to be parsed.
     *
     * @param {PropertiesLoadOptions} pOptions An object specifying the assignment operator and whether to trim values.
     *
     * @returns {Properties} A Properties object populated from the parsed string input.
     */
    Properties.fromPropertiesString = function( pString, pOptions = DEFAULT_PROPERTIES_OPTIONS )
    {
        if ( isString( pString ) )
        {
            const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

            const str = asString( pString, options.trim );

            let nm = options.name || Properties.nameFromPrefix( str );

            let loc = resolveLocale( options.locale || Properties.localeFromPath( str ) );

            options.name = nm || options.name;
            options.locale = loc || options.locale;

            if ( isPropertyFileHeader( str ) )
            {
                const { family, name, localeString } = Properties.nameFromPrefix( str );

                options.family = family || options.family;

                loc = isLocale( localeString ) ? resolveLocale( localeString ) : loc;
                options.locale = resolveLocale( loc || options.locale );

                nm = asString( name, true ) || options.name || ((family || options.family) + _hyphen + (loc || options.locale).toString());
                options.name = nm || options.name;
            }

            let arr = asString( str, true ).replace( rxFileHeader, _mt_str ).split( /\r?\n/ );

            arr = arr.map( e => e.replace( /^\s*/, _mt_str ).replace( /\s*$/, _mt_str ) );

            arr = arr.filter( isValidPropertyFileEntry );

            return Properties.fromLines( arr, options );
        }
    };

    /**
     * Returns a new instance of Properties,
     * populated with the key/value pairs found in the specified object.
     *
     * @param {Map|Properties|Object} pObject An object from which to populate the properties
     * @param {PropertiesLoadOptions} pOptions An object specifying the assignment operator and whether to trim values.
     * @returns {Properties} a new instance of Properties, populated with the key/value pairs found in the specified object.
     */
    Properties.fromObject = function( pObject, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

        let properties = Properties.isProperties( pObject ) ?
                         new Properties( asString( (pObject?.name || options?.name), true ) || options.name,
                                         resolveLocale( pObject?.locale || options.locale ) || options.locale ) :
                         new Properties( options.name, options.locale );

        if ( isNonNullObject( pObject ) )
        {
            if ( Properties.isProperties( pObject ) )
            {
                properties.defaults = pObject;
                return properties;
            }

            if ( isMap( pObject ) )
            {
                const map = new Map( pObject );
                map.forEach( ( v, k ) => properties.set( asString( k, true ), asString( v, options.trim ) ) );
            }
            else if ( isArray( pObject ) || isString( pObject ) )
            {
                properties = properties.load( pObject, options );
            }
            else
            {
                const stringsOnly = e => isString( ObjectEntry.getKey( e ) ) &&
                                         isString( ObjectEntry.getValue( e ) );

                const entries = objectEntries( pObject ).filter( e => !isNull( e ) && e.isValid() );

                // TODO: collapse to a.b.c=value form

                const filtered = entries.filter( stringsOnly ).filter( e => !isBlank( ObjectEntry.getKey( e ) ) );

                const unwrappedValues = ObjectEntry.unwrapValues( filtered );

                properties = properties.load( unwrappedValues, options );
            }
        }

        return properties;
    };

    /**
     * Returns a new instance of Properties, populated with the values found in the JSON data provided.<br>
     * Parses a JSON-formatted string and converts it into a Properties object.<br>
     * <br>
     *
     * @function
     * @param {string} pJson - The JSON-formatted string to parse.
     * @param {PropertiesLoadOptions} pOptions
     *
     * @returns {Properties} The Properties object created from the JSON string.
     */
    Properties.fromJsonString = function( pJson, pOptions = DEFAULT_PROPERTIES_OPTIONS )
    {
        const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

        const fileHeader = isString( pJson ) ? extractFileHeader( pJson ) : _mt_str;

        if ( !isBlank( fileHeader ) )
        {
            const { family, name, localeString } = Properties.nameFromPrefix( fileHeader );

            options.family = family || options.family;
            options.name = asString( name, true ) || options.name;
            options.locale = isLocale( localeString ) ? resolveLocale( localeString ) : options.locale;
        }

        const json = isString( pJson ) ? asString( pJson, true ).replace( rxFileHeader, _mt_str ).trim() : pJson;

        const obj = isJson( json ) ? attempt( () => parseJson( json ) ) : Properties.isProperties( pJson ) ? pJson : {};

        return Properties.fromObject( obj, options );
    };

    /**
     * Reads properties from a file and returns them as an object.
     *
     * This method parses the specified file and loads its contents as key-value
     * pairs, assuming the format is compatible with traditional properties file
     * syntax. It can handle standard features such as comments and empty lines.
     *
     * @param {string} pFilePath - The path to the properties file to be loaded.
     * @param pOptions
     * @returns {Promise<Properties>} a new instance of Properties, populated with the key/value pairs defined in the file
     */
    Properties.fromFile = async function( pFilePath, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

        const filePath = resolvePath( pFilePath );

        const prefix = "[" + filePath + "]\n";

        let contents = await asyncAttempt( () => readTextFile( filePath ) );

        if ( isString( contents ) && !isBlank( contents ) )
        {
            contents = prefix + contents.replace( prefix, _mt_str );

            const { family, name, localeString } = Properties.nameFromPath( filePath );

            options.family = family || options.family;
            options.name = name || options.name;
            options.locale = resolveLocale( localeString || options.locale );

            return (isJson( contents )) ?
                   Properties.fromJsonString( contents, options ) :
                   Properties.fromPropertiesString( contents, options );
        }

        const message = `Failed to read properties file: ${filePath}`;

        let error = resolveError( new Error( message ) );

        toolBocksModule.reportError( error, message, S_ERROR, Properties.fromFile, [pFilePath, pOptions, filePath, options, prefix, contents] );

        return new Properties( options.name, options.locale );
    };

    /**
     * Fetches properties content from an HTTP(S) endpoint
     * and returns a new instance of Properties populated from that content
     *
     * @param {string|Request} pUrl the URL (or a Request Object) from which to retrieve the properties content
     * @param {PropertiesLoadOptions} [pOptions=DEFAULT_PROPERTIES_OPTIONS] an object defining how to interpret and transform the content
     */
    Properties.fromUrl = async function( pUrl, pOptions = DEFAULT_PROPERTIES_OPTIONS )
    {

    };

    Properties.from = function( pSource, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

        let name = options.name;
        let locale = options.locale;

        options.name = name || options.name;
        options.locale = locale || options.locale;

        if ( isString( pSource ) )
        {
            if ( isValidPropertiesContent( pSource ) )
            {
                return Properties.fromPropertiesString( pSource, options );
            }

            return _isBrowser() ? Properties.fromUrl( pSource, options ) : Properties.fromFile( pSource, options );
        }
        else if ( isMap( pSource ) )
        {
            return Properties.fromObject( pSource, options );
        }
        else if ( isArray( pSource ) )
        {
            const arr = asArray( pSource );

            if ( isKeyValueArray( arr ) )
            {
                return Properties.from2dArray( arr, options );
            }
            else if ( arr.every( isValidPropertiesContent ) )
            {
                return Properties.fromLines( arr, options );
            }
            else if ( arr.every( isFilePath ) )
            {
                //
            }
        }
        else if ( isJson( pSource ) )
        {
            return Properties.fromJsonString( pSource, options );
        }
        else if ( isNonNullObject( pSource ) )
        {
            return Properties.fromObject( pSource, options );
        }

        return new Properties( options.name, options.locale );
    };

    /**
     * Represents the default configuration options for the application or library.
     * <br>
     * <br>
     * This object contains properties that define the initial settings.
     *
     * @typedef {Object} DEFAULT_RESOURCE_CACHE_OPTIONS
     * @property {Object|null} resourceLoader - Specifies the resource loader instance or null if not provided.
     * @property {Object|null} paths - Holds path configurations or null if undefined.
     * @property {Object|null} locales - Specifies locale settings or null if not set.
     */
    const DEFAULT_RESOURCE_CACHE_OPTIONS =
        {
            resourceLoader: null,
            paths: null,
            locales: null,
            loadOnCreate: false,
        };

    /**
     * Returns true if the value is a valid resource value
     * by verifying that it is either a non-null value or a non-null object.
     * <br>
     *
     * @param {any} pValue - The value to be checked for validity as a resource value.
     * @return {boolean} - Returns true if the value is a non-null value or a non-null object, otherwise returns false.
     */
    function isValidResourceValue( pValue )
    {
        return isNonNullValue( pValue ) || isNonNullObject( pValue );
    }

    /**
     * This class is used to encapsulate the keys used to retrieve values from collections of resources.<br>
     * <br>
     *
     * This class allows you to...<br>
     *  - Define a key from a single string or an array of strings.<br>
     *  - Define a default value to use when a resource is unavailable.<br>
     */
    class ResourceKey extends LocaleResourcesBase
    {
        #components = [];

        #mappingFunction;

        #defaultValue = _mt_str;

        /**
         * Constructs an instance of ResourceKey.
         *
         * @param {...any} pComponents - One or more arguments representing the components that will be used to formulate the key.<br>
         *                               These can be arrays, objects, strings, numbers, booleans, symbols, functions, or other types.<br>
         *                               These are flattened into a normalized structure and transformed into a single string.<br>
         *
         * @return {ResourceKey} An instance of the ResourceKey class.
         */
        constructor( ...pComponents )
        {
            super();

            // capture a reference to this that will be valid in the mapping function
            const me = this;

            // process the components argument into a flat array
            const arr = asArray( varargs( ...pComponents ) ).flat();

            // define a mapping function to transform the components into suitable strings
            this.#mappingFunction = function( e )
            {
                // process each component according to its type
                if ( isObject( e ) )
                {
                    // if this is being called as a copy constructor, build a new instance from its components
                    if ( e instanceof me.constructor )
                    {
                        return asArray( e.components ).filter( e => !isNull( e ) && !isBlank( asString( e, true ) ) );
                    }
                    // if the component itself is also an array,
                    // call this function to map its elements accordingly
                    if ( isArray( e ) )
                    {
                        return asArray( e.map( me.#mappingFunction ) ).filter( e => !isNull( e ) && !isBlank( asString( e, true ) ) );
                    }
                }

                // for all non-object types (that are not null)
                // generate the appropriate value
                if ( !isNull( e ) )
                {
                    switch ( typeof e )
                    {
                        // strings may be property paths such as a.b.c
                        case _str:
                            return asString( e ).split( _dot ).map( e => asString( e ).trim() );

                        case _num:
                        case _big:
                        case _bool:
                            // other scalar values should just be coerced to strings
                            return asString( e );

                        case _symbol:
                            // Symbols require special treatment
                            const s = e.toString().replace( /^Symbol\s*\(\s*/, _mt_str ).replace( /\s*\)$/, _mt_str );
                            return asString( s ).split( _dot ).map( e => asString( e ).trim() );

                        case _fun:
                            // we use a function's name or string representation
                            return asString( e.name || e ).trim().split( _dot ).map( e => asString( e ).trim() );

                        default:
                            // the default is to attempt coercion to strings, allowing for property path syntax
                            return asString( e ).split( _dot ).map( e => asString( e ).trim() );
                    }
                }
                return "~~null_key~~";
            };

            this.#components = arr.map( this.#mappingFunction ).flat();
        }

        /**
         * The Symbol.species accessor property is a 'well-known' Symbol
         * we can use to return our constructor to external consumers.
         *
         * @return {Function} The constructor function of this class.
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Retrieves an array of scalar values representing the values used to construct this instance.
         * <br>
         * Can be used in some scenarios in place of the scalar string key.<br>
         *
         * @return {Array} An array of scalar values representing the values used to construct this instance.
         */
        get components()
        {
            return [...asArray( this.#components )].map( this.#mappingFunction ).flat();
        }

        /**
         * Returns the default value for a resource to be used when the resource for this key is not found.<br>
         * <br>
         * If the default value is a Resource instance,
         * it returns the value property of that instance if valid.<br>
         * <br>
         * If the default value is an instance of ResourceKey (or a subclass),
         * the default value of that object is returned.<br>
         * <br>
         * Otherwise, returns the value stored in this instance, if any,
         * or the string representation of this key itself (as an aid for correcting missing resource issues).<br>
         *
         * @return {*} The default value, if any,
         * to use when the resource corresponding to this key cannot be found.
         */
        get defaultValue()
        {
            if ( isValidResourceValue( this.#defaultValue ) )
            {
                if ( this.#defaultValue instanceof Resource )
                {
                    return isValidResourceValue( this.#defaultValue?.value ) ? this.#defaultValue?.value : this.#defaultValue;
                }
                else if ( this.isAssignableTo( this.#defaultValue, this.constructor ) )
                {
                    return isValidResourceValue( this.#defaultValue?.#defaultValue ) ? this.#defaultValue?.#defaultValue : this.#defaultValue;
                }
            }

            return this.toString();
        }

        /**
         * Determines if a specified value can be assigned to a given class or the current instance's class.<br>
         * That is, is the value an instance of the specified class or a subclass of the specified class.
         *
         * @param {any} pValue - The value to be checked for assignability.
         * @param {Function} pClass - The class to check against. If not provided, defaults to the class of the current instance.
         * @return {boolean} Returns true if the value is assignable to the class, otherwise false.
         */
        isAssignableTo( pValue, pClass )
        {
            if ( isNull( pValue ) )
            {
                return false;
            }

            const cls = isClass( pClass ) ? pClass || this.constructor[Symbol.species] || this.constructor : this.constructor[Symbol.species] || this.constructor;

            return instanceOfAny( cls, cls[Symbol.species] ) && !(this === pValue);
        }

        /**
         * Sets the default value for a resource.<br>
         * If the provided value is valid, it assigns the value.<br>
         * Otherwise, it sets the default value to null.<br>
         *
         * @param {any} pValue - The value to be set as the default.<br>
         * If this value is a not a valid resource value, the default value is set to null
         */
        set defaultValue( pValue )
        {
            this.#defaultValue = isValidResourceValue( pValue ) ? pValue : null;
        }

        /**
         * Returns the string representation of this key.<br>
         * This value is used to locate and return the corresponding resource
         * from an object or file that maps resources to keys
         *
         * @return {string} The string representation of this key used to locale and return a corresponding resource
         */
        toString()
        {
            return this.components.map( e => e.trim() ).join( _dot );
        }

        /**
         * A well-known symbol used to customize the default string description of an object.<br>
         * This is what is returned when this object is used in a context in which JavaScript is expecting a string.<br>
         *
         * @return {string} A string representation of this object
         */
        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        /**
         * Defines the custom implementation for converting instances of this class to a primitive value.<br>
         * <br>
         * This method is invoked by JavaScript when attempting to convert an object to a primitive,
         * such as during string concatenation, numeric operations, or explicit conversion.
         * <br>
         *
         * @return {string} Returns the primitive/scalar value of this object, which in this case, is a string.
         */
        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

        /**
         * Compares the current instance with the given parameter for equality.
         *
         * @param {any} pKey - The value to compare with the current instance.
         * @return {boolean} Returns true if the current instance and the parameter are considered equal; otherwise, false.
         */
        equals( pKey )
        {
            if ( this === pKey )
            {
                return true;
            }

            if ( isNull( pKey ) )
            {
                return false;
            }

            if ( this.isAssignableTo( pKey, this.constructor ) )
            {
                return this.toString() === pKey.toString();
            }

            if ( isString( pKey ) )
            {
                return this.toString() === asString( pKey, true );
            }

            if ( isArray( pKey ) )
            {
                return this.toString() === new (this.constructor[Symbol.species] || this.constructor)( ...pKey ).toString();
            }

            return false;
        }

        /**
         * Returns a number greater than or equal to 0
         * representing how similar this key is to the other.
         * <br>
         *
         * @param {ResourceKey|string} pOther
         *
         * @param {boolean} [pCaseSensitive=true]
         */
        distance( pOther, pCaseSensitive = true )
        {
            if ( pOther === this )
            {
                return 0;
            }

            let other = (pOther instanceof this.constructor ? pOther.toString() : asString( pOther, true )).trim();
            let me = (this.toString()).trim();

            if ( !pCaseSensitive )
            {
                other = other.toLowerCase();
                me = me.toLowerCase();
            }

            if ( me === other )
            {
                return 0;
            }

            let arrOther = other.split( _dot );
            let arrMe = me.split( _dot );

            let d = 1;

            for( let i = 0, n = Math.min( arrOther.length, arrMe.length ); i < n; i++ )
            {
                const s = arrOther[i];

                if ( s !== arrMe[i] )
                {
                    d++;

                    for( let j = 0; j < n; j++ )
                    {
                        if ( (arrMe[j] === s) )
                        {
                            break;
                        }
                        else
                        {
                            d += Math.abs( j - i );
                        }
                    }
                }
            }

            return d;
        }

        isValid()
        {
            return this.components.length > 0 && this.components.every( e => !isBlank( asString( e, true ) ) );
        }

        /**
         * Returns a copy of this instance as a new object.
         *
         * @returns {ResourceKey} A copy of this instance as a new object.
         */
        clone()
        {
            const copy = new (this.constructor[Symbol.species] || this.constructor)( ...this.components );
            copy.defaultValue = this.defaultValue;
            return copy;
        }
    }

    /**
     * Returns true if the value is a valid resource key
     * by verifying that it is either a non-empty string or an instance of ResourceKey.
     * <br>
     *
     * @param {any} pKey - The value to be checked for validity as a resource key.
     * @return {boolean} - Returns true if the value is a non-empty string or an instance of ResourceKey, otherwise returns false.
     */
    function isValidResourceKey( pKey )
    {
        return (isString( pKey ) && !isBlank( asString( pKey, true ) )) || (pKey instanceof ResourceKey && pKey.isValid());
    }

    /**
     * Represents a resource as a key-value pair.<br>
     * The key is either expected be an instance of ResourceKey
     * or a value that will be used to construct a ResourceKey.<br>
     * <br>
     * The resource can also optionally reference another resource as a fallback.<br>
     * <br>
     */
    class Resource extends LocaleResourcesBase
    {
        /**
         * The key used to store and retrieve this Resource
         * @type {ResourceKey}
         */
        #key;

        /**
         * The value represented by this Resource
         * @type {string|*}
         */
        #value;

        /**
         * An optional Resource to use to return a value if this instance's value is missing
         * @type {Resource}
         */
        #backedBy;

        /**
         * Constructs and initializes an instance of the Resource.<br>
         *
         * @param {any} pKey - The value used to initialize the object's key property.
         * @param {any} pValue - The value used to initialize the object's value property.
         *
         * @return {Resource} An instance of the Resource class
         */
        constructor( pKey, pValue )
        {
            super();

            this.#key = this.initializeKey( pKey );
            this.#value = this.initializeValue( pValue, pKey );

            this.#backedBy = (this.isAssignableTo( pValue, this.constructor ) ? pValue : (this.isAssignableTo( pKey, this.constructor ) ? pKey : null));
        }

        /**
         * The Symbol.species accessor property is a 'well-known' Symbol
         * we can use to return our constructor to external consumers.
         *
         * @return {Function} The constructor function of this class.
         */
        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Determines if a specified value can be assigned to a given class or the current instance's class.<br>
         * That is, is the value an instance of the specified class or a subclass of the specified class.
         *
         * @param {any} pValue - The value to be checked for assignability.
         * @param {Function} pClass - The class to check against. If not provided, defaults to the class of the current instance.
         * @return {boolean} Returns true if the value is assignable to the class, otherwise false.
         */
        isAssignableTo( pValue, pClass )
        {
            if ( instanceOfAny( pValue, pClass, this.constructor, this.constructor[Symbol.species] ) || isAssignableTo( pValue, pClass, this.constructor, this.constructor[Symbol.species] ) )
            {
                return !(this === pValue);
            }
            return false;
        }

        /**
         * Returns the nested/default value if it is defined.
         *
         * @returns {Resource} the nested/default value if it is defined.
         */
        get backedBy()
        {
            const validResourceFunction = this.getValidResourceFunction( this.constructor );
            return validResourceFunction.call( this, this.#backedBy ) ? this._copyValue( this.#backedBy ) : new Resource( _mt_str, _mt_str );
        }

        /**
         * Returns a filter function
         * that returns true if the specified value
         * is an instance of the specified class or an instance of this class.<br>
         *
         * @param {Function | undefined} pClass - A class constructor to validate the value against.<br>
         * If undefined, the validation will use the current class context only.
         * <br>
         *
         * @return {function(*):boolean} A filter function that returns true
         *                               if the specified value is an instance of the specified class or this class
         */
        getValidResourceFunction( pClass )
        {
            const thisClass = this.constructor || this.constructor[Symbol.species];

            if ( isClass( pClass ) )
            {
                return e => !isNull( e ) && instanceOfAny( e, pClass, thisClass );
            }
            return e => !isNull( e ) && instanceOfAny( e, thisClass );
        }

        isValid()
        {
            return isValidResourceValue( this.value ) && isValidResourceKey( this.key );
        }

        /**
         * Creates a copy of the given value based on its type.<br>
         * Used to avoid breaking encapsulation
         * that could occur by assigning or returning a reference
         * to a property that is still mutable by other code.<br>
         *
         * @param {any} pValue - The value to be copied. It can be an object, function, or primitive.
         *
         * @return {any} A copy of the provided value.<br>
         *               If `pValue` is an object with a `clone` method, the cloned object is returned.<br>
         *               If it is assignable to the constructor, a new object of the appropriate type is returned.<br>
         *               Otherwise, an immutable copy is created if `pValue` is an object,
         *               or the value itself is returned if it's not an object.
         */
        _copyValue( pValue )
        {
            if ( isNonNullObject( pValue ) )
            {
                if ( isFunction( pValue.clone ) )
                {
                    return lock( pValue.clone() );
                }
                else if ( this.isAssignableTo( pValue, this.constructor ) )
                {
                    return lock( new (this.constructor[Symbol.species])( this.key, pValue ) );
                }
                return immutableCopy( pValue );
            }
            return lock( pValue );
        }

        /**
         * Initializes and sets the key for the current instance.<br>
         * <br>
         * @param {{key:{string},value:*,backedBy:Resource}|string|ResourceKey} pKey The input which can be an object, a string, or an instance of ResourceKey.
         * <br>
         * If it's an object, it should either match the constructor or have a `key` property to derive from.
         * If it's a ResourceKey, a new ResourceKey is instantiated using its components.
         *
         * @return {ResourceKey} the initialized ResourceKey for the current instance.
         */
        initializeKey( pKey )
        {
            let key;

            if ( this.isAssignableTo( pKey, this.constructor ) )
            {
                key = pKey?.key || pKey?.backedBy?.key || new ResourceKey( pKey );
            }
            else if ( pKey instanceof ResourceKey )
            {
                key = new ResourceKey( ...(asArray( pKey.components )) );
                key.defaultValue = pKey.defaultValue;
            }
            else
            {
                key = new ResourceKey( pKey );
            }

            this.#key = this._copyValue( key );

            return this._copyValue( key );
        }

        /**
         * Initializes and sets the value property for the current instance.<br>
         *
         * @param {any} pValue - The value to assign to the value property, contingent on its validity.
         * @param {Object} pKey - An optional key object that may contain a default value used in the initialization process.
         * @return {any} a copy of the value that was assigned.
         */
        initializeValue( pValue, pKey )
        {
            let value = pValue;

            if ( isValidResourceValue( pValue ) )
            {
                if ( this.isAssignableTo( pValue, this.constructor ) )
                {
                    value = isValidResourceValue( pValue.value ) ? this._copyValue( pValue.value ) : isValidResourceValue( pKey?.defaultValue ) ? this._copyValue( pKey.defaultValue ) : this._copyValue( pValue );
                }
                else if ( pValue instanceof ResourceKey )
                {
                    value = isValidResourceValue( pValue.defaultValue ) ? this._copyValue( pValue.defaultValue ) : isValidResourceValue( pKey?.defaultValue ) ? this._copyValue( pKey.defaultValue ) : this._copyValue( pValue );
                }
            }

            this.#value = this._copyValue( value );

            return this._copyValue( value );
        }

        /**
         * Returns the key as a new instance of`ResourceKey.<br>
         * <br>
         * If this instance does not have a valid key, returns the key of the instance backing this instance.<br>
         * <br>
         *
         * @return {ResourceKey} A new instance of the ResourceKey for this resource.
         */
        get key()
        {
            const key = new ResourceKey( this.#key || this.#backedBy?.key || _mt_str );
            key.defaultValue = (this.#key || this.#backedBy?.key)?.defaultValue || this.value;
            return key;
        }

        /**
         * Returns a copy of the value of this instance, if it is valid.<br>
         * <br>
         * If the value is not valid, returns the value of the backing instance.<br>
         * <br>
         *
         * @return {*} A copy of the value represented by this instance
         */
        get value()
        {
            return isValidResourceValue( this.#value ) ?
                   this._copyValue( this.#value ) : (isValidResourceValue( this.#backedBy?.value ) ? this._copyValue( this.#backedBy?.value ) : this.key?.defaultValue || this.#backedBy?.key?.defaultValue || null);
        }

        /**
         * Returns a string representation of this instance as a key=value pair.
         * <br>
         *
         * @return {string} A string representation of this instance in the format "key=value".
         */
        toString()
        {
            return this.isValid() ? (asString( this.key.toString() ) + "=" + asString( this.value )) : _mt_str;
        }

        /**
         * A well-known symbol used to customize the default string description of an object.<br>
         * This is what is returned when this object is used in a context in which JavaScript is expecting a string.<br>
         *
         * @return {string} A string representation of this object
         */
        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        /**
         * Defines the custom implementation for converting instances of this class to a primitive value.<br>
         * <br>
         * This method is invoked by JavaScript when attempting to convert an object to a primitive,
         * such as during string concatenation, numeric operations, or explicit conversion.
         * <br>
         *
         * @return {string} Returns the primitive/scalar value of this object, which in this case, is a string.
         */
        [Symbol.toPrimitive]()
        {
            return asString( this.value );
        }

        equals( pOther )
        {
            if ( this === pOther )
            {
                return true;
            }

            if ( isNull( pOther ) )
            {
                return false;
            }

            if ( this.isAssignableTo( pOther, this.constructor ) )
            {
                return this.toString() === pOther.toString();
            }

            return false;
        }

        distance( pOther )
        {
            if ( this === pOther )
            {
                return 0;
            }

            if ( pOther instanceof this.constructor )
            {
                return this.key.distance( pOther.key );
            }
            else if ( pOther instanceof ResourceKey || isString( pOther ) )
            {
                return this.key.distance( pOther );
            }

            return Number.MAX_SAFE_INTEGER;
        }

        clone()
        {
            return new (this.constructor[Symbol.species] || this.constructor)( this.key, this.value );
        }
    }

    /**
     * Returns true if the specified object is an instance of Resource
     * @param {*} pObject the value to evaluate
     * @returns {boolean} true if the specified object is an instance of Resource
     */
    function isResource( pObject )
    {
        return isNonNullObject( pObject ) && instanceOfAny( pObject, Resource );
    }

    /**
     * This is a factory method to create a Resource instance from a specified value.<br>
     * <br>
     * The value can be a string in the form of a key=value,<br>
     * a 2-element array of the form[key,value],<br>
     * or an object with both a 'key' property and a 'value' property to use when constructing the Resource,
     * including another instance of the Resource class itself
     * <br>
     *
     * @method Resource.from
     *
     * @param {any} pObject - The value from which to create a new Resource<br>
     * This could be a string in the form of key=value, a 2-element array in the form[key,value],
     * another instance of Resource, or any object with both a key and a value property
     * whose values are compatible with the Resource constructor
     *
     * @returns {Resource} A new instance of the Resource class based on the provided value(s).
     */
    Resource.from = function( pObject )
    {
        if ( pObject instanceof Resource )
        {
            return pObject;
        }

        const elem = !isNull( pObject ) ? pObject : ["~~null_key~~", _mt_str];

        if ( isArray( elem ) && elem.length >= 2 )
        {
            return new Resource( ...elem );
        }
        else if ( isString( elem ) )
        {
            return new Resource( ...(elem.split( "=" ) || []) );
        }
        else if ( isObject( elem ) && !isNull( elem ) )
        {
            if ( elem instanceof Resource )
            {
                return elem;
            }
            if ( elem instanceof ResourceKey )
            {
                return new Resource( elem, elem.defaultValue );
            }
            if ( "key" in elem && "value" in elem )
            {
                return new Resource( elem.key, elem.value );
            }
            else
            {
                const entries = asArray( objectEntries( elem ) ).filter( e => e.isValid() );
                if ( !isNull( entries ) && entries.length > 0 )
                {
                    return Resource.from( entries[0].toArray() );
                }
            }
        }
        return null;
    };

    /**
     * @typedef {object} ResourceLoaderOptions An object the defines how to generate paths to properties files or URLs
     *
     * @property {boolean} [includeLocaleRegions=true] When true, try to load from files including a region component in its filename
     *
     * @property {boolean} [includeLocaleScript=false] When true, try to load from files including a script component in its filename
     *
     * @property {boolean} [includeLocaleVariants=false] When true, try to load from files including a variant component in its filename
     *
     * @property {string} [extension=".properties"] The extension expected for files defining resources.
     *
     * @property {string} [separator=-] The character between locale parts in a properties filepath
     */

    /**
     * These are the default options for the construction of a ResourceLoader
     * @type {ResourceLoaderOptions}
     */
    const DEFAULT_LOADER_OPTIONS =
        {
            includeLocaleRegions: true,
            includeLocaleScript: false,
            includeLocaleVariants: false,
            extension: ".properties",
            separator: _hyphen,
        };

    /**
     * A utility class for loading resources such as text files, JSON, or properties files.<br>
     * Works in diverse runtime environments like Node.js, Deno, and browsers.<br>
     * @class
     */
    class ResourceLoader extends LocaleResourcesBase
    {
        #paths;
        #locales;
        #options;

        #includeLocaleRegions = true;
        #includeLocaleScript = false;
        #includeLocaleVariants = false;

        #extension = ".properties";

        #separator = _hyphen;

        /**
         * Constructs an instance of the ResourceLoader class
         *
         * @param {Array|string} pPaths - The paths to be processed.
         * Can be a single string or an array of strings.
         * Defaults to [defaultPath] if not provided.
         * If a path ends with a path separator, it is assumed to be a directory, and all the properties file in the directory will be 'fetched;
         * Directory paths are compatible only when running in a server environment.
         * @param {Array<string|Intl.Locale>|string|Intl.Locale} pLocales - The locales to be used. Can be a single string or an array of strings. Defaults to [MESSAGES_LOCALE] if not provided.
         * @param {ResourceLoaderOptions} pOptions - Optional configuration options. Defaults to an empty object if not provided.
         * @return {ResourceLoader} An instance of this class.
         */
        constructor( pPaths, pLocales, pOptions = DEFAULT_LOADER_OPTIONS )
        {
            super();

            this.#paths = asArray( pPaths || [defaultPath] ).flat();
            this.#locales = asArray( pLocales || [MESSAGES_LOCALE] ).flat();
            this.#options = populateOptions( pOptions, DEFAULT_LOADER_OPTIONS );

            this.#includeLocaleRegions = this.#options.includeLocaleRegions;
            this.#includeLocaleScript = this.#options.includeLocaleScript;
            this.#includeLocaleVariants = this.#options.includeLocaleVariants;
            this.#extension = this.#options.extension;
            this.#separator = this.#options.separator || _hyphen;
        }

        static isDirectoryPath( pPath )
        {
            return isString( pPath ) && endsWithAny( asString( pPath, true ), "/", "\\" );
        }

        get paths()
        {
            return unique( [...(this.#paths || [])].filter( p => !isBlank( p ) && ( !_isBrowser || !ResourceLoader.isDirectoryPath( p )) ) );
        }

        get locales()
        {
            return unique( [...(this.#locales || [DEFAULT_LOCALE])].map( e => resolveLocale( e ) ).filter( e => isLocale( e ) ) );
        }

        get includeLocaleRegions()
        {
            return this.#includeLocaleRegions;
        }

        get includeLocaleScript()
        {
            return this.#includeLocaleScript;
        }

        get includeLocaleVariants()
        {
            return this.#includeLocaleVariants;
        }

        get extension()
        {
            return this.#extension;
        }

        calculateFetchPaths()
        {
            let fetchPaths = [];

            let paths = this.paths;

            let locales = this.locales;

            for( const p of paths )
            {
                if ( ResourceLoader.isDirectoryPath( p ) )
                {
                    fetchPaths.push( p );
                }
                else
                {
                    let path = asString( p, true );

                    let extension = getFileExtension( path ) || this.extension;

                    let root = path.replace( new RegExp( extension + "$" ), _mt_str );

                    for( const l of locales )
                    {
                        const { localeCode, language, script, region, variant } = parseLocale( l );

                        fetchPaths.push( root + extension );

                        fetchPaths.push( root + this.#separator + language + extension );

                        if ( this.includeLocaleScript )
                        {
                            fetchPaths.push( root + this.#separator + language + this.#separator + script + extension );
                            if ( this.includeLocaleRegions )
                            {
                                fetchPaths.push( root + this.#separator + language + this.#separator + script + this.#separator + region + extension );
                                if ( this.includeLocaleVariants )
                                {
                                    fetchPaths.push( root + this.#separator + language + this.#separator + script + this.#separator + region + this.#separator + variant + extension );
                                }
                            }
                        }

                        if ( this.includeLocaleRegions )
                        {
                            fetchPaths.push( root + this.#separator + language + this.#separator + region + extension );
                            if ( this.includeLocaleVariants )
                            {
                                fetchPaths.push( root + this.#separator + language + this.#separator + region + this.#separator + variant + extension );
                            }
                        }

                        if ( this.includeLocaleVariants )
                        {
                            fetchPaths.push( root + this.#separator + language + this.#separator + variant + extension );
                        }

                        fetchPaths.push( root + localeCode + extension );
                    }
                }
            }

            return unique( fetchPaths );
        }

        get options()
        {
            return populateOptions( this.#options, {} );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        /**
         * Returns a Promise of an array of strings<br>
         * corresponding to the text contents<br>
         * of one or more files or HTTP Responses<br>
         * identified by the specified paths.<br>
         * <br>
         * Works in Node.js, Deno, or a Browser.<br>
         * <br>

         * @return {Promise<Array<string>>} A promise that resolves to an array of strings
         *                                  containing the contents of the specified files or resources.
         */
        async fetch( ...pPaths )
        {
            const paths = unique( flatArgs( ...(pPaths || this.calculateFetchPaths()) ) );

            const promises = [];

            for( let p of paths )
            {
                const path = asString( p, true );

                const prefix = "[" + path + "]\n";

                if ( _isBrowser )
                {
                    if ( !ResourceLoader.isDirectoryPath( path ) )
                    {
                        promises.push( async() =>
                                       {
                                           const response = await fetch( p );
                                           if ( response?.ok )
                                           {
                                               const contents = await (response.text());

                                               return (prefix + contents.replace( prefix, _mt_str ));
                                           }
                                           return _mt_str;
                                       } );
                    }
                }
                else if ( ResourceLoader.isDirectoryPath( path ) )
                {
                    //TODO
                }
                else
                {
                    promises.push( async() =>
                                   {
                                       const contents = await asyncAttempt( () => readTextFile( resolvePath( p ) ) );
                                       if ( !isBlank( contents ) )
                                       {
                                           return (prefix + contents.replace( prefix, _mt_str ));
                                       }
                                       return _mt_str;
                                   } );
                }
            }

            return promises;
        }

        load( pTarget )
        {
            const target = pTarget || new ResourceCache( this );

            const processContents = function( pContents, pResourceCache )
            {
                const resourceCache = pResourceCache || target;
                const contents = pContents || _mt_str;

                const opts = {};
                let resourceFamily;

                const lines = contents.split( "\n" );
                if ( isPropertyFileHeader( lines[0] ) )
                {
                    const { family, name, localeString } = Properties.nameFromPrefix( lines[0] );
                    opts.family = family;
                    opts.name = name;
                    opts.locale = resolveLocale( localeString );

                    resourceFamily = resourceCache.getResourceFamily( family );
                }

                const properties = Properties.from( contents, opts );

                resourceFamily = resourceFamily || new ResourceFamily( opts.family, properties );

                resourceFamily.addProperties( properties );

                if ( isLocale( opts.locale ) )
                {
                    resourceFamily.addLocaleProperties( opts.locale, properties );
                }

                resourceCache.addResourceFamily( resourceFamily );
            };

            const strings = [];

            this.fetch( ...this.calculateFetchPaths() ).then( async( promises ) =>
                                                              {
                                                                  const results = await Promise.allSettled( promises );

                                                                  for( const result of results )
                                                                  {
                                                                      if ( isFulfilled( result ) )
                                                                      {
                                                                          const contents = result.value;
                                                                          strings.push( contents );
                                                                          processContents( contents, target );
                                                                      }
                                                                  }
                                                              } );
            return strings;
        }
    }

    DEFAULT_RESOURCE_CACHE_OPTIONS.resourceLoader = new ResourceLoader( DEFAULT_RESOURCE_CACHE_OPTIONS.paths, DEFAULT_RESOURCE_CACHE_OPTIONS.locales, DEFAULT_RESOURCE_CACHE_OPTIONS );

    ResourceLoader.resolve = function( pResourceLoader, pOptions )
    {
        if ( pResourceLoader instanceof ResourceLoader )
        {
            return pResourceLoader;
        }

        const options = populateOptions( pOptions, {} );

        if ( options.resourceLoader instanceof ResourceLoader )
        {
            return options.resourceLoader;
        }

        return new ResourceLoader( options.paths, options.locales, options );
    };

    /**
     * Represents a set of resources particular to a specific purpose<br>
     * <br>
     * An example might be for the error messages specific to a particular module or feature.<br>
     * <br>
     * The persistent values might be in several files,
     * either all starting with the same base name
     * or being stored in the same folder or table.<br>
     * <br>
     * For instance, you might have
     * error_messages.properties,
     * error_messages_es_MX.properties,
     * error_messages_de.properties, etc.,
     * all of which would belong to the "error_messages" resource family.
     * <br>
     * <br>
     */
    class ResourceFamily
    {
        #baseName = "messages";

        #properties = new Properties();

        #propertiesByLocale = new Map();

        constructor( pBaseName, ...pProperties )
        {
            this.#baseName = asString( pBaseName, true );

            this.#properties = this.processProperties( ...pProperties );
        }

        get baseName()
        {
            return this.#baseName || this.#properties?.name || _mt_str;
        }

        addProperties( ...pProperties )
        {
            this.#properties = this.processProperties( ...([this.#properties, ...(pProperties || [])]) );
        }

        processProperties( ...pProperties )
        {
            // gather the arguments and filter out any "garbage"
            let objects = asArray( varargs( ...pProperties ) ).filter( e => Properties.isProperties( e ) );
            objects = objects.filter( e => lcase( asString( e?.name, true ) ).startsWith( lcase( asString( this.baseName, true ) ) ) );

            const map = new Map();

            for( const p of objects )
            {
                const locale = resolveLocale( p.locale ) || DEFAULT_LOCALE;
                const keys = this.generateKeysForLocale( locale );

                for( const key of keys )
                {
                    let localeProperties = asArray( map.get( key ) || [] ) || [];
                    localeProperties.push( p );
                    map.set( key, localeProperties );
                }
            }

            for( const [key, localeProperties] of map )
            {
                // order the Properties such that the more specific properties appear AFTER less-specific properties
                let arr = Properties.sort( localeProperties );

                let properties = new Properties( key );

                for( const p of arr )
                {
                    // create a new Properties object with the prior instance as its defaults
                    // because we have ordered the properties by specificity,
                    // the more specific properties will be constructed with the lesser specific properties as their defaults
                    properties = new Properties( p.name || key, properties, p?.locale ).load( Properties.from( p ) );
                }

                this.#propertiesByLocale.set( key, properties );
            }

            // the innermost nested default properties
            let properties = new Properties();

            // order the Properties such that the more specific properties appear AFTER less-specific properties
            objects = Properties.sort( objects );

            // build up the nested set of properties
            for( const obj of objects )
            {
                // take the name from the Properties object, but fallback to a generated name if it is missing
                const name = obj?.name || (this.baseName + _hyphen + obj?.locale?.toString()) || _mt_str;

                // create a new Properties object with the prior instance as its defaults
                // because we have ordered the properties by specificity,
                // the more specific properties will be constructed with the lesser specific properties as their defaults
                properties = new Properties( name, properties, obj?.locale ).load( Properties.from( obj ) );
            }

            return properties;
        }

        generateKeysForLocale( pLocale )
        {
            const locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;
            return [locale, locale.language, locale.language + _hyphen + locale.region, locale.language + _hyphen + locale.script + _hyphen + locale.region];
        }

        bestMatch( pLocale, pKey )
        {
            const locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;

            const keys = this.generateKeysForLocale( locale ).reverse();

            const resourceKey = pKey instanceof ResourceKey ? pKey : new ResourceKey( pKey );

            const propertyKey = asString( resourceKey.toString() || pKey, true ) || asString( pKey, true );

            let propertyValue = resourceKey.defaultValue || null;

            for( const key of keys )
            {
                const properties = this.#propertiesByLocale.get( key );

                if ( !isNull( properties ) && Properties.isProperties( properties ) && properties.has( propertyKey ) )
                {
                    propertyValue = properties.get( propertyKey );

                    if ( !isNull( propertyValue ) && !isEmptyString( propertyValue ) )
                    {
                        break;
                    }
                }
            }

            return propertyValue || resourceKey.defaultValue || null;
        }

        get( pLocale, pKey )
        {
            const locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;
            return this.bestMatch( locale, pKey );
        }

        getProperties( pLocale )
        {
            let properties = [];

            if ( isNull( pLocale ) )
            {
                this.#propertiesByLocale.values().forEach( p => properties.push( p ) );
                properties.push( this.#properties );
                properties = [...(new Set( properties ))];
            }
            else
            {
                const locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;

                const keys = this.generateKeysForLocale( locale );

                for( const key of keys )
                {
                    properties.push( this.#propertiesByLocale.get( key ) );
                }
            }

            properties = properties.filter( e => isNonNullObject( e ) && Properties.isProperties( e ) );
            properties = Properties.sort( properties );

            return properties;
        }

    }

    class ResourceCache
    {
        #resourceLoader;

        #resourceFamilies;

        #options;

        constructor( pResourceLoader, pOptions = DEFAULT_RESOURCE_CACHE_OPTIONS )
        {
            this.#options = populateOptions( pOptions, DEFAULT_RESOURCE_CACHE_OPTIONS );

            this.#resourceLoader = ResourceLoader.resolve( pResourceLoader, this.#options );

            this.#resourceFamilies = new Map();

            if ( this.#options?.loadOnCreate )
            {
                if ( this.#resourceLoader )
                {
                    this.#resourceLoader.load( this );
                }
            }
        }

        get resourceLoader()
        {
            return ResourceLoader.resolve( this.#resourceLoader, this.#options );
        }

        get resourceFamilies()
        {
            return lock( new Map( this.#resourceFamilies || new Map() ) );
        }

        get options()
        {
            return populateOptions( this.#options, DEFAULT_RESOURCE_CACHE_OPTIONS );
        }

        addResourceFamily( pResourceFamily )
        {
            let existing;
            let properties;

            let family = pResourceFamily?.family;
            let name = pResourceFamily?.baseName || pResourceFamily?.name || family;

            if ( pResourceFamily instanceof ResourceFamily )
            {
                existing = this.#resourceFamilies.get( name );

                if ( existing && existing instanceof ResourceFamily )
                {
                    properties = asArray( pResourceFamily.getProperties() );
                }
            }
            else if ( Properties.isProperties( pResourceFamily ) )
            {
                let props = pResourceFamily instanceof Properties ?
                            pResourceFamily :
                            new Properties().load( pResourceFamily );

                family = props.family || family;
                name = props?.name || name;

                existing = this.#resourceFamilies.get( family ) ||
                           this.#resourceFamilies.get( name ) ||
                           new ResourceFamily( (family || name), ...([props]) );

                properties = asArray( props ) || [props];
            }

            if ( existing && existing instanceof ResourceFamily )
            {
                existing.addProperties( ...properties );
            }

            this.#resourceFamilies.set( family || name, existing || pResourceFamily );
        }

        load( ...pSource )
        {
            const me = this;

            const sources = asArray( varargs( ...pSource ) );

            function addFamilyFromSource( pSource )
            {
                const props = Properties.from( pSource );

                if ( isNonNullObject( props ) )
                {
                    if ( !isPromise( props ) )
                    {
                        me.addResourceFamily( new ResourceFamily( props.name, props ) );
                    }
                    else
                    {
                        (async function()
                        {
                            await Promise.resolve( props ).then( p => me.addResourceFamily( new ResourceFamily( p?.name, p ) ) );
                        }());
                    }
                }
            }

            for( const source of sources )
            {
                if ( source instanceof ResourceFamily || Properties.isProperties( source ) )
                {
                    this.addResourceFamily( source );
                }
                else if ( isString( source ) )
                {
                    addFamilyFromSource.call( this, source );
                }
                else if ( isNonNullObject( source ) )
                {
                    addFamilyFromSource.call( this, source );
                }
            }
        }

        getResourceFamily( pBaseName )
        {
            return this.#resourceFamilies.get( pBaseName ) || new ResourceFamily( pBaseName );
        }

        getResource( pResourceFamilyName, pLocale, pKey )
        {
            let resourceFamily = this.getResourceFamily( pResourceFamilyName );

            let locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;

            let resourceKey = pKey instanceof ResourceKey ? pKey : new ResourceKey( pKey );

            let resourceValue = resourceKey.defaultValue || null;

            return resourceFamily.get( locale, resourceKey ) || resourceValue;
        }

        getProperties( pResourceFamilyName, pLocale )
        {
            let resourceFamily = this.getResourceFamily( pResourceFamilyName );
            return resourceFamily.getProperties( pLocale );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    let mod =
        {
            dependencies,
            classes:
                {
                    LocaleResourcesBase,
                    Properties,
                    Resource,
                    ResourceKey,
                    ResourceLoader,
                    ResourceFamily,
                    ResourceCache
                },
            DEFAULT_LOCALE,
            DEFAULT_LOCALE_STRING,
            DEFAULT_LOADER_OPTIONS,
            DEFAULT_PROPERTIES_OPTIONS,
            DEFAULT_RESOURCE_CACHE_OPTIONS,
            MESSAGES_LOCALE,
            resolveLocale,
            getMessagesLocale,
            LocaleResourcesBase,
            Properties,
            Resource,
            ResourceKey,
            ResourceLoader,
            ResourceFamily,
            ResourceCache,
            rxFileHeader,
            extractFileHeader,
            isValidPropertyKey,
            isValidPropertyFileEntry,
            isValidPropertiesContent,
            isValidResourceValue,
            isValidResourceKey
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
