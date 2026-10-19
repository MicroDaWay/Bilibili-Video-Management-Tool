<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'

const tableData = ref([])

const getMonthlyRevenue = async () => {
  const result = await window.ipcRenderer.invoke('get-monthly-revenue')
  tableData.value = result
}

onMounted(async () => {
  await getMonthlyRevenue()
})
</script>

<template>
  <div class="monthly-revenue">
    <el-table
      :data="tableData"
      border
      :default-sort="{ prop: 'month', order: 'descending' }"
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 100px)"
    >
      <el-table-column prop="month" label="月份" align="center"> </el-table-column>
      <el-table-column prop="total_brokerage" label="金额" align="center"> </el-table-column>
    </el-table>
  </div>
</template>

<style>
.monthly-revenue {
  padding: 20px;
}
</style>
