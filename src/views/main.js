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
 /*
  let topicName = 'topic-2'
  pubSub.publish(topicName,
    {title: 'Hello subscribers in the topic abc', body: 'How are you ?'})

  // Broadcast send message to subscribers but not me
  pubSub.broadcast(topicName, {body: 'this is broadcast message'})

  // Make global for console access
  console.log("conectado");
  //Dom elements
  const $btn_subscribe_topic_1= $('#btn-topic-1');
  const $btn_subscribe_topic_2= $('#btn-topic-2');
  
  /* //events
  $btn_subscribe_topic_1.click(e=>{
    console.log('pasa por aca 1')
    let topic=  $btn_subscribe_topic_1.val()
    pubSub.subscribe(topic, (msg)=>{
      console.log('se ha subscrito a '+ msg)
    })
  }) 
  */
 window.dt= data
  window.ps = data.pubSub
  //console.log(data.pubSub)
})
