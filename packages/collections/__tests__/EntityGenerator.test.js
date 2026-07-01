const collectionUtils = require( "../Collection.js" );
const entityGenerator = require( "../EntityGenerator.js" );

const { EntityGenerator, AsyncEntityGenerator, PaginatedEntityGenerator } = entityGenerator;

const mockFetch = async function( pId )
{
    return { id: pId, name: "entity_" + pId };
};

describe( "EntityGenerator", () =>
{
    let arr = [10001, 10101, 10110, 11001, 11011];

    test( "EntityGenerator - Construction", async() =>
    {
        const generator = new EntityGenerator( arr, mockFetch );

        for await ( const entity of generator )
        {
            expect( typeof entity ).toEqual( "object" );
            expect( parseInt( entity.id ) >= 10_000 ).toBe( true );
        }

    }, 30_000 );

} );

describe( "AsyncEntityGenerator", () =>
{
    let arr = [20001, 20101, 20110, 21001, 21011];

    test( "AsyncEntityGenerator - Construction", async() =>
    {
        const generator = new EntityGenerator( arr, mockFetch );

        for await ( const entity of generator )
        {
            expect( typeof entity ).toEqual( "object" );
            expect( parseInt( entity.id ) >= 20_000 ).toBe( true );
        }

    }, 30_000 );

} );

