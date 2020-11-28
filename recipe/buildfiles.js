let chalk = require("chalk")
let JSONStream = require("JSONStream")
let fileSystem = require("fs")
let path = require('path')
const config = require('plain-config')()

const {campaigns, offerInfo} = require('../db/offer')
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

        console.log('campaignData:', campaignData)
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
        metrics.influxdb(500, `createRecipeCampaignError'`)
        console.log('createRecipeCampaignError:', e)
    }


}
const createRecipeOffers = async () => {
    // console.log('createfile with offers')
    // console.time('createFileOffers')
    // ************** CREATE ZIP FILE
    try {
        let offerData = await offerInfo()

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

        offerData.forEach(transformStream.write);

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
        );
    } catch {
        metrics.influxdb(500, `createRecipeOffersError'`)
        console.log('createRecipeOffersError:', e)
    }


}

module.exports = {
    createRecipeCampaign,
    createRecipeOffers
}
