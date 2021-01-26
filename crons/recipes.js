const {
    createRecipeCampaign,
    createRecipeOffers,
    createRecipeAffiliates,
    createRecipeAffiliateWebsite,
    // createRecipeSegments
} = require('../recipe/buildfiles')

const {deleteFile} = require('../lib/zipOffer')

const config = require('plain-config')()

const os = require('os')
const {getFileSize, formatByteSize} = require('../lib/helper')

const {getDataCache, setDataCache} = require('../lib/redis')
const {
    getLocalFiles
} = require('../lib/zipOffer')
const metrics = require('../lib/metrics')

const {blockedIp} = require('../db/blockedIp')

const setFileSizeInfo = async () => {

    if (config.env === 'development') return
    console.log('\n ****  SET fileSizeInfo && blockedIp ****')
    try {
        let files = await getLocalFiles(config.recipe.folder)
        const computerName = os.hostname()
        console.log(`getLocalFilesDebug for computerName:${computerName}, files:${JSON.stringify(files)}`)
        if (files.length === 0) {
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
            metrics.influxdb(500, `fileSizeAffilaiteWebsitesNotExists-${computerName}`)
        }

        if (file2) {
            fileSizeAffiliates = await getFileSize(file2) || 0
        } else {
            metrics.influxdb(500, `fileSizeAffilaitesNotExists-${computerName}`)
        }


        if (file3) {
            fileSizeCampaign = await getFileSize(file3) || 0
        } else {
            metrics.influxdb(500, `fileSizeCampaignsNotExists-${computerName}`)
        }


        if (file4) {
            fileSizeOffer = await getFileSize(file4) || 0
        } else {
            metrics.influxdb(500, `fileSizeOffersNotExists-${computerName}`)
        }


        console.log(`File size for computerName:${computerName}  fileSizeAffiliates:${fileSizeAffiliates}, fileSizeCampaign:${fileSizeCampaign}, fileSizeOffer:${fileSizeOffer}, fileSizeAffiliateWebsites:${fileSizeAffiliateWebsites}`)

        // console.log('fileSizeOffer:', fileSizeOffer)
        // console.log('fileSizeCampaign:', fileSizeCampaign)
        let fileSizeInfo = {}
        if (fileSizeOffer) {
            fileSizeInfo.offer = Number(fileSizeOffer)
        }
        if (fileSizeCampaign) {
            fileSizeInfo.campaign = Number(fileSizeCampaign)
        }
        if (fileSizeAffiliates) {
            fileSizeInfo.affiliates = Number(fileSizeAffiliates)
        }

        if (fileSizeAffiliateWebsites) {
            fileSizeInfo.affiliateWebsites = Number(fileSizeAffiliateWebsites)
        }

        console.log(`Set fileSizeInfo:${JSON.stringify(fileSizeInfo)}`)
        await setDataCache(`fileSizeInfo`, fileSizeInfo)

        let blockedIpInfo = await blockedIp()
        await setDataCache(`blockedIp`, blockedIpInfo)

        metrics.sendMetricsSystem(fileSizeInfo, 0)

    } catch (e) {
        console.log('getFilesSizeError:', e)
        metrics.influxdb(500, `getFilesSizeError'`)
    }

}

const setRecipeFiles = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        console.log(`**** setRecipeFiles **** `)

        let files = await getLocalFiles(config.recipe.folder)
        console.log(`\nCreate files campaign and offer, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)
        if (files.length === 0) {
            console.log(`no files in folder:${JSON.stringify(config.recipe)} created `)
            await createRecipeCampaign()
            await createRecipeOffers()
            await createRecipeAffiliates()
            await createRecipeAffiliateWebsite()
            metrics.influxdb(200, `createRecipeFiles_${computerName}`)
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

        metrics.influxdb(200, `createRecipeFiles-${computerName}`)
    } catch (e) {
        metrics.influxdb(500, `createRecipeFileError-${computerName}`)
        console.log('create files campaign and offer error:', e)
    }

}

module.exports = {
    setFileSizeInfo,
    setRecipeFiles,
}

