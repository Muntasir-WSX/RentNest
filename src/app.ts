import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from './config';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import landlordRoutes from './routes/landlord.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import propertyRoutes from './routes/property.routes.js';
import rentalRoutes from './routes/rental.routes.js';
import reviewRoutes from './routes/review.routes.js';
import { sendError } from './utils/apiResponse.js';


const app : Application = express();


app.use(cors({
    origin: config.app_url,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/landlord", landlordRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

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