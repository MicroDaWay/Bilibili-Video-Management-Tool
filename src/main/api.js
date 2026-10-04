import axios from 'axios'

export const qrcodeGenerate = async () => {
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
}

export const qrcodePoll = async (qrcode_key) => {
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
}

export const getNavInfo = async (cookies) => {
  const SESSDATA = cookies[0].value
  const url = 'https://api.bilibili.com/x/web-interface/nav'
  const headers = {
    Cookie: `SESSDATA=${SESSDATA}`,
    Referer: 'https://www.bilibili.com/',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
  }
  const response = await axios.get(url, {
    headers
  })
  return response.data
}

export const getManuscripts = async (cookies, pn) => {
  const SESSDATA = cookies[0].value
  const url = 'https://member.bilibili.com/x/web/archives'
  const headers = {
    Cookie: `SESSDATA=${SESSDATA}`,
    Referer: `https://member.bilibili.com/platform/upload-manager/article?page=${pn}`,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
  }
  const response = await axios.get(url, {
    headers,
    params: {
      pn,
      ps: 10
    }
  })
  return response.data
}

export const getHotActivities = async (cookies, pn) => {
  const SESSDATA = cookies[0].value
  const url = 'https://api.bilibili.com/x/activity_components/video_activity/hot_activity'
  const headers = {
    Cookie: `SESSDATA=${SESSDATA}`,
    Referer: `https://www.bilibili.com/blackboard/era/reward-activity-list-page.html`,
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
  return response.data
}
