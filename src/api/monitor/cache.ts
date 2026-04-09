import service from '@/utils/request'

export const useCacheInfoApi = () => {
	return service.get('/monitor/cache/info')
}
// 查询缓存名称列表
export const listCacheName = () =>  {
	return service.get('/monitor/cache/getCacheName')
}

// 查询缓存键名列表
export const listCacheKey = (cacheName: string) => {
	return service.get('/monitor/cache/getCacheKeys/' + cacheName)
}

// 查询缓存内容
export const getCacheValue = (cacheName: string, cacheKey: string) => {
	return service.get('/monitor/cache/getCacheValue/' + cacheName + '/' + cacheKey)
}

// 清理指定名称缓存
export const clearCacheName = (cacheName: string) => {
	return service.delete('/monitor/cache/clearCacheName/' + cacheName)
}

// 清理指定键名缓存
export const clearCacheKey = (cacheKey: string) => {
	return service.delete('/monitor/cache/clearCacheKey/' + cacheKey)
}

// 清理全部缓存
export const clearCacheAll = () => {
	return service.delete('/monitor/cache/clearCacheAll')
}
