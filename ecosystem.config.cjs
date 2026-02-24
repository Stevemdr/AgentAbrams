module.exports = {
  apps: [{
    name: 'goodquestion-blog',
    script: './node_modules/.bin/serve',
    args: 'dist -l 9883',
    cwd: '/root/Projects/goodquestion-ai',
    env: { NODE_ENV: 'production' },
    max_memory_restart: '100M',
    error_file: '/root/Projects/goodquestion-ai/logs/error.log',
    out_file: '/root/Projects/goodquestion-ai/logs/out.log',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
  }],
};
