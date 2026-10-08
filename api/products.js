export default async function handler(req, res) {
  try {
    const cookies = req.headers.cookie || "";

    const match = cookies.match(
      /ml_access_token=([^;]+)/
    );

    if (!match) {
      return res.status(401).json({
        error: "Mercado Livre não conectado"
      });
    }

    const accessToken = match[1];

    const response = await fetch(
      "https://api.mercadolibre.com/trends/MLB",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
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
