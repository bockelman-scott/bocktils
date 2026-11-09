// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols

function helloWorld( req, res, next )
{
    const content =
        {
            message: "Hello World",
            method: req.method,
            url: req.originalUrl
        };

    // res.set( "Content-Type", "application/json" );

    res.status( 200 ).json( content );
}

module.exports = { helloWorld };