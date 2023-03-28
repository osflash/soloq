import { GuildMember, VoiceChannel } from 'discord.js'
import { z } from 'zod'

export const voiceSchema = z.custom<VoiceChannel>().transform((value, ctx) => {
  if (value instanceof VoiceChannel) {
    return value
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'not.voice'
  })

  return z.NEVER
})

export const memberSchema = z.custom<GuildMember>().transform((value, ctx) => {
  if (value instanceof GuildMember) {
    return value
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'not.member'
  })

  return z.NEVER
})

export const statusTwistedSchema = z.number().transform(status => {
  return `error.twisted.${status}`
})

export const errorSchema = z
  .string()
  .or(z.string().array())
  .transform(value => {
    let text = `\`❌\` ${value}`

    if (typeof value === 'object') {
      text = value.map(v => `\`❌\` ${v}`).join('\n')
    }

    return text
  })
