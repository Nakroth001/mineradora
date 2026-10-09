export default async function handler(req, res) {
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({
      error: "Informe um produto"
    });
  }

  try {
    const url =
      "https://api.searlo.tech/api/v1/search/shopping?" +
      new URLSearchParams({
        q,
        gl: "br",
        hl: "pt",
        limit: "10"
      });

    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.SEARLO_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const produtos = data.shopping || data.results || [];

    const corrigidos = produtos.map(produto => ({
      ...produto,
      link:
        produto.link ||
        produto.product_link ||
        produto.url ||
        produto.offer_link ||
        ""
    }));

    return res.status(200).json({
      ...data,
      shopping: corrigidos
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro ao consultar produtos",
      details: error.message
    });
  }
}
