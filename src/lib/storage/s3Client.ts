import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.WASABI_REGION ?? "us-east-1";
const endpoint = process.env.WASABI_ENDPOINT ?? `https://s3.${region}.wasabisys.com`;
const bucket = process.env.WASABI_BUCKET ?? "";
const accessKeyId = process.env.WASABI_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.WASABI_SECRET_ACCESS_KEY ?? "";

export const WASABI_BUCKET = bucket;

export const s3Client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials:
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
});
