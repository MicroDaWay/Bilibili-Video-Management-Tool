<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const loading = ref(false)
const tableData = ref([])

const handleClick = async () => {
  tableData.value = []
  loading.value = true
  await window.ipcRenderer.invoke('get-revenue-data')
}

const getAllRevenue = async () => {
  const result = await window.ipcRenderer.invoke('get-all-revenue')
  tableData.value = result
}

const getRevenueDataProcess = (event, item) => {
  tableData.value.push({ ...item })
}

const getRevenueDataComplete = async () => {
  loading.value = false
  await window.ipcRenderer.invoke('dialog:show-message-box', {
    type: 'info',
    title: '收益中心',
    message: '搜索完成'
  })
}

let unsubscribeProcess = null
let unsubscribeComplete = null

onMounted(async () => {
  unsubscribeProcess = window.ipcRenderer.on('get-revenue-data-process', getRevenueDataProcess)
  unsubscribeComplete = window.ipcRenderer.on('get-revenue-data-complete', getRevenueDataComplete)
  await getAllRevenue()
})

onUnmounted(() => {
  unsubscribeProcess?.()
  unsubscribeComplete?.()
  unsubscribeProcess = null
  unsubscribeComplete = null
})
</script>

<template>
  <div class="revenue-center">
    <el-table
      v-loading="loading"
      element-loading-text="更新中..."
      element-loading-background="rgba(255, 255, 255, 0.5)"
      :data="tableData"
      border
      :default-sort="{ prop: 'create_time', order: 'descending' }"
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 100px)"
    >
      <el-table-column prop="create_time" align="center" width="250">
        <template #header>
          <div @click="handleClick">贝壳发放时间</div>
        </template>
      </el-table-column>
      <el-table-column prop="brokerage" label="到账金额" align="center" width="120">
      </el-table-column>
      <el-table-column prop="title" label="标题" align="center"> </el-table-column>
    </el-table>
  </div>
</template>
