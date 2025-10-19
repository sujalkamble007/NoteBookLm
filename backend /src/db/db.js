import mongoose from "mongoose";
import { DB_NAME } from "../../constants.js";

const connectToDB = async () =>{
    try {
        console.log('Attempting to connect to:', process.env.MONGODB_URL); // Debug log
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Connected to the database: ${connectionInstance.connection.host}`);

    }catch (err){
        console.log(`Error connecting to the database: ${err.message}`);
        console.log('Full error:', err); // More detailed error info
        process.exit(1);
    }
}

export default connectToDB;