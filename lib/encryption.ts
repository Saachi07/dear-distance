import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-change-in-production'

export const encrypt = (text: string): string => {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt content')
  }
}

export const decrypt = (encryptedText: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    if (!decrypted) {
      throw new Error('Failed to decrypt content')
    }
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt content')
  }
}

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString()
}

export const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash
}
