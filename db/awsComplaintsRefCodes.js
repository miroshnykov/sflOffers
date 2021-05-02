let dbMysql = require('./mysqlAdcenterDb').get()
const config = require('plain-config')()

const awsComplaintsRefCodes = async () => {


// `
// SELECT r.id
// FROM ref_codes r
// WHERE r.campaign_id IN
//     (SELECT CAST(SUBSTR(d.value, POSITION('/' IN VALUE)+1, 6) AS SIGNED) AS campaignId
//      FROM sfl_segment_dimension d
//      WHERE d.sfl_segment_id IN ('46') )
// `
    try {
        let awsCampaignsSegment = await dbMysql.query(` 
            SELECT d.value 
                 FROM sfl_segment_dimension d
                 WHERE d.sfl_segment_id IN (${config.awsComplaintsSegmentId})
        `)

        let campaignsIds = awsCampaignsSegment.map(item => item.value.substr(item.value.indexOf('/') + 1, item.value.length))

        let strIn = ``
        for (const campaign of campaignsIds) {
            strIn += `${campaign},`
        }
        let strIn_ = strIn.slice(0, -1)
        console.log(strIn)

        let refCodesAwsBlock = await dbMysql.query(` 
            SELECT id FROM ref_codes r WHERE r.campaign_id IN (${strIn_})
        `)
        let listRedcodes = refCodesAwsBlock.map(item => item.id)
        await dbMysql.end()
        return listRedcodes
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    awsComplaintsRefCodes,
}