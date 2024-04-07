import * as THREE from 'three'
import { GUI } from "lil-gui"
import { Loader } from './loader/loader'
import { Helper, gui } from './helper'

export class Modeler {
    geometry = new THREE.BoxGeometry(1, 3)
    material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
    })
    cube = new THREE.Mesh(this.geometry, this.material)
    target = new THREE.Group()
    mixer?: THREE.AnimationMixer
    currentAni?: THREE.AnimationAction
    name = "cube"
    fp?: GUI

    textureLoader = new THREE.TextureLoader()
    threeTone = this.textureLoader.load('img/threeTone.jpg')
    constructor(
        private scene: THREE.Scene,
        private loader: Loader,
        private helper: Helper,
    ) {
        this.threeTone.minFilter = THREE.NearestFilter
        this.threeTone.magFilter = THREE.NearestFilter

        this.cube.position.set(-2, 0, 2)
        helper.CreateMeshGui(this.cube, this.name)
        this.scene.add(this.cube)

        this.updateModel(this.target, this.name)
    }
    updateModel(model: THREE.Group, name: string) {
        /*
        model.traverse((c)=>{
            const obj = c as THREE.Mesh
            if (obj.isMesh) {
                const material = obj.material as THREE.MeshStandardMaterial
                obj.material = new THREE.MeshToonMaterial({ map: material.map, gradientMap: this.threeTone })
            }
        })
        */
        this.scene.remove(this.target)
        this.target = model
        this.name = name
        this.mixer = new THREE.AnimationMixer(model)
        this.scene.add(this.target)
        if (this.fp) this.fp.destroy()
        this.fp = this.helper.CreateMeshGui(this.target, this.name)
    }
    updateAni(ani: THREE.AnimationClip) {
        this.currentAni?.fadeOut(0.2)
        const currentAction = this.mixer?.clipAction(ani)
        if (currentAction == undefined) return

        currentAction.setLoop(THREE.LoopRepeat, 10000)
        currentAction.reset().fadeIn(0.2).play()
        this.currentAni = currentAction
    }
    clock = new THREE.Clock()
    render() {
        const delta = this.clock.getDelta()
        if(this.name == "cube") {
            //this.cube.rotation.x += 0.01
            this.cube.rotation.y += 0.01
        }
        this.mixer?.update(delta)
    }
}