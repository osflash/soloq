import {
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  VoiceChannel
} from 'discord.js'
import { Regions } from 'twisted/dist/constants'
import { ApiResponseDTO, CurrentGameInfoDTO } from 'twisted/dist/models-dto'
import { z } from 'zod'

import { ICommand } from '~/types/commands'
import { env, users } from '~/config'
import { errorHandler } from '~/handlers/errors'
import { lolapi } from '~/services/riotgames'
import i18next from 'i18next'

export const joinCommand: ICommand = {
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      if (!interaction.inGuild() || !interaction.guild) return

      await interaction.deferReply({ ephemeral: true })

      const userId = interaction.user.id

      const user = users.get(userId)

      if (!user) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            message: 'not.user',
            path: []
          }
        ])
      }

      const activeGameSchema = z.custom<ApiResponseDTO<CurrentGameInfoDTO>>()

      const activeGame = await lolapi.Spectator.activeGame(
        user.summonerId,
        Regions.BRAZIL
      )

      const {
        response: { gameId, participants }
      } = activeGameSchema.parse(activeGame)

      const participant = participants.find(
        ({ summonerId }) => summonerId === user.id
      )

      const name = `${gameId}${participant?.teamId}`

      const joinSchema = z.object({
        member: z.custom<GuildMember>(),
        channel: z.custom<VoiceChannel>().optional()
      })

      const { channel, member } = joinSchema.parse({
        channel: interaction.guild?.channels.cache.find(
          c => c.isVoiceBased() && c.name === name
        ),
        member: interaction.member
      })

      let channelId = channel?.id

      if (!channelId) {
        const newChannel = await interaction.guild.channels.create({
          name,
          type: ChannelType.GuildVoice,
          parent: env.discord.parentId,
          userLimit: 5,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone,
              deny: ['ViewChannel', 'Connect', 'Speak']
            },
            {
              id: userId,
              allow: ['ViewChannel', 'Connect', 'Speak']
            }
          ]
        })

        channelId = newChannel.id
      }

      if (!channel?.permissionOverwrites.cache.has(userId)) {
        await channel?.permissionOverwrites.set([
          {
            id: userId,
            allow: ['ViewChannel', 'Connect', 'Speak']
          }
        ])
      }

      await member.voice.setChannel(channelId)

      await interaction.editReply({
        content: i18next.t('command:join.success')
      })
    } catch (err) {
      const content = errorHandler(err)

      await interaction.editReply({
        content,
        embeds: [],
        components: []
      })
    }
  },

  data: new SlashCommandBuilder()
    .setName('join')
    .setNameLocalization('pt-BR', 'entrar')
    .setDescription(`You will be moved to your team's room!`)
    .setDescriptionLocalization(
      'pt-BR',
      `Você será movido para a sala da sua equipe!`
    )
}
