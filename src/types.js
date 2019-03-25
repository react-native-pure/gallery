import {Image, ImageURISource, Text, View, ViewStyle} from 'react-native';

export type GalleryProps = {

    /**
     * 数据源
     */
    dataSource:Array<GalleryData>,
    /**
     * 组件样式
     */
    style?: ViewStyle,
    /**
     * 初始显示第几张图
     */
    initIndex?: Number,

    /**
     * 自定义尾部
     */
    renderFooter?:(index: Number) => React.ReactElement<any>,
    /**
     * 自定义头部
     */
    renderHeader?:(index: Number,) => React.ReactElement<any>,

    /**
     * 内容页面渲染
     */
    renderItem?:(data:GalleryData,index: Number,) => React.ReactElement<any>,

    /**
     * 是否显示加载动画
     */
    renderIndicator?:(data:GalleryData,index: Number,) => React.ReactElement<any>,

    /**
     * 当内容切换时触发
     */
    onChange?:(index:number)=>void,

    /**
     * 内容切换动画时间
     */
    pageAnimateTime?:Number,

    /**
     * 最大缩放比例
     */
    maximumZoomScale?:Number,

    /**
     * 最小缩放比例
     */
    minimumZoomScale?:Number,

    /***
     * 双击
     */
    onDoubleClick?:(data:GalleryData,index: Number) =>void

}


export type GalleryData = {
    /**
     * 图片/视频url地址
     */
    url: String,

    /**
     * 数据源类型
     */
    type: $Values<typeof GalleryFileType>,

    /**
     * 视频封面图地址
     */
    coverImageUrl?: String,

    /**
     *  是否可以缩放，默认true
     */
    zoomEnable?:Boolean,


}

export type ZoomViewProps = {

    /**
     * 组件样式
     */
    style?: ViewStyle,

    /***
     * 单击
     */
    onClick?:(data:GalleryData,index: Number) =>void,
    /***
     * 双击
     */
    onDoubleClick?:(data:GalleryData,index: Number) =>void,

    /**
     * 手势结束
     */
    responderEnd:(offset:Number,scale:Number)=>void,

    /**
     *  是否可以缩放，默认true
     */
    zoomEnable?:Boolean,

    /**
     * 是否支持双击缩放，默认true
     */
    enableDoubleClickZoom?:Boolean,

    /****
     * 最小缩放比例
     */
    minScale?:Number,

    /**
     * 最大缩放比例
     */
    maxScale?:Number,



    scrollToOuterRange:(offset:Number)=>void,

    /**
     * 滑动结束
     */
    onSwipeDown:(direction:SwipeDirectionType)=>void,

    /**
     * 允许的滚动空白距离
     */
    maxOverScrollDistance?:Number


}


export const GalleryFileType = {
    other: -1,
    //图片
    image: 0,
    //视频
    video: 1,
}

