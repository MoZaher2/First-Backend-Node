const { body } = require("express-validator");

const middlewareBody = [
  body("name")
    .notEmpty().withMessage("Product name must have value")
    .isLength({ min: 3 }).withMessage("Product name is too short => min length 3"),
  body("description")
    .notEmpty().withMessage("Description must have value")
    .isLength({ min: 10 }).withMessage("Description is too short => min length 10"),
  body("price.price")
    .notEmpty().withMessage("Price must have value")
    .isNumeric().withMessage("Price must be a number"),
  body("info.SKU").notEmpty().withMessage("SKU must have value"),
  body("info.Availability")
    .notEmpty().withMessage("Availability must have value")
    .isIn(["In Stock", "Out of Stock"]).withMessage("Availability must be either 'In Stock' or 'Out of Stock'"),
  body("info.Brand").notEmpty().withMessage("Brand must have value"),
  body("info.Category").notEmpty().withMessage("Category must have value"),
];

module.exports = { middlewareBody };
