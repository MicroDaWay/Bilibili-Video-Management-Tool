<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import { formatTime } from '@/utils'

const dialogVisible = ref(false)
const isEdit = ref(false)
const rowId = ref(null)
const tableData = ref([])
const formData = {
  event_name: '',
  event_start_time: '',
  event_end_time: '',
  event_rules: '',
  post_count: 0,
  view: 0,
  money: 0,
  tag: '',
  search_time: ''
}
const form = ref({ ...formData })

const hanleMatch = (plan) => {
  if (!plan.event_rules) return false
  const POST_COUNT = '投稿量>='
  const VIEW = '播放量>='
  let indexOfPostCount = 0
  let indexOfView = 0

  if (plan.event_rules.includes(POST_COUNT) && plan.event_rules.includes(VIEW)) {
    indexOfPostCount = plan.event_rules.indexOf(POST_COUNT) + POST_COUNT.length
    indexOfView = plan.event_rules.indexOf(VIEW) + VIEW.length
    return (
      plan.post_count >= +plan.event_rules[indexOfPostCount] &&
      plan.view >= +plan.event_rules.slice(indexOfView)
    )
  } else if (plan.event_rules.includes(POST_COUNT) && !plan.event_rules.includes(VIEW)) {
    indexOfPostCount = plan.event_rules.indexOf(POST_COUNT) + POST_COUNT.length
    return plan.post_count >= +plan.event_rules[indexOfPostCount]
  } else if (plan.event_rules.includes(VIEW) && !plan.event_rules.includes(POST_COUNT)) {
    indexOfView = plan.event_rules.indexOf(VIEW) + VIEW.length
    return plan.view >= +plan.event_rules.slice(indexOfView)
  }
}

const getPlanList = async () => {
  const expiredIds = []
  const validPlans = []
  const plans = await window.ipcRenderer.invoke('plan:get-all')
  const currentTime = formatTime(Math.floor(Date.now() / 1000))

  for (const plan of plans) {
    if (plan.event_end_time < currentTime) {
      expiredIds.push(plan.id)
    } else {
      validPlans.push(plan)
    }
  }

  if (expiredIds.length) {
    await Promise.all(expiredIds.map((id) => window.ipcRenderer.invoke('plan:delete', id)))
  }

  tableData.value = validPlans.map((plan) => {
    return {
      ...plan,
      isMatch: hanleMatch(plan)
    }
  })
}

const handleAdd = () => {
  isEdit.value = false
  rowId.value = null
  form.value = { ...formData }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  rowId.value = row.id
  form.value = JSON.parse(JSON.stringify(row))
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const data = JSON.parse(JSON.stringify(form.value))
  console.log(data)
  if (isEdit.value) {
    await window.ipcRenderer.invoke('plan:update', { id: rowId.value, ...data })
    ElMessage({
      type: 'success',
      message: '修改成功'
    })
  } else {
    await window.ipcRenderer.invoke('plan:add', data)
    ElMessage({
      type: 'success',
      message: '添加成功'
    })
  }
  dialogVisible.value = false
  await getPlanList()
  form.value = {
    event_name: '',
    event_start_time: '',
    event_end_time: '',
    event_rules: '',
    post_count: 0,
    view: 0,
    money: 0,
    tag: '',
    search_time: ''
  }
}

const hanleDelete = (row) => {
  ElMessageBox.confirm('你确定要删除吗', '警告', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    await window.ipcRenderer.invoke('plan:delete', row.id)
    ElMessage({
      type: 'success',
      message: '删除成功'
    })
    await getPlanList()
  })
}

onMounted(async () => {
  await getPlanList()
})
</script>

<template>
  <div class="home">
    <div class="add">
      <el-button type="primary" @click="handleAdd">新增活动</el-button>
    </div>
    <el-table
      :data="tableData"
      border
      style="width: 100%"
      height="calc(100vh - 160px)"
      :default-sort="{ prop: 'event_end_time', order: 'ascending' }"
      :row-class-name="({ row }) => (row.isMatch ? 'match-row' : '')"
    >
      <el-table-column prop="event_name" label="活动名称" align="center" min-width="280" />
      <el-table-column prop="tag" label="投稿标签" align="center" min-width="200" />
      <el-table-column
        prop="event_start_time"
        label="活动开始时间"
        align="center"
        min-width="120"
      />
      <el-table-column prop="event_end_time" label="活动结束时间" align="center" min-width="120" />
      <el-table-column prop="event_rules" label="活动规则" align="center" min-width="200" />
      <el-table-column prop="post_count" label="投稿量" align="center" min-width="80">
      </el-table-column>
      <el-table-column prop="view" label="播放量" align="center" min-width="80" />
      <el-table-column prop="money" label="瓜分金额" align="center" min-width="90" />
      <el-table-column prop="search_time" label="查询时间" align="center" min-width="160" />
      <el-table-column label="操作" align="center" min-width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" @click="hanleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑活动' : '新增活动'"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    style="
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 500px;
      font-size: 1.2rem;
    "
  >
    <el-form :model="form" label-position="right" label-width="120px">
      <el-form-item label="活动名称">
        <el-input v-model.trim="form.event_name" style="width: 360px" />
      </el-form-item>
      <el-form-item label="投稿标签">
        <el-input v-model.trim="form.tag" style="width: 360px" />
      </el-form-item>
      <el-form-item label="活动开始时间">
        <el-date-picker
          v-model="form.event_start_time"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 360px"
        />
      </el-form-item>
      <el-form-item label="活动结束时间">
        <el-date-picker
          v-model="form.event_end_time"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 360px"
        />
      </el-form-item>
      <el-form-item label="活动规则">
        <el-input v-model.trim="form.event_rules" style="width: 360px" />
      </el-form-item>
      <el-form-item label="投稿量">
        <el-input-number v-model="form.post_count" style="width: 360px" />
      </el-form-item>
      <el-form-item label="瓜分金额">
        <el-input-number v-model="form.money" style="width: 360px" />
      </el-form-item>
      <div class="buttons" style="display: flex; justify-content: center; align-items: center">
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<style scoped lang="scss">
.home {
  padding: 20px;

  :deep(.match-row) {
    background-color: #00b050;
    color: #000000;
  }

  .add {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 60px;
    padding: 0 20px;
    background-color: #ffffff;
  }
}
</style>
