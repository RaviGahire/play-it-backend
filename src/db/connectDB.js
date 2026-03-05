import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log('Database connected successfully', mongoose.connection.readyState, `${connectionInstance.connection.host}`);

    } catch (error) {
        console.log('Database connection failed:', error, mongoose.connection.readyState);
        process.exit(1);
    }

}

export default connectDB