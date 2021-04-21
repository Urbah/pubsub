export default class PubSubClient {
  constructor(url, options = { connect: true, reconnect: true }, user) {

    // Binding
    this.user = user
    this._queue = []

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
      if(!this._isReconnecting){

        if (!user && !this._connected) {
          this._isReconnecting = true
          console.log("try reconnecting...");
          this.connect();
        }
      }
    }, 1000)


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
    //revisar mis subscripciones para no mandar nuevamente una subscripcion
    const validarSuscripcion = this._subscriptions.find((sub)=>{
      console.log('sub',sub)
      console.log('topic',topic)
      sub === topic
    })
    if(!validarSuscripcion){
      console.log('validar suscripcion', validarSuscripcion)
      this.send({
        action: 'subscribe',
        payload: {
          topic: topic,
        },
      })
      
      // let store this into subscriptions for later when use reconnect and we need to run queque to subscribe again
      this._subscriptions.push(
        topic
        //callback: cb ? cb : null,
      ) 
    }
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
      console.log('se ha agregado a la cola', message)
      this._queue.push({
        type: 'message',
        payload: message,
      })
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

  runQueue () {
    console.log('paso por runqueue')
    console.log('length queue', this._queue.length)
    console.log('queue', this._queue)
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

  showNoticiaPublicador(data) {
    console.log('---------------------------------',data)
    $("#post_noticias_suscrito").prepend(
      ` <div class="row">
                  <div class="col-12">
                      <div class="card shadow-sm p-3 mb-5 bg-body rounded">
                          <div class="card-body">
                            <h5 class="card-title pb-1">` + data.title + ` </h5>
                            <h6 class="card-subtitle mb-2 text-muted">` + data.topic + `</h6>
                            <p class="card-text">` + data.description + `</p>
                            <p>Fecha de publicación: `+data.created.fecha   +', Fecha de publicación: '+data.created.hora  +`</p>
                          </div>
                        </div>
                  </div>
               </div>
               ` );
  }



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

      this.runSubscriptionQueue()
      this.runQueue()

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