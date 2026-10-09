<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

const handleClick = async () => {
  tableData.value = []
  loading.value = true
  await window.ipcRenderer.invoke('update-database')
}

const getAllManuscript = async () => {
  const result = await window.ipcRenderer.invoke('get-all-manuscript')
  total.value = result.length
}

const getManuscriptByPage = async () => {
  const result = await window.ipcRenderer.invoke('get-manuscript-by-page', {
    currentPage: currentPage.value,
    pageSize: pageSize.value
  })
  tableData.value = result
}

const updateDatabaseProcess = async (event, item) => {
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

const handleCurrentChange = async () => {
  await getManuscriptByPage()
}

const handleSizeChange = async () => {
  await getManuscriptByPage()
}

let unsubscribeProcess = null
let unsubscribeComplete = null

onMounted(async () => {
  unsubscribeProcess = window.ipcRenderer.on('update-database-process', updateDatabaseProcess)
  unsubscribeComplete = window.ipcRenderer.on('update-database-complete', updateDatabaseComplete)
  await getAllManuscript()
  await getManuscriptByPage()
})

onUnmounted(() => {
  unsubscribeProcess?.()
  unsubscribeComplete?.()
  unsubscribeProcess = null
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
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 165px)"
    >
      <el-table-column prop="post_time" align="center" width="250">
        <template #header>
          <div @click="handleClick">投稿时间</div>
        </template>
      </el-table-column>
      <el-table-column prop="view" label="播放量" align="center" width="120"> </el-table-column>
      <el-table-column prop="title" label="标题" align="center"></el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[100, 200, 300, 400, 500]"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<style scoped lang="scss">
.update-database {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  height: calc(100vh - 60px);
  padding: 20px;
}
</style>
