import axios from 'axios'

export const discord = axios.create({
  baseURL: 'https://discord.com/api/'
})
