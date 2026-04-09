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

			url = await FileUrlUtils.getFullUrl(url)

			const res = await service({
				responseType: 'blob',
				url: url,
				method: method
			})
			// 创建a标签
			const down = document.createElement('a')
			// 文件名没传，则使用时间戳
			if (filename) {
				down.download = filename
			} else {
				const downName = res.headers['content-disposition'].split(';')[1].split('=')[1]
				down.download = decodeURI(downName)
			}

			// 隐藏a标签
			down.style.display = 'none'

			// 创建下载url
			down.href = URL.createObjectURL(
				new Blob([res.data], {
					type: res.data.type
				})
			)

			// 模拟点击下载
			document.body.appendChild(down)
			down.click()

			// 释放URL
			URL.revokeObjectURL(down.href)
			// 下载完成移除
			document.body.removeChild(down)
		} catch (err: any) {
			ElMessage.error(err.message)
		}
	}

	const exportHandle = async (url: string, filename?: string): Promise<void> => {
		if (!url) {
			ElMessage.error('导出接口地址未配置');
			return;
		}

		// 1. 获取基础查询参数（从 state.queryForm）
		const baseParams = { ...state.queryForm };

		// 2. 序列化参数（与 getDataList 一致）
		let fullUrl = url;
		if (Object.keys(baseParams).length) {
			const queryString = qs.stringify(baseParams, { addQueryPrefix: true });
			fullUrl = url + queryString;
		}

		try {
			const res = await service({
				responseType: 'blob',
				url: fullUrl,
				method: 'GET'
			});

			// 创建下载链接
			const down = document.createElement('a');
			if (filename) {
				down.download = filename;
			} else {
				const downName = res.headers['content-disposition'].split(';')[1].split('=')[1]
				down.download = decodeURI(downName)
			}

			// 隐藏a标签
			down.style.display = 'none'

			// 创建下载url
			down.href = URL.createObjectURL(
				new Blob([res.data], {
					type: res.data.type
				})
			)

			// 模拟点击下载
			document.body.appendChild(down)
			down.click()

			// 释放URL
			URL.revokeObjectURL(down.href)
			// 下载完成移除
			document.body.removeChild(down)
		} catch (err: any) {
			ElMessage.error(err.message || '导出失败');
		}
	};

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
