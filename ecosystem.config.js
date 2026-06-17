module.exports = {
  apps: [
    {
      name: "hlshajarah-staging",
      cwd: "/var/www/hlshajarah",
      script: "./node_modules/.bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      max_memory_restart: "1G",
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      max_restarts: 5,
      min_uptime: "10s",
      merge_logs: true,
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      err_file: "./logs/err.log",
      time: true,
    },
  ],
};
