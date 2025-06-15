import * as THREE from 'three'
import { Modeler } from './modeler';
import { Effector } from '@Glibs/magical/effects/effector';
import { capture } from './capture';
import { Loader } from '@Glibs/loader/loader';
import { Ani, Char } from '@Glibs/types/assettypes';
import { EffectType } from '@Glibs/types/effecttypes';
import { AssetModel } from '@Glibs/loader/assetmodel';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import IEventController from '@Glibs/interface/ievent';
import { EventTypes } from '@Glibs/types/globaltypes';



export class Menu {

    constructor(
        private loader: Loader, 
        private modeler: Modeler, 
        private effector: Effector,
        private setNonGlow: Function,
        private eventCtrl: IEventController,
        defaultLoad: boolean = false,
    ) {
        if (defaultLoad) this.LoadModel(Char.CharHumanMale)
        this.drawCategoryMenu()
        // this.drawCharMenu()
        // this.drawUltiMenu()
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
        if(!dom || !btn) return
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
    drawCategoryMenu() {
        const dom = document.getElementById("cate_menu") as HTMLSelectElement
        const btn = document.getElementById("cate_loadBtn") as HTMLButtonElement
        const cate = [
            ["All", ""],
            ["Character Human", "CharHuman"],
            ["Character Monster", "CharMon"],
            ["Character Animal", "CharAni"],
            ["KayKit Skeleton Item", "KayKitSkeleton"],
            ["KayKit Human Item", "KayKitAdv"],
            ["KayKit Human", "CharHumanKayKit"],
            ["KayKit Dungeon", "KayKitDungeon"],
            ["Ocean Starter", "OceanStarter"],
            ["Ocean Animal", "OceanAniOcean"],
            ["Kenney Human", "CharHumanKenney"],
            ["Ultimate Human", "CharHumanUltimate"],
            ["Ultimate Monster", "CharMonUltimate"],
            ["Ultimate Lv and Machin", "UltimateLvAndMa"],
            ["Ultimate Platform", "UltimateModPlatform"],
            ["Ultimate Nature", "UltimateNature"],
            ["Ultimate PAP", "UltimatePAP"],
            ["Quaternius Animal", "CharAniQuaternius"],
            ["Quaternius Human", "CharHumanQuaternius"],
            ["Quaternius Mon", "CharMonQuaternius"],
            ["Quaternius Nature", "QuaterniusNature"],
            ["Quaternius Card", "QuaterniusCard"],
            ["Quaternius Animated Char", "QuaterniusAniChar"],
            ["Items", "Items"],
        ]
        cate.forEach((v, k, map) => {
            const modelName = v[0]
            const opt = document.createElement("option")
            opt.value = v[1]
            opt.text = modelName
            dom.appendChild(opt)
        })
        const e = () => {
            const k = dom.value
            this.drawMenu(k)
        }
        dom.onchange = e
        btn.onclick = e
    }
    drawMenu(target = "Char") {
        const dom = document.getElementById("menu") as HTMLSelectElement
        const btn = document.getElementById("loadBtn") as HTMLButtonElement
        const prevBtn = document.getElementById("preloadBtn") as HTMLButtonElement;
        const nextBtn = document.getElementById("nextloadBtn") as HTMLButtonElement;
        dom.innerHTML = ""
        const assets = this.loader.fabClasses;
        assets.forEach((v, k, map) => {
            const modelName = Char[k]
            if (target.length > 0 && !modelName.startsWith(target)) return
            const opt = document.createElement("option")
            opt.value = k.toString()
            opt.text = modelName
            dom.appendChild(opt)
        })
        const e = () => {
            const k = Number(dom.value) as Char
            this.eventCtrl.SendEventMessage(EventTypes.AlarmNormal, dom.selectedOptions[0].text)
            this.LoadModel(k)
        }
        dom.onchange = e
        btn.onclick = e
        prevBtn.onclick = () => {
            let currentIndex = dom.selectedIndex;

            // 다음 인덱스가 범위를 초과하지 않도록 체크
            if (currentIndex == 0) {
                dom.selectedIndex = dom.options.length - 1
            } else {
                // 끝에 도달했을 경우 처음으로 돌아가기 (원하지 않으면 이 부분 생략 가능)
                dom.selectedIndex = currentIndex - 1;
            }
            dom.dispatchEvent(new Event('change')); // change 이벤트 수동 발생
        }
        nextBtn.onclick = () => {
            let currentIndex = dom.selectedIndex;

            // 다음 인덱스가 범위를 초과하지 않도록 체크
            if (currentIndex < dom.options.length - 1) {
                dom.selectedIndex = currentIndex + 1;
            } else {
                // 끝에 도달했을 경우 처음으로 돌아가기 (원하지 않으면 이 부분 생략 가능)
                dom.selectedIndex = 0;
            }
            dom.dispatchEvent(new Event('change')); // change 이벤트 수동 발생
        }
    }
    drawCharMenu() {
        const dom = document.getElementById("char") as HTMLSelectElement
        const btn = document.getElementById("charBtn") as HTMLButtonElement
        const assets = this.loader.fabClasses;
        let html = ""
        assets.forEach((v, k, map) => {
            const modelName = Char[k]
            if (!modelName.startsWith("Char")) return

            const opt = document.createElement("option")
            opt.value = k.toString()
            opt.text = modelName.substring("Char".length)
            dom.appendChild(opt)
        })
        const e = () => {
            const k = Number(dom.value) as Char
            this.LoadModel(k)
        }
        dom.onchange = e
        btn.onclick = e
    }
    drawUltiMenu() {
        const dom = document.getElementById("ulti") as HTMLSelectElement
        const btn = document.getElementById("ultiBtn") as HTMLButtonElement
        const assets = this.loader.fabClasses;
        let html = ""
        assets.forEach((v, k, map) => {
            const modelName = Char[k]
            if (!modelName.startsWith("Ultimate")) return

            const opt = document.createElement("option")
            opt.value = k.toString()
            opt.text = modelName.substring("Ultimate".length)
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