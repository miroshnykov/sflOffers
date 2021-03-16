const axios = require('axios');
const config = require('plain-config')()
const metrics = require('../lib/metrics')
const {getDataCache, setDataCache} = require('../lib/redis')

const setRandomSitesToRedis = async () => {
    if (config.env === 'development') return
    try {
        const response = await axios.get(config.hyunaRandomSites)
        let sites = response.data.url_sites.media

        let urls = []

        let {length} = sites
        let total = 0

        for (let i = 0; i < length; i++) {
            if (sites[i].advertising_percentage !== '0') {
                total += ~~sites[i].advertising_percentage
                urls.push({
                    id: ~~sites[i].id,
                    url: sites[i].url,
                    weight: total
                })
            }
        }
        console.log('urls count:',urls.length)
        await setDataCache(`randomSites`, urls)

    } catch (e) {
        console.log('setRandomSitesToRedisError:', e)
        metrics.influxdb(500, `setRandomSitesToRedisError`)
    }

}

module.exports = {
    setRandomSitesToRedis
}
