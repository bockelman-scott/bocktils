/** import the utilities to test **/

const resourceUtils = require( "../src/ResourceUtils.cjs" );

const {
    resolveLocale,
    DEFAULT_LOCALE,
    DEFAULT_LOCALE_STRING,
    MESSAGES_LOCALE,
    getMessagesLocale,
    classes
} = resourceUtils;

const {
    Properties,
    ResourceKey,
    Resource,
} = classes;

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
