import { Guild, User } from '@prisma/client'
import { Collection } from 'discord.js'
import { configCommand } from '../commands/config'
import { joinCommand } from '../commands/join'
import { verifyCommand } from '../commands/verify'
import { ICommand } from '../types/commands'

export const env = {
  discord: {
    appId: process.env.DISCORD_APP_ID!,
    publicKey: process.env.DISCORD_PUBLIC_KEY!,
    token: process.env.DISCORD_TOKEN!,
    appUrl: process.env.DISCORD_APP_URL!
  },
  port: process.env.PORT ? Number(process.env.PORT) : 3333
}

export const guilds = new Collection<string, Guild>()
export const users = new Collection<string, User>()

export const commands = new Collection<string, ICommand>()
export const cooldowns = new Collection<string, number>()

commands.set('config', configCommand)
commands.set('join', joinCommand)
commands.set('verify', verifyCommand)
