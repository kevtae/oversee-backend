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

exports.getEdge = async (req, res) => {
  try {
    const query = await pool.query(`SELECT * FROM EDGE`);
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
