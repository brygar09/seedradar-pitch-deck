export default function handler(req, res) {
  if (!global.pitches) global.pitches = [];
  res.status(200).json(global.pitches);
}