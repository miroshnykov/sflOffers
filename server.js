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

const {
    createRecipeCampaign,
    createRecipeOffers,
    createRecipeAffiliates,
    createRecipeAffiliateWebsite,
    // createRecipeSegments
} = require('./recipe/buildfiles')
const {deleteFile} = require('./lib/zipOffer')
const {encrypt, decrypt} = require('./lib/encrypt')
const {sqsProcess} = require('./sqs/sqs')

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

// https://sfl-offers-stage1.surge.systems/forceCreateRecipe
// https://sfl-offers.surge.systems/forceCreateRecipe

app.get('/forceCreateRecipe', async (req, res, next) => {
    let response = {}
    try {

        let files = await getLocalFiles(config.recipe.folder)
        console.log('forceCreateRecipeFileDebug:', files)
        console.log('forceCreateRecipeRecipe:', config.recipe)
        response.files = files
        response.configRecipe = config.recipe

        if (files.length === 0){
            response.noFiles = `no files in folder:${JSON.stringify(config.recipe)} created `
            await createRecipeCampaign()
            await createRecipeOffers()
            await createRecipeAffiliates()
            await createRecipeAffiliateWebsite()

            await waitFor(5000)

            let files = await getLocalFiles(config.recipe.folder)
            response.filesJustCreated = files

            let size1AffWe = await getFileSize(files[0])// affWebsite
            let size2Aff = await getFileSize(files[1]) // aff
            let size3Camp = await getFileSize(files[2]) //campa
            let size4Offer = await getFileSize(files[3]) // offer
            // response.files1Size = formatByteSize(size1AffWe)
            // response.files2Size = formatByteSize(size2Aff)
            // response.files3Size = formatByteSize(size3Camp)
            // response.files4Size = formatByteSize(size4Offer)
            response.files1SizeAffWeb = size1AffWe
            response.files2SizeAff = size2Aff
            response.files3SizeCampaigns = size3Camp
            response.files4SizeOffers = size4Offer

            res.send(response)
            return
        }
        let file1 = files[0]
        let file2 = files[1]
        let file3 = files[2]
        let file4 = files[3]
        if (file1) {
            await deleteFile(file1)
            response.file1Deleted = file1
        }
        if (file2) {
            await deleteFile(file2)
            response.file2Deleted = file2
        }
        if (file3) {
            response.file3Deleted = file3
            await deleteFile(file3)
        }
        if (file4) {
            response.file4Deleted = file4
            await deleteFile(file4)
        }
        await createRecipeCampaign()
        await createRecipeOffers()
        await createRecipeAffiliates()
        await createRecipeAffiliateWebsite()
        // await createRecipeSegments()


        if (file1 && file2 && file3 && file4) {
            response.files1 = `${files[0]}`
            response.files2 = `${files[1]}`
            response.files3 = `${files[2]}`
            response.files4 = `${files[3]}`
            response.done = 'recipe created'
        } else {
            response.done = 'files does not exists. but Recipe created first time '
        }

        res.send(response)

    } catch (e) {
        response.err = 'error recipe' + JSON.stringify(e)
        res.send(response)
    }
})


// https://sfl-offers-stage1.surge.systems/files
// https://sfl-offers.surge.systems/files

app.get('/files', async (req, res, next) => {
    let response = {}

    try {
        let files = await getLocalFiles(config.recipe.folder)


        if (files.length === 0){
            response.noFiles = `no files in folder:${JSON.stringify(config.recipe)}`
            res.send(response)
            return
        }

        response.files = files
        response.files1 = files[0]
        response.files2 = files[1]
        response.files3 = files[2]
        response.files4 = files[3]
        let size1AffWe = await getFileSize(files[0])// affWebsite
        let size2Aff = await getFileSize(files[1]) // aff
        let size3Camp = await getFileSize(files[2]) //campa
        let size4Offer = await getFileSize(files[3]) // offer
        // response.files1Size = formatByteSize(size1AffWe)
        // response.files2Size = formatByteSize(size2Aff)
        // response.files3Size = formatByteSize(size3Camp)
        // response.files4Size = formatByteSize(size4Offer)
        response.files1SizeAffWeb = size1AffWe
        response.files2SizeAff = size2Aff
        response.files3SizeCampaigns = size3Camp
        response.files4SizeOffers = size4Offer
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

const {offerInfo, getOffer} = require('./db/offer')

app.get('/testOffer', async (req, res, next) => {
    let response = {}
    try {
        let offerData = await offerInfo()
        let offerFormat = []
        for (const offer of offerData) {
            console.log(offer.offerId)
            const {capRedirectOfferDay, capRedirectOfferWeek, capRedirectOfferMonth} = offer
            if (
                capRedirectOfferDay
                || capRedirectOfferWeek
                || capRedirectOfferMonth) {
                let overrideOfferId = capRedirectOfferDay || capRedirectOfferWeek || capRedirectOfferMonth

                console.log('overrideOfferId:', overrideOfferId)
                let offerInfo = await getOffer(overrideOfferId)
                console.log(offerInfo)
                offer.landingPageIdOrigin = offer.landingPageId
                offer.landingPageUrlOrigin = offer.landingPageUrl
                offer.landingPageId = offerInfo[0].landingPageId
                offer.landingPageUrl = offerInfo[0].landingPageUrl
                offer.capOverrideOfferId = offerInfo[0].offerId

            }

            offerFormat.push(offer)
        }
        response.offerFormat = offerFormat
        res.send(response)
    } catch (e) {
        response.err = 'error sqs' + JSON.stringify(e)
        console.log(e)
        res.send(response)
    }
})


const {affiliateWebsites} = require('./db/affiliateWebsites')
app.get('/testAffiliateWebsites', async (req, res, next) => {
    let response = {}
    try {
        let affiliateWebsitesData = await affiliateWebsites()
        let affWebsitesFormat = []
        for (const aff of affiliateWebsitesData) {
            if (aff.sites) {
                let sites = aff.sites.split(';')

                let obj = {}
                obj.sites = []
                sites.forEach(url => {
                    obj.sites.push({url: url})

                })
                affWebsitesFormat.push({affiliateId: aff.affiliatesId, sites: JSON.stringify(obj)})
            }


        }
        response.affiliateWebsitesData = affWebsitesFormat
        res.send(response)
    } catch (e) {
        response.err = 'error testAffiliateWebsites' + JSON.stringify(e)
        console.log(e)
        res.send(response)
    }
})

app.get('/segements', async (req, res, next) => {
    const {getSegments} = require('./db/segments')
    let response = {}
    try {
        let segments  = await getSegments()

        response.segments = segments
        res.send(response)
    } catch (e) {
        response.err = 'error segements' + JSON.stringify(e)
        console.log(e)
        res.send(response)
    }
})


io.on('connection', async (socket) => {

    let updRedis = []

    if (!clients.includes(socket.id)) {

        if (clients.length < LIMIT_CLIENTS) {
            clients.push(socket.id)
            metrics.sendMetricsCountOfClients(clients.length)
            // metrics.influxdb(200, `countOfClients-${clients.length}`)
            console.log(`New client just connected: ${socket.id} clientCount:${clients.length} `)
        } else {
            console.log(`Clients more then ${LIMIT_CLIENTS}`)
            metrics.influxdb(500, `clientsMoreThen60Error`)
        }
    }

    socket.on('sendFileAffiliateWebsites', async () => {

        try {
            let files = await getLocalFiles(config.recipe.folder)

            console.log('FILE:',files)
            let file = files[0]
            if (!file) {
                console.log(`no files in folder:${config.recipe.folder}`)
                return
            }
            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${file} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFileAffiliateWebsites`)
            });
            ss(socket).emit('sendingAffiliateWebsites', stream);
            fs.createReadStream(file).pipe(stream);

        } catch (e) {
            console.log('sendFileAffiliatesError:', e)
            metrics.influxdb(500, `sendFileAffiliatesError`)
        }

    })

    socket.on('sendFileAffiliates', async () => {

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
                metrics.influxdb(200, `sendFileAffiliates`)
            });
            ss(socket).emit('sendingAffiliates', stream);
            fs.createReadStream(file).pipe(stream);

        } catch (e) {
            console.log('sendFileAffiliatesError:', e)
            metrics.influxdb(500, `sendFileAffiliatesError`)
        }

    })



    socket.on('sendFileCampaign', async () => {

        try {
            metrics.sendMetricsCountOfClients(clients.length)
            let files = await getLocalFiles(config.recipe.folder)

            // console.log('files:', files)
            let file = files[2]

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


            let file = files[3]
            console.log('sendFileOffer file:', file)
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
            let messages = await sqsProcess()
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
        metrics.sendMetricsCountOfClients(clients.length)

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
    // console.log(JSON.stringify(config))
    console.log(`\n🚀\x1b[35m Server ready at http://localhost:${config.port}, env:${config.env} \x1b[0m \n`)
})

setInterval(async () => {
    if (config.env === 'development') return
    try {
        let files = await getLocalFiles(config.recipe.folder)
        const computerName = os.hostname()
        console.log(`getLocalFilesDebug for computerName:${computerName}, files:${JSON.stringify(files)}`)
        if (files.length === 0){
            console.log(`I am not able to get the Size of recipe,  No files in folder ${config.recipe.folder}`)
            metrics.influxdb(500, `fileSizeAllRecipeNotExists`)
            return
        }
        let file1 = files[0] // aff website
        let file2 = files[1] //aff
        let file3 = files[2]//camp
        let file4 = files[3]//offer
        let fileSizeOffer
        let fileSizeCampaign
        let fileSizeAffiliates
        let fileSizeAffiliateWebsites


        if (file1) {
            fileSizeAffiliateWebsites = await getFileSize(file1) || 0
        } else {
            metrics.influxdb(500, `fileSizeAffilaiteWebsitesNotExists`)
        }

        if (file2) {
            fileSizeAffiliates = await getFileSize(file2) || 0
        } else {
            metrics.influxdb(500, `fileSizeAffilaitesNotExists`)
        }


        if (file3) {
            fileSizeCampaign = await getFileSize(file3) || 0
        } else {
            metrics.influxdb(500, `fileSizeCampaignsNotExists`)
        }


        if (file4) {
            fileSizeOffer = await getFileSize(file4) || 0
        } else {
            metrics.influxdb(500, `fileSizeOffersNotExists`)
        }



        console.log(`File size for computerName:${computerName}  fileSizeAffiliates:${fileSizeAffiliates}, fileSizeCampaign:${fileSizeCampaign}, fileSizeOffer:${fileSizeOffer}, fileSizeAffiliateWebsites:${fileSizeAffiliateWebsites}`)

        // console.log('fileSizeOffer:', fileSizeOffer)
        // console.log('fileSizeCampaign:', fileSizeCampaign)
        metrics.sendMetricsSystem(
            fileSizeOffer && fileSizeOffer.toString() || 0,
            fileSizeCampaign && fileSizeCampaign.toString() || 0,
            fileSizeAffiliates && fileSizeAffiliates.toString() || 0,
            fileSizeAffiliateWebsites && fileSizeAffiliateWebsites.toString() || 0,
            clients.length || 0
        )

    } catch (e) {
        console.log('getFilesSizeError:', e)
        metrics.influxdb(500, `getFilesSizeError'`)
    }

}, 65000)


setInterval(async () => {

    try {
        if (config.env === 'development') return

        const computerName = os.hostname()
        let files = await getLocalFiles(config.recipe.folder)
        console.log(`\nCreate files campaign and offer, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)
        if (files.length === 0){
            console.log(`no files in folder:${JSON.stringify(config.recipe)} created `)
            await createRecipeCampaign()
            await createRecipeOffers()
            await createRecipeAffiliates()
            await createRecipeAffiliateWebsite()

            return
        }

        let file1 = files[0]
        let file2 = files[1]
        let file3 = files[2]
        let file4 = files[3]
        if (file1) {
            await deleteFile(file1)
        }
        if (file2) {
            await deleteFile(file2)
        }
        if (file3) {
            await deleteFile(file3)
        }

        if (file4) {
            await deleteFile(file4)
        }
        await createRecipeCampaign()
        await createRecipeOffers()
        await createRecipeAffiliates()
        await createRecipeAffiliateWebsite()

    } catch (e) {
        metrics.influxdb(500, `createRecipeFileError'`)
        console.log('create files campaign and offer error:', e)
    }

}, 300000) // 300000 every 5 min

setTimeout(async () => {

    if (config.env === 'development') return

    console.log('Create recipe file first time')
    try {
        let files = await getLocalFiles(config.recipe.folder)
        if (files.length === 0){
            console.log(`no files in folder:${JSON.stringify(config.recipe)} created `)
            await createRecipeCampaign()
            await createRecipeOffers()
            await createRecipeAffiliates()
            await createRecipeAffiliateWebsite()

            return
        }

        let file1 = files[0]
        let file2 = files[1]
        let file3 = files[2]
        let file4 = files[3]
        if (file1) {
            await deleteFile(file1)
        }
        if (file2) {
            await deleteFile(file2)
        }
        if (file3) {
            await deleteFile(file3)
        }

        if (file4) {
            await deleteFile(file4)
        }
        await createRecipeCampaign()
        await createRecipeOffers()
        await createRecipeAffiliates()
        await createRecipeAffiliateWebsite()
    } catch (e) {
        metrics.influxdb(500, `createRecipeFileFirstTimeError'`)
        console.log('create files campaign and offer first time error:', e)
    }

}, 9000)


const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
