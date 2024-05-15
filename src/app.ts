import express, { Request, Response, NextFunction } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import createHttpError, { HttpError } from "http-errors";

const app = express();

app.get("/", (req, res, next) => {
  const error = createHttpError(400, "Something went wrong!!!");
  throw error;
  res.json({ message: "server elib" });
});

app.use(globalErrorHandler);

export default app;
