module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/user/me',
            handler: 'user.me',
        },
        {
            method: 'PUT',
            path: '/user/me',
            handler: 'user.updateMe',
        },
        {
            method: 'GET',
            path: '/user',
            handler: 'user.findMany',
        },
        {
            method: 'GET',
            path: '/user/:id',
            handler: 'user.findOne',
        },
        {
            method: 'POST',
            path: '/user',
            handler: 'user.create',
        },
        {
            method: 'PUT',
            path: '/user/:id',
            handler: 'user.update',
        },
        {
            method: 'DELETE',
            path: '/user/:id',
            handler: 'user.delete',
        },
    ]
}