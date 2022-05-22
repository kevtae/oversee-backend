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

//test case -> if they call this function more than once
exports.initialContract = async (req, res) => {
  try {
    const contractId = req.params.id;
    console.log(contractId);

    var tokentx = {
      method: "get",
      url: `https://api.etherscan.io/api?module=account&action=tokentx&address=${contractId}&page=1&offset=20&startblock=0&endblock=27025780&sort=asc&apikey=${process.env.ETHERAPI}`,
      headers: {},
    };

    var internaltx = {
      method: "get",
      url: `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${contractId}&page=1&offset=20&startblock=0&endblock=27025780&sort=asc&apikey=${process.env.ETHERAPI}`,
      headers: {},
    };

    var tokenBalance = {
      method: "get",
      url: "https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&tag=latest&apikey=YH44N5HPVRBS8ARQEHJVR1MENPMA157HS6&address=0xE4762eAcEbDb7585D32079fdcbA5Bb94eb5d76F2",
      headers: {},
    };

    var ethBalance = {
      method: "get",
      url: "https://api.etherscan.io/api?module=account&action=balance&tag=latest&apikey=YH44N5HPVRBS8ARQEHJVR1MENPMA157HS6&address=0xE4762eAcEbDb7585D32079fdcbA5Bb94eb5d76F2",
      headers: {},
    };

    function getNodeType(from) {
      if (from === req.params.id) {
        return 2;
      } else {
        return 1;
      }
    }

    // fix the krause value
    function convertValue(number, tokenName) {
      if (tokenName === "eth") {
        return Math.round(convert(number, "wei", "gwei"));
      } else if (tokenName === "USDC" || "USDT") {
        return Math.round(number / 1000000);
      } else if (tokenName === "KRAUSE") {
        return Math.round(number / 100000000000000000000000000000000000000000);
      }
    }

    async function convertTokenToStable(timestamp, value) {
      var date = new Date(timestamp * 1000);

      var config = {
        method: "get",
        url:
          "https://data-pricing-api-sandbox.qa.lukka.tech/v1/pricing/sources/3000/prices/pairs/ETH-USDT?from=" +
          date.toISOString() +
          "&limit=5",
        headers: {
          Authorization: `Bearer ${process.env.LUKKATOKEN}`,
        },
      };

      var price;
      await axios(config).then(function (response) {
        price = response.data.prices[0].price;
      });
      var ether = Math.round(convert(value, "wei", "ether"));
      return Math.round(price * ether);
    }

    async function internalTx() {
      await axios(internaltx).then(function (response) {
        const result = response.data.result;
        result.forEach(async (element) => {
          const node = await getNodeType(element.sentFrom);
          const value = await convertValue(element.value, "eth");

          const usdcValue = await convertTokenToStable(
            element.timeStamp,
            element.value
          );

          await pool.query(
            `INSERT INTO TRANSACTION(blockNumber, timeStamp,hash,sentFrom,sentTo,contractAddress,sentValue,tokenName,tokenSymbol,gas,gasUsed,sentType,usdcPrice, nodeId)\
              VALUES (${element.blockNumber},${element.timeStamp},'${element.hash}','${element.from}','${element.to}','${element.contractAddress}','${value}','ETHEREUM','ETH','${element.gas}','${element.gasUsed}','internal','${usdcValue}','${node}')`
          );
        });
      });
    }

    async function tokenTx() {
      await axios(tokentx).then(function (response) {
        const result = response.data.result;
        result.forEach(async (element) => {
          const node = await getNodeType(element.sentFrom);
          const value = await convertValue(element.value, element.tokenSymbol);

          await pool.query(
            `INSERT INTO TRANSACTION(blockNumber, timeStamp,hash,sentFrom,sentTo,contractAddress,sentValue,tokenName,tokenSymbol,gas,gasUsed,sentType,nodeId)\
              VALUES (${element.blockNumber},${element.timeStamp},'${element.hash}','${element.from}','${element.to}','${element.contractAddress}','${value}','${element.tokenName}','${element.tokenSymbol}','${element.gas}','${element.gasUsed}','erc20','${value}','${node}')`
          );
        });
      });
    }

    async function createNode() {
      await pool.query(
        `INSERT INTO NODE(nodeName, url, description, nodePosition, nodeType, nodeLabel)\
            VALUES ('CONTRIBUTORS','https://www.dypeapp.com','DAO Contributors','{ "x": 750, "y": 200 }','transactions','CONTRIBUTORS')`
      );
      await pool.query(
        `INSERT INTO NODE(nodeName, url, description, nodePosition, nodeType, nodeLabel)\
            VALUES ('INVESTORS','https://www.dypeapp.com','DAO Investors','{ "x": -450, "y": 200 }','transactions','INVESTORS')`
      );
      await pool.query(
        `INSERT INTO NODE(nodeName, url, description, nodePosition, nodeType, nodeLabel)\
            VALUES ('TREASUREY','https://www.dypeapp.com','DAO Contract Address','{ "x": 300, "y": 50 }','address','TREASUREY')`
      );

      /// need to put edge query here later
      await pool.query(`INSERT INTO EDGE(edgeSource,edgeTarget) VALUES (2,3)`);

      await pool.query(`INSERT INTO EDGE(edgeSource,edgeTarget) VALUES (3,1)`);
    }

    async function getBalance() {
      var eth;
      var usdc;

      await axios(tokenBalance).then(function (response) {
        usdc = response.data.result;
      });

      await axios(ethBalance).then(function (response) {
        eth = response.data.result;
      });
      const newEth = await convertValue(eth, "eth");
      const newUsdc = await convertValue(usdc, "USDC");

      return [newEth, newUsdc];
    }
    createNode();
    internalTx();
    tokenTx();
    const balance = await getBalance();
    const query = await pool.query(`SELECT * FROM TRANSACTION`);
    const result = query.rows;

    console.log(result);

    res.status(200).json({
      status: "success query",
      data: {
        balance: {
          eth: balance[0],
          usdc: balance[1],
        },
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

exports.getTransaction = async (req, res) => {
  try {
    var tokenBalance = {
      method: "get",
      url: "https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&tag=latest&apikey=YH44N5HPVRBS8ARQEHJVR1MENPMA157HS6&address=0xE4762eAcEbDb7585D32079fdcbA5Bb94eb5d76F2",
      headers: {},
    };

    var ethBalance = {
      method: "get",
      url: "https://api.etherscan.io/api?module=account&action=balance&tag=latest&apikey=YH44N5HPVRBS8ARQEHJVR1MENPMA157HS6&address=0xE4762eAcEbDb7585D32079fdcbA5Bb94eb5d76F2",
      headers: {},
    };
    const query = await pool.query(`SELECT * FROM TRANSACTION`);
    const result = query.rows;

    function convertValue(number, tokenName) {
      if (tokenName === "eth") {
        return Math.round(convert(number, "wei", "gwei"));
      } else if (tokenName === "USDC" || "USDT") {
        return Math.round(number / 1000000);
      } else if (tokenName === "KRAUSE") {
        return Math.round(number / 100000000000000000000000000000000000000000);
      }
    }

    async function getBalance() {
      var eth;
      var usdc;

      await axios(tokenBalance).then(function (response) {
        usdc = response.data.result;
      });

      await axios(ethBalance).then(function (response) {
        eth = response.data.result;
      });
      const newEth = await convertValue(eth, "eth");
      const newUsdc = await convertValue(usdc, "USDC");

      return [newEth, newUsdc];
    }
    const balance = await getBalance();

    res.status(200).json({
      status: "success query",
      data: {
        balance: {
          eth: balance[0],
          usdc: balance[1],
        },
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
