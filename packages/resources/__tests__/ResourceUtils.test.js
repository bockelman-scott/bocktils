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
    ResourceKey,
    Resource,
    ResourceMap,
    ResourceCollection,
    ResourceBundle
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

describe( "ResourceMap", () =>
{
    test( "ResourceMap is a class that encapsulates a collection of Resources",
          () =>
          {
              const abc = new ResourceKey( "a", "b", "c" );
              const abd = new ResourceKey( "a", "b", "d" );
              const abe = new ResourceKey( "a", "b", "e" );

              const resource1 = new Resource( abc, 1 );
              const resource3 = new Resource( abd, 3 );
              const resource5 = new Resource( abe, 5 );

              const enResources = new ResourceMap( "en-US", resource1, resource3, resource5 );
              const frResources = new ResourceMap( "fr-FR", resource1, resource3, resource5 );

              const a = enResources.get( "a" );
              const a_b = enResources.get( "a.b" );
              const a_b_c = enResources.get( "a.b.c" );
              const x_y_z = enResources.get( "x.y.z" );

              expect( a_b_c ).toEqual( 1 );
              expect( x_y_z ).toEqual( "x.y.z" );

              const f_a = frResources.get( "a" );
              const f_a_b = frResources.get( "a.b" );
              const f_a_b_c = frResources.get( "a.b.c" );
              const f_x_y_z = frResources.get( "x.y.z" );

              expect( f_a_b_c ).toEqual( 1 );
              expect( f_x_y_z ).toEqual( "x.y.z" );

              expect( f_a ).toEqual( a );
              expect( f_a_b ).toEqual( a_b );

              /*
               console.log( "A:", a, "\n" );
               console.log( "AB:", a_b, "\n" );
               console.log( "ABC:", a_b_c, "\n" );
               console.log( "XYZ:", x_y_z, "\n" );
               */
          } );
} );


describe( "ResourceCollection", () =>
{
    test( "ResourceCollection is a subclass of ResourceMap that has a fallback ResourceMap",
          () =>
          {
              const resourceKey1 = new ResourceKey( "a", "b", "c" );
              const resourceKey2 = new ResourceKey( "x", "y", "z" );

              const resource1 = new Resource( resourceKey1, "r1" );
              const resource2 = new Resource( resourceKey2, "r2" );

              const resourceMap1 = new ResourceMap( "en-US", resource1 );
              const resourceMap2 = new ResourceMap( "en-US", resource1, resource2 );

              let resourceCollection = new ResourceCollection( "en-US", resourceMap1, resource1 );

              expect( resourceCollection.get( "a.b.c" ) ).toEqual( "r1" );
              expect( resourceCollection.get( "x.y.z" ) ).toBe( "x.y.z" );

              resourceCollection = new ResourceCollection( "en-US", resourceMap2, resource1 );

              expect( resourceCollection.get( "a.b.c" ) ).toEqual( "r1" );
              expect( resourceCollection.get( "x.y.z" ) ).toBe( "r2" );
          } );
} );

describe( "ResourceBundle", () =>
{
    test( "ResourceBundle is a class that encapsulates a collection of ResourceMaps",
          () =>
          {
              const abc = new ResourceKey( "a", "b", "c" );
              const abd = new ResourceKey( "a", "b", "d" );
              const abe = new ResourceKey( "a", "b", "e" );

              const resource1 = new Resource( abc, 1 );
              const resource3 = new Resource( abd, 3 );
              const resource5 = new Resource( abe, 5 );

              const enResources = new ResourceMap( "en-US", resource1, resource3, resource5 );
              const frResources = new ResourceMap( "fr-FR", resource1, resource3, resource5 );

              const resourceBundle = new ResourceBundle( enResources, frResources );

              // console.log( resourceBundle );


              const resourceMaps = resourceBundle.resourceMaps;

/*
              expect( Object.keys( resourceMaps ) ).toEqual( ["en-US", "en", `fr-FR`, "fr"] );

              expect( Object.keys( resourceBundle.resources ) ).toEqual( ["en-US", "en", `fr-FR`, "fr"] );

              expect( resourceBundle.get( new Intl.Locale( "fr-FR" ), "a.b.c" ) ).toEqual( 1 );
*/

          } );
} );
