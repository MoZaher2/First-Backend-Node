function allowTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.currentUser.role)) {
      return res.status(403).send({
        status: "fail",
        message: "You don't have access for this request",
      });
    }
    next();
  };
}
module.exports = allowTo;
