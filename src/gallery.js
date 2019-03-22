import * as React from 'react';
import {
    Animated,
    Dimensions,
    View,
    StyleSheet,
    ScrollView,
    ImageBackground,
    Image,
    Platform,
    I18nManager
} from 'react-native';
import {GalleryProps, SwipeDirectionType} from './types';
import ZoomView from './zoomView';
import Scroller from 'react-native-scroller';
import {createResponder} from 'react-native-gesture-responder';

const MIN_FLING_VELOCITY = 0.5;

export default class GalleryViewer extends React.Component<GalleryProps> {

    static defaultProps = {
        style: {},
        dataSource: null,
        maximumZoomScale: 2.5,
        minimumZoomScale: 1,
        zoomEnable: true
    }

    constructor(props) {
        super(props)
        this.currentPage = 0;
        this.state = {
            contentWidth: 0,
            contentHeight: 0,
        }
        // this.gestureResponder = createResponder({
        //     onStartShouldSetResponder: (evt, gestureState) => true,
        //     onResponderTerminationRequest: () => false,
        //     onResponderGrant: this.onResponderGrant.bind(this),
        //     onResponderMove: this.onResponderMove.bind(this),
        //     onResponderRelease: this.onResponderRelease.bind(this),
        //     onResponderTerminate: this.onResponderRelease.bind(this)
        // });
        this.scroller = new Scroller(true, (dx, dy, scroller) => {
            if (dx === 0 && dy === 0 && scroller.isFinished()) {

            } else {
                const curX = this.scroller.getCurrX();
                this.scroll.scrollTo({x: curX, animated: false});
            }
        });
    }


    onResponderGrant(evt, gestureState) {
        // this.scroller.forceFinished(true);
    }

    // onResponderMove(evt, gestureState) {
    //     let dx = gestureState.moveX - gestureState.previousMoveX;
    //     this.scrollByOffset(dx);
    // }

    onResponderRelease(evt, gestureState, disableSettle) {
        if (!disableSettle) {
            this.settlePage(gestureState.vx);
        }
    }

    // scrollByOffset(dx) {
    //     this.scroller.startScroll(this.scroller.getCurrX(), 0, -dx, 0, 0);
    // }

    get pageCount() {
        return this.props.dataSource.length || 0
    }

    settlePage(vx) {
        if (vx < -MIN_FLING_VELOCITY) {
            if (this.currentPage < this.pageCount - 1) {
                this.flingToPage(this.currentPage + 1, vx);
            } else {
                this.flingToPage(this.pageCount - 1, vx);
            }
        } else if (vx > MIN_FLING_VELOCITY) {
            if (this.currentPage > 0) {
                this.flingToPage(this.currentPage - 1, vx);
            } else {
                this.flingToPage(0, vx);
            }
        } else {
            let page = this.currentPage;
            let progress = (this.scroller.getCurrX() - this.getScrollOffsetOfPage(this.currentPage)) / this.state.contentWidth;
            if (progress > 1 / 3) {
                page += 1;
            } else if (progress < -1 / 3) {
                page -= 1;
            }
            page = Math.min(this.pageCount - 1, page);
            page = Math.max(0, page);
            this.scrollToPage(page);
        }
    }

    onPageChanged(page) {
        if (this.currentPage !== page) {
            this.currentPage = page
        }
    }


    flingToPage(page, velocityX) {
        page = this.validPage(page);
        this.onPageChanged(page);

        velocityX *= -1000; //per sec
        const finalX = this.getScrollOffsetOfPage(page);
        this.scroller.fling(this.scroller.getCurrX(), 0, velocityX, 0, finalX, finalX, 0, 0);

    }

    getScrollOffsetOfPage(page) {
        return page * this.state.contentWidth;
    }

    validPage(page) {
        page = Math.min(this.props.dataSource.length - 1, page);
        page = Math.max(0, page);
        return page;
    }

    /***
     * scrollView layout
     * @param event
     * @private
     */
    _onScrollLayout = (event) => {
        const {layout: {width, height}} = event.nativeEvent;
        this.setState({
            contentWidth: width,
            contentHeight: height,
        }, () => {
            setTimeout(() => {
                this._scrollToIndex(this.props.initIndex, true)
            }, 0)
        })
    }

    /**
     * 滑动结束
     * @param direction
     * @private
     */
    _onSwipeDown = (vx) => {

        if (vx < -MIN_FLING_VELOCITY) {
            if (this.currentPage < this.pageCount - 1) {
                this.flingToPage(this.currentPage + 1, vx);
            } else {
                this.flingToPage(this.pageCount - 1, vx);
            }
        } else if (vx > MIN_FLING_VELOCITY) {
            if (this.currentPage > 0) {
                this.flingToPage(this.currentPage - 1, vx);
            } else {
                this.flingToPage(0, vx);
            }
        } else {
            let page = this.currentPage;
            let progress = (this.scroller.getCurrX() - this.getScrollOffsetOfPage(this.currentPage)) / this.state.contentWidth;
            if (progress > 1 / 3) {
                page += 1;
            } else if (progress < -1 / 3) {
                page -= 1;
            }
            page = Math.min(this.pageCount - 1, page);
            page = Math.max(0, page);
            this._scrollToIndex(page);
        }
    }


    /**
     * 滚动到对应X位置
     * @param index
     * @param animated
     * @private
     */
    _scrollToX(x) {
        this.scroller.startScroll(this.scroller.getCurrX(), 0, -x, 0, 0);
    }

    /**
     * 滚动到对应页
     * @param page
     * @param immediate
     * @private
     */
    _scrollToIndex(page, immediate) {
        page = this.validPage(page);
        this.onPageChanged(page);

        const finalX = this.getScrollOffsetOfPage(page);
        if (immediate) {
            this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 0);
        } else {
            this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 400);
        }

    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.initIndex != this.currentPage) {
            this._scrollToIndex(nextProps.initIndex, false)
        }
    }

    renderItem(item, index) {

        if (this.props.renderItem) {
            let data = Object.assign({}, item)
            data.source = {uri: item.url};
            data.style = {width: this.state.contentWidth, height: this.state.contentHeight}
            return this.props.renderItem(data, index)
        }
        return <Image style={{width: this.state.contentWidth, height: this.state.contentHeight}}
                      source={{uri: item.url}}/>
    }

    render() {

        const parentStyles = StyleSheet.flatten(this.props.style);
        return (
            <View style={[styles.container, {...parentStyles}]}>
                <ScrollView style={{flex: 1}}
                            ref={refs => {
                                this.scroll = refs;
                            }}
                            scrollEnabled={false}
                            onLayout={this._onScrollLayout}
                            horizontal={true}
                            pagingEnabled={true}
                            nestedScrollEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}>
                    {this.props.dataSource && this.props.dataSource.map((item, index) => {

                        return <ZoomView
                            key={index}
                            style={styles.content}
                            cropWidth={this.state.contentWidth}
                            cropHeight={this.state.contentHeight}
                            imageWidth={this.state.contentWidth}
                            imageHeight={this.state.contentHeight}
                            maxOverflow={this.props.maxOverflow}
                            onResponderGrant={this.onResponderGrant.bind(this)}
                            horizontalOuterRangeOffset={(offset) => {
                                this._scrollToX(offset)
                            }}
                            onDoubleClick={this.props.onDoubleClick}
                            enableSwipeDown={this.props.zoomEnable}
                            swipeDownThreshold={this.props.swipeDownThreshold}
                            onSwipeDown={(vx) => {
                                this._onSwipeDown(vx)
                            }}
                            pinchToZoom={this.props.zoomEnable}
                            enableDoubleClickZoom={this.props.zoomEnable}
                            doubleClickInterval={this.props.doubleClickInterval}>
                            {this.renderItem(item, index)}
                        </ZoomView>
                    })}
                </ScrollView>
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
    }

})
