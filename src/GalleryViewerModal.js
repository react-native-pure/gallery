/**
 *
 * 画廊(图片，视频浏览组件)
 * 个性化通过props配置
 *
 */

import * as React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import withSimpleControl from './video/withSimpleControl';
import Video from 'react-native-video';
import CachedImage from './basic/CachedImage';
import {PageModal,NavigationHeader,ActionSheetModal} from "@react-native-pure/ibuild-modal";
import update from "immutability-helper";
import GalleryViewer from './gallery';
import type {ImageListPickerData,GalleryFileType} from "./types";
import {SafeAreaView} from 'react-navigation'
import type {PageModalProps,ActionSheetModalButton} from "@react-native-pure/ibuild-modal";

const VideoPlayer = withSimpleControl()(Video)

type Action = ActionSheetModalButton & {
    onPress:(data:ImageListPickerData)=>{}
}

export type GalleryViewerModalProps = {
    data: Array<ImageListPickerData> | ()=>Array<ImageListPickerData>,
    initIndex?: number,
    style?: Object,
    title?: string,
    renderFooter?: (index: number) => React.ReactElement<any>,
    renderHeader?: (index: number) => React.ReactElement<any>,
    renderIndicator?: (data: Object, index: number) => React.ReactElement<any> ,
    renderError?:(index: number,error:Error,data:Object) => React.ReactElement<any>,
    showIndicator: boolean,
    onChange?: (index: number,data:Object) => void,
    onError?: (index:number,error: Error,data:Object) => void,
    /**长按操作方法，设置该属性后支持长按手势*/
    longPressActions?:Array<Action>,

    /***
     * 长按的时长，单位毫秒
     */
    longPressThreshold?:number,


} & PageModalProps

export default class GalleryViewerModal extends React.PureComponent <GalleryViewerModalProps> {

    static defaultProps = {
        initIndex: 0,
        title: "查看详情",
        hiddenNavBar: false,
        data: [],
        visible: false,
        showIndicator: true,
        onRequestClose: () => {
        },
    };

    constructor(props) {
        super(props);
        this.videoViews = new Map();
        this.state = {
            hiddenIndicator: [],
            errors:[],
            currentIndex: props.initIndex,
            showLongPressAction:false

        }
        this.renderFooter = this.renderFooter.bind(this)
        this.renderHeader = this.renderHeader.bind(this)
        this.renderItem = this.renderItem.bind(this)
        this.renderSpinder = this.renderSpinder.bind(this)
    }

    componentWillReceiveProps( nextProps:Readonly<P>, nextContext:any ):void {
        if(nextProps.initIndex!== this.props.initIndex){
            this.setState({
                currentIndex:nextProps.initIndex
            })
        }
    }



    get longPressActions(){
        if(this.props.longPressActions){
            return this.props.longPressActions.map(item=>{
                return {
                    ...item,
                    onPress:()=>{
                        this.setState({
                            showLongPressAction:false
                        })
                        item.onPress && item.onPress(this.props.data[this.state.currentIndex])
                    }
                }
            })
        }
        return []
    }
    onLoadStart(index){
        this.setState(update(this.state, {
            hiddenIndicator: {
                [index]: {$set: false}
            },
            errors:{
                [index]: {$set: null}
            }
        }))
    }
    onLoad(index) {
        this.setState(update(this.state, {
            hiddenIndicator: {
                [index]: {$set: true}
            },
            errors:{
                [index]: {$set: null}
            }
        }))
    }


    onError(index,error) {
        this.setState(update(this.state, {
            hiddenIndicator: {
                [index]: {$set: true}
            },
            errors:{
                [index]: {$set: error}
            }
        }))
    }

    renderNavBar() {
        return (
            <View style={styles.navContainer}>
                <NavigationHeader hiddenRight={true}
                                  title={this.props.title}
                                  navbarStyle={{
                                      container: {
                                          backgroundColor: 'rgba(0,0,0,0)'
                                      },
                                      leftButton: {
                                          tintColor: '#fff'
                                      },
                                      title: {
                                          fontSize: 18,
                                          color: 'white'
                                      }
                                  }}
                                  onPressLeft={() => {
                                      this.props.onRequestClose && this.props.onRequestClose()
                                  }}/>
            </View>
        )
    }

    renderFooter(index) {
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

    renderHeader(index) {
        if (this.props.renderHeader) {
            return this.props.renderHeader(index)
        }
        return null;
    }

    renderSpinder(data, index) {
        if (this.props.showIndicator && data.type === GalleryFileType.image && !this.state.hiddenIndicator[index]) {
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

    renderItem(item, index) {
        if(!this.props.visible){
            return null
        }
        if(this.state.errors[index] && this.props.renderError){
            return this.props.renderError(index,this.state.errors[index],item)
        }
        if (item.type === GalleryFileType.image) {
            return (
                <CachedImage
                    source={item.source}
                    style={item.style}
                    resizeMode={'contain'}
                    onLoadStart={()=>{
                        this.onLoadStart(index)
                    }}
                    onLoadEnd={() => {
                        this.onLoad(index)
                    }}
                    onError={(error)=>{
                        this.onError(index,error)
                        this.props.onError && this.props.onError(index,error,item)
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
                             onError={({error})=>{
                                 if( this.props.onError){
                                     this.props.onError(index,error)
                                 }
                                 else{
                                     Alert.alert("播放失败，"+error.code)
                                 }
                             }}
                />
            );
        }
        return null
    }

    render() {
        return (
            <PageModal visible={this.props.visible}
                       hiddenNavBar={true}
                       onHidden={this.props.onHidden}
                       onShown={this.props.onShown}
                       transition={this.props.transition}
                       onRequestClose={this.props.onRequestClose}>
                <SafeAreaView style={[{flex: 1, backgroundColor: '#000'}, this.props.style]}>
                    <GalleryViewer dataSource={this.props.data}
                                   initIndex={this.props.initIndex}
                                   ref={(refs) => {
                                       this.imageViewer = refs
                                   }}
                                   longPressThreshold={this.props.longPressThreshold}
                                   onChange={(index) => {
                                       this.props.onChange && this.props.onChange(index,this.props.data[index])
                                       if (this.videoViews.get(this.state.currentIndex)) {
                                           this.videoViews.get(this.state.currentIndex).stop && this.videoViews.get(this.state.currentIndex).stop()
                                       }
                                       this.setState({
                                           currentIndex: index
                                       })
                                   }}
                                   onPress={(index) => {
                                       if (this.videoViews.get(index)) {
                                           this.videoViews.get(index).toggleControl && this.videoViews.get(index).toggleControl()
                                       }
                                   }}
                                   renderFooter={this.renderFooter}
                                   renderHeader={this.renderHeader}
                                   renderItem={this.renderItem}
                                   renderIndicator={this.renderSpinder}
                                   onLongPress={this.props.longPressActions?()=>{
                                       this.setState({
                                           showLongPressAction:true
                                       })
                                   }:null}
                    />
                    {this.renderNavBar()}
                </SafeAreaView>
                <ActionSheetModal buttons={this.longPressActions}
                                  visible={this.state.showLongPressAction}
                                  onRequestClose={()=>{
                                      this.setState({
                                          showLongPressAction:false
                                      })
                                  }}/>
            </PageModal>
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
