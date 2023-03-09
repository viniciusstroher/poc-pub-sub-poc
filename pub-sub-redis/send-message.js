// (async() => {
//     const os = require("os")
//     const hostName = os.hostname()
//     const redis = require('redis')
//     const REDIS_DB1 = 1
//     const redisClient = redis.createClient({
//       url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6383'}`
//     })

//     const STREAMS_KEY = 'stream_4'

//     const addStream = async (key, value) => {
//       await redisClient.connect()
//       await redisClient.select(REDIS_DB1)
//       await redisClient.xAdd(STREAMS_KEY, '*', JSON.stringify({key, value}))
//       await redisClient.disconnect()
//     }
  
//     const getDate = () => {
//         return new Date().toISOString()
//     }
  
//     console.log(`[${hostName}][${getDate()}] sendstream`)
//     await addStream('unixtime', new Date().getTime())
// })()

(async() => {
  // A sample stream producer using XADD.
  // https://redis.io/commands/xadd/
  const { createClient } = require('redis');

  const client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6383'}`
  });

  await client.connect();

  for (let i = 0; i < 10000; i++) {
    await client.xAdd(
      'mystream',
      '*', // * = Let Redis generate a timestamp ID for this new entry.
      // Payload to add to the stream:
      {
        i: i.toString()
        // Other name/value pairs can go here as required...
      }
    );

    // Also add to a stream whose length we will cap at approximately
    // 1000 entries using the MAXLEN trimming strategy:
    // https://redis.io/commands/xadd/

    await client.xAdd(
      'mytrimmedstream', 
      '*',
      // Payload to add to the stream:
      {
        i: i.toString()
        // Other name/value pairs can go here as required...
      },
      // Specify a trimming strategy...
      {
        TRIM: {
          strategy: 'MAXLEN', // Trim by length.
          strategyModifier: '~', // Approximate trimming.
          threshold: 1000 // Retain around 1000 entries.
        }
      }
    );
  }

  // Take a look at how many entries are in the streams...
  // https://redis.io/commands/xlen/
  // Should be 10000:
  console.log(`Length of mystream: ${await client.xLen('mystream')}.`);
  // Should be approximately 1000:
  console.log(`Length of mytrimmedstream: ${await client.xLen('mytrimmedstream')}.`);

  await client.quit();
})()