import dayjs from 'dayjs'

export const sleep = (second) => new Promise((resolve) => setTimeout(resolve, second * 1000))

export const proxyImage = (url) => {
  return `http://localhost:3001/proxy-image?url=${encodeURIComponent(url)}`
}

export const formatTime = (timestamp) => {
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

export const getSevenDaysAgo = () => {
  return dayjs().subtract(7, 'day').format('YYYY-MM-DD')
}
