import { SlashCommandBuilder } from 'discord.js'
import { ICommand } from '../types/commands'

import { Constants } from 'twisted'
import { z } from 'zod'
import { prisma } from '../services/prisma'
import { guilds } from '../config'

export const configCommand: ICommand = {
  execute: async interaction => {
    if (!interaction.inGuild()) return

    const configSchema = z.object({
      playingRoomId: z.string(),
      waitingRoomId: z.string(),
      verifiedId: z.string(),
      region: z.string()
    })

    const id = interaction.guildId

    const { playingRoomId, waitingRoomId, verifiedId, region } =
      configSchema.parse({
        playingRoomId: interaction.options.getChannel('playing', true).id,
        waitingRoomId: interaction.options.getChannel('waiting', true).id,
        verifiedId: interaction.options.getRole('verified', true).id,
        region: interaction.options.getString('region', true)
      })

    const foundGuild = await prisma.guild.findUnique({ where: { id } })

    if (foundGuild) {
      const guild = await prisma.guild.update({
        where: { id },
        data: {
          playingRoomId,
          verifiedId,
          region
        }
      })

      guilds.set(id, guild)

      await interaction.reply({
        content: `atualizado!`,
        ephemeral: true
      })
    } else {
      const guild = await prisma.guild.create({
        data: {
          id,
          playingRoomId,
          waitingRoomId,
          verifiedId,
          region
        }
      })

      guilds.set(id, guild)

      await interaction.reply({
        content: `criado!`,
        ephemeral: true
      })
    }
  },

  autocomplete: async interaction => {
    const { value } = interaction.options.getFocused(true)

    const choices = Object.entries(Constants.Regions).map(region => ({
      name: region[0].replace(/_/g, ' '),
      value: region[1]
    }))

    const filtered = choices.filter(choice => choice.name.startsWith(value))

    await interaction.respond(filtered)
  },

  data: new SlashCommandBuilder()
    .setName('config')
    .setNameLocalization('pt-BR', 'configurar')
    .setDescription('Configure the BOT!')
    .setDescriptionLocalization('pt-BR', 'Configurar o BOT!')
    .setDefaultMemberPermissions('0')
    .addChannelOption(option =>
      option
        .setName('playing')
        .setNameLocalization('pt-BR', 'jogando')
        .setDescription('Select category channel!')
        .setDescriptionLocalization('pt-BR', 'Selecione o canal de categoria!')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('waiting')
        .setNameLocalization('pt-BR', 'esperando')
        .setDescription('Select waiting channel!')
        .setDescriptionLocalization('pt-BR', 'Selecione o canal de espera!')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('verified')
        .setNameLocalization('pt-BR', 'verificado')
        .setDescription('Select verified role!')
        .setDescriptionLocalization('pt-BR', 'Selecione a função verificada!')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('region')
        .setDescription('Select region!')
        .setDescriptionLocalization('pt-BR', 'Seleciona a região!')
        .setAutocomplete(true)
        .setRequired(true)
    )
}
