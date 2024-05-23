import express, { Request, Response, NextFunction } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import createHttpError, { HttpError } from "http-errors";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import cors from "cors";
import { config } from "./config/config";

const app = express();
app.use(
  cors({
    origin: config.frontendDomain,
  })
);

app.use(express.json());
app.get("/", (req, res, next) => {
  const error = createHttpError(400, "Something went wrong!!!");
  throw error;
  res.json({ message: "server elib" });
});

app.use(globalErrorHandler);
app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

export default app;
