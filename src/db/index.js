const { Client } = require('pg')

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'hapi-postgres',
  password: 'root',
  port: 5432
})

// // const query = `
// // INSERT INTO users (name, email)
// // VALUES ( 'john', 'johndoe@gmail.com')
// // `
// client.query('SELECT * FROM users', (err, res) => {
//   if (err) {
//     console.error('err ' + err)
//     return
//   }
//   console.log(res.rows)
//   client.end()
// })

module.exports = client
