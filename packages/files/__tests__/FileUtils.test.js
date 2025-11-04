const path = require( "path" );

const core = require( "@toolbocks/core" );

const fileUtils = require( "../src/index.js" );

const { moduleUtils, constants, typeUtils, stringUtils, arrayUtils } = core;

const { Visitor } = moduleUtils;

const { isFunction } = typeUtils;

const { asArray, unique } = arrayUtils;

const {
    exists,
    asyncExists,
    makeDirectory,
    asyncMakeDirectory,
    removeDirectory,
    asyncRemoveDirectory,
    asyncCreateTempFile,
    createTextFile,
    asyncCreateTextFile,
    deleteFile,
    asyncDeleteFile,
    deleteMatchingFiles,
    asyncDeleteMatchingFiles,
    getFileEntry,
    asyncGetFileEntry,
    link,
    asyncLink,
    isFile,
    isDirectory,
    isSymbolicLink,
    resolvePath,
    extractPathSeparator,
    removeExtension,
    replaceExtension,
    getTempDirectory,
    generateTempFileName,
    createTempFile,
    findFiles,
    FileStats,
    FileObject
} = fileUtils;

const currentDirectory = path.dirname( __filename );

const projectRootDirectory = path.resolve( currentDirectory, "../../../" );

const packagesDirectory = path.resolve( projectRootDirectory, "packages" );

const tempDirectory = getTempDirectory();

const PACKAGES =
    [
        "package.json",
        "base64\\package.json",
        "buffer\\package.json",
        "common\\package.json",
        "compression\\package.json",
        "core\\package.json",
        "database\\package.json",
        "dates\\package.json",
        "events\\package.json",
        "files\\package.json",
        "functors\\package.json",
        "http\\package.json",
        "json\\package.json",
        "logging\\package.json",
        "math\\package.json",
        "performance\\package.json",
        "regex\\package.json",
        "secrets\\package.json",
        "loggers\\FileLogger\\package.json"
    ];

describe( "FileUtils", () =>
{
    test( "FileUtils can determine if a file exists", () =>
    {
        expect( exists( __filename ) ).toBe( true );
        expect( exists( "~~~" ) ).toBe( false );
    } );

    test( "FileUtils can asynchronously determine if a file exists", async() =>
    {
        expect( await asyncExists( __filename ) ).toBe( true );
        expect( await asyncExists( "~~~" ) ).toBe( false );
    } );

    test( "FileUtils can determine if a directory exists", () =>
    {
        expect( exists( __dirname ) ).toBe( true );
        expect( exists( "~~~/!!!" ) ).toBe( false );
    } );

    test( "FileUtils can asynchronously determine if a directory exists", async() =>
    {
        expect( await asyncExists( __dirname ) ).toBe( true );
        expect( await asyncExists( "~~~/!!!" ) ).toBe( false );
    } );

    test( "FileUtils can create a new directory", () =>
    {
        makeDirectory( path.join( __dirname, "test-dir" ) );

        expect( exists( path.join( __dirname, "test-dir" ) ) ).toBe( true );
    } );

    test( "FileUtils can asynchronously create a new directory", async() =>
    {
        await asyncMakeDirectory( path.join( __dirname, "async-test-dir" ) );

        expect( await asyncExists( path.join( __dirname, "async-test-dir" ) ) ).toBe( true );
    } );

    test( "FileUtils can remove a directory", () =>
    {
        removeDirectory( path.join( __dirname, "test-dir" ) );

        expect( exists( path.join( __dirname, "test-dir" ) ) ).toBe( false );
    } );

    test( "FileUtils can asynchronously remove a directory", async() =>
    {
        await asyncRemoveDirectory( path.join( __dirname, "async-test-dir" ) );

        expect( await asyncExists( path.join( __dirname, "async-test-dir" ) ) ).toBe( false );
    } );

    test( "FileUtils can create a temp file", () =>
    {
        const tempFile = createTempFile();

        expect( exists( path.join( tempDirectory, tempFile.name ) ) ).toBe( true );

        deleteFile( path.join( tempDirectory, tempFile.name ) );

        expect( exists( path.join( tempDirectory, tempFile.name ) ) ).toBe( false );
    } );

    test( "FileUtils can asynchronously create a temp file", async() =>
    {
        const tempFile = await asyncCreateTempFile();

        expect( exists( path.join( tempDirectory, tempFile.name ) ) ).toBe( true );

        await asyncDeleteFile( path.join( tempDirectory, tempFile.name ) );

        expect( exists( path.join( tempDirectory, tempFile.name ) ) ).toBe( false );
    } );

    test( "FileUtils can create a new file", () =>
    {
        makeDirectory( path.join( __dirname, "test-dir" ) );

        createTextFile( path.join( __dirname, "test-dir", "test-file.txt" ) );

        expect( exists( path.join( __dirname, "test-dir", "test-file.txt" ) ) ).toBe( true );

        removeDirectory( path.join( __dirname, "test-dir" ) );

        expect( exists( path.join( __dirname, "test-dir", "test-file.txt" ) ) ).toBe( false );
    } );

    test( "FileUtils can asynchronously create a new file", async() =>
    {
        await asyncMakeDirectory( path.join( __dirname, "async-test-dir" ) );

        await asyncCreateTextFile( path.join( __dirname, "async-test-dir", "async-test-file.txt" ) );

        expect( await asyncExists( path.join( __dirname, "async-test-dir" ) ) ).toBe( true );

        expect( await asyncExists( path.join( __dirname, "async-test-dir", "async-test-file.txt" ) ) ).toBe( true );

        removeDirectory( path.join( __dirname, "async-test-dir" ) );

        expect( await asyncExists( path.join( __dirname, "async-test-dir", "async-test-file.txt" ) ) ).toBe( false );
    } );

    test( "FileUtils can asynchronously clean up the temp directory", async() =>
    {
        for( let i = 0; i < 10; i++ )
        {
            const tempFile = await asyncCreateTempFile();

            expect( exists( path.join( tempDirectory, tempFile.name ) ) ).toBe( true );
        }

        const filter = ( name ) => /^temp_[\d_-]+\.tmp$/.test( name );

        await asyncDeleteMatchingFiles( tempDirectory, filter );

        // expect( findFiles( tempDirectory, null, filter ).length ).toBe( 0 );
    } );
} );

class TestVisitor extends Visitor
{
    constructor( pOptions )
    {
        super( pOptions );
    }

    visit( pEntry )
    {
        console.log( pEntry.filepath );
    }
}

describe( "FileUtils::findFiles", () =>
{
    test( "'findFiles' can perform breadth-first searches", async() =>
    {
        const directoryFilter = ( entry ) => (null !== entry) && (entry?.name || entry) !== "__tests__";

        const fileFilter = ( entry ) => (null !== entry) && path.basename( resolvePath( entry?.filepath || entry ) ) === "package.json";

        const found = await findFiles( packagesDirectory, null, fileFilter, directoryFilter, true );

        let mapped = (found.map( ( entry ) => entry.filepath ));

        expect( mapped.length ).toBe( 23 );

        mapped = mapped.map( ( entry ) => path.relative( packagesDirectory, entry ) );

        expect( mapped ).toEqual( PACKAGES );
    } );

    test( "'findFiles' can take a Visitor", async() =>
    {
        const directoryFilter = ( entry ) => isFunction( entry?.isDirectory ) && entry.isDirectory() && entry.name !== "__tests__";

        const fileFilter = ( entry ) => path.basename( entry.filepath || entry ) === "package.json";

        const found = await findFiles( packagesDirectory, new TestVisitor(), fileFilter, directoryFilter, true );

        let mapped = (found.map( ( entry ) => entry.filepath ));

        expect( mapped.length ).toBe( 23 );

        mapped = mapped.map( ( entry ) => path.relative( packagesDirectory, entry ) );

        expect( mapped ).toEqual( PACKAGES );
    } );

    test( "'find' can perform depth-first searches", async() =>
    {
        const directoryFilter = ( entry ) => isFunction( entry?.isDirectory ) && entry.isDirectory() && entry.name !== "__tests__";

        const fileFilter = ( entry ) => path.basename( entry.filepath || entry ) === "package.json";

        const found = await findFiles( packagesDirectory, null, fileFilter, directoryFilter, false );

        let mapped = (found.map( ( entry ) => entry.filepath ));

        expect( mapped.length ).toBe( 23 );

        mapped = mapped.map( ( entry ) => path.relative( packagesDirectory, entry ) );

        expect( mapped ).toEqual( [
                                      "base64\\package.json",
                                      "buffer\\package.json",
                                      "common\\package.json",
                                      "compression\\package.json",
                                      "core\\package.json",
                                      "database\\package.json",
                                      "dates\\package.json",
                                      "events\\package.json",
                                      "files\\package.json",
                                      "functors\\package.json",
                                      "http\\package.json",
                                      "json\\package.json",
                                      "loggers\\FileLogger\\package.json",
                                      "logging\\package.json",
                                      "math\\package.json",
                                      "package.json",
                                      "performance\\package.json",
                                      "regex\\package.json",
                                      "secrets\\package.json",
                                  ] );
    } );
} );
