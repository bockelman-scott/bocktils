function helloWorld( req, res, next )
{
    res.status( 200 ).json( {
                                message: "Hello World",
                                method: req.method,
                                url: req.originalUrl
                            } );
}

module.exports = { helloWorld };