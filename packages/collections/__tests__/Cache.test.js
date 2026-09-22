const v8 = require( "v8" );

const os = require( "os" );

const core = require( "@toolbocks/core" );

const { moduleUtils, constants, typeUtils, stringUtils } = core;

const { ObjectEntry, attempt, asyncAttempt, globalGc, no_op } = moduleUtils;

const { getClass, getClassName } = typeUtils;

const { asString } = stringUtils;

const cacheUtils = require( "../Cache.js" );

const { BoundedCache, ExpiringCache } = cacheUtils;

const CACHE_SIZE = 4_096; //32_767;
const CACHE_EXPIRATION = 60_000;

const LONG_LIVED_BOUNDED_CACHE = new BoundedCache( CACHE_SIZE );
const LONG_LIVED_WEAK_BOUNDED_CACHE = new BoundedCache( CACHE_SIZE, true, true );

const LONG_LIVED_EXPIRING_CACHE = new ExpiringCache( CACHE_SIZE, CACHE_EXPIRATION );
const LONG_LIVED_WEAK_EXPIRING_CACHE = new ExpiringCache( CACHE_SIZE, CACHE_EXPIRATION, true, true );

class Person
{
    #id;
    #firstName;
    #lastName;

    constructor( id, firstName, lastName )
    {
        this.#id = id;
        this.#firstName = firstName;
        this.#lastName = lastName;
    }

    get id()
    {
        return this.#id;
    }

    get firstName()
    {
        return this.#firstName;
    }

    get lastName()
    {
        return this.#lastName;
    }
}

class Contact extends Person
{
    #email;
    #phone;

    constructor( id, firstName, lastName, email, phone )
    {
        super( id, firstName, lastName );
        this.#email = email;
        this.#phone = phone;
    }

    get email()
    {
        return this.#email;
    }

    get phone()
    {
        return this.#phone;
    }
}

describe( "BoundedCache - construction", () =>
{
    test( "create a bounded cache to hold <= 200 entries", () =>
    {
        const boundedCache = new BoundedCache( 200 );

        expect( typeof boundedCache ).toEqual( "object" );

        expect( getClass( boundedCache ) ).toBe( BoundedCache );

        expect( getClassName( boundedCache ) ).toEqual( "BoundedCache" );

        expect( boundedCache.maxSize ).toEqual( 200 );
        expect( boundedCache.limit ).toEqual( 200 );

        for( let i = 0; i < 250; i++ )
        {
            const person = new Person( i, `First_${i}`, `Last_${i}` );
            boundedCache.cacheValue( person.id, person );
        }

        expect( boundedCache.size === 200 ).toBe( true );

        const value = boundedCache.get( 235 );

        expect( typeof value ).toEqual( "object" );
        expect( getClass( value ) ).toBe( Person );

    } );

} );

describe( "BoundedCache - basic usage scenarios", () =>
{
    const cache = new BoundedCache( 4_096 );

    const readValue = function( pKey )
    {
        return cache.get( pKey );
    };

    const writeValue = function( pKey, pValue )
    {
        cache.set( pKey, pValue );
    };

    test( "bounded cache typical usage",
          () =>
          {
              for( let i = 0; i < 8_192; i++ )
              {
                  const person = new Person( i, `First_${i}`, `Last_${i}` );
                  writeValue( person.id, person );

                  expect( readValue( i ).firstName ).toEqual( `First_${i}` );
              }

              let count = 0;

              for( let entry of cache.entries() )
              {
                  count += 1;

                  const k = ObjectEntry.getKey( entry );
                  const v = ObjectEntry.getValue( entry );

                  expect( typeof k ).toEqual( "object" );
                  expect( getClassName( v ) ).toEqual( "Person" );
              }

              expect( count ).toEqual( 4_096 );

              count = 0;

              for( let key of cache.keys() )
              {
                  count += 1;

                  expect( typeof key ).toEqual( "object" );
              }

              expect( count ).toEqual( 4_096 );

              count = 0;

              for( let value of cache.values() )
              {
                  count += 1;

                  expect( typeof value ).toEqual( "object" );
                  expect( getClass( value ) ).toEqual( Person );
              }

              expect( count ).toEqual( 4_096 );
          } );

    test( "bounded cache of 200 entries - gets and sets over time",
          () =>
          {
              const boundedCache = new BoundedCache( 200 );

              expect( typeof boundedCache ).toEqual( "object" );

              expect( getClass( boundedCache ) ).toBe( BoundedCache );

              expect( getClassName( boundedCache ) ).toEqual( "BoundedCache" );

              expect( boundedCache.maxSize ).toEqual( 200 );
              expect( boundedCache.limit ).toEqual( 200 );

              for( let i = 0; i < 250; i++ )
              {
                  const person = new Person( i, `First_${i}`, `Last_${i}` );
                  boundedCache.cacheValue( person.id, person );

                  expect( boundedCache.get( i ).firstName ).toEqual( `First_${i}` );
              }

              expect( boundedCache.size === 200 ).toBe( true );

              for( let i = 50, n = 50 + boundedCache.size; i < n; i += 5 )
              {
                  let value = boundedCache.get( i );

                  expect( typeof value ).toEqual( "object" );
                  expect( getClass( value ) ).toBe( Person );

                  const person = new Person( i + 1, `First_${i + 1}`, `Last_${i + 1}` );
                  boundedCache.set( person.id, person );
              }

              for( let i = 50, n = 50 + boundedCache.size; i < n; i += 10 )
              {
                  let value = boundedCache.get( i );

                  expect( typeof value ).toEqual( "object" );
                  expect( getClass( value ) ).toBe( Person );

                  const person = new Person( i + 1, `First_${i + 1}`, `Last_${i + 1}` );
                  boundedCache.set( person.id, person );
              }

              expect( boundedCache.size ).toEqual( 200 );

          } );
} );

describe( "BoundedCache - memory", () =>
{
    test( "exercise memory constraints of a bounded cache", () =>
    {
        const startTime = Date.now();
        const startMem = os.freemem();

        let lastMem = Math.floor( startMem );
        let lastTime = startTime;

        const boundedCache = new BoundedCache( CACHE_SIZE );
        const contactCache = new BoundedCache( 4_096 );

        const NUM_ITERATIONS = 750_000;  // (3_276_700 * 2);

        for( let i = 0; i < NUM_ITERATIONS; i++ )
        {
            const person = new Person( i, `User_${i}`, `Name_${i}` );
            boundedCache.cacheValue( person.id, person );

            const contact = new Contact( i, person.firstName, person.lastName, "some.email." + i + "@gmail.com", "6302127770" );
            contactCache.set( contact.id, contact );

            if ( i > 0 && 0 === (i % 10_000) )
            {
                let totalTime = Date.now() - startTime;

                let iterationTime = Date.now() - (lastTime || startTime);

                let freeMemory = os.freemem();

                let delta = startMem - freeMemory;

                let recentDelta = (lastMem || startMem) - freeMemory;

                console.log( `Iteration ${i} of ${NUM_ITERATIONS}, freemem: ${freeMemory}, recent_delta: ${recentDelta}, delta: ${delta}, iteration_time: ${iterationTime}ms, total_time: ${totalTime}ms, cache_size: ${boundedCache.size}` );

                expect( boundedCache.size <= CACHE_SIZE ).toBe( true );
                expect( boundedCache.get( i ) ).toEqual( person );

                if ( i > 0 && 0 === (i % 400_000) )
                {
                    attempt( () => v8.writeHeapSnapshot( `C:\\Projects\\bocktils\\packages\\collections\\__tests__\\logs\\snapshot_${Date.now()}.heapsnapshot` ) );
                    asyncAttempt( () => globalGc() ).then( no_op ).catch( console.error );
                }

                lastMem = freeMemory;
                lastTime = Date.now();
            }
        }

        expect( boundedCache.size === CACHE_SIZE ).toBe( true );

        const value = boundedCache.get( asString( ((NUM_ITERATIONS - CACHE_SIZE) - 1) ) );

        expect( typeof value ).toEqual( "object" );
        expect( getClass( value ) ).toBe( Person );

        expect( contactCache.size === 4_096 ).toBe( true );

        const c = contactCache.get( asString( NUM_ITERATIONS - 4_095 ) );

        expect( typeof c ).toEqual( "object" );
        expect( getClass( c ) ).toBe( Contact );

    }, 1_200_000 );


    test( "exercise memory constraints of bounded cache with asnyc iteration", async() =>
    {
        const startTime = Date.now();
        const startMem = os.freemem();

        let lastMem = Math.floor( startMem );
        let lastTime = startTime;

        const boundedCache = new BoundedCache( CACHE_SIZE );
        const contactCache = new BoundedCache( 4_096 );

        const NUM_ITERATIONS = (3_276_700 * 2);

        const loop = async function( i )
        {
            const person = new Person( i, `User_${i}`, `Name_${i}` );
            boundedCache.cacheValue( person.id, person );

            const contact = new Contact( i, person.firstName, person.lastName, "some.email." + i + "@gmail.com", "6302127770" );
            contactCache.set( contact.id, contact );

            if ( i > 0 && 0 === (i % 5_000) )
            {
                let totalTime = Date.now() - startTime;

                let iterationTime = Date.now() - (lastTime || startTime);

                let freeMemory = os.freemem();

                let delta = startMem - freeMemory;

                let recentDelta = (lastMem || startMem) - freeMemory;

                console.log( `Iteration ${i} of ${NUM_ITERATIONS}, freemem: ${freeMemory}, recent_delta: ${recentDelta}, delta: ${delta}, iteration_time: ${iterationTime}ms, total_time: ${totalTime}ms, cache_size: ${boundedCache.size}` );

                expect( boundedCache.size <= CACHE_SIZE ).toBe( true );
                expect( boundedCache.get( i ) ).toEqual( person );

                lastMem = freeMemory;
                lastTime = Date.now();
            }
        };

        for( let i = 0; i < NUM_ITERATIONS; i++ )
        {
            await loop( i );
        }

        expect( boundedCache.size === CACHE_SIZE ).toBe( true );

        const value = boundedCache.get( asString( NUM_ITERATIONS - 32_766 ) );

        expect( typeof value ).toEqual( "object" );
        expect( getClass( value ) ).toBe( Person );

        expect( contactCache.size === 4_096 ).toBe( true );

        const c = contactCache.get( asString( NUM_ITERATIONS - 4_095 ) );

        expect( typeof c ).toEqual( "object" );
        expect( getClass( c ) ).toBe( Contact );

    }, 1_200_000 );


}, 1_500_000 );
