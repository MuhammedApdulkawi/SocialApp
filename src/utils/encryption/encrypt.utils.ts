import crypto from "node:crypto";

const IV_LENGTH = +(process.env.IV_LENGTH as string); 
const ENCRYPTION_SECRET_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY as string); 

export const encrypt = (text: string) => {

    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_SECRET_KEY, iv);

    let cipherText = cipher.update(text, 'utf-8', 'hex');

    cipherText += cipher.final('hex');

    return `${iv.toString('hex')}:${cipherText}`;
};


export const decrypt = (cipherText: string) => {

    const [iv, plainText] = cipherText.split(':');
    const binaryIv = Buffer.from(iv, 'hex');

    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_SECRET_KEY, binaryIv);

    let decryptedText = decipher.update(plainText, 'hex', 'utf-8');

    decryptedText += decipher.final('utf-8');

    return decryptedText;
};