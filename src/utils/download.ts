// utils/download.ts
import cache from '@/utils/cache'
import constant from '@/utils/constant'
import { ElMessage } from 'element-plus'

export type DownloadType = 'attachment' | 'export'

interface DownloadOptions {
    /** 下载类型：'attachment' 附件下载 | 'export' 系统导出，默认 'export' */
    type?: DownloadType
    /** 自定义文件名 */
    fileName?: string
    /** 自定义请求头 */
    headers?: Record<string, string>
    /** 是否显示加载提示 */
    showLoading?: boolean
}

/**
 * Blob 流式下载
 * @param url 下载地址
 * @param options 配置选项
 */
export const downloadByBlob = (url: string, options: DownloadOptions = {}): Promise<void> => {
    const {
        type = 'export',
        headers = {},
        fileName,
        showLoading = true
    } = options

    return new Promise((resolve, reject) => {
        if (showLoading) {
            ElMessage.info('正在下载，请稍候...')
        }

        // 构建请求头
        const requestHeaders: HeadersInit = { ...headers }

        // 只有系统导出才需要添加 access_token
        if (type === 'export') {
            const token = cache.getToken()
            if (token) {
                requestHeaders['Authorization'] = token
            }
        }

        fetch(url, {
            headers: requestHeaders
        })
            .then(async response => {
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}))
                    throw new Error(error.msg || '下载失败')
                }

                const blob = await response.blob()
                const disposition = response.headers.get('content-disposition')
                let finalFileName = fileName

                if (!finalFileName && disposition) {
                    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                    if (match && match[1]) {
                        finalFileName = match[1].replace(/['"]/g, '')
                    }
                }

                // 创建下载链接
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = finalFileName || 'download'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(link.href)

                if (showLoading) {
                    ElMessage.success('下载成功')
                }
                resolve()
            })
            .catch(err => {
                ElMessage.error(err.message || '下载失败，请重试')
                reject(err)
            })
    })
}

/**
 * location 方式下载（直接跳转）
 * @param url 下载地址
 * @param options 配置选项
 */
export const downloadByLocation = (url: string, options: DownloadOptions = {}) => {
    const { type = 'export', headers = {} } = options

    let fullUrl = url

    // 如果是相对路径，拼接 baseURL
    if (!url.startsWith('http') && !url.startsWith('https') &&
        !url.startsWith('data:') && !url.startsWith('blob:')) {
        fullUrl = constant.apiUrl + url
    }

    // 只有系统导出才需要添加 access_token（GET 参数方式）
    if (type === 'export') {
        const token = cache.getToken()
        if (token) {
            const separator = fullUrl.includes('?') ? '&' : '?'
            fullUrl += separator + 'access_token=' + token
        }
    }

    location.href = fullUrl
}

/**
 * 附件下载（从文件存储平台下载）
 * 特点：不需要 access_token，通过预签名 URL 下载
 */
export const downloadAttachment = (presignedUrl: string, fileName?: string) => {
    return downloadByBlob(presignedUrl, {
        type: 'attachment',
        fileName,
        showLoading: true
    })
}

/**
 * 系统导出下载
 * 特点：需要 access_token，由本系统生成文件
 */
export const downloadExport = (url: string, fileName?: string) => {
    return downloadByBlob(url, {
        type: 'export',
        fileName,
        showLoading: true
    })
}

/**
 * 系统导出下载（location 方式，适用于大文件或直接返回文件流）
 */
export const downloadExportByLocation = (url: string) => {
    downloadByLocation(url, { type: 'export' })
}
