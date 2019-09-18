import * as React from 'react';
import {
    Animated, Easing,
    LayoutChangeEvent,
    NativeModules,
    PanResponder,
    PanResponderInstance,
    Platform,
    PlatformOSType,
    StyleSheet,
    View
} from 'react-native';
import {ZoomViewProps, SwipeDirectionType} from './types';
import {createResponder} from 'react-native-gesture-responder';
import Scroller from './scroll/scroller';
import {
    alignedRect,
    availableTranslateSpace,
    fitCenterRect,
    getTransform, Rect,
    Transform,
    transformedRect
} from "./transformUtils";

export default class ZoomView extends React.Component<ZoomViewProps> {
    static defaultProps = {
        zoomEnable: true,
        enableDoubleClickZoom: true,
        minScale: 1,
        maxScale: 2.5,
        maxOverScrollDistance: 20,
        longPressThreshold:2500
    }

    constructor(props) {
        super(props)

        /**手势开始时间搓**/
        this.startInterval = null;

        /**为true时，滑动会控制在当页内**/
        this.ignorSwipe = false;

        /**
         * 是否正在滑动
         */
        this.isPaning = false;

        /***
         * 是否在长按
         * @type {boolean}
         */
        this.isLongPress = false;

        /**
         * 长按计时器
         * @type {null}
         */
        this.longPressTimer = null


        this._reset = this._reset.bind(this)
        this._viewPortRect = new Rect();

        this.state = {
            scale: 1,
            translateY: 0,
            translateX: 0,
            width: 0,
            height: 0,
            animator: new Animated.Value(0),
        };

        this.imagePanResponder = createResponder({
            onStartShouldSetResponder: () => true,
            onResponderTerminationRequest: () => false,
            onResponderGrant: this._onResponderGrant.bind(this),
            onResponderMove: this._onResponderMove.bind(this),
            onResponderRelease: this._onResponderRelease.bind(this),
            onResponderTerminate: this._onResponderRelease.bind(this)
        });
        this.scroller = new Scroller(true, (dx, dy, scroller) => {

            if (dx === 0 && dy === 0 && scroller.isFinished()) {
                this.animateBounce();
                return;
            }
            this.updateTransform({
                translateX: this.state.translateX + dx / this.state.scale,
                translateY: this.state.translateY + dy / this.state.scale
            })
        });
    }

    /***
     * 开始长按计时器
     * @private
     */
    _startLongPressTimer(){
        if(this.longPressTimer){
            clearTimeout(this.longPressTimer)
        }
        this.longPressTimer = setTimeout(()=>{
            if(!!this.props.onLongPress){
                this.isLongPress = true;
                this.props.onLongPress()
                this.longPressTimer = null;
            }
        },this.props.longPressThreshold)
    }


    /**
     * 结束长按计时器
     * @private
     */
    _cleanLongPressTimer(){
        if(this.longPressTimer){
            clearTimeout(this.longPressTimer)
            this.longPressTimer = null;
        }
        this.isLongPress = false;
    }


    _onResponderGrant(evt, gestureState) {
        this.startInterval = new Date().getTime()
        this.ignorSwipe = false;
        this.isPaning = false;
        if(this.props.onLongPress){
            this.isLongPress = true;
            this._startLongPressTimer()
        }
        this.startPoint = {x:evt.nativeEvent.locationX,y:evt.nativeEvent.locationY}
        this.props.onResponderGrant(evt, gestureState)
    }

    _onResponderMove(evt, gestureState) {
        if (this.props.onResponderMove) {
            this.props.onResponderMove(evt, gestureState)
            return;
        }
        this._cleanLongPressTimer()
        this.cleanAnimation()
        let dx = gestureState.moveX - gestureState.previousMoveX;
        let dy = gestureState.moveY - gestureState.previousMoveY;

        if (gestureState.previousPinch && gestureState.pinch && this.props.zoomEnable) {
            this.ignorSwipe = true;
            let scaleBy = gestureState.pinch / gestureState.previousPinch;
            let pivotX = gestureState.moveX;
            let pivotY = gestureState.moveY;

            let rect = transformedRect(transformedRect(this.contentRect(), this.currentTransform()), new Transform(
                scaleBy, dx, dy,
                {
                    x: pivotX,
                    y: pivotY
                }
            ));
            let transform = getTransform(this.contentRect(), rect);
            this.updateTransform(transform);
        } else {
            /**超出边界**/
            if (this.isOutRange(gestureState)) {
                this.isPaning = true;
                this.props.horizontalOuterRangeOffset && this.props.horizontalOuterRangeOffset(dx)
            }
            else {
                this.ignorSwipe = true;
                if (Math.abs(dx) > 2 * Math.abs(dy)) {
                    dy = 0;
                } else if (Math.abs(dy) > 2 * Math.abs(dx)) {
                    dx = 0;
                }
                let transform = {
                    translateX: this.state.translateX + dx / this.state.scale,
                    translateY: this.state.translateY + dy / this.state.scale
                };
                this.updateTransform(transform);
            }
        }
    }

    _onResponderRelease(evt, gestureState) {
        if (this.props.onResponderEnd) {
            this.props.onResponderEnd(evt, gestureState)
            return
        }
        this._cleanLongPressTimer()
        if(gestureState.singleTapUp){
            this.props.onPress && this.props.onPress()
            return;
        }
        /**双击**/
        if (gestureState.doubleTapUp) {
            if (this.props.enableDoubleClickZoom) {
                let pivotX = 0, pivotY = 0;
                if (gestureState.dx || gestureState.dy) {
                    pivotX = gestureState.moveX;
                    pivotY = gestureState.moveY;
                } else {
                    pivotX = gestureState.x0;
                    pivotY = gestureState.y0;
                }
                this.performDoubleTapUp(pivotX, pivotY);
            }
            this.props.onDoubleClick && this.props.onDoubleClick()
        }
        else {
            if (gestureState.dy === 0 && gestureState.dx === 0) {
                return
            }
            /**超出边界**/
            if (this.isOutRange(gestureState)) {
                this.props.onSwipeDown && this.props.onSwipeDown(gestureState.vx)
            }
            else {
                this.performFling(gestureState.vx, gestureState.vy);
            }
        }
    }

    /**
     * 判断是否超出边界
     * @param dx
     * @returns {boolean}
     */
    isOutRange(gestureState) {
        if (this.ignorSwipe) {
            return false;
        }
        if (this.isPaning) {
            return true;
        }
        let dx = gestureState.moveX - gestureState.previousMoveX;
        let lastTranformRect = this.transformedContentRect()
        let translateX = this.state.translateX + dx / this.state.scale
        if (Math.abs(translateX) * this.state.scale >= (lastTranformRect.width() - this.viewPortRect().width()) / 2) {
            return true;
        }
        return false;
    }

    /**
     * 边界计算
     */
    animateBounce() {
        let curScale = this.state.scale;
        let minScale = 1;
        let maxScale = this.props.maxScale;
        let scaleBy = 1;
        if (curScale > maxScale) {
            scaleBy = maxScale / curScale;
        } else if (curScale < minScale) {
            scaleBy = minScale / curScale;
        }
        let rect = transformedRect(this.transformedContentRect(), new Transform(
            scaleBy,
            0,
            0,
            {
                x: this.viewPortRect().centerX(),
                y: this.viewPortRect().centerY()
            }
        ));
        rect = alignedRect(rect, this.viewPortRect());
        this.animate(rect)
    }


    /**
     * 双击
     * @param pivotX
     * @param pivotY
     */
    performDoubleTapUp(pivotX, pivotY) {

        let curScale = this.state.scale;
        let scaleBy;
        if (curScale > (1 + this.props.maxScale) / 2) {
            scaleBy = 1 / curScale;
        } else {
            scaleBy = this.props.maxScale / curScale;
        }
        let rect = transformedRect(this.transformedContentRect(), new Transform(
            scaleBy, 0, 0,
            {
                x: pivotX,
                y: pivotY
            }
        ));
        rect = transformedRect(rect, new Transform(1, this.viewPortRect().centerX() - pivotX, this.viewPortRect().centerY() - pivotY));
        rect = alignedRect(rect, this.viewPortRect());
        this.animate(rect);
    }


    performFling(vx, vy) {
        let startX = 0;
        let startY = 0;
        let maxX, minX, maxY, minY;
        let availablePanDistance = availableTranslateSpace(this.transformedContentRect(), this.viewPortRect());
        if (vx > 0) {
            minX = 0;
            if (availablePanDistance.left > 0) {
                maxX = availablePanDistance.left + this.props.maxOverScrollDistance;
            } else {
                maxX = 0;
            }
        } else {
            maxX = 0;
            if (availablePanDistance.right > 0) {
                minX = -availablePanDistance.right - this.props.maxOverScrollDistance;
            } else {
                minX = 0;
            }
        }
        if (vy > 0) {
            minY = 0;
            if (availablePanDistance.top > 0) {
                maxY = availablePanDistance.top + this.props.maxOverScrollDistance;
            } else {
                maxY = 0;
            }
        } else {
            maxY = 0;
            if (availablePanDistance.bottom > 0) {
                minY = -availablePanDistance.bottom - this.props.maxOverScrollDistance;
            } else {
                minY = 0;
            }
        }
        vx *= 1000; //per second
        vy *= 1000;
        if (Math.abs(vx) > 2 * Math.abs(vy)) {
            vy = 0;
        } else if (Math.abs(vy) > 2 * Math.abs(vx)) {
            vx = 0;
        }
        this.scroller.fling(startX, startY, vx, vy, minX, maxX, minY, maxY);
    }

    currentTransform() {
        return new Transform(this.state.scale, this.state.translateX, this.state.translateY);
    }

    viewPortRect() {
        this._viewPortRect.set(0, 0, this.state.width, this.state.height);
        return this._viewPortRect;
    }

    contentRect() {
        let rect = this.viewPortRect().copy();
        if (this.contentAspectRatio && this.contentAspectRatio > 0) {
            rect = fitCenterRect(this.contentAspectRatio, rect);
        }
        return rect;
    }

    transformedContentRect() {
        let rect = transformedRect(this.viewPortRect(), this.currentTransform());
        if (this.contentAspectRatio && this.contentAspectRatio > 0) {
            rect = fitCenterRect(this.contentAspectRatio, rect);
        }
        return rect;
    }

    /**
     * 更新transform
     * @param transform
     */
    updateTransform(transform) {
        this.setState({
            scale: transform.scale || this.state.scale,
            translateX: transform.translateX,
            translateY: transform.translateY
        })
    }

    /**
     * 内容长宽比例
     * @returns {number}
     */
    get contentAspectRatio() {
        return this.props.contentAspectRatio
    }

    cleanAnimation() {
        this.state.animator.removeAllListeners();
        this.state.animator.stopAnimation();
    }

    animate(targetRect, duration = 250) {
        let fromRect = this.transformedContentRect();
        if (fromRect.equals(targetRect)) {
            return;
        }
        this.state.animator.removeAllListeners();
        this.state.animator.setValue(0);
        this.state.animator.addListener((state) => {
            let progress = state.value;

            let left = fromRect.left + (targetRect.left - fromRect.left) * progress;
            let right = fromRect.right + (targetRect.right - fromRect.right) * progress;
            let top = fromRect.top + (targetRect.top - fromRect.top) * progress;
            let bottom = fromRect.bottom + (targetRect.bottom - fromRect.bottom) * progress;

            let transform = getTransform(this.contentRect(), new Rect(left, top, right, bottom));
            this.updateTransform(transform);
        });

        Animated.timing(this.state.animator, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
        }).start();
    }

    /**
     * 图片区域视图渲染完毕
     */
    _handleLayout(event) {
        const {layout: {width, height}} = event.nativeEvent;
        this.setState({
            width: width,
            height: height,
        })
    }

    /**
     * 重置大小和位置
     */
    _reset() {
        this.updateTransform({
            translateX: 0,
            translateY: 0,
            scale: 1
        })
    }

    render() {
        const parentStyles = StyleSheet.flatten(this.props.style);
        return (
            <View style={{
                ...styles.container,
                ...parentStyles,
            }}
                  onLayout={this._handleLayout.bind(this)}
                  {...this.imagePanResponder}>
                <View renderToHardwareTextureAndroid={this.props.renderToHardwareTextureAndroid}
                      style={[{flex: 1}, {
                          transform: [
                              {
                                  scale: this.state.scale
                              },
                              {
                                  translateX: this.state.translateX
                              },
                              {
                                  translateY: this.state.translateY
                              }
                          ]
                      }]}>
                    {this.props.children}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'transparent'
    }
})
