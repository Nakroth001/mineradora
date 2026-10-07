export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { plano } = req.body;

  const planos = {
    basico: {
      nome: "Noryva Básico",
      valor: 49.99
    },
    pro: {
      nome: "Noryva Pro",
      valor: 85.00
    },
    ouro: {
      nome: "Noryva Ouro",
      valor: 119.99
    }
  };

  const produto = planos[plano];

  if (!produto) {
    return res.status(400).json({ error: "Plano inválido" });
  }

  try {
    const response = await fetch("https://api.asaas.com/v3/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": process.env.ASAAS_API_KEY
      },
      body: JSON.stringify({
        billingTypes: ["CREDIT_CARD", "PIX"],
        chargeTypes: ["RECURRENT"],
        minutesToExpire: 60,

        callback: {
          successUrl: "https://mineradora-g6o0zmpuw-noryva1.vercel.app/",
          cancelUrl: "https://mineradora-g6o0zmpuw-noryva1.vercel.app/",
          expiredUrl: "https://mineradora-g6o0zmpuw-noryva1.vercel.app/"
        },

        items: [
          {
            name: produto.nome,
            description: "Acesso à plataforma Noryva",
            quantity: 1,
            value: produto.valor
          }
        ],

        subscription: {
          cycle: "MONTHLY"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      checkoutUrl: data.link,
      checkoutId: data.id
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro ao criar checkout"
    });
  }
}
