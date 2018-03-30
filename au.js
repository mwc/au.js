
/**
 * au.js - Calculate the mathematical expression.
 * https://github.com/mwc/au.js
 *
 * MaoWenchao (mwc@foxmail.com)
 * Licensed under the MIT License.
 *
 * Version 0.0.4 beta - 5/2017
 */

(function (global) {
    function interpreter() {

        'use strict';

        var _slice = Array.prototype.slice;

        var operations = {
            '+': {
                // Operator priority level
                priority: 10,        // The greater the value, the higher the priority
                comput: function (o1, o2) { return o1 + o2; }
            },
            '-': {
                priority: 10,
                comput: function (o1, o2) { return o1 - o2; }
            },
            '*': {
                priority: 100,
                comput: function (o1, o2) { return o1 * o2; }
            },
            '/': {
                priority: 100,
                comput: function (o1, o2) {
                    if (o2 !== 0) {
                        return o1 / o2;
                    }

                    error('Zero as the denominator is not allowed.');
                }
            },
            '%': {
                priority: 100,
                comput: function (o1, o2) {
                    return o1 % o2;
                }
            },
            '^': {
                priority: 100,
                comput: function (o1, o2) {
                    return Math.pow(o1, o2);
                }
            }
        };

        var parsers = [];

        var api = {
            operator: function (operator, priority, handler) {
                operations[operator] = {
                    priority: priority,
                    comput: handler
                };

                operatorKeys = Object.keys(operations);
            },
            parser: function (predict, token, pos) {
                if (typeof predict === 'function' && typeof token === 'function') {
                    parsers.splice(typeof pos !== 'number' ? parsers.length : pos, 0, {
                        predict: predict,
                        token: token
                    });
                }
            }
        };

        var operatorKeys = Object.keys(operations);

        function each(obj, callback) {
            var i;
            var len;

            for (i = 0, len = obj.length; i < len; i++) {
                callback(obj[i], i);
            }

            return obj;
        }

        function marge(src) {
            if (arguments.length > 1) {
                each(_slice.call(arguments, 1), function (e) {
                    var prop;

                    for (prop in e) {
                        src[prop] = e[prop];
                    }
                });
            }

            return src;
        }

        function error(msg, pos) {
            throw new Error((pos == null || pos === -1 ? '' : '[pos->' + pos + '] ') + msg);
        }

        function isNumber(char) {
            return char != null && /\d|\.|e/.test(char);
        }

        // Matches the position of the parentheses on the right parenthes
        function matchClosePoint(input, pos, openSymbol, closeSymbol) {
            var open = -1;
            var close = -1;

            while (pos.stack > 0) {
                pos.index += 1;
                open = input.indexOf(openSymbol, pos.index);
                close = input.indexOf(closeSymbol, pos.index);

                if (open !== -1 && open < close) {
                    pos.stack += 1;
                    pos.index = open + 1;
                }

                if (close !== -1) {
                    pos.stack -= 1;
                    pos.index = close;
                }
                else {
                    error('Not found \'' + closeSymbol + '\'', pos.index);
                }
            }

            return close;
        }

        // match a number
        function numberToken(input, pos) {
            var n;

            pos.buffer += input[pos.index];
            pos.index += 1;

            if (!isNumber(input[pos.index])) {
                n = parseFloat(pos.buffer);
                if (Number.isNaN(n)) {
                    error('Invalid number: ' + pos.buffer, pos.index);
                }

                pos.buffer = '';

                return {
                    type: 'operation',
                    content: n
                };
            }
            else {
                return next(input, pos);
            }
        }

        // match an operator
        function operatorToken(input, pos) {
            var operator = input[pos.index];

            pos.index += 1;

            return {
                type: 'operator',
                content: operator
            };
        }

        function cleanUp(tkns) {
            if (tkns[0].type === 'operator') {
                var o = tkns[0].content;

                if (tkns.length > 1 && (o === '-' || o === '+')) {
                    if (o === '-') {
                        tkns[1].content = (-1 * tkns[1].content);
                    }

                    tkns.shift();
                }
                else {
                    error('[computing] Illegal expression.');
                }
            }

            if (tkns.length === 1) {
                return tkns[0];
            }
            else {
                return {
                    type: 'group',
                    content: tkns
                };
            }
        }

        // The content enclosed in each parenthesis is a group
        function groupToken(input, pos, openSymbol, closeSymbol) {
            var start = pos.index + 1;
            var end;

            pos.stack = 1;
            end = matchClosePoint(input, pos, openSymbol, closeSymbol);
            pos.index = end + 1;

            return tokens(input.substring(start, end));
        }

        // Get next token
        function next(input, pos) {
            var char = input[pos.index];

            if (typeof char === 'undefined') {
                return;
            }
            else if (/\s/.test(char)) {
                pos.index += 1;
                return next(input, pos);
            }
            else if (isNumber(char)) {
                return numberToken(input, pos);
            }
            else if (operatorKeys.indexOf(char) !== -1) {
                return operatorToken(input, pos);
            }
            else if (char === '(') {
                return groupToken(input, pos, '(', ')');
            }

            error('Illegal expression.', pos.index);
        }

        // Generating token
        function tokens(input) {
            var pos = { index: 0, buffer: '' };
            var tkns = [];
            var tkn;

            while (tkn = next(input, pos)) {
                tkns.push(tkn);
            }

            return cleanUp(tkns);
        }

        function operation(tkns) {
            var op = tkns.shift();

            if (op) {
                if (op.type === 'group' || op.type === 'operation') {
                    return op.type === 'group' ? comput(op.content) : op.content;
                }

                error('Except operation.');
            }
        }

        function operator(tkns) {
            var op = tkns.shift();

            if (op) {
                if (op.type === 'operator') {
                    return op.content;
                }

                error('Except operator.');
            }
        }

        function figure(left, op, right) {
            var current;
            var next;
            var nextOp;

            if (op) {
                if (right == null) {
                    error('Except right operation.');
                }

                current = operations[op];

                if (current) {
                    nextOp = operator(this);

                    if (nextOp == null) {
                        return current.comput(left, right);
                    }

                    next = operations[nextOp];

                    if (next.priority > current.priority) {
                        return current.comput(left, figure.call(this, right, nextOp, operation(this)));
                    }
                    else {
                        return figure.call(this, current.comput(left, right), nextOp, operation(this));
                    }
                }
                else {
                    error('The \'' + op + '\' operator was not found');
                }
            }

            return left;
        }

        function comput(tkns) {
            if (Array.isArray(tkns)) {
                return figure.call(tkns, operation(tkns), operator(tkns), operation(tkns));
            }
            else {
                return figure.call([tkns], operation([tkns]));
            }
        }

        function parse(input, variables) {
            if (input && typeof input === 'string' && input.length > 0) {
                return comput(
                    tokens(
                        input.replace(/\$([\w\d]+)/g, function (m, name) {
                            var val = variables[name];

                            if (val == null) {
                                error('Not found variable \'' + name + '\'');
                            }

                            return val;
                        })
                    )
                );
            }

            return 0;
        }

        return marge(parse, api);
    }

    global.au = interpreter();
})(this);
