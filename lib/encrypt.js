const crypto = require('crypto')
const config = require('plain-config')()

const encrypt = (text) => {
    let iv = crypto.randomBytes(config.encryption.iv_length)
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(config.encryption.key), iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
}

const decrypt = (text) => {
    let textParts = text.split(':')
    let iv = Buffer.from(textParts.shift(), 'hex')
    let encryptedText = Buffer.from(textParts.join(':'), 'hex')
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(config.encryption.key), iv)
    let decrypted = decipher.update(encryptedText)

    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString()
}

module.exports = {
    encrypt,
    decrypt
}