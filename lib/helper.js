const config = require('plain-config')()
const fs = require('fs').promises
const metrics = require('../lib/metrics')
const os = require('os')
const {getLocalFiles} = require('../lib/zipOffer')

const convertTime = (timestamp) => {
    let months_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let date = new Date(timestamp * 1000);
    let year = date.getFullYear();
    let month = months_arr[date.getMonth()];
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();
    let convdataTime = month + '-' + day + '-' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return convdataTime
}

const currentTime = () => {
    let date = new Date()
    let current = ~~(date.getTime() / 1000)
    return convertTime(current)
}

const memorySizeOf = (obj) => {
    let bytes = 0;

    const sizeOf = (obj) => {
        if (obj !== null && obj !== undefined) {
            switch (typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    let objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if (objClass === 'Object' || objClass === 'Array') {
                        for (let key in obj) {
                            if (!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes
    };

    const formatByteSize = (bytes) => {
        if (bytes < 1024) return bytes + " bytes"
        else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB"
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB"
        else return (bytes / 1073741824).toFixed(3) + " GiB"
    }

    return formatByteSize(sizeOf(obj))
};

const memorySizeOfBite = (obj) => {
    let bytes = 0;

    const sizeOf = (obj) => {
        if (obj !== null && obj !== undefined) {
            switch (typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    let objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if (objClass === 'Object' || objClass === 'Array') {
                        for (let key in obj) {
                            if (!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes
    };

    return sizeOf(obj)
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const formatByteSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB"
    else return (bytes / 1073741824).toFixed(3) + " GiB"
}

const getFileSize = async (filename) => {
    try {
        let stats = await fs.stat(filename)
        // let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
        // console.log('fileSizeInBytes:',fileSizeInMegabytes,'MB')
        // return `${fileSizeInMegabytes} MB`;
        // console.log(`*** getFileSize:${filename}, size:${formatByteSize(fileSizeInBytes)}`)
        return stats.size
    } catch (e) {
        console.log('getFileSizeError:', e)
        metrics.influxdb(500, `getFileSizeError`)
    }
}

const parseFiles = (files) => {
    try {
        let filesInfo = {}
        filesInfo.affiliateWebsitesData = []
        filesInfo.affiliatesData = []
        filesInfo.campaignData = []
        filesInfo.offerData = []
        files.forEach((file, index) => {
            if (file.includes('affiliateWebsites')) {
                // console.log('acProductsData index:',index,file)
                filesInfo.affiliateWebsitesData.push({index: index, file: file})
            }
            if (file.includes('affiliates')) {
                // console.log('affiliateProductProgram index:',index,file)
                filesInfo.affiliatesData.push({index: index, file: file})
            }
            if (file.includes('campaign')) {
                // console.log('refCodesData index:',index,file)
                filesInfo.campaignData.push({index: index, file: file})
            }
            if (file.includes('offer')) {
                // console.log('refCodesData index:',index,file)
                filesInfo.offerData.push({index: index, file: file})
            }

        })
        return filesInfo
    } catch (e) {
        console.log('parseFiles', e)
    }

}


const checkFilesExists = async () => {
    let response = {}
    try {

        let files = await getLocalFiles(config.recipe.folder)

        if (files.length === 0) {
            response.noFiles = `no files in folder:${JSON.stringify(config.recipe)}`
            metrics.influxdb(500, `FileDoesNotExistsNoFiles`)
            return response
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

        for (const campaignFile of filesInfo.campaignData) {
            let sizeCampaign = await getFileSize(campaignFile.file)
            campaignInfo.push(
                {
                    index: campaignFile.index,
                    file: campaignFile.file,
                    size: sizeCampaign
                })
        }

        for (const offerFile of filesInfo.offerData) {
            let sizeOffer = await getFileSize(offerFile.file)
            offerInfo.push(
                {
                    index: offerFile.index,
                    file: offerFile.file,
                    size: sizeOffer
                })
        }

        response.affiliateWebsitesInfo = affiliateWebsitesInfo
        response.affiliatesInfo = affiliatesInfo
        response.offerInfo = offerInfo
        response.campaignInfo = campaignInfo

        if (affiliateWebsitesInfo.length === 0) {
            metrics.influxdb(200, `FileDoesNotExistsAffiliateWebsitesInfo`)
        } else {
            metrics.influxdb(200, `FileOnSflOffersAffiliateWebsitesInfoSize-${affiliateWebsitesInfo[0].size}`)
        }

        if (affiliatesInfo.length === 0) {
            metrics.influxdb(200, `FileDoesNotExistsAffiliatesInfo`)
        } else {
            metrics.influxdb(200, `FileOnSflOffersAffiliatesInfoSize-${affiliatesInfo[0].size}`)
        }

        if (offerInfo.length === 0) {
            metrics.influxdb(200, `FileDoesNotExistsOfferInfo`)
        } else {
            metrics.influxdb(200, `FileOnSflOffersOfferInfoSize-${offerInfo[0].size}`)
        }
        const computerName = os.hostname()
        response.computerName = computerName || 0

        return response
    } catch (e) {
        response.err = 'error files' + JSON.stringify(e.toString())
        metrics.influxdb(500, `FileExistsOnSflOffersNoFiles`)
        return response
    }
}


module.exports = {
    currentTime,
    memorySizeOf,
    memorySizeOfBite,
    formatBytes,
    formatByteSize,
    getFileSize,
    parseFiles,
    checkFilesExists
}

