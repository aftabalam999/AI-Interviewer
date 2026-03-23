const Groq = require('groq-sdk');
const { extractContextViaRAG } = require('./rag.service');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate interview questions using Groq LLM (llama-3.3-70b-versatile)
 * @param {Object} params
 * @param {string} params.jobTitle
 * @param {string} params.jobDescription
 * @param {string} params.experienceLevel
 * @param {string[]} params.questionTypes
 * @param {number} params.numberOfQuestions
 * @param {string|null} params.resumeText
 * @returns {Promise<Array>} Array of question objects
 */
const generateInterviewQuestions = async ({
  jobTitle,
  jobDescription,
  experienceLevel,
  resumeText = null,
}) => {
  const optimizedContext = await extractContextViaRAG(resumeText, jobDescription);

  const systemPrompt = `You are an expert technical interviewer and HR specialist.
You create precise, challenging, and role-relevant interview questions solely based on the provided context retrieved from RAG chunks.
NO HALLUCINATIONS: Do not ask questions about skills or tools not explicitly present in the provided context.
Always respond with valid JSON only — no extra text, no markdown fences.`;

  const userPrompt = `Act as an AI interviewer.

Given the following strictly retrieved chunks of candidate context and role requirements:
---
${optimizedContext}
---

Job Title: ${jobTitle}
Experience Level: ${experienceLevel}

Generate:
- 10 technical questions
- 5 behavioral questions

Rules:
- STRICT GROUNDING: You MUST base every single question ONLY on the provided retrieved chunks above.
- If a technology or experience is not mentioned in the context, DO NOT generate a question about it.
- Questions must match candidate skill level (${experienceLevel}).
- Avoid generic questions.
- Behavioral questions should use STAR method format.
- Technical questions should test real-world problem solving.
- Include 3-5 expected keywords for each question.

Return structured JSON exactly in this format:
{
  "technical": [
    {
      "questionText": "...",
      "difficulty": "easy|medium|hard",
      "expectedKeywords": ["keyword1", "keyword2"]
    }
  ],
  "behavioral": [
    {
      "questionText": "...",
      "difficulty": "easy|medium|hard",
      "expectedKeywords": ["keyword1", "keyword2"]
    }
  ]
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI model.');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('AI returned invalid JSON. Please try again.');
  }

  const technicalQs = Array.isArray(parsed.technical) ? parsed.technical : [];
  const behavioralQs = Array.isArray(parsed.behavioral) ? parsed.behavioral : [];

  if (!technicalQs.length && !behavioralQs.length) {
    throw new Error('AI returned no valid questions. Please try again.');
  }

  // Flatten and map to MongoDB question schema format
  const allQuestions = [];
  
  technicalQs.forEach(q => {
    allQuestions.push({
      questionText: q.questionText || q.question || '',
      category: 'technical',
      difficulty: q.difficulty || 'medium',
      expectedKeywords: Array.isArray(q.expectedKeywords) ? q.expectedKeywords : [],
    });
  });

  behavioralQs.forEach(q => {
    allQuestions.push({
      questionText: q.questionText || q.question || '',
      category: 'behavioral',
      difficulty: q.difficulty || 'medium',
      expectedKeywords: Array.isArray(q.expectedKeywords) ? q.expectedKeywords : [],
    });
  });

  return allQuestions.map((q, i) => ({ ...q, order: i + 1 }));
};

/**
 * Evaluate a candidate's answer using Groq
 */
const evaluateAnswer = async ({ questionText, answerText, expectedKeywords, jobTitle }) => {
  const prompt = `Act as an interviewer evaluating a candidate's response.

Job Title: ${jobTitle}
Question: ${questionText}
Expected Keywords Context: ${expectedKeywords.join(', ')}
Candidate's Answer: ${answerText || '(No answer provided)'}

Evaluate the candidate's answer strictly based on:
1. Correctness
2. Clarity
3. Depth

Return valid JSON exactly in this format:
{
  "score": <number 1-10>,
  "feedback": "<constructive feedback string explaining the evaluation based on correctness, clarity, and depth>"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  return JSON.parse(content || '{}');
};

/**
 * Generate overall session feedback
 */
const generateOverallFeedback = async ({ jobTitle, answers }) => {
  const summary = answers
    .map((a, i) => `Q${i + 1}: ${a.questionText}\nScore: ${a.aiScore}/10\nAnswer: ${a.answerText?.slice(0, 200)}`)
    .join('\n\n');

  const prompt = `You are a senior interviewer providing a final interview report.
Be professional and concise.

Job Title: ${jobTitle}
Interview Summary:
${summary}

Respond with valid JSON exacty in this format:
{
  "overallScore": <number 1-100>,
  "strengths": ["<point 1>", "<point 2>"],
  "weaknesses": ["<point 1>", "<point 2>"],
  "improvementTips": ["<point 1>", "<point 2>"]
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  return JSON.parse(content || '{}');
};

module.exports = { generateInterviewQuestions, evaluateAnswer, generateOverallFeedback };
