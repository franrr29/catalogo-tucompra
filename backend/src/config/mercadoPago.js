const { MercadoPagoConfig } = require("mercadopago");
require("dotenv").config();

// configuro el sdk de mercado pago con mi access token
const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

module.exports = mp;