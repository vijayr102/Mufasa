import { Router } from 'express';
import { z } from 'zod';
import { GroqClient } from '../llm/groqClient';

const router = Router();

const FieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1)
});
const GenerateTestDataRequest = z.object({
  fields: z.array(FieldSchema).min(1)
});

function buildTestDataPrompt(fields: { name: string, type: string }[]) {
  let fieldLines = fields.map(f => `${f.name}: ${f.type}`).join('\n');
  return `You are a senior QA engineer with expertise in Test Data generation, your task is analyze the field name and it types \nand generate a diversified data set for the below fields of this types\nUse these methodologies \n-Equivalence Partitioning\n-Boundary Value Analysis (BVA)\nConsider Both Positive and Negative Test Data\nFields:\n${fieldLines}\nOutput format:\n{\n  \"results\": [\n      {\n          \"First Name\": \"tdeopqcd\",\n          \"Last Name\": \"wml85d9w\",\n          \"Date of Brith\": \"2025-09-19\",\n          \"city\": \"crf6859e\"\n      }\n ]\n}\nMandatory: Generate only exactly 5 rows of Test data\nImportant: Generate test data only for provided fields no extra fields\nProvide only test data no explanations\n provide more realistic data\nCritical: you must return in json format`;
}

router.post('/', async (req, res) => {
  const parse = GenerateTestDataRequest.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid schema' });
  }
  const { fields } = parse.data;
  const prompt = buildTestDataPrompt(fields);
  const groqClient = new GroqClient();
  try {
    const groqResponse = await groqClient.generateTests('', prompt);
    console.log('Groq raw response:', groqResponse);
  let content = groqResponse.content;
  // Remove Markdown code block markers if present
  content = content.replace(/```json[\r\n]?/gi, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      // Try to extract JSON from text (if LLM wraps in markdown or extra text)
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0].replace(/```json[\r\n]?/gi, '').replace(/```/g, '').trim());
        } catch (err2) {
          console.error('Failed to parse extracted JSON:', err2);
          return res.status(502).json({ error: 'LLM returned invalid JSON format', raw: content, groqResponse });
        }
      } else {
        console.error('LLM returned non-JSON content:', content);
        return res.status(502).json({ error: 'LLM returned invalid JSON format', raw: content, groqResponse });
      }
    }
    // Accept either { results: [...] } or just [...]
    let results = Array.isArray(parsed) ? parsed : parsed.results;
    if (!Array.isArray(results)) {
      console.error('LLM response does not contain results array:', parsed);
      return res.status(502).json({ error: 'LLM response does not contain results array', raw: content, groqResponse });
    }
    return res.json({ results });
  } catch (err) {
    console.error('LLM error:', err);
    return res.status(502).json({ error: 'Failed to generate test data from LLM service', details: String(err) });
  }
});

export default router;
