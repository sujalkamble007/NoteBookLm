import express, { urlencoded } from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {Limit} from './constants.js';


const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN || '*',
    credentials: true
}))

app.use(express.json({limit : Limit}))
app.use(urlencoded({extended: true , limit : Limit}))
app.use(express.static("public"))
app.use(cookieParser())

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ 
        message: 'Server is running!', 
        timestamp: new Date().toISOString() 
    });
});

export { app };
