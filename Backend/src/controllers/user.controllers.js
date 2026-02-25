import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import User from '../models/user.models.js'
import { sendOtpEmail } from "../middlewares/email.middlewares.js";
import { generateOtp } from "../utils/generateOtp.js";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler (async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user is exits : username, email
    // check if images , check for avatar
    // upload them to cloudinary, avatar
    // create user object
    // remove the passowrd and refresh token field from response
    // check for user creation
    // return res

    const {fullName, email, password, role, phone, username} = req.body;

    if (
        [fullName,username, email, password, role, phone].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "your field is empyt")
    }

    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    });
    if (existedUser) {
        throw new ApiError(400, 'User is already exists')
    }
    // const avatarLocalPath = req.files?.avatar[0]?.path;

    // if (!avatarLocalPath){
    //     throw new ApiError(400, "Avatar file is missing")
    // }
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // if (!avatar) {
    //     throw new ApiError(404, "Avatar file uploa failed")
    // }

    // 25-02-2026
    // let avatarImageLocalPath;
    // if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
    //     avatarImageLocalPath = req.files.avatar[0].path
    // }

    // const avatar = await uploadOnCloudinary(avatarImageLocalPath);

     let avatarUrl = "";

if (req.file) {
  const avatarUpload = await uploadOnCloudinary(
    req.file.buffer,
    "devconnect"
  );

  avatarUrl = avatarUpload?.secure_url;
}

    const otp = generateOtp();


    const user = await User.create({
        fullName,
        email,
        username,
        avatar: avatarUrl || "",
        password,
        phone,
        role: role || 'user',
        emailOtp : otp,
        emailOtpExpires : new Date(Date.now() +10 * 60 * 1000)
    });

    await sendOtpEmail(email, otp);

    const createdUser = await User.findById(user._id).select("-password -emailOtp");

    if (!createdUser) {
        throw new ApiError(500, "Register error's")
    }
    return res
    .status(201)
    .json(
        new ApiResponse(201, createdUser, "User register successfully")
    )
});

const loginUser = asyncHandler (async (req, res) => {
    const {email, username, password} = req.body;
    if ( !(username) &&  !(email)){
        throw new ApiError(400, "email or username is required")
    }
    const user = await User.findOne({
        $or : [{email}, {username}]
    })
    if (!user) {
        throw new ApiError(400, "User is not register")
    }
    const isPasswordVaild = await user.isPasswordCorrect(password)

    if (!isPasswordVaild) {
        throw new ApiError(400, "Password is not correct")
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options = {
        httpOnly : true,
        secure: true
    }
    return res
    .status(201)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
        new ApiResponse(201, 
            {user: loggedInUser, accessToken, refreshToken},
             "User logged is successfully")
    )
})

const logoutUser = asyncHandler (async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(201, {}, "User logged out")
    )
})

const getUser = asyncHandler (async (req, res) => {
        return res
        .status(201)
        .json(new ApiResponse(201, req.user, "current user fetched successfully"))
})

const changePassword = asyncHandler (async (req, res) => {
    const {newPassword, oldPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect ) {
        throw new ApiError(400, "Password is Invaild")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(201)
    .json(new ApiResponse(201, {}, "Password is change Successfully"))
})

const verifyEmailOtp = asyncHandler (async (req, res) => {
    const {email, otp} = req.body;

    const user = await User.findOne({email});

    if (! user) {
        throw new ApiError(404, "User not found");
    }
    if (email.emailVerified) {
        throw new ApiError(400, "Already verified")
    }

    if (
        user.emailOtp !== otp ||
        user.emailOtpExpires < Date.now()
    ) {
        throw new ApiError(400, "Invalid or expired OTP")
    }

    user.emailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    return res.status(201).json(
        new ApiResponse(201, {}, "Email verified successfully")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    changePassword,
    verifyEmailOtp,
}