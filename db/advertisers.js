let dbMysql = require('./mysqlAdcenterDb').get()

const getAdvertisersProducts = async () => {

    try {
        console.time('getAdvertisersProducts')
        let result = await dbMysql.query(` 
            SELECT acp.id AS advertiserProductId,
                   acp.name AS advertiserProductName,
                   acp.advertiser_id AS advertiserId,
                   advs.name AS advertiserName,
                   acp.program_id AS advertiserProgramId,
                   pgm.name AS programName,
                   forward_offer_parameters AS forwardOfferParameters,
                   tracking_code AS trackingCode
            FROM ac_products AS acp
            INNER JOIN advertisers AS advs ON acp.advertiser_id = advs.id
            LEFT JOIN programs pgm ON pgm.id = acp.program_id
            WHERE acp.status = 'active'
        `)
        await dbMysql.end()

        console.log(` *** AdvertisersProducts count:${result.length}`)
        console.timeEnd('getAdvertisersProducts')
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    getAdvertisersProducts
}