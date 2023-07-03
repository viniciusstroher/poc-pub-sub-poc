(async() => {
  const {
    createTrace
  } = require('./tracer')

  const {
    metrics,
    logger
  } = createTrace()

  const meter = metrics.getMeter('request-root-hit-counter')

  const requestRootHitCounter = meter.createCounter('request-root-hit-counter', { 
    description: 'Example of a Counter'
  })
  
  const {
    setRedis,
    getRedis
  } = require('./redis')

  const {
    listenMessage,
    sendMessage
  } = require('./message')

  const express = require('express')
  const app = express()

  app.get('/', async (req, res) => {
    logger.info(`hit root`)
    
    requestRootHitCounter.add(1)

    const randNum = Math.random() * 100
    
    if(randNum % 2 == 0){
       throw new Error('teste')
    }

    await setRedis('hit_root', new Date().getTime())
    const time = await getRedis('hit_root')

    await sendMessage(logger, 'blah')

    return res.send({message: 'ok', time})
  })

  app.get('/healthcheck', async (req, res) => {
    logger.info(`hit healthcheck`)

    await setRedis('hit_healthcheck', new Date().getTime())
    const time = await getRedis('hit_healthcheck')

    return res.send({message: 'ok', time })
  })
  
  const port = process.env.PORT || '3536'
  
  logger.info(`start server at port ${port} `)

  listenMessage(logger)

  app.listen(port)
})()