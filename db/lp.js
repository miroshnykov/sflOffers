let dbMysql = require('./mysqlAdcenterDb').get()

const getLps = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT  
                lp.sfl_segment_id       AS segmentId, 
                l.name                  AS name, 
                lp.weight               AS weight,
                l.forced_landing_url    AS forcedLandingUrl,
                l.static_url            AS staticUrl,
                l.product_id            AS productId
            FROM landing_pages l, sfl_segment_landing_page lp
            WHERE l.id = lp.landing_pages_id
            ORDER BY 1
        `)
        await dbMysql.end()

        console.log(`\nget all LPs count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    getLps,
}