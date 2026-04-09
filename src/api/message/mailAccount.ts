import service from '@/utils/request'

export const useMailAccountApi = (id: number) => {
	return service.get('/message/mailAccount/' + id)
}

export const useMailAccountSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/message/mailAccount', dataForm)
	} else {
		return service.post('/message/mailAccount', dataForm)
	}
}

export const useMailAccountListApi = () => {
	return service.get('/message/mailAccount/list')
}