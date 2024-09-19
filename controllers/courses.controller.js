const { validationResult } = require("express-validator");
let Courses = require("../models/courses.model");
// const { json } = require("express");

let getCourses = async (req, res) => {
  const {limit=2,page=1}=req.query
  console.log(req.query)
  const skip=(page-1)*limit
  const AllCourses = await Courses.find(null,"-__v").limit(limit).skip(skip);
  res.json({ status: "success", data: { AllCourses } });
};
let getCourseById = async(req, res) => {
  //Valid req
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res
      .status(400)
      .send({ status: "fail", data: { error: err.array() } }); 
  }
try{
  course=await Courses.findById(req.params.id)
  return res.send({ status: "success", data: { course } })
}catch(err){
  return res
    .status(404)
    .json({
      status: "fail",
      data: { error: "No such a course with id " + req.params.id },
    });
}
};
let createCourse = async(req, res) => {
  // Valid Body
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res
      .status(400)
      .send({ status: "fail", data: { error: err.array() } }); 
  }
  const course=new Courses({...req.body})
  await course.save()
  res.status(201).send({status:"success",data:{course},message:"Course added successfully"});
};
let updateCourse = async (req, res) => {
  try {
    const course = await Courses.findByIdAndUpdate(req.params.id, {
      ...req.body,
    });
    return res.json({
      status:"success",
      message:`Course with id ${req.params.id} updated successfully`,
    });
  } catch (err) {
    return res
      .status(404)
      .json({status:"error", message: "No such a course with id " + req.params.id });
  }
};
let deleteCourse = async (req, res) => {
  //Valid req
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res
      .status(400)
      .send({ status: "fail", data: { error: err.array() } }); 
  }
  try {
    const course=await Courses.deleteOne({_id:req.params.id})
    res.send({status:"success",data:null});
  } catch (err) {
    res
      .status(404)
      .json({status:"fail", message: "Course with id " + req.params.id + " not found" });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
