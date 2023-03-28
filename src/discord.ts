import { Client, GatewayIntentBits, REST } from 'discord.js'
import i18next from 'i18next'
import { z } from 'zod'

import { commands, cooldowns, env } from '~/config'
import { errorHandler } from '~/handlers/errors'
import { memberSchema, voiceSchema } from '~/zod'

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildIntegrations
  ]
})

export const rest = new REST({ version: '10' }).setToken(env.discord.token)

client.once('ready', async c => {
  console.log(`DISCORD Server running`)

  commands.toJSON().map(async cmd => {
    await c.application.commands.create(cmd.data)
  })
})

client.on('voiceStateUpdate', async voice => {
  try {
    const channel = voiceSchema.nullable().parse(voice.channel)

    if (
      channel &&
      channel.members.size === 0 &&
      channel.parentId === env.discord.parentId
    ) {
      await channel.delete()
    }
  } catch (err) {
    //
  }
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) {
    return
  }

  try {
    i18next.changeLanguage(interaction.locale)

    const now = Date.now()
    const userId = interaction.user.id
    const cooldownId = `${interaction.commandId}:${userId}`

    const command = commands.get(interaction.commandName)

    if (!command) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: 'not.command',
          path: []
        }
      ])
    }

    if (command.cooldown) {
      const cooldown = cooldowns.get(cooldownId)

      if (cooldown && cooldown > now) {
        const content = i18next.t('error.app.wait', {
          seconds: Math.ceil((cooldown - now) / 1e3),
          name: interaction.commandName
        })

        await interaction.reply({
          content,
          ephemeral: true
        })

        return
      }

      cooldowns.set(cooldownId, now + command.cooldown)
    }

    const { permissions } = command

    if (permissions) {
      const memberBot = await interaction.guild?.members.fetch({
        user: interaction.client.user
      })

      const member = memberSchema.parse(memberBot)
      const missing = member.permissions.missing(permissions)

      if (missing.length) {
        const issues = missing.map(permission => ({
          code: z.ZodIssueCode.custom,
          message: `error.permission.${permission}`,
          path: [],
          params: {
            userId: member.user.id
          }
        }))

        throw new z.ZodError(issues)
      }
    }

    command.execute(interaction)
  } catch (err) {
    const content = errorHandler(err)

    await interaction.reply({ content, ephemeral: true }).catch(console.error)
  }
})
