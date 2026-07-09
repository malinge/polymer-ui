import service from '@/utils/request'

export const useImportExportRecordApi = (id: number) => {
	return service.get('/system/importExportRecord/' + id)
}

export const useImportExportRecordListApi = (businessType: string) => {
	return service.get('/system/importExportRecord/list/' + businessType)
}

export const useImportExportRecordSubmitApi = (dataForm: any) => {
	if (dataForm.id) {
		return service.put('/system/importExportRecord', dataForm)
	} else {
		return service.post('/system/importExportRecord', dataForm)
	}
}
