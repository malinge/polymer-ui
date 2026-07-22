
/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  code: number
  data: T
  msg?: string
  message?: string
}

/** Treeselect树结构类型 */
export interface TreeSelect {
  /** 节点ID */
  id?: number
  /** 节点名称 */
  label?: string
  /** 子节点 */
  children: TreeSelect[]
}

/**
 * 附件上传结果接口
 */
export interface AttachmentUploadResult {
  name: string
  url: string
  size: number
  platform: string
}

/**
 * 数据导入结果接口（由各业务模块定义，此处为示例）
 */
export interface DataImportResult<T = any> {
  /** 是否通过校验 */
  passed?: boolean
  /** 错误文件相对路径 */
  errorFileUrl?: string
  /** 信息 */
  message?: string
}

