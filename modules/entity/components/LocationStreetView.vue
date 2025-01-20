//components/LocationStreetView.client.vue
<template>
    <div ref="streetViewRef" class="relative aspect-video w-full rounded-lg border overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-muted">
            <span class="text-muted-foreground">Chargement de Street View...</span>
        </div>
        <!-- Error State -->
        <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-muted">
            <span class="text-destructive">{{ error }}</span>
        </div>
    </div>

    <!-- Navigation Buttons -->
    <div v-if="addresses.length > 1" class="flex justify-center gap-2">
        <Button variant="secondary" size="sm" @click="previousAddress">
            <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" @click="nextAddress">
            <ChevronRight class="h-4 w-4" />
        </Button>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const GOOGLE_MAPS_API_KEY = 'AIzaSyBSBxQ2CTpZPwJKZRKIl_KPZSfA85iQM-Q'

const props = defineProps({
    addresses: {
        type: Array,
        required: true,
        default: () => []
    },
    companyName: {
        type: String,
        required: true
    }
})

const streetViewRef = ref(null)
const currentIndex = ref(0)
const loading = ref(true)
const error = ref(null)
const isGoogleMapsLoaded = ref(false)
let panorama = null

const currentAddress = computed(() => props.addresses[currentIndex.value])

const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
        // Vérifie si Google Maps est déjà chargé
        if (window.google && window.google.maps) {
            isGoogleMapsLoaded.value = true
            resolve(window.google)
            return
        }

        // Callback pour Google Maps
        window.initGoogleMaps = () => {
            isGoogleMapsLoaded.value = true
            resolve(window.google)
        }

        // Crée et ajoute le script
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initGoogleMaps`
        script.async = true
        script.defer = true
        script.onerror = () => {
            reject(new Error("Impossible de charger Google Maps"))
        }
        document.head.appendChild(script)
    })
}

const initializeStreetView = async () => {
    if (!currentAddress.value) return

    try {
        loading.value = true
        error.value = null

        if (!isGoogleMapsLoaded.value) {
            await loadGoogleMapsScript()
        }

        const google = window.google
        const geocoder = new google.maps.Geocoder()
        const address = `${props.companyName}, ${currentAddress.value.postal_code} ${currentAddress.value.city}, ${currentAddress.value.country?.name}`
        console.log('address', address)

        const { results } = await new Promise((resolve, reject) => {
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                    resolve({ results })
                } else {
                    reject(new Error('Adresse non trouvée'))
                }
            })
        })

        const location = results[0].geometry.location

        if (!panorama && streetViewRef.value) {
            panorama = new google.maps.StreetViewPanorama(streetViewRef.value, {
                position: location,
                pov: { heading: 34, pitch: 10 },
                zoom: 1
            })
        } else if (panorama) {
            panorama.setPosition(location)
        }

        // Vérifie si Street View est disponible
        const streetViewService = new google.maps.StreetViewService()
        await new Promise((resolve, reject) => {
            streetViewService.getPanorama({ location, radius: 50 }, (data, status) => {
                if (status === 'OK') {
                    resolve(data)
                } else {
                    reject(new Error('Street View non disponible pour cette adresse'))
                }
            })
        })

    } catch (err) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}

const nextAddress = () => {
    currentIndex.value = (currentIndex.value + 1) % props.addresses.length
}

const previousAddress = () => {
    currentIndex.value = (currentIndex.value - 1 + props.addresses.length) % props.addresses.length
}

watch(() => currentIndex.value, initializeStreetView)

onMounted(() => {
    if (props.addresses.length > 0) {
        initializeStreetView()
    }
})
</script>