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

test( "The calculatedLength of [] is 0",
      () =>
      {
          expect( arrayUtils.calculateLength( [] ) ).toEqual( 0 );
      } );

test( "The calculated length of ['a','b','c'] is 3",
      () =>
      {
          expect( arrayUtils.calculateLength( ["a", "b", "c"] ) ).toEqual( 3 );
      } );

test( "The calculated length of 'abc' is 3",
      () =>
      {
          expect( arrayUtils.calculateLength( "abc" ) ).toEqual( 3 );
      } );

test( "The calculated length of the number 479 is 3",
      () =>
      {
          expect( arrayUtils.calculateLength( 479 ) ).toEqual( 3 );
      } );

test( "The calculated length of {a:1,b:2} is 2",
      () =>
      {
          expect( arrayUtils.calculateLength( { a: 1, b: 2 } ) ).toEqual( 2 );
      } );

// Test Predicates
test( "The IDENTITY Predicate returns a new array with the same elements",
      () =>
      {
          const arr = ["a", 2, true, "b", 3, 4];

          const filtered = arr.filter( arrayUtils.Predicates.IDENTITY );

          expect( filtered ).toEqual( arr );

          arr.push( "c", "d", 5 );

          expect( filtered ).not.toEqual( arr );
      } );

test( "The IS_PREDICATE Predicate returns an array of filter functions",
      () =>
      {
          const f1 = e => null != e;
          const f2 = function( e )
          {
              return e > 2;
          };
          const f3 = function()
          {
          };

          const arr = [f1, f2, f3, 3, 4];

          const filtered = arr.filter( arrayUtils.Predicates.IS_PREDICATE );

          expect( filtered ).toEqual( [f1, f2] );
      } );

test( "The IS_COMPARATOR Predicate returns a new array with only comparator functions",
      () =>
      {
          const f1 = ( a, b ) => a > b ? 1 : a < b ? -1 : 0;

          const f2 = function( a, b )
          {
              return 20;
          };
          const f3 = function( a )
          {
          };

          const arr = [f1, f2, f3, 3, 4];

          const filtered = arr.filter( arrayUtils.Predicates.IS_COMPARATOR );

          expect( filtered ).toEqual( [f1, f2] );
      } );

test( "The IS_DEFINED Predicate returns a new array without undefined elements",
      () =>
      {
          const arr = new Array( 5 );

          arr[0] = "a";
          arr[2] = "b";
          arr[4] = "c";

          const filtered = arr.filter( arrayUtils.Predicates.IS_DEFINED );

          expect( filtered ).toEqual( ["a", "b", "c"] );

          expect( filtered?.length ).toEqual( 3 );
      } );

test( "The IS_DEFINED Predicate returns a new array without undefined elements, nulls are preserved",
      () =>
      {
          const arr = new Array( 5 );

          arr[0] = "a";
          arr[1] = null;
          arr[2] = "b";
          arr[4] = "c";

          const filtered = arr.filter( arrayUtils.Predicates.IS_DEFINED );

          expect( filtered ).toEqual( ["a", null, "b", "c"] );

          expect( filtered?.length ).toEqual( 4 );
      } );


test( "The IS_NOT_NULL Predicate returns a new array without undefined or null elements",
      () =>
      {
          const arr = new Array( 5 );

          arr[0] = "a";
          arr[1] = null;
          arr[2] = "b";
          arr[4] = "c";

          const filtered = arr.filter( arrayUtils.Predicates.IS_NOT_NULL );

          expect( filtered ).toEqual( ["a", "b", "c"] );

          expect( filtered?.length ).toEqual( 3 );
      } );

test( "The MATCHES_TYPE Predicate FUNCTION returns a filter to retain only elements of a specific type",
      () =>
      {
          const arr = ["a", 1, true, "b", {}, ["a", "b"]];

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_TYPE( "string", "boolean" ) );

          expect( filtered ).toEqual( ["a", true, "b"] );
      } );

test( "The MATCHES_ALL Predicate FUNCTION returns a filter to retain only elements that match all of the filters specified",
      () =>
      {
          const arr = ["a", 1, true, "b", {}, ["a", "b"]];

          const filter1 = e => "string" === typeof e;
          const filter2 = e => e > "a";

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_ALL( filter1, filter2 ) );

          expect( filtered ).toEqual( ["b"] );
      } );

test( "The MATCHES_ANY Predicate FUNCTION returns a filter to retain elements that match ANY of the filters specified",
      () =>
      {
          const arr = ["a", 1, true, "b", {}, ["a", "b"]];

          const filter1 = e => "string" === typeof e;
          const filter2 = e => "object" === typeof e;

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_ANY( filter1, filter2 ) );

          expect( filtered ).toEqual( ["a", "b", {}, ["a", "b"]] );
      } );

test( "The MATCHES_NONE Predicate FUNCTION returns a filter to retain only elements that DO NOT match ANY of the filters specified",
      () =>
      {
          const arr = ["a", "b", "c", 1, 2, 3, {}, [1, 2, 3]];

          const filter1 = e => "number" === typeof e;
          const filter2 = e => Array.isArray( e );

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_NONE( filter1, filter2 ) );

          expect( filtered ).toEqual( ["a", "b", "c", {}] );
      } );

test( "The MATCHES_N_OR_MORE Predicate FUNCTION returns a filter to retain only elements that match the specified number of the filters specified or more",
      () =>
      {
          const arr = ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}, ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}]];

          const filter1 = e => "string" === typeof e;
          const filter2 = e => e?.length > 1;
          const filter3 = e => "number" === typeof e;
          const filter4 = e => e > 10;

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_N_OR_MORE( 2, filter1, filter2, filter3, filter4 ) );

          expect( filtered ).toEqual( ["ab", "abc", "bc", 11, 22, 33] );
      } );

test( "The MATCHES_ONLY_N Predicate FUNCTION returns a filter to retain only elements that match exactly the specified number of the filters specified",
      () =>
      {
          const arr = ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}, ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}]];

          const filter1 = e => "string" === typeof e;
          const filter2 = e => e?.length > 1;
          const filter3 = e => "number" === typeof e;
          const filter4 = e => e > 10;
          const filter5 = e => Array.isArray( e );

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_ONLY_N( 1, filter1, filter2, filter3, filter4, filter5 ) );

          expect( filtered ).toEqual( ["a", "b", "c", 1, 2, 3] );
      } );

test( "The MATCHES_LESS_THAN_N Predicate FUNCTION returns a filter to retain only elements that match less than the specified number of the filters specified",
      () =>
      {
          const arr = ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}, ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}]];

          const filter1 = e => "string" === typeof e;
          const filter2 = e => e?.length > 1;
          const filter3 = e => "number" === typeof e;
          const filter4 = e => e > 10;

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_LESS_THAN_N( 2, filter1, filter2, filter3, filter4 ) );

          expect( filtered ).toEqual( ["a", "b", "c", 1, 2, 3, {}, ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}]] );
      } );

test( "The IS_POPULATED_ARRAY Predicate returns true if the specified value is an array with at least 1 'truthy' element",
      () =>
      {
          const arr = [];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_ARRAY ) ).toEqual( [] );
      } );


test( "The IS_POPULATED_ARRAY Predicate returns true if the specified value is an array with at least 1 'truthy' element",
      () =>
      {
          const arr = [{}, null, undefined];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_ARRAY ) ).toEqual( [] );
      } );


test( "The IS_POPULATED_ARRAY Predicate returns true if the specified value is an array with at least 1 'truthy' element",
      () =>
      {
          const arr = [{}, [2], false];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_ARRAY ) ).toEqual( [[2]] );
      } );

test( "The IS_POPULATED_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
      () =>
      {
          const arr = [{}];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_OBJECT ) ).toEqual( [] );
      } );

test( "The IS_POPULATED_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
      () =>
      {
          const arr = [{ a: "" }];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_OBJECT ) ).toEqual( [{ a: "" }] );
      } );


test( "The IS_POPULATED_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
      () =>
      {
          const arr = [[1]];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_OBJECT ) ).toEqual( [[1]] );
      } );

test( "The IS_POPULATED_NON_ARRAY_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
      () =>
      {
          const arr = [{}];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_NON_ARRAY_OBJECT ) ).toEqual( [] );
      } );

test( "The IS_POPULATED_NON_ARRAY_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
      () =>
      {
          const arr = [{ a: "" }];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_NON_ARRAY_OBJECT ) ).toEqual( [{ a: "" }] );
      } );

test( "The IS_POPULATED_NON_ARRAY_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
      () =>
      {
          const arr = [[1]];
          expect( arr.filter( arrayUtils.Predicates.IS_POPULATED_NON_ARRAY_OBJECT ) ).toEqual( [] );
      } );

test( "The IS_VALID_NUMBER Predicate returns true if the specified value is a number that is not NaN and is finite",
      () =>
      {
          const arr = [1, 2];
          expect( arr.filter( arrayUtils.Predicates.IS_VALID_NUMBER ) ).toEqual( [1, 2] );
      } );


test( "The IS_VALID_NUMBER Predicate returns true if the specified value is a number that is not NaN and is finite",
      () =>
      {
          const arr = [1, 2, "a", true];
          expect( arr.filter( arrayUtils.Predicates.IS_VALID_NUMBER ) ).toEqual( [1, 2] );
      } );


test( "The IS_VALID_NUMBER Predicate returns true if the specified value is a number that is not NaN and is finite",
      () =>
      {
          const arr = [1, 2, 1 / 0];
          expect( arr.filter( arrayUtils.Predicates.IS_VALID_NUMBER ) ).toEqual( [1, 2] );
      } );


test( "The NON_EMPTY Predicate returns true if the specified value is a number that is not NaN and is finite",
      () =>
      {
          const arr = [1, 2, {}, "abc", [], ""];
          expect( arr.filter( arrayUtils.Predicates.NON_EMPTY ) ).toEqual( [1, 2, "abc"] );
      } );

test( "The NON_BLANK Predicate is used to return an array with only non-empty strings that are not composed entirely of whitespace",
      () =>
      {
          const arr = ["", "abc", "def".replace( /\w/g, "" ), " ", "\t"];
          expect( arr.filter( arrayUtils.Predicates.NON_BLANK ) ).toEqual( ["abc"] );
      } );

test( "The MATCHES_REGEXP Predicate FUNCTION returns a filter to retain only elements that satisfy the regular expression",
      () =>
      {
          const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_REGEXP( /[A-Z]/ ) );

          expect( filtered ).toEqual( ["ABC"] );
      } );

test( "The MATCHES_REGEXP Predicate FUNCTION returns a filter to retain only elements that satisfy the regular expression",
      () =>
      {
          const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];

          const filtered = arr.filter( arrayUtils.Predicates.MATCHES_REGEXP( /\w/ ) );

          expect( filtered ).toEqual( ["abc", "def", "ghi", "ABC"] );
      } );

test( "The NOT_IN Predicate FUNCTION returns a filter to retain only elements that do not also appear in the other array",
      () =>
      {
          const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
          const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abc" }, "ABC"];

          const filtered = arr.filter( arrayUtils.Predicates.NOT_IN( arr2 ) );

          expect( filtered ).toEqual( ["ghi"] );
      } );

test( "The NOT_IN Predicate FUNCTION returns a filter to retain only elements that do not also appear in the other array",
      () =>
      {
          const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
          const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abcd" }, "ABC"];

          const filtered = arr.filter( arrayUtils.Predicates.NOT_IN( arr2 ) );

          expect( filtered ).toEqual( ["ghi", { a: "abc" }] );
      } );


test( "The IN Predicate FUNCTION returns a filter to retain only elements that do also appear in the other array",
      () =>
      {
          const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
          const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abc" }, "ABC", 7, {}];

          const filtered = arr.filter( arrayUtils.Predicates.IN( arr2 ) );

          expect( filtered ).toEqual( ["abc", "def", 2, true, ["abc"], { a: "abc" }, "ABC"] );
      } );

test( "The IN Predicate FUNCTION returns a filter to retain only elements that also appear in the other array",
      () =>
      {
          const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
          const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abcd" }, "ABC"];

          const filtered = arr.filter( arrayUtils.Predicates.IN( arr2 ) );

          expect( filtered ).toEqual( ["abc", "def", 2, true, ["abc"], "ABC"] );
      } );


test( "The NOT_IN Predicate FUNCTION returns a filter to retain only elements that do not also appear in the other array",
      () =>
      {
          const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
          const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abc" }, "ABC"];

          const filtered = arr.filter( arrayUtils.Predicates.NOT_IN( arr2 ) );

          expect( filtered ).toEqual( ["ghi"] );
      } );

test( "The STARTS_WITH Predicate FUNCTION returns a filter to retain only elements that, _as strings_, each begin with one or more of the prefixes specified in the input array ",
      () =>
      {
          const arr = ["abc", "abcd", "bcd", 2, true, ["abc"], { a: "abc" }, "ABC"];
          const arr2 = ["ab"];

          const filtered = arr.filter( arrayUtils.Predicates.STARTS_WITH( arr2 ) );

          expect( filtered ).toEqual( ["abc", "abcd", ["abc"]] );
      } );

test( "The STARTS_WITH Predicate FUNCTION returns a filter to retain only elements that, _as strings_, each begin with one or more of the prefixes specified in the input array ",
      () =>
      {
          const arr = ["abc", "abcd", "bcd", 2, true, ["abc"], { a: "abc" }, "ABC"];
          const arr2 = ["ab", "AB"];

          const filtered = arr.filter( arrayUtils.Predicates.STARTS_WITH( arr2 ) );

          expect( filtered ).toEqual( ["abc", "abcd", ["abc"], "ABC"] );
      } );

test( "The ENDS_WITH Predicate FUNCTION returns a filter to retain only elements that, _as strings_, each end with one or more of the suffixes specified in the input array ",
      () =>
      {
          const arr = ["abc", "abcd", "bcd", 2, true, ["abc"], { a: "abc" }, "ABCD"];
          const arr2 = ["cd"];

          const filtered = arr.filter( arrayUtils.Predicates.ENDS_WITH( arr2 ) );

          expect( filtered ).toEqual( ["abcd", "bcd"] );
      } );

test( "The ENDS_WITH Predicate FUNCTION returns a filter to retain only elements that, _as strings_, each end with one or more of the suffixes specified in the input array ",
      () =>
      {
          const arr = ["abc", "abcd", "bcd", 2, true, ["abc"], { a: "abc" }, "ABCD"];
          const arr2 = ["cd", "CD"];

          const filtered = arr.filter( arrayUtils.Predicates.ENDS_WITH( arr2 ) );

          expect( filtered ).toEqual( ["abcd", "bcd", "ABCD"] );
      } );


test( "The buildPredicate Predicate FUNCTION returns a filter to retain only elements that match all of the filters specified",
      () =>
      {
          const arr = ["a", 1, true, "b", {}, ["a", "b"]];

          const filter1 = e => "string" === typeof e;
          const filter2 = e => e > "a";

          const filtered = arr.filter( arrayUtils.Predicates.buildPredicate( filter1, filter2 ) );

          expect( filtered ).toEqual( ["b"] );
      } );


test( "The chain Predicate FUNCTION returns a filter to retain only elements that match all of the filters specified",
      () =>
      {
          const arr = ["a", 1, true, "b", {}, ["a", "b"]];

          const filter1 = e => "string" === typeof e;
          const filter2 = e => e > "a";

          const filtered = arr.filter( arrayUtils.Predicates.chain( filter1, filter2 ) );

          expect( filtered ).toEqual( ["b"] );
      } );

test( "The predicate FUNCTION returns a filter to retain only elements that match all of the filters specified",
      () =>
      {
          const arr = ["a", 1, true, "b", {}, ["a", "b"]];

          const filter1 = e => "string" === typeof e;
          const filter2 = e => e > "a";

          const filtered = arr.filter( arrayUtils.predicate( filter1, filter2 ) );

          expect( filtered ).toEqual( ["b"] );
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



