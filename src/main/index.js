import { app, shell, BrowserWindow, ipcMain, session, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico'
import setCookieParser from 'set-cookie-parser'
import startImageProxy from './image-proxy'
import {
  addHotActivities,
  addManuscript,
  addPlan,
  deletePlan,
  getAllHotActivities,
  getAllManuscript,
  getAllPlans,
  getPlan,
  initDatabase,
  updateManuscript,
  updatePlan
} from './database'
import { formatTime, getSevenDaysAgo, sleep } from '../renderer/src/utils'
import { getHotActivities, getManuscripts, getNavInfo, qrcodeGenerate, qrcodePoll } from './api'

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

  // dialog弹框
  ipcMain.handle('dialog:show-message-box', async (event, option) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return await dialog.showMessageBox(win, { ...option })
  })

  // 生成登录二维码
  ipcMain.handle('qrcode-generate', async () => {
    return await qrcodeGenerate()
  })

  // 轮询登录二维码状态
  ipcMain.handle('qrcode-poll', async (event, qrcode_key) => {
    return await qrcodePoll(qrcode_key)
  })

  // 设置Cookie
  ipcMain.handle('set-cookie', async (event, setCookie) => {
    const cookies = parseCookies(setCookie)
    for (const cookie of cookies) {
      await customSession.cookies.set(cookie)
    }
  })

  // 获取首页导航信息
  ipcMain.handle('get-nav-info', async () => {
    const cookies = await customSession.cookies.get({
      url: 'https://www.bilibili.com',
      name: 'SESSDATA'
    })
    return await getNavInfo(cookies)
  })

  // 新增计划
  ipcMain.handle('plan:add', (event, formData) => {
    addPlan(formData)
  })

  // 更新计划
  ipcMain.handle('plan:update', (event, formData) => {
    updatePlan(formData)
  })

  // 获取所有计划
  ipcMain.handle('plan:get-all', () => {
    return getAllPlans()
  })

  // 删除计划
  ipcMain.handle('plan:delete', (event, id) => {
    deletePlan(id)
  })

  // 搜索稿件
  ipcMain.handle('search-manuscripts', async (event, postTag) => {
    let count = 0
    let totalView = 0
    let pn = 1
    let postTime = null

    const cookies = await customSession.cookies.get({
      url: 'https://www.bilibili.com',
      name: 'SESSDATA'
    })

    const result = await getPlan(postTag)
    if (!result) return false
    const { event_start_time, event_end_time } = result

    try {
      while (true) {
        await sleep(1)
        const resultData = await getManuscripts(cookies, pn)
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

  // 获取热门活动
  ipcMain.handle('get-hot-activities', async (event) => {
    let pn = 1
    let totalPage = 1
    const sevenDaysAgo = getSevenDaysAgo()

    const cookies = await customSession.cookies.get({
      url: 'https://www.bilibili.com',
      name: 'SESSDATA'
    })

    try {
      while (pn <= totalPage) {
        await sleep(1)
        const result = await getHotActivities(cookies, pn)
        const { list, page } = result.data
        totalPage = Math.ceil(page.total / page.ps)

        for (const item of list) {
          const name = item.name
          const url = item.act_url
          const start_time = formatTime(item.stime)
          if (start_time >= sevenDaysAgo) {
            addHotActivities({
              name,
              url,
              start_time
            })
            event.sender.send('get-hot-activities-progress', {
              name,
              url,
              start_time
            })
          }
        }
        pn++
      }
    } catch (error) {
      console.log(error)
    } finally {
      event.sender.send('get-hot-activities-complete')
    }
  })

  // 获取所有热门活动
  ipcMain.handle('get-all-hot-activities', () => {
    return getAllHotActivities()
  })

  // 更新数据库
  ipcMain.handle('update-database', async (event) => {
    let pn = 1
    let totalPage = 1
    const cookies = await customSession.cookies.get({
      url: 'https://www.bilibili.com',
      name: 'SESSDATA'
    })

    try {
      while (pn <= totalPage) {
        await sleep(5)
        const resultData = await getManuscripts(cookies, pn)
        const arc_audits = resultData.data.arc_audits
        const page = resultData.data.page
        totalPage = Math.ceil(page.count / page.ps)

        for (const item of arc_audits) {
          const stat = item.stat
          const archive = item.Archive
          const bvid = archive.bvid
          const title = archive.title
          const tag = archive.tag
          const view = stat.view
          const ptime = archive.ptime
          const itemData = {
            bvid,
            title,
            tag,
            view,
            post_time: formatTime(ptime)
          }
          event.sender.send('update-database-progress', itemData)
          const result = updateManuscript(itemData)
          if (!result) {
            addManuscript(itemData)
          }
          console.log(result, itemData)
        }
        pn++
      }
    } catch (error) {
      console.log(error)
    } finally {
      event.sender.send('update-database-complete')
    }
  })

  // 获取所有稿件
  ipcMain.handle('get-all-manuscript', () => {
    return getAllManuscript()
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
