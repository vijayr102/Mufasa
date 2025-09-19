import { z } from 'zod'

export const GenerateRequestSchema = z.object({
  storyTitle: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  description: z.string().optional(),
  additionalInfo: z.string().optional(),
  category: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasStory = !!data.storyTitle && data.storyTitle.trim().length > 0 && !!data.acceptanceCriteria && data.acceptanceCriteria.trim().length > 0;
  if (!hasStory ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either Story Title and Acceptance Criteria, or Jira Id is required',
      path: []
    });
  }
})

export const TestCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  steps: z.array(z.string()),
  testData: z.string().optional(),
  expectedResult: z.string(),
  category: z.string()
})

export const GenerateResponseSchema = z.object({
  cases: z.array(TestCaseSchema),
  model: z.string().optional(),
  promptTokens: z.number(),
  completionTokens: z.number()
})

// Type exports
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>
export type TestCase = z.infer<typeof TestCaseSchema>
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>