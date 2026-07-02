import service from '@/utils/request'

export const useUserInfoApi = () => {
	return service.get('/sys/user/info')
}

export const useUserInfoSubmitApi = (dataForm: any) => {
	return service.put('/sys/user/info', dataForm)
}

export const updatePasswordApi = (data: any) => {
	return service({
		url: '/sys/user/password',
		method: 'put',
		headers: {
			isEncrypt: true,
			repeatSubmit: true
		},
		data: data
	});
	//return service.put('/sys/user/password', data)
}

export const useUserApi = (id: number) => {
	return service.get('/sys/user/' + id)
}

export const useUserSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/sys/user', dataForm)
	} else {
		return service.post('/sys/user', dataForm)
	}
}

export const useListByDeptIdApi = (deptId: number) => {
	// sub 是否查询子集用户（1：查询；0不查询）
	return service.get('/sys/user/getUserListByDeptId/' + deptId+ '/1')
}
