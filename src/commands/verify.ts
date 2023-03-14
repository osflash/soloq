import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  codeBlock,
  Collection,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
  TextChannel
} from 'discord.js'
import { z } from 'zod'
import { guilds, users } from '../config'
import { lolapi } from '../services/riotgames'
import { ICommand } from '../types/commands'
import { Constants } from 'twisted'
import { GenericError } from 'twisted/dist/errors/Generic.error'
import { prisma } from '../services/prisma'
import { match, P } from 'ts-pattern'
import { Prisma } from '@prisma/client'

export const verifyCommand: ICommand = {
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      if (!interaction.inGuild()) return

      await interaction.deferReply({ ephemeral: true })

      const verifySchema = z.object({
        verifiedId: z.string(),
        member: z.custom<GuildMember>(),
        channel: z.custom<TextChannel>(),
        region: z.nativeEnum(Constants.Regions)
      })

      const userSchema = z.object({
        discordId: z.string(),
        id: z.string(),
        accountId: z.string(),
        name: z.string(),
        puuid: z.string(),
        region: z.string()
      })

      let success = false
      const max = 3

      const userId = interaction.user.id
      const username = interaction.options.getString('username', true)
      const regionOption = interaction.options.getString('region')
      const guild = guilds.get(interaction.guildId)

      if (!guild) {
        return interaction.editReply(
          'O bot não está configurado neste servidor. Por favor, contate o administrador para obter mais informações.'
        )
      }

      const { channel, member, verifiedId, region } = verifySchema.parse({
        verifiedId: guild.verifiedId,
        region: regionOption || guild.region,
        channel: interaction.channel,
        member: interaction.member
      })

      const { response } = await lolapi.Summoner.getByName(username, region)

      const icon = randomIcon(response.profileIconId)

      const data = userSchema.parse({
        discordId: userId,
        region,
        ...response
      })

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('verify')
          .setLabel('Verificar')
          .setStyle(ButtonStyle.Success)
      )

      const embed = new EmbedBuilder().setThumbnail(icon.url).addFields([
        {
          name: ':one:',
          value:
            'Com o cliente do League of Legends aberto, clique no ícone do seu perfil localizado no canto superior direito da tela.'
        },
        {
          name: ':two:',
          value:
            'Salve a imagem do ícone exibida à direita como o novo ícone do seu perfil.'
        },
        {
          name: ':three:',
          value:
            'Após salvar o novo ícone do seu perfil, retorne a esta página e clique no botão abaixo para confirmar a mudança.'
        }
      ])

      await interaction.editReply({ embeds: [embed], components: [row] })

      const collector = channel.createMessageComponentCollector({
        filter: i => i.customId === 'verify' && i.user.id === userId,
        time: verifyCommand.cooldown,
        max
      })

      collector.on('collect', async i => {
        const {
          response: { profileIconId }
        } = await lolapi.Summoner.getByName(username, region)

        const count = max - collector.collected.size

        if (profileIconId !== icon.id) {
          if (count <= 0) return

          await i.update({
            content: codeBlock(
              `Ícone inválido, troque-o no cliente do League of Legends!\nTentativas restantes: ${count}`
            )
          })

          return
        }

        const foundUser = await prisma.user.findUnique({
          where: { discordId: userId }
        })

        if (foundUser) {
          const res = await prisma.user.update({
            where: { discordId: userId },
            data
          })

          users.set(userId, res)

          await member.roles.add(verifiedId)

          await i.update({
            content: 'conta atualizada com sucesso!',
            embeds: [],
            components: []
          })
        } else {
          const res = await prisma.user.create({ data })

          users.set(userId, res)

          await member.roles.add(verifiedId)

          await i.update({
            content: 'conta verificada com sucesso!',
            embeds: [],
            components: []
          })
        }

        success = true
      })

      collector.on('dispose', () => console.log('dispose'))
      collector.on('ignore', () => console.log('ignore'))

      collector.on('end', async collected => {
        if (success) return

        const content = match(collected.size)
          .with(3, () => 'Número máximo de tentativas de interação esgotado!')
          .with(
            P.number,
            () => 'O tempo para interação expirou. Por favor, tente novamente.'
          )
          .exhaustive()

        await interaction.editReply({
          content,
          embeds: [],
          components: []
        })
      })
    } catch (err) {
      if (err instanceof GenericError) {
        const statusSchema = z.number().transform(status => {
          return match(status)
            .with(
              403,
              () => 'Você não tem permissão para acessar este recurso!'
            )
            .with(
              404,
              () =>
                'Desculpe, não conseguimos encontrar o usuário solicitado. Verifique se o nome de usuário está correto e tente novamente.'
            )
            .with(
              429,
              () =>
                'Desculpe, excedeu o limite de solicitações. Tente novamente mais tarde.'
            )
            .with(P.number, () => 'Algo deu errado!')
            .exhaustive()
        })

        await interaction.editReply({
          content: statusSchema.parse(err.status),
          embeds: [],
          components: []
        })

        return
      }

      if (err instanceof Prisma.PrismaClientValidationError) {
        //
      }

      if (err instanceof z.ZodError) {
        //
      }

      console.error(err)
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

  cooldown: 1e3 * 60,

  data: new SlashCommandBuilder()
    .setName('verify')
    .setNameLocalization('pt-BR', 'verificar')
    .setDescription('Verify your account!')
    .setDescriptionLocalization('pt-BR', 'Verificar sua conta!')
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
    .addStringOption(option =>
      option
        .setName('region')
        .setDescription('Select region!')
        .setDescriptionLocalization('pt-BR', 'Seleciona a região!')
        .setAutocomplete(true)
    )
}

// icons.set('0', new AttachmentBuilder(`../icons/${0}.png`))
// icons.set('1', new AttachmentBuilder(`../icons/${1}.png`))
// icons.set('2', new AttachmentBuilder(`../icons/${2}.png`))

const randomIcon = (profileIconId: number) => {
  const iconSchema = z.object({
    id: z.number(),
    url: z.string().url()
  })

  const icons = new Collection<string, z.infer<typeof iconSchema>>()

  // https://imgur.com/a/H3iSe4K
  icons.set('0', { id: 0, url: 'https://i.imgur.com/cNSXjJC.png' })
  icons.set('1', { id: 1, url: 'https://i.imgur.com/IyUBaH7.png' })
  icons.set('2', { id: 2, url: 'https://i.imgur.com/GKB4EpZ.png' })

  if (icons.has(profileIconId.toString())) {
    icons.delete(profileIconId.toString())
  }

  return iconSchema.parse(icons.random())
}
