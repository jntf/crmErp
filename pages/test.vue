<template>
    <hot-table :data="data" :rowHeaders="true" :colHeaders="true" :settings="settings"></hot-table>
</template>

<script setup>
import { ref } from 'vue';
import { defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// register Handsontable's modules
registerAllModules();

const data = ref([
    ['', 'Ford', 'Volvo', 'Toyota', 'Honda'],
    ['2016', 10, 11, 12, 13],
    ['2017', 20, 11, 14, 13],
    ['2018', 30, 15, 12, 13]
])

const settings = ref({
    licenseKey: 'non-commercial-and-evaluation',
})
</script>