import * as FileApi from '@/api/storage'
import { UploadRequestOptions } from 'element-plus/es/components/upload/src/upload'
import axios from 'axios'

/**
 * API响应接口
 */
interface ApiResponse<T = any> {
    code: number
    data: T
    msg?: string
}

/**
 * 附件上传结果接口
 */
interface AttachmentUploadResult  {
    name: string
    url: string
    size: number
    platform: string
}

/**
 * 数据导入结果接口（由各业务模块定义，此处为示例）
 */
interface DataImportResult<T = any> {
    code: number       // 响应码
    data: T           // 导入数据
    msg?: string      // 响应消息
    total?: number    // 总条数
    success?: number  // 成功条数
    failed?: number   // 失败条数
    errors?: any[]    // 错误详情
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

/**
 * 数据文件导入参数接口
 */
interface DataImportParams<T = any> {
    importApi: (data: { file: File, [key: string]: any }) => Promise<any>  // 导入接口函数
    data?: Record<string, any>                                              // 额外的业务参数
}

/**
 * 文件上传 Composable
 * 提供附件上传和数据文件导入两种功能
 */
export const useFileUpload = () => {
    const isClientUpload = UPLOAD_TYPE.CLIENT === import.meta.env.VITE_UPLOAD_TYPE

    /**
     * 服务端上传（附件）
     */
    const handleServerUpload = async (file: File): Promise<AttachmentUploadResult > => {
        try {
            const response = await FileApi.updateFile({ file })

            // 修复类型转换问题 - 先转换为 unknown 再转换为 ApiResponse
            const res = (response as unknown) as ApiResponse<AttachmentUploadResult >

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
     * 客户端直传（附件）
     */
    const handleClientUpload = async (file: File): Promise<AttachmentUploadResult > => {
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
     * 上传附件 - 直接接收 File 对象
     */
    const uploadAttachmentSimplify = async (file: File): Promise<AttachmentUploadResult> => {
        if (isClientUpload) {
            return handleClientUpload(file)
        } else {
            return handleServerUpload(file)
        }
    }

    /**
     * 上传附件
     * 返回类型：AttachmentUploadResult
     */
    const uploadAttachment = async (options: UploadRequestOptions): Promise<AttachmentUploadResult > => {
        return uploadAttachmentSimplify(options.file)
    }

    /**
     * 导入数据文件
     * 返回类型：由业务模块的接口决定，使用泛型 T 表示
     */
    const uploadDataImport = async <T = any>(
        options: UploadRequestOptions,
        params: DataImportParams<T>
    ): Promise<T> => {
        if (!params.importApi || typeof params.importApi !== 'function') {
            throw new Error('导入接口函数不能为空')
        }

        try {
            const requestData: { file: File, [key: string]: any } = {
                file: options.file
            }

            if (params.data) {
                Object.keys(params.data).forEach(key => {
                    requestData[key] = params.data![key]
                })
            }

            const response = await params.importApi(requestData)
            return response as T
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : '数据文件导入失败')
        }
    }

    return {
        uploadAttachment,     // 附件上传
        uploadAttachmentSimplify,     // 附件上传简化
        uploadDataImport      // 数据文件导入
    }
}

// 导出类型供外部使用
export type { AttachmentUploadResult, DataImportResult, DataImportParams, ApiResponse }
