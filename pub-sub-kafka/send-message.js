(async() => {
  const os = require("os")
  const hostName = os.hostname()

  const { Kafka } = require('kafkajs')

  const getDate = () => {
    return new Date().toISOString()
  }

  const TOPIC = process.env.STREAM || 'stream_app'
  const APP = process.env.APP || 'my-app'
  
  const kafka = new Kafka({
    clientId: APP,
    brokers: [`${process.env.KAFKA_HOST || 'localhost'}:${process.env.KAFKA_PORT || '29092'}`]
  })

  const producer = kafka.producer()

  await producer.connect()

  await producer.send({
    topic: TOPIC,
    messages: [
      { value: 'Hello KafkaJS user!' },
    ],
  })

})()