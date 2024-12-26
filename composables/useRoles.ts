interface UserState {
    roles: string[]
}

export const useRoles = () => {
    const userStore = useState<UserState>('user')

    return {
        hasRole: (role: string) => userStore.value.roles.includes(role),
        hasAnyRole: (roles: string[]) => userStore.value.roles.some(r => roles.includes(r)),
        roles: computed(() => userStore.value.roles)
    }
}