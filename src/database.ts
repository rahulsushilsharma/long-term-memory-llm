import { ChromaClient, Collection } from 'chromadb';
import { HuggingFaceEmbeddingFunction } from 'huggingface-embeddings'
import { Documents, Embedding, Embeddings, ID, IDs, IncludeEnum, Metadata, Metadatas, Where, WhereDocument } from 'chromadb/dist/main/types';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
interface CollectionNotFoundError {
    msg: string 
}
export default class Database {

    private API_URL = { 'all-mpnet-base-v2': "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-mpnet-base-v2" }
    private API_KEY = process.env.HF_TOKEN
    private client !: ChromaClient;
    private embedder !: HuggingFaceEmbeddingFunction;
    private collection !: Collection | null;
    private collectionName !: string;

    constructor(apiKey: string | undefined) {
        if (!apiKey) {
            throw new Error('Unable to access hugging face access token from .env file.')
        }
        this.API_KEY = apiKey
        this.client = new ChromaClient({
            path: "http://127.0.0.1:8000",

        });
        this.embedder = new HuggingFaceEmbeddingFunction({
            api_path: this.API_URL['all-mpnet-base-v2'],
            api_key: this.API_KEY
        });
    }

    async initCollection(collectionName: string) {
        this.collectionName = collectionName
        try {
            this.collection = await this.client.createCollection({
                name: this.collectionName, embeddingFunction: this.embedder
            }).catch((error) => {
                console.error('checking old collections', error.message)
                return this.client.getCollection({ name: this.collectionName, embeddingFunction: this.embedder })
            });
        } catch {
            console.error('Please make sure that chroma instance of docker is running.')
        }
    }


    async saveDocument({ id, metadata, document }: { id?: ID; metadata?: Metadata; document: string; }) {
        if (!this.collectionName || !this.collection) {
            throw new Error('Collection not Found: Create a collection by calling createCollection method.')
        }
        return await this.collection.add({
            ids: id || randomUUID(),
            metadatas: metadata,
            documents: document,
        })
    }
    async saveDocuments({ ids, metadatas, documents }: { ids?: IDs, metadatas?: Metadatas, documents: Documents }) {
        if (!this.collectionName || !this.collection) {
            throw new Error('Collection not Found: Create a collection by calling createCollection method.')
        }

        return await this.collection.add({
            ids: ids || documents.map(() => randomUUID()),
            metadatas: metadatas,
            documents: documents,
        })
    }

    async querry({ queryEmbeddings, nResults, where, queryTexts, whereDocument, include, }: {
        queryEmbeddings?: Embedding | Embeddings | undefined;
        nResults?: number | undefined;
        where?: Where | undefined;
        queryTexts?: string | string[] | undefined;
        whereDocument?: WhereDocument | undefined;
        include?: IncludeEnum[] | undefined;
    }
    ) {
        if (!this.collectionName || !this.collection) {
            throw new Error('Collection not Found: Initlize a collection by calling initCollection method first.')
        }
        return await this.collection.query({ queryEmbeddings, nResults, where, queryTexts, whereDocument, include, })
    }

}