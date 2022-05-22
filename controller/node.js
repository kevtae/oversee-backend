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

    const node = await pool.query(
      `INSERT INTO NODE(nodeName, url, description, nodePosition, nodeType, nodeLabel)\
          VALUES ('${nodeName}','${linkUrl}','${description}','${positionJSON}','${type}','${label}') RETURNING nodeId`
    );

    await pool.query(
      `INSERT INTO EDGE(edgeSource,edgeTarget) VALUES (3,${node.rows[0].nodeid})`
    );

    const newNode = await pool.query(
      `SELECT * FROM NODE WHERE nodeId=${node.rows[0].nodeid}`
    );

    const result = newNode.rows;

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

exports.getNode = async (req, res) => {
  try {
    const query = await pool.query(`SELECT * FROM NODE`);
    const result = query.rows;

    console.log(query.rows);

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

    await pool.query(
      `update edge
        set label = 'total value:'||(select SUM(usdcPrice)
        FROM transaction
        where nodeId = ${nodeId})
        where target = ${nodeId}`
    );

    const newNode = await pool.query(
      `SELECT * FROM TRANSACTION WHERE nodeId=${nodeId}`
    );

    newNode = result.rows;

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
