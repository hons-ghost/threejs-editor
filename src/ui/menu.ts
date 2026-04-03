import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { ActionRegistry } from '@Glibs/actions/actionregistry'
import IEventController from '@Glibs/interface/ievent'
import { Loader } from '@Glibs/loader/loader'
import { Effector } from '@Glibs/magical/effects/effector'
import { Ani, Char } from '@Glibs/types/assettypes'
import { EffectType } from '@Glibs/types/effecttypes'
import { EventTypes } from '@Glibs/types/globaltypes'
import { ActionContext, IActionComponent } from '@Glibs/types/actiontypes'
import { capture } from './capture'
import { Modeler } from './modeler'
import {
    PreviewActionOption,
    PreviewActionUser,
    buildPreviewActionContext,
    clearExecutedPreviewAction,
    createPreviewActionUser,
    executePreviewAction,
    getPreviewActionOptions,
} from './actionpreview'

export class Menu {
    private readonly actionOptions: PreviewActionOption[]
    private activeAction?: IActionComponent
    private activeActionMode?: PreviewActionOption["mode"]
    private activeActionUser?: PreviewActionUser
    private activeActionContext?: ActionContext

    constructor(
        private loader: Loader,
        private modeler: Modeler,
        private effector: Effector,
        private setNonGlow: Function,
        private eventCtrl: IEventController,
        defaultLoad: boolean = false,
    ) {
        this.actionOptions = getPreviewActionOptions()
        if (defaultLoad) void this.LoadModel(Char.CharHumanMale)
        this.drawCategoryMenu()
        this.drawEffectMenu()
        this.drawActionMenu()
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

    drawActionMenu() {
        const dom = document.getElementById("actionmenu") as HTMLSelectElement
        const btn = document.getElementById("actionApplyBtn") as HTMLButtonElement
        const clearBtn = document.getElementById("actionClearBtn") as HTMLButtonElement
        if (!dom || !btn || !clearBtn) return

        dom.innerHTML = ""
        this.actionOptions.forEach((option) => {
            const opt = document.createElement("option")
            opt.value = option.key
            opt.text = option.supported
                ? `${option.label} [${option.def.trigger}]`
                : `${option.label} [unsupported]`
            dom.appendChild(opt)
        })

        const refresh = () => {
            const option = this.getSelectedActionOption()
            if (!option) {
                this.setActionStatus("select action")
                return
            }
            const supportText = option.supported ? "ready" : `missing builder for ${option.def.type}`
            this.setActionStatus(`${option.def.type} | ${option.mode} | ${option.def.trigger} | ${supportText}`)
        }

        dom.onchange = refresh
        btn.onclick = () => {
            void this.applySelectedAction()
        }
        clearBtn.onclick = () => {
            this.clearPreviewAction()
        }

        refresh()
    }

    drawEmbededAnimation(id: Char, mesh: THREE.Group) {
        const dom = document.getElementById("embededclips") as HTMLSelectElement
        const btn = document.getElementById("embededclipBtn") as HTMLButtonElement
        if (!dom || !btn) return
        while (dom.hasChildNodes() && dom.firstChild) dom.removeChild(dom.firstChild)

        const asset = this.loader.GetAssets(id)
        const ani = ("gltf" in asset) ? (asset.gltf as GLTF).animations : mesh.animations
        ani.forEach((clip) => {
            const opt = document.createElement("option")
            opt.value = clip.name
            opt.text = clip.name
            dom.appendChild(opt)
        })
        const e = () => {
            const k = dom.value
            const selectedClip = ani.find((clip) => clip.name === k)
            if (selectedClip) this.modeler.updateAni(selectedClip)
        }
        dom.onchange = e
        btn.onclick = e
    }

    drawAnimation(id: Char) {
        const dom = document.getElementById("clips") as HTMLSelectElement
        const btn = document.getElementById("clipBtn") as HTMLButtonElement
        const model = this.loader.GetAssets(id)
        if (model == undefined) return
        while (dom.hasChildNodes() && dom.firstChild) dom.removeChild(dom.firstChild)

        const clips = model.Clips
        clips.forEach((v, k) => {
            const modelName = Ani[k]
            const opt = document.createElement("option")
            opt.value = k.toString()
            opt.text = modelName
            dom.appendChild(opt)
        })
        const e = () => {
            const k = Number(dom.value) as Ani
            void this.LoadAnimation(id, k)
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
            ["KayKit Resource", "KayKitResource"],
            ["KayKit Halloween", "KayKitHalloween"],
            ["KayKit Medival Hexagon", "KaykitMedHexagon"],
            ["Ocean Starter", "OceanStarter"],
            ["Ocean Animal", "CharAniOcean"],
            ["Easypack Monster", "CharAniEasypack"],
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
            ["PPs Dungeon", "PPsDungeonPack"],
            ["Space", "Space"],
            ["Items", "Items"],
        ]
        cate.forEach((v) => {
            const opt = document.createElement("option")
            opt.value = v[1]
            opt.text = v[0]
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
        const prevBtn = document.getElementById("preloadBtn") as HTMLButtonElement
        const nextBtn = document.getElementById("nextloadBtn") as HTMLButtonElement
        if (!dom || !btn || !prevBtn || !nextBtn) return

        dom.innerHTML = ""
        const assets = this.loader.fabClasses
        assets.forEach((v, k) => {
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
            void this.LoadModel(k)
        }
        dom.onchange = e
        btn.onclick = e
        prevBtn.onclick = () => {
            const currentIndex = dom.selectedIndex
            dom.selectedIndex = currentIndex === 0 ? dom.options.length - 1 : currentIndex - 1
            dom.dispatchEvent(new Event('change'))
        }
        nextBtn.onclick = () => {
            const currentIndex = dom.selectedIndex
            dom.selectedIndex = currentIndex < dom.options.length - 1 ? currentIndex + 1 : 0
            dom.dispatchEvent(new Event('change'))
        }
    }

    private getSelectedActionOption() {
        const dom = document.getElementById("actionmenu") as HTMLSelectElement
        if (!dom) return
        return this.actionOptions.find((option) => option.key === dom.value)
    }

    private getActionLevel() {
        const dom = document.getElementById("actionLevel") as HTMLInputElement
        const parsed = Number(dom?.value ?? "1")
        if (!Number.isFinite(parsed)) return 1
        return Math.max(1, Math.floor(parsed))
    }

    private setActionStatus(message: string) {
        const dom = document.getElementById("actionStatus")
        if (dom) dom.textContent = message
    }

    private createActionPreviewUser() {
        const source = this.modeler.target
        if (!source) return
        return createPreviewActionUser(source.name || "preview", source, this.modeler.targetEnermy)
    }

    private createActionContext() {
        const source = this.modeler.target
        if (!source) return
        return buildPreviewActionContext(source, this.modeler.targetEnermy, this.getActionLevel())
    }

    private clearPreviewAction() {
        if (!this.activeAction || !this.activeActionMode || !this.activeActionUser || !this.activeActionContext) {
            this.setActionStatus("no active action")
            return
        }

        clearExecutedPreviewAction(
            this.activeAction,
            this.activeActionMode,
            this.activeActionUser,
            this.activeActionContext,
        )

        this.activeAction = undefined
        this.activeActionMode = undefined
        this.activeActionUser = undefined
        this.activeActionContext = undefined
        this.setActionStatus("action cleared")
    }

    private async applySelectedAction() {
        const option = this.getSelectedActionOption()
        if (!option) {
            this.setActionStatus("select action first")
            return
        }
        if (!option.supported || !ActionRegistry.has(option.def.type)) {
            this.setActionStatus(`unsupported action: ${option.def.type}`)
            return
        }

        const user = this.createActionPreviewUser()
        const context = this.createActionContext()
        if (!user || !context) {
            this.setActionStatus("load a model before previewing actions")
            return
        }

        if (option.mode !== "trigger" && this.activeAction) {
            this.clearPreviewAction()
        }

        try {
            const action = ActionRegistry.create(option.def)
            executePreviewAction(action, option.mode, user, option.def, context)

            if (option.mode === "trigger") {
                this.setActionStatus(`triggered ${option.label} at level ${context.level ?? 1}`)
                return
            }

            this.activeAction = action
            this.activeActionMode = option.mode
            this.activeActionUser = user
            this.activeActionContext = context
            this.setActionStatus(`active ${option.label} at level ${context.level ?? 1}`)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.setActionStatus(`failed ${option.label}: ${message}`)
        }
    }

    async LoadModel(id: Char) {
        if (this.activeAction) this.clearPreviewAction()

        const newModel = this.loader.GetAssets(id)
        if (!newModel) throw new Error("error")

        const [mesh] = await newModel.UniqModel(Char[id])
        if (!mesh) return
        this.setNonGlow(mesh)

        this.modeler.updateModel(mesh, Char[id], newModel)
        this.drawAnimation(id)
        this.drawEmbededAnimation(id, mesh)
        await this.LoadAnimation(id, 0)
        await this.drawCapture(id)
        this.setActionStatus(`model loaded: ${Char[id]}`)
    }

    async LoadAnimation(id: Char, aniId: Ani) {
        const model = this.loader.GetAssets(id)
        if (model == undefined) return

        const ani = model.GetAnimationClip(aniId)
        if (ani == undefined) return
        this.modeler.updateAni(ani)
    }

    async drawCapture(id: Char) {
        const newModel = this.loader.GetAssets(id)
        if (!newModel) throw new Error("error")

        const [mesh] = await newModel.UniqModel(Char[id])
        if (!mesh) return

        const html = `
        <div class="row">
            <div class="col p-2 text-center handcursor" id="capture_${id}">
            Capture
            </div>
        </div>`
        const dom = document.getElementById("capture")
        if (dom) dom.innerHTML = html
        const btn = document.getElementById("capture_" + id)
        if (btn) {
            btn.onclick = () => {
                capture(mesh, newModel, Char[id])
            }
        }
    }
}
