import express from "express";
import serverless from "serverless-http";
import formidable from "formidable";

const app = express();

app.get("/api/test", (req, res) => {
  res.json({ message: "API working 🚀" });
});

app.post("/api/pitch", (req, res) => {
  const form = formidable({ multiples: true });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const attachments = [];

    if (files.files) {
      const arr = Array.isArray(files.files) ? files.files : [files.files];
      arr.forEach(f => {
        attachments.push({
          name: f.originalFilename,
          size: f.size,
          type: f.mimetype
        });
      });
    }

    res.json({
      success: true,
      data: {
        ...fields,
        attachments
      }
    });
  });
});

export default serverless(app);
