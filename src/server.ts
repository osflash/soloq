import 'dotenv/config'

import fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'path'

import { appRoutes } from './routes'
import { env, users } from './config'
import { client } from './discord'
import { prisma } from './services/prisma'

import { i18nextInit } from '~/lib/i18next'

const {
  discord: { token },
  port
} = env

const app = fastify()

app.register(cors)
app.register(appRoutes)

app.register(fastifyStatic, {
  root: path.join(__dirname, 'locales'),
  prefix: '/locales'
})

app
  .listen({
    host: '0.0.0.0',
    port
  })
  .then(async () => {
    try {
      console.log('HTTP Server running')

      await i18nextInit()

      const foundUsers = await prisma.user.findMany()

      foundUsers.map(user => users.set(user.id, user))

      await client.login(token)
    } catch (err) {
      console.error(err)
    }
  })
