module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/billing',
            handler: 'billing.getBilling',
        },
        {
            method: 'PUT',
            path: '/billing',
            handler: 'billing.updateBilling',
        },
        {
            method: 'POST',
            path: '/billing/paymentmethods',
            handler: 'billing.createPaymentMethod'
        },
        {
            method: 'DELETE',
            path: '/billing/paymentmethods/:id',
            handler: 'billing.deletePaymentMethod',
        },
        {
            method: 'GET',
            path: '/billing/paymentmethods',
            handler: 'billing.findPaymentMethod',
        },
        {
            method: 'GET',
            path: '/billing/paymentmethods/:id',
            handler: 'billing.findOnePaymentMethod',
        }
    ]
}
