import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import multer from "multer";
import path from "path";
import { Express } from "express";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  // console.log("Files: ", req.files);
  try {
    const { title, genre } = req.body;
    //@ts-ignore
    console.log("userId: ", req.userId);

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

    // console.log("coverImageUploadResult: ", coverImageUploadResult);
    // console.log("bookFileUploadResult: ", bookFileUploadResult);
    let newBook;
    const _req = req as AuthRequest;
    try {
      newBook = await bookModel.create({
        title,
        genre,
        author: _req.userId,
        coverImage: coverImageUploadResult.secure_url,
        file: bookFileUploadResult.secure_url,
      });
      // console.log("New Book: ", newBook);
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

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;
  const book = await bookModel.findOne({ _id: bookId });
  if (!book) {
    return next(createHttpError(404, "Book not Found"));
  }
  const _req = req as AuthRequest;

  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You can't update others book"));
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let completeCoverImage = "";
  if (files.coverImage) {
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
    completeCoverImage = coverImageUploadResult.secure_url;
    await fs.promises.unlink(filePath);
  }

  let completeFileName = "";
  if (files.file) {
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
    completeFileName = bookFileUploadResult.secure_url;
    await fs.promises.unlink(bookFilePath);
  }

  const updatedBook = await bookModel.findOneAndUpdate(
    {
      _id: bookId,
    },
    {
      title,
      genre,
      coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
      file: completeFileName ? completeFileName : book.file,
    },
    { new: true }
  );
  res.status(201).json({ updatedBook });
};

export { createBook, updateBook };
