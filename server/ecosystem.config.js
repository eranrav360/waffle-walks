module.exports = {
  apps: [{
    name:          'waffle-walks',
    script:        'server.js',
    cwd:           '/home/ubuntu/waffle-walks/server',
    env_file:      '/home/ubuntu/waffle-walks/server/.env',
    restart_delay: 5000,
    max_restarts:  10,
    watch:         false,
  }],
};
