// no need to require jest here... run this test from the console using 'npx jest'
// let jester = require( "jest" );
// jester.run( __filename );

/** import the Constants.js we are testing */
const constants = require( "../utils/Constants.js" );

const arrayUtils = require( "../utils/ArrayUtils.js" );
const typeUtils = require( "../utils/TypeUtils" );

Object.assign( this, constants );
Object.assign( this, arrayUtils );

const exampleArray = ["a", "b", "c", 1, 2, 3, 4, 5, {}, ["a", "b", "c", 1, 2, 3, 4, 5, {}], new Date(), true, false, null, undefined, function() {}, Object.create( null )];

test( "asArray([1,2,3]) === [1,2,3]",
      () =>
      {
          expect( arrayUtils.asArray( [1, 2, 3] ) ).toEqual( [1, 2, 3] );
      } );

test( "asArray([1,2,3,4]) === [1,2,3,4] and is the SAME memory object",
      () =>
      {
          let arr1 = [1, 2, 3, 4];
          let arr2 = arrayUtils.asArray( arr1 );

          expect( arrayUtils.asArray( arr2 ) ).toEqual( [1, 2, 3, 4] );

          arr1.shift();

          expect( arrayUtils.asArray( arr2 ) ).toEqual( arr1 );
      } );

test( "asArray('abc') === ['abc']",
      () =>
      {
          expect( arrayUtils.asArray( "abc" ) ).toEqual( ["abc"] );
      } );

test( "asArray(...pArgs) === [...pArgs]",
      () =>
      {
          const fn = function( ...pArgs )
          {
              return arrayUtils.asArray( pArgs );
          };
          expect( fn( 1, 2, 3 ) ).toEqual( [1, 2, 3] );
      } );

test( "asArray(...pArgs) === [...pArgs]",
      () =>
      {
          const fn = function( ...pArgs )
          {
              return [...pArgs];
          };
          expect( fn( 1, 2, 3 ) ).toEqual( [1, 2, 3] );
      } );

test( "asArray([[1,2,3],[4,5,6]],{flatten:true}) === [1,2,3,4,5,6]",
      () =>
      {
          expect( arrayUtils.asArray( [[1, 2, 3], [4, 5, 6]], { flatten: true } ) ).toEqual( [1, 2, 3, 4, 5, 6] );
      } );

test( "asArray([[[1,2,3],[4,5,6]]],{flatten:{level:1}}) === [[1,2,3],[4,5,6]]",
      () =>
      {
          expect( arrayUtils.asArray( [[[1, 2, 3], [4, 5, 6]]], { flatten: { level: 1 } } ) ).toEqual( [[1, 2, 3], [4, 5, 6]] );
      } );

test( "asArray([[[1,2,3],[4,5,6]]],{flatten:{level:2}}) === [1,2,3,4,5,6]",
      () =>
      {
          expect( arrayUtils.asArray( [[[1, 2, 3], [4, 5, 6]]], { flatten: { level: 2 } } ) ).toEqual( [1, 2, 3, 4, 5, 6] );
      } );

test( "asArray([[[[1,2,3],[4,5,6]]]],{flatten:true}) === [1,2,3,4,5,6]",
      () =>
      {
          expect( arrayUtils.asArray( [[[[1, 2, 3], [4, 5, 6]]]], { flatten: true } ) ).toEqual( [1, 2, 3, 4, 5, 6] );
      } );

test( "asArray([1,2,3,4,5,6], {filter:fn) === [4,5,6]",
      () =>
      {
          const fn = ( e ) => e > 3;
          expect( arrayUtils.asArray( [1, 2, 3, 4, 5, 6], { filter: fn } ) ).toEqual( [4, 5, 6] );
      } );

test( "asArray([[[[1,2,3],[4,5,6]]]],{flatten:true, filter:fn}) === [4,5,6]",
      () =>
      {
          const fn = ( e ) => e > 3;
          expect( arrayUtils.asArray( [[[[1, 2, 3], [4, 5, 6]]]], {
              flatten: true,
              filter: fn
          } ) ).toEqual( [4, 5, 6] );
      } );

test( "asArray('some,words,separated,by,commas',{splitOn:,) === ['some','words','separated','by','commas']",
      () =>
      {
          expect( arrayUtils.asArray( "some,words,separated,by,commas", { splitOn: "," } ) ).toEqual( ["some", "words", "separated", "by", "commas"] );
      } );

test( "asArray('some,,words,,separated,,by,,commas',{splitOn:,) === ['some','','words','','separated','','by','','commas']",
      () =>
      {
          expect( arrayUtils.asArray( "some,,words,,separated,,by,,commas", { splitOn: "," } ) ).toEqual( ["some", "", "words", "", "separated", "", "by", "", "commas"] );
      } );


test( "asArray('some,,words,,separated,,by,,commas',{splitOn:,, sanitize:true) === ['some','','words','','separated','','by','','commas']",
      () =>
      {
          let expected = ["some", "words", "separated", "by", "commas"];

          expect( arrayUtils.asArray( "some,,words,,separated,,by,,commas",
                                      {
                                          splitOn: ",",
                                          sanitize: true
                                      } ) ).toEqual( expected );
      } );

test( "asArray('some,,words,,separated,,by,,commas',{splitOn:,, sanitize:true, filter:fn) === ['some','separated']",
      () =>
      {
          let expected = ["some", "separated"];

          expect( arrayUtils.asArray( "some,,words,,separated,,by,,commas",
                                      {
                                          splitOn: ",",
                                          sanitize: true,
                                          filter: ( e ) => e.startsWith( "s" )
                                      } ) ).toEqual( expected );
      } );

test( "asArray with an object and a type filter for numbers",
      () =>
      {
          let input =
              {
                  a: 1,
                  b: "two",
                  c: 3,
                  d: true
              };

          let expected = [1, 3];

          expect( arrayUtils.asArray( input,
                                      {
                                          type: "number"
                                      } ) ).toEqual( expected );
      } );

test( "asArray with an object and a type filter for strings",
      () =>
      {
          let input =
              {
                  a: 1,
                  b: "two",
                  c: 3,
                  d: true
              };

          let expected = ["two"];

          expect( arrayUtils.asArray( input,
                                      {
                                          type: "string"
                                      } ) ).toEqual( expected );
      } );

test( "asArray('abc,abc,def,ghi,abc,jk,def',{splitOn:,unique:true} === ['abc','def','ghi','jk']",
      () =>
      {
          let expected = ["abc", "def", "ghi", "jk"];

          let actual = arrayUtils.asArray( "abc,abc,def,ghi,abc,jk,def", { splitOn: ",", unique: true } );

          expect( actual ).toEqual( expected );
      } );

test( "asArray with a comparator",
      () =>
      {
          const comparator = ( a, b ) => { return a > b ? 1 : a < b ? -1 : 0; };

          let input = "some,words,separated,by,commas";
          let expected = ["by", "commas", "separated", "some", "words"];
          let actual = arrayUtils.asArray( input, { splitOn: ",", comparator } );

          expect( actual ).toEqual( expected );
      } );


test( "unique array from varargs",
      () =>
      {
          let actual = arrayUtils.unique( "a", "b", "a", "c", "d", "b", "c" );

          let expected = ["a", "b", "c", "d"];

          expect( actual ).toEqual( expected );
      } );

test( "unique array from input",
      () =>
      {
          let actual = arrayUtils.unique( ["a", "b", "a", "c", "d", "b", "c"] );

          let expected = ["a", "b", "c", "d"];

          expect( actual ).toEqual( expected );
      } );

test( "Is the exampleArray an Array with at least 1 element",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( exampleArray ) ).toBe( true );
      } );

test( "Is a string an Array with at least 1 element - by default, no",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( "abc" ) ).toBe( false );
      } );

test( "Is a string an Array with at least 1 element - with options.acceptArrayLike, yes",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( "abc", { acceptArrayLike: true } ) ).toBe( true );
      } );

test( "Is [] an Array with at least 1 element - no",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( [] ) ).toBe( false );
      } );

test( "Is ['a','b','c'] an Array with at least 3 elements - yes",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( ["a", "b", "c"], { minimumLength: 3 } ) ).toBe( true );
      } );


test( "Is ['a','b'] an Array with at least 3 elements - no",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( ["a", "b"], { minimumLength: 3 } ) ).toBe( false );
      } );

test( "Is {} an Array-like object with at least 1 element - no",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( {}, { minimumLength: 3, acceptArrayLike: true } ) ).toBe( false );
      } );

test( "Is {a:1,b:2,c:3} an Array-like object with at least 1 element - no",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( { a: 1, b: 2, c: 3 },
                                               {
                                                   minimumLength: 3,
                                                   acceptArrayLike: true
                                               } ) ).toBe( false );
      } );


test( "Is {a:1,b:2,c:3} an Object with at least 1 property - yes",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( { a: 1, b: 2, c: 3 },
                                               {
                                                   minimumLength: 3,
                                                   acceptObjects: true
                                               } ) ).toBe( true );
      } );

test( "Is {a:1,b:2,c:3} an Array with at least 4 elements - no",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( { a: 1, b: 2, c: 3 },
                                               {
                                                   minimumLength: 4,
                                                   acceptObjects: true,
                                                   acceptArrayLike: true
                                               } ) ).toBe( false );
      } );

test( "The firstPopulatedArray is [1,2,3]",
      () =>
      {
          expect( arrayUtils.firstPopulatedArray( [], {}, { a: 1 }, [1, 2, 3], [1, 2, 3, 4], [] ) ).toEqual( [1, 2, 3] );
      } );

test( "The firstPopulatedArray is [1,2]",
      () =>
      {
          expect( arrayUtils.firstPopulatedArray( undefined, null, [], { a: 1 }, [1, 2], [1, 2, 3], [] ) ).toEqual( [1, 2] );
      } );


test( "The lastPopulatedArray is [1,2,3,4]",
      () =>
      {
          expect( arrayUtils.lastPopulatedArray( [], {}, { a: 1 }, [1, 2, 3], [1, 2, 3, 4], [] ) ).toEqual( [1, 2, 3, 4] );
      } );

test( "The lastPopulatedArray is [1,2,3]",
      () =>
      {
          expect( arrayUtils.lastPopulatedArray( undefined, null, [], { a: 1 }, [1, 2], [1, 2, 3], [] ) ).toEqual( [1, 2, 3] );
      } );


// The following classes and object are used in the tests for sortArray

class Person
{
    #firstName;
    #lastName;
    #age;
    #eyeColor;

    constructor( pLastName, pFirstName, pAge, pEyeColor )
    {
        this.#lastName = pLastName;
        this.#firstName = pFirstName;
        this.#age = pAge;
        this.#eyeColor = pEyeColor;
    }

    get firstName()
    {
        return this.#firstName;
    }

    get lastName()
    {
        return this.#lastName;
    }

    get age()
    {
        return this.#age;
    }

    get eyeColor()
    {
        return this.#eyeColor;
    }

    get name()
    {
        return this.firstName + " " + this.lastName;
    }

    compareTo( pOther )
    {
        if ( !(pOther instanceof Person) )
        {
            throw new Error( "Cannot compare" + (typeof pOther) + "to an instance of Person" );
        }

        return this.lastName > pOther?.lastName ? 1 : pOther?.lastName > this.lastName ? -1 : 0;
    }
}

