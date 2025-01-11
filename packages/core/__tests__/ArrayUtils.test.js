const arrayUtils = require( "../src/ArrayUtils.cjs" );

const {
    dependencies,
    Filters,
    Mappers,
    Comparators,
    RANGE_INCREMENT_OPTION,
    DEFAULT_RANGE_OPTIONS,
    DEFAULT_NUMERIC_RANGE_OPTIONS,
    DEFAULT_CHARACTER_RANGE_OPTIONS,
    asArray,
    arraysEqual,
    toPercentages,
    combineConsecutive,
    concatenateConsecutiveStrings
} = arrayUtils;

const { constants, stringUtils } = dependencies;

const exampleArray = ["a", "b", "c", 1, 2, 3, 4, 5, {}, ["a", "b", "c", 1, 2, 3, 4, 5, {}], new Date(), true, false, null, undefined, function() {}, Object.create( null )];

const { _LETTERS_ENGLISH_LCASE } = constants;

const { asString } = stringUtils;

describe( "asArray", () =>
{
    test( "asArray([1,2,3]) === [1,2,3]",
          () =>
          {
              expect( asArray( [1, 2, 3] ) ).toEqual( [1, 2, 3] );
          } );

    test( "asArray([1,2,3,4]) === [1,2,3,4] and is the SAME memory object",
          () =>
          {
              let arr1 = [1, 2, 3, 4];
              let arr2 = asArray( arr1 );

              expect( asArray( arr2 ) ).toEqual( [1, 2, 3, 4] );

              arr1.shift();

              expect( asArray( arr2 ) ).toEqual( arr1 );
          } );

    test( "asArray('abc') === ['abc']",
          () =>
          {
              expect( asArray( "abc" ) ).toEqual( ["abc"] );
          } );

    test( "asArray(...pArgs) === [...pArgs]",
          () =>
          {
              const fn = function( ...pArgs )
              {
                  return asArray( pArgs );
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
              expect( asArray( [[1, 2, 3], [4, 5, 6]], { flatten: true } ) ).toEqual( [1, 2, 3, 4, 5, 6] );
          } );

    test( "asArray([[[1,2,3],[4,5,6]]],{flatten:{level:1}}) === [[1,2,3],[4,5,6]]",
          () =>
          {
              expect( asArray( [[[1, 2, 3], [4, 5, 6]]], { flatten: { level: 1 } } ) ).toEqual( [[1, 2, 3], [4, 5, 6]] );
          } );

    test( "asArray([[[1,2,3],[4,5,6]]],{flatten:{level:2}}) === [1,2,3,4,5,6]",
          () =>
          {
              expect( asArray( [[[1, 2, 3], [4, 5, 6]]], { flatten: { level: 2 } } ) ).toEqual( [1, 2, 3, 4, 5, 6] );
          } );

    test( "asArray([[[[1,2,3],[4,5,6]]]],{flatten:true}) === [1,2,3,4,5,6]",
          () =>
          {
              expect( asArray( [[[[1, 2, 3], [4, 5, 6]]]], { flatten: true } ) ).toEqual( [1, 2, 3, 4, 5, 6] );
          } );

    test( "asArray([1,2,3,4,5,6], {filter:fn) === [4,5,6]",
          () =>
          {
              const fn = ( e ) => e > 3;
              expect( asArray( [1, 2, 3, 4, 5, 6], { filter: fn } ) ).toEqual( [4, 5, 6] );
          } );

    test( "asArray([[[[1,2,3],[4,5,6]]]],{flatten:true, filter:fn}) === [4,5,6]",
          () =>
          {
              const fn = ( e ) => e > 3;
              expect( asArray( [[[[1, 2, 3], [4, 5, 6]]]], {
                  flatten: true,
                  filter: fn
              } ) ).toEqual( [4, 5, 6] );
          } );

    test( "asArray('some,words,separated,by,commas',{splitOn:,) === ['some','words','separated','by','commas']",
          () =>
          {
              expect( asArray( "some,words,separated,by,commas", { splitOn: "," } ) ).toEqual( ["some", "words", "separated", "by", "commas"] );
          } );

    test( "asArray('some,,words,,separated,,by,,commas',{splitOn:,) === ['some','','words','','separated','','by','','commas']",
          () =>
          {
              expect( asArray( "some,,words,,separated,,by,,commas", { splitOn: "," } ) ).toEqual( ["some", "", "words", "", "separated", "", "by", "", "commas"] );
          } );


    test( "asArray('some,,words,,separated,,by,,commas',{splitOn:,, sanitize:true) === ['some','','words','','separated','','by','','commas']",
          () =>
          {
              let expected = ["some", "words", "separated", "by", "commas"];

              expect( asArray( "some,,words,,separated,,by,,commas",
                               {
                                   splitOn: ",",
                                   sanitize: true
                               } ) ).toEqual( expected );
          } );

    test( "asArray('some,,words,,separated,,by,,commas',{splitOn:,, sanitize:true, filter:fn) === ['some','separated']",
          () =>
          {
              let expected = ["some", "separated"];

              expect( asArray( "some,,words,,separated,,by,,commas",
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

              expect( asArray( input,
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

              expect( asArray( input,
                               {
                                   type: "string"
                               } ) ).toEqual( expected );
          } );

    test( "asArray('abc,abc,def,ghi,abc,jk,def',{splitOn:,unique:true} === ['abc','def','ghi','jk']",
          () =>
          {
              let expected = ["abc", "def", "ghi", "jk"];

              let actual = asArray( "abc,abc,def,ghi,abc,jk,def", { splitOn: ",", unique: true } );

              expect( actual ).toEqual( expected );
          } );

    test( "asArray with a comparator",
          () =>
          {
              const comparator = ( a, b ) => { return a > b ? 1 : a < b ? -1 : 0; };

              let input = "some,words,separated,by,commas";
              let expected = ["by", "commas", "separated", "some", "words"];
              let actual = asArray( input, { splitOn: ",", comparator } );

              expect( actual ).toEqual( expected );
          } );
} );

describe( "varargs", () =>
{
    const { varargs } = arrayUtils;

    const f = function( ...pArgs )
    {
        return varargs( ...pArgs );
    };

    const g = function( ...pArgs )
    {
        return varargs( pArgs );
    };

    test( "varargs converts spread arguments into an array", () =>
    {
        expect( f( "a", "b", "c" ) ).toEqual( ["a", "b", "c"] );
        expect( g( "a", "b", "c" ) ).toEqual( ["a", "b", "c"] );
    } );

    test( "varargs flattens spread arguments if it is a single array", () =>
    {
        expect( f( ["a", "b", "c"] ) ).toEqual( ["a", "b", "c"] );
        expect( g( ["a", "b", "c"] ) ).toEqual( ["a", "b", "c"] );
    } );

    test( "varargs preserves array arguments if there are multiple arguments", () =>
    {
        expect( f( "a", "b", "c", ["a", "b", "c"] ) ).toEqual( ["a", "b", "c", ["a", "b", "c"]] );
        expect( g( "a", "b", "c", ["a", "b", "c"] ) ).toEqual( ["a", "b", "c", ["a", "b", "c"]] );

        expect( f( ["a", "b", "c"], "a", "b", "c" ) ).toEqual( [["a", "b", "c"], "a", "b", "c"] );
        expect( g( ["a", "b", "c"], "a", "b", "c" ) ).toEqual( [["a", "b", "c"], "a", "b", "c"] );
    } );

} );

describe( "unique", () =>
{
    const { unique } = arrayUtils;

    test( "unique array from varargs",
          () =>
          {
              let actual = unique( "a", "b", "a", "c", "d", "b", "c" );

              let expected = ["a", "b", "c", "d"];

              expect( actual ).toEqual( expected );
          } );

    test( "unique array from input",
          () =>
          {
              let actual = unique( ["a", "b", "a", "c", "d", "b", "c"] );

              let expected = ["a", "b", "c", "d"];

              expect( actual ).toEqual( expected );
          } );
} );

test( "Is the exampleArray an Array with at least 1 element",
      () =>
      {
          expect( arrayUtils.isPopulatedArray( exampleArray ) ).toBe( true );
      } );

describe( "isPopulatedArray", () =>
{
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
} );

describe( "arraysEqual", () =>
{
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];

    const arr3 = [1, 2, 3, 4];
    const arr4 = [1, 2, 3, 4];

    const arr5 = [1, "2", 3, 4, 5, null, undefined, "abc ", "xyz", "XYZ"];
    const arr6 = ["abc", "xyz", "XYZ", 1, "2", 3, 4, 5, null, undefined,];
    const arr6L = ["abc", "xyz", "xyz", 1, "2", 3, 4, 5, null, undefined,];

    const arr7 = [1, {}, "2", 3, 4, 5, null, undefined, "abc ", "xyz", "XYZ"];
    const arr8 = ["abc ", "xyz", "XYZ", 1, {}, "2", 3, 4, 5, null, undefined,];

    const arr9 = [1, "2", 3, 4, 5, null, null, undefined, "abc ", "xyz", "XYZ"];
    const arr10 = ["abc ", "xyz", "XYZ", "ABC", 1, {}, "2", 3, 4, 5, null, undefined, null];

    const arr11 = [1, "2", 3, 4, 5, null, null, undefined, "abc ", "xyz", "XYZ", "ABC"];
    const arr12 = ["abc ", "xyz", "XYZ", "ABC", 1, {}, "2", 3, 4, 5, null, undefined, null, "ABC"];

    const arr13 = [15, 16, 17];
    const arr14 = ["0xF", "0x10", "0o21"];

    const arr15 = [17, 16, 15];
    const arr16 = ["0xF", "0x10", "0o21"];

    const arr17 = [15, 16, 17, 1 / 0];
    const arr18 = ["0xF", "0x10", "0o21"];


    test( "arraysEqual - 1",
          () =>
          {
              expect( arraysEqual( arr1, arr2 ) ).toBe( true );
              expect( arraysEqual( arr2, arr3 ) ).toBe( false );

              expect( arraysEqual( arr1, arr2.reverse() ) ).toBe( false );
              expect( arraysEqual( arr1, arr2.reverse(), { ignoreOrder: true } ) ).toBe( true );
          } );

    test( "arraysEqual - convertNumericStrings",
          () =>
          {
              expect( arraysEqual( arr13, arr14, { convertNumericStrings: true } ) ).toBe( true );
              expect( arraysEqual( arr15, arr16, { convertNumericStrings: true } ) ).toBe( false );
              expect( arraysEqual( arr15, arr16, { ignoreOrder: true, convertNumericStrings: true } ) ).toBe( true );

              expect( arraysEqual( arr17, arr18, { convertNumericStrings: true } ) ).toBe( false );
              expect( arraysEqual( arr17, arr18, { convertNumericStrings: true, ignoreNaNs: true } ) ).toBe( true );
          } );

    test( "arraysEqual - 5/6",
          () =>
          {
              expect( arraysEqual( arr5, arr6, { comparator: ( a, b ) => a > b ? 1 : a < b ? -1 : 0 } ) ).toBe( false );
              expect( arraysEqual( arr5, arr6,
                                   {
                                       comparator: ( a, b ) => asString( a ) > asString( b ) ? 1 : asString( a ) < asString( b ) ? -1 : 0,
                                       trim: true
                                   } ) ).toBe( true );

              expect( arraysEqual( arr6, arr6L ) ).toBe( false );
              expect( arraysEqual( arr6, arr6L, { ignoreCase: true } ) ).toBe( true );
          } );

    test( "arraysEqual - 10/12",
          () =>
          {
              expect( arraysEqual( arr10, arr12 ) ).toBe( false );
              expect( arraysEqual( arr10, arr12, { ignoreDuplicates: true } ) ).toBe( true );
          } );
} );

describe( "first/last populated array", () =>
{
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
} );

describe( "calculatedLength", () =>
{
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
} );

describe( "Filters", () =>
{
    test( "The IDENTITY Predicate returns a new array with the same elements",
          () =>
          {
              const arr = ["a", 2, true, "b", 3, 4];

              const filtered = arr.filter( Filters.IDENTITY );

              expect( filtered ).toEqual( arr );

              arr.push( "c", "d", 5 );

              expect( filtered ).not.toEqual( arr );
          } );

    test( "The IS_FILTER Predicate returns an array of filter functions",
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

              const filtered = arr.filter( Filters.IS_FILTER );

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

              const filtered = arr.filter( Filters.IS_COMPARATOR );

              expect( filtered ).toEqual( [f1, f2] );
          } );

    test( "The IS_DEFINED Predicate returns a new array without undefined elements",
          () =>
          {
              const arr = new Array( 5 );

              arr[0] = "a";
              arr[2] = "b";
              arr[4] = "c";

              const filtered = arr.filter( Filters.IS_DEFINED );

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

              const filtered = arr.filter( Filters.IS_DEFINED );

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

              const filtered = arr.filter( Filters.IS_NOT_NULL );

              expect( filtered ).toEqual( ["a", "b", "c"] );

              expect( filtered?.length ).toEqual( 3 );
          } );

    test( "The makeTypeFilter Predicate FUNCTION returns a filter to retain only elements of a specific type",
          () =>
          {
              const arr = ["a", 1, true, "b", {}, ["a", "b"]];

              const filtered = arr.filter( Filters.makeTypeFilter( "string", "boolean" ) );

              expect( filtered ).toEqual( ["a", true, "b"] );
          } );

    test( "The makeMatchesAllFilter Predicate FUNCTION returns a filter to retain only elements that match all of the filters specified",
          () =>
          {
              const arr = ["a", 1, true, "b", {}, ["a", "b"]];

              const filter1 = e => "string" === typeof e;
              const filter2 = e => e > "a";

              const filtered = arr.filter( Filters.makeMatchesAllFilter( filter1, filter2 ) );

              expect( filtered ).toEqual( ["b"] );
          } );

    test( "The makeMatchesAnyFilter Predicate FUNCTION returns a filter to retain elements that match ANY of the filters specified",
          () =>
          {
              const arr = ["a", 1, true, "b", {}, ["a", "b"]];

              const filter1 = e => "string" === typeof e;
              const filter2 = e => "object" === typeof e;

              const filtered = arr.filter( Filters.makeMatchesAnyFilter( filter1, filter2 ) );

              expect( filtered ).toEqual( ["a", "b", {}, ["a", "b"]] );
          } );

    test( "The makeMatchesNoneFilter Predicate FUNCTION returns a filter to retain only elements that DO NOT match ANY of the filters specified",
          () =>
          {
              const arr = ["a", "b", "c", 1, 2, 3, {}, [1, 2, 3]];

              const filter1 = e => "number" === typeof e;
              const filter2 = e => Array.isArray( e );

              const filtered = arr.filter( Filters.makeMatchesNoneFilter( filter1, filter2 ) );

              expect( filtered ).toEqual( ["a", "b", "c", {}] );
          } );

    test( "The makeMatchesNPlusFilter Predicate FUNCTION returns a filter to retain only elements that match the specified number of the filters specified or more",
          () =>
          {
              const arr = ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}, ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}]];

              const filter1 = e => "string" === typeof e;
              const filter2 = e => e?.length > 1;
              const filter3 = e => "number" === typeof e;
              const filter4 = e => e > 10;

              const filtered = arr.filter( Filters.makeMatchesNPlusFilter( 2, filter1, filter2, filter3, filter4 ) );

              expect( filtered ).toEqual( ["ab", "abc", "bc", 11, 22, 33] );
          } );

    test( "The makeMatchesExactlyNFilter Predicate FUNCTION returns a filter to retain only elements that match exactly the specified number of the filters specified",
          () =>
          {
              const arr = ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}, ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}]];

              const filter1 = e => "string" === typeof e;
              const filter2 = e => e?.length > 1;
              const filter3 = e => "number" === typeof e;
              const filter4 = e => e > 10;
              const filter5 = e => Array.isArray( e );

              const filtered = arr.filter( Filters.makeMatchesExactlyNFilter( 1, filter1, filter2, filter3, filter4, filter5 ) );

              expect( filtered ).toEqual( ["a", "b", "c", 1, 2, 3] );
          } );

    test( "The makeMatchesLessThanNFilter Predicate FUNCTION returns a filter to retain only elements that match less than the specified number of the filters specified",
          () =>
          {
              const arr = ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}, ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}]];

              const filter1 = e => "string" === typeof e;
              const filter2 = e => e?.length > 1;
              const filter3 = e => "number" === typeof e;
              const filter4 = e => e > 10;

              const filtered = arr.filter( Filters.makeMatchesLessThanNFilter( 2, filter1, filter2, filter3, filter4 ) );

              expect( filtered ).toEqual( ["a", "b", "c", 1, 2, 3, {}, ["a", "ab", "abc", "b", "bc", "c", 1, 2, 3, 11, 22, 33, {}]] );
          } );

    test( "The IS_POPULATED_ARRAY Predicate returns true if the specified value is an array with at least 1 'truthy' element",
          () =>
          {
              const arr = [];
              expect( arr.filter( Filters.IS_POPULATED_ARRAY ) ).toEqual( [] );
          } );


    test( "The IS_POPULATED_ARRAY Predicate returns true if the specified value is an array with at least 1 'truthy' element",
          () =>
          {
              const arr = [{}, null, undefined];
              expect( arr.filter( Filters.IS_POPULATED_ARRAY ) ).toEqual( [] );
          } );


    test( "The IS_POPULATED_ARRAY Predicate returns true if the specified value is an array with at least 1 'truthy' element",
          () =>
          {
              const arr = [{}, [2], false];
              expect( arr.filter( Filters.IS_POPULATED_ARRAY ) ).toEqual( [[2]] );
          } );

    test( "The IS_POPULATED_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
          () =>
          {
              const arr = [{}];
              expect( arr.filter( Filters.IS_POPULATED_OBJECT ) ).toEqual( [] );
          } );

    test( "The IS_POPULATED_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
          () =>
          {
              const arr = [{ a: "" }];
              expect( arr.filter( Filters.IS_POPULATED_OBJECT ) ).toEqual( [{ a: "" }] );
          } );


    test( "The IS_POPULATED_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
          () =>
          {
              const arr = [[1]];
              expect( arr.filter( Filters.IS_POPULATED_OBJECT ) ).toEqual( [[1]] );
          } );

    test( "The IS_POPULATED_NON_ARRAY_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
          () =>
          {
              const arr = [{}];
              expect( arr.filter( Filters.IS_POPULATED_NON_ARRAY_OBJECT ) ).toEqual( [] );
          } );

    test( "The IS_POPULATED_NON_ARRAY_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
          () =>
          {
              const arr = [{ a: "" }];
              expect( arr.filter( Filters.IS_POPULATED_NON_ARRAY_OBJECT ) ).toEqual( [{ a: "" }] );
          } );

    test( "The IS_POPULATED_NON_ARRAY_OBJECT Predicate returns true if the specified value is an Object with at least 1 property",
          () =>
          {
              const arr = [[1]];
              expect( arr.filter( Filters.IS_POPULATED_NON_ARRAY_OBJECT ) ).toEqual( [] );
          } );

    test( "The IS_VALID_NUMBER Predicate returns true if the specified value is a number that is not NaN and is finite",
          () =>
          {
              const arr = [1, 2];
              expect( arr.filter( Filters.IS_VALID_NUMBER ) ).toEqual( [1, 2] );
          } );


    test( "The IS_VALID_NUMBER Predicate returns true if the specified value is a number that is not NaN and is finite",
          () =>
          {
              const arr = [1, 2, "a", true];
              expect( arr.filter( Filters.IS_VALID_NUMBER ) ).toEqual( [1, 2] );
          } );


    test( "The IS_VALID_NUMBER Predicate returns true if the specified value is a number that is not NaN and is finite",
          () =>
          {
              const arr = [1, 2, 1 / 0];
              expect( arr.filter( Filters.IS_VALID_NUMBER ) ).toEqual( [1, 2] );
          } );


    test( "The NON_EMPTY Predicate returns true if the specified value is a number that is not NaN and is finite",
          () =>
          {
              const arr = [1, 2, {}, "abc", [], ""];
              expect( arr.filter( Filters.NON_EMPTY ) ).toEqual( [1, 2, "abc"] );
          } );

    test( "The NON_BLANK Predicate is used to return an array with only non-empty strings that are not composed entirely of whitespace",
          () =>
          {
              const arr = ["", "abc", "def".replace( /\w/g, "" ), " ", "\t"];
              expect( arr.filter( Filters.NON_BLANK ) ).toEqual( ["abc"] );
          } );

    test( "The makeMatchesRexExpFilter Predicate FUNCTION returns a filter to retain only elements that satisfy the regular expression",
          () =>
          {
              const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];

              const filtered = arr.filter( Filters.makeMatchesRexExpFilter( /[A-Z]/ ) );

              expect( filtered ).toEqual( ["ABC"] );
          } );

    test( "The makeMatchesRexExpFilter Predicate FUNCTION returns a filter to retain only elements that satisfy the regular expression",
          () =>
          {
              const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];

              const filtered = arr.filter( Filters.makeMatchesRexExpFilter( /\w/ ) );

              expect( filtered ).toEqual( ["abc", "def", "ghi", "ABC"] );
          } );

    test( "The NOT_IN Predicate FUNCTION returns a filter to retain only elements that do not also appear in the other array",
          () =>
          {
              const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
              const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abc" }, "ABC"];

              const filtered = arr.filter( Filters.NOT_IN( arr2 ) );

              expect( filtered ).toEqual( ["ghi"] );
          } );

    test( "The NOT_IN Predicate FUNCTION returns a filter to retain only elements that do not also appear in the other array",
          () =>
          {
              const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
              const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abcd" }, "ABC"];

              const filtered = arr.filter( Filters.NOT_IN( arr2 ) );

              expect( filtered ).toEqual( ["ghi", { a: "abc" }] );
          } );


    test( "The IN Predicate FUNCTION returns a filter to retain only elements that do also appear in the other array",
          () =>
          {
              const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
              const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abc" }, "ABC", 7, {}];

              const filtered = arr.filter( Filters.IN( arr2 ) );

              expect( filtered ).toEqual( ["abc", "def", 2, true, ["abc"], { a: "abc" }, "ABC"] );
          } );

    test( "The IN Predicate FUNCTION returns a filter to retain only elements that also appear in the other array",
          () =>
          {
              const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
              const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abcd" }, "ABC"];

              const filtered = arr.filter( Filters.IN( arr2 ) );

              expect( filtered ).toEqual( ["abc", "def", 2, true, ["abc"], "ABC"] );
          } );


    test( "The NOT_IN Predicate FUNCTION returns a filter to retain only elements that do not also appear in the other array",
          () =>
          {
              const arr = ["abc", "def", "ghi", 2, true, ["abc"], { a: "abc" }, "ABC"];
              const arr2 = ["abc", "def", 2, true, ["abc"], { a: "abc" }, "ABC"];

              const filtered = arr.filter( Filters.NOT_IN( arr2 ) );

              expect( filtered ).toEqual( ["ghi"] );
          } );

    test( "The STARTS_WITH Predicate FUNCTION returns a filter to retain only elements that, _as strings_, each begin with one or more of the prefixes specified in the input array ",
          () =>
          {
              const arr = ["abc", "abcd", "bcd", 2, true, ["abc"], { a: "abc" }, "ABC"];
              const arr2 = ["ab"];

              const filtered = arr.filter( Filters.STARTS_WITH( arr2 ) );

              expect( filtered ).toEqual( ["abc", "abcd", ["abc"]] );
          } );

    test( "The STARTS_WITH Predicate FUNCTION returns a filter to retain only elements that, _as strings_, each begin with one or more of the prefixes specified in the input array ",
          () =>
          {
              const arr = ["abc", "abcd", "bcd", 2, true, ["abc"], { a: "abc" }, "ABC"];
              const arr2 = ["ab", "AB"];

              const filtered = arr.filter( Filters.STARTS_WITH( arr2 ) );

              expect( filtered ).toEqual( ["abc", "abcd", ["abc"], "ABC"] );
          } );

    test( "The ENDS_WITH Predicate FUNCTION returns a filter to retain only elements that, _as strings_, each end with one or more of the suffixes specified in the input array ",
          () =>
          {
              const arr = ["abc", "abcd", "bcd", 2, true, ["abc"], { a: "abc" }, "ABCD"];
              const arr2 = ["cd"];

              const filtered = arr.filter( Filters.ENDS_WITH( arr2 ) );

              expect( filtered ).toEqual( ["abcd", "bcd"] );
          } );

    test( "The ENDS_WITH Predicate FUNCTION returns a filter to retain only elements that, _as strings_, each end with one or more of the suffixes specified in the input array ",
          () =>
          {
              const arr = ["abc", "abcd", "bcd", 2, true, ["abc"], { a: "abc" }, "ABCD"];
              const arr2 = ["cd", "CD"];

              const filtered = arr.filter( Filters.ENDS_WITH( arr2 ) );

              expect( filtered ).toEqual( ["abcd", "bcd", "ABCD"] );
          } );

    test( "The chain Predicate FUNCTION returns a filter to retain only elements that match all of the filters specified",
          () =>
          {
              const arr = ["a", 1, true, "b", {}, ["a", "b"]];

              const filter1 = e => "string" === typeof e;
              const filter2 = e => e > "a";

              const filtered = arr.filter( Filters.chain( filter1, filter2 ) );

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
} );

/*****   MAPPERS    ************/
describe( "Mappers", () =>
{
    test( "The Mappers.IDENTITY function simply returns a new array with the same elements as the source array",
          () =>
          {
              const arr = ["a", 1, true, "b", {}, ["a", "b"], function( a, b ) {}];

              let expected = ["a", 1, true, "b", {}, ["a", "b"], function( a, b ) {}];

              expect( arraysEqual( expected, arr.map( arrayUtils.Mappers.IDENTITY ) ) ).toBe( true );
          } );

    test( "The Mappers.TO_STRING function returns a new array with each element converted to a string",
          () =>
          {
              const arr = ["a", 1, true, "b", {}, ["a", "b"], function( a, b ) {}];

              const expected = ["a", "1", "true", "b", "{}", "ab", ""];

              const actual = arr.map( arrayUtils.Mappers.TO_STRING );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Mappers.TO_STRING_WITH_OPTIONS function returns a function that is used to return a new array with each element converted to a string",
          () =>
          {
              const opts =
                  {
                      omitFunctions: true,
                      executeFunctions: false,
                      joinOn: ",",
                      jsonify: JSON.stringify,
                      removeLeadingZeroes: true,
                      assumeNumeric: false,
                      assumeAlphabetic: true,
                      dateFormatter: null
                  };

              const arr = ["a", 1, true, "b", {}, ["a", "b"], function( a, b ) {}];

              const expected = ["a", "1", "true", "b", "{}", "a,b", ""];

              const actual = arr.map( arrayUtils.Mappers.TO_STRING_WITH_OPTIONS( opts ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.TO_STRING_WITH_OPTIONS with options to include functions",
          () =>
          {
              const opts =
                  {
                      omitFunctions: false,
                      executeFunctions: false,
                      joinOn: ",",
                      jsonify: JSON.stringify,
                      removeLeadingZeroes: true,
                      assumeNumeric: false,
                      assumeAlphabetic: true,
                      dateFormatter: null
                  };

              const arr = ["a", 1, true, "b", {}, ["a", "b"], function( a, b ) {}];

              const expected = ["a", "1", "true", "b", "{}", "a,b", "Function"];

              const actual = arr.map( arrayUtils.Mappers.TO_STRING_WITH_OPTIONS( opts ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.TO_STRING_WITH_OPTIONS with options to execute functions",
          () =>
          {
              const opts =
                  {
                      omitFunctions: false,
                      executeFunctions: true,
                      joinOn: ",",
                      jsonify: JSON.stringify,
                      removeLeadingZeroes: true,
                      assumeNumeric: false,
                      assumeAlphabetic: true,
                      dateFormatter: null
                  };

              const arr = ["a", 1, true, "b", {}, ["a", "b"], function() { return "xyz"; }];

              const expected = ["a", "1", "true", "b", "{}", "a,b", "xyz"];

              const actual = arr.map( arrayUtils.Mappers.TO_STRING_WITH_OPTIONS( opts ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.TO_STRING_WITH_OPTIONS with options to include a date formatter",
          () =>
          {
              const opts =
                  {
                      omitFunctions: true,
                      executeFunctions: false,
                      joinOn: "~",
                      jsonify: JSON.stringify,
                      removeLeadingZeroes: true,
                      assumeNumeric: false,
                      assumeAlphabetic: true,
                      dateFormatter: function( pDate )
                      {
                          const date = (pDate instanceof Date) ? pDate : new Date( pDate );

                          let fullYear = date.getFullYear();
                          let month = stringUtils.asString( date.getMonth() + 1 ).padStart( 2, "0" );
                          let day = stringUtils.asString( date.getDate() ).padStart( 2, "0" );

                          return month + "/" + day + "/" + fullYear;
                      }
                  };

              let date = new Date( 1727114146310 ); // 09/23/2024

              const arr = ["a", 1, true, "b", {}, ["a", "b"], date];

              const expected = ["a", "1", "true", "b", "{}", "a~b", "09/23/2024"];

              const actual = arr.map( arrayUtils.Mappers.TO_STRING_WITH_OPTIONS( opts ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.TO_NUMBER function returns a new array with each element converted to a number",
          () =>
          {
              const arr = ["a", 1, true, "b", {}, ["a", "b"], function( a, b ) {}, "007", "3", "0xFFF", "0o17", NaN];

              const expected = [0, 1, 1, 0, 0, 0, 0, 7, 3, 4095, 15, NaN];

              const actual = arr.map( arrayUtils.Mappers.TO_NUMBER );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.TO_VALID_NUMBER function returns a new array with each element that can be converted to a number converted to a number",
          () =>
          {
              const arr = ["a", 1, true, "b", {}, ["a", "b"], function( a, b ) {}, "007", "3", "0xFFF", "0o17", NaN];

              const expected = [0, 1, 1, 0, 0, 0, 0, 7, 3, 4095, 15, 0];

              const actual = arr.map( arrayUtils.Mappers.TO_VALID_NUMBER );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Mappers.TRIMMED function returns a new array with each element converted to a string without leading or trailing whitespace",
          () =>
          {
              const arr = [" a ", 1, true, "abc ", {}, ["a", "b", "cde "], function() { return " xyz "; }, NaN];

              const expected = ["a", "1", "true", "abc", "{}", "abcde", "", "0"];

              const actual = arr.map( arrayUtils.Mappers.TRIMMED );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.APPEND function returns a function to return a new array with each element converted to a string with the specified value appended",
          () =>
          {
              const arr = [" a ", 1, true, "abc ", {}, ["a", "b", "cde "], function() { return " xyz "; }, NaN];

              const expected = [" a foo", "1foo", "truefoo", "abc foo", "{}foo", "abcde foo", "foo", "0foo"];

              const actual = arr.map( arrayUtils.Mappers.APPEND( "foo" ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Mappers.PREPEND function returns a function to return a new array with each element converted to a string with the specified value prepended",
          () =>
          {
              const arr = [" a ", 1, true, "abc ", {}, ["a", "b", "cde "], function() { return " xyz "; }, NaN];

              const expected = ["bar a ", "bar1", "bartrue", "barabc ", "bar{}", "barabcde ", "bar", "bar0"];

              const actual = arr.map( arrayUtils.Mappers.PREPEND( "bar" ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Mappers.REPLACE function returns a function to return a new array with each element converted to a string with the specified value replaced",
          () =>
          {
              const arr = [" a ", 1, true, "abc ", {}, ["a", "b", "cde "], function() { return " xyz "; }, NaN];

              const expected = [" ** ", "1", "true", "**bc ", "{}", "**bcde ", "", "0"];

              const actual = arr.map( arrayUtils.Mappers.REPLACE( /a/g, "**" ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.TO_LOWERCASE returns a new array with each element converted to a lowercase string",
          () =>
          {
              const arr = [];

              const expected = [];

              const actual = arr.map( arrayUtils.Mappers.TO_LOWERCASE );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.TO_LOWERCASE returns a new array with each element converted to a lowercase string",
          () =>
          {
              const arr = ["AbC", "abc", "dEf", 1, true];

              const expected = ["abc", "abc", "def", "1", "true"];

              const actual = arr.map( arrayUtils.Mappers.TO_LOWERCASE );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.TO_UPPERCASE returns a new array with each element converted to an UPPERCASE string",
          () =>
          {
              const arr = ["AbC", "abc", "dEf", 1, true];

              const expected = ["ABC", "ABC", "DEF", "1", "TRUE"];

              const actual = arr.map( arrayUtils.Mappers.TO_UPPERCASE );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Mappers.chain function returns a function that maps each element of the array as per the provided mappers",
          () =>
          {
              const arr = [" AbC ", "def", 12, true, " xYz "];

              const expected = ["abc", "def", "12", "true", "xyz"];

              const actual = arr.map( arrayUtils.Mappers.chain( arrayUtils.Mappers.TO_STRING, arrayUtils.Mappers.TRIMMED, arrayUtils.Mappers.TO_LOWERCASE ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );
} );

/*****   COMPARATORS    ************/
describe( "Comparators", () =>
{
    test( "The Comparator._compare function is a #private# function to compare 2 comparable values",
          () =>
          {
              const arr = [4, 2, 5, 3, 1, 7];

              const expected = [1, 2, 3, 4, 5, 7];

              const actual = arr.sort( arrayUtils.Comparators._compare );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Comparator.NONE function is a comparison function that leaves the array in the same order",
          () =>
          {
              const arr = [4, 2, 5, 3, 1, 7];

              const expected = [4, 2, 5, 3, 1, 7];

              const actual = arr.sort( arrayUtils.Comparators.NONE );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Comparator.CREATE_DEFAULT function returns a comparison function that orders the array elements according the specified type",
          () =>
          {
              const arr = [1, 2, 3, 4, 11, 22, 12, 13, 33, 34, 35];

              const expected = [1, 2, 3, 4, 11, 12, 13, 22, 33, 34, 35];

              const actual = arr.sort( arrayUtils.Comparators.CREATE_DEFAULT( "number" ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Comparator.CREATE_DEFAULT function returns a comparison function that orders the array elements as strings",
          () =>
          {
              const arr = [1, 2, 3, 4, 11, 22, 12, 13, 33, 34, 35];

              const expected = ["1", "11", "12", "13", "2", "22", "3", "33", "34", "35", "4"];

              const actual = arr.sort( arrayUtils.Comparators.CREATE_DEFAULT( "string" ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Comparator.BY_STRING_VALUE is a comparison function that converts elements to strings prior to ordering the array",
          () =>
          {
              const arr = [1, 2, 3, 4, 11, 22, 12, 13, 33, 34, 35];

              const expected = ["1", "11", "12", "13", "2", "22", "3", "33", "34", "35", "4"];

              const actual = arr.sort( arrayUtils.Comparators.BY_STRING_VALUE );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Comparator.BY_LENGTH is a comparison function that orders the array elements according the length of their string representation",
          () =>
          {
              const arr = ["some", "random", "elements", 2, true, {}, "that", "can", "be", "ordered by length"];

              const expected = [2, "be", "can", "some", true, "that", "random", "elements", {}, "ordered by length"];

              const actual = arr.sort( arrayUtils.Comparators.BY_LENGTH );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "The Comparator.BY_POSITION is function that returns a comparison function that orders the array elements according their position in the reference array",
          () =>
          {
              const arr = ["a", "b", "c", "d", "e", "f"];

              const ref = ["d", "e", "f", "a", "b", "c"];

              const expected = ["d", "e", "f", "a", "b", "c"];

              const actual = arr.sort( arrayUtils.Comparators.BY_POSITION( ref ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "The Comparator.chain is a function that returns a comparison function composed of the specified comparators",
          () =>
          {
              const arr = ["abc", "abc", "abc", "abcd", "abcd", "def", "def", "Def", "ABC"];

              const expected = ["ABC", "Def", "abc", "abc", "abc", "def", "def", "abcd", "abcd"];

              const actual = arr.sort( arrayUtils.Comparators.chain( arrayUtils.Comparators.BY_LENGTH, arrayUtils.Comparators.BY_STRING_VALUE ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "Comparator.chain is a function that returns a comparison function composed of the specified comparators executed in order",
          () =>
          {
              const arr = ["abc", "abc", "abc", "abcd", "abcd", "def", "def", "Def", "ABC"];

              const expected = ["ABC", "Def", "abc", "abc", "abc", "abcd", "abcd", "def", "def"];

              const actual = arr.sort( arrayUtils.Comparators.chain( arrayUtils.Comparators.BY_STRING_VALUE, arrayUtils.Comparators.BY_LENGTH ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "Comparator.descending is a function that wraps any comparison function to reverse the order",
          () =>
          {
              const arr = ["abc", "abc", "abc", "abcd", "abcd", "def", "def", "Def", "ABC"];

              const expected = ["def", "def", "abcd", "abcd", "abc", "abc", "abc", "Def", "ABC"];

              const actual = arr.sort( arrayUtils.Comparators.descending( arrayUtils.Comparators.chain( arrayUtils.Comparators.BY_STRING_VALUE, arrayUtils.Comparators.BY_LENGTH ) ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );


    test( "Comparator.descending is a function that wraps any comparison function to reverse the order",
          () =>
          {
              const arr = ["abc", "abc", "abc", "abcd", "abcd", "def", "def", "Def", "ABC"];

              const expected = ["def", "def", "abcd", "abcd", "abc", "abc", "abc", "Def", "ABC"];

              const actual = arr.sort( arrayUtils.Comparators.chain( arrayUtils.Comparators.descending( arrayUtils.Comparators.BY_STRING_VALUE ), arrayUtils.Comparators.descending( arrayUtils.Comparators.BY_LENGTH ) ) );

              expect( arraysEqual( expected, actual ) ).toBe( true );
          } );

    test( "Comparator.isComparator returns true if the specified value is a function that takes 2 arguments",
          () =>
          {
              expect( arrayUtils.Comparators.isComparator( arrayUtils.Comparators.BY_LENGTH ) ).toBe( true );
          } );

    test( "Comparator.isComparator returns false if the specified value is not a function that takes 2 arguments",
          () =>
          {
              expect( arrayUtils.Comparators.isComparator( Filters.IS_OBJECT ) ).toBe( false );
          } );

    test( "Comparator.isComparator returns false if the specified value is not a function",
          () =>
          {
              expect( arrayUtils.Comparators.isComparator( "abc" ) ).toBe( false );
          } );
} );

describe( "Transformers", () =>
{
    const {
        Transformer,
        TRANSFORMATIONS,
        TransformerChain,
        toNonEmptyStrings,
        toNonBlankStrings,
        toTrimmedNonEmptyStrings,
        toTrimmedNonBlankStrings
    } = arrayUtils;

    test( "Transformers are objects that can be used to manipulate collections",
          () =>
          {
              let transformer = new Transformer( TRANSFORMATIONS.MAP, e => stringUtils.asString( e, true ) );

              const arr = [1, true, "abc ", " xyz"];

              const arr2 = transformer.transform( arr );

              expect( arr2 ).toEqual( ["1", "true", "abc", "xyz"] );
          } );

    test( "Transformers can be chained",
          () =>
          {
              let mapper = new Transformer( TRANSFORMATIONS.MAP, e => stringUtils.asString( e, true ) );

              let mapper2 = new Transformer( TRANSFORMATIONS.MAP, e => stringUtils.ucase( e ) );

              let filter = new Transformer( TRANSFORMATIONS.FILTER, e => e?.length > 1 );

              let comparator = new Transformer( TRANSFORMATIONS.SORT, ( a, b ) => a > b ? 1 : a < b ? -1 : 0 );

              let transformerChain = new TransformerChain( mapper, mapper2, filter, comparator );

              const arr = [1, true, "abc ", " xyz"];

              const arr2 = transformerChain.transform( arr );

              expect( arr2 ).toEqual( ["ABC", "TRUE", "XYZ"] );
          } );

    test( "toNonEmptyStrings maps and filters an array",
          () =>
          {
              let arr = [2, "", " ", "abc ", {}, null, false, 0xFF, /\s/g, function funk() {}, "def"];

              let transformed = toNonEmptyStrings( arr );

              expect( transformed?.length ).toEqual( 7 );

              expect( transformed ).toEqual( ["2", " ", "abc ", "false", "255", "/\\s/g", "def"] );

              arr[4] = { a: 1 };

              transformed = toNonEmptyStrings( arr );

              expect( transformed?.length ).toEqual( 8 );

              expect( transformed ).toEqual( ["2", " ", "abc ", "{\"a\":1}", "false", "255", "/\\s/g", "def"] );

          } );

    test( "toNonBlankStrings maps and filters an array",
          () =>
          {
              let arr = [2, "", " ", "abc ", {}, null, false, 0xFF, /\s/g, function funk() {}, "def"];

              let transformed = toNonBlankStrings( arr );

              expect( transformed?.length ).toEqual( 6 );

              expect( transformed ).toEqual( ["2", "abc ", "false", "255", "/\\s/g", "def"] );

              arr[4] = { a: 1 };

              transformed = toNonBlankStrings( arr );

              expect( transformed?.length ).toEqual( 7 );

              expect( transformed ).toEqual( ["2", "abc ", "{\"a\":1}", "false", "255", "/\\s/g", "def"] );

          } );

    test( "toTrimmedNonEmptyStrings maps and filters an array",
          () =>
          {
              let arr = [2, "", " ", "abc ", {}, null, false, 0xFF, /\s/g, function funk() {}, "def"];

              let transformed = toTrimmedNonEmptyStrings( arr );

              expect( transformed?.length ).toEqual( 6 );

              expect( transformed ).toEqual( ["2", "abc", "false", "255", "/\\s/g", "def"] );

              arr[4] = { a: 1 };

              transformed = toTrimmedNonEmptyStrings( arr );

              expect( transformed?.length ).toEqual( 7 );

              expect( transformed ).toEqual( ["2", "abc", "{\"a\":1}", "false", "255", "/\\s/g", "def"] );

          } );

    test( "toTrimmedNonBlankStrings maps and filters an array",
          () =>
          {
              let arr = [2, "", " ", "abc ", {}, null, false, 0xFF, /\s/g, function funk() {}, "def"];

              let transformed = toTrimmedNonBlankStrings( arr );

              expect( transformed?.length ).toEqual( 6 );

              expect( transformed ).toEqual( ["2", "abc", "false", "255", "/\\s/g", "def"] );

              arr[4] = { a: 1 };

              transformed = toTrimmedNonBlankStrings( arr );

              expect( transformed?.length ).toEqual( 7 );

              expect( transformed ).toEqual( ["2", "abc", "{\"a\":1}", "false", "255", "/\\s/g", "def"] );

          } );

    test( "TransformerChain.SPLIT_ON_DOT returns a flattened array of values",
          () =>
          {
              let arr = ["a", "b.c", "d.e.f", "g", ["h.i", "j"]];

              let transformed = TransformerChain.SPLIT_ON_DOT.transform( arr );

              expect( transformed.length ).toEqual( 10 );

              expect( transformed ).toEqual( ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] );

          } );
} );

describe( "pruneArray", () =>
{
    test( "pruneArray removes empty strings",
          () =>
          {
              const arr = ["", "abc", " "];

              expect( arrayUtils.pruneArray( arr ) ).toEqual( ["abc", " "] );
          } );

    test( "pruneArray removes null and undefined elements as well as invalid numbers",
          () =>
          {
              const arr = ["", "abc", " ", null, undefined, 1 / 0];

              expect( arrayUtils.pruneArray( arr ) ).toEqual( ["abc", " "] );
          } );

    test( "pruneArray removes null and undefined elements as well as invalid numbers",
          () =>
          {
              const arr = ["", "abc", " ", null, undefined, 1 / 0];

              expect( arrayUtils.pruneArray( arr ) ).toEqual( ["abc", " "] );
          } );

    test( "pruneArray removes null and undefined elements and elements of specified types",
          () =>
          {
              const arr = ["", "abc", " ", null, undefined, 1 / 0, true, false];

              expect( arrayUtils.pruneArray( arr, false, "boolean" ) ).toEqual( ["abc", " ", Number.POSITIVE_INFINITY] );
          } );
} );

// The following classes and object are used in the tests for comparators and the top-level sortArray function

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

        return this.age > pOther?.age ? 1 : pOther?.age > this.age ? -1 : 0;
    }
}

describe( "sortArray", () =>
{
    test( "sortArray can take a comparator",
          () =>
          {
              const arr = [1, 2, 3, 11, 12, 22, 23, 33, 4];

              expect( arrayUtils.sortArray( arr, arrayUtils.Comparators.BY_STRING_VALUE ) ).toEqual( [1, 11, 12, 2, 22, 23, 3, 33, 4] );
          } );

    test( "sortArray can take a property name",
          () =>
          {
              let stewart = new Person( "Copeland", "Stewart", "61", "Brown" );
              let danny = new Person( "Carry", "Danny", "52", "Brown" );
              let charlie = new Person( "Watts", "Charlie", "88", "Brown" );
              let ginger = new Person( "Baker", "Ginger", "73", "Green" );

              const arr = [charlie, stewart, danny, ginger];

              expect( arrayUtils.sortArray( arr, "lastName" ) ).toEqual( [ginger, danny, stewart, charlie] );
          } );

    test( "sortArray can use 'compareTo'",
          () =>
          {
              let stewart = new Person( "Copeland", "Stewart", "61", "Brown" );
              let danny = new Person( "Carry", "Danny", "52", "Brown" );
              let charlie = new Person( "Watts", "Charlie", "88", "Brown" );
              let ginger = new Person( "Baker", "Ginger", "73", "Green" );

              const arr = [charlie, stewart, danny, ginger];

              expect( arrayUtils.sortArray( arr, true ) ).toEqual( [danny, stewart, ginger, charlie] );
          } );
} );

describe( "hasElements", () =>
{
    test( "hasElements returns true if the array has at least 1 element",
          () =>
          {
              const arr = [];

              expect( arrayUtils.hasElements( arr ) ).toBe( false );
          } );

    test( "hasElements(array, 2) returns true if the array has at least 2 elements",
          () =>
          {
              const arr = [1];

              expect( arrayUtils.hasElements( arr, 2 ) ).toBe( false );
          } );

    test( "hasElements(array, 2) returns true if the array has at least 2 elements",
          () =>
          {
              const arr = [1, 2];

              expect( arrayUtils.hasElements( arr, 2 ) ).toBe( true );
          } );
} );

describe( "isEmptyArray", () =>
{
    test( "isEmptyArray returns false if the array has any elements",
          () =>
          {
              const arr = [1, 2];

              expect( arrayUtils.isEmptyArray( arr ) ).toBe( false );
          } );

    test( "isEmptyArray returns true if the array has no elements",
          () =>
          {
              const arr = [];

              expect( arrayUtils.isEmptyArray( arr ) ).toBe( true );
          } );
} );

describe( "array length functions", () =>
{
    test( "arrLength returns the length of the array or 0 if the value is not an array",
          () =>
          {
              const arr = [1, 2];

              expect( arrayUtils.arrLength( arr ) ).toEqual( 2 );
          } );

    test( "arrLength returns 0 if the value is not an array",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLength( arr ) ).toEqual( 0 );
          } );

    test( "arrLength returns the length of an array-like value",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLength( arr, true ) ).toEqual( 3 );
          } );

///
    test( "arrLenGt returns true if the length of the array is greater than n",
          () =>
          {
              const arr = [1, 2];

              expect( arrayUtils.arrLenGt( arr, 1 ) ).toBe( true );
          } );

    test( "arrLenGt returns false if the value is not an array",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLenGt( arr, 1 ) ).toBe( false );
          } );

    test( "arrLenGt returns true if the length of an array-like value is greater than n",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLenGt( arr, 2, true ) ).toBe( true );
          } );
///
    test( "arrLenGtEq returns true if the length of the array is greater than or equal to n",
          () =>
          {
              const arr = [1, 2];

              expect( arrayUtils.arrLenGtEq( arr, 2 ) ).toBe( true );
          } );

    test( "arrLenGtEq returns false if the value is not an array",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLenGtEq( arr, 1 ) ).toBe( false );
          } );

    test( "arrLenGtEq returns true if the length of an array-like value is greater than or equal to n",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLenGtEq( arr, 2, true ) ).toBe( true );
          } );

///
    test( "arrLenLt returns true if the length of the array is less than n",
          () =>
          {
              const arr = [1, 2];

              expect( arrayUtils.arrLenLt( arr, 3 ) ).toBe( true );
          } );

    test( "arrLenLt returns true if the value is not an array",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLenLt( arr, 4 ) ).toBe( true );
          } );

    test( "arrLenLt returns true if the length of an array-like value is less than n",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLenLt( arr, 4, true ) ).toBe( true );
          } );
///
    test( "arrLenLtEq returns true if the length of the array is less than or equal to n",
          () =>
          {
              const arr = [1, 2];

              expect( arrayUtils.arrLenLtEq( arr, 2 ) ).toBe( true );
          } );

    test( "arrLenLtEq returns true if the value is not an array",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLenLtEq( arr, 1 ) ).toBe( true );
          } );

    test( "arrLenLtEq returns true if the length of an array-like value is less than or equal to n",
          () =>
          {
              const arr = "abc";

              expect( arrayUtils.arrLenLtEq( arr, 3, true ) ).toBe( true );
          } );
} );


describe( "toPercentages", () =>
{
    test( "toPercentages returns an array whose values are the percentage of the original array's total",
          () =>
          {
              let arr = [10, 20, 30, 40];

              /*
               let total = arr.reduce( ( p, c ) => p + c, 0 );

               let arr2 = arr.map( ( e ) => e / total );
               */

              expect( toPercentages( arr ) ).toEqual( [10, 20, 30, 40] );

              expect( toPercentages( arr, { asDecimal: true } ) ).toEqual( [0.1, 0.2, 0.3, 0.4] );

          } );

    test( "toPercentages ignores non-numeric values",
          () =>
          {
              let arr = [10, 20, "abc", 30, 40, 1 / 0];

              expect( toPercentages( arr ) ).toEqual( [10, 20, 30, 40] );

              expect( toPercentages( arr, { asDecimal: true } ) ).toEqual( [0.1, 0.2, 0.3, 0.4] );

          } );

    test( "toPercentages is idempotent",
          () =>
          {
              let arr = [10, 20, "abc", 30, 40, 1 / 0];

              arr = toPercentages( arr );
              arr = toPercentages( arr );
              arr = toPercentages( arr );
              arr = toPercentages( arr );

              expect( toPercentages( arr ) ).toEqual( [10, 20, 30, 40] );

              arr = toPercentages( arr );
              arr = toPercentages( arr );
              arr = toPercentages( arr );
              arr = toPercentages( arr );

              expect( toPercentages( arr ) ).toEqual( [10, 20, 30, 40] );

              expect( toPercentages( arr, { asDecimal: true } ) ).toEqual( [0.1, 0.2, 0.3, 0.4] );

          } );
} );

describe( "copyArray (deep clone)", () =>
{
    test( "copyArray returns a new array equal to, but not identical to, the source array",
          () =>
          {
              const arr = ["abc", 2, {}, 3, true];

              const clone = arrayUtils.copyArray( arr );

              expect( arraysEqual( arr, clone ) && arr !== clone ).toBe( true );
          } );

    test( "copyArray cannot preserve functions",
          () =>
          {
              const arr = ["abc", 2, {}, 3, true];

              const clone = arrayUtils.copyArray( arr );

              expect( clone ).toEqual( ["abc", 2, {}, 3, true] );
          } );
} );

describe( "Set operations", () =>
{
    test( "areSubsets only returns true if one of the array completely contains the other",
          () =>
          {
              const arr = [1, 2, 3];
              const arr2 = [2, 3, 4];

              expect( arrayUtils.areSubsets( arr, arr2 ) ).toBe( false );
          } );

    test( "areSubsets returns true if one of the array contains the other",
          () =>
          {
              const arr = [1, 2, 3, 4];
              const arr2 = [2, 3, 4];

              expect( arrayUtils.areSubsets( arr, arr2 ) ).toBe( true );
          } );


    test( "superset returns an array containing all defined, non-null, non-empty values from the input arrays",
          () =>
          {
              const arr = [1, 2, 3, null];
              const arr2 = [2, 3, 4, undefined, ""];

              expect( arrayUtils.superset( arr, arr2 ) ).toEqual( [1, 2, 3, 2, 3, 4] );
          } );

    test( "superset with the 'unique' options returns an array containing all unique defined, non-null, non-empty values from the input arrays",
          () =>
          {
              const arr = [1, 2, 3];
              const arr2 = [2, 3, 4];

              expect( arrayUtils.superset( arr, arr2, true ) ).toEqual( [1, 2, 3, 4] );
          } );

    test( "intersection returns an array containing only elements common to both input arrays",
          () =>
          {
              const arr = [1, 2, 3];
              const arr2 = [2, 3, 4];

              expect( arrayUtils.intersection( arr, arr2 ) ).toEqual( [2, 3, 2, 3] );
          } );

    test( "intersection with the 'unique' option returns an array containing only the unique elements common to both input arrays",
          () =>
          {
              const arr = [1, 2, 3];
              const arr2 = [2, 3, 4];

              expect( arrayUtils.intersection( arr, arr2, true ) ).toEqual( [2, 3] );
          } );


    test( "disjunction returns an array containing only elements unique to one or the other of the input arrays",
          () =>
          {
              const arr = [1, 2, 3, 1, 2, 3];
              const arr2 = [2, 3, 4, 2, 3, 4];

              expect( arrayUtils.disjunction( arr, arr2 ) ).toEqual( [1, 1, 4, 4] );
          } );

    test( "disjunction with the 'unique' option returns an array containing only the unique elements unique to one or the other of the input arrays",
          () =>
          {
              const arr = [1, 2, 3, 1, 2, 3];
              const arr2 = [2, 3, 4, 2, 3, 4];

              expect( arrayUtils.disjunction( arr, arr2, true ) ).toEqual( [1, 4] );
          } );
} );

describe( "Queues", () =>
{
    test( "enQueue pushes new elements onto the end of an array, but shifts elements off of the front if the array length would exceed the limit",
          () =>
          {
              let arr = [1, 2, 3];

              arr = arrayUtils.enQueue( arr, 4, 3 );

              expect( arr ).toEqual( [2, 3, 4] );
          } );
} );


describe( "Combinators", () =>
{
    test( "combineConsecutive - numbers and strings",
          () =>
          {
              let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

              expect( combineConsecutive( { types: ["number"] }, arr ) ).toEqual( [55] );

              arr = [1, "a", 2, "b", 3, 4, "c", 5, 6, "d", 7, 8, 9, "e", 10];

              expect( combineConsecutive( { types: ["number"] }, arr ) ).toEqual( [1, "a", 2, "b", 7, "c", 11, "d", 24, "e", 10] );

              expect( combineConsecutive( {
                                              types: ["number"],
                                              sortFirst: true
                                          }, arr ) ).toEqual( [55, "a", "b", "c", "d", "e"] );

              expect( combineConsecutive( {
                                              types: ["number", "string"],
                                              sortFirst: true
                                          }, arr ) ).toEqual( [55, "a b c d e"] );

              expect( combineConsecutive( {
                                              types: ["number", "string"],
                                              sortFirst: true,
                                              separator: ""
                                          }, arr ) ).toEqual( [55, "abcde"] );

          } );

    test( "combineConsecutive - functions and objects",
          () =>
          {
              let arr = [{ a: 1, b: 2, c: 3 }, { a: 9, b: 10 }];

              expect( combineConsecutive( { types: ["object"] }, arr ) ).toEqual( [{ a: 9, b: 10, c: 3 }] );

              expect( combineConsecutive( { types: ["object"], operation: "-" }, arr ) ).toEqual( [{ c: 3 }] );

              expect( combineConsecutive( { types: ["object"], operation: "*" }, arr ) ).toEqual( [{
                  a: 9,
                  b: 10,
                  c: 3
              }] );

              expect( combineConsecutive( { types: ["object"], operation: "/" }, arr ) ).toEqual( [{ c: 3 }] );


              arr = [[1, 2], [3, 4]];

              expect( combineConsecutive( { types: ["object"] }, arr ) ).toEqual( [[1, 2, 3, 4]] );

              expect( combineConsecutive( { types: ["object"], operation: "-" }, arr ) ).toEqual( [[1, 2]] );

              expect( combineConsecutive( {
                                              types: ["object"],
                                              operation: "-"
                                          }, [[1, 2, 3], [3, 4]] ) ).toEqual( [[1, 2]] );

              expect( combineConsecutive( { types: ["object"], operation: "*" }, arr ) ).toEqual( [[3, 8]] );

              expect( combineConsecutive( {
                                              types: ["object"],
                                              operation: "/"
                                          }, [[8, 4], [2, 2]] ) ).toEqual( [[4, 2]] );


              let f = function( a, b )
              {
                  return a + b;
              };

              let g = function( a, b )
              {
                  return a - b;
              };

              arr = [f, g];

              let combined = combineConsecutive( { types: ["function"] }, arr );

              let result = combined[0]( 1, 2 );

              expect( result ).toEqual( 2 ); // (1 + 2) + (1 - 2)
              expect( result ).toEqual( f( 1, 2 ) + g( 1, 2 ) ); // (1 + 2) + (1 - 2)

              combined = combineConsecutive( { types: ["function"], operation: "-" }, arr );

              result = combined[0]( 1, 2 );

              expect( result ).toEqual( 4 ); // (1 + 2) - (1 - 2)
              expect( result ).toEqual( f( 1, 2 ) - g( 1, 2 ) ); // (1 + 2) - (1 - 2)

              combined = combineConsecutive( { types: ["function"], operation: "*" }, arr );

              result = combined[0]( 1, 2 );

              expect( result ).toEqual( -3 ); // (1 + 2) * (1 - 2)
              expect( result ).toEqual( f( 1, 2 ) * g( 1, 2 ) ); // (1 + 2) - (1 - 2)

              combined = combineConsecutive( { types: ["function"], operation: "/" }, arr );

              result = combined[0]( 1, 2 );

              // expect( result ).toEqual( -0.333333333333333 ); // (1 + 2) / (1 - 2)
              expect( result ).toEqual( f( 1, 2 ) / g( 1, 2 ) ); // (1 + 2) - (1 - 2)

              expect( f( 1, 2 ) / g( 1, 2 ) ).toEqual( -3 );

          } );

    test( "concatenateConsecutiveStrings",
          () =>
          {
              let arr = ["Hello", " world", 1, 2, "It's a nice ", "day"];

              expect( concatenateConsecutiveStrings( " ", arr ) ).toEqual( ["Hello world", 1, 2, "It's a nice day"] );
          } );

} );


describe( "range", () =>
{
    const { range } = arrayUtils;

    test( "ArrayUtils::range returns an iterable from the start to the end (exclusive)",
          () =>
          {
              const iterable = range( 0, 10 );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] );
          } );

    test( "ArrayUtils::range returns an iterable from the start to the end (inclusive)",
          () =>
          {
              const iterable = range( 0, 10, { inclusive: true } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] );
          } );

    test( "ArrayUtils::range returns an iterable in either direction",
          () =>
          {
              const iterable = range( 10, 0 );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] );
          } );

    test( "ArrayUtils::range returns an iterable in either direction (inclusive)",
          () =>
          {
              const iterable = range( 10, 0, { inclusive: true } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] );
          } );

    test( "ArrayUtils::range determines the next value according to the smallest power of ten of its arguments",
          () =>
          {
              const iterable = range( 0.0, 10.5 );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( [
                                               0,
                                               0.1,
                                               0.2,
                                               0.3,
                                               0.4,
                                               0.5,
                                               0.6,
                                               0.7,
                                               0.8,
                                               0.9,
                                               1,
                                               1.1,
                                               1.2,
                                               1.3,
                                               1.4,
                                               1.5,
                                               1.6,
                                               1.7,
                                               1.8,
                                               1.9,
                                               2,
                                               2.1,
                                               2.2,
                                               2.3,
                                               2.4,
                                               2.5,
                                               2.6,
                                               2.7,
                                               2.8,
                                               2.9,
                                               3,
                                               3.1,
                                               3.2,
                                               3.3,
                                               3.4,
                                               3.5,
                                               3.6,
                                               3.7,
                                               3.8,
                                               3.9,
                                               4,
                                               4.1,
                                               4.2,
                                               4.3,
                                               4.4,
                                               4.5,
                                               4.6,
                                               4.7,
                                               4.8,
                                               4.9,
                                               5,
                                               5.1,
                                               5.2,
                                               5.3,
                                               5.4,
                                               5.5,
                                               5.6,
                                               5.7,
                                               5.8,
                                               5.9,
                                               6,
                                               6.1,
                                               6.2,
                                               6.3,
                                               6.4,
                                               6.5,
                                               6.6,
                                               6.7,
                                               6.8,
                                               6.9,
                                               7,
                                               7.1,
                                               7.2,
                                               7.3,
                                               7.4,
                                               7.5,
                                               7.6,
                                               7.7,
                                               7.8,
                                               7.9,
                                               8,
                                               8.1,
                                               8.2,
                                               8.3,
                                               8.4,
                                               8.5,
                                               8.6,
                                               8.7,
                                               8.8,
                                               8.9,
                                               9,
                                               9.1,
                                               9.2,
                                               9.3,
                                               9.4,
                                               9.5,
                                               9.6,
                                               9.7,
                                               9.8,
                                               9.9,
                                               10,
                                               10.1,
                                               10.2,
                                               10.3,
                                               10.4
                                           ] );
          } );

    test( "ArrayUtils::range returns a lazy iterable",
          () =>
          {
              const iterable = range( 0, 10_000_000_000 );

              const collector = [];

              for( let value of iterable )
              {
                  if ( value > 9 )
                  {
                      break;
                  }

                  collector.push( value );
              }

              expect( collector ).toEqual( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] );
          } );

    test( "ArrayUtils::range can generate character sequences:: a-z",
          () =>
          {
              const iterable = range( "a", "z", { inclusive: true } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"] );
          } );

    test( "ArrayUtils::range can generate character sequences:: abc-xyz",
          () =>
          {
              const iterable = range( "abc", "xyz", true );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( ["abc", "def", "ghi", "jkl", "mno", "pqr", "stu", "vwx", "yz"] );
          } );

    test( "ArrayUtils::range can generate strange character sequences:: ace-z",
          () =>
          {
              const iterable = range( "ace", "z",
                                      {
                                          inclusive: true,
                                          increment_rule: RANGE_INCREMENT_OPTION.SEQUENCE_PLUS_LAST_SKIP
                                      } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( ["ace", "gik", "moq", "suw", "y"] );
          } );

    test( "ArrayUtils::range edge cases -  1",
          () =>
          {
              const iterable = range( "aaa", "z", { inclusive: true } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( _LETTERS_ENGLISH_LCASE.map( e => e.repeat( 3 ) ) );
          } );

    test( "ArrayUtils::range edge cases -  2",
          () =>
          {
              const iterable = range( "ace", "z", { inclusive: true } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( ["ace", "dfh", "gik", "jln", "moq", "prt", "suw", "vxz"] );
          } );

    test( "ArrayUtils::range edge cases -  3",
          () =>
          {
              const iterable = range( "ace", "z",
                                      {
                                          inclusive: true,
                                          increment_rule: RANGE_INCREMENT_OPTION.INCREMENT
                                      } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( ["ace", "bdf", "ceg", "dfh", "egi", "fhj", "gik",
                                            "hjl", "ikm", "jln", "kmo", "lnp", "moq", "npr",
                                            "oqs", "prt", "qsu", "rtv", "suw", "tvx", "uwy",
                                            "vxz"] );
          } );

    test( "ArrayUtils::range edge cases -  4",
          () =>
          {
              const iterable = range( "aabbcc", "n",
                                      {
                                          inclusive: true,
                                          increment_rule: RANGE_INCREMENT_OPTION.INCREMENT
                                      } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( [
                                               "aabbcc",
                                               "bbccdd",
                                               "ccddee",
                                               "ddeeff",
                                               "eeffgg",
                                               "ffgghh",
                                               "gghhii",
                                               "hhiijj",
                                               "iijjkk",
                                               "jjkkll",
                                               "kkllmm",
                                               "llmmnn"
                                           ] );
          } );

    test( "ArrayUtils::range edge cases -  5",
          () =>
          {
              const iterable = range( "aabbcc", "n", {
                  inclusive: true,
                  increment_rule: RANGE_INCREMENT_OPTION.SEQUENCE_LENGTH
              } );

              const collector = [];

              for( let value of iterable )
              {
                  collector.push( value );
              }

              expect( collector ).toEqual( [
                                               "aabbcc",
                                               "ddeeff",
                                               "gghhii",
                                               "jjkkll",
                                               "mmnn"
                                           ] );
          } );
} );
