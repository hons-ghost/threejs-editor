import * as THREE from 'three'

type MapItem = {
    icon: string
}


export class MapMenu {
    menu = document.createElement("div")
    constructor() {
        const body = document.body
        body.appendChild(this.menu)
    }
}