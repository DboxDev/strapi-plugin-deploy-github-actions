import {
  useNotification,
  useFetchClient
} from '@strapi/strapi/admin'

import {
  Main,
  Typography,
  Card,
  CardBody,
  CardContent,
  CardTitle,
  CardSubtitle,
  Box,
  IconButton,
  Loader
} from '@strapi/design-system'
import { ArrowClockwise, CheckCircleEmpty, CrossCircle /* Loader */ } from '@strapi/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { PLUGIN_ID } from '../pluginId'

const statusMapping = {
  completed: 'success',
  action_required: 'error',
  cancelled: 'error',
  failure: 'error',
  neutral: 'error',
  skipped: 'error',
  stale: 'error',
  success: 'success',
  timed_out: 'error',
  in_progress: 'progress',
  queued: 'progress',
  requested: 'progress',
  waiting: 'progress',
  pending: 'progress',
  unknown: 'unknown'
}

const repeatInterval = async (count, interval, callback) => {
  let result
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => setTimeout(() => resolve(true), interval))
    result = await callback()
  }
  return result
}

const StatusIcon = ({ status }) => {
  const icon = useMemo(() => {
    switch (statusMapping[status]) {
      case 'success':
        return <CheckCircleEmpty fill='success500' width={24} height={24} />
      case 'progress':
        return <Loader small />
      case 'error':
        return <CrossCircle fill='danger600' width={24} height={24} />
      case 'unknown':
      default:
        return <CrossCircle fill='neutral500' width={24} height={24} />
    }
  }, [status])

  return icon
}

const HomePage = () => {
  const { formatDate, formatTime } = useIntl()
  const [builds, setBuilds] = useState([])
  const fetchClient = useFetchClient()
  const { toggleNotification } = useNotification()

  useEffect(() => {
    fetchClient.get(`/${PLUGIN_ID}/builds`)
      .then(({ data }) => setBuilds(data.builds || []))
      .catch(error => {
        console.log('Can\'t fetch builds with error', error)
        setBuilds([])
      })
  }, [setBuilds, fetchClient])

  const triggerBuild = useCallback((build) => {
    fetchClient.post(`/${PLUGIN_ID}/builds`, { build: build.name })
      .then(() => {
        toggleNotification({
          type: 'success',
          message: `Build '${build.name}' is triggered`
        })
      })
      .catch(() => {
        toggleNotification({
          type: 'danger',
          message: `Error occured while triggering the build '${build.name}'`
        })
        return false
      })
      .then(() => console.log('post finished'))
      .then(() => repeatInterval(10, 1000, async () => {
        const { data } = await fetchClient.get(`/${PLUGIN_ID}/builds`)
        setBuilds(data.builds || [])
      }))
  }, [fetchClient])

  return (
    <Main style={{ padding: '40px 56px' }}>
      <Typography $variant='alpha' style={{ marginBottom: '56px', display: 'block' }}>Deploy (Github Actions)</Typography>
      <div style={{ display: 'flex', gap: '32px', rowGap: '32px' }}>
        {builds.map(build => (
          <Card
            style={{
              width: '320px'
            }}
            key={build.name}
            padding={1}
          >
            <CardBody>
              <Box padding={1} background='primary100' display='flex'>
                <StatusIcon status={build.status} />
              </Box>
              <CardContent paddingLeft={2}>
                <CardTitle>{build.name} ({build.status || 'unknown'})</CardTitle>
                <CardSubtitle>Last update: {build.lastUpdate ? `${formatDate(build.lastUpdate)} ${formatTime(build.lastUpdate)}` : 'N/A'}</CardSubtitle>
              </CardContent>
              <IconButton label='Start build' style={{ marginLeft: 'auto' }} onClick={() => triggerBuild(build)}>
                <ArrowClockwise />
              </IconButton>
            </CardBody>
          </Card>
        ))}
      </div>
    </Main>
  )
}

export { HomePage }
