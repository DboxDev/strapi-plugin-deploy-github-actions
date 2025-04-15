export default [
  {
    method: 'GET',
    path: '/builds',
    handler: 'controller.index',
    config: {
      policies: []
    }
  },
  {
    method: 'POST',
    path: '/builds',
    handler: 'controller.trigger',
    config: {
      policies: []
    }
  }
]
