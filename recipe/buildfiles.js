let chalk = require("chalk")
let JSONStream = require("JSONStream")
let fileSystem = require("fs")
let path = require('path')
const os = require('os')
const config = require('plain-config')()

const computerName = os.hostname()

const {campaigns, getOffer, offerInfo} = require('../db/offer')
const {affiliateWebsites} = require('../db/affiliateWebsites')
const {affInfo} = require('../db/aff')
// const {getSegments} = require('../db/segments')
const {
    generateFilePath,
    createRecursiveFolder,
    compressFileZlibSfl,
    deleteFile
} = require('../lib/zipOffer')

const {memorySizeOf, memorySizeOfBite} = require('../lib/helper')

const metrics = require('../lib/metrics')

const createRecipeCampaign = async () => {
    // console.log('createfile Campaign')
    // console.time('createfileCampaign')
    try {
        let campaignData = await campaigns()

        console.log(`get campaign count:${campaignData.length}, from computer:${computerName} `)
        if (campaignData.length === 0) {
            console.log(`No campaigns data`)
            return
        }
        let filePath = config.recipe.folder + await generateFilePath('campaign')
        // console.log('filePath', filePath)
        let fileFolder = path.dirname(filePath);
        // console.log('fileFolder:', fileFolder)
        await createRecursiveFolder(fileFolder)
        // console.log('sfl_filePath:', filePath)

        // let sizeCampaign = await memorySizeOf(campaignData)

        // console.log('res.length', offerData.length)
        // console.log('sizeOfDbMaps:', sizeOfDbMaps)

        let transformStream = JSONStream.stringify();
        let outputStream = fileSystem.createWriteStream(filePath);

        transformStream.pipe(outputStream);

        campaignData.forEach(transformStream.write);

        transformStream.end();

        outputStream.on(
            "finish",
            async function handleFinish() {

                // console.log(chalk.green("JSONStream serialization complete!"))
                await compressFileZlibSfl(filePath)
                await deleteFile(filePath)
                // console.timeEnd('createfileCampaign')
                // metrics.influxdb(200, `sizeOfCampaigns-${sizeCampaign}`)
                console.log(`File Campaigns created path:${filePath}`)

            }
        );
    } catch (e) {
        metrics.influxdb(500, `createRecipeCampaignError-${computerName}`)
        console.log('createRecipeCampaignError:', e)
    }


}


const createRecipeAffiliateWebsite = async () => {
    try {
        let affiliateWebsiteData = await affiliateWebsites()

        let affiliateWebsiteDataFormat = []
        for (const aff of affiliateWebsiteData) {
            if (aff.sites) {
                let sites = aff.sites.split(';')

                let obj = {}
                obj.sites = []
                sites.forEach(url => {
                    obj.sites.push({url: url})

                })
                affiliateWebsiteDataFormat.push({affiliateId: aff.affiliatesId, sites: JSON.stringify(obj)})
            }

        }

        if (affiliateWebsiteDataFormat.length === 0) {
            console.log(`No affilaiteWebsites data`)
            return
        }
        let filePath = config.recipe.folder + await generateFilePath('affiliateWebsites')
        let fileFolder = path.dirname(filePath);
        await createRecursiveFolder(fileFolder)

        let transformStream = JSONStream.stringify();
        let outputStream = fileSystem.createWriteStream(filePath);

        transformStream.pipe(outputStream);

        affiliateWebsiteDataFormat.forEach(transformStream.write);

        transformStream.end();

        outputStream.on(
            "finish",
            async function handleFinish() {
                await compressFileZlibSfl(filePath)
                await deleteFile(filePath)
                console.log(`File AffiliateWebsites created path:${filePath}`)

            }
        );
    } catch (e) {
        metrics.influxdb(500, `createRecipeAffiliateWebsitesError-${computerName}`)
        console.log('createRecipeAffiliateWebsitesError:', e)
    }


}

const createRecipeOffers = async () => {
    // console.log('createfile with offers')
    // console.time('createFileOffers')
    // ************** CREATE ZIP FILE
    try {
        let offerData = await offerInfo()

        if (offerData.length === 0) {
            console.log(`No offers data`)
            return
        }

        let offerFormat = []
        for (const offer of offerData) {
            const {capDaySetup, capWeekSetup, capMonthSetup, capDayCalculate, capWeekCalculate, capMonthCalculate, capRedirect} = offer
            if (
                capDaySetup
                || capWeekSetup
                || capMonthSetup) {

                if (capDayCalculate < 0 || capWeekCalculate < 0 || capMonthCalculate < 0) {
                    let offerInfo = await getOffer(capRedirect)
                    console.log(`\n *** Cap by offerId { ${offer.offerId} } offerInfo:${JSON.stringify(offer)}`)
                    offer.landingPageIdOrigin = offer.landingPageId
                    offer.landingPageUrlOrigin = offer.landingPageUrl
                    offer.landingPageId = offerInfo && offerInfo[0].landingPageId || 0
                    offer.landingPageUrl = offerInfo && offerInfo[0].landingPageUrl || 0
                    offer.capOverrideOfferId = offerInfo && offerInfo[0].offerId || 0
                }

            }
            offerFormat.push(offer)


        }

        const computerName = os.hostname()
        console.log(`get offer count:${offerData.length}, from computer:${computerName} `)


        let filePath = config.recipe.folder + await generateFilePath('offer')
        // console.log('filePath', filePath)
        let fileFolder = path.dirname(filePath);
        // console.log('fileFolder:', fileFolder)
        await createRecursiveFolder(fileFolder)
        // console.log('sfl_filePath:', filePath)

        // let sizeOfOffers = await memorySizeOf(offerData)

        // console.log('res.length', offerData.length)
        // console.log('sizeOfDbMaps:', sizeOfDbMaps)

        let transformStream = JSONStream.stringify();
        let outputStream = fileSystem.createWriteStream(filePath);

        transformStream.pipe(outputStream);

        offerFormat.forEach(transformStream.write);

        transformStream.end();

        outputStream.on(
            "finish",
            async function handleFinish() {

                // console.log(chalk.green("JSONStream serialization complete!"));
                await compressFileZlibSfl(filePath)
                await deleteFile(filePath)
                // console.timeEnd('createFileOffers')
                // metrics.influxdb(200, `sizeOfOffers-${sizeOfOffers}`)
                console.log(`File Offers created path:${filePath} `)
            }
        )
    } catch (e) {
        metrics.influxdb(500, `createRecipeOffersError-${computerName}`)
        console.log('createRecipeOffersError:', e)
    }


}

const createRecipeAffiliates = async () => {
    try {
        let affData = await affInfo()

        if (affData.length === 0) {
            console.log(`No affiliates  data`)
            return
        }

        const computerName = os.hostname()
        console.log(`get affiliates count:${affData.length}, from computer:${computerName} `)
        let filePath = config.recipe.folder + await generateFilePath('affiliates')
        let fileFolder = path.dirname(filePath);
        await createRecursiveFolder(fileFolder)

        let transformStream = JSONStream.stringify();
        let outputStream = fileSystem.createWriteStream(filePath);

        transformStream.pipe(outputStream);

        affData.forEach(transformStream.write);

        transformStream.end();

        outputStream.on(
            "finish",
            async function handleFinish() {
                await compressFileZlibSfl(filePath)
                await deleteFile(filePath)
                // metrics.influxdb(200, `sizeOfCampaigns-${sizeCampaign}`)
                console.log(`File Affiliates created path:${filePath}`)

            }
        )
    } catch (e) {
        metrics.influxdb(500, `createRecipeAffiliatesError-${computerName}`)
        console.log('createRecipeAffiliatesError:', e)
    }


}

// const createRecipeSegments = async () => {
//     try {
//         let segmentsData = await getSegments()
//
//         if (segmentsData.length === 0) {
//             console.log(`No segments data  d`)
//             return
//         }
//
//         const computerName = os.hostname()
//         console.log(`get affiliates count:${segmentsData.length}, from computer:${computerName} `)
//         let filePath = config.recipe.folder + await generateFilePath('segments')
//         let fileFolder = path.dirname(filePath);
//         await createRecursiveFolder(fileFolder)
//
//         let transformStream = JSONStream.stringify();
//         let outputStream = fileSystem.createWriteStream(filePath);
//
//         transformStream.pipe(outputStream);
//
//         segmentsData.forEach(transformStream.write);
//
//         transformStream.end();
//
//         outputStream.on(
//             "finish",
//             async function handleFinish() {
//                 await compressFileZlibSfl(filePath)
//                 await deleteFile(filePath)
//                 // metrics.influxdb(200, `sizeOfCampaigns-${sizeCampaign}`)
//                 console.log(`File Segments created path:${filePath}`)
//
//             }
//         )
//     } catch (e) {
//         metrics.influxdb(500, `createRecipeAffiliatesError'`)
//         console.log('createRecipeAffiliatesError:', e)
//     }
//
//
// }

module.exports = {
    createRecipeCampaign,
    createRecipeOffers,
    createRecipeAffiliates,
    createRecipeAffiliateWebsite,
    // createRecipeSegments
}
