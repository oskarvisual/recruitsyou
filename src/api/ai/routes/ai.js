module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/ai/job-description',
            handler: 'ai.jobDescription',
        },
        {
            method: 'POST',
            path: '/ai/job-requirements',
            handler: 'ai.jobRequirements',
        },
        {
            method: 'POST',
            path: '/ai/job-benefits',
            handler: 'ai.jobBenefits',
        },
        {
            method: 'POST',
            path: '/ai/job-questions',
            handler: 'ai.jobQuestions',
        },
        {
            method: 'POST',
            path: '/ai/email',
            handler: 'ai.email',
        },
    ]
}