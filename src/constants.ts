import * as $rdf from 'rdflib';

export const SKOS = $rdf.Namespace('http://www.w3.org/2004/02/skos/core#');
export const RDFS = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#')
export const RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
export const DCT = $rdf.Namespace('http://purl.org/dc/terms/');
export const DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
export const SDO = $rdf.Namespace('https://schema.org/');
export const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');

export const labelPredicates = [
  SKOS('prefLabel'),
  DCT('title'),
  DC('title'),
  SDO('name'),
  FOAF('name'),
  RDFS('label'),
];

export const descriptionPredicates = [
  SKOS('definition'),
  DCT('description'),
  DC('description'),
  RDFS('comment'),
];

export const acceptedResourceContentTypes = {
  'text/turtle': true,
  'application/n-triples': true,
  'application/rdf+xml': true,
  'text/anot+turtle': 'text/turtle',
};