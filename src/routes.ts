import { FastifyInstance } from 'fastify'

import { client } from '~/discord'
import { prisma } from '~/services/prisma'

export const appRoutes = async (app: FastifyInstance) => {
  app.get('/', async () => {
    return { status: client.isReady() }
  })

  app.get('/guilds', async () => {
    const guilds = await prisma.guild.findMany()

    return { guilds }
  })
}
