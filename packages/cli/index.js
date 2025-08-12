const core = require( "@toolbocks/core" );

const jsonUtils = require( "@toolbocks/json" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined" } = constants;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const INTERNAL_NAME = "__BOCK_CLI_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const { ToolBocksModule, ObjectEntry, objectEntries, lock } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _spc, _str, _num, _bool } = constants;

    const { isNull, isNonNullValue, isNumeric, isBoolean, isFunction } = typeUtils;

    const { asString, asInt, asFloat, toBool, isJson, lcase } = stringUtils;

    const { asArray } = arrayUtils;

    const modulePrototype = new ToolBocksModule( "CommandLineUtils", INTERNAL_NAME );

    class CliParameter
    {
        name;
        alias;
        type;
        defaultValue;
        required;

        constructor( pName, pAlias = pName, pType = _str, pDefaultValue = _mt, pRequired = false )
        {
            this.name = asString( pName, true ) || _mt;
            this.alias = asString( pAlias, true ) || this.name || _mt;
            this.type = lcase( asString( pType, true ) ) || _str;
            this.defaultValue = pDefaultValue || _mt;
            this.required = !!pRequired;
        }

        getDefaultValue()
        {
            const val = this.defaultValue || _mt;

            switch ( this.type )
            {
                case _ud:
                case _str:
                    return asString( val, true );

                case _num:
                    if ( isNumeric( val ) )
                    {
                        return asFloat( val, 0 );
                    }
                    return asFloat( val, 0 ) || 0;

                case _bool:
                    return toBool( val );

                default:
                    return val;
            }
        }
    }

    class CliArgument
    {
        #parameter;
        #value;

        constructor( pParameter, pValue )
        {
            this.#parameter = pParameter;
            this.#value = pValue;
        }

        get parameter()
        {
            const param = this.#parameter;
            return new CliParameter( param?.name, (param?.alias || param?.name), (param?.type || _str), param?.defaultValue, !!param?.required );
        }

        get type()
        {
            return this.parameter?.type || _str;
        }

        get name()
        {
            return this.parameter?.name || this.parameter?.alias || _mt;
        }

        get value()
        {
            const val = this.#value;

            if ( isNonNullValue( val ) )
            {
                switch ( this.type )
                {
                    case _ud:
                    case _str:
                        return asString( val, true );

                    case _num:
                        if ( isNumeric( val ) )
                        {
                            return asFloat( val, asFloat( this.parameter?.getDefaultValue(), 0 ) );
                        }
                        return asFloat( this.parameter?.getDefaultValue(), 0 ) || 0;

                    case _bool:
                        return toBool( val );

                    default:
                        return val;
                }
            }
            else
            {
                return this.parameter?.getDefaultValue();
            }
        }
    }

    class CliParameters
    {
        #params = [];
        #map = new Map();

        constructor( ...pParams )
        {
            const arr = asArray( pParams ).flat().filter( e => !isNull( e ) && e instanceof CliParameter );

            this.#params.push( ...arr );

            arr.forEach( param =>
                         {
                             this.#map.set( param?.name || param?.alias, param );
                             if ( param?.alias )
                             {
                                 this.#map.set( param?.alias, param );
                             }
                         } );
        }

        get parameters()
        {
            return [...((asArray( this.#params || [] ) || []).filter( e => !isNull( e ) && e instanceof CliParameter ))];
        }

        get map()
        {
            const map = new Map();

            const entries = objectEntries( this.#map ).filter( ObjectEntry.isValidEntry );

            entries.forEach( entry => map.set( ObjectEntry.getKey( entry ), ObjectEntry.getValue( entry ) ) );

            return lock( map );
        }

        getPosition( pKey )
        {

        }

        getIndex( pKey )
        {
            return this.getPosition( pKey );
        }

        getParameter( pIndexOrKey )
        {

        }

        addParameter( pParameter, pIndex = -1 )
        {

        }
    }

    class CliArguments
    {
        #args = [];
        #map = new Map();

        constructor( ...pArgs )
        {

        }

        addArgument( pArgument )
        {

        }

        getArgument( pIndexOrKey )
        {

        }

        getArgumentValue( pIndexOrKey )
        {

        }
    }

    class CliParser
    {
        #cliParameters;
        #skip = 2;
        #assignmentCharacter = _spc;

        constructor( pCliParameters, pSkip = 2, pAssignmentCharacter )
        {
            this.#assignmentCharacter = asString( pAssignmentCharacter );
            this.#cliParameters = pCliParameters;
        }

        get skip()
        {
            return this.#skip;
        }

        set skip( pNum )
        {
            this.#skip = asInt( pNum );
        }

        parse( pArgv )
        {
            let args = asArray( pArgv );
            args = args.slice( this.skip );


        }

        parseString( pString )
        {

        }

        parseFile( pFilePath )
        {

        }
    }


    let mod =
        {
            dependencies:
                {
                    constants,
                    typeUtils,
                    stringUtils,
                    arrayUtils,
                    jsonUtils
                }
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
