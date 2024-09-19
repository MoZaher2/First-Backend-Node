module.exports=(err,req,res,next)=>{
    if(err)return res.status(400).send({status:"fail",message:err.message})
    next()
}