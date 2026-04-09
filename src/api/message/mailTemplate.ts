import service from '@/utils/request'

export const useMailTemplateApi = (id: number) => {
	return service.get('/message/mailTemplate/' + id)
}

export const useMailTemplateSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/message/mailTemplate', dataForm)
	} else {
		return service.post('/message/mailTemplate', dataForm)
	}
}