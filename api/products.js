export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const keyword = String(req.query.q || "").trim();

  if (!keyword) {
    return res.status(400).json({
      error: "Informe um produto para pesquisar"
    });
  }

  try {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    const auth = Buffer.from(`${login}:${password}`).toString("base64");

    const response = await fetch(
      "https://api.dataforseo.com/v3/merchant/google/products/task_post",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          {
            language_code: "pt",
            location_code: 2076,
            keyword: keyword,
            depth: 20
          }
        ])
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "DataForSEO recusou a pesquisa",
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno",
      details: error.message
    });
  }
}
