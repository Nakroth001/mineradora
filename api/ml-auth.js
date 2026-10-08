export default async function handler(req, res) {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: "Credenciais do Mercado Livre não configuradas"
    });
  }

  const redirectUri =
    "https://mineradora-phi.vercel.app/api/ml-auth";

  const code = req.query.code;

  // 1. Sem código: manda o usuário para autorização do Mercado Livre
  if (!code) {
    const authUrl =
      "https://auth.mercadolivre.com.br/authorization" +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return res.redirect(302, authUrl);
  }

  // 2. Com código: troca pelo Access Token
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
          code: code,
          redirect_uri: redirectUri
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      message: "Mercado Livre conectado com sucesso!",
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user_id
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro ao conectar com o Mercado Livre"
    });
  }
}
