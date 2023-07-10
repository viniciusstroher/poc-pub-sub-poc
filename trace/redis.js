const redis = require('redis')
const REDIS_DB1 = 1
const redisConnect = {
  url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`
}

const createClient = () => {
  const conn = redis.createClient(redisConnect)
  return conn
}

const redisClient = createClient()

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