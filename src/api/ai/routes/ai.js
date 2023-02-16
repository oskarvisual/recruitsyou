module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/ai',
            handler: 'ai.generate',
        },
    ]
}