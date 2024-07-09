module.exports = {
  apps: [
    {
      name: 'alfamon',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};

