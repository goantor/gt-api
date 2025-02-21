import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export class EnvironmentManager {
    private static instance: EnvironmentManager;
    private currentEnvironment: string = 'default';
    private environments: Map<string, any> = new Map();
    private fileConfig: Map<string, any> = new Map();  // 存储文件头配置

    private constructor(private context: vscode.ExtensionContext) {
        this.loadEnvironments();
    }

    public static getInstance(context: vscode.ExtensionContext): EnvironmentManager {
        if (!EnvironmentManager.instance) {
            EnvironmentManager.instance = new EnvironmentManager(context);
        }
        return EnvironmentManager.instance;
    }

    private loadEnvironments() {
        try {
            // 1. 加载 .env.yaml
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders) {
                const envPath = path.join(workspaceFolders[0].uri.fsPath, '.env.yaml');
                if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const envConfig = yaml.parse(envContent);
                    
                    for (const [env, values] of Object.entries(envConfig)) {
                        this.environments.set(env, values);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading environments:', error);
            // 设置默认环境
            this.environments.set('default', {
                host: 'http://localhost:3000',
                defaultHeaders: {
                    'User-Agent': 'GT-API/1.0'
                }
            });
        }
    }

    public setFileConfig(document: vscode.TextDocument) {
        const text = document.getText();
        const config: any = {};
        
        // 解析文件头配置
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;

            if (trimmedLine.startsWith('@host')) {
                const match = trimmedLine.match(/@host\s*=\s*"([^"]+)"/);
                if (match) {
                    config.host = match[1];
                }
            } else if (trimmedLine.startsWith('@headers')) {
                try {
                    const match = trimmedLine.match(/@headers\s*=\s*({[^}]+})/);
                    if (match) {
                        config.defaultHeaders = JSON.parse(match[1].replace(/'/g, '"'));
                    }
                } catch (error) {
                    console.error('Error parsing headers:', error);
                }
            } else if (!trimmedLine.startsWith('@')) {
                // 如果遇到非配置行，停止解析
                break;
            }
        }

        // 保存文件配置
        this.fileConfig.set(document.uri.toString(), config);
    }

    public clearFileConfig(document: vscode.TextDocument) {
        this.fileConfig.delete(document.uri.toString());
    }

    public getCurrentEnvironment(): any {
        return this.environments.get(this.currentEnvironment) || {};
    }

    public getAvailableEnvironments(): string[] {
        return Array.from(this.environments.keys());
    }

    public setCurrentEnvironment(name: string) {
        if (this.environments.has(name)) {
            this.currentEnvironment = name;
            this.context.globalState.update('currentEnvironment', name);
            vscode.window.showInformationMessage(`Switched to ${name} environment`);
        }
    }

    public replaceVariables(text: string, document?: vscode.TextDocument): string {
        // 1. 获取文件头配置（最高优先级）
        const fileConfig = document ? this.fileConfig.get(document.uri.toString()) : undefined;
        
        // 2. 获取环境变量配置
        const envConfig = this.getCurrentEnvironment();

        // 3. 合并配置，文件头配置优先级更高
        const config = { ...envConfig, ...fileConfig };

        return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = this.getValueByPath(config, key.trim());
            return value !== undefined ? value : match;
        });
    }

    private getValueByPath(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => {
            return acc && acc[part];
        }, obj);
    }
} 