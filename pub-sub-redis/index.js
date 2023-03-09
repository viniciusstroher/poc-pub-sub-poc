(async() => {
  const { createClient, commandOptions } = require('redis');

  const client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6383'}`
  });

  const consumerName = 'myconsumer' + (Math.random() * 20)

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