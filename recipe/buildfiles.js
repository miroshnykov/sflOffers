let chalk = require("chalk")
let JSONStream = require("JSONStream")
let fileSystem = require("fs")
let path = require('path')

const {campaigns, offerInfo} = require('../db/offer')
const {
    generateFilePath,
    createRecursiveFolder,
    compressFileZlibSfl,
    deleteJsonFile
} = require('../lib/zipOffer')

const {memorySizeOf, memorySizeOfBite} = require('../lib/helper')

const createRecipeCampaign = async () => {
    // console.log('createfile Campaign')
    // console.time('createfileCampaign')
    let offerData = await campaigns()
    let localFolder = '/tmp/recipe/'


    let filePath = localFolder + await generateFilePath('campaign')
    // console.log('filePath', filePath)
    let fileFolder = path.dirname(filePath);
    // console.log('fileFolder:', fileFolder)
    await createRecursiveFolder(fileFolder)
    // console.log('sfl_filePath:', filePath)

    let sizeOfDbMaps = await memorySizeOf(offerData)

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

            // console.log(chalk.green("JSONStream serialization complete!"))
            await compressFileZlibSfl(filePath)
            await deleteJsonFile(filePath)
            // console.timeEnd('createfileCampaign')

            console.log(`File Campaigns created path:${filePath}, size:${sizeOfDbMaps}` )

        }
    );


}
const createRecipeOffers = async () => {
    // console.log('createfile with offers')
    // console.time('createFileOffers')
    // ************** CREATE ZIP FILE
    let offerData = await offerInfo()
    let localFolder = '/tmp/recipe/'


    let filePath = localFolder + await generateFilePath('offer')
    // console.log('filePath', filePath)
    let fileFolder = path.dirname(filePath);
    // console.log('fileFolder:', fileFolder)
    await createRecursiveFolder(fileFolder)
    // console.log('sfl_filePath:', filePath)

    let sizeOfDbMaps = await memorySizeOf(offerData)

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
            await deleteJsonFile(filePath)
            // console.timeEnd('createFileOffers')
            console.log(`File Offers created path:${filePath}, size:${sizeOfDbMaps} ` )
        }
    );

}

module.exports = {
    createRecipeCampaign,
    createRecipeOffers
}
