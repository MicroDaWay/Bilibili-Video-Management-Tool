<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const tableData = ref([])

const getHotActivities = async () => {
  await window.ipcRenderer.invoke('get-hot-activities')
}

const getAllHotActivities = async () => {
  const result = await window.ipcRenderer.invoke('get-all-hot-activities')
  tableData.value = result
}

const getHotActivitiesProgress = (event, item) => {
  tableData.value.push({ ...item })
}

const getHotActivitiesComplete = async () => {
  await window.ipcRenderer.invoke('dialog:show-message-box', {
    type: 'info',
    title: '热门活动',
    message: '搜索完成'
  })
}

const handleClick = async () => {
  tableData.value = []
  await getHotActivities()
}

let unsubscribeProgress = null
let unsubscribeComplete = null

onMounted(async () => {
  unsubscribeProgress = window.ipcRenderer.on(
    'get-hot-activities-progress',
    getHotActivitiesProgress
  )
  unsubscribeComplete = window.ipcRenderer.on(
    'get-hot-activities-complete',
    getHotActivitiesComplete
  )
  await getAllHotActivities()
})

onUnmounted(() => {
  unsubscribeProgress?.()
  unsubscribeComplete?.()
  unsubscribeProgress = null
  unsubscribeComplete = null
})
</script>

<template>
  <div class="hot-activities">
    <el-table
      :data="tableData"
      border
      :default-sort="{ prop: 'start_time', order: 'ascending' }"
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 100px)"
    >
      <el-table-column prop="start_time" align="center">
        <template #header>
          <div @click="handleClick">活动开始时间</div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="活动名称" align="center">
        <template #default="{ row }">
          <a :href="row.url" target="_blank">{{ row.name }}</a>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.hot-activities {
  padding: 20px;
}
</style>
