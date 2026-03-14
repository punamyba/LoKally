import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function resizeImages(req, res, next) {
  try {
    const files = req.files;
    if (!files || files.length === 0) return next();

    for (const file of files) {
      const inputPath  = file.path;
      const outputPath = inputPath.replace(/\.[^.]+$/, ".webp");

      await sharp(inputPath)
        .rotate()                                          // auto-fix EXIF orientation
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(outputPath);

      if (inputPath !== outputPath && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }

      file.path     = outputPath;
      file.filename = path.basename(outputPath);
      file.mimetype = "image/webp";
    }
    next();
  } catch (err) {
    console.error("resizeImages:", err.message);
    next();
  }
}

export async function resizeSingleImage(req, res, next) {
  try {
    const file = req.file;
    if (!file) return next();

    const inputPath  = file.path;
    const outputPath = inputPath.replace(/\.[^.]+$/, ".webp");

    await sharp(inputPath)
      .rotate()                                            // auto-fix EXIF orientation
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(outputPath);

    if (inputPath !== outputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    file.path     = outputPath;
    file.filename = path.basename(outputPath);
    file.mimetype = "image/webp";
    next();
  } catch (err) {
    console.error("resizeSingleImage:", err.message);
    next();
  }
}