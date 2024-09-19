const jwt = require("jsonwebtoken");
const tokenMiddleware = (req, res, next) => {
  const token = req.headers.Authorization || req.headers.authorization;
  if (!token)
    return res
      .status(401)
      .send({ status: "fail", message: "You don't have token" });

  try {
    const isValid = jwt.verify(token.split(" ")[1], process.env.JWT_SECRITE);
    req.currentUser=isValid
    next();
  } catch (err) {
    return res
      .status(401)
      .send({ status: "fail", message: "Your token expired" });
  }
};
module.exports = tokenMiddleware;
