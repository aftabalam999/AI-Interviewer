const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { OpenAIEmbeddings } = require("@langchain/openai");

// Math util for cosine similarity in pure Node.js
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 1. Chunking Strategy
 * --------------------
 * We use a RecursiveCharacterTextSplitter to intelligently divide the 
 * unstructured text (Resume + Job Description). 
 * 
 * - chunkSize: 500 chars
 * - chunkOverlap: 50 chars
 */
const splitTextIntoChunks = async (resumeText, jobDescriptionText) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const combinedText = `--- ROLE CONTEXT (Job Description) ---\n${jobDescriptionText}\n--- CANDIDATE CONTEXT (Resume) ---\n${resumeText}`;
  const rawDocs = [{ pageContent: combinedText, metadata: { source: "context" } }];
  
  return await splitter.splitDocuments(rawDocs);
};

/**
 * 2. Embedding Pipeline & DB Storage (Custom Local Vector DB)
 * ----------------------------------
 * Maps chunks into dense vectors using 'text-embedding-3-small'.
 * Because native FAISS bindings crash on Windows, we simulate it via an in-memory cosine similarity store.
 */
const createAndStoreEmbeddings = async (chunks) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Required for embedding generation.");
  }

  const embeddingsClient = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });
  const chunkTexts = chunks.map(c => c.pageContent);
  const chunkVectors = await embeddingsClient.embedDocuments(chunkTexts);

  // Return the built in-memory local DB structure
  return { embeddingsClient, chunks, chunkVectors };
};

/**
 * 3. Retrieval Logic
 * -------------------
 * Executes a semantic search against our localized JS Vectors
 * to pull the top 5 most relevant chunks.
 */
const retrieveRelevantContext = async (localVectorStore) => {
  const query = "Core technical skills, exact role responsibilities, and key candidate achievements.";
  
  // Embed the query
  const queryVector = await localVectorStore.embeddingsClient.embedQuery(query);
  
  // Rank chunks by cosine similarity
  const rankedChunks = localVectorStore.chunks.map((doc, idx) => {
    const similarity = cosineSimilarity(queryVector, localVectorStore.chunkVectors[idx]);
    return { content: doc.pageContent, similarity };
  });

  // Sort Descending and slice top 5
  rankedChunks.sort((a, b) => b.similarity - a.similarity);
  const topResults = rankedChunks.slice(0, 5);
  
  return topResults.map(res => res.content).join('\n---\n');
};


/**
 * Main RAG Pipeline Orchestrator
 */
const extractContextViaRAG = async (resumeText, jobDescription) => {
  try {
    // Step 1: Chunk
    const chunks = await splitTextIntoChunks(resumeText || "No resume provided.", jobDescription);
    
    // Step 2: Embed & Store
    const vectorStore = await createAndStoreEmbeddings(chunks);
    
    // Step 3: Retrieve
    const retrievedContext = await retrieveRelevantContext(vectorStore);
    
    return retrievedContext;
  } catch (error) {
    console.error("RAG Pipeline Error:", error);
    // Graceful fallback: if API key missing or store fails, heavily truncate standard text
    return `Fallback Context:\nJD: ${jobDescription.slice(0, 1000)}\nResume: ${(resumeText || '').slice(0, 1000)}`;
  }
};

module.exports = { extractContextViaRAG };
