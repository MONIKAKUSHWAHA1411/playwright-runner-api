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

        // Wrap code in an IIFE for safe return of the function
        let testFn;
        try {
            // Wrap the provided code, transform it into a returned function
            testFn = eval(`(() => { ${code} })()`);
            if (typeof testFn !== "function") {
                throw new Error("Provided code did not return a function");
            }
        } catch (err) {
            return res.status(400).json({ error: "Bad code", details: err.toString() });
        }

        try {
            await testFn({ chromium, logs });
        } catch (err) {
            errors.push(err.stack || err.toString());
        }

        return res.json({
            success: errors.length === 0,
            logs,
            errors,
        });

    } catch (err) {
        return res.status(500).json({ error: err.stack || err.toString() });
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "healthy", version: "1.0.0" });
});

app.listen(3000, () => console.log("Runner API listening on 3000"));
