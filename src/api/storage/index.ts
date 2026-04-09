import service from '@/utils/request'

// 后端上传文件
export const updateFile = (data: { file: File }) => {
    const formData = new FormData();
    formData.append('file', data.file); // 确保字段名与后端一致（通常是 'storage'）

    return service.post('/storage/file/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data' // 必须设置正确的 Content-Type
        }
    })
}

// 获取文件预签名上传地址信息
export const getFilePresignedUploadUrl = (fileName: string) => {
    return service.get('/storage/file/presigned-url/upload?fileName=' + fileName)
}

// 获取文件预签名下载地址
export const getFilePresignedDownloadUrl = (path: string) => {
    return service.get('/storage/file/presigned-url/download?path=' + path)
}
