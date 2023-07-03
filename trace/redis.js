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

module.exports = {
  redisClient,
  setRedis,
  getRedis
}