<template>
    <div>
        <Bar :data="data" :options="options" />
    </div>
</template>

<script setup>
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
)

defineProps({
    data: {
        type: Object,
        required: true
    },
    options: {
        type: Object,
        default: () => ({
            responsive: true,
            maintainAspectRatio: false
        })
    }
})
</script>

<style scoped>
div {
    width: 100%;
    height: 300px;
}
</style>
