import mongoose from "mongoose";

const connectToDB = async () =>{
    try {
        const mongoUri = `${process.env.MONGODB_URL}/notebooklm`;
        console.log('Attempting to connect to:', mongoUri);
        
        const connectionInstance = await mongoose.connect(mongoUri);
        
        console.log(`✅ MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);
        console.log(`📊 Database Name: ${connectionInstance.connection.name}`);

    }catch (err){
        console.log(`❌ MongoDB Connection Error: ${err.message}`);
        console.log('Full error:', err);
        process.exit(1);
    }
}

export default connectToDB;