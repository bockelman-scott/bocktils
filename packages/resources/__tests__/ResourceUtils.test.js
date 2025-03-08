/** import the utilities to test **/

const resourceUtils = require( "../src/ResourceUtils.cjs" );

const {
    DEFAULT_LOCALE,
    DEFAULT_LOCALE_STRING,
    DEFAULT_LOADER_OPTIONS,
    DEFAULT_PROPERTIES_OPTIONS,
    DEFAULT_RESOURCE_CACHE_OPTIONS,
    MESSAGES_LOCALE,
    resolveLocale,
    getMessagesLocale,
    LocaleResourcesBase,
    Properties,
    Resource,
    ResourceKey,
    ResourceLoader,
    ResourceFamily,
    ResourceCache,
    executionEnvironment,
    rxFileHeader,
    extractFileHeader,
    isValidPropertyKey,
    isValidPropertyFileEntry,
    isValidPropertiesContent,
    isValidResourceValue,
    isValidResourceKey
} = resourceUtils;


describe( "DEFAULTS", () =>
{
    test( "DEFAULT_LOCALE is en-US",
          () =>
          {
              expect( DEFAULT_LOCALE ).toEqual( new Intl.Locale( "en-US" ) );
          } );

    test( "DEFAULT_LOCALE_STRING is 'en-US'",
          () =>
          {
              expect( DEFAULT_LOCALE_STRING ).toEqual( "en-US" );
          } );

    test( "DEFAULT_LOADER_OPTIONS",
          () =>
          {
              expect( DEFAULT_LOADER_OPTIONS ).toEqual( {
                                                            includeLocaleRegions: true,
                                                            includeLocaleScript: false,
                                                            includeLocaleVariants: false,
                                                            extension: ".properties",
                                                            separator: "-",
                                                        } );
          } );

    test( "DEFAULT_PROPERTIES_OPTIONS",
          () =>
          {
              expect( DEFAULT_PROPERTIES_OPTIONS ).toEqual( {
                                                                assignment: "=",
                                                                trim: true,
                                                                name: null,
                                                                locale: null
                                                            } );
          } );

    test( "DEFAULT_RESOURCE_CACHE_OPTIONS is 'en-US'",
          () =>
          {
              expect( DEFAULT_RESOURCE_CACHE_OPTIONS ).toEqual( {
                                                                    resourceLoader: new ResourceLoader( DEFAULT_LOADER_OPTIONS ),
                                                                    paths: null,
                                                                    locales: null,
                                                                    loadOnCreate: false,
                                                                } );
          } );

    test( "MESSAGES_LOCALE is...",
          () =>
          {
              expect( MESSAGES_LOCALE ).toEqual( getMessagesLocale() );
          } );
} );

describe( "Properties", () =>
{
    test( "Properties construction",
          () =>
          {
              let properties = new Properties();

              expect( properties.size ).toEqual( 0 );

              // when constructed without arguments, name defaults to "Properties"
              // toString() prepends the 'header' which includes the name in brackets and a newline
              expect( properties.toString() ).toEqual( "[Properties]\n" );


              properties = new Properties( "messages_en_US", DEFAULT_LOCALE );
              expect( properties.toString() ).toEqual( "[messages_en_US]\n" );
              expect( properties.name ).toEqual( "messages_en_US" );
              expect( properties.locale ).toEqual( DEFAULT_LOCALE );
              expect( properties.family ).toEqual( "messages" );

              properties = new Properties( "error_messages_en_US", DEFAULT_LOCALE );
              expect( properties.toString() ).toEqual( "[error_messages_en_US]\n" );
              expect( properties.name ).toEqual( "error_messages_en_US" );
              expect( properties.locale ).toEqual( DEFAULT_LOCALE );
              expect( properties.family ).toEqual( "error_messages" );


              let defaultProperties = new Properties( "defaults", DEFAULT_LOCALE );
              defaultProperties.set( "hello", "world" );
              defaultProperties.set( "hi", "there" );
              defaultProperties.set( "bye", "now" );

              expect( defaultProperties.toString() ).toEqual( "[defaults]\nhello=world\nhi=there\nbye=now\n" );

              properties = new Properties( "messages_en_US", DEFAULT_LOCALE, defaultProperties );

              // properties uses the specified defaults
              expect( properties.defaults ).toBe( defaultProperties );

              properties.set( "hello", "there" );
              // toString() returns only the instance's OWN properties

              expect( properties.toString() ).toEqual( "[messages_en_US]\nhello=there\n" );
              // get returns this instance value (overriding the default)

              expect( properties.get( "hello" ) ).toEqual( "there" );

              expect( properties.get( "hi" ) ).toEqual( "there" );
              // get returns the default properties' value if this instance doesn't define/re-define the property

              expect( properties.get( "bye" ) ).toEqual( "now" );
          } );

    test( "Properties iteration",
          () =>
          {
              let defaultProperties = new Properties( "defaults", DEFAULT_LOCALE );
              defaultProperties.set( "a", "1" );
              defaultProperties.set( "b", "2" );
              defaultProperties.set( "c", "3" );

              let properties = new Properties( "messages_en_US", DEFAULT_LOCALE, defaultProperties );
              properties.set( "d", "4" );
              properties.set( "e", "5" );
              properties.set( "f", "6" );

              let count = 0;
              for( let entry of properties )
              {
                  count += 1;
              }

              // iteration includes properties defined in the defaults
              expect( count ).toEqual( 6 );


              properties.set( "a", "7" );

              count = 0;
              for( let entry of properties )
              {
                  count += 1;
              }

              // iteration includes the UNIQUE properties defined in the defaults
              expect( count ).toEqual( 6 );

              const comparator = ( a, b ) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
              expect( [...properties.entries()].sort( comparator ) ).toEqual( [
                                                                                  ["a", "7"],
                                                                                  ["b", "2"],
                                                                                  ["c", "3"],
                                                                                  ["d", "4"],
                                                                                  ["e", "5"],
                                                                                  ["f", "6"],
                                                                              ] );
          } );

    test( "Properties keys, values, and size",
          () =>
          {
              let defaultProperties = new Properties( "defaults", DEFAULT_LOCALE );
              defaultProperties.set( "a", "1" );
              defaultProperties.set( "b", "2" );
              defaultProperties.set( "c", "3" );

              let properties = new Properties( "messages_en_US", DEFAULT_LOCALE, defaultProperties );
              properties.set( "d", "4" );
              properties.set( "e", "5" );
              properties.set( "f", "6" );

              expect( properties.keys() ).toEqual( ["d", "e", "f", "a", "b", "c"] );
              expect( properties.values() ).toEqual( ["4", "5", "6", "1", "2", "3"] );
              expect( properties.size ).toEqual( 6 );
          } );


    test( "Properties load - from String",
          () =>
          {
              let properties = new Properties();

              let source =`test.key.1=valor de ensayo uno
test.key.2=valor de ensayo dos
test.key.3=valor de ensayo tres
test.key.5=valor de ensayo cinco`;

              properties.load( source );

              expect( properties.size ).toEqual( 4 );

              source =`test.key.4=valor de ensayo quatro`;

              properties.load( source );

              expect( properties.size ).toEqual( 5 );

              expect( properties.get( "test.key.1" ) ).toEqual( "valor de ensayo uno" );
              expect( properties.get( "test.key.2" ) ).toEqual( "valor de ensayo dos" );
              expect( properties.get( "test.key.3" ) ).toEqual( "valor de ensayo tres" );
              expect( properties.get( "test.key.4" ) ).toEqual( "valor de ensayo quatro" );
              expect( properties.get( "test.key.5" ) ).toEqual( "valor de ensayo cinco" );
          } );

    test( "Properties load - from File",
          async () =>
          {
              let properties = await Properties.fromFile( "../packages/resources/messages/messages.properties" );

              console.log( properties.toString() );
          } );
});

describe( "ResourceKey", () =>
{
    test( "ResourceKey is a class that encapsulates a resource key",
          () =>
          {
              const resourceKey = new ResourceKey( "words", "hello", "world" );

              expect( resourceKey.toString() ).toEqual( "words.hello.world" );

              const resourceKey2 = new ResourceKey( resourceKey );

              expect( resourceKey2.toString() ).toEqual( "words.hello.world" );

              const resourceKey3 = new ResourceKey( resourceKey2, resourceKey );

              expect( resourceKey3.toString() ).toEqual( "words.hello.world.words.hello.world" );
          } );
} );

describe( "Resource", () =>
{
    test( "Resource  is a class that encapsulates a key=value pair",
          () =>
          {
              const key = new ResourceKey( "a", "b", "c" );


              const resource = new Resource( key, "defaultValue" );

              expect( resource.toString() ).toEqual( "a.b.c=defaultValue" );

              expect( "" + resource ).toEqual( "defaultValue" );


              const resource2 = new Resource( key, 7 );

              expect( resource2.toString() ).toEqual( "a.b.c=7" );

              expect( "" + resource2 ).toEqual( "7" );


              const resource3 = Resource.from( resource );

              expect( resource3.toString() ).toEqual( "a.b.c=defaultValue" );

              expect( "" + resource3 ).toEqual( "defaultValue" );


              const resource4 = Resource.from( resource2 );

              expect( resource4.toString() ).toEqual( "a.b.c=7" );

              expect( "" + resource4 ).toEqual( "7" );


              const resource5 = Resource.from( ["kee", "val", "def", "something"] );

              expect( resource5.toString() ).toEqual( "kee=val" );

              expect( "" + resource5 ).toEqual( "val" );

          } );
} );
