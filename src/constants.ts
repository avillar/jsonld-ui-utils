const ns = (base: string) => (local: string): string => `${base}${local}`;

export const SKOS = ns('http://www.w3.org/2004/02/skos/core#');
export const RDFS = ns('http://www.w3.org/2000/01/rdf-schema#');
export const RDF  = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
export const DCT  = ns('http://purl.org/dc/terms/');
export const DC   = ns('http://purl.org/dc/elements/1.1/');
export const SDO  = ns('https://schema.org/');
export const FOAF = ns('http://xmlns.com/foaf/0.1/');

export const labelPredicates: string[] = [
  SKOS('prefLabel'),
  DCT('title'),
  DC('title'),
  SDO('name'),
  FOAF('name'),
  RDFS('label'),
];

export const descriptionPredicates: string[] = [
  SKOS('definition'),
  DCT('description'),
  DC('description'),
  RDFS('comment'),
];