import { FastifyInstance } from 'fastify'

import { prisma } from './services/prisma'

export const appRoutes = async (app: FastifyInstance) => {
  app.get('/', async () => {
    return { status: false }
  })

  app.get('/guilds', async () => {
    const guilds = await prisma.guild.findMany()

    return { guilds }
  })
}
