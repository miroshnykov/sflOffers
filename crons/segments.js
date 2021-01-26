const {getSegments} = require('../db/segments')
const {getLps} = require('../db/lp')
const {getDataCache, setDataCache} = require('../lib/redis')
const metrics = require('../lib/metrics')
const config = require('plain-config')()

const setSegmentsToRedis = async () => {
    if (config.env === 'development') return
    try {
        console.log(' **** setSegmentsToRedis *** ')
        let segmentsInfo = await getSegments()
        await setDataCache(`segmentsInfo`, segmentsInfo)
        metrics.influxdb(200, `setSegmentsToRedis`)
    } catch (e) {
        console.log('setSegmentsToRedisError:',e)
        metrics.influxdb(500, `setSegmentsToRedisError`)
    }

}

const setLpToRedis = async () => {
    if (config.env === 'development') return
    try {
        console.log(' **** setLpToRedis *** ')
        let lpInfo = await getLps()
        await setDataCache(`lpInfo`, lpInfo)
        metrics.influxdb(200, `setLpToRedis`)
    } catch (e) {
        console.log('setLpToRedisError:',e)
        metrics.influxdb(500, `setLpToRedisError`)
    }

}

module.exports = {
    setSegmentsToRedis,
    setLpToRedis
}

