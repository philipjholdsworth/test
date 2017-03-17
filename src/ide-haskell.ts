'use babel'

import {CompositeDisposable} from 'atom'
import {PluginManager} from './plugin-manager'
import {prettifyFile} from './prettify'
import {MainMenuLabel} from './utils'
import * as UPI from './upi'
import * as UPI3 from './upi-0.3'

let upiProvided = false
let disposables: CompositeDisposable | null
let pluginManager: PluginManager | null
let menu: CompositeDisposable | null
let upi3: UPI3.UPI | null

export const config = require('./config')

function cleanConfig () {}

declare interface IDEHaskellState {
  // TODO
}

declare interface IEventDesc {
  currentTarget: HTMLElement & { getModel(): AtomTypes.TextEditor }
  abortKeyBinding?(): void
}

export function activate (state: IDEHaskellState) {
  cleanConfig()

  atom.views.getView(atom.workspace).classList.add('ide-haskell')

  require('etch').setScheduler(atom.views)

  upiProvided = false

  if (atom.config.get('ide-haskell.startupMessageIdeBackend')) {
    setTimeout(() => {
      if (!upiProvided) {
        atom.notifications.addWarning(`
          Ide-Haskell needs backends that provide most of functionality.
          Please refer to README for details
          `, {dismissable: true})
      }
    }, 5000)
  }

  disposables = new CompositeDisposable()

  pluginManager = new PluginManager(state)

  // global commands
  disposables.add(atom.commands.add('atom-workspace', {
    'ide-haskell:toggle-output': () =>
      pluginManager && pluginManager.togglePanel()
  }))

  disposables.add(
    atom.commands.add('atom-text-editor[data-grammar~="haskell"]', {
      'ide-haskell:prettify-file': ({currentTarget}: IEventDesc) =>
        prettifyFile(currentTarget.getModel()),
      'ide-haskell:close-tooltip': ({currentTarget, abortKeyBinding}: IEventDesc) => {
        let controller = pluginManager && pluginManager.controller(currentTarget.getModel())
        if (!controller) return
        if (controller.hasTooltips && controller.hasTooltips()) {
          controller.hideTooltip()
        } else if (abortKeyBinding) {
          abortKeyBinding()
        }
      },
      'ide-haskell:next-error': () => pluginManager && pluginManager.nextError(),
      'ide-haskell:prev-error': () => pluginManager && pluginManager.prevError()
    }))

  disposables.add(
    atom.commands.add('atom-text-editor[data-grammar~="cabal"]', {
      'ide-haskell:prettify-file': ({currentTarget}: IEventDesc) =>
        prettifyFile(currentTarget.getModel(), 'cabal')
    }))

  atom.keymaps.add('ide-haskell', {
    'atom-text-editor[data-grammar~="haskell"]':
      {'escape': 'ide-haskell:close-tooltip'}
  })

  menu = new CompositeDisposable()
  menu.add(atom.menu.add([{
    label: MainMenuLabel,
    submenu: [
      {label: 'Prettify', command: 'ide-haskell:prettify-file'},
      {label: 'Toggle Panel', command: 'ide-haskell:toggle-output'}
    ]}]))

  upi3 = new UPI3.UPI(pluginManager)
}

export function deactivate () {
  pluginManager && pluginManager.deactivate()
  pluginManager = null
  upi3 && upi3.dispose()
  upi3 = null;

  // TODO: no definition
  (atom.keymaps as any).removeBindingsFromSource('ide-haskell')

  // clear commands
  disposables && disposables.dispose()
  disposables = null

  menu && menu.dispose()
  menu = null
  atom.menu.update()
}

export function serialize () {
  if (pluginManager) return pluginManager.serialize()
}

export function provideUpi () {
  upiProvided = true
  return new UPI.UPI(pluginManager)
}

export function provideUpi3 () {
  upiProvided = true
  return upi3
}

interface LinterRegistry {
  // TODO: steal this from atom-typescript
  register: Function
}

export function consumeLinter (indieRegistry: LinterRegistry) {
  if(!(disposables && pluginManager)) return
  let linter = indieRegistry.register({name: 'IDE-Haskell'})
  disposables.add(linter)
  pluginManager.setLinter(linter)
  return linter
}