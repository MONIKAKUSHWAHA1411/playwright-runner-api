import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.post("/run-test", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) return res.status(400).json({ error: "Missing script" });

    let logs = [];
    let errors = [];

    const fn = new Function("chromium", "logs", "errors", `
      return (async () => {
        try {
          ${code}
        } catch (err) {
          errors.push(err.toString());
        }
        return { logs, errors };
      })();
    `);

    const result = await fn(chromium, logs, errors);

    res.json({
      success: true,
      logs: result.logs,
      errors: result.errors
    });

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: "1.0.0" });
});

app.listen(8000, () => console.log("Playwright Runner running on port 8000"));
