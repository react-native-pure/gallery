/**
 * @overview 文件描述
 * @author heykk
 */

import React from "react";
import RNFetchBlob from "rn-fetch-blob";
import md5 from 'md5'
import URLParse from "url-parse"

export function getCacheImagePath(uri: String): String {
    if (uri) {
        const url = URLParse(uri);
        let ext = getFileExt(url.pathname);
        if(ext.split('/').length>1){
            ext = 'png'
        }
        const filename = md5(uri);
        return `${RNFetchBlob.fs.dirs.DocumentDir}/images/${filename}.${ext}`;
    }
    return null;
}


export function getFileExt(str) {
    const index = str.lastIndexOf(".");
    return str.substring(index + 1);
}



/**
 * 获取图片文件,如果图片文件不存在就先下载到本地
 * @param uri
 * @return {Promise<*>}
 */
export async function fetchImage(uri: String): String {
  //  console.log(`下载图片:${uri}`);
    if (uri) {
        const path = getCacheImagePath(uri);
      //  console.log(`文件路径:${path}`);
        const exists = await RNFetchBlob.fs.exists(path).catch(() => false);
        if (exists) {
            return `file://${path}`;
        }
        else {
            return RNFetchBlob
                .config({
                    path
                })
                .fetch('GET', encodeURI(uri))
                .then(() => {
                    return `file://${path}`;
                })
                .catch(err => {
                 //   const message = `图片${uri}下载失败:${err.message}`;
                    // postError(message)
                  //  console.log(`%c${message}`, "background-color:red")
                    return null;
                });
        }
    }
    return Promise.resolve(null);
}
