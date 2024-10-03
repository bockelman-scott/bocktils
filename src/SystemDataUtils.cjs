const os = require( "os" );

const constants = require( "./Constants.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );
const objectUtils = require( "./ObjectUtils.cjs" );
const jsonUtils = require( "./JsonUtils.cjs" );

const configurator = require( "../Configuration.js" );

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__SYSTEM_DATA_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const MACHINE_TYPES =
        Object.freeze(
            {
                "arm": "arm",
                "arm64": "arm64",
                "aarch64": "aarch64",
                "mips": "mips",
                "mips64": "mips64",
                "ppc64": "ppc64",
                "ppc64le": "ppc64le",
                "s390": "s390",
                "s390x": "s390x",
                "i386": "i386",
                "i686": "i686",
                "x86_64": "x86_64"
            } );

    class SystemData
    {
        constructor( pOperatingSystem, pProcess )
        {
            this._os = pOperatingSystem || os;

            this._process = pProcess || process;

            this._lineFeed = (this._os || os)?.EOL;

            this._memory = (this._os || os)?.totalmem() || 0;

            this._freeMemory = (this._os || os)?.freemem() || 0;

            this._home = (this._os || os)?.homedir() || _dot;

            this._host = (this._os || os)?.hostname() || _mt_str;

            this._tmp = (this._os || os)?.tmpdir() || _dot;

            this._machine = MACHINE_TYPES[(this._os || os)?.machine() || "x86_64"];

            this._cpuUsage = Object.freeze( ((this._process || process)?.cpuUsage()) || EMPTY_OBJECT );

            this._cpuUser = (this._cpuUsage?.user || 0);

            this._cpuSystem = (this._cpuUsage?.system || 0);

            this._cpus = Object.freeze( Object.assign( {}, ((this._os || os)?.cpus() || EMPTY_OBJECT) ) );

            this._nics = Object.freeze( (this._os || os)?.networkInterfaces() || EMPTY_OBJECT );


            this._platform = ((this._os || os)?.platform() || (this._process || process)?.platform);

            this._uptimeSeconds = Math.floor( (this._process || process)?.uptime() || (this._os || os)?.uptime() || 0 );

            this._workingDirectory = (this._process || process)?.cwd() || __dirname;

            this._ports = Object.freeze( { "debug": (this._process || process)?.debugPort } );

            this._env = Object.freeze( Object.assign( {}, ((this._process || process)?.env) ) );

            this._processId = (this._process || process)?.pid;

            this._parentProcessId = (this._process || process)?.ppid;

            this._diagnosticReportGenerator = (this._process || process)?.report;

            this._dependencies = (this._process || process)?.versions || EMPTY_OBJECT;

            this._loggingInfo = {};
        }

        get loggingInfo()
        {
            return this._loggingInfo;
        }

        set loggingInfo( pInfo )
        {
            this._loggingInfo = pInfo;
        }

        get lineFeedCharacter()
        {
            return this._lineFeed || constants._lf;
        }

        get totalMemory()
        {
            return this._memory || 0;
        }

        get freeMemory()
        {
            return this._freeMemory || 0;
        }

        get memoryUsage()
        {
            return Object.freeze( Object.assign( {}, ((this._process || process)?.memoryUsage()) ) );
        }

        get homeDirectory()
        {
            return this._home || (_ud !== typeof cwd ? cwd() : constants._dot);
        }

        get tempDirectory()
        {
            return this._tmp || constants._dot;
        }

        get hostName()
        {
            return this._host || constants._unknown;
        }

        get machineType()
        {
            return this._machine || constants._unknown;
        }

        get cpus()
        {
            return this._cpus;
        }

        get cpuUsage()
        {
            return this._cpuUsage || { "user": 0, "system": 0 };
        }

        get userModeCpuUsage()
        {
            return this._cpuUser || (this.getCpuUsage() || { "user": 0 })?.user;
        }

        get systemModeCpuUsage()
        {
            return this._cpuSystem || (this.getCpuUsage() || { "system": 0 })?.user;
        }

        get networkInterfaces()
        {
            return this._nics || constants.EMPTY_OBJECT;
        }

        get platform()
        {
            return this._platform || constants._unknown;
        }

        get uptimeInSeconds()
        {
            return this._uptimeSeconds;
        }

        getUptime( pUnit, pOptions )
        {
            const units = objectUtils.isUndefined( pUnit ) ? "seconds" : asString( pUnit, true ).toLowerCase();

            const options = Object.assign( {}, (pOptions || { method: "round" }) );

            let uptime = this.uptimeInSeconds || 0;

            switch ( units )
            {
                case "seconds":
                    uptime = this.uptimeInSeconds;
                    break;

                case "minutes":
                    uptime = (uptime / 60);
                    break;

                case "hours":
                    uptime = this.getUptime( "minutes", options );
                    uptime = (uptime / 60);
                    break;

                case "days":
                    uptime = this.getUptime( "hours", options );
                    uptime = (uptime / 24);
                    break;

                case "weeks":
                    uptime = this.getUptime( "days", options );
                    uptime = (uptime / 7);
                    break;

                case "years":
                    uptime = this.getUptime( "days", options );
                    uptime = (uptime / 365.25);
                    break;

                default:
                    break;

            }

            switch ( options?.method )
            {
                case "floor":
                    uptime = Math.floor( uptime );
                    break;

                case "ceil":
                case "ceiling":
                    uptime = Math.ceil( uptime );
                    break;

                case "round":
                    uptime = Math.round( uptime );
                    break;

                default:
                    break;

            }

            return uptime;
        }

        get workingDirectory()
        {
            return this._workingDirectory || this.homeDirectory || this.tempDirectory;
        }

        get ports()
        {
            let ports = {};

            if ( objectUtils.isPopulated( this._ports ) )
            {
                ports = Object.assign( ports, this._ports );
            }

            const configuration = new configurator.Configurator( "./config.json" );
            const config = configuration.config || new configurator.Configuration( { server: { port: 3000 } } );

            ports["listen"] = stringUtils.asInt( asString( config.getValue( "service.server.port" ), true ) || "8080" );

            return Object.freeze( ports );
        }

        get environment()
        {
            return this._env || Object.freeze( Object.assign( {}, ((this._process || process)?.env) ) );
        }

        get processId()
        {
            return this._processId || (this._process || process)?.pid || 0;
        }

        get parentProcessId()
        {
            return this._parentProcessId || (this._process || process)?.ppid;
        }

        get dependencies()
        {
            return this._dependencies;
        }

        get diagnosticReporter()
        {
            return this._diagnosticReportGenerator || (this._process || process)?.report;
        }

        get report()
        {
            return process.report.getReport();
        }

        toObject()
        {
            const obj =
                {
                    totalMemory: this.totalMemory,
                    freeMemory: this.freeMemory,
                    memoryUsage: this.memoryUsage,

                    cpus: this.cpus,
                    cpuUsage: this.cpuUsage,
                    userModeCpuUsage: this.userModeCpuUsage,
                    systemModeCpuUsage: this.systemModeCpuUsage,

                    uptimeInSeconds: this.uptimeInSeconds,
                    uptimeInDays: this.getUptime( "days", { method: "raw" } ),

                    host: this.hostName,
                    nics: this.networkInterfaces,
                    ports: this.ports,

                    machine: this.machineType,
                    platform: this.platform,
                    homeDirectory: this.homeDirectory,
                    workingDirectory: this.workingDirectory,
                    tempDirectory: this.tempDirectory,

                    environment: this.environment,
                    processId: this.processId,
                    parentProcessId: this.parentProcessId,

                    dependencies: this.dependencies,

                    diagnosticReport: this.report
                };

            return Object.freeze( obj );
        }

        toJson()
        {
            const obj = this.toObject();

            return jsonUtils.asJson( obj );
        }

    }

    const generateSystemStatistics = function()
    {
        return new SystemData( os, process ) || {};
    };

    const mod =
        {
            MACHINE_TYPES,
            SystemData,
            generateSystemStatistics
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
