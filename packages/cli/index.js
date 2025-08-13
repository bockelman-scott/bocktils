const core = require( "@toolbocks/core" );

const fileUtils = require( "@toolbocks/files" );

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

    const { ToolBocksModule, ObjectEntry, objectEntries, attempt, asyncAttempt, lock, localCopy, $ln } = moduleUtils;

    const { _mt_str = "", _mt = _mt_str, _spc, _str, _num, _bool } = constants;

    const { isNull, isNonNullValue, isNonNullObject, isArray, isNumeric, isString, isBoolean, isFunction } = typeUtils;

    const { asString, asInt, asFloat, toBool, isBlank, isJson, lcase, toUnixPath, toUnixLinebreaks } = stringUtils;

    const { asArray } = arrayUtils;

    const { resolvePath, readFile } = fileUtils;

    const { parseJson } = jsonUtils;

    const toolBocksModule = new ToolBocksModule( "CommandLineUtils", INTERNAL_NAME );

    function stripHyphens( pStr )
    {
        return asString( asString( pStr, true ).replace( /^--?/, _mt ), true );
    }

    class CliParameter
    {
        name;
        alias;
        type;
        defaultValue;
        required;

        constructor( pName, pAlias = pName, pType = _str, pDefaultValue = _mt, pRequired = false )
        {
            this.name = stripHyphens( asString( pName, true ) || _mt );
            this.alias = stripHyphens( asString( pAlias, true ) || this.name || _mt );
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

        clone()
        {
            return new CliParameter( this.name, this.alias, this.type, this.defaultValue, this.required );
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
            return stripHyphens( asString( this.parameter?.name || this.parameter?.alias || _mt, true ) );
        }

        get alias()
        {
            return stripHyphens( asString( this.parameter?.alias || this.parameter?.name || _mt, true ) );
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

        clone()
        {
            return new CliArgument( this.parameter.clone(), localCopy( this.value ) );
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
                             this.#map.set( stripHyphens( param?.name || param?.alias ), param );
                             if ( param?.alias )
                             {
                                 this.#map.set( stripHyphens( param?.alias ), param );
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

            entries.forEach( entry => map.set( stripHyphens( ObjectEntry.getKey( entry ) ), ObjectEntry.getValue( entry ) ) );

            return lock( map );
        }

        getPosition( pKey )
        {
            let key = stripHyphens( asString( pKey, true ) );
            return this.#params.findIndex( e => e?.name === key || e?.name === lcase( key ) || e?.alias === key || e?.alias === lcase( key ) );
        }

        getIndex( pKey )
        {
            return this.getPosition( pKey );
        }

        getParameter( pIndexOrKey )
        {
            if ( isNumeric( pIndexOrKey ) )
            {
                return this.#params[asInt( pIndexOrKey )];
            }
            const key = stripHyphens( asString( pIndexOrKey, true ) );
            return this.#map.get( key ) || this.#map.get( lcase( key ) );
        }

        addParameter( pParameter, pIndex = -1 )
        {
            const index = asInt( pIndex );

            if ( index >= 0 )
            {
                this.#params.splice( index, 0, pParameter );
            }
            else
            {
                this.#params.push( pParameter );
            }

            let key = stripHyphens( asString( pParameter?.name || pParameter?.alias, true ) );

            if ( !isBlank( key ) )
            {
                this.#map.set( key, pParameter );
                this.#map.set( lcase( key ), pParameter );
            }

            key = stripHyphens( asString( pParameter?.alias || pParameter?.name, true ) );

            if ( !isBlank( key ) && key !== pParameter?.name )
            {
                this.#map.set( key, pParameter );
                this.#map.set( lcase( key ), pParameter );
            }
        }

        clone()
        {
            let params = [...this.parameters].map( e => e.clone() );
            return new CliParameters( ...params );
        }
    }

    class CliArguments
    {
        #args = [];
        #map = new Map();

        constructor( ...pArgs )
        {
            const arr = asArray( pArgs ).filter( e => !isNull( e ) && e instanceof CliArgument );
            if ( $ln( arr ) )
            {
                this.#args.push( ...arr );
                this.#args = this.#args.flat();

                if ( $ln( this.#args ) )
                {
                    this.#args.forEach( a =>
                                        {
                                            this.#map.set( stripHyphens( a.name ), a );
                                            this.#map.set( lcase( stripHyphens( a.name ) ), a );

                                            this.#map.set( stripHyphens( a.alias || a.name ), a );
                                            this.#map.set( lcase( stripHyphens( a.alias || a.name ) ), a );
                                        } );
                }
            }
        }

        get arguments()
        {
            return [...(asArray( this.#args || [] ) || [])].filter( e => !isNull( e ) && e instanceof CliArgument );
        }

        addArgument( pArgument, pIndex = -1 )
        {
            if ( isNonNullObject( pArgument ) && pArgument instanceof CliArgument )
            {
                const index = asInt( pIndex );

                if ( index >= 0 )
                {
                    this.#args.splice( index, 0, pArgument );
                }
                else
                {
                    this.#args.push( pArgument );
                }

                this.#args = this.#args.flat();

                this.#map.set( stripHyphens( pArgument.name ), pArgument );
                this.#map.set( lcase( stripHyphens( pArgument.name ) ), pArgument );

                this.#map.set( stripHyphens( pArgument.alias ), pArgument );
                this.#map.set( lcase( stripHyphens( pArgument.alias ) ), pArgument );
            }
        }

        getArgument( pIndexOrKey )
        {
            if ( isNumeric( pIndexOrKey ) )
            {
                return this.#args[asInt( pIndexOrKey )];
            }
            const key = stripHyphens( asString( pIndexOrKey, true ) );
            return this.#map.get( key ) || this.#map.get( lcase( key ) );
        }

        getArgumentValue( pIndexOrKey )
        {
            const argument = this.getArgument( pIndexOrKey );
            if ( isNonNullValue( argument ) && argument instanceof CliArgument )
            {
                return argument.value;
            }
            return null;
        }

        clone()
        {
            let args = [...(this.arguments)].map( e => e.clone() );

            return new CliArguments( ...args );
        }

        asPopulatedWithDefaults( pCliParameters )
        {
            let newInstance = this.clone();

            if ( isNonNullObject( pCliParameters ) && pCliParameters instanceof CliParameters )
            {
                const parameters = pCliParameters.parameters;
                if ( $ln( parameters ) )
                {
                    parameters.forEach( param =>
                                        {
                                            const arg = newInstance.getArgument( param?.name || param?.alias ) || newInstance.getArgument( param?.alias || param?.name );
                                            if ( isNull( arg ) || !(arg instanceof CliArgument) )
                                            {
                                                const cliArgument = new CliArgument( param, param.getDefaultValue() );
                                                newInstance.addArgument( cliArgument, pCliParameters.getPosition( param?.name || param?.alias ) );
                                            }
                                        } );
                }
            }

            return newInstance || this;
        }
    }

    class CliParser
    {
        #cliParameters;
        #skip = 2;
        #assignmentCharacter = _spc;

        #cliArguments = new CliArguments();

        #positional = false;

        constructor( pCliParameters, pSkip = 2, pAssignmentCharacter = _spc, pPositional = false )
        {
            this.#assignmentCharacter = asString( pAssignmentCharacter );
            this.#cliParameters = pCliParameters;
            this.#positional = !!pPositional;
        }

        get cliParameters()
        {
            return this.#cliParameters || new CliParameters();
        }

        get cliArguments()
        {
            this.#cliArguments = (isNonNullObject( this.#cliArguments ) && this.#cliArguments instanceof CliArguments) ? this.#cliArguments : new CliArguments();

            return this.#cliArguments.asPopulatedWithDefaults( this.cliParameters );
        }

        getParameter( pKeyOrIndex )
        {
            const params = this.cliParameters;
            if ( isNonNullObject( params ) && isFunction( params?.getParameter ) )
            {
                return params.getParameter( pKeyOrIndex );
            }
            return null;
        }

        getArgument( pIndexOrKey )
        {
            return this.#cliArguments.getArgument( pIndexOrKey );
        }

        getArgumentValue( pIndexOrKey )
        {
            let value = null;

            const argument = this.getArgument( pIndexOrKey );

            if ( isNonNullObject( argument ) )
            {
                value = argument.value || this.#cliArguments.getArgumentValue( pIndexOrKey );
            }

            if ( isNull( value ) )
            {
                const parameter = this.getParameter( pIndexOrKey );
                if ( isNonNullObject( parameter ) )
                {
                    value = parameter.getDefaultValue();
                }
            }

            return value;
        }

        get assignmentCharacter()
        {
            return asString( this.#assignmentCharacter, false ) || _spc;
        }

        set assignmentCharacter( pCharacter )
        {
            this.#assignmentCharacter = asString( pCharacter, false ) || _spc;
        }

        get skip()
        {
            return this.#skip;
        }

        set skip( pNum )
        {
            this.#skip = asInt( pNum );
        }

        get positional()
        {
            return !!this.#positional;
        }

        set positional( pPositional )
        {
            this.#positional = !!pPositional;
        }

        addArgument( pKey, pValue, pIndex = -1 )
        {
            const parameter = this.getParameter( pKey ) || this.getParameter( pIndex );

            if ( isNonNullObject( parameter ) )
            {
                const argument = new CliArgument( parameter, pValue );
                this.#cliArguments.addArgument( argument, this.cliParameters.getPosition( pKey ) );
            }
        }

        getType( pArg )
        {
            const param = this.getParameter( pArg );
            return param?.type || _str;
        }

        parseArgv( pArgv )
        {
            let args = asArray( pArgv );
            args = args.slice( this.skip );

            for( let i = 0, n = $ln( args ); i < n; i++ )
            {
                let arg = stripHyphens( asString( args[i] ) );

                let value = null;

                if ( arg.includes( this.assignmentCharacter ) )
                {
                    const kv = arg.split( this.assignmentCharacter );
                    arg = stripHyphens( asString( kv[0], true ) );
                    value = asString( kv[1], true );
                }
                else if ( _bool === this.getType( arg ) )
                {
                    value = true;
                }
                else if ( this.#positional )
                {
                    value = arg;
                }
                else
                {
                    value = (i < ($ln( args ) - 1)) ? args[i + 1] : _mt;
                }

                this.addArgument( arg, value, i );
            }

            return this.cliArguments;
        }

        parseString( pString )
        {
            const s = asString( pString, true );
            return this.parseArgv( s.split( /\s+/ ) );
        }

        parseObject( pObject )
        {
            let obj = isNonNullObject( pObject ) ? pObject : (isString( pObject ) && isJson( pObject )) ? attempt( () => parseJson( pObject ) ) : {};
            const entries = objectEntries( obj );
            entries.forEach( entry =>
                             {
                                 const key = stripHyphens( ObjectEntry.getKey( entry ) );
                                 const value = ObjectEntry.getValue( entry );

                                 this.addArgument( key, value );
                             } );

            return this.cliArguments;
        }

        async parseFile( pFilePath )
        {
            const filePath = resolvePath( toUnixPath( asString( pFilePath, true ) ) );

            const contents = asString( await asyncAttempt( async() => await readFile( filePath, "utf-8" ) ), true );

            if ( isJson( contents ) )
            {
                let config = attempt( () => parseJson( contents ) );
                return this.parseObject( config );
            }
            else
            {
                const lines = (toUnixLinebreaks( contents )).split( /\n/ );
                lines.forEach( line =>
                               {
                                   const kv = line.split( this.assignmentCharacter );

                                   const arg = stripHyphens( asString( kv[0], true ) );

                                   const parameter = this.getParameter( arg );

                                   const value = (asString( kv[1], true ) || (_bool === parameter?.type ? true : kv[1]));

                                   this.addArgument( arg, value );
                               } );
            }

            return this.cliArguments;
        }

        /**
         * Reads command line arguments
         * and parses them into values expected by the script or application
         * being started with these arguments.
         *
         * Handles special character syntax for the first argument passed:
         * If the first character is..
         * (any quote), we look at the next character, and if that character is...
         * "@" - the rest of the command line is treated as a filepath from which the arguments will be read/parsed
         * "{" - the rest of the command line is treated as JSON which will be parsed into and object used to populate the expected argument values
         * "[" - the rest of the command line is treated as JSON (representing an array) that contains values for the arguments by position/index
         * (any other character) - the command line is processed 'normally' as an argv value
         *
         * @param pCommands an array of the space-separated values as passed on the command line
         *
         * @returns {Promise<CliArguments>}
         */
        async parse( pCommands )
        {
            {
                let commands = asArray( pCommands, { splitOn: _spc } ).slice( this.skip );

                if ( $ln( commands ) )
                {
                    let firstCommand = asString( commands[0], true );

                    let startIdx = 0;

                    while ( startIdx < $ln( firstCommand ) && /[`'"\s-]/.test( firstCommand[startIdx] ) )
                    {
                        startIdx++;
                    }

                    const firstCharacter = firstCommand[startIdx];

                    const command = asString( firstCommand.slice( startIdx ), true );
                    const unquoted = command.replace( /[`'";\s]+$/, _mt );

                    switch ( firstCharacter )
                    {
                        case "@":
                            return this.parseFile( command.replace( /^@+/, _mt ) );

                        case "{":
                            const object = attempt( () => parseJson( unquoted ) );
                            return this.parseObject( object );

                        case "[":
                            const arr = asArray( attempt( () => parseJson( unquoted ) ) );
                            return this.parseArgv( ["processName", "scriptName", ...arr] );

                        default:
                            return this.parseArgv( pCommands );
                    }
                }
                return Promise.resolve( new CliArguments() );
            }
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
                    fileUtils,
                    jsonUtils
                },
            classes:
                {
                    CliParameter,
                    CliArgument,
                    CliParameters,
                    CliArguments,
                    CliParser
                },
            CliParameter,
            CliParameters,
            CliParser
        };

    mod = toolBocksModule.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;
}());
