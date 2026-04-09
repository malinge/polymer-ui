import * as FileApi from '@/api/storage'
import { UploadRequestOptions } from 'element-plus/es/components/upload/src/upload'
import axios from 'axios'

interface UploadResult {
    name: string
    url: string
    size: number
    platform: string
}

interface ApiResponse<T = any> {
    code: number
    data: T
    msg?: string
}

/**
 * 上传类型
 */
enum UPLOAD_TYPE {
    // 客户端直接上传（只支持S3服务）
    CLIENT = 'client',
    // 客户端发送到后端上传
    SERVER = 'server'
}

export const useUpload = () => {
    const isClientUpload = UPLOAD_TYPE.CLIENT === import.meta.env.VITE_UPLOAD_TYPE

    /**
     * 处理后端上传逻辑
     */
    const handleServerUpload = async (file: File): Promise<UploadResult> => {
        try {
            const response = await FileApi.updateFile({ file })

            // 修复类型转换问题 - 先转换为 unknown 再转换为 ApiResponse
            const res = (response as unknown) as ApiResponse<UploadResult>

            if (res.code === 0) {
                return res.data
            } else {
                throw new Error(res.msg || '文件上传失败')
            }
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : '文件上传失败')
        }
    }

    /**
     * 处理客户端直传逻辑
     */
    const handleClientUpload = async (file: File): Promise<UploadResult> => {
        try {
            const presignedInfo = await FileApi.getFilePresignedUploadUrl(file.name)

            // 修复类型转换问题 - 先转换为 unknown 再转换为 ApiResponse
            const res = (presignedInfo as unknown) as ApiResponse<{
                platform: string
                presignedUrl: string
                path: string
            }>

            if (res.data.platform === 'LOCAL') {
                // 回退到后端上传
                return await handleServerUpload(file)
            }

            // 使用预签名URL直传
            await axios.put(res.data.presignedUrl, file, {
                headers: { 'Content-Type': file.type }
            })

            return {
                name: file.name,
                url: res.data.path,
                size: file.size,
                platform: res.data.platform
            }
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : '文件上传失败')
        }
    }

    /**
     * 重写ElUpload上传方法
     */
    const httpRequest = async (options: UploadRequestOptions): Promise<UploadResult> => {
        if (isClientUpload) {
            return handleClientUpload(options.file)
        } else {
            return handleServerUpload(options.file)
        }
    }

    return { httpRequest }
}
