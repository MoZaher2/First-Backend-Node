const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());
// Connect DB
mongoose
  .connect(
    "mongodb+srv://mozaher:Mozaher24%40@myfirstnode.zqyjkbm.mongodb.net/?retryWrites=true&w=majority&appName=MyFirstNode"
  )
  .then(() => {
    console.log("Connected done Successfully");
  })
  .catch((error) => {
    console.log("Error while connect database" + error);
  });
// Import Article model (Table)
const Article = require("./models/Article");

// Post Article
app.post("/newArticle", async (req, res) => {
  const { Author, title, body } = req.body;
  const newArticle = new Article();
  newArticle.Author = Author;
  newArticle.title = title;
  newArticle.body = body;
  await newArticle.save();
  res.send("Article added successfully");
});
// GetAll Articles
app.get("/articles", async (req, res) => {
  const Articles = await Article.find();
  res.json(Articles);
});
//Get Article by id
app.get("/article/:id", async (req, res) => {
  let id = req.params.id;
  const article = await Article.findById(id);
  res.json(article);
});
//Delete Article by id
app.delete("/article/:id", async (req, res) => {
  let id = req.params.id;
  const article = await Article.findByIdAndDelete(id);
  res.json("Delete successfully");
});
//Update Article by id
app.put("/article/:id", async (req, res) => {
  const { Author, title, body } = req.body;
  let id = req.params.id;
  try {
    await Article.findByIdAndUpdate(id, {
      Author: Author,
      title: title,
      body: body,
    });
    res.send("Updated Successfully")
  } catch (error) {
    res.send(error.message);
  }
  res.json("Update successfully");
});

//Get Article by id
app.get("/article/:id", async (req, res) => {
  let id = req.params.id;
  const article = await Article.fi;
  res.json(article);
});





//Get
app.get("/", (req, res) => {
  res.send("Welcome on my first backend api");
});

app.get("/sum/:num1/:num2", (req, res) => {
  res.send(
    `User ${req.body.name} has sum ${req.params.num1} + ${req.params.num2} = ${
      Number(req.params.num1) + Number(req.params.num2)
    } and his age ${req.query.age}`
  );
});
app.get("/names/:name1/:name2", (req, res) => {
  res.json({
    names: [req.params.name1, req.params.name2],
    age: Number(req.query.age),
    salary: req.body.salary,
  });
});
app.get("/fileHtml", (req, res) => {
  res.sendFile(__dirname + `/views/users.html`);
});

app.get("/fileEjs", (req, res) => {
  let posts = [];
  for (let i = 1; i <= 5; i++) {
    posts.push(`Post number ${i}`);
  }
  res.render("posts.ejs", {
    title: "Posts",
    posts: posts,
  });
});

app.get("/hello", (req, res) => {
  let sum = "";
  for (let i = 0; i < 100; i++) {
    sum += i + "-";
  }
  res.send(`${sum}`);
});

// Post
app.post("/addPost", (req, res) => {
  res.send("Post added successfully");
});

// Server
app.listen(3001, () => {
  console.log("Server run on port 3001");
});

// app.listen(5000, "127.0.0.1", () => {
//   console.log(`Example app listening at http://127.0.0.1:5000`);
// });
