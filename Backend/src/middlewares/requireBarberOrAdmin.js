// middleware/requireBarberOrAdmin.js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireBarberOrAdmin = asyncHandler(async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        // Check if user is barber or admin
        if (req.user.role !== 'barber' && req.user.role !== 'admin') {
            throw new ApiError(403, "Barber or admin access required");
        }

        next();
    } catch (error) {
        throw new ApiError(403, error.message || "Access denied");
    }
});