# alloy-ts

A TypeScript (and JavaScript) library for working with 
[Alloy](http://alloytools.org/) instances in the browser.

## API

The complete API documentation can be found [here](https://alloy-js.github.io
/alloy-ts/index.html).

## Installing

To install using npm:

```shell script
npm install alloy-ts
```

To use directly in the browser, download `alloy-*.*.*.js` from the `bundle/`
directory and include in your HTML directly:

```html
<script src='alloy-*.*.*.js'></script>
```

## Using

To use in an ES2015 environment:

```javascript
import * as Alloy from 'alloy-ts';

// OR

import { AlloyInstance, ...} from 'alloy-ts';
```

If you're including the bundle in a web page, the library is exposed globally
as `alloy`:

```html
<script>
  const instance = new alloy.AlloyInstance(...);
</script>
```
