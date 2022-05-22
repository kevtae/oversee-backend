const express = require("express");

const router = express.Router();

const { initialContract, getTransaction } = require("../controller/contract");

const { createNode, updateNode, getNode } = require("../controller/node");

const { getEdge } = require("../controller/edge");

router.route("/transaction/:id").get(initialContract);

router.route("/getTransaction").get(getTransaction);

router.route("/createNode").post(createNode);

router.route("/updateNode/:nodeId").patch(updateNode);

router.route("/getNode").get(getNode);

router.route("/getEdge").get(getEdge);

module.exports = router;
