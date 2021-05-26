// This is not an optimal way of uploading videos on mongoDB, I'm just trying and having fun here.

require("dotenv").config()
const express = require("express");
const mongodb = require("mongodb")
const fs = require("fs");
const app = express();

const url = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@video-streaming-server.bzjfb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

app.get("/upload-video", (req, res) => {
    mongodb.MongoClient.connect(url, (error, client) => {
        if(error) {
            res.json(error);
            return;
        }
        const db = client.db("videos");
        const bucket = new mongodb.GridFSBucket(db);
        const videoUploadStream = bucket.openUploadStream("CR7");
        const videoReadStream = fs.createReadStream("./videos/CR7.mp4");
        videoReadStream.pipe(videoUploadStream);
        res.status(200).send("Video Uploaded..")
    })
} )

app.get("/video", (req, res) => {
    mongodb.MongoClient.connect(url, (error, client) => {
        if(error) {
            res.json(error);
            return;
        }
        
        // Ensure there is a range given for the video
        const range = req.headers.range;
        if(!range) {
            res.status(400).send("Requires range header");
        }

        const db = client.db("videos")

        // GridFS Collection
        db.collection("fs.files").findOne({}, (err, video) => {
            if(!video) {
                res.status(404).send("No Video Uploaded!");
                return;
            }

            // Create response headers
            const videoSize = video.length;
            const start = Number(range.replace(/\D/g, "")); // Replace all the non-digit characters with empty string
            const end = videoSize - 1;

            // Create header
            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4"
            }

            // HTTP status 206 for partial content
            res.writeHead(206, headers);

            const bucket = new mongodb.GridFSBucket(db);
            const downloadStream = bucket.openDownloadStreamByName("CR7", {
                start
            })

            // Pipe video to response
            downloadStream.pipe(res);
        })
    })
} )

app.listen(port, () => console.log(`Server is running on port ${port}`))