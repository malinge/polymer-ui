import service from '@/utils/request'

export const useDeptListApi = () => {
	return service.get('/sys/dept/list')
}

export const useDeptApi = (id: Number) => {
	return service.get('/sys/dept/' + id)
}

export const useDeptSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/sys/dept', dataForm)
	} else {
		return service.post('/sys/dept', dataForm)
	}
}
