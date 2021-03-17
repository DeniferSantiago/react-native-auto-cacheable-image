import React from "react";
import { CacheManager } from "./CacheManager";
import _ from "lodash";
var loaded = {};
/**
 * create value to use in provider
 * @param {CacheManager} manager The CacheManager to be used in the CacheableImage components under the provider
 * @param {Boolean} enabled
 */
export const createProviderValue = (manager, enabled = true) => {
    return {
        manager,
        loaded,
        enabled,
        /**
         * @param {String} url if this url was previously cached by some CacheableImage component it will return the url from the cache immediately
         * @returns {String} cachedPath
         */
        getCached(url) {
            if (_.isString(url)) return loaded[url];
            throw new Error("url argument must be string");
        },
        /**
         * @param {String} url url to be registered
         * @param {String} cachedPath cached file path
         * @returns {void}
         */
        setCached: (url, cachedPath) => {
            if (_.isString(url)) {
                if (_.isString(cachedPath)) {
                    const newVal = { ...loaded };
                    newVal[url] = cachedPath;
                    loaded = newVal;
                }
                throw new Error("cachedPath argument must be string");
            }
            throw new Error("url argument must be string");
        }
    };
};
export const CacheContext = React.createContext(
    createProviderValue(new CacheManager(), false)
);
