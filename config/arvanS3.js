import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();



const s3Client = new S3Client({
  region: "default", 
  endpoint: "https://exercise.s3.ir-thr-at1.arvanstorage.ir",
  credentials: {
    accessKeyId: process.env.ARVAN_ACCESS_KEY,
    secretAccessKey: process.env.ARVAN_SECRET_KEY,
  },
  forcePathStyle: true, // مهم برای آروان
});

export default s3Client;
