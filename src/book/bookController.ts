import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import multer from "multer";
import path from "path";
import { Express } from "express";
import createHttpError from "http-errors";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  // console.log("Files: ", req.files);

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files.coverImage || !files.file) {
    return next(createHttpError(401, "CoverImage and book pdf is required"));
  }
  const fileName = files.coverImage[0].filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );
  const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);

  try {
    const coverImageUploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-cover",
      format: coverImageMimeType,
    });
  } catch (error) {
    return next(createHttpError(401, "Error in upload coverImage"));
  }

  //book pdf upload
  const bookFileName = files.file[0].filename;

  const bookFilePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    bookFileName
  );
  const bookFileMimeType = files.file[0].mimetype.split("/").at(-1);
  try {
    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resourse_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdf",
        format: bookFileMimeType || "pdf",
      }
    );
  } catch (error) {
    return next(createHttpError(401, "Error in upload file"));
  }

  // console.log("coverImageUploadResult: ", coverImageUploadResult);
  // console.log("bookFileUploadResult: ", bookFileUploadResult);

  res.json({
    message: "Book created successfully",
  });
};

export { createBook };
