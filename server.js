const express = require('express');
const config = require('plain-config')()
const http = require('http')
const os = require('os')
const socketIO = require('socket.io')
const app = express()
const server = http.createServer(app);
const io = socketIO(server)
const {getFileSize, formatByteSize} = require('./lib/helper')
const {
    getLocalFiles
} = require('./lib/zipOffer')

const {createRecipeCampaign, createRecipeOffers} = require('./recipe/buildfiles')
const {deleteFile} = require('./lib/zipOffer')
const {encrypt, decrypt} = require('./lib/encrypt')
const {sqsProcess, sqsProcess2} = require('./sqs/sqs')

const metrics = require('./lib/metrics')

const LIMIT_CLIENTS = 60
let clients = []
const ss = require('socket.io-stream')
const fs = require('fs')

app.get('/health', (req, res, next) => {
    res.send('Ok')
})

app.get('/encodeUrl', async (req, res, next) => {
    let response = {}
    // http://localhost:8091/encodeUrl?offerId=1111&campaignId=22222
    // https://sfl-offers.surge.systems/encodeUrl?offerId=2&campaignId=4

    try {
        let query = req.query
        response.campaignId = query.campaignId || 0
        response.offerId = query.offerId || 0

        let obj = {
            offerId: `${query.offerId}`,
            campaignId: `${query.campaignId}`
        }
        let string = JSON.stringify(obj);

        let encryptData = encrypt(string)
        console.log('encryptData:', encryptData)
        response.encryptData = encryptData
        res.send(response)
    } catch (e) {
        console.log(e)
        response.err = 'error encodeUrl' + JSON.stringify(e)
        res.send(response)
    }

})

app.get('/decodeUrl', async (req, res, next) => {
    // http://localhost:8091/decodeUrl?campaign=415655028459403008171b3b20b12df8:fe6b8dd08c47a5d240747ecb28330b37e76ade3b203f8fb6fa166e1b573372348eb61217d27871856bc30306a57c07b2
    //https://sfl-offers.surge.systems/decodeUrl?campaign=0e070dd6f2cbaf1d189fc6e7c828ba87:7abb1fcd4629c1ad26d8dfe48d5728fbb8d04ce42dc716114ebee4844de0b2ce3f53f48c6376a6c60efe8f2b1deab0f4
    let response = {}

    try {
        let query = req.query
        response.campaign = query.campaign || 0

        let decodedString = decrypt(query.campaign)
        response.decodedString = decodedString
        try {
            response.decodedObj = JSON.parse(decodedString)
        } catch (e) {
            response.decodedObj = 'parse error'
        }

        res.send(response)
    } catch (e) {
        response.err = 'error decodeUrl' + JSON.stringify(e)
        res.send(response)
    }
})

app.get('/files', async (req, res, next) => {
    let response = {}

    try {
        let files = await getLocalFiles(config.recipe.folder)

        response.files = files
        response.files1 = files[0]
        response.files2 = files[1]
        let size1 = await getFileSize(files[0])
        let size2 = await getFileSize(files[1])
        response.files1Size = formatByteSize(size1)
        response.files2Size = formatByteSize(size2)
        response.countsOfClients = clients.length || 0

        const computerName = os.hostname()
        // const cpus = os.cpus()
        const freemem = os.freemem()
        const userInfo = os.userInfo()
        const release = os.release()
        response.computerName = computerName || 0
        // response.cpus = cpus || 0
        response.freemem = freemem || 0
        response.userInfo = userInfo || 0
        response.release = release || 0

        res.send(response)
    } catch (e) {
        response.err = 'error files' + JSON.stringify(e)
        res.send(response)
    }
})

app.get('/sqs', async (req, res, next) => {
    let response = {}
    console.log('get sqs ')
    try {
        response = await sqsProcess('debug')
        res.send(response)
    } catch (e) {
        response.err = 'error sqs' + JSON.stringify(e)
        res.send(response)
    }
})

app.get('/forceCreateRecipe', async (req, res, next) => {
    let response = {}
    try {

        let files = await getLocalFiles(config.recipe.folder)
        let file1 = files[0]
        let file2 = files[1]
        if (file1) {
            await deleteFile(file1)
        }
        if (file2) {
            await deleteFile(file2)
        }
        await createRecipeCampaign()
        await createRecipeOffers()

        // let file1Size = await getFileSize(file1)
        // let file2Size = await getFileSize(file2)
        // console.log(file1Size)
        // console.log(file2Size)
        response.files1 = `${files[0]}`
        response.files2 = `${files[1]}`
        response.done = 'recipe created'
        res.send(response)

    } catch (e) {
        response.err = 'error recipe' + JSON.stringify(e)
        res.send(response)
    }
})

io.on('connection', async (socket) => {

    let updRedis = []

    if (!clients.includes(socket.id)) {

        if (clients.length < LIMIT_CLIENTS) {
            clients.push(socket.id)
            // metrics.influxdb(200, `countOfClients-${clients.length}`)
            console.log(`New client just connected: ${socket.id} `)
        } else {
            console.log(`Clients more then ${LIMIT_CLIENTS}`)
        }
    }

    socket.on('sendFileCampaign', async () => {

        try {
            let files = await getLocalFiles(config.recipe.folder)

            // console.log('files:', files)
            let file = files[0]

            if (!file) {
                console.log(`no files in folder:${config.recipe.folder}`)
                return
            }

            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${file} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFileCampaign`)
            });
            ss(socket).emit('sendingCampaigns', stream);
            fs.createReadStream(file).pipe(stream);
        } catch (e) {
            console.log('sendFileCampaignError:', e)
            metrics.influxdb(500, `sendFileCampaignError`)
        }

    })

    socket.on('sendFileOffer', async () => {

        try {
            let files = await getLocalFiles(config.recipe.folder)

            let file = files[1]
            if (!file) {
                console.log(`no files in folder:${config.recipe.folder}`)
                return
            }
            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${file} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFileOffer`)
            });
            ss(socket).emit('sendingOffers', stream);
            fs.createReadStream(file).pipe(stream);

        } catch (e) {
            console.log('sendFileOfferError:', e)
            metrics.influxdb(500, `sendFileOfferError`)
        }

    })

    const sendUpdRedis = async () => {
        try {
            // let messages = await sqsProcess()
            let messages = await sqsProcess2()
            if (!messages) return
            for (const message of messages) {

                // console.log(`send to socket ${socket.id} messageId:${message.id}, action:${message.action}, type:${message.type}`)
                console.log(`send to socket ${socket.id}, message:${JSON.stringify(message)}`)
                metrics.influxdb(200, `sendUpdRecipeOneRecord`)
                io.to(socket.id).emit("updRecipe", message)
            }

        } catch (e) {
            console.log('updRecipeError:', e)
            metrics.influxdb(500, `updRecipeError`)
        }
    }

    updRedis[socket.id] = setInterval(sendUpdRedis, 60000) //1 min

    socket.on('disconnect', () => {
        clients.splice(clients.indexOf(socket.id, 1))
        // metrics.influxdb(200, `countOfClients-${clients.length}`)
        console.log(`disconnect ${socket.id}, Count of client: ${clients.length} `);
        clearInterval(updRedis[socket.id])
        // console.log(`disconnect clients:`, clients);
        // metrics.influxdb(200, `disconnect`)
    })
})

io.on('connect', async (socket) => {
    // console.log(`Connect ${socket.id}, Clients: ${JSON.stringify(clients)} `);
    console.log(`Count of clients: ${clients.length} limit ${LIMIT_CLIENTS}`)
    // metrics.influxdb(200, `clientsCount-${clients.length}`)
})

server.listen({port: config.port}, () => {
    // metrics.influxdb(200, `serveReady`)
    console.log(`\n🚀\x1b[35m Server ready at http://localhost:${config.port} \x1b[0m \n`)
})

setInterval(async () => {
    if (config.env === 'development') return
    try {
        let files = await getLocalFiles(config.recipe.folder)
        let file1 = files[0]
        let file2 = files[1]
        let fileSizeOffer
        let fileSizeCampaign
        if (file2) {
            fileSizeOffer = await getFileSize(file2) || 0
        } else {
            metrics.influxdb(500, `fileSizeOffersNotExists'`)
        }

        if (file1) {
            fileSizeCampaign = await getFileSize(file1) || 0
        } else {
            metrics.influxdb(500, `fileSizeCampaignsNotExists'`)
        }

        // console.log('fileSizeOffer:', fileSizeOffer)
        // console.log('fileSizeCampaign:', fileSizeCampaign)
        if (fileSizeOffer && fileSizeCampaign) {
            metrics.sendMetricsSystem(
                fileSizeOffer.toString(),
                fileSizeCampaign.toString(),
                clients.length || 0
            )
        }

    } catch (e) {
        metrics.influxdb(500, `getFileSizeError'`)
    }

}, 65000)


setInterval(async () => {

    try {
        if (config.env === 'development') return
        console.log('create files campaign and offer')
        let files = await getLocalFiles(config.recipe.folder)
        let file1 = files[0]
        let file2 = files[1]
        if (file1) {
            await deleteFile(file1)
        }
        if (file2) {
            await deleteFile(file2)
        }
        await createRecipeCampaign()
        await createRecipeOffers()

    } catch (e) {
        metrics.influxdb(500, `createRecipeFileError'`)
        console.log('create files campaign and offer error:', e)
    }

}, 60000) //every min

setTimeout(async () => {

    // if (config.env === 'development') return

    console.log('create recipe file first time')
    try {
        let files = await getLocalFiles(config.recipe.folder)
        let file1 = files[0]
        let file2 = files[1]
        if (file1) {
            await deleteFile(file1)
        }
        if (file2) {
            await deleteFile(file2)
        }
        await createRecipeCampaign()
        await createRecipeOffers()
    } catch (e) {
        metrics.influxdb(500, `createRecipeFileFirstTimeError'`)
        console.log('create files campaign and offer first time error:', e)
    }

}, 9000)


const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
