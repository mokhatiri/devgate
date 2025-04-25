import imageCompression from 'browser-image-compression';
import axios from 'axios';
import {db} from './firebase';

// Cloudinary URLs and settings
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/duwrqxvey/image/upload';
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


/*
// deleteMany.js

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'duwrqxvey',
  api_key: process.env.CLOUDINARY_API_KEY, ---> this to be replaced when needed
  api_secret: process.env.CLOUDINARY_API_SECRET, ----> same for this, and only run this with a secure backend
});

const publicIds = [
  'folder/img1',
  'folder/img2',
  'img3',
  // ...more
];

async function deleteImages(ids) {
  try {
    const res = await cloudinary.api.delete_resources(ids);
    console.log('Deleted:', res);
  } catch (err) {
    console.error('Error deleting:', err);
  }
}

deleteImages(publicIds);
*/

// options here :
/*
Option | Key | Example | Description
Width | w | w: 300 | Resize image width
Height | h | h: 300 | Resize image height
Crop | c | c: 'fill' | Crop mode: fill, fit, scale, thumb, crop, etc.
Quality | q | q: 'auto' | Auto or manual quality (e.g., q: 80)
Format | f | f: 'auto' | Auto-select best format (jpg, png, webp, etc.)
Effect | e | e: 'grayscale' | Image effects (e.g., sepia, blur, grayscale)
Radius | r | r: 'max' | Rounded corners (use 'max' for full circle)
Gravity | g | g: 'face' | Focus area (center, north, face, etc.)
Background | b | b: 'white' | Background color (used with some crop modes)
Border | bo | bo: '5px_solid_black' | Add border
Overlay text | l_text | See below | Add text overlay
Blur | e | e: 'blur:300' | Apply blur (value from 1–2000)
*/

const getImageUrl = (publicId, options = {}) => {
  /*
  usage example:
    const url = getImageUrl('publicId', { w: 300, h: 300, crop: 'fill' });
  */
  const baseUrl = `https://res.cloudinary.com/duwrqxvey/image/upload`;

  const transformations = Object.entries(options)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return transformations
    ? `${baseUrl}/${transformations}/${publicId}.jpg`
    : `${baseUrl}/${publicId}.jpg`;
};


export { handleImageUpload, getImageUrl};