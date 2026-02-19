// ================================================================
// middleware/placeUpload.middleware.js
// ================================================================
// Middleware = request ra controller bich kaam garne file
// Yo file ley user ley upload gareko IMAGE handle garxa
// Multer = Node.js ma file upload garne library
//
// Paxi community post ko lagi = postUpload.middleware.js banauxa
// Tesailley naam clearly "place" rakheko
// ================================================================

import multer from "multer";
import path   from "path";
import fs     from "fs";
import { fileURLToPath } from "url";

// ----------------------------------------------------------------
// ESModule ma __dirname hudaina -- yo trick ley banauxa
// ----------------------------------------------------------------
// CommonJS (require) ma __dirname automatically hudathyo
// ESModule (import) ma manually banaunu parxa
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ----------------------------------------------------------------
// STEP 1: UPLOAD FOLDER READY GARA
// ----------------------------------------------------------------
// Server start huda folder nabhaye auto banauxa
// Project root ma: uploads/places/ folder

const uploadDir = path.join(__dirname, "../../uploads/places");
// __dirname = yo file kaha xa tyo path
// ../../ = middleware/ bata 2 level utha = project root
// uploads/places = tyo folder

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  // recursive: true = uploads/ folder ni nabhaye sathsath banauxa
}

// ----------------------------------------------------------------
// STEP 2: FILE KAHA SAVE GARNI ANI K NAAM DINI
// ----------------------------------------------------------------

const storage = multer.diskStorage({

  // destination = file kaha save garni
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  // filename = file ko naam k rakhni
  filename: (req, file, cb) => {
    // same naam rakhda overwrite hunxa so unique naam banauxa
    // eg: 1708342823123-48291.jpg
    const ext        = path.extname(file.originalname).toLowerCase(); // .jpg .png etc
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`;
    cb(null, uniqueName);
  },
});

// ----------------------------------------------------------------
// STEP 3: FILE TYPE CHECK (sirf image matra allow)
// ----------------------------------------------------------------

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // accept
  } else {
    cb(new Error("Sirf JPEG, PNG, WEBP image matra upload garna milxa"), false); // reject
  }
};

// ----------------------------------------------------------------
// STEP 4: MULTER CONFIG BANAU
// ----------------------------------------------------------------

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export default upload;
// Route ma use: upload.single("image")
// "image" = frontend ley pathauney form field ko naam