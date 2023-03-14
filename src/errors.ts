import { Prisma } from '@prisma/client'
import { match, P } from 'ts-pattern'
import { z } from 'zod'

export const onError = (err: unknown) => {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return err.message
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const statusSchema = z.string().transform(status => {
      return match(status)
        .with(P.string, () => 'Algo deu errado!')
        .exhaustive()
    })

    return statusSchema.parse(err.code)
  }

  return 'Algo deu errado'
}
