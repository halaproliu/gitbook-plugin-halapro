var code, router, config

timeouts = {}
function Code (config, $) {
    this.config = config || {}
    this.$ = $
}

Code.prototype.init = function (block) {
    code = block.children('code')
    lines = code.html().split('\n')

    if (lines[lines.length - 1] == '') {
        lines.splice(-1, 1)
    }

    if (lines.length > 1) {
        lines = lines.map(line => {
            if (/\/\*\*/.test(line)) {
                return '<span class="code-line">' + line + '</span></span>'
            } else if (/\*\//.test(line)) {
                return '<span class="code-line"><span class="token comment">' + line + '</span>'
            } else {
                return (
                    '<span class="code-line"><span class="token comment">' +
                    line +
                    '</span></span>'
                )
            }
        })
        code.html(lines.join('\n'))
    }

    // Add wrapper to pre element
    wrapper = block.wrap('<div class="code-wrapper"></div>')

    if (this.config.copyButtons) {
        this.addCopyButton(wrapper, this.$)
    }
}

Code.prototype.addCopyButton = function (wrapper, $) {
    var vm = this
    wrapper.append(
        $('<i class="fa fa-clone t-copy"></i>').click(function () {
            vm.copyCommand($(this))
        })
    )
}

Code.prototype.updateCopyButton = function (button) {
    id = button.attr('data-command')
    button.removeClass('fa-clone').addClass('fa-check')

    // Clear timeout
    if (id in timeouts) {
        clearTimeout(timeouts[id])
    }
    timeouts[id] = window.setTimeout(function () {
        button.removeClass('fa-check').addClass('fa-clone')
    }, 1000)
}

Code.prototype.addCopyTextarea = function () {
    if (this.config.copyButtons) {
        this.$('body').append('<textarea id="code-textarea" />')
    }
}

function Router (config, $) {
    this.config = config || {}
    this.$ = $
    this.baseUrl = this.config.baseUrl
}

Router.prototype.init = function () {
    var vm = this
    var $ = this.$
    var baseUrl = vm.baseUrl
    var regex = /^(\.\.\/)?((\w*)\/)?([\w|\.|-]*\.\w*)?$/
    $('.chapter').each(function () {
        var path = $(this).attr('data-path')
        var url = ''
        if (path) {
            if (path === './') { // 一级标题
                url = resolve(baseUrl)
            } else if (path === '../') {
                var folder = $(this).children('a').text().replace(/\s/g, '')
                if (folder !== 'Introduction') {
                    url = resolve(baseUrl, folder)
                } else {
                    url = resolve(baseUrl)
                }
            } else {
                var folder = path.replace(regex, '$3')
                var filename = path.replace(regex, '$4')
                url = resolve(baseUrl, folder, filename)
            }
            $(this).attr('data-path', url)
            $(this).children('a').attr('href', url)
        }
    })
}

function resolve (baseUrl, folder, filename) {
    if (folder && filename) {
        return [baseUrl, folder, filename].join('/')
    } else if (folder && !filename) {
        return [baseUrl, folder, 'index.html'].join('/')
    } else if (!folder && !filename) {
        return [baseUrl, 'index.html'].join('/')
    }
}

function initPlugin (pluginConfig) {
    var config = pluginConfig.config
    return config || {}
}

require(['gitbook', 'jQuery'], function (gitbook, $) {
    gitbook.events.bind('start', function (e, pluginConfig) {
        config = initPlugin(pluginConfig)
        code = new Code(config.code, $)
        code.addCopyTextarea()
        var routerConfig = config.router
        router = new Router(routerConfig, $)
    })

    gitbook.events.bind('page.change', function () {
        // 添加代码块行号
        $('pre').each(function () {
            code.init($(this))
        })
        if (Object.keys(router.config).length > 0) {
            router.init()
        }
    })
})
