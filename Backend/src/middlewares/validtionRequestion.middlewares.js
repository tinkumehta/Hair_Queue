// middlewares/validateRequest.js
import { validationResult, body } from "express-validator";


export const registerValidation = [
  body("fullName")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .matches(/^[A-Za-z\s]+$/).withMessage("Only letters allowed"),

  body("username")
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Only letters, numbers, underscore"),

  body("email")
    .isEmail().withMessage("Invalid email"),

  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),

  body("phone")
    .isMobilePhone("en-IN").withMessage("Invalid phone number")
];





export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  next();
};