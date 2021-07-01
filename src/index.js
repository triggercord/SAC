import express from "express";
const app = express();

// set up logging
import morgan from "morgan";
app.use(morgan("common"));

// register /likes
import likesRouter from "./likes.js";
app.use(likesRouter);

app.listen(process.env.PORT || 3000, () => {
    console.log("Express running...");
});
