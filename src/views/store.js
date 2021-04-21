import PubSubClient from './realtime.js'

export default class Store {
    constructor() {
        this.user = false
        this.pubSub = new PubSubClient('ws://localhost:3000', {
            connect: true,
            reconnect: true,
        }, this.user)
    }
    CambiarUsuario(user) {
        this.user = user
        this.pubSub.CambiarUsuario(this.user)
    }
}