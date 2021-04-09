import PubSubClient from './realtime.js'

export default class data {
    constructor() {
        this.user = false
        this.pubSub = new PubSubClient('ws://localhost:3000', {
            connect: true,
            reconnect: true,
        }, this.user)
    }
    changeUser(user) {
        this.user = user
        this.pubSub.changeUser(this.user)
    }
}