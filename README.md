# alloy-ts

A TypeScript (and JavaScript) library for working with 
[Alloy](http://alloytools.org/) instances in the browser.

## Installing

To install using npm:

```shell script
npm install alloy-ts
```

To use directly in the browser, download the `alloy-*.*.*.js` bundle and include
in your HTML directly:

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
as `Alloy`:

```html
<script>
  const instance = new Alloy.AlloyInstance(...);
</script>
```
