const {getDataCache, setDataCache} = require('../lib/redis')
const {getAdvertiserTargeting, getPublisherTargeting} = require('../db/targeting')

const compareTargeting = (pub, adv) => {

    if (pub.length === 0 || adv.length === 0) return []
    let findRecords = []
    adv.forEach(adv_ => {
        const targetingAdv = adv_.targetingId
        pub.forEach(pub_ => {
            let advCheck = adv_
            let pubCheck = pub_
            delete advCheck.targetingId
            delete pubCheck.targetingId
            if (JSON.stringify(advCheck) === JSON.stringify(pubCheck)) {
                adv_.targetingId_ = targetingAdv
                findRecords.push(adv_)
            }

        })
    })
    return findRecords
}


const getMatchingTargeting = async () => {

    try {
        let advertiserTargeting = await getAdvertiserTargeting()
        let publisherTargeting = await getPublisherTargeting()

        if (advertiserTargeting.length === 0 && publisherTargeting.length === 0) {
            throw new Error('no records from advertiserTargeting and publisherTargeting')
        }

        let pub = publisherTargeting.map(item => {
            return {
                targetingId: item.targetingId,
                geo: item.geo,
                platformAndroid: item.platformAndroid,
                platformIos: item.platformIos,
                platformWindows: item.platformWindows,
                sourceTypeSweepstakes: item.sourceTypeSweepstakes,
                sourceTypeVod: item.sourceTypeVod
            }
        })

        let adv = advertiserTargeting.map(item => {
            return {
                targetingId: item.targetingId,
                geo: item.geo,
                platformAndroid: item.platformAndroid,
                platformIos: item.platformIos,
                platformWindows: item.platformWindows,
                sourceTypeSweepstakes: item.sourceTypeSweepstakes,
                sourceTypeVod: item.sourceTypeVod
            }
        })

        // let findRecords = findTargeting(pub, adv)
        // let findRecordsReserve = detailedDiff(pub, adv)
        let findTargetingRes = compareTargeting(pub, adv)

        let finalTargeting = []
        advertiserTargeting.forEach(item => {
            findTargetingRes.forEach(targeting => {
                if (item.targetingId === targeting.targetingId_) {
                    finalTargeting.push(item)
                }
            })
        })

        // console.log(`\nfinalTargeting:${JSON.stringify(finalTargeting)}`)

        // let resp = {}
        // resp.adv = adv
        // resp.pub = pub
        // resp.finalTargeting = finalTargeting
        // resp.findRecordsReserve = findRecordsReserve
        // return resp
        return finalTargeting
    } catch (e) {
        console.log('getMatchingTargeting error:', e)
        return []
    }

}


const setTargetingRedis = async () => {
    let matchingTargeting = await getMatchingTargeting()
    let findUnderLimit = matchingTargeting.filter(item => (
        !!item.noLimit ||
        (item.campaignCpc >= item.targetingCpc
            && item.budgetDaily >= (item.spentDaily + item.targetingCpc)
            && item.budgetTotal >= (item.spentTotal + item.targetingCpc))
    ))
    // console.log('\nfindUnderLimit:', JSON.stringify(findUnderLimit))
    await setDataCache(`targetingInfo`, findUnderLimit)
    return findUnderLimit || []

}

module.exports = {
    setTargetingRedis,
}
