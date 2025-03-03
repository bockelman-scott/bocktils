/**
 * @fileoverview
 * @name ResourceUtils
 * @author Scott Bockelman
 * @license MIT
 *
 * <p>This module exposes classes for working with externalized strings.</p>
 * <br>
 * In addition to providing the ability to localize text to support various languages,
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

const { constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

/* define a variable for typeof undefined **/
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 * @type {function():Object}
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

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

    const modName = "ResourceUtils";

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
        asPhrase,
        lock,
        populateOptions,
        mergeOptions,
        immutableCopy,
        no_op,
        IterationCap,
        isLogger,
        S_ENABLED,
        S_DISABLED,
        S_ERROR,
        S_WARN,
        S_ERR_PREFIX,
        MILLIS_PER,
        MESSAGES_LOCALE,
        getMessagesLocale,
        isFulfilled,
        isRejected,
        moduleUtils,
    } = constants;

    const {
        isNull,
        isNumeric,
        isInteger,
        isString,
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
        firstMatchingType,
        instanceOfAny,
        isAssignableTo
    } = typeUtils;

    const {
        ToolBocksModule,
        ObjectEntry,
        objectEntries,
        objectKeys,
        attempt,
        asyncAttempt,
        resolveError
    } = moduleUtils;

    const { asString, asInt, asFloat, isBlank, isJson, lcase, ucase, toUnixPath, toBool } = stringUtils;

    const { varargs, flatArgs, asArray, unique, Filters, AsyncBoundedQueue } = arrayUtils;

    const { DEFAULT_LOCALE, DEFAULT_LOCALE_STRING, resolveLocale, LocaleResourcesBase } = localeUtils;

    const { asJson, parseJson } = jsonUtils;

    const { resolvePath, getDirectoryName, readTextFile, writeTextFile } = fileUtils;


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
    ;

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

    const isBrowser = executionEnvironment.isBrowser();

    /**
     * This class <i>roughly approximates</i> the structure and functionality of the java.utils.properties class.
     * <br>
     * @see {@link https://docs.oracle.com/javase/8/docs/api/java/util/Properties.html}
     * <br>
     * <br>
     * This class holds a set of key/value pairs where both the key and value are strings.<br>
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
        #locale = DEFAULT_LOCALE;

        /**
         * Nested instance holding default values for keys not defined in this instance
         * @type {Map|Properties}
         */
        #defaults;

        /**
         * Constructs a new instance of the Properties class
         * and initializes the default/fallback properties if specified.
         * <br>
         * <br>
         *
         * @param {string} [pName='Properties']  An optional name to identify this instance
         *
         * @param {Properties|Map} [pDefaults] - The default values to use when retrieving values.
         *                                       This should be another instance of the Properties class or a Map.
         *
         * @param {Intl.Locale|string} [pLocale=DEFAULT_LOCALE] Optional locale with which these properties are associated
         *
         * @return {Properties}
         */
        constructor( pName, pDefaults, pLocale )
        {
            super();

            this.#name = pName || this.#name;

            this.#defaults = (isNonNullObject( pDefaults ) &&
                              (isMap( pDefaults ) || pDefaults instanceof this.constructor)) ? this.#initializeDefaults( pDefaults ) : new Properties();

            this.#locale = pLocale || this.#locale;
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
            const properties = new Properties();

            let map = Properties.isProperties( pDefaults ) && this !== pDefaults ? pDefaults : properties;

            this.#defaults = properties.load( map );

            return properties;
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
            this.#defaults = this.#initializeDefaults( pDefaults );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        [Symbol.iterator]()
        {
            return lock( this.entries() );
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
            let value = super.get( pKey );

            if ( (isNull( value ) || isBlank( value )) && this.hasValidDefaults() )
            {
                value = this.defaults.get( pKey );
            }

            return asString( value );
        }

        /**
         * Returns true if the specified key corresponds to a non-empty value available in this collection.
         *
         * @param {string} pKey the key to evaluate
         * @returns {boolean|*} true if the specified key corresponds to a non-empty value available in this collection
         */
        has( pKey )
        {
            return super.has( pKey ) || (this.hasValidDefaults() && this.defaults.has( pKey ));
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
            let str = _mt_str;

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

    /**
     * Returns true if the specified value is a Map or an instance of Properties
     */
    Properties.isProperties = function( pObject )
    {
        return isNonNullObject( pObject ) && (isMap( pObject ) || pObject instanceof Properties);
    };

    /**
     * @typedef {object} PropertiesLoadOptions Options that control how to load properties files
     *
     * @property {string} [assignment='='] The character to be interpreted as the assignment operator of a value to a key
     * @property {boolean} [trim=true] Whether to remove leading and trailing whitespace from values
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
        };

    /*
     * Returns true if the string is either a valid key or valid line in a properties file
     */
    const isValidPropertyKey = e => isString( e ) && !isBlank( e ) && !(e.startsWith( "#" ) || e.startsWith( "!" ));

    /*
     * Returns true if the string represents a valid line in a properties file
     */
    const isValidPropertyFileEntry = e => isValidPropertyKey( e ) && (e.includes( _equals ) || e.includes( _colon ));

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

        const properties = new Properties();

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

        arr = arr.map( e => e.trim() ).filter( e => !isBlank( e ) && (e.includes( options.assignment )) );

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

            let arr = asString( pString, true ).replace( /\\[\r\n]\s*/, _mt_str ).split( /[\r\n]+/ );

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
        let properties = new Properties();

        if ( isNonNullObject( pObject ) )
        {
            const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

            if ( isMap( pObject ) )
            {
                const map = new Map( pObject );
                map.forEach( ( v, k ) => properties.set( asString( k, true ), asString( v ) ) );
            }
            else if ( isArray( pObject ) || isString( pObject ) )
            {
                properties = properties.load( pObject, options );
            }
            else
            {
                const stringsOnly = e => isString( ObjectEntry.getKey( e ) ) &&
                                         isString( ObjectEntry.getValue( e ) );

                const entries = objectEntries( pObject ); // TODO: collapse to a.b.c=value form

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
        const obj = isJson( pJson ) ? attempt( () => parseJson( pJson ) ) : Properties.isProperties( pJson ) ? pJson : {};
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
     * @returns {Properties} a new instance of Properties, populated with the key/value pairs defined in the file
     */
    Properties.fromFile = async function( pFilePath, pOptions )
    {
        const options = populateOptions( pOptions, DEFAULT_PROPERTIES_OPTIONS );

        const filePath = resolvePath( pFilePath );

        const contents = await asyncAttempt( () => readTextFile( filePath ) );

        if ( isString( contents ) )
        {
            return (isJson( contents )) ?
                   Properties.fromJsonString( contents, options ) :
                   Properties.fromPropertiesString( contents, options );
        }

        const message = `Failed to read properties file: ${filePath}`;

        let error = resolveError( new Error( message ) );

        toolBocksModule.reportError( error, message, S_ERROR, Properties.fromFile, [pFilePath, pOptions] );

        return new Properties();
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
        if ( isString( pSource ) )
        {
            if ( isValidPropertyFileEntry( pSource ) )
            {
                return Properties.fromPropertiesString( pSource, pOptions );
            }

            return Properties.fromFile( pSource, pOptions );
        }
        else if ( isMap( pSource ) )
        {
            return Properties.fromObject( pSource, pOptions );
        }
        else if ( isArray( pSource ) )
        {
            if ( isKeyValueArray( pSource ) )
            {
                return Properties.from2dArray( pSource, pOptions );
            }
            else
            {
                return Properties.fromLines( pSource, pOptions );
            }
        }
        else if ( isJson( pSource ) )
        {
            return Properties.fromJsonString( pSource, pOptions );
        }
        else if ( isNonNullObject( pSource ) )
        {
            return Properties.fromObject( pSource, pOptions );
        }

        return new Properties();
    };

    /**
     * Represents the default configuration options for the application or library.
     * <br>
     * <br>
     * This object contains properties that define the initial settings.
     *
     * @typedef {Object} DEFAULT_OPTIONS
     * @property {Object|null} resourceLoader - Specifies the resource loader instance or null if not provided.
     * @property {Object|null} paths - Holds path configurations or null if undefined.
     * @property {Object|null} locales - Specifies locale settings or null if not set.
     */
    const DEFAULT_OPTIONS =
        {
            resourceLoader: null,
            paths: null,
            locales: null,
            loadOnCreate: false,
        };

    /**
     * Returns true if the value is a valid resource value
     * by verifying if it is either a non-null value or a non-null object.
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

            // define a mapping function to transform the components into a single string
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
                            // other scalar value should just be coerced to strings
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
         * Returns a copy of this instance as a new object.
         *
         * @returns {ResourceKey} A copy of this instance as a new object.
         */
        clone()
        {
            return new (this.constructor[Symbol.species] || this.constructor)( ...this.components );
        }
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
            return this._copyValue( this.#backedBy );
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
        isValidResource( pClass )
        {
            const thisClass = this.constructor || this.constructor[Symbol.species];

            if ( isClass( pClass ) )
            {
                return e => !isNull( e ) && instanceOfAny( e, pClass, thisClass );
            }
            return e => !isNull( e ) && instanceOfAny( e, thisClass );
        }

        /**
         * Returns true if the specified value is a valid resource value.
         *
         * @param {any} pValue - The value to validate
         *
         * @return {boolean} true if the provided value is a valid resource value, otherwise false.
         */
        isValidResourceValue( pValue )
        {
            return isValidResourceValue( pValue );
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

            if ( this.isValidResourceValue( pValue ) )
            {
                if ( this.isAssignableTo( pValue, this.constructor ) )
                {
                    value = this.isValidResourceValue( pValue.value ) ? this._copyValue( pValue.value ) : this.isValidResourceValue( pKey?.defaultValue ) ? this._copyValue( pKey.defaultValue ) : this._copyValue( pValue );
                }
                else if ( pValue instanceof ResourceKey )
                {
                    value = this.isValidResourceValue( pValue.defaultValue ) ? this._copyValue( pValue.defaultValue ) : this.isValidResourceValue( pKey?.defaultValue ) ? this._copyValue( pKey.defaultValue ) : this._copyValue( pValue );
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
            const key = new ResourceKey( this.#key || this.#backedBy?.key );
            key.defaultValue = (this.#key || this.#backedBy?.key)?.defaultValue;
            return key;
        }

        /**
         * Returns a copy of the value of this instance, if it is valid.<br>
         * <br>
         * If the value is not valid, returns the value of the backing instance.<br>
         * <br>
         *
         * @return {*} A copy of the value of this represented by this instance
         */
        get value()
        {
            return this.isValidResourceValue( this.#value ) ? this._copyValue( this.#value ) : this._copyValue( this.#backedBy?.value );
        }

        /**
         * Returns a string representation of this instance as a key=value pair.
         * <br>
         *
         * @return {string} A string representation of this instance in the format "key=value".
         */
        toString()
        {
            return this.key.toString() + "=" + asString( this.value );
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
        const elem = !isNull( pObject ) ? pObject : ["~~null_key~~", _mt_str];

        if ( isArray( elem ) && elem.length >= 2 )
        {
            return new Resource( ...elem );
        }
        else if ( isString( elem ) )
        {
            return Resource.from( elem.split( "=" ) );
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
                const entries = asArray( Object.entries( elem ) ).filter( e => e.length >= 2 );
                if ( !isNull( entries ) && entries.length > 0 )
                {
                    return Resource.from( entries[0] );
                }
            }
        }
        return null;
    };


    /**
     * A utility class for loading resources such as text files, JSON, or properties files.<br>
     * Works in diverse runtime environments like Node.js, Deno, and browsers.<br>
     * @class
     */
    class ResourceLoader
    {
        #paths;
        #locales;
        #options;

        /**
         * Constructs an instance of the ResourceLoader class
         *
         * @param {Array|string} pPaths - The paths to be processed. Can be a single string or an array of strings. Defaults to [defaultPath] if not provided.
         * @param {Array<string|Intl.Locale>|string|Intl.Locale} pLocales - The locales to be used. Can be a single string or an array of strings. Defaults to [MESSAGES_LOCALE] if not provided.
         * @param {Object} pOptions - Optional configuration options. Defaults to an empty object if not provided.
         * @return {ResourceLoader} An instance of this class.
         */
        constructor( pPaths, pLocales, pOptions )
        {
            this.#paths = asArray( pPaths || [defaultPath] ).flat();
            this.#locales = asArray( pLocales || [MESSAGES_LOCALE] ).flat();
            this.#options = populateOptions( pOptions, {} );
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
         * @param {...string} pPaths - One or more paths to the files or resources to be fetched and read.
         * @return {Promise<Array<string>>} A promise that resolves to an array of strings
         *                                  containing the contents of the specified files or resources.
         */
        async fetch( ...pPaths )
        {
            const paths = flatArgs( ...pPaths );

            const promises = [];

            for( let p of paths )
            {
                if ( isBrowser )
                {
                    promises.push( fetch( p ).then( response => response.text() ) );
                }
                else
                {
                    promises.push( readTextFile( resolvePath( p ) ) );
                }
            }

            return promises;
        }

        load( pTarget )
        {
            const target = pTarget || new ResourceCache( this );

            const strings = [];

            this.fetch( ...this.#paths ).then( async( promises ) =>
                                               {
                                                   const results = await Promise.allSettled( promises );

                                                   for( const result of results )
                                                   {
                                                       if ( isFulfilled( result ) )
                                                       {
                                                           strings.push( result.value );

                                                           const props = Properties.from( result.value );
                                                           const properties = new ResourceFamily( props?.name, props );
                                                           target.addResourceFamily( properties );
                                                       }
                                                   }
                                               } );


            return strings;
        }
    }

    DEFAULT_OPTIONS.resourceLoader = new ResourceLoader( DEFAULT_OPTIONS.paths, DEFAULT_OPTIONS.locales, DEFAULT_OPTIONS );

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

        constructor( pBaseName, ...pProperties )
        {
            this.#baseName = asString( pBaseName, true );
            this.#properties = this.processProperties( ...pProperties );
        }

        processProperties( ...pProperties )
        {
            let properties = new Properties();

            const objects = asArray( varargs( ...pProperties ) ).filter( e => isNonNullObject( e ) ).reverse();
            for( const obj of objects )
            {
                properties = new Properties( obj?.name, properties, obj?.locale ).load( Properties.from( obj ) );
            }

            return properties;
        }
    }


    class ResourceCache
    {
        #resourceLoader;
        #resourceFamilies;
        #options;

        constructor( pResourceLoader, pOptions = DEFAULT_OPTIONS )
        {
            this.#options = populateOptions( pOptions, DEFAULT_OPTIONS );
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

        addResourceFamily( pResourceFamily )
        {
            this.#resourceFamilies.set( pResourceFamily.baseName, pResourceFamily );
        }

        load( ...pSource )
        {
            const sources = asArray( varargs( ...pSource ) );

            for( const source of sources )
            {
                if ( source instanceof ResourceFamily )
                {
                    this.addResourceFamily( source );
                }
                else if ( isString( source ) )
                {
                    if ( isValidPropertyFileEntry( source ) )
                    {
                        const props = Properties.from( source );
                        this.addResourceFamily( new ResourceFamily( props.name, props ) );
                    }
                }
                else if ( isNonNullObject( source ) )
                {
                    const props = Properties.from( source );
                    this.addResourceFamily( new ResourceFamily( props.name, props ) );
                }
            }
        }

        getResourceFamily( pBaseName )
        {
            return this.#resourceFamilies.get( pBaseName );
        }

        getResource( ...pKey )
        {
            let resourceFamily;

            let keys = asArray( varargs( ...pKey ) );

            while( keys.length > 0 )
            {
                const key = keys.shift();
                resourceFamily = this.getResourceFamily( key );
                if ( resourceFamily )
                {
                    return resourceFamily.getResource( keys.split( 1 ) );
                }
            }

            keys = asArray( varargs( ...pKey ) );
            const values = [];
            for( const family of this.#resourceFamilies.values() )
            {
                 let value = family.getResource( keys.split( 1 ) );
                 if ( value )
                 {
                     values.push( value );
                 }
            }

            return values.length > 1 ? values : values.length > 0 ? values[0] : null;
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
                    ResourceCache
                },
            DEFAULT_LOCALE,
            DEFAULT_LOCALE_STRING,
            resolveLocale,
            MESSAGES_LOCALE,
            getMessagesLocale,

        };


    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
