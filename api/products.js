export default async function handler(req, res) {
  return res.status(200).json({
    login: !!process.env.DATAFORSEO_LOGIN,
    password: !!process.env.DATAFORSEO_PASSWORD
  });
}
