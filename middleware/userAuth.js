// middleware for is login or not is not login when click some link redirect to login page

// const isLogin=async(req,res,next)=>{
//     try {
//         // console.log(req.session.userId);
//         if(req.session.user_id ){
//             next()
//         }else{
//             res.redirect("/login")
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const UserDB = require('../model/userModel')
 
const isLogin=async(req,res,next)=>{
        try {
            // console.log(req.session.userId);
            if(req.session.user_id ){
               const user = await UserDB.findById(req.session.user_id)
                if (user.isBlocked == true) {
                    return res.redirect('/login')
                }

                next()


            }else{
                res.redirect("/login")
            }
        } catch (error) {
            console.log(error.message);
        }
    }
    


const isLogout = async(req,res,next)=>{
    try {
        // console.log(req.session.userId)
        if(req.session.userId){
            res.redirect('/home')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    isLogin,
    isLogout,
  
};
