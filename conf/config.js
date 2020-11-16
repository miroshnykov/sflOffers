let config = {};

config.port = 8091

config.env = process.env.NODE_ENV || `production`

config.db = {
    adcenter: {
        host: '',
        user: '',
        port: 3306,
        password: '',
        database: ''
    },
    maxmind: {
        database: ''
    }
}

config.redis = {
    host: '',
    port: 6379
}

config.flowRotator = {
    interval: 1000 * 60 * 15
}

config.influxdb = {
    host: 'https://influx.surge.systems/influxdb',
    project: 'sfl-offers',
    intervalRequest: 10, // batch post to influxdb when queue length gte 100
    intervalSystem: 30000, // 30000 ms = 30 s
    intervalDisk: 60000 // 300000 ms = 5 min
}

module.exports = config;