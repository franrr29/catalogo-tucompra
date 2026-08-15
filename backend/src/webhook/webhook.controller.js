// capturo datos que envia mercado pago cuando se realiza un pago exitoso
const { procesarPagoService } = require("./webhook.service");

async function webhook(req, res) {
  try {
    const { type, data } = req.body;

    if (type !== "payment") {
      return res.status(200).send("ok");
    }

    await procesarPagoService(data.id);

    res.status(200).send("ok");

  } catch (error) {

    console.error("error en webhook:", error);

    res.status(200).send("ok");
  }
}

module.exports = { webhook };