import winston from "winston";

// Define your severity levels.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// This method sets the current severity based on the current NODE_ENV.
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

// Define different colors for each level.
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Choose how you want your logs to look
const format = winston.format.combine(
  winston.format.timestamp({ format: "DD-MM-YYYY HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Define which transports the logger must use. A "transport" is simply where the logs go.
const transports = [
  // 1. Console Transport: This prints exactly what happened onto your live terminal screen.
  //    When you close the terminal, these logs disappear. Great for active development.
  new winston.transports.Console(),

  // 2. Error File Transport: Only catches `logger.error` crashes. 
  //    It ensures you have a permanent paper trail of critical server crashes inside `logs/error.log`
  //    even if your live console is closed!
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),

  // 3. Info File Transport: Catches `logger.info` messages. 
  //    Great for tracking general behavior like "Database connected" or "User 123 logged in".
  new winston.transports.File({ filename: "logs/info.log", level: "info" }),

  // 4. HTTP File Transport: Usually paired with 'morgan' (API logging tool).
  //    It records every single API request the frontend makes (e.g., POST /api/chat 200 OK) so you can track activity.
  new winston.transports.File({ filename: "logs/http.log", level: "http" }),
];
// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;
