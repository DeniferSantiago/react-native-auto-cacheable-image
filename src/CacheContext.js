import React from "react";
import { CacheManager } from "./CacheManager";
import _ from "lodash";
export class CacheContextValue {
    #loaded;
    /**
     * @param {CacheManager} manager
     */
    constructor(manager) {
        this.manager = manager ?? new CacheManager();
        this.#loaded = {};
    }
    getCached(url) {
        if (_.isString(url)) return this.#loaded[url];
        throw new Error("url argument must be string");
    }
    setCached(url, cachedPath) {
        if (_.isString(url)) {
            if (_.isString(cachedPath)) {
                return this.#loaded[url];
            }
            throw new Error("cachedPath argument must be string");
        }
        throw new Error("url argument must be string");
    }
}
export const CacheContext = React.createContext(new CacheContextValue());
