import Data from './data.js'

let user = null
$(function() {
  const data = new Data()

  $.ajax({
    url: '/dataUser',
    success: (datas)=>{
      console.log('nueva data')
      console.log(datas)
      user = datas
      data.changeUser(user)
    }
  })

 
  var timer;
  var noticias = [
  {
  "title" : "Atencion noticia regional",
  "topic" : "regional",
  "description" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "nombre_publicador" : "Luis Sandoval"
  },
  {"title" : "Ahora en las noticias Nacionales",
  "topic" : "nacional",
  "description" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "nombre_publicador" : "Maria Urbaneja"},
  
  {"title" : " Las noticias internacional estan de moda",
  "topic" : "internacional",
  "description" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur",
  "nombre_publicador" : "Rodrigo Morales"},
  ]

  var usuario = null;
  var post = {
  "title": "esto es una prueba",
  "topic" : "regional",
  "description": "te amo curruncho",
  "author" : {	
    
  "username": "luisana"
	}
  }
  /*
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

      console.log("aaaaaaaaaaaaaaaaaa")
    }
  }

 showNoticiaPublicador(data){
    $( "#post_noticias_suscrito" ).prepend(  
      ` <div class="row">
                <div class="col-12">
                    <div class="card shadow-sm p-3 mb-5 bg-body rounded">
                        <div class="card-body">
                          <h5 class="card-title pb-1">` + data.title + ` </h5>
                          <h6 class="card-subtitle mb-2 text-muted">` + data.topic + `</h6>
                          <p class="card-text">` + data.description + `</p>
                        </div>
                        <div class="card-footer ">
                          <div>
                              <div class="row ">
                                <div class="col-6">
                                    <h6><i class="bi bi-person p-1"></i>` + data.nombre_publicador + `</h6>
                                </div>
                                <div class="col-4">
                                    <h6><i class="bi bi-clock p-1"></i>1 min</h6> 
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                </div>
             </div>
             ` );
  }

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

      // aqui deberia de haber un get de lo que manda del servidor para suscribrise a los topicos
      console.log('Connected to the server')
      this.send({action: 'me'})

      }
     // listen a message from the server
     ws.onmessage = (message) => {
      const jsonMessage = this.stringToJson(message.data)
      const action = jsonMessage.action
      const payload = jsonMessage.payload

      switch (action) {
        case 'me':
          this._id = payload.id
          //console.log('payload.id '+ payload.id )
          break

        case 'publish':
         // console.log(`subscribe_topic_${payload.topic}`, payload.message)
         this.showNoticiaPublicador(payload.message)
          // let emit this to subscribers
          break
       
        default:
          break
      }
  }
  */

  // aca poner una funcion que agarre todos los post de los que se ha suscrito 
  function sbc(topics){
      topics.forEach(e=>{
        console.log(e)
          data.pubSub.subscribe(e, (message) => {
            console.log(`Got message from topic ${e}`, message)
        })
      })
      cambiarEstadoInicial(topics)
  };
  
  $.ajax({ 
    url: '/data',
    success:(usuario)=>{
      if(usuario && usuario.topics){
        setTimeout(sbc,3000,usuario.topics)
      }
       }
  })
 
 function guardarNoticia(data){
  $.ajax({ 
    url: `/noticia`,
    type : "POST",
    data : data,
    success : console.log("ok") 
  })
 } 

 $("#help").click(function(){
 console.log("tienes que borar esta funcion")

 })

//use pubsub in terminal
window.ps = data.pubSub
   
  //Cambiar estado de las suscripciones cuando empieza la pagina
   function cambiarEstadoInicial(usuario){
    if (usuario){
        usuario.forEach(e=>{
        let b = $('#'+ e).text();
        if (b === "Seguir")
          $('#'+ e).text("Dejar de seguir");
        if (b === "Dejar de seguir")
          $('#'+ e).text("Seguir");
        })
     }
   }


  function ajax(parametro ,topico){
  $.ajax({ 
    url: `/modificar/${usuario._id} `,
    type : "PUT",
    data : {topic: topico , action:parametro},
    success: console.log("ok")
  })
  }

  $(".estado").click(function(){
    var estado = $(this).text();
    const nombre_topico = $(this).val()

    if (estado == "Seguir"){
       pubSub.subscribe(nombre_topico, (msg)=>{
       console.log('se ha subscrito a '+ msg)
     })
     ajax("agregar", nombre_topico)
     $(this).text("Dejar de seguir");
    }
    else{
    console.log("estoy en el else")
    pubSub.unsubscribe(nombre_topico) 
    ajax("borrar",  nombre_topico)
    $(this).text("Seguir");
    }
  });


  $( "#btn_publicador" ).on( "click", function( event ) {

    const $titulo= $('#titulo');
    const $descripcion= $('#descripcion');
    const $tipo= $('#tipo');

    const message = {
      title: $titulo.val(),
      description: $descripcion.val(),
      topic : $tipo.val()
      }
      
    event.preventDefault();
    pubSub.publish($tipo.val(),message)
    guardarNoticia(message)
  });

  function randomNoticiaPublicador(data){
    var noticias = data;    
    var index = Math.floor(Math.random() * 3);
    pubSub.publish(noticias[index].topic, noticias[index])
    guardarNoticia(noticias[index])
    console.log(noticias[index].topic , noticias[index])
    }

    $("#start").click(function(){
     // console.log("entro");
      timer = setInterval(randomNoticiaPublicador,6000,noticias); 
    });

    $("#stop").click(function(){
      clearInterval(timer);
    });
})
