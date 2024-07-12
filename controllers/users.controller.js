const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
let Users = require("../models/users.model");
let getUsers = async (req, res) => {
  const users = await Users.find(null, "-__v -password -token");
  res.json({ status: "success", data: { users } });
};
let register = async (req, res) => {
console.log(req.file.filename)
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({ status: "fail", error: err.array() });
  }
  const notFound = await Users.findOne({ email: req.body.email });
  if (notFound) {
    return res.status(400).json({
      status: "fail",
      message: `This email:"${req.body.email}" is already exist`,
    });
  }
  // Hash password
  const hashPass = await bcrypt.hash(req.body.password, 10);
  const user = new Users({ ...req.body,avatar:req.file.filename, password: hashPass });
  // Make Token
  const token = await jwt.sign(
    {
      id: user._id,
      name: req.body.firstName + " " + req.body.lastName,
      email: req.body.email,
      role:req.body.role
    },
    process.env.JWT_SECRITE,
    { expiresIn: "1d" }
  );
  user.token = token;
  await user.save();

  res.status(201).json({ status: "success", data: { user } });
};
let login = async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ email });
  if (!user)
    return res.status(404).send({ status: "fail", message: "User not exist" });
  const passTrue = await bcrypt.compare(password, user.password);
  if (!passTrue)
    return res.status(400).send({ status: "fail", message: "Wrong password" });
  // Make Token
  const token = jwt.sign(
    {
      id: user._id,
      name: user.firstName + " " + user.lastName,
      email: user.email,
      role:user.role
    },
    process.env.JWT_SECRITE,
    { expiresIn: "1d" }
  );
  user.token=token
  await user.save();
  res.send({ status: "success", data: { token ,role:user.role} });
};

module.exports = {
  getUsers,
  register,
  login,
};
