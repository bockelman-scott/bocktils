(function exposeModule()
{
    const dependencyConstants = require( "./DependencyConstant.js" );
    const dependencyErrors = require( "./DependencyErrors.js" );
    const dependencyFunctions = require( "./DependencyFunctions.js" );
    const dependencyModule = require( "./Dependency.js" );
    const dependencyDescriptor = require( "./DependencyDescriptor.js" );
    const dependentObject = require( "./DependentObject.js" );
    const publishedComponent = require( "./PublishedComponent.js" );
    const dependencyRegistry = require( "./DependencyRegistry.js" );

    const
        {
            DEP_CONSTS,
            DEP_CONSTS_BY_ID,
            DependencyConstant
        } = dependencyConstants;

    const
        {
            RegistryError,
            DependencyNotFoundError,
            DependencyInitializationError,
            DependencyDisposalError,
        } = dependencyErrors;

    const
        {
            DEPENDENCY_METHODS,
            DEPENDENCY_EVENTS,
        } = dependencyFunctions;

    const { Dependency } = dependencyModule;

    const
        {
            DependencyDescriptorOptions,
            DependencyDescriptor
        } = dependencyDescriptor;

    const
        {
            Dependencies,
            DependentObject
        } = dependentObject;

    const { DEPENDENCY_TYPE, PublishedComponent } = publishedComponent;

    const { DependencyRegistry } = dependencyRegistry;

    const mod =
        Object.freeze( {
                           DEP_CONSTS,
                           DEP_CONSTS_BY_ID,
                           DEPENDENCY_METHODS,
                           DEPENDENCY_EVENTS,
                           DEPENDENCY_TYPE,

                           "bryson_apps$dep":
                               {
                                   MODULES:
                                       {
                                           dependencyConstants,
                                           dependencyErrors,
                                           dependencyFunctions,
                                           dependencyModule,
                                           dependencyDescriptor,
                                           dependentObject,
                                           dependencyInfo: publishedComponent,
                                           dependencyRegistry
                                       },
                                   classes:
                                       {
                                           DependencyConstant,
                                           DependencyDescriptorOptions,
                                           DependencyDescriptor,
                                           Dependencies,
                                           Dependency,
                                           DependentObject,
                                           PublishedComponent,
                                           DependencyRegistry
                                       },
                                   verbose:
                                       {
                                           ...dependencyConstants,
                                           ...dependencyErrors,
                                           ...dependencyFunctions,
                                           ...dependencyModule,
                                           ...dependencyDescriptor,
                                           ...dependentObject,
                                           ...publishedComponent,
                                           ...dependencyRegistry
                                       }
                               },

                           DependencyConstant,
                           RegistryError,
                           DependencyNotFoundError,
                           DependencyInitializationError,
                           DependencyDisposalError,
                           DependencyDescriptorOptions,
                           DependencyDescriptor,
                           Dependencies,
                           Dependency,
                           DependentObject,
                           PublishedComponent,
                           DependencyRegistry

                       } );


    if ( "undefined" !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());
