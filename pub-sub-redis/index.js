// (async() => {
//   const os = require("os")
//   const hostName = os.hostname()
//   const redis = require('redis')
//   const REDIS_DB1 = 1
//   const redisClient = redis.createClient({
//     url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6383'}`
//   })

//   const STREAMS_KEY = 'stream_4'
//   const CONSUMER_GROUP = 'stream_group_4'
//   const CONSUMER_ID = '1'

//   const getDate = () => {
//     return new Date().toISOString()
//   }

//   const wait = (time) => {
//       return new Promise(resolve => {
//           setTimeout(resolve, time * 1000)
//       })
//   }
  
//   await redisClient.connect()
//   await redisClient.select(REDIS_DB1)

//   // try {
//   //   await redisClient.xGroupCreate(
//   //     STREAMS_KEY, 
//   //     CONSUMER_GROUP, 
//   //     '0', {
//   //     MKSTREAM: true
//   //   })

//   //   console.log(`[${hostName}][${getDate()}] Created consumer group`)
//   // } catch (e) {
//   //   console.log(`[${hostName}][${getDate()}] Consumer group already exists, skipped creation`)
//   // }

//   while (true) {
//     try {
//       await wait(2)

//       // const response = await redisClient.xReadGroup(
//       //   redis.commandOptions({
//       //     isolated: true
//       //   }),
//       //   CONSUMER_GROUP, 
//       //   CONSUMER_ID, 
//       //   [
//       //     {
//       //       key: STREAMS_KEY,
//       //       id: '>'
//       //     }
//       //   ], {
//       //     COUNT: 1,
//       //     BLOCK: 5000
//       //   }
//       // )

//       const response = await redisClient.xRead(
//         redis.commandOptions({
//           isolated: true
//         }),
//         [
//           {
//             key: STREAMS_KEY,
//             id: '0-0' //'>'
//           }
//         ], {
//           COUNT: 1,
//           BLOCK: 5000
//         }
//       )

//       if (response) {
//         console.log(JSON.stringify(response))

//         const entryId = response[0].messages[0].id
//         await client.xAck(STREAMS_KEY, CONSUMER_ID, entryId)

//         console.log(`Acknowledged processing of entry ${entryId}.`)
//       } else {
//         console.log('No new stream entries.')
//       }
//     } catch (err) {
//       console.error(err)
//     }
//   }
//   await redisClient.disconnect()
// })()

(async() => {
  const { createClient, commandOptions } = require('redis');

  const client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6383'}`
  });

  // if (process.argv.length !== 3) {
  //   console.log(`usage: node stream-consumer-group.js <consumerName>`);
  //   process.exit(1);
  // }

  const consumerName = 'myconsumer'

  await client.connect();

  // Create the consumer group (and stream) if needed...
  try {
    // https://redis.io/commands/xgroup-create/
    await client.xGroupCreate('mystream', 'myconsumergroup', '0', {
      MKSTREAM: true
    });
    console.log('Created consumer group.');
  } catch (e) {
    console.log('Consumer group already exists, skipped creation.');
  }

  console.log(`Starting consumer ${consumerName}.`);

  while (true) {
    try {
      // https://redis.io/commands/xreadgroup/
      let response = await client.xReadGroup(
        commandOptions({
          isolated: true
        }),
        'myconsumergroup', 
        consumerName, [
          // XREADGROUP can read from multiple streams, starting at a
          // different ID for each...
          {
            key: 'mystream',
            id: '>' // Next entry ID that no consumer in this group has read
          }
        ], {
          // Read 1 entry at a time, block for 5 seconds if there are none.
          COUNT: 1,
          BLOCK: 5000
        }
      );

      if (response) {
        // Response is an array of streams, each containing an array of
        // entries:
        //
        // [
        //   {
        //      "name": "mystream",
        //      "messages": [
        //        {
        //          "id": "1642088708425-0",
        //          "message": {
        //            "num": "999"
        //          }
        //        }
        //      ]
        //    }
        //  ]
        console.log(JSON.stringify(response));

        // Use XACK to acknowledge successful processing of this
        // stream entry.
        // https://redis.io/commands/xack/
        const entryId = response[0].messages[0].id;
        await client.xAck('mystream', 'myconsumergroup', entryId);

        console.log(`Acknowledged processing of entry ${entryId}.`);
      } else {
        // Response is null, we have read everything that is
        // in the stream right now...
        console.log('No new stream entries.');
      }
    } catch (err) {
      console.error(err);
    }
  }
  
})()