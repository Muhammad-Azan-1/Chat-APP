# JavaScript Concept: Enumerable vs Non-Enumerable Properties 🧠

## The Problem
You create a custom `ApiError` class that extends the native `Error` class and you try to spread it like this:
```javascript
const myError = new ApiError(400, "Invalid email!");
const spreadError = { ...myError }; 

console.log(spreadError.message); // undefined! Where did it go?
```

## The Explanation

In JavaScript, objects have a hidden configuration for their properties. One of these configurations is **"Enumerable"** (meaning: *can this property be looped over or spread?*).

When you build a standard object (`{ name: 'Azan' }`), the properties are enumerable by default.

However, the creators of JavaScript actively decided to make the `message`, `name`, and `stack` properties of the native `Error` class **Non-Enumerable** (invisible to the spread operator).

### Why did they do this?
1. **Security:** The `stack` trace holds internal server paths and sensitive file structures. They explicitly hid it so developers don't accidentally expose their backend structure by running `JSON.stringify(error)` or spreading an error into a response object.
2. **Design:** Errors aren't "Data Objects"; they are system signals. Their built-in properties are considered internal metadata.

## How your `ApiError` is affected
Because your `ApiError` starts with:
```javascript
class ApiError extends Error {
```
It **inherits** the exact same strict security rules from the native `Error` class.

When you call `super(message)`, it hands the message to the parent `Error` class, which then creates the `message` and `stack` properties as non-enumerable.

## The Solution
This is exactly why, in your `error.middleware.js`, you cannot just write `...error`. You must manually pull the hidden properties out:

```javascript
const response = {
    ...error,                  // Grabs your custom Enumerable properties (statusCode, success, errors)
    message: error.message,    // Hard-pulls the hidden Non-Enumerable message
    stack: error.stack         // Hard-pulls the hidden Non-Enumerable stack trace
};
```
