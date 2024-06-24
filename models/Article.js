const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const articleSchema = new Schema({
  Author: String,
  title: String,
  body: String,
});
const Article = mongoose.model("Article", articleSchema);
module.exports = Article;
