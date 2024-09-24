import * as THREE from 'three'
import { Ani, Char } from './loader/assetmodel';
import { Loader } from './loader/loader'
import { Modeler } from './modeler';
import { EffectType, Effector } from './effects/effector';
import { capture } from './study/capture';
import { IPostPro } from './postpro';



export class Menu {
    dom = document.getElementById("menu")

    constructor(
        private loader: Loader, 
        private modeler: Modeler, 
        private effector: Effector,
        private pp: IPostPro
    ) {
        this.LoadModel(0)
        this.drawMenu()
        this.drawEffectMenu()
    }
    async drawEffectMenu() {
        const dom = document.getElementById("effectmenu") as HTMLSelectElement
        const btn = document.getElementById("replay") as HTMLSelectElement
        if (!dom || !btn) return
        const keys = Object.keys(EffectType).filter((v => isNaN(Number(v))))
        keys.forEach((key, index) => {
            const opt = document.createElement("option")
            opt.value = index.toString()
            opt.text = key
            dom.appendChild(opt)
            this.effector.Enable(index, new THREE.Vector3(0, 2, 0))
        })
        const e = () => {
            const v = dom.value
            this.effector.StartEffector(Number(v), new THREE.Vector3(0, 2, 0))
        }
        dom.onchange = e
        btn.onclick = e
    }
    drawMenu() {
        const assets = this.loader.assets;
        let html = ""
        assets.forEach((v, k, map) => {
            const modelName = Char[k]
            html += `
        <div class="row p-0 m-0">
            <div class="col ps-2 pe-2 text-center handcursor" id="menu_${modelName}">
            ${modelName}
            </div>
        </div>
            `
        })
        const dom = document.getElementById("menu")
        if (dom) dom.innerHTML = html

        assets.forEach((v, k, map) => {
            const modelName = Char[k]
            const dom = document.getElementById("menu_" + modelName)
            if (dom) dom.onclick = () => { this.LoadModel(k) }
        })
    }
    async LoadModel(id: Char) {
        const newModel = this.loader.assets.get(id);
        if (!newModel) throw new Error("error");

        const [mesh, exist] = await newModel?.UniqModel(Char[id])
        if (!mesh) return
        this.pp.setNonGlow(mesh)

        this.modeler.updateModel(mesh, Char[id], newModel)
        this.drawAnimation(id)
        this.LoadAnimation(id, 0)
        this.drawCapture(id)
    }
    async LoadAnimation(id: Char, aniId: Ani) {
        const model = this.loader.assets.get(id);
        if (model == undefined) return

        const ani = model.GetAnimationClip(aniId)
        if (ani == undefined) return
        this.modeler.updateAni(ani)
    }
    drawAnimation(id: Char) {
        const model = this.loader.assets.get(id);
        if (model == undefined) return
        const clips = model.Clips
        let html = ""
        clips.forEach((v, k, map) => {
            const modelName = Ani[k]
            html += `
        <div class="row">
            <div class="col p-2 text-center handcursor" id="clips_${modelName}">
            ${modelName}
            </div>
        </div>
            `
        })
        const dom = document.getElementById("clips")
        if (dom) dom.innerHTML = html
        clips.forEach((v, k, map) => {
            const modelName = Ani[k]
            const dom = document.getElementById("clips_" + modelName)
            if (dom) dom.onclick = () => { this.LoadAnimation(id, k) }
        })
    }
    async drawCapture(id: Char) {
        const newModel = this.loader.assets.get(id);
        if (!newModel) throw new Error("error");

        const [mesh, exist] = await newModel?.UniqModel(Char[id])
        if (!mesh) return

        let html = `
        <div class="row">
            <div class="col p-2 text-center handcursor" id="capture_${id}">
            Capture
            </div>
        </div>`
        const dom = document.getElementById("capture")
        if (dom) dom.innerHTML = html
        const btn = document.getElementById("capture_" + id)
        if(btn) btn.onclick = () => {
            capture(mesh, newModel, Char[id])
        }
    }
}