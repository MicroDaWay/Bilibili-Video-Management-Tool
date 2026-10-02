import { app, shell, BrowserWindow, ipcMain, session, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico'
import axios from 'axios'
import setCookieParser from 'set-cookie-parser'
import startImageProxy from './image-proxy'
import { addPlan, deletePlan, getAllPlans, getPlan, initDatabase, updatePlan } from './database'
import { formatTime, sleep } from '../renderer/src/utils'

const PARTITION_NAME = 'persist:bilibili'

const parseCookies = (setCookieHeaders) => {
  return setCookieParser.parse(setCookieHeaders).map((cookie) => {
    const result = {
      url: 'https://bilibili.com',
      name: cookie.name,
      value: cookie.value,
      path: cookie.path || '/'
    }

    if (cookie.domain) {
      result.domain = cookie.domain.startsWith('.') ? cookie.domain : `.${cookie.domain}`
    }

    if (cookie.expires) {
      result.expirationDate = cookie.expires.getTime() / 1000
    }

    return result
  })
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.ico'),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  const customSession = session.fromPartition(PARTITION_NAME)
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('dialog:show-message-box', async (event, option) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return await dialog.showMessageBox(win, { ...option })
  })

  // 生成登录二维码
  ipcMain.handle('qrcode-generate', async () => {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate'
    const headers = {
      Referer: 'https://www.bilibili.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
    }
    const response = await axios.get(url, {
      headers
    })
    return response.data
  })

  // 轮询登录二维码状态
  ipcMain.handle('qrcode-poll', async (event, qrcode_key) => {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll'
    const headers = {
      Referer: 'https://www.bilibili.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
    }
    const response = await axios.get(url, {
      headers,
      params: {
        qrcode_key
      }
    })
    return {
      'set-cookie': response.headers['set-cookie'],
      data: response.data
    }
  })

  // 设置Cookie
  ipcMain.handle('set-cookie', async (event, setCookie) => {
    const cookies = parseCookies(setCookie)
    for (const cookie of cookies) {
      await customSession.cookies.set(cookie)
    }
  })

  // 获取Cookie
  ipcMain.handle('get-cookie', async (event, itemName) => {
    const cookies = await customSession.cookies.get({
      url: 'https://www.bilibili.com',
      name: itemName
    })
    return cookies[0]
  })

  // 获取首页导航信息
  ipcMain.handle('get-nav-info', async () => {
    const cookies = await customSession.cookies.get({
      url: 'https://www.bilibili.com',
      name: 'SESSDATA'
    })
    const url = 'https://api.bilibili.com/x/web-interface/nav'
    const headers = {
      Cookie: `SESSDATA=${cookies[0].value}`,
      Referer: 'https://www.bilibili.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
    }
    const response = await axios.get(url, {
      headers
    })
    return response.data
  })

  // 新增计划
  ipcMain.handle('plan:add', async (event, formData) => {
    await addPlan(formData)
  })

  // 更新计划
  ipcMain.handle('plan:update', async (event, formData) => {
    await updatePlan(formData)
  })

  // 获取单个计划
  ipcMain.handle('plan:get', async (event, tag) => {
    console.log('plan:get', await getPlan(tag))
    // return await getPlan(tag)
  })

  // 获取所有计划
  ipcMain.handle('plan:get-all', () => {
    return getAllPlans()
  })

  // 删除计划
  ipcMain.handle('plan:delete', async (event, id) => {
    await deletePlan(id)
  })

  // 搜索稿件
  ipcMain.handle('search-manuscripts', async (event, postTag) => {
    let count = 0
    let totalView = 0

    try {
      let pn = 1
      let postTime = null
      const result = await getPlan(postTag)
      if (!result) return false
      const { event_start_time, event_end_time } = result

      while (true) {
        await sleep(1)
        const cookies = await customSession.cookies.get({
          url: 'https://www.bilibili.com',
          name: 'SESSDATA'
        })
        const url = 'https://member.bilibili.com/x/web/archives'
        const headers = {
          Cookie: `SESSDATA=${cookies[0].value}`,
          Referer: `https://member.bilibili.com/platform/upload-manager/article?page=${pn}`,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
        }
        const response = await axios.get(url, {
          headers,
          params: {
            pn,
            ps: 20
          }
        })

        const resultData = response.data
        const arc_audits = resultData.data.arc_audits

        for (const item of arc_audits) {
          const stat = item.stat
          const archive = item.Archive
          const bvid = archive.bvid
          const title = archive.title
          const cover = archive.cover
          const tag = archive.tag
          const view = stat.view
          const ptime = archive.ptime
          postTime = archive.ptime

          if (
            formatTime(ptime) >= event_start_time &&
            formatTime(ptime) <= event_end_time &&
            tag.includes(postTag)
          ) {
            count++
            totalView += view
            event.sender.send('search-manuscripts-progress', {
              bvid,
              title,
              cover,
              tag,
              view,
              ptime
            })
          }
        }
        if (formatTime(postTime) < event_start_time) {
          updatePlan({
            ...result,
            post_count: count,
            view: totalView,
            search_time: formatTime(Math.floor(Date.now() / 1000))
          })
          break
        }
        pn++
      }
    } catch (error) {
      console.log(error)
    } finally {
      event.sender.send('search-manuscripts-complete', { count })
    }
  })

  initDatabase()
  startImageProxy(3001)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
