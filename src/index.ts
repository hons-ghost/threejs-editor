import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Loader } from './loader/loader'
import { Menu } from './menu'
import { Helper } from './helper'
import { Modeler } from './modeler'

export class Editor {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    renderer = new THREE.WebGLRenderer()
    controls: OrbitControls
    
    loader = new Loader()
    helper = new Helper(this.scene)
    modeler = new Modeler(this.scene, this.loader, this.helper)
    menu = new Menu(this.loader, this.modeler)
    constructor() {
        this.camera.position.set(4, 4, 4)
        THREE.ColorManagement.enabled = true
        this.renderer.outputColorSpace = THREE.SRGBColorSpace
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        const abmbient = new THREE.AmbientLight(0xffffff, 0.3)
        const hemispherelight = new THREE.HemisphereLight(0xffffff, 0x333333)
        hemispherelight.position.set(0, 20, 10)
        const directlight = new THREE.DirectionalLight(0xffffff, 2);
        directlight.position.copy(this.camera.position)
        this.scene.add(abmbient, hemispherelight, directlight)

        document.body.appendChild(this.renderer.domElement)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)

        window.addEventListener('resize', this.resize.bind(this), false)
        this.resize()
    }
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.render()
    }
    animate() {
        window.requestAnimationFrame(() => {

            this.controls.update()
            this.render()
            this.animate()
        })
    }
    render() {
        this.helper.CheckStateBegin()
        this.modeler.render()
        this.renderer.render(this.scene, this.camera)
        this.helper.CheckStateEnd()
    }
}

const edit = new Editor()

edit.animate()