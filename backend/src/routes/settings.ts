import express from 'express'

let settings: {
  groq_API_KEY?: string
  groq_MODEL?: string
  jiraUrl?: string
  jirausername?: string
  jiraapiKey?: string
} = {}

export const settingsRouter = express.Router()

settingsRouter.post('/', (req: express.Request, res: express.Response) => {
  settings = {
    groq_API_KEY: req.body.groq_API_KEY,
    groq_MODEL: req.body.groq_MODEL,
    jiraUrl: req.body.jiraUrl,
    jirausername: req.body.jirausername,
    jiraapiKey: req.body.jiraapiKey
  }
  res.json({ success: true })
})

settingsRouter.get('/', (req: express.Request, res: express.Response) => {
  res.json(settings)
})

export function getSettings() {
  return settings
}
