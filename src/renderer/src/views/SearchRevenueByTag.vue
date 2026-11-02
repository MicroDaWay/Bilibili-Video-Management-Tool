<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const postTag = ref('')
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(50)
const total = ref(0)

const handleSearch = async () => {
  const result = await window.ipcRenderer.invoke('search-revenue-by-tag', postTag.value)
  await getRevenueByTag(postTag.value)
  tableData.value = result
  total.value = tableData.value.length
}

const getRevenueByTag = async (tag) => {
  await window.ipcRenderer.invoke('get-revenue-by-tag', {
    tag,
    currentPage: currentPage.value,
    pageSize: pageSize.value
  })
}

const handleCurrentChange = async () => {
  await getRevenueByTag(postTag.value)
}

const handleSizeChange = async () => {
  currentPage.value = 1
  await getRevenueByTag(postTag.value)
}
</script>

<template>
  <div class="search-revenue-by-tag">
    <div class="search-container">
      <el-input
        v-model="postTag"
        style="width: 100%; font-size: 1.2rem"
        placeholder="请输入投稿标签"
        :prefix-icon="Search"
        size="large"
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <el-button
        type="primary"
        size="large"
        style="font-size: 1.2rem; border-radius: 20px; margin-left: 20px"
        @click="handleSearch"
      >
        搜索
      </el-button>
    </div>
    <el-table
      :data="tableData"
      highlight-current-row
      border
      :default-sort="{ prop: 'create_time', order: 'descending' }"
      style="width: 100%; font-size: 1.2rem; height: calc(100vh - 245px); margin: 20px 0"
    >
      <el-table-column prop="title" label="投稿标签" align="center"> </el-table-column>
      <el-table-column prop="brokerage" label="到账金额" align="center" width="120">
      </el-table-column>
      <el-table-column prop="create_time" label="贝壳发放时间" align="center" width="220">
      </el-table-column>
      <el-table-column prop="total_brokerage" label="累计金额" align="center" width="120">
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[50, 100]"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<style scoped lang="scss">
.search-revenue-by-tag {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  padding: 20px;

  .search-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .search-input {
      --el-input-border-radius: 20px;
    }
  }
}
</style>
