import { randomUUID } from "crypto";
import Database from "./database.js";
import 'dotenv/config'
import { HuggingFaceEmbeddingFunction } from "huggingface-embeddings";
import { readFile } from "fs/promises";


const API_URL = { 'all-mpnet-base-v2': "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-mpnet-base-v2" }
const hf_token = process.env.HF_TOKEN || ""

const database = new Database(hf_token);
const embd_fn = new HuggingFaceEmbeddingFunction({
  api_key: hf_token,
  api_path: API_URL['all-mpnet-base-v2']
})

async function readLocalFile(path: string) {
  const data = await readFile(path)
  return data.toString()
}

function createChunks(data: string, chunkSize: number) {
  let i = 0;
  let op: string[] = []
  while (i < data.length) {
    op.push(data.substring(i, i + chunkSize))
    i += chunkSize
  }
  return op;
}

async function genrateData(path: string, chunkSize:number) {
  const data = await readLocalFile(path);
  return createChunks(data,chunkSize)
}
// const data = await genrateData('sample.txt', 500)
await database.initCollection('test3');
// database.saveDocuments({documents:data})
const result = await database.querry({
  queryTexts: ['ass'],
  nResults: 3
})
console.log(result)