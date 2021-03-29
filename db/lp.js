let dbMysql = require('./mysqlAdcenterDb').get()

const getLps = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT  
                l.id AS landingPageId,
                lp.sfl_segment_id       AS segmentId, 
                l.name                  AS name, 
                lp.weight               AS weight,
                l.forced_landing_url    AS forcedLandingUrl,
                l.static_url            AS staticUrl,
                l.product_id            AS productId,
                p.program_id            AS programId
            FROM landing_pages l
            INNER JOIN sfl_segment_landing_page lp ON l.id = lp.landing_pages_id
            INNER JOIN ac_products as p ON p.id = l.product_id
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