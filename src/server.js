const express = require("express");
const fs = require("fs");
const app = express();

const port = 8000;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
})


app.get("/video", (req, res) => {
    // Ensure there is a range given for the video
    const range = req.headers.range;
    if(!range) {
        res.status(400).send("Requires range header");
    }
    
    // Get video stats
    const videoPath = "./videos/CR7.mp4";
    const videoSize = fs.statSync("./videos/CR7.mp4").size;
    
    // Parse Range
    // Example: "bytes=32324"
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, "")); // Replace all the non-digit characters with empty string
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

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

    // Create video read stream for this particular chunck
    const videoStream = fs.createReadStream(videoPath, {start, end});

    // Stream the video chuck to the client
    videoStream.pipe(res);
});

app.listen(port, () => console.log(`Server is running on port ${port}`))