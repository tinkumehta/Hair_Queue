import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config();

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});
// console.log(process.env.CLOUDINARY_CLOUD_NAME);

const uploadOnCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    stream.end(fileBuffer);
  });
};

const deleteOnCloudinary = async (public_id, resource_type ="image") => {
    try {
        if (!public_id) return null;

        // delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        })
    } catch (error) {
        return error
        console.log("delete on cloudinary failed ", error);
        
    }
}

export {
    uploadOnCloudinary,
    deleteOnCloudinary
}