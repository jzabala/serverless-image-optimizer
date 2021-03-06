'use strict';
const AWS = require('aws-sdk');
const util = require('util');
const gm = require('gm').subClass({ imageMagick: true });
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

const s3 = new AWS.S3();

/*
I am encoding the size for the images in the folder name.
This regex helps identify the size patterns:
700x700
700x700_1800x1800
700x700-1800x1800
500x500_700x700-1800x1800
*/
const sizeRegex = /(\d+x\d+(-|_)?)+/;
const IMG_EXTENSION = 'PNG';

const SRC_FOLDER = 'originals/';
const DEST_FOLDER = 'processed/';
const DEST_BUCKET = process.env.BUCKET;

module.exports.handler = async event => {
  log('Reading options from event:\n', util.inspect(event, { depth: 5 }));
  const { s3: s3Obj } = event.Records[0];
  const srcBucket = s3Obj.bucket.name;
  const srcKey = decodeURIComponent(s3Obj.object.key.replace(/\+/g, ' '));

  const absoluteImagePath = `${srcBucket}/${srcKey}`;
  // Get the sizes encoded in the path of the image
  const sizeMatch = srcKey.match(sizeRegex);
  if (!sizeMatch)
    throw Error(`Size not specified for file: ${absoluteImagePath}`);

  log(`Getting image from S3: ${absoluteImagePath}`);
  const response = await s3
    .getObject({ Bucket: srcBucket, Key: srcKey })
    .promise();

  const sizes = sizeMatch[0].split(/-|_/);
  for (const size of sizes) {
    log(`Resizing image to size: ${size}`);
    const [width, height] = getWidthAndHeightFromSize(size);
    const resizedImage = await resizeImage({
      content: response.Body,
      IMG_EXTENSION,
      width,
      height,
    });

    log('Compressing image. Quality: 65-80');
    const compressedImage = await imagemin.buffer(resizedImage, {
      plugins: [imageminPngquant({ quality: '65-80' })],
    });

    const dstKey = srcKey.split(SRC_FOLDER)[1].replace(sizeRegex, size);
    log(`Uploading processed image to: ${dstKey}`);
    await s3
      .putObject({
        Bucket: DEST_BUCKET,
        Key: `${DEST_FOLDER}${dstKey}`,
        Body: compressedImage,
        ContentType: response.ContentType,
      })
      .promise();
  }
  log(`Successfully processed ${srcBucket}/${srcKey}`);
};

function log(...args) {
  console.log(...args);
}

function getWidthAndHeightFromSize(size) {
  return size.split('x');
}

function resizeImage({ width, height, imgExtension, content }) {
  return new Promise((resolve, reject) => {
    gm(content)
      .resize(width, height)
      .toBuffer(imgExtension, function(err, buffer) {
        if (err) reject(err);
        else resolve(buffer);
      });
  });
}
