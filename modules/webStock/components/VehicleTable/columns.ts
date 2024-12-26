// modules/webStock/components/VehicleTable/columns.ts
export const columns = [
    {
        title: 'Source',
        data: 'vehicleData.source',
        type: 'text',
        width: 150
    },
    {
        data: 'vehicleData.id',
        title: 'ID',
        type: 'text',
        width: 50
    },
    {
        data: 'vehicleData.brand',
        title: 'Marque',
        type: 'text',
        align: 'center'
    },
    {
        data: 'vehicleData.model',
        title: 'Modèle',
        type: 'text'
    },
    {
        data: 'vehicleData.version',
        title: 'Version',
        type: 'text'
    },
    {
        data: 'vehicleData.mileage',
        title: 'KM',
        type: 'numeric',
        format: '0,0',
        suffix: ' km',
        className: 'htRight'
    },
    {
        data: 'vehicleData.color',
        title: 'Couleur',
        type: 'text'
    },
    {
        data: 'vehicleData.registration_date',
        title: 'Date MEC',
        type: 'date'
    },
    {
        data: 'vehicleData.base_price',
        title: 'Prix',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight'
    },
    {
        data: 'vehicleData.repair_cost',
        title: 'Frais',
        type: 'numeric',
        format: '0,0',
        suffix: ' €',
        className: 'htRight'
    }
]