module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/jobs/:id/report',
        handler: 'job.report',
      }
    ]
}