import * as vscode from 'vscode';

// 通用补全项
const commonCompletions = {
    // 配置项
    configurations: [
        { label: '@host', detail: 'API 主机地址', documentation: 'Set API host URL' },
        { label: '@timeout', detail: '超时时间(ms)', documentation: 'Set request timeout in milliseconds' },
        { label: '@response_mode', detail: '响应显示模式 (line/window)', documentation: 'Set response display mode' }
    ],
    
    // HTTP 方法
    methods: [
        { label: 'GET', detail: '获取资源', documentation: 'Retrieve a resource' },
        { label: 'POST', detail: '创建资源', documentation: 'Create a new resource' },
        { label: 'PUT', detail: '更新资源', documentation: 'Update an existing resource' },
        { label: 'DELETE', detail: '删除资源', documentation: 'Delete a resource' },
        { label: 'PATCH', detail: '部分更新', documentation: 'Partially update a resource' },
        { label: 'HEAD', detail: '获取头信息', documentation: 'Retrieve headers only' },
        { label: 'OPTIONS', detail: '获取可用选项', documentation: 'Get available options' }
    ],
    
    // 常用 Headers
    headers: [
        { label: 'Content-Type', detail: '内容类型', values: ['application/json', 'application/xml', 'text/plain'] },
        { label: 'Accept', detail: '接受类型', values: ['application/json', 'application/xml', '*/*'] },
        { label: 'Authorization', detail: '认证信息', values: ['Bearer {{token}}', 'Basic {{base64}}'] },
        { label: 'User-Agent', detail: '用户代理', values: ['{{global.headers.User-Agent}}'] }
    ],
    
    // 钩子函数
    hooks: [
        { label: 'beforeRequest', detail: '请求前钩子', snippet: 'beforeRequest: (req) {\n\t$0\n}' },
        { label: 'afterRequest', detail: '请求后钩子', snippet: 'afterRequest: (res) {\n\t$0\n}' },
        { label: 'beforeResponse', detail: '响应前钩子', snippet: 'beforeResponse: (res) {\n\t$0\n}' },
        { label: 'afterResponse', detail: '响应后钩子', snippet: 'afterResponse: (res) {\n\t$0\n}' }
    ],
    
    // 存储变量访问
    storage: [
        { label: 'ant.hooks.storage.metrics', detail: '性能指标' },
        { label: 'ant.hooks.storage.cache', detail: '缓存数据' },
        { label: 'ant.hooks.storage.custom', detail: '自定义变量' },
        { label: 'ant.hooks.storage.state', detail: '状态信息' }
    ],
    
    // 工具函数
    utils: [
        { label: 'ant.log', detail: '日志输出', snippet: 'ant.log($0)' },
        { label: 'ant.error', detail: '错误输出', snippet: 'ant.error($0)' },
        { label: 'ant.warn', detail: '警告输出', snippet: 'ant.warn($0)' },
        { label: 'ant.utils.encrypt', detail: '加密函数', snippet: 'ant.utils.encrypt($0)' },
        { label: 'ant.utils.generateUUID', detail: '生成UUID', snippet: 'ant.utils.generateUUID()' }
    ]
};

// API 格式特定补全项
const apiCompletions = {
    keywords: [
        { label: 'request api', detail: 'API 请求定义', snippet: 'request api ${1:/path}\n -method: ${2|GET,POST,PUT,DELETE,PATCH|}\n -headers:\n\t$0' },
        { label: '-method:', detail: '请求方法' },
        { label: '-headers:', detail: '请求头' },
        { label: '-data:', detail: '请求数据' }
    ]
};

// GTAPI 格式特定补全项
const gtapiCompletions = {
    keywords: [
        { label: 'headers:', detail: '请求头定义' },
        { label: 'data:', detail: '请求数据定义' },
        { label: '->', detail: '简洁数据语法', snippet: '-> {\n\t$0\n}' }
    ]
};

export class ApiCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const items: vscode.CompletionItem[] = [];
        
        // 根据文件类型选择补全项
        const isApi = document.languageId === 'api';
        const specificCompletions = isApi ? apiCompletions : gtapiCompletions;
        
        // 配置项补全
        if (linePrefix.trim().startsWith('@')) {
            commonCompletions.configurations.forEach(config => {
                const item = new vscode.CompletionItem(config.label, vscode.CompletionItemKind.Property);
                item.detail = config.detail;
                item.documentation = config.documentation;
                items.push(item);
            });
        }
        
        // HTTP 方法补全
        if (linePrefix.trim() === '' || (isApi && linePrefix.includes('-method:'))) {
            commonCompletions.methods.forEach(method => {
                const item = new vscode.CompletionItem(method.label, vscode.CompletionItemKind.Method);
                item.detail = method.detail;
                item.documentation = method.documentation;
                items.push(item);
            });
        }
        
        // Headers 补全
        if (linePrefix.trim().endsWith(':') || linePrefix.includes('headers:')) {
            commonCompletions.headers.forEach(header => {
                const item = new vscode.CompletionItem(header.label, vscode.CompletionItemKind.Field);
                item.detail = header.detail;
                item.insertText = new vscode.SnippetString(`${header.label}: \${1|${header.values.join(',')}|}`);
                items.push(item);
            });
        }
        
        // 钩子函数补全
        if (linePrefix.includes('hooks:') || linePrefix.trim() === '') {
            commonCompletions.hooks.forEach(hook => {
                const item = new vscode.CompletionItem(hook.label, vscode.CompletionItemKind.Function);
                item.detail = hook.detail;
                item.insertText = new vscode.SnippetString(hook.snippet);
                items.push(item);
            });
        }
        
        // 存储变量补全
        if (linePrefix.includes('ant.hooks.storage')) {
            commonCompletions.storage.forEach(storage => {
                const item = new vscode.CompletionItem(storage.label, vscode.CompletionItemKind.Variable);
                item.detail = storage.detail;
                items.push(item);
            });
        }
        
        // 工具函数补全
        if (linePrefix.includes('ant.')) {
            commonCompletions.utils.forEach(util => {
                const item = new vscode.CompletionItem(util.label, vscode.CompletionItemKind.Function);
                item.detail = util.detail;
                item.insertText = new vscode.SnippetString(util.snippet);
                items.push(item);
            });
        }
        
        // 特定格式关键字补全
        specificCompletions.keywords.forEach(keyword => {
            const item = new vscode.CompletionItem(keyword.label, vscode.CompletionItemKind.Keyword);
            item.detail = keyword.detail;
            if (keyword.snippet) {
                item.insertText = new vscode.SnippetString(keyword.snippet);
            }
            items.push(item);
        });
        
        return items;
    }
    
    resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
        return item;
    }
}

// 注册补全提供者
export function registerCompletionProvider(context: vscode.ExtensionContext) {
    const apiProvider = vscode.languages.registerCompletionItemProvider(
        [{ scheme: 'file', language: 'api' }, { scheme: 'file', language: 'gtapi' }],
        new ApiCompletionProvider(),
        '@', '-', ':', '.'  // 触发补全的字符
    );
    
    context.subscriptions.push(apiProvider);
} 