import express, { Request, Response, NextFunction } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import createHttpError, { HttpError } from "http-errors";
import userRouter from "./user/userRouter";
const app = express();

app.use(express.json());
app.get("/", (req, res, next) => {
  const error = createHttpError(400, "Something went wrong!!!");
  throw error;
  res.json({ message: "server elib" });
});

app.use(globalErrorHandler);
app.use("/api/users", userRouter);
export default app;
