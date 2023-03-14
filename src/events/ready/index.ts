import { commands } from '~/config'
import { client } from '~/discord'

client.once('ready', c => {
  console.log(`DISCORD Server running`)

  commands.toJSON().map(command => {
    return c.application.commands.create(command.data, '734623227808317531')
  })
})
