import service from '@/utils/request'

export const useMailLogApi = (id: number) => {
	return service.get('/message/mailLog/' + id)
}

export const useMailLogSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/message/mailLog', dataForm)
	} else {
		return service.post('/message/mailLog', dataForm)
	}
}