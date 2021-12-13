class ExpressError extends Error{
    constructor(message,statusCode){
        super();
        this.message="Page Not Found";
        this.statusCode=statusCode;
    }
}

module.exports=ExpressError;