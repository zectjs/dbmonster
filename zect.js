/**
* Zect v1.2.0
* (c) 2015 guankaishe
* Released under the MIT License.
*/
(function webpackUniversalModuleDefinition(root, factory) {
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define(factory);
    else if(typeof exports === 'object')
        exports["Zect"] = factory();
    else
        root["Zect"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/    // The module cache
/******/    var installedModules = {};

/******/    // The require function
/******/    function __webpack_require__(moduleId) {

/******/        // Check if module is in cache
/******/        if(installedModules[moduleId])
/******/            return installedModules[moduleId].exports;

/******/        // Create a new module (and put it into the cache)
/******/        var module = installedModules[moduleId] = {
/******/            exports: {},
/******/            id: moduleId,
/******/            loaded: false
/******/        };

/******/        // Execute the module function
/******/        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/        // Flag the module as loaded
/******/        module.loaded = true;

/******/        // Return the exports of the module
/******/        return module.exports;
/******/    }


/******/    // expose the modules object (__webpack_modules__)
/******/    __webpack_require__.m = modules;

/******/    // expose the module cache
/******/    __webpack_require__.c = installedModules;

/******/    // __webpack_public_path__
/******/    __webpack_require__.p = "";

/******/    // Load entry module and return exports
/******/    return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

    module.exports = __webpack_require__(1)

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

    'use strict';

    var $ = __webpack_require__(2)
    var is = __webpack_require__(3)
    var Mux = __webpack_require__(4)
    var util = __webpack_require__(5)
    var conf = __webpack_require__(6)
    var execute = __webpack_require__(7)
    var Compiler = __webpack_require__(8)
    var Expression = __webpack_require__(9)

    var Directive = Compiler.Directive
    var AttributeDirective = Compiler.Attribute
    var TextDirective = Compiler.Text
    var ElementDirective = Compiler.Element


    /**
     *  private vars
     */
    var buildInDirts = __webpack_require__(10)(Zect)  // preset directives getter
    var elements = __webpack_require__(11)(Zect)      // preset directives getter
    var allDirectives = [buildInDirts, {}]                // [preset, global]
    var gdirs = allDirectives[1]
    var gcomps = {}                                 // global define components

    var _isExpr = Expression.isExpr
    /**
     *  Global API
     */
    function Zect(options) {
        var insOpt = _mergeMethodMixins([options])
        return ViewModel.call(this, insOpt)
    }
    Zect.extend = function(options) {
        function Class(opt) {
            var insOpt = _mergeMethodMixins([options, opt])
            /**
             *  Prototype inherit
             */
            return ViewModel.call(this, insOpt)
        }
        _inherit(Class, Zect)
        return Class
    }
    Zect.component = function(id, definition) {
        var Comp = Zect.extend(definition)
        gcomps[id.toLowerCase()] = Comp
        return Comp
    }
    Zect.directive = function(id, definition) {
        gdirs[id] = definition
    }
    Zect.namespace = function(ns) {
        conf.namespace = ns
    }

    _inherit(Zect, Compiler)

    /*******************************
          ViewModel Constructor
    *******************************/
    function ViewModel(options) {
        // inherit Compiler

        var vm = this
        var el = options.el
        var components = [gcomps, options.components || {}]
        var directives = allDirectives.concat([options.directives || {}])

        var _directives = [] // local refs for all directives instance of the vm    
        var _components = [] // local refs for all components    
        var NS = conf.namespace
        var componentProps = [NS + 'component', NS + 'data', NS + 'methods', NS + 'ref']
        var $childrens = options.$childrens

        // set $parent ref
        vm.$parent = options.$parent || null

        /**
         *  Mounted element detect
         */
        if (el && options.template) {
            el.innerHTML = options.template
        } else if (options.template) {
            el = document.createElement('div')
            el.innerHTML = options.template
        } else if (util.type(el) == 'string') {
            el = document.querySelector(el)
        } else if (!is.Element(el)) {
            throw new Error('Unmatch el option')
        }
        // replace "$NS-template" of actual instance's DOM  
        if (el.children.length == 1 && el.firstElementChild.tagName.toLowerCase() == (NS + 'template')) {
            var $holder = el.firstElementChild
            var childNodes = _slice($holder.childNodes)
            var attributes = _slice($holder.attributes)

            el.removeChild($holder)
            /**
             *  Migrate childNodes
             */
            $(childNodes).appendTo(el)
            /**
             *  Merge attributes
             */
            attributes.forEach(function (att) {
                var nv
                if (att.name == 'class') {
                    nv = att.value + (el.className 
                                        ? ' ' + el.className 
                                        : '')

                } else if (!el.hasAttribute(att.name)) {
                    nv = att.value
                } else {
                    return
                }
                el.setAttribute(att.name, nv)
            })
        }
        // content insertion
        var points = _slice(el.querySelectorAll('content'))
        if (points) {
            var $con
            if ($childrens && $childrens.length) {
                $con = document.createDocumentFragment()
                _slice($childrens).forEach(function (n) {
                    $con.appendChild(n)
                })
            }
            points.forEach(function (p) {
                if (!$childrens || !$childrens.length) {
                    return $(p).remove()
                }
                var $p = $(p)
                var select = $p.attr('select')
                var tar
                var ind

                if (select 
                    && (tar = $con.querySelector(select)) 
                    && ~(ind = $childrens.indexOf(tar)) ) {

                    $p.replace(tar)
                    $childrens.splice(ind, 1)
                } else if (!select) {
                    $p.replace($con)
                    $childrens = null
                }
            })
        }

        vm.$el = el

        /**
         *  get component define by tagName
         */
        vm.$component = getComponent

        /**
         *  Component instance refs
         */
        vm.$refs = {}

        /**
         *  assign methods
         */
        var methods = {}
        util.objEach(options.methods, function(k, v) {
            if (util.type(v) !== 'function') return console.warn(k + ' is not a function.')
            vm[k] = methods[k] = v.bind(vm)
        })
        vm.$methods = methods

        var $data
        var dataOpt = {}

        Object.defineProperty(vm, '$data', {
            enumerable: true,
            get: function() {
                // $data will be undefined in created calling, so using dataOpt as temporary
                return $data || dataOpt
            },
            set: function(v) {
                $data.$set(v)
            }
        })
        vm.$set = function () {
            $data.$set.apply($data, arguments)
        }
        vm.$get = function () {
            return $data.$get.apply($data, arguments)
        }
        vm.$watch = function (/*[ keypath ], */fn) {
            // if (util.type(fn) !== 'function') return console.warn('Listener handler is not a function.')
            return $data.$watch.apply($data, arguments)
        }
        vm.$unwatch = function (/*[ keypath ], */fn) {
            return $data.$unwatch.apply($data, arguments)
        }
        if (options.$data) {
            $data = options.$data
            // if state model instance passsing, call after set
            options.created && options.created()
        } else {
            // Call before vm-$data instance
            options.created && options.created()

            util.merge(dataOpt, _funcOrObject(options, 'data'))
            
            // Instance observable state model
            var mopts = {
                props: dataOpt,
                computed: options.computed,
                computedContext: vm
            }
            $data = new Mux(mopts)
        }

        /**
         *  DOM Compile
         *  @TODO the unique interface for a compiled node($el, $remove)
         */
        vm.$compile = function (el, scope) {
            var compiler
            var id = 0
            util.walk(el, function (node) {
                var isRoot = node === el
                var result = compile(node, scope, isRoot)
                if (isRoot) compiler = result.inst
                return result.into
            })
            return compiler
        }

        var beforeDestroy = options.destroy
        vm.$destroy = function () {
            if (vm.$destroyed) return
            beforeDestroy && beforeDestroy.call(vm)

            ;[_components, _directives].forEach(function (items) {
                items.forEach(function (inst) {
                    inst.$destroy()
                })
            })

            $data.$destroy()

            // instance methods/properties
            vm.$el = null
            vm.$get = null
            vm.$set = null
            vm.$refs = null
            vm.$watch = null
            vm.$unwatch = null
            vm.$compile = null
            vm.$component = null

            // private vars
            directives = null
            components = null
            _directives = null
            _components = null

            // marked
            vm.$destroyed = true
        }
        vm.$compiler = vm.$compile(el)

        /**
         *  Call ready after compile
         */
        options.ready && options.ready.call(vm)

        function _setBindings2Scope (scope, ref) {
            scope && scope.bindings && (scope.bindings.push(ref))
        }

        function compile (node, scope, isRoot) {
            /**
             *  1. ELEMENT_NODE; 
             *  2. ATTRIBUTE_NODE; 
             *  3. TEXT_NODE; 
             *  8. COMMENT_NODE; 
             *  9. DOCUMENT_NODE; 
             *  11. DOCUMENT_FRAGMENT;
             */
            var into = true
            var inst
            switch (node.nodeType) {
                case 1:
                    node = compilePseudoDirectiveElement(node)
                    /**
                     *  scope syntax
                     */
                    if (inst = compileElement(node, scope, isRoot)) {
                        into = false
                        break
                    }
                    /**
                     *  Attribute directive
                     */
                    compileDirective(node, scope)
                    /**
                     *  Compile custom-element
                     */
                    if (inst = compileComponent(node, vm, scope, isRoot)) {
                        // inst = new Compiler(node)
                        into = false
                        break
                    }
                    break
                case 3:
                    inst = compileText(node, vm, scope, isRoot)
                    into = false
                    break
                case 11:
                    // document fragment
                    break
                default:
                    into = false
            }
            return {
                into: !!into,
                inst: !inst && isRoot ? new Compiler(node) : inst
            }
        }

        function compilePseudoDirectiveElement (node) {
            var repeatAttName = NS + 'repeat'
            var ifAttName = NS + 'if'
            var valueAttName
            var matchedAttName

            if (node.hasAttribute(ifAttName)) {
                matchedAttName = ifAttName
                valueAttName = 'is'
            } else if (node.hasAttribute(repeatAttName)) {
                matchedAttName = repeatAttName
                valueAttName = 'items'
            } else {
                return node
            }
            var attValue = node.getAttribute(matchedAttName)
            var blockNode = document.createElement(matchedAttName)
            node.removeAttribute(matchedAttName)
            node.parentNode && node.parentNode.replaceChild(blockNode, node)
            blockNode.appendChild(node)
            blockNode.setAttribute(valueAttName, attValue)

            while(node.hasAttribute(ifAttName) || node.hasAttribute(repeatAttName)) {
                compilePseudoDirectiveElement(node)
            }
            return blockNode
        }

        /**
         *  Reverse component Constructor by tagName
         */
        function getComponent(tn) {
            var cid = tn.toLowerCase()
            var compDef
            components.some(function (comp) {
                if (comp.hasOwnProperty(cid)) {
                    compDef = comp[cid]
                    return true
                }
            })
            return compDef
        }
        /**
         *  Compile element for block syntax handling
         */
        function compileElement(node, scope, isRoot) {
            var tagName = node.tagName
            switch(true) {
                /**
                 *  <*-if></*-if>
                 */
                case is.IfElement(tagName):
                    var inst = new ElementDirective(
                            vm, 
                            scope,
                            node, 
                            elements['if'], 
                            NS + 'if', 
                            $(node).attr('is')
                    )
                    if (!isRoot) {
                        inst.$mount(node)
                    }
                    // save elements refs
                    _directives.push(inst)
                    // save bindins to scope
                    _setBindings2Scope(scope, inst)
                    return inst
                /**
                 *  <*-repeat></*-repeat>
                 */
                case is.RepeatElement(tagName):
                    var inst = new ElementDirective(
                            vm, 
                            scope,
                            node, 
                            elements['repeat'],
                            NS + 'repeat', 
                            $(node).attr('items')
                    )
                    if (!isRoot) {
                        inst.$mount(node)
                    }
                    _directives.push(inst)
                    _setBindings2Scope(scope, inst)
                    return inst
            }
        }

        /**
         *  comment
         */
        function compileComponent (node, parentVM, scope) {
            var $node = $(node)
            var cAttName = NS + 'component'
            var CompName = $node.attr(cAttName) || node.tagName
            var Comp = getComponent(CompName)

            /**
             *  Tag is not a custom component element
             */
            if (!Comp) return
            $node.removeAttr(cAttName)

            // don't need deep into self
            if (node === parentVM.$el) return
            // suport expression, TBD
            var ref = $(node).attr(NS + 'ref')
            var dAttName = NS + 'data'
            var mAttName = NS + 'methods'

            var dataExpr = $node.attr(dAttName)
            var methods = $node.attr(mAttName)

            $node.removeAttr(dAttName).removeAttr(mAttName)

            var _isDataExpr = _isExpr(dataExpr)
            var bindingData
            var bindingMethods
            /**
             *  Watch
             */
            var execLiteral = Expression.execLiteral
            var ast = {}
            var revealAst = {}
            var compVM

            function _parseExpr (expr) {
                var name
                var expr = expr.replace(/^[^:]+:/, function (m) {
                                name = m.replace(/:$/, '').trim()
                                return ''
                            }).trim()
                return {
                    name: name,
                    expr: expr,
                    vars: Expression.extract(expr)
                }
            }
            function _setBindingObj (expr) {
                var r = _parseExpr(expr)
                ast[r.name] = r
                ;(r.vars || []).forEach(function (v) {
                    ;!revealAst[v] && (revealAst[v] = [])
                    ;!~revealAst[v].indexOf(r.name) && revealAst[v].push(r.name)
                })
            }

            var bindingData = execLiteral(dataExpr, parentVM, scope)
            var bindingMethods = execLiteral(methods, parentVM, scope) // --> bindingMethods
            
            compVM = new Comp({
                el: node,
                data: bindingData,
                methods: bindingMethods,
                $parent: parentVM,
                $childrens: _slice(node.childNodes)
            })

            var plainDataExpr = _isDataExpr ? Expression.strip(dataExpr) : ''
            var sep = Expression.sep

            if (plainDataExpr) {
                if (plainDataExpr.match(sep)) {
                    plainDataExpr.replace(new RegExp(sep + '\\s*$'), '') // trim last seperator
                           .split(sep)
                           .forEach(_setBindingObj)
                } else {
                    _setBindingObj(plainDataExpr)
                }
            }
            // watch and binding
            if (_isDataExpr) {
                parentVM.$data.$watch(function (keyPath) {
                    var nextState
                    util.objEach(revealAst, function (varName, bindingNames) {
                        if (keyPath.indexOf(varName) === 0) {
                            ;!nextState && (nextState = {})
                            bindingNames.forEach(function (n) {
                                nextState[n] = execute(parentVM, scope, ast[n].expr)
                            })
                        }
                    })
                    nextState && compVM.$set(nextState)
                })
            }
            // set ref to parentVM
            ref && (parentVM.$refs[ref] = compVM)

            _components.push(compVM)
            _setBindings2Scope(scope, compVM)
            // TBM -- to be modify, instance method should not be attached here
            compVM.$update = function () {
                _isDataExpr && compVM.$set(execLiteral(dataExpr, parentVM, scope))
            }
            return compVM
        }

        /**
         *  Compile attributes to directive
         */
        function compileDirective (node, scope) {
            var value = node.nodeValue
            var attrs = _slice(node.attributes)
            var ast = {
                    attrs: {},
                    dires: {}
                }

            /**
             *  attributes walk
             */
            attrs.forEach(function(att) {
                var aname = att.name
                var v = att.value
                // parse att
                if (~componentProps.indexOf(aname)) {
                    return
                }else if (_isExpr(aname)) {
                    // variable attribute name
                    ast.attrs[aname] = v
                } else if (aname.indexOf(NS) === 0) {
                    // directive
                    ast.dires[aname] = v
                } else if (_isExpr(v.trim())) {
                    // named attribute with expression
                    ast.attrs[aname] = v
                } else {
                    return
                }
                node.removeAttribute(aname)
            })

            /**
             *  Attributes binding
             */
            util.objEach(ast.attrs, function(name, value) {
                var attd = new AttributeDirective(vm, scope, node, name, value)
                _directives.push(attd)
                _setBindings2Scope(scope, attd)
            })

            /**
             *  Directives binding
             */
            directives.forEach(function(group) {
                util.objEach(group, function(id, def) {
                    var dname = NS + id
                    var expr = ast.dires[dname]

                    if (ast.dires.hasOwnProperty(dname)) {
                        var sep = ';'
                        var d
                        // multiple defines expression parse
                        if (def.multi && expr.match(sep)) {
                            Expression.strip(expr)
                                    .split(sep)
                                    .forEach(function(item) {
                                        // discard empty expression 
                                        if (!item.trim()) return
                                        
                                        d = new Directive(vm, scope, node, def, dname, '{' + item + '}')
                                        _directives.push(d)
                                        _setBindings2Scope(scope, d)
                                    })
                        } else {
                            d = new Directive(vm, scope, node, def, dname, expr)
                            _directives.push(d)
                            _setBindings2Scope(scope, d)
                        }
                    }
                })
            })
        }

        function compileText (node, vm, scope) {
            var originExpr = node.nodeValue
            var v = Expression.veil(originExpr)
            var exprReg = Expression.exprRegexp

            var parts = v.split(exprReg)
            var exprs = v.match(exprReg)

            var inst
            // expression match or not
            if (exprs && exprs.length) {
                inst = new TextDirective(vm, scope, node, originExpr, parts, exprs)
                _directives.push(inst)
                _setBindings2Scope(scope, inst)
            }
            return inst
        }
    }

    /**
     *  private functions
     */
    function _slice (obj) {
        if (!obj) return obj
        return [].slice.call(obj)
    }
    function _funcOrObject(obj, prop) {
        var tar = obj[prop]
        return util.type(tar) == 'function' ? tar.call(obj):tar
    }
    function _extend (args) {
        return util.extend.apply(util, args)
    }
    function _inherit (Ctor, Parent) {
        var proto = Ctor.prototype
        Ctor.prototype = Object.create(Parent.prototype)
        return proto
    }
    function _mergeOptions (opts) {
        var dest = {}
        _extend([dest].concat(opts))
        ;['data', 'methods', 'directives', 'components'].forEach(function (prop) {
            dest[prop] = _extend([{}].concat(opts.map(function (opt) {
                return _funcOrObject(opt, prop)
            })))
        })
        return dest
    }
    function _mergeMethodMixins (optMixins) {
        var mixins = []
        /**
         *  Merge option mixins
         */
        optMixins.forEach(function (o) {
            if (o) {
                mixins.push(o)
                o.mixins && (mixins = mixins.concat(o.mixins))
            }
        })
        var insOpt = _mergeOptions(mixins)
        /**
         *  Merge method mixins
         */
        var m = insOpt.methods = insOpt.methods || {}
        optMixins.forEach(function (o) {
            var mxs = o && o.methods && o.methods.mixins
            if (mxs) {
                mxs.forEach(function (mx) {
                    util.objEach(mx, function (k, v) {
                        if (k !== 'mixins') m[k] = v
                    })
                })
            }
        })
        delete insOpt.methods.mixins
        return insOpt
    }

    module.exports = Zect


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

    /**
     *  DOM manipulations
     */

    'use strict';
    var util = __webpack_require__(5)
    var is = __webpack_require__(3)

    function Selector(sel) {
        if (util.type(sel) == 'string') {
            return Shell(util.copyArray(document.querySelectorAll(sel)))
        }
        else if (util.type(sel) == 'array') {
            return Shell(sel)
        }
        else if (sel instanceof Shell) return sel
        else if (is.DOM(sel)) {
            return Shell(new ElementArray(sel))
        }
        else {
            throw new Error('Unexpect selector !')
        }
    }

    function Shell(nodes) {
        if (nodes instanceof Shell) return nodes
        var $items = new ElementArray()
        nodes.forEach(function (item) {
            $items.push(item)
        })
        return $items
    }

    function ElementArray () {
        this.push = function () {
            Array.prototype.push.apply(this, arguments)
        }
        this.forEach = function () {
            Array.prototype.forEach.apply(this, arguments)
        }
        this.push.apply(this, arguments)
    }

    ElementArray.prototype = Object.create(Shell.prototype)

    var proto = Shell.prototype
    proto.find = function(sel) {
        var subs = []
        this.forEach(function(n) {
            subs = subs.concat(util.copyArray(n.querySelectorAll(sel)))
        })
        return Shell(subs)
    }
    proto.attr = function(attname, attvalue) {
        var len = arguments.length
        var el = this[0]

        if (len > 1) {
            el.setAttribute(attname, attvalue)
        } else if (len == 1) {
            return (el.getAttribute(attname) || '').toString()
        }
        return this
    }
    proto.removeAttr = function(attname) {
        this.forEach(function(el) {
            el.removeAttribute(attname)
        })
        return this
    }
    proto.addClass = function(clazz) {
        this.forEach(function(el) {

            // IE9 below not support classList
            // el.classList.add(clazz)

            var classList = el.className.split(' ')
            if (!~classList.indexOf(clazz)) classList.push(clazz)
            el.className = classList.join(' ')
        })
        return this
    }
    proto.removeClass = function(clazz) {
        this.forEach(function(el) {
            
            // IE9 below not support classList
            // el.classList.remove(clazz)

            var classList = el.className.split(' ')
            var index = classList.indexOf(clazz)
            if (~index) classList.splice(index, 1)
            el.className = classList.join(' ')
        })
        return this
    }
    proto.each = function(fn) {
        this.forEach(fn)
        return this
    }
    proto.on = function(type, listener, capture) {
        this.forEach(function(el) {
            el.addEventListener(type, listener, capture)
        })
        return this
    }
    proto.off = function(type, listener) {
        this.forEach(function(el) {
            el.removeEventListener(type, listener)
        })
        return this
    }
    proto.html = function(html) {
        var len = arguments.length
        if (len >= 1) {
            this.forEach(function(el) {
                el.innerHTML = html
            })
        } else if (this.length) {
            return this[0].innerHTML
        }
        return this
    }
    proto.parent = function() {
        if (!this.length) return null
        return Shell([_parentNode(this[0])])
    }
    proto.remove = function() {
        this.forEach(function(el) {
            var parent = _parentNode(el)
            parent && parent.removeChild(el)
        })
        return this
    }
    proto.insertBefore = function (pos) {
        var tar
        if (!this.length) return this
        else if (this.length == 1) {
            tar = this[0]
        } else {
            tar = _createDocumentFragment()
            this.forEach(function (el) {
                _appendChild(tar, el)
            })
        }
        _parentNode(pos).insertBefore(tar, pos)
        return this
    }
    proto.insertAfter = function (pos) {
        var tar
        if (!this.length) return this
        else if (this.length == 1) {
            tar = this[0]
        } else {
            tar = _createDocumentFragment()
            this.forEach(function (el) {
                _appendChild(tar, el)
            })
        }
        _parentNode(pos).insertBefore(tar, pos.nextSibling)
        return this
    }
    // return element by index
    proto.get = function(i) {
        return this[i]
    }
    proto.append = function(n) {
        if (this.length) _appendChild(this[0], n)
        return this
    }
    proto.appendTo = function (p) {
        if (this.length == 1) _appendChild(p, this[0])
        else if (this.length > 1) {
            var f = _createDocumentFragment()
            this.forEach(function (n) {
                _appendChild(f, n)
            })
            _appendChild(p, f)
        }
    }
    proto.replace = function(n) {
        var tar = this[0]
        _parentNode(tar).replaceChild(n, tar)
        return this
    }

    function _parentNode (e) {
        return e && e.parentNode
    }

    function _createDocumentFragment () {
        return document.createDocumentFragment()
    }

    function _appendChild (p, c) {
        return p.appendChild(c)
    }
    module.exports = Selector


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

    'use strict';
    var conf = __webpack_require__(6)
    module.exports = {
        Element: function(el) {
            return el instanceof HTMLElement || el instanceof DocumentFragment
        },
        DOM: function (el) {
            return this.Element(el) || el instanceof Comment
        },
        IfElement: function(tn) {
            return tn == (conf.namespace + 'if').toUpperCase()
        },
        RepeatElement: function(tn) {
            return tn == (conf.namespace + 'repeat').toUpperCase()
        }
    }

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

    /**
    * Mux.js v2.4.13
    * (c) 2014 guankaishe
    * Released under the MIT License.
    */
    (function webpackUniversalModuleDefinition(root, factory) {
        if(true)
            module.exports = factory();
        else if(typeof define === 'function' && define.amd)
            define(factory);
        else if(typeof exports === 'object')
            exports["Mux"] = factory();
        else
            root["Mux"] = factory();
    })(this, function() {
    return /******/ (function(modules) { // webpackBootstrap
    /******/    // The module cache
    /******/    var installedModules = {};
    /******/
    /******/    // The require function
    /******/    function __webpack_require__(moduleId) {
    /******/
    /******/        // Check if module is in cache
    /******/        if(installedModules[moduleId])
    /******/            return installedModules[moduleId].exports;
    /******/
    /******/        // Create a new module (and put it into the cache)
    /******/        var module = installedModules[moduleId] = {
    /******/            exports: {},
    /******/            id: moduleId,
    /******/            loaded: false
    /******/        };
    /******/
    /******/        // Execute the module function
    /******/        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/        // Flag the module as loaded
    /******/        module.loaded = true;
    /******/
    /******/        // Return the exports of the module
    /******/        return module.exports;
    /******/    }
    /******/
    /******/
    /******/    // expose the modules object (__webpack_modules__)
    /******/    __webpack_require__.m = modules;
    /******/
    /******/    // expose the module cache
    /******/    __webpack_require__.c = installedModules;
    /******/
    /******/    // __webpack_public_path__
    /******/    __webpack_require__.p = "";
    /******/
    /******/    // Load entry module and return exports
    /******/    return __webpack_require__(0);
    /******/ })
    /************************************************************************/
    /******/ ([
    /* 0 */
    /***/ function(module, exports, __webpack_require__) {

        'use strict';

        module.exports = __webpack_require__(1)


    /***/ },
    /* 1 */
    /***/ function(module, exports, __webpack_require__) {

        'use strict';

        /**
         *  External module's name startof "$"
         */
        var $Message = __webpack_require__(2)
        var $keypath = __webpack_require__(3)
        var $arrayHook = __webpack_require__(4)
        var $info = __webpack_require__(5)
        var $util = __webpack_require__(6)
        var $normalize = $keypath.normalize
        var $join = $keypath.join
        var $type = $util.type
        var $indexOf = $util.indexOf
        var $hasOwn = $util.hasOwn
        var $warn = $info.warn

        /**
         *  CONTS
         */
        var STRING = 'string'
        var ARRAY = 'array'
        var OBJECT = 'object'
        var FUNCTION = 'function'
        var CHANGE_EVENT = 'change'

        var _id = 0
        function allotId() {
            return _id ++
        }

        /**
         *  Mux model constructor
         *  @public
         */
        function Mux(options) {
            // static config checking
            options = options || {}
            Ctor.call(this, options)
        }

        /**
         *  Mux model creator 
         *  @public
         */
        Mux.extend = function(options) {
            return MuxFactory(options || {})
        }

        /**
         *  Mux global config
         *  @param conf <Object>
         */
        Mux.config = function (conf) {
            if (conf.warn === false) $info.disable()
            else $info.enable()
        }

        /**
         *  Create a emitter instance
         *  @param `Optional` context use for binding "this"
         */
        Mux.emitter = function (context) {
            return new $Message(context)
        }

        /**
         *  Expose Keypath API
         */
        Mux.keyPath = $keypath
        Mux.utils = $util

        /**
         *  Mux model factory
         *  @private
         */
        function MuxFactory(options) {

            function Class (receiveProps) {
                Ctor.call(this, options, receiveProps)
            }
            Class.prototype = Object.create(Mux.prototype)
            return Class
        }
        /**
         *  Mux's model class, could instance with "new" operator or call it directly.
         *  @param receiveProps <Object> initial props set to model which will no trigger change event.
         */
        function Ctor(options, receiveProps) {
            var model = this
            var emitter = options.emitter || new $Message(model) // EventEmitter of this model, context bind to model
            var _emitter = options._emitter || new $Message(model)
            var _computedCtx = $hasOwn(options, 'computedContext') ? options.computedContext : model
            var __kp__ = options.__kp__
            var __muxid__ = allotId()
            var _isExternalEmitter =  !!options.emitter
            var _isExternalPrivateEmitter =  !!options._emitter
            var _destroy // interanl destroyed flag
            var _priavateProperties = {}

            _defProvateProperty('__muxid__', __muxid__)
            _defProvateProperty('__kp__', __kp__)
            /**
             *  return current keypath prefix of this model
             */
            function _rootPath () {
                return __kp__ || ''
            }

            /**
             *  define priavate property of the instance object
             */
            function _defProvateProperty(name, value) {
                _priavateProperties[name] = value
                $util.def(model, name, {
                    enumerable: false,
                    value: value
                })
            }

            var getter = options.props

            /**
             *  Get initial props from options
             */
            var _initialProps = {}
            var _t = $type(getter)
            if (_t == FUNCTION) {
                _initialProps = getter()
            } else if (_t == OBJECT) {
                _initialProps = getter
            }
            // free
            getter = null

            var _initialComputedProps = options.computed
            var _computedProps = {}
            var _computedKeys = []
            var _cptDepsMapping = {} // mapping: deps --> props
            var _cptCaches = {} // computed properties caches
            var _observableKeys = []
            var _props = {} // all observable properties {propname: propvalue}

            /**
             *  Observe initial properties
             */
            $util.objEach(_initialProps, function (pn, pv) {
                _$add(pn, pv, true)
            })
            _initialProps = null

            /**
             *  Define initial computed properties
             */
            $util.objEach(_initialComputedProps, function (pn, def) {
                _$computed(pn, def.deps, def.get, def.set, def.enum)
            })
            _initialComputedProps = null


            /**
             *  batch emit computed property change
             */
            _emitter.on(CHANGE_EVENT, function (kp) {
                var willComputedProps = []
                var mappings = []

                if (!Object.keys(_cptDepsMapping).length) return

                while(kp) {
                    _cptDepsMapping[kp] && (mappings = mappings.concat(_cptDepsMapping[kp]))
                    kp = $keypath.digest(kp)
                }

                if (!mappings.length) return
                /**
                 *  get all computed props that depend on kp
                 */
                mappings.reduce(function (pv, cv) {
                    if (!$indexOf(pv, cv)) pv.push(cv)
                    return pv
                }, willComputedProps)

                willComputedProps.forEach(function (ck) {
                    $util.patch(_cptCaches, ck, {})

                    var cache = _cptCaches[ck]
                    var pre = cache.pre = cache.cur
                    var next = cache.cur = (_computedProps[ck].get || NOOP).call(_computedCtx, model)
                    if ($util.diff(next, pre)) _emitChange(ck, next, pre)
                })
            }, __muxid__/*scope*/)


            /**
             *  private methods
             */
            function _destroyNotice () {
                $warn('Instance already has bean destroyed')
                return _destroy
            }
            //  local proxy for EventEmitter
            function _emitChange(propname/*, arg1, ..., argX*/) {
                var args = arguments
                var kp = $normalize($join(_rootPath(), propname))
                args[0] = CHANGE_EVENT + ':' + kp
                _emitter.emit(CHANGE_EVENT, kp)
                emitter.emit.apply(emitter, args)

                args = $util.copyArray(args)
                args[0] = kp
                args.unshift('*')
                emitter.emit.apply(emitter, args)
            }
            /**
             *  Add dependence to "_cptDepsMapping"
             *  @param propname <String> property name
             *  @param dep <String> dependency name
             */
            function _prop2CptDepsMapping (propname, dep) {
                // if ($indexOf(_computedKeys, dep))
                //    return $warn('Dependency should not computed property')
                $util.patch(_cptDepsMapping, dep, [])

                var dest = _cptDepsMapping[dep]
                if ($indexOf(dest, propname)) return
                dest.push(propname)
            }
            /**
             *  Instance or reuse a sub-mux-instance with specified keyPath and emitter
             *  @param target <Object> instance target, it could be a Mux instance
             *  @param props <Object> property value that has been walked
             *  @param kp <String> keyPath of target, use to diff instance keyPath changes or instance with the keyPath
             */
            function _subInstance (target, props, kp) {

                var ins
                if (instanceOf(target, Mux) && target.__kp__ === kp && target.__root__ === __muxid__) {
                    // reuse
                    ins = target
                    // emitter proxy
                    ins._$emitter(emitter)
                    // a private emitter for communication between instances
                    ins._$_emitter(_emitter)
                } else {
                    ins = new Mux({
                        props: props,
                        emitter: emitter, 
                        _emitter: _emitter,
                        __kp__: kp
                    })
                }
                if (!ins.__root__) {
                    $util.def(ins, '__root__', {
                        enumerable: false,
                        value: __muxid__
                    })
                }
                return ins
            }

            /**
             *  A hook method for setting value to "_props"
             *  @param name <String> property name
             *  @param value
             *  @param mountedPath <String> property's value mouted path
             */
            function _walk (name, value, mountedPath) {
                var tov = $type(value) // type of value
                // initial path prefix is root path
                var kp = mountedPath ? mountedPath : $join(_rootPath(), name)
                /**
                 *  Array methods hook
                 */
                if (tov == ARRAY) {
                    $arrayHook(value, function (self, methodName, nativeMethod, args) {
                        var pv = $util.copyArray(self)
                        var result = nativeMethod.apply(self, args)
                        // set value directly after walk
                        _props[name] = _walk(name, self, kp)
                        if (methodName == 'splice') {
                            _emitChange(name, self, pv, methodName, args)
                        } else {
                            _emitChange(name, self, pv, methodName)
                        }
                        return result
                    })
                }

                // deep observe into each property value
                switch(tov) {
                    case OBJECT: 
                        // walk deep into object items
                        var props = {}
                        var obj = value
                        if (instanceOf(value, Mux)) obj = value.$props()
                        $util.objEach(obj, function (k, v) {
                            props[k] = _walk(k, v, $join(kp, k))
                        })
                        return _subInstance(value, props, kp)
                    case ARRAY:
                        // walk deep into array items
                        value.forEach(function (item, index) {
                            value[index] = _walk(index, item, $join(kp, index))
                        })
                        return value
                    default: 
                        return value
                }
            }

            /*************************************************************
                    Function name start of "_$" are expose methods
            *************************************************************/
            /**
             *  Set key-value pair to private model's property-object
             *  @param kp <String> keyPath
             *  @return <Object> diff object
             */
            function _$sync(kp, value) {
                var parts = $normalize(kp).split('.')
                var prop = parts[0]

                if ($indexOf(_computedKeys, prop)) {
                    // since Mux@2.4.0 computed property support setter
                    model[prop] = value
                    return false
                }
                if (!$indexOf(_observableKeys, prop)) {
                    $warn('Property "' + prop + '" has not been observed')
                    // return false means sync prop fail
                    return false
                }

                var pv = $keypath.get(_props, kp)
                var isObj = instanceOf(value, Object)
                var nKeypath = parts.join('.')
                var name = parts.pop()
                var parentPath = parts.join('.')
                var parent = $keypath.get(_props, parentPath)
                var isParentObserved = instanceOf(parent, Mux)

                if (isParentObserved) {
                    if ($hasOwn(parent, name)) {
                        parent.$set(name, value)
                    } else {
                        parent.$add(name, value)
                    }
                } else {
                    $keypath.set(
                        _props, 
                        kp, 
                        isObj
                            ? _walk(name, value, $join(_rootPath(), nKeypath))
                            : value
                    )
                    if ($util.diff(value, pv)) {
                        _emitChange(kp, value, pv)
                    }
                }

            }

            /**
             *  sync props value and trigger change event
             *  @param kp <String> keyPath
             */
            function _$set(kp, value) {
                if (_destroy) return _destroyNotice()

                _$sync(kp, value)
                // if (!diff) return
                /**
                 *  Base type change of object type will be trigger change event
                 *  next and pre value are not keypath value but property value
                 */
                // if ( kp == diff.mounted && $util.diff(diff.next, diff.pre) ) {
                //     var propname = diff.mounted
                //     // emit change immediately
                //     _emitChange(propname, diff.next, diff.pre)
                // }
            }

            /**
             *  sync props's value in batch and trigger change event
             *  @param keyMap <Object> properties object
             */
            function _$setMulti(keyMap) {
                if (_destroy) return _destroyNotice()

                if (!keyMap || $type(keyMap) != OBJECT) return
                $util.objEach(keyMap, function (key, item) {
                    _$set(key, item)
                })
            }

            /**
             *  create a prop observer
             *  @param prop <String> property name
             *  @param value property value
             */
            function _$add(prop, value, silence) {
                if (prop.match(/[\.\[\]]/)) {
                    throw new Error('Propname shoudn\'t contains "." or "[" or "]"')
                }

                if ($indexOf(_observableKeys, prop)) {
                    // If value is specified, reset value
                    return arguments.length > 1 ? true : false
                }
                _props[prop] = _walk(prop, $util.copyValue(value))
                _observableKeys.push(prop)
                $util.def(model, prop, {
                    enumerable: true,
                    get: function() {
                        return _props[prop]
                    },
                    set: function (v) {
                        _$set(prop, v)
                    }
                })
                // add peroperty will trigger change event
                !silence && _emitChange(prop, value)
            }

            /**
             *  define computed prop/props of this model
             *  @param propname <String> property name
             *  @param deps <Array> computed property dependencies
             *  @param fn <Function> computed property getter
             *  @param enumerable <Boolean> whether property enumerable or not
             */
            function _$computed (propname, deps, getFn, setFn, enumerable) {
                /**
                 *  property is exist
                 */
                if ($indexOf(_computedKeys, propname)) return

                _computedKeys.push(propname)
                _computedProps[propname] = {
                    'deps': deps, 
                    'get': getFn,
                    'set': setFn
                }

                /**
                 *  Add to dependence-property mapping
                 */
                ;(deps || []).forEach(function (dep) {
                    while(dep) {
                        _prop2CptDepsMapping(propname, dep)
                        dep = $keypath.digest(dep)
                    }
                })
                /**
                 *  define getter
                 */
                $util.patch(_cptCaches, propname, {})
                var dest = _cptCaches[propname]
                dest.cur = getFn ? getFn.call(_computedCtx, model):undefined

                $util.def(model, propname, {
                    enumerable: enumerable === undefined ? true : !!enumerable,
                    get: function () {
                        return dest.cur
                    },
                    set: function () {
                        setFn && setFn.apply(_computedCtx, arguments)
                    }
                })
                // emit change event when define
                _emitChange(propname, dest.cur)
            }

            /*******************************
                       define instantiation's methods
             *******************************/
            /**
             *  define observerable prop/props
             *  @param propname <String> | <Array>
             *  @param defaultValue Optional
             *  ----------------------------
             *  @param propnameArray <Array>
             *  ------------------------
             *  @param propsObj <Object>
             */
            _defProvateProperty('$add', function(/* [propname [, defaultValue]] | propnameArray | propsObj */) {
                var args = arguments
                var first = args[0]
                var pn, pv

                switch($type(first)) {
                    case STRING:
                        // with specified value or not
                        pn = first
                        if (args.length > 1) {
                            pv = args[1]
                            if (_$add(pn, pv)) {
                                _$set(pn, pv)
                            }
                        } else {
                            _$add(pn)
                        }
                        break
                    case ARRAY:
                        // observe properties without value
                        first.forEach(function (item) {
                            _$add(item)
                        })
                        break
                    case OBJECT:
                        // observe properties with value, if key already exist, reset value only
                        var resetProps
                        $util.objEach(first, function (ipn, ipv) {
                            if (_$add(ipn, ipv)) {
                                !resetProps && (resetProps = {})
                                resetProps[ipn] = ipv
                            }
                        })
                        if (resetProps) _$setMulti(resetProps)
                        break
                    default:
                        $warn('Unexpect params')
                }
                return this
            })
            /**
             *  define computed prop/props
             *  @param propname <String> property name
             *  @param deps <Array> computed property dependencies
             *  @param fn <Function> computed property getter
             *  @param enumerable <Boolean> Optional, whether property enumerable or not
             *  --------------------------------------------------
             *  @param propsObj <Object> define multiple properties
             */
            _defProvateProperty('$computed', function (propname, deps, getFn, setFn, enumerable/* | [propsObj]*/) {
                if ($type(propname) == STRING) {
                    _$computed.apply(null, arguments)
                } else if ($type(propname) == OBJECT) {
                    $util.objEach(arguments[0], function (pn, pv /*propname, propnamevalue*/) {
                        _$computed(pn, pv.deps, pv.get, pv.set, pv.enum)
                    })
                } else {
                    $warn('$computed params show be "(String, Array, Function, Function)" or "(Object)"')
                }
                return this
            })
            /**
             *  subscribe prop change
             *  change prop/props value, it will be trigger change event
             *  @param kp <String>
             *  ---------------------
             *  @param kpMap <Object>
             */
            _defProvateProperty('$set', function( /*[kp, value] | [kpMap]*/ ) {

                var args = arguments
                var len = args.length
                if (len >= 2 || (len == 1 && $type(args[0]) == STRING)) {
                    _$set(args[0], args[1])
                } else if (len == 1 && $type(args[0]) == OBJECT) {
                    _$setMulti(args[0])
                } else {
                    $warn('Unexpect $set params')
                }

                return this
            })

            /**
             *  Get property value by name, using for get value of computed property without cached
             *  change prop/props value, it will be trigger change event
             *  @param kp <String> keyPath
             */
            _defProvateProperty('$get', function(kp) {
                if ($indexOf(_observableKeys, kp)) 
                    return _props[kp]
                else if ($indexOf(_computedKeys, kp)) {
                    return (_computedProps[kp].get || NOOP).call(_computedCtx, model)
                } else {
                    // keyPath
                    var normalKP = $normalize(kp)
                    var parts = normalKP.split('.')
                    if (!$indexOf(_observableKeys, parts[0])) {
                        return
                    } else {
                        return $keypath.get(_props, normalKP)
                    }
                }
            })
            /**
             *  if params is (key, callback), add callback to key's subscription
             *  if params is (callback), subscribe any prop change events of this model
             *  @param key <String> optional
             *  @param callback <Function>
             */
            _defProvateProperty('$watch', function( /*[key, ]callback*/ ) {
                var args = arguments
                var len = args.length
                var first = args[0]
                var key, callback
                if (len >= 2) {
                    key = 'change:' + $normalize($join(_rootPath(), first))
                    callback = args[1]
                } else if (len == 1 && $type(first) == FUNCTION) {
                    key = '*'
                    callback = first
                } else {
                    $warn('Unexpect $watch params')
                    return NOOP
                }
                emitter.on(key, callback, __muxid__/*scopre*/)
                var that = this
                // return a unsubscribe method
                return function() {
                    that.$unwatch.apply(that, args)
                }
            })
            /**
             *  unsubscribe prop change
             *  if params is (key, callback), remove callback from key's subscription
             *  if params is (callback), remove all callbacks from key' ubscription
             *  if params is empty, remove all callbacks of current model
             *  @param key <String>
             *  @param callback <Function>
             */
            _defProvateProperty('$unwatch', function( /*[key, ] [callback] */ ) {
                var args = arguments
                var len = args.length
                var first = args[0]
                var params
                var prefix
                switch (true) {
                    case (len >= 2):
                        params = [args[1]]
                    case (len == 1 && $type(first) == STRING):
                        !params && (params = [])
                        prefix = CHANGE_EVENT + ':' + $normalize($join(_rootPath(), first))
                        params.unshift(prefix)
                        break
                    case (len == 1 && $type(first) == FUNCTION):
                        params = ['*', first]
                        break
                    case (len == 0):
                        params = []
                        break
                    default:
                        $warn('Unexpect param type of ' + first)
                }
                if (params) {
                    params.push(__muxid__)
                    emitter.off.apply(emitter, params)
                }
                return this
            })
            /**
             *  Return all properties without computed properties
             *  @return <Object>
             */
            _defProvateProperty('$props', function() {
                return $util.copyObject(_props)
            })
            /**
             *  Reset event emitter
             *  @param em <Object> emitter
             */
            _defProvateProperty('$emitter', function (em, _pem) {
                // return emitter instance if args is empty, 
                // for share some emitter with other instance
                if (arguments.length == 0) return emitter
                emitter = em
                _walkResetEmiter(this.$props(), em, _pem)
                return this
            })
            /**
             *  set emitter directly
             */
            _defProvateProperty('_$emitter', function (em) {
                emitter = em
            })
            /**
             *  set private emitter directly
             */
            _defProvateProperty('_$_emitter', function (em) {
                instanceOf(em, $Message) && (_emitter = em)
            })
            /**
             *  Call destroy will release all private properties and variables
             */
            _defProvateProperty('$destroy', function () {
                // clean up all proto methods
                $util.objEach(_priavateProperties, function (k, v) {
                    if ($type(v) == FUNCTION && k != '$destroyed') _priavateProperties[k] = _destroyNotice
                })

                if (!_isExternalEmitter) emitter.off()
                else emitter.off(__muxid__)

                if (!_isExternalPrivateEmitter) _emitter.off()
                else _emitter.off(__muxid__)

                emitter = null
                _emitter = null
                _computedProps = null
                _computedKeys = null
                _cptDepsMapping = null
                _cptCaches = null
                _observableKeys = null
                _props = null

                // destroy external flag
                _destroy = true
            })
            /**
             *  This method is used to check the instance is destroyed or not
             */
            _defProvateProperty('$destroyed', function () {
                return _destroy
            })
            /**
             *  A shortcut of $set(props) while instancing
             */
            _$setMulti(receiveProps)

        }
        /**
         *  Reset emitter of the instance recursively
         *  @param ins <Mux>
         */
        function _walkResetEmiter (ins, em, _pem) {
            if ($type(ins) == OBJECT) {
                var items = ins
                if (instanceOf(ins, Mux)) {
                    ins._$emitter(em, _pem)
                    items = ins.$props()
                }
                $util.objEach(items, function (k, v) {
                    _walkResetEmiter(v, em, _pem)
                })
            } else if ($type(ins) == ARRAY) {
                ins.forEach(function (v) {
                    _walkResetEmiter(v, em, _pem)
                })
            }
        }

        function NOOP() {}
        function instanceOf(a, b) {
            return a instanceof b
        }

        module.exports = Mux


    /***/ },
    /* 2 */
    /***/ function(module, exports, __webpack_require__) {

        /**
         *  Simple Pub/Sub module
         *  @author switer <guankaishe@gmail.com>
         **/
        'use strict';

        var $util = __webpack_require__(6)
        var _patch = $util.patch
        var _type = $util.type
        var _scopeDefault = '__default_scope__'

        function Message(context) {
            this._obs = {}
            this._context = context
        }
        var proto = Message.prototype
        proto.on = function(sub, cb, scope) {
            scope = scope || _scopeDefault
            _patch(this._obs, sub, [])

            this._obs[sub].push({
                cb: cb,
                scope: scope
            })
        }

        /**
         *  @param subject <String> subscribe type
         *  @param [cb] <Function> callback, Optional, if callback is not exist,
         *      will remove all callback of that sub
         */
        proto.off = function( /*subject, cb, scope*/ ) {
            var types
            var args = arguments
            var len = args.length
            var cb, scope

            if (len >= 3) {
                // clear all observers of this subject and callback eq "cb"
                types = [args[0]]
                cb = args[1]
                scope = args[2]
            } else if (len == 2 && _type(args[0]) == 'function') {
                // clear all observers those callback equal "cb"
                types = Object.keys(this._obs)
                cb = args[0]
                scope = args[1]
            } else if (len == 2) {
                // clear all observers of this subject
                types = [args[0]]
                scope = args[1]
            } else if (len == 1) {
                // clear all observes of the scope
                types = Object.keys(this._obs)
                scope = args[0]
            } else {
                // clear all observes
                this._obs = []
                return this
            }

            scope = scope || _scopeDefault

            var that = this
            types.forEach(function(sub) {

                var obs = that._obs[sub]
                if (!obs) return
                var nextObs = []
                if (cb) {
                    obs.forEach(function(observer) {
                        if (observer.cb === cb && observer.scope === scope) {
                            return
                        }
                        nextObs.push(observer)
                    })
                } else {
                    obs.forEach(function(observer) {
                        if (observer.scope === scope) return
                        nextObs.push(observer)
                    })
                }
                // if cb is not exist, clean all observers
                that._obs[sub] = nextObs

            })

            return this
        }
        proto.emit = function(sub) {
            var obs = this._obs[sub]
            if (!obs) return
            var args = [].slice.call(arguments)
            args.shift()
            var that = this
            obs.forEach(function(item) {
                item.cb && item.cb.apply(that._context || null, args)
            })
        }

        module.exports = Message


    /***/ },
    /* 3 */
    /***/ function(module, exports, __webpack_require__) {

        'use strict';

        /**
         *  normalize all access ways into dot access
         *  @example "person.books[1].title" --> "person.books.1.title"
         */
        function _keyPathNormalize(kp) {
            return new String(kp).replace(/\[([^\[\]]+)\]/g, function(m, k) {
                return '.' + k.replace(/^["']|["']$/g, '')
            })
        }
        /**
         *  set value to object by keypath
         */
        function _set(obj, keypath, value, hook) {
            var parts = _keyPathNormalize(keypath).split('.')
            var last = parts.pop()
            var dest = obj
            parts.forEach(function(key) {
                // Still set to non-object, just throw that error
                dest = dest[key]
            })
            if (hook) {
                // hook proxy set value
                hook(dest, last, value)
            } else {
                dest[last] = value
            }
            return obj
        }
        /**
         *  Get undefine
         */
        function undf () {
            return void(0)
        }
        function isNon (o) {
            return o === undf() || o === null
        }
        /**
         *  get value of object by keypath
         */
        function _get(obj, keypath) {
            var parts = _keyPathNormalize(keypath).split('.')
            var dest = obj
            parts.forEach(function(key) {
                if (isNon(dest)) return !(dest = undf())
                dest = dest[key]
            })
            return dest
        }

        /**
         *  append path to a base path
         */
        function _join(pre, tail) {
            var _hasBegin = !!pre
            if(!_hasBegin) pre = ''
            if (/^\[.*\]$/.exec(tail)) return pre + tail
            else if (typeof(tail) == 'number') return pre + '[' + tail + ']'
            else if (_hasBegin) return pre + '.' + tail
            else return tail
        }
        /**
         *  remove the last section of the keypath
         *  digest("a.b.c") --> "a.b"
         */
        function _digest(nkp) {
            var reg = /(\.[^\.]+|\[([^\[\]])+\])$/
            if (!reg.exec(nkp)) return ''
            return nkp.replace(reg, '')
        }
        module.exports = {
            normalize: _keyPathNormalize,
            set: _set,
            get: _get,
            join: _join,
            digest: _digest
        }


    /***/ },
    /* 4 */
    /***/ function(module, exports, __webpack_require__) {

        'use strict';

        var $util = __webpack_require__(6)
        var hookMethods = ['splice', 'push', 'pop', 'shift', 'unshift', 'reverse', 'sort', '$concat']
        var _push = Array.prototype.push
        var _slice = Array.prototype.slice
        var attachMethods = {
            '$concat': function () {
                var args = _slice.call(arguments)
                var arr = this
                args.forEach(function (items) {
                    $util.type(items) == 'array' 
                        ? items.forEach(function (item) {
                                _push.call(arr, item)
                            })
                        : _push.call(arr, items)
                })
                return arr
            }
        }
        var hookFlag ='__hook__'

        module.exports = function (arr, hook) {
            hookMethods.forEach(function (m) {
                if (arr[m] && arr[m][hookFlag]) {
                    // reset hook method
                    arr[m][hookFlag](hook)
                    return
                }
                // cached native method
                var nativeMethod = arr[m] || attachMethods[m]
                // method proxy
                $util.def(arr, m, {
                    enumerable: false,
                    value: function () {
                        return hook(arr, m, nativeMethod, arguments)
                    }
                })
                // flag mark
                $util.def(arr[m], hookFlag, {
                    enumerable: false,
                    value: function (h) {
                        hook = h
                    }
                })
            })
        }

    /***/ },
    /* 5 */
    /***/ function(module, exports, __webpack_require__) {

        'use strict';

        var _enable = true

        module.exports = {
            enable: function () {
                _enable = true
            },
            disable: function () {
                _enable = false
            },
            warn: function (msg) {
                if (!_enable) return
                if (console.warn) return console.warn(msg)
                console.log(msg)
            }
        }

    /***/ },
    /* 6 */
    /***/ function(module, exports, __webpack_require__) {

        'use strict';
        function hasOwn (obj, prop) {
            return obj && obj.hasOwnProperty(prop)
        }
        module.exports = {
            type: function (obj) {
                return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
            },
            objEach: function (obj, fn) {
                if (!obj) return
                for(var key in obj) {
                    if (hasOwn(obj, key)) {
                        if(fn(key, obj[key]) === false) break
                    }
                }
            },
            patch: function (obj, prop, defValue) {
                !obj[prop] && (obj[prop] = defValue)
            },
            diff: function (next, pre, _t) {
                var that = this
                // defult max 4 level        
                _t = _t == undefined ? 4 : _t

                if (_t <= 0) return next !== pre

                if (this.type(next) == 'array' && this.type(pre) == 'array') {
                    if (next.length !== pre.length) return true
                    return next.some(function(item, index) {
                        return that.diff(item, pre[index], _t - 1)
                    })
                } else if (this.type(next) == 'object' && this.type(pre) == 'object') {
                    var nkeys = Object.keys(next)
                    var pkeys = Object.keys(pre)
                    if (nkeys.length != pkeys.length) return true

                    var that = this
                    return nkeys.some(function(k) {
                        return (!~pkeys.indexOf(k)) || that.diff(next[k], pre[k], _t - 1)
                    })
                }
                return next !== pre
            },
            copyArray: function (arr) {
                var len = arr.length
                var nArr = new Array(len)
                while(len --) {
                    nArr[len] = arr[len]
                }
                return nArr
            },
            copyObject: function (obj) {
                var cObj = {}
                this.objEach(obj, function (k, v) {
                    cObj[k] = v
                })
                return cObj
            },
            copyValue: function (v) {
                var t = this.type(v)
                switch(t) {
                    case 'object': return this.copyObject(v)
                    case 'array': return this.copyArray(v)
                    default: return v
                }
            },
            def: function () {
                return Object.defineProperty.apply(Object, arguments)
            },
            indexOf: function (a, b) {
                return ~a.indexOf(b)
            },
            merge: function (to, from) {
                if (!from) return to
                this.objEach(from, function (k, v) {
                    to[k] = v
                })
                return to
            },
            hasOwn: hasOwn
        }

    /***/ }
    /******/ ])
    });


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

    'use strict';

    var Mux = __webpack_require__(4)
    var mUtils = Mux.utils
    var _normalize = Mux.keyPath.normalize
    var _digest = Mux.keyPath.digest

    function _keys(o) {
        return Object.keys(o)
    }

    var escapeCharMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '\"': '&quot;',
        '\'': '&#x27;',
        '/': '&#x2F;'
    }
    var escapeRex = new RegExp(_keys(escapeCharMap).join('|'), 'g')

    module.exports = {
        type: mUtils.type,
        diff: mUtils.diff,
        merge: mUtils.merge,
        objEach: mUtils.objEach,
        copyArray: mUtils.copyArray,
        copyObject: mUtils.copyObject,
        
        extend: function(obj) {
            if (this.type(obj) != 'object') return obj;
            var source, prop;
            for (var i = 1, length = arguments.length; i < length; i++) {
                source = arguments[i];
                for (prop in source) {
                    obj[prop] = source[prop];
                }
            }
            return obj;
        },
        valueDiff: function(next, pre) {
            return next !== pre || next instanceof Object
        },
        walk: function(node, fn) {
            var into = fn(node) !== false
            var that = this
            if (into) {
                var children = [].slice.call(node.childNodes)
                children.forEach(function (i) {
                    that.walk(i, fn)
                })
            }
        },
        domRange: function (tar, before, after) {
            var children = []
            var nodes = tar.childNodes
            var start = false
            for (var i = 0; i < nodes.length; i++) {
                var item = nodes[i]
                if (item === after) break
                else if (start) {
                    children.push(item)
                } else if (item == before) {
                    start = true
                }
            }
            return children
        },
        immutable: function (obj) {
            var that = this
            var _t = this.type(obj)
            var n

            if (_t == 'array') {
                n = obj.map(function (item) {
                    return that.immutable(item)
                })
            } else if (_t == 'object') {
                n = {}
                this.objEach(obj, function (k, v) {
                    n[k] = that.immutable(v)
                })
            } else {
                n = obj
            }
            return n
        },
        tagHTML: function (tag) {
            var h = tag.outerHTML
            var open = h.match(/^<[^>]+?>/)
            var close = h.match(/<\/[^<]+?>$/)
            
            return [open ? open[0]:'', close ? close[0]:'']
        },
        relative: function (src, dest) {
            src = _normalize(src)
            dest = _normalize(dest)

            if (src == dest) return true
            else {
                var start = src.indexOf(dest) === 0
                var subkp = src.replace(dest, '').match(/^[\.\[]/)
                return start && subkp
            }
        },
        escape: function (str) {
            if (!this.type(str) == 'string') return str
            return str.replace(escapeRex, function (m) {
                return escapeCharMap[m]
            })
        },
        normalize: _normalize,
        digest: _digest
    }


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

    'use strict';

    var _ns = 'z-' // default namespace is z that means "Zect" 

    module.exports = {
        set namespace (n) {
            _ns = n + '-'
        },
        get namespace () {
            return _ns
        }
     }

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

    /**
     *  execute expression from template with specified Scope and ViewModel
     */

    var util = __webpack_require__(5)
    /**
     *  Calc expression value
     */
    function _execute($vm, $scope/*, expression, [label], [target]*/) {
        /**
         *  $scope is passed when call instance method $compile, 
         *  Each "scope" object maybe include "$parent, data, method" properties
         */
        var $parent = $scope && $scope.$parent ? util.extend({}, $scope.$parent.methods, $scope.$parent.data) : {}
        
        $scope = $scope || {}
        $scope = util.extend({}, $vm.$methods, $vm.$data, $scope.methods, $scope.data)

        try {
            return util.immutable(eval('with($scope){(%s)}'.replace('%s', arguments[2])))
        } catch (e) {
            arguments[2] = /^\{/.test(arguments[2]) 
                            ? '. ' + arguments[2]
                            : '. {' + arguments[2] + '}' // expr
            // arguments[3] // label
            // arguments[4] // target
            switch (e.name) {
                case 'ReferenceError':
                    console.warn(e.message + arguments[2])
                    break
                default:
                    console.error(
                         (arguments[3] ? '\'' + arguments[3] + '\': ' : ''),
                        e.message + arguments[2],
                        arguments[4] || ''
                    )
            }
            return ''
        }
    }
    module.exports = _execute

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

    'use strict';

    var $ = __webpack_require__(2)
    var util = __webpack_require__(5)
    var Expression = __webpack_require__(9)
    var _execute = __webpack_require__(7)
    var _relative = util.relative
    /**
     *  Whether a text is with express syntax
     */
    var _isExpr = Expression.isExpr
    /**
     *  Get varibales of expression
     */
    var _extractVars = Expression.extract

    function noop () {}

    var keywords = ['$index', '$value', '$parent', '$vm', '$scope']
    /**
     *  watch changes of variable-name of keypath
     *  @return <Function> unwatch
     */
    function _watch(vm, vars, update) {
        var watchKeys = []
        function _handler (kp) {
            if (watchKeys.some(function(key, index) {
                    if (_relative(kp, key)) {
                        return true
                    }
            })) update.apply(null, arguments)
        }

        if (vars && vars.length) {
            vars.forEach(function (k) {
                if (~keywords.indexOf(k)) return
                while (k) {
                    if (!~watchKeys.indexOf(k)) watchKeys.push(k)
                    k = util.digest(k)
                }
            })
            if (!watchKeys.length) return noop
            vm.$watch(_handler)
            return function () {
                vm.$unwatch(_handler)
            }
        }
        return noop
    }


    var _strip = Expression.strip

    /**
     *  Compoiler constructor for wrapping node with consistent API
     *  @node <Node>
     *  // TODO it should not be named "compiler"
     */
    function compiler (node) {
        this.$el = node
    }

    var cproto = compiler.prototype

    compiler.inherit = function (Ctor) {
        function SubCompiler() {
            Ctor.apply(this, arguments)
        }
        SubCompiler.prototype = Object.create(compiler.prototype)
        return SubCompiler
    }
    cproto.$bundle = function () {
        return this.$el
    }
    cproto.$floor = function () {
        return this.$el
    }
    cproto.$ceil = function () {
        return this.$el
    }
    cproto.$mount = function (pos) {
        $(pos).replace(this.$bundle())
        return this
    }
    cproto.$remove = function () {
        var $el = this.$bundle()
        _parentNode($el) && $($el).remove()
        return this
    }
    cproto.$appendTo = function (pos) {
        _appendChild(pos, this.$bundle())
        return this
    }
    cproto.$insertBefore = function (pos) {
        _insertBefore(_parentNode(pos), this.$bundle(), pos)
        return this
    }
    cproto.$insertAfter = function (pos) {
        _insertBefore(_parentNode(pos), this.$bundle(), _nextSibling(pos))
        return this
    }
    cproto.$destroy = function () {
        this.$el = null
        return this
    }
    cproto.$update = noop
    /**
     *  Standard directive
     */
    var _did = 0
    var Directive = compiler.Directive = compiler.inherit(function (vm, scope, tar, def, name, expr) {
        var d = this
        var bindParams = []
        var isExpr = !!_isExpr(expr)

        isExpr && (expr = _strip(expr))

        if (def.multi) {
            // extract key and expr from "key: expression" format
            var key
            expr = expr.replace(/^[^:]+:/, function (m) {
                key = m.replace(/:$/, '').trim()
                return ''
            }).trim()
            
            bindParams.push(key)
        }

        d.$el = tar
        d.$vm = vm
        d.$id = _did++
        d.$scope = scope

        var bind = def.bind
        var unbind = def.unbind
        var upda = def.update
        var prev
        var unwatch


        // set properties
        util.objEach(def, function (k, v) {
            d[k] = v
        })
        
        /**
         *  execute wrap with directive name
         */
        function _exec(expr) {
            return _execute(vm, scope, expr, name)
        }

        /**
         *  update handler
         */
        function _update(kp) {
            var nexv = _exec(expr)
            if (util.diff(nexv, prev)) {
                var p = prev
                prev = nexv
                upda && upda.call(d, nexv, p, kp)
            }
        }

        /**
         *  If expression is a string iteral, use it as value
         */
        prev = isExpr ? _exec(expr):expr
        bindParams.push(prev)
        bindParams.push(expr)
        // watch variable changes of expression
        if (def.watch !== false && isExpr) {
           unwatch = _watch(vm, _extractVars(expr), _update)
        }

        d.$destroy = function () {
            unbind && unbind.call(d)
            unwatch && unwatch()
            d.$el = null
            d.$vm = null
            d.$scope = null
        }
        d.$update = _update

        // ([property-name], expression-value, expression) 
        bind && bind.apply(d, bindParams, expr)
        upda && upda.call(d, prev)

    })


    var _eid = 0
    compiler.Element = compiler.inherit(function (vm, scope, tar, def, name, expr) {
        var d = this
        var bind = def.bind
        var unbind = def.unbind
        var upda = def.update
        var delta = def.delta
        var deltaUpdate = def.deltaUpdate
        var isExpr = !!_isExpr(expr)
        var prev
        var unwatch

        isExpr && (expr = _strip(expr))

        d.$id = _eid ++
        d.$vm = vm
        d.$el = tar
        d.$scope = scope // save the scope reference

        var tagHTML = util.tagHTML(tar)
        d.$before = _createComment(tagHTML[0])
        d.$after = _createComment(tagHTML[1])
        d.$container = document.createDocumentFragment()

        _appendChild(d.$container, d.$before)
        _appendChild(d.$container, d.$after)

        // set properties
        util.objEach(def, function (k, v) {
            d[k] = v
        })

        d.$bundle = function () {
            var $ceil = this.$ceil()
            var $floor = this.$floor()
            var $con = this.$container
            var that = this

            if (!_contains($con, $ceil)) {
                util.domRange(_parentNode($ceil), $ceil, $floor)
                    .forEach(function(n) {
                        _appendChild(that.$container, n)
                    })
                _insertBefore($con, $ceil, $con.firstChild)
                _appendChild($con, $floor)
            }
            return $con
        }
        d.$floor = function () {
            return this.$after
        }
        d.$ceil = function () {
            return this.$before
        }

        d.$destroy = function () {
            unbind && unbind.call(d)
            unwatch && unwatch()
            d.$el = null
            d.$vm = null
            d.$scope = null
        }
        /**
         *  update handler
         */
        function _update(kp, nv, pv, method, ind, len) {
            var nexv = _exec(expr)
            if (delta && delta.call(d, nexv, prev, kp)) {
                return deltaUpdate && deltaUpdate.call(d, nexv, p, kp)
            }
            if (util.diff(nexv, prev)) {
                var p = prev
                prev = nexv
                upda && upda.call(d, nexv, p, kp, method, ind, len)
            }
        }

        d.$update = _update

        /**
         *  execute wrap with directive name
         */
        function _exec(expr) {
            return _execute(vm, scope, expr, name)
        }

        prev = isExpr ? _exec(expr) : expr
        if (def.watch !== false && isExpr) {
            unwatch = _watch(vm, _extractVars(expr), _update)
        }
        bind && bind.call(d, prev, expr)
        upda && upda.call(d, prev)
    })


    compiler.Text = compiler.inherit(function(vm, scope, tar, originExpr, parts, exprs) {
        function _exec (expr) {
            return _execute(vm, scope, expr, null)
        }
        var cache = new Array(exprs.length)
        var isUnescape = exprs.some(function (expr) {
            return Expression.isUnescape(expr)
        })
        var unwatches = []

        exprs.forEach(function(exp, index) {
            // watch change
            exp = _strip(exp)
            var vars = _extractVars(exp)

            function _update() {
                var pv = cache[index]
                var nv = _exec(exp)

                if (util.diff(nv, pv)) {
                    // re-render
                    cache[index] = nv
                    render()
                }
            }
            // initial value
            cache[index] = _exec(exp)

            unwatches.push(_watch(vm, vars, _update))
        })

        if (isUnescape) {
            var $tmp = document.createElement('div')
            var $con = document.createDocumentFragment()
            var $before = _createComment('{' + _strip(originExpr))
            var $after = _createComment('}')

            var pn = _parentNode(tar)
            _insertBefore(pn, $before, tar)
            _insertBefore(pn, $after, _nextSibling(tar))
        }

        function render() {
            var frags = []
            parts.forEach(function(item, index) {
                frags.push(item)
                if (index < exprs.length) {
                    frags.push(cache[index])
                }
            })

            var value = Expression.unveil(frags.join(''))

            if (isUnescape) {
                var cursor = _nextSibling($before)
                while(cursor && cursor !== $after) {
                    var next = _nextSibling(cursor)
                    _parentNode(cursor).removeChild(cursor)
                    cursor = next
                }
                $tmp.innerHTML = value
                ;[].slice.call($tmp.childNodes).forEach(function (n) {
                    _appendChild($con, n)
                }) 
                _insertBefore(_parentNode($after), $con, $after)
            } else {
                tar.nodeValue = value
            }
        }

        this.$destroy = function () {
            unwatches.forEach(function (f) {
                f()
            })
        }

        this.$update = function () {
            var hasDiff
            exprs.forEach(function(exp, index) {
                exp = _strip(exp)
                var pv = cache[index]
                var nv = _exec(exp)

                if (!hasDiff && util.diff(nv, pv)) {
                    hasDiff = true
                }
                cache[index] = nv
            })
            hasDiff && render()
        }

        /**
         *  initial render
         */
        render()
    })

    compiler.Attribute = function(vm, scope, tar, name, value) {
        
        var isNameExpr = _isExpr(name)
        var isValueExpr = _isExpr(value)

        var nexpr = isNameExpr ? _strip(name) : null
        var vexpr = isValueExpr ? _strip(value) : null

        var unwatches = []

        function _exec(expr) {
            return _execute(vm, scope, expr, name + '=' + value)
        }
        // validate atrribute name, from: http://www.w3.org/TR/REC-xml/#NT-NameChar
        // /^(:|[a-zA-Z0-9]|_|-|[\uC0-\uD6]|[\uD8-\uF6]|[\uF8-\u2FF]|[\u370-\u37D]|[\u37F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\u10000-\uEFFFF])+$/

        // cache last name/value
        var preName = isNameExpr ? _exec(nexpr) : name
        var preValue = isValueExpr ? _exec(vexpr) : value

        tar.setAttribute(preName, preValue)

        function _updateName() {
            var next = _exec(nexpr)

            if (util.diff(next, preName)) {
                $(tar).removeAttr(preName)
                      .attr(next, preValue)
                preValue = next
            }
        }
        function _updateValue() {
            var next = _exec(vexpr)
            if (util.diff(next, preValue)) {
                $(tar).attr(preName, next)
                preValue = next
            }
        }


        this.$destroy = function () {
            unwatches.forEach(function (f) {
                f()
            })
        }

        this.$update = function () {
            isNameExpr && _updateName()
            isValueExpr && _updateValue()
        }
        /**
         *  watch attribute name expression variable changes
         */
        if (isNameExpr) {
            unwatches.push(_watch(vm, _extractVars(name), _updateName))
        }
        /**
         *  watch attribute value expression variable changes
         */
        if (isValueExpr) {
            unwatches.push(_watch(vm, _extractVars(value), _updateValue))
        }

    }

    function _appendChild (con, child) {
        return con.appendChild(child)
    }
    function _createComment (ns) {
        return document.createComment(ns)
    }
    function _insertBefore (con, child, pos) {
        return con.insertBefore(child, pos)
    }
    function _parentNode (tar) {
        return tar && tar.parentNode
    }
    function _nextSibling (tar) {
        return tar && tar.nextSibling
    }
    function _contains (con, tar) {
        return tar && tar.parentNode === con
    }

    module.exports = compiler


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

    'use strict';

    var execute = __webpack_require__(7)

    var _sep = ';'
    var _sepRegexp = new RegExp(_sep, 'g')
    var _literalSep = ','
    var _exprRegexp = /\{[\s\S]*?\}/g
    var _varsRegexp = /("|').+?[^\\]\1|\.\w*|\$\w*|\w*:|\b(?:this|true|false|null|undefined|new|typeof|Number|String|Object|Array|Math|Date|JSON)\b|([a-z_]\w*)\(|([a-z_]\w*)/gi
    /**
     *  Whether a text is with express syntax
     */
    function _isExpr(c) {
        return c ? !!c.trim().match(/^\{[\s\S]*?\}$/m) : false
    }
    module.exports = {
        sep: _sep,
        literalSep: _literalSep,

        sepRegexp: _sepRegexp,
        exprRegexp: _exprRegexp,

        isExpr: _isExpr,
        isUnescape: function(expr) {
            return !!expr.match(/^\{\- /)
        },
        execLiteral: function (expr, vm, scope) {
            if (!_isExpr(expr)) return {}
            return execute(vm, scope, expr.replace(_sepRegexp, _literalSep))
        },
        veil: function (expr) {
            return expr.replace(/\\{/g, '\uFFF0')
                       .replace(/\\}/g, '\uFFF1')
        },
        unveil: function (expr) {
            return expr.replace(/\uFFF0/g, '\\{')
                       .replace(/\uFFF1/g, '\\}')
        },
        strip: function (expr) {
            return expr.trim()
                    .match(/^\{([\s\S]*)\}$/m)[1]
                    .replace(/^- /, '')
        },
        extract: function(expr) {
            if (!expr) return null
            var vars = expr.match(_varsRegexp)
            vars = !vars ? [] : vars.filter(function(i) {
                if (!i.match(/^[\."'\]\[]/) && !i.match(/\($/)) {
                    return i
                }
            })
            return vars
        },
        // variableOnly: function (expr) {
        //     return /^[a-zA-Z_$][\w$]*$/.test(expr)
        // },
        notFunctionCall: function (expr) {
            return !/[()]/.test(expr)
        }
    }

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

    /**
     *  Build-in Global Directives
     */

    'use strict';

    var $ = __webpack_require__(2)
    var conf = __webpack_require__(6)
    var util = __webpack_require__(5)
    var _relative = util.relative

    module.exports = function(Zect) {
        return {
            'attr': {
                multi: true,
                bind: function(attname) {
                    this.attname = attname
                    this._$el = $(this.$el)
                },
                update: function(next) {
                    if (!next && next !== '') {
                        this._$el.removeAttr(this.attname)
                    } else {
                        this._$el.attr(this.attname, next)
                    }
                }
            },
            'class': {
                multi: true,
                bind: function(className) {
                    this.className = className
                    this._$el = $(this.$el)
                },
                update: function(next) {
                    if (next) this._$el.addClass(this.className)
                    else this._$el.removeClass(this.className)
                }
            },
            'html': {
                update: function (nextHTML) {
                    this.$el.innerHTML = nextHTML
                }
            },
            'model': {
                bind: function (prop) {
                    var tagName = this.$el.tagName
                    var type = tagName.toLowerCase()
                    var $el = this._$el = $(this.$el)

                    // pick input element type spec
                    type = type == 'input' ? $el.attr('type') || 'text' : type

                    switch (type) {
                        case 'tel':
                        case 'url':
                        case 'text':
                        case 'search':
                        case 'password':
                        case 'textarea':
                            this.evtType = 'input'
                            break
                        
                        case 'date':
                        case 'week':
                        case 'time':
                        case 'month':
                        case 'datetime':
                        case 'datetime-local':
                        case 'color':
                        case 'range':
                        case 'number':
                        case 'select':
                        case 'checkbox':
                            this.evtType = 'change'
                            break
                        default:
                            console.warn('"' + conf.namespace + 'model" only support input,textarea,select')
                            return
                    }

                    var vm = this.$vm
                    var vType = type == 'checkbox' ? 'checked':'value'
                    var that = this

                    /**
                     *  DOM input 2 state
                     */
                    this._requestChange = function () {
                        vm.$set(that._prop, that.$el[vType])
                    }
                    /**
                     *  State 2 DOM input
                     */
                    this._update = function () {
                        that.$el[vType] = vm.$get(that._prop)
                    }
                    $el.on(this.evtType, this._requestChange)
                    var watches = this._watches = []
                    var wKeypath = util.normalize(prop)
                    while (wKeypath) {
                        watches.push(this.$vm.$watch(wKeypath, this._update))
                        wKeypath = util.digest(wKeypath)
                    }
                },
                update: function (prop) {
                    this._prop = prop
                    this._update()
                },
                unbind: function () {
                    this._$el.off(this.evtType, this._requestChange)
                    this._watches.forEach(function (f) {
                        f()
                    })
                }
            },
            'on': {
                multi: true,
                watch: false,
                bind: function(evtType, handler, expression ) {
                    this._expr = expression
                    this.type = evtType
                },
                update: function (handler) {
                    this.unbind()

                    var fn = handler
                    if (util.type(fn) !== 'function') 
                        return console.warn('"' + conf.namespace + 'on" only accept function. {' + this._expr + '}')

                    this.fn = fn.bind(this.$vm)
                    $(this.$el).on(this.type, this.fn, false)

                },
                unbind: function() {
                    if (this.fn) {
                        $(this.$el).off(this.type, this.fn)
                        this.fn = null
                    }
                }
            },
            'show': {
                update: function(next) {
                    this.$el.style.display = next ? '' : 'none'
                }
            },
            'style': {
                multi: true,
                bind: function (sheet) {
                    this.sheet = sheet
                },
                update: function (next) {
                    this.$el.style && (this.$el.style[this.sheet] = next)
                }
            }
        }
    }


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

    /**
     *  Build-in Global Custom-Elements
     */

    'use strict';

    var $ = __webpack_require__(2)
    var conf = __webpack_require__(6)
    var util = __webpack_require__(5)
    var Scope = __webpack_require__(12)
    var Expression = __webpack_require__(9)

    function _getData (data) {
        return util.type(data) == 'object' ? util.copyObject(data) : {}
    }
    module.exports = function(Zect) {
        return {
            'if': {
                bind: function(/*cnd, expr*/) {
                    this._tmpCon = document.createDocumentFragment()
                    /**
                     *  Initial unmount childNodes
                     */
                    ;[].slice
                        .call(this.$el.childNodes)
                        .forEach(function(e) {
                            this._tmpCon.appendChild(e)
                        }.bind(this))

                    /**
                     *  Instance method
                     */
                    var mounted
                    this._mount = function () {
                        if (mounted) return
                        mounted = true
                        var $floor = this.$floor()
                        $floor.parentNode.insertBefore(this._tmpCon, $floor)

                    }
                    this._unmount = function () {
                        if (!mounted) return
                        mounted = false
                        var $ceil = this.$ceil()
                        var $floor = this.$floor()

                        var that = this
                        util.domRange($ceil.parentNode, $ceil, $floor)
                            .forEach(function(n) {
                                that._tmpCon.appendChild(n)
                            })
                    }
                },
                update: function(next) {
                    if (!next) {
                        this._unmount()
                    } else if (this.compiled) {
                        this._mount()
                    } else {
                        this.compiled = true

                        var $parent = this.$scope || {}
                        // inherit parent scope's properties
                        var $scope = new Scope($parent.data, $parent)
                        var protoUpdate = $scope.$update
                        $scope.$update = function () {
                            // the "if" element is sharing with $scope.data, 
                            // so it need to be updated
                            $scope.data = $parent.data
                            protoUpdate.apply($scope, arguments)
                        }
                        var $update = this.$update

                        // hook to $update interface
                        this.$update = function () {
                            $scope.$update()
                            $update.apply(this, arguments)
                        }
                        if(this.$scope) {
                            this.$scope.children.push($scope)
                        }
                        this.$vm.$compile(this._tmpCon, $scope)
                        this._mount()
                    }
                }
            },
            'repeat': {
                bind: function(items, expr) {
                    this.child = this.$el.firstElementChild
                    this.expr = expr
                    if (!this.child) {
                        return console.warn('"' + conf.namespace + 'repeat"\'s childNode must has a HTMLElement node. {' + expr + '}')
                    }
                    // if use filter, Zect can't patch array by array-method
                    this._noArrayFilter = Expression.notFunctionCall(expr)
                },
                delta: function (nv, pv, kp) {
                    if (kp && /\d+/.test(kp.split('.')[1])) {
                        var index = Number(kp.split('.')[1])
                        // can be delta update
                        if (this.$vms && index < this.$vms.length) return true
                        else return false
                    } else {
                        return false
                    }
                },
                deltaUpdate: function (nextItems, preItems, kp) {
                    var index = Number(kp.split('.')[1])
                    var nv = nextItems[index]
                    // delta update
                    this.last[index] = nv

                    var $vm = this.$vms[index]
                    var $data = $vm.$scope.data = _getData(nv)
                    $data.$index = index
                    $data.$value = nv

                    $vm.$value = nv
                    $vm.$index = index

                    $vm.$scope.$update()
                },
                update: function(items, preItems, kp, method, args) {
                    if (!items || !items.forEach) {
                        return console.warn('"' + conf.namespace + 'repeat" only accept Array data. {' + this.expr + '}')
                    }
                    var that = this
                    /**
                     *  create a sub-vm for array item with specified index
                     */
                    function createSubVM(item, index) {
                        var subEl = that.child.cloneNode(true)
                        var data = _getData(item)

                        data.$index = index
                        data.$value = item

                        var $scope = new Scope(data, that.$scope)
                        // this.$scope is a parent scope, 
                        // on the top of current scope
                        if(that.$scope) {
                            that.$scope.children.push($scope)
                        }
                        return {
                            $index: index,
                            $value: item,
                            $compiler: that.$vm.$compile(subEl, $scope),
                            $scope: $scope
                        }
                    }

                    function destroyVM (vm) {
                        // $compiler be inclued in $scope.bindings probably
                        vm.$compiler.$remove().$destroy()
                        vm.$scope.bindings.forEach(function (bd) {
                            bd.$destroy()
                        })                    
                    }

                    function updateVMIndex (vm, index) {
                        vm.$index = index
                        var $data = vm.$scope.data
                        $data.$index = index
                        vm.$scope.$update()
                    }

                    // it's not modify
                    if (method == 'splice' && args.length == 2 && (!args[1] || args[1] < 0)) return

                    var $floor = this.$floor()
                    var $ceil = this.$ceil()
                    var arrayPatcher = {
                        splice: function () {
                            var ind = Number(args[0] || 0)
                            var len = Number(args[1] || 0)
                            var max = this.$vms.length
                            ind = ind > max ? max : ind
                            if (args.length > 2) {
                                /**
                                 *  Insert
                                 */
                                // create vms for each inserted item
                                var insertVms = [].slice.call(args, 2).map(function (item, index) {
                                    return createSubVM(item, ind + index)
                                })
                                // insert items into current $vms
                                this.$vms.splice.apply(this.$vms, [ind, len].concat(insertVms))

                                // element bound for inserted item vm element
                                $(insertVms.map(function (vm) {
                                    return vm.$compiler.$bundle()
                                })).insertAfter(
                                    ind == 0 
                                    ? $ceil
                                    : this.$vms[ind - 1].$compiler.$bundle()
                                )
                                // get last update index
                                var start = ind + insertVms.length
                                this.$vms.forEach(function (vm, i) {
                                    if (i >= start) {
                                        updateVMIndex(vm, i)
                                    }
                                })

                            } else {
                                /**
                                 *  remove
                                 */
                                this.$vms.splice
                                         .apply(this.$vms, args)
                                         .forEach(function (vm, i) {
                                            destroyVM(vm)
                                         })

                                this.$vms.forEach(function (vm, i) {
                                    if (i >= ind) {
                                        updateVMIndex(vm, i)
                                    }
                                })
                            }
                        },
                        push: function () {
                            var index = items.length - 1
                            var vm = createSubVM(items[index], index)
                            this.$vms.push(vm)
                            vm.$compiler.$insertBefore($floor)
                        },
                        pop: function () {
                            var vm = this.$vms.pop()
                            destroyVM(vm)
                        },
                        shift: function () {
                            var vm = this.$vms.shift()
                            destroyVM(vm)
                            this.$vms.forEach(function (v, i) {
                                updateVMIndex(v, i)
                            })
                        },
                        unshift: function () {
                            var vm = createSubVM(items[0], 0)
                            this.$vms.unshift(vm)
                            vm.$compiler.$insertAfter($ceil)
                            this.$vms.forEach(function (v, i) {
                                if (i != 0) {
                                    updateVMIndex(v, i)
                                }
                            })
                        },
                        $concat: function () {
                            var len = this.$vms.length
                            $(items.slice(len).map(function (item, i) {
                                var vm = createSubVM(item, i + len)
                                that.$vms.push(vm)
                                return vm.$compiler.$bundle()
                            })).insertBefore($floor)
                        }
                    }

                    var patch = arrayPatcher[method]
                    if (this._noArrayFilter && patch) {
                        patch.call(this)
                        this.last = util.copyArray(items)
                        return
                    }
                    /**
                     *  vms diff
                     */
                    var vms = new Array(items.length)
                    var olds = this.last ? util.copyArray(this.last) : olds
                    var oldVms = this.$vms ? util.copyArray(this.$vms) : oldVms
                    var updateVms = []
                    items.forEach(function(item, index) {
                        var v
                        if (!olds) {
                            v = createSubVM(item, index)
                        } else {

                            var i = -1
                            olds.some(function (dest, index) {
                                // one level diff
                                if (!util.diff(dest, item)) {
                                    i = index
                                    return true
                                }
                            })

                            if (~i) {
                                // reused
                                v = oldVms[i]
                                // clean
                                olds.splice(i, 1)
                                oldVms.splice(i, 1)

                                // reset $index and $value
                                v.$index = index
                                v.$value = item

                                var $data = v.$scope.data = _getData(item)

                                $data.$index = index
                                $data.$value = item
                                updateVms.push(v)
                                
                            } else {
                                v = createSubVM(item, index)
                            }
                        }
                        vms[index] = v
                    })
                    
                    this.$vms = vms
                    this.last = util.copyArray(items)
                    // from rear to head
                    var len = vms.length
                    var i = 0
                    while (i < len) {
                        var v = vms[i++]
                        v.$compiler.$insertBefore($floor)
                    }
                    updateVms.forEach(function (v) {
                        // reset $index
                        v.$scope.$update()
                    })
                    updateVms = null
                    oldVms && oldVms.forEach(destroyVM)
                }
            }
        }
    }


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

    /**
     *  Scope abstraction is a colletor when compiler child template with scope 
     */

    'use strict';

    function Scope (data, parent) {
        this.data = data
        this.bindings = []
        this.children = []
        this.$parent = parent || {}
    }

    Scope.prototype.$update = function () {
        this.bindings.forEach(function (bd) {
            bd.$update()
        })
        this.children.forEach(function (child) {
            child.$update()
        })
    }

    module.exports = Scope

/***/ }
/******/ ])
});
;