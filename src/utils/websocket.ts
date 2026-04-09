// src/utils/websocket.ts

/**
 * WebSocket 客户端工具类
 *
 * 功能特性：
 * 1. 单例模式 - 确保整个应用只有一个WebSocket连接
 * 2. 自动重连 - 支持指数退避算法的重连机制
 * 3. 心跳检测 - 定期发送心跳包保持连接活跃
 * 4. 消息订阅 - 多页面按消息类型订阅/取消订阅
 * 5. 连接状态管理 - 提供详细的连接状态信息
 * 6. 错误处理 - 全局错误处理器和局部错误处理
 *
 * 使用流程：
 * 1. 在多个页面调用 initWebSocket() 初始化连接（实际只连接一次）
 * 2. 在组件中使用 subscribe() 订阅需要的消息类型
 * 3. 在组件卸载时使用 unsubscribe() 取消订阅
 * 4. 用户登出时调用 closeWebSocket() 关闭连接
 *
 * 设计原则：
 * - 连接与用户会话绑定（登录后建立，登出后关闭）
 * - 多页面安全调用（重复初始化被忽略）
 * - 内存安全（组件卸载时自动取消订阅）
 */

// ==================== 类型定义 ====================

import cache from "@/utils/cache";

/**
 * 消息类型：可以是字符串或Symbol
 * 建议使用字符串常量以便于跨组件共享
 */
type MessageType = string | symbol;

/**
 * 消息处理器函数类型
 * @template T 消息数据类型（可选）
 */
interface MessageHandler<T = any> {
    (data: T): void;
}

/**
 * WebSocket连接状态枚举
 * 用于清晰表示当前连接状态
 */
export enum ConnectionState {
    CONNECTING = 0,  // 连接中（初始连接）
    OPEN = 1,        // 已连接（可通信）
    CLOSING = 2,     // 关闭中（正在关闭连接）
    CLOSED = 3,      // 已关闭（连接断开）
    RECONNECTING = 4 // 重连中（自动尝试重新连接）
}

// ==================== WebSocket客户端类 ====================

/**
 * WebSocket客户端核心类
 * 使用单例模式确保全局唯一实例
 */
class WebSocketClient {
    // 单例实例
    private static instance: WebSocketClient;

    // WebSocket实例
    private ws: WebSocket | null = null;

    // 重连相关属性
    private reconnectAttempts = 0;              // 当前重连尝试次数
    private maxReconnectAttempts = 0;           // 最大重连尝试次数（0表示无限重连）
    private baseReconnectInterval = 1000;       // 基础重连间隔（毫秒）
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null; // 重连计时器

    // 心跳检测相关属性
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null; // 心跳计时器
    private heartbeatInterval = 30000;          // 心跳间隔（毫秒），默认30秒

    // 消息处理相关属性
    private handlers = new Map<MessageType, Set<MessageHandler>>(); // 消息处理器映射表

    // 连接配置属性
    private baseUrl: string | null = null; // 基础URL（不含Token）
    private url: string | null = null;     // 完整URL（含Token）
    private protocols?: string | string[];      // WebSocket子协议（可选）

    // 状态管理属性
    private _connectionState: ConnectionState = ConnectionState.CLOSED; // 当前连接状态

    private isInitialized = false;              // 是否已初始化标志

    // 全局处理器标志
    private globalErrorHandlerRegistered = false; // 全局错误处理器注册标志

    /**
     * 私有构造函数（单例模式）
     */
    private constructor() {
        // 单例模式，禁止外部实例化
    }

    /**
     * 获取WebSocketClient单例实例
     * @returns WebSocketClient实例
     */
    public static getInstance(): WebSocketClient {
        if (!WebSocketClient.instance) {
            WebSocketClient.instance = new WebSocketClient();
        }
        return WebSocketClient.instance;
    }

    // ==================== 公共方法 ====================

    /**
     * 初始化WebSocket连接
     * @param baseUrl WebSocket服务器基础地址（不含Token）
     * @param token 用户认证令牌
     * @param protocols WebSocket子协议（可选）
     *
     * 注意：此方法只会执行一次初始化，重复调用将被忽略
     */
    public initialize(baseUrl: string, token: string, protocols?: string | string[]): void {
        // 避免重复初始化
        if (this.isInitialized) {
            console.log('[WebSocket] 已初始化，跳过重复初始化');
            return;
        }

        // 保存配置信息
        // 构建带Token的完整URL
        this.baseUrl = baseUrl;
        this.url = this.buildUrlWithToken(baseUrl, token);
        this.protocols = protocols;
        this.isInitialized = true;

        console.log(`[WebSocket] 初始化连接，目标:  ${this.url}`);

        // 发起连接
        this.connect();
    }

    /**
     * 构建带Token的WebSocket URL
     * @param baseUrl 基础URL
     * @param token 用户令牌
     * @returns 带token查询参数的完整URL
     */
    private buildUrlWithToken(baseUrl: string, token: string): string {
        // 确保URL格式正确（ws:// 或 wss://）
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}access_token=${encodeURIComponent(token)}`;
    }

    /**
     * 刷新Token（当Token更新时调用）
     * @param newToken 新的认证令牌
     *
     * 注意：此方法会重新建立连接
     */
    public refreshToken(newToken: string): void {
        if (!this.baseUrl) {
            console.error('[WebSocket] 无法刷新Token：基础URL未设置');
            return;
        }

        console.log('[WebSocket] 刷新Token，重建连接');

        // 关闭现有连接
        this.close();

        // 构建新URL
        this.url = this.buildUrlWithToken(this.baseUrl, newToken);

        // 重置初始化状态
        this.isInitialized = false;

        // 重新初始化连接
        this.initialize(this.baseUrl, newToken, this.protocols);
    }

    /**
     * 获取当前连接状态
     * @returns ConnectionState 枚举值
     */
    public get connectionState(): ConnectionState {
        return this._connectionState;
    }

    /**
     * 检查是否已初始化
     * @returns boolean 已初始化返回true
     */
    public get initialized(): boolean {
        return this.isInitialized;
    }

    /**
     * 注册全局错误处理器
     * 此方法确保全局错误处理器只注册一次
     */
    public registerGlobalErrorHandler(): void {
        // 避免重复注册
        if (this.globalErrorHandlerRegistered) {
            return;
        }

        console.log('[WebSocket] 注册全局错误处理器');

        // 订阅错误事件
        this.subscribe(MessageTypes.WS_ERROR, (error) => {
            console.error('[WebSocket] 全局错误:', error);
            // 这里可以添加全局错误处理逻辑，如：
            // - 显示错误通知
            // - 记录错误日志
            // - 执行特定错误恢复操作
        });

        // 标记已注册
        this.globalErrorHandlerRegistered = true;
    }

    /**
     * 订阅消息
     * @param type 消息类型
     * @param handler 消息处理函数
     *
     * 使用示例：
     * wsClient.subscribe('NOTIFY_MESSAGE', (order) => {
     *   console.log('收到订单更新', order);
     * });
     */
    public subscribe<T = any>(type: MessageType, handler: MessageHandler<T>): void {
        // 如果该消息类型尚未有处理器集合，创建新的Set
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }

        // 添加处理器到对应消息类型的集合
        this.handlers.get(type)!.add(handler as MessageHandler);

        console.log(`[WebSocket] 订阅消息类型: ${String(type)}，当前订阅数: ${this.handlers.get(type)!.size}`);
    }

    /**
     * 取消订阅消息
     * @param type 消息类型
     * @param handler 消息处理函数
     *
     * 注意：组件卸载时必须调用此方法，避免内存泄漏
     */
    public unsubscribe(type: MessageType, handler: MessageHandler): void {
        const handlers = this.handlers.get(type);

        // 如果存在该消息类型的处理器集合
        if (handlers) {
            // 移除指定的处理器
            const existed = handlers.delete(handler);

            if (existed) {
                console.log(`[WebSocket] 取消订阅消息类型: ${String(type)}，剩余订阅数: ${handlers.size}`);
            }

            // 如果处理器集合为空，移除该消息类型的映射
            if (handlers.size === 0) {
                this.handlers.delete(type);
            }
        }
    }

    /**
     * 发送消息
     * @param data 要发送的数据（将自动序列化为JSON）
     *
     * 注意：只能在连接建立后发送消息
     */
    public send(data: any): void {
        // 检查连接状态
        if (this.isConnected) {
            try {
                // 序列化并发送消息
                const message = JSON.stringify(data);
                this.ws!.send(message);
                console.log('[WebSocket] 消息已发送:', data);
            } catch (error) {
                console.error('[WebSocket] 消息发送失败:', error, '原始数据:', data);
            }
        } else {
            console.warn('[WebSocket] 连接未就绪，消息未发送:', data);
            // 可选：实现消息队列，在连接恢复后重发
        }
    }

    /**
     * 手动关闭连接
     * @param code 关闭代码（默认1000，正常关闭）
     * @param reason 关闭原因（默认"用户请求关闭"）
     *
     * 应用场景：用户登出时调用
     */
    public close(code: number = 1000, reason: string = '用户请求关闭'): void {
        console.log(`[WebSocket] 关闭连接，代码: ${code}，原因: ${reason}`);

        // 如果WebSocket实例存在且处于打开状态
        if (this.ws) {
            this.ws.close(code, reason);
        }

        // 清除重连计时器
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // 停止心跳检测
        this.stopHeartbeat();

        // 重置状态
        this.isInitialized = false;
        this._connectionState = ConnectionState.CLOSED;
    }

    /**
     * 检查是否已连接
     * @returns boolean 已连接返回true
     */
    public get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // ==================== 私有方法 ====================

    /**
     * 建立WebSocket连接
     *
     * 内部逻辑：
     * 1. 验证URL是否设置
     * 2. 避免重复连接
     * 3. 清理旧连接（如果存在）
     * 4. 创建新连接并绑定事件处理器
     */
    private connect(): void {
        // 验证URL
        if (!this.url) {
            console.error('[WebSocket] 连接失败: URL未设置');
            return;
        }

        // 检查当前状态，避免重复连接
        if (this._connectionState === ConnectionState.CONNECTING ||
            this._connectionState === ConnectionState.OPEN) {
            console.log('[WebSocket] 已连接或正在连接，跳过');
            return;
        }

        // 清理旧连接（如果存在）
        if (this.ws) {
            this.cleanup();
        }

        // 更新连接状态
        this._connectionState = ConnectionState.CONNECTING;
        console.log('[WebSocket] 正在连接服务器...');

        try {
            // 创建WebSocket实例
            this.ws = new WebSocket(this.url, this.protocols);

            // 绑定事件处理器
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
        } catch (error) {
            console.error('[WebSocket] 连接创建失败:', error);
            // 启动重连机制
            this.scheduleReconnect();
        }
    }

    /**
     * 连接成功回调
     *
     * 内部逻辑：
     * 1. 重置重连计数器
     * 2. 更新连接状态
     * 3. 启动心跳检测
     * 4. 发送认证信息
     * 5. 分发连接建立事件
     */
    private handleOpen(): void {
        console.log('[WebSocket] 连接已建立');

        // 重置重连计数器
        this.reconnectAttempts = 0;

        // 更新连接状态
        this._connectionState = ConnectionState.OPEN;

        // 启动心跳检测
        this.startHeartbeat();

        // 分发连接建立事件
        this.dispatch(MessageTypes.WS_OPEN, {
            timestamp: Date.now(),
            url: this.url
        });
    }

    /**
     * 启动心跳检测
     *
     * 作用：
     * 1. 保持连接活跃，防止超时断开
     * 2. 检测连接是否存活
     *
     * 实现方式：
     * 定时发送PING消息，服务器应响应PONG
     */
    private startHeartbeat(): void {
        console.log('[WebSocket] 启动心跳检测');

        // 清除已有心跳定时器
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        // 设置新的心跳定时器
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                // 发送心跳包
                console.log('[WebSocket] 发送心跳包');
                this.send({
                    type: 'PING',
                    timestamp: Date.now()
                });
            } else {
                // 连接已断开，停止心跳
                this.stopHeartbeat();
            }
        }, this.heartbeatInterval);
    }

    /**
     * 停止心跳检测
     */
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            console.log('[WebSocket] 停止心跳检测');
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * 处理接收到的消息
     * @param event 消息事件对象
     *
     * 内部逻辑：
     * 1. 解析JSON格式消息
     * 2. 过滤心跳响应
     * 3. 分发到对应处理器
     */
    private handleMessage(event: MessageEvent): void {
        try {
            // 解析JSON格式的消息
            const message = JSON.parse(event.data);

            // 调试日志（生产环境应移除）
            console.debug('[WebSocket] 收到消息:', message);

            // 过滤心跳响应（不需要分发）
            if (message.type === 'PONG') {
                return;
            }

            // 分发消息给对应的处理器
            this.dispatch(message.type, message.data);
        } catch (error) {
            console.error(
                '[WebSocket] 消息解析错误:',
                error,
                '原始数据:',
                event.data
            );
        }
    }

    /**
     * 处理连接错误
     * @param error 错误事件对象
     *
     * 注意：此错误表示连接层错误，不是业务逻辑错误
     */
    private handleError(error: Event): void {
        console.error('[WebSocket] 连接错误:', error);
        // 分发错误事件
        this.dispatch(MessageTypes.WS_ERROR, {
            error,
            timestamp: Date.now()
        });
    }

    /**
     * 处理连接关闭
     * @param event 关闭事件对象
     *
     * 内部逻辑：
     * 1. 更新连接状态
     * 2. 停止心跳检测
     * 3. 清理资源
     * 4. 分发关闭事件
     * 5. 启动重连（如果是异常关闭）
     */
    private handleClose(event: CloseEvent): void {
        console.log(
            `[WebSocket] 连接关闭，代码: ${event.code}, ` +
            `原因: ${event.reason || '无'}, ` +
            `是否干净关闭: ${event.wasClean}`
        );

        // 更新连接状态
        this._connectionState = ConnectionState.CLOSED;

        // 停止心跳检测
        this.stopHeartbeat();

        // 清理资源
        this.cleanup();

        // 分发连接关闭事件
        this.dispatch(MessageTypes.WS_CLOSE, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            timestamp: Date.now()
        });

        // 如果是非正常关闭（非1000代码），启动重连
        if (event.code !== 1000) {
            console.log('[WebSocket] 非正常关闭，启动重连机制');
            this.scheduleReconnect();
        }
    }

    /**
     * 安排重连（使用指数退避算法）
     *
     * 指数退避算法：
     * 重连间隔 = min(基础间隔 * 2^尝试次数, 最大间隔)
     *
     * 特点：
     * - 首次重连快（1秒）
     * - 后续间隔指数增长（2秒, 4秒, 8秒...）
     * - 最大间隔30秒（避免过长等待）
     */
    private scheduleReconnect(): void {
        // 检查是否达到最大重连次数
        if (this.maxReconnectAttempts > 0 &&
            this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(
                `[WebSocket] 已达到最大重连次数 (${this.maxReconnectAttempts})，停止重连`
            );
            return;
        }

        // 清除之前的重连计时器
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // 计算重连间隔（指数退避）
        const reconnectDelay = Math.min(
            this.baseReconnectInterval * Math.pow(2, this.reconnectAttempts),
            30000 // 最大30秒
        );

        // 更新状态
        this._connectionState = ConnectionState.RECONNECTING;

        console.log(
            `[WebSocket] 将在 ${reconnectDelay}ms 后尝试重连 ` +
            `(尝试 ${this.reconnectAttempts + 1})`
        );

        // 设置重连计时器
        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, reconnectDelay);
    }

    /**
     * 清理资源
     *
     * 作用：安全关闭并释放WebSocket资源
     */
    private cleanup(): void {
        if (this.ws) {
            console.log('[WebSocket] 清理资源');

            // 移除所有事件监听器
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;

            // 如果连接处于打开状态，安全关闭
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close(1000, '正常关闭');
            }

            // 释放引用
            this.ws = null;
        }
    }

    /**
     * 分发消息到对应的处理器
     * @param type 消息类型
     * @param data 消息数据
     *
     * 内部逻辑：
     * 1. 查找对应消息类型的处理器集合
     * 2. 遍历并调用每个处理器
     * 3. 捕获并处理处理器中的异常
     */
    private dispatch(type: MessageType, data: any): void {
        // 获取对应消息类型的处理器集合
        const handlers = this.handlers.get(type);

        if (handlers) {
            console.debug(
                `[WebSocket] 分发消息类型: ${String(type)}，处理器数量: ${handlers.size}`
            );

            // 遍历并调用每个处理器
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(
                        `[WebSocket] 处理消息类型 ${String(type)} 时出错:`,
                        error
                    );
                }
            });
        }
    }
}

// ==================== 单例实例导出 ====================

/**
 * WebSocket客户端单例实例
 *
 * 使用方式：
 * import { wsClient } from '@/utils/websocket';
 */
export const wsClient = WebSocketClient.getInstance();

// ==================== 消息类型常量 ====================

/**
 * 预定义消息类型常量
 *
 * 使用方式：
 * import { MessageTypes } from '@/utils/websocket';
 * wsClient.subscribe(MessageTypes.NOTIFY_MESSAGE, ...);
 */
export const MessageTypes = {
    // 系统事件
    WS_OPEN: 'WS_OPEN',        // 连接建立事件
    WS_CLOSE: 'WS_CLOSE',      // 连接关闭事件
    WS_ERROR: 'WS_ERROR',      // 连接错误事件

    // 业务消息（根据实际需求扩展）
    NOTIFY_MESSAGE: 'NOTIFY_MESSAGE'      // 站内信

} as const;

// ==================== 公共辅助函数 ====================

/**
 * 初始化WebSocket连接（Token通过URL传递）
 * @param baseUrl WebSocket服务器基础地址（不含Token）
 * @param token 用户认证令牌
 */
export function initWebSocket(baseUrl: string, token: string): void {
    console.log(`[WebSocket] 初始化连接，基础URL: ${baseUrl}`);

    if (!wsClient.initialized) {
        wsClient.initialize(baseUrl, token);
    }

    wsClient.registerGlobalErrorHandler();
}

/**
 * 刷新WebSocket连接（当Token更新时调用）
 * @param newToken 新的认证令牌
 */
export function refreshWebSocketToken(newToken: string): void {
    wsClient.refreshToken(newToken);
}

/**
 * 关闭WebSocket连接（用户登出时调用）
 *
 * 执行操作：
 * 1. 关闭WebSocket连接
 * 2. 重置客户端状态
 */
export function closeWebSocket(): void {
    console.log('[WebSocket] 关闭连接请求');
    wsClient.close();
}

// ==================== 辅助工具函数 ====================

/**
 * 获取连接状态标签文本
 * @param state 连接状态
 * @returns 对应的状态文本
 */
export function getConnectionStateLabel(state: ConnectionState): string {
    const labels = {
        [ConnectionState.CONNECTING]: '连接中...',
        [ConnectionState.OPEN]: '已连接',
        [ConnectionState.CLOSING]: '关闭中...',
        [ConnectionState.CLOSED]: '已断开',
        [ConnectionState.RECONNECTING]: '重连中...'
    };

    return labels[state] || '未知状态';
}

/**
 * 获取连接状态CSS类名
 * @param state 连接状态
 * @returns 对应的CSS类名
 */
export function getConnectionStateClass(state: ConnectionState): string {
    const classes = {
        [ConnectionState.CONNECTING]: 'connecting',
        [ConnectionState.OPEN]: 'connected',
        [ConnectionState.CLOSING]: 'closing',
        [ConnectionState.CLOSED]: 'disconnected',
        [ConnectionState.RECONNECTING]: 'reconnecting'
    };

    return classes[state] || 'unknown';
}
