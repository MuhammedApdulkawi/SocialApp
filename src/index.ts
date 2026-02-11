import "dotenv/config";
import Express from "express";
import morgan from "morgan";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import { dbconnection } from "./DB/db.connection";
import * as middleware from "./middleware/index";
import { cleanBlackListCron, cleanFriendShipCron } from "./utils/services/crons";
import { ioInitializer } from "./gateways/socketio.gateway";
import { routers } from "./modules";

// Create an Express application
const app = Express();

// Connect to the database
dbconnection();

// Security middleware
app.use(helmet());

// parse incoming requests with JSON payloads
app.use(Express.json());

// allow CORS for all origins (you can customize this in production)
app.use(cors({ origin: '*' }));

// crons
cleanBlackListCron();
cleanFriendShipCron();

// Use the routers
app.use("/api", routers);

// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream("access.log", { flags: "a" });

// setup the logger
app.use(morgan("combined", { stream: accessLogStream }));

// Global error handling middleware
app.use(middleware.globalerror);

// Start the server
const server = app.listen(process.env.PORT as string, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

// Initialize Socket.IO
ioInitializer(server);