<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const tableData = ref([])
const loading = ref(false)

const handleClick = async () => {
  tableData.value = []
  loading.value = true
  await window.ipcRenderer.invoke('update-database')
}

const getAllManuscript = async () => {
  const result = await window.ipcRenderer.invoke('get-all-manuscript')
  tableData.value = result
}

const updateDatabaseProgress = async (event, item) => {
  tableData.value.push({ ...item })
}

const updateDatabaseComplete = async () => {
  loading.value = false
  await window.ipcRenderer.invoke('dialog:show-message-box', {
    type: 'info',
    title: '更新数据库',
    message: '更新完成'
  })
}

let unsubscribeProgress = null
let unsubscribeComplete = null

onMounted(async () => {
  unsubscribeProgress = window.ipcRenderer.on('update-database-progress', updateDatabaseProgress)
  unsubscribeComplete = window.ipcRenderer.on('update-database-complete', updateDatabaseComplete)
  await getAllManuscript()
})

onUnmounted(() => {
  unsubscribeProgress?.()
  unsubscribeComplete?.()
  unsubscribeProgress = null
  unsubscribeComplete = null
})
</script>

<template>
  <div class="update-database">
    <el-table
      v-loading="loading"
      element-loading-text="更新中..."
      element-loading-background="rgba(255, 255, 255, 0.5)"
      :data="tableData"
      border
      :default-sort="{ prop: 'post_time', order: 'descending' }"
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 100px); scroll-behavior: smooth"
    >
      <el-table-column prop="post_time" align="center" width="250">
        <template #header>
          <div @click="handleClick">投稿时间</div>
        </template>
      </el-table-column>
      <el-table-column prop="view" label="播放量" align="center" width="120"> </el-table-column>
      <el-table-column prop="title" label="标题" align="center"></el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.update-database {
  padding: 20px;
}
</style>
