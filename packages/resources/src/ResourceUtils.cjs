const core = require( "@toolbocks/core" );
const jsonModule = require( "@toolbocks/json" );

let defaultPath;
let defaultMessages;
let defaultLocale;

/*## environment-specific:node start ##*/
let fs = require( "node:fs" );
let fsAsync = require( "node:fs/promises" );
let path = require( "node:path" );
const currentDirectory = path.dirname( __filename );
const projectRootDirectory = path.resolve( currentDirectory, "../../../" );
defaultPath = path.resolve( currentDirectory, "../messages/defaults.json" );
// defaultMessages = require( defaultPath );
/*## environment-specific:node end ##*/

/*## environment-specific:browser start ##*/
const fsMock =
    {};

const fsAsyncMock =
    {};

/*## environment-specific:browser end ##*/


const konsole = console;

const { constants, typeUtils, stringUtils, arrayUtils, localeUtils } = core;

const { jsonUtils } = jsonModule;

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
        classes,
        _mt_str,
        _spc,
        _hyphen,
        _underscore,
        _dot,
        _lf,
        _fun,
        asPhrase,
        lock,
        populateOptions,
        mergeOptions,
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
        isNonNullObject,
        firstMatchingType
    } = typeUtils;

    const { ModulePrototype } = classes;

    const { asString, asInt, asFloat, isBlank, lcase, ucase, toUnixPath, toBool } = stringUtils;

    const { varargs, flatArgs, asArray, Filters, AsyncBoundedQueue } = arrayUtils;

    const { resolveLocale, classes: localeClasses } = localeUtils;

    const {
        ResourceKey,
        Resource,
        ResourceMap,
        ResourceBundle
    } = localeClasses;

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
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            localeUtils
        };

    let modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const executionEnvironment = modulePrototype.executionEnvironment;

    const isNodeJs = executionEnvironment.isNode();
    const isDeno = executionEnvironment.isDeno();
    const isBrowser = executionEnvironment.isBrowser();

    if ( isBrowser )
    {
        defaultPath = path.resolve( "../messages/defaults.json" );
    }

    const DEFAULT_OPTIONS =
        {
            resourceLoader: null,
            paths: null,
            locales: null
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

            const strings = [];

            const promises = [];

            for( path of paths )
            {
                if ( isNodeJs )
                {
                    promises.push( fsAsync.readFile( path.resolve( path ), "utf8" ) );
                }
                else if ( isDeno )
                {
                    promises.push( await Deno.readTextFile( path ) );
                }
                else if ( isBrowser )
                {
                    promises.push( fetch( path ).then( response => response.text() ) );
                }
            }

            const results = await Promise.allSettled( promises );

            for( const result of results )
            {
                if ( isFulfilled( result ) )
                {
                    strings.push( result.value );
                }
            }

            return asArray( strings ).filter( e => !isBlank( e ) );
        }

        /**
         * Returns promise resolving to a JSON object.<br>
         * <br>
         * Fetches JSON data from the specified paths, parses it,
         * and merges multiple JSON strings into a single object.
         *
         * @param {...string} pPaths - Paths or URLs from which JSON data will be fetched.
         * @return {Promise<Object>} A promise resolving to a JSON object.
         *                           If multiple JSON strings are fetched, they are merged;
         *                           if only one JSON string is fetched, it is parsed.
         *                           Returns an empty object if no JSON strings are fetched.
         */
        async fetchJson( ...pPaths )
        {
            const jsonStrings = await this.fetch( ...pPaths );

            if ( jsonStrings.length > 0 )
            {
                if ( jsonStrings.length > 1 )
                {
                    return jsonUtils.merge( ...jsonStrings );
                }
                else
                {
                    return jsonUtils.parse( jsonStrings[0] );
                }
            }

            return {};
        }

        loadFromJson( pJson )
        {

        }

        async fetchProperties( ...pPaths )
        {
            const properties = await this.fetch( ...pPaths );

            const obj = {};

            for( const property of properties )
            {
                const lines = property.split( _lf );

                for( const line of lines )
                {
                    const [key, value] = line.split( "=" ).map( e => e.trim() );

                    obj[key] = value;
                }
            }

            return obj;
        }

        loadFromProperties( pProperties )
        {

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

    class HierarchicalKey extends Array
    {
        constructor( ...pArgs )
        {
            super( ...pArgs );
        }
    }

    HierarchicalKey.parse = function( pHierarchicalKey )
    {
        let hKey = [];

        if ( isNonNullObject( pHierarchicalKey ) )
        {
            if ( pHierarchicalKey instanceof HierarchicalKey )
            {
                return pHierarchicalKey;
            }

            if ( isArray( pHierarchicalKey ) )
            {
                if ( pHierarchicalKey.every( e => e instanceof ResourceKey ) )
                {
                    return new HierarchicalKey( ...pHierarchicalKey );
                }

                hKey.push( new ResourceKey( ...pHierarchicalKey ) );

                hKey = hKey.concat( ...([...pHierarchicalKey].map( e => e instanceof ResourceKey ? e : new ResourceKey( e ) )) );
            }
            else
            {
                let entries = { ...pHierarchicalKey }.entries();

                for( const entry of entries )
                {
                    let [key, value] = entry;

                    let pushed = false;

                    if ( key instanceof ResourceKey )
                    {
                        hKey.push( key );
                        pushed = true;
                    }

                    if ( value instanceof ResourceKey )
                    {
                        hKey.push( value );
                        pushed = true;
                    }

                    if ( !pushed )
                    {
                        hKey.push( new ResourceKey( key, value ) );
                        pushed = true;
                    }
                }
            }

            return new HierarchicalKey( ...(asArray( [...hKey].flat() )) );
        }

        throw new IllegalArgumentError( "Invalid HierarchicalKey", { hierarchicalKey: pHierarchicalKey } );
    };

    class ResourceCache
    {
        #resourceLoader;

        #resourceCollections = {};

        #options;

        constructor( pResourceLoader, pOptions = DEFAULT_OPTIONS )
        {
            this.#options = populateOptions( pOptions, DEFAULT_OPTIONS );
            this.#resourceLoader = ResourceLoader.resolve( pResourceLoader, this.#options );
        }
    }


}());
