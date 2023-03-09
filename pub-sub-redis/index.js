(async() => {
  const { createClient, commandOptions } = require('redis')
  const os = require("os")
  const hostName = os.hostname()
  const client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6383'}`
  })

  const getDate = () => {
    return new Date().toISOString()
  }
  const STREAM = process.env.STREAM || 'stream_app'
  const GROUP = process.env.GROUP || 'stream_consumer'
  const CONSUMER = 'myconsumer' + (Math.random() * 20)

  await client.connect()

  try {
    await client.xGroupCreate(STREAM, GROUP, '0', {
      MKSTREAM: true
    })
    console.log(`[${hostName}][${getDate()}] Created consumer group`)
  } catch (e) {
    console.log(`[${hostName}][${getDate()}] Consumer group already exists, skipped creation`)
  }

  console.log(`[${hostName}][${getDate()}] Starting consumer ${CONSUMER}`)

  while (true) {
    try {
      const response = await client.xReadGroup(
        commandOptions({
          isolated: true
        }),
        GROUP, 
        CONSUMER, [
          {
            key: STREAM,
            id: '>'
          }
        ], {
          COUNT: 1,
          BLOCK: 5000
        }
      )

      if (response) {
        console.log(`[${hostName}][${getDate()}] - ${JSON.stringify(response)}`)

        const entryId = response[0].messages[0].id
        await client.xAck(STREAM, GROUP, entryId)

        console.log(`[${hostName}][${getDate()}] Acknowledged processing of entry ${entryId}.`)
      } else {
        console.log(`[${hostName}][${getDate()}] No new stream entries`)
      }
    } catch (error) {
      console.error(error)
    }
  }
  
})()