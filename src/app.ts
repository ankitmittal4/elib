import express from "express";
import { config } from "./config/config";

const app = express();

app.get("/", (req, res, next) => {
  res.json({ message: "server elib" });
});

// app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
//   const statusCode = err.statusCode || 500;
//   return res.status(statusCode).json({
//     message: err.message,
//     errorStack: config.env === "development" ? err.stack : "",
//   });
// });

export default app;
