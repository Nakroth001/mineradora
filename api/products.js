export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api.mercadolibre.com/trends/MLB",
      {
        headers: {
          Authorization: `Bearer ${process.env.ML_ACCESS_TOKEN}`
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno",
      details: error.message
    });
  }
}
