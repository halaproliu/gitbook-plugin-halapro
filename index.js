module.exports = {
    website: {
        assets: './assets',
        js: ['plugin.js'],
        css: ['plugin.css']
    },
    hooks: {
        'init': function () {
            var pluginConfig = this.config.get('pluginsConfig')
            config = pluginConfig.config || {}
        }
    }
}
