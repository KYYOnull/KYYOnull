import * as multer from "multer";
import * as fs from 'fs';

// 改保存文件名，要自定义 storage
// 磁盘存储 指定保存的目录和文件名
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            fs.mkdirSync('uploads');
        }catch(e) {}
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname
        cb(null, uniqueSuffix)
    }
});

export { storage };