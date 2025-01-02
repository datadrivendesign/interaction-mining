import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
  },
});

const AWS_URL = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_AWS_BUCKET_PREFIX}`;

export const uploadScreen = async (id: string, img: string) => {
  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    Key: `${process.env.NEXT_PUBLIC_AWS_BUCKET_PREFIX}/screenshots/${id}.png`,
    Body: Buffer.from(img, "base64"),
    ContentEncoding: "base64",
    ContentType: "image/png",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `${AWS_URL}/screenshots/${id}.png`;
  } catch (err) {
    return err;
  }
};

export const deleteScreen = async (id: string) => {
  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    Key: `${process.env.NEXT_PUBLIC_AWS_BUCKET_PREFIX}/screenshots/${id}.png`,
    ContentType: "image/png",
  };

  try {
    const response = await s3Client.send(new DeleteObjectCommand(params));
    return (
      response.$metadata.httpStatusCode! >= 200 &&
      response.$metadata.httpStatusCode! < 300
    );
  } catch (err) {
    throw err;
  }
};

export const uploadViewHierarchy = async (id: string, vh: any) => {
  console.log("Redacting data", vh);
  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    Key: `${process.env.NEXT_PUBLIC_AWS_BUCKET_PREFIX}/view_hierarchies/${id}.json`,
    Body: JSON.stringify(vh),
    ContentType: "application/json",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `${AWS_URL}/view_hierarchies/${id}.json`;
  } catch (err) {
    throw err;
  }
};

export const deleteViewHierarchy = async (id: string) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${process.env.AWS_BUCKET_PREFIX}/view_hierarchies/${id}.json`,
    ContentType: "image/png",
  };

  try {
    const response = await s3Client.send(new DeleteObjectCommand(params));
    return (
      response.$metadata.httpStatusCode! >= 200 &&
      response.$metadata.httpStatusCode! < 300
    );
  } catch (err) {
    return err;
  }
};

const exports = {
  uploadScreen,
  uploadViewHierarchy,
  deleteScreen,
  deleteViewHierarchy,
};
export default exports;
