import express from 'express'
import axios from 'axios'
import { createServer } from 'http'

const app = express()
const server = createServer(app)

app.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) {
      return res.status(400).send('missing url')
    }
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        Referer: 'https://www.bilibili.com/',
        Origin: 'https://www.bilibili.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
      }
    })

    // 保留图片类型
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg')
    response.data.pipe(res)
  } catch (error) {
    console.error('图片代理失败: ', error.message)
    res.status(500).send('proxy error')
  }
})

const startImageProxy = (port = 3001) => {
  server.listen(port, () => {
    console.log(`图片代理服务器启动: http://localhost:${port}`)
  })
}

export default startImageProxy
