import { v2 as cloudinary } from 'cloudinary';

const getConfiguredProvider = () => {
  return (process.env.IMAGE_STORAGE_PROVIDER || 'inline').trim().toLowerCase();
};

const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

export const uploadImageFromDataUrl = async ({
  imageData,
  fileName = 'image',
  folder = 'portfolio',
  assetType = 'general',
}) => {
  const provider = getConfiguredProvider();

  if (provider === 'cloudinary') {
    configureCloudinary();

    const uploaded = await cloudinary.uploader.upload(imageData, {
      folder,
      public_id: fileName ? fileName.replace(/\.[^/.]+$/, '') : undefined,
      resource_type: 'image',
      tags: ['portfolio', assetType].filter(Boolean),
    });

    return {
      url: uploaded.secure_url,
      provider: 'cloudinary',
      key: uploaded.public_id,
    };
  }

  return {
    url: imageData,
    provider: 'inline',
    key: fileName || 'image',
  };
};

export const getImageStorageProvider = () => getConfiguredProvider();
