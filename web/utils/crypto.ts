import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'

/**
 * Generates a new TweetNaCl key pair for E2EE.
 */
export const generateKeyPair = (): { publicKeyBase64: string; secretKeyBase64: string } => {
    const keyPair = nacl.box.keyPair()
    const publicKeyBase64 = naclUtil.encodeBase64(keyPair.publicKey)
    const secretKeyBase64 = naclUtil.encodeBase64(keyPair.secretKey)
    return { publicKeyBase64, secretKeyBase64 }
}

/**
 * Stores the E2EE keys in localStorage.
 */
export const storeKeyPair = (secretKey: string, publicKey: string): void => {
    localStorage.setItem('e2ee_secret_key', secretKey)
    localStorage.setItem('e2ee_public_key', publicKey)
}

/**
 * Retrieves the stored E2EE keys from localStorage.
 */
export const getStoredKeys = (): { secretKey: string | null; publicKey: string | null } => {
    const secretKey = localStorage.getItem('e2ee_secret_key')
    const publicKey = localStorage.getItem('e2ee_public_key')
    return { secretKey, publicKey }
}

/**
 * Purges the E2EE keys from localStorage.
 */
export const purgeStoredKeys = (): void => {
    localStorage.removeItem('e2ee_secret_key')
    localStorage.removeItem('e2ee_public_key')
}

/**
 * Computes a shared secret key (32 bytes) between a local secret key and a remote public key.
 */
export const getSharedKey = (remotePublicKeyBase64: string, mySecretKeyBase64: string): Uint8Array | null => {
    try {
        const remotePublicKey = naclUtil.decodeBase64(remotePublicKeyBase64)
        const mySecretKey = naclUtil.decodeBase64(mySecretKeyBase64)
        return nacl.box.before(remotePublicKey, mySecretKey)
    } catch (e) {
        console.error('Failed to compute shared key:', e)
        return null
    }
}

/**
 * Encrypts a message using a shared secret key.
 */
export const encryptMessage = (message: string, recipientPublicKeyBase64: string, mySecretKeyBase64: string) => {
    const nonce = nacl.randomBytes(nacl.box.nonceLength)
    const messageUint8 = naclUtil.decodeUTF8(message)
    const sharedKey = getSharedKey(recipientPublicKeyBase64, mySecretKeyBase64)

    if (!sharedKey) {
        throw new Error('Could not derive shared key for encryption')
    }

    const encrypted = nacl.box.after(messageUint8, nonce, sharedKey)

    const payload = {
        nonce: naclUtil.encodeBase64(nonce),
        cipher: naclUtil.encodeBase64(encrypted)
    }
    return JSON.stringify(payload)
}

/**
 * Decrypts a message using a shared secret key.
 */
export const decryptMessage = (encryptedPayload: string, otherPublicKeyBase64: string, mySecretKeyBase64: string) => {
    try {
        if (!encryptedPayload || typeof encryptedPayload !== 'string' || !encryptedPayload.trim().startsWith('{')) {
            return encryptedPayload
        }

        const payload = JSON.parse(encryptedPayload)
        if (!payload.nonce || !payload.cipher) {
            return encryptedPayload
        }

        const nonce = naclUtil.decodeBase64(payload.nonce)
        const encrypted = naclUtil.decodeBase64(payload.cipher)
        const sharedKey = getSharedKey(otherPublicKeyBase64, mySecretKeyBase64)

        if (!sharedKey) {
            return '[Clé incompatible]'
        }

        const decrypted = nacl.box.open.after(encrypted, nonce, sharedKey)

        if (!decrypted) {
            // Fallback: try standard box.open
            const otherPublicKey = naclUtil.decodeBase64(otherPublicKeyBase64)
            const mySecretKey = naclUtil.decodeBase64(mySecretKeyBase64)
            const fallbackDecrypted = nacl.box.open(encrypted, nonce, otherPublicKey, mySecretKey)

            if (!fallbackDecrypted) {
                return '[Clé incompatible ou message corrompu]'
            }
            return naclUtil.encodeUTF8(fallbackDecrypted)
        }

        return naclUtil.encodeUTF8(decrypted)
    } catch (error) {
        console.error('Decryption failed with exception:', error)
        return encryptedPayload
    }
}
