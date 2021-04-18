import Store from './store.js'

let user = null
var timer;
var noticias = [
  {
    "title": "Atencion noticia regional",
    "topic": "regional",
    "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "nombre_publicador": "Luis Sandoval"
  },
  {
    "title": "Ahora en las noticias Nacionales",
    "topic": "nacional",
    "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "nombre_publicador": "Maria Urbaneja"
  },
  {
    "title": " Las noticias internacional estan de moda",
    "topic": "internacional",
    "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur",
    "nombre_publicador": "Rodrigo Morales"
  },
]


$(function () {
  const store = new Store()

 
  
  $.ajax({
    url: '/dataUser',
    success: (datas) => {
      console.log('nueva data')
      console.log(datas)
      user = datas
      store.changeUser(user)
    }
  })
  
  $.ajax({
    url: '/data',
    success: (usuario) => {
      if (usuario && usuario.topics) {
        setTimeout(sbc, 3000, usuario.topics)
      }
    }
  })

  
  function guardarNoticia(data) {
    $.ajax({
      url: `/noticia`,
      type: "POST",
      data: data,
      success: console.log("ok")
    })
  }
  
  function ajax(parametro, topico) {
    $.ajax({
      url: `/modificar/${user._id} `,
      type: "PUT",
      data: { topic: topico, action: parametro },
      success: console.log("ok")
    })
  }

  function sbc(topics) {
    topics.forEach(e => {
      console.log(e)
      store.pubSub.subscribe(e, (message) => {
        console.log(`Got message from topic ${e}`, message)
      })
    })
    cambiarEstadoInicial(topics)
  };

  //Cambiar estado de las suscripciones cuando empieza la pagina
  function cambiarEstadoInicial(usuario) {
    if (usuario) {
      usuario.forEach(e => {
        let b = $('#' + e).text();
        if (b === "Seguir")
          $('#' + e).text("Dejar de seguir");
        if (b === "Dejar de seguir")
          $('#' + e).text("Seguir");
      })
    }
  }

  $("#help").click(function () {
    console.log("tienes que borar esta funcion")
  })
  $(".estado").click(function () {
    var estado = $(this).text();
    const nombre_topico = $(this).val()

    if (estado == "Seguir") {
      store.pubSub.subscribe(nombre_topico, (msg) => {
        console.log('se ha subscrito a ' + msg)
      })
      ajax("agregar", nombre_topico)
      $(this).text("Dejar de seguir");
    }
    else {
      console.log("estoy en el else")
      store.pubSub.unsubscribe(nombre_topico)
      ajax("borrar", nombre_topico)
      $(this).text("Seguir");
    }
  });

  $("#btn_publicador").on("click", function (event) {

    const $titulo = $('#titulo');
    const $descripcion = $('#descripcion');
    const $tipo = $('#tipo');

    const message = {
      title: $titulo.val(),
      description: $descripcion.val(),
      topic: $tipo.val()
    }

    event.preventDefault();
    store.pubSub.publish($tipo.val(), message)
    guardarNoticia(message)
  });

  function randomNoticiaPublicador(data) {
    var noticias = data;
    var index = Math.floor(Math.random() * 3);
    store.pubSub.publish(noticias[index].topic, noticias[index])
    guardarNoticia(noticias[index])
    console.log(noticias[index].topic, noticias[index])
  }

  $("#start").click(function () {
    timer = setInterval(randomNoticiaPublicador, 6000, noticias);
  });

  $("#stop").click(function () {
    clearInterval(timer);
  });
  
  //use pubsub in terminal
  window.ps = store.pubSub
})
