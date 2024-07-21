const multer = require('multer');

try{
    const storage = multer.diskStorage({
        destination : (req, file, cb)=>{
            cb(null, 'public/uploads/products')
        },
        filename: (req, file, cb)=>{
            cb(null, `${Date.now()}-${file.originalname}`)
        }
    })
    
    const upload = multer({
        storage: storage,
        limits: {
            fieldSize: 25* 1024 *1024,
            fileSize: 25* 1024 *1024,
        }
    })

    module.exports = upload;

}catch(err){
    console.log("multer error :",err);
}


