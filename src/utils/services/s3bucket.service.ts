import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs, { ReadStream } from "node:fs";
import { Upload } from "@aws-sdk/lib-storage";

interface IPutObjectCommandInput extends PutObjectCommandInput {
  Body: Buffer | string | ReadStream;
}

export class S3BucketService {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  private key_folder = process.env.AWS_S3_KEY_FOLDER as string;

  async getFileWIthSignedUrl(key: string, expiresIn: number = 60) {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
    });
    return await getSignedUrl(this.s3Client, getCommand, { expiresIn });
  }
  async uploadFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${this.key_folder}/${key}/${Date.now()}-${file.originalname}`;

    const params: IPutObjectCommandInput = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: keyName,
      //   Body: file.buffer, // when using multer, the file content is available in the buffer property
      // Body: file.path, // when using multer with disk storage, the file path is available in the path property
      Body: fs.createReadStream(file.path), // when using multer with disk storage, create a read stream from the file path
      ContentType: file.mimetype,
      //   ACL: "public-read", // set the ACL to public-read to make the file publicly accessible
    };
    const putCommand = new PutObjectCommand(params);
    await this.s3Client.send(putCommand);
    const signedUrl = await this.getFileWIthSignedUrl(keyName);
    return {
      key: keyName,
      url: signedUrl,
    };
  }
  async deleteFileFromS3(key: string) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
    });
    await this.s3Client.send(deleteCommand);
  }
  async deleteBulkFromS3(keys: string[]) {
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });
    await this.s3Client.send(deleteCommand);
  }
  async uploadLargeFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${this.key_folder}/${key}/${Date.now()}-${file.originalname}`;
    const params: IPutObjectCommandInput = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };
    const upload = new Upload({
      client: this.s3Client,
      params,
      queueSize: 4, // how many concurrent uploads to process at once (default is 4) -- how many parts to upload in parallel
      partSize: 5 * 1024 * 1024, // the size of each part in bytes (5MB in this case)
      leavePartsOnError: false, // whether to leave the uploaded parts on S3 if an error occurs during the upload
    });
    await upload.done();
    const signedUrl = await this.getFileWIthSignedUrl(keyName);
    return {
      key: keyName,
      url: signedUrl,
    };
  }
  async uploadFilesOnS3(files: Express.Multer.File[], key: string) {
    const uploadResults = [];
    for (const file of files) {
      const result = await this.uploadFileOnS3(file, key);
      uploadResults.push(result);
    }
    return uploadResults;
  }
}
