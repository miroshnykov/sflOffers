let dbMysql = require('./mysqlAdcenterDb').get()

const getAdvertiserTargeting = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT c.name                       AS name,
                   t.id as targetingId, 
                   c.landing_page, 
                   t.sfl_advertiser_campaign_id AS campaignId, 
                   t.geo                        AS geo, 
                   t.platform_android           AS platformAndroid, 
                   t.platform_ios               AS platformIos, 
                   t.platform_windows           AS platformWindows, 
                   t.source_type_sweepstakes    AS sourceTypeSweepstakes, 
                   t.source_type_vod            AS sourceTypeVod, 
                   t.cpc AS targetingCpc, 
                   c.cpc AS campaignCpc,
                   t.filter_type_id             AS filterTypeId, 
                   t.position, 
                   c.budget_total AS budgetTotal,
                   c.budget_daily AS budgetDaily,
                   c.no_limit AS noLimit,
                   t.date_added                 AS dateAdded,
                   IFNULL((SELECT t.count_click  
                    FROM   sfl_traffic_history t 
                    WHERE  t.sfl_advertiser_campaign_id = c.id 
                           AND t.date_by_days = Curdate()),0 ) AS countClickDaily, 
                   IFNULL((SELECT Sum(t.count_click)  
                    FROM   sfl_traffic_history t 
                    WHERE  t.sfl_advertiser_campaign_id = c.id 
                    GROUP  BY t.sfl_advertiser_campaign_id),0) AS countClickTotal,  
                   IFNULL((SELECT t.sum_spent 
                    FROM   sfl_traffic_history t 
                    WHERE  t.sfl_advertiser_campaign_id = c.id 
                           AND t.date_by_days = Curdate()),0 ) AS spentDaily, 
                   IFNULL((SELECT Sum(t.sum_spent)  
                    FROM   sfl_traffic_history t 
                    WHERE  t.sfl_advertiser_campaign_id = c.id 
                    GROUP  BY t.sfl_advertiser_campaign_id),0) AS spentTotal  
            FROM   sfl_advertiser_targeting t, 
                   sfl_advertiser_campaigns c 
            WHERE  c.id = t.sfl_advertiser_campaign_id   -- and c.id = 41 
                   AND t.soft_delete = false
                   AND c.soft_delete = false
                   AND c.status = 'active'
            ORDER BY t.id DESC
        `)
        await dbMysql.end()

        // console.log(`\nget all advertiser targeting count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
        return []
    }
}

const getPublisherTargeting = async () => {

    try {
        let result = await dbMysql.query(` 
                SELECT c.name                       AS name, 
                       c.id as campanyId,
                       t.id as targetingId,
                       t.geo                        AS geo, 
                       t.platform_android           AS platformAndroid, 
                       t.platform_ios               AS platformIos, 
                       t.platform_windows           AS platformWindows, 
                       t.source_type_sweepstakes    AS sourceTypeSweepstakes, 
                       t.source_type_vod            AS sourceTypeVod, 
                       t.cpc, 
                       t.filter_type_id             AS filterTypeId, 
                       t.position, 
                       t.date_added                 AS dateAdded 
                FROM   sfl_publisher_targeting t, 
                       sfl_publisher_campaigns c 
                WHERE  c.id = t.sfl_publisher_campaign_id
                       AND c.status = 'active' AND t.soft_delete = false 
                ORDER BY t.id DESC
        `)
        await dbMysql.end()

        // console.log(`\nget all PublisherTargeting count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
        return []
    }
}


module.exports = {
    getPublisherTargeting,
    getAdvertiserTargeting
}

