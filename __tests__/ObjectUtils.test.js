const objectUtils = require( "../src/ObjectUtils.cjs" );

const constants = objectUtils?.dependencies?.constants || require( "../src/Constants.cjs" );
const typeUtils = objectUtils?.dependencies?.typeUtils || require( "../src/TypeUtils.cjs" );
const stringUtils = objectUtils?.dependencies?.stringUtils || require( "../src/StringUtils.cjs" );
const arrayUtils = objectUtils?.dependencies?.arrayUtils || require( "../src/ArrayUtils.cjs" );


test( "detectCycles relies on populating an array and passing it into any recursive calls",
      () =>
      {
          let results;

          let arr = ["1", "2", "3", "1", "2", "3", "1", "2", "3"];
          let arr2 = ["1", "2", "3", "1", "2", "4", "1", "2", "5"];
          let arr3 = ["1", "2", "3", "4", "5", "1", "2", "3", "4", "5", "1", "2", "3", "4", "5", "6"];

          results = objectUtils.detectCycles( arr, 3, 3 );

          expect( results ).toBe( true );

          results = !objectUtils.detectCycles( arr2, 3, 3 );

          expect( results ).toBe( true );

          results = objectUtils.detectCycles( arr3, 3, 3 );

          expect( results ).toBe( true );

          results = !objectUtils.detectCycles( arr3, 6, 3 );

          expect( results ).toBe( true );
      } );

test( "isEmptyObject returns true for an object with no properties",
      () =>
      {
          expect( objectUtils.isEmptyObject( {} ) ).toBe( true );
      } );

test( "isEmptyObject returns false for null",
      () =>
      {
          expect( objectUtils.isEmptyObject( null ) ).toBe( false );
      } );

test( "isEmptyObject returns false if the argument is not an object",
      () =>
      {
          expect( objectUtils.isEmptyObject( "" ) ).toBe( false );
      } );

test( "isEmptyObject returns true if the argument is an empty string and we allow strings",
      () =>
      {
          expect( objectUtils.isEmptyObject( "", true ) ).toBe( true );
      } );

////

test( "isNullOrEmpty returns true for an object with no properties",
      () =>
      {
          expect( objectUtils.isNullOrEmpty( {} ) ).toBe( true );
      } );

test( "isNullOrEmpty returns true for null",
      () =>
      {
          expect( objectUtils.isNullOrEmpty( null ) ).toBe( true );
      } );

test( "isNullOrEmpty returns false if the argument is not an object",
      () =>
      {
          expect( objectUtils.isNullOrEmpty( "" ) ).toBe( false );
      } );

test( "isNullOrEmpty returns true if the argument is an empty string and we allow strings",
      () =>
      {
          expect( objectUtils.isNullOrEmpty( "", true ) ).toBe( true );
      } );
/////

test( "isNullOrNaN returns false for an object with no properties",
      () =>
      {
          expect( objectUtils.isNullOrNaN( {} ) ).toBe( false );
      } );

test( "isNullOrNaN returns true for null",
      () =>
      {
          expect( objectUtils.isNullOrNaN( null ) ).toBe( true );
      } );

test( "isNullOrNaN returns false if the argument is not an object",
      () =>
      {
          expect( objectUtils.isNullOrNaN( "" ) ).toBe( false );
      } );

test( "isNullOrNaN returns true if the argument is an empty string and we allow strings",
      () =>
      {
          expect( objectUtils.isNullOrNaN( "", true ) ).toBe( true );
      } );

test( "isNullOrNaN returns true if the argument is NaN or not finite",
      () =>
      {
          expect( objectUtils.isNullOrNaN( 1 / 0 ) ).toBe( true );
      } );

test( "isNullOrNaN returns true if the argument is NaN",
      () =>
      {
          expect( objectUtils.isNullOrNaN( NaN ) ).toBe( true );
      } );

////


test( "isMissing returns true for an object with no properties",
      () =>
      {
          expect( objectUtils.isMissing( {} ) ).toBe( true );
      } );

test( "isMissing returns true for a property that is missing, null, or undefined",
      () =>
      {
          const obj = { a: null, b: undefined };

          expect( objectUtils.isMissing( obj?.a ) ).toBe( true );
      } );

test( "isMissing returns false for a property that is an empty string or 0",
      () =>
      {
          const obj = { a: null, b: undefined, c: "", d: 0 };

          expect( objectUtils.isMissing( obj?.c ) ).toBe( false );

          expect( objectUtils.isMissing( obj?.d ) ).toBe( false );
      } );

test( "isMissing returns true for null",
      () =>
      {
          expect( objectUtils.isMissing( null ) ).toBe( true );
      } );

test( "isMissing returns false if the argument is not an object",
      () =>
      {
          expect( objectUtils.isMissing( "" ) ).toBe( false );
      } );

test( "isMissing returns true if the argument is an empty string and we allow strings",
      () =>
      {
          expect( objectUtils.isMissing( "", true ) ).toBe( true );
      } );

test( "isMissing returns true if the argument is NaN or not finite",
      () =>
      {
          expect( objectUtils.isMissing( 1 / 0 ) ).toBe( true );
      } );

test( "isMissing returns true if the argument is NaN",
      () =>
      {
          expect( objectUtils.isMissing( NaN ) ).toBe( true );
      } );

////

/** some classes to use for the following tests **/

class ClassOne
{
    #id = 666;

    constructor()
    {
        this.#id = 666;
    }

    get id()
    {
        return this.#id;
    }
}

class ClassTwo
{
    #id = 777;

    constructor()
    {
        this.#id = 777;
    }

    get id()
    {
        return this.#id;
    }
}

class ClassThree extends ClassOne
{
    constructor()
    {
        super();

        this.name = "ClassThree";
    }
}

const obj = {};
const obj2 = {};
const obj3 = new ClassOne();
const obj4 = new ClassOne();
const obj5 = new ClassTwo();
const obj6 = new ClassThree();
const obj7 = ClassOne;
const obj8 = ClassThree;

let check1 = Object === objectUtils.getClass( obj );
let check2 = Object === objectUtils.getClass( obj2 );
let check3 = objectUtils.getClass( obj2 ) === objectUtils.getClass( obj );

let check4 = ClassThree === objectUtils.getClass( obj6 );
let check5 = ClassTwo === objectUtils.getClass( obj5 );

let check6 = objectUtils.getClass( obj7 ) === objectUtils.getClass( obj7 );
let check7 = objectUtils.getClass( obj3 ) === objectUtils.getClass( obj4 );

let check8 = objectUtils.getClass( obj8 ) !== objectUtils.getClass( obj7 );


test( "getClassName returns 'Object' for object literals",
      () =>
      {
          expect( objectUtils.getClassName( obj ) ).toEqual( "Object" );
      } );

test( "getClassName returns 'ClassThree' for objects constructed as ClassThree instances",
      () =>
      {
          expect( objectUtils.getClassName( obj6 ) ).toEqual( "ClassThree" );
      } );

test( "getClassName returns the class name for object literals that have been 'cast' to an instance of the class",
      () =>
      {
          let o = {};

          o.__proto__ = ClassOne.prototype;

          expect( objectUtils.getClassName( o ) ).toEqual( "ClassOne" );
      } );

////

test( "getClass returns the class of the object",
      () =>
      {
          expect( check1 && check2 && check3 && check4 && check5 && check6 && check7 && check8 ).toBe( true );

      } );

test( "convertToInstanceOf turns an object literal into an instance of the specified class",
      () =>
      {
          let o = {};

          expect( objectUtils.convertToInstanceOf( o, ClassOne ).id ).toEqual( 666 );
      } );

test( "convertToInstanceOf turns an object of one class into an instance of another class",
      () =>
      {
          let o = new ClassOne();

          expect( objectUtils.convertToInstanceOf( o, ClassTwo ).id ).toEqual( 777 );
      } );

///

test( "isValidEntry returns true if the key is a non-empty string and the value is not undefined",
      () =>
      {
          let o = {};

          expect( objectUtils.isValidEntry( "a", "" ) ).toBe( true );
      } );

test( "isValidEntry returns false if the value is undefined",
      () =>
      {
          let o = {};

          expect( objectUtils.isValidEntry( "a" ) ).toBe( false );
      } );

test( "generateUniqueObjectId returns a value unique to the object",
      () =>
      {
          let o = new ClassOne();
          let o2 = new ClassTwo();

          let uniqueObjectId = objectUtils.generateUniqueObjectId( o, ClassOne );

          let uniqueObjectId2 = objectUtils.generateUniqueObjectId( o2 );

          console.log( "uniqueObjectId:", uniqueObjectId );
          console.log( "uniqueObjectId2:", uniqueObjectId2 );

          expect( uniqueObjectId !== uniqueObjectId2 ).toBe( true );
      } );

////

test( "getKeys returns an array of the unique keys of the object(s) specified",
      () =>
      {
          let a = { "a": 1, "b": 2, "c": 3, "d": 4, "e": 5 };
          let b = { "aa": 1, "b": 2, "cc": 3, "d": 4, "ee": 5 };
          let c = { "f": 6, "g": 7, "h": 8, "i": 9, "j": 10 };
          let d = { "f": 6, "gg": 7, "h": 8, "ii": 9, "j": 10 };

          expect( objectUtils.getKeys( a, b, c, d ) ).toEqual( ["a", "b", "c", "d", "e", "aa", "cc", "ee", "f", "g", "h", "i", "j", "gg", "ii"] );

      } );

test( "getKeys returns an empty array if none of the arguments are populated objects",
      () =>
      {
          let a = {};
          let b = {};
          let c = null;
          let d = "a string";

          expect( objectUtils.getKeys( a, b, c, d ) ).toEqual( [] );

      } );

///

test( "getProperties returns an array of the unique keys of the object(s) specified",
      () =>
      {
          let a = { "a": 1, "b": 2, "c": 3, "d": 4, "e": 5 };
          let b = { "aa": 1, "b": 2, "cc": 3, "d": 4, "ee": 5 };
          let c = { "f": 6, "g": 7, "h": 8, "i": 9, "j": 10 };
          let d = { "f": 6, "gg": 7, "h": 8, "ii": 9, "j": 10 };

          expect( objectUtils.getProperties( a, b, c, d ) ).toEqual( ["a", "b", "c", "d", "e", "aa", "cc", "ee", "f", "g", "h", "i", "j", "gg", "ii"] );

      } );

test( "getProperties returns an empty array if none of the arguments are populated objects",
      () =>
      {
          let a = {};
          let b = {};
          let c = null;
          let d = "a string";

          expect( objectUtils.getProperties( a, b, c, d ) ).toEqual( [] );

      } );

test( "getProperties returns all of the properties accessible via the specified object",
      () =>
      {
          class A
          {
              #id = 0;
              #code = "a";

              constructor( pId, pCode )
              {
                  this.#id = pId || this.#id;
                  this.#code = pCode || this.#code;
              }

              get id()
              {
                  return this.#id;
              }

              get code()
              {
                  return this.#code;
              }
          }

          class B extends A
          {
              #name = "default";
              #description = "A user-defined class";

              constructor( pId, pCode, pName, pDescription )
              {
                  super( pId, pCode );

                  this.#name = pName || this.#name;
                  this.#description = pDescription || this.#description;
              }

              get name()
              {
                  return this.#name;
              }

              get description()
              {
                  return this.#description;
              }
          }

          let a = new A( 7, "777" );
          let b = new B( 8, "888", "Eight", "One more than seven" );

          let properties = objectUtils.getProperties( a, b );

          expect( properties ).toEqual( ["id", "code", "name", "description"] );
      } );


test( "getValues returns all of the values accessible via the specified object",
      () =>
      {
          class A
          {
              #id = 0;
              #code = "a";

              constructor( pId, pCode )
              {
                  this.#id = pId || this.#id;
                  this.#code = pCode || this.#code;
              }

              get id()
              {
                  return this.#id;
              }

              get code()
              {
                  return this.#code;
              }
          }

          class B extends A
          {
              #name = "default";
              #description = "A user-defined class";

              constructor( pId, pCode, pName, pDescription )
              {
                  super( pId, pCode );

                  this.#name = pName || this.#name;
                  this.#description = pDescription || this.#description;
              }

              get name()
              {
                  return this.#name;
              }

              get description()
              {
                  return this.#description;
              }
          }

          let a = new A( 7, "777" );
          let b = new B( 8, "888", "Eight", "One more than seven" );

          let values = [].concat( objectUtils.getValues( b ) );

          let comparator = arrayUtils.Comparators.BY_STRING_VALUE;

          expect( arrayUtils.arraysEqual( values, [8, "888", "Eight", "One more than seven"], comparator ) ).toBe( true );
      } );

test( "getEntries returns an array of ObjectEntry values",
      () =>
      {
          let baz = "baz";

          let a = { a: 1, b: 2, c: 3, d: 4 };
          let b = { a: "a", b: "b", c: "c", d: "d" };
          let c = { foo: "bar", baz: "baz", o: a };

          let entries = objectUtils.getEntries( a, b, c );

          expect( entries?.length ).toEqual( 11 );

          for( let entry of entries )
          {
              expect( entry instanceof objectUtils.ObjectEntry ).toBe( true );
          }
      } );

test( "getEntries returns the entries of all objects specified",
      () =>
      {
          let baz = "baz";

          let a = { a: 1, b: 2, c: 3, d: 4 };
          let b = { a: "a", b: "b", c: "c", d: "d" };
          let c = { foo: "bar", baz: "baz", o: a };

          let entries = objectUtils.getEntries( a, b, c, baz );

          expect( entries?.length ).toEqual( 11 );

          expect( entries[0]?.key ).toEqual( "a" );
          expect( entries[0]?.value ).toEqual( 1 );

          expect( entries[1]?.key ).toEqual( "b" );
          expect( entries[1]?.value ).toEqual( 2 );

          expect( entries[2]?.key ).toEqual( "c" );
          expect( entries[2]?.value ).toEqual( 3 );

          expect( entries[3]?.key ).toEqual( "d" );
          expect( entries[3]?.value ).toEqual( 4 );

          expect( entries[4]?.key ).toEqual( "a" );
          expect( entries[4]?.value ).toEqual( "a" );

          expect( entries[5]?.key ).toEqual( "b" );
          expect( entries[5]?.value ).toEqual( "b" );

          expect( entries[6]?.key ).toEqual( "c" );
          expect( entries[6]?.value ).toEqual( "c" );

          expect( entries[7]?.key ).toEqual( "d" );
          expect( entries[7]?.value ).toEqual( "d" );

          expect( entries[8]?.key ).toEqual( "foo" );
          expect( entries[8]?.value ).toEqual( "bar" );

          expect( entries[9]?.key ).toEqual( "baz" );
          expect( entries[9]?.value ).toEqual( "baz" );

          expect( entries[10]?.key ).toEqual( "o" );
          expect( entries[10]?.value ).toEqual( a );

      } );

test( "hasNoProperties returns true if no property holds a value or populated object",
      () =>
      {
          let a = { a: {}, b: { a: {} } };

          expect( objectUtils.hasNoProperties( a ) ).toBe( true );

      } );

test( "hasNoProperties returns false if the options are not recursive and one or more properties holds a value (even if that value is an object with no properties)",
      () =>
      {
          let a = { a: {}, b: { a: {} } };

          expect( objectUtils.hasNoProperties( a, { recursive: false } ) ).toBe( false );

      } );


test( "isEmptyValue returns true if the specified argument is a string of only whitespace",
      () =>
      {
          let s = "\n";

          expect( objectUtils.isEmptyValue( s ) ).toBe( true );

          s = "   \n   \t   ";

          expect( objectUtils.isEmptyValue( s ) ).toBe( true );

          s = " a ";

          expect( objectUtils.isEmptyValue( s ) ).toBe( false );
      } );

test( "isEmptyValue returns true if the specified argument is an array of length 0",
      () =>
      {
          let arr = [];

          expect( objectUtils.isEmptyValue( arr ) ).toBe( true );
      } );


test( "isEmptyValue returns true if the specified argument is an array whose elements are all 'empty values'",
      () =>
      {
          let arr = [{}, [], ""];

          expect( objectUtils.isEmptyValue( arr ) ).toBe( true );
      } );

test( "isPopulatedObject returns true if the specified argument is an object wi at least one populated property",
      () =>
      {
          let obj = { a: 1 };

          expect( objectUtils.isPopulatedObject( obj ) ).toBe( true );
      } );

test( "isPopulatedObject returns false if the specified argument is an object with less than 2 populated properties",
      () =>
      {
          let obj = { a: 1 };

          expect( objectUtils.isPopulatedObject( obj, { minimumKeys: 2 } ) ).toBe( false );
      } );

test( "isPopulatedObject returns true if the specified argument is an object with at least 2 populated properties",
      () =>
      {
          let obj = { a: 1, b: 1 };

          expect( objectUtils.isPopulatedObject( obj, { minimumKeys: 2 } ) ).toBe( true );
      } );

test( "isPopulatedObject returns false if the specified argument is an object that does not contain a mandatory key",
      () =>
      {
          let obj = { a: 1 };

          expect( objectUtils.isPopulatedObject( obj, { manadatoryKeys: ["b", "c"] } ) ).toBe( false );
      } );

test( "isPopulatedObject returns false if the specified argument is an object that does not contain all mandatory keys",
      () =>
      {
          let obj = { a: 1, b: 1 };

          expect( objectUtils.isPopulatedObject( obj, { manadatoryKeys: ["b", "c"] } ) ).toBe( false );
      } );

test( "isPopulatedObject returns true if the specified argument is an object that contains all mandatory keys",
      () =>
      {
          let obj = { a: 1, b: 1, c: 1 };

          expect( objectUtils.isPopulatedObject( obj, { manadatoryKeys: ["b", "c"] } ) ).toBe( true );
      } );

test( "isPopulatedObject returns false if the specified argument is an object with no populated properties",
      () =>
      {
          let obj = { a: {} };

          expect( objectUtils.isPopulatedObject( obj ) ).toBe( false );
      } );


test( "isPopulatedObject returns false if the specified argument is an object graph with no populated properties",
      () =>
      {
          let obj = { a: { b: { c: null } } };

          expect( objectUtils.isPopulatedObject( obj ) ).toBe( false );
      } );


test( "isPopulatedObject returns true if the specified argument is an object graph with at least one populated properties",
      () =>
      {
          let obj = { a: { b: { c: 1 } } };

          expect( objectUtils.isPopulatedObject( obj ) ).toBe( true );
      } );

test( "isPopulatedObject returns true if the specified argument is one of the valid types and is not considered 'empty'",
      () =>
      {
          let obj = "abc";

          expect( objectUtils.isPopulatedObject( obj, { validTypes: ["string", "object"] } ) ).toBe( true );
      } );

test( "isPopulatedObject returns false if the specified argument is one of the valid types but is considered 'empty'",
      () =>
      {
          let obj = "";

          expect( objectUtils.isPopulatedObject( obj, { validTypes: ["string", "object"] } ) ).toBe( false );
      } );

test( "isPopulatedObject returns false if the specified argument is an array (by default)",
      () =>
      {
          let obj = [1, 2, 3];

          expect( objectUtils.isPopulatedObject( obj ) ).toBe( false );
      } );

test( "isPopulatedObject returns true for an array with at least one populated element, when option set",
      () =>
      {
          let obj = [1, 2, 3];

          expect( objectUtils.isPopulatedObject( obj, { acceptArrays: true } ) ).toBe( true );
      } );

test( "isPopulatedObject returns false for an array with no populated elements, even when option set",
      () =>
      {
          let obj = [null, undefined, null];

          expect( objectUtils.isPopulatedObject( obj, { acceptArrays: true } ) ).toBe( false );
      } );


test( "isValidObject returns true if the argument is an object with at least one property (regardless of population)",
      () =>
      {
          let obj = { a: null };

          expect( objectUtils.isValidObject( obj ) ).toBe( true );
      } );


test( "firstValidObject returns the leftmost argument that satisfies the function, isValidObject",
      () =>
      {
          let obj = [{}, 1, true, null, undefined, "abc", { a: null }, [], {}];

          expect( objectUtils.firstValidObject( ...obj ) ).toEqual( { a: null } );
      } );

test( "firstPopulatedObject returns the leftmost argument that satisfies the function, isPopulated, or null",
      () =>
      {
          let obj = [{}, 1, true, null, undefined, "abc", { a: null }, {}, []];

          expect( objectUtils.firstPopulatedObject( ...obj ) ).toEqual( null );
      } );

test( "firstPopulatedObject returns the leftmost argument that satisfies the function, isPopulated",
      () =>
      {
          let obj = [{}, 1, true, null, undefined, "abc", { a: 1 }, {}, []];

          expect( objectUtils.firstPopulatedObject( ...obj ) ).toEqual( { a: 1 } );
      } );

test( "getProperty returns the value of the 'property' specified",
      () =>
      {
          let obj = new ClassTwo();

          expect( objectUtils.getProperty( obj, "id" ) ).toEqual( 777 );
      } );

test( "getProperty returns an empty string if the 'property' specified cannot be read",
      () =>
      {
          let obj = new ClassTwo();

          expect( objectUtils.getProperty( obj, "nope" ) ).toEqual( "" );
      } );

test( "getProperty returns the value of the 'property path' specified",
      () =>
      {
          let obj = { a: { b: { c: 666 } } };

          expect( objectUtils.getProperty( obj, "a.b.c" ) ).toEqual( 666 );
      } );

test( "hasProperty returns true if the 'property path' exists",
      () =>
      {
          let obj = { a: { b: { c: 666 } } };

          expect( objectUtils.hasProperty( obj, "a.b.c" ) ).toBe( true );
      } );

test( "hasProperty returns true if the 'property' exists",
      () =>
      {
          let obj = { a: { b: { c: 666 } } };

          expect( objectUtils.hasProperty( obj, "a" ) ).toBe( true );
      } );

test( "hasProperty returns false if the 'property' does not exist",
      () =>
      {
          let obj = { a: { b: { c: 666 } } };

          expect( objectUtils.hasProperty( obj, "d" ) ).toBe( false );
      } );

test( "hasProperty returns false if the 'property path' does not exist",
      () =>
      {
          let obj = { a: { b: { c: 666 } } };

          expect( objectUtils.hasProperty( obj, "a.b.z" ) ).toBe( false );
      } );


