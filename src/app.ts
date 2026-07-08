import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import authRoutes from "./routes/auth.routes";
import { sendError } from "./utils/apiResponse";


const app : Application = express();


app.use(cors({
    origin: config.app_url,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.get("/", (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "RentNest API is running",
    });
});


app.use((req: Request, res: Response) => {
    res.status(404).json(sendError("Route not found", { path: req.originalUrl }));
});

app.use((error: Error, req: Request, res: Response, next: Function) => {
    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json(
        sendError("Internal server error", {
            message: error.message,
        }),
    );
});


export default app;