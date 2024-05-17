import * as THREE from 'three'
import { GUI } from "lil-gui"
import { Loader } from './loader/loader'
import { Helper, gui } from './helper'
import { IAsset } from './loader/assetmodel'

export class SizeBox extends THREE.Mesh {
    constructor(box3: THREE.Box3) {
        // make a BoxGeometry of the same size as Box3
        const dimensions = new THREE.Vector3().subVectors(box3.max, box3.min);
        const boxGeo = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);

        // move new mesh center so it's aligned with the original object
        const matrix = new THREE.Matrix4().setPosition(dimensions.addVectors(box3.min, box3.max).multiplyScalar(0.5));
        boxGeo.applyMatrix4(matrix);
        const material = new THREE.MeshBasicMaterial({
            //color: 0xD9AB61,
            //transparent: true,
            //opacity: 0,
            //color: 0xff0000,
            //depthWrite: false,
            color: 0xffffff,
            wireframe: true
        })
        super(boxGeo, material)
    }
}
export class DefaultBox extends THREE.Mesh {
    constructor() {
        const geometry = new THREE.BoxGeometry(1, 4)
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true
        })
        super(geometry, material)
        const bbox = new THREE.Box3().setFromObject(this)
        const size = bbox.getSize(new THREE.Vector3)
        this.position.set(-2, size.y / 2, 2)
    }
}

export class Modeler {
    cube = new DefaultBox()
    sizeBox?: SizeBox

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

        helper.CreateMeshGui(this.cube, this.name)
        this.scene.add(this.cube)

        this.updateModel(this.target, this.name, undefined)
    }
    updateModel(model: THREE.Group, name: string, asset: IAsset | undefined) {
        this.scene.remove(this.target)
        if (this.sizeBox) this.scene.remove(this.sizeBox)
        if (asset) {
            /*
               const size = asset.GetSize(model)
               this.sizeBox.scale.copy(size)
               this.sizeBox.position.copy(model.position)
               */
            asset.GetBox(model)
            this.sizeBox = asset.BoxMesh//new SizeBox(asset.GetBox(model))
            if (!this.sizeBox) throw new Error("need to create box");

            this.scene.add(this.sizeBox)
        }
        this.target = model
        this.name = name
        this.mixer = new THREE.AnimationMixer(model)
        this.scene.add(this.target)
        if (this.fp) this.fp.destroy()
        this.fp = this.helper.CreateMeshGui(this.target, this.name)
        if (this.target.children[0]) this.fp = this.helper.CreateMeshGui(this.target.children[0], this.name + ".child")
        if (this.sizeBox) this.fp = this.helper.CreateMeshGui(this.sizeBox as THREE.Mesh, "box")
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
        //this.cube.rotation.x += 0.01
        this.cube.rotation.y += 0.01
        this.mixer?.update(delta)
    }
}