import { Guild } from '@prisma/client'
import { Client, GatewayIntentBits, VoiceChannel } from 'discord.js'
import { z } from 'zod'

import { commands, cooldowns, guilds } from '~/config'

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildVoiceStates
  ]
})

client.once('ready', c => {
  console.log(`DISCORD Server running`)

  commands.toJSON().map(command => {
    return c.application.commands.create(command.data)
  })
})

client.on('interactionCreate', async interaction => {
  if (!interaction.inGuild()) return

  const userId = interaction.user.id

  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName)

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`)

      return
    }

    try {
      if (command.cooldown) {
        const cooldownUntil = cooldowns.get(
          `${interaction.commandId}:${userId}`
        )

        if (cooldownUntil && cooldownUntil > Date.now()) {
          interaction.reply({
            content: `Por favor, aguarde ${Math.ceil(
              (cooldownUntil - Date.now()) / 1e3
            )} segundos antes de utilizar este comando novamente!`,
            ephemeral: true
          })

          return
        }

        cooldowns.set(
          `${interaction.commandId}:${userId}`,
          new Date().valueOf() + command.cooldown
        )
      }

      command.execute(interaction)
    } catch (error) {
      const guild = guilds.get(interaction.guildId)

      const content = guild
        ? 'Ocorreu um erro ao executar este comando' // add i18next
        : 'There was an error while executing this command'

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true })
      } else {
        await interaction.reply({ content, ephemeral: true })
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName)

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`)

      return
    }

    if (!command.autocomplete) {
      console.error(
        `No autocomplete matching ${interaction.commandName} was found.`
      )

      return
    }

    try {
      command.autocomplete(interaction)
    } catch (error) {
      console.error(error)
    }
  }
})

client.on('voiceStateUpdate', async voice => {
  const voiceStateSchema = z.object({
    channel: z.custom<VoiceChannel>(),
    guild: z.custom<Guild>()
  })

  const { channel, guild } = voiceStateSchema.parse({
    channel: voice.channel,
    guild: guilds.get(voice.guild.id)
  })

  if (channel.parentId === guild.playingRoomId) {
    if (channel.members.size !== 0) return

    await channel.delete()
  }
})
