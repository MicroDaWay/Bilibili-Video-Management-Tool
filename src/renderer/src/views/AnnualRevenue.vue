<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'

const tableData = ref([])

const getAnnualRevenue = async () => {
  const result = await window.ipcRenderer.invoke('get-annual-revenue')
  tableData.value = result
}

onMounted(async () => {
  await getAnnualRevenue()
})
</script>

<template>
  <div class="annual-revenue">
    <el-table
      :data="tableData"
      highlight-current-row
      border
      :default-sort="{ prop: 'year', order: 'descending' }"
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 100px)"
    >
      <el-table-column prop="year" label="年份" align="center"> </el-table-column>
      <el-table-column prop="total_brokerage" label="金额" align="center"> </el-table-column>
    </el-table>
  </div>
</template>

<style>
.annual-revenue {
  padding: 20px;
}
</style>
