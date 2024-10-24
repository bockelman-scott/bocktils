/**
 * This module provides wrapper functions to execute functions and methods without having to catch errors.
 *
 * The 'family' of functions that start with 'attempt'
 * return an object with the function or method's return value
 * and an array of any errors thrown by the specified function
 * in the following form:
 *
 * { returnValue, exceptions }
 *
 *
 */


const constants = require( "./Constants.cjs" );
const typeUtils = require( "./TypeUtils.cjs" );
const stringUtils = require( "./StringUtils.cjs" );
const arrayUtils = require( "./ArrayUtils.cjs" );
const objectUtils = require( "./ObjectUtils.cjs" );

const _ud = constants?._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
    const me = exposeModule;

    /**
     * Create local variables for the imported values and functions we use.
     * This is technically unnecessary, but some IDEs cannot recognize the imported variables otherwise.
     * IDEs that report unrecognized variables are more useful if we remove the false positives this way.
     */

    let asString = stringUtils.asString;
    let asInt = stringUtils.asInt;

    let asArray = arrayUtils.asArray;

    let isString = typeUtils.isString;
    let isObject = typeUtils.isObject;

    let isFunction = typeUtils.isFunction;
    let isAsyncFunction = typeUtils.isAsyncFunction;
    let isClass = typeUtils.isClass;

    let no_op = objectUtils.no_op || function() {};
    let op_true = function() { return true; };
    let op_false = function() { return false; };
    let op_identity = function( pArg ) { return pArg; };

    let Result = typeUtils.Result;

    // import the dependencies
    constants.importUtilities( this || me, constants, typeUtils, stringUtils, arrayUtils, objectUtils );

    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__FUNCTION_UTILS__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    /**
     * An array of this module's dependencies
     * which are re-exported with this module,
     * so if you want to, you can just import the leaf module
     * and then use the other utilities as properties of that module
     */
    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils
        };

    /**
     * Returns a suitable 'this' or scope for the execution of a method
     *
     * @param pObject the object on which to call a method
     * @returns {object} a suitable 'this' or scope for the execution of a method
     * @private
     */
    function resolveContext( pObject )
    {
        if ( null === pObject || _ud === typeof pObject )
        {
            return $scope() || {};
        }
        return (isObject( pObject ) || isFunction( pObject )) ? pObject : (isString( pObject ) ? $scope()[asString( pObject, true )] || $scope() || {} : $scope() || {});
    }

    /**
     * Executes an asynchronous function without blocking and without any callbacks.
     * Does not require try/catch; any errors are simply ignored
     *
     * @param pAsyncFunction the function to execute
     * @param pArgs one or more arguments to pass to the function
     */
    const fireAndForget = function( pAsyncFunction, ...pArgs )
    {
        const func = pAsyncFunction || no_op;

        if ( isAsyncFunction( func ) )
        {
            setTimeout( function()
                        {
                            func.call( $scope(), ...pArgs ).then( no_op ).catch( no_op );
                        }, 10, ...pArgs );
        }
        else if ( isFunction( func ) )
        {
            setTimeout( function()
                        {
                            try
                            {
                                func.call( $scope(), ...pArgs );
                            }
                            catch( ex )
                            {
                                // ignored
                            }
                        }, 10, ...pArgs );
        }
    };

    /**
     * A subclass of Result, which is a subclass of Option
     * @see TypeUtils: Option and TypeUtils: Result
     */
    class FunctionResult extends Result
    {
        #args = [];

        constructor( pValue, pErrors, ...pArgs )
        {
            super( pValue, pErrors );

            this.#args = [].concat( asArray( pArgs ) ).map( e => objectUtils.copy( e ) );
        }

        get arguments()
        {
            return [].concat( asArray( this.#args ) ).map( e => objectUtils.copy( e ) );
        }
    }

    /**
     * Returns a Promise of an object of type, FunctionResult
     *
     * FunctionResult is an Option with an extra property to capture errors.
     * FunctionResult objects also store their arguments.
     * This can be used to memento-ize functions if desired.
     *
     * value: the value returned by the specified asynchronous function, if any
     * exceptions: an array of any errors thrown during the execution of the specified function.
     *
     * @param pOperation an asynchronous function to execute (or a synchronous function to execute asynchronously)
     * @param pArgs (optional) one or more arguments to pass to the function
     *
     * @returns {Promise<FunctionResult>} a Promise of an object of type, FunctionResult
     *
     * @see FunctionResult
     */
    const attemptAsync = async function( pOperation, ...pArgs )
    {
        let returnValue = null;

        let exceptions = [];

        try
        {
            if ( isFunction( pOperation ) )
            {
                try
                {
                    returnValue = await pOperation.apply( $scope(), asArray( pArgs ) );
                }
                catch( ex2 )
                {
                    exceptions.push( ex2 );
                }
            }
        }
        catch( ex )
        {
            exceptions.push( ex );
        }

        return new FunctionResult( returnValue, exceptions, ...pArgs );
    };

    /**
     * Returns a FunctionResult.
     *
     * FunctionResult is an Option with an extra property to capture errors.
     * FunctionResult objects also store their arguments.
     * This can be used to memento-ize functions if desired.
     *
     * value: the value returned by the specified asynchronous function, if any
     * exceptions: an array of any errors thrown during the execution of the specified function.
     *
     * @param pOperation a function to execute
     * @param pArgs (optional) one or more arguments to pass to the function
     *
     * @returns {FunctionResult} an object of type, FunctionResult
     *
     * If an asynchronous function is passed, this function will return a Promise.
     * Normally, calling attemptAsync is preferred, however, this function can be used to return a Promise
     */
    const attempt = function( pOperation, ...pArgs )
    {
        let returnValue = null;

        let exceptions = [];

        try
        {
            if ( isFunction( pOperation ) )
            {
                if ( isAsyncFunction( pOperation ) )
                {
                    return Promise.resolve( ((async function()
                    {
                        return await attemptAsync( pOperation, ...pArgs );
                    })()) );
                }
                else
                {
                    try
                    {
                        returnValue = pOperation.apply( $scope(), asArray( pArgs ) );
                    }
                    catch( ex2 )
                    {
                        exceptions.push( ex2 );
                    }
                }
            }
        }
        catch( ex )
        {
            exceptions.push( ex );
        }

        return new FunctionResult( returnValue, exceptions, ...pArgs );
    };

    /**
     * Returns a function suitable for execution from either a function, method, or the name of the method.
     *
     * @param pMethod {function|string} the function or method itself
     *                                  or the name of a method expected to be a member of the specified object
     *
     * @param pObject (optional) the object that implements the method or on which the method will be called.
     *
     * @returns {function}
     */
    function resolveMethod( pMethod, pObject )
    {
        return isFunction( pMethod ) ? pMethod : (isString( pMethod ) ? (resolveContext( pObject )[asString( pMethod, true )]) || no_op : no_op);
    }

    function resolveFunction( pFunction )
    {
        return resolveMethod( pFunction, $scope() );
    }

    /**
     * Returns a Promise of FunctionResult.
     *
     * FunctionResult is an Option with an extra property to capture errors.
     * FunctionResult objects also store their arguments.
     * This can be used to memento-ize functions if desired.
     *
     * value: the value returned by the specified asynchronous function, if any
     * exceptions: an array of any errors thrown during the execution of the specified function.
     *
     * @param pObject the object on which to call the method (or function)
     * @param pMethod an asynchronous method to execute (or a synchronous method to execute asynchronously)
     * @param pArgs (optional) one or more arguments to pass to the function
     *
     * @returns {Promise<FunctionResult>} a Promise of a FunctionResult
     */
    const attemptAsyncMethod = async function( pObject, pMethod, ...pArgs )
    {
        let returnValue = null;

        let exceptions = [];

        try
        {
            const obj = resolveContext( pObject );

            const method = resolveMethod( pMethod, obj );

            if ( isFunction( method ) )
            {
                try
                {
                    returnValue = await method.apply( (obj || $scope()), asArray( pArgs ) );
                }
                catch( ex2 )
                {
                    exceptions.push( ex2 );
                }
            }
        }
        catch( ex )
        {
            exceptions.push( ex );
        }

        return new FunctionResult( returnValue, exceptions, ...pArgs );
    };

    /**
     * Returns a FunctionResult
     *
     * FunctionResult is an Option with an extra property to capture errors.
     * FunctionResult objects also store their arguments.
     * This can be used to memento-ize functions if desired.
     *
     * value: the value returned by the specified asynchronous function, if any
     * exceptions: an array of any errors thrown during the execution of the specified function.
     *
     * @param pObject the object on which to call the method (or function)
     * @param pMethod a method or function to execute
     * @param pArgs (optional) one or more arguments to pass to the function
     *
     * @returns {FunctionResult} a FunctionResult
     *
     * If an asynchronous function is passed, this function will return a Promise.
     * Normally, calling attemptAsync is preferred, however, this function can be used to return a Promise
     */
    const attemptMethod = function( pObject, pMethod, ...pArgs )
    {
        let returnValue = null;

        let exceptions = [];

        try
        {
            const obj = resolveContext( pObject );

            const method = resolveMethod( pMethod, obj );

            if ( isFunction( method ) )
            {
                if ( isAsyncFunction( method ) )
                {
                    return Promise.resolve( ((async function()
                    {
                        return await attemptAsyncMethod( obj, method, ...pArgs );
                    })()) );
                }
                else
                {
                    try
                    {
                        returnValue = method.apply( (obj || $scope()), asArray( pArgs ) );
                    }
                    catch( ex2 )
                    {
                        exceptions.push( ex2 );
                    }
                }
            }
        }
        catch( ex )
        {
            exceptions.push( ex );
        }

        return new FunctionResult( returnValue, exceptions, ...pArgs );
    };

    /**
     * Returns a new function that wraps the specified function in the 'attempt' semantics.
     *
     * The new function returns an object of the form, {returnValue, exceptions}
     * or if the specified function is asynchronous, a Promise for an object of that form
     *
     * @param pFunction the function wrap in 'attempt' semantics
     * @param pObject (optional) an object on which to call the specified function (as a method)
     *
     * @returns {(function(...[*]): {FunctionResult}|Promise<FunctionResult>)|(function(...[*]): Promise<FunctionResult>)}
     */
    const asAttempt = function( pFunction, pObject = $scope() )
    {
        const obj = resolveContext( pObject ) || {};

        const method = resolveMethod( pFunction, obj );

        if ( isFunction( method ) )
        {
            if ( isAsyncFunction( method ) )
            {
                return async function( ...pArgs )
                {
                    return await attemptAsyncMethod( obj, method, ...pArgs );
                };
            }
            else
            {
                return function( ...pArgs )
                {
                    return attemptMethod( obj, method, ...pArgs );
                };
            }
        }

        return function() { return new FunctionResult(); };
    };

    const _DEFAULT_OPTIONS = {
        minArgs: 0,
        maxInheritance: 10,
        includeStatic: false
    };

    /**
     * Returns true if the specified class (or one of its super classes) has a method named pMethodName.
     *
     * @param pClass {function} a javascript class or a function prototype that is used as a class
     *
     * @param pMethodName {string} the name of the method that must be implemented
     *
     * @param pOptions an object specifying additional arguments:
     *
     * minArgs {number} (optional) the minimum number of arguments
     *                  a method by that name must accept to be considered implemented
     *
     * maxInheritance {number} (optional) the maximum length of the scope chain
     *                         to search for the specified method
     *
     * @returns {boolean} true if the specified method can be called on an instance of the specified class
     */
    const isImplemented = function( pClass, pMethodName, pOptions = _DEFAULT_OPTIONS )
    {
        const defaults = Object.assign( {}, _DEFAULT_OPTIONS );

        const options = Object.assign( defaults, pOptions || _DEFAULT_OPTIONS );

        let clazz = (isClass( pClass ) ? pClass : (pClass?.constructor || pClass.prototype || pClass));

        clazz = (isClass( clazz ) ? clazz : (pClass?.prototype || pClass?.__proto__ || pClass));

        clazz = (isClass( clazz ) ? clazz : (pClass?.__proto__ || pClass?.prototype || pClass));

        const methodName = asString( pMethodName, true ).trim();

        const minArgs = Math.min( Math.max( 0, asInt( options?.minArgs, 0 ) || 0 ), 10 );

        const includeStatic = (false !== options?.includeStatic);

        let result = (includeStatic && isFunction( pClass?.[methodName] ));

        if ( clazz )
        {
            let proto = clazz?.prototype || clazz;

            const maxInheritance = Math.max( 1, Math.min( 100, asInt( options?.maxInheritance, 10 ) ) );

            const iterationCap = new objectUtils.IterationCap( maxInheritance );

            while ( !result && (null != proto) && !iterationCap.reached )
            {
                const method = proto[methodName] || (includeStatic ? clazz[methodName] : null);

                result = isFunction( method ) && ((method?.length || 0) >= minArgs);

                if ( result )
                {
                    break;
                }

                proto = proto?.prototype;
            }
        }

        return result;
    };

    /**
     * Returns a new version of the specified function with one or more arguments captured
     * that now only requires passing the remaining arguments.
     *
     * Google 'functional programming currying' for more information about currying
     *
     * @param pFunction the function to partial
     *
     * @param pArgs one or more arguments whose values will be constants of the returned function
     *
     * @returns {function(...[*]): any}
     */
    const partial = function( pFunction, ...pArgs )
    {
        let func = resolveFunction( pFunction ) || (function( ...pArgs ) {});

        let args = [].concat( asArray( pArgs ) );

        return function( ...pArguments )
        {
            return func.apply( $scope(), [].concat( args ).concat( asArray( pArguments ) ) );
        };
    };


    /**
     * Returns a new version of the specified asynchronous function with one or more arguments captured
     * that now only requires passing the remaining arguments.
     *
     * Google 'functional programming currying' for more information about currying
     *
     * @param pFunction the function to partial
     *
     * @param pArgs one or more arguments whose values will be constants of the returned function
     *
     * @returns {function(...[*]): any}
     */
    const asyncPartial = function( pFunction, ...pArgs )
    {
        let func = resolveFunction( pFunction ) || (function( ...pArgs ) {});

        let args = [].concat( asArray( pArgs ) );

        return async function( ...pArguments )
        {
            return await func.apply( $scope(), [].concat( args ).concat( asArray( pArguments ) ) );
        };
    };


    /**
     * This is the exported module.
     */
    const mod =
        {
            dependencies,
            isFunction,
            isAsyncFunction,
            isClass,
            no_op,
            op_true,
            op_false,
            op_identity,
            isImplemented,
            fireAndForget,
            attempt,
            attemptAsync,
            attemptMethod,
            attemptAsyncMethod,
            asAttempt,
            partial,
            asyncPartial,
            catchHandler: function( pErr )
            {
                return true;
            },
            classes: { FunctionResult },
            FunctionResult
        };

    // when running in a Node.js environment, we assign the module to the global module.exports
    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    // Cache the module in the global scope to avoid re-executing the logic in this IIFE
    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    // return the module for environments expecting this function to return the module
    return Object.freeze( mod );

}());
