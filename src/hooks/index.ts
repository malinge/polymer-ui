import { IHooksOptions } from '@/hooks/interface'
import service from '@/utils/request'
import { nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import qs from 'qs'
import FileUrlUtils from "@/utils/fileUrlUtils";

export const useCrud = (options: IHooksOptions, tableRef?: any) => {
	const defaultOptions: IHooksOptions = {
		createdIsNeed: true,
		dataListUrl: '',
		isPage: true,
		deleteUrl: '',
		primaryKey: 'id',
		exportUrl: '',
		queryForm: {},
		dataList: [],
		order: '',
		asc: false,
		pageNo: 1,
		pageSize: 10,
		total: 0,
		pageSizes: [10, 20, 50, 100, 200],
		dataListLoading: false,
		dataListSelections: []
	}

	const mergeDefaultOptions = (options: any, props: any): IHooksOptions => {
		for (const key in options) {
			if (!Object.getOwnPropertyDescriptor(props, key)) {
				props[key] = options[key]
			}
		}
		return props
	}

	// 覆盖默认值
	const state = mergeDefaultOptions(defaultOptions, options)

	onMounted(() => {
		if (state.createdIsNeed) {
			query()
		}
	})

	const query = () => {
		if (!state.dataListUrl) {
			return
		}

		state.dataListLoading = true

		service
			.get(state.dataListUrl, {
				params: {
					order: state.order,
					asc: state.asc,
					pageNo: state.isPage ? state.pageNo : null,
					pageSize: state.isPage ? state.pageSize : null,
					...state.queryForm
				},
				paramsSerializer: params => {
					return qs.stringify(params)
				}
			})
			.then((res: any) => {
				if (state.isPage && res.data.list.length == 0 && (state.pageNo ?? 1) > 1) {
					state.pageNo = (state.pageNo ?? 1) - 1
					query()
				}
				else if (!state.isPage && res.data.length == 0 && (state.pageNo ?? 1) > 1) {
					state.pageNo = (state.pageNo ?? 1) - 1
					query()
				}
				else {
					state.dataList = state.isPage ? res.data.list : res.data;
					state.total = state.isPage ? res.data.total : 0;
					//恢复已选中数据的选中状态
					if (tableRef) {
						tableRef.value?.clearSelection()
						let currentSelectRows: any[] = [];
						state.dataList?.forEach((item: any) => {
							// @ts-ignore
							if (state.dataListSelections?.findIndex((ele: any) => state.primaryKey && ele[state.primaryKey] == item[state.primaryKey]) > -1) {
								currentSelectRows.push(item)
							}
						})
						nextTick(() => {
							currentSelectRows.forEach((item: any) => {
								tableRef.value?.toggleRowSelection(item, true)
							})
						})

					}
				}
			})
			.finally(() => {
				state.dataListLoading = false
			})
	}

	const getDataList = (pageNo?: number | Event) => {
		if (typeof pageNo === 'number') {
			state.pageNo = pageNo
		}
		else {
			state.pageNo = 1
		}
		state.dataListSelections = []
		query()
	}

	const sizeChangeHandle = (val: number) => {
		state.pageNo = 1
		state.pageSize = val
		query()
	}

	const currentChangeHandle = (val: number) => {
		state.pageNo = val
		query()
	}

	// 多选
	 const selectionChangeHandle = (selections: any[]) => {
	 	console.log(selections)
	 	state.dataListSelections = selections.map((item: any) => state.primaryKey && item[state.primaryKey])
	 }

	// 当用户手动勾选数据行的 Checkbox 时触发的事件
	const selectHandle = (selections: any[]) => {
		let newSelectedData = JSON.parse(JSON.stringify(state.dataListSelections));

		//先将当前页的数据都取消选中状态
		newSelectedData = newSelectedData.filter((item: any) => {
			return state.dataList?.findIndex((ele: any) => {
				return state.primaryKey && ele[state.primaryKey] == item[state.primaryKey]
			}) === -1
		})
		//再将当前页的选中数据加入已选中列表
		selections.forEach((item: any) => {
			newSelectedData.push(item)
		})
		state.dataListSelections = newSelectedData;
	}

	const selectAllHandle = (selections: any[]) => {
		let newSelectedData = JSON.parse(JSON.stringify(state.dataListSelections));
		//先将当前页的数据都取消选中状态
		newSelectedData = newSelectedData.filter((item: any) => {
			return state.dataList?.findIndex((ele: any) => {
				return state.primaryKey && ele[state.primaryKey] == item[state.primaryKey]
			}) === -1
		})
		//再将当前页的选中数据加入已选中列表
		selections.forEach((item: any) => {
			newSelectedData.push(item)
		})
		state.dataListSelections = newSelectedData;
	}

	// 排序
	const sortChangeHandle = (data: any) => {
		const { prop, order } = data

		if (prop && order) {
			state.order = prop
			state.asc = order === 'ascending'
		} else {
			state.order = ''
		}

		query()
	}

	const deleteHandle = (key: number | string) => {
		if (!state.deleteUrl) {
			return
		}

		ElMessageBox.confirm('确定进行删除操作?', '提示', {
			confirmButtonText: '确定',
			cancelButtonText: '取消',
			type: 'warning'
		})
			.then(() => {
				service.delete(state.deleteUrl + '/' + key).then(() => {
					ElMessage.success('删除成功')

					query()
					state.dataListSelections = []
				})
			})
			.catch(() => { })
	}

	const deleteBatchHandle = (key?: number | string) => {
		let data: any[] = []
		if (key) {
			data = [key]
		} else {
			data = state.dataListSelections ? state.dataListSelections.map((item: any) => {
				return state.primaryKey && item[state.primaryKey]
			}) : []

			if (data.length === 0) {
				ElMessage.warning('请选择删除记录')
				return
			}
		}

		ElMessageBox.confirm('确定进行删除操作?', '提示', {
			confirmButtonText: '确定',
			cancelButtonText: '取消',
			type: 'warning'
		})
			.then(() => {
				if (state.deleteUrl) {
					service.delete(state.deleteUrl, { data }).then(() => {
						ElMessage.success('删除成功')
						let newPageNo = (state.pageNo ?? 1) - Math.floor((state.dataListSelections ?? []).length / (state.pageSize ?? 10));
						state.pageNo = newPageNo > 0 ? newPageNo : 1
						query()
						state.dataListSelections = []
					})
				}
			})
			.catch(() => { })
	}

	const downloadHandle = async (url: string, filename?: string, method: string = 'GET'): Promise<any> => {
		try {
			const fullUrl = await FileUrlUtils.getFullUrl(url)

			const res = await service({
				responseType: 'blob',
				url: fullUrl,
				method: method
			})

			// 检查是否为错误响应
			const isError = await checkErrorResponse(res)
			if (isError) {
				return
			}

			// 获取文件名
			const fileName = getFileNameFromResponse(res, filename)

			// 触发下载
			triggerDownload(res.data, fileName)

			ElMessage.success('下载成功')
		} catch (err: any) {
			await handleDownloadError(err)
		}
	}

	const exportHandle = async (filename?: string): Promise<void> => {
		if (state.exportLoading) {
			return;
		}

		if (!state.exportUrl) {
			ElMessage.error('导出接口地址未配置')
			return
		}

		try {
			state.exportLoading = true;
			// 合并参数
			const baseParams = { ...state.queryForm }

			// 过滤空值
			const filteredParams = Object.keys(baseParams).reduce<Record<string, any>>((acc, key) => {
				const value = baseParams[key]
				if (value !== undefined && value !== null && value !== '') {
					acc[key] = value
				}
				return acc
			}, {})

			// 构建完整 URL
			const queryString = Object.keys(filteredParams).length
				? qs.stringify(filteredParams, { addQueryPrefix: true })
				: ''
			const fullUrl = state.exportUrl + queryString

			// 发起导出请求
			const res = await service({
				responseType: 'blob',
				url: fullUrl,
				method: 'GET'
			})

			// 检查是否为错误响应
			const isError = await checkErrorResponse(res)
			if (isError) {
				return
			}

			// 获取文件名
			const fileName = getFileNameFromResponse(res, filename)

			// 触发下载
			triggerDownload(res.data, fileName)

			ElMessage.success('导出成功')
		} catch (err: any) {
			await handleDownloadError(err)
		}finally {
			state.exportLoading = false;
		}
	}

	/**
	 * 从响应中提取文件名
	 */
	const getFileNameFromResponse = (res: any, fallbackName?: string): string => {
		if (fallbackName) {
			return fallbackName
		}

		const contentDisposition = res.headers['content-disposition']
		if (contentDisposition) {
			// 优先匹配 filename* (支持 UTF-8 编码)
			const matchStar = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
			if (matchStar) {
				return decodeURIComponent(matchStar[1])
			}
			// 匹配普通 filename
			const match = contentDisposition.match(/filename=([^;]+)/i)
			if (match) {
				return decodeURIComponent(match[1])
			}
		}

		// 使用默认文件名
		const ext = 'xlsx'
		return `文件_${new Date().getTime()}.${ext}`
	}

	/**
	 * 检查响应是否为错误响应
	 */
	const checkErrorResponse = async (res: any): Promise<boolean> => {
		const contentType = res.headers['content-type'] || ''

		// 检查是否为 JSON 错误响应
		if (contentType.includes('application/json')) {
			try {
				const text = await res.data.text()
				try {
					const errorData = JSON.parse(text)
					ElMessage.error(errorData.msg || errorData.message || '操作失败')
				} catch {
					ElMessage.error('操作失败：' + text.substring(0, 100))
				}
			} catch {
				ElMessage.error('操作失败：无法读取响应数据')
			}
			return true
		}
		// 检查文件是否为空
		if (!res.data || res.data.size === 0) {
			ElMessage.error('导出文件为空，请检查查询条件')
			return true
		}

		return false
	}

	/**
	 * 创建并触发下载
	 */
	const triggerDownload = (data: any, fileName: string, fileType?: string) => {
		const link = document.createElement('a')
		link.style.display = 'none'
		link.download = fileName

		const blob = new Blob([data], {
			type: data.type || fileType || 'application/octet-stream'
		})
		link.href = URL.createObjectURL(blob)

		document.body.appendChild(link)
		link.click()

		// 延迟清理资源
		setTimeout(() => {
			URL.revokeObjectURL(link.href)
			document.body.removeChild(link)
		}, 100)
	}

	/**
	 * 统一的错误处理
	 */
	const handleDownloadError = async (err: any): Promise<void> => {
		// 处理 HTTP 错误响应
		if (err.response) {
			const { status, data } = err.response

			// 如果是 blob，尝试读取错误信息
			if (data instanceof Blob) {
				try {
					const text = await data.text()
					try {
						const errorData = JSON.parse(text)
						ElMessage.error(errorData.msg || errorData.message || `请求失败 (HTTP ${status})`)
					} catch {
						ElMessage.error(`请求失败：${text.substring(0, 100)}`)
					}
				} catch {
					ElMessage.error(`请求失败 (HTTP ${status})`)
				}
			} else {
				ElMessage.error(err.response.data?.msg || err.response.data?.message || err.message || '请求失败')
			}
		} else if (err.request) {
			ElMessage.error('网络异常，请检查网络连接')
		} else {
			ElMessage.error(err.message || '请求失败')
		}
	}

	return {
		getDataList,
		sizeChangeHandle,
		currentChangeHandle,
		selectionChangeHandle,
		sortChangeHandle,
		deleteHandle,
		deleteBatchHandle,
		downloadHandle,
		exportHandle,     // 新增导出方法
		selectHandle,
		selectAllHandle
	}
}
