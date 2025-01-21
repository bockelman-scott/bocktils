const core = require( "@toolbocks/core" );
const jsonModule = require( "@toolbocks/json" );

let defaultPath;


/*## environment-specific:node start ##*/
let fs = require( "node:fs" );
let fsAsync = require( "node:fs/promises" );
let path = require( "node:path" );
const currentDirectory = path.dirname( __filename );
const projectRootDirectory = path.resolve( currentDirectory, "../../../" );
defaultPath = path.resolve( currentDirectory, "../messages/en/messages.json" );
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
        getMessagesLocale
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

    const { varargs, asArray, Filters, AsyncBoundedQueue } = arrayUtils;

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
        defaultPath = path.resolve( "/messages/en/messages.json" );
    }

    class ResourceLoader
    {
        #paths;
        #locales;
        #options;

        constructor( pPaths, pLocales, pOptions )
        {
            this.#paths = asArray( pPaths || [defaultPath] ).flat();
            this.#locales = asArray( pLocales || [MESSAGES_LOCALE] ).flat();
            this.#options = populateOptions( pOptions, {} );
        }

        loadFromJson( ...pPaths )
        {

        }

        loadFromProperties(...pPaths )
        {

        }

    }

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
        constructor( ...args )
        {
            super( ...args );
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

        constructor( pResourceLoader, pOptions )
        {
            this.#resourceLoader = ResourceLoader.resolve( pResourceLoader, pOptions );
            this.#options = populateOptions( pOptions, {} );
        }
    }


}());
