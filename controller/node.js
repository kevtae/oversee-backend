const axios = require("axios");
const Promise = require("promise");
const { Client } = require("pg");
const convert = require("ether-converter");

const pool = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
pool.connect();

// const pool = new Pool({
//   user: process.env.PGUSER,
//   host: process.env.PGHOST,
//   database: process.env.PGDATABASE,
//   passowrd: process.env.PGPASSWORD,
//   port: process.env.PGPORT,
// });

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

exports.getNode = async (req, res) => {
  try {
    const query = await pool.query(`SELECT * FROM NODE`);
    result = query.node;

    res.status(200).json({
      status: "success query",
      data: {
        result,
      },
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
    const nodeId = req.params.nodeId;
    const { keyId } = req.body;

    keyId.forEach(async (element, index) => {
      console.log(keyId[index]);
      await pool.query(
        ` UPDATE TRANSACTION\
           SET nodeid = ${nodeId} \
           WHERE id = '${keyId[index]}';
          `
      );
    });

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
