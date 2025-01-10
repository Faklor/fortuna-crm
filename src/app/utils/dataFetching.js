export async function fetchCropData() {
    try {
        const [fields, seasons, subFields, works, workers, tech, operations] = await Promise.all([
            fetch('/api/fields').then(res => res.json()),
            fetch('/api/workers').then(res => res.json()),
            fetch('/api/tech').then(res => res.json()),
            fetch('/api/operations').then(res => res.json())
        ]);

        return {
            fields: JSON.stringify(fields),
            seasons: JSON.stringify(seasons),
            subFields: JSON.stringify(subFields),
            works: JSON.stringify(works),
            workers: JSON.stringify(workers),
            tech: JSON.stringify(tech),
            operations: JSON.stringify(operations)
        };
    } catch (error) {
        console.error('Error fetching crop data:', error);
        return {
            fields: '[]',
            seasons: '[]',
            subFields: '[]',
            works: '[]',
            workers: '[]',
            tech: '[]',
            operations: '[]'
        };
    }
} 