export default function handler(req, res) {
  return res.status(200).json({
    ML_CLIENT_ID: !!process.env.ML_CLIENT_ID,
    ML_CLIENT_SECRET: !!process.env.ML_CLIENT_SECRET
  });
}
