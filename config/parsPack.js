import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3Client = new S3Client({
  region: "us-east-1", // تغییر به یک ریجن استاندارد برای جلوگیری از خطای Credential
  endpoint: `https://${process.env.PARSPACK_ENDPOINT || 'c385221.parspack.net'}`,
  credentials: {
    accessKeyId: (process.env.PARSPACK_ACCESS_KEY || "").trim(),
    secretAccessKey: (process.env.PARSPACK_SECRET_KEY || "").trim(),
  },
  forcePathStyle: true,
});

export default s3Client;
