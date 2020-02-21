/**
 * @flow
 * @description 支持图片和视频的Viewer
 * @author heykk
 * @lastEditors heykk
 * @lastEditTime 2020-02-21
 */

import * as React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ImageResizeMode
} from 'react-native';
import withSimpleControl from './video/withSimpleControl';
import Video from 'react-native-video';
import CachedImage from './basic/cachedImage';
import update from "immutability-helper";
import Gallery from './gallery';
import {ImageListPickerData, GalleryFileType} from "./types";
import {SafeAreaView} from 'react-navigation'

const VideoPlayer = withSimpleControl()(Video)


export type GalleryViewerProps = {
    dataSource:Array<ImageListPickerData>,
    initIndex?:number,
    style?:Object,
    title?:string,
    renderFooter?:( index:number ) => React.ReactElement<any>,
    renderHeader?:( index:number ) => React.ReactElement<any>,
    renderIndicator?:( data:Object, index:number ) => React.ReactElement<any>,
    renderError?:( index:number, error:Error, data:Object ) => React.ReactElement<any>,
    showIndicator:boolean,
    onChange?:( index:number, data:Object ) => void,
    onError?:( index:number, error:Error, data:Object ) => void,

    /**
     *
     */
    imageResizeMode?:ImageResizeMode,

    /**
     * 点击回调
     * @param index
     */
    onPress?:(index:number)=>void,

    /**
     * 禁用播放
     */
    disablePlay:boolean

}

export default class GalleryViewer extends React.PureComponent <GalleryViewerProps> {

    static defaultProps = {
        initIndex: 0,
        title: "查看详情",
        data: [],
        showIndicator: true,
        imageResizeMode: 'contain',
        disablePlay:false
    };

    constructor( props ) {
        super(props);
        this.videoViews = new Map();
        this.state = {
            hiddenIndicator: [],
            errors: [],
            currentIndex: props.initIndex
        }
        this.renderFooter = this.renderFooter.bind(this)
        this.renderHeader = this.renderHeader.bind(this)
        this.renderItem = this.renderItem.bind(this)
        this.renderSpinder = this.renderSpinder.bind(this)
    }

    async componentWillReceiveProps( nextProps:Readonly<P>, nextContext:any ):void {
        if (nextProps.initIndex !== this.props.initIndex) {
            this.setState({
                currentIndex: nextProps.initIndex
            })
        }
    }

    onLoadStart( index ) {
        this.setState(update(this.state, {
            hiddenIndicator: {
                [index]: {$set: false}
            },
            errors: {
                [index]: {$set: null}
            }
        }))
    }

    onLoad( index ) {
        this.setState(update(this.state, {
            hiddenIndicator: {
                [index]: {$set: true}
            },
            errors: {
                [index]: {$set: null}
            }
        }))
    }


    onError( index, error ) {
        this.setState(update(this.state, {
            hiddenIndicator: {
                [index]: {$set: true}
            },
            errors: {
                [index]: {$set: error}
            }
        }))
    }

    renderFooter( index ) {
        if (this.props.renderFooter) {
            return this.props.renderFooter(index)
        }
        return <Text style={{
            color: '#fff',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0)',
            paddingHorizontal: 15,
            fontSize: 18,
        }}>{`${index + 1}/${this.props.data.length}`}</Text>
    }

    renderHeader( index ) {
        if (this.props.renderHeader) {
            return this.props.renderHeader(index)
        }
        return null;
    }

    renderSpinder( data, index ) {
        if (this.props.showIndicator && (this.state.loadingAsyncData || data.type === GalleryFileType.image && !this.state.hiddenIndicator[index])) {
            if (this.props.renderIndicator) {
                return this.props.renderIndicator(data, index)
            }
            return (
                <View style={styles.spinder}>
                    <View style={styles.spinderContainer}>
                        <ActivityIndicator color="#fff"/>
                        <Text style={[{color: '#fff', backgroundColor: "transparent"}]}>加载中...</Text>
                    </View>
                </View>
            )
        }
        return null;
    }

    renderItem( item, index ) {
        if (this.state.errors[index] && this.props.renderError) {
            return this.props.renderError(index, this.state.errors[index], item)
        }
        if (item.type === GalleryFileType.image) {
            return (
                <CachedImage
                    source={item.source}
                    style={item.style}
                    resizeMode={this.props.imageResizeMode}
                    onLoadStart={() => {
                        this.onLoadStart(index)
                    }}
                    onLoadEnd={() => {
                        this.onLoad(index)
                    }}
                    onError={( error ) => {
                        this.onError(index, error)
                        this.props.onError && this.props.onError(index, error, item)
                    }}
                />
            )
        } else if (item.type == GalleryFileType.video) {
            return (
                <VideoPlayer paused={!item.autoPlay}
                             poster={item.coverImageUrl}
                             source={{uri: item.url}}
                             style={item.style}
                             handleHorizontalOuterRangeOffset={x => {
                                 this.imageViewer && this.imageViewer._scrollToX(x)
                             }}
                             swipeToLeft={() => {
                                 this.imageViewer && this.imageViewer._scrollToIndex(this.state.currentIndex - 1)
                             }}
                             swipeToRight={() => {
                                 this.imageViewer && this.imageViewer._scrollToIndex(this.state.currentIndex + 1)
                             }}
                             controlRef={refs => {
                                 this.videoViews.set(index, refs)
                             }}
                             onError={( {error} ) => {
                                 if (this.props.onError) {
                                     this.props.onError(index, error)
                                 } else {
                                     Alert.alert("播放失败，" + error.code)
                                 }
                             }}
                             disablePlay={this.props.disablePlay}
                />
            );
        }
        return null
    }

    render() {
        return (
            <Gallery style={this.props.style}
                     dataSource={this.props.dataSource}
                     initIndex={this.props.initIndex}
                     ref={( refs ) => {
                         this.imageViewer = refs
                     }}
                     longPressThreshold={this.props.longPressThreshold}
                     onChange={( index ) => {
                         this.props.onChange && this.props.onChange(index, this.props.dataSource[index])
                         if (this.videoViews.get(this.state.currentIndex)) {
                             this.videoViews.get(this.state.currentIndex).stop && this.videoViews.get(this.state.currentIndex).stop()
                         }
                         this.setState({
                             currentIndex: index
                         })
                     }}
                     onPress={( index ) => {
                         if (this.videoViews.get(index)) {
                             this.videoViews.get(index).toggleControl && this.videoViews.get(index).toggleControl()
                         }
                         if(this.props.onPress){
                             this.props.onPress(index);
                         }
                     }}
                     renderFooter={this.renderFooter}
                     renderHeader={this.renderHeader}
                     renderItem={this.renderItem}
                     renderIndicator={this.renderSpinder}
                     onLongPress={this.props.longPressActions}/>
        )
    }

}

const styles = StyleSheet.create({
    navContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    video: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0
    },
    spinder: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: "center"
    },
    spinderContainer: {
        backgroundColor: "rgba(0,0,0,0.5)",
        width: 100,
        height: 100,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center"
    }
})
