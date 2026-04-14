import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false
  }
};

let pitches = global.pitches || [];
global.pitches = pitches;

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: true });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const fileList = [];

    if (files.files) {
      const arr = Array.isArray(files.files) ? files.files : [files.files];

      arr.forEach(file => {
        fileList.push({
          name: file.originalFilename,
          size: file.size,
          type: file.mimetype
        });
      });
    }

    const pitch = {
      id: Date.now(),
      companyName: fields.companyName,
      website: fields.website,
      description: fields.description,
      founders: fields.founders,
      linkedin: fields.linkedin,
      attachments: fileList,
      createdAt: new Date().toISOString()
    };

    pitches.push(pitch);

    return res.status(200).json({ success: true, id: pitch.id });
  });
}