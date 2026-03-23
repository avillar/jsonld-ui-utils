import {loadContext} from "./jsonld";
import {acceptedResourceContentTypes, descriptionPredicates, labelPredicates} from "./constants";
import * as $rdf from 'rdflib';
import {NamedNode} from "rdflib/lib/tf-types";
import {IndexedFormula} from "rdflib";

export interface FetchResourceOptions {
  labelPredicates: (NamedNode | string)[],
  descriptionPredicates: (NamedNode | string)[],
  fallbackRainbowInstance?: string,   // deprecated: use fallbackRainbowInstances
  fallbackRainbowInstances?: string | string[],
  fallbackSparqlEndpoint?: string,    // deprecated: use fallbackSparqlEndpoints
  fallbackSparqlEndpoints?: string | string[],
  acceptedContentTypes: { [contentType: string]: boolean | string },
}

export const defaultFetchResourceOptions: FetchResourceOptions = {
  labelPredicates,
  descriptionPredicates,
  acceptedContentTypes: acceptedResourceContentTypes,
};

export interface CreatePropertiesTableOptions {
  propertiesField?: string | null,
}

export interface ResourceData {
  uri: string,
  label: string | null,
  description?: string | null,
}

const fetchResourceCache: { [url: string]: Promise<ResourceData> } = {};

const store = $rdf.graph();

const findMatchingPredicate = (store: IndexedFormula, resourceUrl: string | NamedNode, predicates: (string | NamedNode)[]) => {
  if (typeof resourceUrl === "string") {
    resourceUrl = $rdf.sym(resourceUrl);
  }
  for (const pred of predicates) {
    const matching = store.statementsMatching(resourceUrl,
      typeof pred === 'string' ? $rdf.sym(pred) : pred);
    if (matching?.length) {
      return matching[0].object.value;
    }
  }
}

const toArray = (val?: string | string[]): string[] =>
  !val ? [] : Array.isArray(val) ? val : [val];

const get_sparql_query = (uri: string) => {
  return `DESCRIBE <${uri}>`;
}

const tryFetchAndParse = async (fetchFn: () => Promise<Response>, uri: string, options: FetchResourceOptions): Promise<ResourceData | null> => {
  let response: Response;
  try {
    response = await fetchFn();
    if (!response.ok) return null;
  } catch {
    return null;
  }
  const responseContentType = response.headers.get('content-type')?.replace(/;.*/, '') || 'text/turtle';
  const acceptedContentType = options.acceptedContentTypes[responseContentType] === true
    ? responseContentType
    : options.acceptedContentTypes[responseContentType];
  if (!acceptedContentType) return null;
  try {
    $rdf.parse(await response.text(), store, uri, acceptedContentType as string);
  } catch {
    return null;
  }
  const label = findMatchingPredicate(store, uri, options.labelPredicates);
  if (!label) return null;
  return {
    uri,
    label,
    description: findMatchingPredicate(store, uri, options.descriptionPredicates) || null,
  };
};

const actualFetchResource = async (uri: string, options: FetchResourceOptions): Promise<ResourceData> => {
  const acceptHeader = Object.keys(acceptedResourceContentTypes).join(', ');

  // 1. Direct
  let result = await tryFetchAndParse(
    () => fetch(uri, { headers: { 'Accept': acceptHeader } }),
    uri, options,
  );

  // 2. Rainbow proxies (in order)
  for (const instance of [...toArray(options.fallbackRainbowInstances), ...toArray(options.fallbackRainbowInstance)]) {
    if (result) break;
    const rainbowURL = new URL(instance);
    rainbowURL.searchParams.set('uri', uri);
    result = await tryFetchAndParse(
      () => fetch(rainbowURL, { headers: { 'Accept': acceptHeader } }),
      uri, options,
    );
  }

  // 3. SPARQL endpoints (in order)
  for (const endpoint of [...toArray(options.fallbackSparqlEndpoints), ...toArray(options.fallbackSparqlEndpoint)]) {
    if (result) break;
    const formBody = new URLSearchParams({ query: get_sparql_query(uri) });
    result = await tryFetchAndParse(
      () => fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-type': 'application/x-www-form-urlencoded', 'Accept': 'text/turtle' },
        body: formBody.toString(),
      }),
      uri, options,
    );
  }

  if (!result) {
    throw new Error(`No label data found for <${uri}>`);
  }
  return result;
};

export async function fetchResource(uri: string, options: Partial<FetchResourceOptions> = {}) {
  const mergedOptions: FetchResourceOptions = {...defaultFetchResourceOptions, ...options};
  if (!(uri in fetchResourceCache)) {
    fetchResourceCache[uri] = actualFetchResource(uri, mergedOptions);
  }
  return fetchResourceCache[uri];
}

export async function loadFeature(url: string) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/ld+json, application/json;q=0.9, */*;q=0.1',
    },
  });
  if (!response.ok) {
    throw new Error(`Could not load feature ${url}: ${response.status} - ${response.statusText}`);
  }
  const feature = await response.json();
  const context = await loadContext(feature);
  return {
    feature,
    context,
  };
}