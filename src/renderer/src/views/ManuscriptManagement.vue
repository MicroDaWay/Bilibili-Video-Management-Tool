<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { formatTime, proxyImage } from '../utils'

const postTag = ref('')
const isSearching = ref(false)
const manuscriptList = ref([])

const handleSearch = async () => {
  if (!postTag.value) {
    await window.ipcRenderer.invoke('dialog:show-message-box', {
      type: 'info',
      title: '稿件管理',
      message: '请输入投稿标签'
    })
    return
  }
  manuscriptList.value = []
  isSearching.value = true
  await window.ipcRenderer.invoke('search-manuscripts', postTag.value)
}

const searchManuscriptsProgress = (event, item) => {
  manuscriptList.value.push({ ...item })
}

const searchManuscriptsComplete = async (event, { count }) => {
  isSearching.value = false
  await window.ipcRenderer.invoke('dialog:show-message-box', {
    type: 'info',
    title: '稿件管理',
    message: count > 0 ? '搜索完成' : '没有找到符合条件的稿件'
  })
}

onMounted(() => {
  window.ipcRenderer.on('search-manuscripts-progress', searchManuscriptsProgress)
  window.ipcRenderer.on('search-manuscripts-complete', searchManuscriptsComplete)
})

onUnmounted(() => {
  window.ipcRenderer.removeListener('search-manuscripts-progress', searchManuscriptsProgress)
  window.ipcRenderer.removeListener('search-manuscripts-complete', searchManuscriptsComplete)
})
</script>

<template>
  <div class="manuscript-management">
    <div class="search-container">
      <el-input
        v-model="postTag"
        :disabled="isSearching"
        style="font-size: 1.2rem"
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
    <div class="manuscript-list">
      <div v-for="item in manuscriptList" :key="item.bvid" class="manuscript-item">
        <div class="manuscript-cover">
          <a :href="`https://www.bilibili.com/video/${item.bvid}`" target="_blank">
            <img :src="proxyImage(item.cover)" />
          </a>
        </div>
        <div class="manuscript-details">
          <div>标题：{{ item.title }}</div>
          <div>投稿时间：{{ formatTime(item.ptime) }}</div>
          <div>投稿标签：{{ item.tag }}</div>
          <div>播放量：{{ item.view }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.manuscript-management {
  padding: 20px;

  .search-container {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .search-input {
      --el-input-border-radius: 20px;
    }
  }

  .manuscript-list {
    height: calc(100vh - 160px);
    margin: 10px 0;
    overflow-y: auto;

    .manuscript-item {
      display: flex;
      border-bottom: 1px solid #cccccc;
      padding: 10px 0;

      .manuscript-cover {
        height: 140px;

        img {
          height: 100%;
        }
      }

      .manuscript-details {
        font-size: 1.2rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-left: 20px;
      }
    }
  }
}
</style>
