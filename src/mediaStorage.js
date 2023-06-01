const defaults = require('lodash.defaults');
const Minio = require('minio');
const fetch = require('node-fetch');
const mime = require('mime');
const { hash } = require('./crypto/siphash');
const { info, isUrl, debug, error, isEmpty, normalizeUrl } = require('./utils');

const { MEDIA_STORAGE_CONF } = require('./constants');

const signUrl = async (url, config) => {
  try {
    const { S3, urlSignatureTtl } = defaults(config, MEDIA_STORAGE_CONF);
    const urlObj = new URL(url);

    const bucket = urlObj.pathname.split('/').filter(v => (v.length > 0)&&(v!== 'resources'))[1];
    const objectName = urlObj.pathname.split('/').filter(v => (v.length > 0)&&(v!== 'resources')).slice(2).join('/');
    debug(`[MEDIA:SIGN] Bucket: ${bucket}, Object name: ${objectName} Time: ${urlSignatureTtl}`);
    const s3Client = new Minio.Client(S3);
    return await (new Promise(
        (resolve, reject) => {
          s3Client.presignedGetObject(
            bucket,
            objectName,
            urlSignatureTtl,
            (err, presignedUrl) => {
              if (err) {
                error(err);
                reject(err);
              }
              resolve(presignedUrl);
            });
        })
    );
  } catch (e) {
    error(`Error during URL`, url, ` signing:`, e);
    throw e;
  }
};
const initStorage = function (config) {
    const { S3, host, port, defaultBucketName } = defaults(config, MEDIA_STORAGE_CONF);
    const s3Client = new Minio.Client(S3);

    const ensureBucket = (bucketName) => new Promise(
      (resolve, reject) => s3Client.bucketExists(
        bucketName,
        (err, exists) => {
          if (err) {
            error(`[MEDIA] Cant ensure bucket: ${bucketName}`)
            reject(err);
          } else {
            if (exists) {
              resolve(false);
            } else {
              info(`Bucket "${bucketName}" doesn't exists, creating it...`);
              s3Client.makeBucket(
                bucketName,
                S3.region || '',
                (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(true);
                  }
                },
              );

            }
          }
        },
      ),
    );


    const putAsync = async (objectName, streamOrBuffer, size, options) => {
      const { bucketName } = defaults(options, { bucketName: S3.bucketName });
      await ensureBucket(bucketName);
      debug(`[MEDIA:PUT] UPLOADING - ${bucketName}/${objectName} (${size} bytes)`);
      return new Promise(
        async (resolve, reject) => {
          s3Client.putObject(
            bucketName,
            objectName,
            streamOrBuffer,
            size,
            (err, etag) => {
              if (err) {
                reject(err);
              } else {
                debug(`[MEDIA:PUT] SUCCESS - ${bucketName}/${objectName} (${size} bytes) - ${etag}`);
                resolve(etag);
              }
            },
          );
        },
      );
    };
    const uploadAsync = async (data, options) => {
      if (isEmpty(data)) {
        return null;
      }
      const { bucketName, folder, extension, mediaType } = defaults(
        options,
        {
          bucketName: defaultBucketName,
          extension: null,
          mediaType: null,
          folder: null,
        },
      );
      await ensureBucket(bucketName);
      let payload;
      if (isUrl(data)) {
        const remoteUrl = normalizeUrl(data);
        try {
          payload = await (await fetch(remoteUrl)).buffer();
        } catch (e) {
          error(e);
          return data;
        }
      } else {
        payload = data;
      }
      const payloadHashDigest = hash(payload);
      const size = ((typeof payload) === 'string') ? Buffer.byteLength(payload, 'utf-8') : payload.length;
      const objectName = [
        ...(folder ? [folder.replace(/(^\/ | \/$)/, '')] : []),
        payloadHashDigest + (extension.replace(/^[.]?/ug, '.')),
      ].join('/');
      const url = [
        `${(port === 443) || (S3.useSSL) ? 'https' : 'http'}:/`,
        S3.endPoint || (
          (host || 'localhost') + port ? `:${port}` : ''
        ),
        bucketName,
        objectName,
      ].join('/');
      info(`[MEDIA:${process.pid}] Trying to register object with URL: ${url}`);
      /**
       {
        contentType: "application/gzip"
        lastModified: "2020-04-21T02:18:00.57902678Z"
        name: "20200313_040146_rsl10_cl.mrc.tar.gz"
        size: 18027817
      }
       **/
      try {
        const etag = await putAsync(objectName, payload, size, { bucketName });
        return {
          '@id': url,
          size,
          url,
          etag,
          hash: payloadHashDigest,
          mediaType: mime.getType(objectName) || 'application/text',
        };
      } catch (e) {
        throw e;
      }
    };
    return {
      signUrl,
      /**
       [Doc](https://docs.min.io/docs/javascript-client-api-reference.html#listObjects)

       The object is of the format:

       | Param | Type | Description |
       | --- | --- | --- |
       | obj.name | string | name of the object. |
       | obj.prefix | string | name of the object prefix. |
       | obj.size | number | size of the object. |
       | obj.etag | string | etag of the object. |
       | obj.lastModified | Date | modified time stamp. |
       **/
      listAsync: (prefix, options) => new Promise(
        (resolve, reject) => {
          const { recursive, bucketName } = defaults(
            options,
            {
              recursive: false,
              bucketName: defaultBucketName,
            },
          );

          const objectsStream = s3Client.listObjects(
            bucketName,
            prefix,
            recursive,
          );
          const buf = [];
          objectsStream.on('data', (obj) => buf.push({
            ...obj,
            lastModified: new Date(obj.lastModified),
          }));
          objectsStream.on('error', (err) => {
            error(err);
            reject(err);
          });
          objectsStream.on('end', () => resolve(buf));
        },
      ),
      /**
       [Doc](https://docs.min.io/docs/javascript-client-api-reference.html#listObjects)

       The object is of the format:

       | Param | Type | Description |
       | --- | --- | --- |
       | `stat.size` | *number* | size of the object. |
       | `stat.etag` | *string* | etag of the object. |
       | `stat.metaData` | *Javascript Object* | metadata of the object. |
       | `stat.lastModified` | *Date* | Last Modified time stamp. |
       **/
      statAsync: (prefix, options) => new Promise(
        (resolve, reject) => {
          const { bucketName } = defaults(
            options,
            { bucketName: defaultBucketName },
          );

          s3Client.statObject(
            bucketName,
            prefix,
            (err, stat) => {
              if (err) {
                error(err);
                reject(err);
              } else {
                resolve({
                  ...stat,
                  lastModified: new Date(stat.lastModified),
                });
              }
            },
          );
        },
      ),
      uploadAsync,
      putAsync,
      getStreamAsync: (objectName, options) => Promise(
        (resolve, reject) => {
          const { bucketName } = defaults(
            options,
            { bucketName: defaultBucketName },
          );
          s3Client.getObject(
            bucketName,
            objectName,
            (err, dataStream) => {
              if (err) {
                reject(err);
              } else {
                resolve(dataStream);
              }
            },
          );
        },
      ),
      getBufferAsync: (objectName, options) => new Promise(
        (resolve, reject) => {
          const { bucketName } = defaults(
            options,
            { bucketName: defaultBucketName },
          );
          let size = 0;
          const pool = [];

          s3Client.getObject(
            bucketName,
            objectName,
            (err, dataStream) => {
              if (err) {
                error(err);
                reject(err);
              } else {
                dataStream.on('data', (chunk) => {
                  size += chunk.length;
                  pool.push(chunk);
                });
                dataStream.on('end', () => {
                  resolve(Buffer.concat(pool));
                });
                dataStream.on('error', (err) => {
                  if (err) {
                    error(err);
                    reject(err);
                  }
                });
              }
            },
          );
        },
      ),
    };
  }
;

const s = initStorage(MEDIA_STORAGE_CONF);
module.exports = s;
