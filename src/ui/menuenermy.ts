import * as THREE from 'three'
import { Modeler } from './modeler';
import { Ani, Char } from '@Glibs/types/assettypes';
import { Loader } from '@Glibs/loader/loader';

export class MenuEnermy {
    defaultDis = 10
    defaultChar = Char.Female
    constructor(
        private loader: Loader, 
        private modeler: Modeler, 
        private setNonGlow: Function
    ) {
        this.drawMenu()
        this.drawDistance()
        this.LoadModel(this.defaultChar)
    }

    drawMenu() {
        const dom = document.getElementById("menuEnermy") as HTMLSelectElement
        const btn = document.getElementById("loadEnermyBtn") as HTMLButtonElement
        const assets = this.loader.fabClasses;
        let html = ""
        assets.forEach((v, k, map) => {
            const modelName = Char[k]
            const opt = document.createElement("option")
            opt.value = k.toString()
            opt.text = modelName
            if(k == this.defaultChar) opt.selected = true
            dom.appendChild(opt)
        })
        const e = () => {
            const k = Number(dom.value) as Char
            this.LoadModel(k)
        }
        dom.onchange = e
        btn.onclick = e
    }
    drawDistance() {
        const dom = document.getElementById("distance") as HTMLSelectElement
        const btn = document.getElementById("confirmDisBtn") as HTMLButtonElement
        for (let i = 1 ; i < 20; i++) {
            const opt = document.createElement("option")
            opt.value = i.toString()
            opt.text = i.toString()
            if (i == this.defaultDis) opt.selected = true
            dom.appendChild(opt)
        }
        const e = () => {
            const k = Number(dom.value)
            this.DistanceModel(k)
        }
        dom.onchange = e
        btn.onclick = e
    }
    DistanceModel(dis: number){
        this.defaultDis = dis
        this.modeler.setDistance(dis)
    }
    async LoadModel(id: Char) {
        const newModel = this.loader.GetAssets(id);
        if (!newModel) throw new Error("error");

        const [mesh, exist] = await newModel?.UniqModel(Char[id])
        if (!mesh) return
        this.setNonGlow(mesh)

        this.modeler.updateModel(mesh, Char[id], newModel, true, new THREE.Vector3(-this.defaultDis, 0, 0))
        this.LoadAnimation(id, 0)
    }
    async LoadAnimation(id: Char, aniId: Ani) {
        const model = this.loader.GetAssets(id);
        if (model == undefined) return

        const ani = model.GetAnimationClip(aniId)
        if (ani == undefined) return
        this.modeler.updateAni(ani, true)
    }
}