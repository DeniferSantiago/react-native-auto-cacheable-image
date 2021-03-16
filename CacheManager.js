import { WrapperFS } from "./utils/fsUtils";
import {
    getCacheableUrl,
    getImageFilePath,
    getImageRelativeFilePath
} from "./utils/pathUtils";
import _ from "lodash";
import MemoryCache from "react-native-async-storage-cache/MemoryCache";
const defaultOptions = {
    headers: {},
    ttl: 3600 * 24 * 14, // 60 * 60 * 24 * 14, // 2 weeks
    useQueryParamsInCacheKey: false,
    cacheLocation: WrapperFS.getCacheDir(),
    allowSelfSignedSSL: true // false,
};
/**
 * it is considered cacheable if it is a url
 * @param {String} url
 */
function isCacheable(url) {
    return (
        _.isString(url) &&
        (_.startsWith(url.toLowerCase(), "http://") ||
            _.startsWith(url.toLowerCase(), "https://"))
    );
}
/**
 * @param {String} url
 * @param {Object} options
 * @param {(path: String) => Promise<void>} getCachedFile
 */
async function cacheUrl(url, options, getCachedFile) {
    if (!isCacheable(url)) {
        return Promise.reject(new Error("Url is not cacheable"));
    }
    // allow CachedImage to provide custom options
    _.defaults(options, defaultOptions);
    // cacheableUrl contains only the needed query params
    const cacheableUrl = getCacheableUrl(url, options.useQueryParamsInCacheKey);
    // note: urlCache may remove the entry if it expired so we need to remove the leftover file manually
    try {
        const fileRelativePath = await MemoryCache.get(cacheableUrl);
        if (!fileRelativePath) {
            // console.log('ImageCacheManager: url cache miss', cacheableUrl);
            throw new Error("URL expired or not in cache");
        }
        // console.log('ImageCacheManager: url cache hit', cacheableUrl);
        const cachedFilePath = `${options.cacheLocation}/${fileRelativePath}`;
        const exists = await WrapperFS.exists(cachedFilePath);
        if (exists) {
            return cachedFilePath;
        } else {
            throw new Error(
                "file under URL stored in url cache doesn't exists"
            );
        }
    } catch (e) {
        console.log({ ...e, where: "cacheUrl" });
        const fileRelativePath_1 = getImageRelativeFilePath(cacheableUrl);
        const filePath = `${options.cacheLocation}/${fileRelativePath_1}`;
        await WrapperFS.deleteFile(filePath);
        getCachedFile(filePath);
        await MemoryCache.set(cacheableUrl, fileRelativePath_1, options.ttl);
        return filePath;
    }
}
export class CacheManager {
    constructor(options = defaultOptions) {
        _.defaults(options, defaultOptions);
        this.options = options;
    }
    /**
     * download an image and cache the result according to the given options
     * @param {String} url
     * @param {Object} options
     */
    downloadAndCacheUrl(url, options = {}) {
        return cacheUrl(url, options, filePath =>
            WrapperFS.downloadFile(url, filePath, options.headers)
        );
    }
    /**
     * seed the cache for a specific url with a local file
     * @param {String} url
     * @param {String} seedPath
     * @param options
     */
    seedAndCacheUrl(url, seedPath, options = {}) {
        return cacheUrl(url, options, filePath =>
            WrapperFS.copyFile(seedPath, filePath)
        );
    }
    /**
     * delete the cache entry and file for a given url
     * @param {String} url
     * @param {Object} options
     */
    async deleteUrl(url, options = {}) {
        try {
            if (!isCacheable(url)) {
                throw new Error("Url is not cacheable");
            }
            _.defaults(options, defaultOptions);
            const cacheableUrl = getCacheableUrl(
                url,
                options.useQueryParamsInCacheKey
            );
            const filePath = getImageFilePath(
                cacheableUrl,
                options.cacheLocation
            );
            // remove file from cache
            await MemoryCache.remove(cacheableUrl);
            return await WrapperFS.deleteFile(filePath);
        } catch (e) {
            throw e;
        }
    }
    /**
     * delete all cached file from the filesystem and cache
     */
    async clearCache() {
        await MemoryCache.flush();
        return await WrapperFS.cleanDir(this.options.cacheLocation);
    }
    /**
     * return info about the cache, list of files and the total size of the cache
     */
    getCacheInfo() {
        return WrapperFS.getDirInfo(this.options.cacheLocation);
    }
}
