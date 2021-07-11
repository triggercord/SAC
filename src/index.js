import express from "express";
const app = express();

// set up logging
import morgan from "morgan";
app.use(morgan("common"));


import cors from "cors";
app.use(cors());

// register /likes
// import likesRouter from "./likes.js";
// app.use(likesRouter);

import logoutRouter from "./logout.js";
app.use(logoutRouter);

app.listen(process.env.PORT || 3000, () => {
    console.log("Express running...");
});
