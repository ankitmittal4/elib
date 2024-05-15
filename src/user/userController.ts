import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
const createUser = (req: Request, res: Response, next: NextFunction) => {
  //   console.log("Req Body: ", req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }
  res.json({
    message: "User register Successfully",
  });
};

export { createUser };
