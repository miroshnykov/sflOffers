let dbMysql = require('./mysqlAdcenterDb').get()

const campaigns = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT c.id           AS id, 
                   c.NAME         AS name
            FROM   campaigns c, 
                   affiliates a 
            WHERE  a.id = c.affiliate_id 
                   AND c.status = 'active' 
                   AND a.status = 'active' 
                   AND a.salesforce_id <> 0  
            
        `)
        await dbMysql.end()
        console.log(`\nget all result count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    campaigns,
}