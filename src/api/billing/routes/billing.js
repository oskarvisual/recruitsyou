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
            method: 'PUT',
            path: '/billing/defaultpaymentmethod',
            handler: 'billing.updateDefaultPaymentMethod',
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
        },
        {
            method: 'POST',
            path: '/billing/subscriptions',
            handler: 'billing.createSubscription'
        },
        {
            method: 'GET',
            path: '/billing/subscriptions',
            handler: 'billing.findSubscription'
        },
        {
            method: 'GET',
            path: '/billing/subscriptions/:id',
            handler: 'billing.findOneSubscription'
        },
        {
            method: 'DELETE',
            path: '/billing/subscriptions/:id',
            handler: 'billing.cancelSubscription'
        },
        {
            method: 'GET',
            path: '/billing/invoices',
            handler: 'billing.findInvoice'
        },
        {
            method: 'GET',
            path: '/billing/invoices/:id',
            handler: 'billing.findOneInvoice'
        },
    ]
}
