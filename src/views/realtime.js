export default class PubSubClient {
  constructor(url, options = { connect: true, reconnect: true }, user) {

    // Binding
    this.user = user
    this.changeUser = this.changeUser.bind(this)
    this.reconnect = this.reconnect.bind(this)
    this.connect = this.connect.bind(this)

    this.unsubscribe = this.unsubscribe.bind(this)
    this.subscribe = this.subscribe.bind(this)
    this.publish = this.publish.bind(this)
    this.changeId = this.changeId.bind(this)

    // status of client connection
    this._connected = false
    this._ws = null
    this._id = null

    //All subscriptions
    this._subscriptions = []

    // store settings
    this._isReconnecting = false

    this._url = url
    this._options = options

    if (this._options && this._options.connect) {
      // auto connect
      this.reconnect()
      //this.connect() 
    }
  }

  
  changeUser(data) {
    console.log('se ha ejecutadoo el cambio de user')
    console.log(data)
    return this.user = data
  }
  reconnect() {

    const user = this.user;

    window.setInterval(() => {

      if (!user && !this._connected) {

        console.log("try reconnecting...");

        this.connect();
      }

    }, 3000)
  }

  //Un Subscribe a topic, no longer receive new message of the topic
  unsubscribe(topic) {

    const subscription = this._subscriptions.find((sub) => sub.topic === topic)
    // need to tell to the server side that i dont want to receive message from this topic
    this.send({
      action: 'unsubscribe',
      payload: {
        topic: topic,
      },
    })
  }

  //Subscribir  a un cliente al topico
  subscribe(topic, cb) {
    
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
    })
    
  }

  
  publish(topic, message) {
    this.send({
      action: 'publish',
      payload: {
        topic: topic,
        message: message,
      },
    })
  }

  changeId(id, newId) {
    this.send({
      action: 'changeId',
      payload: {
        id: id,
        newId: newId
      },
    })
    this._id = id
  }

  //Publish a message to the topic and send to everyone, not me
  broadcast(topic, message) {
    this.send({
      action: 'broadcast',
      payload: {
        topic: topic,
        message: message,
      },
    })
  }

  //Return client conneciton ID
  id() {
    return this._id
  }

  //Convert string to JSON
  stringToJson(message) {
    try {
      message = JSON.parse(message)
    }
    catch (e) {
      console.log(e)
    }
    return message
  }

  // Send a message to the server
  send(message) {
    if (this._connected === true && this._ws.readyState === 1) {
      message = JSON.stringify(message)
      this._ws.send(message)
    } else {
    }
  }
  auth() {
    console.log(this.user)
    const user = this.user
    if (user && user._id) {
      console.log('se ha enviado auth')
      console.log('user.id', user._id)
      this.send({
        action: 'auth',
        payload: {
          userId: user._id
        }
      })
    } else {
      console.log('se ha enviado no auth')
      this.send({ action: 'noAuth' })
    }
  }


  showNoticiaPublicador(data) {
    $("#post_noticias_suscrito").prepend(
      ` <div class="row">
                  <div class="col-12">
                      <div class="card shadow-sm p-3 mb-5 bg-body rounded">
                          <div class="card-body">
                            <h5 class="card-title pb-1">` + data.title + ` </h5>
                            <h6 class="card-subtitle mb-2 text-muted">` + data.topic + `</h6>
                            <p class="card-text">` + data.description + `</p>
                          </div>
                          
                        </div>
                  </div>
               </div>
               ` );
  }
  //Implement reconnect
  /*reconnect () {
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
  }*/
  //Begin connect to the server


  connect() {
    const ws = new WebSocket(this._url)
    this._ws = ws

    
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout)
    }

    ws.onopen = () => {
      // change status of connected
      this._connected = true
      this._isReconnecting = false

      this.auth()
      console.log('Connected to the server')
    }

    // Escuchando mensaje del servidor
    ws.onmessage = (message) => {
      let user = this.user
      const jsonMessage = this.stringToJson(message.data)
      const action = jsonMessage.action
      const payload = jsonMessage.payload

      switch (action) {
        case 'noAuth':
          this._id = payload.id
          this.subscribe("generales")
          
          console.log('payload.id ' + payload.id + " ")
          break

        case 'auth':
          this._id = payload.id

          console.log('payload.id ' + payload.id + ", userId " + payload.userId)
          break

        case 'publish':
         // console.log(`subscribe_topic_${payload.topic}`, payload.message)
          this.showNoticiaPublicador(payload.message)
          
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