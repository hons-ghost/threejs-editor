import * as THREE from "three";
import { GUI } from "lil-gui"
import Stats from "stats.js";

export const gui = new GUI()


export class Helper {
    gui = gui
    debugMode = false
    axesHelper: THREE.AxesHelper = new THREE.AxesHelper(300)
    gridHelper: THREE.GridHelper = new THREE.GridHelper(100, 100)
    stats = new Stats()
    //arrowHelper: THREE.ArrowHelper
    //arrowAttackHelper: THREE.ArrowHelper

    constructor(
        private scene: THREE.Scene,
        private nonglowfn?: Function,
    ) {
        this.nonglowfn?.(this.axesHelper)
        this.nonglowfn?.(this.gridHelper)
        this.gridHelper.visible = false
        this.scene.add(this.axesHelper, this.gridHelper)
        const folder = gui.addFolder("helper")
        folder.add(this.gridHelper, "visible").name("grid")
        folder.add(this.axesHelper, "visible").name("axes")
        folder.close()
        gui.close()
    }
    resize(width: number, height: number): void { }
    update(): void {
    }

    CheckStateBegin() {
    }
    CheckStateEnd() {
        this.stats.update()
    }

    CreateVectorGui(f: GUI, v: THREE.Vector3 | THREE.Euler, name: string) {
        f.add(v, "x", -100, 100, 0.01).listen().name(name + "X")
        f.add(v, "y", -100, 100, 0.01).listen().name(name + "Y")
        f.add(v, "z", -100, 100, 0.01).listen().name(name + "Z")
    }
    CreateMeshGui(meshs: THREE.Group | THREE.Mesh | THREE.Sprite | THREE.Points | THREE.Object3D, name: string) {
        const fp = this.gui.addFolder(name)
        this.CreateVectorGui(fp, meshs.position, "Pos")
        this.CreateVectorGui(fp, meshs.rotation, "Rot")
        this.CreateVectorGui(fp, meshs.scale, "Scale")
        fp.add(meshs, "visible").listen().name("Visible")
        fp.close()
        return fp
    }
}