const {getSegments} = require('../db/segments')
const {getLps} = require('../db/lp')
const {getDataCache, setDataCache} = require('../lib/redis')
const {memorySizeOfBite} = require('../lib/helper')
const metrics = require('../lib/metrics')
const config = require('plain-config')()

const setSegmentsToRedis = async () => {
    if (config.env === 'development') return
    try {
        console.log(' **** setSegmentsToRedis *** ')
        let segmentsInfo = await getSegments()

        const uniqueSegments = []
        const map = new Map()
        for (const item of segmentsInfo) {
            if (!map.has(item.segmentId)) {
                map.set(item.segmentId, true)
                uniqueSegments.push(item)
            }
        }

        let conditionBySegment = []
        uniqueSegments.forEach(uniqueSegment => {
            conditionBySegment = segmentsInfo.filter(({segmentId}) => (Number(segmentId) === uniqueSegment.segmentId))
            conditionBySegment.forEach(condition => {
                const getMaxSegmentRuleIndex = (arr) => {
                    let loadMax = null
                    for (const item of arr) {
                        if (!loadMax || item.segmentRuleIndex > loadMax.segmentRuleIndex) {
                            loadMax = item;
                        }
                    }
                    return loadMax.segmentRuleIndex
                }

                condition.maximumRulesIndex = getMaxSegmentRuleIndex(conditionBySegment)
                let orAnd = conditionBySegment.filter(item => (item.segmentRuleIndex === condition.segmentRuleIndex))
                condition.orEnd = orAnd.length > 1 && 'OR' || 'AND'

            })
        })

        let memorySizeOfSegment = memorySizeOfBite(segmentsInfo)
        metrics.sendSizeOfSegments(memorySizeOfSegment)
        await setDataCache(`segmentsInfo`, segmentsInfo)
        metrics.influxdb(200, `setSegmentsToRedis`)
    } catch (e) {
        console.log('setSegmentsToRedisError:', e)
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
        console.log('setLpToRedisError:', e)
        metrics.influxdb(500, `setLpToRedisError`)
    }

}

module.exports = {
    setSegmentsToRedis,
    setLpToRedis
}

