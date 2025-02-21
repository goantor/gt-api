import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface RequestItem {
    id: string;
    name: string;
    description?: string;
    method: string;
    url: string;
    headers: { [key: string]: string };
    body?: string;
    type: 'rest' | 'curl';
    rawContent: string;
    createdAt: string;
    updatedAt: string;
}

export interface Collection {
    id: string;
    name: string;
    description?: string;
    requests: RequestItem[];
    createdAt: string;
    updatedAt: string;
}

export class CollectionManager {
    private static instance: CollectionManager;
    private collections: Collection[] = [];
    private collectionPath: string;

    private constructor(context: vscode.ExtensionContext) {
        this.collectionPath = path.join(context.extensionPath, 'collections');
        this.loadCollections();
    }

    static getInstance(context: vscode.ExtensionContext): CollectionManager {
        if (!CollectionManager.instance) {
            CollectionManager.instance = new CollectionManager(context);
        }
        return CollectionManager.instance;
    }

    private loadCollections() {
        try {
            if (!fs.existsSync(this.collectionPath)) {
                fs.mkdirSync(this.collectionPath);
            }

            const files = fs.readdirSync(this.collectionPath);
            this.collections = files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const content = fs.readFileSync(path.join(this.collectionPath, file), 'utf8');
                    return JSON.parse(content);
                });
        } catch (error) {
            console.error('Failed to load collections:', error);
            vscode.window.showErrorMessage('Failed to load request collections');
        }
    }

    private saveCollections() {
        try {
            this.collections.forEach(collection => {
                const filePath = path.join(this.collectionPath, `${collection.id}.json`);
                fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
            });
        } catch (error) {
            console.error('Failed to save collections:', error);
            vscode.window.showErrorMessage('Failed to save request collections');
        }
    }

    async createCollection(name: string, description?: string): Promise<Collection> {
        const collection: Collection = {
            id: Date.now().toString(),
            name,
            description,
            requests: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.collections.push(collection);
        this.saveCollections();
        return collection;
    }

    async addRequest(collectionId: string, request: Omit<RequestItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestItem> {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }

        const requestItem: RequestItem = {
            ...request,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        collection.requests.push(requestItem);
        collection.updatedAt = new Date().toISOString();
        this.saveCollections();
        return requestItem;
    }

    async deleteRequest(collectionId: string, requestId: string): Promise<void> {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }

        const index = collection.requests.findIndex(r => r.id === requestId);
        if (index === -1) {
            throw new Error('Request not found');
        }

        collection.requests.splice(index, 1);
        collection.updatedAt = new Date().toISOString();
        this.saveCollections();
    }

    async updateRequest(collectionId: string, requestId: string, updates: Partial<RequestItem>): Promise<RequestItem> {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }

        const request = collection.requests.find(r => r.id === requestId);
        if (!request) {
            throw new Error('Request not found');
        }

        Object.assign(request, updates, { updatedAt: new Date().toISOString() });
        collection.updatedAt = new Date().toISOString();
        this.saveCollections();
        return request;
    }

    getCollections(): Collection[] {
        return this.collections;
    }

    getCollection(id: string): Collection | undefined {
        return this.collections.find(c => c.id === id);
    }

    async deleteCollection(id: string): Promise<void> {
        const index = this.collections.findIndex(c => c.id === id);
        if (index === -1) {
            throw new Error('Collection not found');
        }

        this.collections.splice(index, 1);
        const filePath = path.join(this.collectionPath, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
} 