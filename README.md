# GT API

A powerful REST API client for VS Code, supporting .rest, .curl, .api and .gtapi files.

## Features

- Support for .rest, .curl, .api and .gtapi file formats
- Syntax highlighting for HTTP methods, headers, and request bodies
- Environment variables support
- Request collections management
- Beautiful response visualization
- cURL command parsing and execution

## Usage

1. Create a new file with `.rest`, `.curl`, `.api` or `.gtapi` extension
2. Write your HTTP requests
3. Use `Cmd+Alt+R` (Mac) or `Ctrl+Alt+R` (Windows/Linux) to send the request
4. View the response in the side panel

### REST Format Example

```rest
### Get User Info
GET https://api.example.com/users/123
Accept: application/json

### Create User
POST https://api.example.com/users
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com"
}
```

### cURL Format Example

```curl
# Get User Info
curl -X GET "https://api.example.com/users/123" \
     -H "Accept: application/json"

# Create User
curl -X POST "https://api.example.com/users" \
     -H "Content-Type: application/json" \
     --data '{
         "name": "John Doe",
         "email": "john@example.com"
     }'
```

### GTAPI Format Example

```gtapi
# Get User Info
GET /users/123
headers:
    Accept: application/json

# Create User
POST /users -> {
    "name": "John Doe",
    "email": "john@example.com"
}
```

## Environment Variables

Create an `environments/default.json` file in your workspace:

```json
{
    "development": {
        "baseUrl": "https://api.dev.example.com",
        "apiKey": "dev-key"
    },
    "production": {
        "baseUrl": "https://api.example.com",
        "apiKey": "prod-key"
    }
}
```

Use variables in your requests:

```rest
GET {{baseUrl}}/users
Authorization: Bearer {{apiKey}}
```

## Commands

- `GT API: Execute` - Send the current request
- `GT API: Save` - Save the current request to a collection
- `GT API: Switch Environment` - Switch between different environments

## Requirements

- VS Code 1.97.0 or higher

## Extension Settings

This extension contributes the following settings:

* `gtApi.environment`: Set the current environment
* `gtApi.timeout`: Set request timeout in milliseconds

## Known Issues

- cURL file format support is still in beta
- Some advanced cURL options are not supported yet

## Release Notes

### 0.0.1

Initial release of GT API:
- Basic REST, cURL, API and GTAPI support
- Environment variables
- Request collections
- Response visualization

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
