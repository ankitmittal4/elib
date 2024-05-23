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

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //do pagination
    const book = await bookModel.find();
    return res.json(book);
  } catch (error) {
    return next(createHttpError(401, "List cannot be fetched"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    return res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while fetching book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    //chevk access is auhenticated or not
    const _req = req as AuthRequest;

    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "You can't delete others book"));
    }

    //for delete we need public id
    const splitCoverImage = book.coverImage.split("/");
    const coverImagePublicId =
      splitCoverImage.at(-2) + "/" + splitCoverImage.at(-1)?.split(".").at(-2);
    // console.log("CoverImage Public id: ", coverImagePublicId);

    //for delete we need public id
    const splitFile = book.file.split("/");
    const filePublicId = splitFile.at(-2) + "/" + splitFile.at(-1);
    // console.log("File Public id: ", filePublicId);

    try {
      await cloudinary.uploader.destroy(coverImagePublicId);
      await cloudinary.uploader.destroy(filePublicId, {
        resource_type: "raw",
      });
    } catch (error) {
      return next(createHttpError(500, "File not deleted from Cloudinary"));
    }
    await bookModel.deleteOne({ _id: bookId });

    return res.sendStatus(204);
  } catch (error) {
    return next(createHttpError(500, "Error while fetching book"));
  }
};
export { createBook, updateBook, listBooks, getSingleBook, deleteBook };

//delete file id updated
