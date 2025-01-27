import * as THREE from 'three'
import { Modeler } from './modeler';
import { Effector } from '@Glibs/magical/effects/effector';
import { capture } from './capture';
import { Loader } from '@Glibs/loader/loader';
import { Ani, Char } from '@Glibs/types/assettypes';
import { EffectType } from '@Glibs/types/effecttypes';
import { AssetModel } from '@Glibs/loader/assetmodel';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';



export class Menu {

    constructor(
        private loader: Loader, 
        private modeler: Modeler, 
        private effector: Effector,
        private setNonGlow: Function,
        defaultLoad: boolean = false,
    ) {
        if (defaultLoad) this.LoadModel(Char.Male)
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
    drawEmbededAnimation(id: Char, mesh: THREE.Group) {
        const dom = document.getElementById("embededclips") as HTMLSelectElement
        const btn = document.getElementById("embededclipBtn") as HTMLButtonElement
        while (dom.hasChildNodes() && dom.firstChild) dom.removeChild(dom.firstChild)

        console.log(mesh.animations)
        const asset = this.loader.GetAssets(id)
        const ani = ("gltf" in asset)? (asset.gltf as GLTF).animations: mesh.animations
        ani.forEach((clip) => {
            const opt = document.createElement("option")
            opt.value = clip.name
            opt.text = clip.name
            dom.appendChild(opt)
        })
        const e = () => {
            const k = dom.value
            const selectedClip = ani.find((clip) => clip.name == k)
            if (selectedClip) this.modeler.updateAni(selectedClip)
        }
        dom.onchange = e
        btn.onclick = e
    }
    drawAnimation(id: Char) {
        const dom = document.getElementById("clips") as HTMLSelectElement
        const btn = document.getElementById("clipBtn") as HTMLButtonElement
        const model = this.loader.GetAssets(id);
        if (model == undefined) return
        while (dom.hasChildNodes() && dom.firstChild) dom.removeChild(dom.firstChild)

        const clips = model.Clips
        clips.forEach((v, k, map) => {
            const modelName = Ani[k]
            const opt = document.createElement("option")
            opt.value = k.toString()
            opt.text = modelName
            dom.appendChild(opt)
        })
        const e = () => {
            const k = Number(dom.value) as Ani
            this.LoadAnimation(id, k)
        }
        dom.onchange = e
        btn.onclick = e
    }
    drawMenu() {
        const dom = document.getElementById("menu") as HTMLSelectElement
        const btn = document.getElementById("loadBtn") as HTMLButtonElement
        const assets = this.loader.fabClasses;
        let html = ""
        assets.forEach((v, k, map) => {
            const modelName = Char[k]
            const opt = document.createElement("option")
            opt.value = k.toString()
            opt.text = modelName
            dom.appendChild(opt)
        })
        const e = () => {
            const k = Number(dom.value) as Char
            this.LoadModel(k)
        }
        dom.onchange = e
        btn.onclick = e
    }
    async LoadModel(id: Char) {
        const newModel = this.loader.GetAssets(id);
        if (!newModel) throw new Error("error");

        const [mesh, exist] = await newModel?.UniqModel(Char[id])
        if (!mesh) return
        this.setNonGlow(mesh)

        this.modeler.updateModel(mesh, Char[id], newModel)
        this.drawAnimation(id)
        this.drawEmbededAnimation(id, mesh)
        this.LoadAnimation(id, 0)
        this.drawCapture(id)
    }
    async LoadAnimation(id: Char, aniId: Ani) {
        const model = this.loader.GetAssets(id);
        if (model == undefined) return

        const ani = model.GetAnimationClip(aniId)
        if (ani == undefined) return
        this.modeler.updateAni(ani)
    }
    
    async drawCapture(id: Char) {
        const newModel = this.loader.GetAssets(id);
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