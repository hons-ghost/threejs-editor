import * as THREE from 'three'
import { Ani, Char } from './loader/assetmodel';
import { Loader } from './loader/loader'
import { Modeler } from './modeler';



export class Menu {
    dom = document.getElementById("menu")

    constructor(private loader: Loader, private modeler: Modeler) {
        this.drawMenu()
    }
    drawMenu() {
        const assets = this.loader.assets;
        let html = ""
        assets.forEach((v, k, map) => {
            const modelName = Char[k]
            html += `
        <div class="row">
            <div class="col p-2 text-center handcursor" id="menu_${modelName}">
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

        this.modeler.updateModel(mesh, Char[id])
        this.drawAnimation(id)
        this.LoadAnimation(id, 0)
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
}