// 1. Console Transport: ALWAYS run this. Vercel automatically captures 
//    console logs and displays them in your Vercel Dashboard!
const transports = [
  new winston.transports.Console(),
];

// 2. File Transports: ONLY run these if we are NOT on Vercel (Production).
//    This prevents the "mkdir logs" crash on Vercel's read-only file system.
if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/info.log", level: "info" }),
    new winston.transports.File({ filename: "logs/http.log", level: "http" })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;