const http = require('http');
const fs = require('fs');
const path = require('path');
const nodeID3 = require('node-id3');
const readline = require('readline');
var Stream = require('stream').Transform;
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const getPath = (p) => path.resolve(__dirname, "public", ...p);

const mimeTypes = {
    ".mp4": "video/mp4",
    ".mp3": "video/mp3",
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".png": "image/png",
    ".png": "image/png",
    ".svg": "image/svg+xml",
}

function serveStatic(staticPath, res) {
    console.log(staticPath)
    res.setHeader('Content-Type', mimeTypes[path.parse(staticPath).ext]);
    res.write(fs.readFileSync(staticPath));
}

async function routes(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const url = req.url;
    const requests = url.split("/").filter(Boolean);
    console.log(url, requests)
    
    if (requests.length === 0) {
        serveStatic(getPath(["landingPage.html"]), res)
        
        return res.end();
    }
    
    if (fs.existsSync(getPath(requests.slice(-1)))) {
        serveStatic(getPath(requests.slice(-1)), res);
        
        return res.end();
    }
    

























    if (url === '/' || url .startsWith('/ready/')) {
        const form = fs.readFileSync(path.resolve(__dirname, 'assets', './form.html'));
		res.setHeader('Content-Type', 'text/html');
        res.write(form);
        return res.end();
    }
    if (url.startsWith('/downloadFileHtml/')) {
        const html = fs.readFileSync(path.resolve(__dirname, 'assets', './download.html'));
		res.setHeader('Content-Type', 'text/html');
        res.write(html);
        return res.end();
    }

    if (url.startsWith('/getData')) {
        let Url = url.replace('/getData/', '');
        return ytdl.getInfo(Url).then(data => {
            res.write(JSON.stringify({
                song: data.videoDetails.media.song,
                artist: data.videoDetails.media.artist,
                title: data.videoDetails.title
            }));
            res.end();
            process.env.isDownlading = true;
            // console.log(`\nDownloading ${data.videoDetails.title}`);
            // const start = Date.now();
            process.env.mp3Path = path.resolve(__dirname, data.videoDetails.videoId + '.mp3');
            let stream = ytdl(Url, {
                quality: 'highestaudio',
            });
            ffmpeg(stream)
            .audioBitrate(128)
            .save(process.env.mp3Path)
            .on('end', () => {
                // console.log(`Done for ${(Date.now() - start) / 1000}s`);
                process.env.isDownlading = false;
            })
            .on('error', console.log);
        });
        
    }
    
    if (url.startsWith('/download/')) {
        let urlData = url.replace('/download/', '');

        const data = new URLSearchParams(urlData);
 
        
        const tags = {
            title: data.get('song'),
            artist: data.get('artist'),
            album : data.get('album'),
            genre: data.get('genre'),
        }

        await new Promise((resolve, reject) => {
            if (process.env.isDownlading === 'false') resolve();
            
            let interval = setInterval(() => {
                if (process.env.isDownlading === 'false') {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        })
        nodeID3.write(tags, process.env.mp3Path);
        res.statusCode = 302;
        res.setHeader('Location', '/ready/' + encodeURI(data.get('fileName')));
        return res.end();
    }

    if (url === '/getDownloadedFile') {
        if (!fs.existsSync(process.env.mp3Path)) return res.end();

        res.write(fs.readFileSync(process.env.mp3Path));
        fs.unlinkSync(process.env.mp3Path);
        return res.end();
    }
 
    res.end();
}

const server = http.createServer(routes);
server.listen(process.env.PORT || +process.argv[2] || 3000);
server.on('error', console.log)