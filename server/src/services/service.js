const service = ({ strapi }) => ({
  getBuilds () {
    const config = strapi.config.get('plugin::deploy-github-actions')
    return config.builds
  }
})

export default service
