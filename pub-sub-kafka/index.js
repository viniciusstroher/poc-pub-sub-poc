(async() => {
  const os = require("os")
  const hostName = os.hostname()
  
  const getDate = () => {
    return new Date().toISOString()
  }

  const TOPIC = process.env.STREAM || 'stream_app'
  const GROUP = process.env.GROUP || 'stream_consumer'
  const APP = process.env.APP || 'my-app'
  
  const { Kafka } = require('kafkajs')

  const kafkaConnect = {
    clientId: APP,
    brokers: [`${process.env.KAFKA_HOST || 'localhost'}:${process.env.KAFKA_PORT || '29092'}`]
  }

  console.log(`[${hostName}][${getDate()}] config ${JSON.stringify(kafkaConnect)}`)

  const kafka = new Kafka(kafkaConnect)

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