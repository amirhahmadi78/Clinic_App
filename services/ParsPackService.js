import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/parsPack.js";

class ParsPackService {
    /**
     * آپلود فایل به باکت با استفاده از S3
     * @param {string} bucketName نام باکت
     * @param {string} objectName نام فایل (مسیر در باکت)
     * @param {Buffer} fileBuffer بافر فایل
     * @param {string} contentType نوع فایل
     */
    async uploadObject(bucketName, objectName, fileBuffer, contentType) {
        // console.log("Checking ENV variables in ParsPackService:", {
        //     endpoint: process.env.PARSPACK_ENDPOINT,
        //     accessKey: process.env.PARSPACK_ACCESS_KEY ? "EXISTS" : "MISSING",
        //     secretKey: process.env.PARSPACK_SECRET_KEY ? "EXISTS" : "MISSING",
        //     bucket: process.env.PARSPACK_BUCKET_NAME
        // });

        if (!process.env.PARSPACK_ACCESS_KEY || !process.env.PARSPACK_SECRET_KEY) {
            throw new Error(`تنظیمات Access Key یا Secret Key پارس‌پک در فایل .env یافت نشد. (AccessKey: ${process.env.PARSPACK_ACCESS_KEY ? 'OK' : 'MISSING'}, SecretKey: ${process.env.PARSPACK_SECRET_KEY ? 'OK' : 'MISSING'})`);
        }

        try {
            const params = {
                Bucket: bucketName || 'c385221',
                Key: objectName,
                Body: fileBuffer,
                ContentType: contentType,
                // ACL: 'public-read', // پارس‌پک معمولاً این را پشتیبانی می‌کند
            };

            const command = new PutObjectCommand(params);
            const response = await s3Client.send(command);
            return response;
        } catch (error) {
            console.error("ParsPack S3 Upload Error:", error);
            throw this.handleError(error);
        }
    }

    // هندل خطاها
    handleError(error) {
        let customError = new Error(error.message || 'خطای در آپلود به پارس‌پک');
        customError.statusCode = error.$metadata?.httpStatusCode || 500;
        return customError;
    }
}

export default new ParsPackService();
