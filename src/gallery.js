import * as React from 'react';
import {
    View,
    StyleSheet,
    Image,
    FlatList,
    Platform
} from 'react-native';
import {GalleryProps, GalleryFileType} from './types';
import ZoomView from './zoomView';
import Scroller from './scroll/scroller';

const MIN_FLING_VELOCITY = 0.5;

export default class Gallery extends React.Component<GalleryProps> {

    static defaultProps = {
        style: {},
        dataSource: null,
        maxScale: 2.5,
        minScale: 1,
        zoomEnable: true,
        enableDoubleClickZoom: true,
        imageResizeMode:'contain'
    }

    constructor( props ) {
        super(props)
        this.contentSize = new Map();
        this.imagesRef = new Map();

        this.state = {
            containerWidth: 0,
            containerHeight: 0,
            currentPage: props.initIndex || 0,
        }
        this.scroller = new Scroller(true, ( dx, dy, scroller ) => {
            if (!(dx === 0 && dy === 0 && scroller.isFinished()) && this._mount) {
                const curX = this.scroller.getCurrX();
                this.scroll.scrollToOffset({offset: curX, animated: false});
            }
        });
    }

    get currentPage() {
        return this.state.currentPage
    }

    componentDidMount() {
        this._mount = true;
        this.fetchContentSize(this.props.dataSource)
    }

    componentWillUnmount() {
        this._mount = false;
        this.contentSize.clear()
    }

    componentWillReceiveProps( nextProps ) {
        if (nextProps.initIndex != this.props.initIndex) {
            this._scrollToIndex(nextProps.initIndex, false)
        } else if (nextProps.dataSource != this.props.dataSource) {
            this.fetchContentSize(nextProps.dataSource)
        }
    }

    get pageCount() {
        if (!this.props.dataSource) {
            return 0
        }
        return this.props.dataSource.length || 0
    }

    get containerSize() {
        return {
            width: this.state.containerWidth,
            height: this.state.containerHeight
        }
    }

    fullUrl = (url)=>{
        if(!/^http/.test(url) && Platform.OS === 'android' && !/^file:/.test(url)){
            return 'file://' + url
        }
        return  url;
    }

    /**
     * 获取内容size
     * @param dataSource
     */
    fetchContentSize( dataSource ) {
        this.contentSize.clear()
        if (dataSource) {
            dataSource.forEach(( item, index ) => {
                if (item.type === GalleryFileType.image) {
                    Image.getSize(this.fullUrl(item.url), ( width, height ) => {
                        this.contentSize.set(index, {width, height})
                    })
                }
            })
        }
    }

    /**
     * 获取对应的内容size
     * @param index
     * @returns {V | undefined | *}
     */
    contentSizeByIndex( index ) {
        return this.contentSize.get(index) || this.containerSize
    }

    /**
     * 手势开始
     * @private
     */
    _onResponderGrant( event, gesture ) {
        this.scroller.forceFinished(true);
        this.props.onResponderGrant && this.props.onResponderGrant(event, gesture)
    }

    _onPageChanged( page ) {
        if (this.currentPage !== page) {
            const lastPage = this.currentPage;
            this.setState({
                currentPage: page
            }, () => {
                this.props.onChange && this.props.onChange(page)
                this.imagesRef.get(lastPage) && this.imagesRef.get(lastPage)._reset()
            })
        }
    }

    _flingToPage( page, velocityX ) {
        page = this.validPage(page);
        this._onPageChanged(page);
        velocityX *= -1000; //per sec
        const finalX = this.getScrollOffsetOfPage(page);
        this.scroller.fling(this.scroller.getCurrX(), 0, velocityX, 0, finalX, finalX, 0, 0);

    }

    getScrollOffsetOfPage( page ) {
        return page * this.state.containerWidth;
    }

    validPage( page ) {
        page = Math.min(this.pageCount - 1, page);
        page = Math.max(0, page);
        return page;
    }

    /***
     * scrollView layout
     * @param event
     * @private
     */
    _onScrollLayout = ( event ) => {

        const {layout: {width, height}} = event.nativeEvent;
        this.setState({
            containerWidth: width,
            containerHeight: height,
        }, () => {
            setTimeout(() => {
                this._scrollToIndex(this.currentPage, true);
            }, 0)
        })
    }

    /**
     * 滑动结束
     * @param direction
     * @private
     */
    _onSwipeDown = ( vx ) => {
        if (vx < -MIN_FLING_VELOCITY) {
            if (this.currentPage < this.pageCount - 1) {
                this._flingToPage(this.currentPage + 1, vx);
            } else {
                this._flingToPage(this.pageCount - 1, vx);
            }
        } else if (vx > MIN_FLING_VELOCITY) {
            if (this.currentPage > 0) {
                this._flingToPage(this.currentPage - 1, vx);
            } else {
                this._flingToPage(0, vx);
            }
        } else {
            let page = this.currentPage;
            let progress = (this.scroller.getCurrX() - this.getScrollOffsetOfPage(this.currentPage)) / this.state.containerWidth;
            if (progress > 1 / 3) {
                page += 1;
            } else if (progress < -1 / 3) {
                page -= 1;
            }
            this._scrollToIndex(this.validPage(page));
        }
    }


    /**
     * 滚动到对应X位置
     * @param index
     * @param animated
     * @private
     */
    _scrollToX = ( x ) => {
        this.scroller.startScroll(this.scroller.getCurrX(), 0, -x, 0, 0);
    }

    /**
     * 滚动到对应页
     * @param page
     * @param immediate
     * @private
     */
    _scrollToIndex = ( page, immediate ) => {
        page = this.validPage(page);
        this._onPageChanged(page);
        const finalX = this.getScrollOffsetOfPage(page);
        if (immediate) {
            this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 0);
        } else {
            this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 400);
        }
    }
    getItemLayout = ( data, index ) => {
        return {length: this.state.containerWidth, offset: this.state.containerWidth * index, index}
    }


    renderItem = ( item, index ) => {
        if (this.props.renderItem) {
            let data = Object.assign({}, item)
            data.source = {uri: this.fullUrl(item.url) };
            data.style = {width: this.state.containerWidth, height: this.state.containerHeight}
            return this.props.renderItem(data, index)
        }
        return <Image style={{width: this.state.containerWidth, height: this.state.containerHeight}}
                      resizeMode={this.props.imageResizeMode}
                      source={{uri: this.fullUrl(item.url)}}/>
    }

    renderLodaing = ( item, index ) => {
        return <View pointerEvents='none' style={styles.loading}>
            {this.props.renderIndicator(item, index)}
        </View>
    }

    renderFooter = () => {
        return <View pointerEvents='none' style={styles.footer}>
            {this.props.renderFooter(this.currentPage)}
        </View>
    }

    renderHeader = () => {
        return <View pointerEvents='none' style={styles.header}>
            {this.props.renderHeader(this.currentPage)}
        </View>
    }

    renderCell = ( {item, index} ) => {
        return <ZoomView key={index}
                         ref={( refs ) => {
                             this.imagesRef.set(index, refs)
                         }}
                         style={styles.content}
                         maxScale={this.props.maxScale}
                         minScale={this.props.minScale}
                         contentAspectRatio={this.contentSizeByIndex(index).width / this.contentSizeByIndex(index).height}
                         onResponderGrant={this._onResponderGrant.bind(this)}
                         onResponderMove={this.props.onResponderMove}
                         onResponderEnd={this.props.onResponderEnd}
                         zoomEnable={this.props.zoomEnable ? this.props.zoomEnable : !item.disableZoom}
                         enableDoubleClickZoom={this.props.enableDoubleClickZoom}
                         swipeDownThreshold={this.props.swipeDownThreshold}
                         onPress={() => {
                             this.props.onPress && this.props.onPress(index)
                         }}
                         onLongPress={this.props.onLongPress ? () => {
                             this.props.onLongPress(index)
                         } : null}
                         onDoubleClick={() => {
                             this.props.onDoubleClick && this.props.this.props.onDoubleClick(index)
                         }}
                         onSwipeDown={( vx ) => {
                             this._onSwipeDown(vx)
                         }}
                         horizontalOuterRangeOffset={( offset ) => {
                             this._scrollToX(offset)
                         }}
                         longPressThreshold={this.props.longPressThreshold}>
            {this.renderItem(item, index)}
            {this.props.renderIndicator && this.renderLodaing(item, index)}
        </ZoomView>
    }


    render() {
        const parentStyles = StyleSheet.flatten(this.props.style);
        return (
            <View style={[styles.container, {...parentStyles}]}>
                <FlatList style={{flex: 1}}
                          ref={refs => {
                              this.scroll = refs;
                          }}
                          initialScrollIndex={this.props.initIndex}
                          getItemLayout={this.getItemLayout}
                          scrollEnabled={false}
                          onLayout={this._onScrollLayout}
                          horizontal={true}
                          pagingEnabled={true}
                          nestedScrollEnabled={true}
                          showsHorizontalScrollIndicator={false}
                          showsVerticalScrollIndicator={false}
                          data={this.props.dataSource}
                          keyExtractor={( item, index ) => item.url + index}
                          renderItem={this.renderCell}/>
                {this.props.renderHeader && this.renderHeader()}
                {this.props.renderFooter && this.renderFooter()}
            </View>
        )

    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loading: {
        flex: 1,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flex: 1,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'flex-end'
    },
    header: {
        flex: 1,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    }
})
