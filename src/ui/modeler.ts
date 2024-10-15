import * as THREE from 'three'
import { GUI } from "lil-gui"
import { Loader } from '@Loader/loader'
import { Helper, gui } from './helper'
import { IAsset } from '@Loader/assetmodel'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class SizeBox extends THREE.Mesh {
    constructor(box3: THREE.Box3) {
        // make a BoxGeometry of the same size as Box3
        const dimensions = new THREE.Vector3().subVectors(box3.max, box3.min);
        const boxGeo = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);

        // move new mesh center so it's aligned with the original object
        const matrix = new THREE.Matrix4().setPosition(dimensions.addVectors(box3.min, box3.max).multiplyScalar(0.5));
        boxGeo.applyMatrix4(matrix);
        const material = new THREE.MeshBasicMaterial({
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
    fp: GUI[] = []

    textureLoader = new THREE.TextureLoader()
    constructor(
        private scene: THREE.Scene,
        private camera: THREE.PerspectiveCamera,
        private loader: Loader,
        private helper: Helper,
        private controls: OrbitControls, 
        private setNonGlow?: Function
    ) {
        //helper.CreateMeshGui(this.cube, this.name)
        this.setNonGlow?.(this.cube)
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

            this.setNonGlow?.(this.sizeBox)
            this.scene.add(this.sizeBox)
            this.setCamera(model, asset)
        }
        this.target = model
        this.name = name
        this.mixer = new THREE.AnimationMixer(model)
        this.scene.add(this.target)
        this.fp.forEach((g) => g.destroy())
        this.fp.push(this.helper.CreateMeshGui(this.target, this.name))
        if (this.target.children[0]) this.fp.push(this.helper.CreateMeshGui(this.target.children[0], this.name + ".child"))
        if (this.sizeBox) this.fp.push(this.helper.CreateMeshGui(this.sizeBox as THREE.Mesh, "box"))
    }
    updateAni(ani: THREE.AnimationClip) {
        this.currentAni?.fadeOut(0.2)
        const currentAction = this.mixer?.clipAction(ani)
        if (currentAction == undefined) return

        currentAction.setLoop(THREE.LoopRepeat, 10000)
        currentAction.reset().fadeIn(0.2).play()
        this.currentAni = currentAction
    }
    setCamera(model: THREE.Group, asset: IAsset) {
        // 모델 위치와 크기 계산
        const box = asset.GetBox(model)
        const center = box.getCenter(new THREE.Vector3());
        const size = asset.GetSize(model)

        // 2. Calculate the distance the camera needs to be at to fit the entire model in view
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180); // Convert vertical FOV to radians
        const aspect = window.innerWidth / window.innerHeight;

        // Calculate distance for vertical and horizontal FOV
        const distance = maxDim / (2 * Math.tan(fov / 2));
        const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
        const distanceHorizontally = maxDim / (2 * Math.tan(horizontalFov / 2));

        // Choose the larger distance to ensure the model fits in both dimensions
        const cameraZ = Math.max(distance, distanceHorizontally);

        this.camera.position.set(cameraZ + center.x, center.y, cameraZ + center.z);
        this.camera.lookAt(center);

        this.controls.target.copy(center)
        this.controls.update()
    }
    clock = new THREE.Clock()
    render() {
        const delta = this.clock.getDelta()
        this.cube.rotation.y += 0.01
        this.mixer?.update(delta)
    }
}