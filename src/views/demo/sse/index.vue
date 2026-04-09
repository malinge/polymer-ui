<template>
    <div>
        <h1>实时消息推送</h1>
        <ul>
            <li v-for="(message, index) in messages" :key="index">{{ message }}</li>
        </ul>
    </div>
</template>

<script>
    import { ref, onMounted, onUnmounted } from 'vue';

    export default {
        setup() {
            const messages = ref([]);
            let eventSource = null;

            const initSSE = () => {
                eventSource = new EventSource('http://localhost:8081/polymer/message/sse/connect/1');

                eventSource.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    messages.value.push(`${data.agentName}: ${data.msg}`);
                };

                eventSource.onerror = (error) => {
                    console.error('SSE error:', error);
                    eventSource.close();
                };
            };

            onMounted(() => {
                initSSE();
            });

            onUnmounted(() => {
                if (eventSource) {
                    eventSource.close();
                }
            });

            return {
                messages
            };
        }
    };
</script>

<style scoped>
    h1 {
        color: #333;
    }
    ul {
        list-style-type: none;
        padding: 0;
    }
    li {
        background: #eee;
        margin: 5px 0;
        padding: 10px;
        border-radius: 5px;
    }
</style>
