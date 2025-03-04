const path = require( "path" );

const core = require( "@toolbocks/core" );

const fileLogger = require( "../src/index.js" );

const { moduleUtils, arrayUtils } = core;

const { ExecutionMode } = moduleUtils;

const { asArray } = arrayUtils;

const { FileLogger } = fileLogger;

class EventMaker extends EventTarget
{
    constructor()
    {
        super();
    }
}

const eventMaker = new EventMaker();

const currentDirectory = path.dirname( __filename );

const projectRootDirectory = path.resolve( currentDirectory, "../../../../" );

const logDir = path.resolve( projectRootDirectory, "logs" );


describe( "FileLogger is an Event Handler", () =>
{
    jest.useFakeTimers();

    let logger = new FileLogger( { directory: logDir }, { mode: ExecutionMode.TEST } );

    let eventDispatched = null;

    test( "handleEvent", async() =>
    {
        eventMaker.addEventListener( "error", logger );

        eventMaker.addEventListener( "custom", logger );

        let customEvent = new CustomEvent( "custom", { message: "This is a custom event" } );

        eventMaker.dispatchEvent( customEvent );


        customEvent = new CustomEvent( "error", { error: new Error( "This is an error event" ) } );

        eventMaker.dispatchEvent( customEvent );

        eventDispatched = customEvent;

        expect( asArray( logger.eventsHandled ).length ).toEqual( 2 );
    } );

    jest.clearAllTimers();
} );
