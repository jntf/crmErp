import type { Ref } from 'vue'
import type { Updater } from '@tanstack/vue-table'
import { cn as libCn } from '@/lib/utils'

// Réexporter cn depuis lib/utils.ts pour éviter les duplications
export const cn = libCn

export const valueUpdater = <T>(
  updaterOrValue: Updater<T> | T,
  ref: Ref<T>,
) => {
  ref.value =
    typeof updaterOrValue === 'function'
      ? (updaterOrValue as Function)(ref.value)
      : updaterOrValue
}
