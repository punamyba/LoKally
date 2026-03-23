

import multer from "multer";
import path   from "path";
import fs     from "fs";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);



const uploadDir = path.join(__dirname, "../../uploads/places");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  // recursive: true = uploads/ folder ni nabhaye sathsath banauxa
}


const storage = multer.diskStorage({

  // destination = file kaha save garni
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  // filename = file ko naam k rakhni
  filename: (req, file, cb) => {
    
    const ext        = path.extname(file.originalname).toLowerCase(); // .jpg .png etc
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`;
    cb(null, uniqueName);
  },
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // accept
  } else {
    cb(new Error("Sirf JPEG, PNG, WEBP image matra upload garna milxa"), false); // reject
  }
};



const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 5MB max
  },
});

export default upload;
