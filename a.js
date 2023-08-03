const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
var Stream = require('stream').Transform;
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);



let Url = "https://www.youtube.com/watch?v=NJUHrNa8fWw&list=RDMM&index=2&ab_channel=MIRO"

ytdl.getInfo(Url).then(data => {
  let mp3Path = path.resolve(__dirname, data.videoDetails.videoId + '.mp3');
  console.log(`Downloading ${data.videoDetails.title}`);
  const start = Date.now();
  let stream = ytdl(Url, {
      quality: 'highestaudio',
  });
  ffmpeg(stream)
  .audioBitrate(128)
  .save(mp3Path)
  .on('end', () => {
      console.log(`Done for ${(Date.now() - start) / 1000}s`);
  })
  .on('progress', p => {
    let kb = p.targetSize;
    readline.cursorTo(process.stdout, 0);
    if (kb < 1024) {
      process.stdout.write(`${p.targetSize} kb downloaded`);
    } else {
      process.stdout.write(`${(p.targetSize / 1024).toFixed(2)} mb downloaded`);
    }
  })
  .on('error', console.log);
});