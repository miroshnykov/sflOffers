let dbMysql = require('./mysqlAdcenterDb').get()

const affiliateWebsites = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT 
                GROUP_CONCAT(DISTINCT w.link 
                    ORDER BY w.link  ASC
                    SEPARATOR ';') as sites,
                    w.affiliate_id as affiliatesId
            FROM
                affiliate_websites w
                WHERE w.status IN ('active','pending')
                GROUP BY w.affiliate_id   
        `)
        await dbMysql.end()
        console.log(`\nget all affiliateWebsites count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

// const affiliateWebsites = async () => {
//
//     try {
//         let result = await dbMysql.query(`
//             SELECT w.id AS id,
//                    w.link AS link,
//                    w.status AS status,
//                    w.affiliate_id AS affiliate_id
//             FROM   affiliate_websites w,
//                    affiliates a
//             WHERE  a.id = w.affiliate_id
//                    AND w.status IN ( 'active', 'pending' )
//                    AND a.status = 'active'
//                    AND a.salesforce_id <> 0
//         `)
//         await dbMysql.end()
//         console.log(`\nget all affiliateWebsites count: ${result.length}`)
//         return result
//     } catch (e) {
//         console.log(e)
//     }
// }

module.exports = {
    affiliateWebsites,
}