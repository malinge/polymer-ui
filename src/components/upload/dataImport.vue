<template>
  <div class="data-import">
    <!-- 触发按钮 - 直接点击打开对话框 -->
    <el-button
        :type="buttonType"
        :size="buttonSize"
        :disabled="loading"
        @click="openDialog">
      {{ buttonText }}
    </el-button>

    <!-- 导入对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="700px"
        :close-on-click-modal="false"
        @close="handleDialogClose"
        @open="handleDialogOpen">
      <div class="import-container">
        <!-- 步骤条 -->
        <el-steps :active="currentStep" align-center finish-status="success">
          <el-step title="上传文件" />
          <el-step title="导入数据" />
          <el-step :class="{ 'step-failed': currentStep === 3 && !importResult.passed }" title="导入完成" />
        </el-steps>

        <!-- 步骤内容 -->
        <div class="step-content">
          <!-- 步骤1: 上传文件 -->
          <div v-show="currentStep === 0" class="step-panel">
            <!-- 模板下载 -->
            <div class="step-section">
              <div class="section-title">
                一、请按照数据模板的格式准备要导入的数据。
                <el-link
                    type="primary"
                    :disabled="templateDownloading"
                    @click="handleDownloadTemplate">
                  <el-icon v-if="templateDownloading" class="is-loading"><Loading /></el-icon>
                  下载《{{ businessName }}导入模板》
                </el-link>
              </div>
              <div class="section-tip">导入文件请勿超过{{ maxSize }}MB（约{{ maxRecords }}条数据）</div>
            </div>

            <!-- 查重规则 -->
            <div class="step-section">
              <div class="section-title">
                二、请选择数据重复时的处理方式
                <span class="rule-label">（查重规则：</span>
                <span class="rule-label" v-for="(field, index) in duplicateFields" :key="field">
                  【{{ field }}】<span v-if="index < duplicateFields.length - 1">、</span>
                </span>
                <span class="rule-label">）</span>
              </div>
              <div class="section-tip">
                查重规则为：添加{{ businessName }}时所需填写的所有唯一字段，当前设置唯一字段为：
                <span v-for="(field, index) in duplicateFields" :key="field">
                  【{{ field }}】<span v-if="index < duplicateFields.length - 1">、</span>
                </span>
              </div>
              <!-- 处理方式下拉选择 -->
              <div class="strategy-select-wrapper">
                <el-select
                    v-model="strategy"
                    placeholder="请选择处理方式"
                    size="default">
                  <el-option
                      v-for="item in strategyOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value" />
                </el-select>
              </div>
            </div>

            <!-- 文件选择 -->
            <div class="step-section file-upload-area">
              <div class="section-title">三、请选择需要导入的文件</div>
              <div class="file-select-wrapper">
                <el-input
                    v-model="selectedFileName"
                    placeholder="请选择文件"
                    disabled />
                <el-button type="primary" @click="triggerFileSelect">选择文件</el-button>
                <input
                    ref="fileInputRef"
                    type="file"
                    :accept="acceptStr"
                    style="display: none"
                    @change="handleFileChange" />
              </div>
            </div>
          </div>

          <!-- 步骤2: 导入数据 -->
          <div v-show="currentStep === 1" class="step-panel loading-panel">
            <el-icon class="loading-icon is-loading"><Loading /></el-icon>
            <div class="loading-text">导入数据中...</div>
          </div>

          <!-- 步骤3: 导入完成 -->
          <div v-show="currentStep === 3" class="step-panel result-panel">
            <div class="result-icon">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="result-title" >数据导入完成</div>
            <div v-if="importResult.message" class="result-message">
              {{ importResult.message }}
            </div>
            <div v-if="!importResult.passed && importResult.errorFileUrl" class="result-error-download">
              <el-link type="primary" @click="downloadHandle(importResult.errorFileUrl, '错误.xlsx')">下载错误数据</el-link>
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="dialog-footer">
          <div class="footer-left">
            <el-button link @click="handleViewHistory">
              查看历史导入记录
            </el-button>
          </div>
          <div class="footer-right">
            <!-- 步骤1: 显示 取消 + 立即导入 -->
            <template v-if="currentStep === 0">
              <el-button @click="handleCancel">取消</el-button>
              <el-button
                  type="primary"
                  :disabled="!selectedFile || !strategy"
                  @click="handleStartImport">
                立即导入
              </el-button>
            </template>
            <!-- 步骤2: -->
            <template v-if="currentStep === 1">
              <el-button type="primary" disabled>导入中...</el-button>
            </template>
            <!-- 步骤3: 显示 确定 + 关闭 -->
            <template v-if="currentStep === 3">
              <el-button @click="handleCancel">关闭</el-button>
              <el-button type="primary" @click="handleConfirm">确定</el-button>
            </template>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 历史导入记录对话框 -->
    <el-dialog
        v-model="historyDialogVisible"
        title="查看历史导入记录"
        width="900px"
        :close-on-click-modal="true"
        @close="handleHistoryDialogClose">
      <div class="history-container">
        <!-- 加载状态 -->
        <div v-if="historyLoading" class="history-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 空状态 -->
        <el-empty v-else-if="historyList.length === 0" description="暂无导入记录" />

        <!-- 表格 -->
        <el-table v-else :data="historyList" border stripe style="width: 100%" max-height="400">
          <el-table-column prop="createTime" label="导入时间" width="180" align="center"/>
          <el-table-column prop="operatorName" label="操作人" width="120" align="center" />
          <el-table-column prop="remark" label="导入结果" min-width="200" align="center"/>
          <el-table-column prop="errorFileUrl" label="操作" width="160" align="center">
            <template #default="{ row }">
              <el-link v-if="row.errorFileUrl" type="primary" @click="downloadHandle(row.errorFileUrl, '错误.xlsx')">
                下载错误数据
              </el-link>
              <span v-else class="empty-text">-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="historyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useCrud } from "@/hooks";
import {ref, computed, reactive} from 'vue'
import { ElMessage, UploadRequestOptions } from 'element-plus'
import { Loading, CircleCheckFilled } from '@element-plus/icons-vue'
import { useFileUpload } from '@/hooks/useFileUpload'
import type {DataImportResult} from "@/types/api/common"
import request from '@/utils/request'
import {IHooksOptions} from "@/hooks/interface";
import { useImportExportRecordListApi } from '@/api/sys/importExportRecord'
import type {ApiResponse} from "@/types/api/common"

// ==================== 类型定义 ====================


/** 处理方式选项 */
interface StrategyOption {
  label: string
  value: string
}

/** 导入导出记录 VO */
interface SysImportExportRecordVO {
  operatorName: string
  errorFileUrl: string
  remark: string
  createTime: string
}

// ==================== Props ====================

interface IProps {
  /** 导入接口地址（完整URL） */
  importUrl: string
  /** 额外的业务参数 */
  importParams?: Record<string, any>
  /** 允许的文件扩展名，如 ['xlsx', 'xls'] */
  accept?: string[]
  /** 最大文件大小（MB） */
  maxSize?: number
  /** 最大记录数（用于提示） */
  maxRecords?: number
  /** 按钮文字 */
  buttonText?: string
  /** 按钮类型 */
  buttonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  /** 按钮尺寸 */
  buttonSize?: 'large' | 'default' | 'small'
  /** 业务名称（用于文案展示，会自动拼接"导入模板"） */
  businessName: string
  /** 模板下载API地址 */
  templateUrl: string
  /** 获取查重字段列表的API地址（返回 List<String>） */
  duplicateFieldsApi: string
  /** 默认处理策略 */
  defaultStrategy?: string
  /** 业务类型，用于筛选历史记录（如：user, dept, role 等） */
  businessType: string
}

const props = withDefaults(defineProps<IProps>(), {
  accept: () => ['xlsx', 'xls'],
  maxSize: 2,
  maxRecords: 10000,
  buttonText: '导入',
  buttonType: 'info',
  buttonSize: 'default',
  businessName: '数据',
  templateUrl: '',
  duplicateFieldsApi: '',
  defaultStrategy: 'skip',
  businessType: '',
})

// ==================== Hooks ====================

const { uploadDataImport } = useFileUpload()

// ==================== 常量 ====================

/** 处理方式选项 */
const strategyOptions: StrategyOption[] = [
  { label: '跳过', value: 'skip' },
  { label: '覆盖系统原有数据', value: 'override' },
  { label: '更新系统原有数据', value: 'update' },
]

// 定义不带参数的 emit
const emit = defineEmits<{
  (e: 'success'): void
  (e: 'error'): void
}>()


// ==================== 响应式 ====================

const fileInputRef = ref<HTMLInputElement>()
const loading = ref(false)
const templateDownloading = ref(false)
const duplicateFieldsLoading = ref(false)
const dialogVisible = ref(false)
const currentStep = ref(0) // 0: 上传文件, 1: 导入数据, 2: 导入完成
const selectedFile = ref<File | null>(null)
const selectedFileName = ref('')
const duplicateFields = ref<string[]>([])
const strategy = ref<string>(props.defaultStrategy)
const importResult = ref<DataImportResult>({
  passed: true,
  errorFileUrl: '',
  message: '',
})

// 历史记录相关
const historyDialogVisible = ref(false)
const historyLoading = ref(false)
const historyList = ref<SysImportExportRecordVO[]>([])

const dialogTitle = computed(() => `导入${props.businessName}`)

// ==================== 计算属性 ====================

const acceptStr = computed(() => {
  if (!props.accept || props.accept.length === 0) return undefined
  return props.accept.map(ext => `.${ext}`).join(',')
})

/** 获取查重字段列表 */
const fetchDuplicateFields = async () => {
  if (!props.duplicateFieldsApi) {
    return
  }

  // 如果已经加载过且数据不为空，不再重复请求
  if (duplicateFields.value.length > 0) {
    return
  }

  duplicateFieldsLoading.value = true

  try {
    const response = (await request({
      url: props.duplicateFieldsApi,
      method: 'get',
    })) as ApiResponse<string[]>

    if (response.code === 0) {
      duplicateFields.value = response.data || []
    } else {
      console.warn('获取查重字段失败:', response.msg || response.message)
    }
  } catch (error) {
    console.error('获取查重字段失败:', error)
  } finally {
    duplicateFieldsLoading.value = false
  }
}

/** 获取历史导入记录列表（不分页，全部展示） */
const fetchHistoryList = async () => {
  historyLoading.value = true
  try {
    const response = await useImportExportRecordListApi(props.businessType)
    historyList.value = response.data

  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败，请稍后重试')
  } finally {
    historyLoading.value = false
  }
}

/** 弹框打开时调用 */
const handleDialogOpen = () => {
  // 获取查重字段列表
  if (props.duplicateFieldsApi) {
    fetchDuplicateFields()
  }
  // 重置处理方式为默认值
  strategy.value = props.defaultStrategy
}

/** 打开对话框 */
const openDialog = () => {
  resetState()
  dialogVisible.value = true
  currentStep.value = 0
}

/** 触发文件选择 */
const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

/** 文件选择变化 */
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    if (!validateFile(file)) {
      input.value = ''
      return
    }
    selectedFile.value = file
    selectedFileName.value = file.name
  }
}

/** 文件校验 */
const validateFile = (file: File): boolean => {
  if (props.accept && props.accept.length > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!props.accept.map(e => e.toLowerCase()).includes(ext || '')) {
      ElMessage.error(`仅支持 ${props.accept.join('、')} 格式`)
      return false
    }
  }

  if (props.maxSize && props.maxSize > 0) {
    const maxBytes = props.maxSize * 1024 * 1024
    if (file.size > maxBytes) {
      ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
      return false
    }
  }

  return true
}

/** 开始导入 */
const handleStartImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  if (!strategy.value) {
    ElMessage.warning('请选择处理方式')
    return
  }

  // 校验导入地址是否配置
  if (!props.importUrl) {
    ElMessage.error('导入接口地址未配置')
    return
  }

  currentStep.value = 1

  try {
    // 构建导入参数，包含 strategy
    const importParams = {
      ...props.importParams,
      strategy: strategy.value,
    }

    importResult.value = await uploadDataImport(
        { file: selectedFile.value } as UploadRequestOptions,
        {
          importUrl: props.importUrl,
          data: importParams,
        }
    )
    currentStep.value = 3
    emit('success')
  } catch (error) {
    const err = error instanceof Error ? error : new Error('导入失败')
    importResult.value = {
      passed: false,
      errorFileUrl: '',
      message: err.message,
    }
    currentStep.value = 3
    ElMessage.error(err.message)
    emit('error')
  } finally {
    loading.value = false
  }
}

/**
 * 下载模板 - 使用 request 处理文件流下载
 */
const handleDownloadTemplate = async () => {
  if (!props.templateUrl) {
    ElMessage.warning('模板下载地址未配置')
    return
  }

  if (templateDownloading.value) {
    return
  }

  templateDownloading.value = true

  try {
    const response = await request({
      url: props.templateUrl,
      method: 'get',
      responseType: 'blob',
    })

    const blob = (response as any).data || response

    if (blob.type === 'application/json') {
      const text = await blob.text()
      try {
        const errorData = JSON.parse(text)
        ElMessage.error(errorData.msg || errorData.message || '模板下载失败')
        return
      } catch {
        // 不是有效的 JSON，继续下载
      }
    }

    const contentDisposition = (response as any).headers?.['content-disposition']
    let fileName = `${props.businessName}导入模板.xlsx`
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1].replace(/['"]/g, ''))
      }
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)

    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败，请稍后重试')
  } finally {
    templateDownloading.value = false
  }
}

/** 查看历史导入记录 */
const handleViewHistory = () => {
  historyDialogVisible.value = true
  fetchHistoryList()
}

/** 关闭历史记录对话框 */
const handleHistoryDialogClose = () => {
  historyList.value = []
}

/** 取消 */
const handleCancel = () => {
  dialogVisible.value = false
  resetState()
}

/** 确定（关闭弹框） */
const handleConfirm = () => {
  dialogVisible.value = false
  resetState()
}

/** 关闭对话框 */
const handleDialogClose = () => {
  resetState()
}

/** 重置状态 */
const resetState = () => {
  currentStep.value = 0
  selectedFile.value = null
  selectedFileName.value = ''
  templateDownloading.value = false
  strategy.value = props.defaultStrategy
  importResult.value = {
    passed: true,
    errorFileUrl: '',
    message: '',
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

/** 暴露方法 */
defineExpose({
  openDialog,
  closeDialog: () => {
    dialogVisible.value = false
    resetState()
  },
  resetLoading: () => {
    loading.value = false
  },
  refreshDuplicateFields: fetchDuplicateFields,
  refreshHistory: fetchHistoryList,
})

const state: IHooksOptions = reactive({});
/**
 * 使用 useCrud 钩子
 */
const {
  downloadHandle,
} = useCrud(state);

</script>

<style lang="scss" scoped>
.data-import {
  display: inline-block;
}

.import-container {
  padding: 20px 10px;

  .step-content {
    min-height: 280px;
    padding: 30px 0;
  }

  .step-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 260px;
  }

  .step-section {
    width: 100%;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 14px;
      color: #333;
      line-height: 1.8;

      .rule-label {
        color: #e6a23c;
        font-weight: 500;
      }

      .el-link {
        .el-icon {
          margin-right: 4px;
          vertical-align: middle;
        }

        &.is-disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
      }
    }

    .section-tip {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      text-indent: 2em;  /* 首行缩进2个汉字 */
    }

    .strategy-select-wrapper {
      margin-top: 10px;
      display: flex;
      align-items: center;
      width: 350px;  /* 将宽度移到此处 */
      margin-left: 24px; /* 整体向右缩进两个文字 */

      .strategy-label {
        font-size: 14px;
        color: #333;
        margin-right: 10px;
        white-space: nowrap;
      }
    }
  }

  .file-upload-area {
    .file-select-wrapper {
      display: flex;
      gap: 10px;
      margin-top: 8px;
      width: 450px;
      margin-left: 24px; /* 整体向右缩进两个文字 */
    }
  }

  .loading-panel {
    .loading-icon {
      font-size: 48px;
      color: #409eff;
    }

    .loading-text {
      margin-top: 16px;
      font-size: 16px;
      color: #666;
    }
  }

  .result-panel {
    .result-icon {
      font-size: 56px;
      color: #67c23a;

      &.is-error {
        color: #f56c6c;
      }
    }

    .result-title {
      font-size: 18px;
      font-weight: 500;
      color: #333;
      margin-top: 16px;

      &.is-error {
        color: #f56c6c;
      }
    }

    .result-message {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
      text-align: center;
      max-width: 500px;
      word-break: break-all;
    }

    .result-error-download {
      margin-top: 12px;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;

    .footer-left {
      flex: 1;
    }

    .footer-right {
      display: flex;
      gap: 10px;
    }
  }
}

// 历史记录对话框样式
.history-container {
  padding: 10px 0;

  .history-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: #909399;

    .el-icon {
      font-size: 36px;
      margin-bottom: 16px;
    }
  }

  .empty-text {
    color: #909399;
  }
}

:deep(.el-step) {
  .el-step__title {
    font-size: 14px;
  }
}

:deep(.el-table) {
  .cell {
    padding: 8px 0;
  }
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

:deep(.step-failed) {
  .el-step__title {
    color: #f56c6c !important;
  }
  .el-step__icon-inner {
    color: #f56c6c !important;
  }
  .el-step__line {
    background-color: #f56c6c !important;
  }
}

</style>


