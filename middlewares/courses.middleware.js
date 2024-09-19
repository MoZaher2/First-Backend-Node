const { body, param } = require("express-validator");
//=====>Middlewars<=====
  // body
  const middlewareBody = [
    body("title")
      .notEmpty()
      .withMessage("Title must have value")
      .isLength({ min: 2 })
      .withMessage("Title is too short => min length 2")
      .isLength({ max: 10 })
      .withMessage("Title is too long => max length 10"),
    body("price")
      .notEmpty()
      .withMessage("Price must have value")
      .isNumeric()
      .withMessage("Price must be number"),
  ];
module.exports={
middlewareBody
}