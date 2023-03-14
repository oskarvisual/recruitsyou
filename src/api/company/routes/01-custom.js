module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/companies/:id/report',
            handler: 'company.report',
        },
        {
            method: 'POST',
            path: '/companies/setup',
            handler: 'company.setup',
        },
    ]
}
