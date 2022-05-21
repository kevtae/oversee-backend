const User = require("../models/User");

const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  passowrd: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// exports.postSignup = async (req, res, next) => {
//   const { username, password, email, bio } = req.body;
//   try {
//     const user = new User({ username, password, email, bio });
//     const result = await user.createUser();
//     res.send(user);
//   } catch (error) {
//     const errorToThrow = new Error();
//     switch (error?.code) {
//       case "23505":
//         errorToThrow.message = "User already exists";
//         errorToThrow.statusCode = 403;
//         break;
//       default:
//         errorToThrow.statusCode = 500;
//     }
//     //pass error to next()
//     next(errorToThrow);
//   }
// };

exports.getUsers = async (req, res) => {
  const result = await pool.query("SELECT * FROM users");

  console.log(result);

  res.status(200).json(result.rows);
};
