export * from './resource';
export * from './jsonld';
export * from './augment';

import * as resource from './resource';
import * as jsonld from './jsonld';
import * as augment from './augment';

export default {
  ...resource,
  ...jsonld,
  ...augment,
}