(async() => {
  const os = require("os")
  const hostName = os.hostname()
  
  const getDate = () => {
    return new Date().toISOString()
  }

  const TOPIC = process.env.STREAM || 'stream_app'
  const GROUP = process.env.GROUP || 'stream_consumer'

  const { Kafka } = require('kafkajs')

  const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [`${process.env.KAFKA_HOST || 'localhost'}:${process.env.KAFKA_PORT || '29092'}`]
  })

  const consumer = kafka.consumer({ groupId: GROUP })

  await consumer.connect()
  console.log(`[${hostName}][${getDate()}] connected`)

  const topic = { topic: TOPIC, fromBeginning: true }

  await consumer.subscribe(topic)
  console.log(`[${hostName}][${getDate()}] subscribe ${JSON.stringify(topic)}`)

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const data = {
        partition,
        offset: message.offset,
        value: message.value.toString(),
      }
      console.log(`[${hostName}][${getDate()}] subscribe ${JSON.stringify(topic)} - ${JSON.stringify(data)}`)
    }
  })
})()