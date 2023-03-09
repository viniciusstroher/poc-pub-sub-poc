const stompit = require('stompit')
const os = require("os")
const hostName = os.hostname()
const crypto = require('crypto')

const connectOptions = {
    'host': process.env.MQ_HOST || 'localhost',
    'port': process.env.MQ_PORT || '61613'
}

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
    
    const group = `g-1`
    // da pra mandar so para a file do virtual topic (consumidor)
    // se for pelo topic ele manda para cada consumidor
    // para fazer escalar da pra criar varios consumidor e replicas de pod
    
    const sendHeaders = {
        'destination': '/topic/VirtualTopic.Orders',
        // 'destination': '/queue/Consumer.A.VirtualTopic.Orders',
        'content-type': 'text/plain',
        // '_AMQ_GROUP_ID': group
    }
    
    const frame = client.send(sendHeaders)
    frame.write('hello')
    frame.end()

    client.disconnect()
})