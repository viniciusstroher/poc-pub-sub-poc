(async() => {
  const {
    createTrace
  } = require('./tracer')
  const {
    metrics
  } = createTrace()
  
  const meter = metrics.getMeter('request-root-hit-counter'); //TODO Replace with the name of your meter

  const requestRootHitCounter = meter.createCounter('request-root-hit-counter', { //TODO Replace with the name of your instrument
    description: 'Example of a Counter', //TODO Replace with the description of your isntrument
  });
  
  

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
    requestRootHitCounter.add(1)

    const randNum = Math.random() * 100
    
    if(randNum % 2 == 0){
       throw new Error('teste')
    }

    return res.send({message: 'ok'})
  })

  app.get('/healthcheck', (req, res) => {
    return res.send({message: 'ok'})
  })
  
  const port = process.env.PORT || '3536'
  
  console.log(`[${hostName}][${getDate()}] start server at port ${port} `)

  app.listen(port)
})()