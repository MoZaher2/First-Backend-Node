const mongoose=require("mongoose")
const Schema=mongoose.Schema

// courses schema
const coursesSchema = new Schema({
  title: { type: String, required: [true,"is req"] },
  price: { type: Number, required: true },
});
const Courses=mongoose.model("Course",coursesSchema)


module.exports=Courses
