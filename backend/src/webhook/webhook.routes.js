const { webhook } = require("./webhook.controller");
const { verificarFirmaWebhook } = require("./webhook.firma");
const { Router } = require("express");

const router = Router();

// la firma x-signature se verifica segun MP_WEBHOOK_FIRMA (off / registrar / exigir), ver webhook.firma.js
router.post("/webhook", verificarFirmaWebhook, webhook);

module.exports = router;
