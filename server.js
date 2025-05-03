console.log("Starting CrateStack server...");

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/hello", (req, res) => {
  res.send("Hello from CrateStack!");
});

app.listen(PORT, () => {
  console.log(`CrateStack backend is running on http://localhost:${PORT}`);
});