const express = require("express");

const router = express.Router();

const { initialContract } = require("../controller/contract");

const { createNode, updateNode, getNode } = require("../controller/node");

router.route("/transaction/:id").get(initialContract);

router.route("/createNode").post(createNode);

router.route("/updateNode/:transactionId/:nodeId").patch(updateNode);

router.route("/getNode").get(getNode);

module.exports = router;
