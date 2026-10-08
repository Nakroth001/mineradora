import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const cookies = req.headers.cookie || "";
    const match = cookies.match(/ml_session=([^;]+)/);

    if (!match) {
      return res.status(401).json({
        error: "Mercado Livre não conectado"
      });
    }

    const session = JSON.parse(
      Buffer.from(match[1], "base64url").toString()
    );

    const key = crypto
      .createHash("sha256")
      .update(process.env.ML_CLIENT_SECRET)
      .digest();

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(session.iv, "base64")
    );

    decipher.setAuthTag(
      Buffer.from(session.tag, "base64")
    );

    let decrypted = decipher.update(
      session.data,
      "base64",
      "utf8"
    );

    decrypted += decipher.final("utf8");

    const tokenData = JSON.parse(decrypted);

    const response = await fetch(
      "https://api.mercadolibre.com/sites/MLB/search?q=iphone&limit=20",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Mercado Livre recusou a busca",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      produtos: data.results.map(item => ({
        id: item.id,
        titulo: item.title,
        preco: item.price,
        imagem: item.thumbnail,
        link: item.permalink
      }))
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno ao buscar produtos"
    });
  }
}
