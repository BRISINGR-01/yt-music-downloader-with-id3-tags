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

const mp3Path = path.resolve(__dirname, 'mp3.mp3')



async function routes(req, res) {
    const url = req.url;
    // console.log(url);
    if (url.endsWith('ico')) {
        res.setHeader('Content-Type', 'favicon/ico');
        res.write(fs.readFileSync(path.resolve(__dirname, 'favicon.ico')));
        return res.end();
    }
    if (url === '/reverse.png') {
        res.setHeader('Content-Type', 'image/png');
        res.write(fs.readFileSync(`${__dirname}${path.sep}reverse.png`));
        return res.end();
    }
    if (url === '/' || url .startsWith('/ready/')) {
        const form = fs.readFileSync(path.resolve(__dirname, './form.html'));
		res.setHeader('Content-Type', 'text/html');
        res.write(form);
        return res.end();
    }
    if (url.startsWith('/downloadFileHtml/')) {
        const html = fs.readFileSync(path.resolve(__dirname, './download.html'));
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
            
            let stream = ytdl(Url, {
                quality: 'highestaudio',
            });
            ffmpeg(stream)
            .audioBitrate(128)
            .save(mp3Path)
            // .on('progress', p => {
            //     readline.cursorTo(process.stdout, 0);
            //     process.stdout.write(`${p.targetSize}kb downloaded`);
            // })
            .on('end', () => {
                process.env.isDownlading = false;
            });
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
        nodeID3.write(tags, mp3Path);
        res.statusCode = 302;
        res.setHeader('Location', '/ready/' + encodeURI(data.get('fileName')));
        return res.end();
    }

    if (url === '/getDownloadedFile') {
        const mp3Path = path.resolve(__dirname, 'mp3.mp3')

        res.write(fs.readFileSync(mp3Path));
        return res.end();
    }
 
    res.end();
}

const server = http.createServer(routes);
server.listen(3000);
server.on('error', console.log)