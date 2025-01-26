export default defineNuxtPlugin(() => {
    if (process.client) {
        const theme = localStorage.getItem('theme')
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        }
    }
}) 