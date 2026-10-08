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

  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    return res.status(500).json({
      error: "Credenciais da DataForSEO não configuradas"
    });
  }

  try {
    const credentials = Buffer.from(
      `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
    ).toString("base64");

    // 1. Cria a pesquisa no Google Shopping
    const createResponse = await fetch(
      "https://api.dataforseo.com/v3/merchant/google/products/task_post",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          {
            language_name: "Portuguese",
            location_name: "Brazil",
            keyword,
            depth: 20,
            priority: 1
          }
        ])
      }
    );

    const createData = await createResponse.json();

    if (!createResponse.ok || !createData.tasks?.[0]?.id) {
      return res.status(502).json({
        error: "Erro ao criar pesquisa",
        details: createData
      });
    }

    const taskId = createData.tasks[0].id;

    // 2. Aguarda o resultado
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const resultResponse = await fetch(
        `https://api.dataforseo.com/v3/merchant/google/products/task_get/advanced/${taskId}`,
        {
          headers: {
            "Authorization": `Basic ${credentials}`
          }
        }
      );

      const resultData = await resultResponse.json();

      const task = resultData.tasks?.[0];

      if (task?.result?.length) {
        return res.status(200).json(task.result[0]);
      }
    }

    return res.status(202).json({
      pending: true,
      taskId,
      message: "A pesquisa ainda está sendo processada."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno na pesquisa",
      details: error.message
    });
  }
}
