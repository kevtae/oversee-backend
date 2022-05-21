const axios = require("axios");
const Promise = require("promise");
const { Pool } = require("pg");
const convert = require("ether-converter");

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  passowrd: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

exports.createNode = async (req, res) => {
  try {
    const { nodeName, linkUrl, description, position, type, label } = req.body;

    const positionJSON = JSON.stringify(position);

    await pool.query(
      `INSERT INTO NODE(nodeName, url, description, nodePosition, nodeType, nodeLabel)\
          VALUES ('${nodeName}','${linkUrl}','${description}','${positionJSON}','${type}','${label}')`
    );

    res.status(200).json({
      status: "success query",
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error,
    });
  }
};

exports.updateNode = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const nodeId = req.params.nodeId;

    console.log(transactionId, nodeId);

    await pool.query(
      ` UPDATE TRANSACTION\
       SET nodeid = ${nodeId} \
       WHERE hash = '${transactionId}';
      `
    );

    res.status(200).json({
      status: "success query",
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error,
    });
  }
};
