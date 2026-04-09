import { getFilePresignedDownloadUrl } from '@/api/storage'

class FileUrlUtils {
    /**
     * 获取文件的完整URL（支持下载或预览）
     * @param relativeUrl 相对路径或完整URL
     * @returns 完整的URL字符串
     */
    static async getFullUrl(relativeUrl: string): Promise<string> {
        if (!relativeUrl) {
            return ''
        }

        // 如果是绝对URL（http/https）或者是data URL、blob URL，直接返回
        if (
            relativeUrl.startsWith('http') ||
            relativeUrl.startsWith('https') ||
            relativeUrl.startsWith('data:') ||
            relativeUrl.startsWith('blob:')) {
            return relativeUrl
        }

        // 如果是相对路径，获取预签名下载URL
        try {
            const response = await getFilePresignedDownloadUrl(relativeUrl)
            // 根据后端返回数据结构调整，这里假设返回的data是URL字符串
            return response.data || ''
        } catch (error) {
            console.error('获取文件预览地址失败:', error)
            return relativeUrl
        }
    }

    /**
     * 批量获取文件URL（用于优化多个文件的获取）
     * @param urls URL数组
     * @returns URL数组的Promise
     */
    static async getFullUrls(urls: string[]): Promise<string[]> {
        const promises = urls.map(url => this.getFullUrl(url))
        return Promise.all(promises)
    }
}

export default FileUrlUtils
