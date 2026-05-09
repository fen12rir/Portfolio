import { defaultPortfolioData } from './defaultData.js';
import { getDb } from './db.js';

const COLLECTION_NAME = 'portfolio';
const DOCUMENT_ID = 'primary';

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergePortfolioData = (existingData, incomingData) => ({
  personal: { ...(existingData?.personal || {}), ...(incomingData?.personal || {}) },
  social: { ...(existingData?.social || {}), ...(incomingData?.social || {}) },
  skills: incomingData?.skills !== undefined ? incomingData.skills : (existingData?.skills || []),
  projects: incomingData?.projects !== undefined ? incomingData.projects : (existingData?.projects || []),
  experience: incomingData?.experience !== undefined ? incomingData.experience : (existingData?.experience || []),
  education: incomingData?.education !== undefined ? incomingData.education : (existingData?.education || []),
  certificates: incomingData?.certificates !== undefined ? incomingData.certificates : (existingData?.certificates || []),
  gallery: incomingData?.gallery !== undefined ? incomingData.gallery : (existingData?.gallery || []),
});

export const getPortfolioCollection = async () => {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
};

export const getStoredPortfolio = async () => {
  const collection = await getPortfolioCollection();
  const document = await collection.findOne({ _id: DOCUMENT_ID });
  return document?.data ? document.data : clone(defaultPortfolioData);
};

export const saveStoredPortfolio = async (incomingData, isPartialUpdate = false) => {
  const currentData = await getStoredPortfolio();
  const nextData = isPartialUpdate
    ? mergePortfolioData(currentData, incomingData)
    : incomingData;

  const collection = await getPortfolioCollection();
  await collection.updateOne(
    { _id: DOCUMENT_ID },
    {
      $set: {
        data: nextData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  return clone(nextData);
};

export const resetStoredPortfolio = async () => {
  const nextData = clone(defaultPortfolioData);
  const collection = await getPortfolioCollection();
  await collection.updateOne(
    { _id: DOCUMENT_ID },
    {
      $set: {
        data: nextData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
  return nextData;
};
