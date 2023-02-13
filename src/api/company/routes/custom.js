module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/companies/:id/report',
        handler: 'company.report',
      }
    ]
}