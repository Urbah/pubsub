const _ = require('lodash')
const immutable = require('immutable')
const uuid = require('uuid')
const Subscription = require('./subscription')
const Post = require('../../models/Post')
const { Mongoose } = require('mongoose')
const events = require('events')
const EventEmitter = require('events')
const eventEmiter = new events.EventEmitter(); 

class PubSub {

  constructor(app) {
    this.app = app

    this.clients = new immutable.Map()
    this.subscription = new Subscription()

    this.load = this.load.bind(this)
    this.handleReceivedClientMessage = this.handleReceivedClientMessage.bind(this)
    this.handleAddSubscription = this.handleAddSubscription.bind(this)
    this.handleUnsubscribe = this.handleUnsubscribe.bind(this)
    this.handlePublishMessage = this.handlePublishMessage.bind(this)
    this.removeClient = this.removeClient.bind(this)
    this.load()
  }
  clients() {
    return this.clients
  }

  load() {

    this.app.wss.on('connection', (ws) => {
      let id = this.autoId()
      let client = {
        id: id,
        ws: ws,
        userId: null,
        authenticated: false,
        role: 'reader',
        subscriptions: [],
      }
    
      this.addClient(client)


      ws.on('message',
        (message) => this.handleReceivedClientMessage(client.id, message))

      ws.on('close', () => {
        console.log('Client is disconnected')
       
        const userSubscriptions = this.subscription.getSubscriptions(
          (sub) => sub.clientId === id)
        userSubscriptions.forEach((sub) => {
          this.subscription.remove(sub.id)
        })
        
        this.removeClient(id)
      })


     
    })


  }

  handleAddSubscription(topic, clientId) {
    const client = this.getClient(clientId)
    if (client) {
      const subscriptionId = this.subscription.add(topic, clientId)
      client.subscriptions.push(subscriptionId)
      this.addClient(client)
      console.log("me suscribi")
    }
  }


  handleUnsubscribe(topic, clientId) {

    const client = this.getClient(clientId)
    let clientSubscriptions = _.get(client, 'subscriptions', [])

    const suscripcion = this.subscription.getSubscriptions(
      (s) => s.clientId === clientId && s.type === 'ws' && s.topic===topic)
    console.log("esto es userSubscriptions" , suscripcion)

    suscripcion.forEach((sub) => {
      console.log("esto es sub", sub)
      clientSubscriptions = clientSubscriptions.filter((id) => id !== sub.id)
      console.log("esto es clientSubscriptions", clientSubscriptions)
     
      this.subscription.remove(sub.id)
    })

   
    if (client) {
      client.subscriptions = clientSubscriptions
      this.addClient(client)
    }
  }

 

  handlePublishMessage(topic, message, from, isBroadcast = false) {

    let subscriptions = isBroadcast
       
      ? this.subscription.getSubscriptions(
        (sub) => sub.topic === topic && sub.clientId == from)
       
      : this.subscription.getSubscriptions(
        (subs) => subs.topic === topic)
    console.log("publish PublishMessage", subscription)

    subscriptions.forEach((subscription) => {
      console.log("publish PublishMessage for each", subscription)

      const clientId = subscription.clientId
      const subscriptionType = subscription.type
     
    
      if (subscriptionType === 'ws') {
        this.send(clientId, {
          action: 'publish',
          payload: {
            topic: topic,
            message: message,
          },
        })
      }
    })
  }



  handleReceivedClientMessage(clientId, message) {

    try {
      const client = this.getClient(clientId)
      if (typeof message === 'string') {
        message = this.stringToJson(message)
        const action = _.get(message, 'action', '')
        switch (action) {
          case 'noAuth': {
            this.send(clientId,
              { action: 'noAuth', payload: { id: clientId, userId: client.userId } })
            break;
          }

          case 'auth': {
            const userId = _.get(message, 'payload.userId', null)
            client.userId = userId
            console.log('client.userid', client.userId)

            if (this.app.db) {
              this.app.db.model('User').findById(client.userId, (err, userfind) => {
                if (userfind) {
                  client.authenticated = true
                }
              })
            }
            this.send(clientId,
              { action: 'auth', payload: { id: clientId, userId: client.userId } })
            break;
          }

          case 'subscribe': {
            const topic = _.get(message, 'payload.topic', null)
            if (topic) {
              this.handleAddSubscription(topic, clientId)

            }
            break;
          }

          case 'unsubscribe': {
            const unsubscribeTopic = _.get(message, 'payload.topic')
            if (unsubscribeTopic) {
              this.handleUnsubscribe(unsubscribeTopic, clientId)
            }
            break;
          }

          case 'publish': {
            if (client.authenticated) {
              const publishTopic = _.get(message, 'payload.topic', null)
              const publishMessage = _.get(message, 'payload.message')
              if (publishTopic) {
                const from = clientId
                this.handlePublishMessage(publishTopic, publishMessage, from)
              }
            }
            break;
          }

          default: {
            break;
          }
        }

      }
    } catch (error) {
      console.log(error)
    }
  }

 
  
  stringToJson(message) {
    try {
      message = JSON.parse(message)
    } catch (e) {
      console.log(e)
    }
    return message
  }

  
  addClient(client) {
    if (!client.id) {
      client.id = this.autoId()
    }
    this.clients = this.clients.set(client.id, client)
  }


  removeClient(id) {
    this.clients = this.clients.remove(id)
  }

 
  getClient(id) {
    return this.clients.get(id)
  }

  autoId() {
    return uuid.v1()
  }


  send(clientId, message) {
    const client = this.getClient(clientId)
    if (!client) {
      return
    }
    
    const ws = client.ws
    try {
      message = JSON.stringify(message)
    }
    catch (err) {
      console.log('An error convert object message to string', err)
    }
    ws.send(message)
  }
}
module.exports = PubSub



