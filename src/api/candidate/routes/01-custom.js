module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/candidates/import',
            handler: 'candidate.import',
        },
        {
            method: 'POST',
            path: '/candidates/import/csv',
            handler: 'candidate.importCsv',
        },
        {
            method: 'POST',
            path: '/candidates/apply/:job',
            handler: 'candidate.apply',
        },
        {
            method: 'DELETE',
            path: '/candidates/gpdr',
            handler: 'candidate.gpdr',
        },
    ]
}