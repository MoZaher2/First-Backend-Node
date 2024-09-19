const express=require("express")
const router=express.Router()
const usersController=require("../controllers/users.controller")
const usersMiddleware=require("../middlewares/users.middleware")
const tokenMiddleware=require("../middlewares/token.middleware")
const filetypeMiddleware=require("../middlewares/filetype.middleware")
const multer  = require('multer')



const diskStorage=multer.diskStorage({
        destination:function(req,file,cb){
                cb(null,'uploads')
        },
        filename:function (req,file,cb){
                console.log(file.mimetype)
                const ext=file.mimetype.split('/')[1];
                const fileName=`img-${Date.now()}.${ext}`;
                cb(null,fileName)
        }
})


const upload = multer({ storage: diskStorage,
        fileFilter:function (req,file,cb){
                const fileType=file.mimetype.split("/")[0]
                if(fileType=="image")return cb(null,true)
                const error = new Error('FILE TYPE WRONG');
                error.status = 400;
                cb(error, false);
        }
})

router.route("/")
        .get(tokenMiddleware,usersController.getUsers)
router.route("/register")
        .post(upload.single('avatar'),filetypeMiddleware,usersMiddleware.middlewareBody,usersController.register)
router.route("/login")
        .get(usersController.login)
module.exports=router
