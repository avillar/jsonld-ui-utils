import {Namespace} from 'rdflib';

export const SKOS = Namespace('http://www.w3.org/2004/02/skos/core#');
export const RDFS = Namespace('http://www.w3.org/2000/01/rdf-schema#')
export const RDF = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
export const DCT = Namespace('http://purl.org/dc/terms/');
export const DC = Namespace('http://purl.org/dc/elements/1.1/');
export const SDO = Namespace('https://schema.org/');
export const FOAF = Namespace('http://xmlns.com/foaf/0.1/');

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