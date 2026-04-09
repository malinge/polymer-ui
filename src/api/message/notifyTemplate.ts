import service from '@/utils/request'

export interface NotifyTemplateVO {
	id?: number
	name: string
	nickname: string
	code: string
	content: string
	type?: number
	params: string
	status: number
	remark: string
  }

export const useNotifyTemplateApi = (id: number) => {
	return service.get('/message/notifyTemplate/' + id)
}

export const useNotifyTemplateSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/message/notifyTemplate', dataForm)
	} else {
		return service.post('/message/notifyTemplate', dataForm)
	}
}