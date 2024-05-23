import express from "express";
import {
  createBook,
  updateBook,
  listBooks,
  getSingleBook,
} from "./bookController";
import multer from "multer";
import path from "node:path";
import authenticateUser from "../middlewares/authenticate";

const bookRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 3e7 },
});

bookRouter.post(
  "/",
  authenticateUser,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

bookRouter.patch(
  "/:bookId",
  authenticateUser,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook
);

bookRouter.get("/list", listBooks);
bookRouter.get("/:bookId", getSingleBook);

export default bookRouter;
