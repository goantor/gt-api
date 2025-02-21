module.exports = (req, res, next) => {
    // 随机延迟 100-1000ms
    const delay = Math.random() * 900 + 100;
    
    // 随机模拟 5% 的错误率
    const shouldError = Math.random() < 0.05;
    
    if (shouldError) {
        setTimeout(() => {
            res.status(500).jsonp({
                error: "Internal Server Error",
                message: "模拟的服务器错误"
            });
        }, delay);
        return;
    }
    
    // 对于登录接口，检查凭据
    if (req.path === '/auth' && req.method === 'POST') {
        const { username, password } = req.body;
        if (username === 'admin' && password === 'your-password') {
            setTimeout(() => {
                res.jsonp({
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    user: {
                        id: "12345",
                        username: "admin",
                        role: "admin"
                    }
                });
            }, delay);
            return;
        } else {
            setTimeout(() => {
                res.status(401).jsonp({
                    error: "Unauthorized",
                    message: "用户名或密码错误"
                });
            }, delay);
            return;
        }
    }
    
    // 检查认证token
    const authHeader = req.headers.authorization;
    if (!authHeader && req.path !== '/auth') {
        setTimeout(() => {
            res.status(401).jsonp({
                error: "Unauthorized",
                message: "缺少认证token"
            });
        }, delay);
        return;
    }
    
    // 继续处理请求
    setTimeout(next, delay);
}; 