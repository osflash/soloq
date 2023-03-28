import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { client } from '~/discord'
import { prisma } from '~/services/prisma'
import { env, users } from './config'
import { URLSearchParams } from 'url'
import { lolapi } from './services/riotgames'
import { Regions } from 'twisted/dist/constants'
import {
  APIConnection,
  APIUser,
  ConnectionService,
  RESTPostOAuth2AccessTokenResult,
  Routes
} from 'discord.js'
import { discord } from './services/discord'

export const appRoutes = async (app: FastifyInstance) => {
  app.get('/', async () => {
    return { status: client.isReady(), appUrl: env.discord.appUrl }
  })

  app.get('/discord', async (req, res) => {
    const { appId, redirectUri } = env.discord

    const url = `https://discord.com/api/oauth2/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20connections`

    return res.redirect(url)
  })

  app.get('/auth/discord/callback', async (req, res) => {
    const callbackSchema = z.object({
      code: z.string()
    })

    const { code } = callbackSchema.parse(req.query)

    const { appId, secret, redirectUri } = env.discord

    const params = new URLSearchParams({
      client_id: appId,
      client_secret: secret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Econding': 'application/x-www-form-urlencoded'
    }

    const { data: accessTokenResult } =
      await discord.post<RESTPostOAuth2AccessTokenResult>(
        Routes.oauth2TokenExchange(),
        params,
        { headers }
      )

    const {
      data: { id, username, discriminator }
    } = await discord.get<APIUser>(Routes.user(), {
      headers: {
        Authorization: `Bearer ${accessTokenResult.access_token}`
      }
    })

    const { data: connections } = await discord.get<APIConnection[]>(
      Routes.userConnections(),
      {
        headers: {
          Authorization: `Bearer ${accessTokenResult.access_token}`
        }
      }
    )

    const connection = connections.find(
      connection => connection.type === ConnectionService.LeagueOfLegends
    )

    if (!connection) {
      return res.send(
        `Você ainda não vinculou uma conta League of Legends ao Discord! Por favor, faça a conexão e tente novamente.`
      )
    }

    const {
      response: { id: summonerId, puuid }
    } = await lolapi.Summoner.getByName(connection.name, Regions.BRAZIL)

    const userExists = await prisma.user.findUnique({ where: { id } })

    if (userExists) {
      const res = await prisma.user.update({
        where: { id },
        data: { puuid, summonerId }
      })

      users.set(id, res)
    } else {
      const res = await prisma.user.create({ data: { id, puuid, summonerId } })

      users.set(id, res)
    }

    res.send(
      `${username}#${discriminator} verificou a conta ${connection.name}!`
    )
  })
}
