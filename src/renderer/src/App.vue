<script setup>
import { House, Fold, Expand, Star } from '@element-plus/icons-vue'
import { nextTick, onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import { sleep } from '@/utils'
import { proxyImage } from './utils'
import refreshImage from '@/assets/refresh.png'

const isCollapse = ref(false)
const dialogVisible = ref(false)
const qrcodeRef = ref(null)
const qrcodeUrl = ref('')
const qrcodeKey = ref('')
const qrcodeExpired = ref(false)
const navInfo = ref({
  mid: '',
  uname: '',
  face: '',
  isLogin: false
})

const getNavInfo = async () => {
  const result = await window.ipcRenderer.invoke('get-nav-info')
  navInfo.value = {
    mid: result.data.mid,
    uname: result.data.uname,
    face: result.data.face,
    isLogin: result.data.isLogin
  }
}

const qrcodeGenerate = async () => {
  const response = await window.ipcRenderer.invoke('qrcode-generate')
  const { url, qrcode_key } = response.data
  qrcodeUrl.value = url
  qrcodeKey.value = qrcode_key
  QRCode.toCanvas(qrcodeRef.value, qrcodeUrl.value, {
    width: 200
  })
}

const qrcodePoll = async () => {
  while (dialogVisible.value && !qrcodeExpired.value) {
    await sleep(2)
    const response = await window.ipcRenderer.invoke('qrcode-poll', qrcodeKey.value)
    const setCookie = response['set-cookie']
    const { code, message } = response.data.data
    switch (code) {
      case 0:
        dialogVisible.value = false
        await window.ipcRenderer.invoke('set-cookie', setCookie)
        await getNavInfo()
        localStorage.setItem('isLogin', navInfo.value.isLogin)
        break
      case 86101:
        console.log('未扫码')
        break
      case 86090:
        console.log('二维码已扫码未确认')
        break
      case 86038:
        console.log('二维码已失效')
        qrcodeExpired.value = true
        break
      default:
        console.log(`未知状态码: ${code}, message: ${message}`)
        break
    }
  }
}

const handleRefresh = async () => {
  qrcodeExpired.value = false
  await qrcodeGenerate()
  await qrcodePoll()
}

const handleLogin = async () => {
  dialogVisible.value = true
  qrcodeExpired.value = false
  await nextTick()
  await qrcodeGenerate()
  await qrcodePoll()
}

onMounted(async () => {
  await getNavInfo()
})
</script>

<template>
  <div class="app">
    <div class="nav-menu" :class="{ 'is-collapse': isCollapse }">
      <el-scrollbar class="scrollbar">
        <el-menu
          class="el-menu-container"
          :default-active="$route.path"
          :collapse="isCollapse"
          :router="true"
        >
          <el-menu-item index="/home">
            <el-icon><House /></el-icon>
            <span class="home">首页</span>
          </el-menu-item>
          <el-menu-item index="/hot-activities">
            <el-icon><Star /></el-icon>
            <span class="hot-activities">热门活动</span>
          </el-menu-item>
          <!-- <el-sub-menu index="2">
            <template #title>
              <el-icon><location /></el-icon>
              <span>2</span>
            </template>
            <el-menu-item class="2-1">2-1</el-menu-item>
            <el-menu-item class="2-2">2-2</el-menu-item>
            <el-menu-item class="2-3">2-3</el-menu-item>
            <el-menu-item class="2-4">2-4</el-menu-item>
            <el-menu-item class="2-5">2-5</el-menu-item>
            <el-menu-item class="2-6">2-6</el-menu-item>
            <el-menu-item class="2-7">2-7</el-menu-item>
            <el-menu-item class="2-8">2-8</el-menu-item>
            <el-menu-item class="2-9">2-9</el-menu-item>
            <el-menu-item class="2-10">2-10</el-menu-item>
          </el-sub-menu> -->
        </el-menu></el-scrollbar
      >
    </div>

    <div class="main-container">
      <div class="main-header">
        <el-icon v-show="!isCollapse" class="fold" @click="isCollapse = !isCollapse">
          <Fold />
        </el-icon>
        <el-icon v-show="isCollapse" class="expand" @click="isCollapse = !isCollapse">
          <Expand />
        </el-icon>
        <el-avatar
          v-if="navInfo.isLogin"
          :src="proxyImage(navInfo.face)"
          class="avatar"
        ></el-avatar>
        <el-button v-else type="primary" class="login" @click="handleLogin">登录</el-button>
      </div>
      <router-view />
    </div>
  </div>
  <el-dialog
    v-model="dialogVisible"
    class="dialog"
    align-center
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <span>扫描二维码登录</span>
    <div class="qrcode-container">
      <canvas ref="qrcodeRef"></canvas>
      <div v-show="qrcodeExpired" class="refresh" @click="handleRefresh">
        <img :src="refreshImage" class="refresh-image" />
        <span>二维码已过期</span>
        <span>请点击刷新</span>
      </div>
    </div>
    <div class="tips-1">
      <span>请使用 </span><a href="https://app.bilibili.com/" target="_blank">哔哩哔哩客户端</a>
    </div>
    <span class="tips-2">扫码登录或扫码下载APP</span>
  </el-dialog>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  justify-content: space-between;
  height: 100vh;

  .nav-menu {
    width: calc(1 / 6 * 100%);
    height: 100%;
    transition: all 0.3s;

    &.is-collapse {
      width: calc(1 / 24 * 100%);
    }

    .scrollbar {
      height: 100%;

      .el-menu-container {
        height: 100vh;
        background-color: #f6f6f6;

        .el-icon {
          font-size: 1.2rem;
        }

        .home,
        .hot-activities {
          font-size: 1.2rem;
          margin-left: 4px;
        }
      }
    }
  }

  .main-container {
    flex: 1;

    .main-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 60px;
      padding: 0 20px;
      background-color: orange;

      .fold,
      .expand {
        font-size: 1.4rem;
        cursor: pointer;
      }

      .avatar {
        cursor: pointer;
      }

      .login {
        font-size: 1.2rem;
      }
    }
  }
}

.dialog {
  .qrcode-container {
    position: relative;

    &:hover {
      cursor: pointer;
    }

    .refresh {
      position: absolute;
      left: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 200px;
      height: 200px;
      background: hsla(0, 0%, 100%, 0.9);

      .refresh-image {
        margin-bottom: 20px;
      }

      span {
        font-size: 0.8rem;
      }
    }
  }

  .tips-1,
  .tips-2 {
    font-size: 0.8rem;
  }
}
</style>

<style>
.el-dialog {
  border-radius: 20px;
}

.el-dialog__body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 1.2rem;
}
</style>
