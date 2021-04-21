const immutable = require ('immutable')
const uuid = require('uuid')

module.exports = class Subscription {

  constructor () {
    this.subscriptions = new immutable.Map()
  }


  get (id) {
    return this.subscriptions.get(id)
  }

  // Agregar nueva suscripción
  add (topic, clientId, type = 'ws') {

    
    const findSubscriptionWithClientId = this.subscriptions.find(
      (sub) => sub.clientId === clientId && sub.type === type && sub.topic === topic)

    const id = this.autoId()
    const subscription = {
      id: id,
      topic: topic,
      clientId: clientId,
      type: type,
    }

    console.log("nuevo suscriptor", subscription)
    this.subscriptions = this.subscriptions.set(id, subscription)
    return id
  }

 
  remove (id) {
    this.subscriptions = this.subscriptions.remove(id)
  }




  getSubscriptions (predicate = null) {
    return predicate
      ? this.subscriptions.filter(predicate)
      : this.subscriptions
  }

 
  autoId () {
    return uuid.v1()
  }
}
