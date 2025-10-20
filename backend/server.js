import express from 'express';
// require('dotenv').config();
import 'dotenv/config';
import connectToDB from './src/db/db.js';
import {app} from './app.js';


connectToDB()
.then(()=>{
    //write the server code here block said that connected is established
    const PORT = process.env.PORT || 4000;
    app.listen(PORT , ()=>{
        console.log(`Server is running on port ${PORT}`);
        //
        app.on('error', (err)=>{
            console.log(`Error while starting the server : ${err.message}`);
            process.exit(1);
        })
    })
})
.catch((err)=>{
    console.log(`Error while connecting to DB : ${err.message}`);
    process.exit(1);
})
