const stompit = require('stompit')

const connectOptions = {
  'host': process.env.MQ_HOST || 'localhost',
  'port': process.env.MQ_PORT || '61613'
}

const subscribeHeaders = {
    // 'destination': '/topic/VirtualTopic.Orders',
    // 'destination': `/queue/Consumer.A.VirtualTopic.Orders`,
    'destination': `/queue/Consumer.${process.env.GROUP_ID || 'A'}.VirtualTopic.Orders`,
    'ack': 'client-individual',
    // 'selector': `_AMQ_GROUP_ID='${process.env.GROUP_ID || 'g-1'}'`
}


const listenMessage = (logger) => {
  stompit.connect(connectOptions, (error, client) => {
    client.subscribe(subscribeHeaders, async (error, message) => {
      const messageId = message.headers['message-id']

      if (error) {
        logger.error(`subscribe error - ${messageId} - ${error.message} `)
          return
      }
      
      message.readString('utf-8', (error, body) => {
          if (error) {
            logger.error(`read message error - ${messageId} - ${error.message} `)
              return
          }
          
          logger.info(`received message - ${messageId} - ${body}`)

          client.ack(message, message.headers)

          logger.info(`acked - ${messageId}`)
      })
    })
  })
}

const sendMessage = (logger, msg) => {
  stompit.connect(connectOptions, (error, client) => {

    if (error) {
      logger.info(`connect error - ${error.message} `)
      return
    }

    logger.info(`connected`)
    logger.info(`subscribed to topic`)

    const group = `g-1`
    
    const sendHeaders = {
        'destination': '/topic/VirtualTopic.Orders',
        // 'destination': '/queue/Consumer.A.VirtualTopic.Orders',
        'content-type': 'text/plain',
        // '_AMQ_GROUP_ID': group
    }

    const frame = client.send(sendHeaders)

    frame.write(msg)
    frame.end()

    client.disconnect()
  })
}

module.exports = {
  listenMessage,
  sendMessage
}