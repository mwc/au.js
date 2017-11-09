# au.js

计算数学表达式，一个小型解释器的示例，支持变量和操作符扩展。

## support

### 内建支持操作符
 - `+`: 加，优先级值10
 - `-`: 减，优先级值10
 - `*`: 乘，优先级值100
 - `/`: 除，优先级值100
 - `%`: 求模，优先级值100
 - `^`: 幂，优先级值100

## APIs

### constructor

``` javascript
au(input, variables);
```

- `input`: 表达式字符串
- `variables`: 变量

##### base

``` javascript
au('22*3');     // result: 66
```

##### use variables

``` javascript
au('15 + $a + 4', {
    a: 6
});     // result: 25
```

### au.operator(operator, priority, handler)

- `operator`: 待扩展的操作符
- `priority`: 优先级值
- `handler`: 计算函数

注意：所有操作符仅支持二元操作，例如扩展 & 符号：
``` javascript
au.operator('&', 100, function (o1, o2) {
    return o1 & o2;
});

au('12&4');     // result: 4
```

扩展已存在的操作符，将覆盖之。