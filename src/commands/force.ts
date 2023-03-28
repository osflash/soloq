import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { ICommand } from '~/types/commands'
import { users } from '~/config'
import { lolapi } from '~/services/riotgames'
import { prisma } from '~/services/prisma'
import { Regions } from 'twisted/dist/constants'
import { memberSchema } from '~/zod'
import { errorHandler } from '~/handlers/errors'
import i18next from 'i18next'

export const forceCommand: ICommand = {
  execute: async interaction => {
    try {
      if (!interaction.inGuild()) return

      await interaction.deferReply({ ephemeral: true })

      const username = interaction.options.getString('username', true)
      const memberOption = interaction.options.getMember('member')

      const member = memberSchema.parse(memberOption)

      const { id } = member.user

      const {
        response: { id: summonerId, puuid }
      } = await lolapi.Summoner.getByName(username, Regions.BRAZIL)

      const userExists = await prisma.user.findUnique({ where: { id } })

      if (userExists) {
        const res = await prisma.user.update({
          where: { id },
          data: { puuid, summonerId }
        })

        users.set(id, res)

        await interaction.editReply({
          content: i18next.t('command:force.update')
        })
      } else {
        const res = await prisma.user.create({
          data: { id, puuid, summonerId }
        })

        users.set(id, res)

        await interaction.editReply({
          content: i18next.t('command:force.create')
        })
      }
    } catch (err) {
      const content = errorHandler(err)

      await interaction.reply({ content, ephemeral: true }).catch(console.error)
    }
  },

  data: new SlashCommandBuilder()
    .setName('force')
    .setNameLocalization('pt-BR', 'forçar')
    .setDescription('force verification!')
    .setDescriptionLocalization('pt-BR', 'Força verificação de um membro!')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('username')
        .setNameLocalization('pt-BR', 'apelido')
        .setDescription('Enter your username in League of Legends!')
        .setDescriptionLocalization(
          'pt-BR',
          'Digite seu nome de usuário no League of Legends!'
        )
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('member')
        .setNameLocalization('pt-BR', 'membro')
        .setDescription('Select discord member!')
        .setDescriptionLocalization('pt-BR', 'Selecione o membro do discord!')
        .setRequired(true)
    )
}
