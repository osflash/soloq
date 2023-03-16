import {
  ChannelType,
  ChatInputCommandInteraction,
  DiscordAPIError,
  GuildMember,
  GuildMemberRoleManager,
  SlashCommandBuilder,
  VoiceChannel
} from 'discord.js'
import { Constants } from 'twisted'
import { GenericError } from 'twisted/dist/errors/Generic.error'
import { ApiResponseDTO, CurrentGameInfoDTO } from 'twisted/dist/models-dto'
import { z } from 'zod'
import { guilds, users } from '../config'
import { lolapi } from '../services/riotgames'
import { ICommand } from '../types/commands'

export const joinCommand: ICommand = {
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      if (!interaction.inGuild()) return

      await interaction.deferReply({ ephemeral: true })

      const userId = interaction.user.id
      const { guildId } = interaction

      const guild = guilds.get(guildId)

      if (!guild || !interaction.guild) {
        return interaction.editReply(
          'O bot não está configurado neste servidor. Por favor, contate o administrador para obter mais informações.'
        )
      }

      const roleSchema = z.custom<GuildMemberRoleManager>()

      const roles = roleSchema.parse(interaction.member.roles)

      if (!roles.cache.has(guild.verifiedId)) {
        return interaction.editReply(
          'Para utilizar este comando, é necessário que você verifique sua conta primeiro.'
        )
      }

      const user = users.get(userId)

      if (!user) {
        return interaction.editReply(
          'Seu usuário não foi encontrado. Por favor, verifique sua conta novamente.'
        )
      }

      const regionSchema = z.nativeEnum(Constants.Regions)

      const region = regionSchema.parse(user.region)

      const activeGameSchema = z.custom<ApiResponseDTO<CurrentGameInfoDTO>>()

      const activeGame = await lolapi.Spectator.activeGame(user.id, region)

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
          parent: guild.playingRoomId,
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
        content: 'Você foi movido para a sala da sua equipe!'
      })
    } catch (err) {
      let content = 'Algo deu errado!'

      if (err instanceof DiscordAPIError) {
        if (err.code === 40032) {
          content =
            'Você não está conectado a um canal de voz. Para ser movido para sua sala, é necessário estar em um canal de voz.'
        }
      }

      if (err instanceof GenericError) {
        if (err.status === 404) {
          content = 'Você não está em uma partida.'
        }
      }

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
