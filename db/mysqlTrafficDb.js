const mysql = require('serverless-mysql')()
let mysqlTrafficDb
const config = require('plain-config')()
module.exports = {

    get: () => {
        if (!mysqlTrafficDb) {
            console.log(`\n\x1b[35mFirst init traffic DB  \x1b[0m`)
            const {host, database, user, password, port} = config.mysqlTraffc
            // console.log(`host:{ ${host} },user:{ ${user} },database:{ ${database} }`)
            let mysqlConfig = {
                host: host,
                database: database,
                user: user,
                password: password,
                port: port
            }
            console.log(mysqlConfig)
            mysql.config(mysqlConfig)
            mysqlTrafficDb = mysql
        }
        // console.log(' << get singleton DB >>')
        return mysqlTrafficDb
    }
}
