import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Loader } from '@Glibs/loader/loader'
import { Menu } from './ui/menu'
import { Helper } from '@Glibs/helper/helper'
import { Modeler } from './ui/modeler'
import { Effector } from '@Glibs/magical/effects/effector'
import { IPostPro, Postpro } from '@Glibs/systems/postprocess/postpro'
import { ParticleTester } from './test/particletester'
import { EfTester } from './test/eftest'
import { SlashTest } from './test/slashtest'
import { AniVfx } from './test/anitest'
import { NoiseVfx } from './test/noiseslash'
import { DefaultMap2 } from './test/defaultmap2'
import WorldMap from '@Glibs/world/worldmap/worldmap'
import { EventController } from '@Glibs/systems/event/eventctrl'
import { MapType } from '@Glibs/types/worldmaptypes'
import UltimateModular from '@Glibs/world/worldmap/ultimatemodular'
import { TreeTest } from './test/treetest'
import { Char } from '@Glibs/loader/assettypes'
import { Alarm } from '@Glibs/systems/alarm/alarm'
import { Postpro2 } from '@Glibs/systems/postprocess/postpro2'
import DefaultLights from '@Glibs/systems/lights/defaultlights'

export class Editor {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    /*
    powerPreference: "high-performance",
    stencil: false,
    depth: false,
    */
  })

  eventCtrl = new EventController()
  controls: OrbitControls
  modeler: Modeler
  menu: Menu

  helper: Helper
  loader = new Loader("./")
  effector = new Effector(this.scene, this.eventCtrl)
  nebula: ParticleTester
  tester: EfTester
  slashTester: SlashTest
  aniTest: AniVfx
  noiseTest: NoiseVfx
  pp: IPostPro
  worldMap: WorldMap
  modular = new UltimateModular(this.loader, this.scene, this.eventCtrl)
  alarm = new Alarm(this.eventCtrl)

  treetest = new TreeTest(this.loader.GetAssets(Char.QuaterniusNatureBushCommon), this.eventCtrl)
  constructor() {
    this.camera.position.set(4, 4, 4)
    this.camera.lookAt(new THREE.Vector3().set(0, 2, 0))
    // Renderer Start
    THREE.ColorManagement.enabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = .8
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    //this.renderer.setClearColor(0x66ccff, 1)
    this.pp = new Postpro2(this.scene, this.camera, this.renderer, this.eventCtrl)
    // Renderer End

    this.effector.SetNonGlow((mesh: any) => { this.pp.setNonGlow(mesh) })
    const light = new DefaultLights(this.scene)

    document.body.appendChild(this.renderer.domElement)
    const nonglowfn = (mesh: any) => { this.pp.setNonGlow(mesh) }
    // Tester Start
    this.nebula = new ParticleTester(this.scene, nonglowfn)
    this.tester = new EfTester(this.scene, nonglowfn)
    this.slashTester = new SlashTest(this.scene, nonglowfn)
    this.aniTest = new AniVfx(this.scene)
    this.noiseTest = new NoiseVfx(this.scene)
    // Test End
    this.helper = new Helper(this.scene, this.eventCtrl, { enable: true })
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.modeler = new Modeler(this.scene, this.camera, this.loader, this.helper, this.controls, nonglowfn)
    this.menu = new Menu(this.loader, this.modeler, this.effector, nonglowfn, this.eventCtrl)
    this.worldMap = new WorldMap(this.loader, this.scene, this.eventCtrl, light, this.camera, this.renderer)
    this.worldMap.MakeGround({mapType: MapType.RectMesh, width: 50, gridDivision: 25, grid:true})
    //this.worldMap.MakeGround({mapType: MapType.HexMesh, rows: 10, cols: 10, gridSize: 1, grid:true})

    setTimeout(async () => {
      await this.treetest.MassLoad(1, new THREE.Vector3(0, 0, -4))
      this.scene.add(this.treetest.Meshs)
    }, 1000);


    const ground = new DefaultMap2(this.scene, nonglowfn)
    //const ground = new DefaultMap(this.scene, nonglowfn)
    //this.ground()
    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()
  }
  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.pp.resize()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.render()
  }
  animate() {
    window.requestAnimationFrame(() => {
      this.controls.update()
      this.render()
      this.animate()
    })
  }
  
  ground() {
    const texture = new THREE.TextureLoader().load("assets/texture/Cartoon_green_texture_grass.jpg")
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    const normal = new THREE.TextureLoader().load("assets/texture/Cartoon_green_texture_grass.jpg")
    normal.wrapS = THREE.RepeatWrapping
    normal.wrapT = THREE.RepeatWrapping
    normal.minFilter = THREE.LinearFilter
    normal.magFilter = THREE.LinearFilter
    texture.repeat.set(10, 10)
    const planeGeometry = new THREE.PlaneGeometry(32, 32);
    const material = new THREE.MeshStandardMaterial({
      //map: texture,
      //alphaMap: texture,
      //transparent: true,
      color: 0xffcc66,
      //normalMap: normal
    })
    const ground = new THREE.Mesh(planeGeometry, material);
    ground.rotation.x = -Math.PI / 2; // 땅에 평행하게 회전
    ground.position.setY(-.01)
    ground.receiveShadow = true
    this.pp.setNonGlow(ground)
    this.scene.add(ground)
  }
  clock = new THREE.Clock()
  test = new THREE.Vector3()
  render() {
    const delta = this.clock.getDelta()
    this.test.y = Math.sin(delta) * 2
    this.helper.CheckStateBegin()
    this.modeler.render()

    this.pp.render(delta)
    this.nebula.Update(delta)
    this.tester.Update(delta)
    this.slashTester.Update(delta)
    this.noiseTest.Update(delta)

    this.treetest.update(delta)

    this.effector.Update(delta, this.test)
    this.helper.CheckStateEnd()
  }
}

const edit = new Editor()

edit.animate()
