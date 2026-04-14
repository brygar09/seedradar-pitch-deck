import express from "express";
import serverless from "serverless-http";
import formidable from "formidable";

const app = express();

app.get("/api/test", (req, res) => {
  res.json({ message: "API working 🚀" });
});

app.post("/api/pitch", (req, res) => {
  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Convert files to safe metadata
    const attachments = [];

    if (files.files) {
      const arr = Array.isArray(files.files)
        ? files.files
        : [files.files];

      arr.forEach((f) => {
        attachments.push({
          name: f.originalFilename,
          size: f.size,
          type: f.mimetype
        });
      });
    }

    // Build payload for Make.com
    const payload = {
      ...fields,
      attachments,
      submittedAt: new Date().toISOString()
    };

    try {
      // SEND TO MAKE.COM
      const response = await fetch(MAKE_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Make webhook failed");
      }

      return res.json({
        success: true,
        message: "Sent to Make.com 🚀"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

export default serverless(app);
