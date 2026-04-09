import service from '@/utils/request'

// 获得 IP 对应的地区名
export const getAreaByIp = async (ip: string) => {
  return await service.get('/sys/area/get-by-ip?ip=' + ip)
}
