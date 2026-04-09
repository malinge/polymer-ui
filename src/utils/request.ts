import axios, { AxiosResponse } from 'axios'
import qs from 'qs'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import cache from '@/utils/cache'
import { ElMessageBox } from 'element-plus/es'
import { encryptBase64, encryptWithAes, generateAesKey, decryptWithAes, decryptBase64 } from '@/utils/crypto';
import { encrypt, decrypt } from '@/utils/jsencrypt';
import {refreshWebSocketToken} from '@/utils/websocket';

const encryptHeader = 'encrypt-key';

// axios实例
const service = axios.create({
	baseURL: import.meta.env.VITE_API_URL as any,
	timeout: 60000,
	headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})

// 请求拦截器
service.interceptors.request.use(
	(config: any) => {
		const userStore = useUserStore()

		if (userStore?.token) {
			config.headers.Authorization = userStore.token
		}

		config.headers['Accept-Language'] = cache.getLanguage()

		// 追加时间戳，防止GET请求缓存
		if (config.method?.toUpperCase() === 'GET' && config.responseType !== 'blob') {
			config.params = { ...config.params, t: new Date().getTime() }
		}

		// 如果是 FormData，不要处理数据格式
		if (config.data instanceof FormData) {
			config.headers['Content-Type'] = 'multipart/form-data';
			return config;
		}

		if (Object.values(config.headers).includes('application/x-www-form-urlencoded')) {
			config.data = qs.stringify(config.data)
		}

		// 是否需要防止数据重复提交
		const isRepeatSubmit = config.headers?.repeatSubmit === false;

		if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
			const requestObj = {
				url: config.url,
				data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
				time: new Date().getTime()
			};
			const sessionObj = cache.getRequestObj();
			if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
				cache.setRequestObj(requestObj);
			} else {
				const s_url = sessionObj.url; // 请求地址
				const s_data = sessionObj.data; // 请求数据
				const s_time = sessionObj.time; // 请求时间
				const interval = 500; // 间隔时间(ms)，小于此时间视为重复提交
				if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
					const message = '数据正在处理，请勿重复提交';
					console.warn(`[${s_url}]: ` + message);
					return Promise.reject(new Error(message));
				} else {
					cache.setRequestObj(requestObj);
				}
			}
		}

		// 是否需要加密
		const isEncrypt = config.headers?.isEncrypt === 'true';

		if (import.meta.env.VITE_APP_ENCRYPT === 'true') {
			// 当开启参数加密
			if (isEncrypt && (config.method === 'post' || config.method === 'put')) {
				// 生成一个 AES 密钥
				const aesKey = generateAesKey();
				config.headers[encryptHeader] = encrypt(encryptBase64(aesKey));
				config.data = typeof config.data === 'object' ? encryptWithAes(JSON.stringify(config.data), aesKey) : encryptWithAes(config.data, aesKey);
			}
		}
		return config
	},
	error => {
		return Promise.reject(error)
	}
)

// 是否刷新
let isRefreshToken = false
// 重试请求
let requests: any[] = []

// 刷新token
const getRefreshToken = (refreshToken: string) => {
	return service.post('/sys/auth/token?refreshToken=' + refreshToken)
}

// 响应拦截器
service.interceptors.response.use(
	async (response: AxiosResponse<any>) => {
		if (import.meta.env.VITE_APP_ENCRYPT === 'true') {
			// 加密后的 AES 秘钥
			const keyStr = response.headers[encryptHeader];
			// 加密
			if (keyStr != null && keyStr != '') {
				const data = response.data;
				// 请求体 AES 解密
				const base64Str = decrypt(keyStr);
				// base64 解码 得到请求头的 AES 秘钥
				const aesKey = decryptBase64(base64Str.toString());
				// aesKey 解码 data
				const decryptData = decryptWithAes(data, aesKey);
				// 将结果 (得到的是 JSON 字符串) 转为 JSON
				response.data = JSON.parse(decryptData);
			}
		}


		const userStore = useUserStore()

		if (response.status !== 200) {
			return Promise.reject(new Error(response.statusText || 'Error'))
		}

		const res = response.data
		if (Object.prototype.toString.call(res) === '[object Blob]') {
			return response
		}

		// 响应成功
		if (res.code === 0) {
			return res
		}

		// refreshToken失效，跳转到登录页
		if (res.code === 406) {
			return handleAuthorized()
		}

		// 没有权限，如：未登录、token过期
		if (res.code === 401) {
			const config = response.config
			if (!isRefreshToken) {
				isRefreshToken = true

				// 不存在 refreshToken，重新登录
				const refreshToken = cache.getRefreshToken()
				if (!refreshToken) {
					return handleAuthorized()
				}

				try {
					const { data } = await getRefreshToken(refreshToken)
					// 设置新 token
					userStore.setToken(data.access_token)
					// 刷新WebSocket连接
					refreshWebSocketToken(data.access_token);
					config.headers!.Authorization = data.access_token
					requests.forEach((cb: any) => {
						cb()
					})
					requests = []
					return service(config)
				} catch (e) {
					// 刷新失败
					requests.forEach((cb: any) => {
						cb()
					})
					return handleAuthorized()
				} finally {
					requests = []
					isRefreshToken = false
				}
			} else {
				// 多个请求的情况
				return new Promise(resolve => {
					requests.push(() => {
						config.headers!.Authorization = userStore.token
						resolve(service(config))
					})
				})
			}
		}

		// 错误提示
		ElMessage.error(res.msg)

		return Promise.reject(new Error(res.msg || 'Error'))
	},
	error => {
		ElMessage.error(error.message)
		return Promise.reject(error)
	}
)

const handleAuthorized = () => {
	ElMessageBox.confirm('登录超时，请重新登录', '提示', {
		showCancelButton: false,
		closeOnClickModal: false,
		showClose: false,
		confirmButtonText: '重新登录',
		type: 'warning'
	}).then(() => {
		const userStore = useUserStore()

		userStore?.setToken('')
		userStore?.setRefreshToken('')
		location.reload()

		return Promise.reject('登录超时，请重新登录')
	})
}

// 导出 axios 实例
export default service
