import express from 'express';
import fetch from 'node-fetch';
import { getSettings } from './settings';

export const jiraSummaryRouter = express.Router();

jiraSummaryRouter.post('/', async (req, res) => {
  const { jiraId } = req.body;
  if (!jiraId) {
    res.status(400).json({ error: 'Jira ID is required' });
    return;
  }
  try {
    const settings = getSettings();
    const jiraUrl = settings.jiraUrl ? `${settings.jiraUrl}/rest/api/2/issue/${jiraId}` : `https://veetran.atlassian.net/rest/api/2/issue/${jiraId}`;
    const username = settings.jirausername || 'vijay.rocks.kannan@gmail.com';
    const apiKey = settings.jiraapiKey || '';
    const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');
    const jiraRes = await fetch(jiraUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!jiraRes.ok) {
      res.status(502).json({ error: `JIRA API error: ${jiraRes.status}` });
      return;
    }
    const jiraData: any = await jiraRes.json();
    res.json({
      summary: jiraData.fields?.summary || '',
      description: jiraData.fields?.description || ''
    });
    return;
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch JIRA issue' });
    return;
  }
});
