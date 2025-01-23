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
    } = typeUtils;

    const { ModulePrototype } = classes;

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


    function isValidResourceValue( pValue )
    {
        return isNonNullValue( pValue ) || isNonNullObject( pValue );
    }

    class ResourceKey extends LocaleResourcesBase
    {
        #components = [];

        #mappingFunction;

        #defaultValue = _mt_str;

        constructor( ...pComponents )
        {
            super();

            const me = this;

            const arr = asArray( varargs( ...pComponents ) ).flat();

            this.#mappingFunction = function( e )
            {
                if ( isObject( e ) )
                {
                    if ( e instanceof me.constructor )
                    {
                        return asArray( e.components ).filter( e => !isNull( e ) && !isBlank( asString( e, true ) ) );
                    }
                    if ( isArray( e ) )
                    {
                        return asArray( e.map( me.#mappingFunction ) ).filter( e => !isNull( e ) && !isBlank( asString( e, true ) ) );
                    }
                }

                if ( !isNull( e ) )
                {
                    switch ( typeof e )
                    {
                        case _str:
                            return asString( e ).split( _dot ).map( e => asString( e ).trim() );

                        case _num:
                        case _big:
                        case _bool:
                            return asString( e );

                        case _symbol:
                            const s = e.toString().replace( /^Symbol\s*\(\s*/, _mt_str ).replace( /\s*\)$/, _mt_str );
                            return asString( s ).split( _dot ).map( e => asString( e ).trim() );

                        case _fun:
                            return asString( e.name || e ).trim().split( _dot ).map( e => asString( e ).trim() );

                        default:
                            return asString( e ).split( _dot ).map( e => asString( e ).trim() );
                    }
                }
                return "~~null_key~~";
            };

            this.#components = arr.map( this.#mappingFunction ).flat();
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get components()
        {
            return [...asArray( this.#components )].map( this.#mappingFunction ).flat();
        }

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

        isAssignableTo( pValue, pClass )
        {
            if ( isNull( pValue ) )
            {
                return false;
            }

            const cls = isClass( pClass ) ? pClass || this.constructor[Symbol.species] || this.constructor : this.constructor[Symbol.species] || this.constructor;

            return instanceOfAny( cls, cls[Symbol.species] ) && !(this === pValue);
        }

        set defaultValue( pValue )
        {
            this.#defaultValue = isValidResourceValue( pValue ) ? pValue : null;
        }

        toString()
        {
            return this.components.map( e => e.trim() ).join( _dot );
        }

        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        [Symbol.toPrimitive]()
        {
            return this.toString();
        }

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

        clone()
        {
            return new (this.constructor[Symbol.species] || this.constructor)( ...this.components );
        }
    }

    class Resource extends LocaleResourcesBase
    {
        #key;
        #value;
        #backedBy;

        constructor( pKey, pValue )
        {
            super();

            this.#key = this.initializeKey( pKey );
            this.#value = this.initializeValue( pValue, pKey );

            this.#backedBy = (this.isAssignableTo( pValue, this.constructor ) ? pValue : (this.isAssignableTo( pKey, this.constructor ) ? pKey : null));
        }

        static get [Symbol.species]()
        {
            return this;
        }

        isAssignableTo( pValue, pClass )
        {
            if ( isNull( pValue ) )
            {
                return false;
            }

            const cls = isClass( pClass ) ? pClass || this.constructor[Symbol.species] || this.constructor : this.constructor[Symbol.species] || this.constructor;

            return instanceOfAny( cls, cls[Symbol.species] ) && !(this === pValue);
        }

        isValidResource( pClass )
        {
            const thisClass = this.constructor || this.constructor[Symbol.species];

            if ( isClass( pClass ) )
            {
                return e => !isNull( e ) && instanceOfAny( e, pClass, thisClass );
            }
            return e => !isNull( e ) && instanceOfAny( e, thisClass );
        }

        isValidResourceValue( pValue )
        {
            return isValidResourceValue( pValue );
        }

        initializeKey( pKey )
        {
            let key;

            if ( this.isAssignableTo( pKey, this.constructor ) )
            {
                key = pKey.key || pKey.#backedBy?.key || new ResourceKey( pKey );
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

            this.#key = key;

            return key;
        }

        _copyValue( pValue )
        {
            if ( isNonNullObject( pValue ) )
            {
                if ( isFunction( pValue.clone ) )
                {
                    return pValue.clone();
                }
                else if ( this.isAssignableTo( pValue, this.constructor ) )
                {
                    return new (this.constructor[Symbol.species])( this.key, pValue );
                }
                return immutableCopy( pValue );
            }
            return pValue;
        }

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

            this.#value = value;

            return value;
        }

        get key()
        {
            const key = new ResourceKey( this.#key || this.#backedBy?.key );
            key.defaultValue = (this.#key || this.#backedBy?.key)?.defaultValue;
            return key;
        }

        get value()
        {
            return this.isValidResourceValue( this.#value ) ? this._copyValue( this.#value ) : this._copyValue( this.#backedBy?.value );
        }

        toString()
        {
            return this.key.toString() + "=" + asString( this.value );
        }

        [Symbol.toStringTag]()
        {
            return this.toString();
        }

        [Symbol.toPrimitive]()
        {
            return asString( this.value );
        }
    }

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
        else if ( isObject( elem ) )
        {
            if ( elem instanceof Resource )
            {
                return elem;
            }
            return new Resource( asString( elem.key ), elem.value );
        }
        return null;
    };

    const PARTS_OF_SPEECH =
        {
            NOUN: "noun",
            VERB: "verb",
            ADJECTIVE: "adjective",
            ADVERB: "adverb",
            PHRASE: "phrase",
            MESSAGE: "message"
        };

    class GrammarResource extends Resource
    {
        #defaultResource;
        #partOfSpeech;
        #forms;

        #antonym;

        constructor( pKey, pValue, pPartOfSpeech, pForms )
        {
            super( pKey, pValue );

            this.#defaultResource = (pKey instanceof Resource ? pKey : this) || this;

            this.#partOfSpeech = pPartOfSpeech || "phrase";

            this.#forms = isNonNullObject( pForms ) ? pForms : { value: pValue };
            if ( !(this.defaultForm in this.#forms) )
            {
                this.#forms[this.defaultForm] = this.value;
            }
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get partOfSpeech()
        {
            return this.#partOfSpeech || "phrase";
        }

        get forms()
        {
            return this.#forms;
        }

        get defaultForm()
        {
            switch ( this.partOfSpeech )
            {
                case PARTS_OF_SPEECH.NOUN:
                    return "singular";

                case PARTS_OF_SPEECH.VERB:
                    return "base_form";

                case PARTS_OF_SPEECH.ADJECTIVE:
                    return "positive";

                case PARTS_OF_SPEECH.ADVERB:
                    return "positive";

                case PARTS_OF_SPEECH.PHRASE:
                    return "singular";

                case PARTS_OF_SPEECH.MESSAGE:
                    return "singular";

                default:
                    return "value";
            }
        }

        getForm( pForm )
        {
            const form = asString( pForm || this.defaultForm ).toLowerCase();
            return this.forms[form] || this.value || this.#defaultResource?.value;
        }

        getAntonym()
        {
            return this.#antonym;
        }

        setAntonym( pKey, pValue, pForms )
        {
            this.#antonym = new GrammarResource( pKey, pValue, this.partOfSpeech, pForms );
        }

        isValidResource( pClass )
        {
            const thisClass = this.constructor || this.constructor[Symbol.species];

            if ( isClass( pClass ) )
            {
                return e => !isNull( e ) && instanceOfAny( e, pClass, Resource, thisClass );
            }
            return e => !isNull( e ) && instanceOfAny( e, Resource, thisClass );
        }
    }

    class NounForms
    {
        singular;
        plural;
        zero;
        one;
        two;
        few;
        many;
        gerund;

        constructor( pZero, pOne, pTwo, pFew, pMany, pGerund )
        {
            this.singular = asString( pOne, true );
            this.plural = asString( pMany || pZero, true );
            this.zero = asString( pZero || pMany || this.plural, true );
            this.one = asString( pOne || this.singular, true );
            this.two = asString( pTwo || this.plural, true );
            this.few = asString( pFew || this.plural, true );
            this.many = asString( pMany || this.plural, true );
            this.gerund = asString( pGerund || (this.singular + "ing"), true );
        }
    }

    class NounResource extends GrammarResource
    {
        constructor( pKey, pValue, pNounForms )
        {
            super( pKey, pValue, PARTS_OF_SPEECH.NOUN, pNounForms );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get defaultForm()
        {
            return "singular";
        }
    }

    class VerbForms
    {
        infinitive;
        base_form;
        base_form_plural;
        present_tense;
        past_tense;
        nominalization;
        agent;
        adj;
        adv;

        constructor( pInfinitive, pBase, pBasePlural, pPresent, pPast, pNominalization, pAdjective, pAdverb, pAgent )
        {
            this.infinitive = asString( pInfinitive, true );
            this.base_form = asString( pBase, true );
            this.base_form_plural = asString( pBasePlural || this.base_form, true );
            this.present_tense = asString( pPresent || this.base_form, true );
            this.past_tense = asString( pPast || this.present_tense, true );
            this.nominalization = asString( pNominalization, true );
            this.agent = asString( pAgent || (this.nominalization + "er"), true );
            this.adj = asString( pAdjective, true );
            this.adv = asString( pAdverb, true );
        }
    }

    class VerbResource extends GrammarResource
    {
        constructor( pKey, pValue, pVerbForms )
        {
            super( pKey, pValue, PARTS_OF_SPEECH.VERB, pVerbForms );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get defaultForm()
        {
            return "base_form";
        }
    }

    class AdjectiveForms
    {
        positive;
        negative;
        comparative;
        superlative;

        constructor( pPositive, pNegative, pComparative, pSuperlative )
        {
            this.positive = asString( pPositive, true );
            this.negative = asString( pNegative, true );
            this.comparative = asString( pComparative || this.positive, true );
            this.superlative = asString( pSuperlative || this.positive, true );
        }
    }

    class AdjectiveResource extends GrammarResource
    {
        constructor( pKey, pValue, pAdjectiveForms )
        {
            super( pKey, pValue, PARTS_OF_SPEECH.ADJECTIVE, pAdjectiveForms );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get defaultForm()
        {
            return "positive";
        }
    }

    class PhraseResource extends GrammarResource
    {
        #resources = [];

        constructor( pKey, pValue, ...pResources )
        {
            super( pKey, pValue, PARTS_OF_SPEECH.PHRASE );

            this.#resources = flatArgs( ...pResources ).filter( this.isValidResource( this.constructor ) );
        }

        static get [Symbol.species]()
        {
            return this;
        }

        get resources()
        {
            return asArray( this.#resources ).flat().filter( this.isValidResource( this.constructor ) );
        }

        getString( ...pForms )
        {
            const forms = flatArgs( ...pForms ).map( asString ).filter( e => !isBlank( e ) );

            const resources = asArray( this.resources );

            let phrase = _mt_str;

            for( let i = 0, n = resources.length; i < n; i++ )
            {
                const part = asString( resources[i].getForm( forms[i] || forms[forms.length - 1] ), true );

                phrase += (_spc + part);
            }

            return phrase;
        }
    }

    PhraseResource.FILTER = e => !isNull( e ) && (instanceOfAny( e, Resource, PhraseResource, GrammarResource ));

    PhraseResource.from = function( pKey, ...pResources )
    {
        const args = flatArgs( pResources ).filter( PhraseResource.FILTER );

        let value = _mt_str;

        for( let arg of args )
        {
            value += (_spc + asString( arg.value, true ));
        }

        return new PhraseResource( pKey, value, ...args );
    };

    class MessageResource extends PhraseResource
    {
        constructor( pKey, pValue, ...pResources )
        {
            super( pKey, pValue, ...pResources );
        }

        static get [Symbol.species]()
        {
            return this;
        }
    }

    MessageResource.from = function( pKey, ...pResources )
    {
        const pr = PhraseResource.from( pKey, ...pResources );

        return new MessageResource( pKey || pr?.key, pr?.value, ...(flatArgs( ...pr.resources )) );
    };

    function isResource( pObject )
    {
        return isNonNullObject( pObject ) && instanceOfAny( pObject, Resource, GrammarResource, NounResource, VerbResource, AdjectiveResource, PhraseResource, MessageResource );
    }

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
                    const rsrc = (instanceOfAny( elem, Resource, GrammarResource, PhraseResource, MessageResource )) ? elem : Resource.from( elem );

                    if ( !isNull( rsrc ) && instanceOfAny( rsrc, Resource, GrammarResource, PhraseResource, MessageResource ) )
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
