const express = require('express');
const config = require('plain-config')()
const http = require('http')
const socketIO = require('socket.io')
const app = express()
const server = http.createServer(app);
const io = socketIO(server)
const {getDataCache, setDataCache} = require('./lib/redis')
const {memorySizeOf, memorySizeOfBite} = require('./lib/helper')
const zlib = require('zlib')
const {
    getLocalFiles
} = require('./lib/zipOffer')

const {createRecipeCampaign, createRecipeOffers} = require('./recipe/buildfiles')
const {deleteJsonFile} = require('./lib/zipOffer')
const {encrypt, decrypt} = require('./lib/encrypt')
const {receiveMessage} = require('./sqs/sqs')

const metrics = require('./lib/metrics')


app.get('/health', (req, res, next) => {
    res.send('Ok')
})


app.get('/encodeUrl', async (req, res, next) => {
    let response = {}
    // http://localhost:8091/encodeUrl?offerId=1111&campaignId=22222

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

        response.files1 = files[0]
        response.files2 = files[1]
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

        let dataQueue = await receiveMessage()
        if (!dataQueue.Messages) {
            console.log(`no records from queue ${queueUrl}`)
            return
        }
        let messageArr = []
        for (const message of dataQueue.Messages) {
            let messageBody = JSON.parse(message.Body)
            messageArr.push(JSON.parse(message.Body))
            console.log(' \n  messageBody:', messageBody)
        }
        response.dataQueue = dataQueue
        response.messageArr = messageArr
        res.send(response)
    } catch (e) {
        response.err = 'error sqs' + JSON.stringify(e)
        res.send(response)
    }


})

const getFileSize = (filename) => {
    let stats = fs.statSync(filename);
    let fileSizeInBytes = stats.size;
    let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
    // console.log('fileSizeInBytes:',fileSizeInMegabytes,'MB')
    return `${fileSizeInMegabytes} MB`;
}

app.get('/forceCreateRecipe', async (req, res, next) => {
    let response = {}
    try {

        let files = await getLocalFiles(config.recipe.folder)
        let file1 = files[0]
        let file2 = files[1]
        if (file1) {
            await deleteJsonFile(file1)
        }
        if (file2) {
            await deleteJsonFile(file2)
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

const LIMIT_CLIENTS = 60
let clients = []
const ss = require('socket.io-stream')
const fs = require('fs')

// const filename = '/tmp/recipe/campaign-2020111620510215308.json.gz';

io.on('connection', async (socket) => {

    if (!clients.includes(socket.id)) {

        if (clients.length < LIMIT_CLIENTS) {
            clients.push(socket.id)
            console.log(`New client just connected: ${socket.id} `)
        } else {
            console.log(`Clients more then ${LIMIT_CLIENTS}`)
        }


    }

    socket.on('sendFileCampaign', async () => {

        let files = await getLocalFiles(config.recipe.folder)

        // console.log('files:', files)
        let file = files[0]

        if (!file) {
            console.log(`no files in folder:${config.recipe.folder}`)
            return
        }

        let stream = ss.createStream();
        stream.on('end', () => {
            console.log(`file:${file} sent size:${getFileSize(file)} to soket ID:${socket.id}`);
        });
        ss(socket).emit('sendingCampaigns', stream);
        fs.createReadStream(file).pipe(stream);
    });

    socket.on('sendFileOffer', async () => {

        let files = await getLocalFiles(config.recipe.folder)

        let file = files[1]
        if (!file) {
            console.log(`no files in folder:${config.recipe.folder}`)
            return
        }
        let stream = ss.createStream();
        stream.on('end', () => {
            console.log(`file:${file} sent size:${getFileSize(file)} to soket ID:${socket.id}`);
        });
        ss(socket).emit('sendingOffers', stream);
        fs.createReadStream(file).pipe(stream);
    });

    //
    socket.on('disconnect', () => {
        clients.splice(clients.indexOf(socket.id, 1))
        console.log(`disconnect ${socket.id}, Count of client: ${clients.length} `);
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


let once = false
setInterval(async () => {

    return
    if (!once) {
        console.log('create files campaign and offer')
        let files = await getLocalFiles(config.recipe.folder)
        let file1 = files[0]
        let file2 = files[1]
        if (file1) {
            await deleteJsonFile(file1)
        }
        if (file2) {
            await deleteJsonFile(file2)
        }
        await createRecipeCampaign()
        await createRecipeOffers()
    }
    once = true
}, 8000)

// sfl-core-engine part
setTimeout(async () => {

    console.log('read GZIP file')

    return
    //  **************************** READ GZIP FILE
    // let gunzip = zlib.createGunzip();
    // let rstream = fs.createReadStream('/home/miroshnykov/Downloads/offer/2020-11-13/04/20201113043114646788.json.gz');
    // let rstream = fs.createReadStream('/home/miroshnykov/Downloads/offer/2020-11-13/16/20201113160541880104.json.gz'); // 500 000

    let gunzip = zlib.createGunzip();
    console.time('JSONStreamInsert')
    let file = '/home/miroshnykov/Downloads/offer/2020-11-13/17/20201113173728597521.json.gz' // 500 000 rec 3500 characters
    // let file = '/home/miroshnykov/Downloads/offer/2020-11-13/17/20201113173728597521.json' // 500 000 rec 3500 characters
    // let file = '/home/miroshnykov/Downloads/offer/2020-11-13/04/20201113043114646788.json' // 10 rec
    // let file = '/home/miroshnykov/Downloads/offer/2020-11-13/04/20201113043114646788.json.gz' // 10 rec
    // let stream = fs.createReadStream(file, {encoding: 'utf8'})
    let stream = fs.createReadStream(file)
    let JSONStream = require("JSONStream")
    let jsonStream = JSONStream.parse('*')
    stream.pipe(gunzip).pipe(jsonStream)
    // uncompresses
    let i = 0
    jsonStream.on('data', async (item) => {
        // process data
        // if(i < 10){
        let num = Math.floor(Math.random() * 1000000000);
        await setDataCache(`offer-${item.id}${num}`, item.rules)
        // }
        // i++
    })

    jsonStream.on('end', () => {
        console.log('done')
        console.timeEnd('JSONStreamInsert')
    })


}, 3000000)


const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
