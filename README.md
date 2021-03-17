# react-native-auto-cacheable-image

Image component that automatically caches the image for later use, plus a cache manager is provided

## Installation

    npm i react-native-auto-cacheable-image @react-native-community/netinfo react-native-fs
    - or -
    yarn add react-native-auto-cacheable-image @react-native-community/netinfo react-native-fs

We use [`react-native-fs`](https://github.com/itinance/react-native-fs) to handle file system access in this package.

We use [`@react-native-community/netinfo`](https://github.com/react-native-netinfo/react-native-netinfo) to manage the device's internet connection.

### Network Status - Android only
Add the following line to your android/app/src/AndroidManifest.xml

    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

## Usage

```jsx
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useMemo, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import {
  CacheableImage,
  CacheManager,
  CacheProvider,
  createProviderValue,
} from 'react-native-auto-cacheable-image';
const image1 =
  'https://www.pixelstalk.net/wp-content/uploads/2016/07/4k-Images-Free-Download.jpg';
const image2 =
  'https://th.bing.com/th/id/R8d639b6bd4c730f02209c26e1f712fce?rik=mHKP47o8%2bOtzRA&riu=http%3a%2f%2fwallpaperheart.com%2fwp-content%2fuploads%2f2018%2f08%2f4k-wallpapers-for-pc-8.jpg&ehk=XDnFZulFK0kyBglghH6ntQdalyZmFlTj0H5EdHOp1Vc%3d&risl=&pid=ImgRaw';
const image3 =
  'https://th.bing.com/th/id/R2654a6b6238b044b3e2653539e9c6f17?rik=b39aO9PTE%2bl%2b3g&riu=http%3a%2f%2fwallpaperheart.com%2fwp-content%2fuploads%2f2018%2f08%2f4k-wallpaper-for-pc-3.jpg&ehk=B8z0o5l%2b1nis%2f02law%2b4l12C2Gv0IcHW2Vo0tvCYDPs%3d&risl=&pid=ImgRaw';
const contextValue = createProviderValue(new CacheManager());
const App = () => {
  const manager = useMemo(() => new CacheManager(), []);
  const [duplicate, setDuplicate] = useState(false);
  const ClearAll = async () => {
    await manager.clearCache();
  };
  const GetInfo = async () => {
    const info = await manager.getCacheInfo();
    console.log(info);
  };
  const DeleteFirst = async () => {
    await manager.deleteUrl(image1);
  };
  return (
    <CacheProvider value={{...contextValue}}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <Text style={styles.text}>Hello</Text>
          <CacheableImage
            style={styles.image}
            source={{uri: image1}}
            defaultSource={require('./nocover.jpg')}
            fallbackSource={require('./nocover.jpg')}
          />
          {duplicate && (
            <CacheableImage
              style={styles.image}
              source={{uri: image1}}
              defaultSource={require('./nocover.jpg')}
              fallbackSource={require('./nocover.jpg')}
            />
          )}
          <CacheableImage
            style={styles.image}
            source={{uri: image2}}
            defaultSource={require('./nocover.jpg')}
            fallbackSource={require('./nocover.jpg')}
            />
            <CacheableImage
            style={styles.image}
            source={{uri: image3}}
            defaultSource={require('./nocover.jpg')}
            fallbackSource={require('./nocover.jpg')}
          />
          <Pressable onPress={ClearAll} style={styles.button}>
            <Text style={styles.text}>Clean cache</Text>
          </Pressable>
          <Pressable onPress={GetInfo} style={styles.button}>
            <Text style={styles.text}>Info Cache</Text>
          </Pressable>
          <Pressable onPress={DeleteFirst} style={styles.button}>
            <Text style={styles.text}>Remove First Cache</Text>
          </Pressable>
          <Pressable
            onPress={() => setDuplicate(d => !d)}
            style={styles.button}>
            <Text style={styles.text}>Toggle Duplicate First</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </CacheProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  image: {
    marginBottom: 20,
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  text: {
    color: 'white',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: '#3363ba',
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default App;
```

## API

This package exposes 4 apis:
```jsx
const {
    CacheableImage,// react-native component that is a drop-in replacement for your react-native `BackgroundImage` component
    CacheManager, // the logic behind cache machanism - ttl, fs, url resolving etc. 
    CacheProvider, //context provider to be used by all CacheableImage components
    createProviderValue, //function that creates the value to be assigned to CacheProvider
} = require('react-native-auto-cacheable-image');
```

### CacheManager
This is where all the cache magic takes place.
The API usually takes a *URL* and a set of [`CacheOptions`](#cacheoptions).

#### `new CacheManager().downloadAndCacheUrl(url: String, options: CacheOptions): Promise<String>`
Check the cache for the the URL (after removing fixing the query string according to `ImageCacheManagerOptions.useQueryParamsInCacheKey`).
If the URL exists in cache and is not expired, resolve with the local cached file path.
Otherwise, download the file to the cache folder, add it to the cache and then return the cached file path.

#### `new CacheManager().seedAndCacheUrl(url: String, seedPath: String, options: CacheOptions): Promise<String>`
Check the cache for the the URL (after removing fixing the query string according to `CacheOptions.useQueryParamsInCacheKey`).
If the URL exists in cache and is not expired, resolve with the local cached file path.
Otherwise, copy the seed file into the cache folder, add it to the cache and then return the cached file path.

#### `new CacheManager().deleteUrl(url: String, options: CacheOptions): Promise<void>`
Removes the cache entry for the URL and the local file corresponding to it, if it exists.

#### `new CacheManager().clearCache(): Promise<void>`
Clear the URL cache and delete files in the default cache folder or the one specified in the current instance (as stated in the `CacheOptions.cacheLocation`)

#### `new CacheManager().getCacheInfo(): Promise<CacheInfo>`
Returns info about the cache, list of files and the total size of the cache.


### CacheableImage
`CacheableImage` is a drop in replacement for the `BackgroundImage` component that will attempt to cache remote URLs for better performance.  
It's main use is to hide the cache layer from the user and provide a simple way to cache images.  
`CacheableImage` uses an instance of `CacheManager` to interact with the cache.
```jsx
<CacheableImage
    style={styles.image}
    source={{uri: 'https://example.com/path/to/your/image.jpg'}}
    defaultSource={require('./nocover.jpg')}
/>
```

##### Props
* `renderImage` - a function that returns a component, used to override the underlying `BackgroundImage` component.
* `activityIndicatorProps` - props for the `ActivityIndicator` or `loadingIndicator` that is shown while the image is downloaded.
* `defaultSource` - prop to display a background image while the source image is downloaded. This will work even in android, but will not display background image if there you set borderRadius on this component style prop
* `loadingIndicator` - _component_ prop to set custom `ActivityIndicator`.
* `ignoreContext` - flag that indicates whether to ignore the context and use its own `CacheManager` instance in the `CacheableImage`.
* `fallbackSource` - prop to set placeholder image. When `source.uri` is null or cached failed, the `fallbackSource` will be display.
* any of the `CacheOptions` props - customize the `CacheManager` for this specific `CacheableImage` instance.

### CacheProvider and createProviderValue
`CacheProvider` provides context to be used by all CacheableImage components. `createProviderValue` is a function that should be used to create the value provided to `CacheProvider`.
```jsx
import {
  CacheManager,
  CacheProvider,
  createProviderValue,
} from 'react-native-auto-cacheable-image';
const contextValue = createProviderValue(new CacheManager());
const App = () => {
  return (
    <CacheProvider value={{ ...contextValue }}>
      <MyAppRoot />
    </CacheProvider>
  );
}
```
## Some types
### CacheOptions
A set of options that are provided to the `CacheManager` and provide ways to customize it to your needs.

```jsx
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
     * the root directory to use for caching, corresponds to CacheableImage prop of same name, 
     * defaults to system cache directory
     */
    cacheLocation: string
}
```

### CacheInfo
contains the current cache information returned by `getCacheInfo()`.

```jsx
interface CacheInfo {
    files: CacheStat[] // CacheStat array representing information about each file in the cache directory
    size: number // total cache size
}
```
### CacheStat
Show information about a file.

```jsx
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
```

## Contributing

Please read [CONTRIBUTING.md] for details on our code of conduct, and the process for submitting pull requests to us.
