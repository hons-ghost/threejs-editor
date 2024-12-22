import * as THREE from 'three'
import { GUI } from "lil-gui"
import { Loader } from '@Glibs/loader/loader'
import { Helper, gui } from '@Glibs/helper/helper'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { IAsset } from '@Glibs/interface/iasset'

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

    target?: THREE.Group
    targetEnermy?: THREE.Group
    mixer?: THREE.AnimationMixer
    mixerEnermy?: THREE.AnimationMixer
    currentAni?: THREE.AnimationAction
    currentAniEnermy?: THREE.AnimationAction
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
    }
    setDistance(dis: number) {
        if (this.target && this.targetEnermy) {
            this.targetEnermy.position.set(-dis, 0, 0)
            this.setMultiCamera(this.target.position, this.targetEnermy.position)
        }
    }
    updateModel(model: THREE.Group, name: string, asset: IAsset | undefined, added: boolean = false, loc: THREE.Vector3 = new THREE.Vector3()) {
        const t = (added) ? this.targetEnermy : this.target
        if (t) this.scene.remove(t)

        if (this.sizeBox) this.scene.remove(this.sizeBox)
        if (asset) {
            asset.GetBox(model)
            this.sizeBox = asset.BoxMesh//new SizeBox(asset.GetBox(model))
            if (!this.sizeBox) throw new Error("need to create box");

            this.setNonGlow?.(this.sizeBox)
            this.scene.add(this.sizeBox)
            if (!added) this.setCamera(model, asset)
        }
        model.position.copy(loc)
        if (added) {
            this.targetEnermy = model
            this.mixerEnermy = new THREE.AnimationMixer(model)
        } else {
            this.target = model
            this.mixer = new THREE.AnimationMixer(model)
        }
        this.name = name
        this.scene.add(model)
        // For Debuggin GUI
        this.fp.forEach((g) => g.destroy())
        this.fp.push(this.helper.CreateMeshGui(model, this.name))
        if (model.children[0]) this.fp.push(this.helper.CreateMeshGui(model.children[0], this.name + ".child"))
        if (this.sizeBox) this.fp.push(this.helper.CreateMeshGui(this.sizeBox as THREE.Mesh, "box"))
        // 서로 바라보게
        if (this.targetEnermy && this.target) {
            this.target.lookAt(this.targetEnermy.position)
            this.targetEnermy.lookAt(this.target.position)
            this.setMultiCamera(this.target.position, this.targetEnermy.position)
        }
    }
    updateAni(ani: THREE.AnimationClip, added: boolean = false) {
        
        const currentAni = (added) ? this.currentAniEnermy : this.currentAni
        currentAni?.fadeOut(0.2)
        const currentAction = (added) ? this.mixerEnermy?.clipAction(ani) : this.mixer?.clipAction(ani)
        if (currentAction == undefined) return

        currentAction.setLoop(THREE.LoopRepeat, 10000)
        currentAction.reset().fadeIn(0.2).play()
        if (added) {
            this.currentAniEnermy = currentAction
        } else {
            this.currentAni = currentAction
        }
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
    setMultiCamera(p1:THREE.Vector3, p2:THREE.Vector3) {
        const center = new THREE.Vector3()
            .addVectors(p1, p2)
            .multiplyScalar(.5)
        const distance = p1.distanceTo(p2)
        this.camera.up.set(0, 1, 0)
        this.camera.position.copy(center)
        this.camera.position.x += distance * 2
        this.camera.position.z += distance * 2
        this.camera.position.y += distance * 2
        this.camera.lookAt(center)
        this.camera.updateProjectionMatrix()

        this.controls.target.copy(center)
        this.controls.update()
    }
    clock = new THREE.Clock()
    render() {
        const delta = this.clock.getDelta()
        this.cube.rotation.y += 0.01
        this.mixer?.update(delta)
        this.mixerEnermy?.update(delta)
    }
}