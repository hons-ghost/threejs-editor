import * as THREE from "three";
import { GUI } from "lil-gui"
import Stats from "stats.js";
import { Modeler } from "./modeler";

export const gui = new GUI()


export class Helper {
    gui = gui
    debugMode = false
    axesHelper: THREE.AxesHelper = new THREE.AxesHelper(300)
    gridHelper: THREE.GridHelper = new THREE.GridHelper(100, 100)
    stats = new Stats()
    //arrowHelper: THREE.ArrowHelper
    //arrowAttackHelper: THREE.ArrowHelper

    constructor(private scene: THREE.Scene) {
        this.scene.add(this.axesHelper, this.gridHelper)
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
        f.add(v, "x", -100, 100, 0.1).listen().name(name + "X")
        f.add(v, "y", -100, 100, 0.1).listen().name(name + "Y")
        f.add(v, "z", -100, 100, 0.1).listen().name(name + "Z")
    }
    CreateMeshGui(meshs: THREE.Group | THREE.Mesh | THREE.Sprite | THREE.Points, name: string) {
        const fp = this.gui.addFolder(name)
        this.CreateVectorGui(fp, meshs.position, "Pos")
        this.CreateVectorGui(fp, meshs.rotation, "Rot")
        this.CreateVectorGui(fp, meshs.scale, "Scale")
        fp.add(meshs, "visible").listen().name("Visible")
        fp.close()
        return fp
    }
}