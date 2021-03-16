import _, { isArray, pick, toLower } from 'lodash';
import URL from 'url-parse';
import SHA1 from "crypto-js/sha1";

const defaultImageTypes = ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'tiff', 'tif'];

function serializeObjectKeys(obj) {
    return _(obj)
        .toPairs()
        .sortBy(a => a[0])
        .map(a => a[1])
        .value();
}

function getQueryForCacheKey(url, useQueryParamsInCacheKey) {
    if (isArray(useQueryParamsInCacheKey)) {
        return serializeObjectKeys(pick(url.query, useQueryParamsInCacheKey));
    }
    if (useQueryParamsInCacheKey) {
        return serializeObjectKeys(url.query);
    }
    return '';
}

function generateCacheKey(url, useQueryParamsInCacheKey = true) {
    const parsedUrl = new URL(url, null, true);

    const pathParts = parsedUrl.pathname.split('/');

    // last path part is the file name
    const fileName = pathParts.pop();
    const filePath = pathParts.join('/');

    const parts = fileName.split('.');
    const fileType = parts.length > 1 ? toLower(parts.pop()) : '';
    const type = defaultImageTypes.includes(fileType) ? fileType : 'jpg';

    const cacheable = filePath + fileName + type + getQueryForCacheKey(parsedUrl, useQueryParamsInCacheKey);
    return SHA1(cacheable) + '.' + type;
}

function getHostCachePathComponent(url) {
    const {
        host
    } = new URL(url);

    return host.replace(/\.:/gi, '_').replace(/[^a-z0-9_]/gi, '_').toLowerCase()
      + '_' + SHA1(host);
}
/**
 * handle the resolution of URLs to local file paths
 * @param {String} url
 * @param {String} cacheLocation
 */
export function getImageFilePath(url, cacheLocation) {
    const hostCachePath = getHostCachePathComponent(url);
    const cacheKey = generateCacheKey(url);
    return `${cacheLocation}/${hostCachePath}/${cacheKey}`;
}
/**
 * 
 * @param {String} url
 */
export function getImageRelativeFilePath(url) {
    const hostCachePath = getHostCachePathComponent(url);
    const cacheKey = generateCacheKey(url);

    return `${hostCachePath}/${cacheKey}`;
}
/**
 * @param {String} url 
 * @param {Boolean} useQueryParamsInCacheKey  
 */
export function getCacheableUrl(url, useQueryParamsInCacheKey) {
    const parsedUrl = new URL(url, null, true);
    if (isArray(useQueryParamsInCacheKey)) {
        parsedUrl.set('query', pick(parsedUrl.query, useQueryParamsInCacheKey));
    }
    if (!useQueryParamsInCacheKey) {
        parsedUrl.set('query', {});
    }
    return parsedUrl.toString();
}
