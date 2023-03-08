const os = require("os")
const hostName = os.hostname()
const stompit = require('stompit')
const redis = require('redis')
const REDIS_DB1 = 1
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
})

const setRedis = async (key, value) => {
  await redisClient.connect()
  await redisClient.select(REDIS_DB1)
  await redisClient.set(`message_${key}`, value)
  await redisClient.disconnect()
}

const getRedis = async (key) => {
  await redisClient.connect()
  await redisClient.select(REDIS_DB1)

  const value = await redisClient.get(`message_${key}`)

  await redisClient.disconnect()

  return value
}

const connectOptions = {
  'host': process.env.MQ_HOST || 'localhost',
  'port': process.env.MQ_PORT || '61613'
}

const subscribeHeaders = {
    // 'destination': '/topic/VirtualTopic.Orders',
    'destination': '/queue/Consumer.A.VirtualTopic.Orders',
    'ack': 'client-individual',
    // 'selector': `_AMQ_GROUP_ID='${process.env.GROUP_ID || 'g-1'}'`
}

/*
  se usar 'ack': 'client-individual' precisar dar ack ou nack
  se não usar é automatico
*/

const getDate = () => {
    return new Date().toISOString()
}

stompit.connect(connectOptions, (error, client) => {
  if (error) {
    console.log(`[${hostName}][${getDate()}] connect error - ${error.message} `)
    return
  }

  console.log(`[${hostName}][${getDate()}] connected`)
  console.log(`[${hostName}][${getDate()}] subscribed to topic`)

  // let consuming = false

  client.subscribe(subscribeHeaders, async (error, message) => {
    // Não processa mais de 1 msg por vez
    // if(consuming){
    //     return
    // }

    const messageId = message.headers['message-id']
    // const existsMessage = await getRedis(messageId)

    // if(existsMessage) {
    //   return
    // }

    // await setRedis(message.headers['message-id'], 'ok')

    // consuming = true

    if (error) {
        console.log(`[${hostName}][${getDate()}][${messageId}] subscribe error - ${error.message} `)
        // consuming = false
        return
    }
    
    message.readString('utf-8', (error, body) => {
        if (error) {
            console.log(`[${hostName}][${getDate()}][${messageId}] read message error - ${error.message} `)
            consuming = false
            return
        }
        
        console.log(`[${hostName}][${getDate()}][${messageId}] received message: ${body}`)

        client.ack(message, message.headers)

        console.log(`[${hostName}][${getDate()}][${messageId}] acked`)

        // consuming = false
    })
  })
})
