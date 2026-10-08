export default async function handler(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Rota de produtos criada. Próximo passo: conectar o token do Mercado Livre."
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno"
    });
  }
}
