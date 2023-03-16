import { FastifyInstance } from 'fastify'

import { client } from '~/discord'
import { prisma } from '~/services/prisma'
import { env } from './config'

export const appRoutes = async (app: FastifyInstance) => {
  app.get('/', async () => {
    return { status: client.isReady(), appUrl: env.discord.appUrl }
  })

  app.get('/guilds', async () => {
    const guilds = await prisma.guild.findMany()

    return { guilds }
  })
}
