import service from '@/utils/request'

export const useCityApi = (id: number) => {
	return service.get('/system/city/' + id)
}

export const useCitySubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/system/city', dataForm)
	} else {
		return service.post('/system/city', dataForm)
	}
}

export const useCityListApi = () => {
	return service.get('/system/city/tree')
}
