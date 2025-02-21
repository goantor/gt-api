// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios, { AxiosRequestConfig } from 'axios';
import { EnvironmentManager } from './environment';
import { RequestCodeLensProvider } from './codeLens';
import { registerCompletionProvider } from './completion';

interface RequestConfig {
	method: string;
	url: string;
	headers?: { [key: string]: string };
	data?: any;
	timeout?: number;
	responseMode?: 'line' | 'window';
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('GT API is now active!');

	// 初始化环境管理器
	const envManager = EnvironmentManager.getInstance(context);

	// 监听文件打开和保存事件，更新文件配置
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument((document) => {
			if (document.languageId === 'gtapi') {
				envManager.setFileConfig(document);
			}
		}),
		vscode.workspace.onDidSaveTextDocument((document) => {
			if (document.languageId === 'gtapi') {
				envManager.setFileConfig(document);
			}
		}),
		vscode.workspace.onDidCloseTextDocument((document) => {
			if (document.languageId === 'gtapi') {
				envManager.clearFileConfig(document);
			}
		})
	);

	// 注册 CodeLens 提供者
	const codeLensProvider = new RequestCodeLensProvider();
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'gtapi' }, codeLensProvider)
	);

	// 注册补全提供者
	registerCompletionProvider(context);

	// 注册环境切换命令
	let switchEnvCommand = vscode.commands.registerCommand('gt-api.switchEnvironment', async () => {
		const environments = envManager.getAvailableEnvironments();
		const selected = await vscode.window.showQuickPick(environments, {
			placeHolder: 'Select environment'
		});
		
		if (selected) {
			envManager.setCurrentEnvironment(selected);
		}
	});

	// 注册发送请求命令
	let executeCommand = vscode.commands.registerCommand('gt-api.Execute', async (range?: vscode.Range) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor!');
			return;
		}

		try {
			// 解析文档中的配置
			const config = await parseRequest(editor.document, range);

			// 替换环境变量，传入当前文档
			config.url = envManager.replaceVariables(config.url, editor.document);
			if (config.headers) {
				Object.keys(config.headers).forEach(key => {
					if (typeof config.headers![key] === 'string') {
						config.headers![key] = envManager.replaceVariables(config.headers![key], editor.document);
					}
				});
			}

			// 发送请求
			const response = await execute(config);
			
			// 显示响应
			await showResponse(response, range, config);
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(`Error: ${error.message}`);
			} else {
				vscode.window.showErrorMessage('An unknown error occurred');
			}
		}
	});

	// 注册保存到集合命令
	let saveToCollectionCommand = vscode.commands.registerCommand('gt-api.saveToCollection', () => {
		vscode.window.showInformationMessage('Saving to collection...');
	});

	// 注册复制为 cURL 命令
	let copyAsCurlCommand = vscode.commands.registerCommand('gt-api.copyAsCurl', () => {
		vscode.window.showInformationMessage('Copying as cURL...');
	});

	context.subscriptions.push(
		executeCommand,
		saveToCollectionCommand,
		switchEnvCommand,
		copyAsCurlCommand
	);
}

async function parseRequest(document: vscode.TextDocument, range?: vscode.Range): Promise<RequestConfig> {
	const text = range 
		? document.getText(range)
		: document.getText();

	const config: RequestConfig = {
		method: 'GET',
		url: '',
		headers: {},
		responseMode: 'line'
	};

	// 先解析全局配置
	let globalHost = '';
	let defaultHeaders = {};
	const globalConfig = text.split('\n')
		.map(line => line.trim())
		.filter(line => line && !line.startsWith('#'));

	// 1. 先获取全局配置
	for (const line of globalConfig) {
		if (line.startsWith('@host')) {
			const match = line.match(/@host\s*=\s*"([^"]+)"/);
			if (match) {
				globalHost = match[1];
			}
		} else if (line.startsWith('@headers')) {
			try {
				const match = line.match(/@headers\s*=\s*({[^}]+})/);
				if (match) {
					defaultHeaders = JSON.parse(match[1].replace(/'/g, '"'));
				}
			} catch (error) {
				console.error('Error parsing default headers:', error);
			}
		} else if (line.startsWith('@timeout')) {
			const match = line.match(/@timeout\s*=\s*(\d+)/);
			if (match) {
				config.timeout = parseInt(match[1], 10);
			}
		} else if (line.startsWith('@response_mode')) {
			const match = line.match(/@response_mode\s*=\s*"(line|window)"/);
			if (match) {
				config.responseMode = match[1] as 'line' | 'window';
			}
		}
	}

	// 2. 解析具体请求
	const lines = text.split('\n');
	let isHeaders = false;
	let isData = false;
	let dataLines: string[] = [];
	let requestHeaders: {[key: string]: string} = {};

	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith('#')) continue;

		if (trimmedLine.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/)) {
			const [method, path] = trimmedLine.split(/\s+/);
			config.method = method;
			
			// 处理 URL
			if (path.startsWith('http://') || path.startsWith('https://')) {
				// 如果设置了全局 host，替换掉完整 URL 中的域名部分
				if (globalHost) {
					const urlObj = new URL(path);
					config.url = path.replace(urlObj.origin, globalHost);
				} else {
					config.url = path;
				}
			} else {
				// 相对路径，直接拼接全局 host
				config.url = (globalHost || '') + path;
			}
		} else if (trimmedLine === 'headers:') {
			isHeaders = true;
			isData = false;
		} else if (trimmedLine === 'data:') {
			isData = true;
			isHeaders = false;
		} else if (isHeaders) {
			const [key, ...values] = trimmedLine.split(':');
			if (key && values.length) {
				requestHeaders[key.trim()] = values.join(':').trim();
			}
		} else if (isData) {
			dataLines.push(line);
		}
	}

	// 3. 合并 headers
	// 只有请求中没有定义的 header 才使用默认值
	config.headers = { ...defaultHeaders };
	for (const [key, value] of Object.entries(requestHeaders)) {
		config.headers[key] = value;
	}

	if (dataLines.length > 0) {
		try {
			config.data = JSON.parse(dataLines.join('\n'));
		} catch (error) {
			config.data = dataLines.join('\n');
		}
	}

	return config;
}

async function execute(config: RequestConfig): Promise<any> {
	const axiosConfig: AxiosRequestConfig = {
		method: config.method.toLowerCase(),
		url: config.url,
		headers: config.headers,
		data: config.data,
		timeout: config.timeout
	};

	try {
		const response = await axios(axiosConfig);
		return response;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(error.message);
		}
		throw error;
	}
}

async function showResponse(response: any, range?: vscode.Range, config?: RequestConfig) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	if (config?.responseMode === 'line' && range) {
		// 在请求下方显示响应
		const formattedHeaders = Object.entries(response.headers)
			.map(([key, value]) => `# ${key}: ${value}`)
			.join('\n');

		const formattedBody = typeof response.data === 'object' 
			? JSON.stringify(response.data, null, 2)
			: response.data;

		const responseText = [
			'',
			'### Response',
			`# Status: ${response.status} ${response.statusText}`,
			'# Headers:',
			formattedHeaders,
			'',
			'# Body:',
			'```',
			formattedBody,
			'```',
			''
		].join('\n');

		const position = new vscode.Position(range.end.line + 1, 0);
		await editor.edit(editBuilder => {
			editBuilder.insert(position, responseText);
		});
	} else {
		// 在新窗口中显示响应
		const panel = vscode.window.createWebviewPanel(
			'apiResponse',
			'API Response',
			vscode.ViewColumn.Beside,
			{ enableScripts: true }
		);

		const formattedResponse = {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
			data: response.data
		};

		panel.webview.html = getWebviewContent(formattedResponse);
	}
}

function getWebviewContent(response: any): string {
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>
				body { font-family: var(--vscode-editor-font-family); padding: 20px; }
				pre { background-color: var(--vscode-editor-background); padding: 10px; }
				.status { color: var(--vscode-statusBar-foreground); }
				.headers { margin: 20px 0; }
				.data { margin-top: 20px; }
			</style>
		</head>
		<body>
			<h2>Response</h2>
			<div class="status">
				Status: ${response.status} ${response.statusText}
			</div>
			<div class="headers">
				<h3>Headers:</h3>
				<pre>${JSON.stringify(response.headers, null, 2)}</pre>
			</div>
			<div class="data">
				<h3>Body:</h3>
				<pre>${JSON.stringify(response.data, null, 2)}</pre>
			</div>
		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
