import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import path from 'path'

// import { Locale } from 'discord.js'

export const i18nextInit = () =>
  i18next.use(Backend).init({
    load: 'currentOnly',
    lng: 'en-US',
    fallbackLng: 'en-US',
    preload: ['en-US', 'pt-BR'],
    supportedLngs: ['en-US', 'pt-BR'], // Object.values(Locale)
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
      addPath: path.join(__dirname, '../locales/add/{{lng}}/{{ns}}')
    }
  })
