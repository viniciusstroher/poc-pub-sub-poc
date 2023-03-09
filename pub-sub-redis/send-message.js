(async() => {
  const { createClient } = require('redis')
  const client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6383'}`
  })

  await client.connect()

  const os = require("os")
  const hostName = os.hostname()
  const STREAM = process.env.STREAM || 'stream_app'

  const getDate = () => {
    return new Date().toISOString()
  }

  for (let i = 0; i < 1; i++) {
    await client.xAdd(
      STREAM,
      '*',
      {message: 'teste'}
    )
  }

  console.log(`[${hostName}][${getDate()}] Length of mystream: ${await client.xLen('mystream')}.`)
  console.log(`[${hostName}][${getDate()}] Length of mytrimmedstream: ${await client.xLen('mytrimmedstream')}.`)

  await client.quit();
})()