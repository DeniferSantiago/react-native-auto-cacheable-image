import React, { forwardRef, useState, useMemo, useEffect } from "react";
import {
    View,
    StyleSheet,
    ActivityIndicator,
    InteractionManager,
    ImageBackground,
    ActivityIndicatorProps,
    ImageBackgroundProps,
    ImageURISource,
    Platform
} from "react-native";
import _ from "lodash";
import { CacheManager } from "./CacheManager";
import { useNetInfo } from "@react-native-community/netinfo";
import { WrapperFS } from "./utils/fsUtils";
const defaultStyles = StyleSheet.create({
    image: {
        backgroundColor: "transparent"
    },
    loader: {
        backgroundColor: "transparent"
    },
    loaderPlaceholder: {
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center"
    }
});
const defaultOptions = {
    headers: {},
    ttl: 3600 * 24 * 14, // 60 * 60 * 24 * 14, // 2 weeks
    useQueryParamsInCacheKey: false,
    cacheLocation: WrapperFS.getCacheDir(),
    allowSelfSignedSSL: true // false,
};
const getImageProps = props => {
    return _.omit(props, [
        "source",
        "defaultSource",
        "fallbackSource",
        "LoadingIndicator",
        "activityIndicatorProps",
        "style",
        "useQueryParamsInCacheKey",
        "renderImage",
        "resolveHeaders"
    ]);
};
const getCacheManagerOptions = props => {
    return _.pick(props, _.keys(defaultOptions));
};
/**
 * @param {String} path
 */
const AddPathPrefix = path => `file://${path}`;
/**
 * @typedef {Object} ImageCacheableParams
 * @property {ImageURISource} defaultSource prop to display a background image while the source image is downloaded. This will work even in android, but will not display background image if there you set borderRadius on this component style prop
 * @property {ImageURISource} fallbackSource prop to set placeholder image. when source.uri is null or cached failed, the fallbackSource will be display.
 * @property {String} cacheLocation
 * @property {String[] | boolean} useQueryParamsInCacheKey string[]|boolean an array of keys to use from the source. uri query string or a bool value stating whether to use the entire query string or not. (default: false)
 * @property {ActivityIndicatorProps} activityIndicatorProps props for the ActivityIndicator that is shown while the image is downloaded.
 * @property {(props: ActivityIndicatorProps) => JSX.Element} loadingIndicator component prop to set custom ActivityIndicator
 * @property {(props: ImageBackgroundProps) => JSX.Element} renderImage
 * @property {() => Object} resolveHeaders function when provided, the returned object will be used as the headers object when sending the request to download the image. (default: () => Promise.resolve({}))
 */
/**
 * @param {ImageCacheableParams & ImageBackgroundProps} props
 * @param {React.MutableRefObject<ImageBackground>} ref
 */
const CacheableImageComponent = (props, ref) => {
    const [lastFetched, setLastFetched] = useState();
    const [isCacheable, setIsCacheable] = useState(true);
    const [cachedImagePath, setCachedImagePath] = useState();
    const { isConnected } = useNetInfo();
    const imageProps = getImageProps(props);
    const managerOptions = getCacheManagerOptions(props);
    const [mOptions, setMOptions] = useState(managerOptions ?? {});
    const cacheManager = useMemo(() => {
        console.log("New Instance");
        return new CacheManager({ ...mOptions });
    }, [mOptions]);
    const { source: originSource } = props;
    useEffect(() => {
        const changed = !_.isEqual(managerOptions, mOptions);
        if (changed) setMOptions(managerOptions);
    }, [managerOptions]);
    useEffect(() => {
        let isMounted = true;
        const processSource = async source => {
            const url = source?.uri;
            try {
                const cachedPath = await cacheManager.downloadAndCacheUrl(
                    url,
                    managerOptions
                );
                if (isMounted) {
                    setCachedImagePath(cachedPath);
                    setLastFetched(url);
                }
            } catch (e) {
                if (isMounted) {
                    setIsCacheable(false);
                    setCachedImagePath(null);
                }
            }
        };
        const interaction = InteractionManager.runAfterInteractions(() => {
            if (isConnected && originSource?.uri !== lastFetched) {
                processSource(originSource);
            }
        });
        return () => {
            isMounted = false;
            interaction.cancel();
        };
    }, [originSource, isConnected]);
    const renderImage = args => {
        if (_.isFunction(props.renderImage)) {
            props.renderImage(args);
        }
        return <ImageBackground imageStyle={args.style} ref={ref} {...args} />;
    };
    const renderLoader = () => {
        const imageStyle = [props.style, defaultStyles.loaderPlaceholder];

        const activityIndicatorProps = _.omit(
            props.activityIndicatorProps ?? {
                animating: true,
                size: "small",
                color: "#999"
            },
            ["style"]
        );
        console.log(activityIndicatorProps);
        const activityIndicatorStyle =
            props.activityIndicatorProps?.style ?? defaultStyles.loader;

        const LoadingIndicator = props.loadingIndicator;

        const source = props.defaultSource;

        // if the imageStyle has borderRadius it will break the loading image view on android
        // so we only show the ActivityIndicator
        if (
            !source ||
            (Platform.OS === "android" &&
                StyleSheet.flatten(imageStyle).borderRadius)
        ) {
            if (LoadingIndicator) {
                return (
                    <View style={[imageStyle, activityIndicatorStyle]}>
                        <LoadingIndicator {...activityIndicatorProps} />
                    </View>
                );
            }
            return (
                <ActivityIndicator
                    {...activityIndicatorProps}
                    style={[imageStyle, activityIndicatorStyle]}
                />
            );
        }
        // otherwise render an image with the defaultSource with the ActivityIndicator on top of it
        return renderImage({
            ...imageProps,
            style: imageStyle,
            key: source.uri,
            source,
            children: LoadingIndicator ? (
                <View style={[imageStyle, activityIndicatorStyle]}>
                    <LoadingIndicator {...activityIndicatorProps} />
                </View>
            ) : (
                <ActivityIndicator
                    {...activityIndicatorProps}
                    style={activityIndicatorStyle}
                />
            )
        });
    };
    return renderLoader();
    /*if (isCacheable && !cachedImagePath) {
        console.log("Set Loader");
        return renderLoader();
    }*/
    const style = props.style ?? defaultStyles.image;
    const source =
        isCacheable && cachedImagePath
            ? { uri: AddPathPrefix(cachedImagePath) }
            : originSource;
    if (props.fallbackSource && !cachedImagePath) {
        console.log("Set Fallback");
        return renderImage({
            ...props,
            key: `${props.key || source.uri}error`,
            style,
            source: props.fallbackSource
        });
    }
    console.log("Set CachedImage");
    return renderImage({
        ...props,
        key: props.key ?? source.uri,
        style,
        source
    });
};
/**
 * Image component that caches the uri automatically, if the uri had previously been cached it will be loaded from the cache
 */
export const CacheableImage = forwardRef(CacheableImageComponent);
