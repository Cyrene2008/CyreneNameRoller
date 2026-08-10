import { UI_TREE_CONTROL_TYPES, UI_TREE_LAYOUT_TYPES } from './ui-tree-schema.js'

export const UI_TREE_VUE_COMPONENTS = Object.freeze({
  button: 'FluentButton',
  'text-input': 'FluentTextBox',
  'multiline-input': 'FluentTextBox',
  toggle: 'FluentToggle',
  checkbox: 'FluentCheckBox',
  radio: 'FluentRadioButton',
  select: 'FluentSelect',
  slider: 'FluentSlider',
  'number-stepper': 'FluentNumberBox',
  list: 'FluentItemsRepeater',
  badge: 'FluentInfoBadge',
  icon: 'FluentIcon',
  progress: 'FluentProgressBar',
  text: 'FluentTextBlock'
})

export const UI_TREE_AVALONIA_CONTROLS = Object.freeze({
  button: 'Button',
  'text-input': 'TextBox',
  'multiline-input': 'TextBox',
  toggle: 'ToggleSwitch',
  checkbox: 'CheckBox',
  radio: 'RadioButton',
  select: 'ComboBox',
  slider: 'Slider',
  'number-stepper': 'NumericUpDown',
  list: 'ItemsControl',
  badge: 'Border',
  icon: 'SymbolIcon',
  progress: 'ProgressBar',
  text: 'TextBlock'
})

export const UI_TREE_LAYOUT_AVALONIA_CONTROLS = Object.freeze({
  page: 'UserControl',
  section: 'StackPanel',
  card: 'Border',
  group: 'StackPanel',
  row: 'StackPanel',
  column: 'StackPanel',
  form: 'StackPanel'
})

export const UI_TREE_LAYOUT_VUE_COMPONENTS = Object.freeze({
  page: 'div',
  section: 'FluentStackPanel',
  card: 'FluentCard',
  group: 'FluentStackPanel',
  row: 'FluentStackPanel',
  column: 'FluentStackPanel',
  form: 'FluentStackPanel'
})

export function uiTreeControlMapping(kind) {
  if (!UI_TREE_CONTROL_TYPES.includes(kind)) return null
  return {
    kind,
    vue: UI_TREE_VUE_COMPONENTS[kind],
    avalonia: UI_TREE_AVALONIA_CONTROLS[kind]
  }
}

export function uiTreeLayoutMapping(kind) {
  if (!UI_TREE_LAYOUT_TYPES.includes(kind)) return null
  return {
    kind,
    vue: UI_TREE_LAYOUT_VUE_COMPONENTS[kind],
    avalonia: UI_TREE_LAYOUT_AVALONIA_CONTROLS[kind]
  }
}
