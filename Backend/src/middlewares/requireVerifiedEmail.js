// middleware/requireVerifiedEmail.js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js";

export const requireVerifiedEmail = asyncHandler(async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        // Get fresh user data to check verification status
        const user = await User.findById(req.user._id);
        
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (!user.emailVerified) {
            throw new ApiError(403, "Email verification required");
        }

        next();
    } catch (error) {
        throw new ApiError(403, error.message || "Access denied");
    }
});