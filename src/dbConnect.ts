import mongoose from "mongoose";

type DataObj = {
  stats: [];
  voiceactivities: [];
  users: [];
  gifts: [];
  giftrequests: [];
};

async function dbConnect(): Promise<DataObj | Error> {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("(. ❛ ᴗ ❛.)");

    const db = mongoose.connection.db;
    const collectionsNames = [
      "stats",
      "voiceactivities",
      "users",
      "gifts",
      "giftrequests",
    ];
    const arrayOfPromises = collectionsNames.map(async (key) =>
      db.collection(key).find({}).toArray(),
    );
    const data = await Promise.all(arrayOfPromises);
    // const obj = {};
    const obj: DataObj = data.reduce(
      (acc: DataObj, arr: [], index: number): DataObj => {
        acc[collectionsNames[index]] = arr;
        return acc;
      },
      {
        stats: [],
        voiceactivities: [],
        users: [],
        gifts: [],
        giftrequests: [],
      },
    );
    await mongoose.disconnect();
    return obj;
  } catch (err) {
    console.log("Unable to connect to MongoDB Atlas!");
    console.error(err);
    throw new Error("Unable to connect to MongoDB Atlas");
  }
}

export default dbConnect;
