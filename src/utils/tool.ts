import type { App, Plugin, Component, DefineComponent } from 'vue'
import constant from '@/utils/constant'
import { useAppStore } from '@/store/modules/app'

// 定义一个通用的组件类型
type ComponentType = Component | DefineComponent<{}, {}, any>

// 把路径转换成驼峰命名
export const pathToCamel = (path: string): string => {
	return path.replace(/\/(\w)/g, (all, letter) => letter.toUpperCase())
}

// 是否外链
export const isExternalLink = (url: string): boolean => {
	return /^(https?:|\/\/|http?:|\/\/|^{{\s?apiUrl\s?}})/.test(url)
}

// 替换外链参数
export const replaceLinkParam = (url: string): string => {
	return url.replace('{{apiUrl}}', constant.apiUrl)
}

// 转换文件大小格式
export const convertSizeFormat = (size: number): string => {
	const unit = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
	let index = Math.floor(Math.log(size) / Math.log(1024))
	let newSize = size / Math.pow(1024, index)

	// 保留的小数位数
	return newSize.toFixed(2) + ' ' + unit[index]
}

// 获取svg图标(id)列表
export const getIconList = (): string[] => {
	const rs: string[] = []
	const list = document.querySelectorAll('svg symbol[id^="icon-"]')
	for (let i = 0; i < list.length; i++) {
		rs.push(list[i].id)
	}
	return rs
}

// 获取字典Label
export const getDictLabel = (dictList: any[], dictType: string, dictValue: string) => {
	const type = dictList.find((element: any) => element.dictType === dictType)
	if (type) {
		const val = type.dataList.find((element: any) => element.dictValue === dictValue + '')
		if (val) {
			return val.dictLabel
		} else {
			return dictValue
		}
	} else {
		return dictValue
	}
}

// 获取字典Label样式
export const getDictLabelClass = (dictList: any[], dictType: string, dictValue: string): string => {
	const type = dictList.find((element: any) => element.dictType === dictType)
	if (type) {
		const val = type.dataList.find((element: any) => element.dictValue === dictValue + '')
		if (val) {
			return val.labelClass
		} else {
			return ''
		}
	} else {
		return ''
	}
}

export const getDictLabelList = (dictType: string, dictValue: string | number | boolean): string => {
	// 处理空值情况（包括 null、undefined、空字符串）
	if (dictValue == null || dictValue === '') {
		return '';
	}
	/*if (Number.isInteger(dictValue)) {
		dictValue = dictValue + ''
	}

	if (!dictValue) {
		return ''
	}*/
	// 统一转换为字符串处理（支持 boolean 和 number 类型）
	const strValue = String(dictValue);

	const appStore = useAppStore()

	let result = ''
	strValue.split(',').forEach(value => {
		if (!value) return; // 跳过空值
		const classStyle = getDictLabelClass(appStore.dictList, dictType, value)
		const label = getDictLabel(appStore.dictList, dictType, value)

		if (classStyle) {
			result += `<span class="el-tag el-tag--${classStyle} el-tag--${appStore.componentSize}">${label}</span>&nbsp;`
		} else {
			result += label + '&nbsp;'
		}
	})

	return result
}

// 获取字典数据列表
export function getDictDataList(dictList: any[], dictType: string) {
	const type = dictList.find((element: any) => element.dictType === dictType)
	if (type) {
		return type.dataList
	} else {
		return []
	}
}

// 全局组件安装
export const withInstall = <T extends ComponentType>(
	component: T,
	alias?: string
): T & Plugin => {
	const comp = component as any

	// 创建 install 函数
	const install = (app: App) => {
		// 尝试从不同来源获取组件名称
		const name = comp.name ||
			comp.displayName ||
			comp.__name ||
			comp.constructor?.name ||
			comp.__proto__?.constructor?.name

		if (!name || typeof name !== 'string') {
			console.warn('组件缺少有效的 name 属性，无法全局注册', component)
			return
		}

		// 注册组件
		app.component(name, component as Component)

		// 如果需要，添加到全局属性
		if (alias && typeof alias === 'string') {
			app.config.globalProperties[alias] = component
		}
	}

	// 添加 install 方法到组件
	if (!comp.install) {
		comp.install = install
	}

	return comp as T & Plugin
}
