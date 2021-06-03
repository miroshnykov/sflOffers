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
const {getFileSize, formatByteSize, parseFiles} = require('../lib/helper')

const {getDataCache, setDataCache} = require('../lib/redis')
const {
    getLocalFiles
} = require('../lib/zipOffer')
const metrics = require('../lib/metrics')

const {blockedIp} = require('../db/blockedIp')


const setFileSizeInfo = async () => {
    let response = {}
    console.log('setFileSizeInfo')
    console.log('\n\n\n ****  SET fileSizeInfo && blockedIp ****')
    try {
        let files = await getLocalFiles(config.recipe.folder)
        const computerName = os.hostname()
        console.log(`getLocalFilesDebug for computerName:${computerName}, files:${JSON.stringify(files)}`)
        if (files.length === 0) {
            console.log(`I am not able to get the Size of recipe,  No files in folder ${config.recipe.folder}`)
            metrics.influxdb(500, `fileSizeAllRecipeNotExists`)
            return
        }
        let filesInfo = parseFiles(files)
        response.files = files

        let affiliateWebsitesInfo = []
        let affiliatesInfo = []
        let campaignInfo = []
        let offerInfo = []
        for (const affiliateWebsitesFile of filesInfo.affiliateWebsitesData) {
            let sizeAffiliateWebsitesFileSize = await getFileSize(affiliateWebsitesFile.file)

            affiliateWebsitesInfo.push(
                {
                    index: affiliateWebsitesFile.index,
                    file: affiliateWebsitesFile.file,
                    size: sizeAffiliateWebsitesFileSize
                })
        }

        for (const affiliatesFile of filesInfo.affiliatesData) {
            let sizeAffiliates = await getFileSize(affiliatesFile.file)

            affiliatesInfo.push(
                {
                    index: affiliatesFile.index,
                    file: affiliatesFile.file,
                    size: sizeAffiliates
                })
        }
        if (filesInfo['campaignData']){
            for (const campaignFile of filesInfo.campaignData) {
                let sizeCampaign = await getFileSize(campaignFile.file)
                campaignInfo.push(
                    {
                        index: campaignFile.index,
                        file: campaignFile.file,
                        size: sizeCampaign
                    })
            }
        }

        if (filesInfo['offerData']){
            for (const offerFile of filesInfo.offerData) {
                let sizeOffer = await getFileSize(offerFile.file)
                offerInfo.push(
                    {
                        index: offerFile.index,
                        file: offerFile.file,
                        size: sizeOffer
                    })
            }
        }


        response.affiliateWebsitesInfo = affiliateWebsitesInfo
        response.affiliatesInfo = affiliatesInfo
        response.offerInfo = offerInfo
        response.campaignInfo = campaignInfo

        let fileSizeAffiliateWebsitesInfo
        let fileSizeAffiliatesInfo
        let fileSizeOfferInfo
        let fileSizeCampaignInfo

        fileSizeAffiliateWebsitesInfo = affiliateWebsitesInfo[0].size
        fileSizeAffiliatesInfo = affiliatesInfo[0].size
        fileSizeOfferInfo = offerInfo.length > 0 && offerInfo[0].size || 0
        fileSizeCampaignInfo = campaignInfo.length > 0 && campaignInfo[0].size || 0


        let fileSizeInfo = {}

        if (!fileSizeAffiliateWebsitesInfo) {
            metrics.influxdb(500, `fileSizeAffilaiteWebsitesNotExists-${computerName}`)
        } else {
            fileSizeInfo.affiliateWebsites = Number(fileSizeAffiliateWebsitesInfo)
        }
        if (!fileSizeAffiliatesInfo) {
            metrics.influxdb(500, `fileSizeAffilaitesNotExists-${computerName}`)
        } else {
            fileSizeInfo.affiliates = Number(fileSizeAffiliatesInfo)
        }
        if (!fileSizeOfferInfo) {
            metrics.influxdb(500, `fileSizeOffersNotExists-${computerName}`)
        } else {
            fileSizeInfo.offer = Number(fileSizeOfferInfo)
        }
        if (!fileSizeCampaignInfo) {
            metrics.influxdb(500, `fileSizeCampaignsNotExists-${computerName}`)
        } else {
            fileSizeInfo.campaign = Number(fileSizeCampaignInfo)
        }

        console.log(`File size for computerName:${computerName}  fileSizeAffiliates:${fileSizeAffiliatesInfo}, fileSizeCampaign:${fileSizeCampaignInfo}, fileSizeOffer:${fileSizeOfferInfo}, fileSizeAffiliateWebsites:${fileSizeAffiliateWebsitesInfo}`)

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

// const setRecipeFiles = async () => {
//     if (config.env === 'development') return
//     const computerName = os.hostname()
//     try {
//         console.log(`**** setRecipeFiles **** `)
//
//         let files = await getLocalFiles(config.recipe.folder)
//         console.log(`\nCreate files campaign and offer, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)
//         if (files.length === 0) {
//             console.log(`no files in folder:${JSON.stringify(config.recipe)} created `)
//             await createRecipeCampaign()
//             await createRecipeOffers()
//             await createRecipeAffiliates()
//             await createRecipeAffiliateWebsite()
//             metrics.influxdb(200, `createRecipeFiles_${computerName}`)
//             return
//         }
//
//         let file1 = files[0]
//         let file2 = files[1]
//         let file3 = files[2]
//         let file4 = files[3]
//         if (file1) {
//             await deleteFile(file1)
//         }
//         if (file2) {
//             await deleteFile(file2)
//         }
//         if (file3) {
//             await deleteFile(file3)
//         }
//
//         if (file4) {
//             await deleteFile(file4)
//         }
//         await createRecipeCampaign()
//         await createRecipeOffers()
//         await createRecipeAffiliates()
//         await createRecipeAffiliateWebsite()
//
//         metrics.influxdb(200, `createRecipeFiles-${computerName}`)
//     } catch (e) {
//         metrics.influxdb(500, `createRecipeFileError-${computerName}`)
//         console.log('create files campaign and offer error:', e)
//     }
//
// }

const setRecipeFilesCampaigns = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        console.log(`**** setRecipeFilesCampaigns **** `)

        let files = await getLocalFiles(config.recipe.folder)
        let filesInfo = parseFiles(files)

        let response = {}
        response.deleted = []
        for (const campaignData of filesInfo.campaignData) {
            await deleteFile(campaignData.file)
            response.deleted.push(campaignData.file)
        }

        console.log(` **** Deleted campaignData files:${JSON.stringify(response)}`)
        await createRecipeCampaign()
        console.log(` **** Create files campaignData, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)

        metrics.influxdb(200, `createRecipeCampaigns-${computerName}`)
    } catch (e) {
        metrics.influxdb(500, `createRecipeCampaignsError-${computerName}`)
        console.log('create files campaigns error:', e)
    }

}

const setRecipeFilesOffers = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        console.log(`**** setRecipeFilesOffers **** `)

        let files = await getLocalFiles(config.recipe.folder)
        let filesInfo = parseFiles(files)

        let response = {}
        response.deleted = []
        for (const offerData of filesInfo.offerData) {
            await deleteFile(offerData.file)
            response.deleted.push(offerData.file)
        }

        console.log(` **** Deleted offerData files:${JSON.stringify(response)}`)
        await createRecipeOffers()
        console.log(` **** Create files offerData, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)

        metrics.influxdb(200, `createRecipeOffers--${computerName}`)
    } catch (e) {
        metrics.influxdb(500, `createRecipeOffersError-${computerName}`)
        console.log('create files offers error:', e)
    }

}

const setRecipeFilesAffiliates = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        console.log(`**** setRecipeFilesAffiliates **** `)

        let files = await getLocalFiles(config.recipe.folder)
        let filesInfo = parseFiles(files)

        let response = {}
        response.deleted = []
        for (const affiliatesData of filesInfo.affiliatesData) {
            await deleteFile(affiliatesData.file)
            response.deleted.push(affiliatesData.file)
        }

        console.log(` **** Deleted affiliatesData files:${JSON.stringify(response)}`)
        await createRecipeAffiliates()
        console.log(` **** Create files affiliatesData, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)

        metrics.influxdb(200, `createRecipeAffiliates--${computerName}`)
    } catch (e) {
        metrics.influxdb(500, `createRecipeAffiliatesError-${computerName}`)
        console.log('create files affiliates error:', e)
    }

}

const setRecipeFilesAffiliateWebsites = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        console.log(`**** setRecipeFilesAffiliateWebsites **** `)

        let files = await getLocalFiles(config.recipe.folder)
        let filesInfo = parseFiles(files)

        let response = {}
        response.deleted = []
        for (const affiliateWebsitesData of filesInfo.affiliateWebsitesData) {
            await deleteFile(affiliateWebsitesData.file)
            response.deleted.push(affiliateWebsitesData.file)
        }

        console.log(` **** Deleted affiliateWebsitesData files:${JSON.stringify(response)}`)
        await createRecipeAffiliateWebsite()
        console.log(` **** Create files affiliateWebsitesData, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)

        metrics.influxdb(200, `createRecipeAffiliateWebsite--${computerName}`)
    } catch (e) {
        metrics.influxdb(500, `createRecipeAffiliateWebsiteError-${computerName}`)
        console.log('create files AffiliateWebsite error:', e)
    }

}

module.exports = {
    setFileSizeInfo,
    setRecipeFilesCampaigns,
    setRecipeFilesOffers,
    setRecipeFilesAffiliates,
    setRecipeFilesAffiliateWebsites
}

