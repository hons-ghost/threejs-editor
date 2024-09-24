import * as THREE from 'three'
/*
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'
*/
import {
  EffectComposer, EffectPass, RenderPass,
  BloomEffect, SelectiveBloomEffect, ShaderPass, OutlineEffect, SMAAEffect, BlendFunction, SMAAPreset, EdgeDetectionMode
} from 'postprocessing'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Loader } from './loader/loader'
import { Menu } from './menu'
import { Helper } from './helper'
import { Modeler } from './modeler'
import { Effector } from './effects/effector'
import { IPostPro, Postpro } from './postpro'

export class Editor {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: false,
  })
  
  controls: OrbitControls
  modeler: Modeler
  menu: Menu

  loader = new Loader()
  helper = new Helper(this.scene)
  effector = new Effector(this.scene)
  pp: IPostPro
  constructor() {
    this.camera.position.set(4, 4, 4)
    this.camera.lookAt(new THREE.Vector3().set(0, 2, 0))
    THREE.ColorManagement.enabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    //this.renderer.setClearColor(0x66ccff, 1)

    this.pp = new Postpro(this.scene, this.camera, this.renderer)

    const abmbient = new THREE.AmbientLight(0xffffff, 0.5)
    const hemispherelight = new THREE.HemisphereLight(0xffffff, 0x333333)
    hemispherelight.position.set(0, 20, 10)
    const directlight = new THREE.DirectionalLight(0xffffff, 5);
    directlight.position.set(4, 10, 4)
    directlight.lookAt(new THREE.Vector3().set(0, 2, 0))
    this.scene.add(abmbient, /*hemispherelight,*/ directlight, /*this.effector.meshs*/)

    document.body.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.modeler = new Modeler(this.scene, this.camera, this.loader, this.helper, this.controls)
    this.menu = new Menu(this.loader, this.modeler, this.effector, this.pp)

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
  clock = new THREE.Clock()
  test = new THREE.Vector3()
  render() {
    const delta = this.clock.getDelta()
    this.test.y = Math.sin(delta) * 2
    this.helper.CheckStateBegin()
    this.modeler.render()

    this.pp.render(delta)

    this.effector.Update(delta, this.test)
    this.helper.CheckStateEnd()
  }
}

const edit = new Editor()

edit.animate()
