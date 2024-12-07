const objectUtils = require( "./ObjectUtils.cjs" );

const constants = objectUtils.dependencies.constants;
const typeUtils = objectUtils.dependencies.typeUtils;
const stringUtils = objectUtils.dependencies.stringUtils;
const arrayUtils = objectUtils.dependencies.arrayUtils;
const guidUtils = objectUtils.dependencies.guidUtils;

/** create an alias for console **/
const konsole = console || {};

/** define a variable for typeof undefined **/
const _ud = constants?._ud || "undefined";

/**
 * This function returns the host environment scope (Browser window, Node.js global, or Worker self)
 */
const $scope = constants?.$scope || function()
{
    return (_ud === typeof self ? ((_ud === typeof global) ? {} : (global || {})) : (self || {}));
};

/**
 * This is the Immediately Invoked Function Expression (IIFE) that builds and returns the module
 */
(function exposeModule()
{
    // defines a key we can use to store this module in global scope
    const INTERNAL_NAME = "__BOCK__OBJECT_FUNCTOR__";

    // if we've already executed this code, just return the module
    if ( $scope() && (null != $scope()[INTERNAL_NAME]) )
    {
        return $scope()[INTERNAL_NAME];
    }

    const dependencies =
        {
            constants,
            typeUtils,
            stringUtils,
            arrayUtils,
            objectUtils,
            guidUtils
        };

    let { _str, _fun, _num, _big, _bool, _symbol, _obj, populateOptions, lock, deepFreeze } = constants;

    let { isNull, isString, isArray, isObject, isDate, isFunction } = typeUtils;

    let asString = stringUtils.asString;

    let { asArray, Mappers } = arrayUtils;

    let { detectCycles, getKeys, getEntries } = objectUtils;

    class ObjectFunctor
    {
        #value = [];

        #type;

        constructor( pObject, pStack = [], pResolved = new Map() )
        {
            const stack = asArray( pStack || [] ) || [];

            const resolved = pResolved instanceof Map ? pResolved : new Map();

            this.#type = typeof pObject;

            switch ( typeof pObject )
            {
                case _ud:
                    this.#value = [];
                    break;

                case _fun:
                    this.#value = [function( ...pArgs )
                                   {
                                       try
                                       {
                                           pObject.call( this, ...pArgs );
                                       }
                                       catch( ex )
                                       {
                                           konsole.error( ex );
                                       }
                                   }];
                    break;

                case _str:
                    this.#value = [asString( pObject )];
                    break;

                case _num:
                case _big:
                case _symbol:
                case _bool:
                    this.#value = [pObject];
                    break;

                case _obj:

                    if ( isNull( pObject ) )
                    {
                        this.#value = [];
                    }
                    else if ( isArray( pObject ) )
                    {
                        this.#value = lock( pObject.map( e => new ObjectFunctor( e ) ) );
                    }
                    else
                    {
                        // unwrap any argument that is an ObjectFunctor
                        let obj = pObject instanceof this.constructor ? pObject.#value : pObject;
                        while ( obj instanceof this.constructor )
                        {
                            obj = obj.#value;
                        }

                        if ( isNull( obj ) )
                        {
                            this.#value = [];
                        }
                        else if ( !isObject( obj ) )
                        {
                            this.#value = [obj];
                        }
                        else
                        {
                            const entries = getEntries( obj );

                            let newObj = {};

                            for( let entry of entries )
                            {
                                const key = entry.key || entry[0];
                                const value = entry.value || entry[1];

                                const keys = stack.concat( key );

                                const path = keys.join( "/" );

                                if ( detectCycles( keys, 5, 5 ) )
                                {
                                    newObj[key] = deepFreeze( resolved.get( path ) || [deepFreeze( value )] );
                                    break;
                                }

                                const functor = deepFreeze( resolved.get( path ) || new ObjectFunctor( value, keys, resolved ) );

                                newObj[key] = functor;

                                resolved.set( path, functor );
                            }

                            this.#value = deepFreeze( [deepFreeze( newObj )] );
                        }
                    }
                    break;

                default:
                    this.#value = [deepFreeze( pObject )];
                    break;
            }
        }

        static get [Symbol.species]()
        {
            return this;
        }

        valueOf()
        {
            let val = (asArray( this.#value || [] ).map( Mappers.IDENTITY ))[0];

            switch ( typeof val )
            {
                case _ud:
                    val = {};
                    break;

                case _obj:
                    if ( isNull( val ) )
                    {
                        val = {};
                    }
                    else if ( isArray( val ) )
                    {
                        val = val.map( e => deepFreeze( e instanceof this.constructor ? e.valueOf() : e ) );
                    }
                    else if ( val instanceof this.constructor )
                    {
                        val = deepFreeze( val.valueOf() );
                    }
                    else
                    {
                        let obj = {};

                        const entries = getEntries( val );

                        for( let entry of entries )
                        {
                            const key = entry.key || entry[0];
                            const value = entry.value || entry[1];

                            obj[key] = deepFreeze( value instanceof this.constructor ? value.valueOf() : value );
                        }

                        val = deepFreeze( obj );
                    }
                    break;

                default:
                    return deepFreeze( val );
            }
        }

        get type()
        {
            return this.#type;
        }

        get length()
        {
            let values = asArray( this.#value || [] );

            if ( values?.length <= 0 )
            {
                return 0;
            }

            let len = 0;

            let val = values[0];

            switch ( typeof val )
            {
                case _ud:
                    break;

                case _obj:
                    if ( val instanceof this.constructor )
                    {
                        len = val.length;
                    }
                    else if ( null !== val )
                    {
                        if ( isArray( val ) )
                        {
                            len = val.length;
                        }
                        else
                        {
                            len = getKeys( val || {} ).length;
                        }
                    }
                    break;

                default:
                    len += 1;
                    break;
            }

            return len;
        }

        map( pFunction )
        {
            if ( isFunction( pFunction ) )
            {
                const arr = asArray( this.#value ).map( pFunction );

                const thiz = this.constructor[Symbol.species];

                return new thiz( arr );
            }
            return this;
        }
    }

    const mod =
        {
            dependencies,
            classes: { ObjectFunctor },
            ObjectFunctor
        };

    if ( _ud !== typeof module )
    {
        module.exports = lock( mod );
    }

    if ( $scope() )
    {
        $scope()[INTERNAL_NAME] = lock( mod );
    }

    return lock( mod );


}());