
/** Treeselect树结构类型 */
export interface TreeSelect {
  /** 节点ID */
  id?: number
  /** 节点名称 */
  label?: string
  /** 子节点 */
  children: TreeSelect[]
}
