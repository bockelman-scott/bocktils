const constants = require( "./Constants.js" );
const stringUtils = require( "./StringUtils.js" );
const arrayUtils = require( "./ArrayUtils.js" );
const objectUtils = require( "./ObjectUtils.js" );

const _ud = constants?._ud || "undefined";

const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? ((_ud === typeof globalThis ? {} : globalThis)) : (global || {})) : (self || {}));
};

(function exposeFunctionUtils()
{
    let asString = stringUtils.asString;
    let asInt = stringUtils.asInt;

    let forceToArray = arrayUtils.forceToArray;

    let isFunction = objectUtils.isFunction;
    let isAsyncFunction = objectUtils.isAsyncFunction;
    let isClass = objectUtils.isClass;
    let no_op = objectUtils.no_op || function() {};

    constants.importUtilities( this, constants, stringUtils, arrayUtils, objectUtils );

    const INTERNAL_NAME = "__BOCK__FUNCTION_UTILS__";

    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const exec = function( pOperation, ...pArgs )
    {
        let returnValue = null;

        if ( isFunction( pOperation ) )
        {
            try
            {
                returnValue = pOperation.call( $scope(), ...pArgs );
            }
            catch( ex )
            {
                // ignored
            }
        }
        else
        {
            returnValue = pOperation;
        }

        return returnValue;
    };

    const execAsync = async function( pOperation, ...pArgs )
    {
        let returnValue = null;

        if ( isFunction( pOperation ) )
        {
            try
            {
                returnValue = await pOperation.call( $scope(), ...pArgs );
            }
            catch( ex )
            {
                // ignored
            }
        }
        else
        {
            returnValue = pOperation;
        }

        return returnValue;
    };

    const execMethod = function( pObject, pMethod, ...pArgs )
    {
        let returnValue = null;

        if ( isFunction( pMethod ) )
        {
            try
            {
                returnValue = pMethod.call( (pObject || $scope()), ...pArgs );
            }
            catch( ex2 )
            {
                // ignored
            }
        }
    };

    const execAsyncMethod = async function( pObject, pMethod, ...pArgs )
    {
        let returnValue = null;

        if ( isFunction( pMethod ) )
        {
            try
            {
                returnValue = await pMethod.call( (pObject || $scope()), ...pArgs );
            }
            catch( ex2 )
            {
                // ignored
            }
        }
    };

    const fireAndForget = function( pAsyncFunction, ...pArgs )
    {
        if ( isAsyncFunction( pAsyncFunction ) )
        {
            pAsyncFunction.call( $scope(), ...pArgs ).then( no_op );
        }
    };

    const attemptAsync = async function( pOperation, ...pArgs )
    {
        let exceptions = [];

        let returnValue = null;

        try
        {
            if ( isFunction( pOperation ) )
            {
                try
                {
                    returnValue = await pOperation.apply( $scope(), forceToArray( pArgs ) );
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

        if ( exceptions.length > 0 )
        {
            return exceptions;
        }

        return returnValue;
    };

    const attempt = function( pOperation, ...pArgs )
    {
        let exceptions = [];

        let returnValue = null;

        try
        {
            if ( isFunction( pOperation ) )
            {
                if ( isAsyncFunction( pOperation ) )
                {
                    returnValue = Promise.resolve( (async function()
                    {
                        return attemptAsync( pOperation, ...pArgs );
                    }) );
                }

                try
                {
                    returnValue = pOperation.apply( $scope(), forceToArray( pArgs ) );
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

        if ( exceptions.length > 0 )
        {
            return exceptions;
        }

        return returnValue;
    };

    const attemptAsyncMethod = async function( pObject, pMethod, ...pArgs )
    {
        let exceptions = [];

        let returnValue = null;

        try
        {
            if ( isFunction( pMethod ) )
            {
                try
                {
                    returnValue = await pMethod.apply( (pObject || $scope()), forceToArray( pArgs ) );
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

        if ( exceptions.length > 0 )
        {
            return exceptions;
        }

        return returnValue;
    };

    const attemptMethod = function( pObject, pMethod, ...pArgs )
    {
        let exceptions = [];

        let returnValue = null;

        try
        {
            if ( isFunction( pMethod ) )
            {
                if ( isAsyncFunction( pMethod ) )
                {
                    returnValue = Promise.resolve( (async function()
                    {
                        return attemptAsyncMethod( pObject, pMethod, ...pArgs );
                    }) );
                }

                try
                {
                    returnValue = pMethod.apply( (pObject || $scope()), forceToArray( pArgs ) );
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

        if ( exceptions.length > 0 )
        {
            return exceptions;
        }

        return returnValue;
    };

    const isImplemented = function( pClass, pMethodName, pMinArgs, pMaxInheritance )
    {
        let clazz = (isClass( pClass ) ? pClass : pClass?.constructor);

        let methodName = asString( pMethodName, true ).trim();

        let minArgs = Math.min( Math.max( 0, asInt( pMinArgs, 0 ) || 0 ), 10 );

        let result = false;

        if ( clazz && isClass( clazz ) )
        {
            let proto = clazz.prototype;

            const iterationCap = new objectUtils.IterationCap( Math.max( 1, Math.min( 100, asInt( pMaxInheritance ) ) ) );

            while ( !result && (null != proto) && (Object !== proto) && !iterationCap.reached )
            {
                const method = proto[methodName];

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

    const mod =
        {
            isFunction,
            isAsyncFunction,
            isClass,
            no_op,
            exec,
            execAsync,
            execMethod,
            execAsyncMethod,
            fireAndForget,
            attemptAsync,
            attempt,
            attemptAsyncMethod,
            attemptMethod,
            isImplemented,
            catchHandler: function( pErr )
            {
                return true;
            }
        };

    if ( _ud !== typeof module )
    {
        module.exports = Object.freeze( mod );
    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = Object.freeze( mod );
    }

    return Object.freeze( mod );

}());