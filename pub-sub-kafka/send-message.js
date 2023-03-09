(async() => {
  const os = require("os")
  const hostName = os.hostname()

  const getDate = () => {
    return new Date().toISOString()
  }

  const STREAM = process.env.STREAM || 'stream_app'
  const GROUP = process.env.GROUP || 'stream_consumer'
  const CONSUMER = 'myconsumer' + (Math.random() * 20)
  
})()