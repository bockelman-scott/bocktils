const core = require( "@toolbocks/core" );

const objectUtils = require( "../src/ObjectUtils.cjs" );

const
    {
        moduleUtils,
        constants,
        typeUtils,
        functionUtils
    } = core;

/**
 * Defines a string to represent the type, undefined
 */
const { _ud = "undefined", $scope } = constants;

objectUtils.disableLogging();

const { OBJECT_REGISTRY, detectCycles, } = moduleUtils;

const { arrayToObject } = typeUtils;

const {
    getProperty = moduleUtils?.getProperty || typeUtils?.getProperty,
    hasProperty = moduleUtils?.hasProperty || typeUtils?.hasProperty,
    setProperty = moduleUtils?.setProperty || typeUtils?.setProperty,
    getEntries = moduleUtils?.objectEntries,
    ObjectEntry = moduleUtils?.ObjectEntry || typeUtils?.ObjectEntry,
    isNullOrNaN = typeUtils?.isNullOrNaN,
    getClass = typeUtils?.getClass,
    getClassName = typeUtils?.getClassName,
    isPopulatedObject = typeUtils?.isPopulated,
    isValidObject,
    firstValidObject,
    firstPopulatedObject,
    identical,
    same,
    findImplementor,
    collectImplementors,
    toLiteral,
    findNode,
    invertProperties
} = objectUtils;

const {
    getFunctionSource,
    extractFunctionData,
    extractFunctionBody,
    extractFunctionParameters,
} = functionUtils;

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

describe( "invertProperties", () =>
{
    test( "invertProperties",
          () =>
          {
              let OBJ =
                  {
                      "A": "apple",
                      "B": "banana",
                      C: "cherry",
                      D: "daikon radish"
                  };

              let INVERTED = invertProperties( OBJ );

              expect( INVERTED["apple"] ).toEqual( "A" );
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

describe( "OBJECT_REGISTRY", () =>
{
    // ObjectUtils adds this property to the Object prototype
    test( "OBJECT_REGISTRY.getGuid returns a value unique to the object",
          () =>
          {
              let o = new ClassOne();
              let o2 = new ClassTwo();
              let o3 = {};

              const regExp = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/i;

              expect( regExp.test( OBJECT_REGISTRY.getGuid( o ) ) ).toBe( true );
              expect( regExp.test( OBJECT_REGISTRY.getGuid( o2 ) ) ).toBe( true );
              expect( regExp.test( OBJECT_REGISTRY.getGuid( o3 ) ) ).toBe( true );

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

              expect( isPopulatedObject( obj, { mandatoryKeys: ["b", "c"] } ) ).toBe( false );
          } );

    test( "isPopulatedObject returns false if the specified argument is an object that does not contain all mandatory keys",
          () =>
          {
              let obj = { a: 1, b: 1 };

              expect( isPopulatedObject( obj, { mandatoryKeys: ["b", "c"] } ) ).toBe( false );
          } );

    test( "isPopulatedObject returns true if the specified argument is an object that contains all mandatory keys",
          () =>
          {
              let obj = { a: 1, b: 1, c: 1 };

              expect( isPopulatedObject( obj, { mandatoryKeys: ["b", "c"] } ) ).toBe( true );
          } );

    test( "isPopulatedObject returns false if the specified argument is an object with no populated properties",
          () =>
          {
              let obj = { a: {} };

              expect( isPopulatedObject( obj, { countDeadBranches: false } ) ).toBe( false );
          } );

    test( "isPopulatedObject returns false if the specified argument is an object graph with no populated properties",
          () =>
          {
              let obj = { a: { b: { c: null } } };

              expect( isPopulatedObject( obj, { countDeadBranches: false } ) ).toBe( false );
          } );

    test( "isPopulatedObject returns true if the specified argument is an object graph with at least one populated properties",
          () =>
          {
              let obj = { a: { b: { c: 1 } } };

              expect( isPopulatedObject( obj, { countDeadBranches: false } ) ).toBe( true );
          } );

    test( "isPopulatedObject returns true if the specified argument is one of the valid types and is not considered 'empty'",
          () =>
          {
              let obj = "abc";

              expect( isPopulatedObject( obj, { acceptedTypes: ["string", "object"] } ) ).toBe( true );
          } );

    test( "isPopulatedObject returns false if the specified argument is one of the valid types but is considered 'empty'",
          () =>
          {
              let obj = "";

              expect( isPopulatedObject( obj, { acceptedTypes: ["string", "object"] } ) ).toBe( false );
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

              expect( getProperty( obj, "nope" ) ).toEqual( undefined );
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
              let obj = arrayToObject( arr );

              expect( obj ).toEqual( {
                                         "0": {
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

                  fullAddress()
                  {
                      return `${this.city}, ${this.state} ${this.zip}`;
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

              let obj = toLiteral( house, { omitFunctions: false } );

              expect( obj === house ).toBe( false );

              expect( obj instanceof House ).toBe( false );

              expect( obj.city ).toEqual( "Chicago" );

              expect( obj.state ).toEqual( "Illinois" );

              expect( obj.locked ).toBe( undefined );

              expect( obj.address instanceof Address ).toBe( false );

              expect( typeof obj.lock ).toEqual( "function" );

              expect( typeof obj.address.fullAddress ).toBe( "function" );

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
          } );


/*

 describe( "mergeJson", () =>
 {
 test( "mergeJson lets you combine 2 objects",
 () =>
 {
 let merged = mergeJson( addresses, people );

 expect( Object.keys( addresses ).length ).toEqual( 3 );

 expect( Object.keys( people ).length ).toEqual( 4 );

 expect( Object.keys( merged ).length ).toEqual( 4 );

 expect( merged.Apex41.age ).toEqual( 32 );
 } );
 } );

 describe( "JsonMerger", () =>
 {
 test( "JsonMerger is used to merge one or more JSON objects",
 () =>
 {
 const noArgs = new JsonMerger();

 let merged = noArgs.merge( addresses, people );

 expect( Object.keys( addresses ).length ).toEqual( 3 );

 expect( Object.keys( people ).length ).toEqual( 4 );

 expect( Object.keys( merged ).length ).toEqual( 4 );

 expect( merged.Apex41.age ).toEqual( 32 );
 } );

 test( "JsonMerger is used to filter the results of merging one or more JSON objects",
 () =>
 {
 const filter = function( pEntry )
 {
 const entry = pEntry instanceof ObjectEntry ? pEntry : isArray( pEntry ) ? new ObjectEntry( pEntry ) : pEntry;

 if ( "Lombard" === entry?.city && asInt( entry?.age ) > 25 )
 {
 return entry;
 }

 return null;
 };

 const filtering = new JsonMerger( [filter] );

 const merged = filtering.merge( addresses, people );

 console.log( merged );

 expect( Object.keys( addresses ).length ).toEqual( 3 );

 expect( Object.keys( people ).length ).toEqual( 4 );

 expect( Object.keys( merged ).length ).toEqual( 1 );

 expect( merged.Apex41.age ).toEqual( 32 );
 } );

 test( "JsonMerger is used to map the results of merging one or more JSON objects",
 () =>
 {
 const mapper = function( pEntry )
 {
 let entry = pEntry instanceof ObjectEntry ? pEntry : isArray( pEntry ) ? new ObjectEntry( pEntry ) : pEntry;

 if ( entry?.city )
 {
 entry.city = "Bloomington";
 }
 if ( entry?.state )
 {
 entry.state = "IN";
 }
 if ( entry?.zip )
 {
 entry.zip = "47405";
 }

 return entry;
 };

 const mapping = new JsonMerger( [], [mapper] );

 const merged = mapping.merge( addresses, people );

 console.log( merged );

 expect( Object.keys( addresses ).length ).toEqual( 3 );

 expect( Object.keys( people ).length ).toEqual( 4 );

 expect( Object.keys( merged ).length ).toEqual( 4 );

 expect( merged.Apex41.city ).toEqual( "Bloomington" );
 expect( merged.Apex41.state ).toEqual( "IN" );
 expect( merged.Apex41.zip ).toEqual( "47405" );
 } );
 } );

 */
