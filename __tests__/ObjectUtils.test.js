const objectUtils = require( "../utils/ObjectUtils.js" );

const constants = objectUtils?.dependencies?.constants || require( "../utils/Constants.js" );
const typeUtils = objectUtils?.dependencies?.typeUtils || require( "../utils/TypeUtils.js" );
const stringUtils = objectUtils?.dependencies?.stringUtils || require( "../utils/StringUtils.js" );
const arrayUtils = objectUtils?.dependencies?.arrayUtils || require( "../utils/ArrayUtils.js" );


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
