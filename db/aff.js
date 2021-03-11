let dbMysql = require('./mysqlAdcenterDb').get()

const affInfo = async () => {

    try {

        console.time('Affiliates')
        let result = await dbMysql.query(` 
            SELECT aff.id                                        AS id, 
                   Concat_ws("", aff.first_name, aff.last_name)  AS affiliateName, 
                   aff.affiliate_type                            AS affiliateType, 
                   aff.status                                    AS status, 
                   aff.account_mgr_id                            AS accountManagerId, 
                   emple.name                                    AS accountManagerName, 
                   aff.employee_id                               AS accountExecutiveId, 
                   empl.name                                     AS accountExecutiveName, 
                   aff.is_traffic_blocked                        AS isTrafficBlocked, 
                   aff.is_lock_payment                           AS isLockPayment 
            FROM   affiliates aff 
                   LEFT JOIN employees emple 
                          ON emple.id = aff.account_mgr_id 
                   LEFT JOIN employees empl 
                          ON empl.id = aff.employee_id 
            WHERE  aff.status IN ('active', 'suspended', 'blacklisted', 'deleted')
        `)
        await dbMysql.end()


        console.log(`*** Affiliates count:${result.length}`)
        console.timeEnd('Affiliates')

        // console.log(`\nget offerInfo count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    affInfo,
}