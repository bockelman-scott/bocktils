(function exposeModule()
{
    const express = require('express');

    const fs = require('fs');

    const http = require('http');
    const https = require('https');

    const toolbocks = require( "@toolbocks/core" );

    const depInjection = require( "@toolbocks/dep-injection" );

    const jsonUtils = require( "@toolbocks/json" );

    const logUtils = require( "@toolbocks/logging" );

    const { ServerConfiguration } = require( "./ServerConfiguration.js" );

    const { moduleUtils, constants, typeUtils, stringUtils } = toolbocks;

    const
        {
            ToolBocksModule,
            IllegalStateError,
            IllegalArgumentError,
            $ln,
            attempt,
            attemptSilent,
            lock,
            functionToString,
            resolveError
        } = moduleUtils;

    const { _ud, _mt } = constants;

    const { isNull, isNonNullObject, isFunction, isError, getClassName } = typeUtils;

    const { asString, _lct } = stringUtils;

    const { DependentObject, Dependencies } = depInjection;

    const { asObject } = jsonUtils;

    const { SimpleLogger, SourcedSimpleLogger } = logUtils;

    const SIMPLE_LOGGER = new SimpleLogger( ToolBocksModule.getGlobalLogger(), console );

    const DEFAULT_LOGGER = SourcedSimpleLogger.adapt( SIMPLE_LOGGER, "ServerFactory" );

    class ServerFactory extends DependentObject
    {

        constructor( pDependencies, pOptions, ...pArgs )
        {
            super( pDependencies, pOptions, ...pArgs );
        }

        createServer( pServerConfiguration )
        {

        }
    }


    class Server
    {
        #httpServer;
        #appServer;

        #configuration;

        async start()
        {

        }

        async stop()
        {

        }


    }

}());
