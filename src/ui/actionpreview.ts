import * as THREE from 'three'
import { CharacterStatus } from '@Glibs/actors/battle/charstatus'
import { ActionRegistry } from '@Glibs/actions/actionregistry'
import { StatSystem } from '@Glibs/inventory/stat/statsystem'
import {
  ActionContext,
  ActionDef,
  ActionId,
  IActionComponent,
  IActionUser,
  TriggerType,
  actionDefs,
} from '@Glibs/types/actiontypes'

export type PreviewActionMode = 'activate' | 'apply' | 'trigger'

export type PreviewActionOption = {
  key: ActionId
  label: string
  def: ActionDef
  mode: PreviewActionMode
  supported: boolean
}

const previewStatus: CharacterStatus = {
  level: 1,
  health: 100,
  mana: 100,
  stamina: 100,
  maxExp: 0,
  exp: 0,
  immortal: true,
  actions: [] as any,
  stats: {},
}

export class PreviewActionUser implements IActionUser {
  readonly baseSpec = {
    stats: new StatSystem({}),
    status: previewStatus,
    ReceiveCalcDamage: (_damage: number) => {},
    ReceiveCalcHeal: (_heal: number) => {},
  }

  readonly targets: THREE.Object3D[]

  constructor(
    public name: string,
    public objs: THREE.Object3D,
    target?: THREE.Object3D,
  ) {
    this.targets = target ? [target] : []
  }

  applyAction(action: IActionComponent, context?: ActionContext) {
    action.apply?.(this, context)
  }

  removeAction(action: IActionComponent, context?: ActionContext) {
    action.remove?.(this)
    action.deactivate?.(this, context)
  }
}

function inferPreviewActionMode(def: ActionDef): PreviewActionMode {
  switch (def.trigger) {
    case TriggerType.OnBuffApply:
    case TriggerType.OnBuffTick:
    case TriggerType.OnBuffRemove:
    case TriggerType.OnEquip:
    case TriggerType.OnUnequip:
      return 'apply'
    case TriggerType.OnCast:
    case TriggerType.OnEnterArea:
    case TriggerType.OnAttackHit:
    case TriggerType.OnAttack:
    case TriggerType.OnUse:
    case TriggerType.OnUnuse:
    case TriggerType.OnFire:
    case TriggerType.OnHit:
    case TriggerType.OnTrigger:
      return 'trigger'
    case TriggerType.OnActivate:
      return def.type.endsWith('StatBoost') || def.type === 'statBoost' ? 'apply' : 'activate'
    default:
      return 'activate'
  }
}

export function getPreviewActionOptions(): PreviewActionOption[] {
  return (Object.entries(actionDefs) as [ActionId, ActionDef][])
    .map(([key, def]) => ({
      key,
      label: key,
      def,
      mode: inferPreviewActionMode(def),
      supported: ActionRegistry.has(def.type),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function createPreviewActionUser(name: string, obj: THREE.Object3D, target?: THREE.Object3D) {
  return new PreviewActionUser(name, obj, target)
}

export function buildPreviewActionContext(
  source: THREE.Object3D,
  target?: THREE.Object3D,
  level: number = 1,
): ActionContext {
  const origin = source.getWorldPosition(new THREE.Vector3())
  const fallbackDirection = source.getWorldDirection(new THREE.Vector3()).normalize()

  if (target) {
    const destination = target.getWorldPosition(new THREE.Vector3())
    const direction = destination.clone().sub(origin)
    if (direction.lengthSq() > 0.000001) {
      direction.normalize()
      return { level, source, destination, direction, via: 'skill' }
    }
  }

  const destination = origin.clone().add(fallbackDirection.clone().multiplyScalar(6))
  return { level, source, destination, direction: fallbackDirection, via: 'skill' }
}

export function executePreviewAction(
  action: IActionComponent,
  mode: PreviewActionMode,
  user: PreviewActionUser,
  def: ActionDef,
  context: ActionContext,
) {
  switch (mode) {
    case 'apply':
      if (action.apply) return action.apply(user, context)
      if (action.activate) return action.activate(user, context)
      break
    case 'activate':
      if (action.activate) return action.activate(user, context)
      if (action.apply) return action.apply(user, context)
      break
    case 'trigger':
      if (action.trigger) return action.trigger(user, def.trigger, context)
      if (action.activate) return action.activate(user, context)
      if (action.apply) return action.apply(user, context)
      break
  }

  throw new Error(`Preview mode '${mode}' is not supported for action '${def.type}'.`)
}

export function clearExecutedPreviewAction(
  action: IActionComponent,
  mode: PreviewActionMode,
  user: PreviewActionUser,
  context: ActionContext,
) {
  if (mode === 'apply') {
    action.remove?.(user)
    action.deactivate?.(user, context)
    return
  }

  if (mode === 'activate') {
    action.deactivate?.(user, context)
    action.remove?.(user)
  }
}
