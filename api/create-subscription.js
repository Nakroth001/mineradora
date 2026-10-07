export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const {
      plano,
      nome,
      cpf,
      email,
      telefone,
      numeroCartao,
      nomeCartao,
      validadeMes,
      validadeAno,
      cvv
    } = req.body;

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
      return res.status(400).json({
        error: "Plano inválido"
      });
    }

    if (!nome || !cpf || !email || !telefone) {
      return res.status(400).json({
        error: "Preencha todos os dados pessoais"
      });
    }

    if (
      !numeroCartao ||
      !nomeCartao ||
      !validadeMes ||
      !validadeAno ||
      !cvv
    ) {
      return res.status(400).json({
        error: "Preencha os dados do cartão"
      });
    }

    const headers = {
      "Content-Type": "application/json",
      "access_token": process.env.ASAAS_API_KEY
    };

    /*
      1. Criar cliente no Asaas
    */

    const clienteResponse = await fetch(
      "https://api.asaas.com/v3/customers",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: nome,
          cpfCnpj: cpf.replace(/\D/g, ""),
          email: email,
          mobilePhone: telefone.replace(/\D/g, "")
        })
      }
    );

    const cliente = await clienteResponse.json();

    if (!clienteResponse.ok) {
      return res.status(clienteResponse.status).json({
        error: "Não foi possível criar o cliente",
        details: cliente
      });
    }

    /*
      2. Criar assinatura mensal
    */

    const hoje = new Date();

    const nextDueDate =
      hoje.toISOString().slice(0, 10);

    const ip =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      "";

    const assinaturaResponse = await fetch(
      "https://api.asaas.com/v3/subscriptions",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer: cliente.id,

          billingType: "CREDIT_CARD",

          value: produto.valor,

          nextDueDate: nextDueDate,

          cycle: "MONTHLY",

          description:
            produto.nome + " — Assinatura Noryva",

          externalReference:
            "NORYVA-" + plano,

          creditCard: {
            holderName: nomeCartao,
            number: numeroCartao.replace(/\s/g, ""),
            expiryMonth: validadeMes,
            expiryYear: validadeAno,
            ccv: cvv
          },

          creditCardHolderInfo: {
            name: nome,
            email: email,
            cpfCnpj: cpf.replace(/\D/g, ""),
            phone: telefone.replace(/\D/g, "")
          },

          remoteIp: ip
        })
      }
    );

    const assinatura =
      await assinaturaResponse.json();

    if (!assinaturaResponse.ok) {
     return res.status(assinaturaResponse.status).json({
  error:
    assinatura.errors?.map(e => e.description).join(" | ") ||
    assinatura.message ||
    "O Asaas recusou a criação da assinatura"
});
    }

    return res.status(200).json({
      success: true,
      subscriptionId: assinatura.id,
      customerId: cliente.id,
      message:
        "Assinatura criada. O pagamento será confirmado pelo Asaas."
    });

  } catch (error) {

    console.error("Erro na assinatura:", error.message);

    return res.status(500).json({
      error: "Erro interno ao processar assinatura"
    });
  }
}
