import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In dev mode, use a global variable so the connection
  // is preserved during hot-reloads.
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.error("Creating new MongoDB client connection...");
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  } else {
    console.error("Reusing existing MongoDB client connection...");
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, normal connection.
  try {
    console.error("Creating new MongoDB client connection for production...");
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  } catch (e) {
    console.error("Error connecting to MongoDB in production:", e);
    throw e; // re-throw the error to be handled by the caller
  }
}

export default clientPromise;
