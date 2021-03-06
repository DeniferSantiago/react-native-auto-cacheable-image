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
import { CacheManager, IsCacheable } from "./CacheManager";
import { useNetInfo } from "@react-native-community/netinfo";
import { WrapperFS } from "../utils/fsUtils";
const defaultStyles = StyleSheet.create({
    image: {
        backgroundColor: "transparent"
    },
    loader: {
        backgroundColor: "transparent",
        ...StyleSheet.absoluteFillObject
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
    allowSelfSignedSSL: false // false,
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
 * @param {Number} width default 16 (small size)
 * @param {Number} height default 16 (small size)
 */
const getLoaderSize = (width = 16, height = 16) => {
    if (!_.isNumber(width)) width = 16;
    if (!_.isNumber(height)) height = 16;
    const maxSize = 80;
    const min = Math.min(width, height);
    return min > maxSize + 5 ? maxSize : min - 5;
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
 * @property {Boolean} showLoader prop that specifies whether to display the loading indicator
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
    const [cachedImagePath, setCachedImagePath] = useState();
    const { isInternetReachable } = useNetInfo();
    const imageProps = getImageProps(props);
    const [isCacheable, setIsCacheable] = useState(() => {
        return IsCacheable(props.source?.uri);
    });
    const managerOptions = getCacheManagerOptions(props);
    const [mOptions, setMOptions] = useState({
        ...defaultOptions,
        ...managerOptions
    });
    const cacheManager = useMemo(() => new CacheManager(mOptions), [mOptions]);
    const { source: originSource } = props;
    useEffect(() => {
        const changed = !_.isEqual(
            { ...defaultOptions, ...managerOptions },
            mOptions
        );
        if (changed) setMOptions({ ...defaultOptions, ...managerOptions });
    }, [managerOptions]);
    useEffect(() => {
        let isMounted = true;
        const processSource = async source => {
            const url = source?.uri;
            try {
                var cachedPath = await cacheManager.downloadAndCacheUrl(url);
                if (isMounted) {
                    setCachedImagePath(cachedPath);
                    setLastFetched(url);
                }
            } catch (e) {
                console.log(e);
                if (isMounted) {
                    setIsCacheable(false);
                    setCachedImagePath(null);
                }
            }
        };
        const interaction = InteractionManager.runAfterInteractions(() => {
            if (originSource?.uri !== lastFetched) {
                processSource(originSource);
            }
        });
        return () => {
            isMounted = false;
            interaction.cancel();
        };
    }, [originSource, isInternetReachable, cacheManager, lastFetched]);
    /**@param {ImageBackgroundProps} args*/
    const renderImage = args => {
        if (_.isFunction(props.renderImage)) {
            props.renderImage(args);
        }
        const { borderRadius } = StyleSheet.flatten(args.style);
        return (
            <ImageBackground
                imageStyle={{ borderRadius }}
                ref={ref}
                {...args}
            />
        );
    };
    /**@param {Boolean} showLoader */
    const renderLoader = (showLoader = true) => {
        const imageStyle = [defaultStyles.loaderPlaceholder, props.style];
        const flattenStyle = StyleSheet.flatten(imageStyle);
        const activityIndicatorProps = _.omit(
            props.activityIndicatorProps ?? {
                animating: true,
                size: getLoaderSize(flattenStyle.width, flattenStyle.height),
                color: "#999"
            },
            ["style"]
        );
        const activityIndicatorStyle =
            props.activityIndicatorProps?.style ?? defaultStyles.loader;

        const LoadingIndicator = props.loadingIndicator;

        const source = props.defaultSource;

        // if the imageStyle has borderRadius it will break the loading image view on android
        // so we only show the ActivityIndicator
        if (
            showLoader &&
            (!source ||
                (Platform.OS === "android" && flattenStyle.borderRadius))
        ) {
            return (
                <View style={imageStyle}>
                    {props.children}
                    {LoadingIndicator ? (
                        <View style={activityIndicatorStyle}>
                            <LoadingIndicator {...activityIndicatorProps} />
                        </View>
                    ) : (
                        <ActivityIndicator
                            {...activityIndicatorProps}
                            style={activityIndicatorStyle}
                        />
                    )}
                </View>
            );
        }
        // otherwise render an image with the defaultSource with the ActivityIndicator on top of it
        return renderImage({
            ...imageProps,
            style: props.style,
            source,
            children: !showLoader ? (
                props.children
            ) : (
                <View style={imageStyle}>
                    {props.children}
                    {LoadingIndicator ? (
                        <View style={activityIndicatorStyle}>
                            <LoadingIndicator {...activityIndicatorProps} />
                        </View>
                    ) : (
                        <ActivityIndicator
                            {...activityIndicatorProps}
                            style={activityIndicatorStyle}
                        />
                    )}
                </View>
            )
        });
    };
    if (isCacheable && !cachedImagePath && isInternetReachable) {
        return renderLoader(props.showLoader);
    }
    const style = props.style ?? defaultStyles.image;
    const source =
        isCacheable && cachedImagePath
            ? { uri: AddPathPrefix(cachedImagePath) }
            : originSource;
    if (props.fallbackSource && !cachedImagePath) {
        return renderImage({
            ...props,
            style,
            source: props.fallbackSource
        });
    }
    return renderImage({
        ...props,
        style,
        source
    });
};
/**
 * Image component that caches the uri automatically, if the uri had previously been cached it will be loaded from the cache
 */
export const CacheableImage = forwardRef(CacheableImageComponent);
