const errorMiddleware =(error,req,res,next)=>{
 
   
    console.error(error);
    return res.render('error',)

} 

module.exports = errorMiddleware