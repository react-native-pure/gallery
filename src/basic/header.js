/**
 * @flow
 * @overview header
 * @author heykk
 */

import React from 'react'
import {Text, View, StyleSheet, Platform, TouchableOpacity} from 'react-native'

export type HeaderProps = {
    title:string,
    onTitlePress:()=>void,
    onClose:()=>void,
    onConfirm:()=>void,
    /***
     * 隐藏右上角按钮
     */
    hiddenRight:boolean,

    headerLeftStyle?:any,
    headerRightStyle?:any,
    headerTitleStyle?:any,
    renderLeft?:()=>void,
    renderRight?:()=>void

}
export default React.memo<HeaderProps>(( props ) => {

    const {title, onClose, onConfirm, onTitlePress, hiddenRight, headerTitleStyle = {}, headerLeftStyle = {}, headerRightStyle = {}, renderLeft, renderRight} = props;

    return (
        <View style={styles.container}>
            {!renderLeft && <Text style={[styles.left, headerLeftStyle]} onPress={onClose}>关闭</Text>}
            {!!renderLeft && renderLeft()}
            <TouchableOpacity onPress={onTitlePress}>
                <Text style={[styles.title, headerTitleStyle]}>{title}</Text>
            </TouchableOpacity>
            {!hiddenRight && !!renderRight && renderRight()}
            {!hiddenRight && !renderRight &&
            <Text style={[styles.right, headerRightStyle]} onPress={onConfirm}>确定</Text>}
            {hiddenRight && <View style={[styles.right, headerRightStyle]}/>}
        </View>
    )
})

const styles = StyleSheet.create({
    container: {
        ...Platform.select({
            ios: {
                height: 44
            },
            android: {
                height: 54
            }
        }),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        color: '#fff',
        fontSize: 17,
    },
    left: {
        color: '#fff',
        fontSize: 15,
        paddingHorizontal:12,
        paddingVertical:15
    },
    right: {
        color: '#fff',
        fontSize: 15,
        paddingHorizontal:12,
        paddingVertical:15
    }
})
