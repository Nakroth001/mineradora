import crypto from "crypto";

export default async function handler(req, res) {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  const redirectUri =
    "https://mineradora-phi.vercel.app/api/ml-auth";

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: "Credenciais do Mercado Livre não configuradas"
    });
  }

  const { code } = req.query;

  if (!code) {
    const authUrl =
      "https://auth.mercadolivre.com.br/authorization" +
      "?response_type=code" +
      "&client_id=" +
      encodeURIComponent(clientId) +
      "&redirect_uri=" +
      encodeURIComponent(redirectUri);

    return res.redirect(302, authUrl);
  }

  try {
    const response = await fetch(
      "https://api.mercadolibre.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro na autorização do Mercado Livre",
        details: data
      });
    }

    const tokenData = JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at:
        Date.now() + (data.expires_in * 1000)
    });

    const secret =
      process.env.ML_CLIENT_SECRET;

    const key = crypto
      .createHash("sha256")
      .update(secret)
      .digest();

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      key,
      iv
    );

    let encrypted =
      cipher.update(tokenData, "utf8", "base64");

    encrypted += cipher.final("base64");

    const tag =
      cipher.getAuthTag().toString("base64");

    const cookieValue =
      Buffer.from(
        JSON.stringify({
          iv: iv.toString("base64"),
          data: encrypted,
          tag
        })
      ).toString("base64url");

    res.setHeader(
      "Set-Cookie",
      `ml_session=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    );

    return res.status(200).send(`
      <html>
        <body style="background:#080808;color:white;font-family:Arial;text-align:center;padding:60px">
          <h1>Mercado Livre conectado com sucesso! ✅</h1>
          <p>O Noryva está pronto para buscar dados.</p>
        </body>
      </html>
    `);

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno na conexão com o Mercado Livre"
    });
  }
}
