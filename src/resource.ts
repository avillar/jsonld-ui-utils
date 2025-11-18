import {loadContext} from "./jsonld";
import {acceptedResourceContentTypes, descriptionPredicates, labelPredicates} from "./constants";
import * as $rdf from 'rdflib';
import {NamedNode} from "rdflib/lib/tf-types";
import {IndexedFormula} from "rdflib";

export interface FetchResourceOptions {
  labelPredicates: (NamedNode | string)[],
  descriptionPredicates: (NamedNode | string)[],
  fallbackRainbowInstance?: string,
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

function findMatchingPredicate(store: IndexedFormula, resourceUrl: string | NamedNode, predicates: (string | NamedNode)[]) {
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

export async function fetchResource(uri: string, options: Partial<FetchResourceOptions> = {}) {
  const mergedOptions: FetchResourceOptions = {...defaultFetchResourceOptions, ...options};
  if (!(uri in fetchResourceCache)) {
    const acceptHeader = Object.keys(acceptedResourceContentTypes).join(', ');
    let fetchError: string;
    const actualFetch = async () => {
      let response;
      try {
        response = await fetch(uri, {
          headers: {
            'Accept': acceptHeader,
          },
        });
      } catch (e) {
        fetchError = `Error retrieving resource ${uri}: ${e}`;
      }
      if (!response?.ok && mergedOptions.fallbackRainbowInstance) {
        try {
          const rainbowURL = new URL(mergedOptions.fallbackRainbowInstance);
          rainbowURL.searchParams.set('uri', uri);
          response = await fetch(rainbowURL, {
            headers: {
              'Accept': acceptHeader,
            },
          });
        } catch (e) {
          fetchError = `Error retrieving resource ${uri} from RAINBOW service at ${mergedOptions.fallbackRainbowInstance}: ${e}`;
        }
      }
      if (!response?.ok) {
        const errMsg = response ? `${response.status} - ${response.statusText}` : fetchError || 'unknown error';
        throw new Error(`Error fetching resource data for ${uri}: ${errMsg}`);
      }
      const responseContentType = response.headers.get('content-type') || 'text/turtle';
      const acceptedContentType = mergedOptions.acceptedContentTypes[responseContentType] === true
        ? responseContentType
        : mergedOptions.acceptedContentTypes[responseContentType];
      if (!acceptedContentType) {
        throw new Error(`Unknown resource type for ${uri}: ${responseContentType}`);
      }

      $rdf.parse(await response.text(), store, uri, acceptedContentType);

      if (!store.statementsMatching($rdf.sym(uri))?.length) {
        throw new Error(`No data on resource ${uri} could be retrieved`);
      }

      return {
        uri,
        label: findMatchingPredicate(store, uri, labelPredicates) || null,
        description: findMatchingPredicate(store, uri, descriptionPredicates) || null,
      };
    };
    fetchResourceCache[uri] = actualFetch();
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