import type { Ref } from 'vue'
import type { Updater } from '@tanstack/vue-table'

export const valueUpdater = <T>(
  updaterOrValue: Updater<T> | T,
  ref: Ref<T>,
) => {
  ref.value =
    typeof updaterOrValue === 'function'
      ? (updaterOrValue as Updater<T>)(ref.value)
      : updaterOrValue
}

export const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ')
}
