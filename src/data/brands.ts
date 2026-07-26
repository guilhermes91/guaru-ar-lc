import content from "./content.json";

export type Brand = {
  name: string;
  image: string;
};

export type ServiceAreaGroup = {
  region: string;
  cities: string[];
};

export type NeighborhoodGroup = {
  region: string;
  neighborhoods: string[];
};

export const heatingBrands: Brand[] = content.brands.heating;

export const airConditioningBrands: Brand[] = content.brands.airConditioning;

export const serviceAreaGroups: ServiceAreaGroup[] = content.serviceAreaGroups;

export const serviceAreaCities = serviceAreaGroups.flatMap((group) => group.cities);

export const guarujaNeighborhoodGroups: NeighborhoodGroup[] = content.neighborhoodGroups;

export const guarujaNeighborhoods = guarujaNeighborhoodGroups.flatMap((group) => group.neighborhoods);
