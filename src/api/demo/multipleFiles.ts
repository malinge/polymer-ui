import service from '@/utils/request'

export const useMultipleFilesApi = (id: number) => {
	return service.get('/demo/multipleFiles/' + id)
}

export const useMultipleFilesSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/demo/multipleFiles', dataForm)
	} else {
		return service.post('/demo/multipleFiles', dataForm)
	}
}
