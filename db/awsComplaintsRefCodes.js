let dbMysql = require('./mysqlAdcenterDb').get()
const config = require('plain-config')()

const awsComplaintsRefCodes = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT id
            FROM ref_codes r
            WHERE r.campaign_id IN
                (SELECT CAST(SUBSTR(d.value, 8, 6) AS SIGNED) campaignId
                 FROM sfl_segment_dimension d
                 WHERE d.sfl_segment_id IN (${config.awsComplaintsSegmentId}))
        `)

        let listIds = result.map(item => item.id)
        await dbMysql.end()
        return listIds
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    awsComplaintsRefCodes,
}