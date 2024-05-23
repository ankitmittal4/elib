import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import multer from "multer";
import path from "path";
import { Express } from "express";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  // console.log("Files: ", req.files);
  try {
    const { title, genre } = req.body;

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

    const coverImageUploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-cover",
      format: coverImageMimeType,
    });

    //book pdf upload
    const bookFileName = files.file[0].filename;

    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );
    const bookFileMimeType = files.file[0].mimetype.split("/").at(-1);
    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resourse_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdf",
        format: bookFileMimeType || "pdf",
      }
    );

    console.log("coverImageUploadResult: ", coverImageUploadResult);
    console.log("bookFileUploadResult: ", bookFileUploadResult);
    let newBook;
    try {
      newBook = await bookModel.create({
        title,
        genre,
        author: "664627fe7d73409cb7edcb9d",
        coverImage: coverImageUploadResult.secure_url,
        file: bookFileUploadResult.secure_url,
      });
      console.log("New Book: ", newBook);
    } catch (error) {
      return next(createHttpError(401, "Error while creating book"));
    }
    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(bookFilePath);
    } catch (error) {
      return next(createHttpError(401, "Error in unlinking the file"));
    }

    res.status(201).json({
      id: newBook._id,
    });
  } catch (error) {
    return next(createHttpError(401, "Error while uploading file"));
  }
};

export { createBook };
