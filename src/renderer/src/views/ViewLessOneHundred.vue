<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'

const tableData = ref([])

const getViewLessOneHundred = async () => {
  const result = await window.ipcRenderer.invoke('get-view-less-one-hundred')
  tableData.value = result
}

onMounted(async () => {
  await getViewLessOneHundred()
})
</script>

<template>
  <div class="view-less-one-hundred">
    <el-table
      :data="tableData"
      border
      :default-sort="{ prop: 'post_time', order: 'ascending' }"
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 100px)"
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

<style>
.view-less-one-hundred {
  padding: 20px;
}
</style>
