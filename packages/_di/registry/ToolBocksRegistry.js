/**
 * This file/module provides access to the Registries
 * available/relevant to the Bryson Applications.
 */
(function exposeModule()
{
    const GLOBAL_MODULE_KEY = "__PKG_TOOLBOCKS_DEPENDENCY_REGISTRY__";
    const GLOBAL_KEY = "__TOOLBOCKS_DEPENDENCY_REGISTRY__";

    const toolbocks = require( "@toolbocks/core" );
    const fileUtils = require( "@toolbocks/files" );
    const jsonUtils = require( "@toolbocks/json" );
    const logUtils = require( "@toolbocks/logging" );

    const depInjection = require( "@toolbocks/dep-injection" );

    const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = toolbocks;

    const
        {
            ToolBocksModule,
            Visitor,
            ObjectEntry,
            objectEntries,
            attempt,
            attemptSilent,
            asyncAttempt,
            dereference,
            readProperty,
            lock,
            $ln
        } = moduleUtils;

    const { _ud, _mt, $scope } = constants;

    const
        {
            isNull,
            isObject,
            isNonNullObject,
            isArray,
            isFunction,
            isString,
            isClass,
            getClass,
            getClassName
        } = typeUtils;

    if ( isNonNullObject( $scope[GLOBAL_MODULE_KEY] ) )
    {
        if ( isNonNullObject( $scope[GLOBAL_KEY] ) )
        {
            return $scope[GLOBAL_MODULE_KEY];
        }
    }

    const { asString, isBlank, isJson, lcase } = stringUtils;

    const { asArray } = arrayUtils;

    const
        {
            FileObject,
            DirectoryObject,
            getCurrentDirectory,
            resolvePath,
            getFileName,
            findFiles,
            readFile
        } = fileUtils;

    const { asObject } = jsonUtils;

    const { SimpleAsynchronousLogger, SourcedSimpleLogger } = logUtils;

    const
        {
            DEP_CONSTS,
            DEP_CONSTS_BY_ID,
            DEPENDENCY_TYPE,
            DependencyConstant,
            DependencyDescriptor,
            DependencyDescriptorOptions,
            PublishedComponent,
            DependencyRegistry,
            RegistryError
        } = depInjection;

    const DEFAULT_LOGGER = new SimpleAsynchronousLogger( ToolBocksModule.resolveLogger( ToolBocksModule.getGlobalLogger(), console ) ?? console );

    /**
     * This is the relative path from the source directory to the 'packages' directory.
     * We assume our code is deployed according to the same directory/path structure as the source.
     * @type {string}
     */
    const relativePath = "../../";

    /**
     * This is the directory in which this file exists, that is, '../api/packages/registry'
     * @type {string}
     */
    const scriptDirectory = __dirname;

    /**
     * This is the directory from which the current node.js executable was started
     * or the directory to which other code has changed to
     */
    const currentDirectory = getCurrentDirectory();

    /**
     * This is the default directory
     * from which we most likely want to begin scanning for published components.
     */
    const defaultRootDirectory = resolvePath( scriptDirectory, relativePath );

    /**
     * Returns the path to the directory
     * from which we most likely want to begin scanning for published components
     * @returns {string}
     */
    function calculateDefaultRootDirectory()
    {
        /**
         * This regular expression checks that a path ends with either packages, api, or bryson.
         * This is used to make sure we do not return a default directory too deep into the structure
         * to expect to find relevant published components.
         * @type {RegExp}
         */
        const rxPackagesOrRoot = /(packages$)|(bocktils$)|(toolbocks$)/;

        /**
         * This regular expression checks to see if the path is the directory in which this code exists.
         * If we find this directory, we know we can back up 2 directories to find a better default starting point.
         * @type {RegExp}
         */
        const rxRegistryDirectory = /registry$/;

        /**
         * Initialize the value to the most likely starting point.
         */
        let root = asString( defaultRootDirectory, true );

        /**
         * If the current directory is the packages, api, or a directory named bryson (for example, api.com.bryson),
         * We can start scanning from here.
         * Otherwise, we check other directories that might provide a good default starting point.
         */
        if ( isString( currentDirectory ) && !isBlank( currentDirectory ) )
        {
            const directory = asString( currentDirectory, true );

            if ( rxPackagesOrRoot.test( directory ) )
            {
                root = directory;
            }
            else if ( rxRegistryDirectory.test( currentDirectory ) )
            {
                root = resolvePath( directory, relativePath ) || defaultRootDirectory;
            }
        }
        else if ( isString( scriptDirectory ) && !isBlank( scriptDirectory ) )
        {
            const scriptDir = asString( scriptDirectory, true );

            if ( rxPackagesOrRoot.test( scriptDir ) )
            {
                root = scriptDir;
            }
            else if ( rxRegistryDirectory.test( scriptDirectory ) )
            {
                root = resolvePath( scriptDir, relativePath ) || defaultRootDirectory;
            }
        }
        else
        {
            if ( isString( defaultRootDirectory ) && !isBlank( defaultRootDirectory ) )
            {
                const defaultDir = asString( defaultRootDirectory, true );

                if ( rxPackagesOrRoot.test( defaultDir ) )
                {
                    root = defaultDir;
                }
                else if ( rxRegistryDirectory.test( defaultDir ) )
                {
                    root = resolvePath( defaultDir, relativePath );
                }
            }
        }

        // control to prevent infinite loops
        let numIterations = 0;

        while ( !(isBlank( root ) || ["/", "C:\\"].includes( root )) && !(rxPackagesOrRoot.test( root )) && ++numIterations < 10 )
        {
            root = resolvePath( root, "../" );
        }

        // return a reasonable default path
        return resolvePath( asString( root || defaultRootDirectory, true ) );
    }

    /**
     * Returns an object representation of the package.json file specified by the provided FileObject.
     *
     * @param {FileObject} pFileObject
     *
     * @returns {Promise<{Object}>} an object constructed by parsing a package.json file
     */
    const getPackageObject = async function( pFileObject )
    {
        let pkgObject = null;

        if ( isNonNullObject( pFileObject ) && isFunction( pFileObject.getObjectFromJson ) )
        {
            pkgObject = await asyncAttempt( async() => await pFileObject.getObjectFromJson() );
        }

        if ( isNull( pkgObject ) || !isObject( pkgObject ) || $ln( Object.entries( pkgObject ) < 1 ) )
        {
            const filePath = isNonNullObject( pFileObject ) ? asString( pFileObject.filepath || asString( pFileObject, true ), true ) : (isString( pFileObject ) ? asString( pFileObject, true ) : _mt);

            if ( !isBlank( filePath ) )
            {
                let content = await asyncAttempt( async() => await readFile( filePath, "utf-8" ) );

                content = asString( content, true );

                if ( isString( content ) && !isBlank( content ) && isJson( content ) )
                {
                    pkgObject = asObject( content );
                }
            }
        }

        return asObject( pkgObject ?? {} ) ?? {};
    };

    function registerPublishedComponent( pComponentData, pModulePath, pModuleVersion, pRegistry, pLogger = DEFAULT_LOGGER )
    {
        let publishedComponent = null;

        const registry = pRegistry ?? this.registry ?? TOOLBOCKS_REGISTRY;

        const logger = ToolBocksModule.resolveLogger( pLogger, this.logger, DEFAULT_LOGGER );

        const componentData = dereference( asObject( pComponentData ?? {} ) ?? {} );

        const entries = objectEntries( componentData );

        if ( isNull( entries ) || $ln( entries ) < 1 )
        {
            attemptSilent( () => logger.warn( `The component data object is not valid` ) );
        }

        for( let entry of entries )
        {
            let key = asString( ObjectEntry.getKey( entry ), true );

            let value = asObject( ObjectEntry.getValue( entry ) );

            if ( isNull( value ) || !isObject( value ) )
            {
                continue;
            }

            let id = value?.id || asString( readProperty( value, "id", "name" ), true ) || key;
            let name = value?.name || asString( readProperty( value, "name", "component", "path" ), true );

            let source = value?.path || asString( readProperty( value, "path" ) || pModulePath, true ) || pModulePath;
            let ver = value?.version || asString( readProperty( value, "version" ), true ) || pModuleVersion;

            let component = asString( value?.component ?? asString( readProperty( value, "component", "class", "path", "name" ), true ) ?? source ?? pModulePath, true );

            let type = DEPENDENCY_TYPE.resolveType( asString( value?.type || readProperty( value, "type" ), true ) ) || DEPENDENCY_TYPE.DEFAULT;

            let args = asArray( value?.args ?? readProperty( value, "args", "arguments", "parameters" ) ?? [] );

            let options = asObject( value?.options ?? readProperty( value, "options" ) );

            let cacheable = isNull( value?.cacheable ) || ("false" !== asString( readProperty( value, "cacheable" ) ));

            let dependencyConstant = readProperty( DEP_CONSTS_BY_ID, id ) ??
                                     readProperty( DEP_CONSTS, key ) ??
                                     new DependencyConstant( id, name, component );

            publishedComponent = new PublishedComponent( dependencyConstant,
                                                         (source || pModulePath),
                                                         (component || name),
                                                         (type || DEPENDENCY_TYPE.DEFAULT),
                                                         (ver || pModuleVersion),
                                                         ...args );

            if ( !cacheable )
            {
                publishedComponent.cacheable = false;
            }

            if ( isNonNullObject( options ) )
            {
                let optionEntries = objectEntries( options );
                optionEntries.forEach( opt => attempt( () => publishedComponent.addOption( ObjectEntry.getKey( opt ), ObjectEntry.getValue( opt ) ) ) );
            }

            let registered = false;

            try
            {
                registered = registry.register( publishedComponent );
            }
            catch( ex )
            {
                attemptSilent( () => pLogger.error( new RegistryError( ex ) ) );
            }

            if ( registered )
            {
                attemptSilent( () => pLogger.debug( `Registered ${publishedComponent.toString()}` ) );
            }
        }

        return publishedComponent;
    }

    /**
     * Registers published components declared in the specified packages.json (as an object).
     *
     * @param {DependencyRegistry} pRegistry - the registry in which components will be registered
     * @param {Object|String} pPkgObject - an object created by parsing the JSON text of a packages.json manifest
     * @param {ILogger} [pLogger=DEFAULT_LOGGER] a logger to write to a persistent sink allowing review of the registration of components
     *
     * @returns {DependencyRegistry|ToolBocksRegistry} returns the updated registry
     */
    const registerComponents = function( pRegistry, pPkgObject, pLogger = DEFAULT_LOGGER )
    {
        const registry = pRegistry ?? this.registry ?? TOOLBOCKS_REGISTRY;

        const logger = ToolBocksModule.resolveLogger( pLogger, this.logger, DEFAULT_LOGGER );

        const pkgObject = asObject( pPkgObject );

        if ( isNonNullObject( pkgObject ) )
        {
            const published = asArray( pkgObject["_publishes"] ?? pkgObject["components"] ?? [] );

            const path = pkgObject.name; // module name

            if ( isArray( published ) && $ln( published ) > 0 )
            {
                const version = pkgObject.version; // module version

                attemptSilent( () => logger.debug( `Found ${$ln( published )} published component(s) in ${path}, version: ${version || "0.0.0"}` ) );

                /**
                 Each object in the published array has this structure:
                 {
                 "KEY":
                 {
                 "id": "string.string",
                 "name": "string",
                 "component": "string",
                 "cacheable": boolean,
                 "path":"string -- overrides package name",
                 "version": "string -- overrides package version"
                 }
                 }
                 */

                for( let component of published )
                {
                    (this.registerPublishedComponent ?? registerPublishedComponent)( component, path, version, registry, logger );
                }
            }
            else
            {
                attemptSilent( () => logger.debug( `There are no published components declared in ${path}` ) );
            }
        }
        else
        {
            attemptSilent( () => logger.warn( `The package object is not valid` ) );
        }

        return registry;
    };

    /**
     * Returns true if the argument passed to the visitor
     * is a FileObject representing a file named, "package.json"
     * @param {FileObject|DirectoryObject} pVisited - the value passed to the visitor
     * @returns {Promise<boolean>} ture if we are visiting a file named, "package.json"
     */
    const isPackageJson = async function( pVisited )
    {
        if ( isNonNullObject( pVisited ) && isFunction( pVisited?.isFile ) )
        {
            const isFile = await asyncAttempt( async() => await pVisited.isFile() );

            return isFile && ("package.json" === asString( pVisited?.filename, true ));
        }
        return false;
    };

    /**
     * This is the function called by an object that supports visitors during each internal iteration.
     *
     * @param {FileObject|DirectoryObject} pVisited - the value being "visited", which is passed to the visitor
     *
     * @param {...*} pExtra - any of one or more values passed to the visitor in addition to the visited value
     *
     * @returns {Promise<void>}
     */
    async function visit( pVisited, ...pExtra )
    {
        // This function is bound to the PackageVisitor.
        // All references to 'this' are to the PackageVisitor instance.

        /**
         * We're only interested in FileObject instances representing package.json files
         * So, we call a method to check for this before performing any other work.
         * Note that we do some synchronous checks before calling the async method
         * @type {boolean}
         */
        let isPkg = isNonNullObject( pVisited ) && isFunction( pVisited.isFile ) && await ((this.isPackageJson ?? isPackageJson)( pVisited ));

        if ( isPkg )
        {
            let registry = this.registry ?? TOOLBOCKS_REGISTRY;

            let logr = ToolBocksModule.resolveLogger( this.logger, registry?.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

            let pkgObject = await ((this.getPackageObject ?? getPackageObject)( pVisited ));

            if ( isNonNullObject( pkgObject ) )
            {
                this.registerComponents( registry, pkgObject, logr );
            }
        }
    }

    /**
     * This subclass of Visitor
     * processes each package.json file
     * found during the breadth-first scan of folders.
     */
    class PackageVisitor extends Visitor
    {
        #registry;

        #logger = DEFAULT_LOGGER;

        constructor( pRegistry, pLogger )
        {
            super( visit, { registry: pRegistry } );

            this.#registry = pRegistry ?? TOOLBOCKS_REGISTRY;

            this.#logger = ToolBocksModule.resolveLogger( pLogger,
                                                          this.#registry?.logger,
                                                          ToolBocksModule.getGlobalLogger(),
                                                          DEFAULT_LOGGER );

            this.#logger = SourcedSimpleLogger.adapt( this.#logger, this );

            // bind the functions defined in the module closure as methods of this visitor
            this.isPackageJson = isPackageJson.bind( this );
            this.getPackageObject = getPackageObject.bind( this );
            this.registerPublishedComponent = registerPublishedComponent.bind( this );
            this.registerComponents = registerComponents.bind( this );
        }

        get registry()
        {
            return this.#registry ?? TOOLBOCKS_REGISTRY;
        }

        get logger()
        {
            const logr = ToolBocksModule.resolveLogger( this.#logger,
                                                        this.#registry?.logger,
                                                        ToolBocksModule.getGlobalLogger(),
                                                        DEFAULT_LOGGER );

            if ( isNonNullObject( logr ) && logr instanceof SourcedSimpleLogger )
            {
                return logr;
            }

            this.#logger = SourcedSimpleLogger.adapt( logr, this );

            return this.#logger;
        }
    }

    /**
     * This subclass of DependencyRegistry
     * is specifically designed to register components
     * declared in package.json files
     * according to a specific convention.
     *
     * The convention is to include an array of objects under the property name, "_publishes".
     * Each object in the array itself contains another object
     * under a property name corresponding to an
     * established DependencyConstant.
     *
     * THAT object defines the properties
     * used to construct a PublishedComponent.
     *
     * Components can be retrieved by passing a DependencyDescriptor.
     */
    class ToolBocksRegistry extends DependencyRegistry
    {
        /**
         * The topmost directory from which this registry will scan for package.json files
         */
        #rootFolder = defaultRootDirectory || currentDirectory;

        /**
         * Constructs an instance of the Master Registry.
         *
         * @param {string} [pRoot=calculateDefaultRootDirectory()] - The root directory from which the Master Registry will start scanning for published components.
         *                                                           If not provided, the default root directory will be calculated.
         *                                                           The calculated root directory is assumed to correspond to the parent directory of the packages folder.
         *
         * @param {Object} [pLogger=DEFAULT_LOGGER] - The logger instance to be used for logging operations.
         *                                            If not provided, the default logger will be used.
         *
         * @return {ToolBocksRegistry} An instance of the Master Registry.
         */
        constructor( pRoot = calculateDefaultRootDirectory(), pLogger = DEFAULT_LOGGER )
        {
            super( ToolBocksModule.resolveLogger( pLogger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER ) );

            this.#rootFolder = resolvePath( pRoot || calculateDefaultRootDirectory() );

            attemptSilent( () => (this.logger ?? DEFAULT_LOGGER ?? console).debug( `Master Registry constructed with root folder,`, this.#rootFolder ) );
        }

        get rootFolder()
        {
            return this.#rootFolder;
        }

        /**
         * Returns an initialized instance of the described service, if possible.
         *
         * Depending on the descriptor, options, and additional arguments,
         * the returned service may be a new instance
         * or an existing instance that has been previously constructed, initialized, and cached.
         *
         * If the service is expected to hold state
         * or to have properties that control its behavior
         * or the behavior of components it may use,
         * it is recommended to include the 'requiresNewInstance' property in the descriptor.
         *
         * @param {DependencyDescriptor|DependencyConstant|String} pDescriptor - the DependencyDescriptor (or DependencyConstant or string that can be used as a key to find a DependencyConstant)
         *                                                                       that describes what kind of component to return
         *
         * @param {DependencyDescriptorOptions|Object} pOptions - an object with one or more properties to pass to the service constructor
         *
         * @param {...*} pArgs - zero or more values to pass to the service constructor
         *
         * @returns {Promise<Object|Function>} An initialized instance of the described service
         *                                     or a class representing the described service
         *                                     that the caller intends to instantiate
         */
        async getService( pDescriptor, pOptions, ...pArgs )
        {
            return super.getComponent( pDescriptor, pOptions, ...pArgs );
        }

        /**
         * Returns an initialized instance of the described data source, if possible.
         *
         * Depending on the descriptor, options, and additional arguments,
         * the returned data source may be a new instance
         * or an existing instance that has been previously constructed, initialized, and cached.
         *
         * If the data source is expected to hold state
         * or to have properties that control its behavior
         * or the behavior of components it may use,
         * it is recommended to include the 'requiresNewInstance' property in the descriptor.
         *
         * @param {DependencyDescriptor|DependencyConstant|String} pDescriptor - the DependencyDescriptor (or DependencyConstant or string that can be used as a key to find a DependencyConstant)
         *                                                                       that describes what kind of component to return
         *
         * @param {DependencyDescriptorOptions|Object} pOptions - an object with one or more properties to pass to the data source constructor
         *
         * @param {...*} pArgs - zero or more values to pass to the data source constructor
         *
         * @returns {Promise<Object|Function>} An initialized instance of the described data source
         *                                     or a class representing the described data source
         *                                     that the caller intends to instantiate
         */
        async getDataSource( pDescriptor, pOptions, ...pArgs )
        {
            return super.getComponent( pDescriptor, pOptions, ...pArgs );
        }

        /**
         * @inheritDoc
         */
        async getComponent( pDescriptor, pOptions, ...pArgs )
        {
            return super.getComponent( pDescriptor, pOptions, ...pArgs );
        }

        /**
         * Performs a breadth-first iteration of the root directory and its subdirectories.
         * During the iteration, directories and files that match the defined filters
         * are passed to an invocation of the PackageVisitor visit method.
         *
         * The PackageVisitor extracts data related to published components
         * for package.json files and registers the associated value.
         *
         * @param {String} pFromDirectory - the topmost directory from which to begin searching for package.json files
         *
         * @param {ILogger} [pLogger=DEFAULT_LOGGER] - the logger to use for recording operations
         *
         * @returns {Promise<DependencyRegistry|ToolBocksRegistry>} - returns this instance
         */
        async #scanDirectories( pFromDirectory, pLogger )
        {
            const root = resolvePath( pFromDirectory || this.#rootFolder || calculateDefaultRootDirectory() );

            const directoryFilter = ( entry ) => isFunction( entry?.isDirectory ) && entry.isDirectory() && !["__tests__", "node_modules", ".venv"].includes( lcase( entry.name ) );

            const fileFilter = ( entry ) => ("package.json" === getFileName( entry.filepath || entry ));

            const logr = ToolBocksModule.resolveLogger( pLogger, this.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

            attemptSilent( () => logr.info( `Scanning directories and subdirectories from start folder, ${root}` ) );

            await findFiles( root, new PackageVisitor( this, logr ), fileFilter, directoryFilter, true );

            return this;
        }

        /**
         * Initializes this instance of the registry
         * by scanning directories for package.json files
         * that declare one or more published components.
         *
         * @param {...*} pArgs - zero or more arguments to override the starting directory and/or logger to use.
         *
         * @returns {Promise<DependencyRegistry|ToolBocksRegistry>}
         *                                        this instance,
         *                                        now initialized and populated with the _definitions_
         *                                        of one or more PublishedComponents
         */
        async init( ...pArgs )
        {
            if ( this.initialized )
            {
                return this;
            }

            const args = asArray( pArgs ?? [this.rootFolder, this.logger] ).concat( this.rootFolder ).concat( this.logger );

            const root = resolvePath( args[0] || this.rootFolder || calculateDefaultRootDirectory() );

            const logr = ToolBocksModule.resolveLogger( args[1], this.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

            attemptSilent( () => logr.info( `Initializing ${getClassName( this )}` ) );

            await this.#scanDirectories( root, logr );

            if ( this.numRegisteredComponents > 0 )
            {
                await super.init( ...args );
                attemptSilent( () => logr.info( `${getClassName( this )} initialized with ${this.size} components` ) );
            }
            else
            {
                attemptSilent( () => logr.warn( `${getClassName( this )} has no registered components` ) );
            }

            return this;
        }

        /**
         * Scans for and registered components added to package.json files since this instance was initialized.
         * Note that this method does not remove existing registrations, so if the same directories are scanned,
         * some components will likely be registered more than once.
         *
         * Call #reset instead if this is undesirable.
         *
         * @param {...*} pArgs - zero or more arguments to override the starting directory and/or logger to use.
         *
         * @returns {Promise<ToolBocksRegistry|DependencyRegistry>} this instance with any newly found components registered
         */
        async rescan( ...pArgs )
        {
            const args = asArray( pArgs ?? [this.rootFolder, this.logger] ).concat( this.rootFolder ).concat( this.logger );

            const root = resolvePath( args[0] || this.rootFolder || calculateDefaultRootDirectory() );

            const logr = ToolBocksModule.resolveLogger( args[1], this.logger, ToolBocksModule.getGlobalLogger(), DEFAULT_LOGGER );

            attemptSilent( () => logr.info( `Rescanning ${root} for components...` ) );

            await this.#scanDirectories( root, logr );

            return this;
        }

        /**
         * Disposes all cached and registered components and re-initializes this instance.
         *
         * @param {...*} pArgs - zero or more arguments to override the starting directory and/or logger to use.
         *
         * @returns {Promise<DependencyRegistry|ToolBocksRegistry>}
         */
        async reset( ...pArgs )
        {
            await this.disposeAll();

            return await this.init( ...pArgs );
        }
    }

    /**
     * THE default registry to use with Bryson applications.
     *
     * @type {ToolBocksRegistry}
     */
    const TOOLBOCKS_REGISTRY = attempt( () => $scope()[GLOBAL_KEY] ) ?? new ToolBocksRegistry( defaultRootDirectory, /* GLOBAL_LOGGER */ );

    /**
     * Returns the initialized instance of the Master Registry
     * to use for getting/constructing dependencies.
     *
     * @param {String} [pRootFolder=calculateDefaultRootDirectory()] - the path to the topmost folder
     *                                                                 from which to scan for package.json files
     *                                                                 that declare published components
     *
     * @param {ILogger} [pLogger=DEFAULT_LOGGER] - the logger to use to record operations or capture errors for troubleshooting/forensics
     *
     * @returns {Promise<DependencyRegistry|ToolBocksRegistry>} The initialized instance of the Master Registry
     */
    const getDefaultRegistry = async function( pRootFolder = calculateDefaultRootDirectory(), pLogger )
    {
        if ( !TOOLBOCKS_REGISTRY.initialized )
        {
            return await TOOLBOCKS_REGISTRY.init( (pRootFolder || calculateDefaultRootDirectory()),
                                                  ToolBocksModule.resolveLogger( pLogger,
                                                                                 TOOLBOCKS_REGISTRY.logger,
                                                                                 ToolBocksModule.getGlobalLogger(),
                                                                                 DEFAULT_LOGGER ) );
        }

        attempt( () => $scope()[GLOBAL_KEY] = $scope()[GLOBAL_KEY] ?? TOOLBOCKS_REGISTRY );

        return TOOLBOCKS_REGISTRY;
    };

    const mod =
        {
            classes:
                {
                    ToolBocksRegistry
                },
            ToolBocksRegistry,
            getDefaultRegistry,
            resolveDependencies: async function( pDependencyDescriptors )
            {
                const registry = await getDefaultRegistry();
                return registry.resolveDependencies( pDependencyDescriptors );
            },
            getComponent: async function( pDescriptor, pOptions, ...pArgs )
            {
                const registry = await getDefaultRegistry();
                return registry.getComponent( pDescriptor, pOptions, ...pArgs );
            },
            getService: async function( pDescriptor, pOptions, ...pArgs )
            {
                const registry = await getDefaultRegistry();
                return registry.getService( pDescriptor, pOptions, ...pArgs );
            },
            getDataSource: async function( pDescriptor, pOptions, ...pArgs )
            {
                const registry = await getDefaultRegistry();
                return registry.getDataSource( pDescriptor, pOptions, ...pArgs );
            },
            getLogger: async function( pDescriptor, pOptions, ...pArgs )
            {
                const registry = await getDefaultRegistry();
                return ToolBocksModule.resolveLogger( await registry.getComponent( pDescriptor, pOptions, ...pArgs ),
                                                      ToolBocksModule.getGlobalLogger(),
                                                      DEFAULT_LOGGER );
            }
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    attempt( () => $scope()[GLOBAL_MODULE_KEY] = lock( mod ) );

    return lock( mod );

}());
