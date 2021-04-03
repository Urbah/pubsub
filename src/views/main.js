class PubSubClient {
  constructor (url, options = {connect: true, reconnect: true}) {

    // Binding
    this.reconnect = this.reconnect.bind(this)
    this.connect = this.connect.bind(this)
    //this.runSubscriptionQueue = this.runSubscriptionQueue.bind(this)
    //this.runQueue = this.runQueue.bind(this)

    this.unsubscribe = this.unsubscribe.bind(this)
    this.subscribe = this.subscribe.bind(this)
    this.publish = this.publish.bind(this)

    // status of client connection
    this._connected = false
    this._ws = null
    //this._queue = []
    this._id = null

    // store listeners
   // this._listeners = []

    //All subscriptions
    this._subscriptions = []

    // store settings
    this._isReconnecting = false

    this._url = url
    this._options = options

    if (this._options && this._options.connect) {
      // auto connect
      this.connect()
    }
  }

  //Un Subscribe a topic, no longer receive new message of the topic
  unsubscribe (topic) {

    const subscription = this._subscriptions.find((sub) => sub.topic === topic)
/*
    if (subscription && subscription.listener) {
      // first need to remove local listener
      subscription.listener.remove()
    }
*/
    // need to tell to the server side that i dont want to receive message from this topic
    this.send({
      action: 'unsubscribe',
      payload: {
        topic: topic,
      },
    })
  }

  //Subscribe client to a topic
  subscribe (topic, cb) {
    // add listener to array
/*    const listener = ''
    this._listeners.push(listener)
*/
    // send server with message
    this.send({
      action: 'subscribe',
      payload: {
        topic: topic,
      },
    })

    // let store this into subscriptions for later when use reconnect and we need to run queque to subscribe again
    this._subscriptions.push({
      topic: topic,
      callback: cb ? cb : null,
     /* listener: listener,*/
    })
  }

  //Publish a message to topic, send to everyone and me
  publish (topic, message) {
    this.send({
      action: 'publish',
      payload: {
        topic: topic,
        message: message,
      },
    })
  }

  //Publish a message to the topic and send to everyone, not me
  broadcast (topic, message) {
    this.send({
      action: 'broadcast',
      payload: {
        topic: topic,
        message: message,
      },
    })
  }

  //Return client conneciton ID
  id () {
    return this._id
  }

  //Convert string to JSON
  stringToJson (message) {
    try {
      message = JSON.parse(message)
    }
    catch (e) {
      console.log(e)
    }
    return message
  }

  // Send a message to the server
  send (message) {
    if (this._connected === true && this._ws.readyState === 1) {
      message = JSON.stringify(message)
      this._ws.send(message)
    } else {
      // let keep it in queue
     /* this._queue.push({
        type: 'message',
        payload: message,
      })*/
    }
  }
/*
  //Run Queue after connecting successful
  runQueue () {
    if (this._queue.length) {
      this._queue.forEach((q, index) => {
        switch (q.type) {
          case 'message':
            this.send(q.payload)
            break
          default:
            break
        }
        // remove queue
        delete this._queue[index]
      })
    }
  }

  //Let auto subscribe again

  runSubscriptionQueue () {
    if (this._subscriptions.length) {
      this._subscriptions.forEach((subscription) => {
        this.send({
          action: 'subscribe',
          payload: {
            topic: subscription.topic,
          },
        })

      })
    }
  }
*/
  //Implement reconnect
  reconnect () {
    // if is reconnecting so do nothing
    if (this._isReconnecting || this._connected) {
      return
    }
    // Set timeout
    this._isReconnecting = true
    this._reconnectTimeout = setTimeout(() => {
      console.log('Reconnecting....')
      this.connect()
    }, 2000)
  }
  //Begin connect to the server
  connect () {
    const ws = new WebSocket(this._url)
    this._ws = ws

    // clear timeout of reconnect
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout)
    }

    ws.onopen = () => {
      // change status of connected
      this._connected = true
      this._isReconnecting = false

      console.log('Connected to the server')
      this.send({action: 'me'})
      // run queue
      /*this.runQueue()

      this.runSubscriptionQueue()
*/
    }
    // listen a message from the server
    ws.onmessage = (message) => {

      const jsonMessage = this.stringToJson(message.data)

      const action = jsonMessage.action
      const payload = jsonMessage.payload

      switch (action) {
        case 'me':
          this._id = payload.id
          console.log('payload.id '+ payload.id )
          break

        case 'publish':
          console.log(`subscribe_topic_${payload.topic}`, payload.message)
          // let emit this to subscribers
          break
 
        default:
          break
      }

    }
    ws.onerror = (err) => {
      console.log('unable connect to the server', err)
      this._connected = false
      this._isReconnecting = false
      this.reconnect()

    }
    ws.onclose = () => {
      console.log('Connection is closed')
      this._connected = false
      this._isReconnecting = false
      this.reconnect()
    }
  }
  //Disconnect client
  /*disconnect () {
    if (this._listeners.length) {
      this._listeners.forEach((listener) => {

        listener.remove()
      })
    }
  }*/
}

$(function() {
  const pubSub = new PubSubClient('ws://localhost:3000', {
    connect: true,
    reconnect: true,
  })
/*
  $.ajax({
    url: '/data',
    success: (data)=>{
      console.log('nueva data')
      console.log(data)
    }
  })
*/
/*
  function sbc(){
      let topics= ['topic-1','topic-2','topic-3']
      topics.forEach(e=>{
          pubSub.subscribe(e, (message) => {
            console.log(`Got message from topic ${e}`, message)
        })
      })
  };
  setTimeout(sbc, 3000);
  //publish a message to topic
  */
  let topicName = 'topic-2'
  pubSub.publish(topicName,
    {title: 'Hello subscribers in the topic abc', body: 'How are you ?'})

  // Broadcast send message to subscribers but not me
  pubSub.broadcast(topicName, {body: 'this is broadcast message'})

  // Make global for console access
  window.ps = pubSub
  console.log("conectado");
  //Dom elements
  const $btn_subscribe_topic_1= $('#btn-topic-1');
  const $btn_subscribe_topic_2= $('#btn-topic-2');

  //events
  $btn_subscribe_topic_1.click(e=>{
    console.log('pasa por aca 1')
    let topic=  $btn_subscribe_topic_1.val()
    pubSub.subscribe(topic, (msg)=>{
      console.log('se ha subscrito a '+ msg)
    })
  }) 

})
