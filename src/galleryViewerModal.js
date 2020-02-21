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
    Alert, ImageResizeMode
} from 'react-native';
import {PageModal, NavigationHeader, ActionSheetModal} from "@react-native-pure/ibuild-modal";
import update from "immutability-helper";
import GalleryViewer from './galleryViewer';
import {ImageListPickerData, GalleryFileType} from "./types";
import {SafeAreaView} from 'react-navigation'
import type {PageModalProps, ActionSheetModalButton} from "@react-native-pure/ibuild-modal";


type Action = ActionSheetModalButton & {
    onPress:( data:ImageListPickerData )=>{}
}

export type GalleryViewerModalProps = {
    data:Array<ImageListPickerData> | ()=>Promise<Array<ImageListPickerData>>,
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
    /**长按操作方法，设置该属性后支持长按手势*/
    longPressActions?:Array<Action>,

    /***
     * 长按的时长，单位毫秒
     */
    longPressThreshold?:number,

    /**
     *
     */
    imageResizeMode?:ImageResizeMode,


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

    constructor( props ) {
        super(props);
        this.videoViews = new Map();
        this.state = {
            currentIndex: props.initIndex,
            showLongPressAction: false,
            dataSource: [],
            /**异步加载数据中*/
            loadingAsyncData: false

        }
    }

    async componentWillReceiveProps( nextProps:Readonly<P>, nextContext:any ):void {
        if (nextProps.initIndex !== this.props.initIndex) {
            this.setState({
                currentIndex: nextProps.initIndex
            })
        }
        if (nextProps.visible !== this.props.visible && nextProps.visible) {
            if (typeof nextProps.data === 'function') {

                this.setState({
                    loadingAsyncData: true,
                    dataSource: []
                })
                const data = await nextProps.data()
                this.setState({
                    dataSource: data,
                    loadingAsyncData: false
                })
            } else {
                this.setState({
                    dataSource: nextProps.data
                })
            }
        }
    }

    get longPressActions() {
        if (this.props.longPressActions) {
            return this.props.longPressActions.map(item => {
                return {
                    ...item,
                    onPress: () => {
                        this.setState({
                            showLongPressAction: false
                        })
                        item.onPress && item.onPress(this.state.dataSource[this.state.currentIndex])
                    }
                }
            })
        }
        return []
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

    render() {
        return (
            <PageModal visible={this.props.visible}
                       hiddenNavBar={true}
                       onHidden={this.props.onHidden}
                       onShown={this.props.onShown}
                       transition={this.props.transition}
                       onRequestClose={this.props.onRequestClose}>
                <SafeAreaView style={[{flex: 1, backgroundColor: '#000'}, this.props.style]}>
                    <GalleryViewer {...this.props}
                                   dataSource={this.state.dataSource}
                                   onChange={( index, data ) => {
                                       this.setState({
                                           currentIndex: index
                                       })
                                       this.props.onChange && this.props.onChange(index, data)
                                   }}
                                   longPressActions={this.props.longPressActions ? () => {
                                       this.setState({
                                           showLongPressAction: true
                                       })
                                   } : null}/>
                    {this.renderNavBar()}
                </SafeAreaView>
                <ActionSheetModal buttons={this.longPressActions}
                                  visible={this.state.showLongPressAction}
                                  onRequestClose={() => {
                                      this.setState({
                                          showLongPressAction: false
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
