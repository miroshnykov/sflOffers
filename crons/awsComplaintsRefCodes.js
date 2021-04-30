const config = require('plain-config')()
const metrics = require('../lib/metrics')
const {setDataCache} = require('../lib/redis')
const {awsComplaintsRefCodes} = require('../db/awsComplaintsRefCodes')

const setAwsComplaintsRefCodesToRedis = async () => {

    try {
    let awsComplaintsRefCodesInfo = await awsComplaintsRefCodes()
        console.log(' *** SetAwsComplaintsRefCodesToRedis:', awsComplaintsRefCodesInfo)
    await setDataCache(`awsComplaintsRefCodes`, awsComplaintsRefCodesInfo)

    } catch (e) {
        console.log('setAwsComplaintsRefCodesToRedisError:', e)
        metrics.influxdb(500, `setAwsComplaintsRefCodesToRedisError`)
    }

}

module.exports = {
    setAwsComplaintsRefCodesToRedis
}
