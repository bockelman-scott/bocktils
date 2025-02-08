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

/*
 * Import the core modules of the ToolBocks&trade; library.
 * These modules provide a number of essential utility functions
 * and foundational features provided by the ToolBocks&trade; framework.
 * <br>
 */
const core = require( "@toolbocks/core" );

/**
 * Import the JSON related modules which expose functions for working with JSON data,<br>
 * even structures that might contain circular references or self-references.
 * <br>
 */
const jsonModule = require( "@toolbocks/json" );

/**
 * We define a number of variables that will be assigned according to the current execution environment.
 * <br>
 * <br>
 * The intention is to seamlessly support browsers, Workers, Node.js, and Deno where possible.<br>
 * This reduces the need to learn or use a different library for every use case.<br>
 */

/**
 * Represent the synchronous or callback-required API for working with a file system.<br>
 * In NOde.js, this is "fs", in Deno, this is the "Deno" global,
 * in browsers and workers, this is implemented via XmlHttpRequest (though discouraged and deprecated)
 *
 * @type {Object}
 */
let fs;

/**
 * Represent the asynchronous API for working with a file system.<br>
 * In Node.js, this is "fs/promises", in Deno, this is the "Deno" global,
 * in browsers and workers, this is implemented via the Fetch API
 *
 * @type {Object}
 */
let fsAsync;

/**
 * Represents the functionality related to resolving file paths and file names.
 * In Node.js, this is the node: path module.  In Deno, this is @TODO
 * In browsers, this is... @TODO
 *
 * @type {Object|function}
 */
let path;

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
let currentDirectory;

/**
 * Represents the root directory of the project.
 * This variable is used as a reference point for resolving
 * file and folder paths relative to the project's base directory.
 *
 * @type {string}
 */
let projectRootDirectory;

/**
 * Represents the default file system path <i>or URL</i> used as the base directory
 * for finding and loading resources.<br>
 *
 * @type {string}
 */
let defaultPath;

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
let defaultLocale;


/*## environment-specific:node start ##*/
fs = require( "node:fs" );
fsAsync = require( "node:fs/promises" );
path = require( "node:path" );
currentDirectory = path.dirname( __filename );
projectRootDirectory = path.resolve( currentDirectory, "../../../" );
defaultPath = path.resolve( currentDirectory, "../messages/defaults.json" );
// defaultMessages = require( defaultPath );
/*## environment-specific:node end ##*/

/*## environment-specific:browser start ##*/

/*## environment-specific:browser end ##*/


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
        classes,
        _mt_str,
        _spc,
        _hyphen,
        _underscore,
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
        isClass,
        isNonNullObject,
        isNonNullValue,
        firstMatchingType,
        instanceOfAny,
        isAssignableTo
    } = typeUtils;

    const { ToolBocksModule } = classes;

    const { asString, asInt, asFloat, isBlank, lcase, ucase, toUnixPath, toBool } = stringUtils;

    const { varargs, flatArgs, asArray, unique, Filters, AsyncBoundedQueue } = arrayUtils;

    const { DEFAULT_LOCALE, DEFAULT_LOCALE_STRING, resolveLocale, LocaleResourcesBase } = localeUtils;

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

    let modulePrototype = new ToolBocksModule( modName, INTERNAL_NAME );

    const executionEnvironment = modulePrototype.executionEnvironment;

    const isNodeJs = executionEnvironment.isNode();
    const isDeno = executionEnvironment.isDeno();
    const isBrowser = executionEnvironment.isBrowser();

    if ( isBrowser )
    {
        defaultPath = path.resolve( "../messages/defaults.json" );
    }

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
            locales: null
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
         *
         * @type {ResourceKey}
         */
        #key;

        /**
         *
         * @type {string|Resource|*}
         */
        #value;

        /**
         *
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

    class ResourceMap extends LocaleResourcesBase
    {
        #locale;
        #localeCode;

        #resources = {};

        constructor( pLocale, ...pResources )
        {
            super();

            this.#locale = resolveLocale( pLocale ) || DEFAULT_LOCALE;
            this.#localeCode = this.#locale?.baseName || DEFAULT_LOCALE_STRING;

            const me = this;

            let arr = asArray( varargs( ...pResources ) );

            const mapper = e => (isObject( e ) && (e instanceof me.constructor)) ? e.resources : e;

            arr = arr.filter( e => !isNull( e ) ).map( mapper ).flat();

            for( let elem of arr )
            {
                if ( !isNull( elem ) )
                {
                    const rsrc = (instanceOfAny( elem, Resource )) ? elem : Resource.from( elem );

                    if ( !isNull( rsrc ) && instanceOfAny( rsrc, Resource ) )
                    {
                        const key = elem.key.toString();

                        this.#resources[key] = elem;

                        this.expandTree( key, elem );
                    }
                }
            }
        }

        static get [Symbol.species]()
        {
            return this;
        }

        expandTree( pKey, pElem )
        {
            if ( pKey.includes( _dot ) )
            {
                let obj = this.#resources;

                const keys = pKey.split( _dot );

                while ( keys.length > 1 && null != obj )
                {
                    let key = keys.shift();

                    obj[key] = obj[key] || {};

                    const remaining = keys.length > 0 ? keys.join( _dot ) : null;

                    if ( remaining )
                    {
                        obj[key][remaining] = obj[key][remaining] || pElem;
                    }

                    obj = obj[key];
                }
            }
        }

        get locale()
        {
            return this.#locale || DEFAULT_LOCALE;
        }

        get resources()
        {
            return lock( this.#resources );
        }

        get entries()
        {
            return lock( Object.entries( this.resources ) );
        }

        get keys()
        {
            return lock( Object.keys( this.resources ) );
        }

        isResource( pObject )
        {
            return isResource( pObject );
        }

        getResource( pKey )
        {
            const resourceKey = new ResourceKey( pKey );

            const k = asString( resourceKey.toString(), true );

            let obj = this.resources[k];

            if ( !isNull( obj ) && this.isResource( obj ) )
            {
                return obj;
            }

            let keys = k.split( _dot );

            obj = this.resources;

            while ( keys.length > 0 && null != obj )
            {
                let key = keys.shift();
                obj = obj[key];

                if ( !isNull( obj ) && this.isResource( obj ) )
                {
                    break;
                }
            }

            obj = obj || (this.isResource( resourceKey.defaultValue ) ? resourceKey.defaultValue : null);

            return !isNull( obj ) ? immutableCopy( obj ) : null;
        }

        get( pKey )
        {
            let resource = this.getResource( pKey );

            if ( !isNull( resource ) && this.isResource( resource ) )
            {
                return immutableCopy( isValidResourceValue( resource.value ) ? resource.value : resource );
            }

            let keys = asString( pKey, true ).split( _dot );

            let obj = this.resources;

            while ( keys.length > 0 && null != obj )
            {
                let key = keys.shift();
                obj = obj[key];
            }

            if ( isNull( obj ) )
            {
                return asString( pKey, true );
            }

            return immutableCopy( isValidResourceValue( obj?.value ) ? obj?.value : obj );
        }
    }

    ResourceMap.FILTER = e => !isNull( e ) && (instanceOfAny( e, ResourceMap, ResourceCollection ));

    class ResourceCollection extends ResourceMap
    {
        #defaultMap;

        #defaultResources = {};

        constructor( pLocale, pDefaultMap, ...pResources )
        {
            super( pLocale, ...pResources );

            this.#defaultMap = ResourceMap.FILTER( pDefaultMap ) ? pDefaultMap : new ResourceMap( DEFAULT_LOCALE, { ...pDefaultMap, ...pResources } );

            this.#defaultResources = this.#defaultMap?.resources || { ...pResources };
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get defaultMap()
        {
            return this.#defaultMap || this;
        }

        get resources()
        {
            return { ...(this.#defaultResources || this.defaultMap.resources), ...super.resources };
        }

        get entries()
        {
            const defaultEntries = this.defaultMap.entries();
            const superEntries = super.entries();

            return unique( [
                               ...defaultEntries,
                               ...superEntries
                           ].flat() );
        }

        get keys()
        {
            const defaultKeys = this.defaultMap.keys();
            const superKeys = super.keys();

            return unique( [
                               ...defaultKeys,
                               ...superKeys
                           ].flat() );
        }

        getResource( pKey )
        {
            const resource = super.getResource( pKey );

            if ( isNull( resource ) )
            {
                return this.defaultMap.getResource( pKey );
            }

            return resource;
        }

        get( pKey )
        {
            const resource = this.getResource( pKey );

            if ( !isNull( resource ) && this.isResource( resource ) )
            {
                return resource.value || resource;
            }
            return resource?.value || resource || asString( pKey, true );
        }
    }

    ResourceCollection.FILTER = e => !isNull( e ) && (instanceOfAny( e, ResourceCollection ));

    class ResourceBundle extends LocaleResourcesBase
    {
        #resourceMaps = {};
        #resources = {};

        constructor( ...pResourceMaps )
        {
            super();

            const NOT_NULL = e => !isNull( e );

            const mapper = e => (instanceOfAny( e, ResourceMap, ResourceCollection ) ? e : isResource( e ) ? new ResourceMap( e.locale, e ) : isArray( e ) ? new ResourceMap( DEFAULT_LOCALE, ...(asArray( e )) ) : null);

            let arrMaps = flatArgs( ...pResourceMaps ).filter( NOT_NULL ).map( mapper );

            arrMaps = arrMaps.filter( e => !isNull( e ) && ResourceMap.FILTER( e ) );

            for( let rsrcMap of arrMaps )
            {
                if ( isNull( rsrcMap ) || !ResourceMap.FILTER( rsrcMap ) )
                {
                    continue;
                }

                const resources = { ...(rsrcMap.resources || {}) };

                if ( Object.keys( resources ).length <= 0 )
                {
                    continue;
                }

                const keys = this.buildLocaleKeyPermutations( rsrcMap.locale );

                for( let key of keys )
                {
                    let map = this.initializeMapEntry( this.#resourceMaps, key, [] );
                    map.push( rsrcMap );

                    this.appendMapEntry( this.#resources, key, resources );
                }
            }
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get resourceMaps()
        {
            return { ...(this.#resourceMaps || {}) };
        }

        getResourceMaps( pLocale )
        {
            const locale = resolveLocale( pLocale );

            const keys = this.buildLocaleKeyPermutations( locale );

            const maps = this.resourceMaps;

            const arr = [];

            for( let key of keys )
            {
                const a = maps[key];
                if ( a && a.length > 0 )
                {
                    arr.push( a );
                }
            }

            return arr.flat();
        }

        get resources()
        {
            return { ...this.#resources };
        }

        getResource( pLocale, pKey )
        {
            const locale = resolveLocale( pLocale );

            const maps = this.getResourceMaps( locale );

            let resource = null;

            for( let map of maps )
            {
                resource = map.getResource( pKey );
                if ( !isNull( resource ) && isResource( resource ) )
                {
                    break;
                }
            }

            return resource;
        }

        get( pLocale, pKey )
        {
            const locale = resolveLocale( pLocale );

            let resource = this.getResource( locale, pKey );

            if ( !isNull( resource ) && isResource( resource ) )
            {
                return resource.value || resource;
            }

            let value = null;

            let resourceKeys = asString( pKey, true ).split( _dot );

            const localeKeys = this.buildLocaleKeyPermutations( locale ) || [];

            for( let localeKey of localeKeys )
            {
                let obj = this.resources[localeKey];

                if ( isNull( obj ) )
                {
                    continue;
                }

                while ( resourceKeys.length > 0 && null != obj )
                {
                    let key = resourceKeys.shift();
                    obj = obj[key];
                }

                if ( !isNull( obj ) )
                {
                    value = obj?.value;
                }

                if ( _ud !== typeof value && null !== value )
                {
                    break;
                }
            }

            return value;
        }
    }

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

            const strings = [];

            const promises = [];

            for( let p of paths )
            {
                if ( isNodeJs )
                {
                    promises.push( fsAsync.readFile( path.resolve( p ), "utf8" ) );
                }
                else if ( isDeno )
                {
                    promises.push( await Deno.readTextFile( p ) );
                }
                else if ( isBrowser )
                {
                    promises.push( fetch( p ).then( response => response.text() ) );
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

        static get [Symbol.species]()
        {
            return this;
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
            this.#resourceCollections = {};
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
                    Resource,
                    ResourceKey,
                    ResourceMap,
                    ResourceCollection,
                    ResourceBundle,
                    ResourceLoader,
                    HierarchicalKey,
                    ResourceCache
                },
            DEFAULT_LOCALE,
            DEFAULT_LOCALE_STRING,
            resolveLocale,
            MESSAGES_LOCALE,
            getMessagesLocale,

        };


    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
