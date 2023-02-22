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
            method: 'POST',
            path: '/candidates/onboarding/:job',
            handler: 'candidate.onboarding',
        }
    ]
}