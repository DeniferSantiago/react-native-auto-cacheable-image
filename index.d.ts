import * as ReactNative from "react-native";
import * as React from "react"

declare module "react-native-auto-cacheable-image" {
  namespace CacheableImage {
    interface Image extends ReactNative.ImageBackgroundProps {
      /**
       * props for the ActivityIndicator that is shown while the image is downloaded.
       */
      activityIndicatorProps: ReactNative.ActivityIndicatorProps
      /** 
       * component prop to set custom ActivityIndicator 
       */
      loadingIndicator: React.Component<any>
      /** 
       * function when provided, the returned object will be used as the headers object 
       * when sending the request to download the image. (default: () => Promise.resolve({})) 
       */
      resolveHeaders: Promise<{}>
      /**
       * array|bool an array of keys to use from the source.
       * uri query string or a bool value stating whether to use the entire query string or not. (default: false)
       */
      useQueryParamsInCacheKey: string[] | boolean
      /**
       * if true, this CacheableImage instance will not use the context of a CacheProvider
       */
      ignoreContext: boolean
      /**
       * string allows changing the root directory to use for caching.
       * The default directory is sufficient for most use-cases.
       * Images in this directory may be purged by Android automatically to free up space.
       * Use ImageCacheProvider.LOCATION.BUNDLE if the cached images are critical
       * (you will have to manage cleanup manually).
       * (default: ImageCacheProvider.LOCATION.CACHE)
       */
      cacheLocation: string
      /**
       * prop to display a background image while the source image is downloaded.
       * This will work even in android, but will not display background image
       * if there you set borderRadius on this component style prop
       */
      defaultSource: ReactNative.ImageURISource
      /**
       * prop to set placeholder image. when source.uri is null or cached failed, the fallbackSource will be display.
       */
      fallbackSource: ReactNative.ImageURISource
    }
    interface CacheOptions  {
      /** an object to be used as the headers when sending the request for the url */
      headers: object
      /** the number of seconds each url will stay in the cache. default 2 weeks */
      ttl: number
      /**
       * array|bool an array of keys to use from the source.
       * uri query string or a bool value stating whether to use the entire query string or not. (default: false)
       */
      useQueryParamsInCacheKey: string[] | boolean
      /**
       * the root directory to use for caching, corresponds to CachedImage prop of same name, 
       * defaults to system cache directory
       */
      cacheLocation: string
    }
    //From react-native-fs
    type CacheStat = {
      name: string | undefined // The name of the item TODO: why is this not documented?
      path: string // The absolute path to the item
      size: string // Size in bytes
      mode: number // UNIX file mode
      ctime: number // Created date
      mtime: number // Last modified date
      originalFilepath: string // In case of content uri this is the pointed file path, otherwise is the same as path
      isFile: () => boolean // Is the path just a file?
      isDirectory: () => boolean // Is the path a directory?
    }
    interface CacheInfo {
      files: CacheStat[]
      size: number
    }
    class CacheManager {
      /**
       * create new CacheManager instance
       * @param options cache options for this instance
       */
      constructor(options: CacheOptions)
      /** download an image and cache the result according to the given options */
      downloadAndCacheUrl(url: String, options: CacheOptions ): Promise<String>

      /** Delete the cached image corresponding to the given url */
      deleteUrl(urls: string, options?: CacheOptions): Promise<void>
       
      /**
      * Seed the cache of a specified url with a local image
      * Handy if you have a local copy of a remote image, e.g. you just uploaded local to url.
      */
      seedAndCacheUrl(url: string, seedPath: string, options?: CacheOptions): Promise<String>
       
      /**
       * Clear the entire cache.
       */
      clearCache(): Promise<void>

      /**
       * Return info about the cache, list of files and the total size of the cache.
       */
      getCacheInfo(): Promise<CacheInfo>
      // LOCATION : {
      //   CACHE: string
      //   BUNDLE: string
      // }
    }
    class CacheContextValue {
      /**
       * create context value for CacheProvider
       * @param manager The CacheManager to be used in the CacheableImage components under the provider
       */
      constructor(manager: CacheManager)
      /**
       * @param url if this url was previously cached by some CacheableImage component it will return the url from the cache immediately
       */
      getCached(url: String) : String
      /**
       * @param url url to be registered
       * @param cachedPath cached file path
       */
      setCached(url: String, cachedPath: String) : void
    }
  }
  export class CacheableImage extends React.Component<CacheableImage.Image, any> {}
  export const CacheManager: CacheableImage.CacheManager
  export const CacheContextValue: CacheableImage.CacheContextValue
  export const CacheProvider: React.Context<CacheableImage.CacheContextValue>
}
