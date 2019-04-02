# gallery

A pure JavaScript image and video gallery component for react-native apps with common gestures like pan, pinch and doubleTap, supporting both iOS and Android.
Support custom item.

[![Build Status](https://travis-ci.org/react-native-pure/gallery.svg?branch=master)](https://travis-ci.org/react-native-pure/gallery)
[![npm version](https://img.shields.io/npm/v/@react-native-pure/gallery.svg)](https://www.npmjs.com/package/@react-native-pure/gallery)
[![npm license](https://img.shields.io/npm/l/@react-native-pure/gallery.svg)](https://www.npmjs.com/package/@react-native-pure/gallery)
[![npm download](https://img.shields.io/npm/dm/@react-native-pure/gallery.svg)](https://www.npmjs.com/package/@react-native-pure/gallery)
[![npm download](https://img.shields.io/npm/dt/@react-native-pure/gallery.svg)](https://www.npmjs.com/package/@react-native-pure/gallery)


## Install

```bash
$ npm i @react-native-pure/gallery --save
```

## Documentaion

Quite easy to use:

```
import GalleryView from "@react-native-pure/gallery"
import {GalleryFileType} from '@react-native-pure/gallery/src/types'
class Galleray extends React.Component{

    data = [{
        url:'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg',
        type:GalleryFileType.image
    }]
    render(){
        return (
             <GalleryViewer dataSource={this.data}/>
        );
    }
}

```


### GalleryProps

- `dataSource` **Array<[GalleryData](#gallerydata)>**
- `style?` **any**
- `initIndex?` *(Number** 初始显示第几张图
- `renderFooter?` **(index: Number) => React.ReactElement<any>** 自定义尾部
- `renderHeader?` **(index: Number) => React.ReactElement<any>** 自定义头部
- `renderItem?` **(data:GalleryData,index: Number) => React.ReactElement<any>** 内容页面渲染
- `renderIndicator?` **(data:GalleryData,index: Number) => React.ReactElement<any>** 是否显示加载动画
- `onChange?` **(index:number)=>void** 当内容切换时触发
- `maxScale?` **Number**最大缩放比例
- `minScale?` **(Number**最小缩放比例
- `onPress?` **(index: Number) =>void**单击
- `onDoubleClick?` **(index: Number) =>void** 双击
- `enableDoubleClickZoom?` **Boolean**是否支持双击，默认支持
- `onResponderGrant?` **((event,gestureState)=>void** 手势开始
- `onResponderMove?` **((event,gestureState)=>void** 手势移动
- `onResponderEnd?` **((event,gestureState)=>void** 手势结束


### GalleryData
- `url` **String** 图片/视频url地址
- `type` ** $Values<typeof [GalleryFileType](gallerygiletype)>** 数据源类型
- `coverImageUrl` **String** 视频封面图地址
- `disableZoom` **Boolean** 禁用缩放，默认false

### GalleryFileType
- `-1` other
- `0` 图片
- `1` 视频
