import { DiscordAPIError } from 'discord.js'
import i18next from 'i18next'
import { GenericError } from 'twisted/dist/errors/Generic.error'
import { z } from 'zod'

import { errorSchema } from '~/zod'

type IHandlerProps = (err: any) => string

export const errorHandler: IHandlerProps = err => {
  let content = errorSchema.parse(i18next.t('error.unspecific'))

  if (err instanceof z.ZodError) {
    const messages = err.issues.map(issue => {
      if (issue.code === z.ZodIssueCode.custom) {
        const params = issue.params

        return i18next.t(`error.${issue.message}`, { params })
      }

      return i18next.t(`error.${issue.message}`)
    })

    content = errorSchema.parse(messages)
  }

  if (err instanceof DiscordAPIError) {
    content = errorSchema.parse(i18next.t(`error.discord.${err.code}`))
  }

  if (err instanceof GenericError) {
    content = errorSchema.parse(i18next.t(`error.twisted.${err.status}`))
  }

  return content
}
