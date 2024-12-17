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
 * @see Result
 * @see FunctionResult
 *
 */
const core = require( "../../core/src/CoreUtils.cjs" );

const { constants, typeUtils, stringUtils, arrayUtils } = core;

const { _ud = "undefined" } = constants;

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeModule()
{
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
            arrayUtils
        };

    /**
     * Create local variables for the imported values and functions we use.
     */
    const { _mt_str, resolveError, immutableCopy, IterationCap, no_op, S_ERROR, classes } = constants;

    const { asString, asInt, asFloat } = stringUtils;

    const { asArray, varargs, Filters } = arrayUtils;

    const { isString, isObject, isFunction, isAsyncFunction, isClass, Result } = typeUtils;

    const op_true = function() { return true; };
    const op_false = function() { return false; };

    const op_identity = function( pArg ) { return pArg; };

    const { ModuleEvent, ModulePrototype } = classes;

    const modName = "FunctionUtils";

    const modulePrototype = new ModulePrototype( modName, INTERNAL_NAME );

    const calculateErrorSourceName = function( pModule = modName, pFunction )
    {
        return modulePrototype.calculateErrorSourceName( pModule, pFunction );
    };

    if ( _ud === typeof CustomEvent )
    {
        CustomEvent = ModuleEvent;
    }

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
     * Returns a function suitable for execution from either a function, method, or the name of the method.
     *
     * @param pMethod {function|string} the function or method itself
     *                                  or the name of a method expected to be a member of the specified object
     *
     * @param pObject (optional) the object that implements the method or on which the method will be called.
     *
     * @returns {function} the specified function or a no-op function
     */
    function resolveMethod( pMethod, pObject )
    {
        return isFunction( pMethod ) ? pMethod : (isString( pMethod ) ? (resolveContext( pObject )[asString( pMethod, true )]) || no_op : no_op);
    }

    /**
     * Returns a function suitable for execution in the global scope,
     * from either a function the name of a function.
     *
     * @param pFunction {function|string} the function itself
     *                                    or the name of a function expected to be found in the global scope
     * @returns {function} the specified function or a no-op function
     */
    function resolveFunction( pFunction )
    {
        return resolveMethod( pFunction, $scope() );
    }

    const dispatch = function( pError, pMethodName, pDelegate, pScope )
    {
        const err = resolveError( pError );

        const methodName = pMethodName || _mt_str;

        const delegate = resolveMethod( pDelegate, pScope );

        const source = methodName + (isFunction( delegate ) ? " ( " + delegate?.name || _mt_str + " ) " : isString( delegate ) ? delegate : _mt_str);

        modulePrototype.dispatchEvent( new CustomEvent( S_ERROR,
                                                        {
                                                            error: err,
                                                            message: err.message,
                                                            level: S_ERROR,
                                                            method: calculateErrorSourceName( modName, source )
                                                        } ) );
    };

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

            this.#args = [].concat( varargs( ...pArgs ) ).map( e => immutableCopy( e ) );
        }

        get arguments()
        {
            return [].concat( asArray( this.#args ) ).map( e => immutableCopy( e ) );
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
        const methodName = "attemptAsync";

        let returnValue = null;

        let exceptions = [];

        try
        {
            if ( isFunction( pOperation ) )
            {
                try
                {
                    returnValue = await pOperation.apply( $scope(), varargs( ...pArgs ) );
                }
                catch( ex2 )
                {
                    exceptions.push( ex2 );

                    dispatch( ex2, methodName, pOperation, $scope() );
                }
            }
        }
        catch( ex )
        {
            exceptions.push( ex );

            dispatch( ex, methodName, pOperation, $scope() );
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
        const methodName = "attempt";

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

                        dispatch( ex2, methodName, pOperation, $scope() );
                    }
                }
            }
        }
        catch( ex )
        {
            exceptions.push( ex );

            dispatch( ex, methodName, pOperation, $scope() );
        }

        return new FunctionResult( returnValue, exceptions, ...pArgs );
    };

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
        const methodName = "attemptAsyncMethod";

        let returnValue = null;

        let exceptions = [];

        const obj = resolveContext( pObject );

        const method = resolveMethod( pMethod, obj );

        try
        {

            if ( isFunction( method ) )
            {
                try
                {
                    returnValue = await method.apply( (obj || $scope()), asArray( pArgs ) );
                }
                catch( ex2 )
                {
                    exceptions.push( ex2 );

                    dispatch( ex2, methodName, method, obj );
                }
            }
        }
        catch( ex )
        {
            exceptions.push( ex );

            dispatch( ex, methodName, method, obj );
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
        const methodName = "attemptMethod";

        let returnValue = null;

        let exceptions = [];

        const obj = resolveContext( pObject );

        const method = resolveMethod( pMethod, obj );

        try
        {
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

                        dispatch( ex2, methodName, method, $scope() );
                    }
                }
            }
        }
        catch( ex )
        {
            exceptions.push( ex );

            dispatch( ex, methodName, method, obj );
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

    const _DEFAULT_OPTIONS =
        {
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

            const iterationCap = new IterationCap( maxInheritance );

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
     * Google 'functional programming currying' for more information about currying and partial application
     *
     * @param pFunction the function to partial
     *
     * @param pArgs one or more arguments whose values will be constants of the returned function
     *
     * @returns {function(...[*]): any} a new function that only requires the remaining arguments to be passed
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
     * Google 'functional programming currying' for more information about currying and partial application
     *
     * @param pFunction the function to partial
     *
     * @param pArgs one or more arguments whose values will be constants of the returned function
     *
     * @returns {function(...[*]): any} a new asynchronous function that only requires the remaining arguments to be passed
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

    const sum = function( ...pArgs )
    {
        const arr = asArray( pArgs || [] );
        return arr.flat( Infinity ).map( asFloat ).filter( Filters.IS_VALID_NUMBER ).reduce( ( a, c ) => a + c, 0 );
    };

    /**
     * This is the exported module.
     */
    let mod =
        {
            dependencies,
            isFunction,
            isAsyncFunction,
            isClass,
            no_op,
            op_true,
            op_false,
            op_identity,
            sum,
            isImplemented,
            fireAndForget,
            attempt,
            attemptAsync,
            attemptMethod,
            attemptAsyncMethod,
            asAttempt,
            partial,
            asyncPartial,
            classes: { Result, FunctionResult },
            Result,
            FunctionResult
        };

    mod = modulePrototype.extend( mod );

    return mod.expose( mod, INTERNAL_NAME, (_ud !== typeof module ? module : mod) ) || mod;

}());
