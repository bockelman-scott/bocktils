const core = require( "@toolbocks/core" );

const objectUtils = require( "../src/ObjectUtils.cjs" );

const { constants = objectUtils?.dependencies?.constants, arrayUtils = objectUtils?.dependencies?.arrayUtils } = core;

/**
 * Defines a string to represent the type, undefined
 */
const { _ud = "undefined" } = constants;

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

objectUtils.disableLogging();

const {
    detectCycles,
    getKeys,
    getProperties,
    getProperty,
    hasProperty,
    setProperty,
    getValues,
    getEntries,
    ObjectEntry,
    isEmptyObject,
    isNullOrEmpty,
    isNullOrNaN,
    isMissing,
    getClass,
    getClassName,
    convertToInstanceOf,
    isValidEntry,
    hasNoProperties,
    isEmptyValue,
    isPopulatedObject,
    isValidObject,
    firstValidObject,
    firstPopulatedObject,
    identical,
    same,
    arrayToObject,
    findImplementor,
    collectImplementors,
    emptyClone,
    clone,
    ingest,
    augment,
    populateObject,
    prune,
    toLiteral,
    findNode,
    findRoot,
    tracePathTo,

} = objectUtils;

describe( "detectCycles prevents infinite recursion", () =>
{
    test( "detectCycles relies on populating an array and passing it into any recursive calls",
          () =>
          {
              let results;

              let arr = ["1", "2", "3", "1", "2", "3", "1", "2", "3"];
              let arr2 = ["1", "2", "3", "1", "2", "4", "1", "2", "5"];
              let arr3 = ["1", "2", "3", "4", "5", "1", "2", "3", "4", "5", "1", "2", "3", "4", "5", "6"];

              results = detectCycles( arr, 3, 3 );

              expect( results ).toBe( true );

              results = !detectCycles( arr2, 3, 3 );

              expect( results ).toBe( true );

              results = detectCycles( arr3, 3, 3 );

              expect( results ).toBe( true );

              results = !detectCycles( arr3, 6, 3 );

              expect( results ).toBe( true );
          } );
} );

describe( "extractFunctionData returns an object with the function body and an array its parameters", () =>
{
    const { extractFunctionData, extractFunctionBody, extractFunctionParameters } = objectUtils;

    function TestFunction( pArgA, pArgB )
    {
        let { x, y, z } = {};

        return pArgA + pArgB;
    }

    function TestNoArgs()
    {
        return 2 + 3;
    }

    test( "extractFunctionData for TestFunction",
          () =>
          {
              const data = extractFunctionData( TestFunction );

              expect( data.body ).toEqual( extractFunctionBody( TestFunction ) );

              const body = (data.body).replaceAll( /\s*/g, "" ).replace( /return/, "return " ).trim();

              expect( body ).toEqual( `let{x,y,z}={};return pArgA+pArgB;` );

              const params = data.params;

              expect( params ).toEqual( ["pArgA", "pArgB"] );

              expect( params ).toEqual( extractFunctionParameters( TestFunction ) );
          } );

    test( "extractFunctionData for TestNoArgs",
          () =>
          {
              const data = extractFunctionData( TestNoArgs );

              expect( data.body ).toEqual( extractFunctionBody( TestNoArgs ) );

              const body = (data.body).replaceAll( /\s*/g, "" ).replace( /return/, "return " ).trim();

              expect( body ).toEqual( `return 2+3;` );

              const params = data.params;

              expect( params ).toEqual( [] );

              expect( params ).toEqual( extractFunctionParameters( TestNoArgs ) );
          } );

    test( "extractFunctionData for Non-Function",
          () =>
          {
              const anObject = { a: 1, b: 2 };

              const data = extractFunctionData( anObject );

              expect( data.body ).toEqual( extractFunctionBody( anObject ) );

              expect( data.body ).toEqual( `` );

              const params = data.params;

              expect( params ).toEqual( [] );

              expect( params ).toEqual( extractFunctionParameters( anObject ) );
          } );
} );

describe( "isEmptyObject", () =>
{
    test( "isEmptyObject returns true for an object with no properties",
          () =>
          {
              expect( isEmptyObject( {} ) ).toBe( true );
          } );

    test( "isEmptyObject returns false for null",
          () =>
          {
              expect( isEmptyObject( null ) ).toBe( false );
          } );

    test( "isEmptyObject returns false if the argument is not an object",
          () =>
          {
              expect( isEmptyObject( "" ) ).toBe( false );
          } );

    test( "isEmptyObject returns true if the argument is an empty string and we allow strings",
          () =>
          {
              expect( isEmptyObject( "", true ) ).toBe( true );
          } );
} );

describe( "isNullOrEmpty", () =>
{
    test( "isNullOrEmpty returns true for an object with no properties",
          () =>
          {
              expect( isNullOrEmpty( {} ) ).toBe( true );
          } );

    test( "isNullOrEmpty returns true for null",
          () =>
          {
              expect( isNullOrEmpty( null ) ).toBe( true );
          } );

    test( "isNullOrEmpty returns false if the argument is not an object",
          () =>
          {
              expect( isNullOrEmpty( "" ) ).toBe( false );
          } );

    test( "isNullOrEmpty returns true if the argument is an empty string and we allow strings",
          () =>
          {
              expect( isNullOrEmpty( "", true ) ).toBe( true );
          } );
} );

describe( "isNullOrNaN", () =>
{
    test( "isNullOrNaN returns false for an object with no properties",
          () =>
          {
              expect( isNullOrNaN( {} ) ).toBe( false );
          } );

    test( "isNullOrNaN returns true for null",
          () =>
          {
              expect( isNullOrNaN( null ) ).toBe( true );
          } );

    test( "isNullOrNaN returns false if the argument is not an object",
          () =>
          {
              expect( isNullOrNaN( "" ) ).toBe( false );
          } );

    test( "isNullOrNaN returns true if the argument is an empty string and we allow strings",
          () =>
          {
              expect( isNullOrNaN( "", true ) ).toBe( true );
          } );

    test( "isNullOrNaN returns true if the argument is NaN or not finite",
          () =>
          {
              expect( isNullOrNaN( 1 / 0 ) ).toBe( true );
          } );

    test( "isNullOrNaN returns true if the argument is NaN",
          () =>
          {
              expect( isNullOrNaN( NaN ) ).toBe( true );
          } );
} );

describe( "isMIssing", () =>
{
    test( "isMissing returns true for an object with no properties",
          () =>
          {
              expect( isMissing( {} ) ).toBe( true );
          } );

    test( "isMissing returns true for a property that is missing, null, or undefined",
          () =>
          {
              const obj = { a: null, b: undefined };

              expect( isMissing( obj?.a ) ).toBe( true );
          } );

    test( "isMissing returns false for a property that is an empty string or 0",
          () =>
          {
              const obj = { a: null, b: undefined, c: "", d: 0 };

              expect( isMissing( obj?.c ) ).toBe( false );

              expect( isMissing( obj?.d ) ).toBe( false );
          } );

    test( "isMissing returns true for null",
          () =>
          {
              expect( isMissing( null ) ).toBe( true );
          } );

    test( "isMissing returns false if the argument is not an object",
          () =>
          {
              expect( isMissing( "" ) ).toBe( false );
          } );

    test( "isMissing returns true if the argument is an empty string and we allow strings",
          () =>
          {
              expect( isMissing( "", true ) ).toBe( true );
          } );

    test( "isMissing returns true if the argument is NaN or not finite",
          () =>
          {
              expect( isMissing( 1 / 0 ) ).toBe( true );
          } );

    test( "isMissing returns true if the argument is NaN",
          () =>
          {
              expect( isMissing( NaN ) ).toBe( true );
          } );
} );

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

    async doSomething()
    {
        return "did something";
    }

    doSomethingElse()
    {
        return "did something else";
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

let check1 = Object === getClass( obj );
let check2 = Object === getClass( obj2 );
let check3 = getClass( obj2 ) === getClass( obj );

let check4 = ClassThree === getClass( obj6 );
let check5 = ClassTwo === getClass( obj5 );

let check6 = getClass( obj7 ) === getClass( obj7 );
let check7 = getClass( obj3 ) === getClass( obj4 );

let check8 = getClass( obj8 ) !== getClass( obj7 );

describe( "getClassName", () =>
{
    test( "getClassName returns 'Object' for object literals",
          () =>
          {
              expect( getClassName( obj ) ).toEqual( "Object" );
          } );

    test( "getClassName returns 'ClassThree' for objects constructed as ClassThree instances",
          () =>
          {
              expect( getClassName( obj6 ) ).toEqual( "ClassThree" );
          } );

    test( "getClassName returns the class name for object literals that have been 'cast' to an instance of the class",
          () =>
          {
              let o = {};

              o.__proto__ = ClassOne.prototype;

              expect( getClassName( o ) ).toEqual( "ClassOne" );
          } );
} );

describe( "getClass", () =>
{
    test( "getClass returns the class of the object",
          () =>
          {
              expect( check1 && check2 && check3 && check4 && check5 && check6 && check7 && check8 ).toBe( true );

          } );
} );

describe( "convertToInstanceOf class", () =>
{
    test( "convertToInstanceOf turns an object literal into an instance of the specified class",
          () =>
          {
              let o = {};

              expect( convertToInstanceOf( o, ClassOne ).id ).toEqual( 666 );
          } );

    test( "convertToInstanceOf turns an object of one class into an instance of another class",
          () =>
          {
              let o = new ClassOne();

              expect( convertToInstanceOf( o, ClassTwo ).id ).toEqual( 777 );
          } );
} );

describe( "isValidEntry", () =>
{
    test( "isValidEntry returns true if the key is a non-empty string and the value is not undefined",
          () =>
          {
              let o = {};

              expect( isValidEntry( "a", "" ) ).toBe( true );
          } );

    test( "isValidEntry returns false if the value is undefined",
          () =>
          {
              let o = {};

              expect( isValidEntry( "a" ) ).toBe( false );
          } );
} );

describe( "Unique object ID", () =>
{
    // ObjectUtils adds this property to the Object prototype
    test( "getUniqueObjectInstanceId() returns a value unique to the object",
          () =>
          {
              let o = new ClassOne();
              let o2 = new ClassTwo();
              let o3 = {};

              const regExp = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/i;

              expect( regExp.test( o.getUniqueObjectInstanceId() ) ).toBe( true );
              expect( regExp.test( o2.getUniqueObjectInstanceId() ) ).toBe( true );
              expect( regExp.test( o3.getUniqueObjectInstanceId() ) ).toBe( true );

              expect( o["__GUID"] ).toEqual( o.getUniqueObjectInstanceId() );
              expect( o2["__GUID"] ).toEqual( o2.getUniqueObjectInstanceId() );
              expect( o3["__GUID"] ).toEqual( o3.getUniqueObjectInstanceId() );

              expect( regExp.test( []?.["__GUID"] ) ).toBe( true );

              expect( regExp.test( new Date()["__GUID"] ) ).toBe( true );

              expect( regExp.test( "abc"["__GUID"] ) ).toBe( true );

              expect( regExp.test( regExp["__GUID"] ) ).toBe( true );
          } );
} );

describe( "getKeys", () =>
{
    test( "getKeys returns an array of the unique keys of the object(s) specified",
          () =>
          {
              let a = { "a": 1, "b": 2, "c": 3, "d": 4, "e": 5 };
              let b = { "aa": 1, "b": 2, "cc": 3, "d": 4, "ee": 5 };
              let c = { "f": 6, "g": 7, "h": 8, "i": 9, "j": 10 };
              let d = { "f": 6, "gg": 7, "h": 8, "ii": 9, "j": 10 };

              expect( getKeys( a, b, c, d ) ).toEqual( ["a", "b", "c", "d", "e", "aa", "cc", "ee", "f", "g", "h", "i", "j", "gg", "ii"] );

          } );

    test( "getKeys returns an empty array if none of the arguments are populated objects",
          () =>
          {
              let a = {};
              let b = {};
              let c = null;
              let d = "a string";

              expect( getKeys( a, b, c, d ) ).toEqual( [] );

          } );

    test( "getKeys returns 0 for a Date",
          () =>
          {
              const a = new Date();
              const keys = getKeys( a );

              expect( keys.length ).toEqual( 0 );
          } );

    test( "getKeys returns the length of the primitive valueOf for the String wrapper",
          () =>
          {
              const a = new String( "abc" );
              const keys = getKeys( a );

              expect( keys.length ).toEqual( 3 );
          } );

    test( "getKeys returns 0 for any other Primitive Type Wrapper or non-object",
          () =>
          {
              let a = new Boolean( true );
              let keys = getKeys( a );

              expect( keys.length ).toEqual( 0 );

              a = new Number( 1 );
              keys = getKeys( a );

              expect( keys.length ).toEqual( 0 );

              a = 12n;
              keys = getKeys( a );
              expect( keys.length ).toEqual( 0 );

          } );

    test( "getKeys returns the indices corresponding to the allocated size for any TypedArray Type",
          () =>
          {
              for( let type of constants.TYPED_ARRAYS )
              {
                  let a = new type( 10 );
                  let keys = getKeys( a );

                  expect( keys.length ).toEqual( 10 );
              }
          } );
} );

describe( "getProperties", () =>
{
    test( "getProperties returns an array of the unique keys of the object(s) specified",
          () =>
          {
              let a = { "a": 1, "b": 2, "c": 3, "d": 4, "e": 5 };
              let b = { "aa": 1, "b": 2, "cc": 3, "d": 4, "ee": 5 };
              let c = { "f": 6, "g": 7, "h": 8, "i": 9, "j": 10 };
              let d = { "f": 6, "gg": 7, "h": 8, "ii": 9, "j": 10 };

              expect( getProperties( a, b, c, d ) ).toEqual( ["a", "b", "c", "d", "e", "aa", "cc", "ee", "f", "g", "h", "i", "j", "gg", "ii"] );

          } );

    test( "getProperties returns an empty array if none of the arguments are populated objects",
          () =>
          {
              let a = {};
              let b = {};
              let c = null;
              let d = "a string";

              expect( getProperties( a, b, c, d ) ).toEqual( [] );

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

              let properties = getProperties( a, b );

              expect( properties ).toEqual( ["id", "code", "name", "description"] );
          } );
} );

describe( "getValues", () =>
{
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

              let values = [].concat( getValues( b ) );

              let comparator = arrayUtils.Comparators.BY_STRING_VALUE;

              const arr = [8, "888", "Eight", "One more than seven"];

              expect( arrayUtils.arraysEqual( values, arr,
                                              {
                                                  comparator,
                                                  ignoreOrder: true
                                              } ) ).toBe( true );
          } );
} );

describe( "getEntries - ObjectEntry", () =>
{
    test( "getEntries returns an array of ObjectEntry values",
          () =>
          {
              let baz = "baz";

              let a = { a: 1, b: 2, c: 3, d: 4 };
              let b = { a: "a", b: "b", c: "c", d: "d" };
              let c = { foo: "bar", baz: "baz", o: a };

              let entries = getEntries( a, b, c );

              expect( entries?.length ).toEqual( 11 );

              for( let entry of entries )
              {
                  expect( entry instanceof ObjectEntry ).toBe( true );
              }
          } );

    test( "getEntries returns the entries of all objects specified",
          () =>
          {
              let baz = "baz";

              let a = { a: 1, b: 2, c: 3, d: 4 };
              let b = { a: "a", b: "b", c: "c", d: "d" };
              let c = { foo: "bar", baz: "baz", o: a };

              let entries = getEntries( a, b, c, baz );

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
} );

describe( "hasNoProperties", () =>
{
    test( "hasNoProperties returns true if no property holds a value or populated object",
          () =>
          {
              let a = { a: {}, b: { a: {} } };

              expect( hasNoProperties( a ) ).toBe( true );

          } );

    test( "hasNoProperties returns false if the options are not recursive and one or more properties holds a value (even if that value is an object with no properties)",
          () =>
          {
              let a = { a: {}, b: { a: {} } };

              expect( hasNoProperties( a, { recursive: false } ) ).toBe( false );

          } );
} );

describe( "isEmptyValue", () =>
{
    test( "isEmptyValue returns true if the specified argument is a string of only whitespace",
          () =>
          {
              let s = "\n";

              expect( isEmptyValue( s ) ).toBe( true );

              s = "   \n   \t   ";

              expect( isEmptyValue( s ) ).toBe( true );

              s = " a ";

              expect( isEmptyValue( s ) ).toBe( false );
          } );

    test( "isEmptyValue returns true if the specified argument is an array of length 0",
          () =>
          {
              let arr = [];

              expect( isEmptyValue( arr ) ).toBe( true );
          } );

    test( "isEmptyValue returns true if the specified argument is an array whose elements are all 'empty values'",
          () =>
          {
              let arr = [{}, [], ""];

              expect( isEmptyValue( arr ) ).toBe( true );
          } );
} );

describe( "isPopulatedObject", () =>
{
    test( "isPopulatedObject returns true if the specified argument is an object wi at least one populated property",
          () =>
          {
              let obj = { a: 1 };

              expect( isPopulatedObject( obj ) ).toBe( true );
          } );

    test( "isPopulatedObject returns false if the specified argument is an object with less than 2 populated properties",
          () =>
          {
              let obj = { a: 1 };

              expect( isPopulatedObject( obj, { minimumKeys: 2 } ) ).toBe( false );
          } );

    test( "isPopulatedObject returns true if the specified argument is an object with at least 2 populated properties",
          () =>
          {
              let obj = { a: 1, b: 1 };

              expect( isPopulatedObject( obj, { minimumKeys: 2 } ) ).toBe( true );
          } );

    test( "isPopulatedObject returns false if the specified argument is an object that does not contain a mandatory key",
          () =>
          {
              let obj = { a: 1 };

              expect( isPopulatedObject( obj, { manadatoryKeys: ["b", "c"] } ) ).toBe( false );
          } );

    test( "isPopulatedObject returns false if the specified argument is an object that does not contain all mandatory keys",
          () =>
          {
              let obj = { a: 1, b: 1 };

              expect( isPopulatedObject( obj, { manadatoryKeys: ["b", "c"] } ) ).toBe( false );
          } );

    test( "isPopulatedObject returns true if the specified argument is an object that contains all mandatory keys",
          () =>
          {
              let obj = { a: 1, b: 1, c: 1 };

              expect( isPopulatedObject( obj, { manadatoryKeys: ["b", "c"] } ) ).toBe( true );
          } );

    test( "isPopulatedObject returns false if the specified argument is an object with no populated properties",
          () =>
          {
              let obj = { a: {} };

              expect( isPopulatedObject( obj ) ).toBe( false );
          } );

    test( "isPopulatedObject returns false if the specified argument is an object graph with no populated properties",
          () =>
          {
              let obj = { a: { b: { c: null } } };

              expect( isPopulatedObject( obj ) ).toBe( false );
          } );

    test( "isPopulatedObject returns true if the specified argument is an object graph with at least one populated properties",
          () =>
          {
              let obj = { a: { b: { c: 1 } } };

              expect( isPopulatedObject( obj ) ).toBe( true );
          } );

    test( "isPopulatedObject returns true if the specified argument is one of the valid types and is not considered 'empty'",
          () =>
          {
              let obj = "abc";

              expect( isPopulatedObject( obj, { validTypes: ["string", "object"] } ) ).toBe( true );
          } );

    test( "isPopulatedObject returns false if the specified argument is one of the valid types but is considered 'empty'",
          () =>
          {
              let obj = "";

              expect( isPopulatedObject( obj, { validTypes: ["string", "object"] } ) ).toBe( false );
          } );

    test( "isPopulatedObject returns false if the specified argument is an array (by default)",
          () =>
          {
              let obj = [1, 2, 3];

              expect( isPopulatedObject( obj ) ).toBe( false );
          } );

    test( "isPopulatedObject returns true for an array with at least one populated element, when option set",
          () =>
          {
              let obj = [1, 2, 3];

              expect( isPopulatedObject( obj, { acceptArrays: true } ) ).toBe( true );
          } );

    test( "isPopulatedObject returns false for an array with no populated elements, even when option set",
          () =>
          {
              let obj = [null, undefined, null];

              expect( isPopulatedObject( obj, { acceptArrays: true } ) ).toBe( false );
          } );
} );

describe( "Valid Objects", () =>
{
    test( "isValidObject returns true if the argument is an object with at least one property (regardless of population)",
          () =>
          {
              let obj = { a: null };

              expect( isValidObject( obj ) ).toBe( true );
          } );

    test( "firstValidObject returns the leftmost argument that satisfies the function, isValidObject",
          () =>
          {
              let obj = [{}, 1, true, null, undefined, "abc", { a: null }, [], {}];

              expect( firstValidObject( ...obj ) ).toEqual( { a: null } );
          } );

    test( "firstPopulatedObject returns the leftmost argument that satisfies the function, isPopulated, or null",
          () =>
          {
              let obj = [{}, 1, true, null, undefined, "abc", { a: null }, {}, []];

              expect( firstPopulatedObject( ...obj ) ).toEqual( null );
          } );

    test( "firstPopulatedObject returns the leftmost argument that satisfies the function, isPopulated",
          () =>
          {
              let obj = [{}, 1, true, null, undefined, "abc", { a: 1 }, {}, []];

              expect( firstPopulatedObject( ...obj ) ).toEqual( { a: 1 } );
          } );
} );

describe( "getProperty", () =>
{
    test( "getProperty returns the value of the 'property' specified",
          () =>
          {
              let obj = new ClassTwo();

              expect( getProperty( obj, "id" ) ).toEqual( 777 );
          } );

    test( "getProperty returns an empty string if the 'property' specified cannot be read",
          () =>
          {
              let obj = new ClassTwo();

              expect( getProperty( obj, "nope" ) ).toEqual( "" );
          } );

    test( "getProperty returns the value of the 'property path' specified",
          () =>
          {
              let obj = { a: { b: { c: 666 } } };

              expect( getProperty( obj, "a.b.c" ) ).toEqual( 666 );
          } );
} );

describe( "hasProperty", () =>
{
    test( "hasProperty returns true if the 'property path' exists",
          () =>
          {
              let obj = { a: { b: { c: 666 } } };

              expect( hasProperty( obj, "a.b.c" ) ).toBe( true );
          } );

    test( "hasProperty returns true if the 'property' exists",
          () =>
          {
              let obj = { a: { b: { c: 666 } } };

              expect( hasProperty( obj, "a" ) ).toBe( true );
          } );

    test( "hasProperty returns false if the 'property' does not exist",
          () =>
          {
              let obj = { a: { b: { c: 666 } } };

              expect( hasProperty( obj, "d" ) ).toBe( false );
          } );

    test( "hasProperty returns false if the 'property path' does not exist",
          () =>
          {
              let obj = { a: { b: { c: 666 } } };

              expect( hasProperty( obj, "a.b.z" ) ).toBe( false );
          } );
} );

describe( "setProperty", () =>
{
    test( "setProperty changes, if possible, the value of the specified property and returns the value of the property",
          () =>
          {
              let obj = { a: 5 };

              expect( setProperty( obj, "a", 7 ) ).toEqual( 7 );
          } );

    test( "setProperty does not change the value of the specified property if the object is frozen",
          () =>
          {
              let obj = Object.freeze( { a: 5 } );

              expect( setProperty( obj, "a", 7 ) ).toEqual( 5 );
          } );

    test( "setProperty changes, if possible, the value of the specified property path and returns the value of the property",
          () =>
          {
              let obj = { a: { b: { c: 666 } } };

              expect( setProperty( obj, "a.b.c", 888 ) ).toEqual( 888 );
          } );
} );

describe( "identical", () =>
{
    test( "identical returns true only if the 2 objects are the exact same object",
          () =>
          {
              let objA = { a: { b: { c: 666 } } };
              let objB = { a: { b: { c: 666 } } };

              expect( identical( objA, objB ) ).toBe( false );
          } );

    test( "identical returns true when the 2 objects are the exact same object",
          () =>
          {
              let objA = { a: { b: { c: 666 } } };
              let objB = objA;

              expect( identical( objA, objB ) ).toBe( true );
          } );
} );

describe( "'same' tests objects for semantic equality", () =>
{
    test( "same returns true if the 2 objects have the same properties and values",
          () =>
          {
              let objA = { a: { b: { c: 666 } } };
              let objB = { a: { b: { c: 666 } } };

              expect( same( objA, objB ) ).toBe( true );
          } );

    test( "same also returns true if the 2 object are the exact same object",
          () =>
          {
              let objA = { a: { b: { c: 666 } } };
              let objB = objA;

              expect( same( objA, objB ) ).toBe( true );
          } );

    test( "same returns true for other types",
          () =>
          {
              let objA = 5;
              let objB = 5;

              expect( same( objA, objB ) ).toBe( true );
          } );

    test( "same returns true for strings ignoring whitespace",
          () =>
          {
              let objA = " abc";
              let objB = "abc";

              expect( same( objA, objB ) ).toBe( true );
          } );

    test( "same returns false for strings differing in whitespace if pStrict is true",
          () =>
          {
              let objA = " abc";
              let objB = "abc";

              expect( same( objA, objB, true ) ).toBe( false );
          } );
} );

describe( "isIdenticalTo as added to Object.prototype", () =>
{
    test( "Object.isIdenticalTo returns true only if the other object is the exact same object",
          () =>
          {
              let objA = { a: { b: { c: 666 } } };
              let objB = { a: { b: { c: 666 } } };

              expect( objA.isIdenticalTo( objB ) ).toBe( false );
          } );

    test( "Object.isIdenticalTo returns when the other object is the exact same object",
          () =>
          {
              let objA = { a: { b: { c: 666 } } };
              let objB = objA;

              expect( objA.isIdenticalTo( objB ) ).toBe( true );
          } );
} );

describe( "equals method added to Object.prototype", () =>
{
    test( "Object.equals returns true if the other object has the same properties and values",
          () =>
          {
              let objA = { a: { b: { c: 666 } } };
              let objB = { a: { b: { c: 666 } } };

              expect( objA.equals( objB ) ).toBe( true );
          } );

    test( "Object.equals also returns true if the other object is the exact same object",
          () =>
          {
              let objA = { a: { b: { c: 666 } } };
              let objB = objA;

              expect( objA.equals( objB ) ).toBe( true );
          } );
} );

describe( "arrayToObject", () =>
{
    test( "arrayToObject normally just converts indices to property keys",
          () =>
          {
              let arr = [1, 2, 3];
              let obj = arrayToObject( arr );

              expect( obj ).toEqual( { 0: 1, 1: 2, 2: 3 } );
          } );

    test( "arrayToObject can unwrap an object from a one-element array",
          () =>
          {
              let arr = [{ a: 1, b: 2 }];
              let obj = arrayToObject( arr, "b" );

              expect( obj ).toEqual( {
                                         "2": {
                                             "a": 1,
                                             "b": 2
                                         }
                                     }
              );
          } );
} );

describe( "findImplementor", () =>
{
    test( "findImplementor returns the first object that implements the specified method",
          () =>
          {
              let implementor = findImplementor( "doSomething", new ClassOne(), new ClassTwo(), new ClassThree(), { "doSomething": function() {} } );

              expect( implementor instanceof ClassThree ).toBe( true );
          } );

    test( "findImplementor returns null  if none of the objects implement the specified method",
          () =>
          {
              let implementor = findImplementor( "doNothing", new ClassOne(), new ClassTwo(), new ClassThree(), { "doSomething": function() {} } );

              expect( implementor ).toBe( null );
          } );
} );

describe( "collectImplementors", () =>
{
    test( "collectImplementors returns a collection of objects that implement the specified method",
          () =>
          {
              let classOne = new ClassOne();
              let classTwo = new ClassTwo();
              let classThree = new ClassThree();

              let obj = { "doSomething": function() {} };

              let implementors = collectImplementors( "doSomething", classOne, classTwo, classThree, obj );

              expect( implementors ).toEqual( [classThree, obj] );
          } );

    test( "collectImplementors returns an empty collection if none of the objects implement the specified method",
          () =>
          {
              let implementors = collectImplementors( "doNothing", new ClassOne(), new ClassTwo(), new ClassThree(), { "doSomething": function() {} } );

              expect( implementors ).toEqual( [] );
          } );
} );

describe( "Cloning", () =>
{
    test( "emptyClone returns an object with the same structure as the specified source object",
          () =>
          {
              let obj = { a: "", b: { c: {} }, "foo": true, "bar": 7 };
              let clone = emptyClone( obj );

              expect( clone ).toEqual( { a: "", b: { c: {} }, "foo": false, "bar": 0 } );

          } );

    test( "clone returns a new object with the same structure and properties/values as the specified source object",
          () =>
          {
              let a = "a";
              let b = { c: 3 };
              let c = { d: { e: 42 } };
              let d = { foo: "bar" };

              let composite = { a: a, b: b, c: c, d: d };

              let obj = { composite: composite, a: a, b: b, c: c, d: d };

              let copy = clone( obj );

              expect( copy ).toEqual( {
                                          composite: { a: "a", b: { c: 3 }, c: { d: { e: 42 } }, d: { foo: "bar" } },
                                          a: "a",
                                          b: { c: 3 },
                                          c: { d: { e: 42 } },
                                          d: { foo: "bar" }
                                      } );

              a = "AY";
              b = { c: "three" };
              c = {};
              d = { "foo": "foo" };

              composite = { a: a, b: b, c: c, d: d };

              expect( a === copy.a ).toBe( false );
              expect( b === copy.b ).toBe( false );
              expect( c === copy.c ).toBe( false );
              expect( d === copy.d ).toBe( false );
              expect( composite === copy.composite ).toBe( false );

              obj.a = a;
              obj.b = b;
              obj.c = c;
              obj.d = d;

              obj.composite = composite;

              expect( a === copy.a ).toBe( false );
              expect( b === copy.b ).toBe( false );
              expect( c === copy.c ).toBe( false );
              expect( d === copy.d ).toBe( false );
              expect( composite === copy.composite ).toBe( false );

              expect( a === obj.a ).toBe( true );
              expect( b === obj.b ).toBe( true );
              expect( c === obj.c ).toBe( true );
              expect( d === obj.d ).toBe( true );
              expect( composite === obj.composite ).toBe( true );

              expect( copy.a === obj.a ).toBe( false );
              expect( copy.b === obj.b ).toBe( false );
              expect( copy.c === obj.c ).toBe( false );
              expect( copy.d === obj.d ).toBe( false );
              expect( copy.composite === obj.composite ).toBe( false );

          } );

    test( "clone returns an object with its methods intact",
          () =>
          {
              const source =
                  {
                      a: 2,
                      b: { c: { d: 4 } },
                      c: function( pA, pB )
                      {
                          return ((pA + pB) * this.a) - this.b.c.d;
                      }
                  };

              const copy = clone( source, { omitFunctions: false, freeze: true } );

              // it's a copy
              expect( copy === source ).toBe( false );

              // it is frozen
              expect( Object.isFrozen( copy ) ).toBe( true );

              // it has the expected values
              expect( copy.a ).toEqual( 2 );
              expect( copy.b.c.d ).toEqual( 4 );

              // it's methods still return the expected values
              expect( copy.c( 10, 20 ) ).toEqual( 56 );

              expect( Object.isFrozen( copy.a ) ).toBe( true );
              expect( Object.isFrozen( copy.b ) ).toBe( true );
              expect( Object.isFrozen( copy.b.c ) ).toBe( true );
              expect( Object.isFrozen( copy.b.c.d ) ).toBe( true );


          } );
} );

describe( "ingest and augment", () =>
{
    test( "ingest applies the properties of each object to the first object",
          () =>
          {
              let obj = { a: 1, b: 2, c: { d: { e: 42 } } };

              let obj2 = { a: "ay", b: 2, c: { d: { e: 42 } }, "baz": false };
              let obj3 = { a: "ay", b: "bee", c: { d: { e: 777 } }, "foo": "bar" };
              let obj4 = { a: 1, b: "bee", c: { d: { e: 777 } }, "zzz": "xyz" };

              let obj5 = ingest( obj, obj2, obj3, obj4 );

              expect( obj5 ).toEqual( {
                                          a: 1,
                                          b: "bee",
                                          c: { d: { e: 777 } },
                                          "baz": false,
                                          "foo": "bar",
                                          "zzz": "xyz"
                                      } );

              expect( obj ).toEqual( obj5 );
          } );

    test( "augment with default options - returns expected object",
          () =>
          {
              const obj =
                  {
                      a: 1,
                      b: 2,
                      c:
                          {
                              a: 1,
                              b: 2,
                              c:
                                  {
                                      a: 1,
                                      b: 2,
                                      c:
                                          {
                                              a: 1,
                                              b: 2,
                                              c:
                                                  {
                                                      a: 11,
                                                      b: 22
                                                  }
                                          }
                                  }
                          }
                  };

              const obj2 =
                  {
                      a: "a",
                      b: "b",
                      c:
                          {
                              a: "a",
                              b: "b",
                              c:
                                  {
                                      a: "a",
                                      b: "b",
                                      c:
                                          {
                                              a: "a",
                                              b: "b",
                                              c:
                                                  {
                                                      a: "aa",
                                                      b: "bb",
                                                      c: 3
                                                  },
                                              d: 4
                                          },
                                      d: "ddd",
                                      e: "efg",
                                      f: "eff"
                                  },
                              d: "dee",
                              e: "eee"
                          },
                      d: "d",
                      e:
                          {
                              "ee": "ee",
                              "ff": "ff",
                              g:
                                  {
                                      a: [1, 2, 3],
                                      b: [4, 5, 6]
                                  }
                          }
                  };

              let augmented = augment( obj, obj2 );

              expect( augmented === obj ).toBe( false );
              expect( augmented === obj2 ).toBe( false );
              expect( obj2 === obj ).toBe( false );
              expect( obj === obj2 ).toBe( false );

              expect( augmented ).toEqual( {
                                               "a": 1,
                                               "b": 2,
                                               "c": {
                                                   "a": 1,
                                                   "b": 2,
                                                   "c": {
                                                       "a": 1,
                                                       "b": 2,
                                                       "c": {
                                                           "a": "a",
                                                           "b": "b",
                                                           "c": {
                                                               "a": "aa",
                                                               "b": "bb",
                                                               "c": 3
                                                           },
                                                           "d": 4
                                                       },
                                                       "d": "ddd",
                                                       "e": "efg",
                                                       "f": "eff"
                                                   },
                                                   "d": "dee",
                                                   "e": "eee"
                                               },
                                               "d": "d",
                                               "e": {
                                                   "ee": "ee",
                                                   "ff": "ff",
                                                   "g": {
                                                       "a": [
                                                           1,
                                                           2,
                                                           3
                                                       ],
                                                       "b": [
                                                           4,
                                                           5,
                                                           6
                                                       ]
                                                   }
                                               }
                                           } );
          } );

    test( "augment non-recursive - returns expected object",
          () =>
          {
              const obj =
                  {
                      a: 1,
                      b: 2,
                      c:
                          {
                              a: 1,
                              b: 2,
                              c:
                                  {
                                      a: 1,
                                      b: 2,
                                      c:
                                          {
                                              a: 1,
                                              b: 2,
                                              c:
                                                  {
                                                      a: 11,
                                                      b: 22
                                                  }
                                          }
                                  }
                          }
                  };

              const obj2 =
                  {
                      a: "a",
                      b: "b",
                      c:
                          {
                              a: "a",
                              b: "b",
                              c:
                                  {
                                      a: "a",
                                      b: "b",
                                      c:
                                          {
                                              a: "a",
                                              b: "b",
                                              c:
                                                  {
                                                      a: "aa",
                                                      b: "bb",
                                                      c: 3
                                                  },
                                              d: 4
                                          },
                                      d: "ddd",
                                      e: "efg",
                                      f: "eff"
                                  },
                              d: "dee",
                              e: "eee"
                          },
                      d: "d",
                      e:
                          {
                              "ee": "ee",
                              "ff": "ff",
                              g:
                                  {
                                      a: [1, 2, 3],
                                      b: [4, 5, 6]
                                  }
                          }
                  };

              let augmented = augment( obj, obj2, { recursive: false } );

              expect( augmented === obj ).toBe( false );
              expect( augmented === obj2 ).toBe( false );
              expect( obj2 === obj ).toBe( false );
              expect( obj === obj2 ).toBe( false );

              expect( augmented ).toEqual( {
                                               "a": 1,
                                               "b": 2,
                                               "c": {
                                                   "a": 1,
                                                   "b": 2,
                                                   "c": {
                                                       "a": 1,
                                                       "b": 2,
                                                       "c": {
                                                           "a": 1,
                                                           "b": 2,
                                                           "c": {
                                                               "a": 11,
                                                               "b": 22
                                                           }
                                                       }
                                                   }
                                               },
                                               "d": "d",
                                               "e": {
                                                   "ee": "ee",
                                                   "ff": "ff",
                                                   "g": {
                                                       "a": [
                                                           1,
                                                           2,
                                                           3
                                                       ],
                                                       "b": [
                                                           4,
                                                           5,
                                                           6
                                                       ]
                                                   }
                                               }
                                           } );
          } );


    test( "augment with appendToArrays option - returns object with the superset of the arrays",
          () =>
          {
              const obj =
                  {
                      a: 1,
                      b: 2,
                      c: [1, 2, 3]
                  };

              const obj2 =
                  {
                      a: "a",
                      b: "b",
                      c: [4, 5, 6]
                  };

              let augmented = augment( obj, obj2, { appendToArrays: true } );

              expect( augmented ).toEqual( {
                                               a: 1,
                                               b: 2,
                                               c: [1, 2, 3, 4, 5, 6]
                                           } );
          } );

    test( "augment with appendToArrays option with objectB array having more elements - returns expected object",
          () =>
          {
              const obj =
                  {
                      a: 1,
                      b: 2,
                      c: [1, 2, 3]
                  };

              const obj2 =
                  {
                      a: "a",
                      b: "b",
                      c: [4, 5, 6, 7, 8, 9]
                  };

              let augmented = augment( obj, obj2, { appendToArrays: true } );

              expect( augmented ).toEqual( {
                                               a: 1,
                                               b: 2,
                                               c: [1, 2, 3, 4, 5, 6, 7, 8, 9]
                                           } );
          } );

    test( "augment with addMissingMapEntries option - returns expected object",
          () =>
          {
              const mapA = new Map();
              const mapB = new Map();

              mapA.set( "a", 1 );
              mapA.set( "b", 2 );

              mapB.set( "a", "a" );
              mapB.set( "b", "b" );
              mapB.set( "c", "c" );

              const obj =
                  {
                      a: 1,
                      b: 2,
                      c: mapA
                  };

              const obj2 =
                  {
                      a: "a",
                      b: "b",
                      c: mapB
                  };

              let augmented = augment( obj, obj2, { addMissingMapEntries: true } );

              expect( augmented.c.get( "a" ) ).toEqual( 1 );
              expect( augmented.c.get( "b" ) ).toEqual( 2 );
              expect( augmented.c.get( "c" ) ).toEqual( "c" );

          } );
} );

describe( "populate", () =>
{
    test( "populate returns expected object",
          () =>
          {
              const obj =
                  {
                      a: 1,
                      b: 2,
                      c:
                          {
                              a: "a",
                              b: "b"
                          },
                      foo: "bar"
                  };

              const obj2 =
                  {
                      b: "bee",
                      c:
                          {
                              a: 1,
                              b: 2
                          },
                      d: 4,
                      e: 5
                  };

              const expected =
                  {
                      a: 1,
                      b: "bee",
                      c:
                          {
                              a: 1,
                              b: 2
                          },
                      foo: "bar"
                  };


              let populated = populateObject( obj, obj2 );

              expect( populated === obj ).toBe( false );
              expect( populated === obj2 ).toBe( false );
              expect( obj2 === obj ).toBe( false );
              expect( obj === obj2 ).toBe( false );

              expect( populated ).toEqual( expected );

          } );
} );

describe( "prune removes 'dead' or undesired properties", () =>
{
    test( "prune with default options returns expected object",
          () =>
          {
              const obj =
                  {
                      a: {},
                      b: 2,
                      c: { d: {} },
                      d: [1, 2, 3],
                      e: [],
                      f: "foo",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: "",
                      k: ["", ""]
                  };

              const expected =
                  {
                      b: 2,
                      d: [1, 2, 3],
                      f: "foo",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: "",
                      k: ["", ""]
                  };

              expect( JSON.stringify( prune( obj ) ) ).toEqual( JSON.stringify( expected ) );
          } );

    test( "prune with options to remove empty string returns expected object",
          () =>
          {
              const obj =
                  {
                      a: {},
                      b: 2,
                      c: { d: {} },
                      d: [1, 2, 3],
                      e: [],
                      f: "foo",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: "",
                      k: ["", ""]
                  };

              const expected =
                  {
                      b: 2,
                      d: [1, 2, 3],
                      f: "foo",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      k: ["", ""]
                  };

              let actual = prune( obj, { removeEmptyStrings: true } );

              expect( JSON.stringify( actual ) ).toEqual( JSON.stringify( expected ) );
          } );

    test( "prune with options to prune arrays returns expected object",
          () =>
          {
              const obj =
                  {
                      a: {},
                      b: 2,
                      c: { d: {} },
                      d: [1, 2, 3, 1 / 0],
                      e: [],
                      f: "foo",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: "",
                      k: ["", ""]
                  };

              const expected =
                  {
                      b: 2,
                      d: [1, 2, 3],
                      f: "foo",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: ""
                  };

              expect( JSON.stringify( prune( obj, { pruneArrays: true } ) ) ).toEqual( JSON.stringify( expected ) );
          } );

    test( "prune with options to prune arrays, but not remove empty arrays, returns expected object",
          () =>
          {
              const obj =
                  {
                      a: {},
                      b: 2,
                      c: { d: {} },
                      d: [1, 2, 3, 1 / 0, 4],
                      e: [],
                      f: "foo",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: "",
                      k: ["", ""]
                  };

              const expected =
                  {
                      b: 2,
                      d: [1, 2, 3, 4],
                      e: [],
                      f: "foo",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: "",
                      k: []
                  };

              expect( JSON.stringify( prune( obj,
                                             {
                                                 pruneArrays: true,
                                                 removeEmptyArrays: false
                                             } ) ) ).toEqual( JSON.stringify( expected ) );
          } );

    test( "prune with options to prune arrays and remove empty strings returns expected object",
          () =>
          {
              const obj =
                  {
                      a: {},
                      b: 2,
                      c: { d: {} },
                      d: [1, 2, 3, 1 / 0, 4],
                      e: [],
                      f: "foo",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: "",
                      k: ["", ""]
                  };

              const expected =
                  {
                      b: 2,
                      d: [1, 2, 3, 4],
                      f: "foo",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                  };

              const options = { pruneArrays: true, removeEmptyStrings: true };

              expect( JSON.stringify( prune( obj, options ) ) ).toEqual( JSON.stringify( expected ) );
          } );

    test( "prune with most aggressive options returns expected object",
          () =>
          {
              const obj =
                  {
                      a: {},
                      b: 2,
                      c: { d: {} },
                      d: [1, 2, 3, 1 / 0, 4],
                      e: [],
                      f: " foo ",
                      g: "",
                      h: function() { return 5; },
                      i: function( ...pArgs ) { return 5; },
                      j: "",
                      k: ["", ""]
                  };

              const expected =
                  {
                      b: 2,
                      d: [1, 2, 3, 4],
                      f: "foo"
                  };

              const options =
                  {
                      removeEmptyObjects: true,
                      removeEmptyArrays: true,
                      removeEmptyStrings: true,
                      removeFunctions: true,
                      pruneArrays: true,
                      trimStrings: true
                  };

              expect( JSON.stringify( prune( obj, options ) ) ).toEqual( JSON.stringify( expected ) );
          } );
} );

describe( "toLiteral erases class prototype", () =>
{
    test( "toLiteral with default options returns expected object",
          () =>
          {
              class Address
              {
                  #city = "";
                  #state = "";
                  #zip = "";

                  constructor( pCity, pState, pZip )
                  {
                      this.#city = pCity;
                      this.#state = pState;
                      this.#zip = pZip;
                  }

                  get city()
                  {
                      return this.#city;
                  }

                  get state()
                  {
                      return this.#state;
                  }

                  get zip()
                  {
                      return this.#zip;
                  }
              }

              class House
              {
                  #style = "";
                  #address = {};

                  #locked = false;

                  constructor( pStyle, pAddress )
                  {
                      this.#style = pStyle;
                      this.#address = pAddress || {};
                  }

                  get style()
                  {
                      return this.#style;
                  }

                  get address()
                  {
                      return this.#address;
                  }

                  get city()
                  {
                      return this.#address?.city;
                  }

                  get state()
                  {
                      return this.#address?.state;
                  }

                  get zip()
                  {
                      return this.#address?.zip;
                  }

                  lock()
                  {
                      this.#locked = true;
                  }

                  unlock()
                  {
                      this.#locked = false;
                  }
              }

              let address = new Address( "Chicago", "Illinois", "60601" );

              let house = new House( "Brownstone", address );

              house.lock();

              let obj = toLiteral( house );

              expect( obj === house ).toBe( false );

              expect( obj instanceof House ).toBe( false );

              expect( obj.city ).toEqual( "Chicago" );

              expect( obj.state ).toEqual( "Illinois" );

              expect( obj.locked ).toBe( undefined );

              expect( obj.address instanceof Address ).toBe( false );

              expect( typeof obj.lock ).toEqual( "undefined" );

          } );

    test( "toLiteral with options to include functions returns expected object",
          () =>
          {
              class Address
              {
                  #city = "";
                  #state = "";
                  #zip = "";

                  constructor( pCity, pState, pZip )
                  {
                      this.#city = pCity;
                      this.#state = pState;
                      this.#zip = pZip;
                  }

                  get city()
                  {
                      return this.#city;
                  }

                  get state()
                  {
                      return this.#state;
                  }

                  get zip()
                  {
                      return this.#zip;
                  }
              }

              class House
              {
                  #style = "";
                  #address = {};

                  #locked = false;

                  constructor( pStyle, pAddress )
                  {
                      this.#style = pStyle;
                      this.#address = pAddress || {};
                  }

                  get style()
                  {
                      return this.#style;
                  }

                  get address()
                  {
                      return this.#address;
                  }

                  get city()
                  {
                      return this.#address?.city;
                  }

                  get state()
                  {
                      return this.#address?.state;
                  }

                  get zip()
                  {
                      return this.#address?.zip;
                  }

                  lock()
                  {
                      this.#locked = true;
                  }

                  unlock()
                  {
                      this.#locked = false;
                  }
              }

              let address = new Address( "Chicago", "Illinois", "60601" );

              let house = new House( "Brownstone", address );

              house.lock();

              let obj = toLiteral( house, { removeFunctions: false } );

              expect( obj === house ).toBe( false );

              expect( obj instanceof House ).toBe( false );

              expect( obj.city ).toEqual( "Chicago" );

              expect( obj.state ).toEqual( "Illinois" );

              expect( obj.locked ).toBe( undefined );

              expect( obj.address instanceof Address ).toBe( false );

              expect( typeof obj.lock ).toEqual( "function" );

          } );
} );

describe( "findNode / findRoot",
          function findNodesTest()
          {
              const obj =
                  {
                      a:
                          {
                              b:
                                  {
                                      c:
                                          {
                                              d: 4
                                          }
                                  }
                          },
                      b:
                          {
                              c:
                                  {
                                      d: 4
                                  }
                          },
                      c:
                          {
                              d: 4
                          },
                      d: 4
                  };

              test( "findNode",
                    () =>
                    {
                        let node = findNode( obj, "a", "b" );
                        expect( node ).toBe( obj.a.b );

                        node = findNode( obj, "a", "a" );
                        expect( node ).toBe( undefined );
                    } );

              test( "findRoot",
                    () =>
                    {
                        const dependencies = findNode( $scope(), "__BOCK__OBJECT_UTILS__", "dependencies" );

                        expect( Object.keys( dependencies ).length ).toBe( 5 );

                        const root = findRoot( obj, obj.a.b.c );

                        expect( root ).toEqual( obj );

                        let pathTo = tracePathTo( obj.a.b.c, obj.a );

                        expect( pathTo.join( "." ) ).toEqual( "b.c" );

                        pathTo = tracePathTo( obj.a.b.c.d, obj.a );

                        expect( pathTo.join( "." ) ).toEqual( "b.c.d" );

                        const found = findRoot( this, obj.a.b.c );

                        expect( found ).toBe( null );

                    } );
          } );

