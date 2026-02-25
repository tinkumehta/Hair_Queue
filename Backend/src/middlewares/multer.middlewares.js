// // middleware/multer.middleware.js
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// // Ensure uploads directory exists
// const uploadsDir = './public/temp';
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Configure storage
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const shopId = req.params.shopId || 'temp';
//         const shopDir = path.join(uploadsDir, shopId);
        
//         if (!fs.existsSync(shopDir)) {
//             fs.mkdirSync(shopDir, { recursive: true });
//         }
        
//         cb(null, shopDir);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         cb(null, file.fieldname + '-' + uniqueSuffix + ext);
//     }
// });

// // File filter
// const fileFilter = (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|gif|webp/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (mimetype && extname) {
//         return cb(null, true);
//     } else {
//         cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
//     }
// };

// // Multer configuration
// export const upload = multer({
//     storage: storage,
//     limits: {
//         fileSize: 5 * 1024 * 1024, // 5MB max file size
//         files: 5 // Max 5 files
//     },
//     fileFilter: fileFilter
// });

import multer from 'multer'

const storage = multer.diskStorage({
    destination : function (req, file, cb){
        cb(null, "./public/temp")
    },
    filename : function (req, file, cb){
        cb (null, file.originalname)
    }
})

export const upload = multer ({
    storage,
})