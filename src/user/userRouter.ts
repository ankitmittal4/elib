import express from "express";

const userRouter = express.Router();

userRouter.post("/register", (req, res) => {
  res.json({
    message: "User Registered",
  });
});

export default userRouter;
