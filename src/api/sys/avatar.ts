import service from '@/utils/request'

// 根据id修改用户头像
export const updateUserAvatar = async (dataForm: any) => {
  return service.post('/sys/user/updateUserAvatar', dataForm)
}
