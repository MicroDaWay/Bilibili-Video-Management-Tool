export const sleep = (second) => new Promise((resolve) => setTimeout(resolve, second * 1000))

export const proxyImage = (url) => {
  return `http://localhost:3001/proxy-image?url=${encodeURIComponent(url)}`
}
