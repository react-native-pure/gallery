/**
 * @overview 文件描述
 * @author jean.h.ma
 */
import * as React from "react"
import {View, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ActivityIndicator} from "react-native"
import hoistNonReactStatics from 'hoist-non-react-statics';
import Icon from "react-native-vector-icons/MaterialIcons"
import merge from "deepmerge"
import RNFetchBlob from "rn-fetch-blob"
import md5 from "md5";

const size = Dimensions.get("window")

/**
 * 视频播放状态
 * @type {{stop: string, play: string, pause: string}}
 */
export const VideoPlayStatus = {
    stop: 'stop',
    play: 'play',
    paused: 'paused',
    loading: 'loading'
}


const styles = StyleSheet.create({
    buttonContainer: {
        justifyContent: "center",
        alignItems: "center"
    },
    poster: {
        flex: 1,
        width: size.width,
        height: size.height,
    },
    posterImage: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});

type VideoSimpleControlOption = {
    icon:{
        color:string,
        size:number
    },
    delay:number
};

const defaultVideoSimpleControlOption:VideoSimpleControlOption = {
    icon: {
        color: "white",
        size: 60
    },
    delay: 5000
};

export default function ( option:VideoSimpleControlOption = {} ) {
    const nextOption = merge(defaultVideoSimpleControlOption, option);
    return function ( VideoPlayer ) {
        class VideoPlayerWithControl extends React.Component {
            _videoRef = null;
            _timer = null;

            constructor( props ) {
                super(props);
                this._mount = false;

                this.toggleControl = () => {
                    this.state.status !== VideoPlayStatus.stop && this.setState(( {showControl} ) => {
                        return {
                            showControl: !showControl
                        }
                    })
                }
                this._onReadyContainerLayout = ( {nativeEvent: {layout: {width, height}}} ) => {
                    this.setState({
                        readyWidth: width,
                        readyHeight: height
                    });
                }
                this.stop = () => {
                    if (this._mount) {
                        if(this.state.status === VideoPlayStatus.loading){
                            RNFetchBlob.fs.unlink(this.localFileFullPath);
                        }
                        this.setState({
                            status: VideoPlayStatus.stop,
                            showControl: true
                        })
                    }
                }

                this.state = {
                    hasLoad: false,
                    readyWidth: 0,
                    readyHeight: 0,
                    status: !props.paused ? VideoPlayStatus.loading : VideoPlayStatus.stop,
                    showControl: !props.paused ? false : true,
                };
            }


            componentDidMount() {
                this._mount = true;
                this.props.controlRef && this.props.controlRef(this);
                /**自动播放*/
                if (!this.props.paused) {
                    this.checkHasLoad()
                }
            }

            get paused() {
                if (this.state.status === VideoPlayStatus.play) {
                    return false
                }
                return true
            }

            get localFileFullPath() {
                const name = md5(this.props.source.uri);
                return RNFetchBlob.fs.dirs.CacheDir + "/" + name + ".mp4"
            }

            get source() {
                if (this.isHttpUrl) {
                    return {uri: this.localFileFullPath}
                }
                return this.props.source
            }

            get isHttpUrl() {
                return this.props.source && this.props.source.uri && this.props.source.uri.startsWith("http")
            }


            /**是否已经下载**/
            checkHasLoad = async () => {
                if (this.isHttpUrl) {
                    const exists = await RNFetchBlob.fs.exists(this.localFileFullPath)
                    if (exists) {
                        this.setState({
                            hasLoad: true,
                            status: VideoPlayStatus.play
                        })
                    } else {
                        RNFetchBlob
                            .config({
                                path: this.localFileFullPath,
                            }).fetch('GET', this.props.source.uri).then(( res ) => {
                            this.setState({
                                hasLoad: true,
                                status: VideoPlayStatus.play
                            })
                        }).catch(( err ) => {
                            RNFetchBlob.fs.unlink(this.localFileFullPath);
                            this.setState({
                                hasLoad: false,
                                status: VideoPlayStatus.pause
                            })
                            this.props.onError && this.props.onError(err)
                        })
                    }
                } else {
                    this.setState({
                        hasLoad: true,
                        status: VideoPlayStatus.play
                    })
                }
                return true
            }

            _onEnd = ( ...args ) => {
                if (!this.props.repeat) {
                    this.setState({
                        status: VideoPlayStatus.stop,
                        showControl: true
                    }, () => {
                        if (this._videoRef) {
                            this._videoRef.seek(0);
                        }
                        this.props.onEnd &&  this.props.onEnd(...args);
                    });
                } else {
                    this.props.onEnd &&  this.props.onEnd(...args);
                }
            }

            _onError = ( error ) => {
                RNFetchBlob.fs.unlink(this.localFileFullPath);
                this.props.onError &&  this.props.onError(error)
            }

            _renderPlayButton() {
                if (this.state.showControl) {
                    if (this.paused) {
                        return (
                            <View style={[StyleSheet.absoluteFill, styles.buttonContainer]}>
                                <TouchableOpacity disabled={this.props.disablePlay} onPress={() => {
                                    if (this.state.hasLoad) {
                                        this.setState({status: VideoPlayStatus.play})
                                    } else {
                                        this.setState({status: VideoPlayStatus.loading})
                                        this.checkHasLoad()
                                    }
                                }}>
                                    <Icon name="play-circle-outline" {...nextOption.icon}></Icon>
                                </TouchableOpacity>
                            </View>
                        );
                    } else {
                        return (
                            <View style={[StyleSheet.absoluteFill, styles.buttonContainer]}>
                                <TouchableOpacity disabled={this.props.disablePlay} onPress={() => {
                                    this.setState({status: VideoPlayStatus.pause})
                                }}>
                                    <Icon name="pause-circle-outline" {...nextOption.icon}></Icon>
                                </TouchableOpacity>
                            </View>
                        );
                    }
                }
                return null;
            }

            renderReady() {
                const hasPoster = this.props.poster && this.props.poster.length > 0;
                const props = {
                    source: require("../../assets/bg_movie.png")
                }
                if (hasPoster) {
                    props.source = {uri: this.props.poster}
                    props.resizeMode = "contain"
                }
                return (
                    <View style={[styles.poster]}
                          onLayout={this._onReadyContainerLayout}>
                        <ImageBackground style={[styles.posterImage]} {...props}>
                            {this._renderPlayButton()}
                        </ImageBackground>
                    </View>
                );
            }

            renderLoading() {
                const hasPoster = this.props.poster && this.props.poster.length > 0;
                const props = {
                    source: require("../../assets/bg_movie.png")
                }
                if (hasPoster) {
                    props.source = {uri: this.props.poster}
                    props.resizeMode = "contain"
                }
                return (
                    <View style={[styles.poster]}
                          onLayout={this._onReadyContainerLayout}>
                        <ImageBackground style={[styles.posterImage]} {...props}>
                            <ActivityIndicator color={'#fff'} size="large"/>
                        </ImageBackground>
                    </View>
                );
            }

            render() {
                if (this.state.status === VideoPlayStatus.stop) {
                    return this.renderReady()
                } else if (this.state.status === VideoPlayStatus.loading) {
                    return this.renderLoading()
                }
                const {style, forwardedRef, ...rest} = this.props;
                return (
                    <View style={[{backgroundColor: '#000'}, style]}>
                        <VideoPlayer {...rest}
                                     source={this.source}
                                     style={style}
                                     poster={null}
                                     paused={this.paused}
                                     ref={ref => {
                                         this._videoRef = ref;
                                         forwardedRef && forwardedRef(ref)
                                     }}
                                     onEnd={this._onEnd}
                                     onError={this._onError}
                        />
                        {this._renderPlayButton()}
                    </View>
                );
            }

            componentDidUpdate( prevProps, prevState, snapshot ) {
                if (this.state.showControl) {
                    if (this.state.status !== VideoPlayStatus.stop) {
                        if (this._timer) {
                            clearTimeout(this._timer);
                        }
                        this._timer = setTimeout(() => {
                            this.state.status !== VideoPlayStatus.stop && this.setState({showControl: false})
                        }, nextOption.delay);
                    } else {
                        if (this._timer) {
                            clearTimeout(this._timer);
                        }
                    }
                }
            }

            componentWillUnmount() {
                this._mount = false;
                if (this._timer) {
                    clearTimeout(this._timer);
                }
                if (this.state.status === VideoPlayStatus.loading) {
                    RNFetchBlob.fs.unlink(this.localFileFullPath);
                }
            }
        }

        hoistNonReactStatics(VideoPlayerWithControl, VideoPlayer);

        const nextVideoPlayer = React.forwardRef(( props, ref ) => {
            return <VideoPlayerWithControl {...props} forwardedRef={ref}/>
        });

        hoistNonReactStatics(nextVideoPlayer, VideoPlayerWithControl);

        return nextVideoPlayer;
    }
}
