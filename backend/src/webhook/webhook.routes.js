const { webhook } = require("./webhook.controller");
const { Router } = require("express");

const router = Router();

router.post("/webhook", webhook);

module.exports = router;