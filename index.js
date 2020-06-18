var cheerio = require('cheerio')
var slug = require('github-slugid')
var moment = require('moment')

// insert anchor link into section
function insertAnchors(content) {
    var $ = cheerio.load(content)
    $(':header').each(function(i, elem) {
        var header = $(elem)
        var id = header.attr('id')
        if (!id) {
            id = slug(header.text())
            header.attr('id', id)
        }
        header.prepend(
            '<a name="' +
                id +
                '" class="plugin-anchor" ' +
                'href="#' +
                id +
                '">' +
                '<i class="fa fa-link" aria-hidden="true"></i>' +
                '</a>'
        )
    })
    return $.html()
}

// insert page footer
function insertFooter(content, config) {
    var footerConfig = config['tbfed-pagefooter'] || {}
    var label = footerConfig['modify_label'] || 'File Modify: '
    var format = footerConfig['modify_format'] || 'YYYY-MM-DD HH:mm:ss'
    var copyRight = footerConfig['copyright'] || ''
    var copy = copyRight ? copyRight + ' all right reserved，powered by Gitbook' : 'powered by Gitbook'
    var copy = '<span class="copyright">' + copy + '</span>'
    var str =
        ' \n\n<footer class="page-footer">' +
        copy +
        '<span class="footer-modification">' +
        label +
        '\n{{file.mtime | date("' + format + '")}}\n</span></footer>'
        content = content + str
    return content
}

module.exports = {
    website: {
        assets: './assets',
        js: ['plugin.js'],
        css: ['plugin.css']
    },
    hooks: {
        init: function() {
            var pluginConfig = this.config.get('pluginsConfig')
            config = pluginConfig.config || {}
        },
        'page:before': function (page) {
            page.content = insertFooter(page.content, config)
            return page
        },
        page: function(page) {
            var config = this.config.get['pluginsConfig.config'] || {}
            page.content = insertAnchors(page.content)
            return page
        }
    },
    filters: {
        date: function(d, format) {
            return moment(d).format(format)
        }
    }
}
