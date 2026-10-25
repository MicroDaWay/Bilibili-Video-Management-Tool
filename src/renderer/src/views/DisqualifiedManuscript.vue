<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const tableData = ref([])
const isLoading = ref(false)

const handleClick = async () => {
  tableData.value = []
  isLoading.value = true
  await window.ipcRenderer.invoke('fetch-session-msgs')
}

const getAllDisqualified = async () => {
  const result = await window.ipcRenderer.invoke('get-all-disqualified')
  tableData.value = result
}

const fetchSessionMsgsProcess = (event, item) => {
  tableData.value.push({ ...item })
}

const fetchSessionMsgsComplete = async () => {
  isLoading.value = false
  await getAllDisqualified()
  await window.ipcRenderer.invoke('dialog:show-message-box', {
    type: 'info',
    title: '活动资格取消稿件',
    message: '搜索完成'
  })
}

let unsubscribeProcess = null
let unsubscribeComplete = null

onMounted(async () => {
  unsubscribeProcess = window.ipcRenderer.on('fetch-session-msgs-process', fetchSessionMsgsProcess)
  unsubscribeComplete = window.ipcRenderer.on(
    'fetch-session-msgs-complete',
    fetchSessionMsgsComplete
  )
  await getAllDisqualified()
})

onUnmounted(() => {
  unsubscribeProcess?.()
  unsubscribeComplete?.()
  unsubscribeProcess = null
  unsubscribeComplete = null
})
</script>

<template>
  <div class="disqualified-manuscript">
    <el-table
      v-loading.fullscreen.lock="isLoading"
      element-loading-text="Loading..."
      element-loading-background="rgba(255, 255, 255, 0.5)"
      :data="tableData"
      highlight-current-row
      border
      :default-sort="{ prop: 'disqualified_time', order: 'descending' }"
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 100px)"
    >
      <el-table-column prop="disqualified_time" align="center" width="210">
        <template #header>
          <div @click="handleClick">活动资格取消时间</div>
        </template>
      </el-table-column>
      <el-table-column prop="view" label="播放量" align="center" width="90"> </el-table-column>
      <el-table-column prop="title" label="标题" align="center">
        <template #default="{ row }">
          <a :href="`https://www.bilibili.com/video/${row.bvid}`" target="_blank">
            {{ row.title }}</a
          >
        </template>
      </el-table-column>
      <el-table-column prop="tag" label="投稿标签" align="center" width="300"></el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.disqualified-manuscript {
  padding: 20px;
}
</style>
