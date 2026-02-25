import { 
    changePassword,
    getUser,
    loginUser,
    logoutUser,
    registerUser,
    verifyEmailOtp
 } from "../controllers/user.controllers.js"; 
 import { upload } from "../middlewares/multer.middlewares.js";
 import { verfiyJWT } from "../middlewares/auth.middlewares.js";
 import { Router } from "express";

 const router = Router();

 router.route("/register").post(
    upload.fields([
        {
            name : 'avatar',
            maxCount: 1
        }
    ]),
    registerUser
 )

 router.route("/login").post(upload.none(), loginUser)
 router.route("/logout").post(verfiyJWT, logoutUser)
 router.route("/change-password").post(upload.none(),verfiyJWT, changePassword)
 router.route("/current-user").get( verfiyJWT,  getUser)

 router.route("/verify-email").post(upload.none(), verifyEmailOtp)

 export default router;