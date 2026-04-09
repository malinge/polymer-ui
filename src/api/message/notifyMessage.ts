import service from '@/utils/request'

export const useNotifyMessageApi = (id: number) => {
	return service.get('/message/notifyMessage/' + id)
}

export const useNotifyMessageSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/message/notifyMessage', dataForm)
	} else {
		return service.post('/message/notifyMessage', dataForm)
	}
}

// 获取当前用户的最新站内信列表
export const getUnreadNotifyMessageList = async () => {
	return service.get('/message/notifyMessage/get-unread-list')
  }

// 获得当前用户的未读站内信数量
export const getUnreadNotifyMessageCount = async () => {
	return service.get('/message/notifyMessage/get-unread-count')
  }