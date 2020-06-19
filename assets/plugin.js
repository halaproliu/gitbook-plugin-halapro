var code, router, config
var timeouts = {}
const TERMINAL_HOOK = '**[terminal]'

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
                var folder = $(this).children('a').text().replace(/\s/g, '')
                url = resolve(baseUrl, folder)
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
    function formatBlockCode (block) {
        var terminalConfig = config.terminal || {}
        // 添加terminal样式
        // if (terminalConfig.style) {
        //     block.addClass('t-' + terminalConfig.style)
        // }
        // if (terminalConfig.fade) {
        //     block.addClass('t-fade')
        // }

        code = block.children('code')
        // 移除terminal hooks
        var text = code.html().replace(TERMINAL_HOOK + '\n', '')
        // 解析命令行样式
        text = parseTokens(text)
        lines = text.split('\n')

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

        if (config.code && config.code.copyButtons) {
            addCopyButton(wrapper)
        }
    }

    function parseTokens (text) {
        var regex = /\*\*\[(command|delimiter|error|path|prompt|warning) ((?:[^\]]+|\](?!\*\*|$)|)+)]/
        return text.replace(new RegExp(regex, 'gm'), function (match, token, value) {
            return '<span class="t-' + token + '">' + value + '</span>';
        });
    }

    function addCopyButton (wrapper) {
        wrapper.append(
            $('<i class="fa fa-clone t-copy"></i>').click(function () {
                copyCommand($(this))
            })
        )
    }

    function addCopyTextarea () {
        $('body').append('<textarea id="code-textarea" />')
    }

    function copyCommand (button) {
        pre = button.parent();
        textarea = $('#code-textarea');
        textarea.val(pre.text());
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        pre.focus();
        updateCopyButton(button);


        function updateCopyButton (button) {
            id = button.attr('data-command');
            button.removeClass('fa-clone').addClass('fa-check');

            // Clear timeout
            if (id in timeouts) {
                clearTimeout(timeouts[id]);
            }
            timeouts[id] = window.setTimeout(function () {
                button.removeClass('fa-check').addClass('fa-clone');
            }, 1000);
        }
    }

    gitbook.events.bind('start', function (e, pluginConfig) {
        config = initPlugin(pluginConfig)
        if (config.code && config.code.copyButtons) {
            addCopyTextarea()
        }
        var routerConfig = config.router
        router = new Router(routerConfig, $)
    })

    gitbook.events.bind('page.change', function () {
        // 添加代码块行号
        $('pre').each(function () {
            formatBlockCode($(this))
        })
        if (Object.keys(router.config).length > 0) {
            router.init()
        }
    })
})
