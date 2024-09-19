const express = require("express");
const mongoose=require("mongoose")
const cors=require("cors")
const path=require("node:path")
app = express();
port = 5000;
app.use(express.json());
const coursesRouter=require("./routes/courses.route")
const usersRouter=require("./routes/users.route")
const productsRouter=require("./routes/products.route")

app.use(cors())
app.use("/api/courses",coursesRouter)
app.use("/api/users",usersRouter)
app.use("/api/products",productsRouter)
// Upload avatar preview
app.use("/uploads",express.static(path.join(__dirname,"uploads")))

app.all("*",(req,res)=>{
  res.status(404).send({status:"Error",message:"this URL:"+req.url+" or Method "+req.method+" not exist"})
})
// =====>Connect DB<===== //
require("dotenv").config()
mongoose.connect(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 5000 }).then(()=>{
  console.log("DB connected successfully")
}).catch((err)=>{console.log("error::==>"+err)});




// Server Listening
app.listen(port, () => {
  console.log("server listen on " + ":" + port);
});
