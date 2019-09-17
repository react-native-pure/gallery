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
    renderHeader?:(index: Number) => React.ReactElement<any>,

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
     * 最大缩放比例
     */
    maxScale?:Number,

    /**
     * 最小缩放比例
     */
    minScale?:Number,

    /**
     * 单击
     */
    onPress?:(index: Number) =>void,

    /***
     * 双击
     */
    onDoubleClick?:(index: Number) =>void,

    /**
     * 是否支持双击，默认支持
     */
    enableDoubleClickZoom?:Boolean,
    /**
     * 手势开始
     */
    onResponderGrant?:(event,gestureState)=>void,

    /**
     * 手势移动
     */
    onResponderMove?:(event,gestureState)=>void,
    /**
     * 手势结束
     */
    onResponderEnd?:(event,gestureState)=>void,

    /***
     * 长按
     * @param index
     */
    onLongPress?:(index: Number)=>void,

    /***
     * 长按的时长，单位毫秒
     */
    longPressThreshold?:number


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
     *  禁用缩放，默认false
     */
    disableZoom?:Boolean,


}

export type ZoomViewProps = {

    /**
     * 组件样式
     */
    style?: ViewStyle,

    /***
     * 单击
     */
    onPress?:(data:GalleryData,index: Number) =>void,
    /***
     * 双击
     */
    onDoubleClick?:(data:GalleryData,index: Number) =>void,

    /**
     * 内容宽高比例
     */
    contentAspectRatio:Number,

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

    /**
     * 滑动超出边界时触发
     */
    horizontalOuterRangeOffset:(offset:Number)=>void,

    /**
     * 手势开始
     */
    onResponderGrant?:(event,gestureState)=>void,

    /**
     * 手势移动
     */
    onResponderMove?:(event,gestureState)=>void,
    /**
     * 手势结束
     */
    onResponderEnd?:(event,gestureState)=>void,

    /**
     * 滑动结束
     */
    onSwipeDown:(direction:SwipeDirectionType)=>void,

    /**
     * 允许的滚动空白距离
     */
    maxOverScrollDistance?:Number,

    /**
     * 单击
     */
    onPress?:() =>void,


    /**
     * 长按
     * @param index
     */
    onLongPress?:() =>void,

    /***
     * 长按的时长，单位毫秒
     */
    longPressThreshold?:number



}


export const GalleryFileType = {
    other: -1,
    //图片
    image: 0,
    //视频
    video: 1,
}

