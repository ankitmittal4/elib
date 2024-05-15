import { NextFunction, Request, Response } from "express";
const createUser = (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: "User register Successfully",
  });
};

export { createUser };
