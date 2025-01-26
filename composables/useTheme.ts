export const useTheme = () => {
    const isDark = ref(false)

    const initTheme = () => {
        isDark.value = localStorage.getItem('theme') === 'dark'
        updateThemeClass()
    }

    const updateThemeClass = () => {
        if (isDark.value) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    const toggleTheme = () => {
        isDark.value = !isDark.value
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
        updateThemeClass()
    }

    return {
        isDark,
        toggleTheme,
        initTheme
    }
} 