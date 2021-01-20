let dbMysql = require('./mysqlAdcenterDb').get()

const blockedIp = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT ip FROM blocked_ip
        `)

        let listIp = result.map(item => item.ip)
        await dbMysql.end()
        return listIp
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    blockedIp,
}