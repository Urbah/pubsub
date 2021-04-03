const _ = require('lodash') 
const immutable = require ('immutable')
const uuid = require('uuid')
const Subscription = require('./subscription')
const Post = require('../../models/Post')
const { Mongoose } = require('mongoose')
class PubSub {

  constructor (ctx) {
    this.wss = ctx.wss

    this.clients = new immutable.Map()
    this.subscription = new Subscription()
    this.session= null

    this.load = this.load.bind(this)
    this.handleReceivedClientMessage = this.handleReceivedClientMessage.bind(
      this)
    this.handleAddSubscription = this.handleAddSubscription.bind(this)
    this.handleUnsubscribe = this.handleUnsubscribe.bind(this)
    this.handlePublishMessage = this.handlePublishMessage.bind(this)
    this.removeClient = this.removeClient.bind(this)
    this.reciveClientData = this.reciveClientData.bind(this)
    this.load()
  }

  load () {
    const wss = this.wss
    wss.on('connection', (ws) => {
      let id = this.autoId()
      let client = {
        id: id,
        ws: ws,
        userId: null,
        role:'reader',
        subscriptions: [],
      }
      console.log('-----------client-')
      console.log(client)
      if(this.session){
        id=this.session._id
        client['id']=this.session._id
        client['userId']= this.session._id
        client['role']=this.session.role
        client['subscriptions']=this.session.topics.concat(),
        
        console.log('client-------------')
        console.log(client)  
      }
 
      // add new client to the map
      this.addClient(client)

      // listen when receive message from client
      ws.on('message',
        (message) => this.handleReceivedClientMessage(id, message))

      ws.on('close', () => {
        console.log('Client is disconnected')
    // Find user subscriptions and remove
       /* const userSubscriptions = this.subscription.getSubscriptions(
          (sub) => sub.clientId === id)
        userSubscriptions.forEach((sub) => {
          this.subscription.remove(sub.id)
        })*/

        // now let remove client
        this.removeClient(id)
      })
    })
  } 

  /*
   Handle add subscription  
   clientId = subscriber
  */
   reciveClientData(sesionData){
      this.session = sesionData
      //console.log('this.session')
      //console.log(this.session)
      return true;
   }

  handleAddSubscription (topic, clientId) {
    const client = this.getClient(clientId)
    console.log('handleAddSubscriptio cliente ')
    console.log(client)
    if (client) {
      const subscriptionId = this.subscription.add(topic, clientId)
      client.subscriptions.push(subscriptionId)
      this.addClient(client)
    }

  }

  //Handle unsubscribe topic
  handleUnsubscribe (topic, clientId) {

    const client = this.getClient(clientId)

    let clientSubscriptions = _.get(client, 'subscriptions', [])

    const userSubscriptions = this.subscription.getSubscriptions(
      (s) => s.clientId === clientId && s.type === 'ws')

    userSubscriptions.forEach((sub) => {

      clientSubscriptions = clientSubscriptions.filter((id) => id !== sub.id)

      // now let remove subscriptions
      this.subscription.remove(sub.id)

    })

    // let update client subscriptions
    if (client) {
      client.subscriptions = clientSubscriptions
      this.addClient(client)
    }

  }

  /*
    Handle publish a message to a topic
    isBroadcast = false that mean send all, if true, send all not me
  */
  handlePublishMessage (topic, message, from, isBroadcast = false) {
    let subscriptions = isBroadcast
      ? this.subscription.getSubscriptions(
        (sub) => sub.topic === topic && sub.clientId !== from)
      : this.subscription.getSubscriptions(
        (subs) => subs.topic === topic)

    // now let send to all subscribers in the topic with exactly message from publisher
    subscriptions.forEach((subscription) => {
      const clientId = subscription.clientId
      const subscriptionType = subscription.type  // email, phone, ....
      console.log('CLient id of subscription', clientId, subscription)

      // we are only handle send via websocket
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
  //Handle receive client message
  async handleReceivedClientMessage (clientId, message) {
    try{
      console.log('--------------clientId-----------')
      clientId.toString()
      console.log(clientId)
      const client = this.getClient(clientId)
      if (typeof message === 'string') {
        message = this.stringToJson(message)
        const action = _.get(message, 'action', '')
        switch (action) {
  
          case 'me':{
            //Client is asking for his inf
            this.send(clientId,
            {action: 'me', payload: {id: clientId, userId: client.userId}})
            break;}
  
          case 'subscribe':{
            //handle add this subscriber
            const topic = _.get(message, 'payload.topic', null)
            if (topic) {
              this.handleAddSubscription(topic, clientId)
              //const newSubscription = new Subs({topic})
  
  
              //prueba v
              //newSubscription.save();
            }
            break;}
  
          case 'unsubscribe':{
            const unsubscribeTopic = _.get(message, 'payload.topic')
            if (unsubscribeTopic) {
              this.handleUnsubscribe(unsubscribeTopic, clientId)
            }
            break;}
  
          case 'publish':{
            const publishTopic = _.get(message, 'payload.topic', null)
            const publishMessage = _.get(message, 'payload.message')
            if (publishTopic) {
              const from = clientId
              this.handlePublishMessage(publishTopic, publishMessage, from)
              const newPost = new Post({
                title: 'test',
                topic: publishTopic,
                description: 'TEST TEXT',
                author: {
                  username: this.session.username,
                  id: this.session._id,
                }
              })
              await newPost.save()
            }
            break;}
  
          case 'broadcast':{
            const broadcastTopicName = _.get(message, 'payload.topic', null)
            const broadcastMessage = _.get(message, 'payload.message')
            if (broadcastTopicName) {
              this.handlePublishMessage(broadcastTopicName, broadcastMessage,
                clientId, true)
                const newPost = new Post({
                  title: 'test',
                  topic: publishTopic,
                  description: 'TEST TEXT',
                  author: {
                    username: this.session.username,
                    id: this.session._id,
                  }
                })
                await newPost.save()
            }
            break;}
  
          default:{
            break;}
        }
  
      } else {
        // maybe data message we handle later.
      }
    }catch(error){
      console.log(error)
    }

  }
  //Convert string of message to JSON
  stringToJson (message) {
    try {
      message = JSON.parse(message)
    } catch (e) {
      console.log(e)
    }
    return message
  }

  //Add new client connection to the map
  addClient (client) {
    //console.log('---------------client--------------------')
    //console.log(client)
    if (!client.id) {
      client.id = this.autoId()
    }
    this.clients = this.clients.set(client.id, client)
  }

  //Remove a client 
  removeClient (id) {
    this.clients = this.clients.remove(id)
  }

  //Get a client connection
  getClient (id) {
    return this.clients.get(id)
  }

  //Generate an ID
  autoId () {
    return uuid.v1()
  }

  //Send to client message
  send (clientId, message) {
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