import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class Editor {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    renderer = new THREE.WebGL1Renderer()
    controls: OrbitControls
    geometry = new THREE.BoxGeometry()
    material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
    })
    cube = new THREE.Mesh(this.geometry, this.material)
    constructor() {
        this.camera.position.z = 2
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(this.renderer.domElement)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.scene.add(this.cube)

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
            this.cube.rotation.x += 0.01
            this.cube.rotation.y += 0.01

            this.controls.update()
            this.render()
            this.animate()
        })
    }
    render() {
        this.renderer.render(this.scene, this.camera)
    }
}

const edit = new Editor()

edit.animate()