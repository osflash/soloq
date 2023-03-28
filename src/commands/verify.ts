import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  hyperlink,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js'
import { env } from '~/config'
import { ICommand } from '../types/commands'
import { errorHandler } from '~/handlers/errors'
import i18next from 'i18next'

export const verifyCommand: ICommand = {
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      if (!interaction.inGuild()) return

      await interaction.deferReply({ ephemeral: true })

      const { appId, redirectUri } = env.discord

      const url = `https://discord.com/api/oauth2/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20connections`

      const link = hyperlink(i18next.t('command:verify.link'), url)

      const embed = new EmbedBuilder()
        .setTitle(i18next.t('command:verify.embeds.0.title'))
        .addFields({
          name: i18next.t('command:verify.embeds.0.fields.0.name'),
          value: `${link} ${i18next.t(
            'command:verify.embeds.0.fields.0.value'
          )}`
        })
        .setTimestamp()

      const embeds = [embed]

      await interaction.editReply({ embeds })
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
    .setName('verify')
    .setNameLocalization('pt-BR', 'verificar')
    .setDescription('Verify your account!')
    .setDescriptionLocalization('pt-BR', 'Verificar sua conta!')
    .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)
}
