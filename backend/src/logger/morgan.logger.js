import morgan from "morgan";
import logger from "./winston.logger.js";

//* 1. stream: Bridges Morgan with Winston!
// By default, Morgan uses standard console.log. By creating this stream object, 
// we intercept Morgan's logs and force them through our fancy Winston 'logger.http' instead.
const stream = {
  write: (message) => logger.http(message.trim()),
};



//* 2. skip: Determines when Morgan should ignore logs.
// If this function returns true, Morgan stays silent. It's configured to return true 
// ONLY in production (when env !== "development"). This saves server memory in the real world!
const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};



//* 3 Build the morgan middleware
// When a request hits the server, Morgan extracts these exact pieces of data from it:
// :remote-addr -> The IP address of the user making the request (e.g. ::1 for localhost)
// :method      -> The HTTP method used (GET, POST, PUT, DELETE)
// :url         -> The exact route they are hitting (e.g. /test-logger)
// :status      -> The final status code we send back (200 OK, 400 Bad Request, etc.)
// :response-time ms -> How many milliseconds it took our server to finish responding

//* 

// Who sent it? (:remote-addr / IP Address)
// What are they doing? (:method / GET, POST, or PUT)
// Where did they go? (:url / /api/v1/chats)
// Did it succeed? (:status / 200 or 400)
// How fast was our server? (:response-time / 15ms)


const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  { stream, skip }
);

export default morganMiddleware;








//* Extra

//? IP v4 vs v6 

// standard IP addresses look like strings of numbers (e.g., 192.168.1.5 or 127.0.0.1). Those are called IPv4 addresses.

// However, almost all modern operating systems (like your Mac) have upgraded to the newer standard called IPv6.

// In the old IPv4 standard, your own machine (localhost) was called 127.0.0.1. In the new IPv6 standard, the exact same localhost is written as simply ::1.

// Because you tested the route directly from your own computer to your own server, your Mac used the modern IPv6 address (::1) to talk to itself.

// When you eventually deploy this app to the internet (or if a friend connects from their house), Morgan will print their real, normal-looking IP address (like 203.45.67.89)!


