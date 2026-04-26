
class ApiError extends Error { // It inherits all the default rules and behaviors of the native JavaScript Error class.
    constructor(statusCode ,message ,error = [] ,stack = ""){
        super(message)
        this.statusCode = statusCode
        this.error = error
        this.stack = stack
        this.success = false
        this.data = null

        if(stack){
            this.stack = stack
        
        }else{
            this.stack = Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}

