export default class PubSubClient {
  constructor(url, options = { connect: true, reconnect: true }, user) {

    // Binding
    this.user = user
    this.CambiarUsuario = this.CambiarUsuario.bind(this)
    this.reconnect = this.reconnect.bind(this)
    this.connect = this.connect.bind(this)

    this.unsubscribe = this.desuscribirse.bind(this)
    this.suscribirse = this.subscribe.bind(this)
    this.publish = this.publish.bind(this)
    this.changeId = this.changeId.bind(this)
    this._queue = []

    this._connected = false
    this._ws = null
    this._id = null

    //All subscriptions
    this._subscriptions = []

    this._isReconnecting = false

    this._url = url
    this._options = options

    if (this._options && this._options.connect) {
      // auto connecta
      this.reconnect()
     
    }
  }

  
  CambiarUsuario(data) {
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
          console.log("reconnectando...");
          this.connect();
        }
      }
    }, 1000)
  }


 desuscribirse(topic) {
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
      this.send({
        action: 'subscribe',
        payload: {
          topic: topic,
        },
      })
      
      // let store this into subscriptions for later when use reconnect and we need to run queque to subscribe again
      this._subscriptions.push(
        topic
        
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

 
 
  id() {
    return this._id
  }

  stringToJson(message) {
    try {
      message = JSON.parse(message)
    }
    catch (e) {
      console.log(e)
    }
    return message
  }

  send(message) {
    if (this._connected === true && this._ws.readyState === 1) {
      message = JSON.stringify(message)
      this._ws.send(message)
    } else {
     // console.log('se ha agregado a la cola', message)
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
          this.suscribirse("generales")
          
          console.log('payload.id ' + payload.id + " ")
          break

        case 'auth':
          this._id = payload.id

          console.log('payload.id ' + payload.id + ", userId " + payload.userId)
          break

        case 'publish':
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

}