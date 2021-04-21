const immutable = require ('immutable')
const uuid = require('uuid')

module.exports = class Subscription {

  constructor () {
    this.subscriptions = new immutable.Map()
  }

  //Return subsciption
  get (id) {
    return this.subscriptions.get(id)
  }

  // Add new subscription
  add (topic, clientId, type = 'ws') {

    // need to find subscription with same type = 'ws'
    const findSubscriptionWithClientId = this.subscriptions.find(
      (sub) => sub.clientId === clientId && sub.type === type && sub.topic === topic)

      /*
    if (findSubscriptionWithClientId) {
      // exist and no need add more subscription
      return findSubscriptionWithClientId.id
    }*/

    const id = this.autoId()
    const subscription = {
      id: id,
      topic: topic,
      clientId: clientId,
      type: type, // email, phone
    }

    console.log("nuevo suscriptor", subscription)
    this.subscriptions = this.subscriptions.set(id, subscription)
    return id
  }

  //Remove a subsciption
  remove (id) {
    this.subscriptions = this.subscriptions.remove(id)
  }



  //Get Subscriptions
  getSubscriptions (predicate = null) {
    return predicate
      ? this.subscriptions.filter(predicate)
      : this.subscriptions
  }

  //Generate new ID
  autoId () {
    return uuid.v1()
  }
}
