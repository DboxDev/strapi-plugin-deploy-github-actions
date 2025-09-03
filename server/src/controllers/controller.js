import axios from 'axios'

const controller = ({ strapi }) => ({
  index (ctx) {
    console.log('SEPARATE INASTANCE with CATCH')
    const builds = strapi
      .plugin('deploy-github-actions')
      .service('service')
      .getBuilds() || []

    const buildsPromises = []

    for (const build of builds) {
      console.log(build)
      buildsPromises.push(
        axios.get(`https://api.github.com/repos/${build.repository}/actions/workflows/${build.workflow}/runs?branch=${build.ref}&per_page=1`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'USER-AGENT': 'STRAPI',
            Authorization: `token ${build.token}`
          }
        })
          .then(result => {
            console.log({ build, data: result.data.workflow_runs })
            if (!result.data.workflow_runs || !result.data.workflow_runs.length) {
              return {
                name: build.name,
                status: 'unknown'
              }
            } else {
              return {
                name: build.name,
                status: result.data.workflow_runs[0].conclusion || result.data.workflow_runs[0].status,
                lastUpdate: result.data.workflow_runs[0].updated_at
              }
            }
          })
          .catch(error => {
            console.error(`Can't get workflow '${build.name}' status: ${error.message}`)
            return {
              name: build.name,
              status: 'unknown'
            }
          })
      )
    }

    return Promise.all(buildsPromises)
      .then(builds => {
        console.log('All replies', builds)
        ctx.send({ builds })
      })
  },
  trigger (ctx) {
    console.log('going to trigger build', ctx.request.body)
    const builds = strapi
      .plugin('deploy-github-actions')
      .service('service')
      .getBuilds()

    const build = builds[0]
    return axios.post(`https://api.github.com/repos/${build.repository}/actions/workflows/${build.workflow}/dispatches`, { ref: build.ref }, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'USER-AGENT': 'STRAPI',
        Authorization: `token ${build.token}`
      }
    })
      .then(() => ctx.send({ success: true }))
      .catch(error => {
        console.error('Trigger request Error: ', error)
        ctx.status = 500
        ctx.body = {
          message: error.message
        }
      })
  }
})

export default controller
