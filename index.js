import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// POST /run-test
app.post("/run-test", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Missing script" });
    }

    let logs = [];
    let errors = [];

    // Support require() inside user code
    const fn = new Function("chromium", "logs", "errors", "require", `
      return (async () => {
        try {
          ${code}
        } catch (err) {
          errors.push(err.toString());
        }
        return { logs, errors };
      })();
    `);

    const result = await fn(chromium, logs, errors, require);

    res.json({
      success: errors.length === 0,
      logs: result.logs,
      errors: result.errors
    });

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: "1.0.0" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Playwright Runner API listening on port ${PORT}`);
});
