import service from '@/utils/request'

export const useSmsPlatformApi = (id: Number) => {
	return service.get('/message/smsPlatform/' + id)
}

export const useSmsPlatformSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/message/smsPlatform', dataForm)
	} else {
		return service.post('/message/smsPlatform', dataForm)
	}
}

export const useSmsSendApi = (dataForm: any) => {
	return service.post('/message/smsPlatform/send', dataForm)
}
