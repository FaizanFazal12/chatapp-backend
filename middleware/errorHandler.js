const errorHandler = (err, req, res, next) => {

    console.log(err);

    res.json({
        message: err.message,
        status: err.status,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    })
}

module.exports = errorHandler;