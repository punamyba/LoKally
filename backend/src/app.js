import express from "express";
import cors from "cors";
import { pool } from "./config/db.js"; 
import router from "./routes/index.js"; 

const app = express(); // <-- This MUST come before app.use()

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", router);

export default app;
