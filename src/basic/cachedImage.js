/**
 * @overview 文件描述
 * @author heykk
 */

import React from "react";
import {Image} from "react-native";
import {fetchImage} from "../helpers/ImageHelper";

export type CachedImageSource = {
    uri:string
}

export type CachedImageProps = {
    source:CachedImageSource
}

export default class CachedImage extends React.PureComponent <CachedImageProps>{

    constructor(props) {
        super(props);
        this.state = {
            uri: null
        };
    }

    componentDidMount() {
        this.props.onLoadStart && this.props.onLoadStart()
        if (this.props.source) {
            if( /^http/.test(this.props.source.uri)){
                fetchImage(this.props.source.uri)
                    .then(uri => {
                        this.setState({
                            uri: uri,
                            showDefaultImage: false
                        })
                    })
            }
            else{
                this.setState({
                    uri: this.props.source.uri,
                    showDefaultImage: false
                })
            }

        }
    }

    render() {
        let props = Object.assign({}, this.props);
        if (this.state.uri) {
            props.source = {
                uri: this.state.uri
            };
        }
        else{
            delete props.source;
        }
        return <Image {...props}/>
    }
}
