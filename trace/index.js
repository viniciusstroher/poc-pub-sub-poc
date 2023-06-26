(async() => {
  const {
    createTrace
  } = require('./tracer')
  createTrace('teste')

  const express = require('express')
  const app = express()
  const os = require("os")
  const hostName = os.hostname()
  
  const getDate = () => {
    return new Date().toISOString()
  }

  // trace midleware
  // app.use(midlwareAdpater)

  app.get('/', (req, res) => {
    console.log(`[${hostName}][${getDate()}] hit `)
    return res.send({message: 'ok'})
  })

  app.get('/healthcheck', (req, res) => {
    return res.send({message: 'ok'})
  })
  
  const port = process.env.PORT || '3535'
  
  console.log(`[${hostName}][${getDate()}] start server at port ${port} `)

  app.listen(port)
})()