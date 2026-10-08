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
      "&client_id=" + encodeURIComponent(clientId) +
      "&redirect_uri=" + encodeURIComponent(redirectUri);

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

    res.setHeader(
      "Set-Cookie",
      `ml_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=21600`
    );

    return res.status(200).json({
      success: true,
      message: "Mercado Livre conectado com sucesso!",
      user_id: data.user_id
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno na conexão com o Mercado Livre"
    });
  }
}
