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

const addCampaign = async (offerId) => {


    let date = new Date()
    let dateAdd = ~~(date.getTime() / 1000)

    let offerName = `autoCreat-${dateAdd}`
    let affId =  142480
    try {
        let result = await dbMysql.query(` 
            INSERT INTO sfl_offer_campaigns (name, sfl_offer_id, affiliate_id, date_added) VALUES (?,?,?,?)                         
        `,[offerName,offerId, affId,dateAdd])
        await dbMysql.end()
        result.id = result.insertId || 0
        console.log(`\ngcreate campaign: ${JSON.stringify(result)} , offerName:${offerName}`)
        return result
    } catch (e) {
        console.log(e)
    }
}



module.exports = {
    campaigns,
    addCampaign
}