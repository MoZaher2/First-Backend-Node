const { body, param } = require("express-validator");

const middlewareBody=[
    body("firstName").trim().notEmpty().withMessage("First name must have value").isAlpha().withMessage("Enter valid name"),
    body("lastName").trim().notEmpty().withMessage("Last name must have value").isAlpha().withMessage("Enter valid name"),
    body("email").trim().notEmpty().withMessage("Email must have value").isEmail().withMessage("Enter valid email"),
    body("password").trim().notEmpty().withMessage("Password name must have value"),
    body("role").trim().notEmpty().withMessage("Role must have value").toLowerCase().isIn(['user', 'admin']).withMessage("Role must be either 'user' or 'admin'")
]
module.exports={
    middlewareBody
}