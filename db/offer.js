let dbMysql = require('./mysqlTrafficDb').get()

const offerInfo = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT o.id                            AS offerId, 
                   o.name                          AS name, 
                   a.id                            AS advertiserId,
                   a.name                          AS advertiserName,    
                   o.advertiser_manager_id         AS advertiserManagerId,              
                   v.id                            AS verticalId,
                   v.name                          AS verticalName,
                   o.currency_id                   AS currencyId,
                   o.status                        AS status, 
                   o.payin                         AS payin, 
                   o.payout                        AS payout, 
                   o.is_cpm_option_enabled         AS isCpmOptionEnabled,
                   o.payout_percent                AS payoutPercent,                   
                   lp.id                           AS landingPageId, 
                   lp.url                          AS landingPageUrl, 
                   o.sfl_offer_geo_id              AS sflOfferGeoId, 
                   g.rules                         AS geoRules, 
                   g.sfl_offer_id                  AS geoOfferId, 
                   o.conversion_type               AS conversionType,
                   lps.rules                       AS customLpRules,
--                   (SELECT c.clicks_day FROM   sfl_offers_cap_current_data c WHERE  c.sfl_offer_id = o.id) AS capDayCurrentData,
                   (SELECT c1.clicks_day FROM   sfl_offers_cap c1 WHERE  c1.sfl_offer_id = o.id AND c1.clicks_day !=0) AS capDaySetup, 
                   (SELECT c.clicks_day FROM   sfl_offers_cap_current_data c WHERE  c.sfl_offer_id = o.id)- 
                   (SELECT c1.clicks_day FROM   sfl_offers_cap c1 WHERE  c1.sfl_offer_id = o.id)                    
                        AS capDayCalculate,

--                   (SELECT c.clicks_week FROM   sfl_offers_cap_current_data c WHERE  c.sfl_offer_id = o.id) AS capWeekCurrentData,
                   (SELECT c1.clicks_week FROM   sfl_offers_cap c1 WHERE  c1.sfl_offer_id = o.id AND c1.clicks_week !=0) AS capWeekSetup, 
                                      (SELECT c.clicks_week FROM   sfl_offers_cap_current_data c WHERE  c.sfl_offer_id = o.id) -
                   (SELECT c1.clicks_week FROM   sfl_offers_cap c1 WHERE  c1.sfl_offer_id = o.id) 
                        AS capWeekCalculate,                    
                   
--                   (SELECT c.clicks_month FROM   sfl_offers_cap_current_data c WHERE  c.sfl_offer_id = o.id) AS capMonthCurrentData,
                   (SELECT c1.clicks_month FROM   sfl_offers_cap c1 WHERE  c1.sfl_offer_id = o.id AND c1.clicks_month !=0) AS capMonthSetup, 
                   (SELECT c.clicks_month FROM   sfl_offers_cap_current_data c WHERE  c.sfl_offer_id = o.id) -                   
                   (SELECT c1.clicks_month FROM   sfl_offers_cap c1 WHERE  c1.sfl_offer_id = o.id) 

                        AS capMonthCalculate,
                                        
                   (SELECT c1.clicks_redirect_offer_id  FROM   sfl_offers_cap c1 WHERE  c1.sfl_offer_id = o.id) AS capRedirect                
            FROM   sfl_offers o 
                   left join sfl_offer_landing_pages lp 
                          ON lp.id = o.sfl_offer_landing_page_id 
                   left join sfl_offer_geo g 
                          ON g.sfl_offer_id = o.id  
                   left join sfl_offer_custom_landing_pages lps
                          ON o.id = lps.sfl_offer_id  
                   left join sfl_advertisers a 
                          ON a.id = o.sfl_advertiser_id  
                   left join sfl_vertical v 
                          ON v.id = o.sfl_vertical_id                                                             
        `)
        await dbMysql.end()
        // console.log(`\nget offerInfo count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

const getOffer = async (id) => {
    try {
        let result = await dbMysql.query(` 
            SELECT o.id   AS offerId, 
                   o.name AS name, 
                   lp.id  AS landingPageId, 
                   lp.url AS landingPageUrl 
            FROM   sfl_offers o 
                   LEFT JOIN sfl_offer_landing_pages lp 
                          ON lp.id = o.sfl_offer_landing_page_id   
            WHERE o.id = ${id}                                                    
        `)
        await dbMysql.end()
        // console.log(`\nget offerInfo count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

const campaigns = async () => {

    try {
        console.time('Campaign')
        let campaignsList = await dbMysql.query(` 
            SELECT c.id                                    AS campaignId, 
                   c.name                                  AS name, 
                   c.sfl_offer_id                          AS offerId, 
                   c.affiliate_id                          AS affiliateId, 
                   c.payout                                AS payout,
                   c.payout_percent                        AS payoutPercent,
                   (SELECT r.rules
                    FROM   sfl_offer_campaign_rules r 
                    WHERE  r.sfl_offer_campaign_id = c.id ORDER BY r.id ASC LIMIT 1) AS targetRules
            FROM   sfl_offer_campaigns c 
            WHERE  c.status = 'active'              
        `)
        await dbMysql.end()

        console.log(`\ncampaigns count: ${campaignsList.length}`)
        if (campaignsList.length === 0) {
            let campaignsListDefault = []

            campaignsListDefault.push({
                campaignId: 1,
                name: 'DEFAULT',
                offerId: 0,
                affiliateId: 0,
                payout: 0,
                payoutPercent: null,
                targetRules: null
            })

            return campaignsListDefault

        }

        // for (const camp of campaignsList) {
        //     let rules = await dbMysql.query(`
        //     SELECT r.rules AS rules,
        //            r.position AS position,
        //            r.sfl_offer_campaign_id AS campaignId
        //     FROM   sfl_offer_campaign_rules r
        //     WHERE  r.status = 'active'
        //            AND r.sfl_offer_campaign_id = ${camp.campaignId}
        //     ORDER BY r.sfl_offer_campaign_id,r.position ASC
        //
        // `)
        //     await dbMysql.end()
        //     camp.targetRules = rules.length !==0 && rules || null
        // }

        console.timeEnd('Campaign')
        return campaignsList
    } catch (e) {
        console.log(e)
    }
}
const insertOffer = async () => {

    try {
        let data = '{"affiliateId":142480,"units":1,"dateAdded":1587579021,"costPerUnit":2,"programId":484,"campaignId":"469846","lid":"01035a23-b36d-4bc6-a1fb-b35e5b102315","cbid":"TST01","lidObject":{"lid":"01035a23-b36d-4bc6-a1fb-b35e5b102315","vid":"","advertiserId":1,"advertiserName":"D-sites","advertiserProductId":650,"advertiserProductName":"OptiAI ActionMedia Test","advertiserProgramId":484,"accountExecutive":"Jeffrey","accountManager":"Timothy Jahn","adDomain":"see.kmisln.com","adPath":"/offer","adserverVersion":"1.4.5","customAudience":"Unknown","device":"Other","domain":"Unknown","hour":18,"countryCode":"CA","passedBack":"Unknown","programId":484,"region":"QC","segmentId":1432,"serverName":"flow-rotator-us-east-1-titan-128","signupFlow":"eone_flow","siteId":0,"spid":"Unknown","state":"Unknown","subCampaign":"Unknown","trafficType":"referred","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36","adUnit":"","adUnitId":0,"affiliateId":142480,"affiliateHash":"546454612","affiliateType":"marketer","browser":"Chrome","browserLanguage":"en-US","browserVersion":"80.0.3987.163","cGroup":"Unknown","cGroupId":0,"cGroupSegment":"Unknown","cGroupSegmentId":0,"campaign":"OptiAITestSales","campaignId":469846,"creative":"Unknown","creativeId":0,"landingPage":"OptiAI ActionMedia Test LP","landingPageId":1712,"landingPageSegmentId":0,"os":"Windows","osVersion":"Windows 64","overriddenProductId":650,"overriddenProgramId":484,"payoutAmount":0,"payoutCpa":0,"payoutUnitsCpa":0,"product":"OptiAI ActionMedia Test","productId":650,"productCategory":"Unknown","ref":5204378,"refererDomain":"Unknown","refererPath":"Unknown","searchEngine":"Unknown","searchKeyword":"Unknown","smartAd":"Unknown","smartAdId":0,"conversionType":"Unknown"},"find":{"segmentPosition":5,"conditionPosition":0,"name":"test mt-347","segmentId":1118,"weight":100,"multiplier":1,"findByConditions":[{"dimension":"cbid","segmentRuleIndex":0,"include":0,"value":"TST01","matchTypeId":0,"dimensionid":6,"maximumRulesIndex":1},{"dimension":"affiliate","segmentRuleIndex":1,"include":0,"value":"142480","matchTypeId":0,"dimensionid":1,"maximumRulesIndex":1}],"existsS2s":true,"existsSpid":false},"noSalesLast30Days":"No","optiai":"processed","multiplier":1,"transferMoneybadger":"Yes"}'
        let result = await dbMysql.query(` 
            INSERT INTO offer( prod_id, rules) VALUES ( 1,'${data}')                         
        `)
        await dbMysql.end()
        // console.log(`\ninsertcount: ${result}`)
        return result
    } catch (e) {
        console.log(e)
    }
}
module.exports = {
    offerInfo,
    getOffer,
    insertOffer,
    campaigns
}