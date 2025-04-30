import imageCompression from 'browser-image-compression';
import axios from 'axios';
import {db} from './firebase';

// Cloudinary URLs and settings
const codename = 'duwrqxvey';
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/'+codename+'/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'devgate_preset';

// Upload image function
const handleImageUpload = async (file) => {
  const options = {
    maxSizeMB: 0.5,        // Compress to ~500KB
    maxWidthOrHeight: 1080, // Resize to max 1080px (optional)
    useWebWorker: true,
  };

  try {
    // Compress the image
    const compressedFile = await imageCompression(file, options);

    // Prepare form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // Upload to Cloudinary
    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);

    // Extract the public_id from the Cloudinary response
    const publicId = response.data.public_id;

    // Return the public_id
    return publicId;
  } catch (error) {
    console.error('Error during image upload:', error);
    throw error; // Optionally re-throw the error to handle it elsewhere
  }
};


// for image deletion, since we aren't using any backend for this project, i am not going to implement this function
// and so the imgs that get inside stay inside untill i delete them,
// so better save them somewhere 
// that's where this function comes in

const deleteImage = async (publicId) => {
  // save the publicId in the storage db 
  db.collection('deleted').add({ publicId });
}

const getImageUrl = (publicId, options = {}) => {
  /*
  usage example:
    const url = getImageUrl('publicId', { w: 300, h: 300, crop: 'fill' });
  */
  const baseUrl = `https://res.cloudinary.com/` + codename + `/image/upload`;

  const transformations = Object.entries(options)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return transformations
    ? `${baseUrl}/${transformations}/${publicId}.jpg`
    : `${baseUrl}/${publicId}.jpg`;
};


export { handleImageUpload, getImageUrl};