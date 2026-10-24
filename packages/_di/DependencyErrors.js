(function exposeModule()
{
    /**
     * Import the core ToolBocks classes and functions.
     * These are general-purpose constants and utilities
     * for inspecting types, manipulating strings, arrays, and objects.
     *
     * Additionally, the core library provides internationalization/localization (i18n, l10n),
     * number parsing, and an event-based error-handling mechanism.
     *
     * For source code and documentation, navigate to:
     * https://github.com/bockelman-scott/bocktils/tree/master/packages/core
     *
     */
    const core = require( "@toolbocks/core" );

    // destructure the individual utilities module from the imported ToolBocks core library
    const { moduleUtils, constants } = core;

    // destructure the specific classes, constants, and functions used by this module
    // from the moduleUtils utility module
    const { __Error, lock } = moduleUtils;

    // destructure the constants used in this module
    const { _ud = "undefined" } = constants;

    /**
     * This is the superclass for errors related to registry operations.
     */
    class RegistryError extends __Error
    {
        constructor( pMsgOrErr, pOptions = {}, ...pArgs )
        {
            super( pMsgOrErr, pOptions, ...pArgs );
        }
    }

    /**
     * This is the type of error thrown when a request for a dependency cannot be fulfilled.
     */
    class DependencyNotFoundError extends RegistryError
    {
        constructor( pMsgOrErr, pOptions = {}, ...pArgs )
        {
            super( pMsgOrErr, pOptions, ...pArgs );
        }
    }

    /**
     * This is the type of error thrown when a dependency cannot be initialized
     * or throws an error during initialization.
     */
    class DependencyInitializationError extends RegistryError
    {
        constructor( pMsgOrErr, pOptions = {}, ...pArgs )
        {
            super( pMsgOrErr, pOptions, ...pArgs );
        }
    }

    /**
     * This the type of error thrown then a component cannot be properly disposed
     * or throws and error while being disposed.
     */
    class DependencyDisposalError extends RegistryError
    {
        constructor( pMsgOrErr, pOptions = {}, ...pArgs )
        {
            super( pMsgOrErr, pOptions, ...pArgs );
        }
    }


    /**
     * These are the exit codes expected from a Node.js script or worker.
     * These are used in the process event handlers that protect the entire runtime from crashing
     * when one rogue script or worker fails catastrophically.
     */
    const EXIT_CODES =
        lock( {
                  NORMAL_SHUTDOWN: 0,
                  UNCAUGHT_EXCEPTION: 1,
                  UNHANDLED_REJECTION: 2,
                  SIGINT: 130,
                  SIGTERM: 143
              } );

    const mod =
        lock( {
                  EXIT_CODES,
                  RegistryError,
                  DependencyNotFoundError,
                  DependencyInitializationError,
                  DependencyDisposalError,
              } );

    if ( _ud !== typeof module )
    {
        module.exports = mod;
    }

    return mod;

}());
