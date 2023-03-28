import { User } from '@prisma/client'
import { Collection } from 'discord.js'
import { forceCommand } from '~/commands/force'
import { joinCommand } from '../commands/join'
import { verifyCommand } from '../commands/verify'
import { ICommand } from '../types/commands'

export const env = {
  discord: {
    appId: process.env.DISCORD_APP_ID!,
    publicKey: process.env.DISCORD_PUBLIC_KEY!,
    token: process.env.DISCORD_TOKEN!,
    secret: process.env.DISCORD_SECRET!,
    appUrl: process.env.DISCORD_APP_URL!,
    redirectUri: process.env.DISCORD_REDIRECT_URI!,
    parentId: process.env.DISCORD_PARENT_ID!
  },
  riotgames: {
    token: process.env.RIOT_API_KEY!
  },
  port: process.env.PORT ? Number(process.env.PORT) : 3333
}

export const users = new Collection<string, User>()

export const commands = new Collection<string, ICommand>()
export const cooldowns = new Collection<string, number>()

commands.set('join', joinCommand)
commands.set('verify', verifyCommand)
commands.set('force', forceCommand)
