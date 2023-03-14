import { z } from 'zod'
import type { Guild } from '@prisma/client'
import type { VoiceChannel } from 'discord.js'

import { client } from '~/discord'
import { guilds } from '~/config'

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
