let coursesMiddleware = require("../middlewares/courses.middleware");
let coursesController = require("../controllers/courses.controller");
let tokenMiddleware=require("../middlewares/token.middleware")
const express = require("express");
const allowTo = require("../middlewares/role.middleware");
const router = express.Router();

router.route("/")
  .get(coursesController.getCourses)
  .post(tokenMiddleware,coursesMiddleware.middlewareBody, coursesController.createCourse);

router.route("/:id")
  .get(coursesController.getCourseById)
  .patch(
    coursesController.updateCourse
  )
  .delete(tokenMiddleware,allowTo('admin'),coursesController.deleteCourse);

module.exports = router;
